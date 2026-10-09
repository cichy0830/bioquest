#!/usr/bin/env node
// 跨站成就一致性 2a（後台部分）：在 node 中載入 Apps Script 後台，以記憶體模擬 Google Sheet，
// 讓同一位虛擬學生依序完成多站（首次含錯題與提示、再挑戰全對、再挑戰退步），
// 每次提交後獨立重算預期的 EXP、稱號、徽章，與後台回應、StudentProgress、登入回應比對。
// 完全不連網路，不會寫入正式後台。
//
// 用法：
//   BIOQUEST_WORKSPACE=../bioquest-workspace node scripts/simulate-achievement-progress.mjs [--units=life_world,scale] [--json=out.json]
// 預設模擬第 1–15 站。
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const DEFAULT_UNITS = [
  "life_world", "scientific_method", "lab_intro", "microscope_use", "cell_basic_unit",
  "cell_structure", "cell_observation", "cell_transport", "biological_organization",
  "scale", "nutrients_energy", "nutrient_test", "enzymes", "photosynthesis", "human_nutrition",
];

export function findLoader() {
  const candidates = [];
  if (process.env.BIOQUEST_WORKSPACE) candidates.push(path.join(process.env.BIOQUEST_WORKSPACE, "05_教師後台", "tests", "apps-script-loader.js"));
  let current = root;
  for (let i = 0; i < 4; i += 1) {
    candidates.push(path.join(current, "05_教師後台", "tests", "apps-script-loader.js"));
    candidates.push(path.join(current, "bioquest-workspace", "05_教師後台", "tests", "apps-script-loader.js"));
    current = path.dirname(current);
  }
  const found = candidates.find((file) => fs.existsSync(file));
  return found ? path.resolve(found) : null;
}

// ---------- 記憶體版 Google Sheet ----------
class FakeRange {
  constructor(sheet, row, col, rows, cols) { Object.assign(this, { sheet, row, col, rows, cols }); }
  getValues() {
    const out = [];
    for (let r = 0; r < this.rows; r += 1) {
      const line = [];
      for (let c = 0; c < this.cols; c += 1) {
        const v = (this.sheet.data[this.row - 1 + r] || [])[this.col - 1 + c];
        line.push(v === undefined ? "" : v);
      }
      out.push(line);
    }
    return out;
  }
  setValues(values) {
    values.forEach((line, r) => line.forEach((v, c) => this.sheet.set(this.row + r, this.col + c, v)));
    return this;
  }
  setValue(v) { this.sheet.set(this.row, this.col, v); return this; }
}

