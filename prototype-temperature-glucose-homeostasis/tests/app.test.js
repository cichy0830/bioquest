#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-temperature-glucose-homeostasis")
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
vm.runInNewContext(source, context, { filename: "prototype-temperature-glucose-homeostasis/app.js" });
const api = context.window.__temperature_glucose_homeostasisTest;

assert.equal(api.VERSION, "20260728-temperature-glucose-homeostasis-relogin-v1");
assert.equal(api.QUESTION_VERSION, "20260718-temperature-glucose-homeostasis-v1");
assert.equal(api.mission.unit_id, "temperature_glucose_homeostasis");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert(api.badges.every((badge) => badge.image_status === "controlled_pending"));
assert(api.badges.every((badge) => badge.badge_image_path === ""));
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u26-temperature-glucose-homeostasis-review"));
assert(fs.existsSync(path.join(root, "assets", "u26-f-u26-04-q07-body-temperature-chart-base.svg")));
assert(fs.existsSync(path.join(root, "assets", "u26-f-u26-04-q12-glucose-insulin-chart-base.svg")));
assert(fs.existsSync(path.join(root, "assets", "u26-f-u26-04-chart-data-overlay-spec.json")));
assert(fs.existsSync(path.join(root, "assets", "temperature-glucose-homeostasis-briefing-azhe-wide.webp")));
assert(fs.existsSync(path.join(root, "assets", "temperature-glucose-homeostasis-briefing-azhe-mobile.webp")));
const staleBadgeText = ["徽章", "素材", "待接"].join("");
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes(staleBadgeText));

const Q = (n) => `temperature_glucose_homeostasis_q${String(n).padStart(2, "0")}`;
const answers = {
  [`${Q(8)}_sequence`]: ["body_temperature_high", "activate_heat_loss_response", "sweating_or_vasodilation_increases_heat_loss", "temperature_returns_toward_range"],
  [Q(1)]: "homeostasis_is_range_not_fixed",
  [Q(2)]: "negative_feedback_opposite_adjustment",
  [Q(3)]: { human: "endotherm", sparrow: "endotherm", lizard: "ectotherm", frog: "ectotherm" },
  [Q(4)]: "hot_sweating_vasodilation",
  [Q(5)]: "cold_shivering_vasoconstriction",
  [Q(6)]: "sweating_cools_and_loses_water",
  [Q(7)]: "body_temp_returns_to_range_data",
  [Q(9)]: "blood_glucose_returns_to_range",
  [Q(10)]: "high_glucose_insulin_lowers",
  [Q(11)]: "low_glucose_glucagon_raises",
  [Q(12)]: "insulin_data_returns_glucose_range",
  [Q(13)]: { body_temperature_high: "increase_heat_loss", body_temperature_low: "conserve_or_make_heat", blood_glucose_high: "lower_glucose", blood_glucose_low: "raise_glucose" },
  [Q(14)]: "glucose_temperature_belongs_homeostasis"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "temperature_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("temperature_glucose_homeostasis_flawless"));
assert(score.earned_badges.includes("temperature_feedback_sequence_tracker"));
assert(score.earned_badges.includes("blood_glucose_hormone_direction_reader"));
assert(score.earned_badges.includes("temperature_glucose_unit_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "temperature_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認血糖偏高和偏低時的調節方向怎麼判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("temperature_glucose_homeostasis_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？", 40]
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
  reflection: { question: "我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "temperature_glucose_homeostasis");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(8)], answers[`${Q(8)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(3)], answers[Q(3)]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(8)).analysis_group, "temperature_responses");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).analysis_group, "blood_glucose_feedback");
assert(api.renderCheckpoint("checkpoint2").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
assert.equal(api.chartEvidence[Q(7)].asset, "assets/u26-f-u26-04-q07-body-temperature-chart-base.svg");
assert.equal(api.chartEvidence[Q(12)].asset, "assets/u26-f-u26-04-q12-glucose-insulin-chart-base.svg");
const q07Evidence = api.renderQuestionEvidence(Q(7));
const q12Evidence = api.renderQuestionEvidence(Q(12));
assert(q07Evidence.includes('data-chart-id="q07-body-temperature"'));
assert(q07Evidence.includes("運動後休息期間的體溫紀錄"));
assert(q07Evidence.includes("跑步後時間（分鐘）"));
assert(q07Evidence.includes("體溫（°C，簡化示意）"));
assert(q07Evidence.includes("跑步結束，開始休息"));
assert(q07Evidence.includes(`?v=${api.VERSION}`));
assert(!q07Evidence.includes("休息後逐漸往平常範圍回復"));
assert(!q07Evidence.includes("體溫逐漸回復"));
assert(q12Evidence.includes('data-chart-id="q12-glucose-insulin"'));
assert(q12Evidence.includes("飯後血糖與胰島素相對量紀錄"));
assert(q12Evidence.includes("血糖相對指數"));
assert(q12Evidence.includes("胰島素相對量"));
assert(q12Evidence.includes(`?v=${api.VERSION}`));
assert(!q12Evidence.includes("飯後血糖可能先升高"));
assert(!q12Evidence.includes("血糖先升後降"));
assert(api.questions.find((question) => question.id === Q(7)).prompt.includes("曲線圖"));
assert(api.questions.find((question) => question.id === Q(12)).prompt.includes("曲線圖"));
assert.equal(api.assets.briefingSceneHook, "assets/temperature-glucose-homeostasis-briefing-azhe-wide.webp");
assert.equal(api.assets.briefingSceneMobileHook, "assets/temperature-glucose-homeostasis-briefing-azhe-mobile.webp");
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes(`assets/temperature-glucose-homeostasis-briefing-azhe-wide.webp?v=${api.VERSION}`));
assert(api.renderBrief().includes(`assets/temperature-glucose-homeostasis-briefing-azhe-mobile.webp?v=${api.VERSION}`));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(api.renderBrief().includes("你好，測試學生｜701 99｜S99999"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderReview().includes("feedback-columns"));
assert(!api.renderReview().includes("mentor-card"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("本單元 17 枚徽章"));
assert(!api.renderResult().includes("<img"));
assert(api.renderResult().includes("圖像待核准"));
assert(!api.renderResult().includes(staleBadgeText));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="temperature_glucose_homeostasis"'));
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderAchievements().includes("學生稱號角色"));
api.setState({
  student: {
    student_id: "S99999",
    class_name: "701",
    seat_no: "99",
    student_name: "測試學生",
    total_exp: 8200,
    progress: {
      total_exp: 8200,
      current_title_id: "systems_investigator",
      title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-male.webp",
      unit_badge_summary_json: "[]"
    }
  },
  attempt_id: "server",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  screen: "result",
  result: api.scoreAttempt()
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
assert(api.renderRules().includes("重新登入／再挑戰"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.loadVerifiedSnapshot().student_id, "S99999");
assert.equal(api.loadVerifiedSnapshot().total_exp, 8200);
console.log("prototype-temperature-glucose-homeostasis app regression passed");
