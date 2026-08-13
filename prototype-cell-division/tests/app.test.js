#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-cell-division")
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
vm.runInNewContext(source, context, { filename: "prototype-cell-division/app.js" });
const api = context.window.__cell_divisionTest;

assert.equal(api.VERSION, "20260813-cell-division-mapping-assets-v1");
assert.equal(api.QUESTION_VERSION, "20260731-cell-division-v1.2");
assert.notEqual(api.VERSION, api.QUESTION_VERSION);
assert.equal(api.mission.unit_id, "cell_division");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending" && !badge.badge_image_path).length, 17);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u27-cell-division-f-u27-04-evidence-v4"));
assert(!source.includes("u27-cell-division-f-u27-04-evidence-v5-review"));
assert(!source.includes("_generated_sources"));
assert(fs.existsSync(path.join(root, "assets", "cell-division-briefing-azhe-wide.webp")));
assert(fs.existsSync(path.join(root, "assets", "cell-division-briefing-azhe-mobile.webp")));
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));
for (const assetPath of [
  "assets/evidence-v5/runtime_bases/q06/options/sizes/u27-cell-division-q06-v5-chromosomes_distributed_to_both_cells-zero-text-base-1280w.webp",
  "assets/evidence-v5/runtime_bases/q06/options/sizes/u27-cell-division-q06-v5-one_gets_all-zero-text-base-1280w.webp",
  "assets/evidence-v5/runtime_bases/q06/options/sizes/u27-cell-division-q06-v5-chromosomes_disappear-zero-text-base-1280w.webp",
  "assets/evidence-v5/runtime_bases/q06/options/sizes/u27-cell-division-q06-v5-chromosomes_outside_cell-zero-text-base-1280w.webp",
  "assets/evidence-v5/runtime_bases/q08/sizes/u27-cell-division-q08-v5-copy-distribution-zero-text-base-1280w.webp",
  "assets/evidence-v5/runtime_bases/q12/sizes/u27-cell-division-q12-v5-root-tip-two-regions-zero-text-base-1280w.webp"
]) {
  assert(fs.existsSync(path.join(root, assetPath)), `missing approved U27 evidence asset ${assetPath}`);
}
assert(!source.includes("q06/options/u27-cell-division-q06-v5-chromosomes_distributed_to_both_cells-zero-text-base.webp"));
assert(!source.includes("q06/options/u27-cell-division-q06-v5-one_gets_all-zero-text-base.webp"));
assert(!source.includes("q06/options/u27-cell-division-q06-v5-chromosomes_disappear-zero-text-base.webp"));
assert(!source.includes("q06/options/u27-cell-division-q06-v5-chromosomes_outside_cell-zero-text-base.webp"));
assert(!source.includes("q06/options/sizes/u27-cell-division-q06-v5-chromosomes_disappear-zero-text-base-1440w.webp"));
assert(!source.includes("q08/u27-cell-division-q08-v5-copy-distribution-zero-text-base.webp"));
assert(!source.includes("q08/sizes/u27-cell-division-q08-v5-copy-distribution-zero-text-base-1440w.webp"));
assert(!source.includes("q12/u27-cell-division-q12-v5-root-tip-two-regions-zero-text-base.webp"));
assert(!source.includes("q12/sizes/u27-cell-division-q12-v5-root-tip-two-regions-zero-text-base-1440w.webp"));

