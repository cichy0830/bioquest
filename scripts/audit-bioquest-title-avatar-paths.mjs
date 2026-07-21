import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import playwright from "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";

const { chromium } = playwright;
const root = process.env.BIOQUEST_AUDIT_ROOT ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT) : process.cwd();
const cacheVersion = "20260721-title-avatar-webp-v1";
const portal = fs.readFileSync(path.join(root, "portal.js"), "utf8");
const portalStart = portal.indexOf("const units = [");
const portalEnd = portal.indexOf("\n\nconst statusText", portalStart);
assert.notEqual(portalStart, -1, "portal units block missing");
assert.ok(portalEnd > portalStart, "portal units block end missing");

const readyUnits = Function(`${portal.slice(portalStart, portalEnd)}; return units;`)()
  .filter((unit) => unit.status === "ready" && unit.url)
  .map((unit) => ({
    unitId: unit.unitId,
    folder: unit.url.split("/")[0],
    title: unit.title
  }));

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 }
];
const titleLevels = [
  ["01", "trainee_investigator", "見習調查員"],
  ["02", "life_observer", "生命觀察員"],
  ["03", "ecology_recorder", "生態記錄員"],
  ["04", "concept_solver", "概念解謎者"],
  ["05", "micro_explorer", "微觀探索者"]
];

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
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

function titleState(variant) {
  const mode = variant.mode || "verified";
  const level = variant.title || titleLevels[4];
  const gender = variant.gender || "male";
  const source = mode === "guest" ? "local_guest" : mode === "pending" ? "pending_backend" : "server_verified";
  const progress = {
    source,
    progress_applied: mode === "verified",
    total_exp: mode === "verified" ? 5200 : 0,
    current_title_id: level[1],
    current_title: level[2],
    profile_gender: gender,
    title_avatar_path: variant.path || "",
    completed_unit_count: mode === "verified" ? 5 : 0,
    unit_badge_summary_json: JSON.stringify([
      {
        unit_id: "life_world",
        station_title: "第 1 站｜多彩多姿的生命世界",
        earned_count: 1,
        total_badges: 9,
        earned_badges: []
      }
    ])
  };
  const student = {
    student_id: mode === "guest" ? "guest" : "S79998",
    student_name: "路徑測試",
    class_name: "七年級",
    seat_no: "98",
    profile_gender: gender,
    current_title_id: level[1],
    current_title: level[2],
    title_avatar_path: variant.path || "",
    is_guest: mode === "guest",
    progress,
    student_progress: progress
  };
  return { student, progress, student_progress: progress };
}

async function openCleanUnit(browser, baseUrl, unit, viewport) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/${unit.folder}/index.html?v=${cacheVersion}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.BioQuestCharacterLayout?.enhance && document.querySelector("#screen")), undefined, { timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  imageErrors.length = 0;
  consoleErrors.length = 0;
  pageErrors.length = 0;
  return { page, context, imageErrors, consoleErrors, pageErrors };
}

async function injectTitleCard(page, unit, variant) {
  const state = titleState(variant);
  await page.evaluate(({ unit, state }) => {
    const root = document.querySelector("#screen");
    window.__BIOQUEST_BADGE_OVERVIEW_STATE__ = state;
    root.dataset.bioquestScreen = "achievements";
    root.innerHTML = `
      <div class="wide-layout">
        <div class="panel" data-bq-unit-achievements="true">
          <p class="eyebrow">成就收藏</p>
          <h2>本單元成就</h2>
          <div class="badge-grid">
            <div class="badge-card">
              <strong>${unit.title}測試徽章</strong>
              <p>shared title avatar renderer audit fixture</p>
            </div>
          </div>
        </div>
      </div>
    `;
    window.BioQuestCharacterLayout.enhance({ force: true });
  }, { unit, state });
  await page.waitForFunction(() => {
    const img = document.querySelector(".bq-title-avatar-card img, .title-avatar-card.achievements img");
    return img && img.naturalWidth > 0;
  }, undefined, { timeout: 15000 });
}

