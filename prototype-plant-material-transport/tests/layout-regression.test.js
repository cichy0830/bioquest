#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function answerSet(page, qid, values) {
  for (const value of values) await page.locator(`[data-toggle-set="${qid}"][data-value="${value}"]`).click();
  await page.locator(`[data-confirm-set="${qid}"]`).click();
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

async function forceScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 640);
    document.documentElement.scrollTop = 640;
    document.body.scrollTop = 640;
    const mainStage = document.querySelector(".main-stage");
    if (mainStage) mainStage.scrollTop = 640;
  });
}

async function expectAtTop(page, label) {
  await page.waitForTimeout(80);
  const scroll = await page.evaluate(() => ({
    windowY: window.scrollY,
    documentY: document.documentElement.scrollTop,
    bodyY: document.body.scrollTop,
    mainY: document.querySelector(".main-stage")?.scrollTop || 0
  }));
  assert.equal(scroll.windowY, 0, `${label} should reset window scroll`);
  assert.equal(scroll.documentY, 0, `${label} should reset document scroll`);
  assert.equal(scroll.bodyY, 0, `${label} should reset body scroll`);
  assert.equal(scroll.mainY, 0, `${label} should reset main-stage scroll`);
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    await page.addInitScript(() => { window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, student: { student_id: "guest", student_name: "老師測試帳號" } }) }); });
    const image404s = [];
    page.on("response", (response) => {
      if (response.status() >= 400 && /\.(?:png|jpg|jpeg|webp|svg)(?:\?|$)/i.test(response.url())) image404s.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260727-plant-material-transport-current-ia-retry-v1`);
    await page.locator("#guestBtn").click();
    await expectAtTop(page, "guest login");
    await forceScroll(page);
    await page.locator('[data-next="scan"]').click();
    await expectAtTop(page, "brief to scan");
    const prep = page.locator(".prep-owl-hero");
    assert.equal(await prep.count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow");
    await forceScroll(page);
    await page.locator('[data-next="checkpoint1"]').click();
    await expectAtTop(page, "scan to checkpoint1");
    assert.ok(await page.locator('[data-question-id="q03"] select').count() === 3, "source mapping rows missing");
    assert.ok(await page.locator('[data-question-id="q09"]').count() === 0, "checkpoint routing leaked later question");
    await answerChoice(page, "q01", "material_transport");
    await answerChoice(page, "q02", "root_hair_soil_contact");
    await answerMapping(page, "q03", { water: "root_source", minerals: "root_source", sugar: "leaf_source" });
    await answerChoice(page, "q04", "water_moves_up_inside");
    await forceScroll(page);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await expectAtTop(page, "checkpoint1 to checkpoint2");
    await answerChoice(page, "q05", "root_xylem_upward");
    await answerChoice(page, "q06", "phloem");
    await answerChoice(page, "q07", "roots_water_leaves_sugar");
    await answerChoice(page, "q08", "phloem_to_needed_parts");
    await forceScroll(page);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await expectAtTop(page, "checkpoint2 to checkpoint3");
    await orderSequence(page, "q09", ["soil_contact", "root_water_entry", "xylem_upward_transport", "water_reaches_leaf", "transpiration_from_stoma"]);
    await answerChoice(page, "q10", "transpiration_transport_link");
    await answerChoice(page, "q11", "water_loss_and_gas_exchange");
    await answerChoice(page, "q12", "more_leaves_more_water_drops");
    await answerSet(page, "q13", ["plant_type_size", "leaf_area", "light_time", "temperature"]);
    await answerChoice(page, "q14", "xylem_water_phloem_sugar");
    await forceScroll(page);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await expectAtTop(page, "checkpoint3 to review");
    await forceScroll(page);
    await page.locator('[data-next="reflection"]').click();
    await expectAtTop(page, "review to reflection");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    await expectAtTop(page, "reflection to result");
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    const readyEarnedCount = await page.evaluate(() => {
      const api = window.__plant_material_transportTest;
      const result = api.state().result;
      return result.earned_badges.filter((id) => api.badges.find((badge) => badge.id === id)?.image_status === "ready").length;
    });
    assert.equal(await page.locator(".result-stack .badge-wall img").count(), readyEarnedCount, "result should only render earned badges with ready images");
    assert.equal(await page.locator(".result-stack .bq-badge-asset-pending").count(), 0, "result should not show pending badge placeholders");
    const resultBadgeSrcs = await page.locator(".result-stack .badge-wall img").evaluateAll((imgs) => imgs.map((img) => img.currentSrc));
    assert.equal(resultBadgeSrcs.every((src) => src.includes("20260727-plant-material-transport-current-ia-retry-v1")), true, "ready badge srcs should carry runtime cache");
    await forceScroll(page);
    await page.locator('[data-next="achievements"]').click();
    await page.locator(".achievements-stack").waitFor();
    await expectAtTop(page, "result to achievements");
    assert.equal(await page.locator('[data-bq-unit-achievements="plant_material_transport"]').count(), 0, "achievements should not duplicate unit badge wall");
    assert.equal(await page.locator("[data-bq-badge-overview]").count(), 1, "52-unit overview missing");
    assert.equal(await page.locator(".bq-title-avatar-card").count(), 1, "title avatar should be injected exactly once");
    assert.equal(await page.locator("[data-relogin]").count() > 0, true, "submitted achievements should offer relogin");
    await page.evaluate(() => localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_attempt", unit_id: "plant_material_transport" }])));
    await page.locator("[data-relogin]").first().click();
    await page.locator("#studentId").waitFor();
    const resetProbe = await page.evaluate(() => {
      const api = window.__plant_material_transportTest;
      return {
        screen: api.state().screen,
        student: api.state().student,
        result: api.state().result,
        submitted: api.state().submitted,
        attemptCount: api.loadAttempts().length
      };
    });
    assert.deepEqual(resetProbe, { screen: "login", student: null, result: null, submitted: false, attemptCount: 1 }, "relogin should reset current attempt only");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    assert.deepEqual(image404s, [], "image requests should not 404");
    await page.close();
  }
} finally { await browser.close(); }
console.log("plant material transport full-flow layout regression passed");
