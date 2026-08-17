#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-abo-blood-type")
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
vm.runInNewContext(source, context, { filename: "prototype-abo-blood-type/app.js" });
const api = context.window.__abo_blood_typeTest;

const Q = (n) => `abo_blood_type_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "abo_alleles_three_types",
  [Q(2)]: {
    geno_ia_ia: "phenotype_a",
    geno_ia_i: "phenotype_a",
    geno_ib_ib: "phenotype_b",
    geno_ib_i: "phenotype_b",
    geno_ia_ib: "phenotype_ab",
    geno_i_i: "phenotype_o"
  },
  [Q(3)]: "ia_ib_codominant_ab",
  [Q(4)]: "ii_phenotype_o",
  [Q(5)]: "ii_x_iaib_possible_a_or_b",
  [Q(6)]: {
    cell_top_ia_side_ib: "geno_ia_ib",
    cell_top_ia_side_i: "geno_ia_i",
    cell_top_i_side_ib: "geno_ib_i",
    cell_top_i_side_i: "geno_i_i"
  },
  [Q(7)]: "phenotype_a_two_possible_genotypes",
  [Q(8)]: "iaia_x_ii_only_a_supported",
  [Q(9)]: "probability_not_family_quota",
  [Q(10)]: "a_phenotype_needs_genotype_for_o",
  [Q(11)]: "anonymous_model_no_parentage_medical",
  [Q(12)]: "rh_transfusion_not_u34",
  [Q(13)]: {
    human_trait_genotype_phenotype_basic: "u33_human_genetics",
    abo_punnett_possibility: "u34_abo_blood_type",
    mutation_genetic_disease: "u35_mutation_genetic_disease",
    real_parentage_or_transfusion_decision: "not_preclass_model_task"
  },
  [Q(14)]: "model_not_supported_not_parentage"
};

assert.equal(api.VERSION, "20260817-abo-blood-type-local-functional-v1");
assert.equal(api.QUESTION_VERSION, "20260817-abo-blood-type-v1");
assert.equal(api.mission.unit_id, "abo_blood_type");
assert.equal(html.includes('data-unit-sequence="34"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 0);
assert.equal(api.badges.length, 15);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U34 controlled-pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "abo_blood_type_flawless").length, 1);
assert.equal(api.badges.find((badge) => badge.id === "abo_blood_type_flawless").image_status, "controlled_pending");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".abo-punnett-grid"));
assert(styles.includes(".u34-scene-neutral"));

for (const number of [2, 6, 13]) {
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

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u34_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("abo_blood_type_entry"));
assert(score.earned_badges.includes("abo_blood_type_flawless"));
assert(score.earned_badges.includes("abo_punnett_grid_mapper"));
assert(score.earned_badges.includes("u33_u34_u35_boundary_classifier"));
assert(!score.earned_badges.includes("abo_misconception_reviser"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u34_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認 ABO 棋盤方格中的可能性，怎麼判斷基因型和表現型？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("abo_blood_type_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, reflection: { question: "我想確認 ABO 棋盤方格中的可能性，怎麼判斷基因型和表現型？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "abo_blood_type");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.equal(Object.keys(payload.raw_answers).filter((key) => key.endsWith("_sequence")).length, 0);
for (const shortId of ["q02", "q06", "q13"]) {
  assert.equal(typeof payload.raw_answers[shortId], "object");
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[`abo_blood_type_${shortId}`]));
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(5)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_type, "grid_mapping");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(9)).teacher_group_id, "abo_punnett_reasoning");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "abo_ethics_boundary");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).exp_type, "revision");

for (const number of [5, 6, 9, 13]) {
  const evidence = api.renderQuestionEvidence(Q(number));
  assert(evidence.includes("evidence-card"), `q${number} evidence card`);
  assert(!evidence.includes("<img"), `q${number} evidence must be HTML/CSS`);
  assert(!/答案是|O 型不可能|只會得到|共同顯性答案|隱性答案/.test(evidence), `q${number} evidence should not leak answer wording`);
}
assert(api.renderBrief().includes("u34-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u34-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u34-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["abo_blood_type_entry", "abo_blood_type_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U34 badges must not create image requests");
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

console.log("abo_blood_type app contract passed");