class FakeSheet {
  constructor(name) { this.name = name; this.data = []; this.maxColumns = 26; }
  set(row, col, value) {
    while (this.data.length < row) this.data.push([]);
    this.data[row - 1][col - 1] = value;
    this.maxColumns = Math.max(this.maxColumns, col);
  }
  getLastRow() { return this.data.length; }
  getLastColumn() { return this.data.reduce((max, line) => Math.max(max, line.length), 0); }
  getMaxColumns() { return this.maxColumns; }
  insertColumnsAfter(after, count) { this.maxColumns += count; }
  getRange(row, col, rows = 1, cols = 1) { return new FakeRange(this, row, col, rows, cols); }
  getDataRange() { return new FakeRange(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
  appendRow(values) { const row = this.data.length + 1; values.forEach((v, i) => this.set(row, i + 1, v)); }
}

class FakeSpreadsheet {
  constructor() { this.sheets = new Map(); }
  getSheetByName(name) { return this.sheets.get(name) || null; }
  insertSheet(name) { const s = new FakeSheet(name); this.sheets.set(name, s); return s; }
}

function makeContext(source) {
  const ss = new FakeSpreadsheet();
  let clock = Date.parse("2026-10-01T00:00:00Z");
  const RealDate = Date;
  // 讓每次 new Date() 都往前推 1 秒，確保 submitted_at 嚴格遞增（模擬真實時間順序）。
  class TickDate extends RealDate {
    constructor(...args) { if (args.length) super(...args); else { clock += 1000; super(clock); } }
    static now() { clock += 1000; return clock; }
  }
  const context = {
    console,
    Date: TickDate,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      DigestAlgorithm: { SHA_256: "sha256" },
      Charset: { UTF_8: "utf8" },
      computeDigest: (alg, value) => Array.from(crypto.createHash("sha256").update(String(value), "utf8").digest()).map((b) => (b > 127 ? b - 256 : b)),
      base64EncodeWebSafe: (bytes) => Buffer.from(bytes.map((b) => (b < 0 ? b + 256 : b))).toString("base64").replace(/\+/g, "-").replace(/\//g, "_"),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; }, getContent() { return text; } }),
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => "" }) },
  };
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__bq = { CANONICAL_UNIT_REGISTRY, TITLE_LEVELS, UNIT_BADGE_TOTALS, SHEETS, ATTEMPT_HEADERS, QUESTION_LOG_HEADERS, ATTEMPT_SESSION_HEADERS, STUDENT_PROGRESS_HEADERS };`, context);
  return { context, ss, bq: context.__bq };
}

function seedSheets(ctx, student) {
  const { context, ss, bq } = ctx;
  const students = ss.insertSheet(bq.SHEETS.students);
  const headers = ["student_id", "class_name", "seat_no", "student_name", "active", "profile_gender"];
  students.appendRow(headers);
  students.appendRow(headers.map((h) => student[h] ?? ""));
  context.ensureSheetWithHeaders_(ss, bq.SHEETS.attempts, bq.ATTEMPT_HEADERS);
  context.ensureSheetWithHeaders_(ss, bq.SHEETS.questionLogs, bq.QUESTION_LOG_HEADERS);
  context.ensureSheetWithHeaders_(ss, bq.SHEETS.attemptSessions, bq.ATTEMPT_SESSION_HEADERS);
  context.ensureSheetWithHeaders_(ss, bq.SHEETS.studentProgress, bq.STUDENT_PROGRESS_HEADERS);
  context.ensureSheetWithHeaders_(ss, bq.SHEETS.teacherReview, ["review_id", "attempt_id", "student_id", "student_name", "class_name", "unit_id", "issue_type", "priority", "student_question", "reflection_quality", "review_status", "created_at"]);
}

// ---------- 作答產生 ----------
function rawKey(qid, question) {
  if (question.type === "sequence") return `${qid}_sequence`;
  if (question.type === "mapping" || question.type === "card_sort") return `${qid}_map`;
  if (question.type === "branch_choice") return `${qid}_branch`;
  if (question.type === "branch_path") return `${qid}_path`;
  if (question.type === "branch_next_node") return `${qid}_next_node`;
  return qid;
}

function correctAnswer(question) {
  return JSON.parse(JSON.stringify(question.answer));
}

function wrongAnswer(question) {
  const a = question.answer;
  if (typeof a === "string") return `${a}__錯誤選項`;
  if (question.type === "sequence") {
    const reversed = a.slice().reverse();
    return JSON.stringify(reversed) === JSON.stringify(a) ? a.map((v, i) => (i === 0 ? `${v}_x` : v)) : reversed;
  }
  if (question.type === "set") return a.map((v, i) => (i === 0 ? `${v}__錯誤` : v));
  if (question.type === "mapping" || question.type === "card_sort") {
    const keys = Object.keys(a);
    const out = { ...a };
    out[keys[0]] = `${a[keys[0]]}__錯誤`;
    return out;
  }
  throw new Error(`無法產生錯誤答案：${question.type}`);
}

function reflectionText(registry, quality) {
  if (quality === "blank") return "";
  const terms = registry.reflection.conceptTerms;
  // ≥22 字、含概念詞、含疑問句型、不與方向文字相似 → discussion_question（40 EXP）
  return `我想確認${terms[0]}和${terms[1] || terms[0]}在實際例子裡要怎麼分辨，為什麼課本的例子會這樣判斷呢`;
}

// ---------- 獨立預期計算（不呼叫後台函式） ----------
function expectedAttempt(unitId, registry, plan, previous) {
  const qids = Object.keys(registry.questions);
  const total = qids.length;
  const wrong = new Set(plan.wrong);
  const hinted = new Set(plan.hints);
  const correct = qids.filter((q) => !wrong.has(q)).length;
  const direct = qids.filter((q) => !wrong.has(q) && !hinted.has(q)).length;
  const revised = qids.filter((q) => !wrong.has(q) && hinted.has(q)).length;
  const accuracy = correct / total;
  const questionExp = plan.reflection === "discussion" ? 40 : 0;
  const cap = Math.min(500, 460 + questionExp);
  const mastery = accuracy === 1 && hinted.size === 0 ? 140 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const base = Math.min(cap, 100 + Math.round(220 * (direct / total)) + Math.round(180 * (revised / total)) + questionExp + mastery);
  const retryCandidate = previous && accuracy > previous.accuracy ? Math.min(60, Math.round((accuracy - previous.accuracy) * 100)) : 0;
  const retry = Math.min(retryCandidate, Math.max(0, cap - base));
  const attemptTotal = Math.min(cap, base + retry);
  return { accuracy, attemptTotal, retry, noHintPerfect: accuracy === 1 && hinted.size === 0 };
}

// 題號以「第幾題」選取（各站題號可能不連續，例如沒有 q05）。
const SCENARIO = [
  { label: "首次（3 題錯、2 題用提示後答對、回報空白）", wrong: [0, 1, 2], hints: [3, 4], reflection: "blank" },
  { label: "再挑戰（全對、無提示、具體提問）", wrong: [], hints: [], reflection: "discussion" },
  { label: "再挑戰退步（2 題錯）", wrong: [5, 6], hints: [], reflection: "blank" },
];

function resolvePlan(plan, registry) {
  const qids = Object.keys(registry.questions);
  return { ...plan, wrong: plan.wrong.map((i) => qids[i]), hints: plan.hints.map((i) => qids[i]) };
}

// 後台 unit_id → 前端資料夾
export function prototypeDirFor(unitId) {
  if (unitId === "lab_intro") return "prototype-lab-entry";
  return `prototype-${unitId.replace(/_/g, "-")}`;
}

function readFrontend(unitId) {
  const file = path.join(root, prototypeDirFor(unitId), "app.js");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function post(context, action, payload) {
  const out = context.doPost({ parameter: { action }, postData: { type: "application/json", contents: JSON.stringify(payload) } });
  return JSON.parse(out.getContent());
}

function get(context, params) {
  return JSON.parse(context.doGet({ parameter: params }).getContent());
}

export function runSimulation({ units = DEFAULT_UNITS, gender = "female" } = {}) {
  const loaderPath = findLoader();
  if (!loaderPath) return { skipped: true, reason: "找不到 bioquest-workspace（請設定 BIOQUEST_WORKSPACE）" };
  const { loadAppsScriptSource } = require(loaderPath);
  const ctx = makeContext(loadAppsScriptSource());
  const { context, ss, bq } = ctx;
  const student = { student_id: "SIM0001", class_name: "模擬班", seat_no: 1, student_name: "模擬學生", active: true, profile_gender: gender };
  seedSheets(ctx, student);

  const failures = [];
  const warnings = [];
  const steps = [];
  const fail = (where, message) => failures.push({ where, message });
  const warn = (where, message) => warnings.push({ where, message });
  const best = {}; // unitId -> { credit, badges, attempt_id }
  const lastAccuracy = {};

  const expectedTitle = (exp) => bq.TITLE_LEVELS.reduce((cur, level) => (exp >= level.need ? level : cur), bq.TITLE_LEVELS[0]);

  for (const unitId of units) {
    const registry = bq.CANONICAL_UNIT_REGISTRY[unitId];
    if (!registry) { fail(unitId, "CANONICAL_UNIT_REGISTRY 缺少此站"); continue; }
    const catalog = context.knownBadgeCatalogForUnit_(unitId).map((b) => b.id);
    const badgeTotal = bq.UNIT_BADGE_TOTALS[unitId];
    const frontend = readFrontend(unitId);
    const frontendSendsBadgeImages = /badge_eval_json/.test(frontend);
    if (!frontend) fail(unitId, `找不到前端 ${prototypeDirFor(unitId)}/app.js`);
    if (catalog.length && badgeTotal !== catalog.length) fail(unitId, `UNIT_BADGE_TOTALS=${badgeTotal} 與徽章目錄 ${catalog.length} 枚不一致`);
    if (!catalog.length && !frontendSendsBadgeImages) fail(unitId, "後台沒有此站徽章目錄，前端提交也沒帶 badge_eval_json（徽章圖片路徑）→ 成就總覽無法顯示此站徽章名稱與圖片");
    else if (!catalog.length) warn(unitId, "後台沒有此站徽章目錄，徽章名稱／圖片完全依賴前端提交的 badge_eval_json");

    SCENARIO.forEach((rawPlan, index) => {
      const plan = resolvePlan(rawPlan, registry);
      const where = `${unitId}#${index + 1}`;
      const login = get(context, { action: "getStudentAndAttemptStatus", student_id: student.student_id, unit_id: unitId });
      const expectedType = index === 0 ? "first" : "retry";
      if (!login.ok) { fail(where, `登入失敗 ${login.error}`); return; }
      if (login.attempt_type !== expectedType) fail(where, `登入 attempt_type=${login.attempt_type}，預期 ${expectedType}`);

