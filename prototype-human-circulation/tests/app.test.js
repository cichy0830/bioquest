#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-human-circulation")
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
vm.runInNewContext(source, context, { filename: "prototype-human-circulation/app.js" });
const api = context.window.__human_circulationTest;

assert.equal(api.VERSION, "20260718-u18-u20-assets-v1");
assert.equal(api.QUESTION_VERSION, "20260718-human-circulation-ready-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "human_circulation");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `human_circulation_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "loops_back",
  [`${Q(2)}_sequence`]: ["right_ventricle", "lungs", "left_atrium", "left_ventricle", "body_tissues", "right_atrium"],
  [Q(3)]: "right_lung_left",
  [Q(4)]: "left_body_right",
  [Q(5)]: "oxygen_up_co2_down",
  [Q(6)]: "exchange_not_make",
  [Q(7)]: "pulmonary_exception",
  [Q(8)]: "lung_exchange",
  [Q(9)]: "blood_to_tissue",
  [Q(10)]: "tissue_to_blood",
  [Q(11)]: "capillary",
  [Q(12)]: "fluid_lymph_recovery",
  [Q(13)]: "direction_route_first",
  [Q(14)]: "systemic"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "circulation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("human_circulation_flawless"));
assert(score.earned_badges.includes("pulmonary_route_tracker"));
assert(score.earned_badges.includes("tissue_exchange_direction_judge"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "circulation_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認判斷體循環和肺循環時，應該先看心臟左右，還是先看血液要到肺部或全身？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, hintEventStatus: { [Q(2)]: "sent" }, reflection: { question: "我想確認肺動脈和肺靜脈為什麼不能只用含氧量來判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("human_circulation_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認判斷體循環和肺循環時，應該先看心臟左右，還是先看血液要到肺部或全身？", 40]
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
  reflection: { question: "我想確認肺動脈和肺靜脈為什麼不能只用含氧量來判斷？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "human_circulation");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(2)], answers[`${Q(2)}_sequence`]);
assert(!source.includes("arteries_veins_connect"));
assert(!source.includes("blood_components_carry"));
assert(api.questions.find((question) => question.id === Q(2)).steps.length === 6);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).analysis_group, "circulation_route_map");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "capillary_exchange_station");
assert(api.renderCheckpoint("checkpoint1").includes("上移"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderAchievements().includes("學生稱號角色"));
console.log("prototype-human-circulation app regression passed");
