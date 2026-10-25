#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-temperature-glucose-homeostasis")
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
vm.runInNewContext(source, context, { filename: "prototype-temperature-glucose-homeostasis/app.js" });
const api = context.window.__temperature_glucose_homeostasisTest;

assert.equal(api.VERSION, "20261025-temperature-glucose-homeostasis-spec-sync-v1");
assert.equal(api.QUESTION_VERSION, "20260718-temperature-glucose-homeostasis-v1");
assert.equal(api.mission.unit_id, "temperature_glucose_homeostasis");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert(api.badges.every((badge) => badge.image_status === "controlled_pending"));
assert(api.badges.every((badge) => badge.badge_image_path === ""));
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u26-temperature-glucose-homeostasis-review"));
assert(!source.includes("question_version: VERSION"));
assert(!source.includes("QUESTION_VERSION = VERSION"));
assert(fs.existsSync(path.join(root, "assets", "u26-f-u26-04-q07-body-temperature-chart-base.svg")));
assert(fs.existsSync(path.join(root, "assets", "u26-f-u26-04-q12-glucose-insulin-chart-base.svg")));
assert(fs.existsSync(path.join(root, "assets", "u26-f-u26-04-chart-data-overlay-spec.json")));
assert(fs.existsSync(path.join(root, "assets", "temperature-glucose-homeostasis-briefing-azhe-wide.webp")));
assert(fs.existsSync(path.join(root, "assets", "temperature-glucose-homeostasis-briefing-azhe-mobile.webp")));
const staleBadgeText = ["徽章", "素材", "待接"].join("");
assert(!fs.readFileSync(path.join(root, "styles.css"), "utf8").includes(staleBadgeText));

