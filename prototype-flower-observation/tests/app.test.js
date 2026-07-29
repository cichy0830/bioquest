#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-flower-observation")
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
vm.runInNewContext(source, context, { filename: "prototype-flower-observation/app.js" });
const api = context.window.__flower_observationTest;

assert.equal(api.VERSION, "20260729-flower-observation-build-v1");
assert.equal(api.QUESTION_VERSION, "20260725-flower-observation-v1.1");
assert.equal(api.mission.unit_id, "flower_observation");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 16);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 16);
assert(api.badges.every((badge) => badge.badge_image_path === ""), "U31 badges should stay controlled-pending with empty image paths");
assert.equal(api.badges.find((badge) => badge.id === "flower_observation_flawless").image_status, "pending");
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("flower-observation-review"));
assert(fs.existsSync(path.join(root, "assets/flower-observation-q04-flower-structure-base.webp")));
assert(fs.existsSync(path.join(root, "assets/flower-observation-q04-flower-structure-base-1440w.webp")));
assert(fs.existsSync(path.join(root, "assets/flower-observation-q04-flower-structure-base-960w.webp")));
assert(fs.existsSync(path.join(root, "assets/flower-observation-q04-flower-structure-base-390w.webp")));

const Q = (n) => `flower_observation_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "safe_flower_observation",
  [Q(2)]: "sepal_outer_protection",
  [Q(3)]: "petal_attraction_not_seed",
  [Q(4)]: { anther_target: "anther", filament_target: "filament", stigma_target: "stigma", ovary_target: "ovary" },
  [Q(5)]: { anther: "produces_pollen", stigma: "receives_pollen", ovary: "contains_ovules_can_become_fruit", petal: "may_attract_pollinators" },
  [Q(6)]: "stamen_anther_filament_pollen",
  [Q(7)]: "pistil_stigma_style_ovary_ovule",
  [Q(8)]: "pollination_not_fertilization",
  [`${Q(9)}_sequence`]: ["anther_produces_pollen", "pollen_reaches_stigma", "sperm_cell_joins_egg_in_ovule", "ovary_and_ovule_develop_into_fruit_and_seed"],
  [Q(10)]: "ovary_fruit_ovule_seed",
  [Q(11)]: "flower_form_pollination_evidence",
  [Q(12)]: "flower_evidence_then_function_inference",
  [Q(13)]: { egg_shell_albumen_yolk_air_cell: "u30_egg_observation", anther_stigma_ovary_ovule: "u31_flower_observation", chromosome_gene_trait: "u32_genetics_chromosome_gene", sperm_egg_zygote: "u29_sexual_reproduction" },
  [Q(14)]: "flower_observation_belongs_u31"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "flower_observation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
const q09 = api.questions.find((question) => question.id === Q(9));
assert.notDeepEqual(api.avoidCanonicalSequenceCollision(q09, [...q09.answer]), q09.answer, "q09 collision guard should not leave canonical order");
for (const attemptId of ["seed-alpha", "seed-beta", "seed-gamma", "seed-delta"]) {
  api.setState({ attempt_id: attemptId });
  const firstOrder = api.orderedOptions(q09).map((item) => item.id);
  const secondOrder = api.orderedOptions(q09).map((item) => item.id);
  assert.deepEqual(firstOrder, secondOrder, `q09 order should be stable for ${attemptId}`);
  assert.notDeepEqual(firstOrder, q09.answer, `q09 should not initialize as canonical answer for ${attemptId}`);
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "flower_observation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("flower_observation_entry"));
assert(score.earned_badges.includes("flower_observation_flawless"));
assert(score.earned_badges.includes("flower_parts_labeler"));
assert(score.earned_badges.includes("flower_process_sequence_tracker"));
assert(score.earned_badges.includes("u29_u30_u31_u32_flower_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "flower_observation_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認授粉和受精的差別，觀察花時該看哪些花部線索？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("flower_observation_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認授粉和受精的差別，觀察花時該看哪些花部線索？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("flower_observation_flawless"));
assert(score.earned_badges.includes("flower_observation_misconception_reviser"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["花的觀察", 0],
  ["我想確認授粉和受精的差別，觀察花時該看哪些花部線索？", 40]
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
  reflection: { question: "我想確認授粉和受精的差別，觀察花時該看哪些花部線索？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "flower_observation");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(4)], answers[Q(4)]);
assert.deepEqual(payload.raw_answers[Q(5)], answers[Q(5)]);
assert.deepEqual(payload.raw_answers[Q(9)], answers[`${Q(9)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).analysis_group, "flower_stamen_pistil_parts");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).checkpoint_id, "flower_observation_cp2_reproductive_structures");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert(api.renderCheckpoint("checkpoint4").includes("flower_observation_q13"));

const q04Evidence = api.renderQuestionEvidence(Q(4));
assert(q04Evidence.includes("flower-structure-figure"));
assert(q04Evidence.includes("flower-observation-q04-flower-structure-base-390w.webp?v=20260729-flower-observation-build-v1"));
assert(q04Evidence.includes("未標註的花部構造觀察圖"));
assert(q04Evidence.includes("target-list"));
assert.equal((q04Evidence.match(/flower-hotspot/g) || []).length, 5, "q04 should expose a hotspot layer and four target markers");
assert(api.renderQuestionEvidence(Q(11)).includes("甲花"));
assert(api.renderQuestionEvidence(Q(12)).includes("觀察與推論紀錄"));
assert.equal(api.assets.briefingSceneHook, "");
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("brief-scene-fallback"));
assert(api.renderBrief().includes("你好，測試學生"));
assert(api.studentIdentityLine().includes("701班"));
assert(!api.renderReview().includes("mentor-card"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes('data-unit-sequence="31"'));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("flower-hotspot-layer"));

assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("data-relogin"));
const forbiddenResultText = ["正式徽章素材待接", "徽章素材待接", "缺圖", "圖像準備中", "亮"];
for (const text of forbiddenResultText) assert(!api.renderResult().includes(text), `result should not include ${text}`);
assert(!api.renderResult().includes("badge-state"), "result should not render legacy badge-state markers");
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 16"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
const earnedHtml = api.renderBadgeWall(["flower_observation_entry", "flower_parts_labeler"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "U31 pending badges should not create image requests");
assert(earnedHtml.includes("candidate-badge-list"));
assert(earnedHtml.includes("花部構造標記"));

api.setState({
  student: {
    student_id: "S70102",
    class_name: "701",
    seat_no: "02",
    student_name: "正式學生",
    progress: {
      total_exp: 3880,
      current_title_id: "concept_solver",
      current_title: "概念解謎者",
      unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2}]"
    }
  },
  attempt_id: "submitted_attempt",
  attempt_session_id: "session",
  attempt_session_token: "token",
  answers,
  hints: { [Q(5)]: true },
  reflection: { question: "我想確認授粉和受精的差別，觀察花時該看哪些花部線索？" },
  result: api.scoreAttempt(),
  submitted: true,
  screen: "result",
  completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result", "achievements", "rules"]
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
api.saveVerifiedSnapshot();
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.loadVerifiedSnapshot().student_id, "S70102");
assert.equal(api.loadVerifiedSnapshot().progress.total_exp, 3880);
assert(api.renderRules().includes("返回任務"));
console.log("prototype-flower-observation app regression passed");
