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
vm.runInNewContext(source, context, { filename: "prototype-scientific-method/app.js" });

const api = context.window.__scientificMethodTest;
assert.equal(api.VERSION, "20260721-scientific-method-server-verified-v1");
assert.equal(api.QUESTION_VERSION, "20260720-scientific-method-canonical-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert(source.includes("question_version: QUESTION_VERSION"), "backend payload must use QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt gate must compare canonical version");
assert(!source.includes("scientific_method_section_"), "frontend must not generate legacy section summary question ids");
assert(!source.includes("林安安") && !source.includes("陳柏宇") && !source.includes("許若晴"), "U2 must not contain old fallback roster names");

for (const badge of api.unitBadgeCatalog) {
  assert(badge.badge_image_path.endsWith(`.webp?v=${api.VERSION}`), `${badge.id} badge path must be cached WebP`);
  assert(!badge.badge_image_path.includes(".png"), `${badge.id} badge path must not request PNG`);
}

const sequence = {
  observe: 1,
  question: 2,
  research: 3,
  hypothesis: 4,
  experiment: 5,
  analyze: 6,
  conclusion: 7
};

const answers = {
  checkpoint1: {
    sequence,
    observation: { room_95: "observation", fridge_no_mold: "observation", cold_inhibits: "inference", spots_more: "observation" },
    testable_question: "吐司發霉是否和環境溫度有關？",
    hypothesis: "吐司放在低溫處較室溫處不易發霉"
  },
  checkpoint1Hints: {},
  checkpoint2: {
    variables: { temperature: "manipulated", mold_ratio: "responding", toast_size: "controlled", days: "controlled", bag_type: "controlled" },
    mung_water: "水分",
    seedling_height: "豆苗生長高度",
    control_reason: "減少其他因素干擾，讓溫度影響較容易判斷",
    two_groups: "兩組需要設計成主要只差在操作變因，才較能比較"
  },
  checkpoint2Hints: {},
  checkpoint3: {
    table_reading: "室溫組發霉比例明顯高於低溫組",
    chart_trend: "低溫處的吐司較室溫處不易發霉",
    evidence_conclusion: "在此實驗條件下，吐司放在低溫處較室溫處不易發霉"
  },
  checkpoint3Hints: {},
  checkpoint4: {
    mismatch_revision: "檢查假說與實驗設計，必要時修正後再驗證",
    repeatable: "確認結果是否穩定可靠"
  },
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
  attempt_id: "scientific_method_attempt_1",
  attempt_session_id: "scientific_method_session_1",
  attempt_session_token: "scientific_method_session_1.nonce",
  previous_attempt_id: "",
  verification_mode: "server_verified",
  question_version: api.QUESTION_VERSION,
  started_at: "2026-07-21T00:00:00.000Z",
  answers,
  hintEventStatus: { q05: "sent" }
});

const raw = api.canonicalRawAnswers();
assert.equal(Object.keys(raw).length, 14);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q01)), ["observe", "question", "research", "hypothesis", "experiment", "analyze", "conclusion"]);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q02)), answers.checkpoint1.observation);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q05)), answers.checkpoint2.variables);
assert.equal(raw.q14, "確認結果是否穩定可靠");

const localResult = api.calculateResult();
assert.equal(localResult.correct, 27);
assert.equal(localResult.total, 27, "U2 local UI scoring still counts item-level interactions");
assert.equal(localResult.attempt_total_exp, 460, "blank reflection keeps U2 at 460");

const payload = api.buildBackendPayload({
  student: { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01" },
  mission: api.mission,
  attempt_id: "scientific_method_attempt_1",
  attempt_session_id: "scientific_method_session_1",
  attempt_session_token: "scientific_method_session_1.nonce",
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
assert.equal(payload.attempt_session_token, "scientific_method_session_1.nonce");
assert.equal(payload.question_logs.length, 14);
assert(payload.question_logs.every((log) => /^scientific_method_q\d+$/.test(log.question_id)), "all logs must be q-level canonical ids");
assert.equal(payload.question_logs.find((log) => log.question_id === "scientific_method_q01").question_type, "sequence");
assert.equal(payload.question_logs.find((log) => log.question_id === "scientific_method_q05").question_type, "mapping");
assert.equal(payload.question_logs.find((log) => log.question_id === "scientific_method_q05").used_hint, true);
assert.deepEqual(JSON.parse(JSON.stringify(JSON.parse(payload.raw_answers_json).q05)), JSON.parse(JSON.stringify(raw.q05)));
assert.equal(payload.question_logs.some((log) => log.question_id.includes("section")), false);

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
    total_questions: 14,
    correct: 14,
    hints_used: 0,
    correct_without_hint: 14,
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
    badges: ["scientific_method_entry", "scientific_method_flawless"]
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

console.log("prototype-scientific-method app canonical regression passed");
