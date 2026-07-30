const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sharp = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");

const root = process.env.BQ_TEST_ROOT ? path.resolve(process.env.BQ_TEST_ROOT) : path.resolve(__dirname, "..");
const artifactDir = path.join(__dirname, "artifacts", "cell-structure-submitted-retry-ia-v1");
const url = `${pathToFileURL(path.join(root, "index.html")).href}?v=20260731-cell-structure-submitted-retry-ia-v1`;
const checkpoint1ForbiddenTerms = ["控制中心", "代謝", "能量", "光合作用", "控制物質進出", "支撐保護"];
const targets = [
  { id: "nucleus", diagram: "animal", revealShapes: 1, label: "細胞核" },
  {
    id: "mitochondria", diagram: "animal", revealShapes: 4, label: "粒線體",
    referenceBounds: [
      { x: 22.2, y: 16.8, right: 30.9, bottom: 32.1 },
      { x: 62.8, y: 19.2, right: 70.7, bottom: 30.0 },
      { x: 27.0, y: 54.0, right: 36.4, bottom: 67.4 },
      { x: 69.2, y: 50.0, right: 79.7, bottom: 66.8 }
    ],
    colorSamples: [{ x: 26, y: 24 }, { x: 68, y: 25 }, { x: 32, y: 61 }, { x: 75, y: 59 }],
    grayscaleSample: { x: 52, y: 38 }
  },
  {
    id: "chloroplast", diagram: "plant", revealShapes: 3, label: "葉綠體",
    referenceBounds: [
      { x: 60.9, y: 18.0, right: 75.4, bottom: 32.9 },
      { x: 18.7, y: 46.4, right: 28.7, bottom: 64.3 },
      { x: 62.1, y: 62.0, right: 75.0, bottom: 74.8 }
    ],
    colorSamples: [{ x: 68, y: 26 }, { x: 24, y: 56 }, { x: 69, y: 69 }],
    grayscaleSample: { x: 55, y: 50 }
  },
  { id: "vacuole", diagram: "plant", revealShapes: 1, label: "大型液胞" }
];

fs.mkdirSync(artifactDir, { recursive: true });

async function loadedImage(locator, label) {
  await locator.waitFor({ state: "attached" });
  const ok = await locator.evaluate((img) => new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) resolve(true);
    else {
      img.addEventListener("load", () => resolve(img.naturalWidth > 0), { once: true });
      img.addEventListener("error", () => resolve(false), { once: true });
    }
  }));
  assert.ok(ok, `${label} image did not load`);
}