async function assertTitleCard(browser, baseUrl, unit, viewport, variant) {
  const opened = await openCleanUnit(browser, baseUrl, unit, viewport);
  const { page, context, imageErrors, consoleErrors, pageErrors } = opened;
  await injectTitleCard(page, unit, variant);
  const metrics = await page.locator("#screen").evaluate((root) => {
    const cards = [...root.querySelectorAll(".bq-title-avatar-card, .title-avatar-card.achievements")];
    const images = [...root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img")];
    const image = images[0] || null;
    return {
      cardCount: cards.length,
      imageCount: images.length,
      src: image?.getAttribute("src") || "",
      currentSrc: image?.currentSrc || "",
      naturalWidth: image?.naturalWidth || 0,
      naturalHeight: image?.naturalHeight || 0,
      overviewCount: root.querySelectorAll("[data-bq-badge-overview]").length,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1
    };
  });
  assert.equal(metrics.cardCount, 1, `${unit.unitId} ${viewport.width} ${variant.name}: title card exactly 1`);
  assert.equal(metrics.imageCount, 1, `${unit.unitId} ${viewport.width} ${variant.name}: title avatar image exactly 1`);
  assert.ok(metrics.naturalWidth > 0 && metrics.naturalHeight > 0, `${unit.unitId} ${viewport.width} ${variant.name}: title avatar loaded`);
  assert.match(metrics.currentSrc || metrics.src, /\/shared-assets\/title-avatars\/title-\d{2}-[a-z0-9_]+-(male|female)\.webp(?:[?#].*)?$/, `${unit.unitId} ${viewport.width} ${variant.name}: title avatar primary must be WebP`);
  assert.doesNotMatch(metrics.currentSrc || metrics.src, /\.(png|jpe?g)(?:[?#].*)?$/i, `${unit.unitId} ${viewport.width} ${variant.name}: no legacy raster title avatar`);
  assert.doesNotMatch(metrics.src, /^(https?:|data:)/i, `${unit.unitId} ${viewport.width} ${variant.name}: no external title avatar src attribute`);
  assert.equal(metrics.overviewCount, 1, `${unit.unitId} ${viewport.width} ${variant.name}: overview exactly 1`);
  assert.equal(metrics.horizontalOverflow, false, `${unit.unitId} ${viewport.width} ${variant.name}: no horizontal overflow`);
  assert.deepEqual(imageErrors, [], `${unit.unitId} ${viewport.width} ${variant.name}: image 404`);
  assert.deepEqual(consoleErrors, [], `${unit.unitId} ${viewport.width} ${variant.name}: console errors`);
  assert.deepEqual(pageErrors, [], `${unit.unitId} ${viewport.width} ${variant.name}: page errors`);
  await context.close();
}

const defaultVariant = {
  name: "verified-backend-png",
  path: "shared-assets/title-avatars/title-05-micro_explorer-male.png",
  mode: "verified",
  gender: "male",
  title: titleLevels[4]
};
const u14Matrix = [];
const extensionByLevel = ["png", "jpg", "jpeg", "webp", "png"];
for (const title of titleLevels) {
  for (const gender of ["male", "female"]) {
    const extension = extensionByLevel[Number(title[0]) - 1];
    u14Matrix.push({
      name: `${title[1]}-${gender}-${extension}`,
      path: `shared-assets/title-avatars/title-${title[0]}-${title[1]}-${gender}.${extension}?legacy=1#avatar`,
      mode: "verified",
      gender,
      title
    });
  }
}
u14Matrix.push(
  { name: "guest-empty", path: "", mode: "guest", gender: "male", title: titleLevels[0] },
  { name: "pending-relative-png", path: "../shared-assets/title-avatars/title-05-micro_explorer-female.png", mode: "pending", gender: "female", title: titleLevels[4] },
  { name: "root-relative-jpeg", path: "/shared-assets/title-avatars/title-03-ecology_recorder-male.jpeg", mode: "verified", gender: "male", title: titleLevels[2] },
  { name: "dot-relative-jpg", path: "./shared-assets/title-avatars/title-04-concept_solver-female.jpg", mode: "verified", gender: "female", title: titleLevels[3] },
  { name: "untrusted-http", path: "https://example.invalid/title-02-life_observer-male.png", mode: "verified", gender: "male", title: titleLevels[1] },
  { name: "untrusted-data", path: "data:image/png;base64,AAAA", mode: "verified", gender: "female", title: titleLevels[1] }
);

const { server, port } = await startServer();
const baseUrl = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  for (const unit of readyUnits) {
    for (const viewport of viewports) await assertTitleCard(browser, baseUrl, unit, viewport, defaultVariant);
  }
  const u14 = readyUnits.find((unit) => unit.unitId === "photosynthesis");
  assert.ok(u14, "U14 photosynthesis must be ready");
  for (const viewport of viewports) {
    for (const variant of u14Matrix) await assertTitleCard(browser, baseUrl, u14, viewport, variant);
  }
} finally {
  await browser.close();
  server.close();
}

console.log(JSON.stringify({
  ok: true,
  root,
  cacheVersion,
  readyUnitCount: readyUnits.length,
  defaultVariant: defaultVariant.name,
  u14Matrix: u14Matrix.map((variant) => variant.name),
  viewports
}, null, 2));
