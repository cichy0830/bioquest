#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-biotechnology")
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
vm.runInNewContext(source, context, { filename: "prototype-biotechnology/app.js" });
const api = context.window.__biotechnologyTest;

const Q = (n) => `biotechnology_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "biotech_uses_living_systems",
  [Q(2)]: {
    select_high_yield_plants: "traditional_breeding",
    plant_tissue_many_seedlings: "tissue_culture",
    clone_similar_genetic_animal: "cloning",
    introduced_gene_trait_crop: "gene_transfer",
    fossil_layer_compare: "not_u36_core",
    student_genetic_test_advice: "not_u36_core"
  },
  [Q(3)]: "traditional_breeding_selection_crossing",
  [Q(4)]: "tissue_culture_many_similar_plants",
  [Q(5)]: "cloning_similar_genetic_information",
  [Q(6)]: "gene_transfer_changed_gene_trait",
  [Q(7)]: {
    traditional_breeding_crop: "accumulate_desired_traits",
    tissue_culture_seedlings: "rapid_many_similar_plants",
    gene_transfer_pest_trait: "changed_gene_trait_application",
    cloning_preserve_trait: "similar_genetic_information_individual"
  },
  [Q(8)]: "judge_biotech_with_evidence_context",
  [Q(9)]: "table_supports_limited_agricultural_effect",
  [Q(10)]: "absolute_claim_without_evidence_warning",
  [Q(11)]: "anonymous_case_evidence_respect",
  [Q(12)]: {
    case_similar_genetic_information: "cloning",
    case_changed_gene_trait: "gene_transfer"
  },
  [Q(13)]: {
    mutation_disease_health_info: "u35_mutation_genetic_disease",
    gene_transfer_application: "u36_biotechnology",
    fossil_layer_evolution_evidence: "u37_fossils_evolution",
    real_person_genetic_testing_advice: "not_preclass_task"
  },
  [Q(14)]: "biotech_risk_needs_context_evidence"
};

assert.equal(api.VERSION, "20260818-biotechnology-local-functional-v1");
assert.equal(api.QUESTION_VERSION, "20260817-biotechnology-v1");
assert.equal(api.mission.unit_id, "biotechnology");
assert.equal(html.includes('data-unit-sequence="36"'), true);
assert.equal(html.includes('data-unit-title="生物技術"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 0);
assert.equal(api.badges.length, 15);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U36 controlled-pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "biotechnology_flawless").length, 1);
assert.equal(api.badges.find((badge) => badge.id === "biotechnology_flawless").image_status, "controlled_pending");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".biotech-data-table"));
assert(styles.includes(".biotech-comparison-cards"));

for (const number of [2, 7, 12, 13]) {
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

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u36_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("biotechnology_entry"));
assert(score.earned_badges.includes("biotechnology_flawless"));
assert(score.earned_badges.includes("biotech_example_classifier"));
assert(score.earned_badges.includes("u35_u36_u37_boundary_classifier"));
assert(!score.earned_badges.includes("biotechnology_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u36_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認農業生技資料表為什麼只能支持特定條件下的判斷範圍？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("biotechnology_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, reflection: { question: "我想確認生物技術資料卡為什麼只能支持特定條件下的判斷範圍？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "biotechnology");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.equal(Object.keys(payload.raw_answers).filter((key) => key.endsWith("_sequence")).length, 0);
for (const shortId of ["q02", "q07", "q12", "q13"]) {
  assert.equal(typeof payload.raw_answers[shortId], "object");
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[`biotechnology_${shortId}`]));
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(9)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(10)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).exp_type, "revision");

const q09Evidence = api.renderQuestionEvidence(Q(9));
assert(q09Evidence.includes("biotech-data-table"), "q09 evidence table");
assert(q09Evidence.includes("B1"));
assert(q09Evidence.includes("C1"));
assert(!q09Evidence.includes("<img"), "q09 evidence must be HTML/CSS");
assert(!/B1 較有效|基因改造比較好|答案是|先排除/.test(q09Evidence), "q09 helper should stay neutral");
const q10Evidence = api.renderQuestionEvidence(Q(10));
assert(q10Evidence.includes("biotech-article-excerpt"));
assert(q10Evidence.includes("這項技術保證百分之百安全"));
assert(!/這句話誇大|這句話不可信|注意保證語氣|沒有證據|答案是/.test(q10Evidence), "q10 helper should stay neutral");
const q12Evidence = api.renderQuestionEvidence(Q(12));
assert(q12Evidence.includes("biotech-comparison-cards"));
assert(!q12Evidence.includes("<img"), "q12 evidence must be HTML/CSS");
assert(!/複製案例|基因轉殖案例|第一張是複製|第二張是基因轉殖|答案是/.test(q12Evidence), "q12 evidence should not label answers");
assert(api.renderBrief().includes("u36-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u36-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u36-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["biotechnology_entry", "biotechnology_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U36 badges must not create image requests");
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

console.log("biotechnology app contract passed");
