#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-stimulus-response")
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
vm.runInNewContext(source, context, { filename: "prototype-stimulus-response/app.js" });
const api = context.window.__stimulus_responseTest;

assert.equal(api.VERSION, "20261023-stimulus-response-reflection-spec-v1");
assert.equal(api.QUESTION_VERSION, "20260718-stimulus-response-ready-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "stimulus_response");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 15);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 0);
for (const id of [
  "stimulus_response_entry",
  "stimulus_response_identifier",
  "stimulus_response_misconception_spotter",
  "receptor_effector_matcher",
  "response_pathway_sequencer",
  "role_context_classifier",
  "rapid_response_reasoner",
  "reaction_time_reader",
  "reaction_data_cautious_reader",
  "fair_test_designer",
  "stimulus_response_misconception_reviser",
  "stimulus_response_flawless",
  "stimulus_response_reflection_reporter",
  "retry_growth_stimulus_response",
  "response_evidence_integrator"
]) {
  const badge = api.badges.find((item) => item.id === id);
  assert.equal(badge.image_status, "ready", id);
  assert(badge.badge_image_path.includes(`badge-stimulus_response-${id}.webp?v=${api.VERSION}`), `${id} badge URL must include cache VERSION`);
}
assert(!api.badges.some((badge) => /review|contact|approved|_generated_sources|raw/i.test(badge.badge_image_path)), "runtime badge paths must not point at review/raw/generated assets");
assert(source.includes("BioQuestLoginUX?.begin"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));
assert(!source.includes("function titleAndProgress"), "local title progress calculator must stay removed");
assert(!source.includes("titleAndProgress("), "achievements must not use localGain/result EXP to calculate title");

const Q = (n) => `stimulus_response_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "bell_sound",
  [Q(2)]: "pull_hand",
  [Q(3)]: { hot_cup: "stimulus", pull_hand: "response", bright_light: "stimulus", blink: "response" },
  [Q(4)]: "movement_is_response",
  [Q(5)]: "eye_receptor",
  [Q(6)]: "leg_muscle",
  [`${Q(7)}_sequence`]: ["stimulus_appears", "receptor_receives", "signal_coordination", "effector_acts", "response_happens"],
  [Q(8)]: { food_smell: "stimulus", nose_receptor: "receptor", neck_muscle: "effector", turn_head: "response" },
  [Q(9)]: "not_always_conscious",
  [Q(10)]: "reaction_time",
  [Q(11)]: "second_shorter",
  [Q(12)]: "practice_possible",
  [Q(13)]: "controlled_repeated",
  [Q(14)]: "single_trial_caution"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "circulation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("stimulus_response_flawless"));
assert(score.earned_badges.includes("response_pathway_sequencer"));
assert(score.earned_badges.includes("reaction_time_reader"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "stimulus_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認同一人連續測五次變快時，怎麼判斷是練習造成，還是疲勞造成？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);
assert.deepEqual(Array.from(api.REPORT_DIRECTIONS), ["刺激與反應辨識", "受器與動器", "基本流程", "反應不一定都先思考", "反應時間", "影響反應時間的因素"], "report directions follow spec q15");
assert.deepEqual(Array.from(api.reflectionRules.copiedDirections), ["刺激與反應", "受器與動器", "基本流程", "反應時間", "影響反應時間的因素", "公平測量"], "frontend copied-direction preview stays aligned with backend registry until W9 is decided");
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "stimulus_reflection_fields", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { confident: "受器接收刺激", uncertain: "反應時間資料", direction: "影響反應時間的因素", question: "我想確認連續測五次變快時，怎麼分辨是練習還是注意力造成？", confidence: "2" } });
const reflectionPayload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(reflectionPayload.uncertain_concept, "反應時間資料");
assert.equal(reflectionPayload.confidence_score, "2", "backend reads confidence_score");
assert.equal(reflectionPayload.confidence_level, "2");
assert.equal(reflectionPayload.question_direction, "影響反應時間的因素");
assert.equal(reflectionPayload.report_question_id, "stimulus_response_reflection_report");
const reflectionHtml = api.renderReflection();
assert(reflectionHtml.includes("這次任務中，我最能掌握的一項刺激與反應概念是什麼？"));
assert(reflectionHtml.includes("我還不確定刺激/反應、受器/動器、流程順序或反應時間資料中的哪一部分？"));
assert(reflectionHtml.includes("完成任務後，我對「刺激與反應」的理解信心是幾分？"));
assert(reflectionHtml.includes("5 分代表我能自己說明本單元重點概念"));
assert(reflectionHtml.includes("可以先想：你最容易混淆的是角色名稱、流程順序，還是資料判讀。"));
assert(!reflectionHtml.includes("例如："), "reflection placeholders should be keywords, not copyable sentences");
assert.equal((reflectionHtml.match(/data-direction=/g) || []).length, 6);
assert(reflectionHtml.includes('data-direction="影響反應時間的因素" aria-pressed="true"'));
api.setState({ answers, hints: {} });
assert.equal(api.conceptFeedback().stable.length, 6, "all 6 spec stable sentences when all correct without hints");
const srSentence = "你能區分刺激是先被感受到的變化，反應是生物做出的結果。";
const roleSentence = "你能分辨受器和動器的基本角色。";
const pathwaySentence = "你能把刺激到反應的基礎流程排成合理順序。";
const timeSentence = "你能用反應時間資料判斷哪一次反應較快。";
const fairSentence = "你能注意反應時間測量需要控制條件與多次資料。";
api.setState({ answers, hints: { [Q(2)]: true } });
assert(api.conceptFeedback().stable.includes(srSentence), "4/4 correct (100%) counts as stable even with a hint");
api.setState({ answers: { ...answers, [Q(3)]: { hot_cup: "response", pull_hand: "stimulus", bright_light: "stimulus", blink: "response" } }, hints: {} });
assert(!api.conceptFeedback().stable.includes(srSentence), "3/4 correct (75%) is not stable");
assert(api.conceptFeedback().missed.includes("stimulus_response_confusion"));
api.setState({ answers: { ...answers, [Q(6)]: "ear_receptor" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(roleSentence), "2/3 correct (67%) is not stable");
api.setState({ answers, hints: { [Q(7)]: true } });
assert(!api.conceptFeedback().stable.includes(pathwaySentence), "single question with hint is not stable");
api.setState({ answers: { ...answers, [Q(11)]: "first_larger" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(timeSentence), "1/2 correct is not stable");
api.setState({ answers: { ...answers, [Q(14)]: "cannot_measure" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(fairSentence), "2/3 correct is not stable");
assert(!api.conceptFeedback().stable.includes("公平測量"), "stable list uses spec sentences, not concept labels");
api.setState({ answers: { ...answers, [Q(1)]: "turn_head" }, hints: {} });
assert(api.renderReview().includes("剛才有幾個概念還值得再確認：刺激是先被感受到的變化，反應是生物做出的動作或生理變化。"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(7)]: true }, hintEventStatus: { [Q(7)]: "sent" }, reflection: { question: "我想確認受器和動器如何在同一個情境中分開判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("stimulus_response_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認同一人連續測五次變快時，怎麼判斷是練習造成，還是疲勞造成？", 40]
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
  reflection: { question: "我想確認受器和動器如何在同一個情境中分開判斷？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "stimulus_response");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(7)], answers[`${Q(7)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const questionId = Q(index);
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[questionId], `${shortId} should mirror ${questionId}`);
}
assert.deepEqual(payload.raw_answers.q07_sequence, answers[`${Q(7)}_sequence`]);
assert(!source.includes("arteries_veins_connect"));
assert(!source.includes("blood_components_carry"));
assert(!source.includes("神經元"));
assert(!source.includes("中樞"));
assert(api.questions.find((question) => question.id === Q(7)).steps.length === 5);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(3)).analysis_group, "stimulus_response_identification");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "reaction_time_reasoning");
assert(api.renderCheckpoint("checkpoint2").includes("上移"));
assert.equal(api.renderQuestionEvidence(Q(12)), "", "q12 evidence card should be removed");
assert(!api.renderQuestionEvidence(Q(5)).includes("受器負責接收刺激"), "q05 evidence must not give direct role definitions");
assert(!api.renderQuestionEvidence(Q(9)).includes("不一定都先經過"), "q09 evidence must not leak the answer direction");
assert(!api.renderQuestionEvidence(Q(10)).includes("反應時間"), "q10 evidence must avoid naming the answer concept");
assert.equal(api.assets.briefingSceneHook, ["assets", "stimulus-response-briefing-azhe-wide.webp"].join("/"));
assert.equal(api.assets.ambientBackgroundHook, ["assets", "stimulus-response-entry-wide.webp"].join("/"));
assert(api.renderBrief().includes("bq-brief-scene-image"));
assert(api.renderScan().includes("prep-owl-hero"));
assert(!api.renderReview().includes("<img"), "review mentor image must be injected once by shared helper");
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "guest_result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" }, result: api.scoreAttempt(), submitted: true });
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("正式認列／累積增量") && api.renderResult().includes("不列入正式累積") && api.renderResult().includes("本次預估明細總計"));
assert(api.renderResult().includes('data-relogin="true"'));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("本單元 15 枚徽章"));
assert(api.renderAchievements().includes('data-bq-achievements-overview-only="true"'));
assert(api.renderAchievements().includes('data-relogin="true"'));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="stimulus_response"'));
assert(!api.renderAchievements().includes("本單元 15 枚徽章"));
assert(!api.renderAchievements().includes("學生稱號角色"));
assert(!api.renderAchievements().includes("全冊稱號"));
assert(api.renderRules().includes('data-relogin="true"'));
assert.equal(api.canUseNav("login"), true);
const localCandidate = {
  ...api.scoreAttempt(),
  direct_exp: 999,
  reflection_exp: 888,
  attempt_exp: 777,
  unit_credited_exp: 999,
  earned_badges: ["local_candidate_badge"]
};
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
    badges_json: JSON.stringify(["stimulus_response_entry", "response_pathway_sequencer"])
  },
  attempt_result: JSON.stringify({
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["stimulus_response_entry", "response_pathway_sequencer"])
  }),
  student_progress: { total_exp: 8888, current_title_id: "systems_investigator", unit_badge_summary_json: "[]" }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["stimulus_response_entry", "response_pathway_sequencer"]);
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
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_1", unit_id: "stimulus_response" }]));
api.setState({
  student: {
    student_id: "S70102",
    class_name: "701",
    seat_no: "02",
    student_name: "正式學生",
    progress: {
      total_exp: 8600,
      current_title_id: "systems_investigator",
      unit_badge_summary_json: JSON.stringify([{ unit_id: "human_circulation", earned_count: 4 }])
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
assert.equal(snapshot.progress.total_exp, 8600);
assert(snapshot.progress.unit_badge_summary_json.includes("human_circulation"));
// 2026-10-22 規格對齊：簡報角色引入、準備頁規格四線索不洩答、第 2 關導言不列流程順序、q07 初始順序防撞、結算頁新版版面
api.setState({ student: { student_id: "guest", is_guest: true, progress: {} } });
const briefHtml = api.renderBrief();
assert(briefHtml.includes("阿澤老師") && briefHtml.includes("貓頭鷹助理"), "brief should introduce both characters per spec story");
const scanHtml = api.renderScan();
assert.equal((scanHtml.match(/<article>/g) || []).length, 4, "scan should list the four spec clues");
for (const clue of ["刺激是可被感受的變化", "受器接收刺激", "動器產生反應", "反應時間可受注意力、疲勞與測量方式影響"]) {
  assert(scanHtml.includes(clue), `scan should include spec clue: ${clue}`);
}
for (const leak of ["眼、耳", "肌肉", "腺體", "刺激出現到做出反應所花的時間", "訊息經過協調後"]) {
  assert(!scanHtml.includes(leak), `scan must not reveal answer text: ${leak}`);
}
assert(!api.renderCheckpoint("checkpoint2").includes("接收刺激、訊息協調、產生反應"), "checkpoint2 lead must not list the q07 order");
const q07 = api.questions.find((q) => q.id === Q(7));
api.setState({ attempt_id: "u20-collision", optionOrders: { [Q(7)]: [...q07.answer] } });
assert.notDeepEqual(Array.from(api.orderedOptions(q07).map((item) => item.id)), Array.from(q07.answer), "q07 stored collision should be guarded");
const guardedOnce = api.orderedOptions(q07).map((item) => item.id);
assert.deepEqual(guardedOnce, api.orderedOptions(q07).map((item) => item.id), "q07 guarded order should stay stable within one attempt");
for (let n = 0; n < 200; n += 1) {
  api.setState({ attempt_id: `u20-seed-${n}` });
  assert.notDeepEqual(Array.from(api.orderedOptions(q07).map((item) => item.id)), Array.from(q07.answer), `q07 initial order must not equal answer (seed ${n})`);
}
api.setState({ student: { student_id: "S70101", is_guest: false, progress: {} }, submitted: true, result: { ...api.scoreAttempt(), verification_status: "server_verified", attempt_exp: 480, unit_credited_exp: 500, exp_delta: 20 } });
const verifiedHtml = api.renderResult();
assert(verifiedHtml.includes("後台已回傳正式認列資料") && verifiedHtml.includes("本單元正式認列") && verifiedHtml.includes("正式認列總計"), "verified result should use the new official layout");
assert(verifiedHtml.includes("500 / 500 EXP") && verifiedHtml.includes("本次取得：480"), "verified summary should separate attempt EXP and unit credit");
console.log("prototype-stimulus-response app regression passed");
