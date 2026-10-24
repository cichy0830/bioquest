#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-nervous-system")
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
vm.runInNewContext(source, context, { filename: "prototype-nervous-system/app.js" });
const api = context.window.__nervous_systemTest;

assert.equal(api.VERSION, "20261024-nervous-system-reflection-spec-v1");
assert.equal(api.QUESTION_VERSION, "20260718-nervous-system-ready-v1");
assert.equal(api.mission.unit_id, "nervous_system");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 15);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("正式徽章素材待接"));

const Q = (n) => `nervous_system_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "neuron_transmits_messages",
  [Q(2)]: "neuron_cell_nerve_bundle",
  [Q(3)]: { brain: "central", spinal_cord: "central", arm_nerve: "peripheral", leg_nerve: "peripheral" },
  [Q(4)]: "peripheral_nerves_connect_body_cns",
  [Q(5)]: "sensory_neuron_to_cns",
  [Q(6)]: "motor_neuron_to_effector",
  [Q(7)]: { sensory: "to_cns", interneuron: "inside_cns", motor: "to_effector" },
  [`${Q(8)}_sequence`]: ["skin_receptor", "sensory_to_spinal", "interneuron_spinal", "motor_to_muscle", "muscle_contract"],
  [Q(9)]: "reflex_still_nervous_system",
  [Q(10)]: "spinal_cord_cns_reflex",
  [Q(11)]: "skull_protects_brain",
  [Q(12)]: "brain_awareness_after_reflex",
  [Q(13)]: { to_cns: "sensory", inside_spinal: "interneuron", to_muscle: "motor", muscle_contract: "effector" },
  [Q(14)]: "nervous_system_more_than_brain"
};

assert(!/question_version:\s*VERSION/.test(source), "runtime cache VERSION must not be used as backend question_version");
assert(!/question_version\s*!==\s*VERSION/.test(source), "startAttempt gate must compare against QUESTION_VERSION");

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "nervous_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("nervous_system_flawless"));
assert(score.earned_badges.includes("signal_pathway_sequencer"));
assert(score.earned_badges.includes("sensory_motor_interneuron_router"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "nervous_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認反射為什麼不一定先經過大腦完整思考，卻仍然算神經系統控制？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

assert.deepEqual(Array.from(api.REPORT_DIRECTIONS), ["神經元與神經", "腦與脊髓", "周圍神經", "感覺/運動/中間神經元", "反射路徑", "反射和大腦的關係"], "report directions follow spec q15");
assert.deepEqual(Array.from(api.reflectionRules.copiedDirections), Array.from(api.REPORT_DIRECTIONS), "copied-direction list matches backend registry and spec q15");
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "nervous_reflection_fields", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: {}, reflection: { confident: "感覺神經元傳向中樞", uncertain: "中間神經元", direction: "反射和大腦的關係", question: "我想確認縮手之後才感到痛，是不是代表腦比較晚收到訊息？", confidence: "2" } });
const reflectionPayload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(reflectionPayload.uncertain_concept, "中間神經元");
assert.equal(reflectionPayload.confidence_score, "2", "backend reads confidence_score");
assert.equal(reflectionPayload.confidence_level, "2");
assert.equal(reflectionPayload.question_direction, "反射和大腦的關係");
assert.equal(reflectionPayload.report_question_id, "nervous_system_reflection_report");
const reflectionHtml = api.renderReflection();
assert(reflectionHtml.includes("這次任務中，我最能掌握的一項神經系統概念是什麼？"));
assert(reflectionHtml.includes("我還不確定神經元/神經、中樞/周圍神經、神經元分工或反射路徑中的哪一部分？"));
assert(reflectionHtml.includes("完成任務後，我對「神經系統」的理解信心是幾分？"));
assert(reflectionHtml.includes("5 分代表我能自己說明本單元重點概念"));
assert(reflectionHtml.includes("可以先想：你最容易混淆的是構造位置、訊息方向，還是反射路徑。"));
assert(!reflectionHtml.includes("例如："), "reflection placeholders should be keywords, not copyable sentences");
assert.equal((reflectionHtml.match(/data-direction=/g) || []).length, 6);
assert(reflectionHtml.includes('data-direction="反射和大腦的關係" aria-pressed="true"'));
api.setState({ answers, hints: {} });
assert.equal(api.conceptFeedback().stable.length, 6, "all 6 spec stable sentences when all correct without hints");
const neuronSentence = "你能說明神經元和訊息傳遞的關係。";
const cnsSentence = "你能分辨中樞神經系統與周圍神經系統。";
const directionSentence = "你能用訊息方向判斷感覺神經元與運動神經元。";
const pathwaySentence = "你能整理反射路徑的基本順序。";
const reflexSentence = "你能理解反射仍由神經系統控制，不一定先經過有意識思考。";
api.setState({ answers, hints: { [Q(1)]: true } });
assert(!api.conceptFeedback().stable.includes(neuronSentence), "single question with hint is not stable");
api.setState({ answers, hints: { [Q(3)]: true } });
assert(api.conceptFeedback().stable.includes(cnsSentence), "4/4 correct (100%) counts as stable even with a hint");
api.setState({ answers: { ...answers, [Q(14)]: "wrong_choice" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(cnsSentence), "3/4 correct (75%) is not stable");
assert(api.conceptFeedback().missed.includes("nervous_system_brain_only"));
api.setState({ answers: { ...answers, [Q(6)]: "wrong_choice" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(directionSentence), "3/4 correct (75%) is not stable");
api.setState({ answers, hints: { [Q(8)]: true } });
assert(!api.conceptFeedback().stable.includes(pathwaySentence), "single sequence question with hint is not stable");
api.setState({ answers: { ...answers, [Q(12)]: "wrong_choice" }, hints: {} });
assert(!api.conceptFeedback().stable.includes(reflexSentence), "1/2 correct is not stable");
assert(!api.conceptFeedback().stable.includes("反射路徑"), "stable list uses spec sentences, not concept labels");
api.setState({ answers: { ...answers, [Q(2)]: "wrong_choice" }, hints: {} });
assert(api.renderReview().includes("剛才有幾個概念還值得再確認：神經元是細胞，神經是許多神經纖維集合成的訊息通道。"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(8)]: true }, hintEventStatus: { [Q(8)]: "sent" }, reflection: { question: "我想確認感覺神經元和運動神經元怎麼用訊息方向判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("nervous_system_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認反射為什麼不一定先經過大腦完整思考，卻仍然算神經系統控制？", 40]
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
  reflection: { question: "我想確認感覺神經元和運動神經元怎麼用訊息方向判斷？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "nervous_system");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(8)], answers[`${Q(8)}_sequence`]);
for (let index = 1; index <= 14; index += 1) {
  const questionId = Q(index);
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[questionId], `${shortId} should mirror ${questionId}`);
}
assert.deepEqual(payload.raw_answers.q08_sequence, answers[`${Q(8)}_sequence`]);
const q08 = api.questions.find((question) => question.id === Q(8));
api.setState({ attempt_id: "u21-forced-collision", optionOrders: { [Q(8)]: [...q08.answer] } });
assert.notDeepEqual(Array.from(api.orderedOptions(q08).map((item) => item.id)), Array.from(q08.answer), "q08 stored collision should be guarded");
const guardedOnce = api.orderedOptions(q08).map((item) => item.id);
const guardedTwice = api.orderedOptions(q08).map((item) => item.id);
assert.deepEqual(guardedOnce, guardedTwice, "q08 guarded order should stay stable within one attempt");
api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server_alias",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  reflection: { question: "我想確認感覺神經元和運動神經元怎麼用訊息方向判斷？" }
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
    badges_json: JSON.stringify(["nervous_system_entry", "signal_pathway_sequencer"])
  },
  attempt_result: JSON.stringify({
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["nervous_system_entry", "signal_pathway_sequencer"])
  }),
  student_progress: { total_exp: 8888, current_title_id: "systems_investigator", unit_badge_summary_json: "[]" }
}, localCandidate);
assert.equal(serverMerged.direct_exp, 111);
assert.equal(serverMerged.reflection_exp, 22);
assert.equal(serverMerged.attempt_exp, 333);
assert.deepEqual(Array.from(serverMerged.earned_badges), ["nervous_system_entry", "signal_pathway_sequencer"]);
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
assert(!source.includes("反應時間"));
assert(!source.includes("公平測量"));
assert(api.questions.find((question) => question.id === Q(8)).steps.length === 5);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(3)).analysis_group, "neuron_central_peripheral");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(12)).analysis_group, "reflex_cns_reasoning");
assert(api.renderCheckpoint("checkpoint2").includes("上移"));
assert(api.renderQuestionEvidence(Q(1)).includes("層級閱讀"));
assert(!api.renderQuestionEvidence(Q(3)).includes("腦與脊髓屬於中樞"), "q03 evidence must not directly give classification");
assert(!api.renderQuestionEvidence(Q(5)).includes("感覺神經元把訊息傳向中樞"), "q05 evidence must not directly give role definitions");
assert(!api.renderQuestionEvidence(Q(9)).includes("仍需要神經系統傳遞與協調"), "q09 evidence must not directly state answer direction");
assert(!api.renderQuestionEvidence(Q(10)).includes("腦與脊髓是中樞神經系統"), "q10 evidence must not directly name the classification");
assert.equal(api.assets.briefingSceneHook, "assets/nervous-system-briefing-azhe-wide.webp");
assert.equal(api.assets.ambientBackgroundHook, "assets/nervous-system-entry-wide.webp");
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
const achievementsHtml = api.renderAchievements();
assert(achievementsHtml.includes('data-bq-achievements-overview-only="true"'));
assert(achievementsHtml.includes("重新登入／再挑戰"));
assert(!achievementsHtml.includes('data-bq-unit-achievements="nervous_system"'));
assert(!achievementsHtml.includes("本單元 15 枚徽章"));
assert(!achievementsHtml.includes("title-card"));
assert(!achievementsHtml.includes("學生稱號角色"));

api.setState({
  student: {
    student_id: "S21001",
    class_name: "721",
    seat_no: "01",
    student_name: "正式測試",
    progress: {
      source: "server_verified",
      total_exp: 9800,
      completed_unit_count: 21,
      current_title_id: "systems_investigator",
      unit_badge_summary_json: JSON.stringify([{ unit_id: "stimulus_response", earned_count: 8, total_count: 15 }])
    }
  },
  submitted: true,
  screen: "result",
  attempt_id: "server_attempt",
  attempt_session_token: "server_token",
  answers,
  hints: { [Q(2)]: true },
  reflection: { question: "我想確認神經元和神經如何分辨？" },
  result: api.scoreAttempt(),
  completedScreens: ["login", "brief", "result", "achievements", "rules"]
});
store.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "old_attempt", unit_id: "nervous_system", unit_credited_exp: 500 }]));
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'), "submitted rules should return to result");
assert(api.renderRules().includes("重新登入／再挑戰"));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadAttempts().length, 1, "attempt history should be preserved");
const snapshot = api.loadVerifiedSnapshot();
assert.equal(snapshot.student_id, "S21001");
assert.equal(snapshot.total_exp, 9800);
assert.equal(snapshot.progress.completed_unit_count, 21);
// 2026-10-24 規格對齊：簡報角色引入、準備頁規格三句先備概念不洩答、q08 初始順序防撞（多種子）、結算頁新版版面
api.setState({ student: { student_id: "guest", is_guest: true, progress: {} } });
assert.equal(api.mission.mission_area, "反應控制室", "mission area should follow spec");
const briefHtml = api.renderBrief();
assert(briefHtml.includes("阿澤老師") && briefHtml.includes("貓頭鷹助理"), "brief should introduce both characters per spec story");
const scanHtml = api.renderScan();
assert.equal((scanHtml.match(/<article>/g) || []).length, 3, "scan should list the three spec prerequisites");
for (const clue of ["刺激會被受器接收", "神經系統負責傳遞與協調訊息", "動器依訊息產生反應"]) {
  assert(scanHtml.includes(clue), `scan should include spec clue: ${clue}`);
}
for (const leak of ["神經纖維集合", "腦與脊髓屬", "周圍神經", "感覺神經元", "運動神經元", "中間神經元", "反射很快", "傳入中樞", "傳向動器"]) {
  assert(!scanHtml.includes(leak), `scan must not reveal answer text: ${leak}`);
}
const q08Guard = api.questions.find((q) => q.id === Q(8));
for (let n = 0; n < 200; n += 1) {
  api.setState({ attempt_id: `u21-seed-${n}` });
  assert.notDeepEqual(Array.from(api.orderedOptions(q08Guard).map((item) => item.id)), Array.from(q08Guard.answer), `q08 initial order must not equal answer (seed ${n})`);
}
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "guest_result_layout", answers, result: api.scoreAttempt(), submitted: true });
const guestResultHtml = api.renderResult();
assert(guestResultHtml.includes("正式認列／累積增量") && guestResultHtml.includes("不列入正式累積") && guestResultHtml.includes("本次預估明細總計"), "guest result should use the new estimate layout");
api.setState({ student: { student_id: "S21001", is_guest: false, progress: {} }, submitted: true, result: { ...api.scoreAttempt(), verification_status: "server_verified", attempt_exp: 480, unit_credited_exp: 500, exp_delta: 20 } });
const verifiedHtml = api.renderResult();
assert(verifiedHtml.includes("後台已回傳正式認列資料") && verifiedHtml.includes("本單元正式認列") && verifiedHtml.includes("正式認列總計"), "verified result should use the new official layout");
assert(verifiedHtml.includes("500 / 500 EXP") && verifiedHtml.includes("本次取得：480"), "verified summary should separate attempt EXP and unit credit");
assert.equal(api.resultMode(), "verified");
console.log("prototype-nervous-system app regression passed");
