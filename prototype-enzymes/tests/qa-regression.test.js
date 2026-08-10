#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";

const { chromium } = playwright;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = process.env.BIOQUEST_AUDIT_ROOT ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT) : path.resolve(root, "..");
const version = "20260811-enzymes-submitted-retry-ia-v1";
const questionVersion = "20260720-enzymes-user-review-v2";
const artifactDir = process.env.BIOQUEST_ARTIFACT_DIR
  ? path.resolve(process.env.BIOQUEST_ARTIFACT_DIR)
  : path.join(root, "tests", "artifacts", version);
fs.mkdirSync(artifactDir, { recursive: true });

const choiceAnswers = {
  q01: "promote_reaction", q02: "not_consumed", q04: "not_match",
  q05: "optimal_temperature", q06: "not_always_hotter", q07: "acidic", q08: "activity_lower",
  q10: "digest_specific", q11: "protease", q12: "not_only_breakdown", q13: "not_energy", q14: "different_conditions"
};
const q03Answers = { amylase: "starch", protease: "protein", lipase: "lipid" };

function contentType(filePath) {
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png" }[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function startServer(baseRoot) {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
    if (requestPath === "/favicon.ico") return void (res.writeHead(204), res.end());
    const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(baseRoot, cleanPath);
    if (!filePath.startsWith(baseRoot)) return void (res.writeHead(403), res.end("Forbidden"));
    fs.readFile(filePath, (error, buffer) => {
      if (error) return void (res.writeHead(404), res.end("Not found"));
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

function unitSummary(unitId, sequence, unitTitle, totalBadges, earnedCount, badgeId = `${unitId}_entry`) {
  const badgePath = unitId === "life_world"
    ? `prototype-life-world/assets/badges/${badgeId}.webp`
    : `shared-assets/badges/${unitId}/badge-${unitId}-${badgeId}.webp`;
  return {
    unit_id: unitId,
    sequence,
    unit_title: unitTitle,
    station_title: `第 ${sequence} 站｜${unitTitle}`,
    availability_status: "open",
    total_badges: totalBadges,
    earned_count: earnedCount,
    earned_badges: earnedCount ? [{ badge_id: badgeId, badge_image_path: badgePath }] : []
  };
}

function backendFixture(mode) {
  return ({ mode }) => {
    const history = [
      unitSummary("life_world", 1, "多彩多姿的生命世界", 9, 1, "life_world_entry"),
      unitSummary("scientific_method", 2, "探究自然的科學方法", 10, 2, "scientific_method_entry"),
      unitSummary("lab_intro", 3, "進入實驗室", 10, 2, "lab_intro_entry"),
      unitSummary("microscope_use", 4, "顯微鏡的使用", 10, 2, "microscope_use_entry"),
      unitSummary("cell_basic_unit", 5, "生物體的基本單位", 8, 2, "cell_basic_unit_entry"),
      unitSummary("cell_structure", 6, "細胞的構造", 9, 2, "cell_structure_entry"),
      unitSummary("cell_observation", 7, "細胞的觀察", 10, 2, "cell_observation_entry"),
      unitSummary("cell_transport", 8, "物質進出細胞的方式", 10, 2, "cell_transport_entry"),
      unitSummary("biological_organization", 9, "生物體的組成層次", 10, 2, "biological_organization_entry"),
      unitSummary("scale", 10, "尺度", 11, 2, "scale_entry"),
      unitSummary("nutrients_energy", 11, "食物中的養分與能量", 11, 2, "nutrients_energy_entry"),
      unitSummary("nutrient_test", 12, "養分檢測", 11, 2, "nutrient_test_entry")
    ];
    const loginProgress = {
      source: "server_verified",
      progress_applied: true,
      total_exp: 5820,
      current_title_id: "concept_solver",
      current_title: "概念解謎者",
      title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
      completed_unit_count: 12,
      unit_badge_summary_json: JSON.stringify(history)
    };
    const verifiedProgress = {
      ...loginProgress,
      total_exp: 6280,
      completed_unit_count: 13,
      unit_badge_summary_json: JSON.stringify([...history, unitSummary("enzymes", 13, "酵素", 11, 4, "enzymes_entry")])
    };
    window.__backendActions = [];
    window.__capturedPayloads = [];
    window.fetch = async (url, options = {}) => {
      const href = String(url);
      window.__backendActions.push(href);
      if (href.includes("getStudentAndAttemptStatus")) {
        return new Response(JSON.stringify({
          ok: true,
          student: { student_id: "SQA13V", student_name: "酵素同學", class_name: "七年一班", seat_no: "13", profile_gender: "male", title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp" },
          progress: loginProgress,
          attempt_status: { completed_attempt_count: 0 }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("startAttempt")) {
        return new Response(JSON.stringify({ ok: true, attempt_type: "first", issued_at: "2026-07-18T00:00:00.000Z", attempt_id: "enzymes_attempt_1", attempt_session_id: "enzymes_session_1", attempt_session_token: "enzymes_token_1", question_version: questionVersion, previous_attempt_id: "", expires_at: "2026-07-18T01:00:00.000Z" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("hintEvent")) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      if (href.includes("submitAttempt")) {
        window.__capturedPayloads.push(String(options.body || ""));
        if (mode === "pending") return new Response("temporary unavailable", { status: 503 });
        return new Response(JSON.stringify({ ok: true, verification_status: "server_verified", attempt_id: "enzymes_verified_attempt", student_progress: verifiedProgress, verified_attempt: { verification_status: "server_verified", attempt_total_exp: 460, unit_credited_exp: 460, credited_delta: 460, question_exp: 0, badges: ["enzymes_entry", "enzyme_function_booster", "enzymes_flawless"] } }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
  };
}

async function login(page, mode) {
  if (mode === "guest") return page.locator("#guestButton").click();
  await page.locator("#studentIdInput").fill("SQA13V");
  await page.locator("#loginButton").click();
}

async function completeMission(page) {
  await page.locator("#briefNext").click();
  await page.locator("#scanNext").click();
  for (const qid of ["q01", "q02"]) await page.locator(`[data-choice="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  for (const [item, value] of Object.entries(q03Answers)) await page.locator(`select[data-classify-question="q03"][data-classify-item="${item}"]`).selectOption(value);
  await page.locator(`[data-choice="q04"][data-value="${choiceAnswers.q04}"]`).click();
  await page.locator("#checkSection").click();
  for (const qid of ["q05", "q06", "q07", "q08"]) await page.locator(`[data-choice="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  await page.locator("#checkSection").click();
  for (const qid of ["q10", "q11", "q12", "q13", "q14"]) await page.locator(`[data-choice="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  await page.locator("#checkSection").click();
  await page.locator("#reviewNext").click();
  await page.locator("#submitMission").click();
}

async function runCase(browser, baseUrl, viewport, mode) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  const backendActions = [];
  const capturedPayloads = [];
  const page = await context.newPage();
  await page.route("**/macros/s/**", async (route) => {
    const request = route.request();
    const href = request.url();
    backendActions.push(href);
    if (href.includes("getStudentAndAttemptStatus")) {
      const history = [
        unitSummary("life_world", 1, "多彩多姿的生命世界", 9, 1, "life_world_entry"),
        unitSummary("scientific_method", 2, "探究自然的科學方法", 10, 2, "scientific_method_entry"),
        unitSummary("lab_intro", 3, "進入實驗室", 10, 2, "lab_intro_entry"),
        unitSummary("microscope_use", 4, "顯微鏡的使用", 10, 2, "microscope_use_entry"),
        unitSummary("cell_basic_unit", 5, "生物體的基本單位", 8, 2, "cell_basic_unit_entry"),
        unitSummary("cell_structure", 6, "細胞的構造", 9, 2, "cell_structure_entry"),
        unitSummary("cell_observation", 7, "細胞的觀察", 10, 2, "cell_observation_entry"),
        unitSummary("cell_transport", 8, "物質進出細胞的方式", 10, 2, "cell_transport_entry"),
        unitSummary("biological_organization", 9, "生物體的組成層次", 10, 2, "biological_organization_entry"),
        unitSummary("scale", 10, "尺度", 11, 2, "scale_entry"),
        unitSummary("nutrients_energy", 11, "食物中的養分與能量", 11, 2, "nutrients_energy_entry"),
        unitSummary("nutrient_test", 12, "養分檢測", 11, 2, "nutrient_test_entry")
      ];
      const loginProgress = {
        source: "server_verified",
        progress_applied: true,
        total_exp: 5820,
        current_title_id: "concept_solver",
        current_title: "概念解謎者",
        title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
        completed_unit_count: 12,
        unit_badge_summary_json: JSON.stringify(history)
      };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        ok: true,
        student: { student_id: "SQA13V", student_name: "酵素同學", class_name: "七年一班", seat_no: "13", profile_gender: "male", title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp" },
        progress: loginProgress,
        attempt_status: { completed_attempt_count: 0 }
      }) });
      return;
    }
    if (href.includes("startAttempt")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, attempt_type: "first", issued_at: "2026-07-18T00:00:00.000Z", attempt_id: "enzymes_attempt_1", attempt_session_id: "enzymes_session_1", attempt_session_token: "enzymes_token_1", question_version: questionVersion, previous_attempt_id: "", expires_at: "2026-07-18T01:00:00.000Z" }) });
      return;
    }
    if (href.includes("hintEvent")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }
    if (href.includes("submitAttempt")) {
      capturedPayloads.push(request.postData() || "");
      if (mode === "pending") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, error: "backend_temporary_unavailable" }) });
        return;
      }
      const history = JSON.parse(JSON.stringify([
        unitSummary("life_world", 1, "多彩多姿的生命世界", 9, 1, "life_world_entry"),
        unitSummary("scientific_method", 2, "探究自然的科學方法", 10, 2, "scientific_method_entry"),
        unitSummary("lab_intro", 3, "進入實驗室", 10, 2, "lab_intro_entry"),
        unitSummary("microscope_use", 4, "顯微鏡的使用", 10, 2, "microscope_use_entry"),
        unitSummary("cell_basic_unit", 5, "生物體的基本單位", 8, 2, "cell_basic_unit_entry"),
        unitSummary("cell_structure", 6, "細胞的構造", 9, 2, "cell_structure_entry"),
        unitSummary("cell_observation", 7, "細胞的觀察", 10, 2, "cell_observation_entry"),
        unitSummary("cell_transport", 8, "物質進出細胞的方式", 10, 2, "cell_transport_entry"),
        unitSummary("biological_organization", 9, "生物體的組成層次", 10, 2, "biological_organization_entry"),
        unitSummary("scale", 10, "尺度", 11, 2, "scale_entry"),
        unitSummary("nutrients_energy", 11, "食物中的養分與能量", 11, 2, "nutrients_energy_entry"),
        unitSummary("nutrient_test", 12, "養分檢測", 11, 2, "nutrient_test_entry"),
        unitSummary("enzymes", 13, "酵素", 11, 4, "enzymes_entry")
      ]));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        ok: true,
        verification_status: "server_verified",
        attempt_id: "enzymes_verified_attempt",
        student_progress: { source: "server_verified", progress_applied: true, total_exp: 6280, completed_unit_count: 13, current_title_id: "concept_solver", current_title: "概念解謎者", title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp", unit_badge_summary_json: JSON.stringify(history) },
        verified_attempt: { verification_status: "server_verified", attempt_total_exp: 460, unit_credited_exp: 460, credited_delta: 460, question_exp: 0, badges: ["enzymes_entry", "enzyme_function_booster", "enzymes_flawless"] }
      }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`${baseUrl}/prototype-enzymes/index.html?v=${version}`, { waitUntil: "domcontentloaded" });
  await login(page, mode);
  try {
    await page.waitForSelector("#screen[data-bioquest-screen='brief']", { timeout: 8000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      screen: document.querySelector("#screen")?.dataset.bioquestScreen,
      text: document.querySelector("#screen")?.textContent?.slice(0, 500),
      actions: [],
      payloads: []
    }));
    throw new Error(`did not reach brief for ${mode} ${viewport.width}: ${JSON.stringify({ ...debug, backendActions })}`);
  }
  await completeMission(page);
  await page.waitForSelector("#screen[data-bioquest-screen='result']");
  const resultText = await page.locator("#screen").textContent();
  if (mode === "guest") assert.match(resultText, /guest 測試：本次預估 \d+\/500 EXP，不列入正式累積/);
  if (mode === "pending") assert.match(resultText, /本次預估 \d+\/500 EXP，待後台確認/);
  if (mode === "verified") assert.match(resultText, /本單元正式認列|後台已回傳正式認列資料/);
  const resultMetrics = await page.locator("#screen").evaluate((root) => ({
    earnedCards: root.querySelectorAll("[data-result-earned-badges] .badge-card").length,
    earnedImages: [...root.querySelectorAll("[data-result-earned-badges] img")].map((img) => img.currentSrc || img.src),
    allBadgeCards: root.querySelectorAll(".badge-card").length,
    reloginEntries: [...root.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
    text: root.textContent
  }));
  assert.equal(resultMetrics.earnedCards, mode === "verified" ? 3 : 8, `${mode} ${viewport.width}: result should show this attempt earned badges only`);
  assert.equal(resultMetrics.allBadgeCards, resultMetrics.earnedCards, `${mode} ${viewport.width}: result must not render full 11-badge catalog`);
  assert.equal(resultMetrics.earnedImages.length, resultMetrics.earnedCards, `${mode} ${viewport.width}: earned badge images`);
  assert.ok(resultMetrics.earnedImages.every((src) => src.includes(`v=${version}`)), `${mode} ${viewport.width}: result badge cache`);
  assert.equal(resultMetrics.reloginEntries, 1, `${mode} ${viewport.width}: result relogin entry`);
  assert.match(resultMetrics.text, /重新登入，並從登入頁開始/);

  await page.locator("#resultAchievements").click();
  await page.waitForSelector("[data-bq-badge-overview]");
  const achievements = await page.locator("#screen").evaluate((root) => {
    const panels = [...root.querySelectorAll(".panel")];
    return {
      screen: root.dataset.bioquestScreen,
      titleImageCount: root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img").length,
      overviewCount: root.querySelectorAll("[data-bq-badge-overview]").length,
      summaryBoxCount: root.querySelectorAll(".bq-unit-badge-summary").length,
      unitIndex: panels.findIndex((panel) => panel.querySelector(".badge-grid")),
      overviewIndex: panels.findIndex((panel) => panel.matches("[data-bq-badge-overview]")),
      unitPanels: root.querySelectorAll("[data-bq-unit-achievements]").length,
      badgeCards: root.querySelectorAll(".badge-card").length,
      reloginEntries: [...root.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
      sidebarLoginDisabled: document.querySelector("[data-nav='login']")?.disabled ?? true,
      text: root.textContent,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
  assert.equal(achievements.screen, "achievements");
  assert.equal(achievements.titleImageCount, 1, `${mode} ${viewport.width}: title avatar`);
  assert.equal(achievements.overviewCount, 1, `${mode} ${viewport.width}: overview`);
  assert.equal(achievements.summaryBoxCount, 52, `${mode} ${viewport.width}: 52 overview cards`);
  assert.equal(achievements.unitPanels, 0, `${mode} ${viewport.width}: achievements must not render unit wall`);
  assert.equal(achievements.badgeCards, 0, `${mode} ${viewport.width}: achievements must not show unit badge cards`);
  assert.equal(achievements.reloginEntries, 1, `${mode} ${viewport.width}: achievements relogin entry`);
  assert.equal(achievements.sidebarLoginDisabled, false, `${mode} ${viewport.width}: submitted sidebar login`);
  assert.ok(achievements.overviewIndex >= 0 && achievements.unitIndex === -1, `${mode} ${viewport.width}: overview-only achievements`);
  assert.equal(achievements.horizontalOverflow, false, `${mode} ${viewport.width}: no horizontal overflow`);
  if (mode === "verified") {
    assert.match(achievements.text, /6280 EXP｜已完成 13 站/);
    assert.match(achievements.text, /距離「系統調查員」還差 1720 EXP/);
  }
  if (mode === "pending") {
    assert.match(achievements.text, /5820 EXP｜已完成 12 站/);
    assert.match(achievements.text, /距離「系統調查員」還差 2180 EXP/);
  }
  if (mode === "guest") {
    assert.match(achievements.text, /0 EXP｜已完成 0 站/);
    assert.match(achievements.text, /guest 測試不列入正式稱號進度/);
  }
  assert.match(achievements.text, /重新登入，並從登入頁開始/);

  await page.locator("#achieveResult").click();
  await page.locator("#resultRules").click();
  await page.waitForSelector("#screen[data-bioquest-screen='rules']");
  const beforeResetActions = backendActions.length;
  const rulesMetrics = await page.locator("#screen").evaluate((root) => ({
    reloginEntries: [...root.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
    text: root.textContent,
    sidebarLoginDisabled: document.querySelector("[data-nav='login']")?.disabled ?? true
  }));
  assert.equal(rulesMetrics.reloginEntries, 1, `${mode} ${viewport.width}: rules relogin entry`);
  assert.equal(rulesMetrics.sidebarLoginDisabled, false, `${mode} ${viewport.width}: rules sidebar login`);
  assert.match(rulesMetrics.text, /重新登入，並從登入頁開始/);
  await page.locator("[data-relogin-action]").click();
  await page.waitForSelector("#screen[data-bioquest-screen='login']");
  const resetMetrics = await page.evaluate(() => ({
    screen: document.querySelector("#screen")?.dataset.bioquestScreen,
    state: JSON.parse(localStorage.getItem("bioquest_enzymes_state_v1") || "{}"),
    attempts: JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]")
  }));
  assert.equal(resetMetrics.screen, "login", `${mode} ${viewport.width}: relogin returns to login`);
  assert.equal(backendActions.length, beforeResetActions, `${mode} ${viewport.width}: reset must not call backend`);
  assert.equal(resetMetrics.state.student, null, `${mode} ${viewport.width}: current student cleared`);
  assert.equal(resetMetrics.state.attempt_id, "", `${mode} ${viewport.width}: current attempt cleared`);
  assert.equal(resetMetrics.attempts.length, 1, `${mode} ${viewport.width}: attempt history preserved`);

  if (mode === "guest") {
    assert.equal(backendActions.length, 0, `${mode} ${viewport.width}: guest backend actions`);
    assert.equal(capturedPayloads.length, 0, `${mode} ${viewport.width}: guest backend payloads`);
  } else {
    assert.ok(backendActions.some((url) => url.includes("getStudentAndAttemptStatus")), `${mode} ${viewport.width}: getStudent`);
    assert.ok(backendActions.some((url) => url.includes("startAttempt")), `${mode} ${viewport.width}: startAttempt`);
    assert.equal(capturedPayloads.length, 1, `${mode} ${viewport.width}: submit payload`);
    const payload = JSON.parse(new URLSearchParams(capturedPayloads[0]).get("payload"));
    assert.equal(payload.unit_id, "enzymes");
    assert.equal(payload.question_version, questionVersion);
    assert.equal(payload.question_logs.length, 13);
    assert.deepEqual(payload.question_logs.map((log) => log.question_id.replace("enzymes_", "")).sort(), ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q10", "q11", "q12", "q13", "q14"]);
    assert.deepEqual(Object.keys(JSON.parse(payload.raw_answers_json)).sort(), ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q10", "q11", "q12", "q13", "q14", "reflection"]);
    assert.ok(payload.question_logs.every((log) => log.student_id && log.unit_id === "enzymes" && log.question_type && log.answer_json && log.checkpoint_id && log.concept_id), `${mode} ${viewport.width}: dashboard fields`);
  }
  assert.deepEqual(imageErrors, [], `${mode} ${viewport.width}: image 404`);
  assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width}: console errors`);
  assert.deepEqual(pageErrors, [], `${mode} ${viewport.width}: page errors`);
  await page.screenshot({ path: path.join(artifactDir, `${mode}-${viewport.width}x${viewport.height}-achievements.png`), fullPage: false });
  await context.close();
  return { mode, viewport, backendActions: backendActions.length, payloads: capturedPayloads.length };
}

const { server, port } = await startServer(workspaceRoot);
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const mode of ["verified", "pending", "guest"]) results.push(await runCase(browser, `http://127.0.0.1:${port}`, viewport, mode));
  }
} finally {
  await browser.close();
  server.close();
}
fs.writeFileSync(path.join(artifactDir, "summary.json"), JSON.stringify({ ok: true, results }, null, 2));
console.log(JSON.stringify({ ok: true, results, artifactDir }, null, 2));
