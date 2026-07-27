#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-egg-observation")
  : sourceRoot;
const Q = (n) => `egg_observation_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
let failure = null;

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  await page.locator(`select[data-map-question="${qid}"]`).first().waitFor();
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function forceScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 520);
    document.documentElement.scrollTop = 520;
    document.body.scrollTop = 520;
    const stage = document.querySelector(".main-stage");
    if (stage) stage.scrollTop = 520;
  });
}

async function assertTop(page, label) {
  await page.waitForTimeout(80);
  const positions = await page.evaluate(() => ({
    windowY: window.scrollY,
    documentTop: document.documentElement.scrollTop,
    bodyTop: document.body.scrollTop,
    stageTop: document.querySelector(".main-stage")?.scrollTop || 0
  }));
  assert(positions.windowY <= 1, `${label}: window should reset to top`);
  assert(positions.documentTop <= 1, `${label}: document should reset to top`);
  assert(positions.bodyTop <= 1, `${label}: body should reset to top`);
  assert(positions.stageTop <= 1, `${label}: main stage should reset to top`);
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
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260727-egg-observation-tranche1-v1`);
    await page.locator("#guestBtn").click();
    assert(await page.locator(".identity-confirm").textContent().then((text) => text.includes("guest 測試身分")), "brief should confirm guest identity");
    await forceScroll(page);
    await page.locator('[data-next="scan"]').click();
    await assertTop(page, "brief to scan");
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await forceScroll(page);
    await page.locator('[data-next="checkpoint1"]').click();
    await assertTop(page, "scan to checkpoint1");
    await answerChoice(page, Q(1), "safe_raw_egg_observation");
    await answerChoice(page, Q(2), "shell_visible_externally");
    await answerChoice(page, Q(3), "shell_protection_gas_exchange");
    await page.evaluate((qid) => {
      window.__egg_observationTest.state().answers[`${qid}_sequence`] = ["prepare_tray_cleaning_wash_hands", "observe_external_shell", "carefully_open_and_observe_cross_section", "record_structures_locations_functions", "clean_shell_liquid_wash_hands"];
    }, Q(4));
    await forceScroll(page);
    await page.locator('[data-section-next="checkpoint1"]').click();
    await assertTop(page, "checkpoint1 to checkpoint2");
    await page.locator(`select[data-map-question="${Q(5)}"]`).first().waitFor();
    await page.locator(".egg-cross-section-figure img").waitFor();
    await page.waitForFunction(() => {
      const img = document.querySelector(".egg-cross-section-figure img");
      return Boolean(img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
    });
    const crossSection = await page.locator(".egg-cross-section-figure img").evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      currentSrc: img.currentSrc
    }));
    assert(crossSection.naturalWidth > 0 && crossSection.naturalHeight > 0, "q05 cross-section image should load");
    assert(crossSection.currentSrc.includes("egg-observation-cross-section-hotspot-base"), "q05 should use approved cross-section assets");
    assert.equal(await page.locator(".egg-hotspot").count(), 4, "q05 should show four neutral A-D hotspots");
    await answerMapping(page, Q(5), { outer_hard_shell: "eggshell", translucent_region: "albumen", yellow_round_region: "yolk", blunt_end_air_space: "air_cell" });
    await answerMapping(page, Q(6), { eggshell: "protects_inside", albumen: "water_and_cushion", yolk: "nutrient_supply", air_cell: "air_space" });
    await answerChoice(page, Q(7), "yolk_nutrient_not_embryo");
    await answerChoice(page, Q(8), "air_cell_blunt_end_space");
    await answerChoice(page, Q(9), "chalaza_anchors_yolk");
    await forceScroll(page);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await assertTop(page, "checkpoint2 to checkpoint3");
    await page.locator(`[data-answer="${Q(10)}"]`).first().waitFor();
    await answerChoice(page, Q(10), "germinal_disc_on_yolk_surface");
    await answerChoice(page, Q(11), "egg_not_always_developing_embryo");
    await answerChoice(page, Q(12), "evidence_then_structure_inference");
    await answerMapping(page, Q(13), { sperm_egg_zygote: "u29_sexual_reproduction", shell_albumen_yolk_aircell: "u30_egg_observation", stamen_pistil_labeling: "u31_flower_observation", potato_tuber_new_plant: "u28_asexual_reproduction" });
    await answerChoice(page, Q(14), "egg_cross_section_observation_belongs_u30");
    await forceScroll(page);
    await page.locator('[data-section-next="checkpoint3"]').click();
    await assertTop(page, "checkpoint3 to review");
    assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "review mentor should be exactly one shared mentor");
    await forceScroll(page);
    await page.locator('[data-next="reflection"]').click();
    await assertTop(page, "review to reflection");
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    await assertTop(page, "reflection to result");
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    await forceScroll(page);
    await page.locator('[data-next="achievements"]').click();
    await assertTop(page, "result to achievements");
    await page.locator(".achievements-stack").waitFor();
    assert.equal(await page.locator('.title-avatar-card.achievements').count(), 1, "title avatar card should be exactly one");
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    assert.equal(await page.locator('.badge-wall').count(), 0, "achievements should not render local unit badge wall");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    assert.deepEqual(failedImages, [], "image requests should not fail");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    await page.close();
  }
} catch (error) {
  failure = error;
} finally {
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1000))
  ]);
}
if (failure) {
  console.error(failure);
  process.exit(1);
}
console.log("egg observation full-flow layout regression passed");
process.exit(0);
