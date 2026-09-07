#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-prokaryotes-protists-fungi")
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
vm.runInNewContext(source, context, { filename: "prototype-prokaryotes-protists-fungi/app.js" });
const api = context.window.__prokaryotesProtistsFungiTest;

const Q = (n) => `prokaryotes_protists_fungi_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const q02Answer = { bacteria: "prokaryotes", cyanobacteria: "prokaryotes", paramecium: "protists", yeast: "fungi", mold: "fungi", mushroom: "fungi" };
const q08Answer = { lactic_acid_bacteria: "prokaryotes", cyanobacteria: "prokaryotes", paramecium: "protists", yeast: "fungi", mushroom: "fungi" };
const q10Answer = { branch_key_task: "u39_dichotomous_key", microbe_group_task: "u40_prokaryotes_protists_fungi", plant_group_task: "u41_plant_kingdom" };
const q12Answer = { bread_yeast_rising: "possible_benefit", spoiled_food_bacteria: "possible_problem", unknown_water_sample: "need_more_context" };
const answers = {
  [Q(1)]: "no_clear_nucleus",
  [Q(2)]: q02Answer,
  [Q(3)]: "fungi_absorb",
  [Q(4)]: "need_more_features",
  [Q(5)]: "context_matters",
  [Q(6)]: "protist_candidate",
  [Q(7)]: "not_necessarily_plant",
  [Q(8)]: q08Answer,
  [Q(9)]: "nucleus_nutrition_examples",
  [Q(10)]: q10Answer,
  [Q(11)]: "fungus_decomposer",
  [Q(12)]: q12Answer,
  [Q(13)]: "varied_features",
  [Q(14)]: "nutrition_and_group"
};

assert.equal(api.VERSION, "20260907-prokaryotes-protists-fungi-q13-copy-v1");
assert.equal(api.QUESTION_VERSION, "20260819-prokaryotes-protists-fungi-v1");
assert.equal(api.mission.unit_id, "prokaryotes_protists_fungi");
assert.equal(html.includes('data-unit-id="prokaryotes_protists_fungi"'), true);
assert.equal(html.includes('data-unit-sequence="40"'), true);
assert.equal(html.includes('data-unit-title="原核、原生生物及真菌界"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 0);
assert.equal(api.questions.filter((question) => question.type === "mapping").length, 4);
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(2)).answer), q02Answer);
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(8)).answer), q08Answer);
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(10)).answer), q10Answer);
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(12)).answer), q12Answer);
const q13 = api.questions.find((question) => question.id === Q(13));
assert.equal(q13.answer, "varied_features");
assert.equal(q13.prompt, "甲、乙、丙都是原生生物。比較資料表後，可以看出什麼？");
assert.equal(q13.hint, "比較三者的生活環境、運動方式與養分來源，看它們是否完全相同。");
assert.deepEqual(plain(q13.options.map((option) => [option.id, option.text])), [
  ["varied_features", "它們的運動方式和獲得養分的方法不完全相同"],
  ["all_freshwater", "它們都只生活在淡水中"],
  ["all_cilia", "它們都用纖毛移動"],
  ["all_chloroplast", "它們都靠葉綠體製造養分"]
]);
assert(!source.includes("monera_protista_fungi"), "U40 must not write legacy monera_protista_fungi alias");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".microbe-card-grid"));
assert(styles.includes(".microbe-data-table"));

const formalBadgeIds = [
  "prokaryotes_protists_fungi_entry",
  "prokaryote_nucleus_identifier",
  "microbe_example_group_mapper",
  "fungi_absorptive_nutrition_reader",
  "size_only_misconception_corrector",
  "microbe_context_reasoner",
  "protist_diversity_observer",
  "cyanobacteria_boundary_keeper",
  "microbe_group_classifier",
  "unit_boundary_microbe_mapper",
  "fungi_not_plant_master",
  "microbe_context_sorter",
  "prokaryotes_protists_fungi_flawless",
  "prokaryotes_protists_fungi_reflection_reporter",
  "retry_growth_prokaryotes_protists_fungi"
];
assert.deepEqual(plain(api.formalBadgeIds), formalBadgeIds);
assert.deepEqual(plain(api.badges.map((badge) => badge.id)), formalBadgeIds);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U40 controlled-pending badges must not request image paths");

for (const number of [2, 8, 10, 12]) {
  const question = api.questions.find((item) => item.id === Q(number));
  const canonicalItems = question.items.map((item) => item.id);
  const canonicalChoices = question.choices.map((choice) => choice.id);
  for (const attemptId of [`map-${number}-alpha`, `map-${number}-beta`, `map-${number}-gamma`, `map-${number}-delta`]) {
    api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
    const firstItems = plain(api.orderedMappingItems(question).map((item) => item.id));
    const firstChoices = plain(api.orderedMappingChoices(question).map((choice) => choice.id));
    const secondItems = plain(api.orderedMappingItems(question).map((item) => item.id));
    const secondChoices = plain(api.orderedMappingChoices(question).map((choice) => choice.id));
    assert.deepEqual(firstItems, secondItems, `q${number} item order should stay stable for one attempt`);
    assert.deepEqual(firstChoices, secondChoices, `q${number} choice order should stay stable for one attempt`);
    assert.deepEqual([...firstItems].sort(), [...canonicalItems].sort(), `q${number} keeps all mapping items`);
    assert.deepEqual([...firstChoices].sort(), [...canonicalChoices].sort(), `q${number} keeps all mapping choices`);
    assert.notDeepEqual(firstItems, canonicalItems, `q${number} item order should not equal source order`);
    assert.equal(api.mappingAlignedWithAnswer(question, firstItems, firstChoices), false, `q${number} display must not align item order with answer_map`);
    assert.equal(api.mappingGroupedByAnswer(question, firstItems), false, `q${number} display must not group all answers by category`);
  }
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u40_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("prokaryotes_protists_fungi_entry"));
assert(score.earned_badges.includes("prokaryotes_protists_fungi_flawless"));
assert(score.earned_badges.includes("microbe_example_group_mapper"));
assert(score.earned_badges.includes("unit_boundary_microbe_mapper"));
assert(!score.earned_badges.includes("prokaryotes_protists_fungi_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u40_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認藍菌與藻類差異，以及真菌為何不是植物的證據。" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("prokaryotes_protists_fungi_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(12)]: true }, reflection: { question: "我想確認微生物在不同情境中如何判斷可能影響？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "prokaryotes_protists_fungi");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.deepEqual(plain(payload.raw_answers.q02_map), q02Answer);
assert.deepEqual(plain(payload.raw_answers.q08_map), q08Answer);
assert.deepEqual(plain(payload.raw_answers.q10_map), q10Answer);
assert.deepEqual(plain(payload.raw_answers.q12_map), q12Answer);
assert.equal(payload.raw_answers.q10.microbe_group_task, "u40_prokaryotes_protists_fungi");
assert(!JSON.stringify(payload.raw_answers).includes("monera_protista_fungi"));
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).question_type, "card_sort");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(10)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).answer_map_json, JSON.stringify(q12Answer));
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).exp_type, "revision");

for (const [number, selector, keyword] of [
  [2, "microbe-classification-evidence", "例子卡"],
  [4, "microbe-observation-evidence", "顯微觀察資料卡"],
  [5, "microbe-situation-evidence", "情境卡"],
  [6, "microbe-protist-evidence", "水中微小生物觀察卡"],
  [8, "microbe-example-evidence", "例子資料卡"],
  [10, "microbe-boundary-evidence", "相鄰單元任務卡"],
  [12, "microbe-context-sort-evidence", "情境分類卡"],
  [13, "microbe-protist-table-evidence", "微小生物資料表"]
]) {
  const evidence = api.renderQuestionEvidence(Q(number));
  assert(evidence.includes(selector), `q${number} evidence selector`);
  assert(evidence.includes(keyword), `q${number} evidence keyword`);
  assert(!evidence.includes("<img"), `q${number} evidence must be HTML/CSS`);
  assert(!/答案是|正解|應選|必定|終點是|結果是|唯一正確/.test(evidence), `q${number} helper should stay neutral`);
}
const q13Evidence = api.renderQuestionEvidence(Q(13));
for (const header of ["代碼", "生活環境", "運動方式", "養分線索"]) {
  assert(q13Evidence.includes(`role="columnheader">${header}</span>`), `q13 visible table header ${header}`);
  assert(q13Evidence.includes(`data-field-label="${header}"`), `q13 mobile card label ${header}`);
  assert(q13Evidence.includes(`<span class="microbe-cell-label" aria-hidden="true">${header}</span>`), `q13 visible per-value label ${header}`);
}
for (const value of ["甲", "淡水", "以纖毛移動", "吞入微小食物顆粒", "乙", "池水表層", "資料未列出明顯移動構造", "有葉綠體線索，可利用光", "丙", "潮濕環境", "會伸出偽足", "取得小型食物"]) {
  assert(q13Evidence.includes(`<span class="microbe-cell-value">${value}</span>`), `q13 visible table cell ${value}`);
}
assert.equal((q13Evidence.match(/class="microbe-data-record"/g) || []).length, 3, "q13 mobile data records should be grouped by organism");
assert(!q13Evidence.includes("資料欄位"), "q13 must not collapse visible fields into a generic data column");
assert(!/分類為|類群是|應排除|答案方向|原生生物答案/.test(q13Evidence), "q13 evidence must not leak classification conclusions");
assert.equal(api.renderCheckpointEvidence("checkpoint2"), "", "U40 must not render global sequence evidence");
assert(api.renderBrief().includes("u40-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u40-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u40-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["prokaryotes_protists_fungi_entry", "prokaryotes_protists_fungi_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U40 badges must not create image requests");
assert(earnedHtml.includes("candidate-badge-list"));

const verified = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    concept_exp: 111,
    revision_exp: 22,
    question_exp: 33,
    attempt_total_exp: 333,
    earned_badges_json: JSON.stringify(["server_badge_a", "server_badge_b"])
  }
}, { ...score, earned_badges: ["local_badge"], direct_exp: 999, revision_exp: 888, attempt_exp: 777, unit_credited_exp: 777 });
assert.deepEqual(plain(verified.earned_badges), ["server_badge_a", "server_badge_b"], "server verified badges must override local candidates");
assert.equal(verified.direct_exp, 111);
assert.equal(verified.revision_exp, 22);
assert.equal(verified.reflection_exp, 33);
assert.equal(verified.attempt_exp, 333);

console.log("U40 app contract PASS");
