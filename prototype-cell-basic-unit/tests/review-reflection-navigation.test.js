const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.env.BQ_TEST_ROOT ? path.resolve(process.env.BQ_TEST_ROOT) : path.resolve(__dirname, "..");
const url = `${pathToFileURL(path.join(root, "index.html")).href}?v=20260731-cell-basic-unit-submitted-retry-ia-v1`;

async function advanceToReview(page) {
  await page.locator("#guestButton").click();
  await page.locator("#briefNext").waitFor({ state: "visible" });
  await page.locator("#briefNext").click();
  await page.locator("#scanNext").click();
  await completeCheckpoint1(page);
  await completeCheckpoint2(page);
  await completeCheckpoint3(page);
  await completeCheckpoint4(page);
  await page.locator("#reviewNext").waitFor({ state: "visible" });
}

async function expectBlocked(page, checkpointId, nextButtonSelector) {
  await page.locator(nextButtonSelector).click();
  await page.locator(".checkpoint-blocker").waitFor({ state: "visible" });
  assert.equal(await page.locator(`[data-nav="${checkpointId}"]`).evaluate((node) => node.classList.contains("active")), true);
  assert.match(await page.locator(".checkpoint-blocker").innerText(), /尚未完成/);
}

async function choose(page, questionId, optionId) {
  await page.locator(`[data-choice="${questionId}"][data-option="${optionId}"]`).click();
}

async function classify(page, tokenId, categoryId) {
  await page.locator(`[data-token="${tokenId}"]`).click();
  await page.locator(`[data-category="${categoryId}"]`).click();
}

async function completeCheckpoint1(page) {
  await page.locator("#checkpoint1Next").waitFor({ state: "visible" });
  await expectBlocked(page, "checkpoint1", "#checkpoint1Next");
  await choose(page, "q01", "basic");
  await expectBlocked(page, "checkpoint1", "#checkpoint1Next");
  for (const id of ["human", "onion", "yeast", "paramecium"]) await page.locator(`[data-multi="${id}"]`).click();
  await page.locator("#confirmMulti").click();
  await choose(page, "q02", "plant_cells");
  await page.locator("#checkpoint1Next").click();
  await page.locator("#checkpoint2Next").waitFor({ state: "visible" });
}

async function completeCheckpoint2(page) {
  await expectBlocked(page, "checkpoint2", "#checkpoint2Next");
  await classify(page, "paramecium", "single");
  await expectBlocked(page, "checkpoint2", "#checkpoint2Next");
  for (const [token, category] of [["yeast", "single"], ["amoeba", "single"], ["human", "multi"], ["onion", "multi"], ["butterfly", "multi"]]) {
    await classify(page, token, category);
  }
  await choose(page, "q06", "single_life");
  await choose(page, "q07", "some_single");
  await page.locator("#checkpoint2Next").click();
  await page.locator("#checkpoint3Next").waitFor({ state: "visible" });
}

async function completeCheckpoint3(page) {
  await expectBlocked(page, "checkpoint3", "#checkpoint3Next");
  await page.locator('[data-match="flat"]').selectOption("cover");
  await expectBlocked(page, "checkpoint3", "#checkpoint3Next");
  for (const [item, value] of [["long", "message"], ["disc", "gas"], ["fiber", "contract"]]) {
    await page.locator(`[data-match="${item}"]`).selectOption(value);
  }
  await choose(page, "q09", "message");
  await choose(page, "q10", "gas");
  await page.locator("#checkpoint3Next").click();
  await page.locator("#checkpoint4Next").waitFor({ state: "visible" });
}

async function completeCheckpoint4(page) {
  await expectBlocked(page, "checkpoint4", "#checkpoint4Next");
  await choose(page, "q12", "cheek_cells");
  await expectBlocked(page, "checkpoint4", "#checkpoint4Next");
  await page.locator("#confirmSequence").click();
  await choose(page, "q14", "cell_function");
  await page.locator("#checkpoint4Next").click();
}

async function checkViewport(browser, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await advanceToReview(page);
  assert.equal(await page.locator('[data-nav="review"]').evaluate((node) => node.classList.contains("active")), true);
  await page.locator("#reviewNext").click();
  await page.locator("#submitMission").waitFor({ state: "visible" });
  assert.equal(await page.locator('[data-nav="reflection"]').evaluate((node) => node.classList.contains("active")), true);
  assert.match(await page.locator("#screen").innerText(), /留下你的課堂線索/);
  const screenBox = await page.locator("#screen").boundingBox();
  assert.ok(screenBox && screenBox.width <= viewport.width + 1, "report screen must fit the viewport");

  await page.evaluate(() => {
    state.screen = "review";
    state.student = null;
    render();
  });
  await page.locator("#reviewNext").click();
  assert.match(await page.locator("#reviewNavigationNotice").innerText(), /登入狀態已失效/);
  assert.equal(await page.locator("#reviewNext").count(), 1, "blocked route must stay on review with an explanation");

  await page.evaluate(() => {
    state.student = { student_id: "guest", student_name: "老師測試帳號", is_guest: true };
    state.submitted_at = new Date().toISOString();
    setScreen("reflection");
  });
  await page.locator("#resultAchievements").waitFor({ state: "visible" });
  assert.match(await page.locator("#screen").innerText(), /本次任務已提交/);
  assert.deepEqual(errors, []);
  await page.close();
}

