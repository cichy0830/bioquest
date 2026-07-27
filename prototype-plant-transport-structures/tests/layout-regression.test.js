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
    await page.addInitScript(() => {
      window.__backendActions = [];
      window.fetch = async (url, options = {}) => {
        let action = "";
        try {
          if (options.body) action = JSON.parse(options.body).action || "";
          else action = new URL(url).searchParams.get("action") || "";
        } catch (error) {
          action = String(url);
        }
        window.__backendActions.push(action);
        return { ok: true, json: async () => ({ ok: true, student: { student_id: "guest", student_name: "老師測試帳號" } }) };
      };
    });
    await page.goto(`${pathToFileURL(path.join(root, "index.html")).href}?v=20260727-plant-transport-structures-relogin-v1`);
    await page.evaluate(() => document.querySelector("#guestBtn")?.click());
    await page.waitForFunction(() => window.__plant_transport_structuresTest.state().screen === "brief");
    await page.evaluate(() => window.scrollTo(0, 520));
    await page.locator('[data-next="scan"]').click();
    await page.waitForFunction(() => window.scrollY === 0);
    const prep = page.locator(".prep-owl-hero");
    assert.equal(await prep.count(), 1, "prep owl hero missing");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "horizontal overflow");
    await page.evaluate(() => window.scrollTo(0, 520));
    await page.locator('[data-next="checkpoint1"]').click();
    await page.waitForFunction(() => window.scrollY === 0);
    assert.equal(await page.locator('[data-question-id="q03"] select').count(), 0, "q03 legacy mapping select should be removed");
    assert.equal(await page.locator('[data-question-id="q03"] [data-answer="q03"]').count(), 4, "q03 should render four choice options");
    assert.ok(await page.locator('[data-question-id="q09"]').count() === 0, "checkpoint routing leaked later question");
    const backgroundProbe = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const before = getComputedStyle(document.body, "::before");
      const panel = getComputedStyle(document.querySelector(".question-card"));
      return {
        bodyImage: body.backgroundImage,
        image: before.backgroundImage,
        opacity: Number(before.opacity),
        panelBackground: panel.backgroundColor,
        evidenceAsBackground: body.backgroundImage.includes("plant-transport-structures-evidence-overview") || before.backgroundImage.includes("plant-transport-structures-evidence-overview")
      };
    });
    assert.equal(backgroundProbe.evidenceAsBackground, false, "evidence overview must not be used as checkpoint background");
    assert.ok(backgroundProbe.bodyImage.includes("plant-transport-structures-ambient-background-neutral"), "approved neutral background asset missing");
    assert.ok(backgroundProbe.image.includes("linear-gradient") || backgroundProbe.image.includes("repeating-linear-gradient"), "ambient background layer missing");
    assert.ok(backgroundProbe.opacity > 0.4, "ambient background layer should be visible");
    assert.ok(backgroundProbe.panelBackground.includes("rgba"), "question cards should keep a readable translucent surface");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const badBadgePath = api.badges.find((badge) => {
        const expected = `../shared-assets/badges/plant_transport_structures/badge-plant_transport_structures-${badge.id}.webp?v=${api.VERSION}`;
        return badge.badge_image_path !== expected || badge.badge_image_path.includes("badge-plant-transport-structures-");
      });
      if (badBadgePath) throw new Error(`invalid badge path: ${badBadgePath.id}`);
      const answers = {};
      for (const question of api.directQuestions) {
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
        question_version: api.QUESTION_VERSION,
        answers,
        reflection: { question: "我想確認木質部和韌皮部的運輸差異。" }
      });
      api.renderApp();
    });
    assert.equal(await page.locator(".bq-feedback-mentor img:visible").count(), 1, "review shared mentor should be visible exactly once");
    assert.equal(await page.locator(".mentor-card img:visible").count(), 0, "legacy review mentor should be removed");
    assert.equal(await page.locator("body").evaluate((body) => body.textContent.includes("養分轉運線索") || body.textContent.includes("進入血液")), false, "human nutrition copy leaked into U16");
    for (const mode of ["guest", "pending", "verified"]) {
      await page.evaluate((modeName) => {
        const api = window.__plant_transport_structuresTest;
        const current = api.state();
        const result = api.scoreAttempt();
        api.setState({
          ...current,
          screen: "result",
          student: modeName === "guest"
            ? { student_id: "guest", student_name: "老師測試帳號", is_guest: true }
            : { student_id: "S99999", student_name: "測試學生", is_guest: false },
          result: {
            ...result,
            verification_status: modeName === "verified" ? "server_verified" : (modeName === "guest" ? "local_guest" : "pending_backend"),
            attempt_exp: 500,
            unit_credited_exp: modeName === "verified" ? 500 : 0,
            exp_delta: modeName === "verified" ? 500 : 0
          }
        });
        api.renderApp();
      }, mode);
      const text = await page.locator("body").innerText();
      if (mode === "verified") {
        assert.ok(text.includes("正式認列總計"), "verified result should show formal total");
        assert.ok(text.includes("本單元正式認列"), "verified result should show formal credit label");
      } else {
        assert.ok(text.includes("本次預估明細總計"), `${mode} result should show estimated ledger total`);
        assert.ok(text.includes("正式認列／累積增量"), `${mode} result should show formal delta zero row`);
        assert.equal(text.includes("本單元認列"), false, `${mode} result should not show formal recognized copy`);
      }
    }
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const current = api.state();
      api.setState({ ...current, screen: "checkpoint3" });
      api.renderApp();
    });
    assert.equal(await page.locator('[data-question-id="q12"]').count(), 0, "q12 extension should not be active checkpoint content");
    assert.equal(await page.locator('[data-question-id="q09"] .evidence-card').count(), 0, "q09 should not show a text evidence card");
    assert.equal(await page.locator('[data-question-id="q11"] .evidence-card').count(), 0, "q11 should not show the legacy text evidence card");
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
    assert.equal(await page.locator('[data-bq-unit-achievements="plant_transport_structures"]').count(), 0, "achievements should not duplicate unit badge wall");
    assert.equal(await page.locator(".bq-title-avatar-card img:visible").count(), 1, "achievement title avatar should be visible exactly once");
    assert.equal(await page.locator("[data-bq-badge-overview]").count(), 1, "badge overview should be injected exactly once");
    assert.equal(await page.locator(".bq-unit-badge-summary").count(), 52, "badge overview should keep 52 unit summary cards");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const current = api.state();
      localStorage.setItem("bioquest_attempts_v1", JSON.stringify([{ attempt_id: "history_attempt", unit_id: "plant_transport_structures" }]));
      api.setState({
        ...current,
        screen: "rules",
        submitted: true,
        student: {
          student_id: "S99999",
          student_name: "測試學生",
          is_guest: false,
          progress: {
            total_exp: 3880,
            current_title_id: "concept_solver",
            unit_badge_summary_json: JSON.stringify([{ unit_id: "cell_basic_unit", earned_count: 6, total_count: 8 }])
          }
        },
        result: { ...api.scoreAttempt(), verification_status: "server_verified", unit_credited_exp: 500, exp_delta: 500 },
        completedScreens: ["login", "result", "achievements", "rules"]
      });
      api.renderApp({ resetScroll: true });
    });
    assert.equal(await page.locator('[data-relogin="true"]').count(), 1, "submitted rules should offer relogin");
    await page.locator('[data-next="result"]').click();
    await page.locator(".result-panel").waitFor();
    assert.equal(await page.locator(".result-panel").count(), 1, "submitted rules back should return to result");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const current = api.state();
      api.setState({ ...current, screen: "achievements" });
      api.renderApp({ resetScroll: true });
    });
    assert.equal(await page.locator('[data-relogin="true"]').count(), 1, "submitted achievements should offer relogin");
    await page.evaluate(() => window.scrollTo(0, 520));
    await page.locator('[data-nav="login"]').click();
    await page.locator("#studentId").waitFor();
    await page.waitForFunction(() => window.scrollY === 0);
    const resetProbe = await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      return {
        screen: api.state().screen,
        student: api.state().student,
        attempt_id: api.state().attempt_id,
        submitted: api.state().submitted,
        attempts: api.loadAttempts().length,
        snapshotStudent: api.loadVerifiedSnapshot()?.student_id,
        snapshotExp: api.loadVerifiedSnapshot()?.progress?.total_exp,
        backendActions: window.__backendActions
      };
    });
    assert.equal(resetProbe.screen, "login", "sidebar login should reset to login");
    assert.equal(resetProbe.student, null, "relogin should clear current student");
    assert.equal(resetProbe.attempt_id, "", "relogin should clear current attempt");
    assert.equal(resetProbe.submitted, false, "relogin should clear submitted state");
    assert.equal(resetProbe.attempts, 1, "relogin should preserve attempts history");
    assert.equal(resetProbe.snapshotStudent, "S99999", "relogin should preserve verified progress snapshot");
    assert.equal(resetProbe.snapshotExp, 3880, "relogin should preserve verified EXP snapshot");
    assert.deepEqual(resetProbe.backendActions, [], "relogin reset should not call backend");
    await page.evaluate(() => document.querySelector("#guestBtn")?.click());
    await page.waitForFunction(() => window.__plant_transport_structuresTest.state().screen === "brief");
    const guestProbe = await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      return {
        screen: api.state().screen,
        guest: api.state().student?.is_guest,
        attempt_id: api.state().attempt_id,
        backendActions: window.__backendActions
      };
    });
    assert.equal(guestProbe.screen, "brief", "guest relogin should start a fresh local attempt");
    assert.equal(guestProbe.guest, true, "guest relogin should stay local");
    assert.ok(guestProbe.attempt_id.startsWith("plant_transport_structures_guest_attempt"), "guest relogin should create a fresh local attempt id");
    assert.deepEqual(guestProbe.backendActions, [], "guest relogin should not call backend");
    await page.evaluate(() => {
      const api = window.__plant_transport_structuresTest;
      const current = api.state();
      api.setState({
        ...current,
        screen: "result",
        result: { ...api.scoreAttempt(), earned_badges: ["plant_transport_structures_entry", "vascular_bundle_mapper"], verification_status: "local_guest" }
      });
      api.renderApp();
    });
    const deprecatedPendingText = "\u5fbd\u7ae0\u7d20\u6750" + "\u5f85\u63a5";
    const deprecatedApprovalCopy = "\u6b63\u5f0f\u5716\u6838\u51c6\u5f8c" + "\u624d\u6703\u986f\u793a\u5716\u50cf";
    assert.equal(await page.locator(".badge-wall img").count(), 2, "all earned badges with approved images should be requested");
    assert.equal(await page.locator(".pending-earned-summary").count(), 0, "approved badges should not use pending earned summary");
    assert.equal(await page.locator("body").evaluate((body, text) => body.innerText.includes(text), deprecatedPendingText), false, "result should not show deprecated pending asset text");
    assert.equal(await page.locator("body").evaluate((body, text) => body.innerText.includes(text), deprecatedApprovalCopy), false, "result should not show pending asset approval copy after wiring");
    await page.close();
  }
} finally { await browser.close(); }
console.log("plant transport layout regression passed");
