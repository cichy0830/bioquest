#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-cardiovascular-components")
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
vm.runInNewContext(source, context, { filename: "prototype-cardiovascular-components/app.js" });
const api = context.window.__cardiovascular_componentsTest;

assert.equal(api.VERSION, "20261018-cardiovascular-components-spec-sync-v1");
assert.equal(api.QUESTION_VERSION, "20260718-cardiovascular-components-ready-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "cardiovascular_components");
assert.equal(api.questions.length, 15);
assert(!api.questions.some((question) => question.id.includes("q16")), "q16 must remain only a historical alias outside runtime");
assert.equal(api.badges.length, 14);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 2);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 12);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `cardiovascular_components_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "heart_vessels_blood",
  [Q(2)]: "push_blood_flow",
  [Q(3)]: { atria: "receive_blood", ventricles: "push_blood_out", valves: "one_way_flow" },
  [Q(4)]: "atria_receive_ventricles_push",
  [Q(5)]: "valves_reduce_backflow",
  [Q(6)]: { artery: "away_from_heart", vein: "back_to_heart", capillary: "exchange_near_tissue" },
  [Q(7)]: "direction_not_oxygen_only",
  [Q(8)]: "artery",
  [Q(9)]: "capillary",
  [Q(10)]: { plasma: "liquid_transport", red_blood_cell: "oxygen_transport", white_blood_cell: "defense", platelet: "clotting" },
  [Q(11)]: "red_blood_cell",
  [Q(12)]: { defense_case: "white_blood_cell", wound_clotting: "platelet", liquid_environment: "plasma" },
  [Q(13)]: "heartbeat_vessel_pulse",
  [Q(14)]: "pressure_on_vessel_wall",
  [`${Q(15)}_sequence`]: ["heart_contracts", "blood_enters_vessels", "blood_components_carry", "capillary_exchange"]
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cardio_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 15);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("cardiovascular_components_flawless"));
assert(score.earned_badges.includes("cardiovascular_overview_mapper"));
assert(score.earned_badges.includes("blood_component_function_matcher"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cardio_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認為什麼動脈和靜脈要用離開或回到心臟判斷，而不是只看含氧量？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(15)]: true }, hintEventStatus: { [Q(15)]: "sent" }, reflection: { question: "我想確認心臟、血管與血液如何一起完成物質運送？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("cardiovascular_components_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["心臟", 0],
  ["我想確認為什麼動脈和靜脈要用離開或回到心臟判斷，而不是只看含氧量？", 40]
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
  hints: { [Q(15)]: true },
  reflection: { question: "我想確認心臟、血管與血液如何一起完成物質運送？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "cardiovascular_components");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 15);
assert.deepEqual(payload.raw_answers[Q(15)], answers[`${Q(15)}_sequence`]);
for (let index = 1; index <= 15; index += 1) {
  assert(Object.hasOwn(payload.raw_answers, `q${String(index).padStart(2, "0")}`), `raw_answers should include q${String(index).padStart(2, "0")}`);
}
assert.equal(payload.raw_answers.q01, answers[Q(1)]);
assert.deepEqual(payload.raw_answers.q03, answers[Q(3)]);
assert.deepEqual(payload.raw_answers.q15, answers[`${Q(15)}_sequence`]);
assert.deepEqual(payload.raw_answers.q15_sequence, answers[`${Q(15)}_sequence`]);
assert(!source.includes("arteries_veins_connect"));
assert(api.questions.find((question) => question.id === Q(15)).steps.length === 4);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(15)).analysis_group, "pulse_pressure_integration");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_type, "mapping");
assert.equal(api.renderQuestionEvidence(Q(6)), "");
assert.equal(api.renderQuestionEvidence(Q(8)), "");
assert.equal(api.renderQuestionEvidence(Q(13)), "");
assert(api.renderQuestionEvidence(Q(3)).includes("不需背完整循環路徑"));
assert(api.renderQuestionEvidence(Q(15)).includes("不要求背完整體循環或肺循環路徑"));
assert(api.renderCheckpoint("checkpoint3").includes("上移"));
// 2026-10-18 規格對齊：簡報角色引入、準備頁不洩答、q08／q13／q14 誘答與 q14 提示、q15 初始順序防撞
assert(/阿澤老師/.test(api.renderBrief()) && /貓頭鷹助理/.test(api.renderBrief()), "brief should introduce both roles");
const scanHtml = api.renderScan();
assert(scanHtml.includes("五個判斷線索"));
for (const leak of ["心房多接收", "心室多推出", "動脈通常離心", "靜脈通常回心", "微血管適合物質交換", "血液對血管壁的壓力", "共同完成物質運送"]) assert(!scanHtml.includes(leak), `prep page should not leak: ${leak}`);
const qById = Object.fromEntries(api.questions.map((question) => [question.id, question]));
assert.equal(qById[Q(8)].prompt, "下列哪個判斷最合理？");
assert.deepEqual(Array.from(qById[Q(8)].options.map((option) => option.id)), ["artery", "vein", "capillary", "same_vessel"]);
assert.equal(qById[Q(8)].answer, "artery");
assert(!qById[Q(8)].options.some((option) => /淋巴管|膽管/.test(option.text)));
assert(!qById[Q(13)].options.some((option) => /肺泡|胃消化/.test(option.text)));
assert.equal(qById[Q(13)].answer, "heartbeat_vessel_pulse");
assert(qById[Q(13)].options.some((option) => option.text === "脈搏是手腕肌肉規律收縮"));
assert.equal(qById[Q(14)].answer, "pressure_on_vessel_wall");
assert(!qById[Q(14)].hint.includes("壓」這個字"));
assert(qById[Q(14)].options.some((option) => option.text === "心臟每分鐘跳動的次數"));
assert(!qById[Q(14)].options.some((option) => /糖分的味道|白血球的數量/.test(option.text)));
api.setState({ attempt_id: "u18-forced-collision", optionOrders: { [Q(15)]: [...qById[Q(15)].answer] } });
assert.notDeepEqual(Array.from(api.orderedOptions(qById[Q(15)]).map((item) => item.id)), Array.from(qById[Q(15)].answer), "q15 stored collision should be guarded");
for (let n = 0; n < 200; n += 1) {
  api.setState({ attempt_id: `u18-seed-${n}` });
  assert.notDeepEqual(Array.from(api.orderedOptions(qById[Q(15)]).map((item) => item.id)), Array.from(qById[Q(15)].answer), `q15 initial order must not equal answer (seed ${n})`);
}
assert.equal(api.assets.briefingSceneHook, "assets/cardiovascular-components-briefing-azhe-wide.webp");
assert.equal(api.assets.ambientBackgroundHook, "assets/cardiovascular-components-entry-wide.webp");
assert.equal(api.assets.owlPrep, "assets/owl-cardiovascular-components-prep-report.webp");
assert(!api.renderReview().includes("mentor-card"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "guest_result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" }, result: api.scoreAttempt(), submitted: true });
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("guest 測試：本次預估"));
assert(api.renderResult().includes('data-relogin="true"'));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("本單元 14 枚徽章"));
assert(!api.renderResult().includes("cardiovascular_overview_mapper"));
assert(!api.renderAchievements().includes("title-card"));
assert(api.renderAchievements().includes('data-bq-achievements-overview-only="true"'));
assert(api.renderAchievements().includes('data-relogin="true"'));
assert(!api.renderAchievements().includes("data-bq-unit-achievements"));
assert(!api.renderAchievements().includes("本單元 14 枚徽章"));
assert(api.renderRules().includes('data-relogin="true"'));
assert.equal(api.canUseNav("login"), true);

const localCandidate = {
  ...api.scoreAttempt(),
  direct_exp: 999,
  reflection_exp: 888,
  attempt_exp: 777,
  exp_delta: 666,
  unit_credited_exp: 500,
  earned_badges: ["local_candidate_badge"]
};
let serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 15,
    total_questions: 15,
    accuracy: 1,
    hint_used_count: 0,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    credited_delta: 44,
    badges: ["server_badge_from_badges"]
  },
  student_progress: {
    student_id: "S70102",
    total_exp: 4320,
    current_title_id: "micro_explorer",
    unit_badge_summary_json: JSON.stringify([{ unit_id: "cardiovascular_components", earned_count: 2 }])
  }
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["server_badge_from_badges"]);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.equal(serverMerged.exp_delta, 44);
assert(!serverMerged.earned_badges.includes("local_candidate_badge"));

serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["server_badge_from_json"])
  }
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["server_badge_from_json"]);

serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    direct_exp: 111,
    reflection_exp: 22,
    attempt_exp: 333
  },
  attempt_result: {
    newly_credited_badges_json: JSON.stringify(["server_badge_from_attempt_result"])
  }
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["server_badge_from_attempt_result"]);

serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    direct_exp: 111,
    reflection_exp: 22,
    attempt_exp: 333
  },
  attempt_result_json: JSON.stringify({
    earned_badges_json: JSON.stringify(["server_badge_from_attempt_result_json"])
  })
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["server_badge_from_attempt_result_json"]);

serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333
  }
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), []);

serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "pending_review",
  attempt: {
    verification_status: "pending_review",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333
  }
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["local_candidate_badge"]);

store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_1", unit_id: "cardiovascular_components" }]));
api.setState({
  student: {
    student_id: "S70102",
    class_name: "701",
    seat_no: "02",
    student_name: "正式學生",
    progress: {
      total_exp: 4320,
      current_title_id: "micro_explorer",
      unit_badge_summary_json: JSON.stringify([{ unit_id: "cell_basic_unit", earned_count: 6 }])
    }
  },
  attempt_id: "submitted_attempt",
  attempt_session_token: "submitted_token",
  submitted: true,
  screen: "result",
  answers,
  result: api.scoreAttempt()
});
assert.equal(api.canUseNav("login"), true);
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(JSON.parse(store.get("bioquest_attempts_v1")).length, 1);
const snapshot = api.loadVerifiedSnapshot();
assert.equal(snapshot.student_id, "S70102");
assert.equal(snapshot.progress.total_exp, 4320);
assert(snapshot.progress.unit_badge_summary_json.includes("cell_basic_unit"));
console.log("prototype-cardiovascular-components app regression passed");
