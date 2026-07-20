#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(process.argv[2] || defaultRoot);
const sharedVersion = "20260720-title-next-progress-v1";
const portal = fs.readFileSync(path.join(root, "portal.js"), "utf8");
const start = portal.indexOf("const units = [");
const end = portal.indexOf("\n\nconst statusText", start);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(start >= 0 && end > start, "portal units block missing");
const units = Function(`${portal.slice(start, end)}; return units;`)();
const readyUnits = units.filter((unit) => unit.status === "ready" && unit.url);
assert(readyUnits.length === 29, `expected 29 ready units, found ${readyUnits.length}`);

for (const unit of readyUnits) {
  const folder = unit.url.split("/")[0];
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  const titleToken = `bioquest-title-progress.js?v=${sharedVersion}`;
  const layoutToken = `bioquest-character-layout.js?v=${sharedVersion}`;
  assert(index.includes(titleToken), `${folder}: title progress loader missing`);
  assert(index.includes(`bioquest-character-layout.css?v=${sharedVersion}`), `${folder}: shared layout CSS cache mismatch`);
  assert(index.includes(layoutToken), `${folder}: shared layout JS cache mismatch`);
  assert(index.indexOf(titleToken) < index.indexOf(layoutToken), `${folder}: title progress must load before character layout`);
  assert(unit.url.includes(`title=${sharedVersion}`), `${folder}: portal title cache key missing`);
}

const layoutJs = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.js"), "utf8");
const layoutCss = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.css"), "utf8");
for (const token of [
  "BioQuestTitleProgress",
  "isVerifiedProgress(progress)",
  "距離「${info.nextTitle}」還差 ${info.remaining} EXP",
  "等待後台確認正式稱號進度。",
  "guest 測試不列入正式稱號進度。"
]) assert(layoutJs.includes(token), `shared title progress token missing: ${token}`);
assert(layoutCss.includes(".bq-title-avatar-next"), "shared title progress copy style missing");

console.log(`title progress audit passed: ${readyUnits.length} ready units`);
