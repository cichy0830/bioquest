const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260717-scale-user-review-v2";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_scale_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "scale",
  unit_title: "尺度",
  mission_title: "微觀尺度校準任務",
  mission_area: "微觀研究站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlPrep: "assets/owl-scale-prep-reminder.webp",
  owlResult: "../shared-assets/assistants/owl-bioquest-result.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-scale-briefing-azhe-wide.webp",
  ambientBackgroundHook: "assets/bg-scale-ambient-wide.webp"
};

const badgeAsset = (id) => `../shared-assets/badges/scale/badge-scale-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["尺度", "公尺", "公分", "毫米", "微米", "比例尺", "放大", "實際大小", "影像", "顯微鏡", "放大鏡", "捲尺", "單位", "倍率", "細胞"],
  irrelevantTerms: ["老師好帥", "帥", "午餐", "下課", "遊戲", "天氣", "好笑"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["公尺公分毫米與微米的換算", "細胞為什麼常用微米描述", "什麼情況該選直尺放大鏡或顯微鏡", "顯微影像的比例尺如何使用", "圖像放大和實際大小的差異", "放大倍率與實際大小估算"]
};
const badges = [
  { id: "scale_entry", name: "尺度校準入門徽章", condition: "完成微觀尺度校準任務。" },
  { id: "scale_order_sorter", name: "尺度排序徽章", condition: "多尺度物體排序題組達 85% 以上。" },
  { id: "unit_match_calibrator", name: "單位校準徽章", condition: "長度單位配對或換算題組達 85% 以上。" },
  { id: "scale_bar_reader", name: "比例尺判讀徽章", condition: "能用比例尺估算圖像實際大小。" },
  { id: "observation_tool_selector", name: "觀察工具選擇徽章", condition: "能依物體尺度選擇合適工具。" },
  { id: "magnification_actual_size_mapper", name: "放大與實際大小徽章", condition: "能區分圖像放大、倍率與實際大小。" },
  { id: "multi_scale_image_classifier", name: "多尺度圖像分類徽章", condition: "能把生活物件與細胞放入合理尺度。" },
  { id: "scale_misconception_reviser", name: "尺度迷思修正徽章", condition: "提示後完成至少一項尺度概念修正。" },
  { id: "scale_flawless", name: "尺度校準零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "scale_reflection_reporter", name: "高品質尺度回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_scale", name: "再探尺度進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const sequenceSteps = [
  { id: "backpack", label: "背包", reference: "約 45 cm" },
  { id: "leaf", label: "指定葉片", reference: "約 8 cm" },
  { id: "ant", label: "指定螞蟻", reference: "約 12 mm" },
  { id: "rice", label: "指定米粒", reference: "約 6 mm" },
  { id: "cell", label: "洋蔥表皮細胞", reference: "約 300 μm" }
];
const correctSequence = ["backpack", "leaf", "ant", "rice", "cell"];

const questions = [
  { id: "q03", section: "checkpoint1", concept: "length_units", answer: "mm_um", prompt: "下列哪個換算正確？", hint: "先想毫米比微米大很多，一毫米可以分成許多微米。", misconception: "unit_conversion_confusion", options: [{ id: "mm_um", text: "1 mm = 1000 μm" }, { id: "cm_m", text: "1 cm = 1000 m" }, { id: "um_mm", text: "1 μm = 1000 mm" }, { id: "m_cm", text: "1 m = 10 cm" }] },
  { id: "q04", section: "checkpoint1", concept: "length_units", answer: "a_larger", prompt: "甲物體長 2 mm，乙物體長 200 μm。哪個較大？", hint: "先把兩個長度換成同一種單位，再比較。", misconception: "unit_conversion_confusion", options: [{ id: "a_larger", text: "甲物體較大" }, { id: "b_larger", text: "乙物體較大" }, { id: "same", text: "兩者一樣大" }, { id: "unknown", text: "無法比較，因為單位不同" }] },
  { id: "q06", section: "checkpoint2", concept: "microscopic_scale", answer: "compound", prompt: "想觀察口腔皮膜細胞的外形，哪種工具最合適？", hint: "想想細胞是否屬於肉眼容易看清的大小層次。", misconception: "cell_measured_by_ruler", options: [{ id: "compound", text: "複式顯微鏡" }, { id: "ruler", text: "一般直尺" }, { id: "tape", text: "捲尺" }, { id: "telescope", text: "望遠鏡" }] },
  { id: "q07", section: "checkpoint2", concept: "observation_tools", answer: "fit_purpose", prompt: "有同學說：『倍率越高的工具一定越適合觀察任何東西。』哪個修正較合理？", hint: "先想觀察整個教室、葉片表面和細胞時，是否需要同一種工具。", misconception: "tool_highest_magnification_best", options: [{ id: "fit_purpose", text: "要依物體大小與觀察目的選工具" }, { id: "high_classroom", text: "倍率越高越適合量教室長度" }, { id: "cell_tape", text: "細胞可以用捲尺量" }, { id: "magnifier_cell", text: "放大鏡一定比顯微鏡更能看細胞" }] },
  { id: "q08", section: "checkpoint2", concept: "microscopic_scale", answer: "microscope_cells", prompt: "圖中有規則排列的小格狀構造，比例尺是 100 μm。這張圖最可能屬於哪種觀察情境？", hint: "把這個單位和教室或身高常用的單位相比，再判斷這是什麼尺度的觀察。", misconception: "cell_measured_by_ruler", visual: "micrograph-100", options: [{ id: "microscope_cells", text: "顯微鏡下的細胞視野" }, { id: "classroom", text: "教室平面圖" }, { id: "playground", text: "操場衛星圖" }, { id: "height", text: "身高測量圖" }] },
  { id: "q09", section: "checkpoint3", concept: "scale_bar_reading", answer: "one_hundred_um", prompt: "顯微影像中，一段比例尺代表 50 μm。某細胞長度約等於 2 段比例尺，這個細胞實際長度約是多少？", hint: "先看一段比例尺代表多少，再看細胞大約跨過幾段。", misconception: "ignore_scale_bar", visual: "scale-bar-50", options: [{ id: "one_hundred_um", text: "約 100 μm" }, { id: "twenty_five_um", text: "約 25 μm" }, { id: "fifty_mm", text: "約 50 mm" }, { id: "two_cm", text: "約 2 cm" }] },
  { id: "q10", section: "checkpoint3", concept: "image_actual_size", answer: "image_only", prompt: "同一個細胞影像在平板上放大顯示後，看起來比原本大很多。哪個判斷較合理？", hint: "想想放大的是影像，還是生物體中的實物本身。", misconception: "magnification_changes_object", options: [{ id: "image_only", text: "螢幕上的影像變大，但細胞實際大小沒有改變" }, { id: "cell_grew", text: "細胞實際長大了" }, { id: "unit_m", text: "比例尺單位一定變成公尺" }, { id: "naked_eye", text: "顯微鏡讓細胞變成肉眼大小" }] },
  { id: "q11", section: "checkpoint3", concept: "scale_bar_reading", answer: "use_scale_bar", prompt: "兩張細胞照片在螢幕上看起來一樣大，但甲圖比例尺為 20 μm，乙圖比例尺為 100 μm。哪個判斷較合理？", hint: "先找兩張圖中能連回實際長度的線索，再判斷畫面顯示大小能不能直接比較。", misconception: "ignore_scale_bar", options: [{ id: "use_scale_bar", text: "不能只看螢幕大小，需依比例尺判斷實際大小" }, { id: "same", text: "兩張圖中的細胞一定一樣大" }, { id: "ignore", text: "比例尺可以忽略" }, { id: "smaller", text: "比例尺越小代表細胞一定越小" }] },
  { id: "q12", section: "checkpoint3", concept: "magnification_reasoning", answer: "two_mm", prompt: "一個物體影像長 20 mm，放大倍率為 10 倍。若只做簡單估算，實物長度約是多少？", hint: "放大 10 倍表示影像長度約是實物的 10 倍。", misconception: "magnification_changes_object", options: [{ id: "two_mm", text: "2 mm" }, { id: "twenty_mm", text: "20 mm" }, { id: "two_hundred_mm", text: "200 mm" }, { id: "ten_mm", text: "10 mm" }] },
  { id: "q13", section: "checkpoint3", concept: "image_actual_size", answer: "check_evidence", prompt: "有同學說：『照片裡的細胞看起來比米粒大，所以細胞實際上比米粒大。』哪個修正較合理？", hint: "這個說法用了哪一種證據？想想照片的顯示尺寸是否足以決定實物尺寸。", misconception: "image_size_equals_real_size", options: [{ id: "check_evidence", text: "圖像可能被放大，實際大小要看單位、比例尺或倍率" }, { id: "looks_big", text: "照片看起來大就一定實物大" }, { id: "microscope_changes", text: "顯微鏡會讓細胞真的變大" }, { id: "rice_um", text: "米粒一定用微米描述" }] },
  { id: "q14", section: "checkpoint3", concept: "length_units", answer: "unit_relations", prompt: "有同學說：『毫米、公分、微米只是名字不同，大小其實差不多。』哪個修正較合理？", hint: "想想同一段長度若改用更小的單位表示，數字會如何變化。", misconception: "wrong_unit_choice", options: [{ id: "unit_relations", text: "這些單位代表不同大小層次，1 mm = 1000 μm，1 cm = 10 mm" }, { id: "same", text: "單位名字不同但完全一樣大" }, { id: "um_big", text: "微米比公尺還大" }, { id: "cm_only", text: "只要是生物都用公分描述" }] }
];

const classifyQuestions = {
  q02: {
    prompt: "請將物體和較適合的長度單位配對。每一列都要選擇。",
    hint: "選單位時，想想用哪個單位會讓數字比較容易閱讀。",
    misconception: "wrong_unit_choice",
    options: [{ id: "m", label: "m" }, { id: "cm", label: "cm" }, { id: "mm", label: "mm" }, { id: "um", label: "μm" }],
    items: [{ id: "door", label: "教室門高度", answer: "m" }, { id: "tree", label: "樹高", answer: "m" }, { id: "rice", label: "米粒長度", answer: "mm" }, { id: "cell", label: "細胞大小", answer: "um" }]
  },
  q05: {
    prompt: "請將觀察對象配到較合適的工具。每一列都要選擇。",
    hint: "先判斷目標是否肉眼可見，再決定是否需要放大工具或顯微鏡。",
    misconception: "tool_highest_magnification_best",
    options: [{ id: "tape", label: "捲尺或皮尺" }, { id: "magnifier", label: "放大鏡" }, { id: "compound", label: "複式顯微鏡" }, { id: "height_rule", label: "身高尺或皮尺" }],
    items: [{ id: "classroom", label: "教室長度", answer: "tape" }, { id: "leaf", label: "葉片表面細節", answer: "magnifier" }, { id: "onion", label: "洋蔥表皮細胞", answer: "compound" }, { id: "height", label: "人的身高", answer: "height_rule" }]
  }
};

const sectionMap = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08"],
  checkpoint3: ["q09", "q10", "q11", "q12", "q13", "q14"]
};
const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  attempt_id: "",
  attempt_session_id: "",
  attempt_session_token: "",
  question_version: "",
  session_expires_at: "",
  session_error: "",
  remote_completed_attempts: 0,
  remote_previous_attempt_id: "",
  remote_previous_accuracy: null,
  cumulative_badges: [],
  cumulative_total_exp: 0,
  completed_unit_count: 0,
  started_at: null,
  completedScreens: ["login", "rules"],
  answers: {
    q01_sequence: [],
    q02: {},
    q05: {},
    reflection: {}
  },
  hints: {},
  checkedWrong: {},
  interactions: {},
  optionOrders: {},
  result: null,
  submitted_at: null,
  lockNotice: "",
  backend_status: ""
};

let state = loadState();
let draggedSequenceId = null;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function questionById(id) { return questions.find((question) => question.id === id); }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...clone(defaultState), ...saved, answers: { ...clone(defaultState.answers), ...(saved.answers || {}) } } : clone(defaultState);
  } catch {
    return clone(defaultState);
  }
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function getAttempts() {
  try { return JSON.parse(localStorage.getItem(attemptsKey)) || []; } catch { return []; }
}
function saveAttempt(attempt) {
  const attempts = getAttempts();
  const withoutSame = attempts.filter((item) => item.attempt_id !== attempt.attempt_id);
  withoutSame.push(attempt);
  localStorage.setItem(attemptsKey, JSON.stringify(withoutSame));
}
function studentAttempts(studentId) {
  return getAttempts().filter((attempt) => attempt?.student?.student_id === studentId && attempt?.mission?.unit_id === mission.unit_id);
}
function previousBestCredited() {
  if (!state.student) return 0;
  return Math.max(0, ...studentAttempts(state.student.student_id).map((attempt) => Number(attempt.unit_credited_exp || 0)));
}
function previousBestAccuracy() {
  if (!state.student) return null;
  const attempts = studentAttempts(state.student.student_id);
  const localBest = attempts.length ? Math.max(...attempts.map((attempt) => Number(attempt.accuracy || 0))) : null;
  const remoteBest = state.remote_previous_accuracy === null || state.remote_previous_accuracy === "" ? null : Number.isFinite(Number(state.remote_previous_accuracy)) ? Number(state.remote_previous_accuracy) : null;
  if (localBest === null) return remoteBest;
  return remoteBest === null ? localBest : Math.max(localBest, remoteBest);
}
function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}
function updateBadgeOverviewBridge() {
  if (!state.student) {
    delete window.__BIOQUEST_BADGE_OVERVIEW_STATE__;
    delete window.__BIOQUEST_BADGE_OVERVIEW_PROGRESS__;
    return;
  }
  const progress = clone(state.student.progress || {});
  const snapshot = {
    unit_id: mission.unit_id,
    backend_status: state.backend_status || "",
    submitted_at: state.submitted_at || "",
    student: {
      student_id: state.student.student_id || "",
      profile_gender: state.student.profile_gender || "",
      current_title_id: state.student.current_title_id || progress.current_title_id || "",
      current_title: state.student.current_title || progress.current_title || "",
      title_avatar_path: state.student.title_avatar_path || progress.title_avatar_path || "",
      is_guest: Boolean(state.student.is_guest),
      progress
    },
    progress,
    student_progress: progress
  };
  window.__BIOQUEST_BADGE_OVERVIEW_STATE__ = deepFreeze(snapshot);
  window.__BIOQUEST_BADGE_OVERVIEW_PROGRESS__ = deepFreeze(clone(progress));
}
function latestLocalAttempt() {
  if (!state.student) return null;
  return studentAttempts(state.student.student_id)
    .filter((attempt) => attempt.completion_status === "complete" && attempt.submitted_at)
    .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)))[0] || null;
}
function previousAttemptId() { return latestLocalAttempt()?.attempt_id || state.remote_previous_attempt_id || ""; }
function cumulativeBadgeIds(current = []) {
  if (!state.student) return [...new Set(current)];
  const local = studentAttempts(state.student.student_id).flatMap((attempt) => parseArray(attempt.badges));
  return [...new Set([...(state.cumulative_badges || []), ...local, ...current])];
}
function applyBackendProgress(progress = {}) {
  if (!progress || typeof progress !== "object") return;
  state.cumulative_badges = parseArray(progress.badges_json || progress.badges || state.cumulative_badges);
  state.cumulative_total_exp = Number(progress.total_exp ?? progress.total_credited_exp ?? state.cumulative_total_exp ?? 0);
  state.completed_unit_count = Number(progress.completed_unit_count ?? state.completed_unit_count ?? 0);
  if (state.student) {
    const previous = state.student.progress || {};
    state.student.progress = { ...previous, ...progress };
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id || "";
    state.student.current_title = progress.current_title || state.student.current_title || "";
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path || "";
    state.student.profile_gender = progress.profile_gender || state.student.profile_gender || "";
    state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
  }
  updateBadgeOverviewBridge();
}
function pendingQueue() {
  try { return JSON.parse(localStorage.getItem(pendingQueueKey)) || []; } catch { return []; }
}
function savePending(payload) {
  const queue = pendingQueue().filter((item) => item.attempt_id !== payload.attempt_id);
  queue.push(payload);
  localStorage.setItem(pendingQueueKey, JSON.stringify(queue));
}
function shuffledCopy(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function optionOrder(key, options) {
  if (!state.optionOrders[key]) {
    state.optionOrders[key] = shuffledCopy(options);
    saveState();
  }
  return state.optionOrders[key];
}
function orderedOptions(question) {
  return optionOrder(question.id, question.options.map((option) => option.id))
    .map((id) => question.options.find((option) => option.id === id))
    .filter(Boolean);
}
function ensureSequence() {
  if (!state.answers.q01_sequence?.length) {
    state.answers.q01_sequence = optionOrder("q01_sequence", sequenceSteps.map((step) => step.id));
    saveState();
  }
  return state.answers.q01_sequence;
}
function unlock(...screens) {
  screens.forEach((item) => {
    if (!state.completedScreens.includes(item)) state.completedScreens.push(item);
  });
}
function isLockedScreen(next) { return Boolean(state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(next)); }
function redirectLockedAttempt() {
  state.lockNotice = LOCK_MESSAGE;
  state.screen = "result";
  unlock("result", "achievements");
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function setScreen(next) {
  if (isLockedScreen(next)) return redirectLockedAttempt();
  if (next !== "result") state.lockNotice = "";
  state.screen = next;
  unlock(next);
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach((button) => button.addEventListener("click", () => {
  if (!button.disabled) setScreen(button.dataset.nav);
}));

function renderNav() {
  navButtons.forEach((button) => {
    const key = button.dataset.nav;
    button.classList.toggle("active", key === state.screen);
    button.disabled = !state.completedScreens.includes(key) && key !== "rules";
  });
}
function renderStudentMini() {
  if (!state.student) {
    studentMini.innerHTML = `<p class="muted">尚未登入</p>`;
    return;
  }
  studentMini.innerHTML = `<p><strong>${state.student.student_name}</strong></p><p>${state.student.class_name} 班 ${state.student.seat_no} 號</p><p class="muted">${state.attempt_type === "retry" ? "再挑戰" : "首次挑戰"}</p><p class="muted">後台完成紀錄：${state.remote_completed_attempts || 0} 筆</p>`;
}

function titleAvatarPath() {
  const student = state.student || {};
  return normalizeTitleAvatarPath(student.title_avatar_path || student.progress?.title_avatar_path);
}
function normalizeTitleAvatarPath(rawPath = "") {
  const value = String(rawPath || "").trim();
  if (!value) return assets.titleAvatarFallback;
  if (/^(https?:|data:|\/|\.\/|\.\.\/)/.test(value)) return value;
  if (value.startsWith("shared-assets/")) return `../${value}`;
  return value;
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return `<div class="wide-layout"><div class="panel hero-panel">
    <p class="eyebrow">生命祕境 BioQuest</p>
    <h2 class="hero-title">任務登入</h2>
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>scale</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
    <div class="form-grid"><label>學號<input id="studentIdInput" value="${value}" placeholder="例如 S70101 或 guest" autocomplete="off"></label></div>
    <div class="actions"><button class="primary" id="loginButton">登入任務</button><button class="secondary" id="guestButton">老師測試 guest</button><button class="ghost" id="resetButton">清除本機測試紀錄</button></div>
    <div id="loginMessage" class="status-line"></div>
  </div></div>`;
}
async function fetchStudentStatus(id) {
  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}`;
  const response = await fetch(`${url}&_=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
}
async function postBackendAction(action, payload) {
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(payload));
  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}`, { method: "POST", body });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || `backend_${action}_failed`);
  return data;
}
function startAttemptSession(studentId) {
  return postBackendAction("startAttempt", { student_id: studentId, unit_id: mission.unit_id });
}
function normalizeBackendStudent(data, id) {
  if (!data?.ok) return null;
  const source = data.student || data;
  return {
    student_id: source.student_id || id,
    class_name: source.class_name || source.class || "未設定",
    seat_no: source.seat_no || source.seat || "00",
    student_name: source.student_name || source.name || "未設定",
    profile_gender: source.profile_gender || source.gender || "",
    current_title_id: source.current_title_id || "",
    title_avatar_variant: source.title_avatar_variant || "",
    title_avatar_path: source.title_avatar_path || "",
    total_exp: Number(source.total_exp || 0),
    is_guest: id === "guest" || Boolean(source.is_guest)
  };
}
async function login(id) {
  const message = document.querySelector("#loginMessage");
  if (!id) {
    message.innerHTML = `<span class="pill warn">請輸入學號。</span>`;
    return;
  }
  window.BioQuestLoginUX?.begin({ guest: id === "guest" });
  await window.BioQuestLoginUX?.paint();
  if (id === "guest") {
    state = clone(defaultState);
    state.student = { ...roster.guest };
    state.remote_completed_attempts = studentAttempts("guest").length;
    state.attempt_type = state.remote_completed_attempts > 0 ? "retry" : "first";
    state.started_at = new Date().toISOString();
    state.attempt_id = `guest_${mission.unit_id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state.attempt_session_id = state.attempt_id;
    state.attempt_session_token = "guest_local_session";
    state.question_version = VERSION;
    state.backend_status = "local_guest";
    unlock("brief", "rules", "achievements");
    ensureSequence();
    saveState();
    setScreen("brief");
    return;
  }
  let student = null;
  let completed = 0;
  let remoteProgress = {};
  let remoteAttemptStatus = {};
  let serverSession = null;
  try {
    const data = await fetchStudentStatus(id);
    student = normalizeBackendStudent(data, id);
    if (!student) {
      message.innerHTML = `<span class="pill warn">${data?.message || "查無此學號，請重新輸入。"}</span>`;
      return;
    }
    remoteProgress = data.progress || data.student_progress || {};
    remoteAttemptStatus = data.attempt_status || {};
    completed = Number(remoteAttemptStatus.completed_attempt_count ?? data.completed_attempts ?? 0);
    serverSession = await startAttemptSession(student.student_id);
  } catch (error) {
    message.innerHTML = `<span class="pill warn">無法取得安全任務憑證（${error.message}）。請確認後台已重新部署並連線後再登入。</span>`;
    return;
  }
  state = clone(defaultState);
  state.student = { ...student, progress: remoteProgress };
  state.remote_completed_attempts = completed;
  state.attempt_type = serverSession.attempt_type || (completed > 0 ? "retry" : "first");
  state.started_at = serverSession.issued_at;
  state.attempt_id = serverSession.attempt_id;
  state.attempt_session_id = serverSession.attempt_session_id;
  state.attempt_session_token = serverSession.attempt_session_token;
  state.question_version = serverSession.question_version;
  state.session_expires_at = serverSession.expires_at;
  state.remote_previous_attempt_id = serverSession.previous_attempt_id || remoteAttemptStatus.previous_attempt_id || remoteAttemptStatus.latest_attempt_id || remoteProgress.latest_attempt_id || "";
  const remoteAccuracy = remoteAttemptStatus.previous_accuracy ?? remoteAttemptStatus.best_accuracy;
  state.remote_previous_accuracy = remoteAccuracy === null || remoteAccuracy === undefined || remoteAccuracy === "" ? null : Number.isFinite(Number(remoteAccuracy)) ? Number(remoteAccuracy) : null;
  applyBackendProgress(remoteProgress);
  unlock("brief", "rules", "achievements");
  ensureSequence();
  saveState();
  setScreen("brief");
}
function attachLogin() {
  document.querySelector("#loginButton").addEventListener("click", () => login(document.querySelector("#studentIdInput").value.trim()));
  document.querySelector("#guestButton").addEventListener("click", () => login("guest"));
  document.querySelector("#resetButton").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(attemptsKey);
    state = clone(defaultState);
    render();
  });
}

function selectedClass(question, option) {
  const selected = state.answers[question.id] === option.id;
  const checked = state.checkedWrong[question.id];
  if (checked && selected && option.id === question.answer) return " selected correct";
  if (checked && selected && option.id !== question.answer) return " selected wrong";
  return selected ? " selected" : "";
}
function renderQuestionImage(question) {
  const evidence = {
    q08: `<div class="scale-evidence-strip" role="group" aria-label="規則排列小格狀構造與一百微米比例尺資料"><span>資料卡</span><strong>規則排列的小格狀構造；比例尺為 100 μm</strong></div>`,
    q09: `<div class="scale-evidence-strip q09-evidence" role="group" aria-label="兩段比例尺，每段五十微米，目標細胞約跨兩段"><div class="scale-segment-row"><span><b></b>50 μm</span><span><b></b>50 μm</span></div><p>目標細胞長度約跨 2 段等長比例尺</p></div>`
  }[question.id] || "";
  return evidence ? `<section class="question-data-card" aria-label="尺度資料卡">${evidence}</section>` : "";
}
function renderChoiceQuestion(qid) {
  const question = questionById(qid);
  return `<div class="question-card" data-question-id="${qid}"><h3>${question.prompt}</h3>${renderQuestionImage(question)}
    <div class="choice-grid">${orderedOptions(question).map((option) => `<button class="choice-button${selectedClass(question, option)}" data-choice="${qid}" data-value="${option.id}">${option.text}</button>`).join("")}</div>
    <p class="selected-answer">${state.answers[qid] ? `已選：${question.options.find((option) => option.id === state.answers[qid])?.text || ""}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${question.hint}</div>` : ""}</div>`;
}
function renderSequenceQuestion() {
  const order = ensureSequence();
  return `<div class="question-card"><h3>依題卡提供的實際大小，由大到小拖曳排序。</h3><p class="field-help">每張卡都有固定參考值；可拖曳卡片，手機可使用上移 / 下移按鈕。</p>
    <div class="sortable-list">${order.map((id, index) => {
      const step = sequenceSteps.find((item) => item.id === id);
      return `<div class="sortable-item" draggable="true" data-sequence-id="${id}"><span class="drag-handle" aria-hidden="true"></span><div><strong>${step.label}</strong><small>${step.reference}</small></div><div class="sequence-move-buttons"><button class="icon-action" data-move="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-move="${id}" data-dir="1" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div></div>`;
    }).join("")}</div>${state.hints.q01 ? `<div class="feedback warn">先把不同單位換到同一條大小軸，再比較相鄰兩張卡；不要直接照圖片顯示尺寸排序。</div>` : ""}${state.checkedWrong.q01 ? `<div class="feedback bad">順序仍可調整。請使用每張卡的固定數值與單位逐段比較。</div>` : ""}</div>`;
}
function renderClassifyQuestion(qid) {
  const config = classifyQuestions[qid];
  const orderedItems = optionOrder(`${qid}_classify_items`, config.items.map((item) => item.id)).map((id) => config.items.find((item) => item.id === id)).filter(Boolean);
  const orderedBuckets = optionOrder(`${qid}_classify_options`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id)).filter(Boolean);
  return `<div class="question-card" data-question-id="${qid}"><h3>${config.prompt}</h3><p class="field-help">分類題：請完成每一列，選後會直接顯示已選答案。</p><div class="classify-list">${orderedItems.map((item) => {
    const selected = state.answers[qid]?.[item.id] || "";
    return `<div class="classify-row" data-classify-id="${item.id}"><strong>${item.label}</strong><label>選擇<select data-classify-question="${qid}" data-classify-item="${item.id}"><option value="">請選擇</option>${orderedBuckets.map((option) => `<option value="${option.id}" ${selected === option.id ? "selected" : ""}>${option.label}</option>`).join("")}</select></label><p class="selected-answer">${selected ? `已選：${config.options.find((option) => option.id === selected)?.label || ""}` : "尚未選擇"}</p></div>`;
  }).join("")}</div>${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}</div>`;
}
function renderBrief() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務簡報</p><h2>微觀尺度校準任務</h2>
    <figure class="brief-scene scale-brief-scene bq-brief-scene-stage" data-briefing-scene-hook="${assets.briefingSceneHook}" data-ambient-background-hook="${assets.ambientBackgroundHook}" data-bq-brief-dual-role="true">
      <picture class="bq-brief-scene-media"><img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="阿澤老師在微觀尺度校準研究站，引導學生判讀單位、比例尺與觀察工具"></picture>
      <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
    </figure>
    <div class="scene-copy bq-brief-scene-caption"><h3>研究站的尺度資料需要校準</h3><p>影像資料把螢幕上的大小誤當成實物大小，也混淆了公尺、毫米與微米。請用單位、比例尺與觀察工具重新校準資料。</p></div>
    <div class="mission-hud"><div><span>任務區</span><strong>微觀研究站</strong></div><div><span>重點</span><strong>尺度與比例尺</strong></div><div><span>排序題</span><strong>拖曳 + 上下移</strong></div></div><div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div></div></div>`;
}
function renderScan() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的尺度線索</h2><div class="owl-frame scale-prep-owl" data-owl-hook="${assets.owlPrep}"><img src="${assets.owlPrep}" alt="尺度任務提醒貓頭鷹" onload="this.nextElementSibling.hidden=true" onerror="this.remove()"><div class="owl-fallback" aria-label="貓頭鷹提醒">尺度<br>提醒</div></div><div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>先確認單位，再判斷實際大小與適合的觀察工具。顯微影像變大，不代表實物變大。</p></div><div class="card-grid"><div class="concept-card"><strong>先統一單位</strong><p>比較長度前，先把數字換成同一種單位。</p></div><div class="concept-card"><strong>微米尺度</strong><p>細胞常屬於微米等級，通常需要顯微鏡。</p></div><div class="concept-card"><strong>工具選擇</strong><p>依物體大小與觀察目的選直尺、放大鏡或顯微鏡。</p></div><div class="concept-card"><strong>看比例尺</strong><p>判斷圖中實際大小，要看比例尺或倍率資訊。</p></div></div><div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div></div>`;
}
function renderCheckpoint1() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>尺度與單位校準</h2><p class="muted">以實際大小、適合單位與基本換算完成判讀。</p><div class="question-grid">${renderSequenceQuestion()}${renderClassifyQuestion("q02")}${["q03", "q04"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`;
}
function renderCheckpoint2() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>觀察工具與微小尺度</h2><p class="muted">用物體大小與觀察目的選擇適合工具。</p><div class="question-grid">${renderClassifyQuestion("q05")}${["q06", "q07", "q08"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`;
}
function renderCheckpoint3() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>比例尺、圖像與實際大小</h2><p class="muted">判讀顯微影像時，使用比例尺、單位與倍率資料，而非只看螢幕大小。</p><div class="question-grid">${["q09", "q10", "q11", "q12", "q13", "q14"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`;
}

function isCorrect(qid) {
  if (qid === "q01") return ensureSequence().join("|") === correctSequence.join("|");
  if (classifyQuestions[qid]) return classifyQuestions[qid].items.every((item) => state.answers[qid]?.[item.id] === item.answer);
  const question = questionById(qid);
  return state.answers[qid] === question.answer;
}
function isAnswered(qid) {
  if (qid === "q01") return Boolean(state.interactions.q01) && ensureSequence().length === correctSequence.length;
  if (classifyQuestions[qid]) return classifyQuestions[qid].items.every((item) => Boolean(state.answers[qid]?.[item.id]));
  return Boolean(state.answers[qid]);
}
function allRequiredAnswered() {
  return [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].every(isAnswered);
}
async function markHint(qid) {
  if (state.hints[qid]) return true;
  if (state.student?.is_guest) {
    state.hints[qid] = true;
    state.checkedWrong[qid] = true;
    return true;
  }
  try {
    await postBackendAction("hintEvent", {
      student_id: state.student.student_id,
      unit_id: mission.unit_id,
      attempt_id: state.attempt_id,
      attempt_session_token: state.attempt_session_token,
      question_id: `${mission.unit_id}_${qid}`
    });
    state.hints[qid] = true;
    state.checkedWrong[qid] = true;
    state.session_error = "";
    return true;
  } catch (error) {
    state.session_error = error.message;
    saveState();
    window.alert("提示紀錄無法寫入，為避免成就誤判，請重新登入後再挑戰。");
    return false;
  }
}
async function checkSection(section) {
  const qids = sectionMap[section];
  const unanswered = qids.filter((qid) => !isAnswered(qid));
  if (unanswered.length) {
    const message = document.querySelector("#sectionMessage");
    if (message) message.innerHTML = `<span class="pill warn">請先完成本區 ${unanswered.length} 題必答內容；不要求全對。</span>`;
    return;
  }
  const wrong = qids.filter((qid) => !isCorrect(qid));
  const newlyHinted = wrong.filter((qid) => !state.hints[qid]);
  if (newlyHinted.length) {
    for (const qid of newlyHinted) {
      if (!await markHint(qid)) return;
    }
    saveState();
    render();
    const message = document.querySelector("#sectionMessage");
    if (message) message.innerHTML = `<span class="pill warn">已顯示 ${newlyHinted.length} 題概念提示；同一題只提示一次。可調整答案，也可保留本次作答再按一次前進。</span>`;
    return;
  }
  const next = section === "checkpoint1" ? "checkpoint2" : section === "checkpoint2" ? "checkpoint3" : "review";
  if (next === "review") state.result = calculateResult();
  unlock(next);
  saveState();
  setScreen(next);
}
function moveSequence(id, dir) {
  const order = ensureSequence();
  const index = order.indexOf(id);
  const next = index + dir;
  if (index < 0 || next < 0 || next >= order.length) return;
  [order[index], order[next]] = [order[next], order[index]];
  state.answers.q01_sequence = order;
  state.interactions.q01 = true;
  saveState();
  render();
}
function dropSequence(targetId) {
  if (!draggedSequenceId || draggedSequenceId === targetId) return;
  const order = ensureSequence().filter((id) => id !== draggedSequenceId);
  const targetIndex = order.indexOf(targetId);
  order.splice(targetIndex, 0, draggedSequenceId);
  state.answers.q01_sequence = order;
  state.interactions.q01 = true;
  draggedSequenceId = null;
  saveState();
  render();
}
function attachQuestionEvents() {
  document.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", async () => {
      const question = questionById(button.dataset.choice);
      state.answers[question.id] = button.dataset.value;
      state.interactions[question.id] = true;
      if (button.dataset.value !== question.answer && !await markHint(question.id)) return;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-classify-question]").forEach((select) => {
    select.addEventListener("change", async () => {
      const qid = select.dataset.classifyQuestion;
      const itemId = select.dataset.classifyItem;
      state.answers[qid] ||= {};
      state.answers[qid][itemId] = select.value;
      state.interactions[qid] = true;
      const item = classifyQuestions[qid].items.find((candidate) => candidate.id === itemId);
      if (select.value && item && select.value !== item.answer && !await markHint(qid)) return;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => moveSequence(button.dataset.move, Number(button.dataset.dir)));
  });
  document.querySelectorAll(".sortable-item").forEach((item) => {
    item.addEventListener("dragstart", () => { draggedSequenceId = item.dataset.sequenceId; });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => { event.preventDefault(); dropSequence(item.dataset.sequenceId); });
  });
  const checkButton = document.querySelector("#checkSection");
  if (checkButton) checkButton.addEventListener("click", async () => checkSection(checkButton.dataset.section));
}

