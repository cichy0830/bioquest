#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-human-genetics")
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
vm.runInNewContext(source, context, { filename: "prototype-human-genetics/app.js" });
const api = context.window.__human_geneticsTest;

const Q = (n) => `human_genetics_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "human_traits_gene_environment_influence",
  [Q(2)]: {
    natural_hair_color: "genetic_trait_clue",
    dyed_hair_color: "acquired_change",
    height_expression_nutrition_exercise: "gene_environment_both",
    sun_red_skin_today: "short_term_environment_response"
  },
  [Q(3)]: "offspring_similarity_not_identical",
  [Q(4)]: {
    genotype: "gene_combination",
    phenotype: "observable_trait_expression",
    dominant_allele: "one_can_show_in_simple_model",
    recessive_allele: "usually_two_needed_to_show"
  },
  [Q(5)]: "dominant_trait_with_one_dominant_allele",
  [Q(6)]: "recessive_trait_requires_two_recessive_alleles",
  [Q(7)]: "model_cross_probability_not_guarantee",
  [Q(8)]: "sex_chromosome_combination_not_blame",
  [Q(9)]: {
    autosome: "many_body_trait_related_chromosomes",
    sex_chromosome: "biological_sex_development_related_chromosomes",
    abo_blood_type_reasoning: "u34_abo_blood_type",
    mutation_genetic_disease: "u35_mutation_genetic_disease"
  },
  [Q(10)]: "anonymous_model_data_ethics_boundary",
  [Q(11)]: "similarity_evidence_not_identity_or_relationship",
  [Q(12)]: "abo_mutation_disease_boundary_after_u33",
  [Q(13)]: {
    chromosome_dna_gene_basic: "u32_genetics_chromosome_gene",
    human_trait_dominant_recessive_model: "u33_human_genetics",
    abo_blood_type_possibility: "u34_abo_blood_type",
    mutation_genetic_disease_concepts: "u35_mutation_genetic_disease"
  },
  [Q(14)]: "human_genetics_basic_model_belongs_u33"
};

assert.equal(api.VERSION, "20260817-human-genetics-evidence-neutral-v2");
assert.equal(api.QUESTION_VERSION, "20260817-human-genetics-v1");
assert.equal(api.mission.unit_id, "human_genetics");
assert.equal(html.includes('data-unit-sequence="33"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 0);
assert.equal(api.badges.length, 17);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 17);
assert(api.badges.every((badge) => !badge.badge_image_path), "U33 controlled-pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "human_genetics_flawless").length, 1);
assert.equal(api.badges.find((badge) => badge.id === "human_genetics_flawless").image_status, "controlled_pending");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(!source.includes("u32-genetics-chromosome-gene-azhe"));
assert(!source.includes("u33-human-genetics-azhe"));
assert(!source.includes("u33-human-genetics-q06"));
assert(!html.includes("data-report-owl-src"));
assert(!html.includes("data-result-owl-src"));
assert(styles.includes(".u33-scene-neutral"));
assert(!styles.includes("gene-location-figure"));

for (const number of [2, 4, 9, 13]) {
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
    assert.notDeepEqual(firstChoices, Object.values(plain(question.answer)), `q${number} choices should not initialize in answer order`);
  }
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u33_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("human_genetics_entry"));
assert(score.earned_badges.includes("human_genetics_flawless"));
assert(score.earned_badges.includes("dominant_recessive_model_reader"));
assert(score.earned_badges.includes("u32_u33_u34_u35_boundary_classifier"));
assert(!score.earned_badges.includes("human_genetics_misconception_reviser"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u33_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認匿名模型資料的可能性，為什麼不能直接判斷真實家庭關係？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("human_genetics_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, reflection: { question: "我想確認匿名模型資料的可能性，為什麼不能直接判斷真實家庭關係？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "human_genetics");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.equal(Object.keys(payload.raw_answers).filter((key) => key.endsWith("_sequence")).length, 0);
for (const shortId of ["q02", "q04", "q09", "q13"]) {
  assert.equal(typeof payload.raw_answers[shortId], "object");
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[`human_genetics_${shortId}`]));
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(7)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(11)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).exp_type, "revision");

const q07Evidence = api.renderQuestionEvidence(Q(7));
const q11Evidence = api.renderQuestionEvidence(Q(11));
assert(q07Evidence.includes("role=\"table\""));
assert(q07Evidence.includes("匿名 H/h 模型資料"));
assert(q07Evidence.includes("親代模型甲"));
assert(q07Evidence.includes("可能子代模型組合"));
assert(!q07Evidence.includes("<img"));
assert(!/不要|真實家庭|親屬關係|推論/.test(q07Evidence));
assert(q11Evidence.includes("role=\"table\""));
assert(q11Evidence.includes("匿名性狀資料"));
assert(q11Evidence.includes("匿名代碼"));
assert(q11Evidence.includes("模型性狀 M"));
assert(!q11Evidence.includes("<img"));
assert(!/家庭|疾病|身份|資料不足|推論|不要/.test(q11Evidence));
assert(api.renderBrief().includes("u33-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u33-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u33-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 17"));
const earnedHtml = api.renderBadgeWall(["human_genetics_entry", "dominant_recessive_model_reader"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U33 badges must not create image requests");
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

console.log("human_genetics app contract passed");
