#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-dichotomous-key")
  : sourceRoot;
const QUESTION_VERSION = "20260819-dichotomous-key-v1";
const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const modes = ["guest", "pending", "verified"];
const launchOptions = { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" };
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
    attempt_id: `${mode}_u39_attempt`,
    attempt_session_token: `${mode}_u39_token`,
    attempt_session_id: `${mode}_u39_session`,
    question_version: QUESTION_VERSION,
    verification_mode: guest ? "local_guest" : verified ? "server_verified" : "pending_backend",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result"],
    answers: {},
    hints: {},
    reflection: { confident: "分支路徑", question: "我想確認二分檢索表在分支節點與路徑紀錄之間如何判斷？", confidence: "4" },
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
      earned_badges: verified ? ["server_u39_badge_without_image"] : ["dichotomous_key_entry", "dichotomous_key_flawless"],
      logs: [],
      reflection: {}
    },
    submitted: true,
    submitLockedAt: "2026-08-19T00:00:00.000Z",
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
  await page.addInitScript(({ mode, state }) => {
    localStorage.setItem("bioquest_dichotomous_key_state_v1", JSON.stringify(state));
    localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ unit_id: "dichotomous_key", attempt_id: "historic_attempt", verification_status: "server_verified" }]));
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
  }, { mode, state: submittedState(mode) });
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
  const cleanState = await page.evaluate(() => JSON.parse(localStorage.getItem("bioquest_dichotomous_key_state_v1")));
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
  const state = {
    screen: screenName,
    student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true },
    attempt_id: `${selector}_${viewport.width}`,
    attempt_session_token: `guest_${viewport.width}`,
    question_version: QUESTION_VERSION,
    verification_mode: "local_guest",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4"],
    answers: {},
    hints: {},
    reflection: { confident: "", question: "", confidence: "3" },
    result: null,
    submitted: false,
    notice: ""
  };
  await page.addInitScript(({ state }) => {
    localStorage.setItem("bioquest_dichotomous_key_state_v1", JSON.stringify(state));
    window.confirm = () => true;
    window.__BIOQUEST_BACKEND_ACTIONS__ = [];
    window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
  }, { state });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  await page.locator(selector).waitFor();
  const label = `${selector} ${viewport.width}x${viewport.height}`;
  assert.equal(await page.locator(selector).count(), 1, `${label}: evidence exactly one`);
  assert.equal(await page.locator(`${selector} img`).count(), 0, `${label}: no bitmap evidence`);
  const text = await page.locator(selector).innerText();
  for (const expected of expectedText) assert(text.includes(expected), `${label}: includes ${expected}`);
  assert(!forbiddenPattern.test(text), `${label}: neutral copy`);
  await assertNoBrokenImages(page, label);
  await assertNoHorizontalOverflow(page, label);
  assert.equal(errors.length, 0, `${label}: no console/page errors`);
  await page.close();
}

async function runBranchCase(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const state = {
    screen: "checkpoint3",
    student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true },
    attempt_id: `branch_guard_${viewport.width}`,
    attempt_session_token: `guest_${viewport.width}`,
    question_version: QUESTION_VERSION,
    verification_mode: "local_guest",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3"],
    answers: {},
    hints: {},
    reflection: { confident: "", question: "", confidence: "3" },
    result: null,
    submitted: false,
    notice: ""
  };
  await page.addInitScript(({ state }) => {
    localStorage.setItem("bioquest_dichotomous_key_state_v1", JSON.stringify(state));
    window.confirm = () => true;
    window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
  }, { state });
  await page.goto(pathToFileURL(path.join(root, "index.html")).href);
  const q04 = '[data-branch-question="dichotomous_key_q04"] .option-card';
  const q07 = '[data-branch-question="dichotomous_key_q07"] .option-card';
  await page.locator(q04).first().waitFor();
  const q04Order = await page.locator(q04).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-value")));
  const q07Order = await page.locator(q07).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-value")));
  assert.deepEqual([...q04Order].sort(), ["has_wings", "no_wings"], `q04 branch set ${viewport.width}`);
  assert.notDeepEqual(q04Order, ["has_wings", "no_wings"], `q04 initial order must not match source order ${viewport.width}`);
  assert.deepEqual([...q07Order].sort(), ["no_wings_node", "result_list", "start", "winged_node"], `q07 branch set ${viewport.width}`);
  assert.notDeepEqual(q07Order, ["winged_node", "start", "no_wings_node", "result_list"], `q07 initial order must not match source order ${viewport.width}`);
  assert.equal(await page.locator(".key-branch-node-evidence").count(), 1, `q04 evidence ${viewport.width}`);
  assert.equal(await page.locator(".key-current-path-evidence").count(), 1, `q07 evidence ${viewport.width}`);
  await assertNoBrokenImages(page, `branch ${viewport.width}`);
  await assertNoHorizontalOverflow(page, `branch ${viewport.width}`);
  await page.close();
}

const browser = await chromium.launch(launchOptions);
try {
  for (const viewport of viewports) {
    for (const mode of modes) await runSubmittedCase(browser, mode, viewport);
    await runEvidenceCase(browser, viewport, "checkpoint1", ".key-observation-evidence", ["觀察卡資料", "觀察卡甲", "欄位"], /答案是|正解|應選|終點是|結果是/);
    await runEvidenceCase(browser, viewport, "checkpoint2", ".key-choice-pair-evidence", ["A/B 選項卡", "選項組一", "選項組三"], /答案是|正解|應選|終點是|結果是/);
    await runBranchCase(browser, viewport);
    await runEvidenceCase(browser, viewport, "checkpoint3", ".key-path-comparison-evidence", ["路徑比較卡", "路徑甲", "路徑乙"], /答案是|正解|應選|終點是|結果是/);
    await runEvidenceCase(browser, viewport, "checkpoint4", ".key-boundary-evidence", ["相鄰單元任務卡", "任務 A", "任務 D"], /答案是|正解|應選/);
    await runEvidenceCase(browser, viewport, "checkpoint2", ".key-feature-build-evidence", ["觀察卡特徵表", "觀察卡", "特徵欄位"], /答案是|正解|應選|終點是|結果是/);
  }
} finally {
  await browser.close();
}

console.log("dichotomous key submitted layout regression passed");
