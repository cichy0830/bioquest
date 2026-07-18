#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";

const { chromium } = playwright;
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const units = [
  { unitId: "human_nutrition", folder: "prototype-human-nutrition", key: "bioquest_human_nutrition_state_v1", screen: "reflection" },
  { unitId: "plant_material_transport", folder: "prototype-plant-material-transport", key: "bioquest_plant_material_transport_state_v1", screen: "checkpoint1" },
  { unitId: "cardiovascular_components", folder: "prototype-cardiovascular-components", key: "bioquest_cardiovascular_components_state_v1", screen: "brief" },
  { unitId: "human_circulation", folder: "prototype-human-circulation", key: "bioquest_human_circulation_state_v1", screen: "brief" },
  { unitId: "stimulus_response", folder: "prototype-stimulus-response", key: "bioquest_stimulus_response_state_v1", screen: "brief" }
];

function contentType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png"
  }[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
    if (requestPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(root, cleanPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function stateFor(unit) {
  return {
    screen: unit.screen,
    student: {
      student_id: "S79998",
      student_name: "視覺稽核",
      class_name: "七年級",
      seat_no: "98",
      profile_gender: "male",
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
      is_guest: false
    },
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements"],
    answers: {},
    hints: {},
    optionOrders: {},
    reflection: { question: "" },
    unit_id: unit.unitId,
    question_version: "ag_visual_audit"
  };
}

async function auditUnit(browser, baseUrl, unit, viewport) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: unit.key, state: stateFor(unit) });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/${unit.folder}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen");

  const metrics = await page.locator("#screen").evaluate((screen) => ({
    screen: screen.dataset.bioquestScreen || "",
    briefImages: screen.querySelectorAll(".bq-brief-scene-stage .bq-brief-scene-image").length,
    briefAvatars: screen.querySelectorAll(".bq-brief-scene-stage .bq-brief-student-avatar").length,
    briefOwls: screen.querySelectorAll(".bq-brief-scene-stage .owl-frame, .bq-brief-scene-stage .owl-panel").length,
    reportOwls: screen.querySelectorAll(".bq-report-assistant").length,
    q01Text: screen.querySelector(".evidence-card")?.textContent || "",
    q01Alt: screen.querySelector(".evidence-card img")?.getAttribute("alt") || "",
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));

  if (unit.screen === "brief") {
    assert.deepEqual([metrics.briefImages, metrics.briefAvatars, metrics.briefOwls], [1, 1, 0], `${unit.unitId} brief role counts`);
  }
  if (unit.screen === "reflection") {
    assert.equal(metrics.reportOwls, 1, `${unit.unitId} report owl exactly one`);
  }
  if (unit.unitId === "plant_material_transport") {
    assert.match(metrics.q01Text, /整株植物情境卡/);
    assert(!metrics.q01Text.includes("體內運輸"));
    assert(!metrics.q01Alt.includes("物質運輸"));
  }
  assert.equal(metrics.overflow, 0, `${unit.unitId} no horizontal overflow`);
  assert.deepEqual(imageErrors, [], `${unit.unitId} image 404`);
  assert.deepEqual(consoleErrors, [], `${unit.unitId} console errors`);
  assert.deepEqual(pageErrors, [], `${unit.unitId} page errors`);
  await context.close();
  return { unitId: unit.unitId, viewport: `${viewport.width}x${viewport.height}`, screen: metrics.screen };
}

const { server, port } = await startServer();
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const results = [];
try {
  const baseUrl = `http://127.0.0.1:${port}`;
  for (const unit of units) {
    results.push(await auditUnit(browser, baseUrl, unit, { width: 1440, height: 900 }));
    results.push(await auditUnit(browser, baseUrl, unit, { width: 390, height: 844 }));
  }
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify({ ok: true, root, results }, null, 2));
