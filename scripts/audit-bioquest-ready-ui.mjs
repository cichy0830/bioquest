#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const units = [
  ["life_world", "prototype-life-world"],
  ["scientific_method", "prototype-scientific-method"],
  ["lab_intro", "prototype-lab-entry"],
  ["microscope_use", "prototype-microscope-use"],
  ["cell_basic_unit", "prototype-cell-basic-unit"],
  ["cell_structure", "prototype-cell-structure"],
  ["cell_observation", "prototype-cell-observation"],
  ["cell_transport", "prototype-cell-transport"],
  ["biological_organization", "prototype-biological-organization"],
  ["scale", "prototype-scale"],
  ["nutrients_energy", "prototype-nutrients-energy"],
  ["nutrient_test", "prototype-nutrient-test"],
  ["enzymes", "prototype-enzymes"],
  ["photosynthesis", "prototype-photosynthesis"],
  ["human_nutrition", "prototype-human-nutrition"],
  ["plant_transport_structures", "prototype-plant-transport-structures"],
  ["plant_material_transport", "prototype-plant-material-transport"],
  ["cardiovascular_components", "prototype-cardiovascular-components"],
  ["human_circulation", "prototype-human-circulation"],
  ["stimulus_response", "prototype-stimulus-response"],
  ["nervous_system", "prototype-nervous-system"]
];

const layoutJsPath = path.join(root, "shared-assets", "bioquest-character-layout.js");
const layoutCssPath = path.join(root, "shared-assets", "bioquest-character-layout.css");
const layoutJs = fs.readFileSync(layoutJsPath, "utf8");
const layoutCss = fs.readFileSync(layoutCssPath, "utf8");
const cacheVersion = "20260715-achievement-order-v1";
const surfaceCacheVersion = "20260715-achievement-order-v1";
const backendConfigVersion = "20260713-backend-endpoint-v1";
const appCacheVersion = "20260715-badge-overview-v2";
const appVersionOverrides = new Map();
appVersionOverrides.set("cell_observation", "20260717-badge-icon-cleanup-v1");
appVersionOverrides.set("cell_structure", "20260715-cell-structure-achievement-avatar-v1");
["biological_organization", "scale", "nutrients_energy", "nutrient_test"].forEach((unitId) => {
  appVersionOverrides.set(unitId, "20260715-title-avatar-card-v1");
});
appVersionOverrides.set("enzymes", "20260718-enzymes-badges-v1");
appVersionOverrides.set("nutrient_test", "20260717-nutrient-test-u12-fixes-v2");
appVersionOverrides.set("scale", "20260717-scale-user-review-v2");
appVersionOverrides.set("nutrients_energy", "20260717-badge-icon-cleanup-v1");
appVersionOverrides.set("photosynthesis", "20260715-brief-scene-unified-u9u14-v1");
appVersionOverrides.set("biological_organization", "20260717-badge-icon-cleanup-v1");
appVersionOverrides.set("cell_transport", "20260717-badge-icon-cleanup-v1");
appVersionOverrides.set("plant_material_transport", "20260718-ag-visual-fixes-v1");
["human_nutrition", "plant_material_transport"].forEach((unitId) => {
  appVersionOverrides.set(unitId, "20260718-ag-visual-fixes-v1");
});
appVersionOverrides.set("plant_transport_structures", "20260717-u15u17-brief-scenes-v1");
appVersionOverrides.set("cardiovascular_components", "20260718-ag-visual-fixes-v1");
appVersionOverrides.set("human_circulation", "20260718-ag-visual-fixes-v1");
appVersionOverrides.set("stimulus_response", "20260718-ag-visual-fixes-v1");
appVersionOverrides.set("nervous_system", "20260718-nervous-system-ready-v1");
const sharedCacheOverrides = new Map();
["life_world", "scientific_method", "lab_intro", "microscope_use", "cell_basic_unit", "cell_structure", "cell_observation"].forEach((unitId) => {
  sharedCacheOverrides.set(unitId, "20260715-brief-scene-unified-u1u7-v1");
});
sharedCacheOverrides.set("cell_observation", "20260716-cell-observation-guest-local-v1");
["scale", "nutrients_energy", "nutrient_test"].forEach((unitId) => {
  sharedCacheOverrides.set(unitId, "20260715-title-avatar-card-v1");
});
sharedCacheOverrides.set("enzymes", "20260718-enzymes-badges-v1");
sharedCacheOverrides.set("nutrient_test", "20260717-nutrient-test-u12-fixes-v2");
sharedCacheOverrides.set("cell_transport", "20260716-cell-transport-u8-ux-v1");
sharedCacheOverrides.set("scale", "20260717-scale-user-review-v2");
sharedCacheOverrides.set("biological_organization", "20260716-biological-organization-title-count-v1");
sharedCacheOverrides.set("photosynthesis", "20260715-brief-scene-unified-u9u14-v1");
["human_nutrition", "plant_material_transport"].forEach((unitId) => {
  sharedCacheOverrides.set(unitId, "20260718-ag-visual-fixes-v1");
});
sharedCacheOverrides.set("plant_transport_structures", "20260717-u15u17-brief-scenes-v1");
sharedCacheOverrides.set("cardiovascular_components", "20260718-ag-visual-fixes-v1");
sharedCacheOverrides.set("human_circulation", "20260718-ag-visual-fixes-v1");
sharedCacheOverrides.set("stimulus_response", "20260718-ag-visual-fixes-v1");
sharedCacheOverrides.set("nervous_system", "20260713-login-busy-v1");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function badgeBlock(source) {
  const marker = source.includes("const unitBadgeCatalog = [") ? "const unitBadgeCatalog = [" : "const badges = [";
  const start = source.indexOf(marker);
  const next = source.indexOf("\nconst ", start + marker.length);
  return source.slice(start, next < 0 ? source.length : next);
}

