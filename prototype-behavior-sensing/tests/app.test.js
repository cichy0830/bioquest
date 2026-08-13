#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-behavior-sensing")
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
vm.runInNewContext(source, context, { filename: "prototype-behavior-sensing/app.js" });
const api = context.window.__behavior_sensingTest;

assert.equal(api.VERSION, "20260813-behavior-sensing-mapping-v1");
assert.equal(api.QUESTION_VERSION, "20260718-behavior-sensing-v1");
assert.equal(api.mission.unit_id, "behavior_sensing");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u22-behavior-sensing"));
assert(!/question_version:\s*VERSION/.test(source), "runtime cache key must not be sent as canonical question_version");
assert(!/question_version\s*!==\s*VERSION/.test(source), "server gate must compare against QUESTION_VERSION");
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `behavior_sensing_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "organisms_respond_to_stimuli",
  [Q(2)]: "parental_behavior_reproduction",
  [Q(3)]: { butterfly_nectar: "feeding", rabbit_hide_sound: "avoid_predator", peacock_display: "courtship", bird_feed_young: "parental_care" },
  [Q(4)]: "behavior_supports_survival_reproduction",
  [Q(5)]: "taxis_whole_body_moves",
  [Q(6)]: "taxis_not_plant_bending",
  [Q(7)]: "phototropism_growth_direction",
  [Q(8)]: { bug_to_dark: "taxis", stem_bends_to_window: "tropism", root_grows_down: "tropism", unicell_away_strong_light: "taxis" },
  [Q(9)]: "touch_nastic_response",
  [Q(10)]: "sleep_movement_day_night",
  [Q(11)]: "plants_respond_without_animal_nerves",
  [Q(12)]: "light_affects_growth_direction",
  [Q(13)]: "reversible_touch_response",
  [Q(14)]: "touch_response_belongs_behavior_sensing"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "behavior_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("behavior_sensing_flawless"));
assert(score.earned_badges.includes("animal_behavior_function_mapper"));
assert(score.earned_badges.includes("taxis_tropism_classifier"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "behavior_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認含羞草閉合和豆苗向光彎長都算植物反應，為什麼一個不是向性？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(8)]: true }, hintEventStatus: { [Q(8)]: "sent" }, reflection: { question: "我想確認趨性和向性要怎麼從整體移動和生長方向判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("behavior_sensing_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認含羞草碰觸後閉合和植物向光彎長的差別是什麼？", 40]
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
  reflection: { question: "我想確認趨性和向性要怎麼從整體移動和生長方向判斷？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "behavior_sensing");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(3)], answers[Q(3)]);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[Q(index)], `${shortId} should mirror full question id`);
}
assert.deepEqual(payload.raw_answers.q03, answers[Q(3)]);
assert.deepEqual(payload.raw_answers.q08, answers[Q(8)]);
assert.equal(payload.raw_answers.q08_sequence, undefined);
const q3Log = payload.question_logs.find((log) => log.question_id === Q(3));
assert.equal(q3Log.analysis_group, "animal_behavior_functions");
assert.equal(q3Log.question_type, "mapping");
assert.equal(q3Log.is_correct, true);
assert.equal(q3Log.hint_used, false);
assert.equal(q3Log.corrected_after_hint, false);
assert.equal(q3Log.exp_type, "concept");
assert(q3Log.exp_awarded > 0);
assert.equal(q3Log.concept_id, "animal_behavior_function");
assert.equal(q3Log.checkpoint_id, "behavior_sensing_cp1_response_and_animal_behavior");
assert.equal(q3Log.teacher_group_id, "animal_behavior_functions");
assert.equal(q3Log.verification_status, "client_candidate");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "taxis_vs_tropism");
assert.equal(payload.question_logs.every((log) => Object.prototype.hasOwnProperty.call(log, "answer_json")), true);
assert(api.renderQuestionEvidence(Q(5)).includes("方向反應觀察卡"));
assert(!api.renderQuestionEvidence(Q(5)).includes("趨性看整個生物體移動；向性看植物部位因生長改變方向"));
assert(api.renderCheckpoint("checkpoint2").includes("方向反應情境判讀"));
assert(!api.renderCheckpoint("checkpoint2").includes("用整體移動或植物生長方向改變，分辨趨性與向性"));
assert(api.renderQuestionEvidence(Q(14)).includes("單元範圍判斷卡"));
assert(!api.renderQuestionEvidence(Q(14)).includes("激素、血糖、肺泡與吸氣呼氣"));
assert(api.renderCheckpoint("checkpoint2").includes("mapping-list"));
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
    newly_credited_badges_json: JSON.stringify(["behavior_sensing_entry"])
  },
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 14,
    total_questions: 14,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["behavior_sensing_entry", "behavior_sensing_flawless"])
  }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.equal(JSON.stringify(serverMerged.earned_badges), JSON.stringify(["behavior_sensing_entry"]));
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
assert.equal(api.assets.briefingSceneHook, `assets/behavior-sensing-briefing-azhe-wide.webp?v=${api.VERSION}`);
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("bq-brief-scene-image"));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("<img"));
assert(api.renderReview().includes("data-feedback-state"));
assert(!api.renderReview().includes("mentor-card"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="behavior_sensing"'));
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderAchievements().includes("學生稱號角色"));

store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_1", unit_id: "behavior_sensing" }]));
api.setState({
  screen: "result",
  student: {
    student_id: "S23023",
    class_name: "701",
    seat_no: "23",
    student_name: "正式學生",
    progress: {
      total_exp: 10600,
      completed_unit_count: 22,
      current_title_id: "systems_investigator",
      current_title: "系統調查員",
      title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-male.webp",
      unit_badge_summary_json: JSON.stringify([{ unit_id: "life_world", earned_count: 3, total_count: 8, earned_badges: [] }])
    }
  },
  attempt_id: "submitted_1",
  attempt_session_token: "token_1",
  question_version: api.QUESTION_VERSION,
  answers,
  reflection: { question: "我想確認含羞草碰觸後閉合和豆苗向光彎長的差別是什麼？" },
  result: { ...api.scoreAttempt(), verification_status: "server_verified", earned_badges: ["behavior_sensing_entry", "behavior_sensing_flawless"] },
  submitted: true,
  completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"]
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
assert(api.renderRules().includes("重新登入／再挑戰"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().submitted, false);
assert.equal(api.state().attempt_id, "");
assert.equal(api.loadAttempts().length, 1);
assert.equal(api.loadVerifiedSnapshot().student_id, "S23023");
assert.equal(api.loadVerifiedSnapshot().progress.completed_unit_count, 22);
assert.equal(JSON.parse(api.loadVerifiedSnapshot().progress.unit_badge_summary_json)[0].unit_id, "life_world");
console.log("prototype-behavior-sensing app regression passed");
