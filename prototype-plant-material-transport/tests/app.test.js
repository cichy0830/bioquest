#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-plant-material-transport")
  : sourceRoot;
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const store = new Map();
const context = { console, window: null, document: { readyState: "loading", querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} }, localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)) }, URLSearchParams, fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }), Date, Math, setTimeout, clearTimeout };
context.window = context; context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-plant-material-transport/app.js" });
const api = context.window.__plant_material_transportTest;
assert.equal(api.VERSION, "20260813-plant-material-transport-scroll-v1");
assert.equal(api.QUESTION_VERSION, "20260720-plant-material-transport-canonical-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert.equal(api.mission.unit_id, "plant_material_transport");
assert.equal(api.questions.length, 14);
const q09 = api.questions.find((question) => question.id === "q09");
assert.equal(q09?.type, "sequence");
assert.equal(api.badges.length, 13);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 13);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 0);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(source.includes("bq-badge-asset-pending"));
for (const id of api.badges.map((badge) => badge.id)) {
  const badge = api.badges.find((item) => item.id === id);
  assert.equal(badge?.image_status, "ready", `${id} should be ready`);
  assert.ok(badge.badge_image_path.includes(`?v=${api.VERSION}`), `${id} badge image should carry runtime cache`);
  const cleanBadgePath = badge.badge_image_path.split("?")[0];
  assert(fs.existsSync(path.resolve(root, cleanBadgePath.replace("../", ""))) || fs.existsSync(path.resolve(root, cleanBadgePath)), `${id} asset should exist`);
}
assert.equal(api.badges.filter((badge) => badge.id.includes("flawless")).length, 1);

