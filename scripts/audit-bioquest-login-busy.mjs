#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portal = fs.readFileSync(path.join(root, "portal.js"), "utf8");
const start = portal.indexOf("const units = [");
const end = portal.indexOf("\n\nconst statusText", start);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function blockEnd(source, openBraceIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let templateDepth = 0;
  for (let i = openBraceIndex; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (quote === "`" && ch === "$" && next === "{") {
        templateDepth += 1;
        i += 1;
        continue;
      }
      if (quote === "`" && ch === "}" && templateDepth > 0) {
        templateDepth -= 1;
        continue;
      }
      if (ch === quote && templateDepth === 0) quote = "";
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("function block end not found");
}

function asyncFunctionBlock(source, name, folder) {
  const match = new RegExp(`async function ${name}\\s*\\([^)]*\\)\\s*\\{`).exec(source);
  assert(match, `${folder || "app"} missing async function ${name}`);
  const openBrace = source.indexOf("{", match.index);
  return source.slice(match.index, blockEnd(source, openBrace));
}

function loginFunctionName(source) {
  if (/async function login\s*\(/.test(source)) return "login";
  if (/async function handleLogin\s*\(/.test(source)) return "handleLogin";
  return "login";
}

assert(start >= 0 && end > start, "portal units block missing");
const units = Function(`${portal.slice(start, end)}; return units;`)().filter((unit) => unit.status === "ready" && unit.url);
assert(units.length === 24, `expected 24 ready units, found ${units.length}`);

const helper = fs.readFileSync(path.join(root, "shared-assets", "bioquest-character-layout.js"), "utf8");
for (const token of [
  "global.BioQuestLoginUX",
  "beginLoginBusy",
  "waitForLoginPaint",
  "requestAnimationFrame",
  "aria-live",
  "aria-busy",
  "disabled = true",
  "正在連接 BioQuest 學習後台，請稍候……",
  "正在建立老師測試模式，請稍候……"
]) assert(helper.includes(token), `shared login busy token missing: ${token}`);

for (const unit of units) {
  const folder = unit.url.split("/")[0];
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const index = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  const functionName = loginFunctionName(app);
  const block = asyncFunctionBlock(app, functionName, folder);
  const beginIndex = block.indexOf("BioQuestLoginUX?.begin");
  const paintIndex = block.indexOf("BioQuestLoginUX?.paint");
  const firstAwaitIndex = block.indexOf("await ");
  const fetchStatusIndex = block.search(/fetchStudentStatus|requestBackend|fetch\(/);
  assert(beginIndex > 0, `${folder} missing login busy begin`);
  assert(paintIndex > beginIndex, `${folder} missing paint wait after busy begin`);
  assert(firstAwaitIndex === paintIndex - "await ".length || beginIndex < firstAwaitIndex, `${folder} busy begin must precede first await`);
  assert(fetchStatusIndex < 0 || beginIndex < fetchStatusIndex, `${folder} busy begin must precede backend fetch`);
  assert(block.indexOf("if (!") >= 0 && block.indexOf("if (!") < beginIndex, `${folder} blank-id validation must happen before busy begin`);
  assert(/bioquest-character-layout\.js\?v=[^"]+/.test(index), `${folder} shared JS cache bust missing`);
  assert(/bioquest-character-layout\.css\?v=[^"]+/.test(index), `${folder} shared CSS cache bust missing`);
  assert(/app\.js\?v=[^"]+/.test(index), `${folder} app cache bust missing`);
}

const readyUrls = [...portal.matchAll(/status:\s*"ready"[\s\S]*?url:\s*"([^"]+)"/g)].map((match) => match[1]);
readyUrls.forEach((url) => {
  assert(/\?v=[^"]+$/.test(url), `ready URL missing cache bust: ${url}`);
});

console.log(`login busy audit passed: ${units.length} ready units`);
