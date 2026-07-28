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
const VERSION = "20260729-cell-division-relogin-v1";
const QUESTION_VERSION = "20260718-cell-division-v1";
const storageKey = "bioquest_cell_division_state_v1";
const attemptsKey = "bioquest_attempts_v1";

function studentForStatus(status) {
  if (status === "guest") {
    return { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true };
  }
  const verified = status === "verified";
  return {
    student_id: "S27027",
    class_name: "727",
    seat_no: "27",
    student_name: verified ? "細胞分裂測試生" : "待確認學生",
    profile_gender: "male",
    total_exp: verified ? 12600 : 12100,
    current_title_id: "life_researcher",
    title_avatar_path: "../shared-assets/title-avatars/title-07-life_researcher-male.webp",
    progress: {
      source: verified ? "server_verified" : "pending_backend",
      progress_applied: verified,
      total_exp: verified ? 12600 : 12100,
      completed_unit_count: verified ? 27 : 26,
      current_title_id: "life_researcher",
      title_avatar_path: "../shared-assets/title-avatars/title-07-life_researcher-male.webp",
      unit_badge_summary_json: JSON.stringify([
        { unit_id: "temperature_glucose_homeostasis", earned_count: 0, total_count: 17, earned_badges: [] },
        { unit_id: "cell_division", earned_count: 0, total_count: 17, earned_badges: [] }
      ])
    }
  };
}