      const start = post(context, "startAttempt", { student_id: student.student_id, unit_id: unitId });
      if (!start.ok) { fail(where, `startAttempt 失敗 ${start.error}`); return; }
      for (const qid of plan.hints) {
        const hint = post(context, "hintEvent", { student_id: student.student_id, unit_id: unitId, attempt_id: start.attempt_id, attempt_session_token: start.attempt_session_token, question_id: `${unitId}_${qid}` });
        if (!hint.ok) fail(where, `hintEvent ${qid} 失敗 ${hint.error}`);
      }
      const rawAnswers = {};
      for (const [qid, question] of Object.entries(registry.questions)) {
        rawAnswers[rawKey(qid, question)] = plan.wrong.includes(qid) ? wrongAnswer(question) : correctAnswer(question);
      }
      const payload = {
        student_id: student.student_id,
        unit_id: unitId,
        unit_title: unitId,
        attempt_id: start.attempt_id,
        attempt_session_token: start.attempt_session_token,
        question_version: registry.question_version,
        raw_answers_json: JSON.stringify(rawAnswers),
        student_question: reflectionText(registry, plan.reflection === "discussion" ? "discussion" : "blank"),
        confidence_score: 4,
      };
      if (frontendSendsBadgeImages) {
        // 模擬前端：附上每枚徽章的圖片路徑（真實路徑由各站 badgeAsset() 產生，這裡用可辨識的模擬路徑）
        const ids = new Set([...catalog, ...(frontend.match(/\b[a-z][a-z0-9_]{3,}\b/g) || [])]);
        payload.badge_eval_json = JSON.stringify([...ids].map((id) => ({ badge_id: id, badge_image_path: `${prototypeDirFor(unitId)}/assets/badges/${id}.webp` })));
      }
      const res = post(context, "submitAttempt", payload);
      if (!res.ok) { fail(where, `submitAttempt 失敗 ${res.error} ${JSON.stringify(res.missing_question_ids || res.details || "")}`); return; }

