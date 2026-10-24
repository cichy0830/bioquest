#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-respiration-homeostasis")
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
vm.runInNewContext(source, context, { filename: "prototype-respiration-homeostasis/app.js" });
const api = context.window.__respiration_homeostasisTest;

assert.equal(api.VERSION, "20261025-respiration-homeostasis-spec-sync-v1");
assert.equal(api.QUESTION_VERSION, "20260718-respiration-homeostasis-v1");
assert.equal(api.mission.unit_id, "respiration_homeostasis");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u24-respiration-homeostasis-review"));
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert(!styles.includes("正式徽章素材待接"));
assert(!styles.includes("asset-missing::before"));
assert(!source.includes("question_version: VERSION"));
assert(!source.includes("!== VERSION"));

const Q = (n) => `respiration_homeostasis_q${String(n).padStart(2, "0")}`;
const answers = {
  [`${Q(3)}_sequence`]: ["nose_or_mouth", "trachea", "bronchi", "lungs", "alveoli"],
  [Q(1)]: "breathing_and_cellular_respiration_distinct",
  [Q(2)]: "cells_use_oxygen_for_energy",
  [Q(4)]: { nasal_cavity: "filter_warm_moisten", trachea: "air_passage_to_lungs", bronchi: "branches_to_lungs", alveoli: "gas_exchange_site" },
  [Q(5)]: "alveoli_thin_many_capillaries",
  [Q(6)]: "alveoli_o2_in_co2_out",
  [Q(7)]: "inhalation_diaphragm_down_chest_expands",
  [Q(8)]: "exhalation_diaphragm_up_chest_smaller",
  [Q(9)]: { diaphragm_down: "inhale", chest_expands: "inhale", air_enters_lungs: "inhale", diaphragm_up: "exhale", chest_smaller: "exhale", air_leaves_lungs: "exhale" },
  [Q(10)]: "exhaled_air_less_o2_more_co2",
  [Q(11)]: "exercise_breathing_gas_balance",
  [Q(12)]: { human: "lungs_alveoli", fish: "gills", insect: "tracheal_system", plant_leaf: "stomata" },
  [Q(13)]: "plants_also_respire_exchange_gases",
  [Q(14)]: "alveoli_exchange_belongs_respiration"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "respiration_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("respiration_homeostasis_flawless"));
assert(score.earned_badges.includes("air_path_sequence_tracker"));
assert(score.earned_badges.includes("inhale_exhale_classifier"));
assert(score.earned_badges.includes("gas_exchange_diversity_mapper"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "respiration_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認呼吸運動和細胞利用氧氣釋放能量的關係要怎麼串起來？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(9)]: true }, hintEventStatus: { [Q(9)]: "sent" }, reflection: { question: "我想確認吸氣和呼氣時橫膈與胸腔變化要怎麼一起判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("respiration_homeostasis_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認肺泡氣體交換和細胞利用氧氣之間的關係是什麼？", 40]
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
  reflection: { question: "我想確認肺泡氣體交換和細胞利用氧氣之間的關係是什麼？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "respiration_homeostasis");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(3)], answers[`${Q(3)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[Q(index)], `${shortId} should mirror full question id`);
}
assert.deepEqual(payload.raw_answers.q03, answers[`${Q(3)}_sequence`]);
assert.deepEqual(payload.raw_answers.q03_sequence, answers[`${Q(3)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(4)], answers[Q(4)]);
assert.deepEqual(payload.raw_answers[Q(9)], answers[Q(9)]);
assert.deepEqual(payload.raw_answers[Q(12)], answers[Q(12)]);
assert.deepEqual(payload.raw_answers.q04, answers[Q(4)]);
assert.deepEqual(payload.raw_answers.q09, answers[Q(9)]);
assert.deepEqual(payload.raw_answers.q12, answers[Q(12)]);
const q03Log = payload.question_logs.find((log) => log.question_id === Q(3));
assert.equal(q03Log.analysis_group, "respiratory_path_structures");
for (const field of ["is_correct", "hint_used", "corrected_after_hint", "exp_type", "exp_awarded", "concept_id", "checkpoint_id", "teacher_group_id", "verification_status", "answer_json"]) {
  assert(Object.hasOwn(q03Log, field), field);
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "gas_balance_diversity");
api.setState({
  attempt_id: "sequence_collision",
  optionOrders: { [Q(3)]: [...answers[`${Q(3)}_sequence`]] }
});
const q03Order = api.orderedOptions(api.questions.find((question) => question.id === Q(3))).map((item) => item.id);
assert.notDeepEqual(q03Order, answers[`${Q(3)}_sequence`]);
assert.deepEqual(q03Order, api.orderedOptions(api.questions.find((question) => question.id === Q(3))).map((item) => item.id));
const evidenceText = [5, 6, 10, 11, 12, 13, 14].map((n) => api.renderQuestionEvidence(Q(n))).join("\n");
for (const banned of ["薄壁、多數量與微血管", "氧氣和二氧化碳的移動方向", "氧氣較多", "二氧化碳較多", "活動量增加時，細胞對氧氣的需求", "例如肺泡、鰓、氣管系統或氣孔", "行為感應與腎臟排泄水分"]) {
  assert(!evidenceText.includes(banned), banned);
}
const termsEvidenceText = [1, 2].map((n) => api.renderQuestionEvidence(Q(n))).join("\n");
assert(termsEvidenceText.includes("先判斷題目是在說空氣進出身體、氣體被運送"));
assert(!termsEvidenceText.includes("先分辨空氣進出肺的呼吸運動"));
assert(!termsEvidenceText.includes("細胞利用氧氣與養分釋放能量"));
assert(api.renderQuestionEvidence(Q(10)).includes("gas-chart"));
assert(api.renderQuestionEvidence(Q(10)).includes("相對含量"));
assert(api.renderCheckpoint("checkpoint1").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
assert.equal(api.assets.briefingSceneHook, `assets/respiration-homeostasis-briefing-azhe-wide.webp?v=${api.VERSION}`);
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("bq-brief-scene-image"));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server_alias",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  reflection: { question: "我想確認肺泡氣體交換和細胞利用氧氣之間的關係是什麼？" }
});
const localCandidate = {
  ...api.scoreAttempt(),
  direct_exp: 999,
  reflection_exp: 888,
  attempt_exp: 777,
  unit_credited_exp: 777,
  exp_delta: 777,
  earned_badges: ["local_candidate_badge"]
};
const serverMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["respiration_homeostasis_entry"])
  },
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 14,
    total_questions: 14,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["respiration_homeostasis_entry", "respiration_homeostasis_flawless"])
  }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.equal(JSON.stringify(serverMerged.earned_badges), JSON.stringify(["respiration_homeostasis_entry"]));
assert(!serverMerged.earned_badges.includes("local_candidate_badge"));
const serverNoBadges = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: { verification_status: "server_verified", concept_exp: 111, question_exp: 22, attempt_total_exp: 333 }
}, localCandidate);
assert.equal(JSON.stringify(serverNoBadges.earned_badges), JSON.stringify([]));
const pendingMerged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "pending_backend",
  verified_attempt: { verification_status: "pending_backend" }
}, localCandidate);
assert.equal(JSON.stringify(pendingMerged.earned_badges), JSON.stringify(["local_candidate_badge"]));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("<img"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="respiration_homeostasis"'));
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderReview().includes("mentor-card"));

api.setState({
  screen: "result",
  student: {
    student_id: "S24024",
    class_name: "724",
    seat_no: "24",
    student_name: "呼吸測試生",
    profile_gender: "female",
    total_exp: 11200,
    current_title_id: "systems_investigator",
    title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-female.webp",
    progress: {
      source: "server_verified",
      progress_applied: true,
      total_exp: 11200,
      completed_unit_count: 24,
      current_title_id: "systems_investigator",
      title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-female.webp",
      unit_badge_summary_json: JSON.stringify([{ unit_id: "behavior_sensing", earned_count: 0, total_count: 15, earned_badges: [] }])
    }
  },
  attempt_id: "verified_attempt",
  attempt_session_token: "verified_token",
  attempt_session_id: "verified_session",
  question_version: api.QUESTION_VERSION,
  verification_mode: "server_verified",
  submitted: true,
  completedScreens: ["login", "brief", "result", "achievements", "rules"],
  reflection: { question: "" },
  result: { ...api.scoreAttempt(), verification_status: "server_verified", unit_credited_exp: 460, earned_badges: ["respiration_homeostasis_entry", "respiration_homeostasis_flawless"] }
});
context.localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_attempt", unit_id: "respiration_homeostasis", unit_credited_exp: 500 }]));
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
assert(api.renderRules().includes("重新登入／再挑戰"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadAttempts().length, 1);
assert.equal(api.loadVerifiedSnapshot().student_id, "S24024");
assert.equal(api.loadVerifiedSnapshot().total_exp, 11200);

// 2026-10-25 規格對齊（第一批）
{
  const qs = Object.fromEntries(api.questions.map((question) => [question.id, question]));
  // 簡報頁：規格故事引入阿澤老師與貓頭鷹助理，不直接列完整吸吐氣流程或氣體交換答案
  const brief = api.renderBrief();
  assert(brief.includes("阿澤老師") && brief.includes("貓頭鷹助理"), "brief introduces both roles");
  for (const banned of ["橫膈下降", "胸腔變大", "氧氣由肺泡進入血液", "鼻腔或口腔進入"]) assert(!brief.includes(banned), `brief leaks ${banned}`);
  // 準備頁：不直接給 q02／q03／q04／q05／q06／q07–q09 答案
  const scan = api.renderScan();
  for (const banned of ["經氣管、支氣管", "壁薄", "數量多", "微血管", "氧氣進入血液", "二氧化碳進入肺泡", "胸腔變大", "胸腔變小", "細胞利用氧氣和養分釋放能量", "肺泡是氣體交換", "橫膈下降", "橫膈上升"]) assert(!scan.includes(banned), `scan leaks ${banned}`);
  assert(scan.includes("三個判讀方向"));
  // 題前卡：採規格 2026-07-21 文案
  assert(api.renderQuestionEvidence(Q(1)).includes("呼吸概念觀察卡"));
  assert(api.renderQuestionEvidence(Q(3)).includes("空氣路徑觀察卡"));
  assert(api.renderQuestionEvidence(Q(4)).includes("構造位置觀察卡"));
  assert(api.renderQuestionEvidence(Q(5)).includes("肺泡觀察卡"));
  assert(api.renderQuestionEvidence(Q(9)).includes("胸腔變化觀察卡"));
  assert(api.renderQuestionEvidence(Q(10)).includes("資料閱讀卡"));
  assert(api.renderQuestionEvidence(Q(11)).includes("活動情境觀察卡"));
  assert(api.renderQuestionEvidence(Q(12)).includes("生物構造觀察卡"));
  assert(api.renderQuestionEvidence(Q(14)).includes("單元範圍判斷卡"));
  const allEvidence = Array.from({ length: 14 }, (_, i) => api.renderQuestionEvidence(Q(i + 1))).join("\n");
  for (const banned of ["數量多、壁薄", "氧氣由肺泡進入血液", "身體使用氧氣並排出二氧化碳", "人類：", "魚類：鰓"]) assert(!allEvidence.includes(banned), `evidence leaks ${banned}`);
  // q04／q09／q12 配對項目初始順序：不與選項對齊、不按答案成群，依 attempt 穩定且會變化
  for (const n of [4, 9, 12]) {
    const question = qs[Q(n)];
    const seen = new Set();
    for (let seed = 0; seed < 200; seed += 1) {
      api.setState({ attempt_id: `mapping_seed_${seed}` });
      const order = api.orderedMappingItems(question).map((item) => item.id);
      assert.equal(order.length, question.items.length);
      assert.equal(new Set(order).size, question.items.length);
      assert.equal(api.mappingItemsLookGrouped(question, order), false, `q${n} seed ${seed} grouped: ${order}`);
      assert.deepEqual(api.orderedMappingItems(question).map((item) => item.id), order, "stable within attempt");
      seen.add(order.join(","));
    }
    assert(seen.size > 3, `q${n} order should vary across attempts`);
  }
  assert.equal(api.mappingItemsLookGrouped(qs[Q(4)], ["nasal_cavity", "trachea", "bronchi", "alveoli"]), true);
  assert.equal(api.mappingItemsLookGrouped(qs[Q(9)], ["diaphragm_down", "chest_expands", "air_enters_lungs", "diaphragm_up", "chest_smaller", "air_leaves_lungs"]), true);
  assert.equal(api.mappingItemsLookGrouped(qs[Q(9)], ["diaphragm_up", "chest_smaller", "air_leaves_lungs", "diaphragm_down", "chest_expands", "air_enters_lungs"]), true);
  // checkpoint_id 改用規格 IDs
  api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cp_ids", answers, reflection: { question: "" } });
  const cpLogs = Object.fromEntries(api.scoreAttempt().logs.map((log) => [log.question_id, log.checkpoint_id]));
  assert.equal(cpLogs[Q(1)], "respiration_homeostasis_cp1_terms_and_air_path");
  assert.equal(cpLogs[Q(4)], "respiration_homeostasis_cp1_terms_and_air_path");
  assert.equal(cpLogs[Q(10)], "respiration_homeostasis_cp2_alveoli_and_gas_exchange");
  assert.equal(cpLogs[Q(7)], "respiration_homeostasis_cp3_breathing_mechanics");
  assert.equal(cpLogs[Q(9)], "respiration_homeostasis_cp3_breathing_mechanics");
  assert.equal(cpLogs[Q(14)], "respiration_homeostasis_cp4_balance_diversity_boundary");
  // 結算頁新版版面：guest／pending／verified
  const guestResult = api.renderResult();
  assert(guestResult.includes("guest 測試：本次預估") && guestResult.includes("不列入正式累積") && guestResult.includes("本次預估明細總計"));
  assert(!guestResult.includes("正式認列總計"));
  api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "pending_result", answers, reflection: { question: "" }, result: { ...api.scoreAttempt(), verification_status: "pending_backend" } });
  const pendingResult = api.renderResult();
  assert(pendingResult.includes("待後台確認") && pendingResult.includes("本次預估明細總計"));
  api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "verified_result", answers, reflection: { question: "" }, result: { ...api.scoreAttempt(), verification_status: "server_verified", attempt_exp: 420, unit_credited_exp: 480, exp_delta: 0, earned_badges: [] } });
  assert.equal(api.resultMode(), "verified");
  const verifiedResult = api.renderResult();
  assert(verifiedResult.includes("後台已回傳正式認列資料"));
  assert(verifiedResult.includes("本次取得：420") && verifiedResult.includes("本單元正式認列：480 EXP"));
  assert(verifiedResult.includes("正式認列總計") && verifiedResult.includes("480 / 500 EXP"));
  // 提交後捲回頁首
  const submitBody = source.slice(source.indexOf("async function submitMission"), source.indexOf("function renderLogin"));
  assert(submitBody.includes("renderApp();\n  resetViewportScroll();"), "submitMission should reset scroll");
}
console.log("prototype-respiration-homeostasis app regression passed");
