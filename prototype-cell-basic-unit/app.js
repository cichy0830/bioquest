const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const BASIC_UNIT_VERSION = "20260712-basic-unit-sheet-login-v4";
const mission = {
  unit_id: "cell_basic_unit",
  unit_title: "生物體的基本單位",
  mission_title: "生命積木辨識任務",
  mission_area: "微觀生命站"
};
const mentorName = "阿澤老師";
const mentorImages = { primary: "assets/mentor-basic-unit-guide-half.webp" };
const sceneImages = {
  ambient: "assets/bg-basic-unit-entry-wide.webp",
  briefingAzhe: "assets/bg-basic-unit-briefing-azhe-wide.webp"
};
const owlImages = {
  opening: "assets/owl-basic-unit-micro-guide.webp",
  prep: "assets/owl-basic-unit-prep-reminder-v2.webp",
  result: "assets/owl-basic-unit-result.webp"
};
const titleProgressRules = window.BioQuestTitleProgress;
const titleLevels = titleProgressRules?.levels || [
  { id: "trainee_investigator", order: "01", need: 0, title: "見習調查員" },
  { id: "life_observer", order: "02", need: 500, title: "生命觀察員" },
  { id: "ecology_recorder", order: "03", need: 1500, title: "生態記錄員" },
  { id: "concept_solver", order: "04", need: 3000, title: "概念解謎者" },
  { id: "micro_explorer", order: "05", need: 5200, title: "微觀探索者" },
  { id: "systems_investigator", order: "06", need: 8000, title: "系統調查員" },
  { id: "life_researcher", order: "07", need: 11800, title: "生命研究員" },
  { id: "bioquest_expert", order: "08", need: 16700, title: "BioQuest 專家" },
  { id: "bioquest_guardian", order: "09", need: 23400, title: "生命祕境守護者" }
];

