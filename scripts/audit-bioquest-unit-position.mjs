#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portalPath = path.join(root, "portal.js");
const portal = fs.readFileSync(portalPath, "utf8");
const start = portal.indexOf("const units = [");
const end = portal.indexOf("\n\nconst statusText", start);
const sharedVersionOverrides = new Map([
  ["life_world", "20260715-brief-scene-unified-u1u7-v1"],
  ["scientific_method", "20260715-brief-scene-unified-u1u7-v1"],
  ["lab_intro", "20260715-brief-scene-unified-u1u7-v1"],
  ["microscope_use", "20260715-brief-scene-unified-u1u7-v1"],
  ["cell_basic_unit", "20260715-brief-scene-unified-u1u7-v1"],
  ["cell_structure", "20260715-brief-scene-unified-u1u7-v1"],
  ["cell_observation", "20260716-cell-observation-guest-local-v1"],
  ["cell_transport", "20260716-cell-transport-u8-ux-v1"],
  ["biological_organization", "20260716-biological-organization-title-count-v1"],
  ["scale", "20260717-scale-user-review-v2"],
  ["nutrients_energy", "20260715-title-avatar-card-v1"],
  ["nutrient_test", "20260720-nutrient-test-starch-glucose-only-v2"],
  ["enzymes", "20260718-enzymes-badges-v1"],
  ["photosynthesis", "20260720-photosynthesis-badge-cache-v2"],
  ["human_nutrition", "20260719-human-nutrition-qa-v1"],
  ["plant_transport_structures", "20260720-plant-transport-structures-extension-v2"],
  ["plant_material_transport", "20260720-plant-material-transport-badges-v1"],
  ["cardiovascular_components", "20260720-cardiovascular-components-brief-scroll-v1"],
  ["human_circulation", "20260720-human-circulation-evidence-v1"],
  ["stimulus_response", "20260718-ag-visual-fixes-v1"],
  ["nervous_system", "20260713-login-busy-v1"],
  ["endocrine_system", "20260713-login-busy-v1"],
  ["behavior_sensing", "20260713-login-busy-v1"],
  ["respiration_homeostasis", "20260713-login-busy-v1"],
  ["excretion_water_homeostasis", "20260713-login-busy-v1"],
  ["temperature_glucose_homeostasis", "20260713-login-busy-v1"],
  ["cell_division", "20260713-login-busy-v1"],
  ["asexual_reproduction", "20260713-login-busy-v1"],
  ["sexual_reproduction", "20260713-login-busy-v1"]
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(start >= 0 && end > start, "portal units block missing");
const units = Function(`${portal.slice(start, end)}; return units;`)();
const readyUnits = units.filter((unit) => unit.status === "ready" && unit.url);

assert(readyUnits.length === 29, `expected 29 ready units, found ${readyUnits.length}`);
assert(portal.includes("第 ${unit.sequence} 站｜${unit.title}"), "portal card must render station and formal title");
assert(!portal.includes("第 ${unit.sequence} 單元"), "portal card must not render old unit wording");
readyUnits.forEach((unit) => {
  assert(/\?v=[^"]+/.test(unit.url), `${unit.unitId} ready URL must include a cache bust query`);
});

const layoutJs = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.js"), "utf8");
const layoutCss = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.css"), "utf8");
for (const token of ["unitPositionText", "enhanceUnitPosition", "bq-unit-position"]) {
  assert(layoutJs.includes(token) || layoutCss.includes(token), `shared unit position hook missing: ${token}`);
}

for (const unit of readyUnits) {
  const folder = unit.url.split("/")[0];
  const indexPath = path.join(root, folder, "index.html");
  const index = fs.readFileSync(indexPath, "utf8");
  assert(index.includes(`data-unit-id="${unit.unitId}"`), `${folder} unit id mismatch`);
  assert(index.includes(`data-unit-sequence="${unit.sequence}"`), `${folder} sequence missing or mismatched`);
  assert(index.includes(`data-unit-title="${unit.title}"`), `${folder} formal title missing or mismatched`);
  const expectedSharedVersion = "20260720-title-next-progress-v1";
  assert(index.includes(`bioquest-character-layout.css?v=${expectedSharedVersion}`), `${folder} shared CSS cache bust missing`);
  assert(index.includes(`bioquest-character-layout.js?v=${expectedSharedVersion}`), `${folder} shared JS cache bust missing`);
  assert(!/\b1-\d\b/.test(index), `${folder} must not contain chapter numbering`);
}

console.log(`unit position audit passed: ${readyUnits.length} ready units`);
