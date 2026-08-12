#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-human-circulation")
  : sourceRoot;
const VERSION = "20260813-human-circulation-mapping-v1";
const STORAGE_KEY = "bioquest_human_circulation_state_v1";
const QUESTION_VERSION = "20260718-human-circulation-ready-v1";
const UNIT_ID = "human_circulation";

function stateFor(status, screen) {
  const isGuest = status === "guest";
  const verificationStatus = status === "verified" ? "server_verified" : status === "guest" ? "local_guest" : "pending_backend";
  return {
    screen,
    student: {
      student_id: isGuest ? "guest" : "S90019",
      student_name: isGuest ? "老師測試帳號" : "測試學生",
      class_name: isGuest ? "測試" : "901",
      seat_no: isGuest ? "00" : "19",
      is_guest: isGuest,
      profile_gender: "male",
      current_title_id: "life_observer",
      progress: isGuest ? {} : {
        source: status === "verified" ? "server_verified" : "pending_backend",
        progress_applied: status === "verified",
        total_exp: status === "verified" ? 4320 : 3880,
        completed_unit_count: status === "verified" ? 9 : 8,
        unit_badge_summary_json: JSON.stringify([
          { unit_id: "life_world", unit_title: "多彩多姿的生命世界", total_count: 8, earned_count: 2, earned_badges: [] },
          { unit_id: UNIT_ID, unit_title: "人體的循環系統", total_count: 15, earned_count: status === "verified" ? 1 : 0, earned_badges: [] }
        ])
      }
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
      completion_exp: 60,
      direct_exp: 220,
      revision_exp: 180,
      reflection_exp: 0,
      mastery_exp: 0,
      retry_exp: 0,
      unit_credited_exp: 460,
      exp_delta: status === "verified" ? 460 : 0,
      earned_badges: ["human_circulation_flawless"]
    }
  };
}

function assertOrder(snapshot) {
  assert.equal(snapshot.titleCount, 1, "title avatar card should be exactly one");
  assert.equal(snapshot.overviewCount, 1, "whole-book overview should be exactly one");
  assert.equal(snapshot.summaryCount, 52, "whole-book overview should keep 52 summaries");
  assert.equal(snapshot.unitWallCount, 0, "achievements should not render a unit badge wall");
  assert.equal(snapshot.titleBeforeOverview, true, "title progress should appear before whole-book overview");
  assert.equal(snapshot.localTitleCardCount, 0, "legacy local title card must not render");
}

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
async function openSeededPage(viewport, status, screen) {
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
  }, { key: STORAGE_KEY, seeded: stateFor(status, screen) });
  await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=${VERSION}`);
  return { page, consoleErrors, failedImages };
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const status of ["verified", "pending", "guest"]) {
      let { page, consoleErrors, failedImages } = await openSeededPage(viewport, status, "result");
      await page.locator(".result-panel").waitFor();
      const resultText = await page.locator("#screen").textContent();
      if (status === "verified") assert(resultText.includes("本單元後台認列"), "verified result should use official credited wording");
      if (status === "pending") assert(resultText.includes("待後台確認"), "pending result should use pending wording");
      if (status === "guest") assert(resultText.includes("不列入正式累積"), "guest result should state no official accumulation");
      assert(resultText.includes("本次取得徽章"), "result should show earned-only badge heading");
      assert(!resultText.includes("本單元 15 枚徽章"), "result should not render full unit badge catalog");
      assert.equal(await page.locator(".result-panel [data-relogin='true']").count(), 1, "result should expose relogin entry");
      assert.deepEqual(failedImages, [], "result image requests should not fail");
      assert.deepEqual(consoleErrors, [], "result console/page errors should not occur");
      await page.close();

      ({ page, consoleErrors, failedImages } = await openSeededPage(viewport, status, "achievements"));
      await page.locator(".achievements-stack").waitFor();
      const snapshot = await page.evaluate(() => {
        const title = document.querySelector(".bq-title-avatar-card");
        const overview = document.querySelector(".bq-all-unit-badge-overview");
        const nodes = [...document.querySelectorAll("#screen *")];
        return {
          titleCount: document.querySelectorAll(".bq-title-avatar-card").length,
          overviewCount: document.querySelectorAll(".bq-all-unit-badge-overview").length,
          summaryCount: document.querySelectorAll(".bq-unit-badge-summary").length,
          localTitleCardCount: document.querySelectorAll(".achievements-stack .title-card").length,
          unitWallCount: document.querySelectorAll("[data-bq-unit-achievements]").length,
          titleBeforeOverview: title && overview ? nodes.indexOf(title) < nodes.indexOf(overview) : false,
          titleText: title?.textContent || "",
          readyBadgeImages: [...document.querySelectorAll(".achievements-stack .badge-visual img")].map((img) => ({
            src: img.getAttribute("src") || "",
            currentSrc: img.currentSrc || "",
            complete: img.complete,
            naturalWidth: img.naturalWidth
          })),
          pendingBadgeCount: document.querySelectorAll(".achievements-stack .badge-visual.asset-missing").length,
          hasOverflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      assertOrder(snapshot);
      assert.equal(snapshot.readyBadgeImages.length, 0, "achievements should not render unit badge images");
      assert.equal(snapshot.pendingBadgeCount, 0, "achievements should not render controlled pending fallback cards");
      if (status === "pending") {
        assert(snapshot.titleText.includes("等待後台確認正式稱號進度"), "pending title card should wait for backend confirmation");
        assert(!snapshot.titleText.includes("距離"), "pending title card must not calculate distance to next title");
      }
      if (status === "guest") {
        assert(snapshot.titleText.includes("guest 測試不列入正式稱號進度"), "guest title card should not use official progress wording");
        assert(!snapshot.titleText.includes("距離"), "guest title card must not calculate distance to next title");
      }
      assert.equal(snapshot.hasOverflow, false, "achievement page should not overflow horizontally");
      assert.equal(await page.locator(".achievements-stack [data-relogin='true']").count(), 1, "achievements should expose relogin entry");
      assert(!(await page.locator("#screen").textContent()).includes("本單元 15 枚徽章"), "achievements should not render unit badge heading");
      assert.deepEqual(failedImages, [], "achievement image requests should not fail");
      assert.deepEqual(consoleErrors, [], "achievement console/page errors should not occur");
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("human circulation state regression passed");
