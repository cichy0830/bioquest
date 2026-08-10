const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.resolve(__dirname, "../app.js");
const appSource = fs.readFileSync(appPath, "utf8");
const reflectionSource = fs.readFileSync(path.resolve(__dirname, "../../shared-assets/bioquest-reflection-quality.js"), "utf8");
const styleSource = fs.readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");
const storage = new Map();

function element() {
  return {
    dataset: {}, disabled: false, value: "", innerHTML: "",
    classList: { toggle() {} }, addEventListener() {}, scrollIntoView() {}
  };
}

const screen = element();
const studentMini = element();
const context = {
  console, Set, Map, Date, Math, JSON, String, Number, Boolean, Array, Object, URLSearchParams,
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  },
  document: {
    querySelector(selector) { return selector === "#screen" ? screen : selector === "#studentMini" ? studentMini : element(); },
    querySelectorAll() { return []; }
  },
  window: { scrollTo() {}, alert() {}, confirm() { return true; } }
};

vm.createContext(context);
vm.runInContext(reflectionSource, context);
vm.runInContext(`${appSource}\n;globalThis.__enzymesTest = { getState: () => state, setState: (next) => { state = next; }, calculateResult, allRequiredAnswered, isLockedScreen, evaluateReflectionQuality, mission, assets, badges, questions, classifyQuestions, sectionMap, renderChoiceQuestion, renderClassifyQuestion, renderQuestionEvidence, renderScan, renderLogin, buildAttempt, buildBackendPayload, submissionStatus, renderResult, renderAchievements, renderRules, resetForRelogin, VERSION, QUESTION_VERSION };`, context);

const api = context.__enzymesTest;
const state = api.getState();
state.student = { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安" };
api.questions.forEach((question) => { state.answers[question.id] = question.answer; });
state.answers.q03 = { amylase: "starch", protease: "protein", lipase: "lipid" };
state.interactions.q03 = true;
state.answers.reflection = { confidence_score: 3, student_question: "" };

assert.equal(api.mission.unit_id, "enzymes");
assert.equal(api.allRequiredAnswered(), true);
const perfect = api.calculateResult();
assert.equal(perfect.total, 13);
assert.equal(perfect.correct, 13);
assert.equal(perfect.attempt_total_exp, 460);
assert.ok(perfect.badges.includes("enzymes_flawless"));
assert.equal(perfect.question_exp, 0);
const validReflection = api.evaluateReflectionQuality({ student_question: "我不確定為什麼溫度太高時酵素作用會降低，能不能用資料再解釋？" });
assert.equal(validReflection.question_exp_candidate, 40);
assert.equal(validReflection.question_exp, 0, "frontend must wait for server reflection recalculation");

state.hints.q07 = true;
const hinted = api.calculateResult();
assert.ok(hinted.attempt_total_exp < 500);
assert.equal(hinted.badges.includes("enzymes_flawless"), false);
delete state.hints.q07;

assert.equal(api.evaluateReflectionQuality({ student_question: "" }).question_exp, 0);
assert.equal(api.evaluateReflectionQuality({ student_question: "老師好帥" }).question_exp, 0);
assert.equal(api.evaluateReflectionQuality({ student_question: "酵素如何促進生物體內反應" }).question_exp, 0);
assert.equal(api.evaluateReflectionQuality({ student_question: "我不確定為什麼溫度太高時酵素作用會降低，能不能用資料再解釋？" }).reflection_quality, "discussion_question");

state.answers.q01 = "promote_reaction";
assert.match(api.renderChoiceQuestion("q01"), /已選：促進生物體內反應/);
assert.match(api.renderClassifyQuestion("q03"), /已選：澱粉/);
assert.match(api.renderQuestionEvidence("q05"), /10 度[\s\S]*37 度[\s\S]*70 度/);
assert.match(api.renderQuestionEvidence("q07"), /pH &lt; 7[\s\S]*酸性[\s\S]*<svg[\s\S]*activity-curve/);
assert.doesNotMatch(appSource, /data-question-id="q09"|資料判讀任務卡|renderSequenceQuestion/);
assert.match(api.renderScan(), /owl-enzymes-prep-reminder\.webp/);
assert.doesNotMatch(api.renderLogin(), /<img[^>]+貓頭鷹/);
assert.match(appSource, /酵素作用的對象（稱為受質）/);
assert.equal((appSource.match(/受質/g) || []).length, 2);
assert.doesNotMatch(appSource, /酵素與受質配對|所有受質|酵素與受質|受質與環境條件/);

state.submitted_at = "2026-07-11T00:00:00.000Z";
assert.equal(api.isLockedScreen("checkpoint1"), true);
assert.equal(api.isLockedScreen("reflection"), true);
assert.equal(api.isLockedScreen("achievements"), false);

assert.equal(api.badges.length, 11);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 11);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 0);
api.badges.forEach((badge) => assert.match(badge.badge_image_path, /shared-assets\/badges\/enzymes\/badge-enzymes-/));
assert.match(api.assets.briefingSceneHook, /^assets\/bg-enzymes-briefing-azhe-wide\.webp$/);
assert.match(api.assets.ambientBackgroundHook, /shared-assets\/units\/enzymes/);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", api.assets.briefingSceneHook)), true);
assert.equal(fs.existsSync(path.resolve(__dirname, "..", api.assets.briefingSceneMobileHook)), true);
assert.equal(styleSource.includes("bg-nutrients"), false);
assert.equal(styleSource.includes("bg-cell-transport"), false);
assert.equal(styleSource.includes("bg-enzymes-entry-wide.png"), false);
assert.match(styleSource, /@media \(max-width: 560px\)/);

