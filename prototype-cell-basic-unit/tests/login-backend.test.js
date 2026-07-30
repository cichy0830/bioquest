const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function functionSource(name) {
  const asyncStart = source.indexOf(`async function ${name}(`);
  const start = asyncStart >= 0 ? asyncStart : source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") { depth += 1; opened = true; }
    if (source[index] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

const message = { innerHTML: "" };
const context = {
  structuredClone,
  window: { BioQuestLoginUX: { begin() {}, paint: async () => {} } },
  document: { querySelector(selector) { return selector === "#loginMessage" ? message : null; } },
  BASIC_UNIT_VERSION: "20260712-basic-unit-sheet-login-v4",
  defaultState: { screen: "login", student: null, remote_completed_attempts: 0, attempt_type: "first", started_at: null, attempt_id: "", attempt_session_token: "", question_version: "", session_expires_at: "", remote_previous_attempt_id: "", remote_previous_accuracy: null, pending_hint_ids: [], failed_hint_ids: [], completedScreens: ["login", "rules"], optionOrders: {} },
  state: { screen: "login", student: { student_id: "S70101", student_name: "Old Local Student" } },
  roster: { guest: { student_id: "guest", student_name: "老師測試帳號", class_name: "測試", seat_no: "00", is_guest: true } },
  saveState() {},
  renderStudentMini() {},
  studentAttempts() { return []; },
  startAttemptSession: async () => ({ attempt_id: "attempt-1", attempt_session_token: "session.nonce", question_version: "20260712-basic-unit-sheet-login-v4", verification_mode: "server_verified", expires_at: "2026-07-12T12:00:00.000Z" }),
  unlock() {},
  setScreen(screen) { context.state.screen = screen; }
};
vm.createContext(context);
vm.runInContext([
  functionSource("isServerVerifiedSession"),
  functionSource("normalizeBackendStudent"),
  functionSource("clearPendingLoginIdentity"),
  functionSource("login")
].join("\n"), context);

async function run() {
  let guestFetchCalls = 0;
  let guestStartCalls = 0;
  context.fetchStudentStatus = async () => {
    guestFetchCalls += 1;
    throw new Error("guest_must_not_fetch");
  };
  context.startAttemptSession = async () => {
    guestStartCalls += 1;
    throw new Error("guest_must_not_start_attempt");
  };
  await context.login("guest");
  assert.equal(guestFetchCalls, 0, "guest login must not call getStudentAndAttemptStatus");
  assert.equal(guestStartCalls, 0, "guest login must not call startAttempt");
  assert.equal(context.state.student.student_id, "guest");
  assert.equal(context.state.question_version, "20260712-basic-unit-sheet-login-v4");

  context.startAttemptSession = async () => ({
    attempt_id: "attempt-1",
    attempt_session_token: "session.nonce",
    question_version: "20260712-basic-unit-sheet-login-v4",
    verification_mode: "server_verified",
    expires_at: "2026-07-12T12:00:00.000Z"
  });
  context.fetchStudentStatus = async () => ({
    ok: true,
    student: { student_id: "S70101", student_name: "Sheet Student", class_name: "701", seat_no: "01" },
    progress: { total_exp: 1500, current_title_id: "ecology_recorder", current_title: "生態記錄員", profile_gender: "female", title_avatar_path: "shared-assets/title-avatars/example.webp" },
    completed_attempts: 2,
    attempt_type: "retry"
  });
  await context.login("S70101");
  assert.equal(context.state.student.student_name, "Sheet Student");
  assert.equal(context.state.remote_completed_attempts, 2);
  assert.equal(context.state.student.total_exp, 1500);

  context.state.student = { student_id: "S70101", student_name: "Stale Student" };
  context.fetchStudentStatus = async () => { throw new Error("network_failed"); };
  await context.login("S70101");
  assert.equal(context.state.student, null, "fetch failure must clear stale non-guest identity");
  assert.ok(message.innerHTML.includes("尚未登入"));

  context.state.student = { student_id: "S70101", student_name: "Stale Student" };
  context.fetchStudentStatus = async () => ({ ok: false, error: "student_not_found" });
  await context.login("S70101");
  assert.equal(context.state.student, null, "API error must not restore a local student");
  assert.ok(message.innerHTML.includes("查無此學號"));

  context.fetchStudentStatus = async () => ({
    ok: true,
    student: { student_id: "S70101", student_name: "Sheet Student", class_name: "701", seat_no: "01" },
    completed_attempts: 0,
    attempt_status: {}
  });
  context.startAttemptSession = async () => ({ attempt_id: "attempt-2", attempt_session_token: "", question_version: "pending_registry", verification_mode: "pending_canonical_registry" });
  await context.login("S70101");
  assert.equal(context.state.student, null, "pending registry must not enter the unit");
  assert.ok(message.innerHTML.includes("後台版本尚未更新，請通知老師。"));

  const fetchSource = functionSource("fetchStudentStatus");
  assert.ok(fetchSource.includes("unit_id=${encodeURIComponent(mission.unit_id)}"));
  assert.ok(fetchSource.includes('cache: "no-store"'));
  assert.ok(fetchSource.includes("Date.now()"));
  const loginSource = functionSource("login");
  assert.ok(loginSource.includes("isServerVerifiedSession(serverSession)"));
  assert.ok(loginSource.includes("backend_registry_not_ready"));
  assert.ok(loginSource.includes("後台版本尚未更新，請通知老師。"));
  assert.ok(loginSource.includes("後台目前無法連線"));
  assert.ok(loginSource.includes('if (isGuest)'));
  assert.ok(loginSource.indexOf('if (isGuest)') < loginSource.indexOf('fetchStudentStatus(id)'), "guest must branch before backend fetch");
  assert.ok(functionSource("startAttemptSession").includes("question_version: BASIC_UNIT_VERSION"));
  const hintSource = functionSource("recordHintEvent");
  assert.equal((hintSource.match(/return flushHintEvents\(\[questionId\]\)/g) || []).length, 1);
  assert.ok(functionSource("flushHintEvents").includes("state.failed_hint_ids = failed"));
  assert.ok(functionSource("attachReflection").includes("await flushHintEvents()"));
  const payloadSource = functionSource("buildBackendPayload");
  assert.ok(payloadSource.includes("attempt_session_token"));
  assert.ok(payloadSource.includes("previous_attempt_id"));
  assert.ok(payloadSource.includes("question_version"));
  assert.ok(payloadSource.includes("raw_answers_json"));
  assert.ok(functionSource("canonicalQuestionLogs").includes('["q01", "q02", "q03", "q04", "q06", "q07", "q08", "q09", "q10", "q12", "q13", "q14"]'));
  assert.ok(!source.includes("林安安"));
  assert.ok(!source.includes("陳柏宇"));
  assert.ok(!source.includes("許若晴"));
  assert.ok(!loginSource.includes("roster[id]"));
  console.log("cell-basic-unit backend login regression checks passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
