const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = path.resolve(__dirname, "..");
const cache = "20260731-cell-observation-submitted-retry-ia-v1";
const artifactDir = path.join(__dirname, "artifacts", "20260731-u7-submitted-retry-ia-v1");
const url = `${pathToFileURL(path.join(root, "index.html")).href}?v=${cache}`;

const baseStudent = {
  student_id: "guest",
  class_name: "測試",
  seat_no: "00",
  student_name: "老師測試帳號",
  profile_gender: "male",
  current_title_id: "trainee_investigator",
  current_title: "見習調查員",
  title_avatar_path: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  is_guest: true
};

const baseResult = {
  completion_exp: 100,
  concept_exp: 170,
  revision_exp: 87,
  question_exp: 0,
  question_exp_candidate: 40,
  mastery_exp: 40,
  retry_exp: 0,
  retry_exp_candidate: 0,
  attempt_total_exp: 397,
  attempt_total_exp_candidate: 437,
  unit_credited_exp: 397,
  correct: 11,
  total: 14,
  accuracy: 11 / 14,
  hint_used: 3,
  corrected_after_hint: 3,
  reflection_quality: "discussion_question",
  reflection_exp_reason: "後台待重算",
  badges: [
    "cell_observation_entry",
    "slide_preparation_sequencer"
  ]
};

const verifiedBadgeSummary = [
  {
    unit_id: "life_world",
    station_title: "第 1 站｜多彩多姿的生命世界",
    availability_status: "ready",
    total_badges: 9,
    earned_count: 1,
    earned_badges: [{ badge_id: "life_world_entry", badge_name: "生命觀測入門徽章", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }]
  },
  {
    unit_id: "scientific_method",
    station_title: "第 2 站｜探究自然的科學方法",
    availability_status: "ready",
    total_badges: 8,
    earned_count: 2,
    earned_badges: [
      { badge_id: "scientific_method_entry", badge_name: "科學調查入門徽章", badge_image_path: "shared-assets/badges/scientific_method/badge-scientific_method-scientific_method_entry.webp" },
      { badge_id: "variable_identifier", badge_name: "變因辨識徽章", badge_image_path: "shared-assets/badges/scientific_method/badge-scientific_method-variable_identifier.webp" }
    ]
  },
  {
    unit_id: "lab_intro",
    station_title: "第 3 站｜進入實驗室",
    availability_status: "ready",
    total_badges: 8,
    earned_count: 1,
    earned_badges: [{ badge_id: "lab_intro_entry", badge_name: "實驗室安全啟動徽章", badge_image_path: "shared-assets/badges/lab_intro/badge-lab_intro-lab_intro_entry.webp" }]
  },
  {
    unit_id: "microscope_use",
    station_title: "第 4 站｜顯微鏡的使用",
    availability_status: "ready",
    total_badges: 8,
    earned_count: 3,
    earned_badges: [
      { badge_id: "microscope_use_entry", badge_name: "微觀操作入門徽章", badge_image_path: "shared-assets/badges/microscope_use/badge-microscope_use-microscope_use_entry.webp" },
      { badge_id: "microscope_parts_identifier", badge_name: "顯微鏡部位辨識徽章", badge_image_path: "shared-assets/badges/microscope_use/badge-microscope_use-microscope_parts_identifier.webp" },
      { badge_id: "low_to_high_operator", badge_name: "低高倍操作徽章", badge_image_path: "shared-assets/badges/microscope_use/badge-microscope_use-low_to_high_operator.webp" }
    ]
  },
  {
    unit_id: "cell_basic_unit",
    station_title: "第 5 站｜生物體的基本單位",
    availability_status: "ready",
    total_badges: 8,
    earned_count: 1,
    earned_badges: [{ badge_id: "cell_basic_unit_entry", badge_name: "細胞基本單位入門徽章", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_basic_unit_entry.webp" }]
  },
  {
    unit_id: "cell_structure",
    station_title: "第 6 站｜細胞的構造",
    availability_status: "ready",
    total_badges: 9,
    earned_count: 2,
    earned_badges: [
      { badge_id: "cell_structure_entry", badge_name: "細胞構造入門徽章", badge_image_path: "shared-assets/badges/cell_structure/badge-cell_structure-cell_structure_entry.webp" },
      { badge_id: "cell_organelle_identifier", badge_name: "胞器辨識徽章", badge_image_path: "shared-assets/badges/cell_structure/badge-cell_structure-cell_organelle_identifier.webp" }
    ]
  },
  {
    unit_id: "cell_observation",
    station_title: "第 7 站｜細胞的觀察",
    availability_status: "ready",
    total_badges: 10,
    earned_count: 2,
    earned_badges: [
      {
        badge_id: "cell_observation_entry",
        badge_name: "顯微偵查入門徽章",
        badge_image_path: "shared-assets/badges/cell_observation/badge-cell_observation-cell_observation_entry.webp"
      },
      {
        badge_id: "slide_preparation_sequencer",
        badge_name: "玻片流程排序徽章",
        badge_image_path: "shared-assets/badges/cell_observation/badge-cell_observation-slide_preparation_sequencer.webp"
      }
    ]
  }
];

function verifiedProgress(overrides = {}) {
  return {
    source: "server_verified",
    progress_applied: true,
    total_exp: 3200,
    completed_unit_count: 7,
    current_title_id: "life_observer",
    current_title: "生命觀察員",
    title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
    badges: ["cell_observation_entry", "slide_preparation_sequencer"],
    unit_badge_summary_json: JSON.stringify(verifiedBadgeSummary),
    ...overrides
  };
}

function stateFor(screen, overrides = {}) {
  return {
    screen,
    student: baseStudent,
    attempt_type: "first",
    attempt_session_id: "qa_cell_observation_guest",
    remote_completed_attempts: 0,
    remote_previous_attempt_id: "",
    remote_previous_accuracy: null,
    cumulative_badges: [],
    cumulative_total_exp: 0,
    completed_unit_count: 0,
    started_at: "2026-07-15T00:00:00.000Z",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    answers: { q01_sequence: [], q14: {}, reflection: {} },
    hints: {},
    checkedWrong: {},
    interactions: {},
    optionOrders: {},
    activeScope: "onion",
    activeHotspot: "wall",
    result: null,
    submitted_at: null,
    lockNotice: "",
    backend_status: "",
    ...overrides
  };
}

async function openPage(browser, viewport, state, backendResponse = null) {
  const context = await browser.newContext({ viewport });
  const backendActions = [];
  await context.route("https://script.google.com/**", (route) => {
    backendActions.push(new URL(route.request().url()).searchParams.get("action") || "");
    const payload = typeof backendResponse === "function" ? backendResponse(route.request()) : backendResponse;
    return payload
      ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) })
      : route.abort();
  });
  if (state) {
    await context.addInitScript((payload) => {
      localStorage.setItem("bioquest_cell_observation_state_v1", JSON.stringify(payload));
      localStorage.setItem("bioquest_attempts_v1", JSON.stringify([]));
      localStorage.removeItem("bioquest_pending_backend_queue_v1");
    }, state);
  }
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.waitForSelector("#screen[data-bioquest-screen]");
  return { page, context, errors, backendActions };
}

