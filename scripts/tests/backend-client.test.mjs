// ROADMAP R4 共用引擎第一批：後台呼叫集中在 shared-assets/bioquest-backend-client.js。
// 1. 共用模組送出的請求（方法、網址、標頭、內容）與錯誤訊息，必須和各站原本內嵌的 requestBackend 完全相同
//    （原本寫法保留在下方 LEGACY_REQUEST_BACKEND 當對照）。
// 2. 已遷移的站：index.html 依序載入 backend-config → backend-client → app.js；app.js 不再自己 fetch 後台。
// 3. 尚未遷移的 JSON 協定站：內嵌版本仍與對照逐字相同（避免各站又各自分歧）。
//    R4-1b（2026-11-08）後第 14–40 站全部遷移，JSON 協定站已無內嵌版本；第 1–13 站為表單協定，留待 R4-1c。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const clientSource = fs.readFileSync(path.join(root, "shared-assets", "bioquest-backend-client.js"), "utf8");
const configSource = fs.readFileSync(path.join(root, "shared-assets", "bioquest-backend-config.js"), "utf8");
const clientVersion = clientSource.match(/const VERSION = "([^"]+)"/)[1];

export const MIGRATED_STATIONS = [
  "photosynthesis",
  "human-nutrition",
  "plant-transport-structures",
  "plant-material-transport",
  "cardiovascular-components",
  "human-circulation",
  "stimulus-response",
  "nervous-system",
  "endocrine-system",
  "behavior-sensing",
  "respiration-homeostasis",
  "excretion-water-homeostasis",
  "temperature-glucose-homeostasis",
  "cell-division",
  "asexual-reproduction",
  "sexual-reproduction",
  "egg-observation",
  "flower-observation",
  "genetics-chromosome-gene",
  "human-genetics",
  "abo-blood-type",
  "mutation-genetic-disease",
  "biotechnology",
  "fossils-evolution",
  "naming-classification",
  "dichotomous-key",
  "prokaryotes-protists-fungi"
];

const LEGACY_REQUEST_BACKEND = `async function requestBackend(params) {
  const queryParams = params.action === "getStudentAndAttemptStatus"
    ? { ...params, _: String(Date.now()) }
    : { action: params.action, _: String(Date.now()) };
  const query = \`?\${new URLSearchParams(queryParams).toString()}\`;
  const response = await fetch(\`\${BACKEND_URL}\${query}\`, {
    method: params.action === "getStudentAndAttemptStatus" ? "GET" : "POST",
    cache: "no-store",
    headers: params.action === "getStudentAndAttemptStatus" ? undefined : { "Content-Type": "text/plain;charset=utf-8" },
    body: params.action === "getStudentAndAttemptStatus" ? undefined : JSON.stringify(params)
  });
  if (!response.ok) throw new Error(\`backend_http_\${response.status}\`);
  const data = await response.json();
  if (!data || data.ok === false) throw new Error(data?.error || "backend_error");
  return data;
}`;

function makeContext(reply) {
  const calls = [];
  const context = {
    URLSearchParams,
    JSON,
    Error,
    Date: { now: () => 1762500000000 },
    fetch: async (url, init) => {
      calls.push({ url, init: JSON.parse(JSON.stringify(init ?? null)) });
      return reply();
    }
  };
  context.window = context;
  return { context, calls };
}

const cases = [
  [{ action: "getStudentAndAttemptStatus", student_id: "115 001", unit_id: "abo_blood_type" }, () => ({ ok: true, status: 200, json: async () => ({ ok: true, student: { student_id: "115001" } }) })],
  [{ action: "startAttempt", student_id: "115001", unit_id: "u", question_version: "v1" }, () => ({ ok: true, status: 200, json: async () => ({ ok: true, attempt_id: "A" }) })],
  [{ action: "submitAttempt", answers_json: "{\"q\":1}", reflection: "中文 & = ?" }, () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })],
  [{ action: "submitAttempt" }, () => ({ ok: false, status: 500, json: async () => ({}) })],
  [{ action: "submitAttempt" }, () => ({ ok: true, status: 200, json: async () => ({ ok: false, error: "attempt_session_expired" }) })],
  [{ action: "startAttempt" }, () => ({ ok: true, status: 200, json: async () => ({ ok: false }) })],
  [{ action: "startAttempt" }, () => ({ ok: true, status: 200, json: async () => null })]
];

