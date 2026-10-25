// ROADMAP R2 加到主畫面：manifest、圖示、service worker。
// 用本機 server 開入口頁，檢查 service worker 註冊與接管、外部（Apps Script）請求不經快取、離線可重開入口頁。
// 瀏覽器對外連線由 run-tests.mjs 阻擋；這裡的 Apps Script 請求也全部由 Playwright 攔截。
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import playwright from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ---- 靜態檢查：manifest 與圖示 ----
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
assert.equal(manifest.name, "生命祕境 BioQuest");
assert.ok(manifest.short_name && manifest.short_name.length <= 12, "short_name 要短，主畫面才不會被截斷");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);

function pngSize(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf.subarray(1, 4).toString("latin1"), "PNG", `${file} 應為 PNG`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
const needed = new Set(["192x192/any", "512x512/any", "512x512/maskable"]);
for (const icon of manifest.icons) {
  assert.ok(!/^\/|^https?:/.test(icon.src), `圖示路徑要用相對路徑（GitHub Pages 在子目錄）：${icon.src}`);
  const { width, height } = pngSize(path.join(root, icon.src));
  assert.equal(`${width}x${height}`, icon.sizes, `${icon.src} 實際尺寸與 manifest 不符`);
  needed.delete(`${icon.sizes}/${icon.purpose || "any"}`);
}
assert.deepEqual([...needed], [], "manifest 缺少必要圖示");
assert.deepEqual(pngSize(path.join(root, "shared-assets/pwa/apple-touch-icon-180.png")), { width: 180, height: 180 });

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.match(indexHtml, /<link rel="manifest" href="manifest\.webmanifest">/);
assert.match(indexHtml, /<link rel="apple-touch-icon" href="shared-assets\/pwa\/apple-touch-icon-180\.png">/);
const pwaVersion = /const VERSION = "([^"]+)"/.exec(fs.readFileSync(path.join(root, "shared-assets/bioquest-pwa.js"), "utf8"))[1];
assert.ok(indexHtml.includes(`shared-assets/bioquest-pwa.js?v=${pwaVersion}`), "入口頁載入 bioquest-pwa.js 的 ?v= 要與檔內 VERSION 相同");

// ---- 瀏覽器檢查 ----
let offline = false;
const served = [];
function contentType(file) {
  return { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" }[path.extname(file).toLowerCase()] || "application/octet-stream";
}
const server = http.createServer((req, res) => {
  if (offline) return void req.socket.destroy();
  const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
  served.push(pathname);
  let clean = pathname.replace(/^\/+/, "");
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

const browser = await playwright.chromium.launch({ headless: true, ...(process.env.BIOQUEST_CHROME_PATH ? { executablePath: process.env.BIOQUEST_CHROME_PATH } : {}) });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
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

    await page.goto(base, { waitUntil: "load" });
    await page.waitForFunction(() => window.BioQuestPwa && window.BioQuestPwa.registered, null, { timeout: 15000 });
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    assert.equal(scope, base, "service worker 範圍應為整個網站");
    await page.reload({ waitUntil: "load" });
    assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true, "重新整理後應由 service worker 接管");

    // manifest 由瀏覽器讀得到
    const manifestHref = await page.evaluate(() => document.querySelector('link[rel="manifest"]').href);
    const fetched = await page.evaluate(async (href) => (await fetch(href)).json(), manifestHref);
    assert.equal(fetched.short_name, manifest.short_name);

    // 後台（外部）請求不經 service worker 快取：Playwright 攔截照常有效，每次都真的送出
    for (let i = 0; i < 2; i += 1) {
      const body = await page.evaluate(async () => (await fetch("https://script.google.com/macros/s/test/exec?action=ping")).text());
      assert.equal(body, '{"ok":true}');
    }
    assert.equal(backendHits.length, 2, "後台請求每次都要送到網路（不可被快取）");

    // POST 不經快取
    const postStatus = await page.evaluate(async () => (await fetch("manifest.webmanifest", { method: "POST", body: "x" })).status);
    assert.equal(postStatus, 200);

    // 入口頁註冊後，service worker 也會接管各站：站內頁照常開啟、無錯誤
    await page.goto(`${base}prototype-enzymes/`, { waitUntil: "load" });
    assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true, "各站應同樣由 service worker 接管");
    assert.ok(await page.locator("[data-nav='login']").count(), "第 13 站登入頁應正常顯示");
    await page.goto(base, { waitUntil: "load" });

    // 快取名稱只有本版
    const cacheNames = await page.evaluate(() => caches.keys());
    assert.ok(cacheNames.length > 0 && cacheNames.every((name) => /^bioquest-(pages|assets|images)-20261025-pwa-v1$/.test(name)), `快取名稱不符：${cacheNames}`);

    // 離線：入口頁仍可打開、單元清單照常產生
    offline = true;
    await page.reload({ waitUntil: "load" });
    assert.equal(await page.locator("h1").first().innerText(), "七年級生物自主學習入口");
    assert.ok((await page.locator("#unitGrid > *").count()) > 10, "離線時單元清單應照常顯示");
    // 不同 ?v= 的入口網址離線也能開（換頁網址常帶版本號）
    await page.goto(`${base}?v=offline-check`, { waitUntil: "load" });
    assert.equal(await page.locator("h1").first().innerText(), "七年級生物自主學習入口");
    offline = false;

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(scrollWidth <= viewport.width, `${viewport.width} 寬出現橫向捲動（${scrollWidth}）`);
    const unexpected = errors.filter((e) => !/Failed to load resource|ERR_CONNECTION|net::/.test(e));
    assert.deepEqual(unexpected, [], `入口頁出現錯誤：\n${unexpected.join("\n")}`);
    await context.close();
  }

  // 瀏覽器沒有 service worker 支援時不報錯、任務照常
  const context = await browser.newContext();
  await context.addInitScript(() => { delete Navigator.prototype.serviceWorker; });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "load" });
  assert.deepEqual(await page.evaluate(() => [window.BioQuestPwa.supported, window.BioQuestPwa.registered]), [false, false]);
  assert.ok((await page.locator("#unitGrid > *").count()) > 10);
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
  server.close();
}

console.log("pwa test passed");
