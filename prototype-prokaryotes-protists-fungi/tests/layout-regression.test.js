#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-prokaryotes-protists-fungi")
  : sourceRoot;
const QUESTION_VERSION = "20260819-prokaryotes-protists-fungi-v1";
const storageKey = "bioquest_prokaryotes_protists_fungi_state_v1";
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const modes = ["guest", "pending", "verified"];
const launchOptions = { executablePath: process.env.BIOQUEST_CHROME_PATH || undefined };
if (process.env.BIOQUEST_DISABLE_CHROME_SANDBOX === "1") launchOptions.args = ["--no-sandbox"];

function submittedState(mode) {
  const verified = mode === "verified";
  const guest = mode === "guest";
  const progress = verified ? {
    total_exp: 6120,
    current_title_id: "micro_explorer",
    current_title: "微觀探索者",
    title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.webp",
    completed_unit_count: 12,
    unit_badge_summary_json: JSON.stringify([{ unit_id: "life_world", earned_count: 2 }])
  } : {};
  return {
    screen: "result",
    student: guest
      ? { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
      : { student_id: "S70102", class_name: "701", seat_no: "02", student_name: mode === "pending" ? "待確認學生" : "正式學生", profile_gender: "male", progress },
    attempt_id: `${mode}_u40_attempt`,
    attempt_session_token: `${mode}_u40_token`,
    attempt_session_id: `${mode}_u40_session`,
    question_version: QUESTION_VERSION,
    verification_mode: guest ? "local_guest" : verified ? "server_verified" : "pending_backend",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "checkpoint5", "checkpoint6", "review", "reflection", "result"],
    answers: {},
    hints: {},
    reflection: { confident: "微小生命分類", question: "我想確認藍菌與藻類差異，以及真菌為何不是植物的證據。", confidence: "4" },
    result: {
      verification_status: guest ? "local_guest" : verified ? "server_verified" : "pending_backend",
      completion_exp: 100,
      direct_exp: verified ? 111 : 220,
      concept_exp: verified ? 111 : 220,
      revision_exp: 0,
      reflection_exp: verified ? 22 : 40,
      question_exp: verified ? 22 : 40,
      mastery_exp: 140,
      retry_exp: 0,
      attempt_exp: verified ? 333 : 500,
      attempt_total_exp: verified ? 333 : 500,
      unit_credited_exp: verified ? 333 : 500,
      earned_badges: verified ? ["server_u40_badge_without_image"] : ["prokaryotes_protists_fungi_entry", "prokaryotes_protists_fungi_flawless"],
      logs: [],
      reflection: {}
    },
    submitted: true,
    submitLockedAt: "2026-08-20T00:00:00.000Z",
    notice: ""
  };
}

function checkpointState(screenName, attemptId) {
  return {
    screen: screenName,
    student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true },
    attempt_id: attemptId,
    attempt_session_token: `guest_${attemptId}`,
    question_version: QUESTION_VERSION,
    verification_mode: "local_guest",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "checkpoint5", "checkpoint6"],
    answers: {},
    hints: {},
    reflection: { confident: "", question: "", confidence: "3" },
    result: null,
    submitted: false,
    notice: ""
  };
}

async function assertNoBrokenImages(page, label) {
  const broken = await page.evaluate(() => [...document.images].filter((img) => img.currentSrc && img.naturalWidth === 0).map((img) => img.currentSrc));
  assert.deepEqual(broken, [], `${label}: no broken images`);
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `${label}: horizontal overflow ${overflow}`);
}

