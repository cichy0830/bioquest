#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    await page.addInitScript(() => { window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, student: { student_id: "guest", student_name: "老師測試帳號" } }) }); });
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260714-plant-transport-structures-v1`);
    await page.locator("#guestBtn").click();
    await page.locator('[data-next="scan"]').click();
    const prep = page.locator(".prep-owl-hero");
    assert.equal(await prep.count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.ok(await page.locator('[data-question-id="q03"] select').count() === 3, "mapping rows missing");
    assert.ok(await page.locator('[data-question-id="q09"]').count() === 0, "checkpoint routing leaked later question");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const answers = {};
      for (const question of api.questions) {
        if (question.type === "choice") answers[question.id] = question.answer;
        if (question.type === "mapping") answers[question.id] = question.answer;
        if (question.type === "sequence") answers[`${question.id}_sequence`] = question.answer;
      }
      api.setState({
        ...api.createEmptyState(),
        screen: "review",
        student: { student_id: "guest", student_name: "老師測試帳號", is_guest: true },
        attempt_id: "layout_guest",
        attempt_session_token: "guest",
        question_version: api.VERSION,
        answers,
        reflection: { question: "我想確認木質部和韌皮部的運輸差異。" }
      });
      api.renderApp();
    });
    assert.equal(await page.locator(".bq-feedback-mentor img:visible").count(), 1, "review shared mentor should be visible exactly once");
    assert.equal(await page.locator(".mentor-card img:visible").count(), 0, "legacy review mentor should be removed");
    assert.equal(await page.locator("body").evaluate((body) => body.textContent.includes("養分轉運線索") || body.textContent.includes("進入血液")), false, "human nutrition copy leaked into U16");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const current = api.state();
      api.setState({ ...current, screen: "reflection" });
      api.renderApp();
    });
    assert.equal(await page.locator(".bq-report-assistant img:visible").count(), 1, "reflection report owl should be visible exactly once");
    assert.equal(await page.locator(".owl-panel.bq-report-assistant:visible").count(), 0, "legacy local report owl should be removed");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const current = api.state();
      api.setState({ ...current, screen: "achievements", result: api.scoreAttempt() });
      api.renderApp();
    });
    assert.equal(await page.locator(".title-card:visible").count(), 0, "legacy title card should be removed");
    assert.equal(await page.locator(".bq-title-avatar-card img:visible").count(), 1, "achievement title avatar should be visible exactly once");
    assert.equal(await page.locator("[data-bq-badge-overview]").count(), 1, "badge overview should be injected exactly once");
    assert.equal(await page.locator(".bq-unit-badge-summary").count(), 52, "badge overview should keep 52 unit summary cards");
    await page.close();
  }
} finally { await browser.close(); }
console.log("plant transport layout regression passed");