const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const DIRECT_RAW_MAX = 405;
const REVISION_RAW_MAX = 225;
const storageKey = "bioquest_cell_basic_unit_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const badgeAsset = (id) => `../shared-assets/badges/cell_basic_unit/badge-cell_basic_unit-${id}.webp`;
const badges = [
  { id: "cell_basic_unit_entry", name: "細胞基礎入門徽章", condition: "完成生命積木辨識任務。" },
  { id: "cell_unit_concept_keeper", name: "細胞基本單位徽章", condition: "細胞基本單位題組達 85% 以上。" },
  { id: "unicellular_multicellular_sorter", name: "單多細胞辨識徽章", condition: "單細胞與多細胞分類達 85% 以上。" },
  { id: "cell_form_function_linker", name: "形態功能連結徽章", condition: "形狀與功能配對達 85% 以上。" },
  { id: "microscopic_evidence_reader", name: "顯微證據判讀徽章", condition: "顯微觀察證據題組達 85% 以上。" },
  { id: "cell_basic_unit_flawless", name: "細胞基礎零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "cell_basic_reflection_reporter", name: "高品質細胞回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_cell_basic_unit", name: "再探細胞基礎進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  remote_completed_attempts: 0,
  started_at: null,
  attempt_id: "",
  attempt_session_token: "",
  question_version: "",
  session_expires_at: "",
  remote_previous_attempt_id: "",
  remote_previous_accuracy: null,
  pending_hint_ids: [],
  failed_hint_ids: [],
  completedScreens: ["login", "rules"],
  activeToken: null,
  answers: {
    checkpoint1: {},
    checkpoint1Hints: {},
    checkpoint2: {},
    checkpoint2Hints: {},
    checkpoint3: {},
    checkpoint3Hints: {},
    checkpoint4: { sequence: ["organism", "tissue", "cell"] },
    checkpoint4Hints: {},
    reflection: {}
  },
  optionOrders: {},
  result: null,
  submitted_at: null,
  lockNotice: ""
};
let state = loadState();
let draggedSequenceId = null;

const unitQuestions = [
  { id: "q01", section: "checkpoint1", answer: "basic", prompt: "哪個說法最符合「細胞是生物體的基本單位」？", options: [
    { id: "basic", text: "細胞是生物體構造與功能的基本單位。" },
    { id: "particle", text: "細胞只是沒有功能的小點。" },
    { id: "large_only", text: "只有大型動物才有細胞。" },
    { id: "photo_only", text: "細胞只會出現在顯微鏡照片中。" }
  ], hint: "想想最小且仍和生命活動有關的基本單位。" },
  { id: "q02", section: "checkpoint1", answer: "plant_cells", prompt: "顯微鏡下看到洋蔥表皮由一格一格的小單位排列，這最能支持哪個想法？", options: [
    { id: "plant_cells", text: "這些小格可能是洋蔥表皮細胞，支持植物體由細胞組成。" },
    { id: "pattern_only", text: "這些小格只是放大後的規則花紋，不能當作細胞的證據。" },
    { id: "movement_required", text: "只有會自行移動的小單位才算細胞，所以這些小格不是細胞。" },
    { id: "surface_not_body", text: "只有整株洋蔥才和生命有關，表皮的小單位不屬於生物體。" }
  ], hint: "把樣本來源和看到的小單位連起來想。" },
  { id: "q06", section: "checkpoint2", answer: "single_life", prompt: "草履蟲是一個細胞構成的生物，仍能攝食、移動與繁殖。這最能說明什麼？", options: [
    { id: "single_life", text: "單一細胞也可能完成生命活動。" },
    { id: "no_function", text: "細胞都沒有功能。" },
    { id: "multi_one", text: "多細胞生物只需要一個細胞。" },
    { id: "micro_not_life", text: "顯微鏡下的生物都不是生物。" }
  ], hint: "題目強調一個細胞就能生活。" },
  { id: "q07", section: "checkpoint2", answer: "some_single", prompt: "「只要是生物，一定由很多細胞組成。」哪個修正較合理？", options: [
    { id: "some_single", text: "有些生物只由一個細胞構成，有些由許多細胞構成。" },
    { id: "no_cells", text: "所有生物都沒有細胞。" },
    { id: "plants_only", text: "只有植物有很多細胞。" },
    { id: "single_dead", text: "單細胞生物不能進行生命活動。" }
  ], hint: "想想草履蟲、酵母菌這類例子。" },
  { id: "q09", section: "checkpoint3", answer: "message", prompt: "神經細胞常有很長的突起，這種形狀較可能和哪個功能有關？", options: [
    { id: "message", text: "傳遞訊息到較遠的位置。" },
    { id: "water", text: "儲存大量水分。" },
    { id: "square", text: "讓細胞變成正方形。" },
    { id: "wall", text: "支撐植物細胞外形。" }
  ], hint: "長突起能幫助細胞和遠處位置建立連接。" },
  { id: "q10", section: "checkpoint3", answer: "gas", prompt: "紅血球呈雙凹圓盤狀，這種形狀較有利於哪一類功能？", options: [
    { id: "gas", text: "運輸氣體並通過血管。" },
    { id: "plant", text: "固定植物葉片形狀。" },
    { id: "cover", text: "覆蓋洋蔥表面。" },
    { id: "swim", text: "用來拍打游動。" }
  ], hint: "先看血液中移動、交換物質的任務。" },
  { id: "q12", section: "checkpoint4", answer: "cheek_cells", prompt: "觀察口腔皮膜玻片時，看到許多分散的小片狀單位。最合理的判斷方向是什麼？", options: [
    { id: "cheek_cells", text: "這些小片狀單位可能是口腔皮膜細胞，能作為人體由細胞組成的觀察證據。" },
    { id: "ordered_only", text: "細胞一定要整齊排列，分散的小片狀單位不可能是細胞。" },
    { id: "movement_required", text: "只有會自行移動的小單位才算細胞，靜止的小片只能是雜質。" },
    { id: "magnification_only", text: "顯微鏡只把樣本放大，看到小片狀單位不能支持人體由細胞組成。" }
  ], hint: "顯微觀察要連結樣本來源與看到的基本單位。" },
  { id: "q14", section: "checkpoint4", answer: "cell_function", prompt: "「細胞只是身體裡的小顆粒，真正的生命活動只發生在整個身體。」哪個修正較合理？", options: [
    { id: "cell_function", text: "細胞本身也能進行基本生命活動，是構造與功能基本單位。" },
    { id: "no_use", text: "細胞沒有任何功能。" },
    { id: "organ_only", text: "只有器官才和生命活動有關。" },
    { id: "not_alive", text: "顯微鏡看到的東西都不是活的。" }
  ], hint: "從構造和功能兩方面理解細胞，不只看大小。" }
];

const multiCellItems = [
  { id: "human", label: "人", answer: true },
  { id: "onion", label: "洋蔥", answer: true },
  { id: "yeast", label: "酵母菌", answer: true },
  { id: "paramecium", label: "草履蟲", answer: true },
  { id: "rock", label: "石頭", answer: false },
  { id: "ruler", label: "塑膠尺", answer: false }
];
const classifyItems = [
  { id: "paramecium", label: "草履蟲", answer: "single" },
  { id: "yeast", label: "酵母菌", answer: "single" },
  { id: "amoeba", label: "變形蟲", answer: "single" },
  { id: "human", label: "人", answer: "multi" },
  { id: "onion", label: "洋蔥", answer: "multi" },
  { id: "butterfly", label: "蝴蝶", answer: "multi" }
];
const matchItems = [
  { id: "flat", label: "扁平緊密排列", answer: "cover" },
  { id: "long", label: "有長突起", answer: "message" },
  { id: "disc", label: "雙凹圓盤狀", answer: "gas" },
  { id: "fiber", label: "細長可收縮", answer: "contract" }
];
const matchOptions = [
  { id: "", label: "請選擇功能" },
  { id: "cover", label: "保護或覆蓋" },
  { id: "message", label: "傳遞訊息" },
  { id: "gas", label: "運輸氣體" },
  { id: "contract", label: "運動或收縮" }
];
const sequenceSteps = [
  { id: "organism", label: "完整生物個體，例如一株洋蔥" },
  { id: "tissue", label: "身體的一部分或組織，例如洋蔥表皮" },
  { id: "cell", label: "顯微鏡下的小單位，例如洋蔥表皮細胞" }
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function getAttempts() {
  try { return JSON.parse(localStorage.getItem(attemptsKey)) || []; } catch { return []; }
}
function saveAttempt(attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));
}
function studentAttempts(studentId) {
  return getAttempts().filter((item) => item.student?.student_id === studentId && item.mission?.unit_id === mission.unit_id && item.completion_status === "complete");
}
function localTotalExp(studentId) {
  const bestByUnit = new Map();
  getAttempts().filter((item) => item.student?.student_id === studentId && item.completion_status === "complete").forEach((item) => {
    const unitId = item.mission?.unit_id || item.unit_id || "unknown";
    const credited = Number(item.unit_credited_exp ?? item.total_exp ?? 0);
    bestByUnit.set(unitId, Math.max(bestByUnit.get(unitId) || 0, credited));
  });
  return [...bestByUnit.values()].reduce((sum, value) => sum + value, 0);
}
function acquiredBadgeNames() {
  return new Set([
    ...studentAttempts(state.student?.student_id).flatMap((attempt) => attempt.badges || []),
    ...(state.result?.badges || [])
  ]);
}
function shuffledCopy(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
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
function orderedById(key, items) {
  return optionOrder(key, items.map((item) => item.id)).map((id) => items.find((item) => item.id === id)).filter(Boolean);
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
function showReviewNavigationNotice(message) {
  const notice = document.querySelector("#reviewNavigationNotice");
  if (notice) notice.textContent = message;
}
function enterReflectionFromReview() {
  if (state.submitted_at) return redirectLockedAttempt();
  if (!state.student) {
    showReviewNavigationNotice("登入狀態已失效，請重新登入後再填寫任務回報。");
    return;
  }
  if (!state.completedScreens.includes("review")) {
    showReviewNavigationNotice("請先完成關卡檢核並查看概念回饋，再填寫任務回報。");
    return;
  }
  try {
    state.result = state.result || calculateResult();
    unlock("reflection");
    setScreen("reflection");
  } catch (error) {
    console.error("review_to_reflection_failed", error);
    showReviewNavigationNotice("目前無法開啟任務回報，請重新整理後再試；若持續發生請通知老師。");
  }
}
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
navButtons.forEach((button) => button.addEventListener("click", () => { if (!button.disabled) setScreen(button.dataset.nav); }));

function mentorCard(title, text, image = mentorImages.primary) {
  return `<div class="mentor-card"><div class="mentor-avatar"><img src="${image}" alt="${mentorName}"></div><div class="mentor-copy"><span>${mentorName}</span><strong>${title}</strong><p>${text}</p></div></div>`;
}
function layout(content, image = owlImages.opening, imageAlt = "貓頭鷹助理") {
  return `<div class="mission-layout"><div class="panel hero-panel">${content}</div><div class="owl-frame"><img src="${image}" alt="${imageAlt}"></div></div>`;
}
function briefBackground() {
  return `<figure class="brief-background-figure" data-briefing-scene-hook="${sceneImages.briefingAzhe}" data-ambient-background="${sceneImages.ambient}"><img src="${sceneImages.briefingAzhe}" alt="微觀生命站任務簡報主視覺" onerror="this.onerror=null;this.src='${sceneImages.ambient}';"><figcaption>微觀生命站已開啟：把顯微鏡看到的小單位，連回整個生物體。</figcaption></figure>`;
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return `<div class="panel hero-panel">
    <p class="eyebrow">生命祕境 BioQuest</p>
    <h2 class="hero-title">任務登入</h2>
    <div class="story-panel"><strong>任務登入</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>cell_basic_unit</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
    <div class="form-grid"><label>學號<input id="studentIdInput" value="${value}" placeholder="例如 S70101 或 guest" autocomplete="off"></label></div>
    <div class="actions"><button class="primary" id="loginButton">登入任務</button><button class="secondary" id="guestButton">老師測試 guest</button><button class="ghost" id="resetButton">清除本機測試紀錄</button></div>
    <div id="loginMessage" class="status-line"></div>
  </div>`;
}
async function fetchStudentStatus(id) {
  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error("backend_invalid_json");
  }
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
function isServerVerifiedSession(session) {
  return Boolean(session?.attempt_id && session?.attempt_session_token && session?.question_version === BASIC_UNIT_VERSION && session?.verification_mode === "server_verified");
}
function queueHintEvent(questionId) {
  if (!state.pending_hint_ids.includes(questionId)) state.pending_hint_ids.push(questionId);
  state.failed_hint_ids = state.failed_hint_ids.filter((id) => id !== questionId);
  saveState();
}
async function flushHintEvents(questionIds = state.pending_hint_ids) {
  if (!state.student || state.student.is_guest) return true;
  if (!state.attempt_session_token) return false;
  const ids = [...new Set(questionIds)];
  const failed = [];
  for (const questionId of ids) {
    try {
      await postBackendAction("hintEvent", {
        student_id: state.student.student_id,
        unit_id: mission.unit_id,
        attempt_id: state.attempt_id,
        attempt_session_token: state.attempt_session_token,
        question_id: questionId,
        question_version: state.question_version
      });
      state.pending_hint_ids = state.pending_hint_ids.filter((id) => id !== questionId);
    } catch (error) {
      failed.push(questionId);
    }
  }
  state.failed_hint_ids = failed;
  saveState();
  return failed.length === 0;
}
function recordHintEvent(questionId) {
  if (!state.student || state.student.is_guest) return Promise.resolve(true);
  queueHintEvent(questionId);
  return flushHintEvents([questionId]);
}
function normalizeBackendStudent(data, id) {
  if (!data?.ok || !data.student) return null;
  const source = data.student;
  if (String(source.student_id || "") !== String(id)) return null;
  const progress = data.progress || data.student_progress || source.progress || {};
  return {
    student_id: source.student_id || id,
    class_name: source.class_name || source.class || "未設定",
    seat_no: source.seat_no || source.seat || "00",
    student_name: source.student_name || source.name || "未設定",
    progress,
    profile_gender: progress.profile_gender || source.profile_gender || source.gender || "",
    current_title_id: progress.current_title_id || source.current_title_id || "",
    current_title: progress.current_title || source.current_title || "",
    title_avatar_variant: progress.title_avatar_variant || source.title_avatar_variant || "",
    title_avatar_path: progress.title_avatar_path || source.title_avatar_path || "",
    total_exp: progress.total_exp ?? source.total_exp,
    is_guest: id === "guest" || Boolean(source.is_guest)
  };
}
function clearPendingLoginIdentity() {
  state = structuredClone(defaultState);
  saveState();
  renderStudentMini();
}
async function login(id) {
  const message = document.querySelector("#loginMessage");
  if (!id) {
    message.innerHTML = `<span class="pill warn">請輸入學號。</span>`;
    return;
  }
  window.BioQuestLoginUX?.begin({ guest: id === "guest" });
  await window.BioQuestLoginUX?.paint();
  clearPendingLoginIdentity();
  let student = null;
  let completed = 0;
  let serverSession = null;
  let remotePreviousAccuracy = null;
  try {
    const data = await fetchStudentStatus(id);
    if (!data?.ok) {
      message.innerHTML = `<span class="pill warn">${data?.error === "student_not_found" ? "查無此學號，請確認後重試。" : "後台未能完成身分查詢，請稍後重試。"}</span>`;
      return;
    }
    student = normalizeBackendStudent(data, id);
    if (!student) {
      message.innerHTML = `<span class="pill warn">後台回傳的學生資料不完整或學號不符，尚未登入。請重試或通知老師。</span>`;
      return;
    }
    completed = Number(data.attempt_status?.completed_attempt_count ?? data.completed_attempts ?? 0);
    serverSession = await startAttemptSession(student.student_id);
    if (!isServerVerifiedSession(serverSession)) throw new Error("backend_registry_not_ready");
    serverSession.previous_attempt_id = serverSession.previous_attempt_id || data.attempt_status?.previous_attempt_id || data.attempt_status?.latest_attempt_id || "";
    const remoteAccuracy = data.attempt_status?.previous_accuracy ?? data.attempt_status?.best_accuracy;
    remotePreviousAccuracy = remoteAccuracy === null || remoteAccuracy === undefined || remoteAccuracy === "" ? null : Number(remoteAccuracy);
  } catch (error) {
    if (id !== "guest") {
      const notReady = String(error?.message || error).includes("backend_registry_not_ready");
      message.innerHTML = `<span class="pill warn">${notReady ? "後台版本尚未更新，請通知老師。" : "後台目前無法連線，尚未登入。請檢查網路後按「登入任務」重試。"}</span>`;
      return;
    }
    student = roster.guest;
    completed = studentAttempts(student.student_id).length;
    message.innerHTML = `<span class="pill warn">後台暫時無法連線；guest 已切換為本機測試模式，不列入正式統計。</span>`;
  }
  state = structuredClone(defaultState);
  state.student = { ...student };
  state.remote_completed_attempts = completed;
  state.attempt_type = completed > 0 ? "retry" : "first";
  state.started_at = new Date().toISOString();
  if (serverSession) {
    state.attempt_id = serverSession.attempt_id;
    state.attempt_session_token = serverSession.attempt_session_token;
    state.question_version = serverSession.question_version;
    state.session_expires_at = serverSession.expires_at;
    state.remote_previous_attempt_id = serverSession.previous_attempt_id || "";
    state.remote_previous_accuracy = remotePreviousAccuracy;
  }
  if (student.is_guest) {
    state.attempt_id = `guest-${Date.now()}`;
    state.question_version = BASIC_UNIT_VERSION;
  }
  state.optionOrders = {};
  unlock("brief", "rules", "achievements");
  saveState();
  setScreen("brief");
}
function attachLogin() {
  document.querySelector("#loginButton").addEventListener("click", () => login(document.querySelector("#studentIdInput").value.trim()));
  document.querySelector("#guestButton").addEventListener("click", () => login("guest"));
  document.querySelector("#resetButton").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(attemptsKey);
    state = structuredClone(defaultState);
    render();
  });
}

