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
  document: {
    readyState: "loading",
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
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
  setTimeout,
  clearTimeout
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(source, context, { filename: "prototype-photosynthesis/app.js" });

const api = context.window.__photosynthesisTest;
assert.equal(api.VERSION, "20260811-photosynthesis-submitted-retry-ia-v1");
assert.equal(api.QUESTION_VERSION, "20260721-photosynthesis-q09-inactive-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION, "cache VERSION must stay separate from canonical QUESTION_VERSION");
assert.equal(api.createEmptyState().question_version, api.QUESTION_VERSION);
assert(source.includes("question_version: QUESTION_VERSION"), "backend question_version must use canonical QUESTION_VERSION");
assert(!source.includes("question_version: VERSION"), "cache VERSION must not flow into backend question_version payloads");
assert(source.includes("startData.question_version !== QUESTION_VERSION"), "startAttempt guard must compare canonical QUESTION_VERSION");
assert(!source.includes("startData.question_version !== VERSION"), "startAttempt guard must not compare cache VERSION");
assert.equal(api.mission.unit_id, "photosynthesis");
assert.equal(api.questions.length, 13);
assert.equal(api.questions.some((question) => question.id === "q09"), false, "q09 must be inactive and absent from active runtime questions");
assert.equal(api.questions.some((question) => question.type === "sequence"), false, "photosynthesis should not have active sequence questions after q09 removal");
assert.equal(api.badges.length, 11);
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 11);
for (const badge of api.badges) {
  assert(badge.badge_image_path.endsWith(".webp"), `${badge.id} badge image path must point to the stable WebP asset`);
  assert(!badge.badge_image_path.includes(".png"), `${badge.id} badge image URL must not use legacy PNG`);
}
assert.equal(api.cacheBustedAsset(api.assets.briefingSceneHook), `assets/bg-photosynthesis-briefing-azhe-wide.webp?v=${api.VERSION}`);
assert.equal(api.titleAvatarPath({ profile_gender: "male" }), "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp");
assert.equal(
  api.titleAvatarPath({ title_avatar_path: "shared-assets/title-avatars/title-01-trainee_investigator-male.png", profile_gender: "male" }),
  "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  "backend-style PNG title avatar paths must normalize to the existing WebP asset"
);
assert(!source.includes("title-01-trainee_investigator-male.png"), "title avatar primary path must not request the removed PNG fallback");
assert(!source.includes("林安安"), "正式單元不得含舊測試名單");
assert(!source.includes("陳柏宇"), "正式單元不得含舊測試名單");
assert(!source.includes("許若晴"), "正式單元不得含舊測試名單");
for (const file of [
  "assets/bg-photosynthesis-briefing-azhe-wide.webp",
  "assets/bg-photosynthesis-entry-wide.webp",
  "assets/owl-photosynthesis-prep-reminder.webp",
  "assets/img-photosynthesis-leaf-structure.webp",
  "assets/img-photosynthesis-starch-evidence.webp",
  "assets/img-photosynthesis-light-shade.webp",
  "assets/img-photosynthesis-aquatic-bubbles.webp",
  "assets/img-photosynthesis-variable-control.webp"
]) assert(fs.existsSync(path.join(root, file)), `photosynthesis asset missing: ${file}`);

const answers = {
  q01: "photosynthesis",
  q02: { carbon_dioxide: "reactant", water: "reactant_and_product", light: "energy", glucose: "product", oxygen: "product" },
  q03: "chloroplast",
  q04: "energy_not_reactant",
  q05: { stomata: "gas_exchange", vein: "transport", chloroplast_in_leaf: "site" },
  q06: "oxygen",
  q07: "green_cells",
  q08: "soil_water_minerals_food_made",
  q10: "light_starch",
  q11: "strong_light_more_bubbles",
  q12: ["light_time", "plant_type_size", "water_amount", "temperature"],
  q13: "plants_respire_too",
  q14: "oxygen_product"
};

api.setState({
  student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true, profile_gender: "female" },
  attempt_id: "photosynthesis_test_attempt",
  attempt_session_token: "guest_token",
  question_version: "20260721-photosynthesis-q09-inactive-v1",
  answers,
  reflection: { confident: "原料和產物", question: "", confidence: "4" }
});

for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, `${question.id} should be correct`);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 13);
assert.equal(score.total_questions, 13);
assert.equal(score.hint_used_count, 0);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("photosynthesis_flawless"));
assert.equal(score.reflection_exp, 0);
api.setState({
  student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true, profile_gender: "female" },
  attempt_id: "photosynthesis_valid_reflection", attempt_session_token: "guest_token", question_version: "20260721-photosynthesis-q09-inactive-v1",
  answers, reflection: { confident: "原料和產物", question: "我想知道光合作用的氧氣氣泡資料如何判斷是否受到光照影響？", confidence: "4" }
});
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({
  student: { student_id: "guest", is_guest: true },
  attempt_id: "photosynthesis_hint_attempt",
  attempt_session_token: "guest_token",
  question_version: "20260721-photosynthesis-q09-inactive-v1",
  answers,
  hints: { q10: true },
  hintEventStatus: { q10: "sent" },
  reflection: { confident: "", question: "我想確認碘液變藍黑色能支持哪些光合作用結論，哪些事情不能直接推論？", confidence: "3" }
});
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500, "提示後全對不得高於零提示全對");
assert(score.earned_badges.includes("photosynthesis_reflection_reporter"));
assert(!score.earned_badges.includes("photosynthesis_flawless"));

for (const [text, expectedExp] of [
  ["", 0],
  ["老師好帥", 0],
  ["光合作用的原料、能量來源與產物", 0],
  ["我想知道光合作用的氧氣氣泡資料如何判斷是否受到光照影響？", 40]
]) {
  api.setState({ reflection: { question: text } });
  assert.equal(api.evaluateReflection().question_exp, expectedExp, `reflection exp mismatch for ${text}`);
}

