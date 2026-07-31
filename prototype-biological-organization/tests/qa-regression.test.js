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
const TEST_VERSION = "20260716-biological-organization-canonical-v1";
const CACHE_VERSION = "20260731-biological-organization-submitted-retry-ia-v1";
const artifactDir = path.join(root, "tests", "artifacts", CACHE_VERSION);
fs.mkdirSync(artifactDir, { recursive: true });

const correctAnswers = {
  q01: ["cell", "tissue", "organ", "system", "individual"],
  q02: { muscle_cell: "cell", muscle_tissue: "tissue", heart: "organ", circulatory: "system", person: "individual" },
  q03: "individual",
  q04: "composed",
  q05: "similar_cells",
  q06: "organ",
  q07: "system",
  q08: "stomach_organ",
  q09: "complete_individual",
  q10: { paramecium: "single", amoeba: "single", yeast: "single", human: "multi", banyan: "multi", butterfly: "multi" },
  q11: "one_cell_individual",
  q12: { root: "vegetative", stem: "vegetative", leaf: "vegetative", flower: "reproductive", fruit: "reproductive", seed: "reproductive" },
  q13: "organ",
  q14: "both_organs"
};

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png"
  }[ext] || "application/octet-stream";
}

function startServer(baseRoot = workspaceRoot) {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
    if (requestPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(baseRoot, cleanPath);
    if (!filePath.startsWith(baseRoot)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

function backendScript(mode) {
  return ({ mode }) => {
    const questionVersion = "20260716-biological-organization-canonical-v1";
    const historicalSummary = [
      { unit_id: "life_world", sequence: 1, unit_title: "多彩多姿的生命世界", station_title: "第 1 站｜多彩多姿的生命世界", availability_status: "open", total_badges: 9, earned_count: 2, earned_badges: [{ badge_id: "life_world_entry", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }] },
      { unit_id: "scientific_method", sequence: 2, unit_title: "探究自然的科學方法", station_title: "第 2 站｜探究自然的科學方法", availability_status: "open", total_badges: 10, earned_count: 3, earned_badges: [{ badge_id: "scientific_method_entry", badge_image_path: "shared-assets/badges/scientific_method/badge-scientific_method-scientific_method_entry.webp" }] },
      { unit_id: "lab_intro", sequence: 3, unit_title: "進入實驗室", station_title: "第 3 站｜進入實驗室", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "lab_intro_entry", badge_image_path: "shared-assets/badges/lab_intro/badge-lab_intro-lab_intro_entry.webp" }] },
      { unit_id: "microscope_use", sequence: 4, unit_title: "顯微鏡的使用", station_title: "第 4 站｜顯微鏡的使用", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "microscope_use_entry", badge_image_path: "shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_entry.webp" }] },
      { unit_id: "cell_basic_unit", sequence: 5, unit_title: "生物體的基本單位", station_title: "第 5 站｜生物體的基本單位", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "cell_basic_unit_entry", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_basic_unit_entry.webp" }] },
      { unit_id: "cell_structure", sequence: 6, unit_title: "細胞的構造", station_title: "第 6 站｜細胞的構造", availability_status: "open", total_badges: 9, earned_count: 2, earned_badges: [{ badge_id: "cell_structure_entry", badge_image_path: "shared-assets/badges/cell_structure/badge-cell_structure-cell_structure_entry.webp" }] },
      { unit_id: "cell_observation", sequence: 7, unit_title: "細胞的觀察", station_title: "第 7 站｜細胞的觀察", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "cell_observation_entry", badge_image_path: "shared-assets/badges/cell_observation/badge-cell_observation-cell_observation_entry.webp" }] },
      { unit_id: "cell_transport", sequence: 8, unit_title: "物質進出細胞的方式", station_title: "第 8 站｜物質進出細胞的方式", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "cell_transport_entry", badge_image_path: "shared-assets/badges/cell_transport/badge-cell_transport-cell_transport_entry.webp" }] },
      { unit_id: "biological_organization", sequence: 9, unit_title: "生物體的組成層次", station_title: "第 9 站｜生物體的組成層次", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [
        { badge_id: "biological_organization_entry", badge_image_path: "shared-assets/badges/biological_organization/badge-biological_organization-biological_organization_entry.webp" },
        { badge_id: "organization_hierarchy_sorter", badge_image_path: "shared-assets/badges/biological_organization/badge-biological_organization-organization_hierarchy_sorter.webp" }
      ] }
    ];
    const loginSummary = mode === "verified" ? historicalSummary.slice(0, 8) : mode === "pending" ? historicalSummary.slice(0, 8) : [];
    const loginProgress = {
      source: "server_verified",
      progress_applied: true,
      total_exp: mode === "pending" ? 3880 : 3880,
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
      completed_unit_count: loginSummary.length,
      unit_badge_summary_json: JSON.stringify(loginSummary)
    };
    const verifiedProgress = {
      ...loginProgress,
      total_exp: 4320,
      completed_unit_count: 9,
      unit_badge_summary_json: JSON.stringify(historicalSummary)
    };
    window.__capturedPayloads = [];
    window.__capturedActions = [];
    window.fetch = async (url, options = {}) => {
      const href = String(url);
      const action = new URL(href, location.href).searchParams.get("action");
      window.__capturedActions.push(action);
      if (href.includes("getStudentAndAttemptStatus")) {
        return new Response(JSON.stringify({
          ok: true,
          student: {
            student_id: mode === "guest" ? "guest" : "SQA09V",
            student_name: mode === "guest" ? "老師測試帳號" : "生物同學",
            class_name: "七年一班",
            seat_no: "09",
            profile_gender: "male",
            title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp"
          },
          progress: loginProgress,
          attempt_status: { completed_attempt_count: 0 }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("startAttempt")) {
        return new Response(JSON.stringify({
          ok: true,
          attempt_id: `u9_${mode}_attempt`,
          attempt_session_id: `u9_${mode}_session`,
          attempt_session_token: `u9_${mode}_session.securetoken`,
          question_version: questionVersion,
          verification_mode: "server_verified",
          issued_at: "2026-07-16T00:00:00.000Z",
          expires_at: "2026-07-16T02:00:00.000Z",
          previous_attempt_id: "",
          attempt_type: "first"
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("hintEvent")) {
        return new Response(JSON.stringify({ ok: true, hint_recorded: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("submitAttempt")) {
        const body = String(options.body || "");
        window.__capturedPayloads.push(body);
        if (mode === "pending") return new Response("temporary unavailable", { status: 503 });
        return new Response(JSON.stringify({
          ok: true,
          attempt_id: "u9_verified_attempt",
          student_progress: verifiedProgress,
          verified_attempt: {
            verification_status: "server_verified",
            unit_credited_exp: 460,
            attempt_total_exp: 460,
            credited_delta: 460,
            question_exp: 0
          }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
  };
}

async function login(page, mode) {
  if (mode === "guest") {
    await page.locator("#guestButton").click();
    return;
  }
  await page.locator("#studentIdInput").fill("SQA09V");
  await page.locator("#loginButton").click();
}

async function orderSequence(page, ids) {
  for (let targetIndex = 0; targetIndex < ids.length; targetIndex += 1) {
    const id = ids[targetIndex];
    for (;;) {
      const current = await page.locator("[data-sequence-id]").evaluateAll((items) => items.map((item) => item.dataset.sequenceId));
      const index = current.indexOf(id);
      if (index <= targetIndex) break;
      await page.locator(`[data-move="${id}"][data-dir="-1"]`).click();
    }
  }
}

async function answerChoice(page, qid, value) {
  await page.locator(`[data-choice="${qid}"][data-value="${value}"]`).click();
}

async function answerClassify(page, qid, answers) {
  for (const [item, value] of Object.entries(answers)) {
    await page.locator(`select[data-classify-question="${qid}"][data-classify-item="${item}"]`).selectOption(value);
  }
}

async function answerCheckpoint1(page) {
  await orderSequence(page, correctAnswers.q01);
  await answerClassify(page, "q02", correctAnswers.q02);
  await answerChoice(page, "q03", correctAnswers.q03);
  await answerChoice(page, "q04", correctAnswers.q04);
}

async function answerCheckpoint2(page) {
  for (const qid of ["q05", "q06", "q07", "q08"]) await answerChoice(page, qid, correctAnswers[qid]);
}

async function answerCheckpoint3(page) {
  await answerChoice(page, "q09", correctAnswers.q09);
  await answerClassify(page, "q10", correctAnswers.q10);
  await answerChoice(page, "q11", correctAnswers.q11);
  await answerClassify(page, "q12", correctAnswers.q12);
  await answerChoice(page, "q13", correctAnswers.q13);
  await answerChoice(page, "q14", correctAnswers.q14);
}

async function runFlow(browser, baseUrl, viewport, mode) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(backendScript(mode), { mode });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`${baseUrl}/prototype-biological-organization/index.html?v=${CACHE_VERSION}`, { waitUntil: "domcontentloaded" });
  await login(page, mode);

  await page.waitForSelector(".bq-brief-scene-stage .bq-brief-scene-image");
  const briefMetrics = await page.locator(".bq-brief-scene-stage").evaluate((scene) => {
    const avatar = scene.querySelector(".bq-brief-student-avatar");
    const image = scene.querySelector(".bq-brief-scene-image");
    const avatarRect = avatar.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    return {
      avatarWidth: avatarRect.width,
      avatarHeight: avatarRect.height,
      imageNaturalWidth: image.naturalWidth,
      avatarNaturalWidth: avatar.naturalWidth,
      sceneHeight: scene.getBoundingClientRect().height,
      imageRatio: imageRect.width / Math.max(1, imageRect.height),
      legacySlots: scene.querySelectorAll(".student-avatar-slot:not(.bq-brief-legacy-avatar)").length
    };
  });
  assert.ok(briefMetrics.imageNaturalWidth > 0, `${mode} ${viewport.width}: briefing scene should load`);
  assert.ok(briefMetrics.avatarNaturalWidth > 0, `${mode} ${viewport.width}: title avatar should load`);
  assert.ok(briefMetrics.avatarHeight >= briefMetrics.sceneHeight * 0.62, `${mode} ${viewport.width}: title avatar too small`);
  assert.equal(briefMetrics.legacySlots, 0, `${mode} ${viewport.width}: brief should not show round legacy avatar slot`);

  await page.locator("#briefNext").click();
  assert.equal(await page.locator(".side-panel").evaluate((node) => getComputedStyle(node).position), viewport.width <= 980 ? "static" : "static", `${mode} ${viewport.width}: side panel position check`);
  await page.locator("#scanNext").click();
  await answerCheckpoint1(page);
  await page.locator("#checkSection").click();
  await page.waitForSelector('[data-question-id="q05"]');
  const checkpoint2Visible = await page.locator("[data-question-id]").evaluateAll((nodes) => nodes.map((node) => node.dataset.questionId));
  assert.deepEqual(checkpoint2Visible, ["q05", "q06", "q07", "q08"], `${mode} ${viewport.width}: checkpoint2 visible questions`);
  await answerCheckpoint2(page);
  await page.locator("#checkSection").click();
  await page.waitForSelector('[data-question-id="q09"]');
  assert.equal(await page.locator('[data-question-id="q09"]').count(), 1, `${mode} ${viewport.width}: q09 should be in checkpoint3`);
  assert.equal(await page.locator('[data-question-id="q10"]').count(), 1, `${mode} ${viewport.width}: q10 should be in checkpoint3`);
  await answerCheckpoint3(page);
  await page.locator("#checkSection").click();
  await page.locator("#reviewNext").click();
  await page.locator("#submitMission").click();
  await page.waitForSelector(".score-grid");

  const resultText = await page.locator("#screen").textContent();
  if (mode === "guest") {
    assert.match(resultText, /guest 測試：本次預估 \d+\/500 EXP，不列入正式累積/, `${mode} ${viewport.width}: guest wording`);
    assert.doesNotMatch(resultText, /本單元正式認列|正式累積 EXP|本次與正式累積差異|已完成單元/, `${mode} ${viewport.width}: guest formal wording leak`);
  } else if (mode === "pending") {
    assert.match(resultText, /本次預估 \d+\/500 EXP，待後台確認/, `${mode} ${viewport.width}: pending wording`);
    assert.doesNotMatch(resultText, /本單元正式認列|正式累積 EXP|本次與正式累積差異|已完成單元/, `${mode} ${viewport.width}: pending formal wording leak`);
  } else {
    assert.match(resultText, /本單元正式認列|後台已回傳正式認列資料/, `${mode} ${viewport.width}: verified wording`);
  }
  const resultMetrics = await page.locator("#screen").evaluate((root) => ({
    earnedOnlySections: root.querySelectorAll("[data-result-earned-only='true']").length,
    resultBadgeImages: root.querySelectorAll("[data-result-earned-only='true'] .badge-image").length,
    resultBadgeCards: root.querySelectorAll("[data-result-earned-only='true'] .badge-card").length,
    resultWallCount: root.querySelectorAll("[data-bq-unit-achievements], .badge-wall").length,
    reloginButtons: [...root.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length,
    brokenImages: [...root.querySelectorAll("[data-result-earned-only='true'] img")].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src)
  }));
  assert.equal(resultMetrics.earnedOnlySections, 1, `${mode} ${viewport.width}: result earned-only section`);
  assert.ok(resultMetrics.resultBadgeCards > 0 && resultMetrics.resultBadgeCards < 10, `${mode} ${viewport.width}: result must not render full catalog`);
  assert.equal(resultMetrics.resultBadgeImages, resultMetrics.resultBadgeCards, `${mode} ${viewport.width}: result earned badges should have images`);
  assert.equal(resultMetrics.resultWallCount, 0, `${mode} ${viewport.width}: result must not render unit wall`);
  assert.ok(resultMetrics.reloginButtons >= 1, `${mode} ${viewport.width}: result relogin entry`);
  assert.deepEqual(resultMetrics.brokenImages, [], `${mode} ${viewport.width}: result earned badge images load`);

  await page.locator("#resultAchievements").click();
  await page.waitForSelector("[data-bq-badge-overview]");
  const achievementMetrics = await page.locator("#screen").evaluate((root) => {
    const panels = [...root.querySelectorAll(".panel")];
    const overviewIndex = panels.findIndex((panel) => panel.matches("[data-bq-badge-overview]"));
    const titleImages = [...root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img")];
    return {
      titleImageCount: titleImages.length,
      titleNaturalWidth: titleImages[0]?.naturalWidth || 0,
      titleCardText: root.querySelector(".bq-title-avatar-card, .title-avatar-card.achievements")?.textContent || "",
      overviewIndex,
      overviewCount: root.querySelectorAll("[data-bq-badge-overview]").length,
      summaryBoxCount: root.querySelectorAll(".bq-unit-badge-summary").length,
      unitWallCount: root.querySelectorAll("[data-bq-unit-achievements], .badge-wall").length,
      unitBadgeIconCount: root.querySelectorAll(".badge-grid .badge-icon").length,
      unitBadgeImageCount: root.querySelectorAll(".badge-grid .badge-image").length,
      reloginButtons: [...root.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      text: root.textContent
    };
  });
  assert.equal(achievementMetrics.titleImageCount, 1, `${mode} ${viewport.width}: title avatar count`);
  assert.ok(achievementMetrics.titleNaturalWidth > 0, `${mode} ${viewport.width}: title avatar should load`);
  if (mode === "verified") assert.match(achievementMetrics.titleCardText, /4320 EXP｜已完成 9 站/, `${mode} ${viewport.width}: verified title card completed count`);
  if (mode === "pending") assert.match(achievementMetrics.titleCardText, /3880 EXP｜已完成 8 站/, `${mode} ${viewport.width}: pending title card completed count`);
  if (mode === "guest") assert.match(achievementMetrics.titleCardText, /0 EXP｜已完成 0 站/, `${mode} ${viewport.width}: guest title card completed count`);
  assert.equal(achievementMetrics.unitWallCount, 0, `${mode} ${viewport.width}: achievements must not render unit badge wall`);
  assert.equal(achievementMetrics.unitBadgeIconCount, 0, `${mode} ${viewport.width}: unit badge status text markers must be removed`);
  assert.equal(achievementMetrics.unitBadgeImageCount, 0, `${mode} ${viewport.width}: achievements must not render local badge images`);
  assert.equal(achievementMetrics.overviewCount, 1, `${mode} ${viewport.width}: overview count`);
  assert.ok(achievementMetrics.overviewIndex >= 0, `${mode} ${viewport.width}: overview position`);
  assert.equal(achievementMetrics.summaryBoxCount, 52, `${mode} ${viewport.width}: whole-book summary boxes`);
  assert.ok(achievementMetrics.reloginButtons >= 1, `${mode} ${viewport.width}: achievements relogin entry`);
  assert.equal(achievementMetrics.horizontalOverflow, false, `${mode} ${viewport.width}: no horizontal overflow`);
  if (mode !== "verified") assert.doesNotMatch(achievementMetrics.text, /正式累積 EXP|已完成單元/, `${mode} ${viewport.width}: achievement formal wording leak`);

  await page.locator("#achieveResult").click();
  await page.waitForSelector(".score-grid");
  await page.locator("#resultRules").click();
  await page.waitForSelector("#rulesBack");
  const rulesReloginCount = await page.locator("#screen").evaluate((root) => [...root.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length);
  assert.ok(rulesReloginCount >= 1, `${mode} ${viewport.width}: rules relogin entry`);

  const submittedNavState = await page.evaluate(() => ({
    checkpointDisabled: Boolean(document.querySelector("[data-nav='checkpoint1']")?.disabled),
    loginDisabled: Boolean(document.querySelector("[data-nav='login']")?.disabled),
    resultDisabled: Boolean(document.querySelector("[data-nav='result']")?.disabled),
    achievementsDisabled: Boolean(document.querySelector("[data-nav='achievements']")?.disabled),
    rulesDisabled: Boolean(document.querySelector("[data-nav='rules']")?.disabled)
  }));
  assert.equal(submittedNavState.checkpointDisabled, true, `${mode} ${viewport.width}: submitted checkpoint nav must stay locked`);
  assert.equal(submittedNavState.loginDisabled, false, `${mode} ${viewport.width}: submitted login nav must remain available`);
  assert.equal(submittedNavState.resultDisabled, false, `${mode} ${viewport.width}: submitted result nav must remain available`);
  assert.equal(submittedNavState.achievementsDisabled, false, `${mode} ${viewport.width}: submitted achievements nav must remain available`);
  assert.equal(submittedNavState.rulesDisabled, false, `${mode} ${viewport.width}: submitted rules nav must remain available`);

  const captured = await page.evaluate(() => window.__capturedPayloads || []);
  const actions = await page.evaluate(() => window.__capturedActions || []);
  if (mode !== "guest") {
    assert.ok(actions.includes("getStudentAndAttemptStatus"), `${mode} ${viewport.width}: should read student progress`);
    assert.ok(actions.includes("startAttempt"), `${mode} ${viewport.width}: should start server attempt`);
    assert.ok(actions.includes("submitAttempt"), `${mode} ${viewport.width}: should submit formal attempt`);
    assert.equal(captured.length, 1, `${mode} ${viewport.width}: one backend submit payload`);
    const params = new URLSearchParams(captured[0]);
    const payload = JSON.parse(params.get("payload"));
    assert.equal(payload.unit_id, "biological_organization", `${mode} ${viewport.width}: payload unit`);
    assert.equal(payload.question_version, TEST_VERSION, `${mode} ${viewport.width}: payload question version`);
    assert.equal(payload.attempt_id, `u9_${mode}_attempt`, `${mode} ${viewport.width}: server attempt id`);
    assert.equal(payload.attempt_session_token, `u9_${mode}_session.securetoken`, `${mode} ${viewport.width}: session token`);
    assert.equal(payload.required_answer_count, 14, `${mode} ${viewport.width}: payload required count`);
    assert.equal(payload.answered_required_count, 14, `${mode} ${viewport.width}: payload answered count`);
    assert.equal(payload.question_logs.length, 14, `${mode} ${viewport.width}: payload question logs`);
    assert.equal(payload.question_logs.every((log) => log.question_version === TEST_VERSION), true, `${mode} ${viewport.width}: all logs versioned`);
    assert.equal(payload.question_logs.find((log) => log.question_id === "biological_organization_q01").question_type, "sequence", `${mode} ${viewport.width}: q01 type`);
  } else {
    assert.deepEqual(actions, [], `${mode} ${viewport.width}: guest should not call formal backend`);
    assert.equal(captured.length, 0, `${mode} ${viewport.width}: guest should not submit to backend`);
  }

  assert.deepEqual(imageErrors, [], `${mode} ${viewport.width}: image 404`);
  assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width}: console errors`);
  assert.deepEqual(pageErrors, [], `${mode} ${viewport.width}: page errors`);
  await page.screenshot({ path: path.join(artifactDir, `${mode}-${viewport.width}x${viewport.height}-achievements.png`), fullPage: false });
  await context.close();
  return { mode, viewport, payloads: mode === "guest" ? 0 : 1 };
}

const { server, port } = await startServer();
const baseUrl = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const mode of ["verified", "pending", "guest"]) results.push(await runFlow(browser, baseUrl, viewport, mode));
  }
} finally {
  await browser.close();
  server.close();
}

fs.writeFileSync(path.join(artifactDir, "summary.json"), JSON.stringify({ ok: true, results }, null, 2));
console.log(JSON.stringify({ ok: true, results, artifactDir }, null, 2));