function evaluateReflectionQuality(reflection) {
  return window.BioQuestReflectionQuality.evaluate(reflection, reflectionRules);
}
function questionConcept(qid) {
  if (qid === "q01") return "scale_levels";
  if (qid === "q02") return "unit_choice";
  if (qid === "q05") return "observation_tools";
  return questionById(qid)?.concept || "unknown";
}
function questionMisconception(qid) {
  if (qid === "q01") return "scale_level_order_confusion";
  if (classifyQuestions[qid]) return classifyQuestions[qid].misconception;
  return questionById(qid)?.misconception || "unknown";
}
function calculateResult() {
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
  const total = qids.length;
  const correctIds = qids.filter(isCorrect);
  const correct = correctIds.length;
  const hintUsed = Object.values(state.hints).filter(Boolean).length;
  const correctWithoutHint = correctIds.filter((qid) => !state.hints[qid]).length;
  const correctedAfterHint = correctIds.filter((qid) => state.hints[qid]).length;
  const directExp = Math.round(DIRECT_EXP_POOL * (correctWithoutHint / total));
  const revisionExp = Math.round(REVISION_EXP_POOL * (correctedAfterHint / total));
  const reflectionEval = evaluateReflectionQuality(state.answers.reflection || {});
  const accuracy = correct / total;
  // Keep the prescribed zero-hint perfect route at the unit cap even when reflection is blank.
  const masteryExp = accuracy === 1 && hintUsed === 0 ? 140 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const previousAccuracy = previousBestAccuracy();
  const completionExp = allRequiredAnswered() ? 100 : 0;
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, reflectionEval.question_exp)));
  const baseExp = Math.min(reflectionLedgerCap, completionExp + directExp + revisionExp + reflectionEval.question_exp + masteryExp);
  const retryCandidate = state.attempt_type === "retry" && previousAccuracy !== null && accuracy > previousAccuracy ? Math.min(60, Math.round((accuracy - previousAccuracy) * 100)) : 0;
  const retryExp = Math.min(retryCandidate, Math.max(0, reflectionLedgerCap - baseExp));
  const attemptTotalExp = Math.min(reflectionLedgerCap, baseExp + retryExp);
  const best = previousBestCredited();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(best, attemptTotalExp));
  const sectionStats = [sectionStat("尺度與單位校準", sectionMap.checkpoint1), sectionStat("觀察工具與微小尺度", sectionMap.checkpoint2), sectionStat("比例尺、圖像與實際大小", sectionMap.checkpoint3)];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? ["scale_entry"] : [];
  if (isCorrect("q01")) earned.push("scale_order_sorter");
  if (["q02", "q03", "q04", "q14"].filter(isCorrect).length / 4 >= 0.85) earned.push("unit_match_calibrator");
  if (["q09", "q11"].filter(isCorrect).length / 2 >= 0.85) earned.push("scale_bar_reader");
  if (["q05", "q06", "q07", "q08"].filter(isCorrect).length / 4 >= 0.85) earned.push("observation_tool_selector");
  if (["q10", "q12", "q13"].filter(isCorrect).length / 3 >= 0.85) earned.push("magnification_actual_size_mapper");
  if (["q01", "q02", "q05", "q08"].filter(isCorrect).length / 4 >= 0.85) earned.push("multi_scale_image_classifier");
  if (qids.some((qid) => isCorrect(qid) && state.hints[qid])) earned.push("scale_misconception_reviser");
  if (accuracy === 1 && hintUsed === 0) earned.push("scale_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("scale_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_scale");
  return {
    unit_exp_cap: UNIT_EXP_CAP,
    completion_exp: completionExp,
    concept_exp: directExp,
    revision_exp: revisionExp,
    question_exp: reflectionEval.question_exp,
    question_exp_candidate: reflectionEval.question_exp_candidate ?? reflectionEval.question_exp,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_total_exp: attemptTotalExp,
    unit_credited_exp: unitCreditedExp,
    credited_delta: Math.max(0, unitCreditedExp - best),
    correct, total, accuracy, hint_used: hintUsed, correct_without_hint: correctWithoutHint, corrected_after_hint: correctedAfterHint,
    previous_accuracy: previousAccuracy,
    accuracy_delta: previousAccuracy === null ? null : accuracy - previousAccuracy,
    section_stats: sectionStats,
    misconceptions,
    concept_mastery_tags_json: conceptMastery(qids),
    badges: [...new Set(earned)],
    cumulative_badges_candidate: cumulativeBadgeIds(earned),
    no_hint_perfect: accuracy === 1 && hintUsed === 0,
    all_required_answered: allRequiredAnswered(),
    teacher_attention_needed: Number(state.answers.reflection.confidence_score || 3) <= 2 || accuracy < 0.6 || reflectionEval.reflection_review_status === "pending_review" || misconceptions.length >= 3,
    ...reflectionEval
  };
}
function misconceptionText(tag) {
  const map = {
    scale_level_order_confusion: "建議再把各題卡的實際尺度與單位放在同一條大小軸比較，再確認由大到小的關係。",
    image_size_equals_real_size: "建議再確認圖像大小與實際大小的差異：照片或顯微影像可能被放大，不能只看螢幕大小。",
    unit_conversion_confusion: "建議再整理長度單位換算：1 m = 100 cm，1 cm = 10 mm，1 mm = 1000 μm。",
    cell_measured_by_ruler: "建議再連結細胞與微米尺度：細胞通常需要顯微鏡與比例尺才能清楚判讀大小。",
    tool_highest_magnification_best: "建議再練習觀察工具選擇：不同大小與目的需要不同工具，不是倍率越高越好。",
    ignore_scale_bar: "建議再練習比例尺判讀：先看比例尺代表的實際長度，再估算物體跨了幾段。",
    wrong_unit_choice: "建議再選擇合適單位：人體常用 m 或 cm，米粒可用 mm，細胞常用 μm。",
    magnification_changes_object: "建議再理解放大倍率：放大的是影像，不是讓實物本身長大。"
  };
  return map[tag] || "建議先統一單位，再回到比例尺、倍率與觀察目的檢查實際大小。";
}
function renderReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>尺度校準回饋</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理尺度判讀的主要線索。</p>"}</div><div class="story-panel"><strong>建議再閱讀理解</strong><p class="muted">這些方向依剛剛需要提示或調整的概念整理。</p>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>課堂提問方向</strong><p>單位換算、細胞為何常用微米、如何選直尺／放大鏡／顯微鏡、顯微影像比例尺、圖像放大與實際大小的差異。</p></div></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}
function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；具體且與單位、觀察工具、比例尺或圖像實際大小相關的問題，才可能取得回報 EXP。只複製方向詞、無關玩笑或敷衍句不會取得高 EXP；正式分數由後台重算。</p></div><div class="form-grid"><label>我最能掌握的一項尺度判斷概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定單位換算、觀察工具、比例尺判讀或圖像大小的哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個希望老師課堂解釋的方向，並用自己的話補充<span class="field-help">方向詞可以參考，但不要直接複製。</span><textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div></div>`;
}
function buildBackendPayload(attempt) {
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
  return {
    attempt_id: attempt.attempt_id, student_id: attempt.student.student_id, student_name: attempt.student.student_name, class_name: attempt.student.class_name, seat_no: attempt.student.seat_no,
    unit_id: mission.unit_id, unit_title: mission.unit_title, attempt_type: attempt.attempt_type, attempt_type_candidate: attempt.attempt_type_candidate, attempt_no_candidate: attempt.attempt_no,
    attempt_session_id: attempt.attempt_session_id, attempt_session_token: attempt.attempt_session_token, question_version: attempt.question_version, started_from_login: attempt.started_from_login, previous_attempt_id: attempt.previous_attempt_id, retry_validation_status: attempt.retry_validation_status,
    completion_status: attempt.completion_status, required_answer_count: attempt.required_answer_count, answered_required_count: attempt.answered_required_count, all_required_answered: attempt.all_required_answered,
    started_at: attempt.started_at, submitted_at: attempt.submitted_at, total_questions: attempt.total, correct: attempt.correct, accuracy: attempt.accuracy, hints_used: attempt.hint_used, correct_without_hint: attempt.correct_without_hint, corrected_after_hint: attempt.corrected_after_hint,
    completion_exp: attempt.completion_exp, concept_exp: attempt.concept_exp, revision_exp: attempt.revision_exp, question_exp: attempt.question_exp, mastery_exp: attempt.mastery_exp, retry_exp: attempt.retry_exp, attempt_total_exp: attempt.attempt_total_exp, unit_credited_exp: attempt.unit_credited_exp, credited_delta: attempt.credited_delta,
    confidence_score: attempt.confidence_score, reflection_quality: attempt.reflection_quality, reflection_quality_candidate: attempt.reflection_quality_candidate, reflection_exp_reason: attempt.reflection_exp_reason, reflection_review_status: attempt.reflection_review_status, reflection_original_text: attempt.reflection_original_text, reflection_normalized_text: attempt.reflection_normalized_text, reflection_similarity_score: attempt.reflection_similarity_score, reflection_similarity_source: attempt.reflection_similarity_source, reflection_copied_direction_flag: attempt.reflection_copied_direction_flag, reflection_irrelevant_flag: attempt.reflection_irrelevant_flag, reflection_low_effort_flag: attempt.reflection_low_effort_flag, reflection_examples_checked: attempt.reflection_examples_checked, reflection_frontend_only: true,
    teacher_attention_needed: attempt.teacher_attention_needed, student_question: attempt.student_question, badges_json: JSON.stringify(attempt.badges), existing_badges_json: JSON.stringify(cumulativeBadgeIds()), cumulative_badges_candidate_json: JSON.stringify(attempt.cumulative_badges_candidate),
    scale_order_score: scoreForConcept(attempt, "scale_levels"), unit_match_score: scoreForConcept(attempt, "unit_choice", "length_units"), scale_bar_reading_score: scoreForConcept(attempt, "scale_bar_reading"), observation_tool_score: scoreForConcept(attempt, "observation_tools", "microscopic_scale"), magnification_actual_size_score: scoreForConcept(attempt, "image_actual_size", "magnification_reasoning"), multi_scale_image_classification_score: scoreForConcept(attempt, "scale_levels", "unit_choice", "microscopic_scale"), extension_math_flag: false, misconceptions_json: JSON.stringify(attempt.misconceptions), raw_answers_json: JSON.stringify(attempt.raw_answers),
    badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: qids.map((qid) => {
      const answer = qid === "q01" ? state.answers.q01_sequence : state.answers[qid];
      const type = qid === "q01" ? "sequence" : classifyQuestions[qid] ? "mapping" : "choice";
      return { student_id: attempt.student.student_id, student_name: attempt.student.student_name, unit_id: mission.unit_id, unit_title: mission.unit_title, question_id: `${mission.unit_id}_${qid}`, question_type: type, skill_tag: questionConcept(qid), is_correct: isCorrect(qid), used_hint: Boolean(state.hints[qid]), attempt_answer: JSON.stringify(answer), answer_json: JSON.stringify(answer), correct_answer: qid === "q01" ? correctSequence.join(" > ") : classifyQuestions[qid] ? JSON.stringify(Object.fromEntries(classifyQuestions[qid].items.map((item) => [item.id, item.answer]))) : questionById(qid).answer, exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept", exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total) };
    })
  };
}
function renderAchievements() {
  const currentBadges = state.submitted_at ? (state.result || calculateResult()).badges : [];
  const status = submissionStatus();
  const guest = status === "guest";
  const pending = status === "pending";
  const litIds = cumulativeBadgeIds(currentBadges);
  const estimatedExp = Math.min((state.result || calculateResult()).attempt_total_exp || 0, UNIT_EXP_CAP);
  const badgeLabel = guest ? "本次測試徽章" : pending ? "本次待確認徽章" : "正式累積徽章";
  const badgeCount = guest || pending ? currentBadges.length : litIds.length;
  const expLabel = guest || pending ? "本次預估 EXP" : "正式累積 EXP";
  const expValue = guest || pending ? `${estimatedExp}/${UNIT_EXP_CAP}` : `${state.cumulative_total_exp || 0}`;
  const unitLabel = guest ? "累積狀態" : pending ? "後台狀態" : "已完成單元";
  const unitValue = guest ? "不列入正式累積" : pending ? "待後台確認" : `${state.completed_unit_count || 0}`;
  const syncNote = guest
    ? `guest 測試：本次預估 ${estimatedExp}/${UNIT_EXP_CAP} EXP，不列入正式累積；徽章亮燈僅供老師測試畫面。`
    : pending
      ? `本次預估 ${estimatedExp}/${UNIT_EXP_CAP} EXP，待後台確認；徽章亮燈先顯示本次作答預覽。`
      : "";
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">成就亮燈</p><h2>本單元成就：尺度校準徽章牆</h2>${guest || pending ? `<div class="feedback warn">${syncNote}</div>` : ""}
    <div class="score-grid"><div class="score-box"><span>${badgeLabel}</span><strong>${badgeCount}</strong></div><div class="score-box"><span>${expLabel}</span><strong>${expValue}</strong></div><div class="score-box"><span>${unitLabel}</span><strong>${unitValue}</strong></div></div><div class="badge-grid">${badges.map((badge) => { const lit = litIds.includes(badge.id); const gold = badge.id === "scale_flawless"; const pendingBadge = pending && lit && !state.cumulative_badges.includes(badge.id); return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}" data-badge-id="${badge.id}" data-badge-image-path="${badge.badge_image_path}"><img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><strong>${badge.name}</strong>${pendingBadge ? `<span class="pill warn">待同步</span>` : ""}<p class="muted">${badge.condition}</p></div>`; }).join("")}</div><p class="muted">${status === "verified" ? "正式亮燈狀態合併後台 StudentProgress 與本機完整 Attempts；同一徽章只計一次。" : "目前只顯示本次作答預覽；正式徽章需等待後台確認。"}</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
}
function renderRules() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務規則</p><h2>EXP、提示與再挑戰</h2><div class="card-grid"><div class="story-panel"><strong>單元上限</strong><p>本單元最高認列 500 EXP；零提示全對是最高路徑。</p></div><div class="story-panel"><strong>完成條件</strong><p>回答完所有必答題即可提交，不必先全對；需要調整的概念會保留一次提示與回饋。</p></div><div class="story-panel"><strong>提示後修正</strong><p>每題第一次錯選會出現一次概念提示；提示後修正仍有 EXP，但低於直接答對。</p></div><div class="story-panel"><strong>再挑戰</strong><p>提交後本次作答鎖定。若要再挑戰，請重新登入並從頭完成整份任務。</p></div></div><div class="actions"><button class="primary" id="rulesBack">回到任務</button></div></div></div>`;
}

function sectionStat(title, qids) {
  const correct = qids.filter(isCorrect).length;
  return {
    title,
    correct,
    total: qids.length,
    correct_without_hint: qids.filter((qid) => isCorrect(qid) && !state.hints[qid]).length,
    corrected_after_hint: qids.filter((qid) => isCorrect(qid) && state.hints[qid]).length
  };
}
function conceptMastery(qids) {
  const map = {};
  qids.forEach((qid) => {
    const concept = questionConcept(qid);
    if (!map[concept]) map[concept] = { correct: 0, total: 0, used_hint: false };
    map[concept].total += 1;
    if (isCorrect(qid)) map[concept].correct += 1;
    if (state.hints[qid]) map[concept].used_hint = true;
  });
  return map;
}
function buildAttempt() {
  const now = new Date().toISOString();
  return {
    attempt_id: state.attempt_id,
    timestamp: now,
    student: state.student,
    mission,
    attempt_type: state.attempt_type,
    attempt_type_candidate: state.attempt_type,
    attempt_no: Number(state.remote_completed_attempts || 0) + 1,
    attempt_session_id: state.attempt_session_id,
    attempt_session_token: state.attempt_session_token,
    question_version: state.question_version,
    started_from_login: true,
    previous_attempt_id: previousAttemptId(),
    retry_validation_status: state.attempt_type === "retry" ? "pending_backend_validation" : "not_retry",
    started_at: state.started_at,
    submitted_at: state.submitted_at || now,
    completion_status: "complete",
    required_answer_count: [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].length,
    answered_required_count: [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].filter(isAnswered).length,
    backend_status: state.backend_status,
    ...state.result,
    confidence_score: state.answers.reflection.confidence_score,
    confident_concept: state.answers.reflection.confident_concept,
    uncertain_concept: state.answers.reflection.uncertain_concept,
    student_question: state.answers.reflection.student_question,
    raw_answers: state.answers,
    payload_version: VERSION
  };
}
function scoreForConcept(attempt, ...concepts) {
  const mastery = attempt.concept_mastery_tags_json || {};
  const rows = concepts.map((concept) => mastery[concept]).filter(Boolean);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const correct = rows.reduce((sum, row) => sum + row.correct, 0);
  return total ? Math.round((correct / total) * 100) : 0;
}
async function submitAttemptToBackend(attempt) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  const payload = buildBackendPayload(attempt);
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(payload));
  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: "POST", body });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "backend_submit_failed");
  return data;
}
function isSessionFailure(error) {
  return /attempt_session|attempt_id_mismatch|question_version_mismatch|retry_previous_attempt_stale/.test(String(error?.message || error));
}
function pendingVerificationResult(result) {
  return { ...result, verification_status: "pending_network", credited_delta: 0 };
}
function attachReflection() {
  document.querySelector("#submitMission").addEventListener("click", async (event) => {
    if (state.submitted_at) return setScreen("result");
    if (!allRequiredAnswered()) {
      window.alert("請先完成所有必答題，再提交完整任務。");
      return;
    }
    const ok = window.confirm("提交後會進行結算，本次作答不能再修改；若要再挑戰，請重新登入並從頭完成。");
    if (!ok) return;
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "送出中...";
    state.answers.reflection = {
      confident_concept: document.querySelector("#confidentConcept").value.trim(),
      uncertain_concept: document.querySelector("#uncertainConcept").value.trim(),
      student_question: document.querySelector("#studentQuestion").value.trim(),
      confidence_score: Number(document.querySelector("#confidenceScore").value)
    };
    Object.assign(state.answers.reflection, evaluateReflectionQuality(state.answers.reflection));
    state.result = calculateResult();
    state.submitted_at = new Date().toISOString();
    let attempt = buildAttempt();
    try {
      const response = await submitAttemptToBackend(attempt);
      state.backend_status = state.student?.is_guest ? "local_guest" : response.verification_status === "server_verified" ? "submitted_verified" : "pending_verification";
      if (response.verified_attempt) state.result = { ...state.result, ...response.verified_attempt };
      applyBackendProgress(response.student_progress || response.progress || {});
      attempt = { ...attempt, ...state.result, backend_status: state.backend_status, backend_attempt_id: response.attempt_id || attempt.attempt_id };
    } catch (error) {
      if (isSessionFailure(error)) {
        window.alert("任務憑證已失效或本次 session 不再有效，請重新登入並從頭完成。");
        state = clone(defaultState);
        saveState();
        setScreen("login");
        return;
      }
      state.backend_status = "pending_local";
      state.result = pendingVerificationResult(state.result);
      attempt = { ...attempt, ...state.result, backend_status: state.backend_status };
      savePending(buildBackendPayload(attempt));
    }
    saveAttempt(attempt);
    state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + 1;
    unlock("result", "achievements");
    saveState();
    setScreen("result");
  });
}

function submissionStatus() {
  if (state.student?.is_guest || state.backend_status === "local_guest") return "guest";
  if (state.submitted_at && state.backend_status !== "submitted_verified") return "pending";
  return "verified";
}

function resultStatusNotice(result) {
  const status = submissionStatus();
  const attemptExp = Math.min(result.attempt_total_exp || 0, UNIT_EXP_CAP);
  if (status === "guest") return `<div class="feedback warn">guest 測試：本次預估 ${attemptExp}/${UNIT_EXP_CAP} EXP，不列入正式累積。</div>`;
  if (status === "pending") {
    const detail = state.backend_status === "pending_local"
      ? "後台暫時無法寫入，本次提交已保留在本機待補送佇列。"
      : "本次資料正在等待後台確認。";
    return `<div class="feedback warn">${detail}本次預估 ${attemptExp}/${UNIT_EXP_CAP} EXP，待後台確認。</div>`;
  }
  return `<div class="feedback good">本次任務已提交，作答結果已鎖定；後台已回傳正式認列資料。</div>`;
}

function renderResult() {
  const result = state.result || calculateResult();
  const status = submissionStatus();
  const notice = state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : "";
  const creditedLabel = status === "verified" ? "本單元正式認列" : "認列狀態";
  const creditedValue = status === "verified" ? `${result.unit_credited_exp} EXP` : status === "guest" ? "guest 不累積" : "待後台確認";
  const recognitionCopy = status === "verified"
    ? "本次取得是這次挑戰的原始表現；本單元正式認列會保留最高表現並受 500 EXP 上限限制。"
    : status === "guest"
      ? `guest 測試：本次預估 ${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)}/${UNIT_EXP_CAP} EXP，不列入正式累積。請使用學生學號登入，才會送交後台確認。`
      : `本次預估 ${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)}/${UNIT_EXP_CAP} EXP，待後台確認；確認完成前，這些數字只代表本次作答預覽。`;
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>提交後本次作答已鎖定</h2>${notice}${resultStatusNotice(result)}
    <div class="score-grid"><div class="score-box"><span>${status === "verified" ? "本次取得" : "本次預估"}</span><strong>${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)} EXP</strong></div><div class="score-box"><span>${creditedLabel}</span><strong>${creditedValue}</strong></div><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel"><strong>EXP 明細</strong><p>完成 ${result.completion_exp}｜直接答對 ${result.concept_exp}｜提示後修正 ${result.revision_exp}｜回報 ${result.question_exp}｜精熟 ${result.mastery_exp}｜再挑戰 ${result.retry_exp}</p></div>
      <div class="story-panel"><strong>${status === "verified" ? "本次與正式累積差異" : "本次預估狀態"}</strong><p>${recognitionCopy}</p></div>
      <div class="story-panel"><strong>回報品質</strong><p>${result.reflection_quality}：${result.reflection_exp_reason}</p><p class="muted">${status === "verified" ? `後台正式認列 ${result.question_exp} EXP。` : `前台候選 ${result.question_exp_candidate || 0} EXP，待後台重算。`}</p></div>
    </div>
    <div class="actions"><button class="primary" id="resultAchievements">查看成就</button><button class="secondary" id="resultRules">查看規則</button></div></div></div>`;
}
function attachEvents() {
  if (state.screen === "login") attachLogin();
  if (state.screen === "brief") document.querySelector("#briefNext").addEventListener("click", () => { unlock("scan"); setScreen("scan"); });
  if (state.screen === "scan") document.querySelector("#scanNext").addEventListener("click", () => { unlock("checkpoint1"); setScreen("checkpoint1"); });
  if (["checkpoint1", "checkpoint2", "checkpoint3"].includes(state.screen)) attachQuestionEvents();
  if (state.screen === "review") document.querySelector("#reviewNext").addEventListener("click", () => { unlock("reflection"); setScreen("reflection"); });
  if (state.screen === "reflection") attachReflection();
  if (state.screen === "result") {
    document.querySelector("#resultAchievements").addEventListener("click", () => setScreen("achievements"));
    document.querySelector("#resultRules").addEventListener("click", () => setScreen("rules"));
  }
  if (state.screen === "achievements") document.querySelector("#achieveResult").addEventListener("click", () => setScreen(state.submitted_at ? "result" : "brief"));
  if (state.screen === "rules") document.querySelector("#rulesBack").addEventListener("click", () => setScreen(state.student ? (state.submitted_at ? "result" : "brief") : "login"));
}
function render() {
  if (state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(state.screen)) state.screen = "result";
  renderNav();
  renderStudentMini();
  const views = {
    login: renderLogin,
    brief: renderBrief,
    scan: renderScan,
    checkpoint1: renderCheckpoint1,
    checkpoint2: renderCheckpoint2,
    checkpoint3: renderCheckpoint3,
    review: renderReview,
    reflection: renderReflection,
    result: renderResult,
    achievements: renderAchievements,
    rules: renderRules
  };
  updateBadgeOverviewBridge();
  screen.dataset.bioquestScreen = state.screen;
  screen.innerHTML = views[state.screen]();
  attachEvents();
  window.BioQuestCharacterLayout?.enhance?.({ force: true });
}

render();