api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server_attempt",
  attempt_session_token: "server_token",
  previous_attempt_id: "prev_attempt",
  question_version: "20260721-photosynthesis-q09-inactive-v1",
  answers,
  hints: { q12: true },
  reflection: { confident: "變因判讀", question: "我想確認控制變因和二氧化碳改變條件的差異。", confidence: "5" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "photosynthesis");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.equal(payload.attempt_session_token, "server_token");
assert.equal(payload.question_logs.length, 13);
assert.deepEqual(payload.raw_answers.q02, answers.q02);
assert.equal(Object.hasOwn(payload.raw_answers, "q09"), false, "q09 must not be sent in raw answers");
assert.equal(Object.hasOwn(payload.raw_answers, "q09_sequence"), false, "q09 sequence must not be sent in raw answers");
assert.equal(payload.question_logs.some((log) => String(log.question_id || "").endsWith("_q09") || log.question_id === "q09"), false, "q09 must not produce a QuestionLog");
assert.equal(payload.question_logs.find((log) => log.question_id === "q12").used_hint, true);

const checkpoint = api.renderCheckpoint("checkpoint3");
assert(!checkpoint.includes("data-sequence=\"q09\""), "q09 drag sequence must be removed");
assert(!checkpoint.includes("上移"), "sequence mobile fallback must be removed with q09");
assert(!checkpoint.includes("下移"), "sequence mobile fallback must be removed with q09");
assert(!checkpoint.includes("思考流程"), "q09 thinking-flow prompt must not remain visible");
assert(checkpoint.includes("確認這組答案"), "multi-select confirmation missing");
assert(checkpoint.includes("每分鐘氣泡數"), "q11 data table missing");
assert(checkpoint.includes("遮光葉片紀錄"), "q10 evidence table missing");
assert(!api.renderReview().includes("mentor-card"), "shared enhancer must own the single review mentor");
assert(!api.renderReflection().includes("bq-report-assistant"), "shared enhancer must own the single report owl");
assert(source.includes('window.scrollTo?.({ top: 0, left: 0, behavior: "auto" })'), "screen changes must return to page top");
api.setState({
  student: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true },
  answers,
  reflection: { confident: "原料和產物", question: "", confidence: "4" },
  submitted: true,
  result: { ...api.scoreAttempt(), verification_status: "local_guest", attempt_exp: 460, unit_credited_exp: 460 }
});
const guestResultHtml = api.renderResult();
assert(guestResultHtml.includes("提交後本次作答已鎖定"), "submit lock copy missing");
assert(guestResultHtml.includes("guest 測試：本次預估"), "guest result status copy missing");
assert(guestResultHtml.includes("不列入正式累積"), "guest result must not imply formal credit");
assert(!guestResultHtml.includes("本單元認列"), "guest result must not use legacy credited wording");
assert(guestResultHtml.includes('data-result-earned-badges="true"'), "result must expose earned-only badge region");
assert(guestResultHtml.includes(`badge-photosynthesis-photosynthesis_entry.webp?v=${api.VERSION}`), "result earned badge image must include runtime cache");
assert(guestResultHtml.includes('data-relogin-action="true"'), "result must include relogin entry after submitted");
assert(!guestResultHtml.includes("本單元 11 枚徽章"), "result must not render full unit catalog");

api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  submitted: true,
  result: { ...api.scoreAttempt(), verification_status: "pending_backend", attempt_exp: 460, unit_credited_exp: 460 }
});
const pendingResultHtml = api.renderResult();
assert(pendingResultHtml.includes("本次預估 460/500 EXP，待後台確認"), "pending result status copy missing");
assert(!pendingResultHtml.includes("本單元認列"), "pending result must not use legacy credited wording");

api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  submitted: true,
  result: { ...api.scoreAttempt(), verification_status: "server_verified", attempt_exp: 500, unit_credited_exp: 500 }
});
const verifiedResultHtml = api.renderResult();
assert(verifiedResultHtml.includes("本單元正式認列：500 EXP"), "verified result formal credit copy missing");

const achievementsHtml = api.renderAchievements();
assert(!achievementsHtml.includes("data-bq-unit-achievements"), "achievements must not render the unit badge wall");
assert(achievementsHtml.includes('data-bq-achievements-overview-only="true"'), "achievements must use overview-only shared contract");
assert(achievementsHtml.includes('data-relogin-action="true"'), "achievements must include relogin entry after submitted");
assert(!achievementsHtml.includes("title-card"), "legacy title-card must be removed from raw achievements");
assert(!achievementsHtml.includes("全冊稱號"), "legacy title panel copy must be removed");

api.setState({
  student: { student_id: "guest", is_guest: true },
  attempt_id: "current_photosynthesis_attempt",
  attempt_session_token: "guest_token",
  submitted: true,
  screen: "result",
  result: { ...api.scoreAttempt(), verification_status: "local_guest" }
});
assert.equal(api.canUseNav("login"), true, "submitted sidebar login must be available");
assert.equal(api.canUseNav("checkpoint1"), false, "submitted checkpoint must stay locked");
assert.match(api.renderRules(), /data-relogin-action="true"/, "rules must include relogin entry after submitted");
localStore.set("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "old_photosynthesis_attempt", unit_id: "photosynthesis" }]));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(localStore.get("bioquest_attempts_v1"), JSON.stringify([{ attempt_id: "old_photosynthesis_attempt", unit_id: "photosynthesis" }]), "reset must preserve attempt history");

console.log("prototype-photosynthesis app regression passed");
