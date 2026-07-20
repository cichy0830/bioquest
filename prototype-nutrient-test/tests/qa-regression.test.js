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
const version = "20260720-nutrient-test-starch-glucose-only-v2";
const artifactDir = path.join(root, "tests", "artifacts", version);
fs.mkdirSync(artifactDir, { recursive: true });

const choiceAnswers = {
  q02: "starch_possible", q03: "glucose_possible",
  q06: "starch_not_supported", q07: "starch_supported_glucose_not_supported", q08: "iodine_starch", q11: "comparison_basis",
  q12: "positive_negative", q13: "target_limit", q14: "heat_required"
};
const q01Answers = { iodine: "starch", benedict: "glucose" };
const q10Answers = ["goggles", "away", "hot", "teacher_safe_method"];

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
  return {
    unit_id: unitId,
    sequence,
    unit_title: unitTitle,
    station_title: `第 ${sequence} 站｜${unitTitle}`,
    availability_status: "open",
    total_badges: totalBadges,
    earned_count: earnedCount,
    earned_badges: earnedCount ? [{ badge_id: badgeId, badge_image_path: `shared-assets/badges/${unitId}/badge-${unitId}-${badgeId}.webp` }] : []
  };
}

function backendFixture(mode) {
  return ({ mode }) => {
    const backendTitleAvatarPath = ["shared-assets", "title-avatars", "title-04-concept_solver-male.webp"].join("/");
    const unitSummary = (unitId, sequence, unitTitle, totalBadges, earnedCount, badgeId = `${unitId}_entry`) => {
      const badgePath = unitId === "life_world"
        ? `prototype-life-world/assets/badges/${badgeId}.webp`
        : `shared-assets/badges/${unitId}/badge-${unitId}-${badgeId}.webp`;
      return ({
      unit_id: unitId,
      sequence,
      unit_title: unitTitle,
      station_title: `第 ${sequence} 站｜${unitTitle}`,
      availability_status: "open",
      total_badges: totalBadges,
      earned_count: earnedCount,
      earned_badges: earnedCount ? [{ badge_id: badgeId, badge_image_path: badgePath }] : []
      });
    };
    const history = [
      unitSummary("life_world", 1, "多彩多姿的生命世界", 9, 1, "life_world_entry"),
      unitSummary("scientific_method", 2, "探究自然的科學方法", 10, 2, "scientific_method_entry"),
      unitSummary("lab_intro", 3, "進入實驗室", 10, 2, "lab_intro_entry"),
      unitSummary("microscope_use", 4, "顯微鏡的使用", 10, 2, "microscope_use_entry"),
      unitSummary("cell_basic_unit", 5, "生物體的基本單位", 8, 1, "cell_basic_unit_entry"),
      unitSummary("cell_structure", 6, "細胞的構造", 9, 2, "cell_structure_entry"),
      unitSummary("cell_observation", 7, "細胞的觀察", 10, 2, "cell_observation_entry"),
      unitSummary("cell_transport", 8, "物質進出細胞的方式", 10, 2, "cell_transport_entry"),
      unitSummary("biological_organization", 9, "生物體的組成層次", 10, 2, "biological_organization_entry"),
      unitSummary("scale", 10, "尺度", 11, 2, "scale_entry"),
      unitSummary("nutrients_energy", 11, "食物中的養分與能量", 11, 2, "nutrients_energy_entry")
    ];
    const loginProgress = {
      source: "server_verified",
      progress_applied: true,
      total_exp: 5360,
      current_title_id: "concept_solver",
      current_title: "概念解謎者",
      title_avatar_path: backendTitleAvatarPath,
      completed_unit_count: 11,
      unit_badge_summary_json: JSON.stringify(history)
    };
    const verifiedProgress = {
      ...loginProgress,
      total_exp: 5820,
      completed_unit_count: 12,
      unit_badge_summary_json: JSON.stringify([...history, unitSummary("nutrient_test", 12, "養分檢測", 11, 3, "nutrient_test_entry")])
    };
    window.__backendActions = [];
    window.__capturedPayloads = [];
    window.fetch = async (url, options = {}) => {
      const href = String(url);
      window.__backendActions.push(href);
      if (href.includes("getStudentAndAttemptStatus")) {
        return new Response(JSON.stringify({
          ok: true,
          student: { student_id: "SQA12V", student_name: "養分同學", class_name: "七年一班", seat_no: "12", profile_gender: "male", title_avatar_path: backendTitleAvatarPath },
          progress: loginProgress,
          attempt_status: { completed_attempt_count: 0 }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("startAttempt")) {
        return new Response(JSON.stringify({ ok: true, attempt_type: "first", issued_at: "2026-07-17T00:00:00.000Z", attempt_id: "nutrient_attempt_1", attempt_session_id: "nutrient_session_1", attempt_session_token: "nutrient_token_1", question_version: "20260720-nutrient-test-starch-glucose-only-v2", previous_attempt_id: "", expires_at: "2026-07-17T01:00:00.000Z" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("hintEvent")) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      if (href.includes("submitAttempt")) {
        window.__capturedPayloads.push(String(options.body || ""));
        if (mode === "pending") return new Response("temporary unavailable", { status: 503 });
        return new Response(JSON.stringify({ ok: true, verification_status: "server_verified", attempt_id: "nutrient_verified_attempt", student_progress: verifiedProgress, verified_attempt: { verification_status: "server_verified", attempt_total_exp: 460, unit_credited_exp: 460, credited_delta: 460, question_exp: 0 } }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
  };
}

async function login(page, mode) {
  if (mode === "guest") return page.locator("#guestButton").click();
  await page.waitForSelector("#loginButton");
  await page.locator("#studentIdInput").fill("SQA12V");
  await page.locator("#loginButton").click();
}

async function completeMission(page) {
  await page.locator("#briefNext").click();
  await page.waitForSelector(".nutrient-test-prep-owl img");
  await page.locator("#scanNext").click();
  for (const [item, value] of Object.entries(q01Answers)) await page.locator(`select[data-classify-question="q01"][data-classify-item="${item}"]`).selectOption(value);
  for (const qid of ["q02", "q03"]) await page.locator(`[data-choice="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  await page.locator("#checkSection").click();
  for (const qid of ["q06", "q07", "q08", "q13"]) await page.locator(`[data-choice="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  await page.locator("#checkSection").click();
  for (const id of q10Answers) await page.locator(`[data-multi="q10"][data-value="${id}"]`).click();
  for (const qid of ["q11", "q12", "q14"]) await page.locator(`[data-choice="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  await page.locator("#checkSection").click();
  await page.locator("#reviewNext").click();
  await page.locator("#submitMission").click();
}

async function runCase(browser, baseUrl, viewport, mode) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(backendFixture(mode), { mode });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`${baseUrl}/prototype-nutrient-test/index.html?v=${version}`, { waitUntil: "domcontentloaded" });
  await login(page, mode);
  try {
    await page.waitForSelector("#screen[data-bioquest-screen='brief']", { timeout: 8000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      screen: document.querySelector("#screen")?.dataset.bioquestScreen,
      text: document.querySelector("#screen")?.textContent?.slice(0, 500),
      actions: window.__backendActions || [],
      payloads: window.__capturedPayloads || []
    }));
    throw new Error(`did not reach brief for ${mode} ${viewport.width}: ${JSON.stringify(debug)}`);
  }

  const brief = await page.locator(".bq-brief-scene-stage").evaluate((scene) => ({
    imageCount: scene.querySelectorAll(".bq-brief-scene-image").length,
    imageNaturalWidth: scene.querySelector(".bq-brief-scene-image")?.naturalWidth || 0,
    avatarCount: scene.querySelectorAll(".bq-brief-student-avatar").length,
    avatarNaturalWidth: scene.querySelector(".bq-brief-student-avatar")?.naturalWidth || 0,
    owlCount: document.querySelectorAll(".owl-frame, .bq-report-assistant").length
  }));
  assert.deepEqual([brief.imageCount, brief.avatarCount, brief.owlCount], [1, 1, 0], `${mode} ${viewport.width}: brief role counts`);
  assert.ok(brief.imageNaturalWidth > 0 && brief.avatarNaturalWidth > 0, `${mode} ${viewport.width}: brief images load`);

  await completeMission(page);
  await page.waitForSelector("#screen[data-bioquest-screen='result']");
  const resultText = await page.locator("#screen").textContent();
  if (mode === "guest") assert.match(resultText, /guest 測試：本次預估 \d+\/500 EXP，不列入正式累積/);
  if (mode === "pending") assert.match(resultText, /本次預估 \d+\/500 EXP，待後台確認/);
  if (mode === "verified") assert.match(resultText, /後台已回傳正式認列資料|本單元正式認列/);
  assert.doesNotMatch(mode === "verified" ? "" : resultText, /本次與正式累積差異|後台正式認列/);

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
      text: root.textContent,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
    };
  });
  assert.equal(achievements.screen, "achievements", `${mode} ${viewport.width}: screen dataset`);
  assert.equal(achievements.titleImageCount, 1, `${mode} ${viewport.width}: title avatar`);
  assert.equal(achievements.overviewCount, 1, `${mode} ${viewport.width}: overview`);
  assert.equal(achievements.summaryBoxCount, 52, `${mode} ${viewport.width}: 52 overview cards`);
  assert.ok(achievements.overviewIndex > achievements.unitIndex, `${mode} ${viewport.width}: local badges before overview`);
  assert.equal(achievements.horizontalOverflow, false, `${mode} ${viewport.width}: no horizontal overflow`);
  if (mode === "verified") assert.match(achievements.text, /5820 EXP｜已完成 12 站/);
  if (mode === "pending") assert.match(achievements.text, /5360 EXP｜已完成 11 站/);
  if (mode === "guest") assert.match(achievements.text, /0 EXP｜已完成 0 站/);

  const actions = await page.evaluate(() => window.__backendActions || []);
  const payloads = await page.evaluate(() => window.__capturedPayloads || []);
  if (mode === "guest") {
    assert.equal(actions.length, 0, `${mode} ${viewport.width}: guest backend actions`);
    assert.equal(payloads.length, 0, `${mode} ${viewport.width}: guest backend payloads`);
  } else {
    assert.ok(actions.some((url) => url.includes("getStudentAndAttemptStatus")), `${mode} ${viewport.width}: getStudent`);
    assert.ok(actions.some((url) => url.includes("startAttempt")), `${mode} ${viewport.width}: startAttempt`);
    assert.equal(payloads.length, 1, `${mode} ${viewport.width}: submit payload`);
    const payload = JSON.parse(new URLSearchParams(payloads[0]).get("payload"));
    assert.equal(payload.unit_id, "nutrient_test");
    assert.equal(payload.question_version, "20260720-nutrient-test-starch-glucose-only-v2");
    assert.equal(payload.question_logs.length, 11);
    assert.deepEqual(payload.question_logs.map((log) => log.question_id.replace("nutrient_test_", "")).sort(), ["q01", "q02", "q03", "q06", "q07", "q08", "q10", "q11", "q12", "q13", "q14"]);
    assert.deepEqual(Object.keys(JSON.parse(payload.raw_answers_json)).sort(), ["q01", "q02", "q03", "q06", "q07", "q08", "q10", "q11", "q12", "q13", "q14", "reflection"]);
    assert.ok(payload.question_logs.every((log) => log.student_id && log.unit_id === "nutrient_test" && log.question_type && log.answer_json && log.checkpoint_id), `${mode} ${viewport.width}: dashboard fields`);
  }
  assert.deepEqual(imageErrors, [], `${mode} ${viewport.width}: image 404`);
  assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width}: console errors`);
  assert.deepEqual(pageErrors, [], `${mode} ${viewport.width}: page errors`);
  await page.screenshot({ path: path.join(artifactDir, `${mode}-${viewport.width}x${viewport.height}-achievements.png`), fullPage: false });
  await context.close();
  return { mode, viewport, backendActions: actions.length, payloads: payloads.length };
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
