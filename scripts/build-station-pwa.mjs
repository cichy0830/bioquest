#!/usr/bin/env node
// ROADMAP R2 加到主畫面：整個網站只有一個「BioQuest」主畫面圖示（佇列 W16 老師決定 B，2026-11-03）。
// 依 portal.js 的單元清單，在 status 為 ready 的站 index.html 加上網站共用 manifest（../manifest.webmanifest，
// 開學生版入口頁 home/）、主畫面圖示與 bioquest-pwa.js（以 BEGIN/END 註解標記，可重複執行），
// 並刪除舊版（W16 選項 A）各站自己的 <站資料夾>/manifest.webmanifest。
// 只動 index.html 的 <head> 標記區與 </body> 前一行；不動任何站的 app.js／styles.css，題目與後台不受影響。
// 用法：node scripts/build-station-pwa.mjs          # 產生／更新
//       node scripts/build-station-pwa.mjs --check  # 只檢查是否與產生結果一致（測試用）
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

export function loadUnits() {
  const source = fs.readFileSync(path.join(root, "portal.js"), "utf8");
  const match = /const units = (\[[\s\S]*?\n\]);/.exec(source);
  if (!match) throw new Error("portal.js 找不到 units 清單");
  return vm.runInNewContext(`(${match[1]})`);
}

export function pwaVersion() {
  return /const VERSION = "([^"]+)"/.exec(fs.readFileSync(path.join(root, "shared-assets/bioquest-pwa.js"), "utf8"))[1];
}

export function stationTargets() {
  return loadUnits()
    .filter((unit) => unit.status === "ready" && unit.url)
    .map((unit) => ({ ...unit, folder: unit.url.split("/")[0] }))
    .filter((unit) => /^prototype-[a-z0-9-]+$/.test(unit.folder) && fs.existsSync(path.join(root, unit.folder, "index.html")));
}

const siteManifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));

// 舊版（W16 選項 A）各站自己的 manifest 位置；新版不再產生，執行時刪除
export function legacyManifestPath(unit) {
  return path.join(root, unit.folder, "manifest.webmanifest");
}

export const SITE_APP_TITLE = siteManifest.short_name;

const HEAD_BEGIN = "<!-- BEGIN bioquest-pwa（由 scripts/build-station-pwa.mjs 產生） -->";
const HEAD_END = "<!-- END bioquest-pwa -->";

export function headBlock() {
  return [
    HEAD_BEGIN,
    '  <link rel="manifest" href="../manifest.webmanifest">',
    `  <meta name="theme-color" content="${siteManifest.theme_color}">`,
    '  <meta name="mobile-web-app-capable" content="yes">',
    '  <meta name="apple-mobile-web-app-capable" content="yes">',
    `  <meta name="apple-mobile-web-app-title" content="${SITE_APP_TITLE}">`,
    '  <meta name="apple-mobile-web-app-status-bar-style" content="default">',
    '  <link rel="icon" type="image/png" sizes="192x192" href="../shared-assets/pwa/icon-192.png">',
    '  <link rel="apple-touch-icon" href="../shared-assets/pwa/apple-touch-icon-180.png">',
    `  ${HEAD_END}`,
  ].join("\n");
}

export function scriptTag() {
  return `<script src="../shared-assets/bioquest-pwa.js?v=${pwaVersion()}"></script>`;
}

export function patchHtml(html, unit) {
  let out = html;
  const block = headBlock();
  const existing = new RegExp(`${escape(HEAD_BEGIN)}[\\s\\S]*?${escape(HEAD_END)}`);
  if (existing.test(out)) out = out.replace(existing, block.trimStart());
  else {
    const viewport = /(<meta name="viewport"[^>]*>\n)/;
    if (!viewport.test(out)) throw new Error(`${unit.folder}/index.html 找不到 viewport meta`);
    out = out.replace(viewport, `$1  ${block}\n`);
  }
  const tagPattern = /<script src="\.\.\/shared-assets\/bioquest-pwa\.js\?v=[^"]*"><\/script>/;
  if (tagPattern.test(out)) out = out.replace(tagPattern, scriptTag());
  else {
    const bodyEnd = /\n([ \t]*)<\/body>/;
    if (!bodyEnd.test(out)) throw new Error(`${unit.folder}/index.html 找不到 </body>`);
    out = out.replace(bodyEnd, `\n  ${scriptTag()}\n$1</body>`);
  }
  return out;
}

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function main() {
  const mismatched = [];
  const targets = stationTargets();
  for (const unit of targets) {
    const manifestPath = legacyManifestPath(unit);
    const htmlPath = path.join(root, unit.folder, "index.html");
    const html = fs.readFileSync(htmlPath, "utf8");
    const patched = patchHtml(html, unit);
    if (checkOnly) {
      if (fs.existsSync(manifestPath)) mismatched.push(`${unit.folder}/manifest.webmanifest（應刪除）`);
      if (patched !== html) mismatched.push(`${unit.folder}/index.html`);
      continue;
    }
    if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
    if (patched !== html) fs.writeFileSync(htmlPath, patched);
  }
  if (checkOnly && mismatched.length) {
    console.error(`與產生結果不一致（請執行 node scripts/build-station-pwa.mjs）：\n${mismatched.join("\n")}`);
    process.exit(1);
  }
  console.log(`${checkOnly ? "檢查" : "處理"} ${targets.length} 站`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
