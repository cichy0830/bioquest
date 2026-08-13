#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-behavior-sensing")
  : sourceRoot;
const APP_VERSION = "20260813-behavior-sensing-mapping-v1";
const QUESTION_VERSION = "20260718-behavior-sensing-v1";
const Q = (n) => `behavior_sensing_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function clickAndExpectTop(page, selector, label) {
  await page.evaluate(() => window.scrollTo(0, 560));
  await page.locator(selector).click();
  await page.waitForTimeout(140);
  const scrollY = await page.evaluate(() => Math.max(window.scrollY, document.documentElement.scrollTop || 0, document.body.scrollTop || 0, document.querySelector(".main-stage")?.scrollTop || 0));
  assert(scrollY <= 2, `${label} should reset scroll top, got ${scrollY}`);
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
  assert(scene.sceneSrc.includes("assets/behavior-sensing-briefing-azhe-wide.webp"), `${label} should use approved U23 scene`);
  assert(scene.sceneSrc.includes(`v=${APP_VERSION}`), `${label} scene URL should carry runtime cache`);
  assert.equal(scene.avatarCount, 1, `${label} should render exactly one title avatar`);
  assert(scene.avatarNaturalWidth > 0, `${label} title avatar should load`);
  assert.equal(scene.fallbackCount, 0, `${label} should not show missing-scene fallback`);
  assert.equal(scene.briefOwlCount, 0, `${label} brief must not contain owl`);
  assert.equal(scene.overflow, false, `${label} brief should not overflow horizontally`);
}

async function installBackendStub(page, mode, actions) {
  await page.addInitScript(({ mode, questionVersion }) => {
    window.fetch = async (url, options = {}) => {
      const body = options.body ? JSON.parse(options.body) : null;
      const parsed = new URL(String(url));
      const action = body?.action || parsed.searchParams.get("action");
      window.__backendActions = window.__backendActions || [];
      window.__backendActions.push(action);
      if (action === "getStudentAndAttemptStatus") {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            student: { student_id: "S72301", student_name: "測試學生", class_name: "702", seat_no: "31", profile_gender: "male" },
            progress: {
              source: mode === "verified" ? "student_progress" : "pending",
              total_exp: mode === "verified" ? 5200 : 4500,
              completed_unit_count: mode === "verified" ? 23 : 22,
              current_title_id: mode === "verified" ? "micro_explorer" : "concept_solver",
              current_title: mode === "verified" ? "微觀探索者" : "概念解謎者",
              title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.webp",
              unit_badge_summary_json: JSON.stringify([{ unit_id: "life_world", earned_count: 2, total_count: 8, earned_badges: [] }])
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
            attempt_id: "behavior_server_attempt",
            attempt_session_id: "behavior_server_session",
            attempt_session_token: "behavior_server_token",
            previous_attempt_id: "",
            question_version: questionVersion
          })
        };
      }
      if (action === "hintEvent") return { ok: true, json: async () => ({ ok: true }) };
      if (action === "submitAttempt") {
        const verified = mode === "verified";
        return {
          ok: true,
          json: async () => (verified ? {
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
              earned_badges: ["behavior_sensing_entry", "behavior_sensing_flawless"]
            },
            student_progress: {
              source: "student_progress",
              total_exp: 5460,
              completed_unit_count: 23,
              current_title_id: "micro_explorer",
              current_title: "微觀探索者",
              title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.webp",
              unit_badge_summary_json: JSON.stringify([{ unit_id: "behavior_sensing", earned_count: 2, total_count: 15, earned_badges: [] }])
            }
          } : {
            ok: true,
            verification_status: "pending_backend"
          })
        };
      }
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, questionVersion: QUESTION_VERSION });
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("script.google.com")) actions.push(url);
  });
}

async function completeFlow(page, mode) {
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
  } else {
    await page.locator("#studentId").fill("S72301");
    await page.locator("#loginBtn").click();
  }
  await page.locator(".brief-hero").waitFor();
  await assertBriefSceneLoaded(page, `${mode} brief`);
  await clickAndExpectTop(page, '[data-next="scan"]', `${mode} brief to scan`);
  assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
  await clickAndExpectTop(page, '[data-next="checkpoint1"]', `${mode} scan to checkpoint1`);
  await answerChoice(page, Q(1), "organisms_respond_to_stimuli");
  await answerChoice(page, Q(2), "parental_behavior_reproduction");
  await answerMapping(page, Q(3), { butterfly_nectar: "feeding", rabbit_hide_sound: "avoid_predator", peacock_display: "courtship", bird_feed_young: "parental_care" });
  await answerChoice(page, Q(4), "behavior_supports_survival_reproduction");
  await clickAndExpectTop(page, '[data-section-next="checkpoint1"]', `${mode} checkpoint1 to checkpoint2`);
  await answerChoice(page, Q(5), "taxis_whole_body_moves");
  await answerChoice(page, Q(6), "taxis_not_plant_bending");
  await answerChoice(page, Q(7), "phototropism_growth_direction");
  await answerMapping(page, Q(8), { bug_to_dark: "taxis", stem_bends_to_window: "tropism", root_grows_down: "tropism", unicell_away_strong_light: "taxis" });
  await clickAndExpectTop(page, '[data-section-next="checkpoint2"]', `${mode} checkpoint2 to checkpoint3`);
  await answerChoice(page, Q(9), "touch_nastic_response");
  await answerChoice(page, Q(10), "sleep_movement_day_night");
  await answerChoice(page, Q(11), "plants_respond_without_animal_nerves");
  await answerChoice(page, Q(12), "light_affects_growth_direction");
  await answerChoice(page, Q(13), "reversible_touch_response");
  await answerChoice(page, Q(14), "touch_response_belongs_behavior_sensing");
  await clickAndExpectTop(page, '[data-section-next="checkpoint3"]', `${mode} checkpoint3 to review`);
  assert.equal(await page.locator(".bq-feedback-mentor").count(), 1, "feedback mentor should be exactly one");
  assert.equal(await page.locator(".mentor-card").count(), 0, "legacy mentor-card should not render");
  await clickAndExpectTop(page, '[data-next="reflection"]', `${mode} review to reflection`);
  assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
  await page.locator("#submitMission").click();
  await page.locator(".result-panel").waitFor();
  const resultText = await page.locator(".result-panel").textContent();
  if (mode === "guest") assert(resultText.includes("guest 測試"), "guest result should be local only");
  if (mode === "pending") assert(resultText.includes("待後台確認"), "pending result should wait for backend confirmation");
  if (mode === "verified") assert(resultText.includes("後台認列"), "verified result should use formal backend wording");
  assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, `${mode} result relogin entry missing`);
  assert(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), `${mode} result earned badge heading missing`);
  assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, `${mode} result should not render controlled pending badge images`);
  await clickAndExpectTop(page, '[data-next="achievements"]', `${mode} result to achievements`);
  await page.locator(".achievements-stack").waitFor();
  await page.locator(".bq-all-unit-badge-overview").waitFor();
}

try {
  for (const mode of ["guest", "pending", "verified"]) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];
      const failedImages = [];
      const backendActions = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("requestfailed", (request) => {
        if (/\.(png|jpe?g|webp|svg)(\?|$)/i.test(request.url())) failedImages.push(request.url());
      });
      page.on("dialog", (dialog) => dialog.accept());
      await installBackendStub(page, mode, backendActions);
      await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${APP_VERSION}`);
      await completeFlow(page, mode);
      const achievement = await page.evaluate(() => {
        const titleCard = document.querySelector(".title-avatar-card.achievements, .bq-title-avatar-card, [data-bq-title-avatar-card]");
        const overview = document.querySelector(".bq-all-unit-badge-overview");
        const follows = (first, second) => Boolean(first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING));
        return {
          reloginCount: document.querySelectorAll(".achievements-stack [data-relogin]").length,
          unitWallCount: document.querySelectorAll(".achievements-stack [data-bq-unit-achievements], .achievements-stack .badge-wall").length,
          overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
          summaryBoxes: document.querySelectorAll(".bq-unit-badge-summary").length,
          titleCards: document.querySelectorAll(".title-avatar-card.achievements, .bq-title-avatar-card, [data-bq-title-avatar-card]").length,
          titleBeforeOverview: follows(titleCard, overview),
          visiblePseudoText: document.body.innerText.includes("正式徽章素材待接"),
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      assert.equal(achievement.reloginCount, 1, `${mode} achievements relogin entry missing`);
      assert.equal(achievement.unitWallCount, 0, `${mode} achievements must be overview-only`);
      assert.equal(achievement.overviewCount, 1, `${mode} overview exactly one`);
      assert.equal(achievement.summaryBoxes, 52, `${mode} should render 52 unit summaries`);
      assert.equal(achievement.titleCards, 1, `${mode} title card exactly one`);
      assert.equal(achievement.titleBeforeOverview, true, `${mode} title card should precede overview`);
      assert.equal(achievement.visiblePseudoText, false, `${mode} local pending placeholder text should not duplicate shared fallback`);
      assert.equal(achievement.overflow, false, `${mode} achievement horizontal overflow`);
      const recordedActions = await page.evaluate(() => window.__backendActions || []);
      if (mode === "guest") assert.deepEqual(recordedActions, [], "guest should not call backend");
      else assert(recordedActions.includes("getStudentAndAttemptStatus") && recordedActions.includes("startAttempt") && recordedActions.includes("submitAttempt"), `${mode} should call backend login/start/submit`);
      assert.deepEqual(failedImages, [], `${mode} image requests should not fail`);
      assert.deepEqual(consoleErrors, [], `${mode} console/page errors during full flow`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log("behavior sensing full-flow layout regression passed");
