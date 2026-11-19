// ROADMAP R4-2a 共用成就模組：shared-assets/bioquest-achievements.js。
// 1. 共用模組的 renderAchievements／titleAndProgress，輸出必須和第 16–40 站遷移前內嵌的原寫法
//    （legacy-achievements.mjs）逐案相同；titleAndProgress 用各站真正的稱號等級表、多種學生資料與本機紀錄比對。
// 2. 已遷移的站：index.html 在 app.js 之前載入共用模組；app.js 只剩薄包裝，不再內嵌原寫法。
// 3. R4-2b 徽章牆 renderBadgeWall：第 30–40 站載入真正的 app.js，用站內徽章表（另加含特殊字元與未核准圖的測試徽章）
//    × 多種取得徽章組合 × 選項，和遷移前原寫法（LEGACY_BADGE_WALL_30_40）逐字比對。
// 4. R4-2c 結算頁 applyBackendSubmitResponse：第 31–40 站載入真正的 app.js，用多種後台回應 × 本機結果 × 學生資料，
//    和遷移前原寫法（LEGACY_SUBMIT_31_40）比對回傳值、學生資料的就地更新、存進本機的快照，以及丟出的錯誤。
// 5. R4-2c 第二批：第 22–30 站改用 applyVerifiedSubmitResponse，同樣方式和 LEGACY_SUBMIT_22_30 比對（另加 JSON 字串 attempt_result、逗號分隔徽章等回應）。
// 6. R4-2c 第三批：第 18 站（assumeVerified＋plainBadgeIds）、第 19–21 站（assumeVerified）改用 applyVerifiedSubmitResponse，
//    和 LEGACY_SUBMIT_18／LEGACY_SUBMIT_19_21 比對（另加沒寫狀態的 attempt、server_verified_credited、物件徽章等回應）。
// 7. R4-2c 第四批：第 16 站（rawAttemptResult＋localCounts＋countAliases＋badgeOrder skipEmpty）、第 17 站（同上但不存快照、badgeOrder attemptFirst）
//    改用 applyVerifiedSubmitResponse，和 LEGACY_SUBMIT_16／LEGACY_SUBMIT_17 比對（另加 correct／hints_used 別名、空清單在前、重複徽章等回應）。
// 8. R4-2d 第一批：第 1–4 站、第 6 站（trackCompletedAttempts）改用 applyAttemptSubmitResponse（第 1–13 站舊欄位格式），
//    和 LEGACY_SUBMIT_1_4／LEGACY_SUBMIT_6 比對（另加舊格式本機結果、title_avatar_variant、completed_attempts、badges 陣列等回應）。
// 9. R4-2d 第二批：第 7–13 站 applyBackendProgress 改用 applyLegacyStudentProgress（第 7 站無選項；第 8 站 syncProfileAndExp；
//    第 9–13 站 ignoreInvalid＋syncProfileAndExp＋afterApply），送出流程合併 verified_attempt 改用 mergeVerifiedAttempt；
//    載入真正的 app.js，用多種 progress × 站內狀態和 LEGACY_PROGRESS_7／_8／_9_13 比對 state 就地更新、丟出的錯誤與 updateBadgeOverviewBridge 呼叫次數。
// 10. R4-2d 第三批：第 14、15 站 applyBackendSubmitResponse 改用 applyNumberedSubmitResponse（第 15 站 applyProgress＋自己的徽章來源），
//    第 5 站 applyBackendStudentProgress／applyVerifiedAttempt 改用 applyMergedStudentProgress／applyServerVerifiedAttempt；
//    載入真正的 app.js，原寫法（LEGACY_SUBMIT_14／_15／LEGACY_STUDENT_5）在同一個站內環境執行（共用站內其他輔助函式），
//    比對回傳值、學生資料就地更新與丟出的錯誤。
// 11. R4-2d 第四批：第 1–10 站成就頁 renderAchievements 改用 renderRetryAchievements（7 種原寫法以選項保留），
//    載入真正的 app.js，在多種 state（有無學生、是否已送出）下和原寫法比對：去掉標籤之間的空白後逐字相同。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { LEGACY_ACH, LEGACY_T_LOCAL, LEGACY_T_REMOTE, LEGACY_BADGE_WALL_30_40, LEGACY_SUBMIT_31_40, LEGACY_SUBMIT_22_30, LEGACY_SUBMIT_18, LEGACY_SUBMIT_19_21, LEGACY_SUBMIT_16, LEGACY_SUBMIT_17, LEGACY_SUBMIT_1_4, LEGACY_SUBMIT_6, LEGACY_PROGRESS_7, LEGACY_PROGRESS_8, LEGACY_PROGRESS_9_13, LEGACY_MERGE_VERIFIED_7_13, LEGACY_SUBMIT_14, LEGACY_SUBMIT_15, LEGACY_STUDENT_5, LEGACY_ACH_LIFE_WORLD, LEGACY_ACH_SCIENTIFIC_METHOD, LEGACY_ACH_LAB_ENTRY, LEGACY_ACH_MICROSCOPE_USE, LEGACY_ACH_CELL_BASIC_UNIT, LEGACY_ACH_CELL_STRUCTURE, LEGACY_ACH_CELL_OBSERVATION, LEGACY_ACH_CELL_TRANSPORT, LEGACY_ACH_BIOLOGICAL_ORGANIZATION, LEGACY_ACH_SCALE } from "./legacy-achievements.mjs";

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

