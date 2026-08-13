#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-excretion-water-homeostasis")
  : sourceRoot;
const Q = (n) => `excretion_water_homeostasis_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
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
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260813-excretion-water-homeostasis-mapping-v1`);
    await page.locator("#guestBtn").click();
    await page.locator('[data-next="scan"]').click();
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => window.scrollY), 0, "scan should reset scroll");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.equal(await page.evaluate(() => window.scrollY), 0, "checkpoint1 should reset scroll");
    await answerChoice(page, Q(1), "excretion_not_egestion");
    await answerChoice(page, Q(2), "metabolic_waste_examples");
    await answerChoice(page, Q(3), "nitrogenous_waste_urea_example");
    await page.locator('[data-section-next="checkpoint1"]').click();
    await answerMapping(page, Q(4), { kidney: "urine_formation", ureter: "urine_to_bladder", bladder: "urine_storage", urethra: "urine_out_body" });
    await page.evaluate((qid) => {
      window.__excretion_water_homeostasisTest.state().answers[`${qid}_sequence`] = ["kidney", "ureter", "bladder", "urethra"];
    }, Q(5));
    await answerChoice(page, Q(6), "kidney_forms_urine_from_blood");
    await answerChoice(page, Q(7), "urine_contains_water_urea_salts");
    await page.locator('[data-section-next="checkpoint2"]').click();
    await answerChoice(page, Q(8), "sweating_less_water_less_urine");
    await answerChoice(page, Q(9), "more_water_more_urine_data");
    assert.equal(await page.locator("#u25-q09-water-intake-urine-output-data-chart").count(), 1, "q09 water chart missing");
    assert(await page.locator("#u25-q09-water-intake-urine-output-data-chart").textContent().then((text) => text.includes("量（mL）") && text.includes("觀察時段")), "q09 chart should expose axes");
    await answerChoice(page, Q(10), "water_intake_needed_for_balance");
    await answerMapping(page, Q(11), { drinking_water: "water_gain", water_in_food: "water_gain", urination: "water_loss", sweating: "water_loss" });
    await answerChoice(page, Q(12), "nitrogenous_waste_forms_vary");
    await answerChoice(page, Q(13), "kidney_forms_bladder_stores");
    await answerChoice(page, Q(14), "kidney_urine_belongs_excretion_water");
    await page.locator('[data-section-next="checkpoint3"]').click();
    assert.equal(await page.evaluate(() => window.scrollY), 0, "review should reset scroll");
    assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "review mentor should be exactly one");
    await page.locator('[data-next="reflection"]').click();
    assert.equal(await page.evaluate(() => window.scrollY), 0, "reflection should reset scroll");
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    assert.equal(await page.evaluate(() => window.scrollY), 0, "result should reset scroll");
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, "result relogin entry missing");
    assert.equal(await page.locator('.result-stack [data-bq-unit-achievements="excretion_water_homeostasis"] .badge').count(), 0, "result should not show controlled-pending badge cards");
    await page.locator('[data-next="achievements"]').click();
    await page.locator(".achievements-stack").waitFor();
    assert.equal(await page.evaluate(() => window.scrollY), 0, "achievements should reset scroll");
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    assert.equal(await page.locator('.achievements-stack [data-bq-unit-achievements="excretion_water_homeostasis"]').count(), 0, "achievements should not show unit badge wall");
    assert.equal(await page.locator(".achievements-stack [data-relogin]").count(), 1, "achievements relogin entry missing");
    await page.locator('[data-nav="rules"]').click();
    await page.locator(".rule-list").waitFor();
    assert.equal(await page.locator("[data-relogin]").count(), 1, "rules relogin entry missing");
    assert.equal(await page.locator('[data-next="result"]').count(), 1, "submitted rules return should target result");
    await page.locator("[data-relogin]").click();
    await page.locator("#loginBtn").waitFor();
    assert.equal(await page.evaluate(() => window.__excretion_water_homeostasisTest.state().student), null, "relogin reset should clear current student");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    assert.deepEqual(failedImages, [], "image requests should not fail");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("excretion water homeostasis full-flow layout regression passed");
