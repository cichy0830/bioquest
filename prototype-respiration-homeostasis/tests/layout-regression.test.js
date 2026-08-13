#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-respiration-homeostasis")
  : sourceRoot;
const Q = (n) => `respiration_homeostasis_q${String(n).padStart(2, "0")}`;
const VERSION = "20260813-respiration-homeostasis-mapping-v1";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function expectTop(page, label) {
  await page.waitForFunction(() => window.scrollY === 0 && document.documentElement.scrollTop === 0 && (!document.body || document.body.scrollTop === 0));
  assert.equal(await page.evaluate(() => document.querySelector(".main-stage")?.scrollTop || 0), 0, `${label} main-stage scroll should reset`);
}

async function clickAndExpectTop(page, selector, label) {
  await page.evaluate(() => window.scrollTo(0, 520));
  await page.locator(selector).click();
  await expectTop(page, label);
}

async function assertBriefSceneLoaded(page, label) {
  const scene = await page.evaluate((expectedVersion) => {
    const images = [...document.querySelectorAll(".bq-brief-scene-image")];
    const avatars = [...document.querySelectorAll(".bq-brief-student-avatar")];
    return {
      sceneCount: images.length,
      sceneNaturalWidth: images[0]?.naturalWidth || 0,
      sceneSrc: images[0]?.currentSrc || images[0]?.src || "",
      avatarCount: avatars.length,
      avatarNaturalWidth: avatars[0]?.naturalWidth || 0,
      fallbackCount: document.querySelectorAll(".brief-scene-fallback").length,
      briefOwlCount: document.querySelectorAll(".brief-scene .owl-frame, .brief-scene .bq-report-assistant, .brief-scene .prep-owl-hero").length,
      overflow: document.documentElement.scrollWidth > innerWidth
    };
  }, VERSION);
  assert.equal(scene.sceneCount, 1, `${label} should render exactly one briefing scene image`);
  assert(scene.sceneNaturalWidth > 0, `${label} briefing scene should load`);
  assert(scene.sceneSrc.includes("assets/respiration-homeostasis-briefing-azhe-wide.webp"), `${label} should use approved U24 scene`);
  assert(scene.sceneSrc.includes(`v=${VERSION}`), `${label} scene URL should carry runtime cache`);
  assert.equal(scene.avatarCount, 1, `${label} should render exactly one title avatar`);
  assert(scene.avatarNaturalWidth > 0, `${label} title avatar should load`);
  assert.equal(scene.fallbackCount, 0, `${label} should not show missing-scene fallback`);
  assert.equal(scene.briefOwlCount, 0, `${label} brief must not contain owl`);
  assert.equal(scene.overflow, false, `${label} brief should not overflow horizontally`);
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
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${VERSION}`);
    await page.locator("#guestBtn").click();
    await page.locator(".brief-hero").waitFor();
    await assertBriefSceneLoaded(page, `brief ${viewport.width}`);
    await clickAndExpectTop(page, '[data-next="scan"]', "brief to prepare");
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await clickAndExpectTop(page, '[data-next="checkpoint1"]', "prepare to checkpoint1");
    await answerChoice(page, Q(1), "breathing_and_cellular_respiration_distinct");
    await answerChoice(page, Q(2), "cells_use_oxygen_for_energy");
    await page.evaluate((qid) => {
      window.__respiration_homeostasisTest.state().answers[`${qid}_sequence`] = ["nose_or_mouth", "trachea", "bronchi", "lungs", "alveoli"];
    }, Q(3));
    await answerMapping(page, Q(4), { nasal_cavity: "filter_warm_moisten", trachea: "air_passage_to_lungs", bronchi: "branches_to_lungs", alveoli: "gas_exchange_site" });
    await clickAndExpectTop(page, '[data-section-next="checkpoint1"]', "checkpoint1 to checkpoint2");
    await answerChoice(page, Q(5), "alveoli_thin_many_capillaries");
    await answerChoice(page, Q(6), "alveoli_o2_in_co2_out");
    await answerChoice(page, Q(7), "inhalation_diaphragm_down_chest_expands");
    await answerChoice(page, Q(8), "exhalation_diaphragm_up_chest_smaller");
    await clickAndExpectTop(page, '[data-section-next="checkpoint2"]', "checkpoint2 to checkpoint3");
    await answerMapping(page, Q(9), { diaphragm_down: "inhale", chest_expands: "inhale", air_enters_lungs: "inhale", diaphragm_up: "exhale", chest_smaller: "exhale", air_leaves_lungs: "exhale" });
    await answerChoice(page, Q(10), "exhaled_air_less_o2_more_co2");
    await answerChoice(page, Q(11), "exercise_breathing_gas_balance");
    await answerMapping(page, Q(12), { human: "lungs_alveoli", fish: "gills", insect: "tracheal_system", plant_leaf: "stomata" });
    await answerChoice(page, Q(13), "plants_also_respire_exchange_gases");
    await answerChoice(page, Q(14), "alveoli_exchange_belongs_respiration");
    await clickAndExpectTop(page, '[data-section-next="checkpoint3"]', "checkpoint3 to review");
    assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "feedback mentor should be exactly one");
    assert.equal(await page.locator(".mentor-card").count(), 0, "legacy mentor-card should be removed");
    await clickAndExpectTop(page, '[data-next="reflection"]', "review to reflection");
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    await expectTop(page, "reflection to result");
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, "result relogin entry missing");
    assert(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), "result earned-only heading missing");
    assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, "result should not render pending badge images");
    await clickAndExpectTop(page, '[data-next="achievements"]', "result to achievements");
    await page.locator(".achievements-stack").waitFor();
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    const achievementOrder = await page.evaluate(() => {
      const titleCard = document.querySelector(".bq-title-avatar-card");
      const overview = document.querySelector(".bq-all-unit-badge-overview");
      return {
        reloginCount: document.querySelectorAll(".achievements-stack [data-relogin]").length,
        unitWallCount: document.querySelectorAll(".achievements-stack [data-bq-unit-achievements], .achievements-stack .badge-wall").length,
        titleBeforeOverview: Boolean(titleCard && overview && titleCard.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING),
        titleCount: document.querySelectorAll(".bq-title-avatar-card").length,
        overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
        summaryCount: document.querySelectorAll(".bq-unit-badge-summary").length
      };
    });
    assert.equal(achievementOrder.reloginCount, 1, "achievements relogin entry missing");
    assert.equal(achievementOrder.unitWallCount, 0, "achievements must be overview-only");
    assert.equal(achievementOrder.titleBeforeOverview, true, "title card should appear before overview");
    assert.equal(achievementOrder.titleCount, 1, "title card should be exactly one");
    assert.equal(achievementOrder.overviewCount, 1, "whole-book overview should be exactly one");
    assert.equal(achievementOrder.summaryCount, 52, "whole-book overview should show 52 units");
    await clickAndExpectTop(page, '[data-nav="rules"]', "achievements to rules");
    assert.equal(await page.locator("[data-relogin]").count(), 1, "rules relogin entry missing");
    await clickAndExpectTop(page, '[data-next="result"]', "rules back to result");
    await page.locator('[data-nav="login"]').click();
    await page.locator("#guestBtn").waitFor();
    assert.equal(await page.evaluate(() => window.__respiration_homeostasisTest.state().screen), "login", "submitted sidebar login should reset to login");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    assert.deepEqual(failedImages, [], "image requests should not fail");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("respiration homeostasis full-flow layout regression passed");
