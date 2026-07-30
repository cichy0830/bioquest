#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import playwright from "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";

const { chromium } = playwright;
const chromeExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const siteRoots = [
  ["source", workspaceRoot],
  ["publish", path.join(workspaceRoot, "_publish", "bioquest")]
].filter(([, root]) => fs.existsSync(path.join(root, "prototype-microscope-use", "index.html")));

const viewports = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }]
];

const perfectAnswers = {
  checkpoint1: {
    parts: {
      eyepiece: "上方觀察處",
      objective: "靠近玻片的放大鏡頭",
      stage: "承放玻片的位置",
      coarse: "側邊大幅調焦",
      fine: "側邊微調焦距",
      light: "載物臺下方調整進光"
    },
    functions: {
      viewing_path: "目鏡",
      first_magnify: "物鏡",
      slide_support: "載物臺",
      large_focus: "粗調節輪",
      tiny_focus: "細調節輪",
      brightness_control: "光圈"
    },
    fine_focus: "細調節輪",
    too_dark: "調整光源、反光鏡或光圈"
  },
  checkpoint1Hints: {},
  checkpoint2: {
    sequence: { low_power: 1, place_slide: 2, adjust_light: 3, coarse_focus: 4, fine_focus: 5, high_power: 6 },
    high_power_first: "低倍視野較大、較亮，通常較容易先找到標本",
    high_power_focus: "輕微轉動細調節輪",
    carry_scope: "一手握鏡臂，一手托鏡座",
    storage_steps: ["轉回低倍物鏡", "取下玻片", "下降載物臺或鏡筒至安全位置", "整理電源線或防塵"]
  },
  checkpoint2Hints: {},
  checkpoint3: {
    magnification_400: "400x",
    magnification_add: "總倍率應為目鏡倍率乘以物鏡倍率",
    slide_right: "向左",
    center_right: "向右",
    high_power_change: "視野範圍變小、亮度常變暗",
    high_power_better: "高倍能看細節，但視野較小且較暗，找標本時不一定方便"
  },
  checkpoint3Hints: {},
  checkpoint4: {},
  checkpoint4Hints: {},
  reflection: { confident_concept: "倍率", uncertain_concept: "視野方向", student_question: "為什麼玻片移動方向和視野影像方向相反？", confidence_score: 4 }
};

