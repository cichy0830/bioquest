#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = "20260713-backend-endpoint-v1";
const expectedUrl = "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const oldDeployment = "AKfycbws7n-pzOGA7ZaQe044cAA4JElgjVsDTMokXf9ZifKZoGQHRyNSFpuxVppkC8PzZFATqQ";
const portal = fs.readFileSync(path.join(root, "portal.js"), "utf8");
const unitsStart = portal.indexOf("const units = [");
const unitsEnd = portal.indexOf("\n\nconst statusText", unitsStart);
const readyUnits = Function(`${portal.slice(unitsStart, unitsEnd)}; return units;`)()
  .filter((unit) => unit.status === "ready" && unit.url);
const units = readyUnits.map((unit) => unit.url.split("/")[0]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const config = fs.readFileSync(path.join(root, "shared-assets", "bioquest-backend-config.js"), "utf8");
assert(config.includes(expectedUrl), "shared backend config does not contain the approved deployment");
assert(!config.includes(oldDeployment), "shared backend config still contains the retired deployment");

for (const folder of units) {
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  assert(app.includes("window.BioQuestBackend?.url"), `${folder} does not use the shared backend config`);
  assert(app.includes(expectedUrl), `${folder} fallback endpoint is not the approved deployment`);
  assert(!app.includes(oldDeployment), `${folder} still contains the retired deployment`);
  assert(!/(林安安|陳柏宇|許若晴)/.test(app), `${folder} still contains a formal-student local roster`);
  assert(index.includes(`bioquest-backend-config.js?v=${version}`), `${folder} backend config script/cache missing`);
  assert(index.indexOf("bioquest-backend-config.js") < index.indexOf("app.js"), `${folder} loads app before backend config`);
  assert(/app\.js\?v=[^"]+/.test(index), `${folder} app cache bust missing`);
}

const basicApp = fs.readFileSync(path.join(root, "prototype-cell-basic-unit", "app.js"), "utf8");
const loginStart = basicApp.indexOf("function renderLogin()");
const loginEnd = basicApp.indexOf("async function fetchStudentStatus", loginStart);
const basicLogin = basicApp.slice(loginStart, loginEnd);
assert(!basicLogin.includes("mentorCard("), "cell_basic_unit login still renders a mentor card");
assert(!basicLogin.includes("return layout("), "cell_basic_unit login still renders a unit owl column");
assert(basicLogin.includes('class="panel hero-panel"'), "cell_basic_unit login shared cover panel missing");

const cellStructureApp = fs.readFileSync(path.join(root, "prototype-cell-structure", "app.js"), "utf8");
assert(cellStructureApp.includes("async function login(id)"), "cell_structure login is not backend-aware");
assert(cellStructureApp.includes('const useGuest = id === "guest"') && cellStructureApp.includes("beginLocalGuestAttempt()"), "cell_structure guest-only local branch missing");
assert(cellStructureApp.includes('cache: "no-store"'), "cell_structure backend login must disable cache");

const readyUrls = readyUnits.map((unit) => unit.url);
assert(readyUrls.length >= 17, `expected at least 17 ready URLs, found ${readyUrls.length}`);
readyUrls.forEach((url) => {
  const [, query = ""] = url.split("?v=");
  assert(query.length > 0, `portal cache URL missing version: ${url}`);
});
assert(/portal\.js\?v=[^"]+/.test(fs.readFileSync(path.join(root, "index.html"), "utf8")), "portal script cache bust missing");

console.log(`backend login audit passed: ${units.length} ready units, shared deployment ${version}`);
