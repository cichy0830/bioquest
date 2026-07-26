#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-temperature-glucose-homeostasis")
  : sourceRoot;
const Q = (n) => `temperature_glucose_homeostasis_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function readScrollSnapshot(page) {
  return page.evaluate(() => {
    const mainStage = document.querySelector(".main-stage");
    return {
      windowY: window.scrollY,
      docTop: document.documentElement.scrollTop,
      bodyTop: document.body.scrollTop,
      mainStageTop: mainStage ? mainStage.scrollTop : 0
    };
  });
}

async function scrollDown(page, amount = 720) {
  await page.evaluate((nextAmount) => {
    window.scrollTo(0, nextAmount);
    document.documentElement.scrollTop = nextAmount;
    document.body.scrollTop = nextAmount;
    document.querySelector(".main-stage")?.scrollTo?.(0, nextAmount);
  }, amount);
}

async function expectResetAfter(page, action, expectedScreen) {
  await scrollDown(page);
  await action();
  await page.waitForFunction((screenName) => document.querySelector("#screen")?.dataset.bioquestScreen === screenName, expectedScreen);
  await page.waitForFunction(() => {
    const mainStage = document.querySelector(".main-stage");
    return window.scrollY === 0
      && document.documentElement.scrollTop === 0
      && document.body.scrollTop === 0
      && (!mainStage || mainStage.scrollTop === 0);
  });
  const scroll = await readScrollSnapshot(page);
  assert.deepEqual(scroll, { windowY: 0, docTop: 0, bodyTop: 0, mainStageTop: 0 }, `${expectedScreen} should reset scroll`);
}

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function expectEvidenceChart(page, chartId, assetName) {
  const chart = page.locator(`.u26-evidence-chart[data-chart-id="${chartId}"]`);
  await chart.waitFor();
  const box = await chart.boundingBox();
  assert(box && box.width > 280 && box.height > 180, `${chartId} should be visibly sized`);
  const details = await chart.evaluate((node, expectedAsset) => {
    const svg = node.querySelector("svg");
    const image = node.querySelector("image");
    const text = node.textContent || "";
    const href = image?.getAttribute("href") || "";
    return {
      hasSvg: !!svg,
      href,
      text,
      pointCount: node.querySelectorAll(".u26-chart-point").length,
      lineCount: node.querySelectorAll(".u26-chart-line").length,
      overflows: node.getBoundingClientRect().right > window.innerWidth + 1,
      hasAsset: href.includes(expectedAsset)
    };
  }, assetName);
  assert.equal(details.hasSvg, true, `${chartId} should render inline svg`);
  assert.equal(details.hasAsset, true, `${chartId} should use approved asset`);
  assert(details.href.includes("20260726-temperature-glucose-charts-v1"), `${chartId} href should include chart cache`);
  assert(details.pointCount >= 5, `${chartId} should render data points`);
  assert(details.lineCount >= 1, `${chartId} should render data line`);
  assert.equal(details.overflows, false, `${chartId} should not overflow viewport`);
  assert(!details.text.includes("休息後逐漸往平常範圍回復"), `${chartId} should not leak old q07 conclusion`);
  assert(!details.text.includes("飯後血糖可能先升高"), `${chartId} should not leak old q12 conclusion`);
}

try {
  for (const mode of ["guest", "pending", "verified"]) {
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
      await page.addInitScript(({ runtimeMode, questionVersion }) => {
        window.fetch = async (input, init = {}) => {
          const url = typeof input === "string" ? input : input.url;
          const query = new URL(url, location.href).searchParams;
          const body = init.body ? JSON.parse(init.body) : {};
          const action = query.get("action") || body.action;
          if (action === "getStudentAndAttemptStatus") {
            return {
              ok: true,
              json: async () => ({
                ok: true,
                student: {
                  student_id: "S70102",
                  class_name: "701",
                  seat_no: "02",
                  student_name: "王小明",
                  profile_gender: "male"
                },
                student_progress: {
                  total_exp: 5700,
                  current_title_id: "micro_explorer",
                  current_title: "微觀探索者",
                  title_avatar_path: "../shared-assets/title-avatars/title-05-micro_explorer-male.webp",
                  completed_unit_count: 12,
                  unit_badge_summary_json: "[]"
                }
              })
            };
          }
          if (action === "startAttempt") {
            return {
              ok: true,
              json: async () => ({
                ok: true,
                verification_mode: "server_verified",
                attempt_id: `${runtimeMode}_attempt`,
                attempt_session_id: `${runtimeMode}_session`,
                attempt_session_token: `${runtimeMode}_token`,
                previous_attempt_id: "",
                question_version: questionVersion
              })
            };
          }
          if (action === "submitAttempt") {
            const response = {
              ok: true,
              verification_status: runtimeMode === "verified" ? "server_verified" : "pending_backend"
            };
            if (runtimeMode === "verified") {
              response.verified_attempt = {
                verification_status: "server_verified",
                correct_count: 14,
                total_questions: 14,
                accuracy: 1,
                hint_used_count: 0,
                completion_exp: 100,
                direct_exp: 220,
                revision_exp: 0,
                reflection_exp: 0,
                mastery_exp: 140,
                retry_exp: 0,
                attempt_exp: 460,
                unit_credited_exp: 460,
                credited_delta: 460,
                earned_badges: [
                  "temperature_glucose_homeostasis_entry",
                  "homeostasis_range_keeper",
                  "negative_feedback_direction_reader",
                  "endotherm_ectotherm_classifier",
                  "hot_response_heat_loss_reader",
                  "cold_response_heat_keeper",
                  "sweating_water_heat_linker",
                  "temperature_data_interpreter",
                  "temperature_feedback_sequence_tracker",
                  "blood_glucose_range_reader",
                  "blood_glucose_hormone_direction_reader",
                  "glucose_curve_interpreter",
                  "temperature_glucose_unit_boundary_guardian",
                  "temperature_glucose_homeostasis_flawless"
                ]
              };
              response.student_progress = {
                total_exp: 6160,
                current_title_id: "micro_explorer",
                current_title: "微觀探索者",
                title_avatar_path: "../shared-assets/title-avatars/title-05-micro_explorer-male.webp",
                completed_unit_count: 13,
                unit_badge_summary_json: "[]"
              };
            }
            return { ok: true, json: async () => response };
          }
          if (action === "hintEvent") return { ok: true, json: async () => ({ ok: true }) };
          return { ok: true, json: async () => ({ ok: true }) };
        };
      }, { runtimeMode: mode, questionVersion: "20260718-temperature-glucose-homeostasis-v1" });
      await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260726-temperature-glucose-charts-v1`);
      if (mode === "guest") {
        await page.locator("#guestBtn").click();
        await page.locator(".scene-copy").waitFor();
        assert(await page.locator(".scene-copy").textContent().then((text) => text.includes("你好，老師測試帳號｜guest 測試身分")), "guest brief greeting missing");
      } else {
        await page.locator("#studentId").fill("S70102");
        await page.locator("#loginBtn").click();
        await page.locator(".scene-copy").waitFor();
        assert(await page.locator(".scene-copy").textContent().then((text) => text.includes("你好，王小明｜701 02｜S70102")), `${mode} brief greeting missing`);
      }
      await expectResetAfter(page, () => page.locator('[data-next="scan"]').click(), "scan");
      assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
      await expectResetAfter(page, () => page.locator('[data-next="checkpoint1"]').click(), "checkpoint1");
      await answerChoice(page, Q(1), "homeostasis_is_range_not_fixed");
      await answerChoice(page, Q(2), "negative_feedback_opposite_adjustment");
      await answerMapping(page, Q(3), { human: "endotherm", sparrow: "endotherm", lizard: "ectotherm", frog: "ectotherm" });
      await expectResetAfter(page, () => page.locator('[data-section-next="checkpoint1"]').click(), "checkpoint2");
      await expectEvidenceChart(page, "q07-body-temperature", "u26-f-u26-04-q07-body-temperature-chart-base.svg");
      await answerChoice(page, Q(4), "hot_sweating_vasodilation");
      await answerChoice(page, Q(5), "cold_shivering_vasoconstriction");
      await answerChoice(page, Q(6), "sweating_cools_and_loses_water");
      await answerChoice(page, Q(7), "body_temp_returns_to_range_data");
      await page.evaluate((qid) => {
        window.__temperature_glucose_homeostasisTest.state().answers[`${qid}_sequence`] = ["body_temperature_high", "activate_heat_loss_response", "sweating_or_vasodilation_increases_heat_loss", "temperature_returns_toward_range"];
      }, Q(8));
      await expectResetAfter(page, () => page.locator('[data-section-next="checkpoint2"]').click(), "checkpoint3");
      await expectEvidenceChart(page, "q12-glucose-insulin", "u26-f-u26-04-q12-glucose-insulin-chart-base.svg");
      await answerChoice(page, Q(9), "blood_glucose_returns_to_range");
      await answerChoice(page, Q(10), "high_glucose_insulin_lowers");
      await answerChoice(page, Q(11), "low_glucose_glucagon_raises");
      await answerChoice(page, Q(12), "insulin_data_returns_glucose_range");
      await answerMapping(page, Q(13), { body_temperature_high: "increase_heat_loss", body_temperature_low: "conserve_or_make_heat", blood_glucose_high: "lower_glucose", blood_glucose_low: "raise_glucose" });
      await answerChoice(page, Q(14), "glucose_temperature_belongs_homeostasis");
      await expectResetAfter(page, () => page.locator('[data-section-next="checkpoint3"]').click(), "review");
      assert.equal(await page.locator(".mentor-card").count(), 0, "legacy mentor card should be removed");
      assert.equal(await page.locator(".bq-feedback-mentor img").count(), 1, "shared mentor should be exactly one");
      await expectResetAfter(page, () => page.locator('[data-next="reflection"]').click(), "reflection");
      assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
      await expectResetAfter(page, () => page.locator("#submitMission").click(), "result");
      assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), `${mode} blank reflection result should be 460/500`);
      assert.equal(await page.locator(".result-panel + section .badge").count(), 14, `${mode} result should show only earned badges`);
      await expectResetAfter(page, () => page.locator('[data-next="achievements"]').click(), "achievements");
      assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
      assert.equal(await page.locator(".title-avatar-card.achievements, .bq-title-progress-card").count() >= 1, true, "title card missing");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
      assert.deepEqual(failedImages, [], "image requests should not fail");
      assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
      await page.close();
    }
  }
} finally {
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]);
}
console.log("temperature glucose homeostasis full-flow layout regression passed");
