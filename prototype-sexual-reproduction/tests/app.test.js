#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-sexual-reproduction")
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
vm.runInNewContext(source, context, { filename: "prototype-sexual-reproduction/app.js" });
const api = context.window.__sexual_reproductionTest;

assert.equal(api.VERSION, "20260814-sexual-reproduction-mapping-v1");
assert.equal(api.QUESTION_VERSION, "20260718-sexual-reproduction-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION);
assert.equal(api.mission.unit_id, "sexual_reproduction");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u29-sexual-reproduction-review"));
assert(fs.existsSync(path.join(root, "assets", "sexual-reproduction-briefing-azhe-wide.webp")));
assert(fs.existsSync(path.join(root, "assets", "sexual-reproduction-ambient-wide.webp")));
for (const file of [
  "sexual-reproduction-q12-comparison-data-base.webp",
  "sexual-reproduction-q12-comparison-data-base-1440.webp",
  "sexual-reproduction-q12-comparison-data-base-960.webp",
  "sexual-reproduction-q12-overlay-spec.json"
]) {
  assert(fs.existsSync(path.join(root, "assets", file)), `${file} should exist`);
}
const styleSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert(!styleSource.includes(`正式徽章素材${"待"}接`));
assert(!styleSource.includes(`徽章素材${"待"}接`));
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 17);
assert(!source.includes("u29-f-triage-evidence-concrete-01-q12-contact-sheet"));
assert(!source.includes("comparison-data-base-390-preview"));
assert(!source.includes("資料線索卡"));
assert(!source.includes("乙：出現精卵結合"));

