#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-endocrine-system")
  : sourceRoot;
const Q = (n) => `endocrine_system_q${String(n).padStart(2, "0")}`;
const APP_VERSION = "20260813-endocrine-system-mapping-v1";
const QUESTION_VERSION = "20260718-endocrine-system-ready-v1";
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

async function clickAndExpectTop(page, selector, label) {
  await page.evaluate(() => window.scrollTo(0, Math.max(720, document.documentElement.scrollHeight)));
  await page.locator(selector).click();
  await page.waitForTimeout(120);
  const scrollY = await page.evaluate(() => Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0, document.body?.scrollTop || 0));
  assert(scrollY <= 2, `${label} should reset scroll to top, got ${scrollY}`);
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
  }, APP_VERSION);
  assert.equal(scene.sceneCount, 1, `${label} should render exactly one briefing scene image`);
  assert(scene.sceneNaturalWidth > 0, `${label} briefing scene should load`);
  assert(scene.sceneSrc.includes("assets/endocrine-system-briefing-azhe-wide.webp"), `${label} should use approved U22 scene`);
  assert(scene.sceneSrc.includes(`v=${APP_VERSION}`), `${label} scene URL should carry runtime cache`);
  assert.equal(scene.avatarCount, 1, `${label} should render exactly one title avatar`);
  assert(scene.avatarNaturalWidth > 0, `${label} title avatar should load`);
  assert.equal(scene.fallbackCount, 0, `${label} should not show missing-scene fallback`);
  assert.equal(scene.briefOwlCount, 0, `${label} brief must not contain owl`);
  assert.equal(scene.overflow, false, `${label} brief should not overflow horizontally`);
}

