const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

new vm.Script(source);

const renderStart = source.indexOf("function renderScan()");
const renderEnd = source.indexOf("function questionById", renderStart);
const renderScan = source.slice(renderStart, renderEnd);

assert.ok(renderScan.includes('class="wide-layout prep-layout"'));
assert.ok(renderScan.includes('class="prep-hero" data-prep-hero'));
assert.ok(renderScan.includes("owlImages.prep"));
assert.ok(!renderScan.includes("owlImages.scan"));
assert.ok(!renderScan.includes("return layout("), "prep must not use the split mission layout");

const heroAt = renderScan.indexOf('class="prep-hero"');
const conceptsAt = renderScan.indexOf('class="card-grid prep-concept-grid"');
const actionAt = renderScan.indexOf('id="scanNext"');
assert.ok(heroAt > -1 && heroAt < conceptsAt && conceptsAt < actionAt, "prep order must be hero, concepts, action");

assert.ok(source.includes('prep: `assets/owl-basic-unit-prep-reminder-v2.webp?v=${VERSION}`'));
assert.ok(!renderScan.includes("owl-basic-unit-micro-guide"));
assert.ok(!renderScan.includes("owl-basic-unit-cell-scan"));
assert.ok(styles.includes("grid-template-columns: minmax(260px, .9fr) minmax(0, 1.25fr)"), "1440 layout must use a horizontal prep hero");
assert.ok(styles.includes(".prep-hero { grid-template-columns:1fr;"), "390 layout must stack the prep hero");
assert.ok(styles.includes(".app-shell { grid-template-columns:minmax(0,1fr); }"), "390 layout must not expand to navigation min-content width");
assert.ok(styles.includes(".side-panel, .main-stage, #screen { min-width:0; width:100%; }"), "390 layout containers must remain shrinkable");
assert.ok(styles.includes("object-fit: contain;"), "prep owl must use contain sizing");
assert.ok(source.includes('const BASIC_UNIT_VERSION = "20260712-basic-unit-sheet-login-v4"'));
assert.ok(index.includes("20260713-backend-endpoint-v1"));
assert.ok(index.includes("styles.css?v=20260731-cell-basic-unit-submitted-retry-ia-v1"));
assert.ok(index.includes("app.js?v=20260731-cell-basic-unit-submitted-retry-ia-v1"));

console.log("cell-basic-unit prep layout regression passed for 1440px and 390px rules");