function startAttemptResponse(overrides = {}) {
  return {
    ok: true,
    attempt_id: overrides.attempt_id || `u7-attempt-${Date.now()}`,
    attempt_session_id: overrides.attempt_session_id || `u7-session-${Date.now()}`,
    attempt_session_token: overrides.attempt_session_token || `u7-session-${Date.now()}.token`,
    question_version: "20260716-cell-observation-canonical-v1",
    verification_mode: "server_verified",
    attempt_type: overrides.attempt_type || "first",
    previous_attempt_id: overrides.previous_attempt_id || "",
    expires_at: "2026-07-16T12:00:00.000Z"
  };
}

function backendByAction({ loginResponse, submitResponse, startResponse } = {}) {
  return (request) => {
    const action = new URL(request.url()).searchParams.get("action");
    if (action === "getStudentAndAttemptStatus") return loginResponse;
    if (action === "startAttempt") return startResponse || startAttemptResponse();
    if (action === "hintEvent") return { ok: true, hint_recorded: true };
    if (action === "submitAttempt") return submitResponse || { ok: false, error: "test_submit_missing" };
    return { ok: false, error: `unexpected_action_${action}` };
  };
}

async function assertAchievementOverviewContract(page, { mode, viewport }) {
  const metrics = await page.locator("#screen").evaluate((root) => {
    const titleImages = [...root.querySelectorAll(".bq-title-avatar-card img, .title-avatar-card.achievements img")];
    const overview = root.querySelector("[data-bq-badge-overview]");
    const u7Card = overview?.querySelector("[data-unit-id='cell_observation']");
    const u7Thumbs = [...(u7Card?.querySelectorAll(".bq-unit-badge-thumb") || [])].filter((img) => !img.hidden);
    const historyCounts = {};
    ["life_world", "scientific_method", "lab_intro", "microscope_use", "cell_basic_unit", "cell_structure"].forEach((unitId) => {
      const card = overview?.querySelector(`[data-unit-id='${unitId}']`);
      historyCounts[unitId] = {
        text: card?.querySelector(".bq-unit-badge-summary__head span")?.textContent.trim() || "",
        thumbs: [...(card?.querySelectorAll(".bq-unit-badge-thumb") || [])].filter((img) => !img.hidden).length
      };
    });
    const bridge = window.__BIOQUEST_BADGE_OVERVIEW_STATE__ || {};
    return {
      overviewOnly: root.querySelectorAll("[data-bq-achievements-overview-only='true']").length,
      overviewCount: root.querySelectorAll("[data-bq-badge-overview]").length,
      summaryBoxCount: root.querySelectorAll("[data-bq-badge-overview] .bq-unit-badge-summary").length,
      unitWallCount: root.querySelectorAll("[data-bq-unit-achievements]").length,
      titleImageCount: titleImages.length,
      titleNaturalWidth: titleImages[0]?.naturalWidth || 0,
      u7CountText: u7Card?.querySelector(".bq-unit-badge-summary__head span")?.textContent.trim() || "",
      u7ThumbCount: u7Thumbs.length,
      u7Thumbs: u7Thumbs.map((img) => img.getAttribute("src") || ""),
      historyCounts,
      overviewText: overview?.innerText || "",
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      text: root.innerText,
      bridgeFrozen: Object.isFrozen(bridge),
      bridgeStudentFrozen: Object.isFrozen(bridge.student || {}),
      bridgeProgressFrozen: Object.isFrozen(bridge.progress || {}),
      bridgeHasAnswers: Object.prototype.hasOwnProperty.call(bridge, "answers")
    };
  });
  assert.equal(metrics.overviewOnly, 1, `${mode} achievements must use overview-only contract at ${viewport.width}`);
  assert.equal(metrics.overviewCount, 1, `${mode} achievements should contain exactly one whole-book overview at ${viewport.width}`);
  assert.equal(metrics.summaryBoxCount, 52, `${mode} whole-book overview should keep 52 unit summaries at ${viewport.width}`);
  assert.equal(metrics.unitWallCount, 0, `${mode} achievements must not render the local U7 badge wall at ${viewport.width}`);
  assert.equal(metrics.titleImageCount, 1, `${mode} achievements should render exactly one title avatar at ${viewport.width}`);
  assert.ok(metrics.titleNaturalWidth > 0, `${mode} title avatar should load at ${viewport.width}`);
  assert.ok(metrics.horizontalOverflow <= 1, `${mode} achievements must not overflow horizontally at ${viewport.width}: ${metrics.horizontalOverflow}`);
  assert.equal(metrics.bridgeFrozen, true, `${mode} shared overview bridge must be a frozen read-only snapshot at ${viewport.width}`);
  assert.equal(metrics.bridgeStudentFrozen, true, `${mode} bridge student snapshot must be frozen at ${viewport.width}`);
  assert.equal(metrics.bridgeProgressFrozen, true, `${mode} bridge progress snapshot must be frozen at ${viewport.width}`);
  assert.equal(metrics.bridgeHasAnswers, false, `${mode} bridge must not expose mutable answer state at ${viewport.width}`);
  if (mode === "guest") {
    assert.match(metrics.overviewText, /guest 測試不列入正式累積徽章/);
    assert.equal(metrics.u7CountText, "0/10");
    assert.equal(metrics.u7ThumbCount, 0);
    assert.doesNotMatch(metrics.text, /正式累積 EXP|已完成單元|正式認列/);
  }
  if (mode === "pending") {
    assert.match(metrics.overviewText, /等待後台回傳 unit_badge_summary_json/);
    assert.equal(metrics.u7CountText, "0/10");
    assert.equal(metrics.u7ThumbCount, 0);
    assert.doesNotMatch(metrics.text, /正式累積 EXP|已完成單元|正式認列|StudentProgress/);
  }
  if (mode === "verified") {
    assert.match(metrics.text, /\d+ EXP｜已完成 \d+ 站/);
    assert.match(metrics.text, /距離「.+」還差 \d+ EXP/);
    assert.match(metrics.overviewText, /以下只列入後台 verified 的正式累積徽章/);
    assert.equal(metrics.u7CountText, "2/10");
    assert.equal(metrics.u7ThumbCount, 2);
    assert.ok(metrics.u7Thumbs.every((src) => src.startsWith("../shared-assets/badges/cell_observation/")), `verified U7 thumbs must use normalized shared paths: ${JSON.stringify(metrics.u7Thumbs)}`);
    assert.deepEqual(Object.fromEntries(Object.entries(metrics.historyCounts).map(([unitId, item]) => [unitId, item.text])), {
      life_world: "1/9",
      scientific_method: "2/8",
      lab_intro: "1/8",
      microscope_use: "3/8",
      cell_basic_unit: "1/8",
      cell_structure: "2/9"
    });
    assert.deepEqual(Object.fromEntries(Object.entries(metrics.historyCounts).map(([unitId, item]) => [unitId, item.thumbs])), {
      life_world: 1,
      scientific_method: 2,
      lab_intro: 1,
      microscope_use: 3,
      cell_basic_unit: 1,
      cell_structure: 2
    });
  }
}

