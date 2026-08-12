#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sharp = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-human-circulation")
  : sourceRoot;
const Q = (n) => `human_circulation_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function sceneVisibilityMetrics(buffer) {
  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = Math.max(1, Math.floor(meta.width * 0.68));
  const raw = await image.extract({ left: 0, top: 0, width, height: meta.height }).raw().toBuffer();
  const channels = meta.channels || 3;
  const pixels = Math.max(1, raw.length / channels);
  let vividPixels = 0;
  let warmPixels = 0;
  for (let index = 0; index < raw.length; index += channels) {
    const r = raw[index];
    const g = raw[index + 1];
    const b = raw[index + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > 42) vividPixels += 1;
    if (r > 105 && g > 50 && b < 105 && r > g * 1.08) warmPixels += 1;
  }
  return { vividRatio: vividPixels / pixels, warmRatio: warmPixels / pixels };
}

async function assertAtTop(page, label) {
  await page.waitForTimeout(80);
  const scrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0);
  assert(scrollY <= 8, `${label} should reset scroll to top, got ${scrollY}`);
}

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function orderSequence(page, qid, correctOrder) {
  for (let targetIndex = 0; targetIndex < correctOrder.length; targetIndex += 1) {
    const itemId = correctOrder[targetIndex];
    for (;;) {
      const current = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((items) => items.map((item) => item.dataset.sequenceItem));
      const currentIndex = current.indexOf(itemId);
      if (currentIndex <= targetIndex) break;
      await page.locator(`[data-move="${qid}"][data-item="${itemId}"][data-dir="-1"]`).click();
    }
  }
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const failedImages = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (/\.(png|jpe?g|webp|svg)(\?|$)/i.test(request.url())) failedImages.push(request.url());
    });
    page.on("dialog", (dialog) => dialog.accept());
    await page.addInitScript(() => { window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, student: { student_id: "guest", student_name: "老師測試帳號" } }) }); });
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260813-human-circulation-mapping-v1`);
    await page.locator("#guestBtn").click();
    await page.locator(".bq-brief-scene-image").waitFor();
    assert.equal(await page.locator(".bq-brief-scene-image").count(), 1, "brief scene image should be exactly one");
    assert.equal(await page.locator(".bq-brief-student-avatar").count(), 1, "brief title avatar should be exactly one");
    const sceneState = await page.locator(".bq-brief-scene-stage").evaluate((stage) => {
      const image = stage.querySelector(".bq-brief-scene-image");
      const computed = getComputedStyle(stage);
      const imageComputed = getComputedStyle(image);
      return {
        backgroundImage: computed.backgroundImage,
        backgroundSize: computed.backgroundSize,
        objectFit: imageComputed.objectFit,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      };
    });
    assert(sceneState.backgroundImage.includes("human-circulation-briefing-azhe-wide.webp"), "brief stage fallback should use official scene");
    assert.equal(sceneState.backgroundSize, "contain", "brief stage fallback should not cover-crop the scene");
    assert.equal(sceneState.objectFit, "contain", "brief image should not cover-crop the scene");
    assert(sceneState.naturalWidth > 0 && sceneState.naturalHeight > 0, "brief scene image must load");
    const sceneShot = await page.locator(".bq-brief-scene-stage").screenshot();
    const metrics = await sceneVisibilityMetrics(sceneShot);
    assert(metrics.vividRatio > 0.045, `brief scene should show visible color detail, got ${JSON.stringify(metrics)}`);
    assert(metrics.warmRatio > 0.006, `brief scene should show Azhe/warm scene pixels, got ${JSON.stringify(metrics)}`);
    await page.locator('[data-next="scan"]').click();
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-sequence="${Q(2)}"] [data-sequence-item]`).count(), 6, "route sequence cards missing");
    assert.equal(await page.locator(`[data-question-id="${Q(9)}"]`).count(), 0, "checkpoint routing leaked later question");
    let checkpointText = await page.locator("#screen").textContent();
    for (const legacy of ["循環概念卡", "肺循環 / 體循環判斷"]) {
      assert(!checkpointText.includes(legacy), `checkpoint1 should not show legacy evidence: ${legacy}`);
    }
    await answerChoice(page, Q(1), "loops_back");
    await orderSequence(page, Q(2), ["right_ventricle", "lungs", "left_atrium", "left_ventricle", "body_tissues", "right_atrium"]);
    await answerChoice(page, Q(3), "right_lung_left");
    await answerChoice(page, Q(4), "left_body_right");
    await page.locator('[data-section-next="checkpoint1"]').click();
    await answerChoice(page, Q(5), "oxygen_up_co2_down");
    await answerChoice(page, Q(6), "exchange_not_make");
    await answerChoice(page, Q(7), "pulmonary_exception");
    await answerChoice(page, Q(8), "lung_exchange");
    await page.locator('[data-section-next="checkpoint2"]').click();
    checkpointText = await page.locator("#screen").textContent();
    for (const legacy of ["肺部交換資料", "動靜脈判斷卡"]) {
      assert(!checkpointText.includes(legacy), `checkpoint2 should not show legacy evidence: ${legacy}`);
    }
    await answerChoice(page, Q(9), "blood_to_tissue");
    await answerChoice(page, Q(10), "tissue_to_blood");
    await answerChoice(page, Q(11), "capillary");
    await answerChoice(page, Q(12), "fluid_lymph_recovery");
    await answerChoice(page, Q(13), "direction_route_first");
    await answerChoice(page, Q(14), "systemic");
    checkpointText = await page.locator("#screen").textContent();
    for (const legacy of ["全身微血管交換站", "組織液與淋巴基礎", "體循環路徑判斷"]) {
      assert(!checkpointText.includes(legacy), `checkpoint3 should not show legacy evidence: ${legacy}`);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator(".feedback-columns").waitFor();
    await assertAtTop(page, "checkpoint3 to review");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('[data-next="reflection"]').click();
    await page.locator("#submitMission").waitFor();
    await assertAtTop(page, "review to reflection");
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    await assertAtTop(page, "reflection to result");
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    assert.equal(await page.locator(".result-panel [data-relogin='true']").count(), 1, "result should expose one relogin/retry entry");
    assert.equal(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), true, "result should keep earned-only badge area");
    assert.equal(await page.locator(".result-stack").textContent().then((text) => text.includes("本單元 15 枚徽章")), false, "result must not render the full badge catalog");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('[data-next="achievements"]').click();
    await page.locator(".achievements-stack").waitFor();
    await assertAtTop(page, "result to achievements");
    assert.equal(await page.locator("[data-bq-achievements-overview-only='true']").count(), 1, "achievements should be overview-only");
    assert.equal(await page.locator("[data-bq-unit-achievements='human_circulation']").count(), 0, "achievements must not render a unit badge wall");
    assert.equal(await page.locator(".achievements-stack [data-relogin='true']").count(), 1, "achievements should expose one relogin/retry entry");
    assert.equal(await page.locator(".achievements-stack .title-card").count(), 0, "achievements should not render legacy local title-card");
    const achievementOrder = await page.evaluate(() => {
      const title = document.querySelector(".bq-title-avatar-card");
      const overview = document.querySelector(".bq-all-unit-badge-overview");
      const nodes = [...document.querySelectorAll("#screen *")];
      return {
        overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
        titleCount: document.querySelectorAll(".bq-title-avatar-card").length,
        summaryCount: document.querySelectorAll(".bq-unit-badge-summary").length
      };
    });
    assert.equal(achievementOrder.titleCount, 1, "title avatar card should be exactly one");
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    assert.equal(achievementOrder.overviewCount, 1, "whole-book overview should be exactly one");
    assert.equal(achievementOrder.summaryCount, 52, "whole-book overview should keep 52 unit summaries");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    await page.locator('[data-nav="rules"]').click();
    await page.locator(".rule-list").waitFor();
    assert.equal(await page.locator("[data-relogin='true']").count(), 1, "rules should expose one relogin/retry entry");
    await page.locator('[data-next="result"]').click();
    await page.locator(".result-panel").waitFor();
    await page.locator('[data-nav="login"]').click();
    await page.locator("#guestBtn").waitFor();
    const resetState = await page.evaluate(() => ({
      screen: window.__human_circulationTest.state().screen,
      hasStudent: Boolean(window.__human_circulationTest.state().student),
      attemptId: window.__human_circulationTest.state().attempt_id,
      historyCount: JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]").length
    }));
    assert.equal(resetState.screen, "login", "relogin should return to login");
    assert.equal(resetState.hasStudent, false, "relogin should clear current student");
    assert.equal(resetState.attemptId, "", "relogin should clear current attempt id");
    assert(resetState.historyCount >= 1, "relogin must preserve attempts history");
    assert.deepEqual(failedImages, [], "image requests should not fail");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("human circulation full-flow layout regression passed");
