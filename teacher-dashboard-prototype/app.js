const DASHBOARD_API_URL = "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const DASHBOARD_SCHEMA = "teacher_dashboard_v3";
const analytics = window.BioQuestTeacherAnalytics;

const state = {
  currentView: "unit",
  data: null,
  loading: false
};

const accessPanel = document.querySelector("#accessPanel");
const accessForm = document.querySelector("#accessForm");
const accessStatus = document.querySelector("#accessStatus");
const connectionState = document.querySelector("#connectionState");
const dashboardContent = document.querySelector("#dashboardContent");
const classFilter = document.querySelector("#classFilter");
const unitFilter = document.querySelector("#unitFilter");
const studentFilter = document.querySelector("#studentFilter");
const studentFilterLabel = document.querySelector("#studentFilterLabel");
const dataWarnings = document.querySelector("#dataWarnings");
const viewRoot = document.querySelector("#viewRoot");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value) {
  return value === true || String(value).toLowerCase() === "true" || String(value) === "1";
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "-";
}

function formatDecimal(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "-";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function verificationLabel(row) {
  const status = String(row?.verification_status || "historical_pre_verification");
  if (status === "server_verified") return '<span class="pill good">後端已驗證</span>';
  if (status === "historical_pre_verification") return '<span class="pill">歷史資料</span>';
  return `<span class="pill warn">${escapeHtml(status)}</span>`;
}

function isOfficialStudent(row) {
  const studentId = String(row?.student_id || "").trim().toLowerCase();
  const className = String(row?.class_name || "").trim();
  const active = String(row?.active ?? "TRUE").toUpperCase() !== "FALSE";
  return Boolean(studentId) && studentId !== "guest" && className !== "測試" && active;
}

function normalizeDashboard(payload) {
  if (!payload || payload.ok !== true) throw new Error(payload?.error || "dashboard_api_failed");
  if (payload.schema_version !== DASHBOARD_SCHEMA) throw new Error("dashboard_deployment_outdated");
  const requiredArrays = ["students", "attempts", "question_logs", "student_progress", "teacher_reviews"];
  requiredArrays.forEach((field) => {
    if (!Array.isArray(payload[field])) throw new Error(`dashboard_field_missing:${field}`);
  });
  return {
    generatedAt: payload.generated_at || "",
    dataSource: payload.data_source || "",
    sourceCounts: payload.source_counts || {},
    canonicalUnitIds: Array.isArray(payload.canonical_unit_ids) ? payload.canonical_unit_ids.map(String) : [],
    students: payload.students.filter(isOfficialStudent),
    attempts: payload.attempts.filter((row) => String(row.student_id || "").toLowerCase() !== "guest"),
    questionLogs: payload.question_logs,
    studentProgress: payload.student_progress.filter((row) => String(row.student_id || "").toLowerCase() !== "guest"),
    teacherReviews: payload.teacher_reviews.filter((row) => String(row.student_id || "").toLowerCase() !== "guest"),
    warnings: Array.isArray(payload.warnings) ? payload.warnings : []
  };
}

async function fetchDashboard(key) {
  const query = new URLSearchParams({ action: "getTeacherDashboard", teacher_key: key });
  const response = await fetch(`${DASHBOARD_API_URL}?${query.toString()}`, { method: "GET", credentials: "omit" });
  if (!response.ok) throw new Error(`dashboard_http_${response.status}`);
  return normalizeDashboard(await response.json());
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function populateFilters() {
  const classes = uniqueSorted(state.data.students.map((row) => row.class_name));
  const unitMap = new Map();
  [...state.data.attempts, ...state.data.studentProgress].forEach((row) => {
    if (!row.unit_id) return;
    unitMap.set(String(row.unit_id), String(row.unit_title || row.unit_id));
  });
  classFilter.innerHTML = classes.length
    ? classes.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")
    : '<option value="">沒有班級資料</option>';
  unitFilter.innerHTML = unitMap.size
    ? [...unitMap.entries()].sort((a, b) => a[1].localeCompare(b[1], "zh-Hant")).map(([id, title]) => `<option value="${escapeHtml(id)}">${escapeHtml(title)}</option>`).join("")
    : '<option value="">沒有單元資料</option>';
  classFilter.disabled = !classes.length;
  unitFilter.disabled = !unitMap.size;
  populateStudentFilter();
}

function studentsForClass() {
  return state.data.students
    .filter((row) => !classFilter.value || String(row.class_name) === classFilter.value)
    .sort((a, b) => String(a.seat_no || "").localeCompare(String(b.seat_no || ""), undefined, { numeric: true }));
}

function populateStudentFilter() {
  const rows = studentsForClass();
  const previous = studentFilter.value;
  studentFilter.innerHTML = rows.length
    ? rows.map((row) => `<option value="${escapeHtml(row.student_id)}">${escapeHtml(row.seat_no || "-")} ${escapeHtml(row.student_name || row.student_id)}</option>`).join("")
    : '<option value="">沒有學生資料</option>';
  if (rows.some((row) => row.student_id === previous)) studentFilter.value = previous;
  studentFilter.disabled = !rows.length;
}

function completedAttempts() {
  return state.data.attempts.filter((row) => {
    const verification = String(row.verification_status || "");
    return row.submitted_at && String(row.completion_status || "complete") === "complete" && verification === "server_verified";
  });
}

function historicalCompleteAttempts() {
  return state.data.attempts.filter((row) => {
    const verification = String(row.verification_status || "");
    return row.submitted_at && String(row.completion_status || "complete") === "complete" && ["server_verified", "historical_pre_verification"].includes(verification);
  });
}

function selectedAttempts() {
  const officialIds = new Set(studentsForClass().map((row) => String(row.student_id)));
  return completedAttempts().filter((row) => officialIds.has(String(row.student_id)) && (!unitFilter.value || String(row.unit_id) === unitFilter.value));
}

function latestSelectedAttempts() {
  const latestByStudent = new Map();
  selectedAttempts().forEach((attempt) => {
    const key = String(attempt.student_id);
    const previous = latestByStudent.get(key);
    if (!previous || String(attempt.submitted_at || "") > String(previous.submitted_at || "")) latestByStudent.set(key, attempt);
  });
  return [...latestByStudent.values()];
}

function selectedLatestAttemptIds() {
  return latestSelectedAttempts().map((attempt) => String(attempt.attempt_id));
}

function latestAttempt(rows) {
  return [...rows].sort((a, b) => String(b.submitted_at || "").localeCompare(String(a.submitted_at || "")))[0] || null;
}

function studentUnitRows() {
  const attempts = selectedAttempts();
  return studentsForClass().map((student) => {
    const own = attempts.filter((row) => String(row.student_id) === String(student.student_id));
    const latest = latestAttempt(own);
    const bestExp = own.reduce((best, row) => Math.max(best, numberValue(row.unit_credited_exp)), 0);
    return {
      student,
      attempts: own,
      latest,
      completed: Boolean(latest),
      bestExp,
      attention: own.some((row) => booleanValue(row.teacher_attention_needed)) || (latest && numberValue(latest.confidence_score, 3) <= 2)
    };
  });
}

function average(rows, getter) {
  const values = rows.map(getter).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
}

function metric(label, value, note = "") {
  return `<article class="panel metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p class="muted">${escapeHtml(note)}</p></article>`;
}

function emptyState(title, detail) {
  return `<article class="panel empty-state"><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(detail)}</p></article>`;
}

function attemptMisconceptions(attempt) {
  return parseArray(attempt?.misconceptions_json);
}

function priorityConcepts(attempts) {
  const attemptIds = new Set(attempts.map((row) => String(row.attempt_id)));
  const counts = new Map();
  state.data.questionLogs
    .filter((log) => attemptIds.has(String(log.attempt_id)) && !booleanValue(log.is_correct))
    .forEach((log) => {
      const key = String(log.skill_tag || log.concept_id || log.question_id || "未標記題目");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  attempts.forEach((attempt) => attemptMisconceptions(attempt).forEach((tag) => {
    const key = String(tag || "");
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function selectedReviews() {
  const officialIds = new Set(studentsForClass().map((row) => String(row.student_id)));
  return state.data.teacherReviews.filter((row) => officialIds.has(String(row.student_id)) && (!unitFilter.value || String(row.unit_id) === unitFilter.value));
}

function sourceAuditPanel() {
  const counts = state.data.sourceCounts || {};
  const latestIds = new Set(selectedLatestAttemptIds());
  const answerLogs = state.data.questionLogs.filter((log) => latestIds.has(String(log.attempt_id)) && (log.answer_json || log.attempt_answer));
  const verified = latestSelectedAttempts().filter((attempt) => String(attempt.verification_status) === "server_verified").length;
  const selectedUnitReady = !unitFilter.value || state.data.canonicalUnitIds.includes(String(unitFilter.value));
  const warning = latestIds.size && !answerLogs.length
    ? '<p class="data-alert">目前部署沒有回傳逐題答案，選答率不會以推測或假資料代替。請重新部署教師儀表板 v3。</p>'
    : "";
  return `<article class="panel source-audit">
    <div><p class="eyebrow">資料真實性</p><h2>Google Sheet 即時資料鏈路</h2></div>
    <div class="audit-grid">
      <p><span>來源</span><strong>${escapeHtml(state.data.dataSource === "google_sheet" ? "Google Sheet / Apps Script" : state.data.dataSource || "未標記")}</strong></p>
      <p><span>資料產生時間</span><strong>${formatDate(state.data.generatedAt)}</strong></p>
      <p><span>API Attempts</span><strong>${numberValue(counts.attempts, state.data.attempts.length)}</strong></p>
      <p><span>API QuestionLogs</span><strong>${numberValue(counts.question_logs, state.data.questionLogs.length)}</strong></p>
      <p><span>本篩選最新作答</span><strong>${latestIds.size}</strong></p>
      <p><span>後端正式驗證</span><strong>${verified}</strong></p>
      <p><span>所選單元正解註冊</span><strong>${selectedUnitReady ? "已完成" : "尚未完成"}</strong></p>
    </div>
    <p class="muted">完成率、正確率與診斷預設只取每位學生在所選單元的最新有效完整挑戰；guest、歷史未驗證與待驗證提交不納入。</p>${selectedUnitReady ? "" : '<p class="data-alert">所選單元尚未加入後端正解註冊，因此目前提交只能保存為待驗證，不會納入正式正確率與迷思統計。</p>'}${warning}
  </article>`;
}

function renderUnitView() {
  const rows = studentUnitRows();
  if (!rows.length) {
    viewRoot.innerHTML = emptyState("沒有名冊資料", "請確認 Students 工作表、班級欄位及 active 狀態。");
    return;
  }
  const completed = rows.filter((row) => row.completed);
  const latest = completed.map((row) => row.latest);
  const concepts = priorityConcepts(latest);
  const reviews = selectedReviews();
  const questionRows = completed.filter((row) => row.latest.student_question || numberValue(row.latest.confidence_score, 3) <= 2 || String(row.latest.reflection_review_status) === "pending_review");
  const completionRate = completed.length / rows.length;
  const averageAccuracy = average(latest, (row) => Number(row.accuracy));
  const averageDirect = average(latest, (row) => numberValue(row.correct_without_hint));
  const averageRevised = average(latest, (row) => numberValue(row.corrected_after_hint));
  const averageConfidence = average(latest, (row) => Number(row.confidence_score));
  const attentionCount = rows.filter((row) => row.attention).length;
  const officialIds = new Set(rows.map((row) => String(row.student.student_id)));
  const pendingCount = state.data.attempts.filter((row) => officialIds.has(String(row.student_id)) && (!unitFilter.value || String(row.unit_id) === unitFilter.value) && String(row.verification_status || "") !== "server_verified").length;
  const unitName = unitFilter.selectedOptions[0]?.textContent || unitFilter.value || "尚無單元";

  viewRoot.innerHTML = `
    ${sourceAuditPanel()}
    <section class="grid summary-grid">
      ${metric("名冊數", rows.length, classFilter.value || "未選班級")}
      ${metric("已完成", completed.length, `未完成 ${rows.length - completed.length} 人`)}
      ${metric("完成率", formatPercent(completionRate), unitName)}
      ${metric("平均正確率", formatPercent(averageAccuracy), "每生最新完整挑戰")}
      ${metric("直接答對", formatDecimal(averageDirect), "平均題數")}
      ${metric("提示後修正", formatDecimal(averageRevised), "平均題數")}
      ${metric("平均信心", formatDecimal(averageConfidence), "1-5 分")}
      ${metric("需關注", attentionCount, "低信心或後台標記")}
      ${metric("待驗證提交", pendingCount, "不納入完成率、EXP 或徽章")}
    </section>
    <section class="panel">
      <h2>學生表現</h2>
      <div class="table-wrap"><table><thead><tr><th>座號</th><th>姓名</th><th>狀態</th><th>挑戰</th><th>正確率</th><th>直接答對</th><th>提示後修正</th><th>信心</th><th>最高認列 EXP</th><th>關注</th></tr></thead><tbody>
        ${rows.map((row) => `<tr><td>${escapeHtml(row.student.seat_no || "-")}</td><td>${escapeHtml(row.student.student_name || row.student.student_id)}</td><td>${row.completed ? '<span class="pill good">完成</span>' : '<span class="pill danger">未完成</span>'}</td><td>${row.attempts.length || "-"}</td><td>${row.latest ? formatPercent(row.latest.accuracy) : "-"}</td><td>${row.latest ? numberValue(row.latest.correct_without_hint) : "-"}</td><td>${row.latest ? numberValue(row.latest.corrected_after_hint) : "-"}</td><td>${row.latest ? escapeHtml(row.latest.confidence_score || "-") : "-"}</td><td>${row.bestExp}</td><td>${row.attention ? '<span class="pill warn">需看</span>' : '<span class="pill">一般</span>'}</td></tr>`).join("")}
      </tbody></table></div>
    </section>
    <section class="grid two-col">
      <article class="panel"><h2>未完成名單</h2>${rows.some((row) => !row.completed) ? `<div class="compact-list">${rows.filter((row) => !row.completed).map((row) => `<p><strong>${escapeHtml(row.student.seat_no || "-")} ${escapeHtml(row.student.student_name || row.student.student_id)}</strong></p>`).join("")}</div>` : "<p>目前沒有未完成學生。</p>"}</article>
      <article class="panel"><h2>優先補強概念</h2>${concepts.length ? concepts.map(([tag, count]) => `<p><span class="pill warn">${escapeHtml(tag)}</span> ${count} 次</p>`).join("") : '<p class="muted">目前沒有可統計的錯題或迷思標籤。</p>'}</article>
    </section>
    <section class="panel"><h2>學生提問、低信心與待複核</h2>
      <div class="question-list">
        ${questionRows.map((row) => `<div class="question-card"><p><strong>${escapeHtml(row.student.seat_no || "-")} ${escapeHtml(row.student.student_name || row.student.student_id)}</strong> <span class="pill">${escapeHtml(row.latest.reflection_quality || "未分類")}</span> <span class="pill">信心 ${escapeHtml(row.latest.confidence_score || "-")}</span></p><p>${escapeHtml(row.latest.student_question || "未留下問題")}</p></div>`).join("")}
        ${reviews.map((review) => `<div class="question-card review-card"><p><strong>${escapeHtml(review.student_name || review.student_id)}</strong> <span class="pill warn">${escapeHtml(review.issue_type || "待複核")}</span> <span class="pill">${escapeHtml(review.priority || "normal")}</span></p><p>${escapeHtml(review.student_question || "未留下問題")}</p></div>`).join("")}
        ${!questionRows.length && !reviews.length ? '<p class="muted">目前沒有低信心、待複核或具體提問紀錄。</p>' : ""}
      </div>
    </section>`;
}

function questionLabel(questionId) {
  const match = String(questionId || "").match(/_(q\d+)$/i);
  return match ? match[1].toUpperCase() : String(questionId || "未標記題目");
}

function diagnosticLevel(level) {
  if (level === "A") return { label: "優先課堂澄清", className: "danger" };
  if (level === "B") return { label: "講述時補辨識線索", className: "warn" };
  if (level === "N") return { label: "資料量不足", className: "" };
  return { label: "持續觀察", className: "good" };
}

function renderQuestionView() {
  const attempts = latestSelectedAttempts();
  if (!attempts.length) {
    viewRoot.innerHTML = sourceAuditPanel() + emptyState("尚無可分析的完整作答", "請先確認所選班級與單元已有後端驗證的完整提交。");
    return;
  }
  const attemptIds = attempts.map((row) => String(row.attempt_id));
  const questions = analytics.buildQuestionAnalytics(state.data.questionLogs, attemptIds);
  const diagnostics = analytics.buildConceptDiagnostics(state.data.questionLogs, attemptIds);
  const hasAnswers = questions.some((question) => question.answerRecorded > 0);
  viewRoot.innerHTML = `${sourceAuditPanel()}
    <section class="panel">
      <p class="eyebrow">課前診斷</p><h2>概念迷思與教學策略提醒</h2>
      <p class="muted">提示使用代表學生曾需要鷹架；最終完成不代表一開始完全沒有困難。這些資料用於調整講述，不代表學生的固定能力。</p>
      <div class="diagnostic-grid">${diagnostics.length ? diagnostics.map((item) => {
        const level = diagnosticLevel(item.level);
        return `<article class="diagnostic-card level-${item.level.toLowerCase()}"><div class="card-heading"><h3>${escapeHtml(item.title)}</h3><span class="pill ${level.className}">${level.label}</span></div><p><strong>${item.affected}</strong> / ${item.sample} 位曾使用提示或仍需整理 ${item.level === "N" ? "" : `(${formatPercent(item.rate)})`}</p><p>${escapeHtml(item.strategy)}</p><p class="muted">來源：${item.questionIds.map((id) => escapeHtml(questionLabel(id))).join("、") || "未標記題目"}${item.misconceptions.length ? `；迷思 ${item.misconceptions.map(([tag, count]) => `${escapeHtml(analytics.humanizeToken(tag))} ${count}`).join("、")}` : ""}</p></article>`;
      }).join("") : '<p class="muted">目前沒有足夠的逐題紀錄可建立概念診斷。</p>'}</div>
    </section>
    <section class="panel">
      <p class="eyebrow">逐題統計</p><h2>各題正確率、提示率與各選項選答率</h2>
      <p class="muted">複選題會分別計算每個被勾選選項，因此選項百分比總和可能超過 100%。配對題以「題目項目 → 學生選擇」呈現。</p>
      ${!hasAnswers ? '<p class="data-alert">目前 QuestionLogs 沒有 v3 的 answer_json／attempt_answer；為避免誤導，本頁不製造模擬選答率。請更新 Apps Script 並重新部署。</p>' : ""}
      <div class="question-analysis-list">${questions.length ? questions.map((question) => {
        const guidance = analytics.guidanceFor(question.skillTag);
        return `<article class="question-analysis"><div class="card-heading"><div><span class="question-number">${escapeHtml(questionLabel(question.questionId))}</span><h3>${escapeHtml(guidance.title)}</h3></div><div class="rate-pills"><span class="pill ${question.correctRate < .6 ? "danger" : "good"}">正確 ${formatPercent(question.correctRate)}</span><span class="pill ${question.hintRate >= .3 ? "warn" : ""}">提示 ${formatPercent(question.hintRate)}</span><span class="pill">${question.responses} 人</span></div></div>
          ${question.options.length ? `<div class="option-bars">${question.options.map((option) => `<div class="option-row"><div class="option-label"><span>${escapeHtml(option.label)}</span><strong>${option.count} 人・${formatPercent(option.rate)}</strong></div><div class="bar-track" aria-label="${escapeHtml(option.label)} ${formatPercent(option.rate)}"><span style="width:${Math.min(100, Math.round(option.rate * 100))}%"></span></div></div>`).join("")}</div>` : '<p class="muted">這一題尚未取得可用的學生選項資料。</p>'}
        </article>`;
      }).join("") : '<p class="muted">目前沒有對應到最新完整挑戰的 QuestionLogs。</p>'}</div>
    </section>`;
}

function feedbackCard(title, rows, field, emptyText) {
  return `<article class="panel"><div class="card-heading"><h2>${escapeHtml(title)}</h2><span class="pill">${rows.length} 筆</span></div>${rows.length ? `<div class="feedback-list">${rows.map((row) => `<div class="feedback-entry"><strong>${escapeHtml(row.seatNo ? `${row.seatNo} ${row.studentName}` : row.studentName)}</strong><p>${escapeHtml(row[field] || "未填寫")}</p></div>`).join("")}</div>` : `<p class="muted">${escapeHtml(emptyText)}</p>`}</article>`;
}

function renderFeedbackView() {
  const attempts = latestSelectedAttempts();
  const reviews = selectedReviews();
  const feedback = analytics.buildFeedbackSummary(attempts, reviews);
  const diagnostics = analytics.buildConceptDiagnostics(state.data.questionLogs, attempts.map((row) => String(row.attempt_id)));
  const priorities = diagnostics.filter((item) => item.level === "A" || item.level === "B");
  viewRoot.innerHTML = `${sourceAuditPanel()}
    <section class="grid summary-grid">
      ${metric("具體提問", feedback.questions.length, "希望老師課堂解釋")}
      ${metric("不確定概念", feedback.uncertain.length, "學生自陳")}
      ${metric("低信心", feedback.lowConfidence.length, "信心 1-2 分")}
      ${metric("待教師複核", feedback.pendingReviews.length, "後台品質或驗證標記")}
    </section>
    <section class="panel"><p class="eyebrow">備課摘要</p><h2>需要老師講解的內容整理</h2><p class="muted">以下依學生最新作答中需要提示、尚未穩定的概念，以及學生自己填寫的不確定內容整理。建議先處理班級共同線索，再回應具體提問。</p>
      ${priorities.length ? `<div class="strategy-list">${priorities.map((item) => `<div class="strategy-row"><div><span class="pill ${item.level === "A" ? "danger" : "warn"}">${diagnosticLevel(item.level).label}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.strategy)}</p></div><strong>${item.affected}/${item.sample} 人</strong></div>`).join("")}</div>` : '<p class="muted">目前沒有達到全班優先澄清門檻的概念；可先查看學生具體提問。</p>'}
    </section>
    <section class="grid two-col">
      ${feedbackCard("學生希望老師講解", feedback.questions, "question", "目前沒有學生留下具體提問。")}
      ${feedbackCard("學生自陳不確定", feedback.uncertain, "uncertain", "目前沒有學生填寫不確定概念。")}
    </section>
    <section class="grid two-col">
      ${feedbackCard("學生自陳有把握", feedback.confident, "confident", "目前沒有學生填寫有把握的概念。")}
      <article class="panel"><div class="card-heading"><h2>待教師複核</h2><span class="pill warn">${feedback.pendingReviews.length} 筆</span></div>${feedback.pendingReviews.length ? `<div class="feedback-list">${feedback.pendingReviews.map((row) => `<div class="feedback-entry"><strong>${escapeHtml(row.studentName)}</strong><p><span class="pill warn">${escapeHtml(row.issueType)}</span> ${escapeHtml(row.question || "未留下文字")}</p></div>`).join("")}</div>` : '<p class="muted">目前沒有待複核資料。</p>'}</article>
    </section>`;
}

function progressForStudent(studentId) {
  const rows = state.data.studentProgress.filter((row) => String(row.student_id) === String(studentId));
  const stored = [...rows].sort((a, b) => numberValue(b.total_exp) - numberValue(a.total_exp) || String(b.latest_submitted_at || b.last_activity_at || "").localeCompare(String(a.latest_submitted_at || a.last_activity_at || "")))[0] || null;
  if (!stored || numberValue(stored.total_exp) > 0 || numberValue(stored.completed_unit_count) > 0) return stored;
  return historicalCompleteAttempts().some((row) => String(row.student_id) === String(studentId)) ? null : stored;
}

function fallbackProgress(studentId) {
  const attempts = historicalCompleteAttempts().filter((row) => String(row.student_id) === String(studentId));
  const best = new Map();
  attempts.forEach((row) => best.set(String(row.unit_id), Math.max(best.get(String(row.unit_id)) || 0, numberValue(row.unit_credited_exp))));
  return {
    total_exp: [...best.values()].reduce((sum, value) => sum + value, 0),
    completed_unit_count: best.size,
    current_title: "尚無 StudentProgress 稱號資料",
    latest_submitted_at: latestAttempt(attempts)?.submitted_at || ""
  };
}

function renderClassView() {
  const rows = studentsForClass();
  if (!rows.length) {
    viewRoot.innerHTML = emptyState("沒有班級資料", "請確認 Students 工作表是否有有效名冊。");
    return;
  }
  viewRoot.innerHTML = `<section class="panel"><h2>${escapeHtml(classFilter.value)} 班級累積進度</h2><div class="table-wrap"><table><thead><tr><th>座號</th><th>姓名</th><th>完成單元</th><th>累積 EXP</th><th>目前稱號</th><th>需關注紀錄</th><th>最近活動</th></tr></thead><tbody>${rows.map((student) => {
    const progress = progressForStudent(student.student_id) || fallbackProgress(student.student_id);
    const attention = completedAttempts().filter((attempt) => String(attempt.student_id) === String(student.student_id) && booleanValue(attempt.teacher_attention_needed)).length;
    return `<tr><td>${escapeHtml(student.seat_no || "-")}</td><td>${escapeHtml(student.student_name || student.student_id)}</td><td>${numberValue(progress.completed_unit_count)}</td><td>${numberValue(progress.total_exp)}</td><td>${escapeHtml(progress.current_title || progress.current_title_id || "-")}</td><td>${attention}</td><td>${formatDate(progress.latest_submitted_at || progress.last_activity_at)}</td></tr>`;
  }).join("")}</tbody></table></div></section>`;
}

function renderStudentView() {
  const student = state.data.students.find((row) => String(row.student_id) === studentFilter.value);
  if (!student) {
    viewRoot.innerHTML = emptyState("沒有學生資料", "請先選擇具有名冊資料的班級與學生。");
    return;
  }
  const attempts = state.data.attempts.filter((row) => String(row.student_id) === String(student.student_id) && row.submitted_at).sort((a, b) => String(b.submitted_at || "").localeCompare(String(a.submitted_at || "")));
  const progress = progressForStudent(student.student_id) || fallbackProgress(student.student_id);
  const reviews = state.data.teacherReviews.filter((row) => String(row.student_id) === String(student.student_id));
  viewRoot.innerHTML = `<section class="grid two-col"><article class="panel"><h2>${escapeHtml(student.seat_no || "-")} ${escapeHtml(student.student_name || student.student_id)} 個人歷程</h2>
    ${attempts.length ? `<div class="table-wrap"><table><thead><tr><th>時間</th><th>單元</th><th>驗證</th><th>挑戰</th><th>正確率</th><th>提示</th><th>提示後修正</th><th>認列 EXP</th><th>回報品質</th></tr></thead><tbody>${attempts.map((row) => `<tr><td>${formatDate(row.submitted_at)}</td><td>${escapeHtml(row.unit_title || row.unit_id)}</td><td>${verificationLabel(row)}</td><td>${escapeHtml(row.attempt_no || row.attempt_type || "-")}</td><td>${formatPercent(row.accuracy)}</td><td>${numberValue(row.hints_used)}</td><td>${numberValue(row.corrected_after_hint)}</td><td>${numberValue(row.unit_credited_exp)}</td><td>${escapeHtml(row.reflection_quality || "-")}</td></tr>`).join("")}</tbody></table></div>` : '<p class="muted">尚無 Attempts 紀錄。</p>'}
  </article><aside class="grid"><article class="panel"><h2>進度摘要</h2><div class="summary-list"><p><span>累積 EXP</span><strong>${numberValue(progress.total_exp)}</strong></p><p><span>完成單元</span><strong>${numberValue(progress.completed_unit_count)}</strong></p><p><span>目前稱號</span><strong>${escapeHtml(progress.current_title || progress.current_title_id || "-")}</strong></p><p><span>距下一稱號</span><strong>${numberValue(progress.next_title_need_exp)}</strong></p></div></article><article class="panel"><h2>待複核與最近提問</h2>${reviews.length ? reviews.map((row) => `<div class="question-card"><p><span class="pill warn">${escapeHtml(row.issue_type || "待複核")}</span></p><p>${escapeHtml(row.student_question || "未留下問題")}</p></div>`).join("") : '<p class="muted">目前沒有待處理紀錄。</p>'}</article></aside></section>`;
}

function renderWarnings() {
  const warnings = state.data?.warnings || [];
  dataWarnings.hidden = !warnings.length;
  dataWarnings.innerHTML = warnings.length ? `<strong>資料來源提醒</strong><p>${warnings.map(escapeHtml).join("、")}</p>` : "";
}

function render() {
  if (!state.data) return;
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === state.currentView));
  studentFilterLabel.hidden = state.currentView !== "student";
  renderWarnings();
  if (state.currentView === "unit") renderUnitView();
  if (state.currentView === "questions") renderQuestionView();
  if (state.currentView === "feedback") renderFeedbackView();
  if (state.currentView === "class") renderClassView();
  if (state.currentView === "student") renderStudentView();
}

function errorMessage(error) {
  const code = String(error?.message || error || "");
  if (code === "teacher_dashboard_unauthorized") return "存取碼不正確，或 Apps Script 尚未設定 TEACHER_DASHBOARD_KEY。";
  if (code === "dashboard_deployment_outdated") return "Apps Script 尚未重新部署教師儀表板 v3；目前不載入舊版或不完整資料。";
  if (code.startsWith("dashboard_field_missing:")) return `API 缺少必要欄位 ${code.split(":")[1]}，請重新部署 Apps Script。`;
  if (code.startsWith("dashboard_http_")) return "教師 API 連線失敗，請確認 Apps Script 部署權限與網址。";
  return "無法載入實際資料。請確認網路、Apps Script 部署與存取碼設定。";
}

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.loading) return;
  const keyInput = document.querySelector("#teacherKey");
  const key = keyInput.value;
  if (!key) return;
  state.loading = true;
  accessStatus.className = "status-box loading";
  accessStatus.textContent = "正在驗證並讀取 Google Sheet...";
  document.querySelector("#loadDashboard").disabled = true;
  try {
    state.data = await fetchDashboard(key);
    keyInput.value = "";
    populateFilters();
    accessPanel.hidden = true;
    dashboardContent.hidden = false;
    connectionState.textContent = state.data.generatedAt ? `資料時間 ${formatDate(state.data.generatedAt)}` : "已連線實際資料";
    render();
  } catch (error) {
    state.data = null;
    accessStatus.className = "status-box error";
    accessStatus.textContent = errorMessage(error);
    connectionState.textContent = "未載入學生資料";
  } finally {
    state.loading = false;
    document.querySelector("#loadDashboard").disabled = false;
  }
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.currentView = button.dataset.view;
    render();
  });
});

classFilter.addEventListener("change", () => {
  populateStudentFilter();
  render();
});
unitFilter.addEventListener("change", render);
studentFilter.addEventListener("change", render);
document.querySelector("#disconnectButton").addEventListener("click", () => {
  state.data = null;
  viewRoot.innerHTML = "";
  dashboardContent.hidden = true;
  accessPanel.hidden = false;
  accessStatus.className = "status-box";
  accessStatus.textContent = "";
  connectionState.textContent = "尚未連線";
  document.querySelector("#teacherKey").focus();
});

window.BioQuestTeacherDashboard = Object.freeze({ normalizeDashboard, isOfficialStudent, priorityConcepts });