const Q = (n) => `cell_division_q${String(n).padStart(2, "0")}`;
assert.equal(api.questions.find((question) => question.id === Q(6)).type, "image_select");
assert.equal(api.questions.find((question) => question.id === Q(8)).type, "data_interpret");
assert.equal(api.questions.find((question) => question.id === Q(12)).type, "data_interpret");
assert(api.questions.find((question) => question.id === Q(6)).prompt.includes("完整且相同的一套"));
assert(api.questions.find((question) => question.id === Q(8)).prompt.includes("紅圓、藍短棒、綠三角"));
assert(api.questions.find((question) => question.id === Q(12)).prompt.includes("40 個細胞"));
const q06Markup = api.renderQuestionControl(api.questions.find((question) => question.id === Q(6)));
assert.equal((q06Markup.match(/choice-visual-image/g) || []).length, 4);
assert(q06Markup.includes(`?v=${api.VERSION}`));
assert(api.renderQuestionEvidence(Q(8)).includes("u27-cell-division-q08-v5-copy-distribution-zero-text-base"));
assert(api.renderQuestionEvidence(Q(12)).includes("root-tip-data-card"));
assert(api.renderQuestionEvidence(Q(12)).includes("分裂中可見特徵細胞數"));
const q01Evidence = api.renderQuestionEvidence(Q(1));
const q04Evidence = api.renderQuestionEvidence(Q(4));
const q09Evidence = api.renderQuestionEvidence(Q(9));
const q11Evidence = api.renderQuestionEvidence(Q(11));
const q13Evidence = api.renderQuestionEvidence(Q(13));
assert(q01Evidence.includes("請先讀題目情境"));
assert(q04Evidence.includes("先看分裂後會形成幾個子細胞"));
assert(q09Evidence.includes("先分辨題目問的是分裂完成後的直接結果"));
assert(q11Evidence.includes("單一細胞變大，還是同類細胞數量變化"));
assert(q13Evidence.includes("不要只靠熟悉名詞作答"));
assert(!q01Evidence.includes("新細胞來自原有細胞"));
assert(!q04Evidence.includes("分裂前染色體可先形成兩份"));
assert(!q13Evidence.includes("本單元聚焦細胞分裂、染色體複製與分配"));
const answers = {
  [`${Q(5)}_sequence`]: ["cell_prepares_to_divide", "chromosomes_are_copied", "copied_chromosomes_distribute_to_both_sides", "cytoplasm_separates_into_two_daughter_cells"],
  [Q(1)]: "cells_arise_from_existing_cells",
  [Q(2)]: "division_supports_repair",
  [Q(3)]: "chromosomes_carry_dna_information",
  [Q(4)]: "chromosomes_copy_before_division",
  [Q(6)]: "chromosomes_distributed_to_both_cells",
  [Q(7)]: "chromosome_distribution_is_ordered",
  [Q(8)]: "copied_chromosomes_then_distributed",
  [Q(9)]: "one_mother_cell_forms_two_daughter_cells",
  [Q(10)]: "daughter_cells_similar_genetic_information",
  [Q(11)]: "growth_involves_more_cells",
  [Q(12)]: "root_tip_growth_cell_division_evidence",
  [Q(13)]: { chromosome_copy_distribution: "cell_division_core", wound_repair_new_cells: "cell_division_core", yeast_budding: "later_u28", sperm_egg_fertilization: "later_u29" },
  [Q(14)]: "chromosome_copy_distribution_belongs_cell_division"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cell_division_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("cell_division_flawless"));