async function checkStateContract(browser, viewport, mode) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.evaluate(({ mode: currentMode }) => {
    const verifiedSummary = JSON.stringify([
      {
        unit_id: "life_world",
        sequence: 1,
        unit_title: "生命世界與生命現象",
        station_title: "第 1 站｜生命世界與生命現象",
        availability_status: "open",
        total_badges: 9,
        earned_count: 2,
        earned_badges: [
          { badge_id: "life_world_entry", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }
        ]
      },
      {
        unit_id: "cell_basic_unit",
        sequence: 5,
        unit_title: "生物體的基本單位",
        station_title: "第 5 站｜生物體的基本單位",
        availability_status: "open",
        total_badges: 8,
        earned_count: 3,
        earned_badges: [
          { badge_id: "cell_basic_unit_entry", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_basic_unit_entry.webp" },
          { badge_id: "cell_unit_concept_keeper", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_unit_concept_keeper.webp" },
          { badge_id: "cell_basic_unit_flawless", badge_image_path: "shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-cell_basic_unit_flawless.webp" }
        ]
      }
    ]);
    const progress = currentMode === "verified"
      ? {
        source: "server_verified",
        total_exp: 900,
        current_title_id: "life_observer",
        current_title: "生命觀察員",
        completed_unit_count: 5,
        unit_badge_summary_json: verifiedSummary,
        title_avatar_path: "shared-assets/title-avatars/title-02-life_observer-male.webp"
      }
      : currentMode === "pending"
        ? { source: "pending_backend", total_exp: 900, current_title_id: "life_observer", current_title: "生命觀察員" }
        : {};
    state = structuredClone(defaultState);
    state.student = {
      student_id: currentMode === "guest" ? "guest" : "S70102",
      student_name: currentMode === "guest" ? "老師測試帳號" : "測試學生",
      class_name: "701",
      seat_no: "02",
      is_guest: currentMode === "guest",
      progress
    };
    state.result = {
      verification_status: currentMode === "verified" ? "server_verified" : currentMode === "pending" ? "pending_backend" : "local_guest",
      attempt_total_exp: 460,
      unit_credited_exp: currentMode === "verified" ? 460 : 0,
      credited_delta: currentMode === "verified" ? 120 : 0,
      concept_exp: 190,
      revision_exp: 130,
      completion_exp: 100,
      question_exp: 0,
      mastery_exp: 40,
      retry_exp: 0,
      accuracy: 0.92,
      badges: ["cell_basic_unit_entry", "cell_unit_concept_keeper", "cell_basic_unit_flawless"],
      reflection_exp_reason: "空白回報不給回報 EXP。"
    };
    state.submitted_at = new Date().toISOString();
    state.completedScreens = ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection", "result", "achievements", "rules"];
    setScreen("result");
  }, { mode });
  await page.locator("#resultAchievements").waitFor({ state: "visible" });
  const resultText = await page.locator("#screen").innerText();
  if (mode === "guest") {
    assert.match(resultText, /guest 本次預估 EXP/);
    assert.match(resultText, /不列入正式累積/);
  } else if (mode === "pending") {
    assert.match(resultText, /本次預估 EXP/);
    assert.match(resultText, /待後台確認/);
    assert.doesNotMatch(resultText, /本單元正式認列 460/);
  } else {
    assert.match(resultText, /本單元正式認列 EXP/);
    assert.match(resultText, /本次新增認列/);
  }
  assert.match(resultText, /重新登入，並從登入頁開始/);
  const resultCounts = await page.evaluate(() => ({
    earnedOnly: document.querySelectorAll("[data-earned-only='true']").length,
    resultBadgeCards: document.querySelectorAll(".result-badges .badge-card").length,
    fullCatalog: document.querySelectorAll(".result-badges .badge-card:not(.earned-now)").length,
    reloginButtons: document.querySelectorAll("[data-relogin-action='true']").length
  }));
  assert.equal(resultCounts.earnedOnly, 1, `${mode}: result must mark earned-only badges`);
  assert.equal(resultCounts.resultBadgeCards, 3, `${mode}: result must only show the three earned fixture badges`);
  assert.equal(resultCounts.fullCatalog, 0, `${mode}: result must not include locked catalog cards`);
  assert.ok(resultCounts.reloginButtons >= 1, `${mode}: result must expose a relogin entry`);
  await page.locator("#resultAchievements").click();
  await page.locator(".bq-all-unit-badge-overview").waitFor({ state: "visible" });
  const counts = await page.evaluate(() => {
    const overview = document.querySelector(".bq-all-unit-badge-overview");
    const titleCards = [...document.querySelectorAll(".bq-title-avatar-card, .title-avatar-card.achievements")].filter((node) => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    return {
      titleCards: titleCards.length,
      localTitleCards: document.querySelectorAll(".student-title-card").length,
      overviewPanels: document.querySelectorAll(".bq-all-unit-badge-overview").length,
      summaryBoxes: document.querySelectorAll(".bq-unit-badge-summary").length,
      unitWalls: document.querySelectorAll("[data-bq-unit-achievements]").length,
      badgeCards: document.querySelectorAll(".badge-card").length,
      reloginButtons: document.querySelectorAll("[data-relogin-action='true']").length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      titleText: titleCards[0]?.innerText || "",
      overviewText: overview?.innerText || ""
    };
  });
  assert.equal(counts.titleCards, 1, `${mode}: title avatar must be exactly one`);
  assert.equal(counts.localTitleCards, 0, `${mode}: legacy local title card must be removed`);
  assert.equal(counts.overviewPanels, 1, `${mode}: overview must be exactly one`);
  assert.equal(counts.summaryBoxes, 52, `${mode}: overview must render 52 summary boxes`);
  assert.equal(counts.unitWalls, 0, `${mode}: unit achievements wall must be removed`);
  assert.equal(counts.badgeCards, 0, `${mode}: achievements must not show unit badge cards`);
  assert.ok(counts.reloginButtons >= 1, `${mode}: achievements must expose a relogin entry`);
  assert.equal(counts.horizontalOverflow, false, `${mode}: no horizontal overflow`);
  if (mode === "verified") {
    assert.match(counts.titleText, /生命觀察員/);
    assert.match(counts.titleText, /已完成 5 站/);
    assert.match(counts.overviewText, /2\/9/);
    assert.match(counts.overviewText, /3\/8/);
  } else if (mode === "pending") {
    assert.match(counts.titleText, /等待後台確認正式稱號進度/);
    assert.doesNotMatch(counts.titleText, /距離/);
  } else {
    assert.match(counts.titleText, /guest 測試不列入正式稱號進度/);
    assert.match(counts.overviewText, /guest 測試不列入正式累積徽章/);
  }
  await page.locator("#achieveResult").click();
  await page.locator("#resultRules").click();
  await page.locator("[data-relogin-action='true']").waitFor({ state: "visible" });
  assert.match(await page.locator("#screen").innerText(), /重新登入，並從登入頁開始/);
  await page.evaluate((currentMode) => {
    localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{
      attempt_id: "history-marker",
      verification_status: currentMode === "guest" ? "local_guest" : "server_verified",
      student: { student_id: currentMode === "guest" ? "guest" : "S70102" },
      mission: { unit_id: "cell_basic_unit" },
      exp_awarded: 320
    }]));
  }, mode);
  await page.locator("[data-relogin-action='true']").last().click();
  await page.locator("#guestButton").waitFor({ state: "visible" });
  const resetState = await page.evaluate(() => ({
    screen: state.screen,
    student: state.student,
    result: state.result,
    submittedAt: state.submitted_at,
    attemptId: state.attempt_id,
    sessionToken: state.attempt_session_token,
    historyCount: JSON.parse(localStorage.getItem("bioquest_attempts_v1") || "[]").length,
    lockNotice: state.lockNotice
  }));
  assert.equal(resetState.screen, "login", `${mode}: relogin action must return to login`);
  assert.equal(resetState.student, null, `${mode}: relogin action must clear current student`);
  assert.equal(resetState.result, null, `${mode}: relogin action must clear current result`);
  assert.equal(resetState.submittedAt, null, `${mode}: relogin action must clear submitted flag`);
  assert.equal(resetState.attemptId, "", `${mode}: relogin action must clear current attempt id`);
  assert.equal(resetState.sessionToken, "", `${mode}: relogin action must clear current session token`);
  assert.equal(resetState.historyCount, 1, `${mode}: relogin action must preserve attempt history`);
  assert.match(resetState.lockNotice, /既有正式紀錄不會被刪除/);
  assert.deepEqual(errors, []);
  await page.close();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await checkViewport(browser, viewport);
      for (const mode of ["verified", "pending", "guest"]) await checkStateContract(browser, viewport, mode);
    }
  } finally {
    await browser.close();
  }
  console.log("cell-basic-unit review to reflection navigation regression passed");
})();
