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
].filter(([, root]) => fs.existsSync(path.join(root, "prototype-lab-entry", "index.html")));

const viewports = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }]
];

const perfectAnswers = {
  checkpoint1: {
    apparatus: {
      cylinder: "量取液體體積",
      beaker: "盛裝、混合或加熱液體",
      test_tube: "少量反應或觀察",
      dropper: "少量滴加液體",
      forceps: "夾取小物",
      slide: "承載觀察標本"
    },
    measure_20ml: "量筒",
    small_reaction: "試管",
    water_drop: "滴管",
    slide_tools: ["載玻片", "蓋玻片", "滴管", "鑷子"]
  },
  checkpoint1Hints: {},
  checkpoint2: {
    sequence: ["stop", "warn", "tell_teacher", "tool_cleanup"],
    unknown_bottle: "不擅自打開，先依教師指示確認",
    heat_direction: "試管口不要朝向自己或他人",
    waste_liquid: "依教師指示倒入指定廢液容器或處理位置",
    running_lab: "實驗室可能有火源、玻璃與藥品，跑動會增加碰撞與翻倒風險"
  },
  checkpoint2Hints: {},
  checkpoint3: {
    chemical_rules: ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問"],
    beaker_precision: "燒杯刻度多用於粗略估計，較準確量體積應選合適的量測器材",
    honest_record: "如實記錄結果與可能異常，再和老師討論"
  },
  checkpoint3Hints: {},
  checkpoint4: {},
  checkpoint4Hints: {},
  reflection: { confident_concept: "", uncertain_concept: "", student_question: "", confidence_score: 4 }
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
    const api = window.__labIntroTest;
    const baseStudent = {
      student_id: verificationStatus === "local_guest" ? "guest" : "S70101",
      student_name: verificationStatus === "local_guest" ? "老師測試帳號" : "測試學生",
      class_name: verificationStatus === "local_guest" ? "測試" : "701",
      seat_no: verificationStatus === "local_guest" ? "00" : "01",
      is_guest: verificationStatus === "local_guest",
      progress: verificationStatus === "server_verified"
        ? {
          source: "server_verified",
          progress_applied: true,
          total_exp: 500,
          completed_unit_count: 3,
          current_title_id: "life_observer",
          current_title: "生命觀察員",
          title_avatar_path: ["shared-assets", "title-avatars", "title-02-life_observer-male.webp"].join("/"),
          unit_badge_summary_json: JSON.stringify([
            { unit_id: "life_world", earned_count: 2, total_count: 9, earned_badges: [] },
            { unit_id: "scientific_method", earned_count: 2, total_count: 8, earned_badges: [] },
            { unit_id: "lab_intro", earned_count: 2, total_count: 8, earned_badges: [
              { badge_id: "lab_intro_entry", badge_name: "實驗室入門徽章", badge_image_path: ["shared-assets", "badges", "lab_intro", "badge-lab_intro-lab_intro_entry.webp"].join("/") },
              { badge_id: "lab_intro_flawless", badge_name: "實驗室零提示全對徽章", badge_image_path: ["shared-assets", "badges", "lab_intro", "badge-lab_intro-lab_intro_flawless.webp"].join("/") }
            ] }
          ])
        }
        : {}
    };
    api.setState({
      screen,
      student: baseStudent,
      attempt_id: "lab_intro_attempt_layout",
      attempt_session_id: "lab_intro_session_layout",
      attempt_session_token: "lab_intro_session_layout.nonce",
      verification_mode: verificationStatus,
      started_at: "2026-07-21T00:00:00.000Z",
      submitted_at: "2026-07-21T00:05:00.000Z",
      completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result", "achievements", "rules"],
      answers: perfectAnswers
    });
    const result = api.calculateResult();
    api.setState({
      ...api.state(),
      result: verificationStatus === "server_verified"
        ? { ...result, verification_status: "server_verified", attempt_total_exp: 500, unit_credited_exp: 500, credited_delta: 500, total: 13, correct: 13, badges: ["lab_intro_entry", "lab_intro_flawless"] }
        : { ...result, verification_status: verificationStatus },
      question_version: api.QUESTION_VERSION
    });
    api.render();
  }, { screen, verificationStatus, perfectAnswers });
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
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, student: { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01" }, progress: { total_exp: 0 }, completed_attempts: 0, attempt_type: "first" }) });
        return;
      }
      if (url.includes("startAttempt")) {
        await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, verification_mode: "server_verified", question_version: "20260720-lab-intro-canonical-v1", attempt_id: "lab_intro_attempt_browser", attempt_session_id: "lab_intro_session_browser", attempt_session_token: "lab_intro_session_browser.nonce", issued_at: "2026-07-21T00:00:00.000Z" }) });
        return;
      }
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.goto(pathToFileURL(path.join(siteRoot, "prototype-lab-entry", "index.html")).href);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await assertNoBrokenRuntime(page, errors, `${siteLabel}/${viewportLabel}/login`);

    await page.fill("#studentIdInput", "S70101");
    await page.click("#loginButton");
    await page.waitForSelector("#loginMessage >> text=正在連接 BioQuest 學習後台");
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
    assert(backendCalls.some((url) => url.includes("getStudentAndAttemptStatus")), `${siteLabel}/${viewportLabel}: official login must read student`);
    assert(backendCalls.some((url) => url.includes("startAttempt")), `${siteLabel}/${viewportLabel}: official login must start session`);

    backendCalls.length = 0;
    await page.goto(pathToFileURL(path.join(siteRoot, "prototype-lab-entry", "index.html")).href);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.click("#guestButton");
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
    assert.equal(backendCalls.length, 0, `${siteLabel}/${viewportLabel}: guest login must not call backend`);

    for (const status of ["local_guest", "pending_backend", "server_verified"]) {
      await seedScreen(page, "result", status);
      await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
      const resultText = await page.locator("#screen").innerText();
      if (status === "local_guest") assert(resultText.includes("guest 測試：本次預估"), `${siteLabel}/${viewportLabel}: guest result copy missing`);
      if (status === "pending_backend") assert(resultText.includes("待後台確認"), `${siteLabel}/${viewportLabel}: pending result copy missing`);
      if (status === "server_verified") assert(resultText.includes("正式認列完成"), `${siteLabel}/${viewportLabel}: verified result copy missing`);

      await seedScreen(page, "achievements", status);
      await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "achievements");
      const counts = await page.evaluate(() => ({
        titleAvatar: document.querySelectorAll(".bq-title-avatar-card").length,
        overview: document.querySelectorAll(".bq-all-unit-badge-overview").length,
        summaries: document.querySelectorAll(".bq-unit-badge-summary").length,
        unitPanelBeforeOverview: (() => {
          const unit = document.querySelector("[data-bq-unit-achievements]");
          const overview = document.querySelector(".bq-all-unit-badge-overview");
          return Boolean(unit && overview && (unit.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING));
        })()
      }));
      assert.equal(counts.titleAvatar, 1, `${siteLabel}/${viewportLabel}/${status}: title avatar must be exactly one`);
      assert.equal(counts.overview, 1, `${siteLabel}/${viewportLabel}/${status}: overview must be exactly one`);
      assert.equal(counts.summaries, 52, `${siteLabel}/${viewportLabel}/${status}: expected 52 summary boxes`);
      assert.equal(counts.unitPanelBeforeOverview, true, `${siteLabel}/${viewportLabel}/${status}: unit achievements must precede overview`);
    }

    await assertNoBrokenRuntime(page, errors, `${siteLabel}/${viewportLabel}/final`);
    await browser.close();
  }
}

console.log("prototype-lab-entry layout regression passed");
