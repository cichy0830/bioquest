// ROADMAP R4-2a 共用成就模組：shared-assets/bioquest-achievements.js。
// 1. 共用模組的 renderAchievements／titleAndProgress，輸出必須和第 16–40 站遷移前內嵌的原寫法
//    （legacy-achievements.mjs）逐案相同；titleAndProgress 用各站真正的稱號等級表、多種學生資料與本機紀錄比對。
// 2. 已遷移的站：index.html 在 app.js 之前載入共用模組；app.js 只剩薄包裝，不再內嵌原寫法。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { LEGACY_ACH, LEGACY_T_LOCAL, LEGACY_T_REMOTE } from "./legacy-achievements.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sharedSource = fs.readFileSync(path.join(root, "shared-assets", "bioquest-achievements.js"), "utf8");
const sharedVersion = sharedSource.match(/const VERSION = "([^"]+)"/)[1];

// 第 16–40 站；titleAndProgress：16–19 原本有但沒被呼叫（已刪），20 原本就沒有，21–23 只看後台，24–40 另計本機紀錄。
export const ACHIEVEMENT_STATIONS = [
  ["plant-transport-structures", "none"],
  ["plant-material-transport", "none"],
  ["cardiovascular-components", "none"],
  ["human-circulation", "none"],
  ["stimulus-response", "none"],
  ["nervous-system", "remote"],
  ["endocrine-system", "remote"],
  ["behavior-sensing", "remote"],
  ["respiration-homeostasis", "local"],
  ["excretion-water-homeostasis", "local"],
  ["temperature-glucose-homeostasis", "local"],
  ["cell-division", "local"],
  ["asexual-reproduction", "local"],
  ["sexual-reproduction", "local"],
  ["egg-observation", "local"],
  ["flower-observation", "local"],
  ["genetics-chromosome-gene", "local"],
  ["human-genetics", "local"],
  ["abo-blood-type", "local"],
  ["mutation-genetic-disease", "local"],
  ["biotechnology", "local"],
  ["fossils-evolution", "local"],
  ["naming-classification", "local"],
  ["dichotomous-key", "local"],
  ["prokaryotes-protists-fungi", "local"]
];

function sharedModule() {
  const context = { Object, Number, Math, Set };
  context.window = context;
  vm.runInNewContext(sharedSource, context);
  return context.BioQuestAchievements;
}

const shared = sharedModule();
assert.equal(shared.VERSION, sharedVersion);

// 1a. renderAchievements
{
  const legacy = vm.runInNewContext(`${LEGACY_ACH}; renderAchievements`, {});
  assert.equal(shared.renderAchievements(), legacy());
}

// 1b. titleAndProgress
const students = [
  undefined,
  null,
  {},
  { student_id: "s1" },
  { student_id: "s1", total_exp: 0 },
  { student_id: "s1", total_exp: 499 },
  { student_id: "s1", total_exp: 500 },
  { student_id: "s1", total_exp: "1600" },
  { student_id: "s1", total_exp: "abc" },
  { student_id: "s1", total_exp: 30000 },
  { student_id: "s1", total_exp: 100, progress: { total_exp: 5300 } },
  { student_id: "s1", progress: { total_exp: null }, total_exp: 800 },
  { student_id: "s1", total_exp: 100, current_title_id: "systems_investigator" },
  { student_id: "s1", total_exp: 9000, progress: { current_title_id: "life_observer" } },
  { student_id: "s2", total_exp: 2000, current_title_id: "unknown_title" },
  { student_id: "guest", is_guest: true, total_exp: 0 }
];
const attemptStores = [
  [],
  [{ student_id: "s1", unit_id: "other_unit", unit_credited_exp: 700 }],
  [
    { student_id: "s1", unit_id: "other_unit", unit_credited_exp: "900" },
    { student_id: "s1", unit_id: "__SELF__", unit_credited_exp: 5000 },
    { student_id: "s2", unit_id: "other_unit", unit_credited_exp: 4000 },
    { student_id: "s1", unit_id: "third_unit", unit_credited_exp: null }
  ],
  [{ student_id: undefined, unit_id: "other_unit", unit_credited_exp: 12000 }]
];
const localGains = [0, 250, "40", undefined, null];

let compared = 0;
for (const [slug, kind] of ACHIEVEMENT_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");

  // 2. 載入順序與薄包裝
  const sharedTag = index.indexOf(`../shared-assets/bioquest-achievements.js?v=${sharedVersion}`);
  const appTag = index.indexOf('<script src="app.js?v=');
  assert(sharedTag > 0 && appTag > sharedTag, `${folder}: index.html 必須在 app.js 之前載入共用成就模組 ${sharedVersion}`);
  assert(app.includes("return window.BioQuestAchievements.renderAchievements();"), `${folder}: renderAchievements 應改用共用模組`);
  assert(!app.includes("重新登入後開始新的挑戰"), `${folder}: 不應再內嵌 renderAchievements 原寫法`);
  assert(!app.includes("attempt.unit_credited_exp || 0), 0) + Number(localGain"), `${folder}: 不應再內嵌 titleAndProgress 原寫法`);
  if (kind === "none") {
    assert(!app.includes("titleAndProgress"), `${folder}: 不應有 titleAndProgress`);
    continue;
  }
  assert(app.includes("window.BioQuestAchievements.titleAndProgress("), `${folder}: titleAndProgress 應改用共用模組`);
  assert(app.includes(`countLocalAttempts: ${kind === "local"}`), `${folder}: countLocalAttempts 應為 ${kind === "local"}`);

  const levelsSource = app.match(/const titleLevels = \[[\s\S]*?\n\];/)[0];
  const unitId = app.match(/"?unit_id"?: "([a-z_]+)"/)[1];
  for (const store of attemptStores) {
    const attempts = store.map((attempt) => ({ ...attempt, unit_id: attempt.unit_id === "__SELF__" ? unitId : attempt.unit_id }));
    for (const student of students) {
      for (const localGain of kind === "local" ? localGains : [undefined]) {
        const legacyContext = { state: { student }, mission: { unit_id: unitId }, loadAttempts: () => attempts.map((a) => ({ ...a })), Number, Math };
        const legacyFn = vm.runInNewContext(`${levelsSource}\n${kind === "local" ? LEGACY_T_LOCAL : LEGACY_T_REMOTE}; ({ titleAndProgress, titleLevels })`, legacyContext);
        const stationContext = { state: { student }, mission: { unit_id: unitId }, loadAttempts: () => attempts.map((a) => ({ ...a })), window: { BioQuestAchievements: shared } };
        const wrapperSource = app.match(/function titleAndProgress\([^)]*\) \{\n[^\n]*\n\}/)[0];
        const stationFn = vm.runInNewContext(`${levelsSource}\n${wrapperSource}; titleAndProgress`, stationContext);
        const args = kind === "local" ? [student, localGain] : [student];
        const expected = JSON.stringify(legacyFn.titleAndProgress(...args));
        assert.equal(JSON.stringify(stationFn(...args)), expected, `${folder}: titleAndProgress 與原寫法不同（${JSON.stringify({ student, localGain, store })}）`);
        // 預設參數（student = state.student）
        assert.equal(JSON.stringify(stationFn()), JSON.stringify(legacyFn.titleAndProgress()), `${folder}: 預設參數結果不同`);
        compared += 2;
      }
    }
  }
}

console.log(JSON.stringify({ ok: true, sharedVersion, stations: ACHIEVEMENT_STATIONS.length, titleAndProgressCases: compared }));
