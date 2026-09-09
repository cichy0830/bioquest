const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../analytics.js"), "utf8");
const context = { console, globalThis: {} };
vm.createContext(context);
vm.runInContext(source, context);
const analytics = context.globalThis.BioQuestTeacherAnalytics;

const logs = [
  { attempt_id: "a1", question_id: "unit_q01", question_type: "choice", skill_tag: "cell_as_basic_unit", is_correct: true, hint_used: false, answer_json: '"basic"' },
  { attempt_id: "a2", question_id: "unit_q01", question_type: "choice", skill_tag: "cell_as_basic_unit", is_correct: false, hint_used: true, answer_json: '"particle"', misconception_tag: "cell_as_particle_only" },
  { attempt_id: "a1", question_id: "unit_q02", question_type: "set", skill_tag: "organisms_made_of_cells", is_correct: true, answer_json: '["human","yeast"]' },
  { attempt_id: "a2", question_id: "unit_q02", question_type: "set", skill_tag: "organisms_made_of_cells", is_correct: false, answer_json: '["human"]', misconception_tag: "only_animals_plants_have_cells" },
  { attempt_id: "a1", question_id: "unit_q03", question_type: "mapping", skill_tag: "unicellular_multicellular", is_correct: true, answer_json: '{"yeast":"single","human":"multi"}' },
  { attempt_id: "old", question_id: "unit_q01", question_type: "choice", skill_tag: "cell_as_basic_unit", is_correct: false, answer_json: '"ignored"' }
];

const questions = analytics.buildQuestionAnalytics(logs, ["a1", "a2"]);
assert.equal(questions.length, 3);
const q1 = questions.find((row) => row.questionId === "unit_q01");
assert.equal(q1.responses, 2);
assert.equal(q1.correctRate, 0.5);
assert.equal(q1.hintRate, 0.5);
assert.deepEqual(JSON.parse(JSON.stringify(q1.options.map((row) => [row.label, row.count]))), [["basic", 1], ["particle", 1]]);

const q2 = questions.find((row) => row.questionId === "unit_q02");
assert.equal(q2.options.find((row) => row.label === "人類").count, 2);
assert.equal(q2.options.find((row) => row.label === "酵母菌").count, 1);
assert.equal(q2.options.reduce((sum, row) => sum + row.rate, 0), 1.5, "multi-select rates may exceed 100%");

const q3 = questions.find((row) => row.questionId === "unit_q03");
assert.ok(q3.options.some((row) => row.label === "酵母菌 → 單細胞"));
assert.ok(q3.options.some((row) => row.label === "人類 → 多細胞"));

const diagnostics = analytics.buildConceptDiagnostics(logs, ["a1", "a2"]);
const cellDiagnosis = diagnostics.find((row) => row.tag === "cell_as_basic_unit");
assert.equal(cellDiagnosis.sample, 2);
assert.equal(cellDiagnosis.affected, 1);
assert.equal(cellDiagnosis.level, "N", "small samples must not be ranked by percentage");
assert.equal(cellDiagnosis.title, "細胞是構造與功能基本單位");

const feedback = analytics.buildFeedbackSummary([
  { attempt_id: "a1", student_id: "S1", student_name: "學生甲", seat_no: "01", confidence_score: 2, confident_concept: "細胞", uncertain_concept: "單多細胞", student_question: "為什麼酵母菌是一個細胞？" },
  { attempt_id: "a2", student_id: "S2", student_name: "學生乙", seat_no: "02", confidence_score: 4 }
], [{ student_id: "S1", student_name: "學生甲", issue_type: "low_confidence", student_question: "請再說明" }]);
assert.equal(feedback.questions.length, 1);
assert.equal(feedback.uncertain.length, 1);
assert.equal(feedback.lowConfidence.length, 1);
assert.equal(feedback.pendingReviews.length, 1);

assert.equal(analytics.buildQuestionAnalytics([], ["a1"]).length, 0);
console.log("teacher dashboard analytics: all assertions passed");