      const previous = index === 0 ? null : { accuracy: lastAccuracy[unitId] };
      const exp = expectedAttempt(unitId, registry, plan, previous);
      const v = res.verified_attempt;
      if (res.verification_status !== "server_verified") fail(where, `verification_status=${res.verification_status}`);
      if (Math.abs(v.accuracy - exp.accuracy) > 1e-9) fail(where, `accuracy=${v.accuracy}，預期 ${exp.accuracy}`);
      if (v.attempt_total_exp !== exp.attemptTotal) fail(where, `本次 EXP=${v.attempt_total_exp}，預期 ${exp.attemptTotal}`);
      if (v.retry_exp !== exp.retry) fail(where, `retry_exp=${v.retry_exp}，預期 ${exp.retry}`);
      if (plan.reflection === "discussion" && v.reflection_quality !== "discussion_question") fail(where, `回報品質=${v.reflection_quality}（${v.reflection_exp_reason}），模擬文字預期為 discussion_question`);

      const badges = v.badges || [];
      const unknown = catalog.length ? badges.filter((b) => !catalog.includes(b)) : [];
      if (unknown.length) fail(where, `後台給了目錄外的徽章：${unknown.join(", ")}`);
      const notInFrontend = badges.filter((b) => !frontend.includes(`"${b}"`));
      if (notInFrontend.length) fail(where, `後台給的徽章在前端 app.js 找不到（前端無法顯示）：${notInFrontend.join(", ")}`);
      if (badgeTotal != null && badges.length > badgeTotal) fail(where, `徽章數 ${badges.length} 超過總數 ${badgeTotal}`);
      if (exp.noHintPerfect && !badges.some((b) => /flawless|perfect|no_hint/.test(b))) fail(where, "全對無提示卻沒有零提示全對類徽章");

