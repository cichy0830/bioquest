const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.env.BQ_TEST_ROOT ? path.resolve(process.env.BQ_TEST_ROOT) : path.resolve(__dirname, "..");
const url = `${pathToFileURL(path.join(root, "index.html")).href}?v=20260731-cell-structure-submitted-retry-ia-v1`;
const QUESTION_VERSION = "20260720-cell-structure-canonical-v1";

function progressFor(mode) {
  if (mode === "guest") return {};
  return {
    source: mode === "verified" ? "server_verified" : "pending_backend",
    total_exp: mode === "verified" ? 2880 : 2380,
    completed_unit_count: mode === "verified" ? 6 : 5,
    current_title_id: "concept_solver",
    current_title: "概念解謎者",
    title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-female.webp",
    unit_badge_summary_json: mode === "verified" ? JSON.stringify([
      { sequence: 1, unit_id: "life_world", earned_count: 2, catalog_count: 9, earned_badges: [{ badge_id: "life_world_entry", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }] },
      { sequence: 6, unit_id: "cell_structure", earned_count: 2, catalog_count: 9, earned_badges: [
        { badge_id: "cell_structure_entry", badge_image_path: "shared-assets/badges/cell_structure/badge-cell_structure-cell_structure_entry.webp" },
        { badge_id: "cell_structure_flawless", badge_image_path: "shared-assets/badges/cell_structure/badge-cell_structure-cell_structure_flawless.webp" }
      ] }
    ]) : "[]"
  };
}

function studentFor(mode) {
  return mode === "guest"
    ? {
      student_id: "guest",
      student_name: "老師測試帳號",
      class_name: "測試",
      seat_no: "00",
      profile_gender: "male",
      is_guest: true,
      progress: { total_exp: 0, completed_unit_count: 0, current_title_id: "trainee_investigator", current_title: "見習調查員", unit_badge_summary_json: "[]" }
    }
    : {
      student_id: "S70102",
      student_name: "測試學生",
      class_name: "701",
      seat_no: "02",
      profile_gender: "female",
      is_guest: false,
      progress: progressFor(mode)
    };
}

function resultFor(mode) {
  const verification = mode === "guest" ? "local_guest" : mode === "verified" ? "server_verified" : "pending_backend";
  return {
    verification_status: verification,
    completion_exp: 100,
    concept_exp: 220,
    revision_exp: 0,
    question_exp: 40,
    mastery_exp: 140,
    retry_exp: 0,
    attempt_total_exp: 500,
    unit_credited_exp: verification === "server_verified" ? 500 : 0,
    credited_delta: verification === "server_verified" ? 500 : 0,
    total: 13,
    correct: 13,
    correct_without_hint: 13,
    corrected_after_hint: 0,
    no_hint_perfect: true,
    perfect: true,
    retry_improved: false,
    badges: mode === "verified" ? ["cell_structure_entry", "cell_structure_flawless"] : ["cell_structure_entry"],
    reflection_exp_reason: "回報內容能連結細胞構造、功能與動植物細胞差異。",
    section_stats: [
      { title: "細胞構造辨識", correct: 4, total: 4, correct_without_hint: 4, corrected_after_hint: 0, exp: 160 },
      { title: "功能配對", correct: 4, total: 4, correct_without_hint: 4, corrected_after_hint: 0, exp: 120 },
      { title: "動植物比較", correct: 3, total: 3, correct_without_hint: 3, corrected_after_hint: 0, exp: 110 },
      { title: "迷思修正", correct: 2, total: 2, correct_without_hint: 2, corrected_after_hint: 0, exp: 110 }
    ]
  };
}