// 6. applyBackendSubmitResponse（R4-2c 第三批：第 18–21 站，applyVerifiedSubmitResponse＋選項）
export const SUBMIT_OPTION_STATIONS = [
  { slug: "cardiovascular-components", legacy: LEGACY_SUBMIT_18, ctx: "{ student: state.student, saveVerifiedSnapshot, assumeVerified: true, plainBadgeIds: true }" },
  { slug: "human-circulation", legacy: LEGACY_SUBMIT_19_21, ctx: "{ student: state.student, saveVerifiedSnapshot, assumeVerified: true }" },
  { slug: "stimulus-response", legacy: LEGACY_SUBMIT_19_21, ctx: "{ student: state.student, saveVerifiedSnapshot, assumeVerified: true }" },
  { slug: "nervous-system", legacy: LEGACY_SUBMIT_19_21, ctx: "{ student: state.student, saveVerifiedSnapshot, assumeVerified: true }" }
];
const optionResponses = verifiedResponses.concat([
  { ok: true, attempt: { correct_count: 8 }, verification_status: "", earned_badges_json: "[\"r1\"]" },
  { ok: true, attempt: { verification_status: "server_verified_credited", correct_count: 5 }, attempt_result: { earned_badges: [{ badge_id: "o1" }, "o2", null] } },
  { ok: true, verified_attempt: { verification_status: "pending_review", badges: ["v1", "", "v2"] }, newly_credited_badges_json: "n1,n2" },
  { ok: true, attempt: { verification_status: "local_only", total_questions: 0 }, attempt_result_json: "{\"newly_credited_badges_json\":\"{\\\"k\\\":1}\",\"earned_badges\":[\"e1\"]}" },
  { ok: true, verified_attempt: {}, attempt_result: { newly_credited_badges_json: "null", earned_badges_json: "7" }, earned_badges_json: "[\"resp\"]" },
  { ok: true, attempt: { badges: { a: 1 } }, attempt_result: { earned_badges_json: 12 } }
]);
let optionCases = 0;
for (const { slug, legacy, ctx } of SUBMIT_OPTION_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  assert(app.includes(`return window.BioQuestAchievements.applyVerifiedSubmitResponse(${ctx}, response, localResult);`), `${folder}: applyBackendSubmitResponse 應改用共用模組 applyVerifiedSubmitResponse（選項 ${ctx}）`);
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
    for (const response of optionResponses) {
      for (const local of submitLocal) {
        const legacySnapshots = [];
        const legacyState = { student: makeStudent() };
        const legacyCtx = { state: legacyState, saveVerifiedSnapshot: (s) => legacySnapshots.push(JSON.stringify(s)), JSON, Object, Number, Array, Set };
        const legacyFn = vm.runInNewContext(`${legacy}; applyBackendSubmitResponse`, legacyCtx);
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
        optionCases += 1;
      }
    }
  }
}