      const prevBest = best[unitId];
      const credit = Math.max(prevBest ? prevBest.credit : 0, exp.attemptTotal);
      if (res.unit_credited_exp !== credit) fail(where, `unit_credited_exp=${res.unit_credited_exp}，預期 ${credit}`);
      if (!prevBest || exp.attemptTotal > prevBest.credit || (exp.attemptTotal === prevBest.credit)) best[unitId] = { credit, badges, attempt_id: res.attempt_id };
      lastAccuracy[unitId] = exp.accuracy;

      const expectedTotal = Object.values(best).reduce((s, b) => s + b.credit, 0);
      const expectedBadges = Array.from(new Set(Object.values(best).flatMap((b) => b.badges))).sort();
      const sp = res.student_progress;
      if (sp.total_exp !== expectedTotal) fail(where, `累積 EXP=${sp.total_exp}，預期 ${expectedTotal}`);
      const title = expectedTitle(expectedTotal);
      if (sp.current_title_id !== title.id) fail(where, `稱號=${sp.current_title_id}，預期 ${title.id}`);
      if (!String(sp.title_avatar_path).includes(`${title.id}-${gender}.webp`)) fail(where, `稱號頭像=${sp.title_avatar_path}`);
      const spBadges = JSON.parse(sp.badges_json).slice().sort();
      if (JSON.stringify(spBadges) !== JSON.stringify(expectedBadges)) fail(where, `累積徽章 ${spBadges.length} 枚與預期 ${expectedBadges.length} 枚不同`);
      if (sp.completed_unit_count !== Object.keys(best).length) fail(where, `completed_unit_count=${sp.completed_unit_count}`);
      const summary = JSON.parse(sp.unit_badge_summary_json);
      const unitSummary = summary.find((s) => s.unit_id === unitId);
      if (!unitSummary) fail(where, "unit_badge_summary_json 缺少本站");
      else {
        if (unitSummary.earned_count !== best[unitId].badges.length) fail(where, `本站徽章摘要 earned_count=${unitSummary.earned_count}，預期 ${best[unitId].badges.length}`);
        if (unitSummary.earned_badges.length !== unitSummary.earned_count) fail(where, `本站徽章摘要有 ${unitSummary.earned_count - unitSummary.earned_badges.length} 枚無法對應圖片／名稱`);
        if (unitSummary.earned_badges.some((b) => !b.badge_image_path)) fail(where, "本站徽章摘要有缺圖片路徑");
      }