async function installBackendStub(page, mode) {
  await page.addInitScript(({ mode: stubMode, questionVersion }) => {
    window.__backendActions = [];
    window.fetch = async (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : {};
      const search = new URL(String(url), window.location.href).searchParams;
      const action = body.action || search.get("action");
      window.__backendActions.push(action);
      if (action === "getStudentAndAttemptStatus") {
        return { ok: true, json: async () => ({
          ok: true,
          student: {
            student_id: "S99022",
            student_name: "測試學生",
            class_name: "測試班",
            seat_no: "22",
            profile_gender: "male",
            progress: {
              total_exp: 8000,
              current_title_id: "systems_investigator",
              current_title: "系統調查員",
              title_avatar_path: "shared-assets/title-avatars/title-06-systems_investigator-male.webp",
              completed_unit_count: 16,
              unit_badge_summary_json: "[]"
            }
          },
          student_progress: {
            total_exp: 8000,
            current_title_id: "systems_investigator",
            current_title: "系統調查員",
            title_avatar_path: "shared-assets/title-avatars/title-06-systems_investigator-male.webp",
            completed_unit_count: 16,
            unit_badge_summary_json: "[]"
          }
        }) };
      }
      if (action === "startAttempt") {
        return { ok: true, json: async () => ({
          ok: true,
          verification_mode: "server_verified",
          question_version: questionVersion,
          attempt_id: `u22_${stubMode}_attempt`,
          attempt_session_token: `u22_${stubMode}_token`,
          attempt_session_id: `u22_${stubMode}_session`,
          previous_attempt_id: ""
        }) };
      }
      if (action === "submitAttempt") {
        if (stubMode === "verified") {
          return { ok: true, json: async () => ({
            ok: true,
            verification_status: "server_verified",
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
              earned_badges: ["endocrine_system_entry", "endocrine_system_flawless"]
            },
            student_progress: {
              total_exp: 8460,
              current_title_id: "systems_investigator",
              current_title: "系統調查員",
              title_avatar_path: "shared-assets/title-avatars/title-06-systems_investigator-male.webp",
              completed_unit_count: 17,
              unit_badge_summary_json: "[]"
            }
          }) };
        }
        return { ok: true, json: async () => ({ ok: true, verification_status: "pending_backend" }) };
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
      await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${APP_VERSION}`);
      if (mode === "guest") {
        await page.locator("#guestBtn").click();
      } else {
        await page.locator("#studentId").fill("S99022");
        await page.locator("#loginBtn").click();
      }
      await page.locator(".brief-hero").waitFor();
      await assertBriefSceneLoaded(page, `${mode} brief ${viewport.width}`);
      await clickAndExpectTop(page, '[data-next="scan"]', `${mode} brief to scan ${viewport.width}`);
      assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
      await clickAndExpectTop(page, '[data-next="checkpoint1"]', `${mode} scan to checkpoint1 ${viewport.width}`);
      assert.equal(await page.locator(`[data-sequence="${Q(4)}"] [data-sequence-item]`).count(), 5, "endocrine sequence cards missing");
      await answerChoice(page, Q(1), "endocrine_gland_secretes_hormones");
      await answerChoice(page, Q(2), "hormone_travels_in_blood");
      await answerChoice(page, Q(3), "hormone_targets_specific_organs");
      await orderSequence(page, Q(4), ["gland_secretes", "hormone_enters_blood", "blood_transports", "target_reached", "target_responds"]);
      await clickAndExpectTop(page, '[data-section-next="checkpoint1"]', `${mode} checkpoint1 to checkpoint2 ${viewport.width}`);
      await answerMapping(page, Q(5), { pituitary: "growth_regulation", thyroid: "metabolism_growth", pancreatic_islets: "blood_glucose", adrenal: "emergency_response" });
      await answerChoice(page, Q(6), "pituitary_growth_regulation");
      await answerChoice(page, Q(7), "thyroid_metabolism_growth");
      await answerChoice(page, Q(8), "gonads_reproduction_development");
      await clickAndExpectTop(page, '[data-section-next="checkpoint2"]', `${mode} checkpoint2 to checkpoint3 ${viewport.width}`);
      await answerChoice(page, Q(9), "insulin_lowers_blood_glucose");
      await answerChoice(page, Q(10), "glucagon_raises_blood_glucose");
      await answerChoice(page, Q(11), "insulin_data_lowers_glucose");
      await answerChoice(page, Q(12), "hormones_need_balance");
      await answerChoice(page, Q(13), "insulin_glucagon_opposite_directions");
      await answerChoice(page, Q(14), "nerve_endocrine_different_coordination");
      await clickAndExpectTop(page, '[data-section-next="checkpoint3"]', `${mode} checkpoint3 to review ${viewport.width}`);
      await clickAndExpectTop(page, '[data-next="reflection"]', `${mode} review to reflection ${viewport.width}`);
      assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
      const owlTop = await page.locator(".bq-report-assistant").first().boundingBox().then((box) => box?.y ?? -999);
      assert(owlTop >= 0, `report owl should not be clipped at top, got ${owlTop}`);
      await page.locator("#submitMission").click();
      await page.locator(".result-panel").waitFor();
      await page.waitForTimeout(120);
      assert.equal(await page.evaluate(() => Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0)), 0, `${mode} result should start at top`);
      assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection result should be 460/500");
      assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, `${mode} result relogin missing`);
      assert(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), `${mode} result earned badge heading missing`);
      assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, `${mode} result should not request pending badge images`);
      await clickAndExpectTop(page, '[data-next="achievements"]', `${mode} result to achievements ${viewport.width}`);
      await page.locator(".achievements-stack").waitFor();
      await page.locator(".bq-all-unit-badge-overview").waitFor();
      const order = await page.evaluate(() => {
        const unit = document.querySelector("[data-bq-unit-achievements]");
        const title = document.querySelector(".bq-title-avatar-card, .title-card");
        const overview = document.querySelector(".bq-all-unit-badge-overview");
        const before = (a, b) => Boolean(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
        return {
          unitBeforeTitle: before(unit, title),
          titleBeforeOverview: before(title, overview),
          reloginCount: document.querySelectorAll(".achievements-stack [data-relogin]").length,
          titleCount: document.querySelectorAll(".bq-title-avatar-card, .title-card").length,
          overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
          summaryBoxes: document.querySelectorAll(".bq-unit-badge-summary").length,
          unitWallCount: document.querySelectorAll(".achievements-stack [data-bq-unit-achievements], .achievements-stack .badge-wall").length,
          badgeCards: document.querySelectorAll("[data-bq-unit-achievements] .badge").length,
          pendingMarkers: document.querySelectorAll("[data-bq-unit-achievements] .bq-badge-asset-pending").length,
          localPseudoMarkers: [...document.querySelectorAll("[data-bq-unit-achievements] .badge-visual.asset-missing")].filter((element) => {
            const content = getComputedStyle(element, "::before").content;
            return content && !["none", "normal", '""'].includes(content);
          }).length
        };
      });
      assert.deepEqual(order, {
        unitBeforeTitle: false,
        titleBeforeOverview: true,
        reloginCount: 1,
        titleCount: 1,
        overviewCount: 1,
        summaryBoxes: 52,
        unitWallCount: 0,
        badgeCards: 0,
        pendingMarkers: 0,
        localPseudoMarkers: 0
      });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
      await page.locator('[data-nav="rules"]').click();
      await page.locator(".rule-list").waitFor();
      assert.equal(await page.locator("[data-relogin]").count(), 1, `${mode} rules relogin missing`);
      await page.locator('[data-next="result"]').click();
      await page.locator(".result-panel").waitFor();
      await page.locator('[data-nav="login"]').click();
      await page.locator("#guestBtn").waitFor();
      const resetState = await page.evaluate(() => ({
        state: window.__endocrine_systemTest.state(),
        attempts: window.__endocrine_systemTest.loadAttempts().length,
        snapshot: window.__endocrine_systemTest.loadVerifiedSnapshot(),
        actions: window.__backendActions || []
      }));
      assert.equal(resetState.state.screen, "login", `${mode} reset screen`);
      assert.equal(resetState.state.student, null, `${mode} reset current student`);
      assert.equal(resetState.state.attempt_id, "", `${mode} reset attempt id`);
      assert.equal(resetState.state.submitted, false, `${mode} reset submitted`);
      assert.equal(resetState.attempts, 1, `${mode} reset should preserve attempt history`);
      if (mode !== "guest") assert.equal(resetState.snapshot?.student_id, "S99022", `${mode} reset should preserve verified snapshot`);
      if (mode === "guest") {
        await page.locator("#guestBtn").click();
        await page.locator(".brief-hero").waitFor();
      } else {
        await page.locator("#studentId").fill("S99022");
        await page.locator("#loginBtn").click();
        await page.locator(".brief-hero").waitFor();
      }
      const actions = await page.evaluate(() => window.__backendActions || []);
      if (mode === "guest") assert.deepEqual(actions, [], "guest should not call backend");
      else assert.deepEqual(actions, ["getStudentAndAttemptStatus", "startAttempt", "submitAttempt", "getStudentAndAttemptStatus", "startAttempt"], `${mode} backend actions missing`);
      assert.deepEqual(failedImages, [], "image requests should not fail");
      assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log("endocrine system full-flow layout regression passed");
