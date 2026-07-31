const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT)
  : path.resolve(__dirname, "..", "..");
const artifactDir = path.join(__dirname, "artifacts", "20260731-cell-transport-submitted-retry-ia-v1");
const version = "20260731-cell-transport-submitted-retry-ia-v1";
const storageKey = "bioquest_cell_transport_state_v1";

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

function stateFor() {
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
    answers: { q01_sequence: [], reflection: {} },
    hints: {},
    optionOrders: {},
    result: null,
    submitted_at: null,
    backend_status: ""
  };
}

async function assertBriefScene(browser, baseUrl, viewport) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(({ key, state }) => {
    try {
      if (location.protocol !== "http:") return;
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem("bioquest_attempts_v1", "[]");
    } catch {}
  }, { key: storageKey, state: stateFor() });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/prototype-cell-transport/index.html?v=${version}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".bq-brief-scene-stage .bq-brief-scene-image");
  await page.waitForSelector(".bq-brief-scene-stage .bq-brief-student-avatar");

  const metrics = await page.locator(".bq-brief-scene-stage").evaluate((scene) => {
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
    const caption = scene.parentElement.querySelector(".bq-brief-scene-caption");
    const captionBox = caption.getBoundingClientRect();
    const legacySlotCount = scene.parentElement.querySelectorAll(".student-avatar-slot, .brief-title-avatar-card, .title-avatar-brief").length;
    const overlapWidth = Math.max(0, Math.min(avatarBox.right, captionBox.right) - Math.max(avatarBox.left, captionBox.left));
    const overlapHeight = Math.max(0, Math.min(avatarBox.bottom, captionBox.bottom) - Math.max(avatarBox.top, captionBox.top));
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
      left: imageBox.left + imageBox.width * 0.63,
      right: imageBox.left + imageBox.width * 0.86,
      top: imageBox.top + imageBox.height * 0.11,
      bottom: imageBox.top + imageBox.height * 0.975
    };
    azheVisibleBox.width = azheVisibleBox.right - azheVisibleBox.left;
    azheVisibleBox.height = azheVisibleBox.bottom - azheVisibleBox.top;
    return {
      sceneWidth: sceneBox.width,
      sceneHeight: sceneBox.height,
      sceneRatio: sceneBox.width / sceneBox.height,
      imageNaturalWidth: image.naturalWidth,
      imageNaturalHeight: image.naturalHeight,
      imageObjectFit: getComputedStyle(image).objectFit,
      imageInsideScene: imageBox.left >= sceneBox.left - 1 && imageBox.right <= sceneBox.right + 1 && imageBox.top >= sceneBox.top - 1 && imageBox.bottom <= sceneBox.bottom + 1,
      avatarNaturalWidth: avatar.naturalWidth,
      avatarSrc: avatar.getAttribute("src") || "",
      avatarHeightRatio: avatarBox.height / sceneBox.height,
      avatarAlphaHeightRatio: avatarAlpha.height / avatar.naturalHeight,
      avatarVisibleHeightRatio: avatarVisibleBox.height / azheVisibleBox.height,
      avatarVisibleBox,
      azheVisibleBox,
      avatarInsideScene: avatarBox.left >= sceneBox.left - 1 && avatarBox.right <= sceneBox.right + 1 && avatarBox.top >= sceneBox.top - 1 && avatarBox.bottom <= sceneBox.bottom + 1,
      avatarPixelsInsideScene: avatarVisibleBox.left >= sceneBox.left - 1 && avatarVisibleBox.right <= sceneBox.right + 1 && avatarVisibleBox.top >= sceneBox.top - 1 && avatarVisibleBox.bottom <= sceneBox.bottom + 1,
      avatarClearOfAzhe: avatarVisibleBox.right <= azheVisibleBox.left + imageBox.width * 0.01,
      captionAfterScene: captionBox.top >= sceneBox.bottom - 1,
      captionOverlapArea: overlapWidth * overlapHeight,
      legacySlotCount,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
  assert.ok(metrics.imageNaturalWidth > 0 && metrics.imageNaturalHeight > 0, "briefing scene image should load");
  assert.equal(metrics.imageObjectFit, "contain", "briefing image must use contain");
  assert.ok(Math.abs(metrics.sceneRatio - 16 / 9) < 0.04, `stage should stay near 16:9: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.imageInsideScene, `briefing image should not crop outside stage: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarNaturalWidth > 0, "student title avatar should load");
  assert.match(metrics.avatarSrc, /^\.\.\/shared-assets\/title-avatars\//, "backend-style avatar path should normalize to shared parent path");
  assert.ok(metrics.avatarAlphaHeightRatio > 0.6, `student avatar alpha bbox should measure visible body pixels: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarVisibleHeightRatio >= 0.85 && metrics.avatarVisibleHeightRatio <= 1.0, `student visible body should be 85-100% of Azhe visible height: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarInsideScene, `student avatar must stay inside scene: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarPixelsInsideScene, `student visible pixels must stay inside scene: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarClearOfAzhe, `student avatar should not cover Azhe body/face: ${JSON.stringify(metrics)}`);
  assert.equal(metrics.captionAfterScene, true, "caption text should sit below the scene");
  assert.equal(metrics.captionOverlapArea, 0, "caption text must not overlap student avatar");
  assert.equal(metrics.legacySlotCount, 0, "brief should not render old circular student-avatar-slot");
  assert.equal(metrics.horizontalOverflow, 0, "brief should not create horizontal overflow");
  assert.deepEqual(imageErrors, [], "no image 404 expected");
  assert.deepEqual(consoleErrors, [], "no console errors expected");
  assert.deepEqual(pageErrors, [], "no page errors expected");
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, `${viewport.width}x${viewport.height}-metrics.json`), JSON.stringify(metrics, null, 2));
  await page.screenshot({ path: path.join(artifactDir, `${viewport.width}x${viewport.height}-brief-scene.png`) });
  await context.close();
}

(async () => {
  const { server, port } = await startServer();
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await assertBriefScene(browser, baseUrl, { width: 1440, height: 900 });
    await assertBriefScene(browser, baseUrl, { width: 390, height: 844 });
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`cell_transport brief scene regression passed; artifacts: ${artifactDir}`);
})();