async function assertNoLoginLegacy(browser) {
  const { page, context, errors } = await openPage(browser, { width: 1440, height: 900 });
  assert.equal(await page.locator("#screen[data-bioquest-screen='login']").count(), 1);
  assert.equal(await page.locator("#screen .owl-frame, #screen .mentor-card").count(), 0, "login must not render unit owl or mentor card");
  assert.equal(await page.locator(".bq-login-cover img").evaluate((img) => img.naturalWidth > 0), true, "login cover should load");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "desktop-login.png") });
  await context.close();
}

async function assertMobileBrief(browser) {
  const { page, context, errors } = await openPage(browser, { width: 390, height: 844 }, stateFor("brief"));
  await page.waitForSelector(".brief-scene .bq-brief-student-avatar");
  const metrics = await page.locator(".brief-scene").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const image = node.querySelector(".bq-brief-scene-media img, .brief-scene-media img, picture img");
    const imageRect = image.getBoundingClientRect();
    const copy = node.querySelector(".scene-copy, .bq-brief-scene-caption") || document.querySelector(".scene-copy, .bq-brief-scene-caption");
    const copyRect = copy.getBoundingClientRect();
    const avatar = node.querySelector(".bq-brief-student-avatar");
    const avatarRect = avatar.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      imageWidth: imageRect.width,
      imageHeight: imageRect.height,
      imageNaturalWidth: image.naturalWidth,
      avatarHeight: avatarRect.height,
      avatarTop: avatarRect.top - rect.top,
      avatarBottom: avatarRect.bottom - rect.top,
      copyTop: copyRect.top - rect.top,
      avatarNaturalWidth: avatar.naturalWidth
    };
  });
  assert.ok(metrics.imageNaturalWidth > 0, "briefing scene image should load as a real image");
  assert.ok(metrics.avatarNaturalWidth > 0, "title avatar fallback should load");
  assert.ok(Math.abs(metrics.imageHeight / metrics.imageWidth - 9 / 16) < 0.03, `brief image should stay near 16:9: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarHeight > metrics.imageHeight * 0.6, `visible title avatar should stay prominent in the scene: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.avatarTop >= -1 && metrics.avatarBottom <= metrics.imageHeight + 1, `title avatar should stay inside the 16:9 scene: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.copyTop >= metrics.imageHeight - 1, `brief copy should sit below the full scene image area: ${JSON.stringify(metrics)}`);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "mobile-brief.png") });
  await context.close();
}

async function assertLoginIdentity(browser, viewport) {
  const backendResponse = {
    ok: true,
    student: {
      student_id: "S70707",
      student_name: "顯微觀察學生",
      class_name: "七年七班",
      seat_no: "07",
      profile_gender: "female"
    },
    progress: {
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-female.webp",
      total_exp: 760,
      completed_unit_count: 1,
      badges: []
    },
    attempt_status: { completed_attempt_count: 0 }
  };
  const { page, context, errors } = await openPage(browser, viewport, null, backendByAction({
    loginResponse: backendResponse,
    startResponse: startAttemptResponse({ attempt_id: "login-identity-attempt", attempt_session_id: "login-identity-session", attempt_session_token: "login-identity-session.token" })
  }));
  await page.locator("#studentIdInput").fill("S70707");
  await page.locator("#loginButton").click();
  await page.waitForSelector("#screen[data-bioquest-screen='brief'] .bq-brief-student-avatar");
  const identity = await page.locator(".brief-scene").evaluate((scene) => {
    const avatar = scene.querySelector(".bq-brief-student-avatar");
    const card = scene.querySelector("[data-student-title-card]");
    const rect = avatar.getBoundingClientRect();
    return {
      text: card.textContent,
      imageSrc: avatar.getAttribute("src"),
      naturalWidth: avatar.naturalWidth,
      insideViewport: rect.left >= 0 && rect.right <= innerWidth
    };
  });
  assert.match(identity.text, /顯微觀察學生/);
  assert.match(identity.text, /目前稱號：生命觀察員/);
  assert.match(identity.imageSrc, /\.\.\/shared-assets\/title-avatars\/title-02-life_observer-female\.webp$/);
  assert.ok(identity.naturalWidth > 0, "backend title avatar should load");
  assert.equal(identity.insideViewport, true, "identity card must fit viewport");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, `${viewport.width}-login-identity.png`) });
  await context.close();
}

async function assertPrepareOwl(browser, viewport) {
  const { page, context, errors } = await openPage(browser, viewport, stateFor("scan"));
  const metrics = await page.locator("#screen .panel").evaluate((panel) => {
    const heading = panel.querySelector("h2");
    const reminder = panel.querySelector(".prep-owl-reminder");
    const visibleOwls = [...panel.querySelectorAll(".owl-frame")].filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const image = reminder?.querySelector("img");
    return {
      immediateAfterHeading: heading?.nextElementSibling === reminder,
      visibleOwlCount: visibleOwls.length,
      naturalWidth: image?.naturalWidth || 0,
      overflow: document.documentElement.scrollWidth - innerWidth
    };
  });
  assert.equal(metrics.immediateAfterHeading, true, "prepare owl must immediately follow the heading");
  assert.equal(metrics.visibleOwlCount, 1, "prepare must show exactly one unit owl");
  assert.ok(metrics.naturalWidth > 0, "prepare owl should load");
  assert.ok(metrics.overflow <= 1, `prepare must not overflow horizontally: ${metrics.overflow}`);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, `${viewport.width}-prepare-owl.png`) });
  await context.close();
}

async function assertReflectionReportOwl(browser, viewport) {
  const { page, context, errors } = await openPage(browser, viewport, stateFor("reflection"));
  const metrics = await page.locator("#screen").evaluate((root) => {
    const assistants = [...root.querySelectorAll(".bq-report-assistant")].filter((node) => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    const legacyOwls = [...root.querySelectorAll(".owl-frame, .owl-reminder-card")].filter((node) => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    const image = assistants[0]?.querySelector("img");
    return {
      assistantCount: assistants.length,
      legacyOwlCount: legacyOwls.length,
      imageSrc: image?.getAttribute("src") || "",
      naturalWidth: image?.naturalWidth || 0,
      missionLayoutCount: root.querySelectorAll(".mission-layout").length
    };
  });
  assert.equal(metrics.assistantCount, 1, `reflection must render exactly one shared report owl at ${viewport.width}`);
  assert.equal(metrics.legacyOwlCount, 0, `reflection must not keep legacy local owl at ${viewport.width}`);
  assert.equal(metrics.missionLayoutCount, 0, "reflection should not use old two-column local owl layout");
  assert.match(metrics.imageSrc, /shared-assets\/characters\/owl-bioquest-report-reminder\.webp/);
  assert.ok(metrics.naturalWidth > 0, "shared report owl image should load");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, `${viewport.width}-reflection-report-owl.png`) });
  await context.close();
}

async function assertUnlabeledImageChoices(browser) {
  const { page, context, errors } = await openPage(browser, { width: 390, height: 844 }, stateFor("checkpoint2"));
  const screenText = await page.locator("#screen").innerText();
  assert.equal(await page.locator(".image-target").count(), 0, "checkpoint2 should not render legacy A/B/C/D image target overlays");
  assert.doesNotMatch(screenText, /圖 [A-F]|A-D/, "checkpoint2 text should not refer to image letter markers");
  const imageMeta = await page.locator(".question-visual img").evaluateAll((images) => images.map((img) => ({
    alt: img.getAttribute("alt") || "",
    naturalWidth: img.naturalWidth
  })));
  assert.ok(imageMeta.length >= 6, "checkpoint2 should render one unlabeled image per question");
  imageMeta.forEach((meta) => {
    assert.ok(meta.naturalWidth > 0, `question image should load: ${meta.alt}`);
    assert.doesNotMatch(meta.alt, /圖 [A-F]|A-D/, `image alt must not use letter markers: ${meta.alt}`);
    assert.match(meta.alt, /未標註/, `image alt should describe an unlabeled observation: ${meta.alt}`);
  });

  await page.locator("[data-question-id='q06'] [data-choice='q06'][data-value='nucleus']").click();
  await page.waitForSelector("[data-question-id='q06'] .feedback.warn");
  assert.match(await page.locator("[data-question-id='q06']").innerText(), /先找讓細胞呈現整齊邊界的線索/);
  await page.locator("[data-question-id='q06'] [data-choice='q06'][data-value='wall']").click();
  assert.match(await page.locator("[data-question-id='q06'] .selected-answer").innerText(), /已選：細胞間清楚的格狀外框/);

  await page.locator("[data-question-id='q09'] [data-choice='q09'][data-value='grid']").click();
  await page.waitForSelector("[data-question-id='q09'] .feedback.warn");
  assert.match(await page.locator("[data-question-id='q09']").innerText(), /先比較一般表皮細胞與成對特殊細胞/);
  await page.locator("[data-question-id='q09'] [data-choice='q09'][data-value='stoma']").click();
  assert.match(await page.locator("[data-question-id='q09'] .selected-answer").innerText(), /已選：兩個保衛細胞之間的開口/);

  await page.locator("#checkSection").click();
  assert.match(await page.locator("#sectionMessage").innerText(), /請先完成本區/);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "mobile-checkpoint2-unlabeled-images.png") });
  await context.close();
}

async function assertCellClassificationCopy(browser) {
  const { page, context, errors } = await openPage(browser, { width: 1440, height: 900 }, stateFor("checkpoint3"));
  const question = page.locator(".question-card").last();
  const text = await question.innerText();
  assert.match(text, /哪些較支持植物細胞？哪些較支持動物細胞？/);
  assert.doesNotMatch(text, /植物細胞視野|動物細胞視野/);
  const values = await question.locator("select option").evaluateAll((options) => options.map((option) => option.value));
  assert.deepEqual(values, ["", "plant", "animal", "", "plant", "animal", "", "plant", "animal", "", "plant", "animal"]);
  assert.deepEqual(await page.evaluate(() => window.__cellObservationTest.answerKey().classify), {
    grid_wall: "plant",
    irregular_no_wall: "animal",
    guard_stoma: "plant",
    mouth_sample: "animal"
  });
  assert.deepEqual(errors, []);
  await context.close();
}

async function assertMobileAchievements(browser) {
  const guestState = stateFor("achievements", {
    submitted_at: "2026-07-15T01:00:00.000Z",
    backend_status: "pending_local",
    result: baseResult
  });
  const { page, context, errors } = await openPage(browser, { width: 390, height: 844 }, guestState);
  const text = await page.locator("#screen").innerText();
  assert.match(text, /重新登入後開始新的挑戰/);
  assert.doesNotMatch(text, /正式累積 EXP/);
  assert.doesNotMatch(text, /已完成單元/);
  assert.equal(await page.locator("[data-bq-unit-achievements]").count(), 0, "achievements must not render a unit badge wall");
  assert.equal(await page.locator(".panel .badge-card").count(), 0, "overview-only achievements should not render local badge cards");
  await assertAchievementOverviewContract(page, { mode: "guest", viewport: { width: 390, height: 844 } });
  const sidePosition = await page.locator(".side-panel").evaluate((node) => getComputedStyle(node).position);
  assert.equal(sidePosition, "static", "mobile side panel should not sticky-cover long achievements pages");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const overlap = await page.evaluate(() => {
    const side = document.querySelector(".side-panel").getBoundingClientRect();
    const cards = [...document.querySelectorAll(".badge-card")].map((card) => card.getBoundingClientRect());
    return cards.some((card) => card.bottom > 0 && card.top < innerHeight && Math.max(0, Math.min(side.bottom, card.bottom) - Math.max(side.top, card.top)) > 2);
  });
  assert.equal(overlap, false, "mobile navigation must not overlap visible badge cards");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "mobile-achievements-pending.png") });
  await context.close();
}

async function assertPendingAchievementsCopy(browser) {
  const pendingState = stateFor("achievements", {
    student: { ...baseStudent, student_id: "S79999", student_name: "測試學生", is_guest: false },
    submitted_at: "2026-07-15T01:00:00.000Z",
    backend_status: "pending_progress",
    result: baseResult
  });
  const { page, context, errors } = await openPage(browser, { width: 1440, height: 900 }, pendingState);
  const text = await page.locator("#screen").innerText();
  assert.match(text, /重新登入後開始新的挑戰/);
  assert.doesNotMatch(text, /正式累積 EXP/);
  assert.doesNotMatch(text, /已完成單元/);
  assert.doesNotMatch(text, /StudentProgress/);
  assert.equal(await page.locator("[data-bq-unit-achievements]").count(), 0, "pending achievements must not render local unit wall");
  await assertAchievementOverviewContract(page, { mode: "pending", viewport: { width: 1440, height: 900 } });
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "desktop-achievements-pending.png") });
  await context.close();
}

async function assertGuestResultCopy(browser) {
  const guestState = stateFor("result", {
    submitted_at: "2026-07-15T01:00:00.000Z",
    backend_status: "pending_local",
    result: baseResult
  });
  const { page, context, errors } = await openPage(browser, { width: 390, height: 844 }, guestState);
  const text = await page.locator("#screen").innerText();
  assert.match(text, /guest 測試：本次預估 437\/500 EXP，不列入正式累積/);
  assert.match(text, /本次預估狀態/);
  assert.doesNotMatch(text, /正式認列/);
  assert.doesNotMatch(text, /已完成單元/);
  assert.doesNotMatch(text, /StudentProgress/);
  assert.equal(await page.locator(".result-badges [data-earned-only='true']").count(), 1, "guest result must expose earned-only badge block");
  assert.equal(await page.locator(".result-badges .badge-card").count(), 2, "guest result must show only current earned badges");
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "mobile-result-guest.png") });
  await context.close();
}

async function assertVerifiedResultAndAchievements(browser) {
  const verifiedStudent = { ...baseStudent, student_id: "S79998", student_name: "正式學生", is_guest: false };
  const verifiedResult = {
    ...baseResult,
    concept_exp: 220,
    revision_exp: 0,
    question_exp: 40,
    mastery_exp: 140,
    attempt_total_exp: 500,
    attempt_total_exp_candidate: 500,
    unit_credited_exp: 500,
    correct: 14,
    accuracy: 1,
    hint_used: 0,
    corrected_after_hint: 0,
    badges: [
      "cell_observation_entry",
      "slide_preparation_sequencer",
      "cell_observation_reflection_reporter"
    ]
  };
  const verifiedBase = {
    student: { ...verifiedStudent, progress: verifiedProgress() },
    submitted_at: "2026-07-15T02:00:00.000Z",
    backend_status: "submitted",
    result: verifiedResult,
    cumulative_badges: ["cell_observation_entry", "slide_preparation_sequencer"],
    cumulative_total_exp: 3200,
    completed_unit_count: 7
  };
  const resultPage = await openPage(browser, { width: 1440, height: 900 }, stateFor("result", verifiedBase));
  const resultText = await resultPage.page.locator("#screen").innerText();
  assert.match(resultText, /本單元正式認列/);
  assert.match(resultText, /本次與正式累積差異/);
  assert.match(resultText, /500 EXP/);
  assert.equal(await resultPage.page.locator(".result-badges [data-earned-only='true']").count(), 1, "verified result must expose earned-only badge block");
  assert.equal(await resultPage.page.locator(".result-badges .badge-card").count(), 3, "verified result must show only current earned badges");
  assert.deepEqual(resultPage.errors, []);
  await resultPage.page.screenshot({ path: path.join(artifactDir, "desktop-result-verified.png") });
  await resultPage.context.close();

  const achievementsPage = await openPage(browser, { width: 1440, height: 900 }, stateFor("achievements", verifiedBase));
  const achievementsText = await achievementsPage.page.locator("#screen").innerText();
  assert.match(achievementsText, /3200 EXP｜已完成 7 站/);
  assert.match(achievementsText, /距離「微觀探索者」還差 2000 EXP/);
  assert.doesNotMatch(achievementsText, /本次預估 .*待後台確認/);
  assert.equal(await achievementsPage.page.locator("[data-bq-unit-achievements]").count(), 0, "verified achievements must not render local unit wall");
  await assertAchievementOverviewContract(achievementsPage.page, { mode: "verified", viewport: { width: 1440, height: 900 } });
  assert.deepEqual(achievementsPage.errors, []);
  await achievementsPage.page.screenshot({ path: path.join(artifactDir, "desktop-achievements-verified.png") });
  await achievementsPage.context.close();
}

async function expScenario(page, { reflection, hints = {}, attemptType = "first", previousAccuracy = null, wrongId = "" }) {
  return page.evaluate(({ reflection, hints, attemptType, previousAccuracy, wrongId }) => {
    const api = window.__cellObservationTest;
    const key = api.answerKey();
    const answers = {
      q01_sequence: key.sequence,
      q14: key.classify,
      reflection,
      ...key.choices
    };
    if (wrongId) answers[wrongId] = "__answered_but_wrong__";
    api.setState({
      screen: "review",
      student: {
        student_id: "S70770",
        student_name: "EXP 測試學生",
        class_name: "七年七班",
        seat_no: "70",
        profile_gender: "male",
        is_guest: false
      },
      attempt_type: attemptType,
      remote_previous_accuracy: previousAccuracy,
      completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
      answers,
      interactions: { q01: true, q14: true },
      hints,
      checkedWrong: {},
      optionOrders: {},
      cumulative_badges: [],
      cumulative_total_exp: 0,
      completed_unit_count: 0,
      result: null,
      submitted_at: null,
      backend_status: ""
    });
    const result = api.calculateResult();
    return {
      result,
      candidate: api.displayExpLedger(result, "guest"),
      official: api.displayExpLedger(result, "verified")
    };
  }, { reflection, hints, attemptType, previousAccuracy, wrongId });
}

function ledgerSum(ledger) {
  return ledger.completion_exp + ledger.concept_exp + ledger.revision_exp + ledger.question_exp + ledger.mastery_exp + ledger.retry_exp;
}

async function assertExpContracts(browser) {
  const { page, context, errors } = await openPage(browser, { width: 1440, height: 900 });
  const strongReflection = {
    confident_concept: "我能依外框與排列比較細胞",
    uncertain_concept: "染色後的判讀",
    student_question: "為什麼洋蔥表皮染色後細胞核會比未染色更容易判斷？",
    confidence_score: 4
  };
  const zeroHint = await expScenario(page, { reflection: strongReflection });
  const blank = await expScenario(page, { reflection: { confident_concept: "", uncertain_concept: "", student_question: "", confidence_score: 3 } });
  const corrected = await expScenario(page, { reflection: strongReflection, hints: { q02: true } });
  const retry = await expScenario(page, {
    reflection: strongReflection,
    hints: { q02: true },
    attemptType: "retry",
    previousAccuracy: 0.75,
    wrongId: "q02"
  });

  assert.equal(zeroHint.candidate.attempt_total_exp, 500, "zero-hint perfect with a qualified report is the top path");
  assert.equal(zeroHint.official.attempt_total_exp, 460, "unverified report candidate must not impersonate official EXP");
  assert.equal(blank.candidate.question_exp, 0, "blank report must earn no report EXP");
  assert.equal(blank.candidate.attempt_total_exp, 460, "blank report must not receive the report pool");
  assert.ok(corrected.candidate.attempt_total_exp < zeroHint.candidate.attempt_total_exp, "hint-corrected path must stay below zero-hint perfect");
  assert.ok(corrected.candidate.revision_exp > 0, "hint-corrected answers must use revision EXP");
  assert.ok(retry.candidate.retry_exp > 0 && retry.candidate.retry_exp <= 60, "eligible retry improvement must receive bounded retry EXP");
  assert.ok(retry.candidate.attempt_total_exp < zeroHint.candidate.attempt_total_exp, "retry must not overtake zero-hint perfect");
  [zeroHint, blank, corrected, retry].forEach((scenario) => {
    assert.equal(ledgerSum(scenario.candidate), scenario.candidate.attempt_total_exp, "candidate EXP details must sum to the displayed total");
    assert.equal(ledgerSum(scenario.official), scenario.official.attempt_total_exp, "official EXP details must sum to the displayed total");
    assert.ok(scenario.candidate.attempt_total_exp <= 500, "candidate EXP must respect the unit cap");
  });

  const promoted = await page.evaluate((result) => window.__cellObservationTest.displayExpLedger({
    ...result,
    question_exp: result.question_exp_candidate,
    retry_exp: result.retry_exp_candidate
  }, "verified"), zeroHint.result);
  assert.equal(promoted.attempt_total_exp, 500, "verified backend report EXP should complete the formal 500 EXP ledger");
  assert.equal(ledgerSum(promoted), promoted.attempt_total_exp);
  assert.deepEqual(errors, []);
  await context.close();
}

async function assertActualFlow(browser, viewport, mode) {
  const loginResponse = {
    ok: true,
    student: {
      student_id: "S70777",
      student_name: "流程測試學生",
      class_name: "七年七班",
      seat_no: "77",
      profile_gender: "male"
    },
    progress: {
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
      total_exp: 900,
      completed_unit_count: 1,
      badges: []
    },
    attempt_status: { completed_attempt_count: mode === "retry" ? 1 : 0, previous_accuracy: mode === "retry" ? 0.75 : null }
  };
  const verifiedSubmit = {
    ok: true,
    attempt_id: "verified_u7_flow",
    verified_attempt: {
      question_exp: 40,
      retry_exp: 0,
      attempt_total_exp: 500,
      unit_credited_exp: 500,
      credited_delta: 500
    },
    student_progress: {
      ...verifiedProgress({
        total_exp: 1400,
        completed_unit_count: 2,
        badges: ["cell_observation_entry", "slide_preparation_sequencer"]
      }),
      current_title_id: "life_observer",
      current_title: "生命觀察員",
      title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp",
    }
  };
  const backend = mode === "guest"
    ? () => ({ ok: false, error: "guest_local_mode" })
    : backendByAction({
      loginResponse,
      startResponse: startAttemptResponse({ attempt_id: `${mode}-u7-flow-attempt`, attempt_session_id: `${mode}-u7-flow-session`, attempt_session_token: `${mode}-u7-flow-session.token` }),
      submitResponse: mode === "verified" ? verifiedSubmit : { ok: false, error: "pending_test_mode" }
    });
  const { page, context, errors, backendActions } = await openPage(browser, viewport, null, backend);
  const visited = ["login"];
  const assertScreen = async (name) => {
    await page.waitForSelector(`#screen[data-bioquest-screen='${name}']`);
    visited.push(name);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `${mode} ${name} must not overflow at ${viewport.width}: ${overflow}`);
  };

  if (mode === "guest") {
    await page.locator("#guestButton").click();
  } else {
    await page.locator("#studentIdInput").fill("S70777");
    await page.locator("#loginButton").click();
  }
  await assertScreen("brief");
  await page.locator("#briefNext").click();
  await assertScreen("scan");
  await page.locator("#scanNext").click();
  await assertScreen("checkpoint1");

  await page.evaluate(() => {
    const api = window.__cellObservationTest;
    const next = api.getState();
    next.answers.q01_sequence = api.answerKey().sequence;
    next.interactions.q01 = true;
    api.setState(next);
  });
  for (const qid of ["q02", "q03", "q04"]) {
    const answer = await page.evaluate((id) => window.__cellObservationTest.answerKey().choices[id], qid);
    await page.locator(`[data-choice='${qid}'][data-value='${answer}']`).click();
  }
  await page.locator("#checkSection").click();
  await assertScreen("checkpoint2");

  for (const qid of ["q05", "q06", "q07", "q08", "q09", "q10"]) {
    const answer = await page.evaluate((id) => window.__cellObservationTest.answerKey().choices[id], qid);
    await page.locator(`[data-choice='${qid}'][data-value='${answer}']`).click();
  }
  await page.locator("#checkSection").click();
  await assertScreen("checkpoint3");

  for (const qid of ["q11", "q12", "q13"]) {
    const answer = await page.evaluate((id) => window.__cellObservationTest.answerKey().choices[id], qid);
    await page.locator(`[data-choice='${qid}'][data-value='${answer}']`).click();
  }
  const classify = await page.evaluate(() => window.__cellObservationTest.answerKey().classify);
  for (const [id, answer] of Object.entries(classify)) await page.locator(`[data-classify='${id}']`).selectOption(answer);
  await page.locator("#checkSection").click();
  await assertScreen("review");
  await page.waitForFunction(() => {
    const img = document.querySelector("#screen .bq-feedback-mentor img");
    return img && img.complete && img.naturalWidth > 0;
  });
  const reviewRole = await page.locator("#screen").evaluate((root) => {
    const mentors = [...root.querySelectorAll(".bq-feedback-mentor img")].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return {
      count: mentors.length,
      naturalWidth: mentors[0]?.naturalWidth || 0,
      src: mentors[0]?.getAttribute("src") || ""
    };
  });
  assert.equal(reviewRole.count, 1, `${mode} review must show exactly one shared mentor at ${viewport.width}`);
  assert.ok(reviewRole.naturalWidth > 0, `${mode} review mentor image should load at ${viewport.width}`);
  assert.match(reviewRole.src, /shared-assets\/mentor-feedback\/mentor-feedback-/);
  await page.locator("#reviewNext").click();
  await assertScreen("reflection");
  await page.waitForFunction(() => {
    const img = document.querySelector("#screen .bq-report-assistant img");
    return img && img.complete && img.naturalWidth > 0;
  });
  const reportRole = await page.locator("#screen").evaluate((root) => {
    const owls = [...root.querySelectorAll(".bq-report-assistant img")].filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return {
      count: owls.length,
      naturalWidth: owls[0]?.naturalWidth || 0,
      src: owls[0]?.getAttribute("src") || ""
    };
  });
  assert.equal(reportRole.count, 1, `${mode} reflection must show exactly one shared report owl at ${viewport.width}`);
  assert.ok(reportRole.naturalWidth > 0, `${mode} report owl image should load at ${viewport.width}`);
  assert.match(reportRole.src, /shared-assets\/characters\/owl-bioquest-report-reminder\.webp/);

  await page.locator("#confidentConcept").fill("我能依外框與排列比較細胞");
  await page.locator("#uncertainConcept").fill("我還不確定染色後的判讀");
  await page.locator("#studentQuestion").fill("為什麼洋蔥表皮染色後細胞核會比未染色更容易判斷？");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#submitMission").click();
  await assertScreen("result");
  const resultText = await page.locator("#screen").innerText();
  if (mode === "guest") assert.match(resultText, /guest 測試：本次預估 500\/500 EXP，不列入正式累積/);
  if (mode === "pending") assert.match(resultText, /本次預估 500\/500 EXP，待後台確認/);
  if (mode === "verified") assert.match(resultText, /後台已回傳正式認列資料/);
  assert.equal(await page.locator(".result-badges [data-earned-only='true']").count(), 1, `${mode} result must expose earned-only badge block at ${viewport.width}`);
  assert.ok(await page.locator(".result-badges .badge-card").count() > 0, `${mode} result must show current earned badges at ${viewport.width}`);
  const detail = await page.locator("[data-exp-ledger-total]").innerText();
  assert.match(detail, /完成 100/);
  assert.match(detail, /回報 40/);
  await page.locator("#resultAchievements").click();
  await assertScreen("achievements");
  assert.equal(await page.locator("[data-bq-unit-achievements]").count(), 0, `${mode} achievements must not render local badge wall at ${viewport.width}`);
  await assertAchievementOverviewContract(page, { mode, viewport });
  if (mode === "guest") {
    assert.deepEqual(backendActions, [], `guest must not call formal backend actions at ${viewport.width}`);
  } else {
    assert.ok(backendActions.includes("getStudentAndAttemptStatus"), `${mode} should fetch student status`);
    assert.ok(backendActions.includes("startAttempt"), `${mode} should start a server session`);
    assert.ok(backendActions.includes("submitAttempt"), `${mode} should submit formally`);
    assert.equal(backendActions.includes("hintEvent"), false, `${mode} all-correct flow should not record hint events`);
  }
  assert.deepEqual(visited, ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements"]);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, `${viewport.width}-actual-flow-${mode}.png`), fullPage: true });
  await context.close();
}

