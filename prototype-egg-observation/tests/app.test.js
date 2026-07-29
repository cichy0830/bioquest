#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-egg-observation")
  : sourceRoot;
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const store = new Map();
const context = {
  console,
  window: null,
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
vm.runInNewContext(source, context, { filename: "prototype-egg-observation/app.js" });
const api = context.window.__egg_observationTest;

assert.equal(api.VERSION, "20260729-egg-observation-final-preflight-v1");
assert.equal(api.QUESTION_VERSION, "20260718-egg-observation-v1");
assert.equal(api.mission.unit_id, "egg_observation");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert.equal(api.assets.owlPrep, "assets/owl-egg-observation-prep.webp");
assert.equal(api.assets.owlReport, "assets/owl-egg-observation-report.webp");
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u29-egg-observation-review"));
const readyBadgeIds = JSON.parse(JSON.stringify(api.badges.filter((badge) => badge.image_status === "ready").map((badge) => badge.id).sort()));
assert.deepEqual(readyBadgeIds, ["egg_cross_section_labeler", "egg_observation_entry", "egg_observation_flawless", "raw_egg_safety_guard"]);
assert.equal(api.badges.filter((badge) => badge.image_status === "pending").length, 13);
assert(api.badges.find((badge) => badge.id === "egg_cross_section_labeler").badge_image_path.includes("shared-assets/badges/egg_observation/badge-egg_observation-egg_cross_section_labeler.webp"));
for (const badge of api.badges.filter((item) => item.image_status === "ready")) {
  const localPath = badge.badge_image_path.replace(/^\.\.\//, "");
  assert(fs.existsSync(path.resolve(root, "..", localPath)), `${badge.id} approved badge image should exist`);
}
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes("egg-hotspot-layer"));
assert(!source.includes("圖像準備中"));

const Q = (n) => `egg_observation_q${String(n).padStart(2, "0")}`;
const answers = {
  [Q(1)]: "safe_raw_egg_observation",
  [Q(2)]: "shell_visible_externally",
  [Q(3)]: "shell_protection_gas_exchange",
  [`${Q(4)}_sequence`]: ["prepare_tray_cleaning_wash_hands", "observe_external_shell", "carefully_open_and_observe_cross_section", "record_structures_locations_functions", "clean_shell_liquid_wash_hands"],
  [Q(5)]: { outer_hard_shell: "eggshell", translucent_region: "albumen", yellow_round_region: "yolk", blunt_end_air_space: "air_cell" },
  [Q(6)]: { eggshell: "protects_inside", albumen: "water_and_cushion", yolk: "nutrient_supply", air_cell: "air_space" },
  [Q(7)]: "yolk_nutrient_not_embryo",
  [Q(8)]: "air_cell_blunt_end_space",
  [Q(9)]: "chalaza_anchors_yolk",
  [Q(10)]: "germinal_disc_on_yolk_surface",
  [Q(11)]: "egg_not_always_developing_embryo",
  [Q(12)]: "evidence_then_structure_inference",
  [Q(13)]: { sperm_egg_zygote: "u29_sexual_reproduction", shell_albumen_yolk_aircell: "u30_egg_observation", stamen_pistil_labeling: "u31_flower_observation", potato_tuber_new_plant: "u28_asexual_reproduction" },
  [Q(14)]: "egg_cross_section_observation_belongs_u30"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "egg_observation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
const q04 = api.questions.find((question) => question.id === Q(4));
assert.notDeepEqual(api.avoidCanonicalSequenceCollision(q04, [...q04.answer]), q04.answer, "q04 collision guard should not leave canonical order");
for (const attemptId of ["seed-alpha", "seed-beta", "seed-gamma", "seed-delta"]) {
  api.setState({ attempt_id: attemptId });
  const firstOrder = api.orderedOptions(q04).map((item) => item.id);
  const secondOrder = api.orderedOptions(q04).map((item) => item.id);
  assert.deepEqual(firstOrder, secondOrder, `q04 order should be stable for ${attemptId}`);
  assert.notDeepEqual(firstOrder, q04.answer, `q04 should not initialize as canonical answer for ${attemptId}`);
}
assert.equal(api.questions.find((question) => question.id === Q(6)).misconception, "egg_function_match_confusion");
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "egg_observation_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("egg_observation_flawless"));
assert(score.earned_badges.includes("safe_egg_sequence_tracker"));
assert(score.earned_badges.includes("egg_structure_function_mapper"));
assert(score.earned_badges.includes("u28_u29_u30_u31_egg_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "egg_observation_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認胚盤和蛋黃有什麼差別，觀察紀錄裡要怎麼先寫證據再做推論？" } });
score = api.scoreAttempt();
assert.equal(score.unit_credited_exp, 500);
assert(score.earned_badges.includes("egg_observation_reflection_reporter"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認胚盤和蛋黃有什麼差別，觀察紀錄裡要怎麼先寫證據再做推論？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("egg_observation_flawless"));
assert(score.earned_badges.includes("egg_observation_misconception_reviser"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["蛋的觀察", 0],
  ["我想確認胚盤和蛋黃有什麼差別，觀察紀錄裡要怎麼先寫證據再做推論？", 40]
]) {
  api.setState({ reflection: { question: text } });
  assert.equal(api.evaluateReflection().question_exp, exp, text);
}

api.setState({
  student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" },
  attempt_id: "server",
  attempt_session_token: "token",
  question_version: api.QUESTION_VERSION,
  answers,
  hints: { [Q(2)]: true },
  reflection: { question: "我想確認胚盤和蛋黃有什麼差別，觀察紀錄裡要怎麼先寫證據再做推論？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "egg_observation");
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(4)], answers[`${Q(4)}_sequence`]);
assert.deepEqual(payload.raw_answers[Q(5)], answers[Q(5)]);
assert.deepEqual(payload.raw_answers[Q(6)], answers[Q(6)]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).analysis_group, "egg_safety_observation_flow");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).teacher_group_id, "egg_safety_observation_flow");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(4)).checkpoint_id, "egg_observation_cp1_safety_and_external");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).analysis_group, "unit_boundary_control");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).teacher_group_id, "unit_boundary_control");
assert(api.renderCheckpoint("checkpoint2").includes("mapping-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
const crossSectionEvidence = api.renderQuestionEvidence(Q(5));
assert(crossSectionEvidence.includes("egg-cross-section-figure"));
assert(crossSectionEvidence.includes("egg-observation-cross-section-hotspot-base.webp?v=20260729-egg-observation-final-preflight-v1"));
assert(crossSectionEvidence.includes("未標註的雞蛋剖面觀察圖，呈現外層硬質邊界、透明或半透明區、黃色圓形區與鈍端空間等可觀察位置"));
assert(crossSectionEvidence.includes("egg-hotspot shell"));
assert(!crossSectionEvidence.includes("剖面辨識圖待接"));
assert.equal(api.assets.briefingSceneHook, "");
assert.equal(api.assets.ambientBackgroundHook, "");
assert(api.renderBrief().includes("brief-scene-fallback"));
assert(api.renderBrief().includes("你好，測試學生"));
assert(api.studentIdentityLine().includes("701班"));
assert(!api.renderReview().includes("mentor-card"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("data-relogin"));
const deprecatedPendingText = "\u5fbd\u7ae0\u7d20\u6750" + "\u5f85\u63a5";
assert(!api.renderResult().includes(deprecatedPendingText));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(!api.renderAchievements().includes("本單元 17 枚徽章"));
assert(api.renderAchievements().includes("重新登入／再挑戰"));
const earnedMixedHtml = api.renderBadgeWall(["egg_observation_entry", "safe_egg_sequence_tracker"], { onlyEarned: true });
assert(earnedMixedHtml.includes("badge-egg_observation-egg_observation_entry.webp?v=20260729-egg-observation-final-preflight-v1"));
assert(earnedMixedHtml.includes("candidate-badge-list"));
assert(earnedMixedHtml.includes("安全觀察流程員"));
assert(!earnedMixedHtml.includes("badge-egg_observation-safe_egg_sequence_tracker.webp"));
assert(!earnedMixedHtml.includes("圖像準備中"));
api.setState({
  student: {
    student_id: "S70102",
    class_name: "701",
    seat_no: "02",
    student_name: "正式學生",
    progress: {
      total_exp: 3880,
      current_title_id: "concept_solver",
      current_title: "概念解謎者",
      unit_badge_summary_json: "[{\"unit_id\":\"life_world\",\"earned_count\":2}]"
    }
  },
  attempt_id: "submitted_attempt",
  attempt_session_id: "session",
  attempt_session_token: "token",
  answers,
  hints: { [Q(5)]: true },
  reflection: { question: "我想確認胚盤和蛋黃有什麼差別，觀察紀錄裡要怎麼先寫證據再做推論？" },
  result: api.scoreAttempt(),
  submitted: true,
  screen: "result",
  completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"]
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
api.saveVerifiedSnapshot();
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.loadVerifiedSnapshot().student_id, "S70102");
assert.equal(api.loadVerifiedSnapshot().progress.total_exp, 3880);
assert(api.renderRules().includes("返回任務"));
console.log("prototype-egg-observation app regression passed");
