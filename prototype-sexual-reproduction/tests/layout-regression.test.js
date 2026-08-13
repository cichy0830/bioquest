#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-sexual-reproduction")
  : sourceRoot;
const CACHE_VERSION = "20260814-sexual-reproduction-mapping-v1";
const QUESTION_VERSION = "20260718-sexual-reproduction-v1";
const Q = (n) => `sexual_reproduction_q${String(n).padStart(2, "0")}`;
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
  await page.addInitScript(({ mode, questionVersion }) => {
    window.__backendActions = [];
    window.fetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input : input.url;
      const query = new URL(url, location.href).searchParams;
      const body = init.body ? JSON.parse(init.body) : {};
      const action = query.get("action") || body.action;
      window.__backendActions.push(action);
      if (action === "getStudentAndAttemptStatus") {
        return { ok: true, json: async () => ({
          ok: true,
          student: {
            student_id: "S79999",
            student_name: mode === "pending" ? "待確認學生" : "已驗證學生",
            class_name: "701",
            seat_no: "99",
            profile_gender: "male"
          },
          student_progress: {
            total_exp: 1900,
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
          question_version: questionVersion,
          attempt_id: `u29_${mode}_attempt`,
          attempt_session_token: `u29_${mode}_token`,
          attempt_session_id: `u29_${mode}_session`,
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
            concept_exp: 220,
            revision_exp: 0,
            question_exp: 0,
            mastery_exp: 140,
            retry_exp: 0,
            attempt_total_exp: 460,
            unit_credited_exp: 460,
            credited_delta: 460,
            badges_json: JSON.stringify(["sexual_reproduction_entry"])
          },
          student_progress: {
            total_exp: 2360,
            current_title_id: "ecology_recorder",
            current_title: "生態記錄員",
            title_avatar_path: "../shared-assets/title-avatars/title-03-ecology_recorder-male.webp",
            unit_badge_summary_json: "[]"
          }
        }) };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, questionVersion: QUESTION_VERSION });
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const mode of ["guest", "pending", "verified"]) {
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
        await page.locator("#studentId").fill("S79999");
        await page.locator("#loginBtn").click();
      }
      await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
      assert.equal(await page.locator(".bq-brief-scene-image").count(), 1, `${mode} brief scene should be exactly one`);
      assert.equal(await page.locator(".bq-brief-student-avatar").count(), 1, `${mode} brief title avatar should be exactly one`);
      assert.equal(await page.locator(".brief-scene-fallback, .bq-brief-scene-missing").count(), 0, `${mode} brief fallback should be removed`);
      await clickAndExpectTop(page, '[data-next="scan"]', "scan");
      assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
      await clickAndExpectTop(page, '[data-next="checkpoint1"]', "checkpoint1");
      await answerChoice(page, Q(1), "sexual_reproduction_needs_gamete_fusion");
      await answerChoice(page, Q(2), "sperm_and_egg_are_gametes");
      await answerChoice(page, Q(3), "fertilization_sperm_egg_form_zygote");
      await clickAndExpectTop(page, '[data-section-next="checkpoint1"]', "checkpoint2");
      await page.evaluate((qid) => {
        window.__sexual_reproductionTest.state().answers[`${qid}_sequence`] = ["parents_produce_sperm_and_egg", "sperm_and_egg_meet", "fertilization_forms_zygote", "zygote_begins_development"];
      }, Q(4));
      await answerChoice(page, Q(5), "offspring_inherit_from_two_parent_sources");
      await answerChoice(page, Q(6), "sexual_offspring_show_variation");
      await answerMapping(page, Q(7), { frog_water_fertilization: "external_fertilization", human_internal_fertilization: "internal_fertilization", fish_water_fertilization: "external_fertilization", bird_internal_fertilization: "internal_fertilization" });
      await clickAndExpectTop(page, '[data-section-next="checkpoint2"]', "checkpoint3");
      await answerChoice(page, Q(8), "pollination_not_same_as_fertilization");
      await answerChoice(page, Q(9), "plant_pollen_sperm_egg_fertilization");
      await answerChoice(page, Q(10), "internal_fertilization_not_always_viviparous");
      await answerMapping(page, Q(11), { sperm_egg_zygote: "sexual_reproduction", strawberry_runner: "asexual_reproduction", hydra_budding: "asexual_reproduction", plant_sperm_egg: "sexual_reproduction" });
      const q12Card = page.locator(`[data-question-id="${Q(12)}"]`);
      await q12Card.scrollIntoViewIfNeeded();
      assert.equal(await q12Card.locator(".u29-evidence-figure").count(), 1, "q12 evidence figure should render once");
      assert.equal(await q12Card.locator(".u29-evidence-picture img").count(), 1, "q12 evidence image should render once");
      const q12Image = await q12Card.locator(".u29-evidence-picture img").evaluate((img) => ({
        width: img.naturalWidth,
        height: img.naturalHeight,
        currentSrc: img.currentSrc
      }));
      assert(q12Image.width > 0 && q12Image.height > 0, "q12 evidence image should load");
      assert(q12Image.currentSrc.includes(CACHE_VERSION), "q12 evidence image should use runtime cache");
      assert.equal(await q12Card.locator(".u29-evidence-data-card").count(), 2, "q12 overlay should show two comparison cards");
      const q12Overflow = await q12Card.locator(".u29-evidence-figure").evaluate((node) => node.scrollWidth <= node.clientWidth + 1);
      assert.equal(q12Overflow, true, "q12 evidence should not overflow horizontally");
      await answerChoice(page, Q(12), "sexual_reproduction_from_variation_and_fertilization_data");
      await answerMapping(page, Q(13), { strawberry_runner_new_plant: "u28_asexual_reproduction", sperm_egg_zygote: "u29_sexual_reproduction", egg_shell_albumen_yolk_aircell: "u30_egg_observation", full_flower_structure_labeling: "u31_flower_observation" });
      await answerChoice(page, Q(14), "fertilization_belongs_sexual_reproduction");
      await clickAndExpectTop(page, '[data-section-next="checkpoint3"]', "review");
      await clickAndExpectTop(page, '[data-next="reflection"]', "reflection");
      assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
      await forceScroll(page);
      await page.locator("#submitMission").click();
      await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
      await expectAtTop(page, "result transition");
      assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), `${mode} blank reflection result should be 460/500`);
      const result = await page.evaluate(() => window.__sexual_reproductionTest.state().result);
      assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, "result relogin button missing");
      assert.equal(await page.locator(".result-stack .badge").count(), result.earned_badges.length, "result should show only earned badges");
      assert.equal(await page.locator(".result-stack .badge-wall").count(), 0, "result should not render full badge catalog wall");
      assert.equal(await page.locator(".result-stack .badge img").count(), 0, "U29 controlled-pending result items should not request missing images");
      const resultText = await page.locator(".result-stack").textContent();
      for (const forbidden of [`正式徽章素材${"待"}接`, `缺${"圖"}`, `待${"接"}`, "亮", " 徽 "]) {
        assert(!resultText.includes(forbidden), `result should not show legacy badge marker ${forbidden}`);
      }
      await clickAndExpectTop(page, '[data-next="achievements"]', "achievements");
      await page.locator(".achievements-stack").waitFor();
      assert.equal(await page.locator(".bq-title-avatar-card").count(), 1, "title avatar card should be exactly one");
      assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
      assert.equal(await page.locator(".achievements-stack [data-relogin]").count(), 1, "achievements relogin button missing");
      assert.equal(await page.locator(".achievements-stack .badge-wall").count(), 0, "achievements should not repeat the unit badge wall");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
      await clickAndExpectTop(page, '[data-nav="rules"]', "rules");
      assert.equal(await page.locator("[data-relogin]").count(), 1, "rules relogin button missing");
      assert(await page.locator('[data-next="result"]').count(), "submitted rules should return to result");
      await page.locator("[data-relogin]").click();
      await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "login");
      const resetState = await page.evaluate(() => ({
        student: window.__sexual_reproductionTest.state().student,
        attemptId: window.__sexual_reproductionTest.state().attempt_id,
        submitted: window.__sexual_reproductionTest.state().submitted,
        attemptsCount: window.__sexual_reproductionTest.loadAttempts().length,
        verifiedSnapshot: window.__sexual_reproductionTest.loadVerifiedSnapshot()
      }));
      assert.equal(resetState.student, null, "relogin reset should clear current student");
      assert.equal(resetState.attemptId, "", "relogin reset should clear current attempt");
      assert.equal(resetState.submitted, false, "relogin reset should clear submitted lock");
      assert(resetState.attemptsCount >= 1, "relogin reset should preserve local attempt history");
      if (mode === "verified") assert.equal(resetState.verifiedSnapshot?.total_exp, 2360, "verified snapshot should survive relogin reset");
      if (mode !== "guest") {
        await page.locator("#studentId").fill("S79999");
        await page.locator("#loginBtn").click();
        await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
        const reloginState = await page.evaluate(() => window.__sexual_reproductionTest.state());
        assert(reloginState.attempt_id.includes(`u29_${mode}_attempt`), "formal relogin should start a fresh backend attempt");
        assert.equal(reloginState.attempt_session_token, `u29_${mode}_token`, "formal relogin should receive a backend token");
      } else {
        await page.locator("#guestBtn").click();
        await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
        const reloginState = await page.evaluate(() => window.__sexual_reproductionTest.state());
        assert(reloginState.attempt_id.startsWith("sexual_reproduction_guest_attempt_"), "guest relogin should start a fresh local attempt");
        assert.equal(reloginState.verification_mode, "local_guest", "guest relogin should stay local");
      }
      const backendActions = await page.evaluate(() => window.__backendActions || []);
      if (mode === "guest") {
        assert.deepEqual(backendActions, [], "guest flow and relogin should not call backend");
      } else {
        assert(backendActions.filter((action) => action === "getStudentAndAttemptStatus").length >= 2, "formal relogin should call getStudentAndAttemptStatus again");
        assert(backendActions.filter((action) => action === "startAttempt").length >= 2, "formal relogin should call startAttempt again");
        assert(backendActions.includes("submitAttempt"), "formal flow should submit to backend");
      }
      assert.deepEqual(failedImages, [], "image requests should not fail");
      assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log("sexual reproduction full-flow layout regression passed");