function renderBrief() {
  return `
    <div class="wide-layout">
      <div class="panel hero-panel brief-scene-card">
        <p class="eyebrow">任務檔案開啟</p>
        <h2 class="hero-title">歡迎，${state.student.student_name}</h2>
        ${briefBackground()}
        <div class="story-panel highlight"><strong>進入微觀生命站</strong><p>上一個任務學會使用顯微鏡後，這次要把看到的小單位連回核心概念：生物體由細胞組成，細胞是構造與功能的基本單位。</p></div>
        <div class="story-panel"><strong>任務核心</strong><p>辨認細胞基本單位、單細胞與多細胞、細胞形狀和功能，以及顯微觀察提供的證據。</p></div>
        <div class="status-line"><span class="pill">${state.student.class_name} 班 ${state.student.seat_no} 號</span><span class="pill ${state.attempt_type === "retry" ? "warn" : ""}">${state.attempt_type === "retry" ? "再挑戰" : "首次挑戰"}</span></div>
        <div class="actions"><button class="primary" id="briefNext">開始任務準備</button></div>
      </div>
    </div>
  `;
}
function renderScan() {
  const concepts = ["細胞是構造與功能基本單位", "生物體由細胞組成", "有些生物只由一個細胞構成", "不同細胞形狀常和功能有關", "顯微鏡影像可作為細胞證據"];
  return `
    <div class="wide-layout prep-layout">
      <section class="panel hero-panel prep-panel">
        <p class="eyebrow">任務準備</p>
        <h2 class="hero-title">進關卡前先整理概念</h2>
        <div class="prep-hero" data-prep-hero>
          <figure class="prep-owl-visual">
            <img src="${owlImages.prep}" alt="貓頭鷹助理拿著細胞觀察片，提醒進入微觀掃描前的重要概念">
          </figure>
          <div class="prep-reminder"><strong>微觀掃描提醒</strong><p>本單元不考完整胞器功能。請先掌握細胞作為基本單位、單多細胞差異、形狀功能關聯與觀察證據。</p></div>
        </div>
        <div class="card-grid prep-concept-grid">${concepts.map((text) => `<div class="concept-card"><strong>${text}</strong></div>`).join("")}</div>
        <div class="actions"><button class="primary" id="scanNext">進入生命積木掃描</button></div>
      </section>
    </div>
  `;
}