async function run(fn) {
  try { return { value: await fn() }; } catch (error) { return { error: error.message }; }
}

for (const [params, reply] of cases) {
  const legacy = makeContext(reply);
  vm.runInNewContext(`${configSource}\nconst BACKEND_URL = window.BioQuestBackend?.url;\n${LEGACY_REQUEST_BACKEND}\nwindow.requestBackend = requestBackend;`, legacy.context);
  const legacyResult = await run(() => legacy.context.requestBackend(params));

  const shared = makeContext(reply);
  vm.runInNewContext(`${configSource}\n${clientSource}`, shared.context);
  const sharedResult = await run(() => shared.context.BioQuestBackendClient.request(params));

  assert.deepEqual(shared.calls, legacy.calls, `${params.action} 請求內容與原本不同`);
  assert.deepEqual(JSON.parse(JSON.stringify(sharedResult)), JSON.parse(JSON.stringify(legacyResult)), `${params.action} 回傳或錯誤訊息與原本不同`);
}

// 沒載入 backend-config 時，共用模組用與各站相同的備援網址
{
  const { context, calls } = makeContext(() => ({ ok: true, status: 200, json: async () => ({ ok: true }) }));
  vm.runInNewContext(clientSource, context);
  await context.BioQuestBackendClient.request({ action: "startAttempt" });
  const configUrl = configSource.match(/const url = "([^"]+)"/)[1];
  assert.ok(calls[0].url.startsWith(`${configUrl}?`), "備援網址必須與 backend-config 相同");
}

for (const station of MIGRATED_STATIONS) {
  const folder = `prototype-${station}`;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(root, folder, "index.html"), "utf8");
  assert.ok(!/\bfetch\(/.test(app), `${folder} app.js 不應自己呼叫 fetch（後台請求一律經共用模組）`);
  assert.ok(!app.includes("BACKEND_URL"), `${folder} app.js 不應再有自己的後台網址`);
  assert.ok(app.includes("window.BioQuestBackendClient.request(params)"), `${folder} requestBackend 未改用共用模組`);
  const configAt = html.indexOf("bioquest-backend-config.js?v=");
  const clientAt = html.indexOf(`bioquest-backend-client.js?v=${clientVersion}`);
  const appAt = html.indexOf("app.js?v=", clientAt);
  assert.ok(configAt > 0 && clientAt > configAt && appAt > clientAt, `${folder} 載入順序須為 backend-config → backend-client → app.js（版本 ${clientVersion}）`);
}

// 尚未遷移、但用 JSON 協定的站：內嵌 requestBackend 仍須與對照逐字相同
let legacyCount = 0;
for (const folder of fs.readdirSync(root).filter((name) => name.startsWith("prototype-"))) {
  if (MIGRATED_STATIONS.includes(folder.slice("prototype-".length))) continue;
  const app = fs.readFileSync(path.join(root, folder, "app.js"), "utf8");
  const start = app.indexOf("async function requestBackend(params) {");
  if (start < 0) continue;
  const block = app.slice(start, app.indexOf("\n}\n", start) + 2);
  assert.equal(block, LEGACY_REQUEST_BACKEND, `${folder} 的 requestBackend 與共用寫法不同，遷移前需先比對`);
  legacyCount += 1;
}

assert.equal(MIGRATED_STATIONS.length, 27, "第 14–40 站應全部改用共用模組");
assert.equal(legacyCount, 0, "JSON 協定站不應再有內嵌 requestBackend");

console.log(`backend client test passed: ${cases.length} cases identical, ${MIGRATED_STATIONS.length} stations migrated, ${legacyCount} JSON-protocol stations pending`);