// 7. applyBackendSubmitResponse（R4-2c 第四批：第 16、17 站，applyVerifiedSubmitResponse＋選項）
export const SUBMIT_EARLY_STATIONS = [
  { slug: "plant-transport-structures", legacy: LEGACY_SUBMIT_16, ctx: "{ student: state.student, saveVerifiedSnapshot, assumeVerified: true, rawAttemptResult: true, localCounts: true, countAliases: true, badgeOrder: \"skipEmpty\" }" },
  { slug: "plant-material-transport", legacy: LEGACY_SUBMIT_17, ctx: "{ student: state.student, assumeVerified: true, rawAttemptResult: true, localCounts: true, badgeOrder: \"attemptFirst\" }" }
];
const earlyResponses = optionResponses.concat([
  { ok: true, verified_attempt: { correct: "6", hints_used: 3, total_questions: undefined, accuracy: "x" } },
  { ok: true, attempt: { verification_status: "pending_review", correct_count: null, correct: 4, hint_used_count: 0, hints_used: 9 } },
  { ok: true, verified_attempt: { newly_credited_badges_json: "[\"vn\"]", earned_badges_json: "[\"ve\"]" }, attempt_result: { newly_credited_badges_json: "[]", newly_credited_badges: [], earned_badges: ["e1", "e1", "e2"] } },
  { ok: true, attempt: { verification_status: "local_only" }, attempt_result: { newly_credited_badges: [], earned_badges_json: "[]" }, newly_credited_badges_json: "[]" },
  { ok: true, attempt: { verification_status: "local_only" }, attempt_result: { earned_badges: ["a", "a"] }, newly_credited_badges_json: "[\"r\",\"r\"]" },
  { ok: true, verified_attempt: { badges_json: "\"q1,q2\"" }, attempt_result_json: "{\"earned_badges\":[\"s\"],\"direct_exp\":5}" },
  { ok: true, verified_attempt: {}, attempt_result: { newly_credited_badges: ["n"], earned_badges_json: "[\"e\"]" } },
  { ok: true, attempt: { verification_status: "pending_review", earned_badges: 0, badges: false, badges_json: "[{\"id\":\"i1\"},null,{}]" }, attempt_result: "{\"mastery_exp\":9}" }
]);
let earlyCases = 0;
for (const { slug, legacy, ctx } of SUBMIT_EARLY_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  assert(app.includes(`return window.BioQuestAchievements.applyVerifiedSubmitResponse(${ctx}, response, localResult);`), `${folder}: applyBackendSubmitResponse 應改用共用模組 applyVerifiedSubmitResponse（選項 ${ctx}）`);
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
    for (const response of earlyResponses) {
      for (const local of submitLocal) {
        const legacySnapshots = [];
        const legacyState = { student: makeStudent() };
        const legacyCtx = { state: legacyState, saveVerifiedSnapshot: (s) => legacySnapshots.push(JSON.stringify(s)), JSON, Object, Number, Array, Set };
        const legacyFn = vm.runInNewContext(`${legacy}; applyBackendSubmitResponse`, legacyCtx);
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
        earlyCases += 1;
      }
    }
  }
}

