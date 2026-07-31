const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const defaultRoot = path.resolve(__dirname, "..", "..");
const runningInsidePublish = path.basename(defaultRoot) === "bioquest" && path.basename(path.dirname(defaultRoot)) === "_publish";
const workspaceRoot = runningInsidePublish ? path.resolve(defaultRoot, "..", "..") : defaultRoot;
const publishRoot = runningInsidePublish ? defaultRoot : path.join(workspaceRoot, "_publish", "bioquest");
const artifactDir = path.join(__dirname, "artifacts", "20260731-u7-submitted-retry-ia-v1");
const cache = "20260731-cell-observation-submitted-retry-ia-v1";

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

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function startServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const clean = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const requested = path.resolve(publishRoot, clean || "index.html");
    const withinRoot = requested === publishRoot || requested.startsWith(`${publishRoot}${path.sep}`);
    const file = withinRoot && fs.existsSync(requested) && fs.statSync(requested).isDirectory()
      ? path.join(requested, "index.html")
      : requested;
    if (!withinRoot || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, { "content-type": contentType(file) });
    fs.createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function submittedState(screen, overrides = {}) {
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
    result: baseResult,
    submitted_at: "2026-07-15T01:00:00.000Z",
    lockNotice: "",
    backend_status: "pending_local",
    ...overrides
  };
}

async function visit(browser, url, viewport, state, label) {
  const context = await browser.newContext({ viewport });
  await context.route("https://script.google.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: false, error: "network_regression_no_backend_write" })
  }));
  if (state) {
    await context.addInitScript((payload) => {
      localStorage.setItem("bioquest_cell_observation_state_v1", JSON.stringify(payload));
      localStorage.setItem("bioquest_attempts_v1", JSON.stringify([]));
      localStorage.removeItem("bioquest_pending_backend_queue_v1");
    }, state);
  }
  const page = await context.newPage();
  const image404 = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("response", (response) => {
    if (response.status() >= 400 && response.request().resourceType() === "image") image404.push(response.url());
  });
  page.on("requestfailed", (request) => {
    if (request.resourceType() === "image") image404.push(`${request.url()} :: ${request.failure()?.errorText || "failed"}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#screen[data-bioquest-screen]");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (["login", "brief", "scan", "reflection", "result", "achievements"].includes(state?.screen || "login")) {
    await page.screenshot({ path: path.join(artifactDir, `publish-${viewport.width}-${label}.png`) });
  }
  await context.close();
  return { image404, consoleErrors, pageErrors, overflow, label, viewport: viewport.width };
}

(async () => {
  fs.mkdirSync(artifactDir, { recursive: true });
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const baseUrl = `http://127.0.0.1:${port}/prototype-cell-observation/?v=${cache}`;
    const viewports = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];
    const unsubmittedScreens = ["login", "brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"];
    const checks = [];
    for (const viewport of viewports) {
      for (const screen of unsubmittedScreens) {
        const state = screen === "login" ? null : { ...submittedState(screen), submitted_at: null, result: null, backend_status: "" };
        checks.push(await visit(browser, baseUrl, viewport, state, screen));
      }
      const pendingStudent = { ...baseStudent, student_id: "S70771", student_name: "待確認學生", is_guest: false };
      const verifiedStudent = { ...baseStudent, student_id: "S70772", student_name: "正式學生", is_guest: false };
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
        corrected_after_hint: 0
      };
      const variants = [
        ["guest", submittedState("result")],
        ["pending", submittedState("result", { student: pendingStudent, backend_status: "pending_progress" })],
        ["verified", submittedState("result", { student: verifiedStudent, backend_status: "submitted", result: verifiedResult, cumulative_total_exp: 1400, completed_unit_count: 2 })]
      ];
      for (const [mode, resultState] of variants) {
        checks.push(await visit(browser, baseUrl, viewport, resultState, `result-${mode}`));
        checks.push(await visit(browser, baseUrl, viewport, { ...resultState, screen: "achievements" }, `achievements-${mode}`));
      }
    }
    const image404 = checks.flatMap((check) => check.image404);
    const consoleErrors = checks.flatMap((check) => check.consoleErrors);
    const pageErrors = checks.flatMap((check) => check.pageErrors);
    const overflow = checks.filter((check) => check.overflow > 1);
    assert.deepEqual([...new Set(image404)], [], "U7 publish pages must not request missing images");
    assert.deepEqual(consoleErrors, [], "U7 publish pages should not emit console errors");
    assert.deepEqual(pageErrors, [], "U7 publish pages should not emit page errors");
    assert.deepEqual(overflow, [], "U7 publish pages should not overflow horizontally");
  } finally {
    await browser.close();
    server.close();
  }
  console.log("cell_observation publish network regression passed");
})();
