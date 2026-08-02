#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const vm = require("node:vm");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = path.resolve(__dirname, "..", "..");
const unitRoot = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(unitRoot, "app.js"), "utf8");
const version = "20260802-nutrients-energy-submitted-retry-ia-v1";
const questionVersion = "20260721-nutrients-energy-q11-inactive-v1";
const storageKey = "bioquest_nutrients_energy_state_v1";

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

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
    if (requestPath === "/favicon.ico") return res.writeHead(204).end();
    const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(root, cleanPath);
    if (!filePath.startsWith(root)) return res.writeHead(403).end("Forbidden");
    fs.readFile(filePath, (error, buffer) => {
      if (error) return res.writeHead(404).end("Not found");
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

const activeIds = ["q01", "q02", "q03", "q04", "q05", "q06", "q07", "q08", "q09", "q10", "q12", "q13", "q14"];
const correctAnswers = {
  q01: ["carb", "protein", "lipid", "vitamin", "mineral", "water"],
  q02: { carb: "common_energy", protein: "build_repair", lipid: "store_energy", vitamin_mineral: "regulate", water: "transport" },
  q03: ["carb", "lipid", "protein"],
  q04: "regulation_not_energy",
  q05: { rice: "carb", bread: "carb", egg: "protein", tofu: "protein", oil: "lipid", nuts: "lipid" },
  q06: "mixed_nutrients",
  q07: "build_repair",
  q08: "needed_in_moderation",
  q09: "provides_energy",
  q10: "add_variety",
  q12: "transport_regulate",
  q13: "variety_moderation",
  q14: "food_contains_nutrients",
  q11_sequence: ["adjust", "check", "infer", "observe"],
  reflection: { confident_concept: "能量來源", uncertain_concept: "", student_question: "", confidence_score: 4 }
};

function progressFixture() {
  return {
    source: "server_verified",
    progress_applied: true,
    total_exp: 5200,
    completed_unit_count: 10,
    current_title_id: "micro_explorer",
    current_title: "微觀探索者",
    title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-female.webp",
    unit_badge_summary_json: JSON.stringify([
      { unit_id: "life_world", earned_count: 2, total_badges: 9, availability_status: "ready", earned_badges: [{ badge_id: "life_world_entry", name: "多彩入門", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }] },
      { unit_id: "nutrients_energy", earned_count: 3, total_badges: 11, availability_status: "ready", earned_badges: [{ badge_id: "nutrients_energy_entry", name: "養分補給入門徽章", badge_image_path: "shared-assets/badges/nutrients_energy/badge-nutrients_energy-nutrients_energy_entry.webp" }] }
    ])
  };
}

function resultFixture(overrides = {}) {
  return {
    completion_exp: 100,
    concept_exp: 220,
    revision_exp: 0,
    question_exp: 40,
    mastery_exp: 140,
    retry_exp: 0,
    attempt_total_exp: 500,
    unit_credited_exp: 500,
    credited_delta: 500,
    correct: 13,
    total: 13,
    accuracy: 1,
    hint_used: 0,
    correct_without_hint: 13,
    corrected_after_hint: 0,
    badges: ["nutrients_energy_entry", "balanced_diet_decider", "nutrients_energy_flawless", "nutrients_energy_reflection_reporter"],
    reflection_quality: "discussion_question",
    reflection_exp_reason: "具體且與本單元概念相關。",
    ...overrides
  };
}

function stateFor(screen, overrides = {}) {
  return {
    screen,
    student: {
      student_id: "S79911",
      student_name: "測試學生",
      class_name: "七年級",
      seat_no: "11",
      profile_gender: "female",
      current_title_id: "micro_explorer",
      current_title: "微觀探索者",
      title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-female.webp",
      progress: progressFixture(),
      is_guest: false
    },
    attempt_type: "first",
    attempt_id: "nutrients_energy_attempt",
    attempt_session_id: "nutrients_energy_session",
    attempt_session_token: "session.token",
    question_version: questionVersion,
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    answers: { ...correctAnswers },
    hints: { q11: true },
    checkedWrong: { q11: true },
    interactions: Object.fromEntries(activeIds.map((id) => [id, true]).concat([["q11", true]])),
    optionOrders: { q11_sequence: ["observe", "infer", "check", "adjust"] },
    result: resultFixture(),
    submitted_at: ["result", "achievements", "rules"].includes(screen) ? "2026-07-21T00:00:00.000Z" : null,
    backend_status: "submitted_verified",
    cumulative_badges: ["nutrients_energy_entry", "balanced_diet_decider", "nutrients_energy_flawless"],
    cumulative_total_exp: 5200,
    completed_unit_count: 10,
    ...overrides
  };
}
function stateForStatus(screen, status) {
  if (status === "guest") {
    return stateFor(screen, {
      student: { student_id: "guest", student_name: "老師測試帳號", class_name: "測試", seat_no: "00", is_guest: true, progress: {} },
      attempt_id: "guest_nutrients_energy_attempt",
      attempt_session_id: "guest_nutrients_energy_attempt",
      attempt_session_token: "guest_local_session",
      backend_status: "local_guest",
      result: resultFixture({ badges: ["nutrients_energy_entry", "balanced_diet_decider"], unit_credited_exp: 0, credited_delta: 0 }),
      cumulative_badges: [],
      cumulative_total_exp: 0,
      completed_unit_count: 0
    });
  }
  if (status === "pending") {
    return stateFor(screen, {
      backend_status: "pending_local",
      result: resultFixture({ badges: ["nutrients_energy_entry", "balanced_diet_decider"], unit_credited_exp: 0, credited_delta: 0 })
    });
  }
  return stateFor(screen);
}

function runVmContract() {
  const localStore = new Map();
  const context = {
    console,
    window: null,
    document: {
      querySelector() { return { dataset: {}, innerHTML: "", addEventListener() {}, classList: { toggle() {} } }; },
      querySelectorAll() { return []; }
    },
    localStorage: {
      getItem(key) { return localStore.get(key) || null; },
      setItem(key, value) { localStore.set(key, String(value)); },
      removeItem(key) { localStore.delete(key); }
    },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    Date,
    Math,
    scrollTo() {},
    windowConfirmResult: true
  };
  context.window = context;
  context.globalThis = context;
  context.BioQuestReflectionQuality = {
    evaluate(reflection = {}) {
      const text = `${reflection.student_question || ""} ${reflection.confident_concept || ""}`;
      const useful = /均衡|養分|能量|水|食物/.test(text) && !/老師好帥|不知道/.test(text);
      return {
        question_exp: useful ? 40 : 0,
        question_exp_candidate: useful ? 40 : 0,
        reflection_quality: useful ? "discussion_question" : "blank",
        reflection_exp_reason: useful ? "具體且與本單元概念相關。" : "空白或不足。",
        reflection_review_status: "server_recalculated",
        reflection_original_text: text.trim(),
        reflection_normalized_text: text.trim(),
        reflection_similarity_score: 0,
        reflection_similarity_source: "",
        reflection_copied_direction_flag: false,
        reflection_irrelevant_flag: false,
        reflection_low_effort_flag: !useful,
        reflection_examples_checked: []
      };
    }
  };
  const instrumented = source.replace(/\nrender\(\);\s*$/, `
window.__nutrientsEnergyProbe = {
  VERSION,
  QUESTION_VERSION,
  sectionMap,
  activeDirectQuestionIds,
  inactiveLegacyQuestionIds,
  inactiveLegacyAnswerKeys,
  badges,
  setState(next) {
    state = sanitizeInactiveLegacy({ ...clone(defaultState), ...next, question_version: QUESTION_VERSION, answers: { ...clone(defaultState.answers), ...(next.answers || {}) } });
  },
  state: () => state,
  isCorrect,
  isAnswered,
  allRequiredAnswered,
  calculateResult,
  buildAttempt,
  buildBackendPayload,
  renderCheckpoint3,
  renderReview,
  renderResult,
  renderAchievements,
  renderRules,
  resetForRelogin
};
`);
  vm.runInNewContext(instrumented, context, { filename: "prototype-nutrients-energy/app.js" });
  const api = context.window.__nutrientsEnergyProbe;
  assert.equal(api.VERSION, version);
  assert.equal(api.QUESTION_VERSION, questionVersion);
  assert.notEqual(api.VERSION, api.QUESTION_VERSION, "runtime cache must stay separate from canonical version");
  assert.deepEqual(Array.from(api.activeDirectQuestionIds), activeIds);
  assert.deepEqual(Array.from(api.sectionMap.checkpoint3), ["q09", "q10", "q12", "q13", "q14"]);
  assert.deepEqual(Array.from(api.inactiveLegacyQuestionIds), ["q11"]);
  assert(source.includes("question_version: QUESTION_VERSION"), "startAttempt must send canonical QUESTION_VERSION");
  assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version");
  assert(!source.includes("renderSequenceQuestion"), "inactive q11 sequence renderer must be removed");
  assert(!source.includes("correctSequence"), "inactive q11 canonical order must be removed from frontend");
  assert(!source.includes("data-sequence-id"), "inactive q11 drag markup must be removed");
  assert(!source.includes("上移 / 下移"), "inactive q11 mobile sequence fallback copy must be removed");

  api.setState(stateFor("checkpoint3", {
    result: null,
    submitted_at: null,
    answers: { ...correctAnswers, reflection: { student_question: "", confidence_score: 4 } },
    hints: { q11: true },
    interactions: { ...Object.fromEntries(activeIds.map((id) => [id, true])), q11: true }
  }));
  assert.equal(Object.hasOwn(api.state().answers, "q11_sequence"), false, "legacy q11 sequence must be stripped from state");
  assert.equal(Object.hasOwn(api.state().hints, "q11"), false, "legacy q11 hint must be stripped from state");
  assert.equal(api.allRequiredAnswered(), true);
  for (const id of activeIds) assert.equal(api.isCorrect(id), true, `${id} should be correct`);
  let score = api.calculateResult();
  assert.equal(score.total, 13);
  assert.equal(score.correct, 13);
  assert.equal(score.hint_used, 0);
  assert.equal(score.attempt_total_exp, 460, "blank reflection cap should be 460");
  assert(score.badges.includes("balanced_diet_decider"), "balanced diet badge should use q10/q13 only");
  assert(score.badges.includes("nutrients_energy_flawless"), "13 active no-hint perfect should be flawless");

  api.setState(stateFor("reflection", {
    result: null,
    submitted_at: null,
    answers: { ...correctAnswers, reflection: { confident_concept: "能量來源", student_question: "我想知道如何用食物例子判斷均衡飲食和養分來源？", confidence_score: 4 } }
  }));
  score = api.calculateResult();
  assert.equal(score.attempt_total_exp, 500, "13 active perfect + useful reflection should reach 500");
  api.setState({ ...api.state(), result: score });
  const attempt = api.buildAttempt();
  const payload = api.buildBackendPayload(attempt);
  assert.equal(payload.question_version, questionVersion);
  assert.equal(payload.required_answer_count, 13);
  assert.equal(payload.answered_required_count, 13);
  assert.deepEqual(Object.keys(JSON.parse(payload.raw_answers_json)).sort(), [...activeIds, "reflection"].sort());
  assert.equal(JSON.parse(payload.raw_answers_json).q11, undefined);
  assert.equal(JSON.parse(payload.raw_answers_json).q11_sequence, undefined);
  assert.equal(payload.question_logs.length, 13);
  assert.deepEqual(Array.from(payload.question_logs.map((log) => log.question_id.replace("nutrients_energy_", "")).sort()), activeIds.slice().sort());
  assert.equal(payload.question_logs.some((log) => log.question_type === "sequence"), false);
  assert.equal(payload.question_logs.some((log) => /q11/.test(log.question_id)), false);
  assert.equal(payload.balanced_diet_score, 100);
  const checkpoint = api.renderCheckpoint3();
  assert(!checkpoint.includes("q11"), "checkpoint3 must not include q11 identifiers");
  assert(!checkpoint.includes("拖曳排出思考流程"), "checkpoint3 must not show inactive thinking-flow prompt");
  assert(!checkpoint.includes("上移"), "checkpoint3 must not show sequence move controls");
  assert(api.renderReview().includes("13</strong>"), "review should report 13 active questions");
  api.setState(stateFor("result"));
  assert(api.renderResult().includes("答對</span><strong>13/13"), "result should report 13 active questions");
  assert(api.renderResult().includes("data-result-earned-badges"), "result should render earned-only badge section");
  assert(api.renderResult().includes("?v=20260802-nutrients-energy-submitted-retry-ia-v1"), "earned badge image URLs must carry runtime cache");
  api.setState(stateFor("achievements"));
  assert(!api.renderAchievements().includes("本單元成就：生命補給徽章牆"), "achievements must not render legacy unit badge wall");
  assert(!api.renderAchievements().includes("data-bq-unit-achievements"), "achievements must use shared overview-only mount");
  assert(api.renderAchievements().includes("data-bq-achievements-overview-only"), "achievements should expose overview-only mount");
  assert(api.renderAchievements().includes("data-relogin-action"), "achievements should expose relogin entry");
  api.setState(stateFor("result"));
  assert(api.renderResult().includes("data-relogin-action"), "result should expose relogin entry");
  api.setState(stateFor("rules"));
  assert(api.renderRules().includes("data-relogin-action"), "rules should expose relogin entry when submitted");

  context.localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "old_attempt", unit_id: "nutrients_energy" }]));
  api.resetForRelogin();
  assert.equal(api.state().screen, "login");
  assert.equal(api.state().student, null);
  assert.equal(api.state().attempt_id, "");
  assert.equal(api.state().submitted_at, null);
  assert.equal(context.localStorage.getItem("bioquest_attempts_v1"), JSON.stringify([{ attempt_id: "old_attempt", unit_id: "nutrients_energy" }]), "reset must preserve attempts history");
}

