const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const root = process.env.BIOQUEST_AUDIT_ROOT ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT) : path.resolve(__dirname, "..", "..");
const storageKey = "bioquest_cell_transport_state_v1";
const version = "20260731-cell-transport-submitted-retry-ia-v1";

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png" }[ext] || "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, "http://127.0.0.1").pathname;
    if (requestPath === "/favicon.ico") return res.writeHead(204).end();
    const cleanPath = decodeURIComponent(requestPath).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(root, cleanPath);
    if (!filePath.startsWith(root)) return res.writeHead(403).end("Forbidden");
    fs.readFile(filePath, (error, buffer) => {
      if (error) return res.writeHead(404).end("Not found");
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

function progressFixture() {
  return {
    source: "server_verified",
    progress_applied: true,
    total_exp: 3500,
    completed_unit_count: 7,
    current_title_id: "concept_solver",
    current_title: "概念解謎者",
    title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
    unit_badge_summary_json: JSON.stringify([
      { unit_id: "life_world", earned_count: 2, total_badges: 9, availability_status: "ready", earned_badges: [{ badge_id: "life_world_entry", name: "多彩入門", badge_image_path: "prototype-life-world/assets/badges/life_world_entry.webp" }] },
      { unit_id: "scientific_method", earned_count: 1, total_badges: 10, availability_status: "ready", earned_badges: [] },
      { unit_id: "cell_transport", earned_count: 3, total_badges: 10, availability_status: "ready", earned_badges: [{ badge_id: "cell_transport_entry", name: "細胞通行入門徽章", badge_image_path: "shared-assets/badges/cell_transport/badge-cell_transport-cell_transport_entry.webp" }] }
    ])
  };
}

function resultFixture() {
  return {
    completion_exp: 100,
    concept_exp: 220,
    revision_exp: 0,
    question_exp: 40,
    mastery_exp: 140,
    retry_exp: 0,
    attempt_total_exp: 500,
    unit_credited_exp: 500,
    credited_delta: 500,
    correct: 13,
    total: 13,
    accuracy: 1,
    hint_used: 0,
    corrected_after_hint: 0,
    badges: ["cell_transport_entry", "cell_transport_flawless", "cell_transport_reflection_reporter"],
    reflection_quality: "discussion_question",
    reflection_exp_reason: "具體且與本單元概念相關。"
  };
}

function stateFor(screen, overrides = {}) {
  return {
    screen,
    student: {
      student_id: "S79998",
      student_name: "測試學生",
      class_name: "七年級",
      seat_no: "98",
      profile_gender: "male",
      current_title_id: "concept_solver",
      current_title: "概念解謎者",
      title_avatar_path: "shared-assets/title-avatars/title-04-concept_solver-male.webp",
      progress: progressFixture(),
      is_guest: false
    },
    attempt_type: "first",
    attempt_id: "attempt_fixture",
    attempt_session_id: "attempt_fixture",
    attempt_session_token: "session.nonce",
    question_version: "20260721-cell-transport-q07-inactive-v1",
    completedScreens: ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection", "result", "achievements", "rules"],
    answers: {
      q01: "diffusion", q02: "no_membrane_needed", q03: "to_sugar", q04: "selective",
      q05: "outside_in", q06: "regulate",
      q08: "water_direction", q09: "shrink", q10: "swell", q11: "wall_support", q12: "plasmolysis", q13: "solute", q14: "selective",
      reflection: {}
    },
    hints: {},
    checkedWrong: {},
    interactions: {},
    optionOrders: {},
    result: resultFixture(),
    submitted_at: screen === "result" || screen === "achievements" ? "2026-07-16T00:00:00.000Z" : null,
    backend_status: "submitted",
    cumulative_badges: ["cell_transport_entry", "cell_transport_flawless", "cell_transport_reflection_reporter"],
    cumulative_total_exp: 3500,
    completed_unit_count: 7,
    ...overrides
  };
}

async function openPage(browser, baseUrl, viewport, state) {
  const context = await browser.newContext({ viewport });
  const imageErrors = [];
  const consoleErrors = [];
  const pageErrors = [];
  await context.addInitScript(({ key, value }) => {
    localStorage.clear();
    if (value) localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("bioquest_attempts_v1", "[]");
  }, { key: storageKey, value: state });
  const page = await context.newPage();
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) imageErrors.push(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/prototype-cell-transport/index.html?v=${version}`, { waitUntil: "domcontentloaded" });
  return { context, page, imageErrors, consoleErrors, pageErrors };
}

async function assertStaticScreens(browser, baseUrl, viewport) {
  const screens = ["brief", "scan", "review", "reflection", "result", "achievements"];
  for (const screen of screens) {
    const { context, page, imageErrors, consoleErrors, pageErrors } = await openPage(browser, baseUrl, viewport, stateFor(screen));
    const metrics = await page.evaluate((screenName) => ({
      active: document.querySelector("#screen")?.dataset.bioquestScreen,
      loginOwl: document.querySelectorAll(".bq-login-unit-character, .mentor-card").length,
      briefImages: document.querySelectorAll(".bq-brief-scene-stage .bq-brief-scene-image").length,
      briefAvatars: document.querySelectorAll(".bq-brief-scene-stage .bq-brief-student-avatar").length,
      prepOwls: document.querySelectorAll(".bq-character--prep img").length,
      reviewMentors: document.querySelectorAll(".bq-feedback-mentor img").length,
      reportOwls: document.querySelectorAll(".bq-report-assistant img").length,
      resultOwls: document.querySelectorAll(".bq-result-hero img").length,
      ledgerTotal: document.querySelector("[data-exp-ledger-total]")?.getAttribute("data-exp-ledger-total") || "",
      titleCards: document.querySelectorAll(".bq-title-avatar-card img").length,
      overviewOnly: document.querySelectorAll("[data-bq-achievements-overview-only='true']").length,
      unitWallCount: document.querySelectorAll("[data-bq-unit-achievements]").length,
      overviewPanels: document.querySelectorAll("[data-bq-badge-overview='true']").length,
      overviewCards: document.querySelectorAll(".bq-unit-badge-summary").length,
      reloginButtons: [...document.querySelectorAll("button, a")].filter((node) => /重新登入/.test(node.textContent || "")).length,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      text: document.body.textContent
    }), screen);
    assert.equal(metrics.active, screen, `${screen} should expose screen dataset`);
    if (screen === "brief") assert.equal(metrics.briefImages, 1, "brief should show one scene image");
    if (screen === "brief") assert.equal(metrics.briefAvatars, 1, "brief should show one title avatar");
    if (screen === "scan") assert.equal(metrics.prepOwls, 1, "prep should show exactly one owl");
    if (screen === "review") assert.equal(metrics.reviewMentors, 1, "review should show exactly one shared mentor");
    if (screen === "reflection") assert.equal(metrics.reportOwls, 1, "report should show exactly one shared owl");
    if (screen === "result") {
      assert.equal(metrics.resultOwls, 1, "result should show exactly one owl under heading");
      assert.equal(metrics.ledgerTotal, "500", "result should show full EXP ledger total");
      assert.match(metrics.text, /完成 100｜直接答對 220｜提示後修正 0｜回報 40｜精熟 140｜再挑戰 0｜總計 500/);
      assert.ok(metrics.reloginButtons >= 1, "result should expose relogin entry");
    }
    if (screen === "achievements") {
      assert.equal(metrics.titleCards, 1, "achievement should show one title avatar card");
      assert.equal(metrics.overviewOnly, 1, "achievements should use overview-only contract");
      assert.equal(metrics.unitWallCount, 0, "achievement should not render local unit wall");
      assert.equal(metrics.overviewPanels, 1, "achievement should show one whole-book overview panel");
      assert.equal(metrics.overviewCards, 52, "whole-book overview should render 52 summary cards");
      assert.match(metrics.text, /2\/9/, "verified historical badge summary should survive");
      assert.ok(metrics.reloginButtons >= 1, "achievements should expose relogin entry");
    }
    if (screen === "rules") {
      assert.ok(metrics.reloginButtons >= 1, "rules should expose relogin entry after submit");
    }
    assert.equal(metrics.horizontalOverflow, 0, `${screen} should not overflow horizontally`);
    assert.deepEqual(imageErrors, [], `${screen} image 404`);
    assert.deepEqual(consoleErrors, [], `${screen} console errors`);
    assert.deepEqual(pageErrors, [], `${screen} page errors`);
    await context.close();
  }
}

async function assertInactiveSequenceRemoved(browser, baseUrl, viewport) {
  const { context, page, imageErrors, consoleErrors, pageErrors } = await openPage(browser, baseUrl, viewport, stateFor("checkpoint2"));
  const metrics = await page.evaluate(() => ({
    active: document.querySelector("#screen")?.dataset.bioquestScreen,
    questionIds: [...document.querySelectorAll("[data-question-id]")].map((node) => node.getAttribute("data-question-id")),
    sortableItems: document.querySelectorAll(".sortable-item, [data-sequence-id], [data-move], .sequence-move-buttons").length,
    text: document.body.textContent,
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  }));
  assert.equal(metrics.active, "checkpoint2", "checkpoint2 should expose active screen");
  assert.deepEqual(metrics.questionIds, ["q05", "q06", "q08"], "checkpoint2 should render only active direct questions");
  assert.equal(metrics.sortableItems, 0, "inactive q07 sequence UI should not render");
  assert.doesNotMatch(metrics.text, /拖曳排序卡|上移|下移|較合理的思考流程/);
  assert.equal(metrics.horizontalOverflow, 0, "checkpoint2 should not overflow horizontally");
  assert.deepEqual(imageErrors, [], "checkpoint2 image 404");
  assert.deepEqual(consoleErrors, [], "checkpoint2 console errors");
  assert.deepEqual(pageErrors, [], "checkpoint2 page errors");
  await context.close();
}

async function assertLoginBusy(browser, baseUrl) {
  const { context, page } = await openPage(browser, baseUrl, { width: 390, height: 844 }, null);
  await page.addInitScript(() => {});
  await page.evaluate(() => {
    window.__bioquestFetchAudit = [];
    window.fetch = () => {
      const button = document.querySelector("#loginButton");
      const status = document.querySelector("#loginMessage");
      window.__bioquestFetchAudit.push({
        message: status?.textContent || "",
        role: status?.getAttribute("role") || "",
        live: status?.getAttribute("aria-live") || "",
        disabled: Boolean(button?.disabled),
        busy: button?.getAttribute("aria-busy") || "",
        owlCount: document.querySelectorAll(".owl-frame, .mentor-card").length
      });
      return new Promise(() => {});
    };
  });
  await page.locator("#studentIdInput").fill("S70101");
  await page.locator("#loginButton").click();
  await page.waitForFunction(() => window.__bioquestFetchAudit?.length > 0);
  const audit = await page.evaluate(() => window.__bioquestFetchAudit[0]);
  assert.match(audit.message, /正在連接 BioQuest 學習後台/);
  assert.equal(audit.role, "status");
  assert.equal(audit.live, "polite");
  assert.equal(audit.disabled, true);
  assert.equal(audit.busy, "true");
  assert.equal(audit.owlCount, 0, "login should not render unit owl or mentor card");
  await context.close();
}

async function assertGuestLocalSubmit(browser, baseUrl) {
  const guestState = stateFor("reflection", {
    student: { student_id: "guest", student_name: "老師測試帳號", class_name: "測試", seat_no: "00", is_guest: true },
    backend_status: "local_guest",
    submitted_at: null,
    result: null
  });
  const { context, page } = await openPage(browser, baseUrl, { width: 390, height: 844 }, guestState);
  await page.evaluate(() => {
    window.__bioquestBackendActions = [];
    const originalFetch = window.fetch;
    window.fetch = (input, init) => {
      const url = String(input);
      if (url.includes("script.google.com")) window.__bioquestBackendActions.push(url);
      return originalFetch(input, init);
    };
    window.confirm = () => true;
  });
  await page.locator("#studentQuestion").fill("");
  await page.locator("#submitMission").click();
  await page.waitForSelector(".bq-result-hero img");
  const state = await page.evaluate(() => ({
    actions: window.__bioquestBackendActions,
    screen: document.querySelector("#screen")?.dataset.bioquestScreen,
    text: document.body.textContent,
    reloginButtons: [...document.querySelectorAll("button, a")].filter((node) => /重新登入/.test(node.textContent || "")).length
  }));
  assert.deepEqual(state.actions, [], "guest should not call startAttempt, hintEvent, or submitAttempt");
  assert.equal(state.screen, "result");
  assert.match(state.text, /guest 測試：本次預估/);
  assert.match(state.text, /不列入正式累積/);
  assert.ok(state.reloginButtons >= 1, "guest result should show relogin entry");
  await context.close();
}

(async () => {
  const { server, port } = await startServer();
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await assertLoginBusy(browser, baseUrl);
    await assertStaticScreens(browser, baseUrl, { width: 1440, height: 900 });
    await assertStaticScreens(browser, baseUrl, { width: 390, height: 844 });
    await assertInactiveSequenceRemoved(browser, baseUrl, { width: 1440, height: 900 });
    await assertInactiveSequenceRemoved(browser, baseUrl, { width: 390, height: 844 });
    await assertGuestLocalSubmit(browser, baseUrl);
  } finally {
    await browser.close();
    server.close();
  }
  console.log("cell_transport U8 flow contract passed");
})();