async function runSubmittedCase(browser, mode, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}:${message.text()}`);
  });
  await page.addInitScript(({ mode, state, storageKey }) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ unit_id: "prokaryotes_protists_fungi", attempt_id: "historic_attempt", verification_status: "server_verified" }]));
    window.confirm = () => true;
    window.__BIOQUEST_BACKEND_ACTIONS__ = [];
    window.fetch = async (_url, init = {}) => {
      const body = init?.body ? JSON.parse(init.body) : {};
      window.__BIOQUEST_BACKEND_ACTIONS__.push({ action: body.action, body });
      if (mode === "guest") return { ok: true, json: async () => ({ ok: true }) };
      if (body.action === "getStudentAndAttemptStatus") return { ok: true, json: async () => ({ ok: true, student: state.student, progress: state.student.progress || {} }) };
      if (body.action === "startAttempt") return { ok: true, json: async () => ({ ok: true, verification_mode: "server_verified", attempt_id: `${mode}_new_attempt`, attempt_session_id: `${mode}_new_session`, attempt_session_token: `${mode}_new_token`, previous_attempt_id: state.attempt_id, question_version: state.question_version }) };
      return { ok: true, json: async () => ({ ok: true }) };
    };
  }, { mode, state: submittedState(mode), storageKey });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await page.locator(".result-panel").waitFor();
  const label = `${mode} ${viewport.width}x${viewport.height}`;
  assert.equal(await page.locator("[data-relogin]").count(), 1, `${label}: result relogin entry`);
  assert.equal(await page.locator(".badge-wall").count(), 0, `${label}: result unit wall must be absent`);
  assert.equal(await page.locator(".badge-visual img").count(), 0, `${label}: controlled pending badges must not request images`);
  assert(await page.locator(".candidate-badge-list").count() >= 1 || await page.locator("text=本次尚未取得新項目").count() >= 1, `${label}: result has non-image earned summary`);
  assert.equal(await page.locator('[data-nav="login"]').isEnabled(), true, `${label}: sidebar login reachable`);
  assert.equal(await page.locator('[data-nav="checkpoint1"]').isEnabled(), false, `${label}: submitted checkpoints stay locked`);
  await assertNoBrokenImages(page, `${label} result`);
  await assertNoHorizontalOverflow(page, `${label} result`);

  await page.locator('[data-next="achievements"]').click();
  await page.locator(".bq-title-avatar-card").waitFor();
  await page.locator(".bq-all-unit-badge-overview").waitFor();
  assert.equal(await page.locator(".bq-title-avatar-card").count(), 1, `${label}: title card exactly one`);
  assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, `${label}: whole-book overview exactly one`);
  assert.equal(await page.locator(".bq-unit-badge-summary").count(), 52, `${label}: 52-unit overview`);
  assert.equal(await page.locator(".badge-wall").count(), 0, `${label}: achievements unit wall must be absent`);
  assert.equal(await page.locator("[data-relogin]").count(), 1, `${label}: achievements relogin entry`);
  await assertNoBrokenImages(page, `${label} achievements`);
  await assertNoHorizontalOverflow(page, `${label} achievements`);

  await page.locator('[data-nav="rules"]').click();
  await page.locator(".rule-list").waitFor();
  assert.equal(await page.locator("[data-relogin]").count(), 1, `${label}: rules relogin entry`);
  await page.locator("[data-relogin]").click();
  await page.locator("#studentId").waitFor();
  const cleanState = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
  assert.equal(cleanState.screen, "login", `${label}: reset returns login`);
  assert.equal(cleanState.attempt_id, "", `${label}: reset clears current attempt`);
  assert.equal(cleanState.submitted, false, `${label}: reset clears submitted`);
  const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]"));
  assert.equal(attempts.length, 1, `${label}: reset preserves attempt history`);
  const backendActions = await page.evaluate(() => window.__BIOQUEST_BACKEND_ACTIONS__ || []);
  assert.equal(backendActions.length, 0, `${label}: reset itself must not call backend`);
  assert.equal(errors.length, 0, `${label}: no console/page errors`);
  await page.close();
}

async function runEvidenceCase(browser, viewport, screenName, selector, expectedText, forbiddenPattern) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}:${message.text()}`);
  });
  const state = checkpointState(screenName, `${selector}_${viewport.width}`);
  await page.addInitScript(({ state, storageKey }) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    window.confirm = () => true;
    window.__BIOQUEST_BACKEND_ACTIONS__ = [];
    window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
  }, { state, storageKey });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await page.locator(selector).waitFor();
  const label = `${selector} ${viewport.width}x${viewport.height}`;
  assert.equal(await page.locator(selector).count(), 1, `${label}: evidence exactly one`);
  assert.equal(await page.locator(`${selector} img`).count(), 0, `${label}: no bitmap evidence`);
  const text = await page.locator(selector).innerText();
  for (const expected of expectedText) assert(text.includes(expected), `${label}: includes ${expected}`);
  assert(!forbiddenPattern.test(text), `${label}: neutral copy`);
  if (selector === ".microbe-protist-table-evidence" && viewport.width <= 560) {
    const records = page.locator(".microbe-data-table--q13 .microbe-data-record");
    assert.equal(await records.count(), 3, `${label}: q13 mobile groups one card per organism`);
    assert.equal(await page.locator(".microbe-data-table--q13 .microbe-data-header").evaluate((node) => getComputedStyle(node).display), "none", `${label}: q13 mobile hides detached header row`);
    for (let index = 0; index < 3; index += 1) {
      const record = records.nth(index);
      assert.deepEqual(await record.locator(".microbe-cell-label").evaluateAll((nodes) => nodes.map((node) => node.textContent.trim())), ["代碼", "生活環境", "運動方式", "養分線索"], `${label}: q13 mobile field labels stay attached ${index}`);
      assert.equal(await record.locator('[role="cell"]').count(), 4, `${label}: q13 mobile record has four labeled values ${index}`);
      const box = await record.boundingBox();
      assert(box && box.width <= viewport.width - 20, `${label}: q13 mobile record fits viewport ${index}`);
    }
  }
  await assertNoBrokenImages(page, label);
  await assertNoHorizontalOverflow(page, label);
  assert.equal(errors.length, 0, `${label}: no console/page errors`);
  await page.close();
}