function questionById(id) { return unitQuestions.find((item) => item.id === id); }
function recordChoice(questionId, optionId) {
  const q = questionById(questionId);
  state.answers[q.section][questionId] = optionId;
  if (optionId !== q.answer && !state.answers[`${q.section}Hints`][questionId]) {
    state.answers[`${q.section}Hints`][questionId] = true;
    recordHintEvent(questionId);
  }
  saveState();
  render();
}
function renderChoiceQuestion(questionId) {
  const q = questionById(questionId);
  const selected = state.answers[q.section][questionId];
  const showHint = Boolean(state.answers[`${q.section}Hints`][questionId]);
  return `<article class="question-card"><p class="eyebrow">${q.id}</p><h3>${q.prompt}</h3><div class="choice-grid">${optionOrder(`opts_${q.id}`, q.options.map((option) => option.id)).map((id) => {
    const option = q.options.find((item) => item.id === id);
    const stateClass = selected === id ? id === q.answer ? "selected correct" : "selected wrong" : "";
    return `<button class="choice-button ${stateClass}" data-choice="${q.id}" data-option="${id}">${option.text}</button>`;
  }).join("")}</div>${showHint ? `<div class="feedback warn">提示：${q.hint}</div>` : ""}</article>`;
}
function renderMultiSelect() {
  const selected = state.answers.checkpoint1.multi || [];
  const confirmed = Boolean(state.answers.checkpoint1.multiConfirmed);
  const showHint = Boolean(state.answers.checkpoint1Hints.multi);
  return `<article class="question-card"><p class="eyebrow">可複選</p><h3>下列哪些生物體由細胞組成？請選出所有符合的選項。</h3><div class="choice-grid">${orderedById("multiCellItems", multiCellItems).map((item) => `<button class="choice-button ${selected.includes(item.id) ? "selected" : ""}" data-multi="${item.id}">${item.label}</button>`).join("")}</div><div class="multi-confirm-row"><button class="secondary" id="confirmMulti" type="button">確認這組答案</button><span class="selected-answer">${confirmed ? "已確認這組答案" : selected.length ? `已選 ${selected.length} 項，尚未確認` : "尚未選擇"}</span></div>${showHint ? `<div class="feedback warn">提示：先判斷哪些是生物，再想生物體是否由細胞構成。</div>` : ""}</article>`;
}
function toggleMulti(id) {
  const selected = new Set(state.answers.checkpoint1.multi || []);
  selected.has(id) ? selected.delete(id) : selected.add(id);
  state.answers.checkpoint1.multi = [...selected];
  state.answers.checkpoint1.multiConfirmed = false;
  saveState();
  render();
}
function confirmMulti() {
  const selected = new Set(state.answers.checkpoint1.multi || []);
  const correct = multiCellItems.filter((item) => item.answer).map((item) => item.id).sort().join("|");
  const isCorrect = [...selected].sort().join("|") === correct;
  state.answers.checkpoint1.multiConfirmed = true;
  if (!isCorrect && !state.answers.checkpoint1Hints.multi) {
    state.answers.checkpoint1Hints.multi = true;
    recordHintEvent("q03");
  }
  saveState();
  render();
  return isCorrect;
}
function renderCheckpoint1() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡一</p><h2>生命積木掃描</h2><p class="lead">用顯微鏡觀察證據與基本單位概念判斷。</p><div class="question-grid">${renderChoiceQuestion("q01")}${renderMultiSelect()}${renderChoiceQuestion("q02")}</div><div class="actions"><button class="primary" id="checkpoint1Next">進入單細胞與多細胞分類</button></div></div></div>`;
}
function renderClassification() {
  const categories = [{ id: "single", title: "單細胞生物" }, { id: "multi", title: "多細胞生物" }];
  return `<article class="question-card"><p class="eyebrow">可分類</p><h3>請把例子分到單細胞或多細胞。先點選項，再點分類欄。</h3><div class="token-grid">${orderedById("classifyItems", classifyItems).map((item) => `<button class="token-card ${state.activeToken === item.id ? "selected" : ""}" data-token="${item.id}">${item.label}<br><span class="muted">目前：${categoryName(state.answers.checkpoint2[item.id])}</span></button>`).join("")}</div><div class="category-grid">${categories.map((cat) => `<button class="category-box" data-category="${cat.id}"><div class="category-title">${cat.title}</div>${classifyItems.filter((item) => state.answers.checkpoint2[item.id] === cat.id).map((item) => `<span class="pill">${item.label}</span>`).join(" ")}</button>`).join("")}</div>${state.answers.checkpoint2Hints.classify ? `<div class="feedback warn">提示：先判斷這個生物是否只靠一個細胞就能生活。</div>` : ""}</article>`;
}
function categoryName(id) { return id === "single" ? "單細胞" : id === "multi" ? "多細胞" : "未分類"; }
function setCategory(category) {
  if (!state.activeToken) return;
  const item = classifyItems.find((entry) => entry.id === state.activeToken);
  state.answers.checkpoint2[item.id] = category;
  if (category !== item.answer && !state.answers.checkpoint2Hints.classify) {
    state.answers.checkpoint2Hints.classify = true;
    recordHintEvent("q04");
  }
  state.activeToken = null;
  saveState();
  render();
}
function renderCheckpoint2() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡二</p><h2>單細胞與多細胞分類</h2><div class="question-grid">${renderClassification()}${renderChoiceQuestion("q06")}${renderChoiceQuestion("q07")}</div><div class="actions"><button class="primary" id="checkpoint2Next">進入形狀與功能配對</button></div></div></div>`;
}
function renderMatchQuestion() {
  return `<article class="question-card"><p class="eyebrow">配對題</p><h3>請將細胞外形線索和可能功能配對。選完後會直接顯示已選答案。</h3><div class="stack">${matchItems.map((item) => {
    const value = state.answers.checkpoint3[item.id] || "";
    const label = matchOptions.find((option) => option.id === value)?.label || "尚未選擇";
    return `<label class="match-field"><strong>${item.label}</strong><select class="match-select" data-match="${item.id}">${matchOptions.map((option) => `<option value="${option.id}" ${value === option.id ? "selected" : ""}>${option.label}</option>`).join("")}</select><span class="selected-answer">已選：${label}</span></label>`;
  }).join("")}</div>${state.answers.checkpoint3Hints.match ? `<div class="feedback warn">提示：不要先背名稱，先看形狀如何幫助它完成任務。</div>` : ""}</article>`;
}
function setMatch(id, value) {
  state.answers.checkpoint3[id] = value;
  const item = matchItems.find((entry) => entry.id === id);
  if (value && value !== item.answer && !state.answers.checkpoint3Hints.match) {
    state.answers.checkpoint3Hints.match = true;
    recordHintEvent("q08");
  }
  saveState();
  render();
}
function renderCheckpoint3() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡三</p><h2>形狀與功能配對</h2><div class="question-grid">${renderMatchQuestion()}${renderChoiceQuestion("q09")}${renderChoiceQuestion("q10")}</div><div class="actions"><button class="primary" id="checkpoint3Next">進入顯微證據判讀</button></div></div></div>`;
}
function getSequenceOrder() { return state.answers.checkpoint4.sequence || ["organism", "tissue", "cell"]; }
function moveSequence(id, dir) {
  const order = getSequenceOrder();
  const index = order.indexOf(id);
  const next = dir === "up" ? index - 1 : index + 1;
  if (next < 0 || next >= order.length) return;
  [order[index], order[next]] = [order[next], order[index]];
  state.answers.checkpoint4.sequence = order;
  saveState();
  render();
}
function dropSequence(beforeId) {
  if (!draggedSequenceId || draggedSequenceId === beforeId) return;
  const order = getSequenceOrder().filter((id) => id !== draggedSequenceId);
  const index = order.indexOf(beforeId);
  order.splice(index < 0 ? order.length : index, 0, draggedSequenceId);
  state.answers.checkpoint4.sequence = order;
  draggedSequenceId = null;
  saveState();
  render();
}
function renderSequenceQuestion() {
  const order = getSequenceOrder();
  const isWrong = order.join("|") !== "organism|tissue|cell";
  return `<article class="question-card"><p class="eyebrow">拖曳排序</p><h3>請由大到小排出生物層級。手機拖曳不穩時可用上移 / 下移。</h3><div class="sortable-list">${order.map((id, index) => {
    const step = sequenceSteps.find((item) => item.id === id);
    return `<div class="sortable-item" draggable="true" data-sequence-id="${id}"><span class="drag-handle" aria-hidden="true"></span><strong>${step.label}</strong><div class="sequence-move-buttons"><button class="icon-action" data-sequence-move="${id}" data-direction="up" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-sequence-move="${id}" data-direction="down" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div></div>`;
  }).join("")}</div>${isWrong && state.answers.checkpoint4Hints.sequence ? `<div class="feedback warn">提示：先找完整生物，再找身體的一部分，最後找顯微鏡下的小單位。</div>` : ""}</article>`;
}
function renderCheckpoint4() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡四</p><h2>顯微證據與層級判斷</h2><div class="question-grid">${renderChoiceQuestion("q12")}${renderSequenceQuestion()}${renderChoiceQuestion("q14")}</div><div class="actions"><button class="primary" id="checkpoint4Next">查看概念回饋</button></div></div></div>`;
}

