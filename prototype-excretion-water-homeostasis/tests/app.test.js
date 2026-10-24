#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-excretion-water-homeostasis")
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
vm.runInNewContext(source, context, { filename: "prototype-excretion-water-homeostasis/app.js" });
const api = context.window.__excretion_water_homeostasisTest;

assert.equal(api.VERSION, "20261025-excretion-water-homeostasis-spec-sync-v1");
assert.equal(api.QUESTION_VERSION, "20260718-excretion-water-homeostasis-v1");
assert.equal(api.mission.unit_id, "excretion_water_homeostasis");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u24-excretion-water-homeostasis-review"));
assert(!source.includes("question_version: VERSION"));
assert(!source.includes("!== VERSION"));
const staleBadgeCopy = ["正式", "徽章", "素材", "待接"].join("");
const staleBadgeCopyCore = ["徽章", "素材", "待接"].join("");
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes(staleBadgeCopy));
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes(staleBadgeCopyCore));

const Q = (n) => `excretion_water_homeostasis_q${String(n).padStart(2, "0")}`;
const answers = {
  [`${Q(5)}_sequence`]: ["kidney", "ureter", "bladder", "urethra"],
  [Q(1)]: "excretion_not_egestion",
  [Q(2)]: "metabolic_waste_examples",
  [Q(3)]: "nitrogenous_waste_urea_example",
  [Q(4)]: { kidney: "urine_formation", ureter: "urine_to_bladder", bladder: "urine_storage", urethra: "urine_out_body" },
  [Q(6)]: "kidney_forms_urine_from_blood",
  [Q(7)]: "urine_contains_water_urea_salts",
  [Q(8)]: "sweating_less_water_less_urine",
  [Q(9)]: "more_water_more_urine_data",
  [Q(10)]: "water_intake_needed_for_balance",
  [Q(11)]: { drinking_water: "water_gain", water_in_food: "water_gain", urination: "water_loss", sweating: "water_loss" },
  [Q(12)]: "nitrogenous_waste_forms_vary",
  [Q(13)]: "kidney_forms_bladder_stores",
  [Q(14)]: "kidney_urine_belongs_excretion_water"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "excretion_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("excretion_water_homeostasis_flawless"));
assert(score.earned_badges.includes("urine_path_sequence_tracker"));
assert(score.earned_badges.includes("water_gain_loss_classifier"));
assert(score.earned_badges.includes("excretion_unit_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "excretion_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認尿液不是只有水，那腎臟形成尿液和身體維持水分恆定之間要怎麼一起理解？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(11)]: true }, hintEventStatus: { [Q(11)]: "sent" }, reflection: { question: "我想確認飲水、流汗和排尿要怎麼一起判斷水分收支？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("excretion_water_homeostasis_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認排泄和排遺怎麼分辨，為什麼糞便不算排泄？", 40]
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
  reflection: { question: "我想確認排泄和排遺怎麼分辨，為什麼糞便不算排泄？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "excretion_water_homeostasis");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(5)], answers[`${Q(5)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[Q(index)], `${shortId} should mirror full question id`);
}
assert.deepEqual(payload.raw_answers.q05, answers[`${Q(5)}_sequence`]);
assert.deepEqual(payload.raw_answers.q05_sequence, answers[`${Q(5)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(4)], answers[Q(4)]);
assert.deepEqual(payload.raw_answers[Q(11)], answers[Q(11)]);
assert.deepEqual(payload.raw_answers.q04, answers[Q(4)]);
assert.deepEqual(payload.raw_answers.q11, answers[Q(11)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(5)).analysis_group, "urine_path_and_composition");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(11)).analysis_group, "water_balance_data");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "nitrogenous_waste_basics");
for (const field of ["is_correct", "hint_used", "corrected_after_hint", "exp_type", "exp_awarded", "concept_id", "checkpoint_id", "teacher_group_id", "verification_status", "answer_json"]) {
  assert(Object.prototype.hasOwnProperty.call(payload.question_logs[0], field), `question log missing ${field}`);
}
assert.equal(payload.question_logs.find((log) => log.question_id === Q(14)).teacher_group_id, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(14)).checkpoint_id, "excretion_water_homeostasis_cp4_boundary_and_misconceptions");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "urinary_system_functions");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).teacher_group_id, "nitrogenous_waste_basics");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).checkpoint_id, "excretion_water_homeostasis_cp3_water_balance");
api.setState({
  attempt_id: "sequence_collision",
  optionOrders: { [Q(5)]: [...answers[`${Q(5)}_sequence`]] }
});
const q05Order = api.orderedOptions(api.questions.find((question) => question.id === Q(5))).map((item) => item.id);
assert.notDeepEqual(q05Order, answers[`${Q(5)}_sequence`]);
assert.deepEqual(q05Order, api.orderedOptions(api.questions.find((question) => question.id === Q(5))).map((item) => item.id));
assert(api.renderCheckpoint("checkpoint2").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
assert.equal(api.assets.briefingSceneHook, "");
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("brief-scene-fallback"));
assert.equal(api.titleAvatarPath({ profile_gender: "male", title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.png" }), "../shared-assets/title-avatars/title-05-micro_explorer-male.webp");
assert.equal(api.titleAvatarPath({ profile_gender: "female", title_avatar_path: "../shared-assets/title-avatars/title-03-concept_solver-female.jpg?v=old" }), "../shared-assets/title-avatars/title-03-concept_solver-female.webp");
assert.equal(api.titleAvatarPath({ profile_gender: "male", title_avatar_path: "https://example.com/title.png" }), "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp");
assert(api.renderQuestionEvidence(Q(9)).includes("u25-q09-water-intake-urine-output-data-chart"));
assert(api.renderQuestionEvidence(Q(9)).includes("觀察時段"));
assert(api.renderQuestionEvidence(Q(9)).includes("量（mL）"));
assert(!api.renderQuestionEvidence(Q(9)).includes("所以尿量增加"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server_alias",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  reflection: { question: "我想確認排泄和排遺怎麼分辨，為什麼糞便不算排泄？" }
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
    newly_credited_badges_json: JSON.stringify(["excretion_water_homeostasis_entry"])
  },
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 14,
    total_questions: 14,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["excretion_water_homeostasis_entry", "excretion_water_homeostasis_flawless"])
  }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.equal(JSON.stringify(serverMerged.earned_badges), JSON.stringify(["excretion_water_homeostasis_entry"]));
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
assert(!api.renderAchievements().includes('data-bq-unit-achievements="excretion_water_homeostasis"'));
assert(!api.renderAchievements().includes("title-card"));
api.setState({
  student: {
    student_id: "S99999",
    is_guest: false,
    progress: { total_exp: 7800, title_avatar_path: "shared-assets/title-avatars/title-05-micro_explorer-male.png", unit_badge_summary_json: "[]" }
  },
  attempt_id: "server",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  screen: "rules",
  result: api.scoreAttempt()
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
assert(api.renderRules().includes("重新登入／再挑戰"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.loadVerifiedSnapshot().student_id, "S99999");
assert.equal(api.loadVerifiedSnapshot().total_exp, 7800);

// 2026-10-25 規格對齊（第一批）
{
  const qs = Object.fromEntries(api.questions.map((question) => [question.id, question]));
  // 簡報頁：規格故事引入阿澤老師與貓頭鷹助理，不直接列完整泌尿路徑或器官功能答案
  const brief = api.renderBrief();
  assert(brief.includes("阿澤老師") && brief.includes("貓頭鷹助理"), "brief introduces both roles");
  for (const banned of ["輸尿管", "膀胱暫", "尿道排出", "腎臟形成尿液", "尿素、鹽分"]) assert(!brief.includes(banned), `brief leaks ${banned}`);
  // 準備頁：規格三個先備概念，不直接給 q01／q04／q05／q07／q08／q11／q13 答案
  const scan = api.renderScan();
  assert(scan.includes("三個先備概念"));
  for (const phrase of ["排泄不同於排遺", "腎臟與泌尿系統可形成並排出尿液", "飲水、流汗與排尿會影響水分恆定"]) assert(scan.includes(phrase), `scan missing ${phrase}`);
  for (const banned of ["代謝廢物", "食物殘渣", "輸尿管", "膀胱", "尿道", "暫存", "尿素", "鹽分", "食物含水", "尿量可能減少", "尿量增加", "較濃"]) assert(!scan.includes(banned), `scan leaks ${banned}`);
  // 題前卡：規格 2026-07-28 定稿文案，q09 資料圖保留
  assert(api.renderQuestionEvidence(Q(1)).includes("廢物來源觀察卡"));
  assert(api.renderQuestionEvidence(Q(4)).includes("泌尿構造觀察卡"));
  assert(api.renderQuestionEvidence(Q(5)).includes("尿液路徑觀察卡"));
  assert(api.renderQuestionEvidence(Q(13)).includes("腎臟與膀胱觀察卡"));
  assert(api.renderQuestionEvidence(Q(7)).includes("尿液成分觀察卡"));
  assert(api.renderQuestionEvidence(Q(11)).includes("水分收支觀察卡"));
  assert(api.renderQuestionEvidence(Q(9)).includes("u25-q09-water-intake-urine-output-data-chart"));
  assert(api.renderQuestionEvidence(Q(12)).includes("含氮廢物觀察卡"));
  assert(api.renderQuestionEvidence(Q(14)).includes("單元範圍判斷卡"));
  // q04／q11 配對項目初始順序：不與選項對齊、不按答案成群，依 attempt 穩定且會變化
  for (const n of [4, 11]) {
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
  assert.equal(api.mappingItemsLookGrouped(qs[Q(4)], ["kidney", "ureter", "bladder", "urethra"]), true);
  assert.equal(api.mappingItemsLookGrouped(qs[Q(11)], ["drinking_water", "water_in_food", "urination", "sweating"]), true);
  assert.equal(api.mappingItemsLookGrouped(qs[Q(11)], ["sweating", "urination", "water_in_food", "drinking_water"]), true);
  // q05 排序初始順序不等於正解
  for (let seed = 0; seed < 200; seed += 1) {
    api.setState({ attempt_id: `sequence_seed_${seed}` });
    assert.notDeepEqual(api.orderedOptions(qs[Q(5)]).map((step) => step.id), ["kidney", "ureter", "bladder", "urethra"]);
  }
  // checkpoint_id 為規格 IDs、q13／q14 teacher group 依規格
  api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cp_ids", answers, reflection: { question: "" } });
  const cpLogs = Object.fromEntries(api.scoreAttempt().logs.map((log) => [log.question_id, log]));
  assert.equal(cpLogs[Q(3)].checkpoint_id, "excretion_water_homeostasis_cp1_excretion_basics");
  assert.equal(cpLogs[Q(7)].checkpoint_id, "excretion_water_homeostasis_cp2_urinary_system");
  assert.equal(cpLogs[Q(12)].checkpoint_id, "excretion_water_homeostasis_cp3_water_balance");
  assert.equal(cpLogs[Q(13)].checkpoint_id, "excretion_water_homeostasis_cp4_boundary_and_misconceptions");
  assert.equal(cpLogs[Q(13)].teacher_group_id, "urinary_system_functions");
  assert.equal(cpLogs[Q(14)].teacher_group_id, "unit_boundary_control");
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
console.log("prototype-excretion-water-homeostasis app regression passed");
