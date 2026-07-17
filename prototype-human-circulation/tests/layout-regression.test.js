#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-human-circulation")
  : sourceRoot;
const Q = (n) => `human_circulation_q${String(n).padStart(2, "0")}`;
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
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260718-human-circulation-ready-v1`);
    await page.locator("#guestBtn").click();
    await page.locator('[data-next="scan"]').click();
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-sequence="${Q(2)}"] [data-sequence-item]`).count(), 6, "route sequence cards missing");
    assert.equal(await page.locator(`[data-question-id="${Q(9)}"]`).count(), 0, "checkpoint routing leaked later question");
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
    await answerChoice(page, Q(9), "blood_to_tissue");
    await answerChoice(page, Q(10), "tissue_to_blood");
    await answerChoice(page, Q(11), "capillary");
    await answerChoice(page, Q(12), "fluid_lymph_recovery");
    await answerChoice(page, Q(13), "direction_route_first");
    await answerChoice(page, Q(14), "systemic");
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
console.log("human circulation full-flow layout regression passed");