assert.match(appSource, /startAttempt/);
assert.match(appSource, /hintEvent/);
assert.match(appSource, /attempt_session_token/);
assert.match(appSource, /提交後會進行結算，本次作答不能再修改/);
assert.equal(api.VERSION, "20260811-enzymes-submitted-retry-ia-v1");
assert.equal(api.QUESTION_VERSION, "20260720-enzymes-user-review-v2");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "runtime cache must stay separate from canonical question version");
assert.match(appSource, /question_version: QUESTION_VERSION/);
assert.equal(appSource.includes("question_version: VERSION"), false);
assert.match(appSource, /screen\.dataset\.bioquestScreen = state\.screen/);
assert.match(appSource, /BioQuestCharacterLayout\?\.enhance\?\.\(\{ force: true \}\)/);

state.submitted_at = "";
state.backend_status = "local_guest";
state.student = { student_id: "guest", student_name: "老師測試帳號", class_name: "測試", seat_no: "00", is_guest: true, progress: {} };
assert.equal(api.submissionStatus(), "guest");
assert.match(api.renderResult(), /guest 測試：本次預估/);
state.backend_status = "pending_local";
state.student = { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01", progress: {} };
state.submitted_at = "2026-07-18T00:00:00.000Z";
assert.equal(api.submissionStatus(), "pending");
assert.match(api.renderResult(), /本次預估[\s\S]*待後台確認/);
state.backend_status = "submitted_verified";
assert.equal(api.submissionStatus(), "verified");

state.result = api.calculateResult();
state.screen = "result";
assert.match(api.renderResult(), /data-result-earned-badges="true"/);
assert.match(api.renderResult(), /badge-enzymes-enzymes_entry\.webp\?v=20260811-enzymes-submitted-retry-ia-v1/);
assert.match(api.renderResult(), /data-relogin-action="true"/);
state.screen = "achievements";
assert.equal(api.renderAchievements().includes("data-bq-unit-achievements"), false);
assert.match(api.renderAchievements(), /data-bq-achievements-overview-only="true"/);
assert.match(api.renderAchievements(), /data-relogin-action="true"/);
assert.doesNotMatch(api.renderAchievements(), /酵素研究徽章牆|徽章素材待補/);
state.screen = "rules";
assert.match(api.renderRules(), /data-relogin-action="true"/);

context.localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "old_enzymes_attempt", unit_id: "enzymes" }]));
api.resetForRelogin();
assert.equal(api.getState().screen, "login");
assert.equal(api.getState().student, null);
assert.equal(api.getState().attempt_id, "");
assert.equal(api.getState().submitted_at, null);
assert.equal(context.localStorage.getItem("bioquest_attempts_v1"), JSON.stringify([{ attempt_id: "old_enzymes_attempt", unit_id: "enzymes" }]), "reset must preserve attempt history");

const resetState = api.getState();
resetState.student = { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01", progress: {} };
api.questions.forEach((question) => { resetState.answers[question.id] = question.answer; });
resetState.answers.q03 = { amylase: "starch", protease: "protein", lipase: "lipid" };
resetState.answers.reflection = { confidence_score: 3, student_question: "" };
resetState.backend_status = "submitted_verified";
resetState.submitted_at = "2026-07-18T00:00:00.000Z";
resetState.result = perfect;
const attempt = api.buildAttempt();
const payload = api.buildBackendPayload(attempt);
assert.equal(payload.question_logs.length, 13);
payload.question_logs.forEach((log) => {
  assert.equal(log.student_id, "S70101");
  assert.equal(log.unit_id, "enzymes");
  assert.ok(log.question_type);
  assert.ok(log.answer_json);
  assert.ok(log.checkpoint_id);
  assert.ok(log.concept_id);
});

console.log("prototype-enzymes app.test.js: all assertions passed");
