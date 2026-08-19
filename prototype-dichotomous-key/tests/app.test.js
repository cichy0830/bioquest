#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-dichotomous-key")
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
vm.runInNewContext(source, context, { filename: "prototype-dichotomous-key/app.js" });
const api = context.window.__dichotomousKeyTest;

const Q = (n) => `dichotomous_key_q${String(n).padStart(2, "0")}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const branchQ04 = { node_id: "start", choice_id: "has_wings", next_node_id: "winged_node" };
const branchQ06 = { path_id: "path_alpha", node_path: ["start", "has_wings", "winged_node", "long_antennae", "result_alpha"] };
const branchQ07 = { current_path: ["start", "has_wings"], next_node_id: "winged_node" };
const q13Answer = {
  fossil_evidence_task: "u37_fossils_evolution",
  binomial_naming_task: "u38_naming_classification",
  branch_key_path_task: "u39_dichotomous_key",
  microbe_group_task: "u40_prokaryotes_protists_fungi"
};
const answers = {
  [Q(1)]: "identify_by_features",
  [Q(2)]: "observation_card",
  [Q(3)]: "wings_yes_no",
  [Q(4)]: branchQ04,
  [Q(5)]: "missing_path",
  [Q(6)]: branchQ06,
  [Q(7)]: branchQ07,
  [Q(8)]: "clear_wings",
  [Q(9)]: "can_both_be_true",
  [Q(10)]: "different_node_path",
  [Q(11)]: "rocks_stationery_features",
  [Q(12)]: "stepwise_key",
  [Q(13)]: q13Answer,
  [Q(14)]: "observable_exclusive_feature"
};

assert.equal(api.VERSION, "20260819-dichotomous-key-local-functional-v1");
assert.equal(api.QUESTION_VERSION, "20260819-dichotomous-key-v1");
assert.equal(api.mission.unit_id, "dichotomous_key");
assert.equal(html.includes('data-unit-id="dichotomous_key"'), true);
assert.equal(html.includes('data-unit-sequence="39"'), true);
assert.equal(html.includes('data-unit-title="檢索表的認識與應用"'), true);
assert.equal(api.questions.length, 14);
assert.equal(api.questions.filter((question) => question.type === "sequence").length, 0);
assert.equal(api.questions.find((question) => question.id === Q(4)).type, "branch_choice");
assert.equal(api.questions.find((question) => question.id === Q(6)).type, "branch_path");
assert.equal(api.questions.find((question) => question.id === Q(7)).type, "branch_next_node");
assert.equal(api.questions.find((question) => question.id === Q(13)).type, "mapping");
assert.deepEqual(plain(api.questions.find((question) => question.id === Q(13)).answer), q13Answer);
assert(!source.includes("monera_protista_fungi"), "U39 must not write legacy U40 alias");
assert(!source.includes("待審素材"));
assert(!source.includes("_generated_sources"));
assert(!source.includes("contact_sheet"));
assert(!source.includes("record_only"));
assert(styles.includes(".key-card-grid"));
assert(styles.includes(".key-data-table"));
assert(styles.includes(".branch-option-grid"));

const formalBadgeIds = [
  "dichotomous_key_entry",
  "key_purpose_observation_reader",
  "mutually_exclusive_choice_checker",
  "branch_start_tracker",
  "no_skip_path_keeper",
  "observation_path_reader",
  "clear_feature_wording_editor",
  "path_result_reasoner",
  "key_scope_transferer",
  "u37_u40_boundary_mapper",
  "branching_model_integrator",
  "feature_evidence_guard",
  "dichotomous_key_flawless",
  "dichotomous_key_reflection_reporter",
  "retry_growth_dichotomous_key"
];
assert.deepEqual(plain(api.formalBadgeIds), formalBadgeIds);
assert.deepEqual(plain(api.badges.map((badge) => badge.id)), formalBadgeIds);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 15);
assert(api.badges.every((badge) => !badge.badge_image_path), "U39 controlled-pending badges must not request image paths");
assert.equal(api.badges.find((badge) => badge.id === "dichotomous_key_flawless")?.image_status, "controlled_pending");

for (const number of [4, 6, 7]) {
  const question = api.questions.find((item) => item.id === Q(number));
  const canonicalOrder = question.options.map((option) => option.id);
  for (const attemptId of [`branch-${number}-alpha`, `branch-${number}-beta`, `branch-${number}-gamma`]) {
    api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
    const first = plain(api.orderedOptions(question).map((option) => option.id));
    const second = plain(api.orderedOptions(question).map((option) => option.id));
    assert.deepEqual(first, second, `q${number} branch order should stay stable for one attempt`);
    assert.deepEqual([...first].sort(), [...canonicalOrder].sort(), `q${number} keeps all branch choices`);
    assert.notDeepEqual(first, canonicalOrder, `q${number} initial branch display must not equal source/canonical order`);
  }
}

const mappingQuestion = api.questions.find((item) => item.id === Q(13));
for (const attemptId of ["map-alpha", "map-beta", "map-gamma"]) {
  api.setState({ attempt_id: attemptId, answers: {}, optionOrders: {} });
  const firstItems = plain(api.orderedMappingItems(mappingQuestion).map((item) => item.id));
  const firstChoices = plain(api.orderedMappingChoices(mappingQuestion).map((choice) => choice.id));
  const secondItems = plain(api.orderedMappingItems(mappingQuestion).map((item) => item.id));
  const secondChoices = plain(api.orderedMappingChoices(mappingQuestion).map((choice) => choice.id));
  assert.deepEqual(firstItems, secondItems);
  assert.deepEqual(firstChoices, secondChoices);
  assert.equal(api.mappingAlignedWithAnswer(mappingQuestion, firstItems, firstChoices), false, "q13 display must not align with answer_map");
}

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u39_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.direct_exp, 220);
assert.equal(score.revision_exp, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("dichotomous_key_entry"));
assert(score.earned_badges.includes("dichotomous_key_flawless"));
assert(score.earned_badges.includes("branching_model_integrator"));
assert(score.earned_badges.includes("u37_u40_boundary_mapper"));
assert(!score.earned_badges.includes("dichotomous_key_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "u39_valid", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認二分檢索表在分支節點與路徑紀錄之間如何判斷？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("dichotomous_key_reflection_reporter"));

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { [Q(6)]: true }, reflection: { question: "我想確認檢索表路徑資料可以支持到哪個判斷範圍？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "dichotomous_key");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(plain(payload.raw_answers[shortId]), plain(payload.raw_answers[Q(index)]), `${shortId} bare raw answer should mirror full key`);
}
assert.deepEqual(plain(payload.raw_answers.q04_branch), branchQ04);
assert.deepEqual(plain(payload.raw_answers.q06_path), branchQ06);
assert.deepEqual(plain(payload.raw_answers.q07_next_node), branchQ07);
assert.deepEqual(plain(payload.raw_answers.q13_map), q13Answer);
assert.equal(payload.raw_answers.q13.microbe_group_task, "u40_prokaryotes_protists_fungi");
assert(!JSON.stringify(payload.raw_answers).includes("monera_protista_fungi"));
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).question_type, "branch_choice");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_type, "branch_path");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(7)).question_type, "branch_next_node");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).question_type, "mapping");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).checkpoint_id, "key_cp3_branch_path");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).branch_answer_json, JSON.stringify(branchQ06));
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).answer_map_json, JSON.stringify(q13Answer));
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).hint_used, true);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).exp_type, "revision");

for (const [number, selector, keyword] of [
  [2, "key-observation-evidence", "觀察卡資料"],
  [3, "key-choice-pair-evidence", "A/B 選項卡"],
  [4, "key-branch-node-evidence", "目前節點卡"],
  [6, "key-path-evidence", "觀察卡甲與路徑選項"],
  [7, "key-current-path-evidence", "目前已走路徑"],
  [9, "key-flawed-pair-evidence", "二分選項文字卡"],
  [10, "key-path-comparison-evidence", "路徑比較卡"],
  [13, "key-boundary-evidence", "相鄰單元任務卡"],
  [14, "key-feature-build-evidence", "觀察卡特徵表"]
]) {
  const evidence = api.renderQuestionEvidence(Q(number));
  assert(evidence.includes(selector), `q${number} evidence selector`);
  assert(evidence.includes(keyword), `q${number} evidence keyword`);
  assert(!evidence.includes("<img"), `q${number} evidence must be HTML/CSS`);
  assert(!/答案是|正解|應選|一定|必定|終點是|結果是/.test(evidence), `q${number} helper should stay neutral`);
}
assert.equal(api.renderCheckpointEvidence("checkpoint2"), "", "U39 must not render global answer tree evidence");
assert(api.renderBrief().includes("u36-scene-neutral"));
assert(api.renderBrief().includes("學生稱號角色"));
assert(!api.renderBrief().includes("<img class=\"u36-scene-azhe\""));
assert(!api.renderScan().includes("<img class=\"u36-scene-owl\""));
assert(api.renderResult().includes("data-relogin"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 15"));
const earnedHtml = api.renderBadgeWall(["dichotomous_key_entry", "dichotomous_key_flawless"], { onlyEarned: true });
assert(!earnedHtml.includes("<img"), "controlled-pending U39 badges must not create image requests");
assert(earnedHtml.includes("candidate-badge-list"));

const verified = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    direct_exp: 111,
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

console.log("U39 app contract PASS");
