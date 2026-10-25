const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.resolve(__dirname, "../app.js");
const appSource = fs.readFileSync(appPath, "utf8");
const labSource = fs.readFileSync(path.resolve(__dirname, "../lab.js"), "utf8");
const originalSource = fs.readFileSync(path.resolve(__dirname, "../../prototype-nutrient-test/app.js"), "utf8");
const styleSource = fs.readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");
const storage = new Map();

function element() {
  return {
    dataset: {},
    disabled: false,
    classList: { toggle() {} },
    addEventListener() {},
    scrollIntoView() {},
    value: "",
    innerHTML: ""
  };
}

const screen = element();
const studentMini = element();
const context = {
  console,
  Set,
  Map,
  Date,
  Math,
  JSON,
  String,
  Number,
  Boolean,
  Array,
  Object,
  URLSearchParams,
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  },
  document: {
    querySelector(selector) {
      if (selector === "#screen") return screen;
      if (selector === "#studentMini") return studentMini;
      return element();
    },
    querySelectorAll() { return []; }
  },
  window: {
    scrollTo() {},
    alert() {},
    confirm() { return true; },
    BioQuestReflectionQuality: {
      evaluate(reflection) {
        const question = String(reflection?.student_question || "").trim();
        return {
          reflection_quality: question ? "minimal_concept" : "blank",
          reflection_quality_candidate: question ? "minimal_concept" : "blank",
          question_exp: question ? 10 : 0,
          question_exp_candidate: question ? 10 : 0,
          reflection_exp_reason: question ? "前台候選" : "空白可提交但不給 EXP。",
          reflection_review_status: question ? "pending_backend_recalc" : "auto_scored"
        };
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(`${labSource}\n${appSource}\n;globalThis.__nutrientTest = { LAB_SAMPLES, labResult, labJudgeCorrect, labComplete, renderLab, renderLabEvidence, renderReflection, renderReview, renderScan, renderBrief, renderCheckpoint1, renderCheckpoint2, getState: () => state, setState: (next) => { state = next; }, calculateResult, allRequiredAnswered, isLockedScreen, evaluateReflectionQuality, mission, assets, badges, questions, classifyQuestions, multiSelectQuestions, sectionMap, renderQuestionEvidence, renderMultiSelect, renderCheckpoint3, renderResult, renderAchievements, renderRules, resetForRelogin, VERSION, QUESTION_VERSION };`, context);

const api = context.__nutrientTest;
const state = api.getState();
state.student = { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安" };
state.answers.q01 = { iodine: "starch", benedict: "glucose" };
api.questions.forEach((question) => { state.answers[question.id] = question.answer; });
state.answers.q10 = [...api.multiSelectQuestions.q10.answers];
state.interactions.q10 = true;
state.answers.reflection = { confidence_score: 3, student_question: "" };

assert.equal(api.allRequiredAnswered(), true);
const perfect = api.calculateResult();
assert.equal(perfect.total, 11);
assert.equal(perfect.correct, 11);
assert.equal(perfect.attempt_total_exp, 460);
assert.ok(perfect.badges.includes("nutrient_test_flawless"));

state.hints.q10 = true;
const hinted = api.calculateResult();
assert.ok(hinted.attempt_total_exp < 500);
assert.equal(hinted.badges.includes("nutrient_test_flawless"), false);

state.submitted_at = "2026-07-11T00:00:00.000Z";
assert.equal(api.isLockedScreen("checkpoint1"), true);
assert.equal(api.isLockedScreen("reflection"), true);
assert.equal(api.isLockedScreen("achievements"), false);

[
  api.assets.briefingSceneHook,
  api.assets.ambientBackgroundHook,
  api.assets.owlPrep
].forEach((relativePath) => assert.equal(fs.existsSync(path.resolve(__dirname, "..", relativePath)), true, relativePath));

const canonicalAnswers = Object.fromEntries(api.questions.map((question) => [question.id, question.answer]));
assert.deepEqual(canonicalAnswers, {
  q02: "starch_possible", q03: "glucose_possible",
  q06: "starch_not_supported", q07: "starch_supported_glucose_not_supported", q08: "iodine_starch", q11: "comparison_basis",
  q12: "positive_negative", q13: "target_limit", q14: "heat_required"
});
assert.equal(JSON.stringify(api.multiSelectQuestions.q10.answers), JSON.stringify(["goggles", "away", "hot", "teacher_safe_method"]));
assert.equal(appSource.includes("benedict-glucose-safety-water-bath.png"), false);
// 預覽版：題號、選項代號、正解與原第 12 站完全相同（後台不需重新部署）
const originalContext = { console, Set, Map, Date, Math, JSON, String, Number, Boolean, Array, Object, URLSearchParams, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, document: { querySelector() { return element(); }, querySelectorAll() { return []; } }, window: { scrollTo() {}, BioQuestReflectionQuality: context.window.BioQuestReflectionQuality } };
vm.createContext(originalContext);
vm.runInContext(`${originalSource.replace(/\nrender\(\);\s*$/, "\n")}\n;globalThis.__orig = { questions, multiSelectQuestions, classifyQuestions, sectionMap, QUESTION_VERSION };`, originalContext);
const orig = originalContext.__orig;
const shape = (qs, ms, cq) => JSON.stringify({
  q: qs.map((q) => [q.id, q.concept, q.answer, q.misconception, q.options.map((o) => o.id)]),
  m: Object.entries(ms).map(([id, c]) => [id, c.concept, c.misconception, c.answers, c.options.map((o) => o.id)]),
  c: Object.entries(cq).map(([id, c]) => [id, c.misconception, c.options.map((o) => o.id), c.items.map((i) => [i.id, i.answer])])
});
assert.equal(shape(api.questions, api.multiSelectQuestions, api.classifyQuestions), shape(orig.questions, orig.multiSelectQuestions, orig.classifyQuestions), "question ids / option ids / answers must match original station 12");
assert.equal(JSON.stringify(api.sectionMap), JSON.stringify(orig.sectionMap));
assert.equal(api.QUESTION_VERSION, orig.QUESTION_VERSION);

// ROADMAP 題目用語原則：學生看得到的文字不出現內部用語
const studentText = [
  ...api.questions.flatMap((q) => [q.prompt, q.hint, ...q.options.map((o) => o.text)]),
  ...Object.values(api.multiSelectQuestions).flatMap((c) => [c.prompt, c.hint, ...c.options.map((o) => o.text)]),
  ...Object.values(api.classifyQuestions).flatMap((c) => [c.prompt, c.hint, ...c.items.map((i) => i.label), ...c.options.map((o) => o.label)]),
  api.renderBrief(), api.renderScan(), api.renderCheckpoint1(), api.renderCheckpoint2(), api.renderCheckpoint3(), api.renderLab()
].join("\n");
for (const term of ["資料卡", "完成觀察", "完成安全加熱", "候選", "證據範圍", "判讀條件", "老師提供的"]) {
  assert.equal(studentText.includes(term), false, `student-facing text must not contain ${term}`);
}

// 實驗台：結果與題目敘述一致
const sampleOf = (id) => api.LAB_SAMPLES.find((s) => s.id === id);
assert.equal(api.LAB_SAMPLES.map((s) => s.id).join(), "A,B,C,D");
assert.equal(api.labResult("A", "iodine").text, "藍黑色");
assert.notEqual(api.labResult("B", "iodine").text, "藍黑色");
assert.notEqual(api.labResult("C", "iodine").text, "藍黑色");
assert.notEqual(api.labResult("D", "iodine").text, "藍黑色");
for (const id of ["A", "B", "C", "D"]) assert.equal(api.labResult(id, "benedictCold").text, "藍色", `${id} benedict before heating stays blue`);
assert.equal(api.labResult("B", "benedictHot").text, "橙紅色");
for (const id of ["A", "C", "D"]) assert.equal(api.labResult(id, "benedictHot").text, "藍色");
assert.ok(sampleOf("D").control);
// 題目引用的試管與實驗結果相符
assert.match(api.questions.find((q) => q.id === "q02").prompt, /甲[\s\S]*藍黑色/);
assert.match(api.questions.find((q) => q.id === "q03").prompt, /乙[\s\S]*橙紅色/);
assert.match(api.questions.find((q) => q.id === "q06").prompt, /丙[\s\S]*沒有變成藍黑色/);
assert.match(api.questions.find((q) => q.id === "q07").prompt, /甲[\s\S]*藍黑色[\s\S]*仍是藍色/);
assert.match(api.questions.find((q) => q.id === "q11").prompt, /丁[\s\S]*清水/);
for (const q of api.questions.filter((item) => item.lab)) {
  const evidence = api.renderQuestionEvidence(q.id);
  assert.match(evidence, /你的實驗紀錄/, `${q.id} shows lab record`);
  q.lab.show.forEach((test) => assert.ok(evidence.includes(api.labResult(q.lab.sample, test).text.replace("（碘液原本的顏色）", "")), `${q.id} ${test}`));
}
for (const qid of ["q08", "q12", "q13"]) assert.equal(api.renderQuestionEvidence(qid), "", `${qid} needs no table`);
assert.equal(api.renderMultiSelect("q10").includes("<img"), false);
assert.doesNotMatch(api.renderQuestionEvidence("q07"), /蛋白質|雙縮脲|蘇丹|油斑/);

// 實驗台判斷與完成條件
const labState = { prediction: "B", iodine: { A: true, B: true, C: true, D: true }, benedict: { A: true, B: true, C: true, D: true }, heated: true, goggles: true, judge: { A: { starch: "yes", glucose: "no" }, B: { starch: "no", glucose: "yes" }, C: { starch: "no", glucose: "no" } } };
state.lab = labState;
assert.equal(api.labJudgeCorrect(), true);
assert.equal(api.labComplete(), false, "must check judgement first");
labState.judgedOk = true;
assert.equal(api.labComplete(), true);
assert.match(api.renderLab(), /揭曉[\s\S]*麵粉水[\s\S]*葡萄糖水[\s\S]*沙拉油[\s\S]*清水/);
labState.judge.C.glucose = "yes";
assert.equal(api.labJudgeCorrect(), false);
labState.judge.C.glucose = "no";
state.lab = { iodine: {}, benedict: {}, judge: {} };
assert.doesNotMatch(api.renderLab(), /麵粉水|葡萄糖水|沙拉油/, "identities hidden before reveal");
assert.match(api.renderLab(), /id="labNext" disabled/);
assert.equal(api.classifyQuestions.q01.image, undefined);
assert.match(styleSource, /@media \(max-width: 560px\)/);
assert.equal(appSource.includes("renderSequenceQuestion"), false);
assert.equal(appSource.includes("data-sequence-id"), false);
assert.equal(appSource.includes("蛋白質檢測"), false);
assert.equal(appSource.includes("脂質檢測"), false);
assert.equal(api.isLockedScreen("lab"), true, "lab locked after submit");
assert.equal(appSource.includes("雙縮脲"), false);
assert.equal(appSource.includes("蘇丹"), false);

assert.equal(api.badges.length, 11);
api.badges.forEach((badge) => {
  assert.equal(fs.existsSync(path.resolve(__dirname, "..", badge.badge_image_path)), true, badge.badge_image_path);
});

assert.match(appSource, /startAttempt/);
assert.match(appSource, /hintEvent/);
assert.match(appSource, /attempt_session_token/);
assert.match(appSource, /提交後會進行結算，本次作答不能再修改/);
assert.equal(api.VERSION, "20261025-nutrient-test-lab-preview-v1");
assert.equal(api.QUESTION_VERSION, "20260720-nutrient-test-starch-glucose-only-v2");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "runtime cache must stay separate from canonical question version");
assert.match(appSource, /question_version: QUESTION_VERSION/);
assert.equal(appSource.includes("question_version: VERSION"), false);

state.result = perfect;
state.backend_status = "submitted_verified";
state.screen = "result";
assert.match(api.renderResult(), /data-result-earned-badges="true"/);
assert.match(api.renderResult(), /badge-nutrient_test-nutrient_test_entry\.webp\?v=20261025-nutrient-test-lab-preview-v1/);
assert.match(api.renderResult(), /data-relogin-action="true"/);

state.screen = "achievements";
assert.equal(api.renderAchievements().includes("data-bq-unit-achievements"), false);
assert.match(api.renderAchievements(), /data-bq-achievements-overview-only="true"/);
assert.match(api.renderAchievements(), /data-relogin-action="true"/);

state.screen = "rules";
assert.match(api.renderRules(), /data-relogin-action="true"/);

context.localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "old_nutrient_attempt", unit_id: "nutrient_test" }]));
api.resetForRelogin();
assert.equal(api.getState().screen, "login");
assert.equal(api.getState().student, null);
assert.equal(api.getState().attempt_id, "");
assert.equal(api.getState().submitted_at, null);
assert.equal(context.localStorage.getItem("bioquest_attempts_v1"), JSON.stringify([{ attempt_id: "old_nutrient_attempt", unit_id: "nutrient_test" }]), "reset must preserve attempt history");

console.log("prototype-nutrient-test-lab app.test.js: all assertions passed");
