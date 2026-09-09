const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function element(id) {
  return {
    id,
    value: "",
    disabled: false,
    hidden: false,
    innerHTML: "",
    textContent: "",
    className: "",
    selectedOptions: [{ textContent: "" }],
    dataset: {},
    listeners: {},
    classList: { toggle() {} },
    addEventListener(type, handler) { this.listeners[type] = handler; },
    focus() { this.focused = true; }
  };
}

const elements = new Map();
const viewButtons = ["unit", "usage", "questions", "feedback", "class", "student"].map((view) => ({
  dataset: { view },
  classList: { toggle() {} },
  addEventListener() {}
}));

const documentStub = {
  querySelector(selector) {
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      if (!elements.has(id)) elements.set(id, element(id));
      return elements.get(id);
    }
    return element(selector);
  },
  querySelectorAll(selector) {
    if (selector === "[data-view]") return viewButtons;
    return [];
  }
};

const context = {
  console,
  Intl,
  URLSearchParams,
  window: {
    BioQuestTeacherAnalytics: {
      buildQuestionAnalytics: () => [],
      buildConceptDiagnostics: () => [],
      buildFeedbackSummary: () => ({ questions: [], uncertain: [], lowConfidence: [], pendingReviews: [], confident: [] }),
      humanizeToken: (value) => String(value)
    }
  },
  document: documentStub,
  fetch: async () => ({ ok: false, status: 500 })
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8"), context);

const api = context.window.BioQuestTeacherDashboard;
assert.equal(api.VERSION, "20260909-teacher-usage-summary-v1");

const payload = {
  ok: true,
  schema_version: "teacher_dashboard_v3",
  data_source: "google_sheet",
  generated_at: "2030-01-02T02:00:00.000Z",
  canonical_unit_ids: ["life_world"],
  students: [
    { student_id: "S70101", student_name: "學生甲", class_name: "701", seat_no: "01", active: true },
    { student_id: "guest", student_name: "老師測試", class_name: "測試", seat_no: "00", active: true }
  ],
  attempts: [],
  question_logs: [],
  student_progress: [],
  teacher_reviews: [],
  attempt_sessions: [{ student_id: "S70101", attempt_session_id: "must-not-be-used" }],
  source_counts: { attempt_sessions: 3 },
  usage_summary: [
    {
      class_name: "701",
      unit_id: "life_world",
      unit_title: "第 1 站｜多彩多姿的生命世界",
      date: "2030-01-02",
      started_student_count: "2",
      submitted_student_count: "1",
      open_unsubmitted_session_count: "1",
      expired_unsubmitted_session_count: "0",
      submitted_session_count: "1",
      latest_activity_at: "2030-01-02T02:00:00.000Z",
      student_id: "S70101",
      attempt_session_id: "leak",
      token: "secret"
    }
  ],
  warnings: []
};

const normalized = api.normalizeDashboard(payload);
assert.equal(normalized.students.length, 1);
assert.equal(normalized.sourceCounts.attempt_sessions, 3);
assert.equal(normalized.usageSummary.length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(normalized.usageSummary[0])), {
  class_name: "701",
  unit_id: "life_world",
  unit_title: "第 1 站｜多彩多姿的生命世界",
  date: "2030-01-02",
  started_student_count: 2,
  submitted_student_count: 1,
  open_unsubmitted_session_count: 1,
  expired_unsubmitted_session_count: 0,
  submitted_session_count: 1,
  latest_activity_at: "2030-01-02T02:00:00.000Z"
});
assert.equal(JSON.stringify(normalized.usageSummary).includes("S70101"), false);
assert.equal(Object.prototype.hasOwnProperty.call(normalized, "attempt_sessions"), false);
assert.deepEqual(JSON.parse(JSON.stringify(api.usageTotals(normalized.usageSummary))), {
  started: 2,
  submitted: 1,
  openUnsubmitted: 1,
  expiredUnsubmitted: 0,
  submittedSessions: 1
});

const missingUsage = { ...payload };
delete missingUsage.usage_summary;
assert.throws(() => api.normalizeDashboard(missingUsage), /dashboard_field_missing:usage_summary/);

console.log("teacher dashboard app: all assertions passed");
