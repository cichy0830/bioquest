#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-asexual-reproduction")
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
vm.runInNewContext(source, context, { filename: "prototype-asexual-reproduction/app.js" });
const api = context.window.__asexual_reproductionTest;

assert.equal(api.VERSION, "20260813-asexual-reproduction-mapping-v1");
assert.equal(api.QUESTION_VERSION, "20260718-asexual-reproduction-v1");
assert.notEqual(api.VERSION, api.QUESTION_VERSION);
assert.equal(api.mission.unit_id, "asexual_reproduction");
assert.equal(api.questions.length, 14);
assert.equal(api.badges.length, 17);
assert(source.includes("BioQuestLoginUX?.begin"));
assert(!source.includes("待審素材"));
assert(!source.includes("u28-asexual-reproduction-review"));
assert(fs.existsSync(path.join(root, "assets", "asexual-reproduction-briefing-azhe-wide.webp")));
assert(fs.existsSync(path.join(root, "assets", "asexual-reproduction-ambient-wide.webp")));
for (const assetName of [
  "asexual-reproduction-q05-hydra-budding-observation.webp",
  "asexual-reproduction-q05-hydra-budding-observation-960.webp",
  "asexual-reproduction-q05-hydra-budding-observation-390.webp",
  "asexual-reproduction-q12-cutting-materials-data.webp",
  "asexual-reproduction-q12-cutting-materials-data-960.webp",
  "asexual-reproduction-q12-cutting-materials-data-390.webp",
  "asexual-reproduction-evidence-overlay-spec.json"
]) assert(fs.existsSync(path.join(root, "assets", assetName)), `missing runtime evidence asset ${assetName}`);
const styleSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert(!styleSource.includes(`正式徽章素材${"待"}接`));
assert(!styleSource.includes(`徽章素材${"待"}接`));
assert(source.includes("圖像待核准"));
assert.equal(api.badges.filter((badge) => badge.image_status === "ready").length, 0);
assert.equal(api.badges.filter((badge) => badge.image_status === "controlled_pending").length, 17);

