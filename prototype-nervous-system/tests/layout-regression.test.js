#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.BIOQUEST_AUDIT_ROOT
  ? path.resolve(process.env.BIOQUEST_AUDIT_ROOT, "prototype-nervous-system")
  : sourceRoot;
const Q = (n) => `nervous_system_q${String(n).padStart(2, "0")}`;
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

async function answerChoice(page, qid, value) {
  await page.locator(`[data-answer="${qid}"][data-value="${value}"]`).click();
}

async function answerMapping(page, qid, mapping) {
  for (const [item, value] of Object.entries(mapping)) {
    await page.locator(`select[data-map-question="${qid}"][data-map-item="${item}"]`).selectOption(value);
  }
}

async function orderSequence(page, qid, correctOrder) {
  for (let targetIndex = 0; targetIndex < correctOrder.length; targetIndex += 1) {
    const itemId = correctOrder[targetIndex];
    for (;;) {
      const current = await page.locator(`[data-sequence="${qid}"] [data-sequence-item]`).evaluateAll((items) => items.map((item) => item.dataset.sequenceItem));
      const currentIndex = current.indexOf(itemId);
      if (currentIndex <= targetIndex) break;
      await page.locator(`[data-move="${qid}"][data-item="${itemId}"][data-dir="-1"]`).click();
    }
  }
}

try {
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
    page.on("dialog", (dialog) => dialog.accept());
    await page.addInitScript(() => {
      window.__backendActions = [];
      window.fetch = async (url, options = {}) => {
        let action = "";
        try {
          action = new URL(url).searchParams.get("action") || "";
        } catch {}
        try {
          const body = options.body ? JSON.parse(options.body) : {};
          action = body.action || action;
        } catch {}
        if (action) window.__backendActions.push(action);
        return { ok: true, json: async () => ({ ok: true, student: { student_id: "guest", student_name: "老師測試帳號" } }) };
      };
    });
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260813-nervous-system-mapping-v1`);
    await page.locator("#guestBtn").click();
    await page.locator('[data-next="scan"]').click();
    assert.equal(await page.locator(".prep-owl-hero").count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow on prep");
    await page.locator('[data-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-sequence="${Q(8)}"] [data-sequence-item]`).count(), 0, "sequence should not appear in checkpoint1");
    assert.equal(await page.locator(`[data-question-id="${Q(9)}"]`).count(), 0, "checkpoint routing leaked later question");
    await answerChoice(page, Q(1), "neuron_transmits_messages");
    await answerChoice(page, Q(2), "neuron_cell_nerve_bundle");
    await answerMapping(page, Q(3), { brain: "central", spinal_cord: "central", arm_nerve: "peripheral", leg_nerve: "peripheral" });
    await answerChoice(page, Q(4), "peripheral_nerves_connect_body_cns");
    await page.locator('[data-section-next="checkpoint1"]').click();
    assert.equal(await page.locator(`[data-sequence="${Q(8)}"] [data-sequence-item]`).count(), 5, "nervous-system sequence cards missing");
    await answerChoice(page, Q(5), "sensory_neuron_to_cns");
    await answerChoice(page, Q(6), "motor_neuron_to_effector");
    await answerMapping(page, Q(7), { sensory: "to_cns", interneuron: "inside_cns", motor: "to_effector" });
    await orderSequence(page, Q(8), ["skin_receptor", "sensory_to_spinal", "interneuron_spinal", "motor_to_muscle", "muscle_contract"]);
    await page.locator('[data-section-next="checkpoint2"]').click();
    await answerChoice(page, Q(9), "reflex_still_nervous_system");
    await answerChoice(page, Q(10), "spinal_cord_cns_reflex");
    await answerChoice(page, Q(11), "skull_protects_brain");
    await answerChoice(page, Q(12), "brain_awareness_after_reflex");
    await answerMapping(page, Q(13), { to_cns: "sensory", inside_spinal: "interneuron", to_muscle: "motor", muscle_contract: "effector" });
    await answerChoice(page, Q(14), "nervous_system_more_than_brain");
    await page.locator('[data-section-next="checkpoint3"]').click();
    await page.locator('[data-next="reflection"]').click();
    assert.equal(await page.locator(".bq-report-assistant").count(), 1, "report owl should be exactly one");
    await page.locator("#submitMission").click();
    await page.locator(".result-panel").waitFor();
    assert(await page.locator(".result-panel").textContent().then((text) => text.includes("460 / 500 EXP")), "blank reflection guest result should be 460/500");
    assert.equal(await page.locator(".result-panel [data-relogin]").count(), 1, "result relogin entry missing");
    assert(await page.locator(".result-stack").textContent().then((text) => text.includes("本次取得徽章")), "result should label earned-only badges");
    assert.equal(await page.locator(".result-stack .badge-visual img").count(), 0, "U21 has no ready badges and result must not render pending images");
    assert.equal(await page.evaluate(() => window.__backendActions.length), 0, "guest flow must not call backend");
    await page.locator('[data-next="achievements"]').click();
    await page.locator(".achievements-stack").waitFor();
    assert.equal(await page.locator(".achievements-stack [data-bq-unit-achievements]").count(), 0, "achievements must not render unit badge wall");
    assert.equal(await page.locator(".achievements-stack [data-relogin]").count(), 1, "achievements relogin entry missing");
    assert.equal(await page.locator(".title-card, .bq-title-avatar-card").count(), 1, "shared title card should be exactly one");
    assert.equal(await page.locator(".bq-all-unit-badge-overview").count(), 1, "whole-book overview missing");
    assert.equal(await page.locator(".bq-unit-badge-summary").count(), 52, "whole-book overview should include 52 unit summaries");
    const order = await page.evaluate(() => {
      const titleCard = document.querySelector(".title-card, .bq-title-avatar-card");
      const overview = document.querySelector(".bq-all-unit-badge-overview");
      const follows = (first, second) => Boolean(first && second && (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING));
      return {
        titleBeforeOverview: follows(titleCard, overview)
      };
    });
    assert(order.titleBeforeOverview, "achievement order must be title progress before overview");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "achievement horizontal overflow");
    await page.locator('[data-nav="rules"]').click();
    await page.locator(".rule-list").waitFor();
    assert.equal(await page.locator('[data-relogin]').count(), 1, "rules relogin entry missing");
    await page.locator('[data-next="result"]').click();
    await page.locator(".result-panel").waitFor();
    await page.locator('[data-nav="login"]').click();
    await page.locator("#guestBtn").waitFor();
    const resetState = await page.evaluate(() => ({
      screen: window.__nervous_systemTest.state().screen,
      student: window.__nervous_systemTest.state().student,
      attemptId: window.__nervous_systemTest.state().attempt_id,
      submitted: window.__nervous_systemTest.state().submitted,
      attempts: window.__nervous_systemTest.loadAttempts().length,
      backendActions: window.__backendActions
    }));
    assert.equal(resetState.screen, "login", "relogin reset should return to login");
    assert.equal(resetState.student, null, "relogin reset should clear current student");
    assert.equal(resetState.attemptId, "", "relogin reset should clear current attempt");
    assert.equal(resetState.submitted, false, "relogin reset should clear submitted state");
    assert.equal(resetState.attempts, 1, "attempt history should be preserved");
    assert.deepEqual(resetState.backendActions, [], "guest retry/reset must not write backend actions");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "login horizontal overflow after reset");
    assert.deepEqual(failedImages, [], "image requests should not fail");
    assert.deepEqual(consoleErrors, [], "console/page errors during full flow");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log("nervous system full-flow layout regression passed");
