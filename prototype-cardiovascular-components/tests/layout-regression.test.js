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
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-cardiovascular-components")
  : sourceRoot;
const Q = (n) => `cardiovascular_components_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function sceneVisibilityMetrics(buffer) {
  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = Math.max(1, Math.floor(meta.width * 0.55));
  const raw = await image.extract({ left: 0, top: 0, width, height: meta.height }).raw().toBuffer();
  let warmPixels = 0;
  let vividPixels = 0;
  const channels = meta.channels || 3;
  const pixels = raw.length / channels;
  for (let index = 0; index < raw.length; index += channels) {
    const r = raw[index];
    const g = raw[index + 1];
    const b = raw[index + 2];
    if (r > 110 && g > 55 && b < 95 && r > g * 1.15) warmPixels += 1;
    if (Math.max(r, g, b) - Math.min(r, g, b) > 45) vividPixels += 1;
  }
  return {
    warmRatio: warmPixels / pixels,
    vividRatio: vividPixels / pixels
  };
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
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260727-cardiovascular-components-relogin-v1`);
    await page.locator("#guestBtn").click();
    await page.locator(".bq-brief-scene-image").waitFor();
    const briefScene = await page.evaluate(() => {
      const stage = document.querySelector(".bq-brief-scene-stage");
      const image = document.querySelector(".bq-brief-scene-image");
      const avatar = document.querySelector(".bq-brief-student-avatar");
      const stageStyle = getComputedStyle(stage);
      const imageStyle = getComputedStyle(image);
      const stageBox = stage.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      const avatarBox = avatar.getBoundingClientRect();
      return {
        stageBackgroundImage: stageStyle.backgroundImage,
        stageBackgroundSize: stageStyle.backgroundSize,
        imageObjectFit: imageStyle.objectFit,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        imageWidth: imageBox.width,
        imageHeight: imageBox.height,
        stageWidth: stageBox.width,
        stageHeight: stageBox.height,
        avatarCount: document.querySelectorAll(".bq-brief-student-avatar").length,
        avatarWidth: avatarBox.width,
        avatarHeight: avatarBox.height
      };
    });
    assert(briefScene.stageBackgroundImage.includes("cardiovascular-components-briefing-azhe-wide.webp"), "brief stage should keep a contain scene fallback");
    assert.equal(briefScene.stageBackgroundSize, "contain", "brief stage fallback must use contain");
    assert.equal(briefScene.imageObjectFit, "contain", "brief scene image must use contain");
    assert(briefScene.naturalWidth > 0 && briefScene.naturalHeight > 0, "brief scene image failed to load");
    assert(briefScene.imageWidth > briefScene.stageWidth * 0.94, "brief scene image should fill the stage width");
    assert(briefScene.imageHeight > briefScene.stageHeight * 0.9, "brief scene image should fill the stage height");
    assert.equal(briefScene.avatarCount, 1, "brief title avatar should be exactly one");
    assert(briefScene.avatarWidth > 48 && briefScene.avatarHeight > 120, "brief title avatar should be visible");
    const scenePng = await page.locator(".bq-brief-scene-stage").screenshot();
    const visibility = await sceneVisibilityMetrics(scenePng);
    assert(visibility.warmRatio > 0.08, `brief scene must visibly show the approved Azhe/cardiovascular image, warmRatio=${visibility.warmRatio}`);
    assert(visibility.vividRatio > 0.24, `brief scene must not collapse to a flat dark stage, vividRatio=${visibility.vividRatio}`);
    await page.locator('[data-next="scan"]').click();
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-question-id="${Q(3)}"] select`).count(), 3, "heart mapping rows missing");
    assert.equal(await page.locator(`[data-question-id="${Q(10)}"]`).count(), 0, "checkpoint routing leaked later question");
    await answerChoice(page, Q(1), "heart_vessels_blood");
    await answerChoice(page, Q(2), "push_blood_flow");
    await answerMapping(page, Q(3), { atria: "receive_blood", ventricles: "push_blood_out", valves: "one_way_flow" });
    await answerChoice(page, Q(4), "atria_receive_ventricles_push");
    await answerChoice(page, Q(5), "valves_reduce_backflow");
    await page.locator('[data-section-next="checkpoint1"]').click();
    await answerMapping(page, Q(6), { artery: "away_from_heart", vein: "back_to_heart", capillary: "exchange_near_tissue" });
    await answerChoice(page, Q(7), "direction_not_oxygen_only");
    await answerChoice(page, Q(8), "artery");
    await answerChoice(page, Q(9), "capillary");
    await page.locator('[data-section-next="checkpoint2"]').click();
    await answerMapping(page, Q(10), { plasma: "liquid_transport", red_blood_cell: "oxygen_transport", white_blood_cell: "defense", platelet: "clotting" });
    await answerChoice(page, Q(11), "red_blood_cell");
    await answerMapping(page, Q(12), { defense_case: "white_blood_cell", wound_clotting: "platelet", liquid_environment: "plasma" });
    await answerChoice(page, Q(13), "heartbeat_vessel_pulse");
    await answerChoice(page, Q(14), "pressure_on_vessel_wall");
    await orderSequence(page, Q(15), ["heart_contracts", "blood_enters_vessels", "blood_components_carry", "capillary_exchange"]);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.waitForFunction(() => window.scrollY <= 8);
    assert(await page.evaluate(() => window.scrollY <= 8), "checkpoint3 to review should reset to page top");
    await page.locator('[data-next="reflection"]').click();
    await page.waitForFunction(() => window.scrollY <= 8);
    assert(await page.evaluate(() => window.scrollY <= 8), "review to reflection should reset to page top");
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    await page.waitForFunction(() => window.scrollY <= 8);
    assert(await page.evaluate(() => window.scrollY <= 8), "reflection to result should reset to page top");
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    assert.equal(await page.locator(".result-panel [data-relogin='true']").count(), 1, "result should expose one relogin/retry entry");
    assert.equal(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), true, "result should keep earned-only badge area");
    assert.equal(await page.locator(".result-stack").textContent().then((text) => text.includes("本單元 14 枚徽章")), false, "result must not render the full badge catalog");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('[data-next="achievements"]').click();
    await page.locator(".achievements-stack").waitFor();
    await page.waitForFunction(() => window.scrollY <= 8);
    assert(await page.evaluate(() => window.scrollY <= 8), "result to achievements should reset to page top");
    assert.equal(await page.locator("[data-bq-achievements-overview-only='true']").count(), 1, "achievements should be overview-only");
    assert.equal(await page.locator("[data-bq-unit-achievements='cardiovascular_components']").count(), 0, "achievements must not render a unit badge wall");
    assert.equal(await page.locator(".achievements-stack [data-relogin='true']").count(), 1, "achievements should expose one relogin/retry entry");
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    await page.locator('[data-nav="rules"]').click();
    await page.locator(".rule-list").waitFor();
    assert.equal(await page.locator("[data-relogin='true']").count(), 1, "rules should expose one relogin/retry entry");
    await page.locator('[data-next="result"]').click();
    await page.locator(".result-panel").waitFor();
    await page.locator('[data-nav="login"]').click();
    await page.locator("#guestBtn").waitFor();
    const resetState = await page.evaluate(() => ({
      screen: window.__cardiovascular_componentsTest.state().screen,
      hasStudent: Boolean(window.__cardiovascular_componentsTest.state().student),
      attemptId: window.__cardiovascular_componentsTest.state().attempt_id,
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
console.log("cardiovascular components full-flow layout regression passed");