function submittedState(mode) {
  return {
    screen: "result",
    student: studentFor(mode),
    attempt_type: mode === "guest" ? "first" : "retry",
    remote_completed_attempts: mode === "guest" ? 0 : 5,
    attempt_id: `u6_${mode}_submitted_attempt`,
    attempt_session_id: `u6_${mode}_submitted_session`,
    attempt_session_token: `u6_${mode}_submitted_token`,
    previous_attempt_id: `u6_${mode}_previous_attempt`,
    question_version: QUESTION_VERSION,
    verification_mode: mode === "guest" ? "local_guest" : mode === "verified" ? "server_verified" : "pending_backend",
    started_at: "2026-07-31T00:00:00.000Z",
    completedScreens: ["login", "brief", "rules", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result", "achievements"],
    result: resultFor(mode),
    submitted_at: "2026-07-31T00:20:00.000Z",
    lockNotice: "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。"
  };
}

async function installBackend(page, mode) {
  await page.addInitScript(({ mode, questionVersion }) => {
    window.__u6RetryActions = [];
    const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    function payloadFrom(options) {
      const body = options?.body;
      if (!body || typeof body.get !== "function") return {};
      try {
        return JSON.parse(body.get("payload") || "{}");
      } catch {
        return {};
      }
    }
    window.fetch = async (rawUrl, options = {}) => {
      const action = new URL(String(rawUrl), window.location.href).searchParams.get("action") || "unknown";
      const payload = payloadFrom(options);
      window.__u6RetryActions.push({ action, payload });
      if (action === "getStudentAndAttemptStatus") {
        return response({
          ok: true,
          student: { student_id: "S70102", student_name: "測試學生", class_name: "701", seat_no: "02", profile_gender: "female" },
          progress: {
            ...({ verified: { total_exp: 2880, completed_unit_count: 6 }, pending: { total_exp: 2380, completed_unit_count: 5 } }[mode] || {}),
            current_title_id: "concept_solver",
            current_title: "概念解謎者",
            title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-female.webp",
            unit_badge_summary_json: JSON.stringify([{ sequence: 6, unit_id: "cell_structure", earned_count: mode === "verified" ? 2 : 0, catalog_count: 9, earned_badges: [] }])
          },
          completed_attempts: mode === "verified" ? 6 : 5,
          attempt_type: "retry"
        });
      }
      if (action === "startAttempt") {
        return response({
          ok: true,
          verification_mode: "server_verified",
          attempt_type: "retry",
          attempt_id: `u6_${mode}_new_attempt`,
          attempt_session_id: `u6_${mode}_new_session`,
          attempt_session_token: `u6_${mode}_new_token`,
          previous_attempt_id: `u6_${mode}_submitted_attempt`,
          question_version: questionVersion,
          issued_at: "2026-07-31T00:30:00.000Z"
        });
      }
      return response({ ok: false, error: `unexpected_${action}` }, 500);
    };
  }, { mode, questionVersion: QUESTION_VERSION });
}

async function waitForPaint(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function inspect(page) {
  await waitForPaint(page);
  return page.evaluate(() => {
    const titleCards = [...document.querySelectorAll(".bq-title-avatar-card, .title-avatar-card.achievements")].filter((node) => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    return {
      screen: document.querySelector("#screen")?.dataset.bioquestScreen || "",
      text: document.body.innerText,
      resultEarnedOnly: document.querySelectorAll(".result-badges [data-earned-only='true']").length,
      resultBadgeCards: document.querySelectorAll(".result-badges .badge").length,
      resultLockedCards: document.querySelectorAll(".result-badges .badge.locked").length,
      unitWalls: document.querySelectorAll("[data-bq-unit-achievements='true']").length,
      achievementBadges: document.querySelectorAll("#screen .badge-grid .badge").length,
      overviewPanels: document.querySelectorAll("[data-bq-badge-overview='true']").length,
      summaryBoxes: document.querySelectorAll("[data-bq-badge-overview='true'] .bq-unit-badge-summary").length,
      titleCards: titleCards.length,
      reloginButtons: [...document.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      badImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src)
    };
  });
}

async function runCase(browser, viewport, mode) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  const requests = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => requests.push(`${request.resourceType()}:${request.url()}::${request.failure()?.errorText || ""}`));
  await installBackend(page, mode);
  await page.goto(url);
  await page.evaluate(({ state }) => {
    localStorage.clear();
    localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history-marker", mission: { unit_id: "cell_structure" }, student: state.student, completion_status: "complete" }]));
    window.__cellStructureTest.setState(state);
    setScreen("result");
  }, { state: submittedState(mode) });

  await page.locator("#goAchievements").waitFor({ state: "visible" });
  const result = await inspect(page);
  const expectedResultBadges = mode === "verified" ? 2 : 1;
  assert.equal(result.resultEarnedOnly, 1, `${mode} ${viewport.width}: result must mark earned-only`);
  assert.equal(result.resultBadgeCards, expectedResultBadges, `${mode} ${viewport.width}: result must show only current earned badges`);
  assert.equal(result.resultLockedCards, 0, `${mode} ${viewport.width}: result must not show locked catalog cards`);
  assert.ok(result.reloginButtons >= 1, `${mode} ${viewport.width}: result relogin entry missing`);

  await page.locator("#goAchievements").click();
  await page.locator("[data-bq-badge-overview='true']").waitFor({ state: "visible" });
  const achievements = await inspect(page);
  assert.equal(achievements.unitWalls, 0, `${mode} ${viewport.width}: unit wall must be removed`);
  assert.equal(achievements.achievementBadges, 0, `${mode} ${viewport.width}: achievements must not show unit badge cards`);
  assert.equal(achievements.overviewPanels, 1, `${mode} ${viewport.width}: overview must be exactly one`);
  assert.equal(achievements.summaryBoxes, 52, `${mode} ${viewport.width}: overview must render 52 boxes`);
  assert.equal(achievements.titleCards, 1, `${mode} ${viewport.width}: title avatar must be exactly one`);
  assert.ok(achievements.reloginButtons >= 1, `${mode} ${viewport.width}: achievements relogin entry missing`);

  await page.locator("#achieveResult").click();
  await page.locator("#goRules").click();
  const rules = await inspect(page);
  assert.ok(rules.reloginButtons >= 1, `${mode} ${viewport.width}: rules relogin entry missing`);
  await page.locator("[data-nav='checkpoint1']").click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "result");
  await page.locator("[data-nav='rules']").click();
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "rules");
  await page.locator("[data-relogin-action='true']").last().click();
  await page.locator("#guestButton").waitFor({ state: "visible" });
  const resetState = await page.evaluate(() => ({
    screen: window.__cellStructureTest.state().screen,
    student: window.__cellStructureTest.state().student,
    result: window.__cellStructureTest.state().result,
    submittedAt: window.__cellStructureTest.state().submitted_at,
    attemptId: window.__cellStructureTest.state().attempt_id,
    sessionToken: window.__cellStructureTest.state().attempt_session_token,
    historyCount: JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]").length
  }));
  assert.equal(resetState.screen, "login", `${mode} ${viewport.width}: reset must return to login`);
  assert.equal(resetState.student, null, `${mode} ${viewport.width}: reset must clear current student`);
  assert.equal(resetState.result, null, `${mode} ${viewport.width}: reset must clear current result`);
  assert.equal(resetState.submittedAt, null, `${mode} ${viewport.width}: reset must clear submitted`);
  assert.equal(resetState.attemptId, "", `${mode} ${viewport.width}: reset must clear current attempt`);
  assert.equal(resetState.sessionToken, "", `${mode} ${viewport.width}: reset must clear session token`);
  assert.equal(resetState.historyCount, 1, `${mode} ${viewport.width}: reset must preserve attempt history`);

  if (mode === "guest") {
    await page.locator("#guestButton").click();
  } else {
    await page.locator("#studentIdInput").fill("S70102");
    await page.locator("#loginButton").click();
  }
  await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief");
  const relogin = await page.evaluate(() => ({
    state: {
      attemptId: window.__cellStructureTest.state().attempt_id,
      sessionToken: window.__cellStructureTest.state().attempt_session_token,
      previousAttemptId: window.__cellStructureTest.state().previous_attempt_id,
      questionVersion: window.__cellStructureTest.state().question_version,
      submittedAt: window.__cellStructureTest.state().submitted_at,
      resultPresent: Boolean(window.__cellStructureTest.state().result)
    },
    actions: window.__u6RetryActions || []
  }));
  if (mode === "guest") {
    assert.equal(relogin.actions.length, 0, `${mode} ${viewport.width}: guest relogin must not call backend`);
    assert.match(relogin.state.attemptId, /^cell_structure_guest_attempt_/);
  } else {
    assert.deepEqual(relogin.actions.map((item) => item.action), ["getStudentAndAttemptStatus", "startAttempt"], `${mode} ${viewport.width}: formal relogin must fetch and start`);
    assert.equal(relogin.state.attemptId, `u6_${mode}_new_attempt`);
    assert.equal(relogin.state.sessionToken, `u6_${mode}_new_token`);
    assert.equal(relogin.state.previousAttemptId, `u6_${mode}_submitted_attempt`);
  }
  assert.equal(relogin.state.questionVersion, QUESTION_VERSION);
  assert.equal(relogin.state.submittedAt, null);
  assert.equal(relogin.state.resultPresent, false);
  assert.deepEqual(errors, [], `${mode} ${viewport.width}: console/page errors`);
  assert.deepEqual(requests, [], `${mode} ${viewport.width}: request failures`);
  assert.deepEqual([...result.badImages, ...achievements.badImages, ...rules.badImages], [], `${mode} ${viewport.width}: broken images`);
  assert.equal(result.horizontalOverflow || achievements.horizontalOverflow || rules.horizontalOverflow, false, `${mode} ${viewport.width}: no overflow`);
  await page.close();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      for (const mode of ["verified", "pending", "guest"]) await runCase(browser, viewport, mode);
    }
  } finally {
    await browser.close();
  }
  console.log("cell-structure submitted retry regression passed");
})();
