import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import playwright from "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";

const { chromium } = playwright;

const root = process.env.BIOQUEST_AUDIT_ROOT ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT) : process.cwd();
const version = "20260715-title-avatar-card-v1";
const versionOverrides = new Map([
  ["scale", "20260716-scale-prep-fallback-v3"],
  ["nutrients_energy", "20260717-nutrients-energy-u11-fixes-v3"],
  ["nutrient_test", "20260720-nutrient-test-starch-glucose-only-v2"]
]);
const units = [
  { unitId: "cell_transport", folder: "prototype-cell-transport", storageKey: "bioquest_cell_transport_state_v1" },
  { unitId: "biological_organization", folder: "prototype-biological-organization", storageKey: "bioquest_biological_organization_state_v1" },
  { unitId: "scale", folder: "prototype-scale", storageKey: "bioquest_scale_state_v1" },
  { unitId: "nutrients_energy", folder: "prototype-nutrients-energy", storageKey: "bioquest_nutrients_energy_state_v1" },
  { unitId: "nutrient_test", folder: "prototype-nutrient-test", storageKey: "bioquest_nutrient_test_state_v1" },
  { unitId: "enzymes", folder: "prototype-enzymes", storageKey: "bioquest_enzymes_state_v1" }
];
const viewports = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 }
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png",
    ".svg": "image/svg+xml"
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

function stateFor(screen, titleAvatarPath) {
  return {
    screen,
    student: {
      student_id: "S79998",
      student_name: "路徑測試",
      class_name: "七年級",
      seat_no: "98",
      profile_gender: "male",
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: titleAvatarPath,
      is_guest: false
    },
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    cumulative_total_exp: 500,
    completed_unit_count: 1,
    cumulative_badges: [],
    answers: {},
    hints: {},
    optionOrders: {},
    result: null,
    submitted_at: null,
    backend_status: "submitted"
  };
}

async function openWithState(browser, baseUrl, unit, viewport, screen, titleAvatarPath) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(({ key, state }) => {
    try {
      if (location.protocol !== "http:") return;
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem("bioquest_attempts_v1", "[]");
      localStorage.removeItem("bioquest_pending_backend_queue_v1");
    } catch {}
  }, { key: unit.storageKey, state: stateFor(screen, titleAvatarPath) });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/${unit.folder}/index.html?v=${versionOverrides.get(unit.unitId) || version}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#screen");
  return { page, context, imageErrors, consoleErrors, pageErrors };
}

