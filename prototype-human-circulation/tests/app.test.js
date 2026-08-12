#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-human-circulation")
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
vm.runInNewContext(source, context, { filename: "prototype-human-circulation/app.js" });
const api = context.window.__human_circulationTest;

assert.equal(api.VERSION, "20260813-human-circulation-mapping-v1");
assert.equal(api.QUESTION_VERSION, "20260718-human-circulation-ready-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "human_circulation");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 4);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 11);
assert(api.badges.filter((badge) => badge.image_status === "ready").every((badge) => badge.badge_image_path.includes(`?v=${api.VERSION}`)));
assert(api.badges.find((badge) => badge.id === "human_circulation_flawless").badge_image_path.includes("human_circulation_flawless"));
assert(source.includes("BioQuestLoginUX?.begin"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `human_circulation_q${String(n).padStart(2, "0")}`;
assert.equal(api.renderQuestionEvidence(Q(1)), "", "q01 should not show a pre-question evidence card");
assert(api.renderQuestionEvidence(Q(2)).includes("路徑排序卡"), "q02 should keep the operation card");
assert(api.renderQuestionEvidence(Q(2)).includes("上移 / 下移"), "q02 should keep mobile sequence operation support");
for (const qid of [Q(3), Q(4)]) {
  const evidence = api.renderQuestionEvidence(qid);
  assert(evidence.includes("方向閱讀提醒"), `${qid} should use a short neutral direction scaffold`);
  assert(!evidence.includes("肺循環 / 體循環判斷"), `${qid} must not reveal the circulation label clue`);
}
for (const qid of [Q(5), Q(6), Q(8)]) {
  const evidence = api.renderQuestionEvidence(qid);
  assert(evidence.includes("資料閱讀提醒"), `${qid} should use neutral data-reading scaffold`);
  assert(!evidence.includes("含氧量由低變高"), `${qid} must not reveal oxygen-change answer direction`);
}
for (const qid of [Q(7), Q(13)]) {
  const evidence = api.renderQuestionEvidence(qid);
  assert(evidence.includes("圖示閱讀提醒"), `${qid} should use neutral figure-reading scaffold`);
  assert(!evidence.includes("肺循環中的含氧量有特例"), `${qid} must not leak the artery/vein exception`);
}
for (const qid of [Q(9), Q(10), Q(11)]) {
  const evidence = api.renderQuestionEvidence(qid);
  assert(evidence.includes("微血管資料提醒"), `${qid} should use neutral microvascular scaffold`);
  assert(!evidence.includes("全身細胞附近需要氧氣與養分"), `${qid} must not reveal exchange direction`);
}
assert.equal(api.renderQuestionEvidence(Q(12)), "", "q12 should not show a pre-question evidence card");
assert.equal(api.renderQuestionEvidence(Q(14)), "", "q14 should not show a pre-route evidence card");
for (const legacyToken of [
  "循環概念卡",
  "肺循環 / 體循環判斷",
  "肺部交換資料",
  "動靜脈判斷卡",
  "全身微血管交換站",
  "組織液與淋巴基礎"
]) assert(!source.includes(legacyToken), `legacy over-revealing evidence remains: ${legacyToken}`);
const answers = {
  [Q(1)]: "loops_back",
  [`${Q(2)}_sequence`]: ["right_ventricle", "lungs", "left_atrium", "left_ventricle", "body_tissues", "right_atrium"],
  [Q(3)]: "right_lung_left",
  [Q(4)]: "left_body_right",
  [Q(5)]: "oxygen_up_co2_down",
  [Q(6)]: "exchange_not_make",
  [Q(7)]: "pulmonary_exception",
  [Q(8)]: "lung_exchange",
  [Q(9)]: "blood_to_tissue",
  [Q(10)]: "tissue_to_blood",
  [Q(11)]: "capillary",
  [Q(12)]: "fluid_lymph_recovery",
  [Q(13)]: "direction_route_first",
  [Q(14)]: "systemic"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "circulation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("human_circulation_flawless"));
assert(score.earned_badges.includes("pulmonary_route_tracker"));
assert(score.earned_badges.includes("tissue_exchange_direction_judge"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "circulation_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認判斷體循環和肺循環時，應該先看心臟左右，還是先看血液要到肺部或全身？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(2)]: true }, hintEventStatus: { [Q(2)]: "sent" }, reflection: { question: "我想確認肺動脈和肺靜脈為什麼不能只用含氧量來判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("human_circulation_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認判斷體循環和肺循環時，應該先看心臟左右，還是先看血液要到肺部或全身？", 40]
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
  reflection: { question: "我想確認肺動脈和肺靜脈為什麼不能只用含氧量來判斷？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "human_circulation");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(2)], answers[`${Q(2)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const qid = Q(index);
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[qid], `${shortId} should mirror ${qid}`);
}
assert.deepEqual(payload.raw_answers.q02_sequence, answers[`${Q(2)}_sequence`]);
const q02 = api.questions.find((question) => question.id === Q(2));
api.setState({ attempt_id: "u19-forced-collision", optionOrders: { [Q(2)]: [...q02.answer] } });
assert.notDeepEqual(Array.from(api.orderedOptions(q02).map((item) => item.id)), Array.from(q02.answer), "q02 stored collision should be guarded");
const guardedOnce = api.orderedOptions(q02).map((item) => item.id);
const guardedTwice = api.orderedOptions(q02).map((item) => item.id);
assert.deepEqual(guardedOnce, guardedTwice, "q02 guarded order should stay stable within one attempt");
api.setState({
  student: { student_id: "S99999", class_name: "901", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server_alias",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  reflection: { question: "我想確認肺動脈和肺靜脈為什麼不能只用含氧量來判斷？" }
});
const localCandidate = { ...api.scoreAttempt(), direct_exp: 999, reflection_exp: 888, attempt_exp: 777, earned_badges: ["local_candidate_badge"] };
const serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 11,
    total_questions: 14,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["human_circulation_entry", "pulmonary_route_tracker"])
  },
  attempt_result: JSON.stringify({
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["human_circulation_entry", "pulmonary_route_tracker"])
  }),
  student_progress: { total_exp: 5555, current_title_id: "micro_explorer", unit_badge_summary_json: "[]" }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["human_circulation_entry", "pulmonary_route_tracker"]);
assert(!serverMerged.earned_badges.includes("local_candidate_badge"), "server_verified badges must not fall back to local candidate");
const serverNoBadge = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333
  }
}, localCandidate);
assert.deepEqual(Array.from(serverNoBadge.earned_badges), [], "server_verified without badge alias must not reuse local candidate");
const pendingMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "pending_backend",
  attempt: { verification_status: "pending_backend" }
}, localCandidate);
assert.deepEqual(Array.from(pendingMerged.earned_badges), ["local_candidate_badge"], "pending may keep local candidate while waiting for backend");
assert(!source.includes("arteries_veins_connect"));
assert(!source.includes("blood_components_carry"));
assert(api.questions.find((question) => question.id === Q(2)).steps.length === 6);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(2)).analysis_group, "circulation_route_map");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "capillary_exchange_station");
assert(api.renderCheckpoint("checkpoint1").includes("上移"));
assert.equal(api.assets.briefingSceneHook, "assets/human-circulation-briefing-azhe-wide.webp");
assert.equal(api.assets.ambientBackgroundHook, "assets/human-circulation-entry-wide.webp");
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "guest_result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" }, result: api.scoreAttempt(), submitted: true });
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes('data-relogin="true"'));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("本單元 15 枚徽章"));
assert(!api.renderResult().includes("circulation_loop_mapper"));
assert(api.renderAchievements().includes('data-bq-achievements-overview-only="true"'));
assert(api.renderAchievements().includes('data-relogin="true"'));
assert(!api.renderAchievements().includes("本單元 15 枚徽章"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="human_circulation"'));
assert.equal((api.renderAchievements().match(/class="badge /g) || []).length, 0);
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderAchievements().includes("全冊稱號"));
assert(!api.renderAchievements().includes("學生稱號角色"));
assert(api.renderRules().includes('data-relogin="true"'));
assert.equal(api.canUseNav("login"), true);
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_1", unit_id: "human_circulation" }]));
api.setState({
  student: {
    student_id: "S70102",
    class_name: "701",
    seat_no: "02",
    student_name: "正式學生",
    progress: {
      total_exp: 4320,
      current_title_id: "micro_explorer",
      unit_badge_summary_json: JSON.stringify([{ unit_id: "cell_basic_unit", earned_count: 6 }])
    }
  },
  attempt_id: "submitted_attempt",
  attempt_session_token: "submitted_token",
  submitted: true,
  screen: "result",
  answers,
  result: api.scoreAttempt()
});
assert.equal(api.canUseNav("login"), true);
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(JSON.parse(store.get("bioquest_attempts_v1")).length, 1);
const snapshot = api.loadVerifiedSnapshot();
assert.equal(snapshot.student_id, "S70102");
assert.equal(snapshot.progress.total_exp, 4320);
assert(snapshot.progress.unit_badge_summary_json.includes("cell_basic_unit"));
console.log("prototype-human-circulation app regression passed");
