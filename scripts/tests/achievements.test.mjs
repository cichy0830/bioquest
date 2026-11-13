// ROADMAP R4-2a 共用成就模組：shared-assets/bioquest-achievements.js。
// 1. 共用模組的 renderAchievements／titleAndProgress，輸出必須和第 16–40 站遷移前內嵌的原寫法
//    （legacy-achievements.mjs）逐案相同；titleAndProgress 用各站真正的稱號等級表、多種學生資料與本機紀錄比對。
// 2. 已遷移的站：index.html 在 app.js 之前載入共用模組；app.js 只剩薄包裝，不再內嵌原寫法。
// 3. R4-2b 徽章牆 renderBadgeWall：第 30–40 站載入真正的 app.js，用站內徽章表（另加含特殊字元與未核准圖的測試徽章）
//    × 多種取得徽章組合 × 選項，和遷移前原寫法（LEGACY_BADGE_WALL_30_40）逐字比對。
// 4. R4-2c 結算頁 applyBackendSubmitResponse：第 31–40 站載入真正的 app.js，用多種後台回應 × 本機結果 × 學生資料，
//    和遷移前原寫法（LEGACY_SUBMIT_31_40）比對回傳值、學生資料的就地更新、存進本機的快照，以及丟出的錯誤。
// 5. R4-2c 第二批：第 22–30 站改用 applyVerifiedSubmitResponse，同樣方式和 LEGACY_SUBMIT_22_30 比對（另加 JSON 字串 attempt_result、逗號分隔徽章等回應）。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { LEGACY_ACH, LEGACY_T_LOCAL, LEGACY_T_REMOTE, LEGACY_BADGE_WALL_30_40, LEGACY_SUBMIT_31_40, LEGACY_SUBMIT_22_30 } from "./legacy-achievements.mjs";

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

// 3. renderBadgeWall（R4-2b：第 30–40 站）
export const BADGE_WALL_STATIONS = [
  "egg-observation",
  "flower-observation",
  "genetics-chromosome-gene",
  "human-genetics",
  "abo-blood-type",
  "mutation-genetic-disease",
  "biotechnology",
  "fossils-evolution",
  "naming-classification",
  "dichotomous-key",
  "prokaryotes-protists-fungi"
];
let badgeWallCases = 0;
for (const slug of BADGE_WALL_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  assert(app.includes("return window.BioQuestAchievements.renderBadgeWall({ badges, version: VERSION }, earned, options);"), `${folder}: renderBadgeWall 應改用共用模組`);
  assert(!app.includes("本次達成候選項目"), `${folder}: 不應再內嵌 renderBadgeWall 原寫法`);
  const store = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
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
  vm.runInNewContext(sharedSource, context);
  vm.runInNewContext(app, context, { filename: `${folder}/app.js` });
  const api = Object.entries(context).find(([key, value]) => /^__.+Test$/.test(key) && value?.renderBadgeWall)?.[1];
  assert(api, `${folder}: 找不到站內測試介面`);
  const escapeSource = app.match(/function escapeHtml\(value\) \{\n[^\n]*\n\}/)[0];
  const legacyContext = { badges: api.badges, VERSION: api.VERSION };
  const legacyWall = vm.runInNewContext(`${escapeSource}\n${LEGACY_BADGE_WALL_30_40}; renderBadgeWall`, legacyContext);

  const extras = [
    { id: "zz_test_special", name: `測<試>&"'徽章`, condition: `條件<b>&"'`, image_status: "ready", badge_image_path: "assets/x.webp" },
    { id: "zz_test_pending", name: "未核准圖", condition: "等待圖像", image_status: "pending", badge_image_path: "assets/y.webp" },
    { id: "zz_test_nopath", name: "沒有圖片路徑", condition: "無路徑", image_status: "ready", badge_image_path: "" },
    { id: "zz_test_nostatus", name: "沒有狀態", condition: "無狀態" }
  ];
  for (const withExtras of [false, true]) {
    if (withExtras) api.badges.push(...extras);
    const ids = api.badges.map((badge) => badge.id);
    const ready = api.badges.filter((badge) => badge.image_status === "ready" && badge.badge_image_path).map((badge) => badge.id);
    const notReady = ids.filter((id) => !ready.includes(id));
    const earnedSets = [undefined, null, [], ids, ids.slice(0, 1), ids.slice(-2), ready, notReady, ready.slice(0, 2).concat(notReady.slice(0, 2)), ["unknown_badge"], [ids[0], ids[0], "unknown_badge", ids[1]]];
    for (const earned of earnedSets) {
      for (const options of [undefined, {}, { onlyEarned: true }, { onlyEarned: false }, { onlyEarned: 1 }]) {
        const expected = legacyWall(earned, options);
        assert.equal(api.renderBadgeWall(earned, options), expected, `${folder}: renderBadgeWall 與原寫法不同（${JSON.stringify({ earned, options, withExtras })}）`);
        badgeWallCases += 1;
      }
    }
    if (withExtras) api.badges.splice(api.badges.length - extras.length, extras.length);
  }
  assert.equal(api.renderBadgeWall(), legacyWall(), `${folder}: 預設參數結果不同`);
}

