#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const localStore = new Map();
const fetchCalls = [];
const context = {
  console,
  window: null,
  globalThis: null,
  document: {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    readyState: "loading"
  },
  localStorage: {
    getItem(key) { return localStore.get(key) || null; },
    setItem(key, value) { localStore.set(key, String(value)); },
    removeItem(key) { localStore.delete(key); }
  },
  URLSearchParams,
  fetch: async (url, init = {}) => {
    fetchCalls.push({ url: String(url), init });
    return { ok: true, json: async () => ({ ok: true }) };
  },
  Date,
  Math,
  structuredClone,
  setTimeout,
  clearTimeout
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-lab-entry/app.js" });

const api = context.window.__labIntroTest;
assert.equal(api.VERSION, "20260721-lab-intro-server-verified-v1");
assert.equal(api.QUESTION_VERSION, "20260720-lab-intro-canonical-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert(source.includes("question_version: QUESTION_VERSION"), "backend payload must use QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt gate must compare canonical version");
assert(!source.includes("lab_intro_section_"), "frontend must not generate legacy section summary question ids");
assert(!source.includes("林安安") && !source.includes("陳柏宇") && !source.includes("許若晴"), "U3 must not contain old fallback roster names");

for (const badge of api.unitBadgeCatalog) {
  assert(badge.badge_image_path.endsWith(`.webp?v=${api.VERSION}`), `${badge.id} badge path must be cached WebP`);
  assert(!badge.badge_image_path.includes(".png"), `${badge.id} badge path must not request PNG`);
}

const answers = {
  checkpoint1: {
    apparatus: {
      cylinder: "量取液體體積",
      beaker: "盛裝、混合或加熱液體",
      test_tube: "少量反應或觀察",
      dropper: "少量滴加液體",
      forceps: "夾取小物",
      slide: "承載觀察標本"
    },
    measure_20ml: "量筒",
    small_reaction: "試管",
    water_drop: "滴管",
    slide_tools: ["載玻片", "蓋玻片", "滴管", "鑷子"]
  },
  checkpoint1Hints: {},
  checkpoint2: {
    sequence: ["stop", "warn", "tell_teacher", "tool_cleanup"],
    unknown_bottle: "不擅自打開，先依教師指示確認",
    heat_direction: "試管口不要朝向自己或他人",
    waste_liquid: "依教師指示倒入指定廢液容器或處理位置",
    running_lab: "實驗室可能有火源、玻璃與藥品，跑動會增加碰撞與翻倒風險"
  },
  checkpoint2Hints: {},
  checkpoint3: {
    chemical_rules: ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問"],
    beaker_precision: "燒杯刻度多用於粗略估計，較準確量體積應選合適的量測器材",
    honest_record: "如實記錄結果與可能異常，再和老師討論"
  },
  checkpoint3Hints: {},
  checkpoint4: {},
  checkpoint4Hints: {},
  reflection: {
    confident_concept: "",
    uncertain_concept: "",
    student_question: "",
    confidence_score: 4
  }
};

api.setState({
  student: { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01", is_guest: false },
  attempt_id: "lab_intro_attempt_1",
  attempt_session_id: "lab_intro_session_1",
  attempt_session_token: "lab_intro_session_1.nonce",
  previous_attempt_id: "",
  verification_mode: "server_verified",
  question_version: api.QUESTION_VERSION,
  started_at: "2026-07-21T00:00:00.000Z",
  answers,
  hintEventStatus: { q08: "sent" }
});

const raw = api.canonicalRawAnswers();
assert.equal(Object.keys(raw).length, 13);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q01)), answers.checkpoint1.apparatus);
assert.equal(raw.q02, "量筒");
assert.deepEqual(JSON.parse(JSON.stringify(raw.q05)), ["載玻片", "蓋玻片", "滴管", "鑷子"]);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q08)), ["stop", "warn", "tell_teacher", "tool_cleanup"]);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q12)), ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問"]);