// 8. applyBackendSubmitResponse（R4-2d 第一批：第 1–4、6 站，applyAttemptSubmitResponse）
export const SUBMIT_ATTEMPT_STATIONS = [
  { slug: "life-world", legacy: LEGACY_SUBMIT_1_4, ctx: "{ student: state.student }" },
  { slug: "scientific-method", legacy: LEGACY_SUBMIT_1_4, ctx: "{ student: state.student }" },
  { slug: "lab-entry", legacy: LEGACY_SUBMIT_1_4, ctx: "{ student: state.student }" },
  { slug: "microscope-use", legacy: LEGACY_SUBMIT_1_4, ctx: "{ student: state.student }" },
  { slug: "cell-structure", legacy: LEGACY_SUBMIT_6, ctx: "{ student: state.student, trackCompletedAttempts: true }" }
];
const attemptLocal = submitLocal.concat([
  { total: 12, correct: 9, correct_without_hint: 7, corrected_after_hint: 2, hint_used: 3, concept_exp: 70, revision_exp: 10, question_exp: 20, mastery_exp: 0, retry_exp: 5, attempt_total_exp: 105, total_exp: 105, unit_credited_exp: 105, credited_delta: 105, no_hint_perfect: false, badges: ["local_badge"], verification_status: "local_only" },
  { total: "10", correct: null, hint_used: undefined, badges: "not array" }
]);
const legacyVerified = { verification_status: "server_verified", total_questions: 12, correct: 11, correct_without_hint: 10, corrected_after_hint: 1, hints_used: 1, concept_exp: 110, revision_exp: 5, question_exp: 40, mastery_exp: 50, retry_exp: 0, attempt_total_exp: 205, unit_credited_exp: 205, credited_delta: 60, no_hint_perfect: 0, badges: ["srv_a"], hint_verification_status: "hint_verified" };
const attemptResponses = earlyResponses.concat([
  { ok: true, verified_attempt: legacyVerified, student_progress: { ...progress, title_avatar_variant: "female", completed_attempts: "3" } },
  { ok: true, attempt: { ...legacyVerified, verification_status: "", badges: "x", no_hint_perfect: 1 }, verification_status: "pending_review", hint_verification_status: "hint_pending" },
  { ok: true, attempt: { total_questions: null, correct: "abc", hints_used: "", attempt_total_exp: undefined } },
  { ok: true, progress: { completed_attempts: null, title_avatar_variant: "" }, verification_status: "pending_review" },
  { ok: true, progress: { total_exp: 0, completed_attempts: 0 } },
  { ok: true, verified_attempt: { total: 99, backend_response: "x" }, student_progress: {} }
]);
const attemptStudents = submitStudents.concat([
  () => ({ student_id: "s2", total_exp: 50, completed_attempts: 2, title_avatar_variant: "male" })
]);
// 第 1–13 站載入時會直接寫入畫面元素（例：第 4 站學生資訊），給一個什麼都接受的假元素。
function stubElement() {
  const fn = () => stub;
  const stub = new Proxy(fn, {
    get: (target, key) => (key === Symbol.toPrimitive ? () => "" : key === "length" ? 0 : stub),
    set: () => true,
    apply: () => stub
  });
  return stub;
}
let attemptCases = 0;
for (const { slug, legacy, ctx } of SUBMIT_ATTEMPT_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  assert(app.includes(`return window.BioQuestAchievements.applyAttemptSubmitResponse(${ctx}, response, localResult);`), `${folder}: applyBackendSubmitResponse 應改用共用模組 applyAttemptSubmitResponse（選項 ${ctx}）`);
  const sharedTag = html.indexOf(`../shared-assets/bioquest-achievements.js?v=${sharedVersion}`);
  assert(sharedTag > 0 && sharedTag < html.indexOf('<script src="app.js'), `${folder}: index.html 應在 app.js 之前載入共用成就模組 ${sharedVersion}`);
  const store = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    document: { readyState: "loading", querySelector() { return stubElement(); }, querySelectorAll() { return []; }, getElementById() { return stubElement(); }, addEventListener() {}, createElement() { return stubElement(); } },
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    Date,
    Math,
    setTimeout,
    clearTimeout,
    structuredClone
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(sharedSource, context);
  vm.runInNewContext(app, context, { filename: `${folder}/app.js` });
  const api = Object.entries(context).find(([key, value]) => /^__.+Test$/.test(key) && value?.applyBackendSubmitResponse)?.[1];
  assert(api, `${folder}: 找不到站內測試介面`);

  for (const makeStudent of attemptStudents) {
    for (const response of attemptResponses) {
      for (const local of attemptLocal) {
        const legacyState = { student: makeStudent() };
        const legacyFn = vm.runInNewContext(`${legacy}; applyBackendSubmitResponse`, { state: legacyState, Object, Number, Array, Boolean });
        let expected;
        try { expected = { value: JSON.stringify(legacyFn(structuredClone(response), structuredClone(local))) }; } catch (error) { expected = { error: error.constructor.name }; }

        api.setState({ student: makeStudent() });
        let actual;
        try { actual = { value: JSON.stringify(api.applyBackendSubmitResponse(structuredClone(response), structuredClone(local))) }; } catch (error) { actual = { error: error.constructor.name }; }
        const label = JSON.stringify({ response, local, student: makeStudent() });
        assert.deepEqual(actual, expected, `${folder}: applyBackendSubmitResponse 回傳與原寫法不同（${label}）`);
        assert.equal(JSON.stringify(api.state().student), JSON.stringify(legacyState.student), `${folder}: 學生資料更新與原寫法不同（${label}）`);
        attemptCases += 1;
      }
    }
  }
}