async function waitForPaint(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function assertPageAtTop(page, label) {
  await waitForPaint(page);
  const metrics = await page.evaluate(() => ({
    scrollY: window.scrollY,
    documentTop: document.scrollingElement?.scrollTop || 0,
    mainTop: document.querySelector(".main-stage")?.scrollTop || 0,
    screenTop: document.querySelector("#screen")?.scrollTop || 0
  }));
  assert.ok(metrics.scrollY <= 2, `${label}: window scrollY must reset, got ${metrics.scrollY}`);
  assert.ok(metrics.documentTop <= 2, `${label}: document scrollTop must reset, got ${metrics.documentTop}`);
  assert.ok(metrics.mainTop <= 2, `${label}: main-stage scrollTop must reset, got ${metrics.mainTop}`);
  assert.ok(metrics.screenTop <= 2, `${label}: screen scrollTop must reset, got ${metrics.screenTop}`);
}

async function assertInFirstViewport(page, locator, viewport, label) {
  await waitForPaint(page);
  const box = await locator.boundingBox();
  assert.ok(box, `${label}: element must have a bounding box`);
  const top = box.y;
  const bottom = box.y + box.height;
  assert.ok(top >= 0, `${label}: element top must be in viewport, got ${top}`);
  assert.ok(top < viewport.height * 0.82, `${label}: element must start in first viewport, got ${top}`);
  assert.ok(bottom > 0, `${label}: element bottom must be visible, got ${bottom}`);
}

function fillAlpha(fill) {
  if (fill === "none") return 0;
  const rgba = fill.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
  return rgba ? Number(rgba[1]) : 1;
}

async function assertScreenshotColorIsolation(screenshotPath, target) {
  if (!target.colorSamples) return;
  const { data, info } = await sharp(screenshotPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  function spreadAt(point) {
    const centerX = Math.round((point.x / 100) * (info.width - 1));
    const centerY = Math.round((point.y / 100) * (info.height - 1));
    const sums = [0, 0, 0];
    let count = 0;
    for (let y = Math.max(0, centerY - 2); y <= Math.min(info.height - 1, centerY + 2); y += 1) {
      for (let x = Math.max(0, centerX - 2); x <= Math.min(info.width - 1, centerX + 2); x += 1) {
        const offset = (y * info.width + x) * info.channels;
        sums[0] += data[offset];
        sums[1] += data[offset + 1];
        sums[2] += data[offset + 2];
        count += 1;
      }
    }
    const averages = sums.map((sum) => sum / count);
    return Math.max(...averages) - Math.min(...averages);
  }
  target.colorSamples.forEach((point, index) => {
    assert.ok(spreadAt(point) >= 18, `${target.id} target ${index + 1} must retain original color`);
  });
  assert.ok(spreadAt(target.grayscaleSample) <= 12, `${target.id} non-target sample must remain grayscale`);
}

async function assertTargetReveal(page, target, viewportWidth) {
  assert.equal(await page.locator(".cell-highlight-overlay").count(), 1, `${target.id} must render exactly one active overlay`);
  const metrics = await page.evaluate(({ targetId, diagramType }) => {
    const board = document.querySelector(".cell-board");
    const base = board.querySelector(".cell-image-grayscale");
    const overlay = board.querySelector(".cell-highlight-overlay");
    const reveal = overlay.querySelector(".cell-color-reveal-image");
    const boardBox = board.getBoundingClientRect();
    const baseBox = base.getBoundingClientRect();
    const overlayBox = overlay.getBoundingClientRect();
    const halo = overlay.querySelector(".cell-highlight-halo");
    const core = overlay.querySelector(".cell-highlight-core");
    return {
      target: overlay.dataset.highlightTarget,
      diagram: board.dataset.cellDiagramType,
      mode: overlay.dataset.overlayMode,
      revealShapeCount: Number(overlay.dataset.revealShapeCount),
      overlayCount: board.querySelectorAll(".cell-highlight-overlay").length,
      revealImageCount: board.querySelectorAll(".cell-color-reveal-image").length,
      maskCount: board.querySelectorAll(".cell-color-reveal-mask").length,
      maskWhiteShapeCount: [...overlay.querySelectorAll(".cell-color-reveal-mask > :not(rect)")].filter((node) => node.getAttribute("fill") === "#fff").length,
      exclusionCount: Number(overlay.dataset.revealExclusionCount),
      haloCount: overlay.querySelectorAll(".cell-highlight-halo").length,
      coreCount: overlay.querySelectorAll(".cell-highlight-core").length,
      revealHref: reveal?.getAttribute("href") || "",
      revealMask: reveal?.getAttribute("mask") || "",
      baseFilter: getComputedStyle(base).filter,
      baseFit: getComputedStyle(base).objectFit,
      baseNaturalRatio: base.naturalWidth / base.naturalHeight,
      boardRatio: boardBox.width / boardBox.height,
      baseInside: baseBox.left >= boardBox.left - 1 && baseBox.right <= boardBox.right + 1 && baseBox.top >= boardBox.top - 1 && baseBox.bottom <= boardBox.bottom + 1,
      overlayDelta: Math.max(Math.abs(overlayBox.width - boardBox.width), Math.abs(overlayBox.height - boardBox.height)),
      haloStroke: parseFloat(getComputedStyle(halo).strokeWidth),
      haloFill: getComputedStyle(halo).fill,
      coreStroke: parseFloat(getComputedStyle(core).strokeWidth),
      coreFill: getComputedStyle(core).fill,
      vacuolePathCount: targetId === "vacuole" ? overlay.querySelectorAll(".cell-color-reveal-mask path[fill='#fff']").length : 0,
      vacuoleEllipseCount: targetId === "vacuole" ? overlay.querySelectorAll(".cell-color-reveal-mask ellipse[fill='#fff']").length : 0,
      hotspotCount: board.querySelectorAll(".cell-hotspot").length,
      maskGeometry: [...overlay.querySelectorAll(".cell-color-reveal-mask > :not(rect)")]
        .filter((node) => node.getAttribute("fill") === "#fff")
        .map((node) => ({ tag: node.tagName, d: node.getAttribute("d"), cx: node.getAttribute("cx"), cy: node.getAttribute("cy"), rx: node.getAttribute("rx"), ry: node.getAttribute("ry"), transform: node.getAttribute("transform") })),
      outlineGeometry: [...overlay.querySelectorAll(".halo-layer > *")]
        .map((node) => ({ tag: node.tagName, d: node.getAttribute("d"), cx: node.getAttribute("cx"), cy: node.getAttribute("cy"), rx: node.getAttribute("rx"), ry: node.getAttribute("ry"), transform: node.getAttribute("transform") })),
      outlineBounds: [...overlay.querySelectorAll(".halo-layer > *")].map((node) => {
        const box = node.getBBox();
        return { x: box.x, y: box.y, right: box.x + box.width, bottom: box.y + box.height };
      }),
      expectedDiagram: diagramType
    };
  }, { targetId: target.id, diagramType: target.diagram });

  assert.equal(metrics.target, target.id);
  assert.equal(metrics.diagram, target.diagram);
  assert.equal(metrics.mode, "color-reveal");
  assert.equal(metrics.overlayCount, 1);
  assert.equal(metrics.revealImageCount, 1, `${target.id} must use one original-color image layer`);
  assert.equal(metrics.maskCount, 1, `${target.id} must use one reveal mask`);
  assert.equal(metrics.revealShapeCount, target.revealShapes);
  assert.equal(metrics.maskWhiteShapeCount, target.revealShapes);
  assert.equal(metrics.exclusionCount, target.id === "vacuole" ? 3 : 0);
  assert.equal(metrics.haloCount, target.revealShapes);
  assert.equal(metrics.coreCount, target.revealShapes);
  assert.match(metrics.revealHref, target.diagram === "animal" ? /cell-animal-3d\.webp/ : /cell-plant-3d\.webp/);
  assert.match(metrics.revealMask, /^url\(#cell-reveal-/);
  assert.notEqual(metrics.baseFilter, "none", "base image must remain grayscale");
  assert.equal(metrics.baseFit, "contain", "base image must never crop");
  assert.ok(Math.abs(metrics.baseNaturalRatio - (4 / 3)) < 0.02);
  assert.ok(Math.abs(metrics.boardRatio - (4 / 3)) < 0.02);
  assert.ok(metrics.baseInside, "cell image must stay inside board");
  assert.ok(metrics.overlayDelta <= 2.5, "reveal overlay must align with original image");
  assert.ok(metrics.haloStroke >= 3.8 && metrics.haloStroke <= 4.2, "outline helper must remain thin and visible");
  assert.ok(metrics.coreStroke >= 1.7 && metrics.coreStroke <= 2, "inner outline must remain thin");
  assert.ok(fillAlpha(metrics.haloFill) <= 0.05, "outline fill must be nearly transparent");
  assert.equal(metrics.coreFill, "none", "inner outline must not cover the organelle");
  assert.equal(metrics.hotspotCount, 0, "checkpoint1 must be answered through name chips only");
  assert.deepEqual(metrics.maskGeometry, metrics.outlineGeometry, `${target.id} mask and outline must share the same geometry`);
  metrics.outlineBounds.forEach((box, index) => {
    assert.ok(box.x >= 1 && box.y >= 1 && box.right <= 99 && box.bottom <= 99, `${target.id} shape ${index + 1} must stay inside the image frame`);
  });
  if (["mitochondria", "chloroplast"].includes(target.id)) {
    assert.ok(metrics.maskGeometry.every((shape) => shape.tag.toLowerCase() === "path"), `${target.id} must use one fitted path per organelle`);
    target.referenceBounds.forEach((reference, index) => {
      const box = metrics.outlineBounds[index];
      assert.ok(box.x <= reference.x + 0.45 && box.y <= reference.y + 0.45, `${target.id} shape ${index + 1} must include the target top-left edge`);
      assert.ok(box.right >= reference.right - 0.45 && box.bottom >= reference.bottom - 0.45, `${target.id} shape ${index + 1} must include the target bottom-right edge`);
      assert.ok(reference.x - box.x <= 3 && reference.y - box.y <= 3 && box.right - reference.right <= 3 && box.bottom - reference.bottom <= 3, `${target.id} shape ${index + 1} padding must stay local to the organelle`);
    });
  }
  if (target.id === "vacuole") {
    assert.equal(metrics.vacuolePathCount, 1, "vacuole must use one merged path mask");
    assert.equal(metrics.vacuoleEllipseCount, 0, "vacuole must not use overlapping circles");
  }

  await page.locator(".cell-board").evaluate((board) => {
    board.scrollIntoView({ block: "center", inline: "nearest" });
    const sticky = document.querySelector(".side-panel")?.getBoundingClientRect();
    const box = board.getBoundingClientRect();
    if (sticky && box.top < sticky.bottom + 12) window.scrollBy(0, box.top - sticky.bottom - 12);
  });
  await page.waitForTimeout(180);
  const screenshotPath = path.join(artifactDir, `${viewportWidth}-${target.id}.png`);
  await page.locator(".cell-board").screenshot({ path: screenshotPath });
  await assertScreenshotColorIsolation(screenshotPath, target);
  if (["mitochondria", "chloroplast"].includes(target.id)) {
    fs.copyFileSync(screenshotPath, path.join(artifactDir, `${target.id}-boundary-qa-${viewportWidth}.png`));
  }
}

async function checkViewport(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("#guestButton").click();
  assert.equal((await page.locator(".bq-unit-position").innerText()).trim(), "第 6 站｜細胞的構造");
  await loadedImage(page.locator(".brief-scene-figure > img").first(), `briefing scene ${viewport.width}`);
  assert.equal(await page.locator(".brief-scene-card .mentor-card, .brief-scene-card .owl-frame").count(), 0);

  await page.locator("#briefNext").click();
  const prepOwl = page.locator(".prep-owl-hero img").first();
  await loadedImage(prepOwl, `prep owl ${viewport.width}`);
  await assertPageAtTop(page, `brief to prep ${viewport.width}`);
  await assertInFirstViewport(page, prepOwl, viewport, `prep owl ${viewport.width}`);
  await page.locator("#scanNext").click();
  await assertPageAtTop(page, `prep to checkpoint1 ${viewport.width}`);

  assert.equal(await page.locator('.cell-board[data-cell-diagram-type="animal"][data-current-target="nucleus"]').count(), 1, "checkpoint1 must start with animal nucleus");
  await loadedImage(page.locator(".cell-image-grayscale"), `animal cell ${viewport.width}`);
  assert.equal(await page.locator(".structure-chip").count(), 4, "checkpoint1 must show four name targets");
  assert.equal(await page.locator(".structure-chip.active").count(), 0);
  const checkpoint1Text = await page.locator(".checkpoint-grid").innerText();
  checkpoint1ForbiddenTerms.forEach((term) => assert.ok(!checkpoint1Text.includes(term), `checkpoint1 must not leak function clue: ${term}`));

  const checkpointExpCases = await page.evaluate(() => {
    const originalAnswers = structuredClone(state.answers.checkpoint1);
    const originalHints = structuredClone(state.answers.checkpoint1Hints);
    state.answers.checkpoint1 = Object.fromEntries(checkpoint1Items.map((item) => [item.id, item.answer]));
    state.answers.checkpoint1Hints = {};
    const noHint = calculateCheckpoint1Score();
    state.answers.checkpoint1Hints = { nucleus: true };
    const withHint = calculateCheckpoint1Score();
    delete state.answers.checkpoint1.vacuole;
    const incomplete = calculateCheckpoint1Score();
    state.answers.checkpoint1 = originalAnswers;
    state.answers.checkpoint1Hints = originalHints;
    return { noHint, withHint, incomplete };
  });
  assert.equal(checkpointExpCases.noHint.concept, 140);
  assert.equal(checkpointExpCases.noHint.revision, 0);
  assert.equal(checkpointExpCases.withHint.concept, 0);
  assert.equal(checkpointExpCases.withHint.revision, 70);
  assert.equal(checkpointExpCases.incomplete.concept + checkpointExpCases.incomplete.revision, 0);
  assert.equal(checkpointExpCases.incomplete.checkpoint_completion_status, "incomplete");

  await page.locator("#checkpoint1Next").click();
  assert.ok((await page.locator("#checkpointFeedback").innerText()).includes("尚有 4 個構造未辨識"));
  await page.locator('[data-structure-chip="mitochondria"]').click();
  await page.locator('[data-structure-chip="mitochondria"]').click();
  assert.equal(await page.locator(".hint").filter({ hasText: "接近圓形" }).count(), 1, "wrong answer must reveal the current target hint only once");

  for (const target of targets) {
    assert.equal(await page.locator(`.cell-board[data-cell-diagram-type="${target.diagram}"][data-current-target="${target.id}"]`).count(), 1, `${target.id} must use ${target.diagram} image`);
    await assertTargetReveal(page, target, viewport.width);
    await page.locator(`[data-structure-chip="${target.id}"]`).click();
    if (target.id === "mitochondria") {
      assert.equal(await page.locator('.cell-board[data-cell-diagram-type="plant"][data-current-target="chloroplast"]').count(), 1, "third target must switch to plant cell chloroplast");
      assert.equal(await page.locator(".diagram-transition").filter({ hasText: "動物細胞辨識完成，正在切換植物細胞" }).count(), 1);
      await loadedImage(page.locator(".cell-image-grayscale"), `plant cell ${viewport.width}`);
    }
  }

  assert.equal(await page.locator(".structure-chip.locked").count(), 4);
  assert.equal(await page.locator(".cell-highlight-overlay").count(), 0, "completed checkpoint must remove color reveal");
  const targetLogs = await page.evaluate(() => buildCheckpoint1QuestionLogs());
  assert.deepEqual(targetLogs.map((row) => row.target_id), ["nucleus", "mitochondrion", "chloroplast", "large_vacuole"]);
  assert.ok(targetLogs.every((row) => row.target_count === 4 && row.required_target_count === 4));
  assert.ok(targetLogs.every((row) => row.exp_type === "evidence_only" && row.exp_awarded === 0));
  assert.equal(targetLogs[0].attempt_count, 3, "two wrong nucleus choices and one correct choice must be recorded");
  await page.locator("#checkpoint1Next").click();
  await page.waitForSelector("text=功能配對");
  const checkpoint2Text = await page.locator("#screen").innerText();
  for (const term of ["細胞膜", "細胞壁", "細胞質", "代謝", "能量", "光合作用", "控制物質進出"]) {
    assert.ok(checkpoint2Text.includes(term), `later function check must retain removed scan concept: ${term}`);
  }

  await page.evaluate(() => setScreen("review"));
  await assertPageAtTop(page, `checkpoint to review ${viewport.width}`);
  await loadedImage(page.locator('.mentor-card img[src*="../shared-assets/mentor-feedback/mentor-feedback-"]').first(), `feedback mentor ${viewport.width}`);
  await page.evaluate(() => setScreen("reflection"));
  await assertPageAtTop(page, `review to reflection ${viewport.width}`);
  assert.equal(await page.locator(".bq-report-assistant").count(), 1);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.locator("#submitMission").click();
  assert.ok(await page.locator("text=任務回報").first().isVisible());
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#submitMission").click();
  assert.ok(await page.locator("text=任務結算").first().isVisible());
  await assertPageAtTop(page, `reflection to result ${viewport.width}`);
  await page.locator("#goAchievements").click();
  await page.locator("[data-bq-badge-overview='true']").first().waitFor({ state: "visible" });
  await assertPageAtTop(page, `result to achievements ${viewport.width}`);
  assert.equal(await page.locator("[data-bq-unit-achievements='true']").count(), 0, "achievements must not render a local unit badge wall");
  assert.deepEqual(errors, []);
  await page.close();
}

async function makeContactSheet(viewportWidth) {
  const tiles = [];
  for (const target of targets) {
    const image = await sharp(path.join(artifactDir, `${viewportWidth}-${target.id}.png`))
      .resize(600, 450, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer();
    const label = Buffer.from(`<svg width="600" height="50"><rect width="600" height="50" fill="#163c46"/><text x="24" y="33" fill="#ffffff" font-size="24" font-family="Arial, sans-serif">${target.label}｜${target.diagram === "animal" ? "動物細胞" : "植物細胞"}</text></svg>`);
    tiles.push(await sharp({ create: { width: 600, height: 500, channels: 4, background: "#ffffff" } })
      .composite([{ input: label, top: 0, left: 0 }, { input: image, top: 50, left: 0 }])
      .png()
      .toBuffer());
  }
  await sharp({ create: { width: 1200, height: 1000, channels: 4, background: "#dcebea" } })
    .composite(tiles.map((input, index) => ({ input, left: (index % 2) * 600, top: Math.floor(index / 2) * 500 })))
    .png()
    .toFile(path.join(artifactDir, `contact-sheet-${viewportWidth}.png`));
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  try {
    await checkViewport(browser, { width: 1440, height: 900 });
    await checkViewport(browser, { width: 390, height: 844 });
  } finally {
    await browser.close();
  }
  await makeContactSheet(1440);
  await makeContactSheet(390);
  console.log(`prototype-cell-structure color reveal regression passed; artifacts: ${artifactDir}`);
})();