async function assertNoBrokenRuntime(page, errors, label) {
  await page.waitForLoadState("domcontentloaded");
  const badResponses = errors.responses.filter((entry) => entry.status >= 400 && /\.(png|jpe?g|webp|css|js)(\?|$)/i.test(entry.url));
  assert.equal(errors.console.length, 0, `${label}: console errors: ${errors.console.join(" | ")}`);
  assert.equal(errors.page.length, 0, `${label}: page errors: ${errors.page.join(" | ")}`);
  assert.equal(badResponses.length, 0, `${label}: broken assets ${JSON.stringify(badResponses)}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `${label}: horizontal overflow ${overflow}`);
}

async function seedScreen(page, screen, verificationStatus) {
  await page.evaluate(({ screen, verificationStatus, perfectAnswers }) => {
    const api = window.__microscopeUseTest;
    const progress = verificationStatus === "server_verified"
      ? {
        source: "server_verified",
        progress_applied: true,
        total_exp: 1880,
        completed_unit_count: 4,
        current_title_id: "ecology_recorder",
        current_title: "生態記錄員",
        title_avatar_path: ["shared-assets", "title-avatars", "title-03-ecology_recorder-male.webp"].join("/"),
        unit_badge_summary_json: JSON.stringify([
          { unit_id: "life_world", earned_count: 2, total_count: 9, earned_badges: [] },
          { unit_id: "scientific_method", earned_count: 2, total_count: 8, earned_badges: [] },
          { unit_id: "lab_intro", earned_count: 2, total_count: 8, earned_badges: [] },
          { unit_id: "microscope_use", earned_count: 2, total_count: 8, earned_badges: [
            { badge_id: "microscope_use_entry", badge_name: "微觀校準入門徽章", badge_image_path: ["shared-assets", "badges", "microscope_use", "badge-microscope_use-microscope_use_entry.webp"].join("/") },
            { badge_id: "microscope_use_flawless", badge_name: "顯微鏡零提示全對徽章", badge_image_path: ["shared-assets", "badges", "microscope_use", "badge-microscope_use-microscope_use_flawless.webp"].join("/") }
          ] }
        ])
      }
      : {};
    const student = {
      student_id: verificationStatus === "local_guest" ? "guest" : "S70104",
      student_name: verificationStatus === "local_guest" ? "老師測試帳號" : "測試學生",
      class_name: verificationStatus === "local_guest" ? "測試" : "701",
      seat_no: verificationStatus === "local_guest" ? "00" : "04",
      is_guest: verificationStatus === "local_guest",
      progress
    };
    api.setState({
      screen,
      student,
      attempt_id: "microscope_use_attempt_layout",
      attempt_session_id: "microscope_use_session_layout",
      attempt_session_token: "microscope_use_session_layout.nonce",
      verification_mode: verificationStatus,
      started_at: "2026-07-30T13:00:00.000Z",
      submitted_at: "2026-07-30T13:10:00.000Z",
      completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result", "achievements", "rules"],
      answers: perfectAnswers
    });
    const result = api.calculateResult();
    api.setState({
      ...api.state(),
      result: verificationStatus === "server_verified"
        ? { ...result, verification_status: "server_verified", attempt_total_exp: 500, unit_credited_exp: 500, credited_delta: 500, badges: ["microscope_use_entry", "microscope_use_flawless"] }
        : { ...result, verification_status: verificationStatus },
      question_version: api.QUESTION_VERSION
    });
    api.render();
  }, { screen, verificationStatus, perfectAnswers });
}

async function assertRetryContract(page, status, label, backendCalls) {
  await seedScreen(page, "result", status);
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
  const resultCounts = await page.evaluate(() => ({
    relogin: document.querySelectorAll("[data-relogin-action]").length,
    earnedGrid: document.querySelectorAll("[data-earned-only='true']").length,
    lockedBadges: document.querySelectorAll(".badge.locked").length,
    badgeCards: document.querySelectorAll("[data-badge-id]").length,
    allCatalog: document.querySelectorAll("[data-badge-id]").length >= 8
  }));
  assert(resultCounts.relogin >= 1, `${label}/${status}: result relogin entry missing`);
  assert.equal(resultCounts.earnedGrid, 1, `${label}/${status}: result must use one earned-only badge grid`);
  assert.equal(resultCounts.lockedBadges, 0, `${label}/${status}: result must not show locked badges`);
  assert.equal(resultCounts.allCatalog, false, `${label}/${status}: result must not show the full catalog`);
  if (status === "server_verified") assert.equal(resultCounts.badgeCards, 2, `${label}/${status}: verified result should show exactly this attempt's two earned badges`);

  await seedScreen(page, "achievements", status);
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "achievements");
  const achievementCounts = await page.evaluate(() => ({
    titleAvatar: document.querySelectorAll(".bq-title-avatar-card").length,
    overview: document.querySelectorAll(".bq-all-unit-badge-overview").length,
    summaries: document.querySelectorAll(".bq-unit-badge-summary").length,
    unitWall: document.querySelectorAll("[data-bq-unit-achievements]").length,
    badgeCards: document.querySelectorAll("[data-badge-id]").length,
    relogin: document.querySelectorAll("[data-relogin-action]").length
  }));
  assert.equal(achievementCounts.titleAvatar, 1, `${label}/${status}: title avatar must be exactly one`);
  assert.equal(achievementCounts.overview, 1, `${label}/${status}: overview must be exactly one`);
  assert.equal(achievementCounts.summaries, 52, `${label}/${status}: expected 52 summary boxes`);
  assert.equal(achievementCounts.unitWall, 0, `${label}/${status}: achievements must not render local unit wall`);
  assert.equal(achievementCounts.badgeCards, 0, `${label}/${status}: achievements must not render unit badge cards`);
  assert(achievementCounts.relogin >= 1, `${label}/${status}: achievements relogin entry missing`);

  await seedScreen(page, "rules", status);
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "rules");
  assert(await page.locator("[data-relogin-action]").count() >= 1, `${label}/${status}: rules relogin entry missing`);

  backendCalls.length = 0;
  await seedScreen(page, "result", status);
  await page.locator("[data-relogin-action]").first().click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "login");
  const resetState = await page.evaluate(() => {
    const api = window.__microscopeUseTest;
    return {
      student: api.state().student,
      attemptId: api.state().attempt_id,
      token: api.state().attempt_session_token,
      result: api.state().result,
      submitted: api.state().submitted_at
    };
  });
  assert.equal(resetState.student, null, `${label}/${status}: reset should clear current student`);
  assert.equal(resetState.attemptId, "", `${label}/${status}: reset should clear current attempt`);
  assert.equal(resetState.token, "", `${label}/${status}: reset should clear current token`);
  assert.equal(resetState.result, null, `${label}/${status}: reset should clear current result`);
  assert.equal(resetState.submitted, null, `${label}/${status}: reset should clear submitted flag`);

  if (status === "local_guest") {
    await page.click("#guestButton");
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
    assert.equal(backendCalls.length, 0, `${label}/${status}: guest retry must not call backend`);
  } else {
    await page.fill("#studentIdInput", "S70104");
    await page.click("#loginButton");
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
    assert(backendCalls.some((url) => url.includes("getStudentAndAttemptStatus")), `${label}/${status}: formal retry must read student`);
    assert(backendCalls.some((url) => url.includes("startAttempt")), `${label}/${status}: formal retry must start a new attempt`);
  }
}