// 9. applyBackendProgress＋verified_attempt 合併（R4-2d 第二批：第 7–13 站）
const PROGRESS_STATIONS = [
  { slug: "cell-observation", legacy: LEGACY_PROGRESS_7, ctx: "{ state }", bridge: false },
  { slug: "cell-transport", legacy: LEGACY_PROGRESS_8, ctx: "{ state, syncProfileAndExp: true }", bridge: false },
  ...["biological-organization", "scale", "nutrients-energy", "nutrient-test", "enzymes"].map((slug) => ({ slug, legacy: LEGACY_PROGRESS_9_13, ctx: "{ state, ignoreInvalid: true, syncProfileAndExp: true, afterApply: updateBadgeOverviewBridge }", bridge: true }))
];
const fullProgress = { total_exp: 320, completed_unit_count: 4, badges_json: "[\"a\",\"b\"]", current_title_id: "t3", current_title: "細胞偵查員", title_avatar_path: "../shared-assets/title-avatars/t3-female.webp", profile_gender: "female", extra_field: 1 };
const progressInputs = [
  undefined,
  {},
  fullProgress,
  { badges: ["x", "y"], total_credited_exp: "150", completed_unit_count: "2" },
  { badges_json: "not json", badges: ["fallback"], total_exp: null, total_credited_exp: 90 },
  { badges_json: "{\"a\":1}", total_exp: "", completed_unit_count: null, current_title: "", title_avatar_path: null, profile_gender: "" },
  { badges_json: "", badges: "", total_exp: 0, completed_unit_count: 0 },
  { total_exp: "abc", current_title_id: "t9" },
  null,
  "abc",
  ["p"],
  5,
  false
];
const progressStates = [
  () => ({ student: null }),
  () => ({ student: null, cumulative_badges: ["old"], cumulative_total_exp: 40, completed_unit_count: 1 }),
  () => ({ student: { student_id: "s1" } }),
  () => ({ student: { student_id: "s1", progress: { total_exp: 10, keep: true }, current_title_id: "t1", current_title: "新手", title_avatar_path: "old.webp", profile_gender: "male", total_exp: 10 }, cumulative_badges: "[\"old\"]", cumulative_total_exp: "12", completed_unit_count: "3" }),
  () => ({ student: { student_id: "s2", progress: null, total_exp: undefined }, cumulative_badges: undefined })
];
let progressCases = 0;
let mergeCases = 0;
for (const { slug, legacy, ctx, bridge } of PROGRESS_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  assert(app.includes(`window.BioQuestAchievements.applyLegacyStudentProgress(${ctx}, progress);`), `${folder}: applyBackendProgress 應改用共用模組 applyLegacyStudentProgress（選項 ${ctx}）`);
  assert(app.includes("state.result = window.BioQuestAchievements.mergeVerifiedAttempt(state.result, response);"), `${folder}: 送出流程應改用共用模組 mergeVerifiedAttempt`);
  assert(!app.includes(LEGACY_MERGE_VERIFIED_7_13), `${folder}: 不應再內嵌原本的 verified_attempt 合併`);
  const sharedTag = html.indexOf(`../shared-assets/bioquest-achievements.js?v=${sharedVersion}`);
  assert(sharedTag > 0 && sharedTag < html.indexOf('<script src="app.js'), `${folder}: index.html 應在 app.js 之前載入共用成就模組 ${sharedVersion}`);
  const store = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    document: { readyState: "loading", querySelector() { return stubElement(); }, querySelectorAll() { return []; }, getElementById() { return stubElement(); }, addEventListener() {}, createElement() { return stubElement(); }, body: stubElement(), documentElement: stubElement() },
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
    location: { search: "", href: "http://localhost/", hash: "" },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    addEventListener() {},
    Date,
    Math,
    setTimeout,
    clearTimeout,
    structuredClone
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(sharedSource, context);
  const labPath = path.join(root, folder, "lab.js"); // 第 12 站互動實驗台在 app.js 之前載入
  if (fs.existsSync(labPath)) vm.runInNewContext(fs.readFileSync(labPath, "utf8"), context, { filename: `${folder}/lab.js` });
  const hook = bridge
    ? "updateBadgeOverviewBridge = function () { globalThis.__bridgeCalls += 1; };"
    : "";
  vm.runInNewContext(`${app}\n;globalThis.__bridgeCalls = 0; ${hook} globalThis.__r4Progress = { apply: (...args) => applyBackendProgress(...args), get: () => state, set: (next) => { state = next; } };`, context, { filename: `${folder}/app.js` });
  const api = context.__r4Progress;

  for (const makeState of progressStates) {
    for (const input of progressInputs) {
      const legacyState = makeState();
      const legacyCtx = { state: legacyState, parseArray(value) { if (Array.isArray(value)) return value; if (!value) return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }, bridgeCalls: 0, Number, JSON, Array, Object };
      legacyCtx.updateBadgeOverviewBridge = () => { legacyCtx.bridgeCalls += 1; };
      const legacyFn = vm.runInNewContext(`${legacy}; applyBackendProgress`, legacyCtx);
      const arg = input === undefined ? [] : [structuredClone(input)];
      let expected;
      try { legacyFn(...arg); expected = { state: JSON.stringify(legacyState) }; } catch (error) { expected = { error: error.constructor.name, state: JSON.stringify(legacyState) }; }

      api.set(makeState());
      context.__bridgeCalls = 0;
      let actual;
      try { api.apply(...arg); actual = { state: JSON.stringify(api.get()) }; } catch (error) { actual = { error: error.constructor.name, state: JSON.stringify(api.get()) }; }
      const label = JSON.stringify({ input: input === undefined ? "(undefined)" : input, state: makeState() });
      assert.deepEqual(actual, expected, `${folder}: applyBackendProgress 與原寫法不同（${label}）`);
      assert.equal(context.__bridgeCalls, legacyCtx.bridgeCalls, `${folder}: updateBadgeOverviewBridge 呼叫次數與原寫法不同（${label}）`);
      progressCases += 1;
    }
  }
}
const mergeResponses = [
  {},
  { verified_attempt: null },
  { verified_attempt: { total_questions: 12, correct: 11, badges: ["a"], concept_exp: 0 } },
  { verified_attempt: { total: undefined, correct: null } },
  { verified_attempt: "" },
  { verified_attempt: 0 },
  { verified_attempt: [1, 2] },
  { attempt: { correct: 5 } }
];
const mergeResults = [
  () => ({ total: 12, correct: 9, hint_used: 2, badges: ["local"] }),
  () => ({}),
  () => null
];
for (const response of mergeResponses) {
  for (const makeResult of mergeResults) {
    const legacyState = { result: makeResult() };
    vm.runInNewContext(LEGACY_MERGE_VERIFIED_7_13, { state: legacyState, response: structuredClone(response) });
    const before = makeResult();
    const merged = vm.runInNewContext("BioQuestAchievements.mergeVerifiedAttempt(before, response)", Object.assign(vm.createContext({}), { BioQuestAchievements: (() => { const c = {}; c.window = c; vm.runInNewContext(sharedSource, c); return c.BioQuestAchievements; })(), before, response: structuredClone(response) }));
    assert.equal(JSON.stringify(merged), JSON.stringify(legacyState.result), `mergeVerifiedAttempt 與原寫法不同（${JSON.stringify({ response, result: makeResult() })}）`);
    if (!response.verified_attempt) assert.equal(merged, before, "沒有 verified_attempt 時應回傳原物件");
    mergeCases += 1;
  }
}