assert(score.earned_badges.includes("cell_division_sequence_tracker"));
assert(score.earned_badges.includes("chromosome_distribution_checker"));
assert(score.earned_badges.includes("cell_division_unit_boundary_guardian"));
assert(score.earned_badges.includes("cell_division_mastery"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cell_division_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認染色體為什麼要先複製，再分配到兩個子細胞？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認細胞分裂和無性生殖的邊界怎麼判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("cell_division_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認染色體為什麼要先複製，再分配到兩個子細胞？", 40]
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
  reflection: { question: "我想確認染色體為什麼要先複製，再分配到兩個子細胞？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "cell_division");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const questionId = Q(index);
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[questionId], `${shortId} should mirror ${questionId}`);
}
assert.deepEqual(payload.raw_answers[Q(5)], answers[`${Q(5)}_sequence`]);
assert.deepEqual(payload.raw_answers.q05_sequence, answers[`${Q(5)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.deepEqual(payload.raw_answers.q13, answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(5)).analysis_group, "copy_and_distribution");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).analysis_group, "unit_boundary_control");
assert.equal(payload.question_logs.every((log) => log.question_version === api.QUESTION_VERSION), true);
assert(api.renderCheckpoint("checkpoint2").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
const q05 = api.questions.find((question) => question.id === Q(5));
const canonicalQ05 = q05.steps.map((step) => step.id);
api.setState({
  student: { student_id: "guest", is_guest: true },
  attempt_id: "sequence-collision",
  attempt_session_token: "guest",
  question_version: api.QUESTION_VERSION,
  optionOrders: { [Q(5)]: [...canonicalQ05] }
});
const firstQ05Order = api.orderedOptions(q05).map((step) => step.id);
const secondQ05Order = api.orderedOptions(q05).map((step) => step.id);
assert.notDeepEqual(firstQ05Order, canonicalQ05, "q05 initial sequence should not equal canonical order");
assert.deepEqual(firstQ05Order, secondQ05Order, "q05 guarded sequence order should be stable");
const q13 = api.questions.find((question) => question.id === Q(13));
const canonicalQ13 = q13.items.map((item) => item.id);
for (let index = 0; index < 20; index += 1) {
  api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: `seed-${index}`, attempt_session_token: "guest", question_version: api.QUESTION_VERSION });
  const firstOrder = api.orderedMappingItems(q13).map((item) => item.id);
  const secondOrder = api.orderedMappingItems(q13).map((item) => item.id);
  assert.deepEqual(firstOrder, secondOrder, `q13 should be stable for seed ${index}`);
  assert.notDeepEqual(firstOrder, canonicalQ13, `q13 should not use canonical grouped order for seed ${index}`);
  for (let itemIndex = 1; itemIndex < firstOrder.length; itemIndex += 1) {
    assert.notEqual(q13.answer[firstOrder[itemIndex]], q13.answer[firstOrder[itemIndex - 1]], `q13 should not show adjacent same-category items for seed ${index}`);
  }
}
assert.equal(api.assets.briefingSceneHook, "assets/cell-division-briefing-azhe-wide.webp");
assert.equal(api.assets.briefingSceneMobileHook, "assets/cell-division-briefing-azhe-mobile.webp");
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes(`assets/cell-division-briefing-azhe-wide.webp?v=${api.VERSION}`));
assert(api.renderBrief().includes(`assets/cell-division-briefing-azhe-mobile.webp?v=${api.VERSION}`));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(api.renderBrief().includes("guest 測試身分"));
api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, question_version: api.QUESTION_VERSION });
assert(api.renderBrief().includes("你好，測試學生"));
assert(api.renderBrief().includes("701 99"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(!api.renderReview().includes("mentor-card"));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認染色體為什麼要先複製，再分配到兩個子細胞？" } });
score = api.scoreAttempt();
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認染色體為什麼要先複製，再分配到兩個子細胞？" }, result: score });
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("data-relogin"));
assert.equal((api.renderResult().match(/class="badge /g) || []).length, score.earned_badges.length);
assert.equal((api.renderResult().match(/<img /g) || []).length, 0);
assert(api.renderResult().includes("圖像待核准"));
assert(!api.renderAchievements().includes("本單元 17 枚徽章"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("data-relogin"));
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
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadVerifiedSnapshot().student_id, "S99999");
assert.equal(api.loadVerifiedSnapshot().total_exp, 5000);
const localCandidate = {
  verification_status: "pending_backend",
  correct_count: 999,
  total_questions: 14,
  accuracy: 9.99,
  hint_used_count: 0,
  completion_exp: 100,
  direct_exp: 999,
  revision_exp: 0,
  reflection_exp: 888,
  mastery_exp: 140,
  retry_exp: 0,
  attempt_exp: 777,
  unit_credited_exp: 500,
  exp_delta: 500,
  earned_badges: ["local_candidate_badge"]
};
let merged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["cell_division_entry", "cell_division_sequence_tracker"])
  }
}, localCandidate);
assert.equal(merged.direct_exp, 111);
assert.equal(merged.reflection_exp, 22);
assert.equal(merged.attempt_exp, 333);
assert.deepEqual(Array.from(merged.earned_badges), ["cell_division_entry", "cell_division_sequence_tracker"]);
merged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["cell_division_entry"])
  },
  verified_attempt: { verification_status: "server_verified" }
}, localCandidate);
assert.equal(merged.direct_exp, 111);
assert.equal(merged.reflection_exp, 22);
assert.equal(merged.attempt_exp, 333);
assert.deepEqual(Array.from(merged.earned_badges), ["cell_division_entry"]);
merged = api.applyBackendSubmitResponse({
  ok: true,
  verified_attempt: { verification_status: "server_verified", concept_exp: 111, question_exp: 22, attempt_total_exp: 333 }
}, localCandidate);
assert.equal(merged.direct_exp, 111);
assert.equal(merged.reflection_exp, 22);
assert.equal(merged.attempt_exp, 333);
assert.deepEqual(Array.from(merged.earned_badges), []);
merged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "pending_backend",
  verified_attempt: { verification_status: "pending_backend" }
}, localCandidate);
assert.deepEqual(Array.from(merged.earned_badges), localCandidate.earned_badges);
console.log("prototype-cell-division app regression passed");