function assertReferencedAssetsExist() {
  const files = ["app.js", "styles.css", "index.html"].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  const refs = [...files.matchAll(/["'`](\.\.\/[^"'`]+\.(?:webp|png)|assets\/[^"'`]+\.(?:webp|png))/g)]
    .map((match) => match[1])
    .filter((ref) => !ref.includes("${"));
  const missing = refs.filter((ref) => !fs.existsSync(path.resolve(root, ref)));
  assert.deepEqual(missing, [], `referenced U7 assets must exist: ${missing.join(", ")}`);
  const legacyPng = refs.filter((ref) =>
    ref.endsWith(".png")
    && (ref.includes("cell-observation") || ref.includes("cell_observation") || ref.includes("owl-basic-unit-result"))
  );
  assert.deepEqual(legacyPng, [], `U7 publish-facing primary refs should use webp: ${legacyPng.join(", ")}`);
}

async function assertResultLockText(browser) {
  const state = stateFor("result", {
    student: { ...baseStudent, student_id: "S79999", student_name: "測試學生", is_guest: false },
    submitted_at: "2026-07-15T01:00:00.000Z",
    backend_status: "pending_progress",
    result: baseResult
  });
  const { page, context, errors } = await openPage(browser, { width: 1440, height: 900 }, state);
  const text = await page.locator("#screen").innerText();
  assert.match(text, /本次預估 437\/500 EXP，待後台確認/);
  assert.match(text, /本次預估狀態/);
  assert.doesNotMatch(text, /本單元待同步認列/);
  assert.doesNotMatch(text, /本單元認列會保留最高表現/);
  assert.doesNotMatch(text, /正式累積/);
  assert.doesNotMatch(text, /正式認列/);
  assert.doesNotMatch(text, /已完成單元/);
  assert.doesNotMatch(text, /StudentProgress/);
  assert.equal(await page.locator(".result-badges .badge-card").count(), 2, "pending result must show only current earned badges");
  await page.locator("[data-nav='checkpoint1']").click();
  await page.waitForSelector("#screen[data-bioquest-screen='result']");
  assert.match(await page.locator("#screen").innerText(), /作答結果已鎖定/);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(artifactDir, "desktop-result-lock.png") });
  await context.close();
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    await assertNoLoginLegacy(browser);
    await assertLoginIdentity(browser, { width: 1440, height: 900 });
    await assertLoginIdentity(browser, { width: 390, height: 844 });
    await assertMobileBrief(browser);
    await assertPrepareOwl(browser, { width: 1440, height: 900 });
    await assertPrepareOwl(browser, { width: 390, height: 844 });
    await assertReflectionReportOwl(browser, { width: 1440, height: 900 });
    await assertReflectionReportOwl(browser, { width: 390, height: 844 });
    await assertUnlabeledImageChoices(browser);
    await assertCellClassificationCopy(browser);
    await assertMobileAchievements(browser);
    await assertPendingAchievementsCopy(browser);
    await assertGuestResultCopy(browser);
    await assertVerifiedResultAndAchievements(browser);
    await assertExpContracts(browser);
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      for (const mode of ["guest", "pending", "verified"]) await assertActualFlow(browser, viewport, mode);
    }
    await assertResultLockText(browser);
    assertReferencedAssetsExist();
  } finally {
    await browser.close();
  }
  console.log(`cell_observation layout regression passed; artifacts: ${artifactDir}`);
})();