function scoreChoice(questionId) {
  const q = questionById(questionId);
  const selected = state.answers[q.section][questionId];
  const correct = selected === q.answer;
  const hint = Boolean(state.answers[`${q.section}Hints`][questionId]);
  return { correct, hint, correctedAfterHint: correct && hint, misconception: correct ? null : q.id };
}
function scoreMulti() {
  const selected = new Set(state.answers.checkpoint1.multi || []);
  const correctIds = multiCellItems.filter((item) => item.answer).map((item) => item.id);
  const wrong = multiCellItems.filter((item) => selected.has(item.id) !== item.answer);
  const confirmed = Boolean(state.answers.checkpoint1.multiConfirmed);
  return { correct: confirmed && wrong.length === 0 && selected.size === correctIds.length, hint: Boolean(state.answers.checkpoint1Hints.multi), misconception: !confirmed || wrong.length ? "only_animals_plants_have_cells" : null };
}
function scoreClassify() {
  const wrong = classifyItems.filter((item) => state.answers.checkpoint2[item.id] !== item.answer);
  return { correct: wrong.length === 0, total: classifyItems.length, right: classifyItems.length - wrong.length, hint: Boolean(state.answers.checkpoint2Hints.classify), misconception: wrong.length ? "all_living_things_multicellular" : null };
}
function scoreMatch() {
  const wrong = matchItems.filter((item) => state.answers.checkpoint3[item.id] !== item.answer);
  return { correct: wrong.length === 0, total: matchItems.length, right: matchItems.length - wrong.length, hint: Boolean(state.answers.checkpoint3Hints.match), misconception: wrong.length ? "all_cells_same_shape" : null };
}
function scoreSequence() {
  const correct = getSequenceOrder().join("|") === "organism|tissue|cell";
  return { correct, hint: Boolean(state.answers.checkpoint4Hints.sequence), misconception: correct ? null : "level_confusion" };
}
function buildSectionScores() {
  const sections = [
    { title: "細胞基本單位", items: [scoreChoice("q01"), scoreMulti(), scoreChoice("q02")] },
    { title: "單細胞與多細胞", items: [scoreClassify(), scoreChoice("q06"), scoreChoice("q07")] },
    { title: "形狀與功能", items: [scoreMatch(), scoreChoice("q09"), scoreChoice("q10")] },
    { title: "顯微證據與層級", items: [scoreChoice("q12"), scoreSequence(), scoreChoice("q14")] }
  ];
  return sections.map((section) => {
    const total = section.items.reduce((sum, item) => sum + (item.total || 1), 0);
    const correct = section.items.reduce((sum, item) => sum + (item.total ? item.right : item.correct ? 1 : 0), 0);
    const hintUsed = section.items.filter((item) => item.hint).length;
    return {
      title: section.title,
      total,
      correct,
      correctWithoutHint: section.items.filter((item) => item.correct && !item.hint).length,
      correctedAfterHint: section.items.filter((item) => item.correctedAfterHint || (item.correct && item.hint)).length,
      hintUsed,
      misconceptions: section.items.map((item) => item.misconception).filter(Boolean)
    };
  });
}
function evaluateReflectionQuality(reflection) {
  const raw = (reflection.student_question || "").trim();
  const normalized = raw.replace(/\s+/g, "");
  const terms = ["細胞", "基本單位", "生物體", "構造", "功能", "單細胞", "多細胞", "顯微", "觀察", "形狀", "紅血球", "神經"];
  const questionSignals = ["為什麼", "怎麼", "如何", "差異", "不確定", "混淆", "證據"];
  if (!normalized) return { reflection_quality: "blank", question_exp: 0, reflection_exp_reason: "空白可提交，但沒有可判讀的回報內容。", reflection_review_status: "auto_scored" };
  if (/^(.)\1{4,}$/.test(normalized) || ["老師好帥", "好玩", "不知道", "沒有"].includes(normalized)) return { reflection_quality: "invalid", question_exp: 0, reflection_exp_reason: "內容未指出本單元概念，或與學科學習無關。", reflection_review_status: "auto_scored" };
  const matched = terms.filter((term) => normalized.includes(term));
  const hasQuestion = questionSignals.some((term) => normalized.includes(term));
  if (matched.length >= 1 && hasQuestion && normalized.length >= 14) return { reflection_quality: "discussion_question", question_exp: 40, reflection_exp_reason: `可帶到課堂討論；命中概念詞：${matched.slice(0, 3).join("、")}。`, reflection_review_status: "auto_scored" };
  if (matched.length >= 1 && normalized.length >= 8) return { reflection_quality: "specific_uncertainty", question_exp: 25, reflection_exp_reason: `有具體不確定或概念關聯：${matched.slice(0, 3).join("、")}。`, reflection_review_status: "auto_scored" };
  if (matched.length >= 1) return { reflection_quality: "minimal_concept", question_exp: 10, reflection_exp_reason: `有本單元概念詞但說明較短：${matched.slice(0, 3).join("、")}。`, reflection_review_status: "auto_scored" };
  if (["難", "看不懂", "不懂", "不會"].some((term) => normalized.includes(term))) return { reflection_quality: "needs_review", question_exp: 0, reflection_exp_reason: "可能有學習困難，但未指出明確概念，需教師複核。", reflection_review_status: "pending_review" };
  return { reflection_quality: "invalid", question_exp: 0, reflection_exp_reason: "內容沒有明確學科關聯。", reflection_review_status: "auto_scored" };
}
function previousBestCredited() {
  if (!state.student?.student_id) return 0;
  return Math.max(0, ...studentAttempts(state.student.student_id).map((attempt) => attempt.unit_credited_exp || attempt.total_exp || 0));
}
function previousAccuracy() {
  if (!state.student?.student_id) return null;
  const attempts = studentAttempts(state.student.student_id);
  return attempts.length ? attempts[attempts.length - 1].accuracy || 0 : null;
}
function calculateResult() {
  const sections = buildSectionScores();
  const total = sections.reduce((sum, item) => sum + item.total, 0);
  const correct = sections.reduce((sum, item) => sum + item.correct, 0);
  const hintUsed = sections.reduce((sum, item) => sum + item.hintUsed, 0);
  const correctWithoutHint = sections.reduce((sum, item) => sum + item.correctWithoutHint, 0);
  const correctedAfterHint = sections.reduce((sum, item) => sum + item.correctedAfterHint, 0);
  const accuracy = correct / total;
  const directRaw = correctWithoutHint * 15;
  const revisionRaw = correctedAfterHint * 10;
  const conceptExp = Math.round(Math.min(DIRECT_EXP_POOL, (directRaw / DIRECT_RAW_MAX) * DIRECT_EXP_POOL));
  const revisionExp = Math.round(Math.min(REVISION_EXP_POOL, (revisionRaw / REVISION_RAW_MAX) * REVISION_EXP_POOL));
  const reflection = evaluateReflectionQuality(state.answers.reflection);
  const masteryExp = accuracy === 1 && hintUsed === 0 ? 140 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const prevAcc = previousAccuracy();
  const retryExp = state.attempt_type === "retry" && prevAcc !== null && accuracy > prevAcc ? Math.min(60, Math.round((accuracy - prevAcc) * 100)) : 0;
  const attemptTotalExp = 100 + conceptExp + revisionExp + reflection.question_exp + masteryExp + retryExp;
  const best = previousBestCredited();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(best, attemptTotalExp));
  const misconceptions = [...new Set(sections.flatMap((item) => item.misconceptions))];
  const earned = [badges[0].name];
  if (sections[0].correct / sections[0].total >= 0.85) earned.push(badges[1].name);
  if (sections[1].correct / sections[1].total >= 0.85) earned.push(badges[2].name);
  if (sections[2].correct / sections[2].total >= 0.85) earned.push(badges[3].name);
  if (sections[3].correct / sections[3].total >= 0.85) earned.push(badges[4].name);
  if (accuracy === 1 && hintUsed === 0) earned.push(badges[5].name);
  if (reflection.reflection_quality === "discussion_question") earned.push(badges[6].name);
  if (retryExp > 0) earned.push(badges[7].name);
  return {
    unit_exp_cap: UNIT_EXP_CAP,
    completion_exp: 100,
    concept_exp: conceptExp,
    revision_exp: revisionExp,
    question_exp: reflection.question_exp,
    reflection_quality: reflection.reflection_quality,
    reflection_exp_reason: reflection.reflection_exp_reason,
    reflection_review_status: reflection.reflection_review_status,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_total_exp: attemptTotalExp,
    unit_credited_exp: unitCreditedExp,
    credited_delta: Math.max(0, unitCreditedExp - best),
    total_exp: attemptTotalExp,
    correct,
    total,
    correct_without_hint: correctWithoutHint,
    corrected_after_hint: correctedAfterHint,
    hint_used: hintUsed,
    accuracy,
    previous_accuracy: prevAcc,
    accuracy_delta: prevAcc === null ? null : accuracy - prevAcc,
    section_stats: sections.map((item) => ({ title: item.title, correct: item.correct, total: item.total, correct_without_hint: item.correctWithoutHint, corrected_after_hint: item.correctedAfterHint, exp: 0 })),
    misconceptions,
    badges: earned,
    teacher_attention_needed: state.answers.reflection.confidence_score <= 2 || accuracy < 0.6 || reflection.reflection_review_status === "pending_review" || misconceptions.length >= 3
  };
}
function buildAttempt() {
  const now = new Date().toISOString();
  return {
    timestamp: now,
    student: state.student,
    mission,
    attempt_type: state.attempt_type,
    attempt_no: state.remote_completed_attempts + 1,
    started_at: state.started_at,
    submitted_at: state.submitted_at || now,
    completion_status: "complete",
    ...state.result,
    confidence_score: state.answers.reflection.confidence_score,
    confident_concept: state.answers.reflection.confident_concept,
    uncertain_concept: state.answers.reflection.uncertain_concept,
    student_question: state.answers.reflection.student_question,
    raw_answers: state.answers,
    payload_version: BASIC_UNIT_VERSION
  };
}
function canonicalRawAnswers() {
  const classify = {};
  classifyItems.forEach((item) => { classify[item.id] = state.answers.checkpoint2[item.id] || ""; });
  const shapeMatch = {};
  matchItems.forEach((item) => { shapeMatch[item.id] = state.answers.checkpoint3[item.id] || ""; });
  const sequence = getSequenceOrder();
  return {
    q01: state.answers.checkpoint1.q01 || "",
    q02: state.answers.checkpoint1.q02 || "",
    q03: [...(state.answers.checkpoint1.multi || [])],
    q04: classify,
    q06: state.answers.checkpoint2.q06 || "",
    q07: state.answers.checkpoint2.q07 || "",
    q08: shapeMatch,
    q09: state.answers.checkpoint3.q09 || "",
    q10: state.answers.checkpoint3.q10 || "",
    q12: state.answers.checkpoint4.q12 || "",
    q13: sequence,
    q13_sequence: sequence,
    q14: state.answers.checkpoint4.q14 || ""
  };
}
function canonicalHintMap() {
  return {
    q01: Boolean(state.answers.checkpoint1Hints.q01),
    q02: Boolean(state.answers.checkpoint1Hints.q02),
    q03: Boolean(state.answers.checkpoint1Hints.multi),
    q04: Boolean(state.answers.checkpoint2Hints.classify),
    q06: Boolean(state.answers.checkpoint2Hints.q06),
    q07: Boolean(state.answers.checkpoint2Hints.q07),
    q08: Boolean(state.answers.checkpoint3Hints.match),
    q09: Boolean(state.answers.checkpoint3Hints.q09),
    q10: Boolean(state.answers.checkpoint3Hints.q10),
    q12: Boolean(state.answers.checkpoint4Hints.q12),
    q13: Boolean(state.answers.checkpoint4Hints.sequence),
    q14: Boolean(state.answers.checkpoint4Hints.q14)
  };
}
function canonicalQuestionLogs(rawAnswers = canonicalRawAnswers()) {
  const hints = canonicalHintMap();
  return ["q01", "q02", "q03", "q04", "q06", "q07", "q08", "q09", "q10", "q12", "q13", "q14"].map((qid) => ({
    question_id: `${mission.unit_id}_${qid}`,
    question_version: state.question_version || BASIC_UNIT_VERSION,
    attempt_answer: JSON.stringify(rawAnswers[qid]),
    used_hint: Boolean(hints[qid]),
    hint_used: Boolean(hints[qid])
  }));
}
function buildBackendPayload(attempt) {
  const rawAnswers = canonicalRawAnswers();
  return {
    attempt_id: state.attempt_id || `${mission.unit_id}_${attempt.student.student_id}_${Date.now()}`,
    attempt_session_token: state.attempt_session_token || "",
    previous_attempt_id: state.remote_previous_attempt_id || "",
    question_version: state.question_version || BASIC_UNIT_VERSION,
    student_id: attempt.student.student_id,
    student_name: attempt.student.student_name,
    class_name: attempt.student.class_name,
    seat_no: attempt.student.seat_no,
    unit_id: attempt.mission.unit_id,
    unit_title: attempt.mission.unit_title,
    attempt_type: attempt.attempt_type,
    started_at: attempt.started_at,
    submitted_at: attempt.submitted_at,
    total_questions: attempt.total,
    correct: attempt.correct,
    accuracy: attempt.accuracy,
    hints_used: attempt.hint_used,
    correct_without_hint: attempt.correct_without_hint,
    corrected_after_hint: attempt.corrected_after_hint,
    completion_exp: attempt.completion_exp,
    concept_exp: attempt.concept_exp,
    revision_exp: attempt.revision_exp,
    question_exp: attempt.question_exp,
    mastery_exp: attempt.mastery_exp,
    retry_exp: attempt.retry_exp,
    attempt_total_exp: attempt.attempt_total_exp,
    unit_credited_exp: attempt.unit_credited_exp,
    credited_delta: attempt.credited_delta,
    confidence_score: attempt.confidence_score,
    reflection_quality: attempt.reflection_quality,
    teacher_attention_needed: attempt.teacher_attention_needed,
    student_question: attempt.student_question,
    raw_answers: rawAnswers,
    raw_answers_json: JSON.stringify(rawAnswers),
    question_logs: canonicalQuestionLogs(rawAnswers)
  };
}
async function submitAttemptToBackend(attempt) {
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(buildBackendPayload(attempt)));
  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: "POST", body });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "backend_submit_failed");
  return data;
}