const Q = (n) => `asexual_reproduction_q${String(n).padStart(2, "0")}`;
const q05Evidence = api.renderQuestionEvidence(Q(5));
const q12Evidence = api.renderQuestionEvidence(Q(12));
assert(q05Evidence.includes('data-evidence-id="q05-hydra-budding"'));
assert(q12Evidence.includes('data-evidence-id="q12-cutting-materials"'));
assert(q05Evidence.includes(`asexual-reproduction-q05-hydra-budding-observation.webp?v=${api.VERSION}`));
assert(q05Evidence.includes(`asexual-reproduction-q05-hydra-budding-observation-960.webp?v=${api.VERSION}`));
assert(q05Evidence.includes(`asexual-reproduction-q05-hydra-budding-observation-390.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`asexual-reproduction-q12-cutting-materials-data.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`asexual-reproduction-q12-cutting-materials-data-960.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`asexual-reproduction-q12-cutting-materials-data-390.webp?v=${api.VERSION}`));
assert(q12Evidence.includes(`data-overlay-contract-src="${api.assets.evidenceOverlaySpec}?v=${api.VERSION}"`));
assert(q12Evidence.includes("繁殖材料來源"));
assert(q12Evidence.includes("新株 C"));
for (const forbidden of ["出芽生殖", "小芽長大成新個體", "親代身體側邊出現小突起", "答案是出芽", "不是斷裂生殖"]) {
  assert(!q05Evidence.includes(forbidden), `q05 caption/alt evidence should not leak ${forbidden}`);
}
for (const forbidden of ["同一親代", "後代相似", "遺傳特徵大致相同", "無性生殖後代通常相似", "正解是 A", "不用精卵結合"]) {
  assert(!q12Evidence.includes(forbidden), `q12 caption/alt evidence should not leak ${forbidden}`);
}
const overlaySpec = JSON.parse(fs.readFileSync(path.join(root, "assets", "asexual-reproduction-evidence-overlay-spec.json"), "utf8"));
assert.equal(overlaySpec.status, "USER_APPROVED_READY_FOR_WIRING");
assert.equal(api.evidenceOverlayContract.q12.rows.length, overlaySpec.evidence_assets.find((item) => item.question_id === Q(12)).rows.length);
const answers = {
  [Q(1)]: "asexual_no_sperm_egg_fusion",
  [Q(2)]: "single_parent_part_forms_new_individual",
  [Q(3)]: "offspring_usually_genetically_similar",
  [Q(4)]: { amoeba_split: "binary_fission", hydra_bud: "budding", body_fragment: "fragmentation", mold_spore: "spore_reproduction", potato_tuber: "vegetative_propagation" },
  [Q(5)]: "budding_from_parent_body",
  [`${Q(6)}_sequence`]: ["parent_plant_forms_tuber_with_bud", "bud_on_tuber_begins_growth", "new_shoots_and_roots_grow", "new_potato_plant_forms"],
  [Q(7)]: "spores_develop_into_new_individuals",
  [Q(8)]: "plant_tissue_culture_many_similar_plants",
  [Q(9)]: "runner_fast_similar_plants",
  [Q(10)]: "similar_offspring_fast_but_risky",
  [Q(11)]: { yeast_budding: "asexual_core", potato_tuber: "asexual_core", body_fragment: "asexual_core", sperm_egg_fusion: "not_this_unit_core" },
  [Q(12)]: "cutting_offspring_similar_to_parent",
  [Q(13)]: { chromosome_copy_distribution: "u27_cell_division", potato_tuber_new_plant: "u28_asexual_reproduction", hydra_budding: "u28_asexual_reproduction", sperm_egg_fusion: "u29_sexual_reproduction" },
  [Q(14)]: "budding_belongs_asexual_reproduction"
};

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "asexual_reproduction_test", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "" } });
for (const question of api.questions) assert.equal(api.isCorrect(question.id), true, question.id);
let score = api.scoreAttempt();
assert.equal(score.correct_count, 14);
assert.equal(score.unit_credited_exp, 460);
assert(score.earned_badges.includes("asexual_reproduction_flawless"));
assert(score.earned_badges.includes("vegetative_sequence_tracker"));
assert(score.earned_badges.includes("asexual_method_example_classifier"));
assert(score.earned_badges.includes("u27_u28_u29_boundary_guardian"));

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "asexual_reproduction_valid_reflection", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認出芽生殖和斷裂生殖要如何用親代來源與新個體形成位置來分辨？" } });
assert.equal(api.scoreAttempt().unit_credited_exp, 500);

api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "hint", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, hints: { [Q(13)]: true }, hintEventStatus: { [Q(13)]: "sent" }, reflection: { question: "我想確認無性生殖和有性生殖的邊界怎麼判斷？" } });
score = api.scoreAttempt();
assert(score.unit_credited_exp < 500);
assert(!score.earned_badges.includes("asexual_reproduction_flawless"));

for (const [text, exp] of [
  ["", 0],
  ["老師好帥", 0],
  ["讚", 0],
  ["我想確認出芽生殖和斷裂生殖要如何用親代來源與新個體形成位置來分辨？", 40]
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
  reflection: { question: "我想確認出芽生殖和斷裂生殖要如何用親代來源與新個體形成位置來分辨？" }
});
const payload = api.buildBackendPayload(api.scoreAttempt());
assert.equal(payload.unit_id, "asexual_reproduction");
assert.equal(payload.question_version, api.QUESTION_VERSION);
assert.notEqual(payload.question_version, api.VERSION);
assert.equal(payload.question_logs.length, 14);
assert.deepEqual(payload.raw_answers[Q(6)], answers[`${Q(6)}_sequence`]);
assert.deepEqual(payload.raw_answers.q06, answers[`${Q(6)}_sequence`]);
assert.deepEqual(payload.raw_answers.q06_sequence, answers[`${Q(6)}_sequence`]);
assert.deepEqual(payload.raw_answers.q04, answers[Q(4)]);
assert.deepEqual(payload.raw_answers[Q(11)], answers[Q(11)]);
assert.deepEqual(payload.raw_answers.q11, answers[Q(11)]);
assert.deepEqual(payload.raw_answers[Q(13)], answers[Q(13)]);
assert.deepEqual(payload.raw_answers.q13, answers[Q(13)]);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).question_version, api.QUESTION_VERSION);
assert.equal(payload.question_logs.find((log) => log.question_id === Q(6)).analysis_group, "vegetative_sequence");
assert.equal(payload.question_logs.find((log) => log.question_id === Q(13)).analysis_group, "unit_boundary_control");
const q06 = api.questions.find((item) => item.id === Q(6));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "q06-collision", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, optionOrders: { [Q(6)]: [...q06.answer] } });
const guardedQ06 = api.orderedOptions(q06).map((item) => item.id);
assert.notDeepEqual(guardedQ06, q06.answer, "q06 initial sequence should not equal canonical answer");
assert.deepEqual(api.orderedOptions(q06).map((item) => item.id), guardedQ06, "q06 guarded order should stay stable");
assert(api.renderCheckpoint("checkpoint2").includes("sequence-list"));
assert(api.renderCheckpoint("checkpoint3").includes("mapping-list"));
const localCandidate = {
  verification_status: "pending_backend",
  correct_count: 999,
  total_questions: 14,
  accuracy: 0.5,
  hint_used_count: 7,
  completion_exp: 999,
  direct_exp: 999,
  revision_exp: 999,
  reflection_exp: 999,
  mastery_exp: 999,
  retry_exp: 999,
  attempt_exp: 999,
  unit_credited_exp: 999,
  exp_delta: 999,
  earned_badges: ["local_candidate_badge"]
};
api.setState({ student: { student_id: "S99999", student_name: "測試學生", progress: {} }, question_version: api.QUESTION_VERSION });
const serverResult = api.applyBackendSubmitResponse({
  ok: true,
  verified_attempt: {
    verification_status: "server_verified",
    correct_count: 11,
    total_questions: 14,
    accuracy: 0.79,
    hint_used_count: 2,
    completion_exp: 100,
    concept_exp: 111,
    question_exp: 22,
    revision_exp: 3,
    mastery_exp: 44,
    retry_exp: 5,
    attempt_total_exp: 333,
    unit_credited_exp: 333,
    credited_delta: 333,
    badges_json: JSON.stringify(["server_badge_a", "server_badge_b"])
  },
  student_progress: { total_exp: 1888, current_title_id: "ecology_recorder" }
}, localCandidate);
assert.equal(serverResult.direct_exp, 111);
assert.equal(serverResult.reflection_exp, 22);
assert.equal(serverResult.attempt_exp, 333);
assert.deepEqual([...serverResult.earned_badges], ["server_badge_a", "server_badge_b"]);
assert(!serverResult.earned_badges.includes("local_candidate_badge"), "server_verified should not fall back to local badges");
const serverNoBadgeResult = api.applyBackendSubmitResponse({
  ok: true,
  verified_attempt: { verification_status: "server_verified", concept_exp: 1, question_exp: 2, attempt_total_exp: 3 }
}, localCandidate);
assert.deepEqual([...serverNoBadgeResult.earned_badges], [], "server_verified without server badges should not use local candidate");
const pendingResult = api.applyBackendSubmitResponse({
  ok: true,
  attempt: { verification_status: "pending_backend", concept_exp: 8, question_exp: 4, attempt_total_exp: 12 }
}, localCandidate);
assert.deepEqual([...pendingResult.earned_badges], ["local_candidate_badge"], "pending backend may keep local candidate badges");
const hasSingleBoundaryGrouping = (question, ids) => {
  const groups = ids.map((id) => question.answer[id]);
  let changes = 0;
  for (let index = 1; index < groups.length; index += 1) if (groups[index] !== groups[index - 1]) changes += 1;
  return changes <= 1 && new Set(groups).size > 1;
};
for (const qid of [Q(4), Q(11), Q(13)]) {
  const question = api.questions.find((item) => item.id === qid);
  const canonicalItems = question.items.map((item) => item.id);
  const canonicalChoices = question.choices.map((item) => item.id);
  for (let index = 0; index < 20; index += 1) {
    api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: `${qid}-seed-${index}`, attempt_session_token: "guest", question_version: api.QUESTION_VERSION });
    const firstItems = api.orderedMappingItems(question).map((item) => item.id);
    const secondItems = api.orderedMappingItems(question).map((item) => item.id);
    const choices = api.orderedMappingChoices(question).map((item) => item.id);
    assert.deepEqual(firstItems, secondItems, `${qid} item order should be stable for seed ${index}`);
    assert.notDeepEqual(firstItems, canonicalItems, `${qid} item order should not stay canonical for seed ${index}`);
    assert.equal(hasSingleBoundaryGrouping(question, firstItems), false, `${qid} item order should not expose a single answer-group boundary for seed ${index}`);
    if (canonicalChoices.length > 1) assert.notDeepEqual(choices, canonicalChoices, `${qid} choices should not stay canonical for seed ${index}`);
  }
}
assert.equal(api.assets.briefingSceneHook, "assets/asexual-reproduction-briefing-azhe-wide.webp");
assert.equal(api.assets.ambientBackgroundHook, "assets/asexual-reproduction-ambient-wide.webp");
assert(api.renderBrief().includes(`assets/asexual-reproduction-briefing-azhe-wide.webp?v=${api.VERSION}`));
assert(!api.renderBrief().includes("brief-scene-fallback"));
assert(fs.readFileSync(path.join(root, "styles.css"), "utf8").includes(`assets/asexual-reproduction-ambient-wide.webp?v=${api.VERSION}`));
assert(api.renderBrief().includes("guest 測試身分"));
api.setState({ student: { student_id: "S99999", class_name: "701", seat_no: "99", student_name: "測試學生" }, question_version: api.QUESTION_VERSION });
assert(api.renderBrief().includes("你好，測試學生"));
assert(api.renderBrief().includes("701 99"));
assert(!api.renderReflection().includes("bq-report-assistant"));
assert(fs.readFileSync(path.join(root, "index.html"), "utf8").includes("data-report-owl-src"));
assert(!api.renderReview().includes("mentor-card"));
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認出芽生殖和斷裂生殖要如何用親代來源與新個體形成位置來分辨？" } });
score = api.scoreAttempt();
api.setState({ student: { student_id: "guest", is_guest: true }, attempt_id: "result", attempt_session_token: "guest", question_version: api.QUESTION_VERSION, answers, reflection: { question: "我想確認出芽生殖和斷裂生殖要如何用親代來源與新個體形成位置來分辨？" }, result: score });
assert(api.renderResult().includes("提交後本次作答已鎖定"));
assert(api.renderResult().includes("data-relogin"));
assert.equal((api.renderResult().match(/class="badge /g) || []).length, score.earned_badges.length);
assert.equal((api.renderResult().match(/<img /g) || []).length, 0);
assert(api.renderResult().includes("圖像待核准"));
assert(!api.renderAchievements().includes("本單元 17 枚徽章"));
assert(api.renderAchievements().includes("data-bq-achievements-overview-only"));
assert(api.renderAchievements().includes("data-relogin"));
api.setState({
  screen: "result",
  student: {
    student_id: "S99999",
    class_name: "701",
    seat_no: "99",
    student_name: "測試學生",
    progress: { total_exp: 5000, current_title_id: "concept_solver", title_avatar_path: "../shared-assets/title-avatars/title-04-concept_solver-male.webp" }
  },
  attempt_id: "submitted",
  attempt_session_token: "token",
  attempt_session_id: "session",
  question_version: api.QUESTION_VERSION,
  answers,
  submitted: true,
  completedScreens: ["login", "brief", "result", "achievements", "rules"],
  result: score
});
assert.equal(api.canUseNav("login"), true);
assert.equal(api.canUseNav("checkpoint1"), false);
assert(api.renderRules().includes('data-next="result"'));
api.resetForRelogin();
assert.equal(api.state().screen, "login");
assert.equal(api.state().student, null);
assert.equal(api.state().attempt_id, "");
assert.equal(api.state().submitted, false);
assert.equal(api.loadAttempts().length, 0);
assert.equal(api.loadVerifiedSnapshot().student_id, "S99999");
assert.equal(api.loadVerifiedSnapshot().total_exp, 5000);
console.log("prototype-asexual-reproduction app regression passed");
