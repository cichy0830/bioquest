#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const units = [
  ["prototype-life-world", "bg-life-world-briefing-azhe-wide"],
  ["prototype-scientific-method", "bg-scientific-method-briefing-azhe-wide"],
  ["prototype-lab-entry", "bg-lab-entry-briefing-azhe-wide"],
  ["prototype-microscope-use", "bg-microscope-use-briefing-azhe-wide"],
  ["prototype-cell-basic-unit", "bg-basic-unit-briefing-azhe-wide"],
  ["prototype-cell-structure", "bg-cell-structure-briefing-azhe-wide.webp"],
  ["prototype-cell-observation", "bg-cell-observation-briefing-azhe-wide"],
  ["prototype-cell-transport", "bg-cell-transport-briefing-azhe-wide"],
  ["prototype-biological-organization", "bg-biological-organization-briefing-azhe-wide"],
  ["prototype-scale", "bg-scale-briefing-azhe-wide"],
  ["prototype-nutrients-energy", "bg-nutrients-energy-briefing-azhe-wide"],
  ["prototype-nutrient-test", "bg-nutrient-test-briefing-azhe-wide"],
  ["prototype-enzymes", "bg-enzymes-briefing-azhe-wide"],
  ["prototype-photosynthesis", "bg-photosynthesis-briefing-azhe-wide"],
  ["prototype-endocrine-system", "endocrine-system-briefing-azhe-wide.webp"],
  ["prototype-behavior-sensing", "behavior-sensing-briefing-azhe-wide.webp"],
  ["prototype-respiration-homeostasis", "respiration-homeostasis-briefing-azhe-wide.webp"]
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function renderBriefBlock(app) {
  const start = app.indexOf("function renderBrief()");
  assert(start >= 0, "renderBrief() missing");
  const next = app.indexOf("\nfunction ", start + 1);
  return app.slice(start, next > start ? next : app.length);
}

for (const [folder, expectedHook] of units) {
  const appPath = path.join(root, folder, "app.js");
  const app = fs.readFileSync(appPath, "utf8");
  const block = renderBriefBlock(app);

  assert(app.includes(expectedHook), `${folder} missing unit briefing scene hook: ${expectedHook}`);
  assert(block.includes("briefNext") || block.includes('data-next="scan"'), `${folder} brief next action missing`);
  assert(block.includes("eyebrow"), `${folder} brief eyebrow missing`);
  assert(!/\bowlPanel\s*\(|owl-frame/.test(block), `${folder} brief must not render owl`);
  assert(!/\blayout\s*\(/.test(block), `${folder} brief must not use generic owl layout`);

  if (folder === "prototype-cell-structure") {
    assert(!app.includes("mentor-cell-lab"), "U6 brief must not use old layered mentor foreground");
    assert(!app.includes("brief-scene-layered"), "U6 brief must not use old layered scene markup");
    assert(app.includes('briefing: "assets/bg-cell-structure-briefing-azhe-wide.webp"'), "U6 brief must use exact official integrated WebP");
    assert(!app.includes("cellStructureBriefingSceneReady"), "U6 brief must not keep ready=false missing-image logic");
    assert(!block.includes("brief-character-grid"), "U6 brief must not use old mentor/title grid");
    assert(!/\bmentorCard\s*\(/.test(block), "U6 brief must not use standalone mentorCard");
    assert(block.includes("renderBriefSceneFigure()"), "U6 brief must use U5-style scene figure");
    assert(block.indexOf("hero-title") < block.indexOf("renderBriefSceneFigure()"), "U6 title must appear before scene");
    assert(block.indexOf("renderBriefSceneFigure()") < block.indexOf("研究站的求救訊號"), "U6 scene must appear before story");
    assert(block.indexOf("任務核心") < block.indexOf("status-line"), "U6 mission core must appear before status");
    assert(block.indexOf("status-line") < block.indexOf("briefNext"), "U6 status must appear before next action");
  }
}

console.log(`briefing scene audit passed: ${units.length} ready units`);