function badgeInventory(source, folder) {
  const block = badgeBlock(source);
  const entries = [...block.matchAll(/\{\s*id:\s*["']([^"']+)["']([\s\S]*?)\}/g)].map((match) => {
    const explicit = match[2].match(/badge_image_path:\s*["']([^"']+)["']/)?.[1] || "";
    return { id: match[1], explicit };
  });
  if (!entries.length && (folder === "prototype-plant-transport-structures" || folder === "prototype-plant-material-transport" || folder === "prototype-cardiovascular-components" || folder === "prototype-human-circulation" || folder === "prototype-stimulus-response" || folder === "prototype-nervous-system")) {
    const dynamicTemplate = source.match(/const badgeAsset = \(id\) => `([^`]+)`/)?.[1] || "";
    return [...block.matchAll(/\["([^"]+)",\s*"[^"]+",\s*"[^"]+"\]/g)].map((match) => {
      const imagePath = dynamicTemplate ? dynamicTemplate.replace("${id}", match[1]) : "";
      const absolute = imagePath ? path.resolve(root, folder, imagePath) : "";
      return { id: match[1], imagePath, exists: Boolean(absolute && fs.existsSync(absolute)) };
    });
  }
  const dynamicTemplate = source.match(/const badgeAsset = \(id\) => `([^`]+)`/)?.[1] || "";
  return entries.map((entry) => {
    const imagePath = entry.explicit || dynamicTemplate.replace("${id}", entry.id);
    const absolute = imagePath ? path.resolve(root, folder, imagePath) : "";
    return { ...entry, imagePath, exists: Boolean(absolute && fs.existsSync(absolute)) };
  });
}

const stateContext = {
  window: {},
  globalThis: {},
  document: { readyState: "loading", addEventListener() {} },
  MutationObserver: class {},
  queueMicrotask() {}
};
stateContext.window = stateContext;
stateContext.globalThis = stateContext;
vm.runInNewContext(layoutJs, stateContext);
const feedbackState = stateContext.BioQuestCharacterLayout.feedbackState;
assert(feedbackState({ accuracy: 1, hint_used: 0 }) === "excellent", "feedback excellent mapping failed");
assert(feedbackState({ accuracy: 0.9, hint_used: 1 }) === "strong", "feedback strong mapping failed");
assert(feedbackState({ accuracy: 0.7 }) === "stable", "feedback stable mapping failed");
assert(feedbackState({ accuracy: 0.5 }) === "needs_review", "feedback needs_review mapping failed");
assert(feedbackState({ accuracy: 0.2 }) === "retry_ready", "feedback retry_ready mapping failed");

for (const required of [
  'createElement("picture")',
  "mentor-feedback-${state}.webp",
  "owl-bioquest-report-reminder.webp",
  'heading.insertAdjacentElement("afterend", heroWrapper)',
  'screenName === "achievements"',
  "unit_badge_summary_json",
  "bq-unit-badge-summary-grid"
]) assert(layoutJs.includes(required), `shared layout hook missing: ${required}`);

for (const token of [
  "--bq-character-prep-size",
  "--bq-character-report-size",
  "--bq-character-result-size",
  "--bq-character-inline-size",
  "--bq-badge-size",
  ".bq-unit-badge-summary-grid",
  ".bq-unit-badge-thumb",
  ".checkbox-list label",
  "grid-template-columns: 24px minmax(0, 1fr)",
  "object-fit: contain",
  "@media (max-width: 760px)"
]) assert(layoutCss.includes(token), `shared layout CSS token missing: ${token}`);

for (const state of ["excellent", "strong", "stable", "needs_review", "retry_ready"]) {
  assert(fs.existsSync(path.join(root, "shared-assets", "mentor-feedback", `mentor-feedback-${state}.webp`)), `shared feedback image missing: ${state}`);
}
for (const file of [
  "shared-assets/login/bioquest-login-cover-wide.webp",
  "shared-assets/login/bioquest-login-cover-mobile.webp",
  "shared-assets/characters/owl-bioquest-report-reminder.webp"
]) assert(fs.existsSync(path.join(root, file)), `shared asset missing: ${file}`);

const audit = units.map(([unitId, folder]) => {
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const expectedAppVersion = appVersionOverrides.get(unitId) || appCacheVersion;
  const expectedSharedJsVersion = sharedCacheOverrides.get(unitId) || cacheVersion;
  const expectedSharedCssVersion = sharedCacheOverrides.get(unitId) || surfaceCacheVersion;
  for (const marker of [
    `data-unit-id="${unitId}"`,
    "data-login-cover-wide=",
    "data-login-cover-mobile=",
    "data-feedback-mentor-base=",
    "data-report-owl-src=",
    "data-result-owl-src=",
    `bioquest-character-layout.css?v=${expectedSharedCssVersion}`,
    `bioquest-character-layout.js?v=${expectedSharedJsVersion}`,
    `bioquest-backend-config.js?v=${backendConfigVersion}`,
    `app.js?v=${expectedAppVersion}`
  ]) assert(index.includes(marker), `${unitId} index hook missing: ${marker}`);
  if (unitId === "microscope_use") {
    assert(index.includes("styles.css?v=20260714-microscope-paramecium-v3"), "microscope_use style cache bust missing");
  }
  if (unitId === "cell_structure") {
    assert(index.includes("styles.css?v=20260715-cell-structure-achievement-avatar-v1"), "cell_structure style cache bust missing");
  }
  if (unitId === "cell_observation") {
    assert(index.includes("styles.css?v=20260717-badge-icon-cleanup-v1"), "cell_observation style cache bust missing");
  }
  for (const functionName of ["renderLogin", "renderReview", "renderReflection", "renderResult", "renderAchievements"]) {
    assert(app.includes(`function ${functionName}(`), `${unitId} missing ${functionName}`);
  }
  const badges = badgeInventory(app, folder);
  return {
    unitId,
    folder,
    badgeExpected: badges.length,
    badgeReady: badges.filter((badge) => badge.exists).length,
    badgeMissing: badges.filter((badge) => !badge.exists).map((badge) => badge.id),
    badgePaths: badges.filter((badge) => badge.exists).map((badge) => badge.imagePath)
  };
});

const scientificApp = fs.readFileSync(path.join(root, "prototype-scientific-method", "app.js"), "utf8");
const scientificStyles = fs.readFileSync(path.join(root, "prototype-scientific-method", "styles.css"), "utf8");
assert(scientificApp.includes("prep-owl-hero"), "scientific_method prep owl hero missing");
assert(!scientificApp.slice(scientificApp.indexOf("function renderReview()"), scientificApp.indexOf("function renderReflection()")).includes("owl-frame"), "scientific_method feedback keeps bottom owl");
assert(!scientificApp.slice(scientificApp.indexOf("function renderReflection()"), scientificApp.indexOf("function attachReflection()")).includes("mentorCard("), "scientific_method report still has mentor card");
assert(scientificStyles.includes(".prep-owl-hero"), "scientific_method prep owl styles missing");

const labIndex = fs.readFileSync(path.join(root, "prototype-lab-entry", "index.html"), "utf8");
const labApp = fs.readFileSync(path.join(root, "prototype-lab-entry", "app.js"), "utf8");
assert(labIndex.includes('data-report-owl-src="assets/owl-lab-cleanup.png"'), "lab_intro report owl must use lab owl");
assert(labApp.includes("selectedLine.textContent = select.value ? `已選：${select.value}`"), "lab_intro match select immediate selected-answer update missing");
assert(!labApp.slice(labApp.indexOf("function renderReview()"), labApp.indexOf("function renderReflection()")).includes("owlPanel("), "lab_intro feedback keeps duplicate owl");
assert(!labApp.slice(labApp.indexOf("function renderReflection()"), labApp.indexOf("function attachReflection()")).includes("mentorCard("), "lab_intro report still has mentor card");

const microscopeApp = fs.readFileSync(path.join(root, "prototype-microscope-use", "app.js"), "utf8");
const microscopeStyles = fs.readFileSync(path.join(root, "prototype-microscope-use", "styles.css"), "utf8");
assert(!microscopeApp.includes("林安安") && !microscopeApp.includes("陳柏宇") && !microscopeApp.includes("許若晴"), "microscope_use must not keep formal local roster names");
assert(microscopeApp.includes("fetchStudentStatus(id)") && microscopeApp.includes("後台目前無法連線，尚未登入"), "microscope_use official login backend handling missing");
assert(microscopeApp.includes("function selectPartTarget(partId)") && microscopeApp.includes("尚有 ${remaining} 個部位未辨識"), "microscope_use target completion blocking missing");
assert(microscopeApp.includes('input type="range" min="-1" max="1" step="1"'), "microscope_use field slider must be left/center/right");
assert(microscopeApp.includes("低倍洋蔥表皮") && microscopeApp.includes("高倍洋蔥表皮"), "microscope_use onion low/high comparison text missing");
assert(microscopeApp.includes("img-microscope-onion-low-power.webp") && microscopeApp.includes("img-microscope-onion-high-power.webp"), "microscope_use approved onion images missing");
for (const position of ["left", "center", "right"]) {
  assert(microscopeApp.includes(`img-microscope-paramecium-view-${position}.webp`), `microscope_use approved paramecium ${position} view missing`);
  assert(fs.existsSync(path.join(root, "prototype-microscope-use", "assets", `img-microscope-paramecium-view-${position}.webp`)), `microscope_use approved paramecium ${position} asset missing`);
}
assert(!microscopeApp.includes("待審素材") && !microscopeApp.includes("review-v3.webp"), "microscope_use must use stable formal asset hooks");
assert(microscopeApp.includes("fieldViewForSlidePosition") && microscopeApp.includes('data-field-view="${fieldView.viewPosition}"'), "microscope_use three-position image switch missing");
assert(microscopeStyles.includes("object-fit: contain"), "microscope_use briefing scene must contain image");
assert(microscopeStyles.includes("grid-template-columns: 34px minmax(0, 1fr) auto"), "microscope_use sequence row width rule missing");

const cellStructureApp = fs.readFileSync(path.join(root, "prototype-cell-structure", "app.js"), "utf8");
const cellStructureStyles = fs.readFileSync(path.join(root, "prototype-cell-structure", "styles.css"), "utf8");
assert(cellStructureApp.includes("function selectStructureTarget(structureId)") && cellStructureApp.includes("尚有 ${remaining} 個構造未辨識"), "cell_structure structure target blocking missing");
assert(cellStructureApp.includes("if (directPath.startsWith(\"shared-assets/\")) return `../${directPath}`;"), "cell_structure title avatar path normalization missing");
assert(cellStructureApp.includes("async function fetchStudentStatus(id)") && cellStructureApp.includes("後台目前無法連線，尚未登入"), "cell_structure official login backend handling missing");
assert(cellStructureStyles.includes("border: 2px solid transparent") && cellStructureStyles.includes("box-shadow: none"), "cell_structure hotspot default must be transparent");

const lifeStyles = fs.readFileSync(path.join(root, "prototype-life-world", "styles.css"), "utf8");
assert(lifeStyles.includes("background: rgba(255, 255, 255, 0.74);"), "life_world background trial panel opacity missing");

const reportPath = path.join(root, "04_網頁模板", "全站角色與徽章接線盤點.md");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const rows = audit.map((item) => `| \`${item.unitId}\` | shared wide/mobile | shared 5-state | shared report owl | shared result hero | ${item.badgeReady}/${item.badgeExpected} | ${item.badgeMissing.length ? item.badgeMissing.map((id) => `\`${id}\``).join("、") : "完整"} |`).join("\n");
const report = `# 全站角色與徽章接線盤點

更新日期：2026-07-18
適用範圍：入口目前標示 ready 的第 1–${audit.length} 單元

| unit_id | login cover | feedback | report | result | 徽章圖 | 缺圖 badge_id |
|---|---|---|---|---|---:|---|
${rows}

## 共用規則

- 登入頁由 \`bioquest-character-layout.js\` 建立共用 \`<picture>\`，wide/mobile 封面及固定招呼一致，並隱藏單元專屬角色。
- 回饋頁依正確率、提示及 retry 結果映射 \`excellent / strong / stable / needs_review / retry_ready\`，固定載入 \`shared-assets/mentor-feedback/\`。
- 回報頁隱藏舊阿澤與舊 owl，固定載入 \`shared-assets/characters/owl-bioquest-report-reminder.webp\`。
- 結算頁將單元 result owl 移到標題後、EXP 摘要前；prep/report/result/inline 與徽章尺寸由共用 CSS token 控制。
- 缺正式徽章圖的卡片顯示「徽章素材待補」，不以純文字卡宣稱視覺已完成。
`;
fs.writeFileSync(reportPath, report);
console.log(JSON.stringify(audit, null, 2));
