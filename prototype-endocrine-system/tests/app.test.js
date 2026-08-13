#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-endocrine-system")
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
vm.runInNewContext(source, context, { filename: "prototype-endocrine-system/app.js" });
const api = context.window.__endocrine_systemTest;

assert.equal(api.VERSION, "20260813-endocrine-system-mapping-v1");
assert.equal(api.QUESTION_VERSION, "20260718-endocrine-system-ready-v1");
assert.equal(api.mission.unit_id, "endocrine_system");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert(!/question_version:\s*VERSION/.test(source));
assert(!/question_version\s*!==\s*VERSION/.test(source));
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u22-endocrine-system"));
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `endocrine_system_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "endocrine_gland_secretes_hormones",
  [Q(2)]: "hormone_travels_in_blood",
  [Q(3)]: "hormone_targets_specific_organs",
  [`${Q(4)}_sequence`]: ["gland_secretes", "hormone_enters_blood", "blood_transports", "target_reached", "target_responds"],
  [Q(5)]: { pituitary: "growth_regulation", thyroid: "metabolism_growth", pancreatic_islets: "blood_glucose", adrenal: "emergency_response" },
  [Q(6)]: "pituitary_growth_regulation",
  [Q(7)]: "thyroid_metabolism_growth",
  [Q(8)]: "gonads_reproduction_development",
  [Q(9)]: "insulin_lowers_blood_glucose",
  [Q(10)]: "glucagon_raises_blood_glucose",
  [Q(11)]: "insulin_data_lowers_glucose",
  [Q(12)]: "hormones_need_balance",
  [Q(13)]: "insulin_glucagon_opposite_directions",
  [Q(14)]: "nerve_endocrine_different_coordination"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "endocrine_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("endocrine_system_flawless"));
assert(score.earned_badges.includes("hormone_blood_target_tracker"));
assert(score.earned_badges.includes("insulin_glucagon_balancer"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "endocrine_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認胰島素和升糖素為什麼作用方向不同，卻都和血糖調節有關？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(4)]: true }, hintEventStatus: { [Q(4)]: "sent" }, reflection: { question: "我想確認激素為什麼經血液運送後只讓目標器官產生反應？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("endocrine_system_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認胰島素和升糖素為什麼作用方向不同，卻都和血糖調節有關？", 40]
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
  reflection: { question: "我想確認激素為什麼經血液運送後只讓目標器官產生反應？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "endocrine_system");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(4)], answers[`${Q(4)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[Q(index)], `${shortId} should mirror full question id`);
}
assert.deepEqual(payload.raw_answers.q04_sequence, answers[`${Q(4)}_sequence`]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(3)).analysis_group, "hormone_basics");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "blood_glucose_balance");
api.setState({
  student: { student_id: "guest", is_guest: true },
  attempt_id: "guard",
  attempt_session_token: "guest",
  question_version: api.QUESTION_VERSION,
  optionOrders: { [Q(4)]: [...answers[`${Q(4)}_sequence`]] }
});
const guardedQ04 = api.orderedOptions(api.questions.find((question) => question.id === Q(4))).map((item) => item.id);
assert.notDeepEqual(guardedQ04, answers[`${Q(4)}_sequence`], "q04 initial order must not equal canonical sequence");
assert.deepEqual(api.orderedOptions(api.questions.find((question) => question.id === Q(4))).map((item) => item.id), guardedQ04, "q04 guarded order should remain stable");
assert(api.renderCheckpoint("checkpoint1").includes("上移"));
assert.equal(api.assets.briefingSceneHook, `assets/endocrine-system-briefing-azhe-wide.webp?v=${api.VERSION}`);
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("bq-brief-scene-image"));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("<img"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="endocrine_system"'));
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderAchievements().includes("學生稱號角色"));
assert(api.renderQuestionEvidence(Q(1)).includes("訊息來源閱讀"));
assert(!api.renderQuestionEvidence(Q(1)).includes("分泌激素的腺體、運送方式"));
assert(api.renderQuestionEvidence(Q(5)).includes("腺體功能閱讀"));
assert(!api.renderQuestionEvidence(Q(5)).includes("生長與調節、代謝、血糖、緊急狀態，以及生殖與青春期發育"));
assert(api.renderQuestionEvidence(Q(12)).includes("調節量閱讀"));
assert(!api.renderQuestionEvidence(Q(12)).includes("調節重點不是越多越好"));
assert(api.renderQuestionEvidence(Q(14)).includes("協調方式閱讀"));
assert(!api.renderQuestionEvidence(Q(14)).includes("神經訊息通常較快且路徑明確"));
const localCandidate = {
  ...api.scoreAttempt(),
  direct_exp: 999,
  reflection_exp: 888,
  attempt_exp: 777,
  unit_credited_exp: 777,
  exp_delta: 777,
  earned_badges: ["local_candidate_badge"]
};
const serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["endocrine_system_entry"])
  },
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 14,
    total_questions: 14,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["endocrine_system_entry", "endocrine_system_flawless"])
  }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.equal(JSON.stringify(serverMerged.earned_badges), JSON.stringify(["endocrine_system_entry"]));
assert(!serverMerged.earned_badges.includes("local_candidate_badge"));
const serverNoBadges = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: { verification_status: "server_verified", concept_exp: 111, question_exp: 22, attempt_total_exp: 333 }
}, localCandidate);
assert.equal(JSON.stringify(serverNoBadges.earned_badges), JSON.stringify([]));
const pendingMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "pending_backend",
  verified_attempt: { verification_status: "pending_backend" }
}, localCandidate);
assert.equal(JSON.stringify(pendingMerged.earned_badges), JSON.stringify(["local_candidate_badge"]));
api.setState({
  screen: "result",
  student: {
    student_id: "S99022",
    class_name: "722",
    seat_no: "22",
    student_name: "內分泌測試生",
    progress: {
      total_exp: 10400,
      current_title_id: "systems_investigator",
      title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-male.webp",
      completed_unit_count: 22,
      unit_badge_summary_json: "[]"
    }
  },
  attempt_id: "submitted_attempt",
  attempt_session_token: "submitted_token",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  completedScreens: ["login", "brief", "result", "achievements", "rules"],
  result: { ...api.scoreAttempt(), verification_status: "server_verified" }
});
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_attempt", unit_id: "endocrine_system" }]));
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
assert(api.renderRules().includes("重新登入／再挑戰"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadAttempts().length, 1);
assert.equal(api.loadVerifiedSnapshot().student_id, "S99022");
assert.equal(api.loadVerifiedSnapshot().total_exp, 10400);
console.log("prototype-endocrine-system app regression passed");
