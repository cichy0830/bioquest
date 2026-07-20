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
  document: { readyState: "loading", querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {} },
  localStorage: { getItem(key) { return localStore.get(key) || null; }, setItem(key, value) { localStore.set(key, String(value)); }, removeItem(key) { localStore.delete(key); } },
  URLSearchParams,
  fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  Date, Math, setTimeout, clearTimeout
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-human-nutrition/app.js" });

const api = context.window.__human_nutritionTest;
assert.equal(api.VERSION, "20260719-human-nutrition-qa-v1");
assert.equal(api.QUESTION_VERSION, "20260714-human-nutrition-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "human_nutrition");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 13);
assert(!source.includes("林安安"), "正式單元不得含舊測試名單");
assert(!source.includes("陳柏宇"), "正式單元不得含舊測試名單");
assert(!source.includes("許若晴"), "正式單元不得含舊測試名單");
assert(source.includes("BioQuestLoginUX?.begin"), "登入需使用共用即時連線提示");
assert(source.includes("await window.BioQuestLoginUX?.paint"), "登入須在後台請求前讓 busy 狀態可繪製");

const answers = {
  q01: { mouth: "tract", esophagus: "tract", stomach: "tract", small_intestine: "tract", large_intestine: "tract", salivary_gland: "gland", liver: "gland", pancreas: "gland" },
  q02_sequence: ["mouth", "esophagus", "stomach", "small_intestine", "large_intestine", "anus"],
  q03: "glands",
  q04: { mouth: "chew", esophagus: "push", stomach: "mix", small_intestine: "absorb_nutrients", large_intestine: "absorb_water" },
  q05: "digestion",
  q06: { amylase: "starch", protease: "protein", lipase: "lipid" },
  q07: "bile",
  q08: "protein",
  q09: "small_intestine",
  q10: "absorb",
  q11: "absorb_transport",
  q12: { starch_break: "digestion", enter_wall: "absorption", protein_break: "digestion", enter_blood: "absorption" },
  q13: "small_intestine",
  q14: "different"
};

api.setState({
  student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true, profile_gender: "female" },
  attempt_id: "human_nutrition_test_attempt", attempt_session_token: "guest_token", question_version: api.QUESTION_VERSION,
  answers, reflection: { confident: "消化和吸收", question: "", confidence: "4" }
});
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, `${question.id} should be correct`);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.total_questions, 14);
assert.equal(score.hint_used_count, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("human_nutrition_flawless"));
assert(score.earned_badges.includes("food_path_sequencer"));
api.setState({
  student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true, profile_gender: "female" },
  attempt_id: "human_nutrition_valid_reflection", attempt_session_token: "guest_token", question_version: api.QUESTION_VERSION,
  answers, reflection: { confident: "消化和吸收", question: "我想知道小腸絨毛增加面積後，養分如何進入血液並運送？", confidence: "4" }
});
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "human_nutrition_hint_attempt", attempt_session_token: "guest_token", question_version: api.QUESTION_VERSION, answers, hints: { q07: true }, hintEventStatus: { q07: "sent" }, reflection: { confident: "膽汁", question: "我想確認膽汁如何幫助脂質消化，以及為什麼它本身不是酵素？", confidence: "3" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500, "提示後全對不得高於零提示全對");
assert(score.earned_badges.includes("human_nutrition_reflection_reporter"));
assert(!score.earned_badges.includes("human_nutrition_flawless"));

for (const [text, expectedExp] of [["", 0], ["老師好帥", 0], ["消化道與消化腺的差異", 0], ["我想知道小腸絨毛增加面積後，養分如何進入血液並運送？", 40]]) {
  api.setState({ reflection: { question: text } });
  assert.equal(api.evaluateReflection().question_exp, expectedExp, `reflection exp mismatch for ${text}`);
}

api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, attempt_id: "server_attempt", attempt_session_token: "server_token", previous_attempt_id: "prev_attempt", question_version: api.QUESTION_VERSION, answers, hints: { q12: true }, reflection: { confident: "食物流向", question: "我想確認消化和吸收的差異，以及養分何時會進入血液。", confidence: "5" } });
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "human_nutrition");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.attempt_session_token, "server_token");
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers.q01, answers.q01);
assert.deepEqual(payload.raw_answers.q02, answers.q02_sequence);
assert.equal(payload.question_logs.find((log) => log.question_id === "q12").used_hint, true);

const checkpoint = api.renderCheckpoint("checkpoint1");
assert(checkpoint.includes("data-sequence=\"q02\""), "q02 drag sequence missing");
assert(checkpoint.includes("上移"), "mobile sequence fallback missing");
assert(checkpoint.includes("已選："), "selection state must be visible");
for (const qid of ["q10", "q11", "q12"]) {
  assert.equal(api.renderQuestionEvidence(qid), "", `${qid} redundant evidence card should be removed`);
}
assert(!api.renderReflection().includes("bq-report-assistant"), "local report owl should be injected by shared layout");
assert(api.renderBrief().includes("bq-brief-scene-stage"), "shared dual-role brief stage missing");

const resultBase = {
  attempt_exp: 460,
  unit_credited_exp: 460,
  base_exp: 360,
  hint_exp: 40,
  reflection_exp: 60,
  earned_badges: []
};

api.setState({ student: { is_guest: true }, result: { ...resultBase, verification_status: "local_guest" } });
const guestResult = api.renderResult();
assert(guestResult.includes("提交後本次作答已鎖定"), "submit lock copy missing");
assert(guestResult.includes("不列入正式累積"), "guest formal exclusion missing");
assert(!guestResult.includes("本單元認列"), "guest result must not use legacy credit wording");

api.setState({ student: { student_id: "S99999", is_guest: false }, result: { ...resultBase, verification_status: "pending_backend" } });
const pendingResult = api.renderResult();
assert(pendingResult.includes("待後台確認"), "pending verification copy missing");
assert(!pendingResult.includes("後台已回傳正式認列資料"), "pending result must not claim verified credit");

api.setState({ student: { student_id: "S99999", is_guest: false }, result: { ...resultBase, verification_status: "server_verified" } });
const verifiedResult = api.renderResult();
assert(verifiedResult.includes("後台已回傳正式認列資料"), "verified credit copy missing");
assert(api.renderAchievements().includes('data-bq-unit-achievements="human_nutrition"'), "unit achievement hook missing");
assert(!api.renderAchievements().includes("title-card"), "legacy title card must be removed");

console.log("prototype-human-nutrition app regression passed");
