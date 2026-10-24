#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-endocrine-system")
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
vm.runInNewContext(source, context, { filename: "prototype-endocrine-system/app.js" });
const api = context.window.__endocrine_systemTest;

assert.equal(api.VERSION, "20261024-endocrine-system-reflection-spec-v1");
assert.equal(api.QUESTION_VERSION, "20260718-endocrine-system-ready-v1");
assert.equal(api.mission.unit_id, "endocrine_system");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert(!/question_version:\s*VERSION/.test(source));
assert(!/question_version\s*!==\s*VERSION/.test(source));
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u22-endocrine-system"));
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `endocrine_system_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "endocrine_gland_secretes_hormones",
  [Q(2)]: "hormone_travels_in_blood",
  [Q(3)]: "hormone_targets_specific_organs",
  [`${Q(4)}_sequence`]: ["gland_secretes", "hormone_enters_blood", "blood_transports", "target_reached", "target_responds"],
  [Q(5)]: { pituitary: "growth_regulation", thyroid: "metabolism_growth", pancreatic_islets: "blood_glucose", adrenal: "emergency_response" },
  [Q(6)]: "pituitary_growth_regulation",
  [Q(7)]: "thyroid_metabolism_growth",
  [Q(8)]: "gonads_reproduction_development",
  [Q(9)]: "insulin_lowers_blood_glucose",
  [Q(10)]: "glucagon_raises_blood_glucose",
  [Q(11)]: "insulin_data_lowers_glucose",
  [Q(12)]: "hormones_need_balance",
  [Q(13)]: "insulin_glucagon_opposite_directions",
  [Q(14)]: "nerve_endocrine_different_coordination"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "endocrine_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("endocrine_system_flawless"));
assert(score.earned_badges.includes("hormone_blood_target_tracker"));
assert(score.earned_badges.includes("insulin_glucagon_balancer"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "endocrine_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認胰島素和升糖素為什麼作用方向不同，卻都和血糖調節有關？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

assert.deepEqual(Array.from(api.REPORT_DIRECTIONS), ["內分泌腺與激素", "血液運送", "目標器官", "主要腺體功能", "胰島素/升糖素", "神經調節和激素調節比較"], "report directions follow spec q15");
assert.deepEqual(Array.from(api.reflectionRules.copiedDirections), Array.from(api.REPORT_DIRECTIONS), "copied-direction list matches backend registry and spec q15");
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "endocrine_reflection_fields", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: {}, reflection: { confident: "激素經血液運送", uncertain: "目標器官", direction: "胰島素/升糖素", question: "我想確認飯後血糖上升時，胰島素增加後血糖為什麼要過一段時間才下降？", confidence: "2" } });
const reflectionPayload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(reflectionPayload.uncertain_concept, "目標器官");
assert.equal(reflectionPayload.confidence_score, "2", "backend reads confidence_score");
assert.equal(reflectionPayload.confidence_level, "2");
assert.equal(reflectionPayload.question_direction, "胰島素/升糖素");
assert.equal(reflectionPayload.report_question_id, "endocrine_system_reflection_report");
const reflectionHtml = api.renderReflection();
assert(reflectionHtml.includes("這次任務中，我最能掌握的一項內分泌系統概念是什麼？"));
assert(reflectionHtml.includes("我還不確定內分泌腺/激素、血液運送、目標器官、腺體功能或血糖調節中的哪一部分？"));
assert(reflectionHtml.includes("完成任務後，我對「內分泌系統」的理解信心是幾分？"));
assert(reflectionHtml.includes("5 分代表我能自己說明本單元重點概念"));
assert(reflectionHtml.includes("可以先想：你最容易混淆的是運送方式、腺體功能，還是血糖調節方向。"));
assert(!reflectionHtml.includes("例如："), "reflection placeholders should be keywords, not copyable sentences");
assert.equal((reflectionHtml.match(/data-direction=/g) || []).length, 6);
assert(reflectionHtml.includes('data-direction="胰島素/升糖素" aria-pressed="true"'));
api.setState({ answers, hints: {} });
assert.equal(api.conceptFeedback().stable.length, 7, "all 7 spec stable sentences when all correct without hints");
const glandSentence = "你能說明內分泌腺會分泌激素。";
const bloodSentence = "你能理解激素通常經血液運送到身體各處。";
const compareSentence = "你能比較神經調節與激素調節的差異。";
const glandRoleSentence = "你能將主要內分泌腺和功能方向配對。";
const glucoseSentence = "你能判斷胰島素與升糖素對血糖的基本作用方向。";
const balanceSentence = "你能理解激素需要適量，不是越多越好。";
api.setState({ answers, hints: { [Q(1)]: true } });
assert(!api.conceptFeedback().stable.includes(glandSentence), "single question with hint is not stable");
api.setState({ answers: { ...answers, [`${Q(4)}_sequence`]: ["target_responds", "target_reached", "blood_transports", "hormone_enters_blood", "gland_secretes"] }, hints: {} });
assert(!api.conceptFeedback().stable.includes(bloodSentence), "1/2 correct is not stable");
api.setState({ answers, hints: { [Q(5)]: true } });
assert(api.conceptFeedback().stable.includes(glandRoleSentence), "4/4 correct (100%) counts as stable even with a hint");
api.setState({ answers: { ...answers, [Q(7)]: "wrong_choice" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(glandRoleSentence), "3/4 correct (75%) is not stable");
api.setState({ answers: { ...answers, [Q(11)]: "wrong_choice" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(glucoseSentence), "3/4 correct (75%) is not stable");
api.setState({ answers, hints: { [Q(12)]: true } });
assert(!api.conceptFeedback().stable.includes(balanceSentence), "single question with hint is not stable");
api.setState({ answers: { ...answers, [Q(14)]: "wrong_choice" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(compareSentence));
assert(api.conceptFeedback().missed.includes("nerve_endocrine_same"));
assert(!api.conceptFeedback().stable.includes("目標器官"), "stable list uses spec sentences, not concept labels");
api.setState({ answers: { ...answers, [Q(1)]: "wrong_choice" }, hints: {} });
assert(api.renderReview().includes("剛才有幾個概念還值得再確認：內分泌腺會分泌激素，激素可協助調節身體活動。"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(4)]: true }, hintEventStatus: { [Q(4)]: "sent" }, reflection: { question: "我想確認激素為什麼經血液運送後只讓目標器官產生反應？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("endocrine_system_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認胰島素和升糖素為什麼作用方向不同，卻都和血糖調節有關？", 40]
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
  reflection: { question: "我想確認激素為什麼經血液運送後只讓目標器官產生反應？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "endocrine_system");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(4)], answers[`${Q(4)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[Q(index)], `${shortId} should mirror full question id`);
}
assert.deepEqual(payload.raw_answers.q04_sequence, answers[`${Q(4)}_sequence`]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(3)).analysis_group, "hormone_basics");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "blood_glucose_balance");
api.setState({
  student: { student_id: "guest", is_guest: true },
  attempt_id: "guard",
  attempt_session_token: "guest",
  question_version: api.QUESTION_VERSION,
  optionOrders: { [Q(4)]: [...answers[`${Q(4)}_sequence`]] }
});
const guardedQ04 = api.orderedOptions(api.questions.find((question) => question.id === Q(4))).map((item) => item.id);
assert.notDeepEqual(guardedQ04, answers[`${Q(4)}_sequence`], "q04 initial order must not equal canonical sequence");
assert.deepEqual(api.orderedOptions(api.questions.find((question) => question.id === Q(4))).map((item) => item.id), guardedQ04, "q04 guarded order should remain stable");
assert(api.renderCheckpoint("checkpoint1").includes("上移"));
assert.equal(api.assets.briefingSceneHook, `assets/endocrine-system-briefing-azhe-wide.webp?v=${api.VERSION}`);
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("bq-brief-scene-image"));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("<img"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="endocrine_system"'));
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderAchievements().includes("學生稱號角色"));
assert(api.renderQuestionEvidence(Q(1)).includes("訊息來源閱讀"));
assert(!api.renderQuestionEvidence(Q(1)).includes("分泌激素的腺體、運送方式"));
assert(api.renderQuestionEvidence(Q(5)).includes("腺體功能閱讀"));
assert(!api.renderQuestionEvidence(Q(5)).includes("生長與調節、代謝、血糖、緊急狀態，以及生殖與青春期發育"));
assert(api.renderQuestionEvidence(Q(12)).includes("調節量閱讀"));
assert(!api.renderQuestionEvidence(Q(12)).includes("調節重點不是越多越好"));
assert(api.renderQuestionEvidence(Q(14)).includes("協調方式閱讀"));
assert(!api.renderQuestionEvidence(Q(14)).includes("神經訊息通常較快且路徑明確"));
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
    newly_credited_badges_json: JSON.stringify(["endocrine_system_entry"])
  },
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 14,
    total_questions: 14,
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["endocrine_system_entry", "endocrine_system_flawless"])
  }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.equal(JSON.stringify(serverMerged.earned_badges), JSON.stringify(["endocrine_system_entry"]));
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
api.setState({
  screen: "result",
  student: {
    student_id: "S99022",
    class_name: "722",
    seat_no: "22",
    student_name: "內分泌測試生",
    progress: {
      total_exp: 10400,
      current_title_id: "systems_investigator",
      title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-male.webp",
      completed_unit_count: 22,
      unit_badge_summary_json: "[]"
    }
  },
  attempt_id: "submitted_attempt",
  attempt_session_token: "submitted_token",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  completedScreens: ["login", "brief", "result", "achievements", "rules"],
  result: { ...api.scoreAttempt(), verification_status: "server_verified" }
});
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_attempt", unit_id: "endocrine_system" }]));
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
assert.equal(api.loadVerifiedSnapshot().student_id, "S99022");
assert.equal(api.loadVerifiedSnapshot().total_exp, 10400);
// 2026-10-24 規格對齊：任務區域、簡報角色引入、準備頁中性判讀方向不洩答、q04 初始順序防撞（多種子）、結算頁新版版面
api.setState({ student: { student_id: "guest", is_guest: true, progress: {} } });
assert.equal(api.mission.mission_area, "反應控制室", "mission area should follow spec");
const briefHtml = api.renderBrief();
assert(briefHtml.includes("阿澤老師") && briefHtml.includes("貓頭鷹助理"), "brief should introduce both characters per spec story");
const scanHtml = api.renderScan();
assert.equal((scanHtml.match(/<article>/g) || []).length, 4, "scan should list four reading directions");
for (const leak of ["分泌激素", "經血液", "隨血液", "目標器官", "胰島素", "升糖素", "血糖降低", "血糖升高", "適量", "腦垂腺", "甲狀腺", "較快", "較慢"]) {
  assert(!scanHtml.includes(leak), `scan must not reveal answer text: ${leak}`);
}
const q04Guard = api.questions.find((q) => q.id === Q(4));
for (let n = 0; n < 200; n += 1) {
  api.setState({ attempt_id: `u22-seed-${n}` });
  assert.notDeepEqual(Array.from(api.orderedOptions(q04Guard).map((item) => item.id)), Array.from(q04Guard.answer), `q04 initial order must not equal answer (seed ${n})`);
}
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "guest_result_layout", answers, result: api.scoreAttempt(), submitted: true });
const guestResultHtml = api.renderResult();
assert(guestResultHtml.includes("正式認列／累積增量") && guestResultHtml.includes("不列入正式累積") && guestResultHtml.includes("本次預估明細總計"), "guest result should use the new estimate layout");
api.setState({ student: { student_id: "S22001", is_guest: false, progress: {} }, submitted: true, result: { ...api.scoreAttempt(), verification_status: "server_verified", attempt_exp: 480, unit_credited_exp: 500, exp_delta: 20 } });
const verifiedHtml = api.renderResult();
assert(verifiedHtml.includes("後台已回傳正式認列資料") && verifiedHtml.includes("本單元正式認列") && verifiedHtml.includes("正式認列總計"), "verified result should use the new official layout");
assert(verifiedHtml.includes("500 / 500 EXP") && verifiedHtml.includes("本次取得：480"), "verified summary should separate attempt EXP and unit credit");
assert.equal(api.resultMode(), "verified");
console.log("prototype-endocrine-system app regression passed");