async function openPage(browser, baseUrl, viewport, state) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(({ key, value }) => {
    localStorage.clear();
    if (value) localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("bioquest_attempts_v1", "[]");
  }, { key: storageKey, value: state });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/prototype-nutrients-energy/index.html?v=${version}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  return { context, page, imageErrors, consoleErrors, pageErrors };
}

async function assertCheckpoint3(browser, baseUrl, viewport) {
  const { context, page, imageErrors, consoleErrors, pageErrors } = await openPage(browser, baseUrl, viewport, stateForStatus("checkpoint3", "verified"));
  const metrics = await page.evaluate(() => ({
    active: document.querySelector("#screen")?.dataset.bioquestScreen,
    questionIds: [...document.querySelectorAll("[data-question-id]")].map((node) => node.getAttribute("data-question-id")),
    sequenceHooks: document.querySelectorAll(".sortable-item, [data-sequence-id], [data-move], .sequence-move-buttons").length,
    text: document.body.textContent,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));
  assert.equal(metrics.active, "checkpoint3");
  assert.deepEqual(metrics.questionIds, ["q09", "q10", "q12", "q13", "q14"]);
  assert.equal(metrics.sequenceHooks, 0, "q11 sequence hooks must not render");
  assert.doesNotMatch(metrics.text, /判斷餐點是否較均衡時，請拖曳排出思考流程|上移|下移/);
  assert.equal(metrics.horizontalOverflow, 0);
  assert.deepEqual(imageErrors, [], "checkpoint3 image 404");
  assert.deepEqual(consoleErrors, [], "checkpoint3 console errors");
  assert.deepEqual(pageErrors, [], "checkpoint3 page errors");
  await context.close();
}

async function assertResultAchievementsRules(browser, baseUrl, viewport, status) {
  for (const screen of ["result", "achievements", "rules"]) {
    const { context, page, imageErrors, consoleErrors, pageErrors } = await openPage(browser, baseUrl, viewport, stateForStatus(screen, status));
    const metrics = await page.evaluate((screenName) => ({
      active: document.querySelector("#screen")?.dataset.bioquestScreen,
      resultOwls: document.querySelectorAll(".bq-result-hero img").length,
      resultEarnedCards: document.querySelectorAll("[data-result-earned-badges] .badge-card").length,
      resultEarnedImages: [...document.querySelectorAll("[data-result-earned-badges] img")].map((img) => img.currentSrc || img.src),
      titleCards: document.querySelectorAll(".bq-title-avatar-card img").length,
      overviewCards: document.querySelectorAll(".bq-unit-badge-summary").length,
      unitPanels: document.querySelectorAll("[data-bq-unit-achievements]").length,
      achievementBadgeCards: screenName === "achievements" ? document.querySelectorAll(".badge-card").length : 0,
      reloginEntries: [...document.querySelectorAll("[data-relogin-action]")].filter((button) => button.offsetParent !== null).length,
      sidebarLoginDisabled: document.querySelector("[data-nav='login']")?.disabled ?? true,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      text: document.body.textContent
    }), screen);
    assert.equal(metrics.active, screen);
    if (screen === "result") {
      assert.equal(metrics.resultOwls, 1, "result should show exactly one shared owl");
      const expectedBadgeCount = status === "verified" ? 4 : 2;
      assert.equal(metrics.resultEarnedCards, expectedBadgeCount, `${status} result should show only current earned badges`);
      assert.equal(metrics.resultEarnedImages.length, expectedBadgeCount, "result earned badges should use real images");
      assert(metrics.resultEarnedImages.every((src) => src.includes(`v=${version}`)), "result badge images must carry U11 cache");
      assert.match(metrics.text, /答對\s*13\/13/);
      assert.match(metrics.text, /完成 100｜直接答對 220｜提示後修正 0｜回報 40｜精熟 140｜再挑戰 0/);
    } else if (screen === "achievements") {
      assert.equal(metrics.titleCards, 1, "achievements should show one title avatar card");
      assert.equal(metrics.unitPanels, 0, "achievements should not render unit badge wall");
      assert.equal(metrics.achievementBadgeCards, 0, "achievements should not show unit badge cards");
      assert.equal(metrics.overviewCards, 52, "whole-book overview should render 52 summary cards");
      if (status === "guest") assert.match(metrics.text, /guest 測試不列入正式稱號進度|guest 測試/);
      if (status === "pending") assert.match(metrics.text, /等待後台確認正式稱號進度|待後台確認/);
    } else {
      assert.match(metrics.text, /重新登入，並從登入頁開始/);
    }
    assert.equal(metrics.sidebarLoginDisabled, false, "submitted sidebar login should remain usable");
    assert(metrics.reloginEntries >= 1, `${screen} should expose main relogin entry`);
    assert.equal(metrics.horizontalOverflow, 0);
    assert.deepEqual(imageErrors, [], `${screen} image 404`);
    assert.deepEqual(consoleErrors, [], `${screen} console errors`);
    assert.deepEqual(pageErrors, [], `${screen} page errors`);
    await context.close();
  }
}

async function runBrowserContract() {
  const { server, port } = await startServer();
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await assertCheckpoint3(browser, baseUrl, viewport);
      for (const status of ["guest", "pending", "verified"]) await assertResultAchievementsRules(browser, baseUrl, viewport, status);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

(async () => {
  runVmContract();
  await runBrowserContract();
  console.log("prototype-nutrients-energy submitted retry IA regression passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
