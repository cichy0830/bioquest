const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
function findBackendLoader(startDir) {
  let current = startDir;
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(current, "05_教師後台", "tests", "apps-script-loader.js");
    if (fs.existsSync(candidate)) return candidate;
    current = path.dirname(current);
  }
  throw new Error("missing supported Apps Script module loader");
}
const { loadAppsScriptSource } = require(findBackendLoader(root));
const appsScript = loadAppsScriptSource();
new vm.Script(source);

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") { depth += 1; opened = true; }
    if (source[index] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

const context = {
  state: { answers: { checkpoint1: { multi: [] }, checkpoint1Hints: {} } },
  multiCellItems: [
    { id: "human", answer: true }, { id: "onion", answer: true },
    { id: "yeast", answer: true }, { id: "paramecium", answer: true },
    { id: "rock", answer: false }, { id: "ruler", answer: false }
  ],
  saveState() {},
  recordHintEvent() {},
  render() {}
};
vm.createContext(context);
vm.runInContext(`${functionSource("toggleMulti")}\n${functionSource("confirmMulti")}`, context);

for (const id of ["human", "onion", "yeast", "paramecium"]) context.toggleMulti(id);
assert.equal(context.state.answers.checkpoint1Hints.multi, undefined, "partial selection must not consume a hint");
assert.equal(context.state.answers.checkpoint1.multiConfirmed, false);
assert.equal(context.confirmMulti(), true);
assert.equal(context.state.answers.checkpoint1Hints.multi, undefined, "correct group confirmation must remain zero-hint");

context.state.answers.checkpoint1 = { multi: [] };
context.state.answers.checkpoint1Hints = {};
context.toggleMulti("human");
assert.equal(context.state.answers.checkpoint1Hints.multi, undefined);
assert.equal(context.confirmMulti(), false);
assert.equal(context.state.answers.checkpoint1Hints.multi, true, "wrong group confirmation must record one hint");
context.toggleMulti("onion");
assert.equal(context.state.answers.checkpoint1.multiConfirmed, false);
assert.equal(context.state.answers.checkpoint1Hints.multi, true);

const titleContext = {
  state: { student: { student_id: "guest", progress: { total_exp: 500, current_title_id: "life_observer" } } },
  localTotalExp() { return 3000; },
  titleLevels: [
    { id: "trainee_investigator", need: 0, title: "見習調查員" },
    { id: "life_observer", need: 500, title: "生命觀察員" },
    { id: "concept_solver", need: 3000, title: "概念解謎者" },
    { id: "micro_explorer", need: 5200, title: "微觀探索者" }
  ]
};
titleContext.titleProgressRules = {
  getTitleForExp(exp) {
    const levels = titleContext.titleLevels;
    const index = levels.reduce((current, level, itemIndex) => exp >= level.need ? itemIndex : current, 0);
    const current = levels[index];
    const next = levels[index + 1];
    return { id: current.id, current: current.title, next: next?.title || "最高稱號", remaining: next ? next.need - exp : 0, title_progress_percent: exp / 23400 * 100 };
  }
};
vm.createContext(titleContext);
vm.runInContext(functionSource("titleAndProgress"), titleContext);
assert.equal(titleContext.titleAndProgress().totalExp, 3000, "new local EXP must override stale remote progress");
titleContext.state.student.progress.current_title_id = "micro_explorer";
assert.equal(titleContext.titleAndProgress().totalExp, 5200, "explicit title minimum must not regress");

const submitProgressContext = {
  state: { student: { student_id: "S70101", progress: { total_exp: 450, current_title_id: "trainee_investigator", current_title: "見習調查員" } } },
  localTotalExp() { return 450; },
  titleLevels: [
    { id: "trainee_investigator", need: 0, title: "見習調查員" },
    { id: "life_observer", need: 500, title: "生命觀察員" },
    { id: "ecology_recorder", need: 1500, title: "生態記錄員" }
  ]
};
submitProgressContext.titleProgressRules = {
  getTitleForExp(exp) {
    const levels = submitProgressContext.titleLevels;
    const index = levels.reduce((current, level, itemIndex) => exp >= level.need ? itemIndex : current, 0);
    const current = levels[index];
    const next = levels[index + 1];
    return { id: current.id, current: current.title, next: next?.title || "最高稱號", remaining: next ? next.need - exp : 0, title_progress_percent: exp / 23400 * 100 };
  }
};
vm.createContext(submitProgressContext);
vm.runInContext(`${functionSource("applyBackendStudentProgress")}\n${functionSource("titleAndProgress")}`, submitProgressContext);
assert.equal(submitProgressContext.applyBackendStudentProgress({ student_progress: { total_exp: 550, current_title_id: "life_observer", current_title: "生命觀察員", profile_gender: "female" } }), true);
const upgradedTitle = submitProgressContext.titleAndProgress();
assert.equal(upgradedTitle.totalExp, 550);
assert.equal(upgradedTitle.title.current, "生命觀察員");
assert.equal(submitProgressContext.state.student.total_exp, 550);
assert.equal(submitProgressContext.applyBackendStudentProgress({ ok: true }), false, "missing progress must not be reported as synchronized");

const reflectionLedgerContext = { UNIT_EXP_CAP: 500 };
vm.createContext(reflectionLedgerContext);
vm.runInContext(functionSource("reflectionExpCap"), reflectionLedgerContext);
assert.equal(reflectionLedgerContext.reflectionExpCap(0), 460, "blank reflection must cap a perfect attempt at 460 EXP");
assert.equal(reflectionLedgerContext.reflectionExpCap(40), 500, "a valid 40 EXP reflection may reach 500 EXP");
assert.equal(reflectionLedgerContext.reflectionExpCap(-20), 460, "negative or invalid reflection EXP must not raise the cap");
vm.runInContext(functionSource("normalizedAttemptCredit"), reflectionLedgerContext);
assert.equal(reflectionLedgerContext.normalizedAttemptCredit({ unit_credited_exp: 500, question_exp: 0 }), 460, "reload must not preserve a legacy blank-reflection 500");
assert.equal(reflectionLedgerContext.normalizedAttemptCredit({ unit_credited_exp: 500, question_exp: 40 }), 500);

const loginContext = {};
vm.createContext(loginContext);
vm.runInContext(functionSource("normalizeBackendStudent"), loginContext);
const normalizedStudent = loginContext.normalizeBackendStudent({
  ok: true,
  student: { student_id: "S70101", student_name: "Sheet Student", class_name: "701", seat_no: "01" },
  progress: { total_exp: 1500, current_title_id: "ecology_recorder", current_title: "生態記錄員", profile_gender: "female", title_avatar_path: "shared-assets/title-avatars/example.webp" }
}, "S70101");
assert.equal(normalizedStudent.student_name, "Sheet Student");
assert.equal(normalizedStudent.total_exp, 1500);
assert.equal(normalizedStudent.current_title_id, "ecology_recorder");
assert.equal(normalizedStudent.profile_gender, "female");
assert.equal(normalizedStudent.title_avatar_path, "shared-assets/title-avatars/example.webp");
assert.equal(loginContext.normalizeBackendStudent({ ok: true, student: { student_id: "OTHER" } }, "S70101"), null, "mismatched backend student id must be rejected");

const fetchStudentStatusSource = functionSource("fetchStudentStatus");
const loginSource = functionSource("login");
assert.ok(fetchStudentStatusSource.includes("unit_id=${encodeURIComponent(mission.unit_id)}"));
assert.ok(fetchStudentStatusSource.includes('cache: "no-store"'));
assert.ok(loginSource.includes('const isGuest = id === "guest"'));
assert.ok(loginSource.includes("if (isGuest)"));
assert.ok(loginSource.indexOf("if (isGuest)") < loginSource.indexOf("fetchStudentStatus(id)"), "guest must branch before backend fetch");
assert.ok(loginSource.includes("state.student = { ...roster.guest }"));
assert.ok(!loginSource.includes("student = roster[id]"), "non-guest must never silently use the local roster");
for (const field of ["total_exp", "current_title_id", "current_title", "profile_gender", "title_avatar_path", "completed_attempts"]) assert.ok(appsScript.includes(field), `Apps Script response missing ${field}`);
assert.ok(appsScript.includes("ss.getSheetByName(SHEETS.studentProgress)"));

const reflection = functionSource("renderReflection");
assert.ok(!reflection.includes("mission-layout"));
assert.ok(!reflection.includes("owl-frame"), "reflection must rely on the single shared report owl");
assert.ok(source.includes('id="confirmMulti"'));
assert.ok(source.includes("本次取得徽章"));
assert.ok(!source.includes('earnedNow.has(badge.name) ? "本次取得"'));
for (const label of ["直接答對", "提示後修正", "完成任務", "任務回報", "精熟加成", "再挑戰進步", "本次總計"]) assert.ok(source.includes(label));
assert.ok(!source.includes('data-bq-unit-achievements="true"'));
assert.ok(source.includes('data-bq-badge-overview="true"'));
assert.ok(source.includes("function resetForRelogin()"));
assert.ok(source.includes('data-relogin-action="true"'));
assert.ok(source.includes("重新登入，並從登入頁開始"));
assert.ok(!source.includes("class=\"student-title-card\""));
assert.ok(source.includes("__BIOQUEST_BADGE_OVERVIEW_STATE__"));
assert.ok(source.includes("BioQuestCharacterLayout?.enhance?.({ force: true })"));
assert.ok(source.includes("screen.dataset.bioquestScreen = state.screen"));
assert.ok(source.includes("guest 本次預估 EXP"));
assert.ok(source.includes("待後台確認"));
assert.ok(source.includes("本單元正式認列 EXP"));
assert.ok(source.includes("正式累積增量"));
assert.ok(source.includes('answer: "plant_cells"'));
assert.ok(source.includes('answer: "cheek_cells"'));
for (const revisedOption of ["pattern_only", "surface_not_body", "ordered_only", "magnification_only"]) assert.ok(source.includes(`id: "${revisedOption}"`), `missing revised q02/q12 option ${revisedOption}`);
assert.ok(source.includes("Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, localTotal, explicitLevel?.need || 0)"));
assert.ok(source.includes("function enterReflectionFromReview()"));
assert.ok(source.includes("function checkpointMissingItems("));
assert.ok(source.includes("function advanceCheckpoint("));
assert.ok(source.includes("function confirmSequence("));
assert.ok(source.includes('document.querySelector("#checkpoint1Next").addEventListener("click", () => advanceCheckpoint("checkpoint1", "checkpoint2"))'));
assert.ok(source.includes('document.querySelector("#checkpoint2Next").addEventListener("click", () => advanceCheckpoint("checkpoint2", "checkpoint3"))'));
assert.ok(source.includes('document.querySelector("#checkpoint3Next").addEventListener("click", () => advanceCheckpoint("checkpoint3", "checkpoint4"))'));
assert.ok(source.includes('document.querySelector("#checkpoint4Next").addEventListener("click", () => advanceCheckpoint("checkpoint4", "review"'));
assert.ok(source.includes("!state.answers.checkpoint4.sequenceConfirmed ? \"層級排序確認\""));
assert.ok(source.includes('id="confirmSequence"'));
assert.ok(source.includes("reviewNavigationNotice"));
assert.ok(source.includes("if (!state.student?.student_id) return 0;"));
assert.ok(source.includes("if (!state.student?.student_id) return null;"));
assert.ok(source.includes("登入狀態已失效，請重新登入後再填寫任務回報。"));
assert.ok(source.includes("請先完成關卡檢核並查看概念回饋，再填寫任務回報。"));
assert.ok(source.includes('addEventListener("click", enterReflectionFromReview)'));
assert.ok(index.includes("bioquest-title-progress.js"));
assert.ok(index.includes("20260713-backend-endpoint-v1"));
assert.ok(index.includes("styles.css?v=20260731-cell-basic-unit-submitted-retry-ia-v1"));
assert.ok(index.includes("app.js?v=20260731-cell-basic-unit-submitted-retry-ia-v1"));
assert.ok(index.includes('data-result-owl-src="assets/owl-basic-unit-result.webp"'));
assert.ok(source.includes('prep: `assets/owl-basic-unit-prep-reminder-v2.webp?v=${VERSION}`'));

for (const badge of [
  "cell_basic_reflection_reporter", "cell_basic_unit_entry", "cell_basic_unit_flawless",
  "cell_form_function_linker", "cell_unit_concept_keeper", "microscopic_evidence_reader",
  "retry_growth_cell_basic_unit", "unicellular_multicellular_sorter"
]) {
  assert.ok(fs.existsSync(path.join(root, "..", "shared-assets", "badges", "cell_basic_unit", `badge-cell_basic_unit-${badge}.webp`)), `missing badge ${badge}`);
}

console.log("cell-basic-unit UI regression checks passed");
