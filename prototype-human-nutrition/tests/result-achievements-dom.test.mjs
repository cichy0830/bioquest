#!/usr/bin/env node

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import playwright from "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js";

const { chromium } = playwright;

const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = pathToFileURL(path.join(root, "index.html")).href;
const storageKey = "bioquest_human_nutrition_state_v1";
const badges = ["human_nutrition_entry", "human_nutrition_flawless", "human_nutrition_reflection_reporter"];

const resultBase = {
  unit_id: "human_nutrition",
  attempt_id: "u15_dom_attempt",
  completion_status: "complete",
  total_questions: 14,
  correct_count: 14,
  accuracy: 1,
  hint_used_count: 0,
  direct_correct_count: 14,
  revised_correct_count: 0,
  completion_exp: 100,
  direct_exp: 220,
  revision_exp: 0,
  reflection_exp: 40,
  mastery_exp: 140,
  retry_exp: 0,
  attempt_exp: 500,
  unit_credited_exp: 500,
  exp_delta: 500,
  earned_badges: badges,
  reflection: { reflection_quality: "discussion_question", question_exp: 40 }
};

function stateFor(mode, screen) {
  const isGuest = mode === "guest";
  const verified = mode === "verified";
  return {
    screen,
    student: {
      student_id: isGuest ? "guest" : "S79999",
      class_name: isGuest ? "測試" : "701",
      seat_no: isGuest ? "00" : "99",
      student_name: isGuest ? "老師測試帳號" : "測試學生",
      is_guest: isGuest,
      profile_gender: "female",
      progress: verified ? {
        source: "server_verified",
        total_exp: 4320,
        completed_unit_count: 9,
        current_title_id: "concept_solver",
        current_title: "概念解謎者",
        unit_badge_summary_json: JSON.stringify([{ unit_id: "life_world", sequence: 1, unit_title: "多彩多姿的生命世界", total_badges: 9, earned_count: 2, earned_badges: [{ badge_id: "life_world_entry", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }] }])
      } : { source: "pending_backend" }
    },
    attempt_id: `u15_${mode}_attempt`,
    attempt_session_token: isGuest ? "guest_token" : "server_token",
    question_version: "20260723-human-nutrition-digestive-classification-v2",
    verification_mode: isGuest ? "local_guest" : "server_verified",
    submitted: true,
    submitLockedAt: "2026-07-18T15:20:00.000Z",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    reflection: { confident: "消化與吸收", question: "我想確認小腸絨毛增加面積後，養分如何進入血液並運送。", confidence: "5" },
    result: {
      ...resultBase,
      verification_status: isGuest ? "local_guest" : verified ? "server_verified" : "pending_backend"
    },
    notice: ""
  };
}

async function inspect(mode, screen, viewport) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const context = await browser.newContext({ viewport });
  const errors = [];
  const imageFailures = [];
  await context.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: stateFor(mode, screen) });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    const request = response.request();
    if (request.resourceType() === "image" && response.status() >= 400) imageFailures.push(request.url());
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(100);
  const snapshot = await page.evaluate(() => {
    const text = document.body.innerText;
    const overview = document.querySelector("[data-bq-badge-overview], .bq-all-unit-badge-overview");
    const titleCard = document.querySelector(".bq-title-avatar-card, .title-avatar-card.achievements");
    const firstAchievementChild = document.querySelector(".achievements-stack")?.firstElementChild;
    return {
      text,
      titleCards: document.querySelectorAll(".bq-title-avatar-card, .title-avatar-card.achievements").length,
      legacyTitleCards: document.querySelectorAll(".title-card").length,
      overviewCount: document.querySelectorAll("[data-bq-badge-overview], .bq-all-unit-badge-overview").length,
      summaryBoxes: document.querySelectorAll(".bq-unit-badge-summary").length,
      unitPanels: document.querySelectorAll("[data-bq-unit-achievements='human_nutrition']").length,
      titleBeforeOverview: Boolean(titleCard && overview && (titleCard.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING)),
      titleIsFirstAchievementChild: Boolean(titleCard && firstAchievementChild === titleCard),
      resultBadgeCards: document.querySelectorAll(".result-stack .badge-wall .badge").length,
      resultBadgeImages: [...document.querySelectorAll(".result-stack .badge-wall .badge-visual img")].filter((img) => img.complete && img.naturalWidth > 0).length,
      resultBadgeImageCacheOk: [...document.querySelectorAll(".result-stack .badge-wall .badge-visual img")].every((img) => img.currentSrc.includes("20260723-human-nutrition-approved-visuals-v1")),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      visibleTitleImages: [...document.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img")].filter((img) => img.complete && img.naturalWidth > 0).length
    };
  });
  await browser.close();
  assert.deepEqual(errors, [], `${mode}/${screen}/${viewport.width}: console/page errors`);
  assert.deepEqual(imageFailures, [], `${mode}/${screen}/${viewport.width}: image failures`);
  assert.equal(snapshot.horizontalOverflow, false, `${mode}/${screen}/${viewport.width}: horizontal overflow`);
  if (screen === "result") {
    assert.equal(snapshot.resultBadgeCards, 3, `${mode}/${viewport.width}: result must show current earned badges`);
    assert.equal(snapshot.resultBadgeImages, 3, `${mode}/${viewport.width}: earned badge images must load`);
    assert.equal(snapshot.resultBadgeImageCacheOk, true, `${mode}/${viewport.width}: earned badge image URLs must include current cache`);
    if (mode === "guest") {
      assert(snapshot.text.includes("guest 測試：本次預估"), "guest result copy missing");
      assert(snapshot.text.includes("不列入正式累積"), "guest formal exclusion missing");
      assert(!snapshot.text.includes("本單元認列"), "guest result must not use legacy credit wording");
    }
    if (mode === "pending") {
      assert(snapshot.text.includes("待後台確認"), "pending result copy missing");
      assert(!snapshot.text.includes("本單元認列"), "pending result must not use legacy credit wording");
      assert(!snapshot.text.includes("正式認列"), "pending result must not claim formal credit");
    }
    if (mode === "verified") {
      assert(snapshot.text.includes("本單元正式認列"), "verified formal credit missing");
    }
  }
  if (screen === "achievements") {
    assert.equal(snapshot.legacyTitleCards, 0, `${mode}/${viewport.width}: legacy title-card remains`);
    assert.equal(snapshot.unitPanels, 0, `${mode}/${viewport.width}: achievements must not repeat unit badge wall`);
    assert.equal(snapshot.titleCards, 1, `${mode}/${viewport.width}: title avatar card count`);
    assert.equal(snapshot.titleIsFirstAchievementChild, true, `${mode}/${viewport.width}: title avatar must be first achievements panel`);
    assert.equal(snapshot.visibleTitleImages, 1, `${mode}/${viewport.width}: title avatar image visible`);
    assert.equal(snapshot.overviewCount, 1, `${mode}/${viewport.width}: overview count`);
    assert.equal(snapshot.summaryBoxes, 52, `${mode}/${viewport.width}: whole-book summary boxes`);
    assert.equal(snapshot.titleBeforeOverview, true, `${mode}/${viewport.width}: title card must precede overview`);
  }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const mode of ["guest", "pending", "verified"]) {
    await inspect(mode, "result", viewport);
    await inspect(mode, "achievements", viewport);
  }
}

console.log("prototype-human-nutrition result/achievements DOM regression passed");
