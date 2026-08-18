#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-fossils-evolution")
  : sourceRoot;
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const store = new Map();
const context = {
  console,
  window: null,
  document: { readyState: "loading", querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
  localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
  URLSearchParams,
  fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  Date,
  Math,
  setTimeout,
  clearTimeout
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-fossils-evolution/app.js" });
const api = context.window.__fossilsEvolutionTest;

const Q = (n) => `fossils_evolution_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "fossil_is_past_life_trace",
  [Q(2)]: "rapid_cover_less_destroyed_preservation",
  [Q(3)]: "fossil_requires_preservation_conditions",
  [Q(4)]: "undisturbed_lower_layer_generally_older",
  [`${Q(5)}_sequence`]: ["L3", "L2", "L1"],
  [Q(6)]: {
    tooth_shape_fossil: "feeding_clue",
    footprint_track_fossil: "movement_activity_clue",
    marine_shell_in_rock: "ancient_environment_clue",
    leaf_imprint_fossil: "plant_form_clue"
  },
  [Q(7)]: "limited_fossil_record_cautious_inference",
  [Q(8)]: "evolution_population_change_over_time",
  [Q(9)]: "fossil_traits_differ_across_layers",
  [Q(10)]: {
    both_have_segmented_support: "shared_trait_clue",
    a_has_wide_tail_plate: "branch_specific_trait",
    b_has_long_tail_spine: "branch_specific_trait",
    a_modern_parent_of_b: "unsupported_direct_parent_claim"
  },
  [Q(11)]: "single_fossil_not_direct_parent_child_proof",
  [Q(12)]: "evolution_not_progress_ladder",
  [Q(13)]: {
    gene_transfer_application: "u36_biotechnology",
    strata_fossil_evidence: "u37_fossils_evolution",
    binomial_classification_task: "u38_naming_classification",
    religion_value_debate: "not_preclass_task",
    radiometric_age_calculation: "not_preclass_task"
  },
  [Q(14)]: "evidence_supports_limited_relative_trait_inference"
};

assert.equal(api.VERSION, "20260819-fossils-evolution-p1-fix-v1");
assert.equal(api.QUESTION_VERSION, "20260818-fossils-evolution-v1");
assert.equal(api.mission.unit_id, "fossils_evolution");
assert.equal(html.includes('data-unit-sequence="37"'), true);
assert.equal(html.includes('data-unit-title="化石與演化"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 1);
assert.equal(api.questions.find((question) => question.id === Q(5)).type, "sequence");
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(5)).answer), ["L3", "L2", "L1"]);
assert.equal(api.questions.find((question) => question.id === Q(4)).backend_type, "data_interpret");
assert.equal(api.questions.find((question) => question.id === Q(9)).backend_type, "data_interpret");
assert.equal(api.questions.find((question) => question.id === Q(14)).backend_type, "data_interpret");
assert.equal(api.badges.length, 15);
const formalBadgeIds = [
  "fossils_evolution_entry",
  "fossil_definition_reader",
  "fossil_formation_condition_keeper",
  "strata_relative_order_interpreter",
  "strata_sequence_sorter",
  "fossil_evidence_clue_mapper",
  "fossil_record_limit_reasoner",
  "evolution_population_time_reader",
  "trait_change_evidence_reader",
  "common_trait_branching_mapper",
  "evolution_not_ladder_guard",
  "u36_u37_u38_boundary_classifier",
  "fossils_evolution_flawless",
  "fossils_evolution_reflection_reporter",
  "retry_growth_fossils_evolution"
];
assert.deepEqual(plain(api.formalBadgeIds), formalBadgeIds);
assert.deepEqual(plain(api.badges.map((badge) => badge.id)), formalBadgeIds);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U37 controlled-pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "fossils_evolution_flawless").length, 1);
assert.equal(api.badges.find((badge) => badge.id === "fossils_evolution_flawless").image_status, "controlled_pending");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".fossil-data-table"));
assert(styles.includes(".fossil-card-grid"));

const sequenceQuestion = api.questions.find((question) => question.id === Q(5));
for (const attemptId of ["seq-alpha", "seq-beta", "seq-gamma", "seq-delta"]) {
  api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
  const first = plain(api.orderedOptions(sequenceQuestion).map((item) => item.id));
  const second = plain(api.orderedOptions(sequenceQuestion).map((item) => item.id));
  assert.deepEqual(first, second, `q05 sequence order should be stable for ${attemptId}`);
  assert.deepEqual([...first].sort(), ["L1", "L2", "L3"]);
  assert.notDeepEqual(first, ["L3", "L2", "L1"], `q05 initial order must not equal canonical for ${attemptId}`);
}

for (const number of [6, 10, 13]) {
  const question = api.questions.find((item) => item.id === Q(number));
  assert.equal(question.type, "mapping");
  for (const attemptId of [`map-${number}-alpha`, `map-${number}-beta`, `map-${number}-gamma`]) {
    api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
    const firstItems = plain(api.orderedMappingItems(question).map((item) => item.id));
    const firstChoices = plain(api.orderedMappingChoices(question).map((choice) => choice.id));
    const secondItems = plain(api.orderedMappingItems(question).map((item) => item.id));
    const secondChoices = plain(api.orderedMappingChoices(question).map((choice) => choice.id));
    assert.deepEqual(firstItems, secondItems, `q${number} item order should be stable`);
    assert.deepEqual(firstChoices, secondChoices, `q${number} choice order should be stable`);
    assert.equal(firstItems.length, question.items.length, `q${number} item shuffle keeps all items`);
    assert.equal(firstChoices.length, question.choices.length, `q${number} choice shuffle keeps all choices`);
  }
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u37_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("fossils_evolution_entry"));
assert(score.earned_badges.includes("fossils_evolution_flawless"));
assert(score.earned_badges.includes("fossil_evidence_clue_mapper"));
assert(score.earned_badges.includes("u36_u37_u38_boundary_classifier"));
assert(!score.earned_badges.includes("fossils_evolution_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u37_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認化石形態資料為什麼只能支持有限的演化推論範圍？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("fossils_evolution_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(6)]: true }, reflection: { question: "我想確認地層資料和化石形態資料能支持到哪個判斷範圍？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "fossils_evolution");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.deepEqual(payload.raw_answers.q05_sequence, ["L3", "L2", "L1"]);
for (const shortId of ["q06", "q10", "q13"]) {
  assert.equal(typeof payload.raw_answers[shortId], "object");
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[`fossils_evolution_${shortId}`]));
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(5)).question_type, "sequence");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(9)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(14)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(1)).checkpoint_id, "fossils_cp1_fossil_basics");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).checkpoint_id, "fossils_cp2_strata_order");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).checkpoint_id, "fossils_cp3_fossil_evidence");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(8)).checkpoint_id, "fossils_cp4_evolution_basics");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).checkpoint_id, "fossils_cp5_unit_boundary");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).exp_type, "revision");

const countOccurrences = (text, pattern) => (text.match(new RegExp(pattern, "g")) || []).length;
assert.equal(api.renderQuestionEvidence(Q(4)), "", "q04 uses shared checkpoint evidence");
assert.equal(api.renderQuestionEvidence(Q(5)), "", "q05 uses shared checkpoint evidence");
const checkpoint2Evidence = api.renderCheckpointEvidence("checkpoint2");
assert(checkpoint2Evidence.includes("fossil-data-table"), "checkpoint2 shared evidence table");
assert(checkpoint2Evidence.includes("未見翻轉或擾動線索"));
assert(!checkpoint2Evidence.includes("<img"), "checkpoint2 shared evidence must be HTML/CSS");
assert(!/L3 通常較早|答案是|精確年份/.test(checkpoint2Evidence), "checkpoint2 helper should stay neutral");
const checkpoint2Html = api.renderCheckpoint("checkpoint2");
assert.equal(countOccurrences(checkpoint2Html, "fossil-strata-evidence"), 1, "q04/q05 shared strata evidence should render once per checkpoint");
assert(checkpoint2Html.includes(`data-question-id="${Q(4)}"`));
assert(checkpoint2Html.includes(`data-question-id="${Q(5)}"`));
const q09Evidence = api.renderQuestionEvidence(Q(9));
assert(q09Evidence.includes("化石形態資料"));
assert(q09Evidence.includes("殼紋較少"));
assert(!q09Evidence.includes("<img"), "q09 evidence must be HTML/CSS");
assert(!/演化證明|祖先|後代|精確年份|答案是/.test(q09Evidence), "q09 helper should stay neutral");
const q10Evidence = api.renderQuestionEvidence(Q(10));
assert(q10Evidence.includes("共同特徵比較卡"));
assert(q10Evidence.includes("分節支撐"));
assert(!q10Evidence.includes("<img"), "q10 evidence must be HTML/CSS");
assert(!/共同祖先|分支關係|答案是/.test(q10Evidence), "q10 helper should stay neutral");
const q14Evidence = api.renderQuestionEvidence(Q(14));
assert(q14Evidence.includes("證據資料卡"));
assert(q14Evidence.includes("三層地層"));
assert(!/不能推論|只能支持|答案是/.test(q14Evidence), "q14 helper should stay neutral");
assert(api.renderBrief().includes("u36-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u36-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u36-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["fossils_evolution_entry", "fossils_evolution_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U37 badges must not create image requests");
assert(earnedHtml.includes("candidate-badge-list"));
assert(!earnedHtml.includes("正式徽章素材待接"));
assert(!earnedHtml.includes("缺圖"));
assert(!earnedHtml.includes("圖像準備中"));

const localCandidate = { ...api.scoreAttempt(), direct_exp: 999, reflection_exp: 888, attempt_exp: 777, unit_credited_exp: 777, earned_badges: ["local_badge_should_not_show"] };
const verifiedMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    verification_status: "server_verified",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    earned_badges_json: JSON.stringify(["server_badge_from_result"])
  },
  student_progress: { total_exp: 4567, current_title_id: "micro_explorer", title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.webp" }
}, localCandidate);
assert.equal(verifiedMerged.direct_exp, 111);
assert.equal(verifiedMerged.reflection_exp, 22);
assert.equal(verifiedMerged.attempt_exp, 333);
assert.deepEqual(plain(verifiedMerged.earned_badges), ["server_badge_from_result"]);
assert.equal(api.state().student.total_exp, 4567);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "submitted", attempt_session_token: "guest", answers, result: score, submitted: true, screen: "result" });
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);

console.log("fossils evolution app contract passed");
