#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-mutation-genetic-disease")
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
vm.runInNewContext(source, context, { filename: "prototype-mutation-genetic-disease/app.js" });
const api = context.window.__mutation_genetic_diseaseTest;

const Q = (n) => `mutation_genetic_disease_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "mutation_is_genetic_material_change",
  [Q(2)]: {
    natural_change_event: "possible_mutation_factor",
    excess_ultraviolet_exposure: "possible_mutation_factor",
    certain_chemical_exposure: "possible_mutation_factor",
    catching_a_cold: "not_supported_mutation_factor",
    studying_harder: "not_supported_mutation_factor",
    exercise_training: "not_supported_mutation_factor"
  },
  [Q(3)]: "mutation_effects_can_vary",
  [Q(4)]: "risk_claim_overstates_certainty",
  [Q(5)]: {
    gene_or_chromosome_abnormality: "genetic_disease_related",
    pathogen_spread_between_people: "infectious_disease_related",
    fall_injury: "acquired_injury_not_genetic",
    asking_classmate_family_history: "inappropriate_personal_data"
  },
  [Q(6)]: "anonymous_model_supports_limited_association",
  [Q(7)]: "sex_linked_basic_without_diagnosis",
  [Q(8)]: {
    gene_chromosome_abnormality_related: "genetic_disease_concept",
    pathogen_transmission_related: "infectious_disease_concept",
    sprain_after_fall: "not_genetic_acquired_injury",
    public_classmate_medical_history: "not_appropriate_classroom_data"
  },
  [Q(9)]: "genetic_condition_does_not_define_value",
  [Q(10)]: "health_info_overclaim_private_data_warning",
  [Q(11)]: "mutation_effects_differ_by_case",
  [Q(12)]: {
    human_dominant_recessive_model: "u33_human_genetics",
    abo_blood_type_punnett: "u34_abo_blood_type",
    mutation_genetic_disease_concept: "u35_mutation_genetic_disease",
    gene_transfer_technology_application: "u36_biotechnology",
    real_family_disease_diagnosis: "not_preclass_task"
  },
  [Q(13)]: "anonymous_model_data_for_genetic_disease_learning",
  [Q(14)]: "u35_not_testing_or_treatment_advice"
};

assert.equal(api.VERSION, "20260818-mutation-genetic-disease-q07-evidence-v1");
assert.equal(api.QUESTION_VERSION, "20260817-mutation-genetic-disease-v1");
assert.equal(api.mission.unit_id, "mutation_genetic_disease");
assert.equal(html.includes('data-unit-sequence="35"'), true);
assert.equal(html.includes('data-unit-title="突變與遺傳疾病"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 0);
assert.equal(api.badges.length, 15);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U35 controlled-pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "mutation_genetic_disease_flawless").length, 1);
assert.equal(api.badges.find((badge) => badge.id === "mutation_genetic_disease_flawless").image_status, "controlled_pending");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".mutation-data-table"));
assert(!styles.includes(".abo-punnett-grid"));

for (const number of [2, 5, 8, 12]) {
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

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u35_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("mutation_genetic_disease_entry"));
assert(score.earned_badges.includes("mutation_genetic_disease_flawless"));
assert(score.earned_badges.includes("anonymous_evidence_scope_reader"));
assert(score.earned_badges.includes("u33_u34_u35_u36_boundary_classifier"));
assert(!score.earned_badges.includes("mutation_genetic_disease_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u35_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認突變與遺傳疾病中匿名模型資料能支持哪個判斷層級？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("mutation_genetic_disease_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, reflection: { question: "我想確認突變與遺傳疾病中匿名模型資料能支持哪個判斷層級？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "mutation_genetic_disease");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.equal(Object.keys(payload.raw_answers).filter((key) => key.endsWith("_sequence")).length, 0);
for (const shortId of ["q02", "q05", "q08", "q12"]) {
  assert.equal(typeof payload.raw_answers[shortId], "object");
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[`mutation_genetic_disease_${shortId}`]));
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(11)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).exp_type, "revision");

for (const number of [6, 11]) {
  const evidence = api.renderQuestionEvidence(Q(number));
  assert(evidence.includes("mutation-data-table"), `q${number} evidence table`);
  assert(!evidence.includes("<img"), `q${number} evidence must be HTML/CSS`);
  assert(!/不能診斷|不要責怪|資料不足|突變不一定有害|答案是|先排除/.test(evidence), `q${number} evidence should stay neutral`);
}
const q07Evidence = api.renderQuestionEvidence(Q(7));
assert(q07Evidence.includes("sex-chromosome-model"), "q07 evidence should render a neutral model card");
for (const expected of ["模型代碼", "S1", "X / Y 性染色體模型", "染色體上可有遺傳資料片段", "此卡只用來看遺傳資料與性染色體的位置關係"]) {
  assert(q07Evidence.includes(expected), `q07 evidence should include ${expected}`);
}
assert(!q07Evidence.includes("<img"), "q07 evidence must be HTML/CSS");
assert(!/疾病名稱|病患|患者|家庭|診斷|性別價值|評斷|只出現|某一個性別|機率|答案是|不能診斷|不要責怪|資料不足/.test(q07Evidence), "q07 evidence should not leak answer boundaries");
assert(api.renderBrief().includes("u35-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u35-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u35-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["mutation_genetic_disease_entry", "mutation_genetic_disease_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U35 badges must not create image requests");
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

console.log("mutation_genetic_disease app contract passed");
