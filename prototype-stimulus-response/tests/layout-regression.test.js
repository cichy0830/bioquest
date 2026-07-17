#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-stimulus-response")
  : sourceRoot;
const Q = (n) => `stimulus_response_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

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
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260718-stimulus-response-ready-v1`);
    await page.locator("#guestBtn").click();
    await page.locator('[data-next="scan"]').click();
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-sequence="${Q(7)}"] [data-sequence-item]`).count(), 0, "sequence should not appear in checkpoint1");
    assert.equal(await page.locator(`[data-question-id="${Q(9)}"]`).count(), 0, "checkpoint routing leaked later question");
    await answerChoice(page, Q(1), "bell_sound");
    await answerChoice(page, Q(2), "pull_hand");
    await answerMapping(page, Q(3), { hot_cup: "stimulus", pull_hand: "response", bright_light: "stimulus", blink: "response" });
    await answerChoice(page, Q(4), "movement_is_response");
    await page.locator('[data-section-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-sequence="${Q(7)}"] [data-sequence-item]`).count(), 5, "stimulus-response sequence cards missing");
    await answerChoice(page, Q(5), "eye_receptor");
    await answerChoice(page, Q(6), "leg_muscle");
    await orderSequence(page, Q(7), ["stimulus_appears", "receptor_receives", "signal_coordination", "effector_acts", "response_happens"]);
    await answerMapping(page, Q(8), { food_smell: "stimulus", nose_receptor: "receptor", neck_muscle: "effector", turn_head: "response" });
    await page.locator('[data-section-next="checkpoint2"]').click();
    await answerChoice(page, Q(9), "not_always_conscious");
    await answerChoice(page, Q(10), "reaction_time");
    await answerChoice(page, Q(11), "second_shorter");
    await answerChoice(page, Q(12), "practice_possible");
    await answerChoice(page, Q(13), "controlled_repeated");
    await answerChoice(page, Q(14), "single_trial_caution");
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    await page.locator('[data-next="achievements"]').click();
    await page.locator(".achievements-stack").waitFor();
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    assert.deepEqual(failedImages, [], "image requests should not fail");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("stimulus response full-flow layout regression passed");
