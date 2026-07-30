const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

new vm.Script(source);

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  let depth = 0;
  let opened = false;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
      opened = true;
    } else if (source[i] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

function asyncFunctionSource(name) {
  const start = source.indexOf(`async function ${name}(`);
  assert.notEqual(start, -1, `missing async ${name}`);
  let depth = 0;
  let opened = false;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
      opened = true;
    } else if (source[i] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated async ${name}`);
}

const hintContext = {
  state: {
    answers: {
      checkpoint1Hints: {}
    }
  }
};
vm.createContext(hintContext);
vm.runInContext(
  `${functionSource("matchHintUsed")}
   ${functionSource("markMatchHintUsed")}`,
  hintContext
);

assert.equal(hintContext.matchHintUsed("checkpoint1", "functions", "viewing_path"), false);
assert.equal(hintContext.markMatchHintUsed("checkpoint1", "functions", "viewing_path"), true);
assert.equal(hintContext.matchHintUsed("checkpoint1", "functions", "viewing_path"), true);
assert.equal(hintContext.matchHintUsed("checkpoint1", "functions", "first_magnify"), false);
assert.equal(hintContext.markMatchHintUsed("checkpoint1", "functions", "viewing_path"), false);
assert.deepEqual(
  JSON.parse(JSON.stringify(hintContext.state.answers.checkpoint1Hints)),
  { functions: { viewing_path: true } }
);

const briefStart = source.indexOf("function renderBrief()");
const briefEnd = source.indexOf("function renderScan()", briefStart);
const briefSource = source.slice(briefStart, briefEnd);
const checkpointShellSource = functionSource("checkpointShell");
assert.ok(briefSource.includes("briefLayout("));
assert.ok(!briefSource.includes("mentorCard("), "brief must not render a separate mentor card");
assert.ok(!briefSource.includes("owlPanel("), "brief must not render an owl");
assert.ok(!checkpointShellSource.includes("owlPanel("), "checkpoints must not render an owl");
assert.ok(!checkpointShellSource.includes("owl-frame"), "checkpoint shell must not contain an owl frame");
assert.ok(!checkpointShellSource.includes("<img"), "checkpoint shell must not contain a role image");
assert.ok(checkpointShellSource.includes('class="wide-layout checkpoint-layout"'));
for (const name of ["renderCheckpoint1", "renderCheckpoint2", "renderCheckpoint3", "renderCheckpoint4"]) {
  assert.ok(functionSource(name).includes("checkpointShell("), `${name} must use the owl-free checkpoint shell`);
}
assert.ok(source.includes("bg-microscope-use-briefing-azhe-wide.webp"));
assert.ok(source.includes('<source media="(max-width: 680px)"'));
assert.ok(source.includes("attachBriefSceneFallback"));
assert.ok(source.includes("mobileSource.remove();"));
assert.ok(source.includes('window.addEventListener("resize", verifyScene'));
assert.ok(source.includes("if (didRevealHint) render();"));
assert.ok(source.includes('<span class="sequence-prompt">${item.label}</span>'));
assert.ok(source.includes('const VERSION = "20260730-microscope-use-submitted-retry-ia-v1"'));
assert.ok(source.includes('const QUESTION_VERSION = "20260720-microscope-use-canonical-v1"'));
assert.ok(!source.includes("MICROSCOPE_VERSION"));
assert.ok(source.includes("function renderEarnedBadgeCatalog("));
assert.ok(!source.includes("function renderBadgeCatalog("));
assert.ok(source.includes('data-earned-only="true"'));
assert.ok(source.includes('data-relogin-action="true"'));
assert.ok(source.includes("function resetForRelogin()"));
assert.ok(!source.includes("data-bq-unit-achievements"));
assert.ok(source.includes('diagramParts: `assets/microscope-parts-interactive.webp?v=${VERSION}`'));
assert.ok(source.includes('onionLowPower: `assets/img-microscope-onion-low-power.webp?v=${VERSION}`'));
assert.ok(source.includes('onionHighPower: `assets/img-microscope-onion-high-power.webp?v=${VERSION}`'));
assert.ok(source.includes('parameciumViewLeft: `assets/img-microscope-paramecium-view-left.webp?v=${VERSION}`'));
assert.ok(source.includes('parameciumViewCenter: `assets/img-microscope-paramecium-view-center.webp?v=${VERSION}`'));
assert.ok(source.includes('parameciumViewRight: `assets/img-microscope-paramecium-view-right.webp?v=${VERSION}`'));
assert.ok(source.includes('class="power-image"'));
assert.ok(source.includes("低倍複式顯微鏡下的洋蔥表皮"));
assert.ok(!source.includes("u4-microscope-view-left-review.webp"));
assert.ok(!source.includes("u4-microscope-view-center-review.webp"));
assert.ok(!source.includes("u4-microscope-view-right-review.webp"));
assert.ok(source.includes('class="microscope-parts-image"'));
assert.ok(source.includes('class="microscope-css-fallback"'));
assert.ok(source.includes('document.querySelectorAll("[data-part-id]")'));
assert.ok(source.includes("function selectPartTarget(partId)"));
assert.ok(source.includes("state.answers.checkpoint1.parts[target.id] = target.answer"));
assert.ok(source.includes("尚有 ${remaining} 個部位未辨識"));
assert.ok(source.includes('activePart: null'));
assert.ok(source.includes('partTargetIndex: 0'));
assert.ok(source.includes('if (next === "checkpoint1" && state.screen !== "checkpoint1") state.activePart = null'));
assert.ok(source.includes('target?.id === part.id || active?.id === part.id'));
assert.ok(source.includes("尚未選擇構造"));
assert.ok(source.includes("function getSequenceOrder()"));
assert.ok(source.includes("function moveSequenceStep(stepId, direction)"));
assert.ok(source.includes('document.querySelectorAll("[data-sequence-move]")'));
assert.ok(index.includes("20260730-microscope-use-submitted-retry-ia-v1"));
assert.ok(!index.includes("20260714-microscope-paramecium-v3"));
assert.ok(fs.existsSync(path.join(root, "assets", "microscope-parts-interactive.webp")));
assert.ok(fs.existsSync(path.join(root, "assets", "img-microscope-onion-low-power.webp")));
assert.ok(fs.existsSync(path.join(root, "assets", "img-microscope-onion-high-power.webp")));
for (const position of ["left", "center", "right"]) {
  assert.ok(fs.existsSync(path.join(root, "assets", `img-microscope-paramecium-view-${position}.webp`)));
}
assert.ok(fs.existsSync(path.join(root, "assets", "bg-microscope-use-base-wide.webp")));
assert.ok(styles.includes('url("assets/bg-microscope-use-base-wide.webp")'));
assert.ok(styles.includes(".field-view-image"));
assert.ok(styles.includes("aspect-ratio: 1"));
assert.ok(styles.includes("object-fit: contain"));
for (const marker of ["x: 35, y: 13", "x: 42, y: 40", "x: 43, y: 52", "x: 73, y: 61", "x: 62, y: 69", "x: 43, y: 72"]) {
  assert.ok(source.includes(marker), `missing hotspot calibration: ${marker}`);
}

const partButton = {
  dataset: { partId: "objective" },
  addEventListener(type, listener) {
    assert.equal(type, "click");
    this.click = listener;
  }
};
let saveStateCalls = 0;
let renderCalls = 0;
const partClickContext = {
  partItems: [{ id: "objective", answer: "靠近玻片的放大鏡頭" }],
  state: {
    activePart: "eyepiece",
    partTargetIndex: 0,
    partTargetResults: {},
    answers: { checkpoint1: { parts: {} }, checkpoint1Hints: {} }
  },
  document: {
    querySelectorAll: (selector) => selector === "[data-part-id]" ? [partButton] : [],
    querySelector: () => null
  },
  saveState() { saveStateCalls += 1; },
  render() { renderCalls += 1; },
  currentPartTarget() { return partClickContext.partItems[partClickContext.state.partTargetIndex] || null; },
  markMatchHintUsed() { return true; }
};
vm.createContext(partClickContext);
vm.runInContext(`${functionSource("selectPartTarget")}\n${functionSource("attachCheckpointHandlers")}`, partClickContext);
partClickContext.attachCheckpointHandlers();
partButton.click();
assert.equal(partClickContext.state.activePart, "objective");
assert.equal(partClickContext.state.answers.checkpoint1.parts.objective, "靠近玻片的放大鏡頭");
assert.equal(partClickContext.state.partTargetIndex, 1);
assert.deepEqual(JSON.parse(JSON.stringify(partClickContext.state.partTargetResults.objective)), { correct: true, hint_used: false });
assert.equal(saveStateCalls, 1);
assert.equal(renderCalls, 1);

const fieldViewContext = {
  microscopeVisualAssets: {
    parameciumViewLeft: "left.webp",
    parameciumViewCenter: "center.webp",
    parameciumViewRight: "right.webp"
  },
  Math,
  Number
};
vm.createContext(fieldViewContext);
vm.runInContext(functionSource("fieldViewForSlidePosition"), fieldViewContext);
assert.deepEqual(JSON.parse(JSON.stringify(fieldViewContext.fieldViewForSlidePosition(-1))), {
  slideLabel: "向左", imageLabel: "向右", viewPosition: "right", asset: "right.webp"
});
assert.deepEqual(JSON.parse(JSON.stringify(fieldViewContext.fieldViewForSlidePosition(0))), {
  slideLabel: "置中", imageLabel: "置中", viewPosition: "center", asset: "center.webp"
});
assert.deepEqual(JSON.parse(JSON.stringify(fieldViewContext.fieldViewForSlidePosition(1))), {
  slideLabel: "向右", imageLabel: "向左", viewPosition: "left", asset: "left.webp"
});
assert.ok(functionSource("renderFieldDemo").includes('data-field-view="${fieldView.viewPosition}"'));
assert.ok(functionSource("renderFieldDemo").includes('src="${fieldView.asset}"'));

let sequenceSaveCalls = 0;
const sequenceContext = {
  state: { answers: { checkpoint2: { sequence: {} } } },
  sequenceSteps: [{ id: "a" }, { id: "b" }, { id: "c" }],
  optionOrder: () => ["b", "a", "c"],
  saveState() { sequenceSaveCalls += 1; },
  Object
};
vm.createContext(sequenceContext);
vm.runInContext(functionSource("getSequenceOrder"), sequenceContext);
assert.deepEqual(Array.from(sequenceContext.getSequenceOrder()), ["b", "a", "c"]);
assert.deepEqual(JSON.parse(JSON.stringify(sequenceContext.state.answers.checkpoint2.sequence)), { b: 1, a: 2, c: 3 });
assert.equal(sequenceSaveCalls, 1);

const hotspotRule = styles.match(/\.part-hotspot \{([\s\S]*?)\n\}/)?.[1] || "";
const activeHotspotRule = styles.match(/\.part-hotspot\.active \{([\s\S]*?)\n\}/)?.[1] || "";
assert.ok(hotspotRule.includes("border: 2px solid transparent"));
assert.ok(hotspotRule.includes("background: transparent"));
assert.ok(hotspotRule.includes("box-shadow: none"));
assert.ok(activeHotspotRule.includes("border-color: #ffb22e"));

const canonicalMetaStart = source.indexOf("const canonicalQuestionMeta = {");
const canonicalMetaEnd = source.indexOf("async function markHintForQuestion", canonicalMetaStart);
assert.ok(canonicalMetaStart > 0 && canonicalMetaEnd > canonicalMetaStart, "missing canonical question metadata block");
const canonicalContext = {
  state: {
    student: { student_id: "S70104", student_name: "學生丁", class_name: "701", seat_no: "04", is_guest: false },
    hintEventStatus: { q12: "sent" },
    answers: {
      checkpoint1: {
        parts: {
          eyepiece: "上方觀察處",
          objective: "靠近玻片的放大鏡頭",
          stage: "承放玻片的位置",
          coarse: "側邊大幅調焦",
          fine: "側邊微調焦距",
          light: "載物臺下方調整進光"
        },
        functions: {
          viewing_path: "目鏡",
          first_magnify: "物鏡",
          slide_support: "載物臺",
          large_focus: "粗調節輪",
          tiny_focus: "細調節輪",
          brightness_control: "光圈"
        },
        fine_focus: "細調節輪",
        too_dark: "調整光源、反光鏡或光圈"
      },
      checkpoint1Hints: {},
      checkpoint2: {
        sequence: { low_power: 1, place_slide: 2, adjust_light: 3, coarse_focus: 4, fine_focus: 5, high_power: 6 },
        high_power_first: "低倍視野較大、較亮，通常較容易先找到標本",
        high_power_focus: "輕微轉動細調節輪",
        carry_scope: "一手握鏡臂，一手托鏡座",
        storage_steps: ["轉回低倍物鏡", "取下玻片", "下降載物臺或鏡筒至安全位置", "整理電源線或防塵"]
      },
      checkpoint2Hints: {},
      checkpoint3: {
        magnification_400: "400x",
        magnification_add: "總倍率應為目鏡倍率乘以物鏡倍率",
        slide_right: "向左",
        center_right: "向右",
        high_power_change: "視野範圍變小、亮度常變暗",
        high_power_better: "高倍能看細節，但視野較小且較暗，找標本時不一定方便"
      },
      checkpoint3Hints: {},
      reflection: {}
    }
  },
  mission: { unit_id: "microscope_use", unit_title: "顯微鏡的使用" },
  QUESTION_VERSION: "20260720-microscope-use-canonical-v1",
  sequenceSteps: [
    { id: "low_power" },
    { id: "place_slide" },
    { id: "adjust_light" },
    { id: "coarse_focus" },
    { id: "fine_focus" },
    { id: "high_power" }
  ],
  unitBadgeCatalog: [
    { id: "microscope_use_entry", name: "微觀校準入門徽章", badge_image_path: "../shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_entry.webp?v=20260721-microscope-use-server-verified-v1" },
    { id: "microscope_use_flawless", name: "顯微鏡零提示全對徽章", badge_image_path: "../shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_flawless.webp?v=20260721-microscope-use-server-verified-v1" }
  ],
  JSON,
  Object,
  Array,
  Number,
  String,
  Boolean,
  URLSearchParams,
  fetch: () => { throw new Error("guest submit must not call backend"); }
};
vm.createContext(canonicalContext);
vm.runInContext(`
  ${source.slice(canonicalMetaStart, canonicalMetaEnd)}
  ${functionSource("sequenceRawAnswer")}
  ${functionSource("canonicalRawAnswers")}
  ${functionSource("formatCanonicalAnswer")}
  ${functionSource("legacyHintUsedForCanonical")}
  ${functionSource("canonicalQuestionLogs")}
  ${functionSource("badgeEvalForPayload")}
  ${functionSource("buildBackendPayload")}
  ${asyncFunctionSource("submitAttemptToBackend")}
`, canonicalContext);
const canonicalRaw = canonicalContext.canonicalRawAnswers();
assert.equal(Object.keys(canonicalRaw).length, 15);
assert.deepEqual(JSON.parse(JSON.stringify(canonicalRaw.q05)), ["low_power", "place_slide", "adjust_light", "coarse_focus", "fine_focus", "high_power"]);
assert.deepEqual(JSON.parse(JSON.stringify(canonicalRaw.q09)), ["轉回低倍物鏡", "取下玻片", "下降載物臺或鏡筒至安全位置", "整理電源線或防塵"]);
const canonicalLogs = canonicalContext.canonicalQuestionLogs(canonicalRaw);
assert.equal(canonicalLogs.length, 15);
assert.equal(canonicalLogs.find((log) => log.question_id === "microscope_use_q01").question_type, "mapping");
assert.equal(canonicalLogs.find((log) => log.question_id === "microscope_use_q05").question_type, "sequence");
assert.equal(canonicalLogs.find((log) => log.question_id === "microscope_use_q09").question_type, "set");
assert.equal(canonicalLogs.find((log) => log.question_id === "microscope_use_q12").used_hint, true);
assert.ok(canonicalLogs.every((log) => log.question_version === "20260720-microscope-use-canonical-v1"));
const payloadForBackend = canonicalContext.buildBackendPayload({
  attempt_id: "attempt-1",
  attempt_session_id: "session-1",
  attempt_session_token: "token-1",
  previous_attempt_id: "",
  student: canonicalContext.state.student,
  mission: canonicalContext.mission,
  attempt_type: "first",
  started_at: "2026-07-21T00:00:00.000Z",
  submitted_at: "2026-07-21T00:10:00.000Z",
  total: 15,
  correct: 15,
  accuracy: 1,
  hint_used: 1,
  correct_without_hint: 14,
  corrected_after_hint: 1,
  completion_exp: 100,
  concept_exp: 220,
  revision_exp: 0,
  question_exp: 40,
  mastery_exp: 80,
  retry_exp: 0,
  attempt_total_exp: 440,
  unit_credited_exp: 440,
  credited_delta: 440,
  confidence_score: 3,
  reflection_quality: "discussion_question",
  reflection_review_status: "auto_scored",
  teacher_attention_needed: false,
  student_question: "視野方向為什麼相反？",
  confident_concept: "倍率",
  uncertain_concept: "視野方向"
});
assert.equal(payloadForBackend.question_version, "20260720-microscope-use-canonical-v1");
assert.equal(payloadForBackend.raw_answers_json, JSON.stringify(canonicalRaw));
assert.equal(payloadForBackend.question_logs.length, 15);
assert.ok(!payloadForBackend.question_logs.some((log) => log.question_id.includes("section")));
assert.deepEqual(JSON.parse(payloadForBackend.badge_eval_json).map((badge) => badge.badge_image_path), [
  "shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_entry.webp",
  "shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_flawless.webp"
]);
canonicalContext.submitAttemptToBackend({ student: { is_guest: true } }).then((response) => {
  assert.deepEqual(JSON.parse(JSON.stringify(response)), { ok: true, verification_status: "local_guest" });
});

const earnedContext = {
  unitBadgeCatalog: [
    { id: "microscope_use_entry", name: "微觀校準入門徽章", condition: "完成任務", badge_image_path: "../shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_entry.webp?v=20260730-microscope-use-submitted-retry-ia-v1" },
    { id: "microscope_parts_identifier", name: "顯微鏡部位功能徽章", condition: "辨識部位", badge_image_path: "../shared-assets/badges/microscope_use/badge-microscope_use-microscope_parts_identifier.webp?v=20260730-microscope-use-submitted-retry-ia-v1" },
    { id: "microscope_use_flawless", name: "顯微鏡零提示全對徽章", condition: "零提示全對", badge_image_path: "../shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_flawless.webp?v=20260730-microscope-use-submitted-retry-ia-v1" }
  ],
  state: { student: { is_guest: false }, verification_mode: "server_verified", result: { verification_status: "server_verified" } }
};
vm.createContext(earnedContext);
vm.runInContext(functionSource("renderEarnedBadgeCatalog"), earnedContext);
const earnedHtml = earnedContext.renderEarnedBadgeCatalog(["微觀校準入門徽章", "microscope_use_flawless"], "server_verified");
assert.ok(earnedHtml.includes('data-earned-only="true"'));
assert.ok(earnedHtml.includes("microscope_use_entry"));
assert.ok(earnedHtml.includes("microscope_use_flawless"));
assert.ok(!earnedHtml.includes("microscope_parts_identifier"));
assert.ok(!earnedHtml.includes("locked"));
assert.ok(earnedContext.renderEarnedBadgeCatalog([], "pending_backend").includes("待後台確認"));

const achievementContext = {
  state: {
    student: { student_id: "S70104", student_name: "學生丁", progress: {}, is_guest: false },
    result: { badges: ["微觀校準入門徽章"] },
    submitted_at: "2026-07-30T13:00:00.000Z"
  },
  renderLogin: () => "<div>login</div>"
};
vm.createContext(achievementContext);
vm.runInContext(functionSource("renderAchievements"), achievementContext);
const achievementHtml = achievementContext.renderAchievements();
assert.ok(achievementHtml.includes('data-bq-badge-overview="true"'));
assert.ok(achievementHtml.includes('data-relogin-action="true"'));
assert.ok(!achievementHtml.includes("data-bq-unit-achievements"));
assert.ok(!achievementHtml.includes("badge-grid"));

const rulesContext = {
  state: { submitted_at: "2026-07-30T13:00:00.000Z" },
  UNIT_EXP_CAP: 500,
  DIRECT_EXP_POOL: 220,
  FULL_BOOK_EXP_MAX: 26000,
  TITLE_PROGRESS_CAP: 23400
};
vm.createContext(rulesContext);
vm.runInContext(functionSource("renderRules"), rulesContext);
assert.ok(rulesContext.renderRules().includes('data-relogin-action="true"'));

const resetContext = {
  defaultState: {
    screen: "login",
    student: null,
    attempt_id: "",
    attempt_session_id: "",
    attempt_session_token: "",
    answers: {},
    hintEventStatus: {},
    result: null,
    submitted_at: null,
    lockNotice: ""
  },
  state: {
    screen: "result",
    student: { student_id: "S70104", progress: { total_exp: 1880 }, title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp" },
    attempt_id: "attempt-old",
    attempt_session_id: "session-old",
    attempt_session_token: "token-old",
    result: { attempt_total_exp: 500 },
    submitted_at: "2026-07-30T13:00:00.000Z"
  },
  saved: null,
  renderCalls: 0,
  structuredClone: (value) => JSON.parse(JSON.stringify(value)),
  saveState() { resetContext.saved = JSON.parse(JSON.stringify(resetContext.state)); },
  render() { resetContext.renderCalls += 1; },
  window: { scrollTo() {} }
};
vm.createContext(resetContext);
vm.runInContext(functionSource("resetForRelogin"), resetContext);
resetContext.resetForRelogin();
assert.equal(resetContext.state.screen, "login");
assert.equal(resetContext.state.student, null);
assert.equal(resetContext.state.attempt_id, "");
assert.equal(resetContext.state.attempt_session_token, "");
assert.equal(resetContext.state.result, null);
assert.equal(resetContext.state.submitted_at, null);
assert.equal(resetContext.renderCalls, 1);

console.log("prototype-microscope-use regression checks passed");
