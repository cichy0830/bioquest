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
const CACHE_VERSION = "20260731-scale-submitted-retry-ia-v1";
const QUESTION_VERSION = "20260711-scale-security-v1";
const artifactDir = path.join(root, "tests", "artifacts", CACHE_VERSION);
fs.mkdirSync(artifactDir, { recursive: true });

const correctAnswers = {
  q01: ["backpack", "leaf", "ant", "rice", "cell"],
  q02: { door: "m", tree: "m", rice: "mm", cell: "um" },
  q03: "mm_um",
  q04: "a_larger",
  q05: { classroom: "tape", leaf: "magnifier", onion: "compound", height: "height_rule" },
  q06: "compound",
  q07: "fit_purpose",
  q08: "microscope_cells",
  q09: "one_hundred_um",
  q10: "image_only",
  q11: "use_scale_bar",
  q12: "two_mm",
  q13: "check_evidence",
  q14: "unit_relations"
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
  return ({ mode, questionVersion }) => {
    const historicalSummary = [
      { unit_id: "life_world", sequence: 1, unit_title: "多彩多姿的生命世界", station_title: "第 1 站｜多彩多姿的生命世界", availability_status: "open", total_badges: 9, earned_count: 1, earned_badges: [{ badge_id: "life_world_entry", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }] },
      { unit_id: "scientific_method", sequence: 2, unit_title: "探究自然的科學方法", station_title: "第 2 站｜探究自然的科學方法", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "scientific_method_entry", badge_image_path: "shared-assets/badges/scientific_method/badge-scientific_method-scientific_method_entry.webp" }] },
      { unit_id: "lab_intro", sequence: 3, unit_title: "進入實驗室", station_title: "第 3 站｜進入實驗室", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "lab_intro_entry", badge_image_path: "shared-assets/badges/lab_intro/badge-lab_intro-lab_intro_entry.webp" }] },
      { unit_id: "microscope_use", sequence: 4, unit_title: "顯微鏡的使用", station_title: "第 4 站｜顯微鏡的使用", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "microscope_use_entry", badge_image_path: "shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_entry.webp" }] },
      { unit_id: "cell_basic_unit", sequence: 5, unit_title: "生物體的基本單位", station_title: "第 5 站｜生物體的基本單位", availability_status: "open", total_badges: 8, earned_count: 6, earned_badges: [
        { badge_id: "cell_basic_unit_entry", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_basic_unit_entry.webp" },
        { badge_id: "cell_unit_concept_keeper", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_unit_concept_keeper.webp" },
        { badge_id: "unicellular_multicellular_sorter", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-unicellular_multicellular_sorter.webp" },
        { badge_id: "cell_form_function_linker", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_form_function_linker.webp" },
        { badge_id: "microscopic_evidence_reader", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-microscopic_evidence_reader.webp" },
        { badge_id: "cell_basic_unit_flawless", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_basic_unit_flawless.webp" }
      ] },
      { unit_id: "cell_structure", sequence: 6, unit_title: "細胞的構造", station_title: "第 6 站｜細胞的構造", availability_status: "open", total_badges: 9, earned_count: 3, earned_badges: [{ badge_id: "cell_structure_entry", badge_image_path: "shared-assets/badges/cell_structure/badge-cell_structure-cell_structure_entry.webp" }] },
      { unit_id: "cell_observation", sequence: 7, unit_title: "細胞的觀察", station_title: "第 7 站｜細胞的觀察", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "cell_observation_entry", badge_image_path: "shared-assets/badges/cell_observation/badge-cell_observation-cell_observation_entry.webp" }] },
      { unit_id: "cell_transport", sequence: 8, unit_title: "物質進出細胞的方式", station_title: "第 8 站｜物質進出細胞的方式", availability_status: "open", total_badges: 10, earned_count: 4, earned_badges: [{ badge_id: "cell_transport_entry", badge_image_path: "shared-assets/badges/cell_transport/badge-cell_transport-cell_transport_entry.webp" }] },
      { unit_id: "biological_organization", sequence: 9, unit_title: "生物體的組成層次", station_title: "第 9 站｜生物體的組成層次", availability_status: "open", total_badges: 10, earned_count: 2, earned_badges: [{ badge_id: "biological_organization_entry", badge_image_path: "shared-assets/badges/biological_organization/badge-biological_organization-biological_organization_entry.webp" }] }
    ];
    const scaleSummary = { unit_id: "scale", sequence: 10, unit_title: "尺度", station_title: "第 10 站｜尺度", availability_status: "open", total_badges: 11, earned_count: 2, earned_badges: [
      { badge_id: "scale_entry", badge_image_path: "shared-assets/badges/scale/badge-scale-scale_entry.webp" },
      { badge_id: "scale_order_sorter", badge_image_path: "shared-assets/badges/scale/badge-scale-scale_order_sorter.webp" }
    ] };
    const loginProgress = {
      source: "server_verified",
      progress_applied: true,
      total_exp: 4320,
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
      completed_unit_count: 9,
      unit_badge_summary_json: JSON.stringify(historicalSummary)
    };
    const verifiedProgress = {
      ...loginProgress,
      total_exp: 4817,
      completed_unit_count: 10,
      unit_badge_summary_json: JSON.stringify([...historicalSummary, scaleSummary])
    };
    window.__capturedPayloads = [];
    window.__backendActions = [];
    window.fetch = async (url, options = {}) => {
      const href = String(url);
      window.__backendActions.push(href);
      if (href.includes("getStudentAndAttemptStatus")) {
        return new Response(JSON.stringify({
          ok: true,
          student: {
            student_id: "SQA10V",
            student_name: "尺度同學",
            class_name: "七年一班",
            seat_no: "10",
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
          verification_mode: "server_verified",
          attempt_type: "first",
          issued_at: "2026-07-16T00:00:00.000Z",
          attempt_id: "scale_attempt_server_1",
          attempt_session_id: "scale_session_1",
          attempt_session_token: "scale_token_1",
          question_version: questionVersion,
          previous_attempt_id: "",
          expires_at: "2026-07-16T01:00:00.000Z"
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("hintEvent")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (href.includes("submitAttempt")) {
        const body = String(options.body || "");
        window.__capturedPayloads.push(body);
        if (mode === "pending") return new Response("temporary unavailable", { status: 503 });
        return new Response(JSON.stringify({
          ok: true,
          attempt_id: "scale_verified_attempt",
          verification_status: "server_verified",
          student_progress: verifiedProgress,
          verified_attempt: {
            verification_status: "server_verified",
            unit_credited_exp: 397,
            attempt_total_exp: 397,
            credited_delta: 397,
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
  await page.locator("#studentIdInput").fill("SQA10V");
  await page.locator("#loginButton").click();
}

async function orderSequence(page, ids) {
  await page.locator('[data-move][data-dir="-1"]:not([disabled])').first().click().catch(() => {});
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

async function assertQuestionEvidence(page, expected = {}) {
  const metrics = await page.locator("#screen").evaluate(() => {
    const rows = {};
    document.querySelectorAll("[data-question-id]").forEach((card) => {
      rows[card.dataset.questionId] = {
        dataCards: card.querySelectorAll(".question-data-card").length,
        evidence: card.querySelectorAll(".scale-evidence-strip").length,
        figures: card.querySelectorAll("figure, img, picture").length,
        text: card.textContent
      };
    });
    return rows;
  });
  Object.entries(expected).forEach(([qid, count]) => {
    assert.equal(metrics[qid]?.dataCards || 0, count, `${qid}: question-data-card count`);
    assert.equal(metrics[qid]?.evidence || 0, count, `${qid}: evidence strip count`);
  });
  ["q03", "q04", "q06", "q07", "q11", "q12", "q14"].forEach((qid) => {
    if (!metrics[qid]) return;
    assert.equal(metrics[qid].dataCards, 0, `${qid}: no extra data card`);
    assert.equal(metrics[qid].figures, 0, `${qid}: no figure/image/picture`);
  });
  return metrics;
}

async function answerClassify(page, qid, answers) {
  for (const [item, value] of Object.entries(answers)) {
    await page.locator(`select[data-classify-question="${qid}"][data-classify-item="${item}"]`).selectOption(value);
  }
}

async function answerCheckpoint1(page) {
  await page.locator("#checkSection").click();
  assert.match(await page.locator("#sectionMessage").textContent(), /請先完成本區 4 題必答內容/, "unanswered checkpoint should be blocked");
  await assertQuestionEvidence(page, {});
  await orderSequence(page, correctAnswers.q01);
  await answerClassify(page, "q02", correctAnswers.q02);
  await answerChoice(page, "q03", "cm_m");
  await page.waitForSelector('[data-question-id="q03"] .feedback.warn');
  await answerChoice(page, "q03", correctAnswers.q03);
  await answerChoice(page, "q04", correctAnswers.q04);
}

async function answerCheckpoint2(page) {
  await assertQuestionEvidence(page, { q08: 1 });
  await answerClassify(page, "q05", correctAnswers.q05);
  for (const qid of ["q06", "q07", "q08"]) await answerChoice(page, qid, correctAnswers[qid]);
}

async function answerCheckpoint3(page) {
  const metrics = await assertQuestionEvidence(page, { q09: 1 });
  assert.doesNotMatch(metrics.q11.text, /甲圖標尺|乙圖標尺|question-data-card/, "q11 has no legacy scale-bar data card text");
  assert.equal(metrics.q12.dataCards, 0, "q12 has no extra data card");
  for (const qid of ["q09", "q10", "q11", "q12", "q13", "q14"]) await answerChoice(page, qid, correctAnswers[qid]);
}

async function runFlow(browser, baseUrl, viewport, mode) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(backendScript(mode), { mode, questionVersion: QUESTION_VERSION });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(`${baseUrl}/prototype-scale/index.html?v=${CACHE_VERSION}`, { waitUntil: "domcontentloaded" });
  await login(page, mode);

  await page.waitForSelector(".bq-brief-scene-stage .bq-brief-scene-image");
  const briefMetrics = await page.locator(".bq-brief-scene-stage").evaluate((scene) => {
    const avatar = scene.querySelector(".bq-brief-student-avatar");
    const image = scene.querySelector(".bq-brief-scene-image");
    const avatarRect = avatar.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    return {
      imageNaturalWidth: image.naturalWidth,
      avatarNaturalWidth: avatar.naturalWidth,
      avatarHeightRatio: avatarRect.height / Math.max(1, sceneRect.height),
      legacySlots: scene.querySelectorAll(".student-avatar-slot:not(.bq-brief-legacy-avatar)").length,
      sceneRatio: sceneRect.width / Math.max(1, sceneRect.height)
    };
  });
  assert.ok(briefMetrics.imageNaturalWidth > 0, `${mode} ${viewport.width}: briefing scene image should load`);
  assert.ok(briefMetrics.avatarNaturalWidth > 0, `${mode} ${viewport.width}: title avatar should load`);
  assert.ok(briefMetrics.avatarHeightRatio >= 0.85 && briefMetrics.avatarHeightRatio <= 1.01, `${mode} ${viewport.width}: title avatar should be near scene role height`);
  assert.equal(briefMetrics.legacySlots, 0, `${mode} ${viewport.width}: no visible legacy round avatar slot`);
  assert.ok(Math.abs(briefMetrics.sceneRatio - (16 / 9)) < 0.12, `${mode} ${viewport.width}: brief scene should preserve 16:9 ratio`);

  await page.locator("#briefNext").click();
  await page.waitForFunction(() => {
    const image = document.querySelector(".scale-prep-owl img");
    return image && image.naturalWidth > 0;
  });
  const prepOwl = await page.locator(".scale-prep-owl img").evaluate((img) => ({
    count: document.querySelectorAll(".scale-prep-owl img").length,
    naturalWidth: img.naturalWidth,
    src: img.getAttribute("src"),
    immediatelyAfterHeading: img.closest(".scale-prep-owl")?.previousElementSibling?.tagName === "H2"
  }));
  assert.equal(prepOwl.count, 1, `${mode} ${viewport.width}: prep owl exactly one`);
  assert.ok(prepOwl.naturalWidth > 0, `${mode} ${viewport.width}: prep owl should load`);
  assert.match(prepOwl.src, /\.webp$/, `${mode} ${viewport.width}: prep owl direct webp`);
  assert.equal(prepOwl.immediatelyAfterHeading, true, `${mode} ${viewport.width}: prep owl should be directly after heading`);
  const fallbackVisible = await page.locator(".scale-prep-owl .owl-fallback").evaluate((fallback) => {
    const style = getComputedStyle(fallback);
    return !fallback.hidden && style.display !== "none" && style.visibility !== "hidden";
  });
  assert.equal(fallbackVisible, false, `${mode} ${viewport.width}: loaded prep owl must hide text fallback`);
  await page.locator("#scanNext").click();
  await answerCheckpoint1(page);
  await page.locator("#checkSection").click();
  await page.waitForSelector('[data-question-id="q05"]');
  await answerCheckpoint2(page);
  await page.locator("#checkSection").click();
  await page.waitForSelector('[data-question-id="q09"]');
  await answerCheckpoint3(page);
  await page.locator("#checkSection").click();
  await page.locator("#reviewNext").click();
  const reflectionOwlCount = await page.locator(".bq-report-assistant img").count();
  assert.equal(reflectionOwlCount, 1, `${mode} ${viewport.width}: shared report owl exactly one`);
  await page.locator("#submitMission").click();
  await page.waitForSelector(".score-grid");

  const resultText = await page.locator("#screen").textContent();
  assert.match(resultText, /397 EXP/, `${mode} ${viewport.width}: hint path should keep estimated EXP, not zero`);
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
    resultBadgeCards: root.querySelectorAll("[data-result-earned-only='true'] .badge-card").length,
    resultBadgeImages: root.querySelectorAll("[data-result-earned-only='true'] .badge-image").length,
    localWallCount: root.querySelectorAll("[data-bq-unit-achievements], .badge-wall").length,
    reloginButtons: [...root.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length,
    brokenImages: [...root.querySelectorAll("[data-result-earned-only='true'] img")].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src)
  }));
  assert.equal(resultMetrics.earnedOnlySections, 1, `${mode} ${viewport.width}: result earned-only section`);
  assert.ok(resultMetrics.resultBadgeCards > 0 && resultMetrics.resultBadgeCards < 11, `${mode} ${viewport.width}: result only shows current earned badges`);
  assert.equal(resultMetrics.resultBadgeImages, resultMetrics.resultBadgeCards, `${mode} ${viewport.width}: result earned badges use images`);
  assert.equal(resultMetrics.localWallCount, 0, `${mode} ${viewport.width}: result must not render catalog wall`);
  assert.ok(resultMetrics.reloginButtons >= 1, `${mode} ${viewport.width}: result relogin entry`);
  assert.deepEqual(resultMetrics.brokenImages, [], `${mode} ${viewport.width}: result badge images load`);

  await page.locator("#resultAchievements").click();
  await page.waitForSelector("[data-bq-badge-overview]");
  const achievementMetrics = await page.locator("#screen").evaluate((root) => {
    const panels = [...root.querySelectorAll(".panel")];
    const overviewIndex = panels.findIndex((panel) => panel.matches("[data-bq-badge-overview]"));
    const titleImages = [...root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img")];
    return {
      titleImageCount: titleImages.length,
      titleNaturalWidth: titleImages[0]?.naturalWidth || 0,
      overviewIndex,
      overviewCount: root.querySelectorAll("[data-bq-badge-overview]").length,
      summaryBoxCount: root.querySelectorAll(".bq-unit-badge-summary").length,
      localWallCount: root.querySelectorAll("[data-bq-unit-achievements], .badge-wall").length,
      localBadgeGridImages: root.querySelectorAll(".badge-grid .badge-image").length,
      reloginButtons: [...root.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length,
      firstTen: [...root.querySelectorAll(".bq-unit-badge-summary")].slice(0, 10).map((card) => ({
        text: card.textContent,
        thumbs: card.querySelectorAll("img").length
      })),
      visibleMissing: [...root.querySelectorAll(".bq-unit-badge-missing")].filter((node) => {
        const style = getComputedStyle(node);
        return !node.hidden && style.display !== "none" && style.visibility !== "hidden";
      }).length,
      badgeIconCount: root.querySelectorAll(".badge-icon").length,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      text: root.textContent
    };
  });
  assert.equal(achievementMetrics.titleImageCount, 1, `${mode} ${viewport.width}: title avatar count`);
  assert.ok(achievementMetrics.titleNaturalWidth > 0, `${mode} ${viewport.width}: title avatar should load`);
  assert.equal(achievementMetrics.localWallCount, 0, `${mode} ${viewport.width}: achievements must not render local unit badge wall`);
  assert.equal(achievementMetrics.localBadgeGridImages, 0, `${mode} ${viewport.width}: achievements must not repeat unit badge images`);
  assert.ok(achievementMetrics.overviewIndex >= 0, `${mode} ${viewport.width}: overview panel exists`);
  assert.equal(achievementMetrics.overviewCount, 1, `${mode} ${viewport.width}: overview count`);
  assert.equal(achievementMetrics.summaryBoxCount, 52, `${mode} ${viewport.width}: whole-book summary boxes`);
  assert.ok(achievementMetrics.reloginButtons >= 1, `${mode} ${viewport.width}: achievements relogin entry`);
  assert.equal(achievementMetrics.visibleMissing, 0, `${mode} ${viewport.width}: loaded badge thumbnails must not show missing fallback`);
  assert.equal(achievementMetrics.badgeIconCount, 0, `${mode} ${viewport.width}: no redundant badge-icon markers`);
  assert.equal(achievementMetrics.horizontalOverflow, false, `${mode} ${viewport.width}: no horizontal overflow`);
  if (mode === "verified") {
    assert.match(achievementMetrics.text, /4817 EXP｜已完成 10 站/, `${mode} ${viewport.width}: title card uses verified progress`);
    assert.ok(achievementMetrics.firstTen.every((card) => card.thumbs >= 1), `${mode} ${viewport.width}: U1-U10 verified badge history preserved`);
    assert.equal(achievementMetrics.firstTen[4].thumbs, 6, `${mode} ${viewport.width}: U5 6/8 summary should render 6 thumbnails`);
  } else if (mode === "pending") {
    assert.match(achievementMetrics.text, /4320 EXP｜已完成 9 站/, `${mode} ${viewport.width}: title card keeps trusted login progress`);
    assert.ok(achievementMetrics.firstTen.slice(0, 9).every((card) => card.thumbs >= 1), `${mode} ${viewport.width}: U1-U9 verified badge history preserved`);
    assert.equal(achievementMetrics.firstTen[4].thumbs, 6, `${mode} ${viewport.width}: pending U5 history should still render 6 thumbnails`);
    assert.equal(achievementMetrics.firstTen[9].thumbs, 0, `${mode} ${viewport.width}: pending U10 badges stay out of formal overview`);
  } else {
    assert.match(achievementMetrics.text, /0 EXP｜已完成 0 站/, `${mode} ${viewport.width}: guest title card remains local-only`);
    assert.ok(achievementMetrics.firstTen.every((card) => card.thumbs === 0), `${mode} ${viewport.width}: guest does not inherit verified badges`);
  }
  if (mode !== "verified") assert.doesNotMatch(achievementMetrics.text, /正式累積 EXP|已完成單元/, `${mode} ${viewport.width}: achievement formal wording leak`);

  await page.locator("#achieveResult").click();
  await page.waitForSelector("#screen[data-bioquest-screen='result']");
  await page.locator("#resultRules").click();
  await page.waitForSelector("#screen[data-bioquest-screen='rules']");
  const rulesReloginButtons = await page.locator("#screen").evaluate((root) => [...root.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length);
  assert.ok(rulesReloginButtons >= 1, `${mode} ${viewport.width}: rules relogin entry`);
  const submittedNavState = await page.evaluate(() => ({
    checkpointDisabled: Boolean(document.querySelector("[data-nav='checkpoint1']")?.disabled),
    loginDisabled: Boolean(document.querySelector("[data-nav='login']")?.disabled),
    resultDisabled: Boolean(document.querySelector("[data-nav='result']")?.disabled),
    achievementsDisabled: Boolean(document.querySelector("[data-nav='achievements']")?.disabled),
    rulesDisabled: Boolean(document.querySelector("[data-nav='rules']")?.disabled),
    activeScreen: document.querySelector("#screen")?.dataset.bioquestScreen || ""
  }));
  assert.equal(submittedNavState.checkpointDisabled, true, `${mode} ${viewport.width}: submitted checkpoint nav must stay locked`);
  assert.equal(submittedNavState.loginDisabled, false, `${mode} ${viewport.width}: submitted login nav remains usable`);
  assert.equal(submittedNavState.resultDisabled, false, `${mode} ${viewport.width}: submitted result nav remains usable`);
  assert.equal(submittedNavState.achievementsDisabled, false, `${mode} ${viewport.width}: submitted achievements nav remains usable`);
  assert.equal(submittedNavState.rulesDisabled, false, `${mode} ${viewport.width}: submitted rules nav remains usable`);
  assert.equal(submittedNavState.activeScreen, "rules", `${mode} ${viewport.width}: rules remains active while old checkpoint is locked`);

  const captured = await page.evaluate(() => window.__capturedPayloads || []);
  if (mode === "guest") {
    assert.equal(captured.length, 0, `${mode} ${viewport.width}: guest should not submit to backend`);
  } else {
    assert.equal(captured.length, mode === "pending" ? 1 : 1, `${mode} ${viewport.width}: one backend submit payload`);
    const params = new URLSearchParams(captured[0]);
    const payload = JSON.parse(params.get("payload"));
    assert.equal(payload.unit_id, "scale", `${mode} ${viewport.width}: payload unit`);
    assert.equal(payload.question_version, QUESTION_VERSION, `${mode} ${viewport.width}: payload canonical version`);
    assert.equal(payload.required_answer_count, 14, `${mode} ${viewport.width}: payload required count`);
    assert.equal(payload.answered_required_count, 14, `${mode} ${viewport.width}: payload answered count`);
    assert.equal(payload.question_logs.length, 14, `${mode} ${viewport.width}: payload question logs`);
    assert.ok(payload.question_logs.every((log) => log.unit_id === "scale" && log.student_id && log.answer_json && log.question_type), `${mode} ${viewport.width}: dashboard v3 log fields`);
  }

  assert.deepEqual(imageErrors, [], `${mode} ${viewport.width}: image 404`);
  assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width}: console errors`);
  assert.deepEqual(pageErrors, [], `${mode} ${viewport.width}: page errors`);
  await page.screenshot({ path: path.join(artifactDir, `${mode}-${viewport.width}x${viewport.height}-achievements.png`), fullPage: false });
  await context.close();
  return { mode, viewport, payloads: captured.length };
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
