const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.env.BQ_TEST_ROOT ? path.resolve(process.env.BQ_TEST_ROOT) : path.resolve(__dirname, "..");
const CACHE = "20260731-cell-transport-submitted-retry-ia-v1";
const QUESTION_VERSION = "20260721-cell-transport-q07-inactive-v1";
const url = `${pathToFileURL(path.join(root, "index.html")).href}?v=${CACHE}`;

function summaryFor(mode) {
  if (mode !== "verified") return "[]";
  return JSON.stringify([
    {
      sequence: 1,
      unit_id: "life_world",
      earned_count: 2,
      catalog_count: 9,
      earned_badges: [{ badge_id: "life_world_entry", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }]
    },
    {
      sequence: 8,
      unit_id: "cell_transport",
      earned_count: 3,
      catalog_count: 10,
      earned_badges: [
        { badge_id: "cell_transport_entry", badge_image_path: "shared-assets/badges/cell_transport/badge-cell_transport-cell_transport_entry.webp" },
        { badge_id: "cell_transport_flawless", badge_image_path: "shared-assets/badges/cell_transport/badge-cell_transport-cell_transport_flawless.webp" },
        { badge_id: "cell_transport_reflection_reporter", badge_image_path: "shared-assets/badges/cell_transport/badge-cell_transport-cell_transport_reflection_reporter.webp" }
      ]
    }
  ]);
}

function progressFor(mode) {
  if (mode === "guest") return {};
  return {
    source: mode === "verified" ? "server_verified" : "pending_backend",
    progress_applied: mode === "verified",
    total_exp: mode === "verified" ? 3500 : 3180,
    completed_unit_count: mode === "verified" ? 7 : 6,
    current_title_id: "concept_solver",
    current_title: "概念解謎者",
    title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
    unit_badge_summary_json: summaryFor(mode)
  };
}

function studentFor(mode) {
  if (mode === "guest") {
    return {
      student_id: "guest",
      student_name: "老師測試帳號",
      class_name: "測試",
      seat_no: "00",
      profile_gender: "male",
      is_guest: true,
      progress: {}
    };
  }
  return {
    student_id: "S70108",
    student_name: "測試學生",
    class_name: "701",
    seat_no: "08",
    profile_gender: "male",
    is_guest: false,
    progress: progressFor(mode)
  };
}

function resultFor(mode) {
  const verified = mode === "verified";
  return {
    completion_exp: 100,
    concept_exp: verified ? 220 : 170,
    revision_exp: verified ? 0 : 60,
    question_exp: verified ? 40 : 0,
    mastery_exp: verified ? 140 : 40,
    retry_exp: 0,
    attempt_total_exp: verified ? 500 : 370,
    unit_credited_exp: verified ? 500 : 0,
    credited_delta: verified ? 500 : 0,
    correct: verified ? 13 : 10,
    total: 13,
    accuracy: verified ? 1 : 10 / 13,
    hint_used: verified ? 0 : 2,
    corrected_after_hint: verified ? 0 : 2,
    reflection_quality: "discussion_question",
    reflection_exp_reason: verified ? "正式回報已認列" : "後台待重算",
    badges: ["cell_transport_entry", "cell_transport_flawless", "cell_transport_reflection_reporter"]
  };
}

function submittedState(mode) {
  return {
    screen: "result",
    student: studentFor(mode),
    attempt_type: mode === "guest" ? "first" : "retry",
    remote_completed_attempts: mode === "guest" ? 0 : 6,
    remote_previous_attempt_id: mode === "guest" ? "" : "u8_previous_attempt",
    remote_previous_accuracy: mode === "guest" ? null : 0.77,
    cumulative_badges: mode === "verified" ? ["cell_transport_entry", "cell_transport_flawless", "cell_transport_reflection_reporter"] : [],
    cumulative_total_exp: mode === "verified" ? 3500 : 0,
    completed_unit_count: mode === "verified" ? 7 : 0,
    started_at: "2026-07-31T00:00:00.000Z",
    attempt_id: `u8_${mode}_submitted_attempt`,
    attempt_session_id: `u8_${mode}_submitted_session`,
    attempt_session_token: mode === "guest" ? "" : `u8_${mode}_submitted_token`,
    question_version: QUESTION_VERSION,
    session_expires_at: "2026-07-31T00:30:00.000Z",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    answers: {
      q01: "diffusion", q02: "no_membrane_needed", q03: "to_sugar", q04: "selective",
      q05: "outside_in", q06: "regulate", q08: "water_direction", q09: "shrink", q10: "swell", q11: "wall_support", q12: "plasmolysis", q13: "solute", q14: "selective",
      reflection: {}
    },
    hints: {},
    checkedWrong: {},
    interactions: {},
    optionOrders: {},
    result: resultFor(mode),
    submitted_at: "2026-07-31T00:20:00.000Z",
    lockNotice: "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。",
    backend_status: mode === "verified" ? "submitted" : mode === "pending" ? "pending_progress" : "local_guest"
  };
}

