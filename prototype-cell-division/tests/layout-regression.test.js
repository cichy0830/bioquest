#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-cell-division")
  : sourceRoot;
const CACHE_VERSION = "20260729-cell-division-relogin-v1";
const QUESTION_VERSION = "20260718-cell-division-v1";
const Q = (n) => `cell_division_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function forceScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 640);
    document.documentElement.scrollTop = 640;
    document.body.scrollTop = 640;
    const stage = document.querySelector(".main-stage");
    if (stage) stage.scrollTop = 640;
  });
}

async function expectAtTop(page, label) {
  await page.waitForTimeout(80);
  const scrolls = await page.evaluate(() => ({
    windowY: window.scrollY,
    documentY: document.documentElement.scrollTop,
    bodyY: document.body.scrollTop,
    stageY: document.querySelector(".main-stage")?.scrollTop || 0
  }));
  for (const [key, value] of Object.entries(scrolls)) {
    assert(value <= 2, `${label} should reset ${key} to top, got ${value}`);
  }
}

async function clickAndExpectTop(page, selector, screenName) {
  await forceScroll(page);
  await page.locator(selector).click();
  await page.waitForFunction((target) => document.querySelector("#screen")?.dataset.bioquestScreen === target, screenName);
  await expectAtTop(page, `${screenName} transition`);
}

async function installBackendStub(page, mode) {
  await page.addInitScript(({ mode, QUESTION_VERSION }) => {
    window.fetch = async (url, init = {}) => {
      const action = init.body ? JSON.parse(init.body).action : new URL(url).searchParams.get("action");
      if (action === "getStudentAndAttemptStatus") {
        return { ok: true, json: async () => ({
          ok: true,
          student: {
            student_id: "S99999",
            student_name: mode === "pending" ? "待確認學生" : "已驗證學生",
            class_name: "701",
            seat_no: "99",
            profile_gender: "male"
          },
          student_progress: {
            total_exp: 1500,
            current_title_id: "ecology_recorder",
            current_title: "生態記錄員",
            title_avatar_path: "../shared-assets/title-avatars/title-03-ecology_recorder-male.webp",
            unit_badge_summary_json: "[]"
          }
        }) };
      }
      if (action === "startAttempt") {
        return { ok: true, json: async () => ({
          ok: true,
          verification_mode: "server_verified",
          question_version: QUESTION_VERSION,
          attempt_id: `u27_${mode}_attempt`,
          attempt_session_token: `u27_${mode}_token`,
          attempt_session_id: `u27_${mode}_session`,
          previous_attempt_id: ""
        }) };
      }
      if (action === "hintEvent") return { ok: true, json: async () => ({ ok: true }) };
      if (action === "submitAttempt" && mode === "verified") {
        return { ok: true, json: async () => ({
          ok: true,
          verified_attempt: {
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
            earned_badges: ["cell_division_entry"]
          },
          student_progress: {
            total_exp: 1960,
            current_title_id: "ecology_recorder",
            current_title: "生態記錄員",
            title_avatar_path: "../shared-assets/title-avatars/title-03-ecology_recorder-male.webp",
            unit_badge_summary_json: "[]"
          }
        }) };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, QUESTION_VERSION });
}

async function completeQuestions(page) {
  assert(await page.locator(".scene-copy").textContent().then((text) => text.includes("你好")), "brief should show identity confirmation");
  await clickAndExpectTop(page, '[data-next="scan"]', "scan");
  await page.locator(".prep-owl-hero").waitFor();
  assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
  await clickAndExpectTop(page, '[data-next="checkpoint1"]', "checkpoint1");
  await answerChoice(page, Q(1), "cells_arise_from_existing_cells");
  await answerChoice(page, Q(2), "division_supports_repair");
  await answerChoice(page, Q(3), "chromosomes_carry_dna_information");
  await clickAndExpectTop(page, '[data-section-next="checkpoint1"]', "checkpoint2");
  await answerChoice(page, Q(4), "chromosomes_copy_before_division");
  await page.evaluate((qid) => {
    window.__cell_divisionTest.state().answers[`${qid}_sequence`] = ["cell_prepares_to_divide", "chromosomes_are_copied", "copied_chromosomes_distribute_to_both_sides", "cytoplasm_separates_into_two_daughter_cells"];
  }, Q(5));
  await answerChoice(page, Q(6), "chromosomes_distributed_to_both_cells");
  await answerChoice(page, Q(7), "chromosome_distribution_is_ordered");
  await answerChoice(page, Q(8), "copied_chromosomes_then_distributed");
  await clickAndExpectTop(page, '[data-section-next="checkpoint2"]', "checkpoint3");
  await answerChoice(page, Q(9), "one_mother_cell_forms_two_daughter_cells");
  await answerChoice(page, Q(10), "daughter_cells_similar_genetic_information");
  await answerChoice(page, Q(11), "growth_involves_more_cells");
  await answerChoice(page, Q(12), "root_tip_growth_cell_division_evidence");
  const q13Labels = await page.locator(`[data-question-id="${Q(13)}"] .mapping-row span`).allTextContents();
  assert.notDeepEqual(q13Labels.slice(0, 2), ["染色體複製後分配到兩個子細胞", "傷口修補需要新細胞"], "q13 should not start with answer-grouped core items");
  await answerMapping(page, Q(13), { chromosome_copy_distribution: "cell_division_core", wound_repair_new_cells: "cell_division_core", yeast_budding: "later_u28", sperm_egg_fertilization: "later_u29" });
  await answerChoice(page, Q(14), "chromosome_copy_distribution_belongs_cell_division");
  await clickAndExpectTop(page, '[data-section-next="checkpoint3"]', "review");
  assert.equal(await page.locator(".bq-feedback-mentor img").count(), 1, "shared review mentor should be exactly one");
  assert.equal(await page.locator(".mentor-card:not(.bq-feedback-mentor)").count(), 0, "local review mentor should be removed");
  await clickAndExpectTop(page, '[data-next="reflection"]', "reflection");
  assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
  await forceScroll(page);
  await page.locator("#submitMission").click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
  await expectAtTop(page, "result transition");
}

async function runScenario(viewport, mode) {
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
  await installBackendStub(page, mode);
  await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${CACHE_VERSION}`);
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
  } else {
    await page.locator("#studentId").fill("S99999");
    await page.locator("#loginBtn").click();
  }
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
  await expectAtTop(page, `${mode} login`);
  await completeQuestions(page);
  const result = await page.evaluate(() => window.__cell_divisionTest.state().result);
  assert(result, "result should exist after submit");
  assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, "result relogin button missing");
  assert.equal(await page.locator(".badge-wall .badge").count(), result.earned_badges.length, "result should show only earned badges");
  assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, "U27 pending badges should not create image requests");
  await clickAndExpectTop(page, '[data-next="achievements"]', "achievements");
  await page.locator(".achievements-stack").waitFor();
  assert.equal(await page.locator(".bq-title-avatar-card").count(), 1, "title avatar card should be exactly one");
  assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
  assert.equal(await page.locator(".bq-unit-badge-summary").count(), 52, "whole-book overview should show 52 units");
  assert.equal(await page.locator(".achievements-stack [data-relogin]").count(), 1, "achievements relogin button missing");
  assert.equal(await page.locator(".badge-wall").count(), 0, "achievements should not repeat the unit badge wall");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
  await clickAndExpectTop(page, '[data-nav="rules"]', "rules");
  assert.equal(await page.locator("[data-relogin]").count(), 1, "rules relogin button missing");
  await page.locator('[data-next="result"]').click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
  assert.deepEqual(failedImages, [], "image requests should not fail");
  assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
  await page.close();
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const mode of ["guest", "pending", "verified"]) {
      await runScenario(viewport, mode);
    }
  }
} finally {
  await browser.close();
}
console.log("cell division full-flow layout regression passed");
