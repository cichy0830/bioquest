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
const version = "20260814-photosynthesis-starch-evidence-asset-v1";
const questionVersion = "20260721-photosynthesis-q09-inactive-v1";
const artifactDir = process.env.BIOQUEST_ARTIFACT_DIR
  ? path.resolve(process.env.BIOQUEST_ARTIFACT_DIR)
  : path.join(root, "tests", "artifacts", version);
fs.mkdirSync(artifactDir, { recursive: true });

const choiceAnswers = {
  q01: "photosynthesis",
  q03: "chloroplast",
  q04: "energy_not_reactant",
  q06: "oxygen",
  q07: "green_cells",
  q08: "soil_water_minerals_food_made",
  q10: "light_starch",
  q11: "strong_light_more_bubbles",
  q13: "plants_respire_too",
  q14: "oxygen_product"
};
const q02Answers = {
  carbon_dioxide: "reactant",
  water: "reactant_and_product",
  light: "energy",
  glucose: "product",
  oxygen: "product"
};
const q05Answers = {
  stomata: "gas_exchange",
  vein: "transport",
  chloroplast_in_leaf: "site"
};
const q12Answers = ["light_time", "plant_type_size", "water_amount", "temperature"];

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

function progressFixture(includeU14 = false) {
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
    unitSummary("nutrient_test", 12, "養分檢測", 11, 2, "nutrient_test_entry"),
    unitSummary("enzymes", 13, "酵素", 11, 3, "enzymes_entry")
  ];
  if (includeU14) history.push(unitSummary("photosynthesis", 14, "植物如何製造養分", 11, 3, "photosynthesis_entry"));
  return {
    source: "server_verified",
    progress_applied: true,
    total_exp: includeU14 ? 6740 : 6280,
    current_title_id: "concept_solver",
    current_title: "概念解謎者",
    title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
    completed_unit_count: includeU14 ? 14 : 13,
    unit_badge_summary_json: JSON.stringify(history)
  };
}

async function login(page, mode) {
  if (mode === "guest") {
    await page.locator("#guestBtn").click();
    return;
  }
  await page.locator("#studentId").fill("SQA14V");
  await page.locator("#loginBtn").click();
}