async function installBackend(page, mode) {
  await page.addInitScript(({ mode, questionVersion }) => {
    window.__u8RetryActions = [];
    const response = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });

    window.fetch = async (rawUrl, options = {}) => {
      const url = new URL(String(rawUrl), window.location.href);
      const action = url.searchParams.get("action") || "unknown";
      window.__u8RetryActions.push({ action, url: String(url) });
      if (action === "getStudentAndAttemptStatus") {
        return response({
          ok: true,
          student: {
            student_id: "S70108",
            student_name: "測試學生",
            class_name: "701",
            seat_no: "08",
            profile_gender: "male"
          },
          progress: {
            total_exp: 3500,
            completed_unit_count: 7,
            current_title_id: "concept_solver",
            current_title: "概念解謎者",
            title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
            unit_badge_summary_json: JSON.stringify([
              { sequence: 8, unit_id: "cell_transport", earned_count: 3, catalog_count: 10, earned_badges: [] }
            ])
          },
          attempt_status: {
            completed_attempt_count: 7,
            previous_attempt_id: "u8_previous_attempt",
            previous_accuracy: 0.77
          }
        });
      }
      if (action === "startAttempt") {
        return response({
          ok: true,
          verification_mode: "server_verified",
          attempt_type: "retry",
          attempt_id: `u8_${mode}_new_attempt`,
          attempt_session_id: `u8_${mode}_new_session`,
          attempt_session_token: `u8_${mode}_new_token`,
          previous_attempt_id: `u8_${mode}_submitted_attempt`,
          question_version: questionVersion,
          expires_at: "2026-07-31T01:00:00.000Z"
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
      resultBadgeCards: document.querySelectorAll(".result-badges img").length,
      unitWalls: document.querySelectorAll("[data-bq-unit-achievements]").length,
      overviewPanels: document.querySelectorAll("[data-bq-badge-overview='true']").length,
      overviewBoxes: document.querySelectorAll("[data-bq-badge-overview='true'] .bq-unit-badge-summary").length,
      titleCards: titleCards.length,
      reloginButtons: [...document.querySelectorAll("button, a")].filter((node) => /重新登入|再挑戰/.test(node.textContent || "")).length,
      brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
}

async function runCase(browser, viewport, mode) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) consoleErrors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript((state) => {
    localStorage.clear();
    localStorage.setItem("bioquest_cell_transport_state_v1", JSON.stringify(state));
    localStorage.setItem("bioquest_attempts_v1", JSON.stringify([
      { attempt_id: "history_attempt", mission: { unit_id: "cell_transport" }, student: state.student, completion_status: "complete", submitted_at: "2026-07-30T00:00:00.000Z" }
    ]));
  }, submittedState(mode));
  await installBackend(page, mode);
  await page.goto(url);
  await page.waitForSelector("#screen[data-bioquest-screen='result']");

  const resultView = await inspect(page);
  assert.equal(resultView.resultBadgeCards, 3, `${mode} ${viewport.width}: result must show only current earned badges`);
  assert.ok(resultView.reloginButtons >= 1, `${mode} ${viewport.width}: result relogin entry missing`);
  assert.equal(resultView.unitWalls, 0, `${mode} ${viewport.width}: result must not render a unit wall`);
  assert.equal(resultView.overflow, false, `${mode} ${viewport.width}: result must not overflow`);
  assert.deepEqual(resultView.brokenImages, [], `${mode} ${viewport.width}: result must not contain broken images`);

  await page.locator("#resultAchievements").click();
  await page.waitForSelector("[data-bq-badge-overview='true']");
  const achievementsView = await inspect(page);
  assert.equal(achievementsView.unitWalls, 0, `${mode} ${viewport.width}: achievements must remove local badge wall`);
  assert.equal(achievementsView.overviewPanels, 1, `${mode} ${viewport.width}: achievements must keep exactly one overview`);
  assert.equal(achievementsView.overviewBoxes, 52, `${mode} ${viewport.width}: achievements must keep 52 overview boxes`);
  assert.equal(achievementsView.titleCards, 1, `${mode} ${viewport.width}: achievements must keep exactly one title card`);
  assert.ok(achievementsView.reloginButtons >= 1, `${mode} ${viewport.width}: achievements relogin entry missing`);
  assert.equal(achievementsView.overflow, false, `${mode} ${viewport.width}: achievements must not overflow`);
  assert.deepEqual(achievementsView.brokenImages, [], `${mode} ${viewport.width}: achievements must not contain broken images`);

  await page.locator("#achieveResult").click();
  await page.waitForSelector("#screen[data-bioquest-screen='result']");
  await page.locator("#resultRules").click();
  await page.waitForSelector("#screen[data-bioquest-screen='rules']");
  const rulesView = await inspect(page);
  assert.ok(rulesView.reloginButtons >= 1, `${mode} ${viewport.width}: rules relogin entry missing`);
  const lockedNavState = await page.evaluate(() => ({
    checkpointDisabled: Boolean(document.querySelector("[data-nav='checkpoint1']")?.disabled),
    activeScreen: document.querySelector("#screen")?.dataset.bioquestScreen || ""
  }));
  assert.equal(lockedNavState.checkpointDisabled, true, `${mode} ${viewport.width}: submitted checkpoint nav must stay locked`);
  assert.equal(lockedNavState.activeScreen, "rules", `${mode} ${viewport.width}: rules screen should remain active while submitted`);

  await page.locator("[data-relogin-action='true']").last().click();
  await page.waitForSelector("#screen[data-bioquest-screen='login']");
  const resetState = await page.evaluate(() => ({
    screen: window.__cellTransportTest.state().screen,
    student: window.__cellTransportTest.state().student,
    result: window.__cellTransportTest.state().result,
    submittedAt: window.__cellTransportTest.state().submitted_at,
    attemptId: window.__cellTransportTest.state().attempt_id,
    sessionId: window.__cellTransportTest.state().attempt_session_id,
    sessionToken: window.__cellTransportTest.state().attempt_session_token,
    historyCount: JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]").length
  }));
  assert.equal(resetState.screen, "login", `${mode} ${viewport.width}: reset must return to login`);
  assert.equal(resetState.student, null, `${mode} ${viewport.width}: reset must clear current student`);
  assert.equal(resetState.result, null, `${mode} ${viewport.width}: reset must clear current result`);
  assert.equal(resetState.submittedAt, null, `${mode} ${viewport.width}: reset must clear submitted flag`);
  assert.equal(resetState.attemptId, "", `${mode} ${viewport.width}: reset must clear current attempt`);
  assert.equal(resetState.sessionId, "", `${mode} ${viewport.width}: reset must clear current session`);
  assert.equal(resetState.sessionToken, "", `${mode} ${viewport.width}: reset must clear current token`);
  assert.equal(resetState.historyCount, 1, `${mode} ${viewport.width}: reset must preserve local attempt history`);

  if (mode === "guest") {
    await page.locator("#guestButton").click();
  } else {
    await page.locator("#studentIdInput").fill("S70108");
    await page.locator("#loginButton").click();
  }
  await page.waitForSelector("#screen[data-bioquest-screen='brief']");
  const reloginState = await page.evaluate(() => ({
    attemptId: window.__cellTransportTest.state().attempt_id,
    sessionId: window.__cellTransportTest.state().attempt_session_id,
    sessionToken: window.__cellTransportTest.state().attempt_session_token,
    previousAttemptId: window.__cellTransportTest.state().remote_previous_attempt_id,
    questionVersion: window.__cellTransportTest.state().question_version,
    submittedAt: window.__cellTransportTest.state().submitted_at,
    resultPresent: Boolean(window.__cellTransportTest.state().result),
    backendStatus: window.__cellTransportTest.state().backend_status,
    actions: window.__u8RetryActions || []
  }));
  assert.equal(reloginState.questionVersion, QUESTION_VERSION, `${mode} ${viewport.width}: relogin must preserve canonical QUESTION_VERSION`);
  assert.equal(reloginState.submittedAt, null, `${mode} ${viewport.width}: relogin must start a fresh attempt`);
  assert.equal(reloginState.resultPresent, false, `${mode} ${viewport.width}: relogin must not keep old result`);
  if (mode === "guest") {
    assert.equal(reloginState.sessionToken, "guest_local_session", `${mode} ${viewport.width}: guest relogin must stay local`);
    assert.deepEqual(reloginState.actions, [], `${mode} ${viewport.width}: guest relogin must not call backend`);
  } else {
    assert.match(reloginState.attemptId, new RegExp(`^u8_${mode}_new_attempt$`), `${mode} ${viewport.width}: formal relogin must create a new attempt`);
    assert.match(reloginState.sessionId, new RegExp(`^u8_${mode}_new_session$`), `${mode} ${viewport.width}: formal relogin must create a new session`);
    assert.match(reloginState.sessionToken, new RegExp(`^u8_${mode}_new_token$`), `${mode} ${viewport.width}: formal relogin must create a new token`);
    assert.equal(reloginState.previousAttemptId, `u8_${mode}_submitted_attempt`, `${mode} ${viewport.width}: formal relogin must carry previous attempt id`);
    assert.deepEqual(reloginState.actions.map((entry) => entry.action), ["getStudentAndAttemptStatus", "startAttempt"], `${mode} ${viewport.width}: formal relogin action chain mismatch`);
  }

  assert.deepEqual(consoleErrors, [], `${mode} ${viewport.width}: console errors detected`);
  assert.deepEqual(pageErrors, [], `${mode} ${viewport.width}: page errors detected`);
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      for (const mode of ["guest", "pending", "verified"]) {
        await runCase(browser, viewport, mode);
      }
    }
  } finally {
    await browser.close();
  }
  console.log("cell_transport submitted retry regression passed");
})();