// 10. 第 5、14、15 站送出回應（R4-2d 第三批）
const NUMBERED_STATIONS = [
  { slug: "photosynthesis", legacy: LEGACY_SUBMIT_14, call: "applyNumberedSubmitResponse({ student: state.student, badgeIds: (_response, verified) => badgeIdsFromResult(verified) }, response, localResult);" },
  { slug: "human-nutrition", legacy: LEGACY_SUBMIT_15, call: "applyNumberedSubmitResponse({\n    applyProgress: (progress) => applyStudentProgress({" },
  { slug: "cell-basic-unit", legacy: LEGACY_STUDENT_5, call: "applyServerVerifiedAttempt(localAttempt, backendResponse);" }
];
const numberedResponses = attemptResponses.concat([
  { ok: true, verified_attempt: { ...fullVerified, badges: [], badges_json: undefined, earned_badges_json: undefined } },
  { ok: true, verified_attempt: { ...fullVerified, badges_json: "", earned_badges_json: undefined } },
  { ok: true, verified_attempt: { ...fullVerified, badges_json: "[]", earned_badges_json: undefined, verification_status: "server_verified" } },
  { ok: true, verified_attempt: { ...fullVerified, earned_badges_json: undefined, earned_badges: [{ badge_id: "obj_a" }, "str_b", { id: "obj_c" }, null] } },
  { ok: true, verified_attempt: { ...fullVerified, earned_badges_json: undefined, earned_badge_ids_json: "[\"ids_a\"]", badges: "x" } },
  { ok: true, verified_attempt: { ...legacyVerified, accuracy: undefined, question_logs: [{ q: 1 }], reflection_quality: "good", reflection_exp_reason: "r", teacher_attention_needed: 1, badges: undefined, badges_json: "[\"j1\",\"j2\"]" } },
  { ok: true, verified_attempt: { ...legacyVerified, verification_status: "pending_review" } },
  { ok: true, verified_attempt: { ...legacyVerified, correct: NaN, badges: ["b_arr"], badges_json: "[\"b_json\"]" } },
  { ok: true, verified_attempt: { ...legacyVerified, badges: "", badges_json: "[\"b_json\"]" } },
  { ok: true, attempt: { ...legacyVerified, total_questions: 0, correct: 0 }, student_progress: { total_exp: null, current_title: null, title_avatar_variant: "female", profile_gender: "female" } },
  { ok: true, attempt_result: { newly_credited_badges_json: "[\"ar_new\"]", earned_badges_json: "[\"ar_old\"]", unit_badge_summary_patch_json: "[{\"unit_id\":\"human_nutrition\",\"badges\":[\"x\"]}]" }, verified_attempt: { ...fullVerified, earned_badges_json: undefined }, student_progress: { ...progress, badges_json: "[\"p1\"]" } },
  { ok: true, newly_credited_badges_json: "[\"resp_new\"]", unit_badge_summary_patch_json: "[{\"unit_id\":\"human_nutrition\",\"badges\":[\"y\"]}]", verified_attempt: { correct: "7", hints_used: "2", concept_exp: "30", question_exp: null, attempt_total_exp: "150", exp_delta: 5 }, progress: { total_exp: "900", unit_badge_summary_patch_json: "[]" } },
  { ok: true, verified_attempt: { newly_credited_badges_json: "not json", badges_json: 5 } },
  { ok: true, student_progress: "abc" },
  { ok: true, student_progress: ["p"] },
  null,
  undefined,
  { ok: false, verified_attempt: fullVerified }
]);
const numberedStudents = attemptStudents.concat([
  () => null,
  () => ({ student_id: "s3", total_exp: 10, progress: { total_exp: 10, badges_json: "[\"old_b\"]", unit_badge_summary_json: "[{\"unit_id\":\"enzymes\",\"badges\":[\"e\"]}]" }, current_title: "見習調查員" })
]);
const numberedLocal = attemptLocal.concat([
  { correct_count: 5, total_questions: 12, accuracy: 0.42, hint_used_count: 2, completion_exp: 100, direct_exp: 50, revision_exp: 5, reflection_exp: 20, mastery_exp: 0, retry_exp: 0, attempt_exp: 175, unit_credited_exp: 175, exp_delta: 175, earned_badges: ["local_a"], question_logs: [{ q: "local" }], reflection_quality: "ok" }
]);
let numberedCases = 0;
for (const { slug, legacy, call } of NUMBERED_STATIONS) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  assert(app.includes(`window.BioQuestAchievements.${call}`), `${folder}: 應改用共用模組（${call}）`);
  if (slug === "cell-basic-unit") {
    assert(app.includes("return window.BioQuestAchievements.applyMergedStudentProgress(state.student, data);"), `${folder}: applyBackendStudentProgress 應改用共用模組`);
    assert(!app.includes("function parseBadgeIds("), `${folder}: parseBadgeIds 已併入共用模組`);
  }
  const sharedTag = html.indexOf(`../shared-assets/bioquest-achievements.js?v=${sharedVersion}`);
  assert(sharedTag > 0 && sharedTag < html.indexOf('<script src="app.js'), `${folder}: index.html 應在 app.js 之前載入共用成就模組 ${sharedVersion}`);
  const store = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    document: { readyState: "loading", querySelector() { return stubElement(); }, querySelectorAll() { return []; }, getElementById() { return stubElement(); }, addEventListener() {}, createElement() { return stubElement(); }, body: stubElement(), documentElement: stubElement() },
    localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
    location: { search: "", href: "http://localhost/", hash: "" },
    URLSearchParams,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    addEventListener() {},
    Date,
    Math,
    setTimeout,
    clearTimeout,
    structuredClone
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(sharedSource, context);
  vm.runInNewContext(app, context, { filename: `${folder}/app.js` });
  const names = slug === "cell-basic-unit" ? "{ progress: applyBackendStudentProgress, verified: applyVerifiedAttempt }" : "{ submit: applyBackendSubmitResponse }";
  vm.runInNewContext(`globalThis.__r4Numbered = { current: ${names}, legacy: (() => { ${legacy}\n return ${names}; })(), get: () => state, set: (next) => { state = next; } };`, context);
  const api = context.__r4Numbered;
  const run = (fns, response, local) => {
    const out = {};
    try {
      if (fns.submit) out.value = JSON.stringify(fns.submit(structuredClone(response), structuredClone(local)));
      else out.value = JSON.stringify([fns.progress(structuredClone(response)), fns.verified(structuredClone(local), structuredClone(response))]);
    } catch (error) {
      out.error = error.constructor.name;
    }
    out.state = JSON.stringify(api.get().student);
    return out;
  };
  const baseState = api.get();
  for (const makeStudent of numberedStudents) {
    for (const response of numberedResponses) {
      for (const local of numberedLocal) {
        if (slug === "cell-basic-unit" && local === null) continue;
        api.set({ ...baseState, student: makeStudent() });
        const expected = run(api.legacy, response, local);
        api.set({ ...baseState, student: makeStudent() });
        const actual = run(api.current, response, local);
        const label = JSON.stringify({ response, local, student: makeStudent() });
        assert.deepEqual(actual, expected, `${folder}: 送出回應處理與原寫法不同（${label}）`);
        numberedCases += 1;
      }
    }
  }
}

