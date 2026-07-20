#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const localStore = new Map();
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
  fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  Date,
  Math,
  structuredClone,
  setTimeout,
  clearTimeout
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-life-world/app.js" });

const api = context.window.__lifeWorldTest;
assert.equal(api.VERSION, "20260720-life-world-server-verified-v1");
assert.equal(api.QUESTION_VERSION, "20260720-life-world-canonical-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert(source.includes("question_version: QUESTION_VERSION"), "backend payload must use QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical version");
assert(!source.includes("life_world_section_"), "frontend must not generate legacy section summary question ids");
assert(!source.includes("林安安") && !source.includes("陳柏宇") && !source.includes("許若晴"), "U1 must not contain old fallback roster names");

for (const badge of api.unitBadgeCatalog) {
  assert(badge.badge_image_path.endsWith(`.webp?v=${api.VERSION}`), `${badge.id} badge path must be cached WebP`);
  assert(!badge.badge_image_path.includes(".png"), `${badge.id} badge path must not request PNG`);
}

const answers = {
  checkpoint1: {
    classify: { squirrel: "living", sprout: "living", rock: "nonliving", water: "nonliving", livingstone: "living" },
    remote_car: "不能，還需要生命現象證據",
    livingstone: "它是生物，因為有生長與生殖相關現象"
  },
  checkpoint1Hints: {},
  checkpoint2: {
    metabolism: "代謝",
    growth: "生長與發育",
    response: "感應與運動",
    reproduction: "生殖",
    plant_response: "植物也可能對光、觸碰等刺激產生反應"
  },
  checkpoint2Hints: {},
  checkpoint3: {
    aquarium_resources: ["水", "空氣或溶解在水中的氣體", "養分", "適合的光線"],
    biosphere_meaning: "所有生物與其生存環境的總和",
    warm_wet: "溫暖且水分充足"
  },
  checkpoint3Hints: {},
  checkpoint4: {
    cactus: "儲存水分",
    polar_bear: "保暖",
    leaf_butterfly: "降低被發現機會",
    inch_worm: "降低被發現機會",
    cloud_growth: "變大不一定是生長，還要看是否有其他生命現象",
    best_evidence: "綜合多個生命現象與生存條件證據"
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
  attempt_id: "life_world_attempt_1",
  attempt_session_id: "life_world_session_1",
  attempt_session_token: "life_world_session_1.nonce",
  previous_attempt_id: "",
  verification_mode: "server_verified",
  question_version: api.QUESTION_VERSION,
  started_at: "2026-07-20T00:00:00.000Z",
  answers,
  hintEventStatus: { q01: "sent" }
});

const raw = api.canonicalRawAnswers();
assert.equal(Object.keys(raw).length, 14);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q01)), answers.checkpoint1.classify);
assert.equal(raw.q02, "不能，還需要生命現象證據");
assert.deepEqual(JSON.parse(JSON.stringify(raw.q09)), answers.checkpoint3.aquarium_resources);
assert.deepEqual(JSON.parse(JSON.stringify(raw.q12)), {
  cactus: "儲存水分",
  polar_bear: "保暖",
  leaf_butterfly: "降低被發現機會",
  inch_worm: "降低被發現機會"
});

const localResult = api.calculateResult();
assert.equal(localResult.correct, 21);
assert.equal(localResult.total, 21, "U1 local UI scoring still counts existing item-level interactions");
assert.equal(localResult.attempt_total_exp, 460, "blank reflection keeps U1 at 460");
const payload = api.buildBackendPayload({
  student: { student_id: "S70101", student_name: "測試學生", class_name: "701", seat_no: "01" },
  mission: api.mission,
  attempt_id: "life_world_attempt_1",
  attempt_session_id: "life_world_session_1",
  attempt_session_token: "life_world_session_1.nonce",
  previous_attempt_id: "",
  question_version: api.QUESTION_VERSION,
  attempt_type: "first",
  started_at: "2026-07-20T00:00:00.000Z",
  submitted_at: "2026-07-20T00:05:00.000Z",
  confidence_score: 4,
  confident_concept: "",
  uncertain_concept: "",
  student_question: "",
  ...localResult
});
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.attempt_session_token, "life_world_session_1.nonce");
assert.equal(payload.question_logs.length, 14);
assert(payload.question_logs.every((log) => /^life_world_q\d+$/.test(log.question_id)), "all logs must be q-level canonical ids");
assert.equal(payload.question_logs.find((log) => log.question_id === "life_world_q01").used_hint, true);
assert.deepEqual(JSON.parse(JSON.stringify(JSON.parse(payload.raw_answers_json).q12)), JSON.parse(JSON.stringify(raw.q12)));
assert.equal(payload.question_logs.some((log) => log.question_id.includes("section")), false);

api.setState({
  student: { student_id: "guest", student_name: "老師測試帳號", class_name: "測試", seat_no: "00", is_guest: true },
  answers,
  result: { ...localResult, verification_status: "local_guest" }
});
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
    badges: ["life_world_entry", "life_signal_flawless"]
  },
  student_progress: {
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

console.log("prototype-life-world app canonical regression passed");