const answers = { q01: "material_transport", q02: "root_hair_soil_contact", q03: { water: "root_source", minerals: "root_source", sugar: "leaf_source" }, q04: "water_moves_up_inside", q05: "root_xylem_upward", q06: "phloem", q07: "roots_water_leaves_sugar", q08: "phloem_to_needed_parts", q09_sequence: ["soil_contact", "root_water_entry", "xylem_upward_transport", "water_reaches_leaf", "transpiration_from_stoma"], q10: "transpiration_transport_link", q11: "water_loss_and_gas_exchange", q12: "more_leaves_more_water_drops", q13: ["plant_type_size", "leaf_area", "light_time", "temperature"], q14: "xylem_water_phloem_sugar" };
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "plant_material_transport_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14); assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("plant_material_transport_flawless"));
assert(score.earned_badges.includes("transpiration_flow_linker"));
assert(score.earned_badges.includes("transport_evidence_reader"));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "plant_material_transport_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認韌皮部把葉片製造的養分送到根或果實時，是看哪裡需要養分，還是固定方向？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { q09: true }, hintEventStatus: { q09: "sent" }, reflection: { question: "我想確認木質部運水分與礦物質、韌皮部運養分的差異。" } });
score = api.scoreAttempt(); assert(score.unit_credited_exp < 500); assert(!score.earned_badges.includes("plant_material_transport_flawless"));
for (const [text, exp] of [["", 0], ["老師好帥", 0], ["木質部", 0], ["我想確認韌皮部把葉片製造的養分送到根或果實時，是看哪裡需要養分，還是固定方向？", 40]]) { api.setState({ reflection: { question: text } }); assert.equal(api.evaluateReflection().question_exp, exp); }
api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, hints: { q09: true }, reflection: { question: "我想確認蒸散作用如何與水分往上運輸連結？" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "plant_material_transport"); assert.equal(payload.question_version, api.QUESTION_VERSION); assert.equal(payload.question_logs.length, 14); assert.deepEqual(payload.raw_answers.q09, answers.q09_sequence);
for (const attemptId of ["u17-sequence-a", "u17-sequence-b"]) {
  api.setState({ attempt_id: attemptId });
  const firstOrder = Array.from(api.orderedOptions(q09).map((item) => item.id));
  const secondOrder = Array.from(api.orderedOptions(q09).map((item) => item.id));
  assert.deepEqual(firstOrder, secondOrder, `q09 order should stay stable for ${attemptId}`);
  assert.notDeepEqual(firstOrder, Array.from(q09.answer), `q09 order must not start as the answer for ${attemptId}`);
}
api.setState({ attempt_id: "u17-forced-collision", optionOrders: { q09: [...q09.answer] } });
assert.notDeepEqual(Array.from(api.orderedOptions(q09).map((item) => item.id)), Array.from(q09.answer), "q09 stored collision should be guarded");
api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server-alias", attempt_session_token: "token", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認蒸散作用如何與水分往上運輸連結？" } });
const localCandidate = { ...api.scoreAttempt(), direct_exp: 1, reflection_exp: 2, attempt_exp: 3, earned_badges: ["local_candidate_badge"] };
const serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 14,
    total_questions: 14,
    accuracy: 1,
    hint_used_count: 0,
    concept_exp: 300,
    question_exp: 40,
    attempt_total_exp: 500,
    unit_credited_exp: 500,
    credited_delta: 140,
    badges_json: JSON.stringify(["plant_material_transport_entry", "retry_growth_plant_material_transport"])
  },
  student_progress: { total_exp: 4500, current_title_id: "concept_solver" }
}, localCandidate);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["plant_material_transport_entry", "retry_growth_plant_material_transport"], "verified badges should read server badges_json");
assert.equal(serverMerged.direct_exp, 300, "concept_exp should map to direct_exp");
assert.equal(serverMerged.reflection_exp, 40, "question_exp should map to reflection_exp");
assert.equal(serverMerged.attempt_exp, 500, "attempt_total_exp should map to attempt_exp");
assert.equal(serverMerged.exp_delta, 140, "credited_delta should map to exp_delta");
assert.notEqual(serverMerged.direct_exp, localCandidate.direct_exp, "verified direct_exp must not fall back to local candidate");
assert(!serverMerged.earned_badges.includes("local_candidate_badge"), "verified badges must not fall back to local candidate");
const attemptResultMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: { verification_status: "server_verified", correct_count: 14, total_questions: 14, accuracy: 1, attempt_total_exp: 460 },
  attempt_result: {
    newly_credited_badges_json: JSON.stringify(["transport_evidence_reader"]),
    concept_exp: 260,
    question_exp: 25,
    attempt_total_exp: 485
  }
}, localCandidate);
assert.deepEqual(Array.from(attemptResultMerged.earned_badges), ["transport_evidence_reader"], "attempt_result newly_credited_badges_json should be accepted");
assert.equal(attemptResultMerged.direct_exp, 260);
assert.equal(attemptResultMerged.reflection_exp, 25);
assert.equal(attemptResultMerged.attempt_exp, 460);
const serverWithoutBadges = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: { verification_status: "server_verified", concept_exp: 120, question_exp: 0, attempt_total_exp: 120 }
}, localCandidate);
assert.deepEqual(Array.from(serverWithoutBadges.earned_badges), [], "verified result without server badge aliases must not use local candidate badges");
assert(api.renderCheckpoint("checkpoint3").includes("上移"));
assert.equal(api.assets.ambientBackgroundHook, "assets/plant-material-transport-entry-wide.webp");
assert.equal(api.assets.owlPrep, "assets/owl-plant-material-transport-prep-report.webp");
assert(api.renderQuestionEvidence("q01").includes("plant-material-transport-overview-visual.webp"));
for (const qid of ["q03", "q05", "q06", "q07", "q08", "q09", "q10", "q11", "q13", "q14"]) assert.equal(api.renderQuestionEvidence(qid), "", `${qid} should not render an answer-leading evidence card`);
assert(api.renderQuestionEvidence("q12").includes("套袋水珠資料"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(api.renderBrief().includes("bq-brief-scene-stage"));
assert(!api.renderReview().includes("mentor-card"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("本次預估明細總計"));
assert(api.renderResult().includes('data-relogin="true"'));
assert(!api.renderResult().includes('data-bq-unit-achievements="plant_material_transport"'));
assert(!api.renderResult().includes("圖像準備中"));
assert(!api.renderResult().includes("正式徽章素材待接"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes('data-relogin="true"'));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="plant_material_transport"'));
assert(!api.renderAchievements().includes("title-card"));
api.setState({
  student: { student_id: "guest", is_guest: true },
  attempt_id: "submitted_attempt",
  attempt_session_token: "guest",
  question_version: api.QUESTION_VERSION,
  submitted: true,
  screen: "result",
  result: api.scoreAttempt()
});
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_attempt", unit_id: "plant_material_transport" }]));
assert.equal(api.canUseNav("login"), true);
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadAttempts().length, 1);
console.log("prototype-plant-material-transport app regression passed");
