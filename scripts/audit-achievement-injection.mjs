#!/usr/bin/env node
// 跨站成就一致性 2a（前端部分）：把 simulate-achievement-progress.mjs 模擬出的後台登入回應
// 注入各站（Playwright 攔截 Apps Script 請求，不連正式後台），登入後打開「成就」頁，
// 檢查稱號、累積 EXP、完成站數、稱號頭像與全冊徽章總覽是否和後台模擬結果一致。
// 結算頁（需逐站作答到提交）留待下一步。
//
// 用法：
//   BIOQUEST_WORKSPACE=../bioquest-workspace node scripts/audit-achievement-injection.mjs [--units=life_world,scale] [--shots=dir]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";
import { runSimulation, DEFAULT_UNITS, prototypeDirFor } from "./simulate-achievement-progress.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

function contentType(file) {
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" }[path.extname(file).toLowerCase()] || "application/octet-stream";
}

function startServer() {
  const server = http.createServer((req, res) => {
    const clean = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(root, clean);
    if (!file.startsWith(root)) return void (res.writeHead(403), res.end());
    fs.readFile(file, (error, buffer) => {
      if (error) return void (res.writeHead(404), res.end("Not found"));
      res.writeHead(200, { "Content-Type": contentType(file) });
      res.end(buffer);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

const avatarFile = (src) => decodeURIComponent(String(src || "").split("?")[0].split("/").pop());

async function auditUnit(browser, baseUrl, unitId, loginResponse, injectedLogin, startResponse, viewport, shotsDir, notes) {
  const where = `${unitId}@${viewport.width}`;
  const failures = [];
  const fail = (message) => failures.push({ where, message });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  const imageErrors = [];
  const backendActions = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (msg) => { if (msg.type() === "error" && !/Failed to load resource/.test(msg.text())) pageErrors.push(`console: ${msg.text()}`); });
  page.on("response", (res) => { if (res.request().resourceType() === "image" && res.status() >= 400) imageErrors.push(new URL(res.url()).pathname); });
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.route("**/macros/s/**", async (route) => {
    const href = route.request().url();
    const action = new URL(href).searchParams.get("action") || "";
    backendActions.push(action);
    // 登入時各站會先 startAttempt（檢查 verification_mode／token／question_version）；用模擬後台的真實回應
    const body = action === "getStudentAndAttemptStatus" ? injectedLogin : action === "startAttempt" ? startResponse : { ok: false, error: "blocked_in_audit" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  try {
    await page.goto(`${baseUrl}/${prototypeDirFor(unitId)}/index.html`, { waitUntil: "domcontentloaded" });
    const input = page.locator("#studentIdInput, #studentId").first();
    await input.waitFor({ timeout: 8000 });
    await input.fill(loginResponse.student.student_id);
    await page.locator("#loginButton, #loginBtn").first().click();
    const nav = page.locator("[data-nav='achievements']");
    await page.waitForFunction(() => document.querySelector("#screen")?.dataset.bioquestScreen === "brief", null, { timeout: 8000 });
    if (await nav.isDisabled()) {
      // 第 14、15 站：登入後成就頁鎖住，提交後才開放（與第 1–13 站不同）。先檢查簡報頁的稱號與 EXP。
      const p = loginResponse.progress;
      const text = (await page.locator("#screen").textContent()).replace(/\s+/g, " ");
      if (!text.includes("目前稱號")) notes.push({ where, message: "簡報頁沒有稱號／EXP 卡片" });
      else if (!text.includes(p.current_title) || !text.includes(`${p.total_exp} EXP`)) fail(`簡報頁稱號／EXP 與後台不同（後台：${p.current_title} ${p.total_exp} EXP）`);
      if (pageErrors.length) fail(`頁面錯誤：${pageErrors.slice(0, 3).join(" / ")}`);
      notes.push({ where, message: "登入後成就頁鎖住（提交後才開放），與第 1–13 站不同；成就頁留待結算頁階段檢查" });
      return failures;
    }
    await nav.click();
    await page.waitForSelector("[data-bq-badge-overview]", { timeout: 8000 });
    // 讓 lazy 圖片載入
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll("#screen img")) img.loading = "eager";
      await Promise.all([...document.querySelectorAll("#screen img")].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 3000); }))));
    });
    await page.waitForTimeout(150);
    const dom = await page.evaluate(() => {
      const screen = document.querySelector("#screen");
      const avatar = screen.querySelector(".bq-title-avatar-card img, .title-avatar-card.achievements img");
      return {
        text: screen.textContent.replace(/\s+/g, " "),
        avatarSrc: avatar ? (avatar.currentSrc || avatar.src) : "",
        avatarLoaded: avatar ? avatar.complete && avatar.naturalWidth > 0 : false,
        boxes: [...screen.querySelectorAll(".bq-unit-badge-summary")].map((box) => ({
          unit_id: box.dataset.unitId,
          count: box.querySelector(".bq-unit-badge-summary__head span")?.textContent.trim() || "",
          thumbs: box.querySelectorAll("img.bq-unit-badge-thumb").length,
          loaded: [...box.querySelectorAll("img.bq-unit-badge-thumb")].filter((img) => !img.hidden && img.naturalWidth > 0).length,
          missingShown: [...box.querySelectorAll(".bq-unit-badge-missing")].filter((el) => !el.hidden).length,
        })),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    });
    const p = loginResponse.progress;
    if (!dom.text.includes(`${p.total_exp} EXP`)) fail(`成就頁沒有顯示累積 ${p.total_exp} EXP`);
    if (!dom.text.includes(`已完成 ${p.completed_unit_count} 站`)) fail(`成就頁沒有顯示「已完成 ${p.completed_unit_count} 站」`);
    if (!dom.text.includes(p.current_title)) fail(`成就頁沒有顯示稱號「${p.current_title}」`);
    if (p.next_title && !dom.text.includes(`距離「${p.next_title}」還差 ${p.next_title_need_exp} EXP`)) fail(`成就頁下一稱號差距與後台不同（後台：${p.next_title} 差 ${p.next_title_need_exp}）`);
    const gender = /female/.test(loginResponse.student.profile_gender) ? "female" : "male";
    const wantAvatar = `${p.current_title_id}-${gender}.webp`;
    if (!avatarFile(dom.avatarSrc).endsWith(wantAvatar)) fail(`稱號頭像=${avatarFile(dom.avatarSrc) || "（無）"}，預期 …${wantAvatar}`);
    if (!dom.avatarLoaded) fail("稱號頭像圖片沒有載入");
    if (dom.boxes.length !== 52) fail(`全冊總覽有 ${dom.boxes.length} 格，預期 52`);
    const summary = JSON.parse(p.unit_badge_summary_json || "[]");
    for (const unit of summary) {
      const box = dom.boxes.find((b) => b.unit_id === unit.unit_id);
      if (!box) { fail(`總覽缺少 ${unit.unit_id}`); continue; }
      const earned = Number(unit.earned_count || 0);
      if (!box.count.startsWith(`${earned}/`)) fail(`總覽 ${unit.unit_id} 顯示 ${box.count}，後台 earned_count=${earned}`);
      if (box.thumbs !== unit.earned_badges.length) fail(`總覽 ${unit.unit_id} 縮圖 ${box.thumbs} 張，後台 earned_badges ${unit.earned_badges.length} 枚（earned_count=${earned}）`);
      if (box.loaded !== box.thumbs) fail(`總覽 ${unit.unit_id} 有 ${box.thumbs - box.loaded} 張徽章縮圖載入失敗（顯示「待接」）`);
    }
    if (dom.overflow) fail("成就頁有橫向捲動");
    if (pageErrors.length) fail(`頁面錯誤：${pageErrors.slice(0, 3).join(" / ")}`);
    if (imageErrors.length) fail(`圖片 404：${[...new Set(imageErrors)].slice(0, 4).join(", ")}`);
    const unexpected = backendActions.filter((a) => !["getStudentAndAttemptStatus", "startAttempt"].includes(a));
    if (unexpected.length) fail(`成就頁不應呼叫其他後台動作：${unexpected.join(", ")}`);
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${unitId}-${viewport.width}x${viewport.height}.png`), fullPage: true });
  } catch (error) {
    const note = await page.evaluate(() => document.querySelector("#screen")?.textContent.replace(/\s+/g, " ").match(/後台[^。]*。/)?.[0] || "").catch(() => "");
    fail(`流程中斷：${error.message.split("\n")[0]}${note ? `（畫面訊息：${note}）` : ""}`);
  } finally {
    await context.close();
  }
  return failures;
}

// mutateLogin：測試用，只竄改「注入頁面」的登入回應（預期值仍用模擬結果），確認檢查真的抓得到錯誤。
export async function runInjectionAudit({ units = DEFAULT_UNITS, viewports = VIEWPORTS, shotsDir = "", mutateLogin = (r) => r } = {}) {
  const sim = runSimulation({ units });
  if (sim.skipped) return sim;
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
  const { server, port } = await startServer();
  const browser = await playwright.chromium.launch({ headless: true, ...(process.env.BIOQUEST_CHROME_PATH ? { executablePath: process.env.BIOQUEST_CHROME_PATH } : {}) });
  const failures = [];
  const notes = [];
  const checked = [];
  try {
    for (const unitId of units) {
      // 該站最後一次提交後的登入回應 = 學生做完這一站後重新登入看到的累積狀態
      const last = sim.steps.filter((s) => s.unit_id === unitId).pop();
      if (!last) { failures.push({ where: unitId, message: "模擬沒有此站步驟" }); continue; }
      for (const viewport of viewports) {
        failures.push(...(await auditUnit(browser, `http://127.0.0.1:${port}`, unitId, last.login_response_after, mutateLogin(structuredClone(last.login_response_after)), last.start_response, viewport, shotsDir, notes)));
        checked.push(`${unitId}@${viewport.width}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { skipped: false, units, checked, failures, notes, simFailures: sim.failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
  const result = await runInjectionAudit({ units: args.units ? args.units.split(",") : DEFAULT_UNITS, shotsDir: args.shots || "" });
  if (result.skipped) { console.log(`略過：${result.reason}`); process.exit(0); }
  console.log(`檢查 ${result.checked.length} 個（站 × 視窗）`);
  result.notes.forEach((n) => console.log(`備註 [${n.where}] ${n.message}`));
  if (!result.failures.length) { console.log("成就頁顯示與後台模擬全部一致"); process.exit(0); }
  console.log(`\n不一致 ${result.failures.length} 項：`);
  result.failures.forEach((f) => console.log(`- [${f.where}] ${f.message}`));
  process.exit(1);
}