const localResult = api.calculateResult();
assert.equal(localResult.correct, 21);
assert.equal(localResult.total, 21, "U3 local UI scoring counts item-level interactions");
assert.equal(localResult.attempt_total_exp, 460, "blank reflection keeps U3 at 460");

const payload = api.buildBackendPayload({
  student: { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01" },
  mission: api.mission,
  attempt_id: "lab_intro_attempt_1",
  attempt_session_id: "lab_intro_session_1",
  attempt_session_token: "lab_intro_session_1.nonce",
  previous_attempt_id: "",
  question_version: api.QUESTION_VERSION,
  attempt_type: "first",
  started_at: "2026-07-21T00:00:00.000Z",
  submitted_at: "2026-07-21T00:05:00.000Z",
  confidence_score: 4,
  confident_concept: "",
  uncertain_concept: "",
  student_question: "",
  ...localResult
});
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.attempt_session_token, "lab_intro_session_1.nonce");
assert.equal(payload.question_logs.length, 13);
assert(payload.question_logs.every((log) => /^lab_intro_q\d+$/.test(log.question_id)), "all logs must be q-level canonical ids");
assert.equal(payload.question_logs.find((log) => log.question_id === "lab_intro_q01").question_type, "mapping");
assert.equal(payload.question_logs.find((log) => log.question_id === "lab_intro_q08").question_type, "sequence");
assert.equal(payload.question_logs.find((log) => log.question_id === "lab_intro_q08").used_hint, true);
assert.equal(payload.question_logs.some((log) => log.question_id.includes("section")), false);
assert.deepEqual(JSON.parse(JSON.stringify(JSON.parse(payload.raw_answers_json).q12)), ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問"]);

api.setState({
  student: { student_id: "guest", student_name: "老師測試帳號", class_name: "測試", seat_no: "00", is_guest: true },
  answers,
  result: { ...localResult, verification_status: "local_guest" }
});
const guestCallsBefore = fetchCalls.length;
const guestResponse = await api.submitAttemptToBackend({
  student: { student_id: "guest", is_guest: true },
  mission: api.mission,
  ...localResult
});
assert.equal(guestResponse.verification_status, "local_guest");
assert.equal(fetchCalls.length, guestCallsBefore, "guest submit must not call backend");
const guestResult = api.renderResult();
assert(guestResult.includes("guest 測試：本次預估 460/500 EXP，不列入正式累積。"));
assert(!guestResult.includes("本單元認列 EXP"), "guest result must not use formal credit label");

api.setState({
  student: { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01", is_guest: false },
  answers,
  result: localResult
});
const final = api.applyBackendSubmitResponse({
  ok: true,
  verification_status: "server_verified",
  verified_attempt: {
    verification_status: "server_verified",
    total_questions: 13,
    correct: 13,
    hints_used: 0,
    correct_without_hint: 13,
    corrected_after_hint: 0,
    concept_exp: 220,
    revision_exp: 0,
    question_exp: 40,
    mastery_exp: 140,
    retry_exp: 0,
    attempt_total_exp: 500,
    unit_credited_exp: 500,
    credited_delta: 500,
    no_hint_perfect: true,
    badges: ["lab_intro_entry", "lab_intro_flawless"]
  },
  student_progress: {
    source: "server_verified",
    progress_applied: true,
    total_exp: 500,
    completed_unit_count: 1,
    current_title_id: "life_observer",
    current_title: "生命觀察員",
    title_avatar_path: ["shared-assets", "title-avatars/title-02-life_observer-male.webp"].join("/")
  }
}, localResult);
assert.equal(final.verification_status, "server_verified");
assert.equal(final.attempt_total_exp, 500);
assert.equal(api.state().student.progress.total_exp, 500);
assert(api.renderBadgeCatalog(final.badges).includes('class="badge earned"'), "server badge ids must light badge cards");

console.log("prototype-lab-entry app canonical regression passed");