const Q = (n) => `sexual_reproduction_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "sexual_reproduction_needs_gamete_fusion",
  [Q(2)]: "sperm_and_egg_are_gametes",
  [Q(3)]: "fertilization_sperm_egg_form_zygote",
  [`${Q(4)}_sequence`]: ["parents_produce_sperm_and_egg", "sperm_and_egg_meet", "fertilization_forms_zygote", "zygote_begins_development"],
  [Q(5)]: "offspring_inherit_from_two_parent_sources",
  [Q(6)]: "sexual_offspring_show_variation",
  [Q(7)]: { frog_water_fertilization: "external_fertilization", human_internal_fertilization: "internal_fertilization", fish_water_fertilization: "external_fertilization", bird_internal_fertilization: "internal_fertilization" },
  [Q(8)]: "pollination_not_same_as_fertilization",
  [Q(9)]: "plant_pollen_sperm_egg_fertilization",
  [Q(10)]: "internal_fertilization_not_always_viviparous",
  [Q(11)]: { sperm_egg_zygote: "sexual_reproduction", strawberry_runner: "asexual_reproduction", hydra_budding: "asexual_reproduction", plant_sperm_egg: "sexual_reproduction" },
  [Q(12)]: "sexual_reproduction_from_variation_and_fertilization_data",
  [Q(13)]: { strawberry_runner_new_plant: "u28_asexual_reproduction", sperm_egg_zygote: "u29_sexual_reproduction", egg_shell_albumen_yolk_aircell: "u30_egg_observation", full_flower_structure_labeling: "u31_flower_observation" },
  [Q(14)]: "fertilization_belongs_sexual_reproduction"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "sexual_reproduction_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("sexual_reproduction_flawless"));
assert(score.earned_badges.includes("sexual_sequence_tracker"));
assert(score.earned_badges.includes("asexual_sexual_comparison_classifier"));
assert(score.earned_badges.includes("u28_u29_u30_u31_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "sexual_reproduction_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認授粉和受精要如何分辨，還有體內受精為什麼不一定代表胎生？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認授粉和受精要如何分辨，還有體內受精為什麼不一定代表胎生？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("sexual_reproduction_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["有性生殖", 0],
  ["我想確認授粉和受精要如何分辨，還有體內受精為什麼不一定代表胎生？", 40]
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
  reflection: { question: "我想確認授粉和受精要如何分辨，還有體內受精為什麼不一定代表胎生？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "sexual_reproduction");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(4)], answers[`${Q(4)}_sequence`]);
assert.deepEqual(payload.raw_answers.q04, answers[`${Q(4)}_sequence`]);
assert.deepEqual(payload.raw_answers.q04_sequence, answers[`${Q(4)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(7)], answers[Q(7)]);
assert.deepEqual(payload.raw_answers.q07, answers[Q(7)]);
assert.deepEqual(payload.raw_answers[Q(11)], answers[Q(11)]);
assert.deepEqual(payload.raw_answers.q11, answers[Q(11)]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.deepEqual(payload.raw_answers.q13, answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).analysis_group, "sexual_process_sequence");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).analysis_group, "unit_boundary_control");
const q04 = api.questions.find((item) => item.id === Q(4));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "q04-collision", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, optionOrders: { [Q(4)]: [...q04.answer] } });
const guardedQ04 = api.orderedOptions(q04).map((item) => item.id);
assert.notDeepEqual(guardedQ04, q04.answer, "q04 initial sequence should not equal canonical answer");
assert.deepEqual(api.orderedOptions(q04).map((item) => item.id), guardedQ04, "q04 guarded order should stay stable");
assert(api.renderCheckpoint("checkpoint2").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
const localCandidate = {
  verification_status: "pending_backend",
  correct_count: 999,
  total_questions: 14,
  accuracy: 0.5,
  hint_used_count: 7,
  completion_exp: 999,
  direct_exp: 999,
  revision_exp: 999,
  reflection_exp: 999,
  mastery_exp: 999,
  retry_exp: 999,
  attempt_exp: 999,
  unit_credited_exp: 999,
  exp_delta: 999,
  earned_badges: ["local_candidate_badge"]
};
api.setState({ student: { student_id: "S99999", student_name: "測試學生", progress: {} }, question_version: api.QUESTION_VERSION });
const serverResult = api.applyBackendSubmitResponse({
  ok: true,
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 11,
    total_questions: 14,
    accuracy: 0.79,
    hint_used_count: 2,
    completion_exp: 100,
    concept_exp: 111,
    question_exp: 22,
    revision_exp: 3,
    mastery_exp: 44,
    retry_exp: 5,
    attempt_total_exp: 333,
    unit_credited_exp: 333,
    credited_delta: 333,
    badges_json: JSON.stringify(["server_badge_a", "server_badge_b"])
  },
  student_progress: { total_exp: 1888, current_title_id: "ecology_recorder" }
}, localCandidate);
assert.equal(serverResult.direct_exp, 111);
assert.equal(serverResult.reflection_exp, 22);
assert.equal(serverResult.attempt_exp, 333);
assert.deepEqual([...serverResult.earned_badges], ["server_badge_a", "server_badge_b"]);
assert(!serverResult.earned_badges.includes("local_candidate_badge"), "server_verified should not fall back to local badges");
const serverNoBadgeResult = api.applyBackendSubmitResponse({
  ok: true,
  verified_attempt: { verification_status: "server_verified", concept_exp: 1, question_exp: 2, attempt_total_exp: 3 }
}, localCandidate);
assert.deepEqual([...serverNoBadgeResult.earned_badges], [], "server_verified without server badges should not use local candidate");
const pendingResult = api.applyBackendSubmitResponse({
  ok: true,
  attempt: { verification_status: "pending_backend", concept_exp: 8, question_exp: 4, attempt_total_exp: 12 }
}, localCandidate);
assert.deepEqual([...pendingResult.earned_badges], ["local_candidate_badge"], "pending backend may keep local candidate badges");
const hasSingleBoundaryGrouping = (question, ids) => {
  const groups = ids.map((id) => question.answer[id]);
  let changes = 0;
  for (let index = 1; index < groups.length; index += 1) if (groups[index] !== groups[index - 1]) changes += 1;
  return changes <= 1 && new Set(groups).size > 1;
};
for (const qid of [Q(7), Q(11), Q(13)]) {
  const question = api.questions.find((item) => item.id === qid);
  const canonicalItems = question.items.map((item) => item.id);
  const canonicalChoices = question.choices.map((item) => item.id);
  for (let index = 0; index < 20; index += 1) {
    api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: `${qid}-seed-${index}`, attempt_session_token: "guest", question_version: api.QUESTION_VERSION });
    const firstItems = api.orderedMappingItems(question).map((item) => item.id);
    const secondItems = api.orderedMappingItems(question).map((item) => item.id);
    const choices = api.orderedMappingChoices(question).map((item) => item.id);
    assert.deepEqual(firstItems, secondItems, `${qid} item order should be stable for seed ${index}`);
    assert.notDeepEqual(firstItems, canonicalItems, `${qid} item order should not stay canonical for seed ${index}`);
    assert.equal(hasSingleBoundaryGrouping(question, firstItems), false, `${qid} item order should not expose a single answer-group boundary for seed ${index}`);
    if (canonicalChoices.length > 1) assert.notDeepEqual(choices, canonicalChoices, `${qid} choices should not stay canonical for seed ${index}`);
  }
}
assert.equal(api.assets.briefingSceneHook, "assets/sexual-reproduction-briefing-azhe-wide.webp");
assert.equal(api.assets.ambientBackgroundHook, "assets/sexual-reproduction-ambient-wide.webp");
assert(api.renderBrief().includes(`assets/sexual-reproduction-briefing-azhe-wide.webp?v=${api.VERSION}`));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes(`assets/sexual-reproduction-ambient-wide.webp?v=${api.VERSION}`));
assert(!api.renderReflection().includes("bq-report-assistant"));
const q12Evidence = api.renderQuestionEvidence(Q(12));
assert(q12Evidence.includes("data-evidence-id=\"q12-comparison-data\""));
assert(q12Evidence.includes(`assets/sexual-reproduction-q12-comparison-data-base.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`assets/sexual-reproduction-q12-comparison-data-base-1440.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`assets/sexual-reproduction-q12-comparison-data-base-960.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`assets/sexual-reproduction-q12-overlay-spec.json?v=${api.VERSION}`));
assert(q12Evidence.includes("甲方式"));
assert(q12Evidence.includes("乙方式"));
for (const forbidden of ["乙是有性生殖", "正解是 A", "答案是有性生殖", "有性生殖後代差異較多"]) {
  assert(!q12Evidence.includes(forbidden), `${forbidden} should not appear in q12 evidence`);
}
assert(!api.renderQuestionEvidence(Q(4)).includes("配子相遇"));
assert(!api.renderQuestionEvidence(Q(4)).includes("受精卵開始發育"));
assert(!api.renderQuestionEvidence(Q(7)).includes("母體內或母體外"));
assert.equal(api.questions.find((question) => question.id === Q(12)).prompt, "請根據「甲方式／乙方式比較資料卡」判斷，乙方式較可能是哪一類？");
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("data-relogin"));
assert.equal((api.renderResult().match(/class="badge /g) || []).length, api.scoreAttempt().earned_badges.length);
assert.equal((api.renderResult().match(/<img /g) || []).length, 0);
assert(!api.renderResult().includes("本單元 17 枚"));
assert(!api.renderResult().includes(`正式徽章素材${"待"}接`));
assert(!api.renderResult().includes(`缺${"圖"}`));
assert(!api.renderResult().includes(`待${"接"}`));
assert(!api.renderResult().includes(`>${"亮"}<`));
assert(!api.renderResult().includes(`>${"徽"}<`));
assert(!api.renderAchievements().includes(`本單元 17 枚${"徽章"}`));
assert(!api.renderAchievements().includes("badge-wall"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("data-relogin"));
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "historic", unit_id: "life_world", student_id: "S99999", unit_credited_exp: 500 }]));
api.setState({
  screen: "result",
  student: {
    student_id: "S99999",
    class_name: "701",
    seat_no: "99",
    student_name: "測試學生",
    progress: { total_exp: 5000, current_title_id: "concept_solver", title_avatar_path: "../shared-assets/title-avatars/title-04-concept_solver-male.webp" }
  },
  attempt_id: "submitted",
  attempt_session_token: "token",
  attempt_session_id: "session",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  completedScreens: ["login", "brief", "result", "achievements", "rules"],
  result: score
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
assert(api.renderRules().includes("data-relogin"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadAttempts().length, 1);
assert.equal(api.loadVerifiedSnapshot().student_id, "S99999");
assert.equal(api.loadVerifiedSnapshot().total_exp, 5000);
console.log("prototype-sexual-reproduction app regression passed");
