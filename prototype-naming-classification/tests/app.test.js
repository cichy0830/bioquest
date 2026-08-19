#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-naming-classification")
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
vm.runInNewContext(source, context, { filename: "prototype-naming-classification/app.js" });
const api = context.window.__namingClassificationTest;

const Q = (n) => `naming_classification_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const answers = {
  [Q(1)]: "shared_traits",
  [Q(2)]: "avoid_confusion",
  [Q(3)]: "genus_species",
  [`${Q(4)}_sequence`]: ["kingdom", "phylum", "class", "order", "family", "genus", "species"],
  [Q(5)]: "species",
  [Q(6)]: "same_genus",
  [Q(7)]: {
    bacteria_no_nucleus: "kingdom_monera",
    paramecium_single_cell: "kingdom_protista",
    mushroom_absorbs_food: "kingdom_fungi",
    fern_photosynthesis: "kingdom_plantae",
    fish_ingests_food: "kingdom_animalia"
  },
  [Q(8)]: "observable_traits",
  [Q(9)]: "one_clue_only",
  [Q(10)]: "pair_shared_genus",
  [Q(11)]: "binomial_task",
  [Q(12)]: "fungi_not_plants",
  [Q(13)]: {
    gene_transfer_application: "u36_biotechnology",
    strata_fossil_evidence: "u37_fossils_evolution",
    binomial_classification_task: "u38_naming_classification",
    stepwise_key_identification: "u39_dichotomous_key"
  },
  [Q(14)]: "classification_clue"
};

assert.equal(api.VERSION, "20260819-naming-classification-q04-evidence-fix-v1");
assert.equal(api.QUESTION_VERSION, "20260818-naming-classification-v1");
assert.equal(api.mission.unit_id, "naming_classification");
assert.equal(html.includes('data-unit-sequence="38"'), true);
assert.equal(html.includes('data-unit-title="生物的命名與分類"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 1);
assert.equal(api.questions.find((question) => question.id === Q(4)).type, "sequence");
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(4)).answer), ["kingdom", "phylum", "class", "order", "family", "genus", "species"]);
assert.equal(api.questions.find((question) => question.id === Q(6)).backend_type, "data_interpret");
assert.equal(api.questions.find((question) => question.id === Q(10)).backend_type, "data_interpret");
assert.equal(api.questions.find((question) => question.id === Q(14)).backend_type, "data_interpret");
assert.equal(api.badges.length, 15);
const formalBadgeIds = [
  "naming_classification_entry",
  "classification_purpose_organizer",
  "formal_name_communicator",
  "binomial_name_basic_reader",
  "classification_hierarchy_sequence_sorter",
  "hierarchy_relationship_reader",
  "five_kingdoms_mapper",
  "classification_basis_keeper",
  "appearance_relationship_guard",
  "classification_data_interpreter",
  "adjacent_unit_boundary_classifier",
  "fungi_plant_boundary_reader",
  "naming_classification_flawless",
  "naming_classification_reflection_reporter",
  "retry_growth_naming_classification"
];
assert.deepEqual(plain(api.formalBadgeIds), formalBadgeIds);
assert.deepEqual(plain(api.badges.map((badge) => badge.id)), formalBadgeIds);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U38 controlled-pending badges must not request image paths");
assert.equal(api.badges.filter((badge) => badge.id === "naming_classification_flawless").length, 1);
assert.equal(api.badges.find((badge) => badge.id === "naming_classification_flawless").image_status, "controlled_pending");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".naming-data-table"));
assert(styles.includes(".naming-card-grid"));

const sequenceQuestion = api.questions.find((question) => question.id === Q(4));
for (const attemptId of ["seq-alpha", "seq-beta", "seq-gamma", "seq-delta"]) {
  api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
  const first = plain(api.orderedOptions(sequenceQuestion).map((item) => item.id));
  const second = plain(api.orderedOptions(sequenceQuestion).map((item) => item.id));
  assert.deepEqual(first, second, `q04 sequence order should be stable for ${attemptId}`);
  assert.deepEqual([...first].sort(), [...sequenceQuestion.answer].sort());
  assert.notDeepEqual(first, sequenceQuestion.answer, `q04 initial order must not equal canonical for ${attemptId}`);
}

for (const number of [7, 13]) {
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
    assert.equal(api.mappingAlignedWithAnswer(question, firstItems, firstChoices), false, `q${number} display must not align with answer order`);
  }
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u38_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("naming_classification_entry"));
assert(score.earned_badges.includes("naming_classification_flawless"));
assert(score.earned_badges.includes("five_kingdoms_mapper"));
assert(score.earned_badges.includes("adjacent_unit_boundary_classifier"));
assert(!score.earned_badges.includes("naming_classification_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u38_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認正式名稱與俗名在資料整理時怎麼搭配使用？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("naming_classification_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(6)]: true }, reflection: { question: "我想確認分類階層資料可以支持到哪個判斷範圍？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "naming_classification");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.deepEqual(payload.raw_answers.q04_sequence, ["kingdom", "phylum", "class", "order", "family", "genus", "species"]);
for (const shortId of ["q07", "q13"]) {
  assert.equal(typeof payload.raw_answers[shortId], "object");
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[`naming_classification_${shortId}`]));
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).question_type, "sequence");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(10)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(14)).question_type, "data_interpret");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(1)).checkpoint_id, "naming_cp1_purpose_naming");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).checkpoint_id, "naming_cp2_hierarchy");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(7)).checkpoint_id, "naming_cp3_five_kingdoms");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(8)).checkpoint_id, "naming_cp4_traits_relationship");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).checkpoint_id, "naming_cp5_boundary");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).exp_type, "revision");

const countOccurrences = (text, pattern) => (text.match(new RegExp(pattern, "g")) || []).length;
assert.equal(api.renderQuestionEvidence(Q(4)), "", "q04 uses its shuffled sortable cards as evidence");
assert.equal(api.renderQuestionEvidence(Q(5)), "", "q05 has no separate evidence card");
const checkpoint2Evidence = api.renderCheckpointEvidence("checkpoint2");
assert.equal(checkpoint2Evidence, "", "checkpoint2 must not render a shared canonical hierarchy evidence table");
api.setState({ attempt_id: "q04-initial-display", answers: {}, optionOrders: {} });
const checkpoint2Html = api.renderCheckpoint("checkpoint2");
assert.equal(countOccurrences(checkpoint2Html, "naming-hierarchy-evidence"), 0, "checkpoint2 must not contain canonical hierarchy evidence rows");
assert(checkpoint2Html.includes(`data-question-id="${Q(4)}"`));
assert(checkpoint2Html.includes(`data-question-id="${Q(5)}"`));
const checkpoint2SequenceOrder = [...checkpoint2Html.matchAll(/data-sequence-item="([^"]+)"/g)].map((match) => match[1]);
assert.equal(checkpoint2SequenceOrder.length, 7, "q04 sortable cards provide the hierarchy evidence");
assert.deepEqual([...checkpoint2SequenceOrder].sort(), [...sequenceQuestion.answer].sort(), "q04 cards preserve the exact hierarchy set");
assert.notDeepEqual(checkpoint2SequenceOrder, sequenceQuestion.answer, "q04 card DOM order must not leak the canonical sequence");
const checkpoint2SequenceLabels = checkpoint2SequenceOrder.map((id) => sequenceQuestion.steps.find((step) => step.id === id).label);
assert.deepEqual([...checkpoint2SequenceLabels].sort(), ["界", "目", "科", "種", "綱", "門", "屬"].sort(), "q04 cards keep all hierarchy labels visible");
assert.notDeepEqual(checkpoint2SequenceLabels, ["界", "門", "綱", "目", "科", "屬", "種"], "hierarchy labels must not appear in canonical DOM order");
for (const [number, selector, keyword] of [
  [2, "naming-common-name-evidence", "名稱紀錄卡"],
  [3, "naming-binomial-evidence", "正式名稱欄位卡"],
  [6, "naming-relationship-evidence", "分類階層比較表"],
  [7, "naming-kingdom-evidence", "五界線索資料"],
  [10, "naming-relationship-table", "分類資料比較表"],
  [13, "naming-boundary-evidence", "相鄰單元任務卡"],
  [14, "naming-scope-evidence", "分類資料範圍卡"]
]) {
  const evidence = api.renderQuestionEvidence(Q(number));
  assert(evidence.includes(selector), `q${number} evidence selector`);
  assert(evidence.includes(keyword), `q${number} evidence keyword`);
  assert(!evidence.includes("<img"), `q${number} evidence must be HTML/CSS`);
  assert(!/答案是|正解|應選|一定最近|必定|直接證明/.test(evidence), `q${number} helper should stay neutral`);
}
assert(api.renderBrief().includes("u36-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u36-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u36-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["naming_classification_entry", "naming_classification_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U38 badges must not create image requests");
assert(earnedHtml.includes("candidate-badge-list"));
assert(!earnedHtml.includes("正式徽章素材待接"));
assert(!earnedHtml.includes("缺圖"));
assert(!earnedHtml.includes("圖像準備中"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server_alias", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認分類階層資料可以支持到哪個判斷範圍？" } });
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

console.log("naming classification app contract passed");
