#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-stimulus-response")
  : sourceRoot;
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const store = new Map();
const context = {
  console,
  window: null,
  document: { readyState: "loading", querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
  localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)) },
  URLSearchParams,
  fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  Date,
  Math,
  setTimeout,
  clearTimeout
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-stimulus-response/app.js" });
const api = context.window.__stimulus_responseTest;

assert.equal(api.VERSION, "20260720-stimulus-response-readiness-v1");
assert.equal(api.QUESTION_VERSION, "20260718-stimulus-response-ready-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "stimulus_response");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));
assert(!source.includes("function titleAndProgress"), "local title progress calculator must stay removed");
assert(!source.includes("titleAndProgress("), "achievements must not use localGain/result EXP to calculate title");

const Q = (n) => `stimulus_response_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "bell_sound",
  [Q(2)]: "pull_hand",
  [Q(3)]: { hot_cup: "stimulus", pull_hand: "response", bright_light: "stimulus", blink: "response" },
  [Q(4)]: "movement_is_response",
  [Q(5)]: "eye_receptor",
  [Q(6)]: "leg_muscle",
  [`${Q(7)}_sequence`]: ["stimulus_appears", "receptor_receives", "signal_coordination", "effector_acts", "response_happens"],
  [Q(8)]: { food_smell: "stimulus", nose_receptor: "receptor", neck_muscle: "effector", turn_head: "response" },
  [Q(9)]: "not_always_conscious",
  [Q(10)]: "reaction_time",
  [Q(11)]: "second_shorter",
  [Q(12)]: "practice_possible",
  [Q(13)]: "controlled_repeated",
  [Q(14)]: "single_trial_caution"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "circulation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("stimulus_response_flawless"));
assert(score.earned_badges.includes("response_pathway_sequencer"));
assert(score.earned_badges.includes("reaction_time_reader"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "stimulus_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認同一人連續測五次變快時，怎麼判斷是練習造成，還是疲勞造成？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(7)]: true }, hintEventStatus: { [Q(7)]: "sent" }, reflection: { question: "我想確認受器和動器如何在同一個情境中分開判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("stimulus_response_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認同一人連續測五次變快時，怎麼判斷是練習造成，還是疲勞造成？", 40]
]) {
  api.setState({ reflection: { question: text } });
  assert.equal(api.evaluateReflection().question_exp, exp, text);
}

api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  hints: { [Q(2)]: true },
  reflection: { question: "我想確認受器和動器如何在同一個情境中分開判斷？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "stimulus_response");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(7)], answers[`${Q(7)}_sequence`]);
assert(!source.includes("arteries_veins_connect"));
assert(!source.includes("blood_components_carry"));
assert(!source.includes("神經元"));
assert(!source.includes("中樞"));
assert(api.questions.find((question) => question.id === Q(7)).steps.length === 5);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(3)).analysis_group, "stimulus_response_identification");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "reaction_time_reasoning");
assert(api.renderCheckpoint("checkpoint2").includes("上移"));
assert.equal(api.renderQuestionEvidence(Q(12)), "", "q12 evidence card should be removed");
assert(!api.renderQuestionEvidence(Q(5)).includes("受器負責接收刺激"), "q05 evidence must not give direct role definitions");
assert(!api.renderQuestionEvidence(Q(9)).includes("不一定都先經過"), "q09 evidence must not leak the answer direction");
assert(!api.renderQuestionEvidence(Q(10)).includes("反應時間"), "q10 evidence must avoid naming the answer concept");
assert.equal(api.assets.briefingSceneHook, ["assets", "stimulus-response-briefing-azhe-wide.webp"].join("/"));
assert.equal(api.assets.ambientBackgroundHook, ["assets", "stimulus-response-entry-wide.webp"].join("/"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("正式認列 / 累積增量 0"));
assert(api.renderAchievements().includes('data-bq-unit-achievements="stimulus_response"'));
assert(api.renderAchievements().includes("本單元 15 枚徽章"));
assert(!api.renderAchievements().includes("學生稱號角色"));
assert(!api.renderAchievements().includes("全冊稱號"));
console.log("prototype-stimulus-response app regression passed");
