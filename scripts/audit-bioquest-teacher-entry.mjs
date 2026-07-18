#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = [repoRoot, path.join(repoRoot, "_publish/bioquest")].filter((root) => fs.existsSync(path.join(root, "index.html")));
const VERSION = "20260718-teacher-entry-v1";

function read(root, file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

for (const root of roots) {
  const index = read(root, "index.html");
  assert(index.includes(`teacher-dashboard-prototype/?v=${VERSION}`), `${root}: teacher dashboard link missing`);
  assert(!/teacher_key|TEACHER_DASHBOARD_KEY|dashboard_key/i.test(index), `${root}: teacher key leaked in portal`);
  const portalCss = read(root, "portal.css");
  assert(portalCss.includes(".teacher-entry"), `${root}: teacher entry styles missing`);
  const dashboardIndex = read(root, "teacher-dashboard-prototype/index.html");
  assert(dashboardIndex.includes(`app.js?v=${VERSION}`), `${root}: dashboard app cache not updated`);
  assert(dashboardIndex.includes(`styles.css?v=${VERSION}`), `${root}: dashboard css cache not updated`);
  const dashboardApp = read(root, "teacher-dashboard-prototype/app.js");
  assert(dashboardApp.includes('DASHBOARD_SCHEMA = "teacher_dashboard_v3"'), `${root}: dashboard schema guard missing`);
  assert(dashboardApp.includes("dashboard_deployment_outdated"), `${root}: outdated deployment branch missing`);
  assert(dashboardApp.includes("API StudentProgress"), `${root}: StudentProgress count not shown`);
  assert(dashboardApp.includes("API TeacherReview"), `${root}: TeacherReview count not shown`);
}

const samplePayload = {
  ok: true,
  schema_version: "teacher_dashboard_v3",
  data_source: "google_sheet",
  generated_at: "2026-07-18T08:00:00.000Z",
  source_counts: { students: 1, attempts: 1, question_logs: 1, student_progress: 1, teacher_reviews: 1 },
  canonical_unit_ids: ["cell_basic_unit"],
  students: [{ student_id: "S_TEST", class_name: "701", seat_no: "01", student_name: "測試學生", active: "TRUE" }],
  attempts: [{
    attempt_id: "a1",
    student_id: "S_TEST",
    student_name: "測試學生",
    class_name: "701",
    seat_no: "01",
    unit_id: "cell_basic_unit",
    unit_title: "生物體的基本單位",
    submitted_at: "2026-07-18T08:01:00.000Z",
    completion_status: "complete",
    verification_status: "server_verified",
    accuracy: 1,
    correct_without_hint: 14,
    corrected_after_hint: 0,
    confidence_score: 5,
    unit_credited_exp: 500,
    student_question: "細胞為什麼是基本單位？"
  }],
  question_logs: [{
    attempt_id: "a1",
    student_id: "S_TEST",
    unit_id: "cell_basic_unit",
    question_id: "cell_basic_unit_q01",
    question_type: "choice",
    skill_tag: "cell_as_basic_unit",
    is_correct: true,
    answer_json: '"basic"'
  }],
  student_progress: [{ student_id: "S_TEST", total_exp: 500, completed_unit_count: 1, current_title: "生命觀察員" }],
  teacher_reviews: [{ review_id: "r1", attempt_id: "a1", student_id: "S_TEST", student_name: "測試學生", class_name: "701", unit_id: "cell_basic_unit", issue_type: "reflection_review", priority: "normal", student_question: "細胞為什麼是基本單位？", review_status: "pending" }],
  warnings: []
};

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  for (const root of roots) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];
      const failedImages = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("requestfailed", (request) => {
        if (/\.(png|jpe?g|webp|svg)(\?|$)/i.test(request.url())) failedImages.push(request.url());
      });

      await page.goto(pathToFileURL(path.join(root, "index.html")).href);
      const teacherLink = page.locator('.teacher-entry a[href^="teacher-dashboard-prototype/"]');
      await expectVisible(teacherLink, `${root}: teacher link not visible at ${viewport.width}`);
      const href = await teacherLink.getAttribute("href");
      assert.equal(href, `teacher-dashboard-prototype/?v=${VERSION}`);
      assert(!href.includes("key"), `${root}: teacher key in href`);

      await page.goto(pathToFileURL(path.join(root, "teacher-dashboard-prototype/index.html")).href);
      await page.route("https://script.google.com/**", async (route) => {
        const url = new URL(route.request().url());
        const key = url.searchParams.get("teacher_key");
        if (key !== "valid-key") {
          await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: false, error: "teacher_dashboard_unauthorized" }) });
          return;
        }
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(samplePayload) });
      });

      await page.locator("#teacherKey").fill("wrong-key");
      await page.locator("#loadDashboard").click();
      await page.locator("#accessStatus.status-box.error").waitFor();
      const deniedText = await page.locator("body").textContent();
      assert(deniedText.includes("存取碼不正確"), `${root}: unauthorized message missing`);
      assert(!deniedText.includes("測試學生"), `${root}: unauthorized dashboard leaked student data`);

      await page.locator("#teacherKey").fill("valid-key");
      await page.locator("#loadDashboard").click();
      await page.locator(".source-audit").waitFor();
      const bodyText = await page.locator("body").textContent();
      for (const expected of ["Google Sheet / Apps Script", "API Attempts", "API QuestionLogs", "API StudentProgress", "API TeacherReview", "已有學生作答寫入"]) {
        assert(bodyText.includes(expected), `${root}: missing dashboard source text ${expected}`);
      }
      assert.equal(await page.evaluate(() => Object.keys(localStorage).length), 0, `${root}: dashboard stored teacher key or state`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${root}: horizontal overflow at ${viewport.width}`);
      assert.deepEqual(failedImages, [], `${root}: failed image requests`);
      assert.deepEqual(consoleErrors, [], `${root}: console errors`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}

async function expectVisible(locator, message) {
  assert.equal(await locator.count(), 1, message);
  assert.equal(await locator.first().isVisible(), true, message);
}

console.log("teacher entry and dashboard source audit passed");