// 11. R4-2d 第四批：第 1–10 站成就頁
const RETRY_ACH_STATIONS = {
  "life-world": LEGACY_ACH_LIFE_WORLD,
  "scientific-method": LEGACY_ACH_SCIENTIFIC_METHOD,
  "lab-entry": LEGACY_ACH_LAB_ENTRY,
  "microscope-use": LEGACY_ACH_MICROSCOPE_USE,
  "cell-basic-unit": LEGACY_ACH_CELL_BASIC_UNIT,
  "cell-structure": LEGACY_ACH_CELL_STRUCTURE,
  "cell-observation": LEGACY_ACH_CELL_OBSERVATION,
  "cell-transport": LEGACY_ACH_CELL_TRANSPORT,
  "biological-organization": LEGACY_ACH_BIOLOGICAL_ORGANIZATION,
  "scale": LEGACY_ACH_SCALE
};
const squash = (html) => String(html).replace(/>\s+</g, "><").trim();
let retryAchCases = 0;
const retryVariants = new Set();
for (const [slug, legacySource] of Object.entries(RETRY_ACH_STATIONS)) {
  const folder = `prototype-${slug}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  const sharedTag = index.indexOf(`../shared-assets/bioquest-achievements.js?v=${sharedVersion}`);
  const appTag = index.indexOf('<script src="app.js?v=');
  assert(sharedTag > 0 && appTag > sharedTag, `${folder}: index.html 必須在 app.js 之前載入共用成就模組 ${sharedVersion}`);
  assert(app.includes("return window.BioQuestAchievements.renderRetryAchievements("), `${folder}: renderAchievements 應改用 renderRetryAchievements`);
  assert(!app.includes("重新登入後開始新的挑戰"), `${folder}: 不應再內嵌成就頁原寫法`);
  const start = app.indexOf("function renderAchievements(");
  const end = app.indexOf("\n}", start) + 2;
  const wrapper = app.slice(start, end);
  const context = { window: null, renderLogin: () => "<LOGIN>" };
  context.window = context;
  vm.runInNewContext(sharedSource, context);
  vm.runInNewContext(`var state = {};\n${wrapper.replace("function renderAchievements(", "function currentAch(")}\n${legacySource.replace("function renderAchievements(", "function legacyAch(")}`, context);
  for (const student of [null, { student_id: "s1" }, { student_id: "guest", is_guest: true }]) {
    for (const submittedAt of [null, "", "2026-11-19T00:00:00Z"]) {
      context.state = { student, submitted_at: submittedAt, submitted: Boolean(submittedAt) };
      const expected = context.legacyAch();
      const actual = context.currentAch();
      assert.equal(squash(actual), squash(expected), `${folder}: 成就頁與原寫法不同（student=${JSON.stringify(student)}, submitted_at=${submittedAt}）`);
      assert.equal(actual.replace(/\s+/g, ""), expected.replace(/\s+/g, ""), `${folder}: 除空白外應逐字相同`);
      retryVariants.add(squash(expected));
      retryAchCases += 1;
    }
  }
}
assert(retryVariants.size >= 8, `第 1–10 站成就頁原寫法應涵蓋至少 8 種輸出（實際 ${retryVariants.size}）`);

console.log(JSON.stringify({ ok: true, sharedVersion, stations: ACHIEVEMENT_STATIONS.length, titleAndProgressCases: compared, badgeWallStations: BADGE_WALL_STATIONS.length, badgeWallCases, submitStations: SUBMIT_STATIONS.length, submitCases, submitVerifiedStations: SUBMIT_VERIFIED_STATIONS.length, verifiedCases, submitOptionStations: SUBMIT_OPTION_STATIONS.length, optionCases, submitEarlyStations: SUBMIT_EARLY_STATIONS.length, earlyCases, submitAttemptStations: SUBMIT_ATTEMPT_STATIONS.length, attemptCases, progressStations: PROGRESS_STATIONS.length, progressCases, mergeCases, numberedStations: NUMBERED_STATIONS.length, numberedCases, retryAchStations: Object.keys(RETRY_ACH_STATIONS).length, retryAchCases, retryVariants: retryVariants.size }));
