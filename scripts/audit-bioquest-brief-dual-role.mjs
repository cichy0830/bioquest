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
const artifactDir = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "scripts",
  "artifacts",
  "20260715-brief-dual-role"
);

const allUnits = [
  {
    unitId: "life_world",
    folder: "prototype-life-world",
    storageKey: "bioquest_life_world_state_v1",
    azhe: { left: 0.07, right: 0.37, top: 0.12, bottom: 0.99 }
  },
  {
    unitId: "scientific_method",
    folder: "prototype-scientific-method",
    storageKey: "bioquest_scientific_method_state_v1",
    azhe: { left: 0.18, right: 0.43, top: 0.07, bottom: 0.76 }
  },
  {
    unitId: "lab_intro",
    folder: "prototype-lab-entry",
    storageKey: "bioquest_lab_intro_state_v1",
    azhe: { left: 0.13, right: 0.39, top: 0.13, bottom: 0.83 }
  },
  {
    unitId: "microscope_use",
    folder: "prototype-microscope-use",
    storageKey: "bioquest_microscope_use_state_v1",
    azhe: { left: 0.11, right: 0.38, top: 0.09, bottom: 0.99 }
  },
  {
    unitId: "cell_basic_unit",
    folder: "prototype-cell-basic-unit",
    storageKey: "bioquest_cell_basic_unit_state_v1",
    azhe: { left: 0.16, right: 0.38, top: 0.1, bottom: 0.99 }
  },
  {
    unitId: "cell_structure",
    folder: "prototype-cell-structure",
    storageKey: "bioquest_cell_structure_state_v1",
    azhe: { left: 0.29, right: 0.53, top: 0.11, bottom: 0.93 }
  },
  {
    unitId: "cell_observation",
    folder: "prototype-cell-observation",
    storageKey: "bioquest_cell_observation_state_v1",
    azhe: { left: 0.62, right: 0.86, top: 0.08, bottom: 0.98 }
  },
  {
    unitId: "cell_transport",
    folder: "prototype-cell-transport",
    storageKey: "bioquest_cell_transport_state_v1",
    azhe: { left: 0.63, right: 0.86, top: 0.11, bottom: 0.975 }
  },
  {
    unitId: "biological_organization",
    folder: "prototype-biological-organization",
    storageKey: "bioquest_biological_organization_state_v1",
    azhe: { left: 0.71, right: 0.91, top: 0.16, bottom: 0.98 }
  },
  {
    unitId: "scale",
    folder: "prototype-scale",
    storageKey: "bioquest_scale_state_v1",
    azhe: { left: 0.16, right: 0.44, top: 0.07, bottom: 0.99 }
  },
  {
    unitId: "nutrients_energy",
    folder: "prototype-nutrients-energy",
    storageKey: "bioquest_nutrients_energy_state_v1",
    azhe: { left: 0.12, right: 0.39, top: 0.11, bottom: 0.99 }
  },
  {
    unitId: "nutrient_test",
    folder: "prototype-nutrient-test",
    storageKey: "bioquest_nutrient_test_state_v1",
    azhe: { left: 0.11, right: 0.36, top: 0.08, bottom: 0.99 }
  },
  {
    unitId: "enzymes",
    folder: "prototype-enzymes",
    storageKey: "bioquest_enzymes_state_v1",
    azhe: { left: 0.13, right: 0.42, top: 0.11, bottom: 0.99 }
  },
  {
    unitId: "photosynthesis",
    folder: "prototype-photosynthesis",
    storageKey: "bioquest_photosynthesis_state_v1",
    azhe: { left: 0.13, right: 0.38, top: 0.11, bottom: 0.98 }
  },
  {
    unitId: "human_nutrition",
    folder: "prototype-human-nutrition",
    storageKey: "bioquest_human_nutrition_state_v1",
    azhe: { left: 0.1, right: 0.34, top: 0.1, bottom: 0.98 }
  },
  {
    unitId: "plant_transport_structures",
    folder: "prototype-plant-transport-structures",
    storageKey: "bioquest_plant_transport_structures_state_v1",
    azhe: { left: 0.11, right: 0.35, top: 0.1, bottom: 0.98 }
  },
  {
    unitId: "plant_material_transport",
    folder: "prototype-plant-material-transport",
    storageKey: "bioquest_plant_material_transport_state_v1",
    azhe: { left: 0.11, right: 0.36, top: 0.1, bottom: 0.98 }
  }
];

