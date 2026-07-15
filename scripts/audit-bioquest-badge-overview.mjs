#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = "20260715-achievement-order-v1";
const sharedVersionOverrides = new Map([
  ["prototype-life-world", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-scientific-method", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-lab-entry", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-microscope-use", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-cell-basic-unit", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-cell-structure", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-cell-observation", "20260715-brief-scene-unified-u1u7-v1"],
  ["prototype-cell-transport", "20260715-brief-scene-u8-v2"]
]);
const readyUnits = [
  "prototype-life-world",
  "prototype-scientific-method",
  "prototype-lab-entry",
  "prototype-microscope-use",
  "prototype-cell-basic-unit",
  "prototype-cell-structure",
  "prototype-cell-observation",
  "prototype-cell-transport",
  "prototype-biological-organization",
  "prototype-scale",
  "prototype-nutrients-energy",
  "prototype-nutrient-test",
  "prototype-enzymes",
  "prototype-photosynthesis",
  "prototype-human-nutrition",
  "prototype-plant-transport-structures"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sharedJs = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.js"), "utf8");
const sharedCss = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.css"), "utf8");

for (const token of [
  "unit_badge_summary_json",
  "BADGE_OVERVIEW_VERSION",
  "bq-unit-badge-summary-grid",
  "pending 或本機候選徽章不列入正式總覽",
  "insertAdjacentElement(\"afterend\", overviewPanel)",
  "overviewPanels.slice(1).forEach"
]) assert(sharedJs.includes(token), `shared badge overview JS token missing: ${token}`);
assert(!sharedJs.includes("insertAdjacentElement(\"beforebegin\", overviewPanel)"), "badge overview must not be inserted before unit badge panel");

for (const token of [
  ".bq-all-unit-badge-overview",
  ".bq-unit-badge-summary-grid",
  ".bq-unit-badge-summary__head",
  ".bq-unit-badge-thumbs",
  ".bq-unit-badge-thumb",
  "grid-template-columns: repeat(auto-fit, minmax(190px, 1fr))",
  "@media (max-width: 760px)"
]) assert(sharedCss.includes(token), `shared badge overview CSS token missing: ${token}`);

for (const folder of readyUnits) {
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const expectedSharedVersion = sharedVersionOverrides.get(folder) || version;
  assert(index.includes(`bioquest-character-layout.css?v=${expectedSharedVersion}`), `${folder}: shared CSS cache not updated`);
  assert(index.includes(`bioquest-character-layout.js?v=${expectedSharedVersion}`), `${folder}: shared JS cache not updated`);
  assert(!app.includes("aggregate.badges.map"), `${folder}: legacy whole-book badge renderer still expands aggregate.badges`);
  assert(!app.includes("目前沒有亮起的徽章"), `${folder}: legacy whole-book empty text remains`);
  assert(!app.includes("已收集</span><strong>${badge}"), `${folder}: legacy collected badge text remains`);
}

const context = {
  window: {},
  globalThis: {},
  document: {
    body: { dataset: { unitId: "cell_observation" } },
    readyState: "loading",
    addEventListener() {},
    querySelector() { return null; }
  },
  HTMLImageElement: class {},
  MutationObserver: class { observe() {} disconnect() {} },
  queueMicrotask() {},
  requestAnimationFrame(callback) { callback(); }
};
context.window = context;
context.globalThis = context;
context.__BIOQUEST_BADGE_OVERVIEW_STATE__ = {
  student: {
    student_id: "S70102",
    progress: {
      source: "server_verified",
      unit_badge_summary_json: JSON.stringify([
        {
          unit_id: "cell_observation",
          sequence: 7,
          unit_title: "細胞的觀察",
          station_title: "第 7 站｜細胞的觀察",
          availability_status: "open",
          total_badges: 10,
          earned_count: 2,
          earned_badges: [
            { badge_id: "cell_observation_entry", badge_image_path: "shared-assets/badges/cell_observation/badge-cell_observation-cell_observation_entry.png" },
            { badge_id: "slide_preparation_sequencer", badge_image_path: "shared-assets/badges/cell_observation/badge-cell_observation-slide_preparation_sequencer.png" }
          ]
        }
      ])
    }
  }
};

vm.runInNewContext(sharedJs, context);
const html = context.BioQuestBadgeOverview.renderHtml();
assert(context.BioQuestBadgeOverview.version === version, "badge overview exposed version mismatch");
assert((html.match(/class="bq-unit-badge-summary"/g) || []).length === 52, "overview must render 52 unit summary boxes");
assert(html.includes("第 7 站｜細胞的觀察"), "verified summary unit title missing");
assert(html.includes("2/10"), "verified earned/total count missing");
assert(html.includes("bq-unit-badge-thumb"), "verified earned badge thumbnails missing");
assert(!html.includes("玻片流程排序徽章"), "overview must not expose badge names/conditions as visible text");
assert(!html.includes(">0/0<"), "overview must not render null/no-catalog totals as 0/0");
assert(html.includes("第 17 站｜植物體內物質的運輸") && html.includes("尚未開放"), "locked units must keep locked/null semantics");

context.__BIOQUEST_BADGE_OVERVIEW_STATE__ = { student: { student_id: "guest", is_guest: true, progress: context.__BIOQUEST_BADGE_OVERVIEW_STATE__.student.progress } };
const guestHtml = context.BioQuestBadgeOverview.renderHtml();
assert(guestHtml.includes("guest 測試不列入正式累積徽章"), "guest state note missing");
assert(!guestHtml.includes("2/10"), "guest state must not count verified-looking local summary");
assert(!guestHtml.includes(">0/0<"), "guest fallback must not render null totals as 0/0");

for (const folder of ["prototype-human-nutrition", "prototype-plant-transport-structures"]) {
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const wallStart = app.indexOf("function renderBadgeWall");
  const wallBlock = app.slice(wallStart, app.indexOf("function renderRules", wallStart));
  assert(wallBlock.includes('badge.image_status === "pending"'), `${folder}: badge wall must branch on image_status pending`);
  assert(wallBlock.includes("bq-badge-asset-pending"), `${folder}: badge wall must render controlled pending fallback`);
}

console.log(JSON.stringify({
  ok: true,
  version,
  auditedReadyUnits: readyUnits.length,
  summaryBoxes: 52,
  mobileRule: "390px uses single-column summary grid"
}, null, 2));
