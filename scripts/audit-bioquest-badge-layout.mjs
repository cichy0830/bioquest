#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portal = fs.readFileSync(path.join(root, "portal.js"), "utf8");
const sharedCss = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.css"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!sharedCss.includes(".badge img,"), "broad .badge img selector must not return");
for (const selector of [
  ".badge > img,",
  ".badge-card > .badge-image,",
  ".badge-card > img,",
  ".badge-visual > img {"
]) assert(sharedCss.includes(selector), `shared badge selector missing: ${selector}`);

for (const rule of [
  "width: 100% !important;",
  "height: 100% !important;",
  "max-width: 100% !important;",
  "max-height: 100% !important;",
  "margin: 0 !important;",
  "object-fit: contain !important;"
]) {
  const wrapperRule = sharedCss.slice(sharedCss.indexOf(".badge-visual > img {"), sharedCss.indexOf(".badge,", sharedCss.indexOf(".badge-visual > img {")));
  assert(wrapperRule.includes(rule), `.badge-visual containment rule missing: ${rule}`);
}

const readyFolders = [...portal.matchAll(/status:\s*"ready"[\s\S]*?url:\s*"([^"?]+)(?:\?[^"/]*)?"/g)]
  .map((match) => match[1].replace(/\/$/, ""))
  .filter((folder) => folder !== "prototype-plant-material-transport");
assert(readyFolders.length === 28, `expected 28 ready units excluding U17 badge-layout exception, found ${readyFolders.length}`);

const audit = readyFolders.map((folder) => {
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const styles = fs.readFileSync(path.join(root, folder, "styles.css"), "utf8");
  assert(app.includes("function renderResult("), `${folder}: result renderer missing`);
  assert(app.includes("function renderAchievements("), `${folder}: achievements renderer missing`);
  assert(app.includes("badge"), `${folder}: badge markup missing`);

  let mode = "badge-direct";
  if (app.includes("badge-visual")) mode = "badge-visual-wrapper";
  else if (app.includes("badge-card") && app.includes("badge-image")) mode = "badge-card-image-hook";
  else if (app.includes("badge-card")) mode = "badge-card-direct-image";

  if (mode === "badge-visual-wrapper") {
    assert(styles.includes(".badge-visual"), `${folder}: badge visual wrapper style missing`);
    assert(styles.includes("overflow: hidden"), `${folder}: badge visual overflow containment missing`);
  }
  return { folder, mode };
});

console.log(JSON.stringify({ readyUnits: audit.length, broadSelectorRemoved: true, audit }, null, 2));