function applyBackendStudentProgress(data) {
  const progress = data?.student_progress || data?.progress;
  if (!progress || typeof progress !== "object" || !state.student) return false;
  state.student.progress = { ...(state.student.progress || {}), ...progress };
  ["total_exp", "current_title_id", "current_title", "profile_gender", "title_avatar_variant", "title_avatar_path"].forEach((field) => {
    if (progress[field] !== undefined && progress[field] !== null) state.student[field] = progress[field];
  });
  return true;
}
function parseBadgeIds(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function applyVerifiedAttempt(localAttempt, backendResponse) {
  const verified = backendResponse?.verified_attempt || backendResponse?.attempt || null;
  if (!verified || verified.verification_status !== "server_verified") return localAttempt;
  const badgeIds = parseBadgeIds(verified.badges || verified.badges_json);
  const totalQuestions = Number(verified.total_questions || localAttempt.total || 0);
  const correct = Number(verified.correct || 0);
  const accuracy = Number(verified.accuracy ?? (totalQuestions ? correct / totalQuestions : 0));
  return {
    ...localAttempt,
    verification_status: verified.verification_status,
    hint_verification_status: verified.hint_verification_status,
    total: totalQuestions,
    total_questions: totalQuestions,
    correct,
    accuracy,
    correct_without_hint: Number(verified.correct_without_hint || 0),
    corrected_after_hint: Number(verified.corrected_after_hint || 0),
    hint_used: Number(verified.hints_used || verified.hint_used || 0),
    completion_exp: Number(verified.completion_exp || 0),
    concept_exp: Number(verified.concept_exp || 0),
    revision_exp: Number(verified.revision_exp || 0),
    question_exp: Number(verified.question_exp || 0),
    mastery_exp: Number(verified.mastery_exp || 0),
    retry_exp: Number(verified.retry_exp || 0),
    attempt_total_exp: Number(verified.attempt_total_exp || 0),
    unit_credited_exp: Number(verified.unit_credited_exp || 0),
    credited_delta: Number(verified.credited_delta || 0),
    badges: badgeIds,
    question_logs: verified.question_logs || localAttempt.question_logs || [],
    reflection_quality: verified.reflection_quality || localAttempt.reflection_quality,
    reflection_exp_reason: verified.reflection_exp_reason || localAttempt.reflection_exp_reason,
    teacher_attention_needed: Boolean(verified.teacher_attention_needed)
  };
}

function misconceptionText(tag) {
  const map = {
    q01: "建議再理解細胞不只是小顆粒，而是構造與功能基本單位。",
    only_animals_plants_have_cells: "建議再擴展細胞概念：動物、植物、真菌與許多微生物都由細胞構成。",
    q02: "建議再連結顯微鏡觀察證據與細胞概念。",
    all_living_things_multicellular: "建議再比較單細胞與多細胞生物。",
    all_cells_same_shape: "建議再閱讀細胞形狀與功能。",
    level_confusion: "建議再整理個體、組織與細胞層級。"
  };
  return map[tag] || "建議再把顯微觀察、細胞層級與生命活動連在一起思考。";
}
function renderReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>任務掃描結果</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理主要概念。</p>"}</div><div class="story-panel"><strong>建議再閱讀</strong>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>提問方向</strong><p>細胞為什麼被稱為基本單位、顯微鏡觀察如何支持細胞概念、單細胞生物如何完成生命活動。</p></div></div><div id="reviewNavigationNotice" class="feedback warn" role="status" aria-live="polite"></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}
function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；具體且與細胞基本單位、單多細胞、形狀功能或顯微證據相關的問題，可取得回報 EXP。</p></div><div class="form-grid"><label>我最能掌握的概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個想帶到課堂討論的方向，並用自己的話補充<span class="field-help">不要直接複製方向詞。</span><textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div></div>`;
}
function attachReflection() {
  document.querySelector("#submitMission").addEventListener("click", async (event) => {
    if (state.submitted_at) return setScreen("result");
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
    const attempt = buildAttempt();
    try {
      let finalAttempt = attempt;
      if (!state.student?.is_guest) {
        const hintsSynced = await flushHintEvents();
        if (!hintsSynced) throw new Error("hint_event_sync_failed");
        const backendResponse = await submitAttemptToBackend(attempt);
        applyBackendStudentProgress(backendResponse);
        finalAttempt = applyVerifiedAttempt(attempt, backendResponse);
        state.result = finalAttempt;
      }
      saveAttempt(finalAttempt);
      state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + 1;
      unlock("result", "achievements");
      saveState();
      setScreen("result");
    } catch {
      state.submitted_at = null;
      button.disabled = false;
      button.textContent = "提交任務";
      saveState();
      const warning = document.createElement("div");
      warning.className = "feedback warn";
      warning.textContent = "目前無法寫入後台，請稍後再按一次提交任務。";
      button.closest(".actions").after(warning);
    }
  });
}
function titleAndProgress() {
  const explicitId = state.student?.progress?.current_title_id || state.student?.current_title_id || "";
  const explicitLevel = titleLevels.find((level) => level.id === explicitId);
  const remoteTotal = Number(state.student?.progress?.total_exp ?? state.student?.total_exp ?? NaN);
  const localTotal = state.student ? localTotalExp(state.student.student_id) : 0;
  const totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, localTotal, explicitLevel?.need || 0);
  const fallbackIndex = titleLevels.reduce((index, level, itemIndex) => totalExp >= level.need ? itemIndex : index, 0);
  const fallbackCurrent = titleLevels[fallbackIndex];
  const fallbackNext = titleLevels[fallbackIndex + 1];
  const title = titleProgressRules?.getTitleForExp(totalExp) || {
    id: fallbackCurrent.id,
    current: fallbackCurrent.title,
    next: fallbackNext?.title || "已達目前最高稱號",
    remaining: fallbackNext ? Math.max(0, fallbackNext.need - totalExp) : 0,
    title_progress_percent: Math.min(100, totalExp / 23400 * 100)
  };
  if (state.student?.progress?.current_title || state.student?.current_title) title.current = state.student.progress?.current_title || state.student.current_title;
  return { totalExp, title };
}
function titleAvatarPath(titleId) {
  const direct = state.student?.progress?.title_avatar_path || state.student?.title_avatar_path || "";
  if (direct) return direct.startsWith("shared-assets/") ? `../${direct}` : direct;
  const variant = String(state.student?.progress?.title_avatar_variant || state.student?.title_avatar_variant || state.student?.profile_gender || "male").toLowerCase();
  const gender = ["f", "female", "girl", "女"].includes(variant) ? "female" : "male";
  const level = titleLevels.find((item) => item.id === titleId) || titleLevels[0];
  return `../shared-assets/title-avatars/title-${level.order}-${level.id}-${gender}.webp`;
}
function renderResultBadges(result) {
  const earned = new Set(result.badges || []);
  return `<section class="result-badges"><h3>本單元徽章</h3><div class="badge-grid">${badges.map((badge) => `<div class="badge-card ${earned.has(badge.id) || earned.has(badge.name) ? "lit earned-now" : ""}" data-badge-id="${badge.id}"><img src="${badge.badge_image_path}" alt="${badge.name}"><strong>${badge.name}</strong><p>${badge.condition}</p></div>`).join("")}</div></section>`;
}
function renderResult() {
  const result = state.result || calculateResult();
  const ledger = [["直接答對", result.concept_exp], ["提示後修正", result.revision_exp], ["完成任務", result.completion_exp], ["任務回報", result.question_exp], ["精熟加成", result.mastery_exp], ["再挑戰進步", result.retry_exp], ["本次總計", result.attempt_total_exp]];
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>生命積木辨識完成</h2>${state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : ""}<div class="feedback good">提交後本次作答已鎖定；若要再挑戰，請重新登入並從頭完成。</div><div class="score-grid"><div class="score-box"><span>本次取得 EXP</span><strong>${result.attempt_total_exp}</strong></div><div class="score-box"><span>本單元認列 EXP</span><strong>${result.unit_credited_exp}/${UNIT_EXP_CAP}</strong></div><div class="score-box"><span>正確率</span><strong>${Math.round(result.accuracy * 100)}%</strong></div></div><section class="exp-ledger"><h3>EXP 明細</h3><div class="exp-ledger-grid">${ledger.map(([label, value], index) => `<div class="exp-ledger-item ${index === ledger.length - 1 ? "total" : ""}"><span>${label}</span><strong>${value} EXP</strong></div>`).join("")}</div></section><div class="story-panel"><strong>回報品質</strong><p>${result.reflection_exp_reason}</p></div>${renderResultBadges(result)}<div class="actions"><button class="primary" id="resultAchievements">查看成就</button><button class="secondary" id="resultRules">查看規則</button></div></div></div>`;
}
function renderAchievements() {
  const result = state.result || calculateResult();
  const { totalExp, title } = titleAndProgress();
  const acquired = acquiredBadgeNames();
  const earnedNow = new Set(result.badges || []);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">累積成就</p><h2>${state.student?.student_name || "學習者"}</h2><div class="student-title-card" data-current-title-id="${title.id}" data-title-avatar-path="${titleAvatarPath(title.id)}"><div class="student-title-avatar"><img src="${titleAvatarPath(title.id)}" alt="${title.current}稱號角色"></div><div><span>目前稱號</span><strong>${title.current}</strong><p>累積 ${totalExp} EXP</p><p>${title.remaining ? `下一稱號：${title.next}，還差 ${title.remaining} EXP` : "已達最高稱號，EXP 仍會繼續累積。"}</p></div></div><div class="progress-bar"><div class="progress-fill" style="width:${title.title_progress_percent}%"></div></div><p class="muted">稱號進度 ${Math.min(100, Math.round(title.title_progress_percent * 10) / 10)}%</p></div><div class="panel"><p class="eyebrow">成就收藏</p><h2>本單元成就</h2><div class="badge-grid">${badges.map((badge) => `<div class="badge-card ${acquired.has(badge.id) || acquired.has(badge.name) ? "lit" : ""} ${earnedNow.has(badge.id) || earnedNow.has(badge.name) ? "earned-now" : ""}" data-badge-id="${badge.id}"><img src="${badge.badge_image_path}" alt="${badge.name}"><strong>${badge.name}</strong><p>${badge.condition}</p></div>`).join("")}</div><div class="actions"><button class="secondary" id="achieveResult">返回結算</button></div></div></div>`;
}
function renderRules() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務規則</p><h2>EXP、提示與再挑戰</h2><div class="card-grid"><div class="story-panel"><strong>單元封頂</strong><p>本單元認列 EXP 上限為 500。第一次零提示全對是最高路徑。</p></div><div class="story-panel"><strong>提示後修正</strong><p>提示會給判斷線索，不直接公布答案。提示後答對仍有修正 EXP，但低於未提示答對。</p></div><div class="story-panel"><strong>提交鎖定</strong><p>提交任務後本次作答結果鎖定。再挑戰必須重新登入並從頭完成整份任務。</p></div></div><div class="actions"><button class="secondary" id="rulesBack">返回目前任務</button></div></div></div>`;
}
function attachCommonChoiceHandlers() {
  document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => recordChoice(button.dataset.choice, button.dataset.option)));
  document.querySelectorAll("[data-multi]").forEach((button) => button.addEventListener("click", () => toggleMulti(button.dataset.multi)));
  document.querySelector("#confirmMulti")?.addEventListener("click", confirmMulti);
  document.querySelectorAll("[data-token]").forEach((button) => button.addEventListener("click", () => { state.activeToken = button.dataset.token; saveState(); render(); }));
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => setCategory(button.dataset.category)));
  document.querySelectorAll("[data-match]").forEach((select) => select.addEventListener("change", () => setMatch(select.dataset.match, select.value)));
  document.querySelectorAll("[data-sequence-move]").forEach((button) => button.addEventListener("click", () => moveSequence(button.dataset.sequenceMove, button.dataset.direction)));
  document.querySelectorAll("[data-sequence-id]").forEach((item) => {
    item.addEventListener("dragstart", (event) => { draggedSequenceId = item.dataset.sequenceId; event.dataTransfer?.setData("text/plain", draggedSequenceId); });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => { event.preventDefault(); dropSequence(item.dataset.sequenceId); });
  });
}
function attachEvents() {
  if (state.screen === "login") attachLogin();
  if (state.screen === "brief") document.querySelector("#briefNext").addEventListener("click", () => { unlock("scan"); setScreen("scan"); });
  if (state.screen === "scan") document.querySelector("#scanNext").addEventListener("click", () => { unlock("checkpoint1"); setScreen("checkpoint1"); });
  if (state.screen === "checkpoint1") {
    attachCommonChoiceHandlers();
    document.querySelector("#checkpoint1Next").addEventListener("click", () => { unlock("checkpoint2"); setScreen("checkpoint2"); });
  }
  if (state.screen === "checkpoint2") {
    attachCommonChoiceHandlers();
    document.querySelector("#checkpoint2Next").addEventListener("click", () => { unlock("checkpoint3"); setScreen("checkpoint3"); });
  }
  if (state.screen === "checkpoint3") {
    attachCommonChoiceHandlers();
    document.querySelector("#checkpoint3Next").addEventListener("click", () => { unlock("checkpoint4"); setScreen("checkpoint4"); });
  }
  if (state.screen === "checkpoint4") {
    attachCommonChoiceHandlers();
    if (getSequenceOrder().join("|") !== "organism|tissue|cell" && !state.answers.checkpoint4Hints.sequence) {
      state.answers.checkpoint4Hints.sequence = true;
      recordHintEvent("q13");
    }
    document.querySelector("#checkpoint4Next").addEventListener("click", () => { state.result = calculateResult(); saveState(); unlock("review"); setScreen("review"); });
  }
  if (state.screen === "review") document.querySelector("#reviewNext")?.addEventListener("click", enterReflectionFromReview);
  if (state.screen === "reflection") attachReflection();
  if (state.screen === "result") {
    document.querySelector("#resultAchievements").addEventListener("click", () => setScreen("achievements"));
    document.querySelector("#resultRules").addEventListener("click", () => setScreen("rules"));
  }
  if (state.screen === "achievements") document.querySelector("#achieveResult").addEventListener("click", () => setScreen("result"));
  if (state.screen === "rules") document.querySelector("#rulesBack").addEventListener("click", () => setScreen(state.student ? state.screen === "rules" && state.submitted_at ? "result" : "brief" : "login"));
}
function render() {
  if (state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(state.screen)) state.screen = "result";
  renderNav();
  renderStudentMini();
  const views = { login: renderLogin, brief: renderBrief, scan: renderScan, checkpoint1: renderCheckpoint1, checkpoint2: renderCheckpoint2, checkpoint3: renderCheckpoint3, checkpoint4: renderCheckpoint4, review: renderReview, reflection: renderReflection, result: renderResult, achievements: renderAchievements, rules: renderRules };
  screen.innerHTML = views[state.screen]();
  attachEvents();
}
render();
