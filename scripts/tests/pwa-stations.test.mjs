// ROADMAP R2 加到主畫面（第二批）：各站各自一個主畫面圖示（佇列 W16 選項 A）。
// 靜態：每個 ready 站都有自己的 manifest（範圍＝該站資料夾、開啟該站），index.html 已載入 manifest 與 bioquest-pwa.js。
// 瀏覽器：直接開站（不經入口頁）也會註冊 service worker；後台請求照常送出（Playwright 攔截有效）；離線可重開已開過的站。
// 瀏覽器對外連線由 run-tests.mjs 阻擋；這裡的 Apps Script 請求也全部由 Playwright 攔截。
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";
import { manifestFor, pwaVersion, shortNameFor, stationTargets } from "../build-station-pwa.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ---- 靜態檢查 ----
const check = spawnSync(process.execPath, [path.join(root, "scripts/build-station-pwa.mjs"), "--check"], { cwd: root, encoding: "utf8" });
assert.equal(check.status, 0, `各站 manifest／index.html 與產生結果不一致：\n${check.stderr}`);

const targets = stationTargets();
const sequences = targets.map((unit) => unit.sequence);
for (const n of Array.from({ length: 26 }, (_, i) => i + 1)) assert.ok(sequences.includes(n), `第 ${n} 站應有主畫面圖示設定`);
assert.equal(new Set(targets.map((unit) => unit.folder)).size, targets.length, "站資料夾不可重複");

const version = pwaVersion();
for (const unit of targets) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, unit.folder, "manifest.webmanifest"), "utf8"));
  assert.deepEqual(manifest, manifestFor(unit));
  assert.equal(manifest.start_url, "./", `${unit.folder} 主畫面圖示要開該站`);
  assert.equal(manifest.scope, "./");
  assert.ok(manifest.name.includes(`第 ${unit.sequence} 站`) && manifest.name.includes(unit.title));
  assert.ok(manifest.short_name.length <= 12, `${unit.folder} short_name 太長`);
  assert.equal(manifest.short_name, shortNameFor(unit));
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("../shared-assets/pwa/"), icon.src);
    assert.ok(fs.existsSync(path.join(root, unit.folder, icon.src)), `${unit.folder} 圖示不存在：${icon.src}`);
  }
  const html = fs.readFileSync(path.join(root, unit.folder, "index.html"), "utf8");
  assert.equal((html.match(/<link rel="manifest"/g) || []).length, 1, `${unit.folder} 只能有一個 manifest`);
  assert.ok(html.includes('<link rel="manifest" href="manifest.webmanifest">'));
  assert.ok(html.includes('<link rel="apple-touch-icon" href="../shared-assets/pwa/apple-touch-icon-180.png">'));
  assert.ok(html.includes(`<meta name="apple-mobile-web-app-title" content="${manifest.short_name}">`));
  assert.equal((html.match(/bioquest-pwa\.js/g) || []).length, 1, `${unit.folder} 應載入一次 bioquest-pwa.js`);
  assert.ok(html.includes(`../shared-assets/bioquest-pwa.js?v=${version}`), `${unit.folder} bioquest-pwa.js 版本不符`);
  // pwa 腳本放在 app.js 之後，不影響各站原本的載入順序
  assert.ok(html.indexOf("bioquest-pwa.js") > html.lastIndexOf("app.js?v="), `${unit.folder} bioquest-pwa.js 應在 app.js 之後`);
}

// ---- 瀏覽器檢查（抽三站：第 1、13、26 站）----
let offline = false;
function contentType(file) {
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" }[path.extname(file).toLowerCase()] || "application/octet-stream";
}
const server = http.createServer((req, res) => {
  if (offline) return void req.socket.destroy();
  let clean = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname).replace(/^\/+/, "");
  if (clean === "" || clean.endsWith("/")) clean += "index.html";
  const file = path.resolve(root, clean);
  if (!file.startsWith(root)) return void (res.writeHead(403), res.end());
  fs.readFile(file, (error, buffer) => {
    if (error) return void (res.writeHead(404), res.end("Not found"));
    res.writeHead(200, { "Content-Type": contentType(file) });
    res.end(buffer);
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const sample = ["prototype-life-world", "prototype-enzymes", "prototype-temperature-glucose-homeostasis"].map((folder) => targets.find((unit) => unit.folder === folder));
assert.ok(sample.every(Boolean));

const browser = await playwright.chromium.launch({ headless: true, ...(process.env.BIOQUEST_CHROME_PATH ? { executablePath: process.env.BIOQUEST_CHROME_PATH } : {}) });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    for (const unit of sample) {
      offline = false;
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`); });
      const backendHits = [];
      await context.route(/script\.google\.com/, (route) => {
        backendHits.push(route.request().url());
        route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
      });

      const stationUrl = `${base}${unit.folder}/`;
      await page.goto(`${stationUrl}?v=direct-link`, { waitUntil: "load" });
      await page.waitForFunction(() => window.BioQuestPwa && window.BioQuestPwa.registered, null, { timeout: 15000 });
      assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope), base, "service worker 範圍應為整個網站");
      await page.reload({ waitUntil: "load" });
      assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true, `${unit.folder} 重新整理後應由 service worker 接管`);

      // 瀏覽器讀到的是該站自己的 manifest，主畫面圖示開該站
      const manifestHref = await page.evaluate(() => document.querySelector('link[rel="manifest"]').href);
      assert.equal(manifestHref, `${stationUrl}manifest.webmanifest`);
      const fetched = await page.evaluate(async (href) => (await fetch(href)).json(), manifestHref);
      assert.equal(new URL(fetched.start_url, manifestHref).href, stationUrl);
      assert.equal(new URL(fetched.scope, manifestHref).href, stationUrl);
      for (const icon of fetched.icons) {
        const status = await page.evaluate(async (href) => (await fetch(href)).status, new URL(icon.src, manifestHref).href);
        assert.equal(status, 200, `${icon.src} 讀不到`);
      }

      // 站頁照常：登入頁在、後台請求每次都真的送出（不被快取）
      assert.ok(await page.locator("[data-nav='login']").count(), `${unit.folder} 登入頁應正常顯示`);
      for (let i = 0; i < 2; i += 1) {
        const body = await page.evaluate(async () => (await fetch("https://script.google.com/macros/s/test/exec?action=ping")).text());
        assert.equal(body, '{"ok":true}');
      }
      assert.equal(backendHits.length, 2, "後台請求每次都要送到網路（不可被快取）");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(scrollWidth <= viewport.width, `${unit.folder} ${viewport.width} 寬出現橫向捲動（${scrollWidth}）`);

      // 離線：開過的站可從主畫面（start_url，不帶 ?v=）重開
      offline = true;
      await page.goto(stationUrl, { waitUntil: "load" });
      assert.ok(await page.locator("[data-nav='login']").count(), `${unit.folder} 離線時應能重開`);
      assert.equal(await page.evaluate(() => typeof window.BioQuestPwa), "object");
      offline = false;

      const unexpected = errors.filter((e) => !/Failed to load resource|ERR_CONNECTION|ERR_FAILED|net::/.test(e));
      assert.deepEqual(unexpected, [], `${unit.folder} 出現錯誤：\n${unexpected.join("\n")}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`pwa stations test passed（${targets.length} 站）`);
