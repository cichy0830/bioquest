#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-stimulus-response")
  : sourceRoot;
const VERSION = "20260720-stimulus-response-readiness-v1";
const STORAGE_KEY = "bioquest_stimulus_response_state_v1";
const QUESTION_VERSION = "20260718-stimulus-response-ready-v1";
const UNIT_ID = "stimulus_response";
const backendStyleAvatarPath = ["shared-assets", "title-avatars", "title-06-systems_investigator-male.webp"].join("/");

function stateFor(status, screen) {
  const isGuest = status === "guest";
  const verificationStatus = status === "verified" ? "server_verified" : isGuest ? "local_guest" : "pending_backend";
  const progress = isGuest ? {} : {
    source: status === "verified" ? "server_verified" : "pending_backend",
    progress_applied: status === "verified",
    total_exp: status === "verified" ? 8600 : 8000,
    completed_unit_count: status === "verified" ? 20 : 19,
    current_title_id: "systems_investigator",
    current_title: "系統調查員",
    title_avatar_path: backendStyleAvatarPath,
    unit_badge_summary_json: JSON.stringify([
      { unit_id: "human_circulation", unit_title: "人體的循環系統", total_badges: 15, earned_count: 4, earned_badges: [] },
      { unit_id: UNIT_ID, unit_title: "刺激與反應", total_badges: 15, earned_count: status === "verified" ? 1 : 0, earned_badges: [] }
    ])
  };
  return {
    screen,
    student: {
      student_id: isGuest ? "guest" : "S90020",
      student_name: isGuest ? "老師測試帳號" : "測試學生",
      class_name: isGuest ? "測試" : "901",
      seat_no: isGuest ? "00" : "20",
      is_guest: isGuest,
      profile_gender: "male",
      current_title_id: "systems_investigator",
      progress
    },
    attempt_id: `${status}_fixture`,
    attempt_session_token: isGuest ? "guest" : "session",
    question_version: QUESTION_VERSION,
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    submitted: true,
    result: {
      verification_status: verificationStatus,
      correct_count: 14,
      total_questions: 14,
      completion_exp: 100,
      direct_exp: 220,
      revision_exp: 0,
      reflection_exp: 40,
      mastery_exp: 140,
      retry_exp: 0,
      unit_credited_exp: 500,
      exp_delta: status === "verified" ? 500 : 0,
      earned_badges: ["stimulus_response_entry", "stimulus_response_flawless"]
    }
  };
}

async function openSeededPage(browser, viewport, status, screen) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const failedImages = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (/\.(png|jpe?g|webp|svg)(\?|$)/i.test(request.url())) failedImages.push(request.url());
  });
  await page.addInitScript(({ key, seeded }) => {
    window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
    localStorage.setItem(key, JSON.stringify(seeded));
    localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ student_id: seeded.student.student_id, unit_id: "fake_unit", unit_credited_exp: 5000 }]));
  }, { key: STORAGE_KEY, seeded: stateFor(status, screen) });
  await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${VERSION}`);
  return { page, consoleErrors, failedImages };
}

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const status of ["verified", "pending", "guest"]) {
      let { page, consoleErrors, failedImages } = await openSeededPage(browser, viewport, status, "result");
      await page.locator(".result-panel").waitFor();
      const resultText = await page.locator("#screen").textContent();
      if (status === "verified") assert(resultText.includes("本單元後台認列"), "verified result should use official credited wording");
      if (status === "pending") {
        assert(resultText.includes("本次預估 500/500 EXP，待後台確認"), "pending result should show estimated total");
        assert(resultText.includes("正式認列 / 累積增量 0"), "pending result should keep official delta at zero");
      }
      if (status === "guest") {
        assert(resultText.includes("guest 測試：本次預估 500/500 EXP，不列入正式累積"), "guest result should show local estimate only");
        assert(resultText.includes("正式認列 / 累積增量 0"), "guest result should keep official delta at zero");
      }
      assert(resultText.includes("本單元 15 枚徽章"), "result badge heading should show 15 badges");
      assert.deepEqual(failedImages, [], "result image requests should not fail");
      assert.deepEqual(consoleErrors, [], "result console/page errors should not occur");
      await page.close();

      ({ page, consoleErrors, failedImages } = await openSeededPage(browser, viewport, status, "achievements"));
      await page.locator(".achievements-stack").waitFor();
      const snapshot = await page.evaluate(() => {
        const unit = document.querySelector("[data-bq-unit-achievements]");
        const title = document.querySelector(".bq-title-avatar-card");
        const overview = document.querySelector(".bq-all-unit-badge-overview");
        const nodes = [...document.querySelectorAll("#screen *")];
        return {
          titleCount: document.querySelectorAll(".bq-title-avatar-card").length,
          overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
          summaryCount: document.querySelectorAll(".bq-unit-badge-summary").length,
          localTitleCardCount: document.querySelectorAll(".achievements-stack .title-card:not(.bq-title-avatar-card)").length,
          unitBeforeTitle: unit && title ? nodes.indexOf(unit) < nodes.indexOf(title) : false,
          unitBeforeOverview: unit && overview ? nodes.indexOf(unit) < nodes.indexOf(overview) : false,
          badgeCountBeforeTitle: title ? [...document.querySelectorAll("[data-bq-unit-achievements] .badge")].filter((badge) => nodes.indexOf(badge) < nodes.indexOf(title)).length : 0,
          titleText: title?.textContent || "",
          pendingBadgeCount: document.querySelectorAll("[data-bq-unit-achievements] .badge-visual.asset-missing").length,
          hasOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      assert.equal(snapshot.titleCount, 1, "title avatar card should be exactly one");
      assert.equal(snapshot.overviewCount, 1, "whole-book overview should be exactly one");
      assert.equal(snapshot.summaryCount, 52, "whole-book overview should keep 52 summaries");
      assert.equal(snapshot.localTitleCardCount, 0, "legacy local title card must not render");
      assert.equal(snapshot.unitBeforeTitle, true, "unit badge panel should appear before title card");
      assert.equal(snapshot.unitBeforeOverview, true, "unit badge panel should appear before whole-book overview");
      assert.equal(snapshot.badgeCountBeforeTitle, 15, "all 15 unit badges must appear before title card");
      assert.equal(snapshot.pendingBadgeCount, 15, "all U20 badges should stay controlled pending fallback until approved art exists");
      if (status === "verified") {
        assert(snapshot.titleText.includes("8600 EXP"), "verified title card should use StudentProgress total");
        assert(!snapshot.titleText.includes("13600"), "verified title card must ignore localStorage attempt EXP");
      }
      if (status === "pending") {
        assert(snapshot.titleText.includes("等待後台確認正式稱號進度"), "pending title card should wait for backend confirmation");
        assert(!snapshot.titleText.includes("距離"), "pending title card must not calculate distance to next title");
      }
      if (status === "guest") {
        assert(snapshot.titleText.includes("guest 測試不列入正式稱號進度"), "guest title card should not use official progress wording");
        assert(!snapshot.titleText.includes("距離"), "guest title card must not calculate distance to next title");
      }
      assert.equal(snapshot.hasOverflow, false, "achievement page should not overflow horizontally");
      assert.deepEqual(failedImages, [], "achievement image requests should not fail");
      assert.deepEqual(consoleErrors, [], "achievement console/page errors should not occur");
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("stimulus response state regression passed");