function stateForStatus(status, screen = "result") {
  return {
    screen,
    student: studentForStatus(status),
    attempt_id: `${status}_attempt`,
    attempt_session_token: `${status}_token`,
    attempt_session_id: `${status}_session`,
    question_version: QUESTION_VERSION,
    verification_mode: status === "guest" ? "local_guest" : status === "verified" ? "server_verified" : "pending_backend",
    answers: {},
    hints: {},
    hintEventStatus: {},
    submitted: true,
    submitLockedAt: "2026-07-29T00:00:00.000Z",
    completedScreens: ["login", "brief", "result", "achievements", "rules"],
    reflection: { confident: "", question: "", confidence: "3" },
    result: {
      verification_status: status === "guest" ? "local_guest" : status === "verified" ? "server_verified" : "pending_backend",
      correct_count: 14,
      total_questions: 14,
      accuracy: 1,
      hint_used_count: 0,
      completion_exp: 100,
      direct_exp: 220,
      revision_exp: 0,
      reflection_exp: 40,
      mastery_exp: 140,
      retry_exp: 0,
      attempt_exp: 500,
      unit_credited_exp: status === "verified" ? 500 : 0,
      exp_delta: status === "verified" ? 500 : 0,
      earned_badges: ["cell_division_entry", "cell_division_flawless"]
    },
    notice: ""
  };
}

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const status of ["verified", "pending", "guest"]) {
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
      await page.addInitScript(({ seededState, attemptsKeyName, stateKeyName, canonicalVersion }) => {
        localStorage.setItem(stateKeyName, JSON.stringify(seededState));
        localStorage.setItem(attemptsKeyName, JSON.stringify([{ attempt_id: "history_attempt", unit_id: "temperature_glucose_homeostasis", unit_credited_exp: 500 }]));
        window.__backendActions = [];
        window.fetch = async (url, options = {}) => {
          let action = "";
          try {
            action = new URL(url).searchParams.get("action") || "";
          } catch {}
          try {
            const body = options.body ? JSON.parse(options.body) : {};
            action = body.action || action;
          } catch {}
          if (action) window.__backendActions.push(action);
          if (action === "startAttempt") {
            return { ok: true, json: async () => ({
              ok: true,
              verification_mode: "server_verified",
              attempt_id: "relogin_server_attempt",
              attempt_session_id: "relogin_server_session",
              attempt_session_token: "relogin_server_token",
              question_version: canonicalVersion
            }) };
          }
          return { ok: true, json: async () => ({
            ok: true,
            student: {
              student_id: "S27027",
              student_name: "細胞分裂測試生",
              class_name: "727",
              seat_no: "27",
              profile_gender: "male"
            },
            progress: {
              source: "server_verified",
              progress_applied: true,
              total_exp: 12600,
              completed_unit_count: 27,
              current_title_id: "life_researcher",
              title_avatar_path: "../shared-assets/title-avatars/title-07-life_researcher-male.webp",
              unit_badge_summary_json: JSON.stringify([{ unit_id: "temperature_glucose_homeostasis", earned_count: 0, total_count: 17, earned_badges: [] }])
            }
          }) };
        };
      }, { seededState: stateForStatus(status), attemptsKeyName: attemptsKey, stateKeyName: storageKey, canonicalVersion: QUESTION_VERSION });
      await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${VERSION}&case=${status}`);
      await page.locator(".result-panel").waitFor();
      assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, `${status} result relogin missing`);
      assert(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), `${status} result earned heading missing`);
      assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, `${status} result must not render controlled pending badge images`);
      assert.equal(await page.locator(".result-stack").textContent().then((text) => text.includes(["徽章", "素材", "待接"].join("")) || text.includes("缺圖")), false, `${status} result has stale missing text`);

      await page.locator('[data-next="achievements"]').click();
      await page.locator(".achievements-stack").waitFor();
      await page.locator(".bq-all-unit-badge-overview").waitFor();
      const achievementState = await page.evaluate(() => {
        const titleCard = document.querySelector(".bq-title-avatar-card, .title-card");
        const overview = document.querySelector(".bq-all-unit-badge-overview");
        const follows = (first, second) => Boolean(first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING));
        return {
          reloginCount: document.querySelectorAll(".achievements-stack [data-relogin]").length,
          unitWallCount: document.querySelectorAll(".achievements-stack [data-bq-unit-achievements], .achievements-stack .badge-wall").length,
          titleCount: document.querySelectorAll(".bq-title-avatar-card, .title-card").length,
          titleImageSrcs: [...document.querySelectorAll(".bq-title-avatar-card img, .title-card img")].map((img) => img.currentSrc || img.src),
          overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
          summaryCount: document.querySelectorAll(".bq-unit-badge-summary").length,
          titleBeforeOverview: follows(titleCard, overview),
          text: document.body.innerText,
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      assert.equal(achievementState.reloginCount, 1, `${status} achievements relogin missing`);
      assert.equal(achievementState.unitWallCount, 0, `${status} achievements must be overview-only`);
      assert.equal(achievementState.titleCount, 1, `${status} title card exactly one`);
      assert(achievementState.titleImageSrcs.every((src) => src.includes(".webp")), `${status} title avatar must request WebP primary`);
      assert.equal(achievementState.overviewCount, 1, `${status} overview exactly one`);
      assert.equal(achievementState.summaryCount, 52, `${status} overview should show 52 units`);
      assert.equal(achievementState.titleBeforeOverview, true, `${status} title should precede overview`);
      assert.equal(achievementState.overflow, false, `${status} horizontal overflow`);
      if (status === "verified") {
        assert(achievementState.text.includes("12600 EXP"), "verified title progress must come from StudentProgress");
        assert(achievementState.text.includes("已完成 27 站"), "verified completed units missing");
      }
      if (status === "pending") {
        assert(achievementState.text.includes("待後台確認"), "pending title progress must be neutral");
      }
      if (status === "guest") {
        assert(achievementState.text.includes("guest"), "guest achievements should not imply formal progress");
      }

      await page.locator('[data-nav="rules"]').click();
      await page.locator(".rule-list").waitFor();
      assert.equal(await page.locator("[data-relogin]").count(), 1, `${status} rules relogin missing`);
      await page.locator('[data-next="result"]').click();
      await page.locator(".result-panel").waitFor();
      await page.locator('[data-nav="login"]').click();
      await page.locator("#guestBtn").waitFor();
      const resetState = await page.evaluate(() => ({
        screen: window.__cell_divisionTest.state().screen,
        student: window.__cell_divisionTest.state().student,
        attemptId: window.__cell_divisionTest.state().attempt_id,
        submitted: window.__cell_divisionTest.state().submitted,
        attempts: window.__cell_divisionTest.loadAttempts().length,
        snapshot: window.__cell_divisionTest.loadVerifiedSnapshot(),
        backendActions: window.__backendActions
      }));
      assert.equal(resetState.screen, "login", `${status} reset screen`);
      assert.equal(resetState.student, null, `${status} reset current student`);
      assert.equal(resetState.attemptId, "", `${status} reset attempt`);
      assert.equal(resetState.submitted, false, `${status} reset submitted`);
      assert.equal(resetState.attempts, 1, `${status} reset should keep attempt history`);
      if (status === "guest") {
        assert.deepEqual(resetState.backendActions, [], "guest reset must not write backend");
        await page.locator("#guestBtn").click();
        await page.locator('[data-next="scan"]').waitFor();
        assert.deepEqual(await page.evaluate(() => window.__backendActions), [], "guest relogin must stay local");
      } else {
        assert.equal(resetState.snapshot.student_id, "S27027", `${status} snapshot student`);
        assert.equal(resetState.snapshot.total_exp, status === "verified" ? 12600 : 12100, `${status} snapshot total`);
        await page.locator("#studentId").fill("S27027");
        await page.locator("#loginBtn").click();
        await page.locator('[data-next="scan"]').waitFor();
        assert.deepEqual(await page.evaluate(() => window.__backendActions), ["getStudentAndAttemptStatus", "startAttempt"], `${status} formal relogin backend actions`);
      }
      assert.deepEqual(failedImages, [], `${status} image failures`);
      assert.deepEqual(consoleErrors, [], `${status} console errors`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("cell division submitted retry state regression passed");