const Q = (n) => `temperature_glucose_homeostasis_q${String(n).padStart(2, "0")}`;
const answers = {
  [`${Q(8)}_sequence`]: ["body_temperature_high", "activate_heat_loss_response", "sweating_or_vasodilation_increases_heat_loss", "temperature_returns_toward_range"],
  [Q(1)]: "homeostasis_is_range_not_fixed",
  [Q(2)]: "negative_feedback_opposite_adjustment",
  [Q(3)]: { human: "endotherm", sparrow: "endotherm", lizard: "ectotherm", frog: "ectotherm" },
  [Q(4)]: "hot_sweating_vasodilation",
  [Q(5)]: "cold_shivering_vasoconstriction",
  [Q(6)]: "sweating_cools_and_loses_water",
  [Q(7)]: "body_temp_returns_to_range_data",
  [Q(9)]: "blood_glucose_returns_to_range",
  [Q(10)]: "high_glucose_insulin_lowers",
  [Q(11)]: "low_glucose_glucagon_raises",
  [Q(12)]: "insulin_data_returns_glucose_range",
  [Q(13)]: { body_temperature_high: "increase_heat_loss", body_temperature_low: "conserve_or_make_heat", blood_glucose_high: "lower_glucose", blood_glucose_low: "raise_glucose" },
  [Q(14)]: "glucose_temperature_belongs_homeostasis"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "temperature_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("temperature_glucose_homeostasis_flawless"));
assert(score.earned_badges.includes("temperature_feedback_sequence_tracker"));
assert(score.earned_badges.includes("blood_glucose_hormone_direction_reader"));
assert(score.earned_badges.includes("temperature_glucose_unit_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "temperature_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認血糖偏高和偏低時的調節方向怎麼判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("temperature_glucose_homeostasis_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？", 40]
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
  reflection: { question: "我想確認體溫偏高和血糖偏低都算負回饋嗎？它們怎麼讓狀態回到範圍？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "temperature_glucose_homeostasis");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
for (let index = 1; index <= 14; index += 1) {
  const questionId = Q(index);
  const shortId = `q${String(index).padStart(2, "0")}`;
  assert.deepEqual(payload.raw_answers[shortId], payload.raw_answers[questionId], `${shortId} should mirror ${questionId}`);
}
assert.deepEqual(payload.raw_answers[Q(8)], answers[`${Q(8)}_sequence`]);
assert.deepEqual(payload.raw_answers.q08_sequence, answers[`${Q(8)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(3)], answers[Q(3)]);
assert.deepEqual(payload.raw_answers.q03, answers[Q(3)]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.deepEqual(payload.raw_answers.q13, answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(8)).analysis_group, "temperature_responses");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).analysis_group, "blood_glucose_feedback");
assert.equal(payload.question_logs.every((log) => log.question_version === api.QUESTION_VERSION), true);
assert(api.renderCheckpoint("checkpoint2").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
assert.equal(api.chartEvidence[Q(7)].asset, "assets/u26-f-u26-04-q07-body-temperature-chart-base.svg");
assert.equal(api.chartEvidence[Q(12)].asset, "assets/u26-f-u26-04-q12-glucose-insulin-chart-base.svg");
const q07Evidence = api.renderQuestionEvidence(Q(7));
const q12Evidence = api.renderQuestionEvidence(Q(12));
assert(q07Evidence.includes('data-chart-id="q07-body-temperature"'));
assert(q07Evidence.includes("運動後休息期間的體溫紀錄"));
assert(q07Evidence.includes("跑步後時間（分鐘）"));
assert(q07Evidence.includes("體溫（°C，簡化示意）"));
assert(q07Evidence.includes("跑步結束，開始休息"));
assert(q07Evidence.includes(`?v=${api.VERSION}`));
assert(!q07Evidence.includes("休息後逐漸往平常範圍回復"));
assert(!q07Evidence.includes("體溫逐漸回復"));
assert(q12Evidence.includes('data-chart-id="q12-glucose-insulin"'));
assert(q12Evidence.includes("飯後血糖與胰島素相對量紀錄"));
assert(q12Evidence.includes("血糖相對指數"));
assert(q12Evidence.includes("胰島素相對量"));
assert(q12Evidence.includes(`?v=${api.VERSION}`));
assert(!q12Evidence.includes("飯後血糖可能先升高"));
assert(!q12Evidence.includes("血糖先升後降"));
const q09Evidence = api.renderQuestionEvidence(Q(9));
const q14Evidence = api.renderQuestionEvidence(Q(14));
assert(q09Evidence.includes("血糖資料觀察卡"));
assert(q09Evidence.includes("先確認資料比較的是哪一段時間與哪一種身體狀態"));
assert(!q09Evidence.includes("飯後血糖可能先升高"));
assert(q14Evidence.includes("單元邊界觀察卡"));
assert(q14Evidence.includes("先判斷題目中的情境主要在檢查哪一種身體狀態"));
assert(!q14Evidence.includes("本單元聚焦體溫與血糖"));
assert(api.questions.find((question) => question.id === Q(7)).prompt.includes("曲線圖"));
assert(api.questions.find((question) => question.id === Q(12)).prompt.includes("曲線圖"));
assert.equal(api.assets.briefingSceneHook, "assets/temperature-glucose-homeostasis-briefing-azhe-wide.webp");
assert.equal(api.assets.briefingSceneMobileHook, "assets/temperature-glucose-homeostasis-briefing-azhe-mobile.webp");
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes(`assets/temperature-glucose-homeostasis-briefing-azhe-wide.webp?v=${api.VERSION}`));
assert(api.renderBrief().includes(`assets/temperature-glucose-homeostasis-briefing-azhe-mobile.webp?v=${api.VERSION}`));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(api.renderBrief().includes("你好，測試學生｜701 99｜S99999"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderReview().includes("feedback-columns"));
assert(!api.renderReview().includes("mentor-card"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("重新登入／再挑戰"));
assert(api.renderResult().includes("本次取得徽章"));
assert(!api.renderResult().includes("本單元 17 枚徽章"));
assert(!api.renderResult().includes("<img"));
assert(api.renderResult().includes("圖像待核准"));
assert(!api.renderResult().includes(staleBadgeText));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
assert(!api.renderAchievements().includes('data-bq-unit-achievements="temperature_glucose_homeostasis"'));
assert(!api.renderAchievements().includes("title-card"));
assert(!api.renderAchievements().includes("學生稱號角色"));
api.setState({
  student: {
    student_id: "S99999",
    class_name: "701",
    seat_no: "99",
    student_name: "測試學生",
    total_exp: 8200,
    progress: {
      total_exp: 8200,
      current_title_id: "systems_investigator",
      title_avatar_path: "../shared-assets/title-avatars/title-06-systems_investigator-male.webp",
      unit_badge_summary_json: "[]"
    }
  },
  attempt_id: "server",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  screen: "result",
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
assert.equal(api.loadVerifiedSnapshot().total_exp, 8200);
api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  optionOrders: { [Q(8)]: [...answers[`${Q(8)}_sequence`]] },
  answers,
  result: { earned_badges: ["local_candidate_badge"] }
});
const guarded = api.orderedOptions(api.questions.find((question) => question.id === Q(8))).map((step) => step.id);
assert.notDeepEqual(guarded, answers[`${Q(8)}_sequence`]);
assert.deepEqual(api.orderedOptions(api.questions.find((question) => question.id === Q(8))).map((step) => step.id), guarded);
const localCandidate = {
  ...api.scoreAttempt(),
  direct_exp: 999,
  reflection_exp: 888,
  attempt_exp: 777,
  unit_credited_exp: 777,
  earned_badges: ["local_candidate_badge"],
  verification_status: "pending_backend"
};
let merged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    badges_json: JSON.stringify(["temperature_glucose_homeostasis_entry", "temperature_feedback_sequence_tracker"])
  }
}, localCandidate);
assert.equal(merged.direct_exp, 111);
assert.equal(merged.reflection_exp, 22);
assert.equal(merged.attempt_exp, 333);
assert.deepEqual(Array.from(merged.earned_badges), ["temperature_glucose_homeostasis_entry", "temperature_feedback_sequence_tracker"]);
merged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  attempt_result: {
    concept_exp: 111,
    question_exp: 22,
    attempt_total_exp: 333,
    newly_credited_badges_json: JSON.stringify(["temperature_glucose_homeostasis_entry"])
  },
  verified_attempt: { verification_status: "server_verified" }
}, localCandidate);
assert.equal(merged.direct_exp, 111);
assert.equal(merged.reflection_exp, 22);
assert.equal(merged.attempt_exp, 333);
assert.deepEqual(Array.from(merged.earned_badges), ["temperature_glucose_homeostasis_entry"]);
merged = api.applyBackendSubmitResponse({
  ok: true,
  verified_attempt: { verification_status: "server_verified", concept_exp: 111, question_exp: 22, attempt_total_exp: 333 }
}, localCandidate);
assert.equal(merged.direct_exp, 111);
assert.equal(merged.reflection_exp, 22);
assert.equal(merged.attempt_exp, 333);
assert.deepEqual(Array.from(merged.earned_badges), []);
merged = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "pending_backend",
  verified_attempt: { verification_status: "pending_backend" }
}, localCandidate);
assert.deepEqual(Array.from(merged.earned_badges), localCandidate.earned_badges);

// 2026-10-25 規格對齊（第一批）
{
  const qs = Object.fromEntries(api.questions.map((question) => [question.id, question]));
  // 題幹、選項、提示依規格 v1.3；正解 id 不變
  const specPrompts = {
    1: "有同學說：「恆定就是體內數值永遠一模一樣。」哪個修正較合理？",
    2: "當體溫偏高時，身體啟動反應讓體溫往下降；當血糖偏低時，身體啟動反應讓血糖往上升。這較接近哪個調節方向？",
    3: "請將動物例子分到較合適的體溫調節類型。",
    4: "炎熱天氣運動後，體溫偏高。下列哪組反應較有助於增加散熱？",
    5: "寒冷環境中體溫偏低時，哪組反應較有助於保溫或增加產熱？",
    6: "有同學說：「流汗只是在排水，和體溫沒有關係。」哪個修正較合理？",
    8: "請拖曳排序，排出「體溫偏高時」較合理的調節流程。",
    9: "飯後血糖上升，過一段時間又逐漸回到適當範圍。這最能說明哪個概念？",
    10: "飯後血糖偏高時，哪個調節方向較合理？",
    11: "空腹較久、血糖偏低時，哪個調節方向較合理？",
    13: "請將情境配到較合理的調節方向。"
  };
  for (const [n, prompt] of Object.entries(specPrompts)) assert.equal(qs[Q(Number(n))].prompt, prompt, `q${n} prompt`);
  const specCorrectText = {
    1: "恆定是維持在適當範圍附近，數值可小幅變動", 2: "偏離適當範圍時，反應讓狀態往相反方向調整", 4: "流汗增加、皮膚血管擴張",
    5: "發抖、皮膚血管收縮", 6: "流汗蒸發可幫助散熱，但也會造成水分和少量鹽分流失", 7: "體溫可短暫波動，身體會透過調節讓它回到適當範圍附近",
    9: "血糖會變動，但身體會調節使它回到適當範圍附近", 10: "胰島素幫助血糖降低", 11: "升糖素幫助血糖升高", 12: "資料支持胰島素和血糖降低方向有關",
    14: "血糖偏高後透過調節逐漸回到適當範圍"
  };
  for (const [n, text] of Object.entries(specCorrectText)) {
    const question = qs[Q(Number(n))];
    assert.equal(question.options.find((option) => option.id === question.answer).text, text, `q${n} correct option text`);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.id)).size, 4);
  }
  assert.equal(qs[Q(8)].hint, "先找偏離狀態，再看身體反應如何把狀態往相反方向調整。");
  assert.equal(qs[Q(12)].hint, "先看橫軸時間，再比較兩條曲線：胰島素相對量上升後，血糖曲線接下來往哪個方向變化。");
  assert.deepEqual(Array.from(qs[Q(8)].steps, (step) => step.label), ["體溫偏高", "身體啟動散熱反應", "流汗或皮膚血管擴張使散熱增加", "體溫往適當範圍回復"]);
  assert.deepEqual(Array.from(qs[Q(13)].choices, (choice) => choice.text), ["增加散熱", "保溫或增加產熱", "降低血糖", "升高血糖"]);
  // 簡報頁：規格故事引入阿澤老師與貓頭鷹助理，不直接列調節反應或血糖激素方向
  const brief = api.renderBrief();
  assert(brief.includes("阿澤老師") && brief.includes("貓頭鷹助理"), "brief introduces both roles");
  for (const banned of ["負回饋，把", "胰島素", "升糖素", "發抖", "血管擴張", "血管收縮"]) assert(!brief.includes(banned), `brief leaks ${banned}`);
  // 準備頁：三個中性判讀方向，不直接給 q01／q02／q04–q06／q10–q11／q13 答案
  const scan = api.renderScan();
  assert(scan.includes("三個判讀方向"));
  for (const banned of ["相對穩定", "不是完全不變", "小幅波動", "負回饋", "相反方向", "熱時", "冷時", "增加散熱", "流汗", "發抖", "血管", "胰島素", "升糖素", "往下降低", "往上升高"]) assert(!scan.includes(banned), `scan leaks ${banned}`);
  // 題前卡：q01／q02、q04–q06 不直接寫出答案；q09／q14 維持規格 07-28 文案
  for (const n of [1, 2]) {
    const card = api.renderQuestionEvidence(Q(n));
    assert(card.includes("恆定範圍觀察卡"));
    for (const banned of ["小幅波動", "負回饋", "拉回"]) assert(!card.includes(banned), `q${n} card leaks ${banned}`);
  }
  for (const n of [4, 5, 6]) {
    const card = api.renderQuestionEvidence(Q(n));
    assert(card.includes("體溫反應觀察卡"));
    for (const banned of ["流汗", "水分流失", "熱時看散熱", "冷時看保溫"]) assert(!card.includes(banned), `q${n} card leaks ${banned}`);
  }
  // q03／q13 配對項目初始順序：不與選項對齊、不按答案成群，依 attempt 穩定且會變化
  for (const n of [3, 13]) {
    const question = qs[Q(n)];
    const seen = new Set();
    for (let seed = 0; seed < 200; seed += 1) {
      api.setState({ attempt_id: `mapping_seed_${seed}` });
      const order = api.orderedMappingItems(question).map((item) => item.id);
      assert.equal(order.length, question.items.length);
      assert.equal(new Set(order).size, question.items.length);
      assert.equal(api.mappingItemsLookGrouped(question, order), false, `q${n} seed ${seed} grouped: ${order}`);
      assert.deepEqual(Array.from(api.orderedMappingItems(question), (item) => item.id), Array.from(order), "stable within attempt");
      seen.add(order.join(","));
    }
    assert(seen.size > 2, `q${n} order should vary across attempts`);
  }
  assert.equal(api.mappingItemsLookGrouped(qs[Q(3)], ["human", "sparrow", "lizard", "frog"]), true);
  assert.equal(api.mappingItemsLookGrouped(qs[Q(3)], ["lizard", "frog", "human", "sparrow"]), true);
  assert.equal(api.mappingItemsLookGrouped(qs[Q(13)], ["body_temperature_high", "body_temperature_low", "blood_glucose_high", "blood_glucose_low"]), true);
  // q08 排序初始順序不等於正解
  for (let seed = 0; seed < 200; seed += 1) {
    api.setState({ attempt_id: `sequence_seed_${seed}` });
    assert.notDeepEqual(Array.from(api.orderedOptions(qs[Q(8)]), (step) => step.id), Array.from(qs[Q(8)].answer));
  }
  // checkpoint_id 為規格 IDs、teacher_group_id 依 canonical handoff
  api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "cp_ids", answers, reflection: { question: "" } });
  const cpLogs = Object.fromEntries(api.scoreAttempt().logs.map((log) => [log.question_id, log]));
  assert.equal(cpLogs[Q(3)].checkpoint_id, "temperature_glucose_homeostasis_cp1_homeostasis_and_temperature");
  assert.equal(cpLogs[Q(8)].checkpoint_id, "temperature_glucose_homeostasis_cp2_body_temperature_responses");
  assert.equal(cpLogs[Q(13)].checkpoint_id, "temperature_glucose_homeostasis_cp3_blood_glucose_feedback");
  assert.equal(cpLogs[Q(14)].checkpoint_id, "temperature_glucose_homeostasis_cp4_boundary");
  assert.equal(cpLogs[Q(13)].teacher_group_id, "homeostasis_feedback_basics");
  assert.equal(cpLogs[Q(6)].teacher_group_id, "sweating_water_connection");
  assert.equal(cpLogs[Q(14)].teacher_group_id, "unit_boundary_control");
  assert.equal(cpLogs[Q(1)].exp_type, "concept");
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
  assert(submitBody.includes("renderApp();\n  resetScreenScroll();"), "submitMission should reset scroll");
}
console.log("prototype-temperature-glucose-homeostasis app regression passed");