      // 重複使用同一個 token → 必須拒絕
      if (index === 0) {
        const replay = post(context, "submitAttempt", { ...payload, attempt_id: `${start.attempt_id}-replay` });
        if (replay.ok) fail(where, "重複使用 attempt token 竟然成功");
      }

      // StudentProgress 表：每站一列，都要通過信任檢查，且 total_exp 一致
      const progressRows = context.readRows_(ss.getSheetByName(bq.SHEETS.studentProgress));
      const attemptRows = context.readRows_(ss.getSheetByName(bq.SHEETS.attempts));
      if (progressRows.length !== Object.keys(best).length) fail(where, `StudentProgress 有 ${progressRows.length} 列，預期 ${Object.keys(best).length}`);
      const partition = context.partitionStudentProgressTrust_(progressRows, attemptRows);
      if (partition.stale.length) fail(where, `StudentProgress 有 ${partition.stale.length} 列未通過信任檢查：${partition.stale.map((r) => r.unit_id).join(", ")}`);
      const totals = new Set(progressRows.map((r) => Number(r.total_exp)));
      if (totals.size !== 1 || !totals.has(expectedTotal)) fail(where, `StudentProgress total_exp 不一致：${[...totals].join("/")}`);

      // 再次登入看到的累積
      const after = get(context, { action: "getStudentAndAttemptStatus", student_id: student.student_id, unit_id: unitId });
      if (after.progress.total_exp !== expectedTotal) fail(where, `登入累積 EXP=${after.progress.total_exp}，預期 ${expectedTotal}`);
      if (after.progress.current_title_id !== title.id) fail(where, `登入稱號=${after.progress.current_title_id}`);

      steps.push({
        unit_id: unitId, step: index + 1, label: plan.label,
        attempt_total_exp: v.attempt_total_exp, unit_credited_exp: res.unit_credited_exp,
        badges, total_exp: sp.total_exp, title_id: sp.current_title_id,
        // 給 Playwright 注入用：該步驟的後台回應
        login_response_after: after, submit_response: res,
      });
    });
  }
  const finalTotal = Object.values(best).reduce((s, b) => s + b.credit, 0);
  return { skipped: false, loaderPath, units, failures, warnings, steps, finalTotal, finalTitle: expectedTitle(finalTotal).id };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
  const units = args.units ? args.units.split(",") : DEFAULT_UNITS;
  const result = runSimulation({ units });
  if (result.skipped) { console.log(`略過：${result.reason}`); process.exit(0); }
  if (args.json) fs.writeFileSync(args.json, JSON.stringify(result, null, 2));
  for (const unitId of units) {
    const rows = result.steps.filter((s) => s.unit_id === unitId);
    console.log(`${unitId}: ${rows.map((s) => `#${s.step} 本次${s.attempt_total_exp}/認列${s.unit_credited_exp}/徽章${s.badges.length}`).join("  ")}`);
  }
  if (result.warnings.length) {
    console.log(`\n提醒 ${result.warnings.length} 項：`);
    result.warnings.forEach((f) => console.log(`- [${f.where}] ${f.message}`));
  }
  console.log(`\n${units.length} 站模擬完成：累積 ${result.finalTotal} EXP，稱號 ${result.finalTitle}`);
  if (result.failures.length) {
    console.log(`\n不一致 ${result.failures.length} 項：`);
    result.failures.forEach((f) => console.log(`- [${f.where}] ${f.message}`));
    process.exit(1);
  }
  console.log("全部一致");
}