// 4. applyBackendSubmitResponse（R4-2c：第 31–40 站）
export const SUBMIT_STATIONS = BADGE_WALL_STATIONS.slice(1);
const submitLocal = [
  { verification_status: "pending_backend", correct_count: 9, total_questions: 12, accuracy: 0.75, hint_used_count: 2, completion_exp: 100, direct_exp: 90, revision_exp: 20, reflection_exp: 30, mastery_exp: 0, retry_exp: 0, attempt_exp: 240, unit_credited_exp: 240, exp_delta: 240, earned_badges: ["local_a", "local_b"], answers: { q01: "a" } },
  { correct_count: "7", total_questions: null, accuracy: undefined, earned_badges: [] },
  {}
];
const fullVerified = { verification_status: "server_verified", correct_count: 11, total_questions: 12, accuracy: "0.92", hint_used_count: 0, completion_exp: 100, concept_exp: 110, revision_exp: 0, question_exp: 40, mastery_exp: 50, retry_exp: 0, attempt_total_exp: 300, credited_delta: 60, earned_badges_json: JSON.stringify(["srv_a", "srv_b", "srv_a"]) };
const progress = { total_exp: 5400, current_title_id: "systems_investigator", current_title: "系統調查員", title_avatar_path: "../shared-assets/x.webp" };
const submitResponses = [
  undefined,
  null,
  { ok: false, error: "x" },
  { ok: true },
  { ok: true, student_progress: progress },
  { ok: true, progress: { total_exp: null } },
  { ok: true, progress: { total_exp: "1200", current_title: "" } },
  { ok: true, verified_attempt: fullVerified, student_progress: progress },
  { ok: true, verified_attempt: { ...fullVerified, verification_status: "server_verified_credited", earned_badges_json: "" }, newly_credited_badges_json: "{\"r1\":true,\"r2\":false}" },
  { ok: true, verified_attempt: { verification_status: "pending_review" } },
  { ok: true, verified_attempt: { verification_status: "pending_review", badges: [{ badge_id: "b1" }, { id: "b2" }, "b3", {}] } },
  { ok: true, attempt: { correct_count: "abc", direct_exp: "", exp_delta: 0 } },
  { ok: true, attempt_result: { verification_status: "server_verified", attempt_exp: 120, unit_credited_exp: undefined, newly_credited_badges: ["n1"] } },
  { ok: true, result: { accuracy: Infinity, retry_exp: "15", earned_badges_json: "not json" }, verification_status: "local_only" },
  { ok: true, verified_attempt: { badges_json: "[\"j1\",\"j2\"]" }, attempt_result: { earned_badges_json: "{}" }, earned_badges: ["resp1"] },
  { ok: true, verified_attempt: null, attempt_result: null, badges_json: "[1]" },
  { verified_attempt: { correct_count: 3 }, attempt_result: { correct_count: 4, mastery_exp: 25 }, student_progress: { current_title_id: "life_observer" } }
];
const submitStudents = [
  () => ({ student_id: "s1", total_exp: 100, current_title_id: "life_observer", current_title: "生命觀察員", title_avatar_path: "old.webp" }),
  () => ({ student_id: "guest", is_guest: true }),
  () => null
];
let submitCases = 0;
for (const slug of SUBMIT_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  assert(app.includes("return window.BioQuestAchievements.applySubmitResponse({ student: state.student, saveVerifiedSnapshot }, response, localResult);"), `${folder}: applyBackendSubmitResponse 應改用共用模組`);
  for (const name of ["numberFromAliases", "objectFromValue", "badgeIdsFromValue", "backendBadgeIds"]) {
    assert(!app.includes(`function ${name}(`), `${folder}: 不應再內嵌 ${name}`);
  }
  const store = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    document: { readyState: "loading", querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    Date,
    Math,
    setTimeout,
    clearTimeout
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(sharedSource, context);
  vm.runInNewContext(app, context, { filename: `${folder}/app.js` });
  const api = Object.entries(context).find(([key, value]) => /^__.+Test$/.test(key) && value?.applyBackendSubmitResponse)?.[1];
  assert(api, `${folder}: 找不到站內測試介面`);

  for (const makeStudent of submitStudents) {
    for (const response of submitResponses) {
      for (const local of submitLocal) {
        // 原寫法：在獨立環境跑，state 與 saveVerifiedSnapshot 用記錄器
        const legacySnapshots = [];
        const legacyState = { student: makeStudent() };
        const legacyCtx = { state: legacyState, saveVerifiedSnapshot: (s) => legacySnapshots.push(JSON.stringify(s)), JSON, Object, Number, Array, Set };
        const legacyFn = vm.runInNewContext(`${LEGACY_SUBMIT_31_40}; applyBackendSubmitResponse`, legacyCtx);
        let expected;
        try { expected = { value: JSON.stringify(legacyFn(structuredClone(response), structuredClone(local))) }; } catch (error) { expected = { error: error.constructor.name }; }

        const student = makeStudent();
        store.clear();
        api.setState({ student });
        let actual;
        try { actual = { value: JSON.stringify(api.applyBackendSubmitResponse(structuredClone(response), structuredClone(local))) }; } catch (error) { actual = { error: error.constructor.name }; }
        const label = JSON.stringify({ response, local, student: makeStudent() });
        assert.deepEqual(actual, expected, `${folder}: applyBackendSubmitResponse 回傳與原寫法不同（${label}）`);
        assert.equal(JSON.stringify(api.state().student), JSON.stringify(legacyState.student), `${folder}: 學生資料更新與原寫法不同（${label}）`);
        // 本機快照：原寫法呼叫一次 saveVerifiedSnapshot 時，站內應寫入同一份學生資料的快照（guest 不寫）
        const snapshotWrites = [...store.entries()].filter(([key]) => /verified/i.test(key));
        if (legacySnapshots.length && !legacyState.student?.is_guest) {
          assert.equal(snapshotWrites.length, 1, `${folder}: 應寫入一次本機快照（${label}）`);
          assert.equal(JSON.parse(snapshotWrites[0][1]).total_exp, Number(legacyState.student.progress?.total_exp ?? legacyState.student.total_exp ?? 0), `${folder}: 快照 total_exp 不同（${label}）`);
        } else {
          assert.equal(snapshotWrites.length, 0, `${folder}: 不應寫入本機快照（${label}）`);
        }
        submitCases += 1;
      }
    }
  }
}

// 5. applyBackendSubmitResponse（R4-2c 第二批：第 22–30 站，applyVerifiedSubmitResponse）
export const SUBMIT_VERIFIED_STATIONS = ["cell-division", "egg-observation", "behavior-sensing", "endocrine-system", "sexual-reproduction", "asexual-reproduction", "respiration-homeostasis", "excretion-water-homeostasis", "temperature-glucose-homeostasis"];
const verifiedResponses = submitResponses.concat([
  { ok: true, verified_attempt: { verification_status: "server_verified", correct_count: "", total_questions: "12" }, attempt_result_json: JSON.stringify({ correct_count: 10, direct_exp: "80", newly_credited_badges_json: "x1, x2 ,,x3" }) },
  { ok: true, attempt: { verification_status: "local_only", accuracy: null }, attempt_result: "not json", newly_credited_badges_json: "[{\"badgeId\":\"c1\"},{\"badge_id\":\"c2\"},7]" },
  { ok: true, attempt: {}, result: "[1,2]", earned_badges_json: "{\"a\":1}" },
  { ok: true, verified_attempt: { earned_badges: [] }, attempt_result: { earned_badges: "" }, earned_badges_json: "[]" },
  { ok: true, verified_attempt: { verification_status: "server_verified_credited", unit_credited_exp: "0", exp_delta: "-5" }, attempt_result: ["arr"] },
  { ok: true, attempt: { verification_status: "pending_review" }, student_progress: { total_exp: undefined, title_avatar_path: "" } }
]);
let verifiedCases = 0;
for (const slug of SUBMIT_VERIFIED_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  assert(app.includes("return window.BioQuestAchievements.applyVerifiedSubmitResponse({ student: state.student, saveVerifiedSnapshot }, response, localResult);"), `${folder}: applyBackendSubmitResponse 應改用共用模組 applyVerifiedSubmitResponse`);
  for (const name of ["numberFromAliases", "objectFromValue", "badgeIdsFromValue", "firstBadgeIds", "backendBadgeIds"]) {
    assert(!app.includes(`function ${name}(`), `${folder}: 不應再內嵌 ${name}`);
  }
  const store = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    document: { readyState: "loading", querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    Date,
    Math,
    setTimeout,
    clearTimeout
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(sharedSource, context);
  vm.runInNewContext(app, context, { filename: `${folder}/app.js` });
  const api = Object.entries(context).find(([key, value]) => /^__.+Test$/.test(key) && value?.applyBackendSubmitResponse)?.[1];
  assert(api, `${folder}: 找不到站內測試介面`);

  for (const makeStudent of submitStudents) {
    for (const response of verifiedResponses) {
      for (const local of submitLocal) {
        const legacySnapshots = [];
        const legacyState = { student: makeStudent() };
        const legacyCtx = { state: legacyState, saveVerifiedSnapshot: (s) => legacySnapshots.push(JSON.stringify(s)), JSON, Object, Number, Array, Set };
        const legacyFn = vm.runInNewContext(`${LEGACY_SUBMIT_22_30}; applyBackendSubmitResponse`, legacyCtx);
        let expected;
        try { expected = { value: JSON.stringify(legacyFn(structuredClone(response), structuredClone(local))) }; } catch (error) { expected = { error: error.constructor.name }; }

        const student = makeStudent();
        store.clear();
        api.setState({ student });
        let actual;
        try { actual = { value: JSON.stringify(api.applyBackendSubmitResponse(structuredClone(response), structuredClone(local))) }; } catch (error) { actual = { error: error.constructor.name }; }
        const label = JSON.stringify({ response, local, student: makeStudent() });
        assert.deepEqual(actual, expected, `${folder}: applyBackendSubmitResponse 回傳與原寫法不同（${label}）`);
        assert.equal(JSON.stringify(api.state().student), JSON.stringify(legacyState.student), `${folder}: 學生資料更新與原寫法不同（${label}）`);
        const snapshotWrites = [...store.entries()].filter(([key]) => /verified/i.test(key));
        if (legacySnapshots.length && !legacyState.student?.is_guest) {
          assert.equal(snapshotWrites.length, 1, `${folder}: 應寫入一次本機快照（${label}）`);
          assert.equal(JSON.parse(snapshotWrites[0][1]).total_exp, Number(legacyState.student.progress?.total_exp ?? legacyState.student.total_exp ?? 0), `${folder}: 快照 total_exp 不同（${label}）`);
        } else {
          assert.equal(snapshotWrites.length, 0, `${folder}: 不應寫入本機快照（${label}）`);
        }
        verifiedCases += 1;
      }
    }
  }
}

console.log(JSON.stringify({ ok: true, sharedVersion, stations: ACHIEVEMENT_STATIONS.length, titleAndProgressCases: compared, badgeWallStations: BADGE_WALL_STATIONS.length, badgeWallCases, submitStations: SUBMIT_STATIONS.length, submitCases, submitVerifiedStations: SUBMIT_VERIFIED_STATIONS.length, verifiedCases }));