async function assertBriefAvatar(browser, baseUrl, unit, viewport, variant) {
  const opened = await openWithState(browser, baseUrl, unit, viewport, "brief", variant.path);
  const { page, context, imageErrors, consoleErrors, pageErrors } = opened;
  const metrics = await page.locator(".bq-brief-student-avatar, .student-avatar-slot img, .title-avatar-brief img").first().evaluate((img) => ({
    src: img.getAttribute("src") || "",
    naturalWidth: img.naturalWidth,
    width: img.getBoundingClientRect().width,
    height: img.getBoundingClientRect().height
  }));
  assert.ok(metrics.naturalWidth > 0, `${unit.unitId} ${variant.name} avatar should load`);
  if (variant.name === "backend-style") assert.match(metrics.src, /^\.\.\/shared-assets\/title-avatars\//, `${unit.unitId} backend path should normalize upward`);
  if (variant.name === "relative") assert.match(metrics.src, /^\.\.\/shared-assets\/title-avatars\//, `${unit.unitId} relative path should remain upward`);
  if (variant.name === "absolute") assert.match(metrics.src, /^http:\/\/127\.0\.0\.1:/, `${unit.unitId} absolute path should remain absolute`);
  if (variant.name === "empty") assert.match(metrics.src, /^\.\.\/shared-assets\/title-avatars\/title-01-trainee_investigator-male\.webp$/, `${unit.unitId} empty path should use fallback`);
  assert.deepEqual(imageErrors, [], `${unit.unitId} ${variant.name} ${viewport.width} image 404`);
  assert.deepEqual(consoleErrors, [], `${unit.unitId} ${variant.name} ${viewport.width} console errors`);
  assert.deepEqual(pageErrors, [], `${unit.unitId} ${variant.name} ${viewport.width} page errors`);
  await context.close();
}

async function assertAchievementsClean(browser, baseUrl, unit, viewport) {
  const opened = await openWithState(browser, baseUrl, unit, viewport, "achievements", "shared-assets/title-avatars/title-02-life_observer-male.webp");
  const { page, context, imageErrors, consoleErrors, pageErrors } = opened;
  const metrics = await page.locator("#screen").evaluate((root) => {
    const panels = [...root.querySelectorAll(".panel")];
    const unitIndex = panels.findIndex((panel) => panel.querySelector(".badge-grid, .badge-wall") && !panel.matches("[data-bq-badge-overview]"));
    const overviewIndex = panels.findIndex((panel) => panel.matches("[data-bq-badge-overview]"));
    const titleImages = [...root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img")];
    const titleImage = titleImages[0];
    const imageRect = titleImage?.getBoundingClientRect();
    return {
      unitIndex,
      overviewIndex,
      overviewCount: root.querySelectorAll("[data-bq-badge-overview]").length,
      titleImageCount: titleImages.length,
      titleImage: titleImage ? {
        src: titleImage.getAttribute("src") || "",
        currentSrc: titleImage.currentSrc || "",
        naturalWidth: titleImage.naturalWidth,
        width: imageRect.width,
        height: imageRect.height
      } : null,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1
    };
  });
  assert.ok(metrics.unitIndex >= 0, `${unit.unitId} should have a unit badge panel`);
  assert.ok(metrics.overviewIndex > metrics.unitIndex, `${unit.unitId} overview should follow unit badge panel`);
  assert.equal(metrics.overviewCount, 1, `${unit.unitId} should have one overview panel`);
  assert.equal(metrics.titleImageCount, 1, `${unit.unitId} achievements should show one title avatar image`);
  assert.ok(metrics.titleImage?.naturalWidth > 0, `${unit.unitId} achievements title avatar should load`);
  assert.match(metrics.titleImage?.currentSrc || metrics.titleImage?.src || "", /\/shared-assets\/title-avatars\/title-02-life_observer-male\.webp/, `${unit.unitId} achievements title avatar should normalize backend path`);
  assert.equal(metrics.horizontalOverflow, false, `${unit.unitId} achievements should not overflow horizontally`);
  assert.deepEqual(imageErrors, [], `${unit.unitId} achievements ${viewport.width} image 404`);
  assert.deepEqual(consoleErrors, [], `${unit.unitId} achievements ${viewport.width} console errors`);
  assert.deepEqual(pageErrors, [], `${unit.unitId} achievements ${viewport.width} page errors`);
  await context.close();
}

const { server, port } = await startServer();
const baseUrl = `http://127.0.0.1:${port}`;
const variants = [
  { name: "backend-style", path: "shared-assets/title-avatars/title-02-life_observer-male.webp" },
  { name: "relative", path: "../shared-assets/title-avatars/title-02-life_observer-male.webp" },
  { name: "absolute", path: `${baseUrl}/shared-assets/title-avatars/title-02-life_observer-male.webp` },
  { name: "empty", path: "" }
];

const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  for (const unit of units) {
    for (const viewport of viewports) {
      for (const variant of variants) await assertBriefAvatar(browser, baseUrl, unit, viewport, variant);
      await assertAchievementsClean(browser, baseUrl, unit, viewport);
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify({
  ok: true,
  root,
  auditedUnits: units.map((unit) => unit.unitId),
  viewports,
  variants: variants.map((variant) => variant.name)
}, null, 2));