function groupedByAnswer(itemIds, answer) {
  const categories = itemIds.map((id) => answer[id]).filter(Boolean);
  const repeated = [...new Set(categories)].some((category) => categories.filter((value) => value === category).length > 1);
  if (!repeated) return false;
  return [...new Set(categories)].every((category) => {
    const indexes = categories.map((value, index) => value === category ? index : -1).filter((index) => index >= 0);
    return indexes.every((index, offset) => offset === 0 || index === indexes[offset - 1] + 1);
  });
}

async function runMappingCase(browser, viewport, screenName, questionId, canonicalItems, answer) {
  const page = await browser.newPage({ viewport });
  const state = checkpointState(screenName, `${questionId}_${viewport.width}`);
  await page.addInitScript(({ state, storageKey }) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    window.confirm = () => true;
    window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
  }, { state, storageKey });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  const selector = `[data-map-question="${questionId}"]`;
  await page.locator(selector).first().waitFor();
  const itemOrder = await page.locator(selector).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-map-item")));
  assert.deepEqual([...itemOrder].sort(), [...canonicalItems].sort(), `${questionId}: keeps all mapping items ${viewport.width}`);
  assert.notDeepEqual(itemOrder, canonicalItems, `${questionId}: item order should not equal source order ${viewport.width}`);
  assert.equal(groupedByAnswer(itemOrder, answer), false, `${questionId}: item order should not group all answers ${viewport.width}`);
  await assertNoBrokenImages(page, `${questionId} ${viewport.width}`);
  await assertNoHorizontalOverflow(page, `${questionId} ${viewport.width}`);
  await page.close();
}

const browser = await chromium.launch(launchOptions);
try {
  for (const viewport of viewports) {
    for (const mode of modes) await runSubmittedCase(browser, mode, viewport);
    await runEvidenceCase(browser, viewport, "checkpoint1", ".microbe-classification-evidence", ["例子卡", "細菌", "草履蟲"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint1", ".microbe-observation-evidence", ["顯微觀察資料卡", "大小", "資料未完整"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint3", ".microbe-situation-evidence", ["情境卡", "酵母菌", "細菌大量繁殖"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint4", ".microbe-protist-evidence", ["水中微小生物觀察卡", "單細胞", "運動線索"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint1", ".microbe-example-evidence", ["例子資料卡", "乳酸菌", "香菇"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint6", ".microbe-boundary-evidence", ["相鄰單元任務卡", "任務 A", "任務 C"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint3", ".microbe-context-sort-evidence", ["情境分類卡", "情境 A", "情境 C"], /答案是|正解|應選|終點是|結果是|唯一正確/);
    await runEvidenceCase(browser, viewport, "checkpoint4", ".microbe-protist-table-evidence", ["微小生物資料表", "代碼", "生活環境", "運動方式", "養分線索", "甲", "淡水", "以纖毛移動", "吞入微小食物顆粒", "乙", "池水表層", "資料未列出明顯移動構造", "有葉綠體線索，可利用光", "丙", "潮濕環境", "會伸出偽足", "取得小型食物"], /答案是|正解|應選|終點是|結果是|唯一正確|分類為|類群是|應排除|答案方向/);
    await runMappingCase(browser, viewport, "checkpoint1", "prokaryotes_protists_fungi_q02", ["bacteria", "cyanobacteria", "paramecium", "yeast", "mold", "mushroom"], { bacteria: "prokaryotes", cyanobacteria: "prokaryotes", paramecium: "protists", yeast: "fungi", mold: "fungi", mushroom: "fungi" });
    await runMappingCase(browser, viewport, "checkpoint1", "prokaryotes_protists_fungi_q08", ["lactic_acid_bacteria", "cyanobacteria", "paramecium", "yeast", "mushroom"], { lactic_acid_bacteria: "prokaryotes", cyanobacteria: "prokaryotes", paramecium: "protists", yeast: "fungi", mushroom: "fungi" });
    await runMappingCase(browser, viewport, "checkpoint6", "prokaryotes_protists_fungi_q10", ["branch_key_task", "microbe_group_task", "plant_group_task"], { branch_key_task: "u39_dichotomous_key", microbe_group_task: "u40_prokaryotes_protists_fungi", plant_group_task: "u41_plant_kingdom" });
    await runMappingCase(browser, viewport, "checkpoint3", "prokaryotes_protists_fungi_q12", ["bread_yeast_rising", "spoiled_food_bacteria", "unknown_water_sample"], { bread_yeast_rising: "possible_benefit", spoiled_food_bacteria: "possible_problem", unknown_water_sample: "need_more_context" });
  }
} finally {
  await browser.close();
}

console.log("U40 submitted layout regression passed");
