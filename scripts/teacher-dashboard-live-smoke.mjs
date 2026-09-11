import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEACHER_KEY_ENV = "BIOQUEST_TEACHER_DASHBOARD_KEY";
const REQUIRED_SOURCE_COUNTS = [
  "students",
  "attempts",
  "attempt_sessions",
  "question_logs",
  "student_progress",
  "teacher_reviews",
];
const USAGE_FIELDS = new Set([
  "class_name",
  "unit_id",
  "unit_title",
  "date",
  "started_student_count",
  "submitted_student_count",
  "open_unsubmitted_session_count",
  "expired_unsubmitted_session_count",
  "submitted_session_count",
  "latest_activity_at",
]);

function ensure(condition) {
  if (!condition) throw new Error("teacher_dashboard_live_smoke_validation_failed");
}

function deploymentUrlFromSharedConfig() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const configPath = path.join(scriptDirectory, "..", "shared-assets", "bioquest-backend-config.js");
  const source = fs.readFileSync(configPath, "utf8");
  const match = source.match(/const url = "(https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec)";/);
  ensure(match);
  return match[1];
}

async function requestDashboard(endpoint, teacherKey, fetchImpl = globalThis.fetch) {
  ensure(typeof fetchImpl === "function");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      redirect: "follow",
      cache: "no-store",
      headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ action: "getTeacherDashboard", teacher_key: teacherKey }),
      signal: controller.signal,
    });
    ensure(response.ok);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parsePayload(rawText) {
  ensure(typeof rawText === "string" && rawText.length > 0);
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (_error) {
    throw new Error("teacher_dashboard_live_smoke_validation_failed");
  }
  ensure(payload && typeof payload === "object" && !Array.isArray(payload));
  return payload;
}

function assertNoCredentialFields(value) {
  if (Array.isArray(value)) {
    value.forEach(assertNoCredentialFields);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.entries(value).forEach(([key, child]) => {
    ensure(!/(^|_)(token|nonce)(_|$)/i.test(key));
    assertNoCredentialFields(child);
  });
}

function validateUnauthorizedPayload(rawText, invalidKey) {
  ensure(!rawText.includes(invalidKey));
  const payload = parsePayload(rawText);
  ensure(payload.ok === false);
  ensure(payload.error === "teacher_dashboard_unauthorized");
  ensure(!Object.prototype.hasOwnProperty.call(payload, "students"));
  ensure(!Object.prototype.hasOwnProperty.call(payload, "attempts"));
  ensure(!Object.prototype.hasOwnProperty.call(payload, "usage_summary"));
  ensure(!Object.prototype.hasOwnProperty.call(payload, "source_counts"));
  assertNoCredentialFields(payload);
}

function privateStudentValues(payload) {
  const values = new Set();
  const sources = [payload.students, payload.attempts, payload.question_logs, payload.student_progress, payload.teacher_reviews];
  sources.forEach((rows) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((row) => {
      [row?.student_id, row?.student_name].forEach((value) => {
        const normalized = String(value || "").trim();
        if (normalized.length >= 2) values.add(normalized);
      });
    });
  });
  return values;
}

function validateUsageSummary(payload) {
  ensure(Array.isArray(payload.usage_summary));
  const privateValues = privateStudentValues(payload);
  payload.usage_summary.forEach((row) => {
    ensure(row && typeof row === "object" && !Array.isArray(row));
    Object.keys(row).forEach((key) => ensure(USAGE_FIELDS.has(key)));
    [
      "started_student_count",
      "submitted_student_count",
      "open_unsubmitted_session_count",
      "expired_unsubmitted_session_count",
      "submitted_session_count",
    ].forEach((key) => ensure(Number.isInteger(row[key]) && row[key] >= 0));
    ensure(typeof row.class_name === "string");
    const normalizedClassName = row.class_name.trim().toLowerCase();
    ensure(normalizedClassName !== "test" && normalizedClassName !== "測試");
    ensure(typeof row.unit_id === "string");
    ensure(typeof row.unit_title === "string");
    ensure(typeof row.date === "string");
    const serialized = JSON.stringify(row);
    privateValues.forEach((value) => ensure(!serialized.includes(value)));
  });
}

function buildSafeSummary(payload) {
  const counts = payload.source_counts;
  ensure(counts && typeof counts === "object" && !Array.isArray(counts));
  REQUIRED_SOURCE_COUNTS.forEach((key) => ensure(Number.isInteger(counts[key]) && counts[key] >= 0));
  validateUsageSummary(payload);
  return {
    students: counts.students,
    attempts: counts.attempts,
    attempt_sessions: counts.attempt_sessions,
    question_logs: counts.question_logs,
    student_progress: counts.student_progress,
    teacher_reviews: counts.teacher_reviews,
    usage_rows: payload.usage_summary.length,
    started: payload.usage_summary.reduce((sum, row) => sum + row.started_student_count, 0),
    submitted: payload.usage_summary.reduce((sum, row) => sum + row.submitted_student_count, 0),
    open_unsubmitted: payload.usage_summary.reduce((sum, row) => sum + row.open_unsubmitted_session_count, 0),
    expired_unsubmitted: payload.usage_summary.reduce((sum, row) => sum + row.expired_unsubmitted_session_count, 0),
  };
}

function validateAuthorizedPayload(rawText, teacherKey) {
  ensure(teacherKey && !rawText.includes(teacherKey));
  const payload = parsePayload(rawText);
  ensure(payload.ok === true);
  ensure(payload.schema_version === "teacher_dashboard_v3");
  ensure(payload.data_source === "google_sheet");
  ensure(typeof payload.generated_at === "string" && !Number.isNaN(Date.parse(payload.generated_at)));
  ensure(!Object.prototype.hasOwnProperty.call(payload, "attempt_sessions"));
  assertNoCredentialFields(payload);
  return buildSafeSummary(payload);
}

function printStatus(status, label, fields = []) {
  ensure(status === "PASS" || status === "SKIP");
  const tokens = [status, label, ...fields];
  tokens.forEach((token) => ensure(/^[A-Za-z0-9_.=-]+$/.test(String(token))));
  process.stdout.write(`${tokens.join(" ")}\n`);
}

async function run() {
  const endpoint = deploymentUrlFromSharedConfig();
  const invalidKey = `bioquest-invalid-${crypto.randomUUID()}`;
  const unauthorizedText = await requestDashboard(endpoint, invalidKey);
  validateUnauthorizedPayload(unauthorizedText, invalidKey);
  printStatus("PASS", "wrong_teacher_key_fail_closed");

  const teacherKey = String(process.env[TEACHER_KEY_ENV] || "").trim();
  if (!teacherKey) {
    printStatus("SKIP", "authorized_teacher_dashboard_live", ["reason=missing_environment_key"]);
    return;
  }

  const authorizedText = await requestDashboard(endpoint, teacherKey);
  const summary = validateAuthorizedPayload(authorizedText, teacherKey);
  const fields = Object.entries(summary).map(([key, value]) => `${key}=${value}`);
  printStatus("PASS", "authorized_teacher_dashboard_live", fields);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  run().catch(() => {
    printStatus("SKIP", "teacher_dashboard_live_smoke", ["reason=validation_or_connection_failed"]);
    process.exitCode = 1;
  });
}

export {
  TEACHER_KEY_ENV,
  buildSafeSummary,
  deploymentUrlFromSharedConfig,
  validateAuthorizedPayload,
  validateUnauthorizedPayload,
};
