#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-genetics-chromosome-gene")
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
vm.runInNewContext(source, context, { filename: "prototype-genetics-chromosome-gene/app.js" });
const api = context.window.__genetics_chromosome_geneTest;

const Q = (n) => `genetics_chromosome_gene_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "parent_to_offspring_trait_similarity",
  [Q(2)]: {
    pea_flower_color: "observable_trait",
    plant_fruit_shape: "observable_trait",
    sun_red_skin_today: "acquired_or_short_term_state",
    running_speed_after_practice: "learned_or_training_result"
  },
  [Q(3)]: "environment_can_affect_trait_expression_not_gene_change",
  [`${Q(4)}_sequence`]: ["cell", "nucleus", "chromosome", "dna", "gene"],
  [Q(5)]: {
    chromosome: "carries_genetic_information_in_nucleus",
    dna: "genetic_information_material",
    gene: "dna_segment_related_to_trait",
    trait: "observable_or_describable_feature"
  },
  [Q(6)]: "gene_is_dna_segment",
  [Q(7)]: "chromosome_mainly_in_nucleus",
  [Q(8)]: "genes_are_segments_on_dna",
  [Q(9)]: "offspring_trait_matches_parent_pattern",
  [Q(10)]: "this_unit_stops_before_probability_calculation",
  [Q(11)]: "trait_can_be_related_to_genes_and_environment",
  [Q(12)]: "use_anonymous_trait_model_without_private_data",
  [Q(13)]: {
    flower_anther_stigma_ovary_ovule: "u31_flower_observation",
    chromosome_dna_gene_trait_basic: "u32_genetics_chromosome_gene",
    human_trait_anonymous_model: "u33_human_genetics",
    abo_blood_type_possibility: "u34_abo_blood_type"
  },
  [Q(14)]: "chromosome_gene_trait_basic_belongs_u32"
};

assert.equal(api.VERSION, "20260816-genetics-chromosome-gene-functional-build-v1");
assert.equal(api.QUESTION_VERSION, "20260725-genetics-chromosome-gene-v1.1");
assert.equal(api.mission.unit_id, "genetics_chromosome_gene");
assert.equal(html.includes('data-unit-sequence="32"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 16);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 16);
assert(api.badges.every((badge) => !badge.badge_image_path), "U32 pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "genetics_chromosome_gene_flawless").length, 1);
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("u32-genetics-chromosome-gene-azhe"));
assert(!source.includes("u32-genetics-chromosome-gene-owl"));
assert(!html.includes("data-report-owl-src"));
assert(!html.includes("data-result-owl-src"));
assert(styles.includes(".u32-scene-neutral"));
assert(!styles.includes("flower-hotspot"));

for (const file of [
  "assets/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base.webp",
  "assets/sizes/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-1440w.webp",
  "assets/sizes/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-960w.webp",
  "assets/sizes/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-390w.webp"
]) assert(fs.existsSync(path.join(root, file)), `${file} missing`);

const q04 = api.questions.find((question) => question.id === Q(4));
assert.equal(q04.type, "sequence");
assert.deepEqual(plain(q04.answer), ["cell", "nucleus", "chromosome", "dna", "gene"]);
for (const attemptId of ["seed-alpha", "seed-beta", "seed-gamma", "seed-delta"]) {
  api.setState({ attempt_id: attemptId, optionOrders: {}, answers: {} });
  const firstOrder = plain(api.orderedOptions(q04).map((item) => item.id));
  const secondOrder = plain(api.orderedOptions(q04).map((item) => item.id));
  assert.deepEqual(firstOrder, secondOrder, `q04 order should be stable for ${attemptId}`);
  assert.notDeepEqual(firstOrder, plain(q04.answer), `q04 should not initialize as canonical order for ${attemptId}`);
}

for (const attemptId of ["map-alpha", "map-beta", "map-gamma"]) {
  api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
  for (const number of [2, 5, 13]) {
    const question = api.questions.find((item) => item.id === Q(number));
    const itemOrder = plain(api.orderedMappingItems(question).map((item) => item.id));
    const choiceOrder = plain(api.orderedMappingChoices(question).map((choice) => choice.id));
    assert.deepEqual(itemOrder, plain(api.orderedMappingItems(question).map((item) => item.id)), `q${number} item order stable`);
    assert.notDeepEqual(choiceOrder, Object.values(plain(question.answer)), `q${number} choices should not initialize in answer order`);
  }
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u32_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("genetics_chromosome_gene_entry"));
assert(score.earned_badges.includes("genetics_chromosome_gene_flawless"));
assert(score.earned_badges.includes("gene_location_identifier"));
assert(score.earned_badges.includes("u31_u32_u33_u34_genetics_boundary_guardian"));
assert(!score.earned_badges.includes("genetics_chromosome_gene_misconception_reviser"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u32_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認染色體、DNA 和基因的層級關係，為什麼基因是 DNA 上的一段？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("genetics_chromosome_gene_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, reflection: { question: "我想確認染色體、DNA 和基因的層級關係，為什麼基因是 DNA 上的一段？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "genetics_chromosome_gene");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.deepEqual(plain(payload.raw_answers.q04_sequence), answers[`${Q(4)}_sequence`]);
assert.deepEqual(plain(payload.raw_answers.q02), answers[Q(2)]);
assert.deepEqual(plain(payload.raw_answers.q05), answers[Q(5)]);
assert.deepEqual(plain(payload.raw_answers.q13), answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_type, "image_select");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).teacher_group_id, "chromosome_dna_gene");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).exp_type, "revision");

const q06Evidence = api.renderQuestionEvidence(Q(6));
assert(q06Evidence.includes("u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-390w.webp?v=20260816-genetics-chromosome-gene-functional-build-v1"));
assert(q06Evidence.includes("未標註的遺傳訊息位置示意圖"));
assert(q06Evidence.includes("等效觀察清單"));
assert(api.renderBrief().includes("u32-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u32-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u32-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 16"));
const earnedHtml = api.renderBadgeWall(["genetics_chromosome_gene_entry", "gene_location_identifier"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "pending U32 badges must not create image requests");
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

console.log("genetics_chromosome_gene app contract passed");