const requestedUnits = new Set(
  String(process.env.BIOQUEST_BRIEF_UNITS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);
const units = requestedUnits.size
  ? allUnits.filter((unit) => requestedUnits.has(unit.unitId))
  : allUnits;

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png"
  }[ext] || "application/octet-stream";
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
    screen: "brief",
    student: {
      student_id: "S79998",
      student_name: "路徑測試",
      class_name: "七年級",
      seat_no: "98",
      profile_gender: "male",
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
      is_guest: false
    },
    completedScreens: ["login", "brief", "rules", "achievements"],
    answers: {},
    hints: {},
    optionOrders: {},
    result: null,
    submitted_at: null,
    backend_status: "",
    attempt_type: "first",
    unit_id: unit.unitId,
    question_version: "brief_scene_audit"
  };
}

async function auditUnit(browser, baseUrl, unit, viewport) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(({ key, state }) => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem("bioquest_attempts_v1", "[]");
    } catch {}
  }, { key: unit.storageKey, state: stateFor(unit) });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/${unit.folder}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".bq-brief-scene-stage");
  if (unit.missingSceneAllowed) {
    await page.waitForSelector(".bq-brief-scene-stage .bq-brief-scene-missing");
  } else {
    await page.waitForSelector(".bq-brief-scene-stage .bq-brief-scene-image");
  }
  await page.waitForSelector(".bq-brief-scene-stage .bq-brief-student-avatar");

  if (unit.missingSceneAllowed) {
    const metrics = await page.locator(".bq-brief-scene-stage").evaluate((scene) => {
      const sceneBox = scene.getBoundingClientRect();
      const avatar = scene.querySelector(".bq-brief-student-avatar");
      const avatarBox = avatar?.getBoundingClientRect();
      const caption = scene.parentElement.querySelector(".bq-brief-scene-caption, .brief-copy-panel");
      const captionBox = caption?.getBoundingClientRect();
      return {
        sceneRatio: sceneBox.width / sceneBox.height,
        missingCount: scene.querySelectorAll(".bq-brief-scene-missing").length,
        sceneImageCount: scene.querySelectorAll(".bq-brief-scene-image").length,
        avatarNaturalWidth: avatar?.naturalWidth || 0,
        avatarSrc: avatar?.getAttribute("src") || "",
        avatarInsideScene: Boolean(avatarBox && avatarBox.top >= sceneBox.top - 1 && avatarBox.bottom <= sceneBox.bottom + 1),
        captionAfterScene: captionBox ? captionBox.top >= sceneBox.bottom - 1 : true,
        legacySlotCount: scene.parentElement.querySelectorAll(".student-avatar-slot:not(.bq-brief-legacy-avatar), .brief-title-avatar-card:not(.bq-brief-legacy-avatar), .title-avatar-brief:not(.bq-brief-legacy-avatar)").length,
        owlCount: scene.parentElement.querySelectorAll(".owl-frame, .owl-panel, .bq-report-assistant").length,
        mentorCardCount: scene.parentElement.querySelectorAll(".mentor-card, .mentorCard").length,
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
      };
    });
    assert.ok(Math.abs(metrics.sceneRatio - 16 / 9) < 0.06, `${unit.unitId} missing-scene stage should stay 16:9: ${JSON.stringify(metrics)}`);
    assert.equal(metrics.missingCount, 1, `${unit.unitId} must show one controlled missing-scene state`);
    assert.equal(metrics.sceneImageCount, 0, `${unit.unitId} must not request a nonexistent briefing image`);
    assert.ok(metrics.avatarNaturalWidth > 0, `${unit.unitId} avatar must load`);
    assert.match(metrics.avatarSrc, /^\.\.\/shared-assets\/title-avatars\//, `${unit.unitId} avatar path should normalize`);
    assert.equal(metrics.avatarInsideScene, true, `${unit.unitId} avatar should stay inside stage`);
    assert.equal(metrics.captionAfterScene, true, `${unit.unitId} text/caption should be under scene`);
    assert.equal(metrics.legacySlotCount, 0, `${unit.unitId} should not keep visible old avatar slot/card`);
    assert.equal(metrics.owlCount, 0, `${unit.unitId} brief should not include owl`);
    assert.equal(metrics.mentorCardCount, 0, `${unit.unitId} brief should not include extra mentor card`);
    assert.equal(metrics.horizontalOverflow, 0, `${unit.unitId} should not overflow horizontally`);
    assert.deepEqual(imageErrors, [], `${unit.unitId} no image 404 expected`);
    assert.deepEqual(consoleErrors, [], `${unit.unitId} no console errors expected`);
    assert.deepEqual(pageErrors, [], `${unit.unitId} no page errors expected`);
    fs.mkdirSync(artifactDir, { recursive: true });
    const basename = `${unit.unitId}-${viewport.width}x${viewport.height}`;
    fs.writeFileSync(path.join(artifactDir, `${basename}-metrics.json`), JSON.stringify(metrics, null, 2));
    await page.screenshot({ path: path.join(artifactDir, `${basename}.png`) });
    await context.close();
    return {
      unitId: unit.unitId,
      viewport: `${viewport.width}x${viewport.height}`,
      missingScene: unit.missingSceneHook,
      ratio: null
    };
  }

  const metrics = await page.locator(".bq-brief-scene-stage").evaluate((scene, azhe) => {
    function alphaBBox(image) {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width;
      let right = -1;
      let top = canvas.height;
      let bottom = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = pixels[(y * canvas.width + x) * 4 + 3];
          if (alpha <= 16) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
      return right < left || bottom < top
        ? { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }
        : { left, top, width: right - left + 1, height: bottom - top + 1, right, bottom };
    }
    const sceneBox = scene.getBoundingClientRect();
    const image = scene.querySelector(".bq-brief-scene-image");
    const avatar = scene.querySelector(".bq-brief-student-avatar");
    const imageBox = image.getBoundingClientRect();
    const avatarBox = avatar.getBoundingClientRect();
    const caption = scene.parentElement.querySelector(".bq-brief-scene-caption, .brief-copy-panel");
    const captionBox = caption?.getBoundingClientRect();
    const avatarAlpha = alphaBBox(avatar);
    const avatarVisibleBox = {
      left: avatarBox.left + (avatarAlpha.left / avatar.naturalWidth) * avatarBox.width,
      right: avatarBox.left + (avatarAlpha.right / avatar.naturalWidth) * avatarBox.width,
      top: avatarBox.top + (avatarAlpha.top / avatar.naturalHeight) * avatarBox.height,
      bottom: avatarBox.top + (avatarAlpha.bottom / avatar.naturalHeight) * avatarBox.height
    };
    avatarVisibleBox.width = avatarVisibleBox.right - avatarVisibleBox.left;
    avatarVisibleBox.height = avatarVisibleBox.bottom - avatarVisibleBox.top;
    const azheVisibleBox = {
      left: imageBox.left + imageBox.width * azhe.left,
      right: imageBox.left + imageBox.width * azhe.right,
      top: imageBox.top + imageBox.height * azhe.top,
      bottom: imageBox.top + imageBox.height * azhe.bottom
    };
    azheVisibleBox.width = azheVisibleBox.right - azheVisibleBox.left;
    azheVisibleBox.height = azheVisibleBox.bottom - azheVisibleBox.top;
    const overlapWidth = Math.max(0, Math.min(avatarVisibleBox.right, azheVisibleBox.right) - Math.max(avatarVisibleBox.left, azheVisibleBox.left));
    const overlapHeight = Math.max(0, Math.min(avatarVisibleBox.bottom, azheVisibleBox.bottom) - Math.max(avatarVisibleBox.top, azheVisibleBox.top));
    return {
      sceneRatio: sceneBox.width / sceneBox.height,
      imageNaturalWidth: image.naturalWidth,
      imageNaturalHeight: image.naturalHeight,
      imageObjectFit: getComputedStyle(image).objectFit,
      avatarNaturalWidth: avatar.naturalWidth,
      avatarSrc: avatar.getAttribute("src") || "",
      avatarAlphaHeightRatio: avatarAlpha.height / avatar.naturalHeight,
      avatarVisibleHeightRatio: avatarVisibleBox.height / azheVisibleBox.height,
      avatarVisibleBox,
      azheVisibleBox,
      overlapWithAzheArea: overlapWidth * overlapHeight,
      captionAfterScene: captionBox ? captionBox.top >= sceneBox.bottom - 1 : true,
      legacySlotCount: scene.parentElement.querySelectorAll(".student-avatar-slot:not(.bq-brief-legacy-avatar), .brief-title-avatar-card:not(.bq-brief-legacy-avatar), .title-avatar-brief:not(.bq-brief-legacy-avatar)").length,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  }, unit.azhe);

  assert.ok(metrics.imageNaturalWidth > 0 && metrics.imageNaturalHeight > 0, `${unit.unitId} scene image must load`);
  assert.equal(metrics.imageObjectFit, "contain", `${unit.unitId} scene image must use contain`);
  assert.ok(Math.abs(metrics.sceneRatio - 16 / 9) < 0.06, `${unit.unitId} stage should stay 16:9: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarNaturalWidth > 0, `${unit.unitId} avatar must load`);
  assert.match(metrics.avatarSrc, /^\.\.\/shared-assets\/title-avatars\//, `${unit.unitId} avatar path should normalize`);
  assert.ok(metrics.avatarAlphaHeightRatio > 0.6, `${unit.unitId} avatar alpha bbox should contain visible body pixels: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarVisibleHeightRatio >= 0.85 && metrics.avatarVisibleHeightRatio <= 1.0, `${unit.unitId} avatar should be 85-100% of Azhe visible height: ${JSON.stringify(metrics)}`);
  assert.equal(metrics.overlapWithAzheArea, 0, `${unit.unitId} avatar should not cover Azhe: ${JSON.stringify(metrics)}`);
  assert.equal(metrics.captionAfterScene, true, `${unit.unitId} text/caption should be under scene`);
  assert.equal(metrics.legacySlotCount, 0, `${unit.unitId} should not keep visible old avatar slot/card`);
  assert.equal(metrics.horizontalOverflow, 0, `${unit.unitId} should not overflow horizontally`);
  assert.deepEqual(imageErrors, [], `${unit.unitId} no image 404 expected`);
  assert.deepEqual(consoleErrors, [], `${unit.unitId} no console errors expected`);
  assert.deepEqual(pageErrors, [], `${unit.unitId} no page errors expected`);
  fs.mkdirSync(artifactDir, { recursive: true });
  const basename = `${unit.unitId}-${viewport.width}x${viewport.height}`;
  fs.writeFileSync(path.join(artifactDir, `${basename}-metrics.json`), JSON.stringify(metrics, null, 2));
  await page.screenshot({ path: path.join(artifactDir, `${basename}.png`) });
  await context.close();
  return {
    unitId: unit.unitId,
    viewport: `${viewport.width}x${viewport.height}`,
    ratio: Number(metrics.avatarVisibleHeightRatio.toFixed(3))
  };
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

console.log(JSON.stringify({ ok: true, units: units.map((unit) => unit.unitId), results, artifactDir }, null, 2));