for (const [siteLabel, siteRoot] of siteRoots) {
  for (const [viewportLabel, viewport] of viewports) {
    const browser = await chromium.launch({
      headless: true,
      executablePath: fs.existsSync(chromeExecutablePath) ? chromeExecutablePath : undefined
    });
    const page = await browser.newPage({ viewport });
    const errors = { console: [], page: [], responses: [] };
    const backendCalls = [];
    page.on("console", (msg) => { if (["error", "warning"].includes(msg.type())) errors.console.push(msg.text()); });
    page.on("pageerror", (error) => errors.page.push(error.message));
    page.on("response", (response) => errors.responses.push({ status: response.status(), url: response.url() }));
    await page.route("https://script.google.com/**", async (route) => {
      const url = route.request().url();
      backendCalls.push(url);
      if (url.includes("getStudentAndAttemptStatus")) {
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, student: { student_id: "S70104", student_name: "測試學生", class_name: "701", seat_no: "04" }, progress: { total_exp: 1880 }, completed_attempts: 1, attempt_type: "retry" }) });
        return;
      }
      if (url.includes("startAttempt")) {
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, verification_mode: "server_verified", question_version: "20260720-microscope-use-canonical-v1", attempt_id: `microscope_use_attempt_${Date.now()}`, attempt_session_id: "microscope_use_session_browser", attempt_session_token: "microscope_use_session_browser.nonce", issued_at: "2026-07-30T13:00:00.000Z" }) });
        return;
      }
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto(pathToFileURL(path.join(siteRoot, "prototype-microscope-use", "index.html")).href);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await assertNoBrokenRuntime(page, errors, `${siteLabel}/${viewportLabel}/login`);
    for (const status of ["local_guest", "pending_backend", "server_verified"]) {
      await assertRetryContract(page, status, `${siteLabel}/${viewportLabel}`, backendCalls);
    }
    await assertNoBrokenRuntime(page, errors, `${siteLabel}/${viewportLabel}/final`);
    await browser.close();
  }
}

console.log("prototype-microscope-use submitted retry layout regression passed");
