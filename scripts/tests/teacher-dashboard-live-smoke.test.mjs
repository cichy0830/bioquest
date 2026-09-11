import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TEACHER_KEY_ENV,
  buildSafeSummary,
  deploymentUrlFromSharedConfig,
  validateAuthorizedPayload,
  validateUnauthorizedPayload,
} from "../teacher-dashboard-live-smoke.mjs";

const currentFile = fileURLToPath(import.meta.url);
const isPublishCopy = currentFile.includes(`${path.sep}_publish${path.sep}bioquest${path.sep}`);
const workspaceRoot = path.resolve(path.dirname(currentFile), isPublishCopy ? "../../../.." : "../..");
const sourceScriptPath = path.join(workspaceRoot, "scripts", "teacher-dashboard-live-smoke.mjs");
const publishScriptPath = path.join(workspaceRoot, "_publish", "bioquest", "scripts", "teacher-dashboard-live-smoke.mjs");
const sourceTestPath = path.join(workspaceRoot, "scripts", "tests", "teacher-dashboard-live-smoke.test.mjs");
const publishTestPath = path.join(workspaceRoot, "_publish", "bioquest", "scripts", "tests", "teacher-dashboard-live-smoke.test.mjs");
const sourceScript = fs.readFileSync(sourceScriptPath, "utf8");

assert.equal(fs.readFileSync(publishScriptPath, "utf8"), sourceScript, "source/publish live-smoke scripts differ");
assert.equal(fs.readFileSync(publishTestPath, "utf8"), fs.readFileSync(sourceTestPath, "utf8"), "source/publish live-smoke tests differ");
assert.equal(TEACHER_KEY_ENV, "BIOQUEST_TEACHER_DASHBOARD_KEY");
assert.match(deploymentUrlFromSharedConfig(), /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/);
assert.doesNotMatch(sourceScript, /AKfy[A-Za-z0-9_-]+/, "deployment id must come from shared config");
assert.doesNotMatch(sourceScript, /readFileSync\([^\n]*(teacher|key)/i, "teacher key must not be read from a file");
assert.doesNotMatch(sourceScript, /process\.argv\.(slice|find)|--teacher|--key/i, "teacher key must not be accepted as a command-line argument");
assert.match(sourceScript, /method: "POST"/);
assert.match(sourceScript, /application\/x-www-form-urlencoded/);

const validPayload = {
  ok: true,
  schema_version: "teacher_dashboard_v3",
  data_source: "google_sheet",
  generated_at: "2026-09-10T05:00:00.000Z",
  students: [{ student_id: "704001", student_name: "測試學生甲", class_name: "704" }],
  attempts: [],
  question_logs: [],
  student_progress: [],
  teacher_reviews: [],
  usage_summary: [{
    class_name: "704",
    unit_id: "life_world",
    unit_title: "生命世界與科學方法",
    date: "2026-09-09",
    started_student_count: 1,
    submitted_student_count: 0,
    open_unsubmitted_session_count: 1,
    expired_unsubmitted_session_count: 0,
    submitted_session_count: 0,
    latest_activity_at: "2026-09-09T01:00:00.000Z",
  }],
  source_counts: {
    students: 1,
    attempts: 0,
    attempt_sessions: 1,
    question_logs: 0,
    student_progress: 0,
    teacher_reviews: 0,
  },
};

const safeSummary = validateAuthorizedPayload(JSON.stringify(validPayload), "runtime-only-secret");
assert.deepEqual(safeSummary, buildSafeSummary(validPayload));
const emittedSummary = JSON.stringify(safeSummary);
assert.doesNotMatch(emittedSummary, /704001|測試學生甲|runtime-only-secret/);
assert.equal(safeSummary.started, 1);
assert.equal(safeSummary.submitted, 0);

assert.throws(() => validateAuthorizedPayload(JSON.stringify({ ...validPayload, attempt_sessions: [] }), "runtime-only-secret"));
assert.throws(() => validateAuthorizedPayload(JSON.stringify({ ...validPayload, access_token: "forbidden" }), "runtime-only-secret"));
assert.throws(() => validateAuthorizedPayload(JSON.stringify({
  ...validPayload,
  usage_summary: [{ ...validPayload.usage_summary[0], student_id: "704001" }],
}), "runtime-only-secret"));
assert.throws(() => validateAuthorizedPayload(JSON.stringify({
  ...validPayload,
  usage_summary: [{ ...validPayload.usage_summary[0], unit_title: "測試學生甲" }],
}), "runtime-only-secret"));
["TEST", "test", " Test ", "測試"].forEach((className) => {
  assert.throws(() => validateAuthorizedPayload(JSON.stringify({
    ...validPayload,
    usage_summary: [{ ...validPayload.usage_summary[0], class_name: className }],
  }), "runtime-only-secret"));
});
assert.throws(() => validateAuthorizedPayload(`${JSON.stringify(validPayload)}runtime-only-secret`, "runtime-only-secret"));

validateUnauthorizedPayload(JSON.stringify({ ok: false, error: "teacher_dashboard_unauthorized" }), "known-invalid-key");
assert.throws(() => validateUnauthorizedPayload(JSON.stringify({
  ok: false,
  error: "teacher_dashboard_unauthorized",
  source_counts: {},
}), "known-invalid-key"));

console.log("teacher dashboard live-smoke static contract checks passed");