async function completeMission(page) {
  await page.locator('[data-next="scan"]').click();
  await page.locator('[data-next="checkpoint1"]').click();
  for (const qid of ["q01", "q03", "q04"]) await page.locator(`[data-answer="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  for (const [item, value] of Object.entries(q02Answers)) await page.locator(`select[data-map-question="q02"][data-map-item="${item}"]`).selectOption(value);
  await page.locator('[data-section-next="checkpoint1"]').click();
  for (const [item, value] of Object.entries(q05Answers)) await page.locator(`select[data-map-question="q05"][data-map-item="${item}"]`).selectOption(value);
  for (const qid of ["q06", "q07", "q08"]) await page.locator(`[data-answer="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  await page.locator('[data-section-next="checkpoint2"]').click();
  await page.waitForSelector("#screen[data-bioquest-screen='checkpoint3']");
  await page.waitForFunction(() => {
    const image = document.querySelector('img[alt="同一葉片不同光照區域示意圖"]');
    return image?.complete && image.naturalWidth > 0;
  });
  const lightShadeImage = await page.locator('img[alt="同一葉片不同光照區域示意圖"]').evaluate((img) => ({
    src: img.currentSrc || img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight
  }));
  assert.ok(lightShadeImage.src.includes("img-photosynthesis-light-shade-1280w.webp"), "q10 light/shade image must use the 1280w runtime asset");
  assert.ok(lightShadeImage.src.includes(`v=${version}`), "q10 light/shade image must include runtime cache");
  assert.equal(lightShadeImage.naturalWidth, 1280, "q10 light/shade image natural width");
  assert.equal(lightShadeImage.naturalHeight, 720, "q10 light/shade image natural height");
  await page.waitForFunction(() => {
    const image = document.querySelector('img[alt="水生植物氣泡觀察圖"]');
    return image?.complete && image.naturalWidth > 0;
  });
  const bubblesImage = await page.locator('img[alt="水生植物氣泡觀察圖"]').evaluate((img) => ({
    src: img.currentSrc || img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight
  }));
  assert.ok(bubblesImage.src.includes("img-photosynthesis-aquatic-bubbles-1280w.webp"), "q11 bubbles image must use the 1280w runtime asset");
  assert.ok(bubblesImage.src.includes(`v=${version}`), "q11 bubbles image must include runtime cache");
  assert.equal(bubblesImage.naturalWidth, 1280, "q11 bubbles image natural width");
  assert.equal(bubblesImage.naturalHeight, 720, "q11 bubbles image natural height");
  for (const qid of ["q10", "q11", "q13", "q14"]) await page.locator(`[data-answer="${qid}"][data-value="${choiceAnswers[qid]}"]`).click();
  for (const id of q12Answers) await page.locator(`[data-toggle-set="q12"][data-value="${id}"]`).click();
  await page.locator('[data-confirm-set="q12"]').click();
  await page.locator('[data-section-next="checkpoint3"]').click();
  await page.locator('[data-next="reflection"]').click();
  await page.locator("#confidentConcept").fill("變因與證據");
  await page.locator("#studentQuestion").fill("我想確認水生植物氣泡資料如何判斷光照影響，哪些條件需要控制？");
  await page.locator("#submitMission").click();
}

async function runCase(browser, baseUrl, viewport, mode) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  const backendActions = [];
  const payloads = [];
  let startCount = 0;
  const page = await context.newPage();
  await page.route("**/macros/s/**", async (route) => {
    const request = route.request();
    const href = request.url();
    backendActions.push(href);
    if (href.includes("getStudentAndAttemptStatus")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        ok: true,
        student: { student_id: "SQA14V", student_name: "光合同學", class_name: "七年一班", seat_no: "14", profile_gender: "male", title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp" },
        progress: progressFixture(false),
        student_progress: progressFixture(false),
        attempt_status: { completed_attempt_count: startCount }
      }) });
      return;
    }
    if (href.includes("startAttempt")) {
      startCount += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, verification_mode: "server_verified", attempt_type: startCount > 1 ? "retry" : "first", issued_at: "2026-08-11T00:00:00.000Z", attempt_id: `photosynthesis_attempt_${startCount}`, attempt_session_id: `photosynthesis_session_${startCount}`, attempt_session_token: `photosynthesis_token_${startCount}`, question_version: questionVersion, previous_attempt_id: startCount > 1 ? "photosynthesis_attempt_1" : "", expires_at: "2026-08-11T01:00:00.000Z" }) });
      return;
    }
    if (href.includes("hintEvent")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      return;
    }
    if (href.includes("submitAttempt")) {
      payloads.push(request.postData() || "");
      if (mode === "pending") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, verification_status: "pending_backend" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        ok: true,
        verification_status: "server_verified",
        student_progress: progressFixture(true),
        verified_attempt: {
          verification_status: "server_verified",
          attempt_total_exp: 460,
          unit_credited_exp: 460,
          credited_delta: 460,
          badges: ["photosynthesis_entry", "photosynthesis_overview_mapper", "photosynthesis_flawless"]
        }
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

  await page.goto(`${baseUrl}/prototype-photosynthesis/index.html?v=${version}`, { waitUntil: "domcontentloaded" });
  await login(page, mode);
  await page.waitForSelector("#screen[data-bioquest-screen='brief']");
  const brief = await page.locator("#screen").evaluate((root) => ({
    screen: root.dataset.bioquestScreen,
    sceneImages: document.querySelectorAll(".bq-brief-scene-image").length,
    sceneNaturalWidth: document.querySelector(".bq-brief-scene-image")?.naturalWidth || 0,
    sceneSrc: document.querySelector(".bq-brief-scene-image")?.currentSrc || document.querySelector(".bq-brief-scene-image")?.src || "",
    studentAvatars: document.querySelectorAll(".bq-brief-student-avatar").length,
    owls: document.querySelectorAll(".bq-report-assistant, .owl-frame").length
  }));
  assert.equal(brief.screen, "brief");
  assert.equal(brief.sceneImages, 1, `${mode} ${viewport.width}: brief scene count`);
  assert.ok(brief.sceneNaturalWidth > 0, `${mode} ${viewport.width}: brief scene loaded`);
  assert.ok(brief.sceneSrc.includes(`v=${version}`), `${mode} ${viewport.width}: brief scene cache`);
  assert.equal(brief.studentAvatars, 1, `${mode} ${viewport.width}: student avatar count`);
  assert.equal(brief.owls, 0, `${mode} ${viewport.width}: no brief owl`);

  await completeMission(page);
  await page.waitForSelector("#screen[data-bioquest-screen='result']");
  const beforeResetState = await page.evaluate(() => JSON.parse(localStorage.getItem("bioquest_photosynthesis_state_v1") || "{}"));
  const result = await page.locator("#screen").evaluate((root) => ({
    text: root.textContent,
    earnedCards: root.querySelectorAll("[data-result-earned-badges] .badge-card").length,
    allBadgeCards: root.querySelectorAll(".badge-card").length,
    earnedImages: [...root.querySelectorAll("[data-result-earned-badges] img")].map((img) => img.currentSrc || img.src),
    reloginEntries: [...root.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
    sidebarLoginDisabled: document.querySelector("[data-nav='login']")?.disabled ?? true,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
  }));
  if (mode === "guest") assert.match(result.text, /guest 測試：本次預估 \d+\/500 EXP，不列入正式累積/);
  if (mode === "pending") assert.match(result.text, /本次預估 \d+\/500 EXP，待後台確認/);
  if (mode === "verified") assert.match(result.text, /後台已回傳正式認列資料|本單元正式認列/);
  assert.ok(result.earnedCards > 0 && result.earnedCards < 11, `${mode} ${viewport.width}: result must be earned-only, not full catalog`);
  assert.equal(result.allBadgeCards, result.earnedCards, `${mode} ${viewport.width}: result must not render locked catalog cards`);
  assert.equal(result.earnedImages.length, result.earnedCards, `${mode} ${viewport.width}: earned badge images`);
  assert.ok(result.earnedImages.every((src) => src.includes(`v=${version}`)), `${mode} ${viewport.width}: result badge cache`);
  assert.equal(result.reloginEntries, 1, `${mode} ${viewport.width}: result relogin entry`);
  assert.equal(result.sidebarLoginDisabled, false, `${mode} ${viewport.width}: submitted sidebar login`);
  assert.equal(result.horizontalOverflow, false, `${mode} ${viewport.width}: result no overflow`);

  await page.locator('[data-next="achievements"]').click();
  await page.waitForSelector("[data-bq-badge-overview]");
  const achievements = await page.locator("#screen").evaluate((root) => ({
    text: root.textContent,
    titleImageCount: root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img").length,
    overviewCount: root.querySelectorAll("[data-bq-badge-overview], .bq-all-unit-badge-overview").length,
    summaryBoxCount: root.querySelectorAll(".bq-unit-badge-summary").length,
    unitPanels: root.querySelectorAll("[data-bq-unit-achievements]").length,
    badgeCards: root.querySelectorAll(".badge-card").length,
    reloginEntries: [...root.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
    sidebarLoginDisabled: document.querySelector("[data-nav='login']")?.disabled ?? true,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
  }));
  assert.equal(achievements.titleImageCount, 1, `${mode} ${viewport.width}: title avatar`);
  assert.equal(achievements.overviewCount, 1, `${mode} ${viewport.width}: overview`);
  assert.equal(achievements.summaryBoxCount, 52, `${mode} ${viewport.width}: 52 overview cards`);
  assert.equal(achievements.unitPanels, 0, `${mode} ${viewport.width}: achievements unit wall`);
  assert.equal(achievements.badgeCards, 0, `${mode} ${viewport.width}: achievements badge cards`);
  assert.equal(achievements.reloginEntries, 1, `${mode} ${viewport.width}: achievements relogin entry`);
  assert.equal(achievements.sidebarLoginDisabled, false, `${mode} ${viewport.width}: achievements sidebar login`);
  assert.equal(achievements.horizontalOverflow, false, `${mode} ${viewport.width}: achievements no overflow`);

  await page.locator('[data-nav="rules"]').click();
  await page.waitForSelector("#screen[data-bioquest-screen='rules']");
  const rules = await page.locator("#screen").evaluate((root) => ({
    text: root.textContent,
    reloginEntries: [...root.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
    sidebarLoginDisabled: document.querySelector("[data-nav='login']")?.disabled ?? true
  }));
  assert.equal(rules.reloginEntries, 1, `${mode} ${viewport.width}: rules relogin entry`);
  assert.equal(rules.sidebarLoginDisabled, false, `${mode} ${viewport.width}: rules sidebar login`);
  assert.match(rules.text, /重新登入，並從登入頁開始/);
  const actionsBeforeReset = backendActions.length;
  await page.locator("[data-relogin-action]").click();
  await page.waitForSelector("#screen[data-bioquest-screen='login']");
  const reset = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem("bioquest_photosynthesis_state_v1") || "{}"),
    attempts: JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]")
  }));
  assert.equal(backendActions.length, actionsBeforeReset, `${mode} ${viewport.width}: reset must not call backend`);
  assert.equal(reset.state.student, null, `${mode} ${viewport.width}: current student cleared`);
  assert.equal(reset.state.attempt_id, "", `${mode} ${viewport.width}: current attempt cleared`);
  assert.equal(reset.state.submitted, false, `${mode} ${viewport.width}: submitted cleared`);
  assert.equal(reset.attempts.length, 1, `${mode} ${viewport.width}: attempt history preserved`);

  if (mode === "guest") {
    assert.equal(backendActions.length, 0, `${mode} ${viewport.width}: guest backend actions`);
    assert.equal(payloads.length, 0, `${mode} ${viewport.width}: guest backend payloads`);
    await page.locator("#guestBtn").click();
    await page.waitForSelector("#screen[data-bioquest-screen='brief']");
    const guestRetry = await page.evaluate(() => JSON.parse(localStorage.getItem("bioquest_photosynthesis_state_v1") || "{}"));
    assert.notEqual(guestRetry.attempt_id, beforeResetState.attempt_id, `${mode} ${viewport.width}: guest retry creates new local attempt`);
  } else {
    assert.ok(backendActions.some((url) => url.includes("getStudentAndAttemptStatus")), `${mode} ${viewport.width}: getStudent`);
    assert.ok(backendActions.some((url) => url.includes("startAttempt")), `${mode} ${viewport.width}: startAttempt`);
    assert.equal(payloads.length, 1, `${mode} ${viewport.width}: submit payload`);
    const payload = JSON.parse(payloads[0]);
    assert.equal(payload.unit_id, "photosynthesis");
    assert.equal(payload.question_version, questionVersion);
    assert.equal(payload.question_logs.length, 13);
    assert.deepEqual(Object.keys(JSON.parse(payload.raw_answers_json)).sort(), ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q10", "q11", "q12", "q13", "q14"]);
    assert.equal(payload.question_logs.some((log) => log.question_id === "q09" || String(log.question_id).endsWith("_q09")), false, `${mode} ${viewport.width}: q09 log inactive`);
    await page.locator("#studentId").fill("SQA14V");
    await page.locator("#loginBtn").click();
    await page.waitForSelector("#screen[data-bioquest-screen='brief']");
    const retryState = await page.evaluate(() => JSON.parse(localStorage.getItem("bioquest_photosynthesis_state_v1") || "{}"));
    assert.notEqual(retryState.attempt_id, beforeResetState.attempt_id, `${mode} ${viewport.width}: formal retry creates new attempt`);
    assert.equal(retryState.question_version, questionVersion, `${mode} ${viewport.width}: retry canonical version`);
    assert.ok(backendActions.filter((url) => url.includes("startAttempt")).length >= 2, `${mode} ${viewport.width}: retry calls startAttempt`);
  }
  assert.deepEqual(imageErrors, [], `${mode} ${viewport.width}: image 404`);
  assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width}: console errors`);
  assert.deepEqual(pageErrors, [], `${mode} ${viewport.width}: page errors`);
  await page.screenshot({ path: path.join(artifactDir, `${mode}-${viewport.width}x${viewport.height}-post-retry.png`), fullPage: false });
  await context.close();
  return { mode, viewport, backendActions: backendActions.length, payloads: payloads.length };
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
