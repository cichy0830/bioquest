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
    await page.close();
  }
} finally { await browser.close(); }
console.log("plant transport layout regression passed");
