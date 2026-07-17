const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.resolve(__dirname, "../app.js");
const appSource = fs.readFileSync(appPath, "utf8");
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
vm.runInContext(`${appSource}\n;globalThis.__nutrientTest = { getState: () => state, setState: (next) => { state = next; }, calculateResult, allRequiredAnswered, isLockedScreen, evaluateReflectionQuality, mission, assets, badges, questions, classifyQuestions, multiSelectQuestions, correctSequence, sectionMap, renderQuestionEvidence, renderQuestionImage, renderSequenceQuestion, renderMultiSelect };`, context);

const api = context.__nutrientTest;
const state = api.getState();
state.student = { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安" };
state.answers.q01 = { iodine: "starch", benedict: "glucose", biuret: "protein", lipid_test: "lipid" };
api.questions.forEach((question) => { state.answers[question.id] = question.answer; });
state.answers.q09_sequence = [...api.correctSequence];
state.answers.q10 = [...api.multiSelectQuestions.q10.answers];
state.interactions.q09 = true;
state.interactions.q10 = true;
state.answers.reflection = { confidence_score: 3, student_question: "" };

assert.equal(api.allRequiredAnswered(), true);
const perfect = api.calculateResult();
assert.equal(perfect.total, 14);
assert.equal(perfect.correct, 14);
assert.equal(perfect.attempt_total_exp, 460);
assert.ok(perfect.badges.includes("nutrient_test_flawless"));

state.hints.q09 = true;
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
  api.assets.owlPrep,
  api.assets.iodineStarchColorHook,
  api.assets.biuretProteinColorHook,
  api.assets.lipidOilSpotHook
].forEach((relativePath) => assert.equal(fs.existsSync(path.resolve(__dirname, "..", relativePath)), true, relativePath));

const canonicalAnswers = Object.fromEntries(api.questions.map((question) => [question.id, question.answer]));
assert.deepEqual(canonicalAnswers, {
  q02: "starch_possible", q03: "glucose_possible", q04: "protein_possible", q05: "lipid_possible",
  q06: "starch_not_supported", q07: "starch_protein", q08: "iodine_starch", q11: "comparison_basis",
  q12: "positive_negative", q13: "target_limit", q14: "heat_required"
});
assert.equal(JSON.stringify(api.correctSequence), JSON.stringify(["label", "reagent", "safe_heat", "observe", "compare"]));
assert.equal(JSON.stringify(api.multiSelectQuestions.q10.answers), JSON.stringify(["goggles", "away", "hot", "water_bath"]));
assert.equal(appSource.includes("benedict-glucose-safety-water-bath.png"), false);
for (const qid of ["q03", "q09", "q10", "q14"]) {
  const rendered = qid === "q09" ? api.renderSequenceQuestion() : qid === "q10" ? api.renderMultiSelect(qid) : api.renderQuestionEvidence(qid);
  assert.equal(rendered.includes("<img"), false, `${qid} must use a non-operational text card`);
  assert.match(rendered, /已完成觀察紀錄/);
}
assert.match(api.renderQuestionEvidence("q06"), /未知樣品[\s\S]*未呈藍黑色[\s\S]*已知含澱粉樣品[\s\S]*清水比較/);
assert.match(api.renderQuestionEvidence("q07"), /碘液紀錄[\s\S]*本氏液紀錄[\s\S]*蛋白質檢測紀錄[\s\S]*脂質線索紀錄/);
assert.match(api.renderQuestionEvidence("q08"), /四張候選資料卡/);
assert.equal(api.classifyQuestions.q01.image, undefined);
assert.match(styleSource, /\.evidence-table\s*\{[^}]*overflow-x:\s*auto/s);
assert.match(styleSource, /@media \(max-width: 560px\)/);

assert.equal(api.badges.length, 11);
api.badges.forEach((badge) => {
  assert.equal(fs.existsSync(path.resolve(__dirname, "..", badge.badge_image_path)), true, badge.badge_image_path);
});

assert.match(appSource, /startAttempt/);
assert.match(appSource, /hintEvent/);
assert.match(appSource, /attempt_session_token/);
assert.match(appSource, /提交後會進行結算，本次作答不能再修改/);

console.log("prototype-nutrient-test app.test.js: all assertions passed");
