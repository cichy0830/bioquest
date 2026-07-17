const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260717-nutrient-test-u12-fixes-v2";
const QUESTION_VERSION = "20260711-nutrient-test-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_nutrient_test_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "nutrient_test",
  unit_title: "養分檢測",
  mission_title: "食物證據檢測任務",
  mission_area: "生命補給站"
};

const assets = {
  mentorFallback: "../prototype-life-world/assets/mentor-life-world-azhe-v2.webp",
  owlPrep: "assets/owl-nutrient-test-prep-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-nutrient-test-briefing-azhe-wide.webp",
  ambientBackgroundHook: "assets/bg-nutrient-test-entry-wide.webp",
  iodineStarchColorHook: "assets/iodine-starch-color-cards.webp",
  biuretProteinColorHook: "assets/biuret-protein-color-cards.webp",
  lipidOilSpotHook: "assets/lipid-oil-spot-cards.webp"
};

const badgeAsset = (id) => `../shared-assets/badges/nutrient_test/badge-nutrient_test-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["養分檢測", "試劑", "碘液", "澱粉", "本氏液", "葡萄糖", "蛋白質", "雙縮脲", "脂質", "蘇丹", "油斑", "加熱", "顏色變化", "藍黑色", "紫色", "紅橘色", "對照組", "試管", "樣品", "未變色", "實驗安全", "資料判讀", "證據"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "我喜歡炸雞", "減肥", "身材"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["碘液和本氏液的檢測目標差異", "本氏液加熱後的顏色變化", "蛋白質檢測的紫色反應", "脂質油斑或染色線索", "對照組為什麼能作為比較基準", "檢測結果的證據限制", "加熱與試管安全"]
};

const badges = [
  { id: "nutrient_test_entry", name: "檢測入門徽章", condition: "完成食物證據檢測任務。" },
  { id: "reagent_nutrient_matcher", name: "試劑養分配對徽章", condition: "檢測目標配對題組達標。" },
  { id: "color_change_interpreter", name: "顏色變化判讀徽章", condition: "能判讀顏色或現象支持的特定養分。" },
  { id: "heating_safety_keeper", name: "加熱安全守護徽章", condition: "安全與流程概念題組達標。" },
  { id: "control_group_designer", name: "對照設計徽章", condition: "能使用比較基準理解對照組。" },
  { id: "test_data_evidence_reader", name: "檢測證據判讀徽章", condition: "能由資料整理合理證據範圍。" },
  { id: "sample_result_classifier", name: "樣品結果分類徽章", condition: "能分辨不同樣品結果支持的養分。" },
  { id: "nutrient_test_misconception_reviser", name: "檢測迷思修正徽章", condition: "提示後修正至少一項檢測概念。" },
  { id: "nutrient_test_flawless", name: "養分檢測零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "nutrient_test_reflection_reporter", name: "高品質檢測回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_nutrient_test", name: "再探檢測進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const sequenceSteps = [
  { id: "label", label: "辨認紀錄中的樣品與比較組標示" },
  { id: "reagent", label: "確認紀錄註明的檢測資料類型" },
  { id: "safe_heat", label: "確認安全條件已由老師完成並記錄" },
  { id: "observe", label: "讀取完成觀察後的顏色現象" },
  { id: "compare", label: "將現象和比較組一起解讀" }
];
const correctSequence = ["label", "reagent", "safe_heat", "observe", "compare"];

const questions = [
  { id: "q02", section: "checkpoint1", concept: "starch_iodine_test", answer: "starch_possible", prompt: "資料卡顯示：樣品接觸碘液後呈藍黑色。這個結果最能支持哪一項判斷？", hint: "先想碘液常用來追蹤哪一類和主食、麵粉有關的養分。", misconception: "iodine_benedict_confusion", visual: "iodine", options: [{ id: "starch_possible", text: "樣品可能含澱粉" }, { id: "glucose_certain", text: "樣品一定含葡萄糖" }, { id: "protein_certain", text: "樣品一定含蛋白質" }, { id: "all_absent", text: "樣品完全沒有其他養分" }] },
  { id: "q03", section: "checkpoint1", concept: "glucose_benedict_test", answer: "glucose_possible", prompt: "老師提供的完成觀察紀錄中，本氏液安全加熱後由藍色轉為橙紅色。這最能支持什麼？", hint: "注意「本氏液」和「完成加熱觀察」兩個線索，再回到它追蹤的養分。", misconception: "benedict_no_heat", visual: "benedict", options: [{ id: "glucose_possible", text: "樣品可能含葡萄糖" }, { id: "starch_certain", text: "樣品一定含澱粉" }, { id: "lipid_certain", text: "樣品一定含脂質" }, { id: "all_nutrients", text: "所有養分都很多" }] },
  { id: "q04", section: "checkpoint1", concept: "protein_biuret_test", answer: "protein_possible", prompt: "蛋白質檢測資料卡出現紫色反應。哪個判斷較合理？", hint: "比較資料卡的原始顏色與觀察後顏色，再回到題目指定的檢測目標。", misconception: "protein_method_confusion", visual: "biuret", options: [{ id: "protein_possible", text: "樣品可能含蛋白質" }, { id: "water_only", text: "樣品可能只含水" }, { id: "starch_purple", text: "紫色代表澱粉" }, { id: "no_heat", text: "紫色代表本氏液沒有加熱" }] },
  { id: "q05", section: "checkpoint2", concept: "lipid_test", answer: "lipid_possible", prompt: "在相同紙材、樣品量與觀察時間下，樣品留下持續可見的透明油斑；另一份完成紀錄呈現指定染色線索。這較適合支持什麼？", hint: "先確認透明痕跡是在相同材料與觀察條件下比較，而且能持續存在；不要把任何透明或潮濕痕跡都當成同一證據。", misconception: "lipid_overgeneralization", visual: "lipid", options: [{ id: "lipid_possible", text: "樣品可能含脂質" }, { id: "starch_certain", text: "樣品一定含澱粉" }, { id: "glucose_certain", text: "樣品一定含葡萄糖" }, { id: "no_protein", text: "樣品完全不含蛋白質" }] },
  { id: "q06", section: "checkpoint2", concept: "color_change_evidence", answer: "starch_not_supported", prompt: "某樣品的碘液紀錄沒有出現藍黑色。哪個解讀較合理？", hint: "先問碘液原本檢測哪一個目標，再判斷沒有變色代表哪個範圍的證據不足。", misconception: "no_change_no_nutrients", visual: "iodine", options: [{ id: "starch_not_supported", text: "這次檢測未支持含澱粉，不能直接說沒有任何養分" }, { id: "no_nutrients", text: "樣品完全沒有任何養分" }, { id: "glucose_large", text: "樣品一定含大量葡萄糖" }, { id: "all_test", text: "碘液可檢測所有養分" }] },
  { id: "q07", section: "checkpoint2", concept: "evidence_limit", answer: "starch_protein", prompt: "未知樣品紀錄：碘液藍黑色；本氏液完成加熱後仍藍色；蛋白質檢測紫色；脂質線索不明顯。哪個結論較合理？", hint: "一次看一個檢測目標，再合併支持的證據；不要把一項結果擴大到所有養分。", misconception: "color_all_nutrients", visual: "control", options: [{ id: "starch_protein", text: "目前證據支持可能含澱粉與蛋白質" }, { id: "all_nutrients", text: "目前證據支持含所有養分" }, { id: "starch_means_glucose", text: "只要有澱粉就一定有葡萄糖" }, { id: "none", text: "脂質線索不明顯，所以沒有任何養分" }] },
  { id: "q08", section: "checkpoint2", concept: "starch_iodine_test", answer: "iodine_starch", prompt: "老師要判讀麵粉水是否有澱粉的證據，哪一張檢測資料卡最直接相關？", hint: "題目目標是澱粉，先找和澱粉最直接相關的檢測線索。", misconception: "iodine_benedict_confusion", visual: "iodine", options: [{ id: "iodine_starch", text: "碘液與藍黑色變化的比較資料" }, { id: "benedict_without_context", text: "沒有加熱條件的本氏液資料" }, { id: "paper_only", text: "只看紙張是否有油斑" }, { id: "appearance", text: "只看樣品外觀顏色" }] },
  { id: "q11", section: "checkpoint3", concept: "control_group", answer: "comparison_basis", prompt: "在養分檢測資料中加入已知樣品或清水作比較，主要目的較接近哪一項？", hint: "先找未知樣品單獨紀錄時還缺少哪一種判斷依據，再看其他資料能補足什麼缺口。", misconception: "control_unnecessary", visual: "control", options: [{ id: "comparison_basis", text: "提供比較基準，幫助判斷未知樣品的變化" }, { id: "more_steps", text: "讓紀錄看起來比較多步驟" }, { id: "replace_unknown", text: "取代未知樣品" }, { id: "all_positive", text: "讓所有樣品都變成陽性" }] },
  { id: "q12", section: "checkpoint3", concept: "control_group", answer: "positive_negative", prompt: "若要判讀碘液的澱粉證據，哪個比較設計較合理？", hint: "想想哪兩種資料能讓你比較「有目標養分」和「沒有目標養分」的差別。", misconception: "control_unnecessary", visual: "control", options: [{ id: "positive_negative", text: "用已知含澱粉樣品和清水作比較" }, { id: "one_unknown", text: "只看未知樣品一次" }, { id: "mix_all", text: "把所有資料混成一組" }, { id: "no_record", text: "不記錄原本顏色" }] },
  { id: "q13", section: "checkpoint3", concept: "evidence_limit", answer: "target_limit", prompt: "有同學說：『顏色越深，代表這個食物所有養分都越多。』哪個修正較合理？", hint: "這份紀錄是定性線索。先確認它只追蹤哪個目標，以及不同資料是否在相同條件下取得。", misconception: "color_all_nutrients", visual: "control", options: [{ id: "target_limit", text: "顏色深淺要先回到該檢測目標，不能直接代表所有養分" }, { id: "all_protein", text: "顏色越深一定代表蛋白質越多" }, { id: "no_control", text: "只要顏色深就不用比較" }, { id: "same_meaning", text: "所有試劑的顏色意義都一樣" }] },
  { id: "q14", section: "checkpoint3", concept: "glucose_benedict_test", answer: "heat_required", prompt: "有同學說：『本氏液滴進樣品就能馬上判斷葡萄糖，不需要加熱。』哪個修正較合理？", hint: "先檢查完成觀察紀錄是否具備判讀所需條件；條件不完整時，顏色資料能否直接支持結論？", misconception: "benedict_no_heat", visual: "benedict", options: [{ id: "heat_required", text: "本氏液檢測葡萄糖通常需在安全加熱後觀察顏色變化" }, { id: "iodine_target", text: "本氏液主要檢測澱粉" }, { id: "all_positive", text: "加熱會讓所有樣品一定陽性" }, { id: "all_test", text: "本氏液可以檢測所有養分" }] }
];

const multiSelectQuestions = {
  q10: {
    prompt: "下列哪些是本氏液加熱檢測資料中需要注意的安全原則？",
    hint: "看到加熱與試管時，先想眼睛、燙傷、液體噴濺與試管口方向。",
    misconception: "unsafe_heating",
    options: [{ id: "goggles", text: "依老師規範使用護目鏡" }, { id: "away", text: "試管口不朝向自己或同學" }, { id: "hot", text: "避免直接用手碰剛加熱的器材" }, { id: "water_bath", text: "依老師指定的安全方式完成加熱觀察" }, { id: "toward_people", text: "把試管口對準同學方便觀察" }, { id: "smell", text: "邊加熱邊靠近聞氣味" }],
    answers: ["goggles", "away", "hot", "water_bath"],
    evidence: "completed_observation"
  }
};

const classifyQuestions = {
  q01: {
    prompt: "請將檢測方法與主要檢測目標配對。每一列都要選擇。",
    hint: "先想每一種檢測方法最常被用來追蹤哪一類養分；不要只看顏色。",
    misconception: "iodine_benedict_confusion",
    options: [{ id: "starch", label: "澱粉" }, { id: "glucose", label: "葡萄糖" }, { id: "protein", label: "蛋白質" }, { id: "lipid", label: "脂質" }],
    items: [{ id: "iodine", label: "碘液資料卡", answer: "starch" }, { id: "benedict", label: "本氏液完成加熱資料卡", answer: "glucose" }, { id: "biuret", label: "蛋白質檢測資料卡", answer: "protein" }, { id: "lipid_test", label: "蘇丹／油斑資料卡", answer: "lipid" }]
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
  answers: { q01: {}, q09_sequence: [], q10: [], reflection: {} },
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
  if (!state.answers.q09_sequence?.length) {
    state.answers.q09_sequence = optionOrder("q09_sequence", sequenceSteps.map((step) => step.id));
    saveState();
  }
  return state.answers.q09_sequence;
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
    <p class="eyebrow">生命祕境 BioQuest</p><h2 class="hero-title">任務登入</h2>
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>nutrient_test</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
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
    state.student = { ...roster.guest, progress: {} };
    state.remote_completed_attempts = studentAttempts("guest").length;
    state.attempt_type = state.remote_completed_attempts > 0 ? "retry" : "first";
    state.started_at = new Date().toISOString();
    state.attempt_id = `guest_${mission.unit_id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state.attempt_session_id = state.attempt_id;
    state.attempt_session_token = "guest_local_session";
    state.question_version = QUESTION_VERSION;
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
function assetFigure(src, alt, caption) {
  return `<figure class="question-visual nutrient-test-question-image"><img src="${src}" alt="${alt}"><figcaption>${caption}</figcaption></figure>`;
}
function renderQuestionImage(question) {
  const map = {
    q02: [assets.iodineStarchColorHook, "題目現象比較圖", "請配合題幹與完成紀錄判讀；圖卡本身不代表結論。"],
    q04: [assets.biuretProteinColorHook, "題目顏色比較圖", "比較觀察前後的顏色資料，再判斷證據範圍。"],
    q05: [assets.lipidOilSpotHook, "題目現象比較圖", "比較相同材料與觀察條件下的完成紀錄。"]
  };
  const row = map[question.id];
  return row ? assetFigure(row[0], row[1], row[2]) : "";
}
function evidenceTable(caption, headers, rows) {
  return `<section class="question-evidence" aria-label="${caption}"><strong>${caption}</strong><div class="evidence-table" role="table"><div class="evidence-row evidence-head" role="row">${headers.map((header) => `<span role="columnheader">${header}</span>`).join("")}</div>${rows.map((row) => `<div class="evidence-row" role="row">${row.map((cell) => `<span role="cell">${cell}</span>`).join("")}</div>`).join("")}</div></section>`;
}
function completedObservationCard(note) {
  return `<section class="completed-observation-card" aria-label="老師提供的完成觀察紀錄"><span class="pill">已完成觀察紀錄</span><p>${note}</p><small>只閱讀老師提供的紀錄並判讀證據，不包含可自行照做的操作步驟。</small></section>`;
}
function renderQuestionEvidence(qid) {
  if (["q03", "q14"].includes(qid)) {
    return completedObservationCard("紀錄包含檢測資料類型、必要安全條件是否完整，以及觀察前後的顏色欄位。");
  }
  if (qid === "q06") {
    return evidenceTable("碘液完成觀察比較", ["資料", "完成觀察"], [
      ["未知樣品", "未呈藍黑色"],
      ["已知含澱粉樣品", "呈藍黑色"],
      ["清水比較", "未呈藍黑色"]
    ]);
  }
  if (qid === "q07") {
    return evidenceTable("未知樣品四項完成觀察", ["資料卡", "完成觀察"], [
      ["碘液紀錄", "呈藍黑色"],
      ["本氏液紀錄", "老師完成必要條件後仍為藍色"],
      ["蛋白質檢測紀錄", "呈紫色"],
      ["脂質線索紀錄", "未見明顯線索"]
    ]);
  }
  if (qid === "q08") {
    return evidenceTable("四張候選資料卡", ["資料卡", "可讀資訊"], [
      ["甲", "檢測液與觀察前後顏色"],
      ["乙", "檢測液資料，但必要條件未完整記錄"],
      ["丙", "紙張觀察紀錄"],
      ["丁", "樣品原本外觀"]
    ]);
  }
  if (["q11", "q12"].includes(qid)) {
    return evidenceTable("比較資料配置", ["資料角色", "紀錄狀態"], [
      ["未知樣品", "待判讀"],
      ["已知樣品", "完成紀錄"],
      ["基準樣品", "完成紀錄"]
    ]);
  }
  if (qid === "q13") {
    return `<section class="question-evidence qualitative-note"><strong>定性證據提醒</strong><p>顏色現象可作為特定檢測目標的線索；若材料、濃度、時間或觀察條件不同，不能只用深淺推算含量，也不能外推到所有養分。</p></section>`;
  }
  return "";
}
function renderChoiceQuestion(qid) {
  const question = questionById(qid);
  return `<div class="question-card" data-question-id="${qid}"><h3>${question.prompt}</h3>${renderQuestionImage(question)}${renderQuestionEvidence(qid)}<div class="choice-grid">${orderedOptions(question).map((option) => `<button class="choice-button${selectedClass(question, option)}" data-choice="${qid}" data-value="${option.id}">${option.text}</button>`).join("")}</div><p class="selected-answer">${state.answers[qid] ? `已選：${question.options.find((option) => option.id === state.answers[qid])?.text || ""}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${question.hint}</div>` : ""}</div>`;
}
function renderMultiSelect(qid) {
  const config = multiSelectQuestions[qid];
  const selected = state.answers[qid] || [];
  const order = optionOrder(`${qid}_multi`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id));
  return `<div class="question-card multi-select-card" data-question-id="${qid}"><div class="question-mode-banner"><strong>可複選</strong><span>請選出所有符合的選項</span></div><h3>${config.prompt}</h3>${completedObservationCard("安全欄位記錄護具、試管口方向、高溫器材與老師指定條件；請只判斷風險原則。")}<div class="choice-grid">${order.map((option) => `<button class="choice-button ${selected.includes(option.id) ? "selected" : ""}" data-multi="${qid}" data-value="${option.id}" aria-pressed="${selected.includes(option.id)}">${option.text}</button>`).join("")}</div><p class="selected-answer">${selected.length ? `已選：${selected.map((id) => config.options.find((option) => option.id === id)?.text).filter(Boolean).join("、")}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}</div>`;
}
function renderSequenceQuestion() {
  const order = ensureSequence();
  return `<div class="question-card" data-question-id="q09"><h3>閱讀老師已完成的觀察紀錄摘要，拖曳整理資料判讀順序。</h3><p class="field-help">排序題：可拖曳卡片；手機可使用上移 / 下移按鈕。只整理紀錄欄位的閱讀順序，不是實驗操作流程。</p>${completedObservationCard("紀錄已由老師完成，包含多類可讀欄位；請先判斷每張卡是在辨認資料、確認判讀條件、讀取現象，還是協助比較證據。")}<div class="sortable-list">${order.map((id, index) => { const step = sequenceSteps.find((item) => item.id === id); return `<div class="sortable-item" draggable="true" data-sequence-id="${id}"><span class="drag-handle" aria-hidden="true"></span><strong>${step.label}</strong><div class="sequence-move-buttons"><button class="icon-action" data-move="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-move="${id}" data-dir="1" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div></div>`; }).join("")}</div>${state.hints.q09 ? `<div class="feedback warn">先把每張卡的功能分清楚：有些用來確認資料來源，有些用來確認判讀條件，有些才是觀察與比較。請想想哪些資訊必須在形成結論前先看。</div>` : ""}${state.checkedWrong.q09 ? `<div class="feedback bad">順序仍可調整；請重新整理讀取完成紀錄與比較證據的邏輯。</div>` : ""}</div>`;
}
function renderClassifyQuestion(qid) {
  const config = classifyQuestions[qid];
  const items = optionOrder(`${qid}_items`, config.items.map((item) => item.id)).map((id) => config.items.find((item) => item.id === id));
  const options = optionOrder(`${qid}_options`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id));
  return `<div class="question-card" data-question-id="${qid}"><h3>${config.prompt}</h3><p class="field-help">配對／分類題：請完成每一列，選後會直接顯示已選答案。依資料卡名稱判斷，不使用不完整的總覽圖。</p><div class="classify-list">${items.map((item) => { const selected = state.answers[qid]?.[item.id] || ""; return `<div class="classify-row"><strong>${item.label}</strong><label>選擇<select data-classify-question="${qid}" data-classify-item="${item.id}"><option value="">請選擇</option>${options.map((option) => `<option value="${option.id}" ${selected === option.id ? "selected" : ""}>${option.label}</option>`).join("")}</select></label><p class="selected-answer">${selected ? `已選：${config.options.find((option) => option.id === selected)?.label || ""}` : "尚未選擇"}</p></div>`; }).join("")}</div>${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}</div>`;
}
function renderBrief() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務簡報</p><h2>食物證據檢測任務</h2>
    <figure class="brief-scene nutrient-test-brief-scene bq-brief-scene-stage" data-briefing-scene-hook="${assets.briefingSceneHook}" data-ambient-background-hook="${assets.ambientBackgroundHook}" data-bq-brief-dual-role="true">
      <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="阿澤老師在食物證據檢測站說明任務" loading="eager">
      <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
      <figcaption><strong>未知樣品需要證據，不靠外觀猜測</strong><span>阿澤老師已準備完成的觀察紀錄與比較資料。你要判讀試劑目標、顏色線索、安全條件與對照組能支持什麼。</span></figcaption>
    </figure>
    <div class="mission-hud"><div><span>任務區</span><strong>生命補給實驗站</strong></div><div><span>重點</span><strong>檢測證據</strong></div><div><span>原則</span><strong>安全與比較</strong></div></div><div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div></div></div>`;
}
function renderScan() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的證據線索</h2><div class="owl-frame nutrient-test-prep-owl"><img src="${assets.owlPrep}" alt="養分檢測提醒貓頭鷹"></div><div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>不同資料卡只追蹤特定養分；有加熱線索先判斷安全；顏色變化要和比較組一起看；單一結果不能代表完整營養分析。</p></div><div class="card-grid"><div class="concept-card"><strong>檢測目標</strong><p>先辨認資料卡要追蹤的是澱粉、葡萄糖、蛋白質或脂質。</p></div><div class="concept-card"><strong>安全線索</strong><p>看到加熱與試管時，先注意護目鏡、試管口方向與燙傷風險。</p></div><div class="concept-card"><strong>比較基準</strong><p>未知樣品要和陽性、陰性或清水資料一起判讀。</p></div><div class="concept-card"><strong>證據範圍</strong><p>結果只支持特定養分是否可能存在，不替代完整分析。</p></div></div><div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div></div>`;
}
function renderCheckpoint1() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>試劑目標與顏色證據</h2><div class="question-grid">${renderClassifyQuestion("q01")}${["q02","q03","q04"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`; }
function renderCheckpoint2() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>樣品結果與證據範圍</h2><div class="question-grid">${["q05","q06","q07","q08"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`; }
function renderCheckpoint3() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>安全、對照與資料判讀</h2><div class="question-grid">${renderSequenceQuestion()}${renderMultiSelect("q10")}${["q11","q12","q13","q14"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`; }

function isCorrect(qid) {
  if (qid === "q09") return ensureSequence().join("|") === correctSequence.join("|");
  if (multiSelectQuestions[qid]) {
    const selected = [...(state.answers[qid] || [])].sort();
    const expected = [...multiSelectQuestions[qid].answers].sort();
    return JSON.stringify(selected) === JSON.stringify(expected);
  }
  if (classifyQuestions[qid]) return classifyQuestions[qid].items.every((item) => state.answers[qid]?.[item.id] === item.answer);
  return state.answers[qid] === questionById(qid).answer;
}
function isAnswered(qid) {
  if (qid === "q09") return Boolean(state.interactions.q09) && ensureSequence().length === correctSequence.length;
  if (multiSelectQuestions[qid]) return Boolean(state.interactions[qid]) && (state.answers[qid] || []).length > 0;
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
    state.session_error = "";
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
  const order = ensureSequence(); const index = order.indexOf(id); const next = index + dir;
  if (index < 0 || next < 0 || next >= order.length) return;
  [order[index], order[next]] = [order[next], order[index]];
  state.answers.q09_sequence = order; state.interactions.q09 = true; saveState(); render();
}
function dropSequence(targetId) {
  if (!draggedSequenceId || draggedSequenceId === targetId) return;
  const order = ensureSequence().filter((id) => id !== draggedSequenceId);
  order.splice(order.indexOf(targetId), 0, draggedSequenceId);
  state.answers.q09_sequence = order; state.interactions.q09 = true; draggedSequenceId = null; saveState(); render();
}

function attachQuestionEvents() {
  document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", async () => {
    const question = questionById(button.dataset.choice);
    state.answers[question.id] = button.dataset.value; state.interactions[question.id] = true;
    if (button.dataset.value !== question.answer && !await markHint(question.id)) return;
    saveState(); render();
  }));
  document.querySelectorAll("[data-multi]").forEach((button) => button.addEventListener("click", async () => {
    const qid = button.dataset.multi; const value = button.dataset.value; const selected = new Set(state.answers[qid] || []);
    selected.has(value) ? selected.delete(value) : selected.add(value);
    state.answers[qid] = [...selected]; state.interactions[qid] = true;
    if (!multiSelectQuestions[qid].answers.includes(value) && !await markHint(qid)) return;
    saveState(); render();
  }));
  document.querySelectorAll("[data-classify-question]").forEach((select) => select.addEventListener("change", async () => {
    const qid = select.dataset.classifyQuestion; const item = classifyQuestions[qid].items.find((candidate) => candidate.id === select.dataset.classifyItem);
    state.answers[qid] ||= {}; state.answers[qid][select.dataset.classifyItem] = select.value; state.interactions[qid] = true;
    if (select.value && item && select.value !== item.answer && !await markHint(qid)) return;
    saveState(); render();
  }));
  document.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => moveSequence(button.dataset.move, Number(button.dataset.dir))));
  document.querySelectorAll(".sortable-item").forEach((item) => { item.addEventListener("dragstart", () => { draggedSequenceId = item.dataset.sequenceId; }); item.addEventListener("dragover", (event) => event.preventDefault()); item.addEventListener("drop", (event) => { event.preventDefault(); dropSequence(item.dataset.sequenceId); }); });
  const checkButton = document.querySelector("#checkSection");
  if (checkButton) checkButton.addEventListener("click", async () => checkSection(checkButton.dataset.section));
}

function evaluateReflectionQuality(reflection) {
  return window.BioQuestReflectionQuality.evaluate(reflection, reflectionRules);
}
function questionConcept(qid) {
  if (qid === "q01") return "starch_iodine_test";
  if (qid === "q09") return "heating_safety";
  if (qid === "q10") return "heating_safety";
  return questionById(qid)?.concept || "unknown";
}
function questionMisconception(qid) {
  if (multiSelectQuestions[qid]) return multiSelectQuestions[qid].misconception;
  if (classifyQuestions[qid]) return classifyQuestions[qid].misconception;
  if (qid === "q09") return "unsafe_heating";
  return questionById(qid)?.misconception || "unknown";
}

function calculateResult() {
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
  const total = qids.length; const correctIds = qids.filter(isCorrect); const correct = correctIds.length;
  const hintUsed = Object.values(state.hints).filter(Boolean).length;
  const correctWithoutHint = correctIds.filter((qid) => !state.hints[qid]).length;
  const correctedAfterHint = correctIds.filter((qid) => state.hints[qid]).length;
  const directExp = Math.round(DIRECT_EXP_POOL * (correctWithoutHint / total));
  const revisionExp = Math.round(REVISION_EXP_POOL * (correctedAfterHint / total));
  const reflectionEval = evaluateReflectionQuality(state.answers.reflection || {});
  const accuracy = correct / total;
  const masteryExp = accuracy === 1 && hintUsed === 0 ? 140 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const previousAccuracy = previousBestAccuracy(); const completionExp = allRequiredAnswered() ? 100 : 0;
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, reflectionEval.question_exp)));
  const baseExp = Math.min(reflectionLedgerCap, completionExp + directExp + revisionExp + reflectionEval.question_exp + masteryExp);
  const retryCandidate = state.attempt_type === "retry" && previousAccuracy !== null && accuracy > previousAccuracy ? Math.min(60, Math.round((accuracy - previousAccuracy) * 100)) : 0;
  const retryExp = Math.min(retryCandidate, Math.max(0, reflectionLedgerCap - baseExp));
  const attemptTotalExp = Math.min(reflectionLedgerCap, baseExp + retryExp); const best = previousBestCredited(); const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(best, attemptTotalExp));
  const sectionStats = [sectionStat("試劑目標與顏色證據", sectionMap.checkpoint1), sectionStat("樣品結果與證據範圍", sectionMap.checkpoint2), sectionStat("安全、對照與資料判讀", sectionMap.checkpoint3)];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? ["nutrient_test_entry"] : [];
  if (["q01","q02","q03","q04"].every(isCorrect)) earned.push("reagent_nutrient_matcher");
  if (["q02","q03","q04","q05"].every(isCorrect)) earned.push("color_change_interpreter");
  if (["q09","q10","q14"].every(isCorrect)) earned.push("heating_safety_keeper");
  if (["q11","q12"].every(isCorrect)) earned.push("control_group_designer");
  if (["q06","q07","q13"].every(isCorrect)) earned.push("test_data_evidence_reader");
  if (["q05","q06","q07","q08"].every(isCorrect)) earned.push("sample_result_classifier");
  if (qids.some((qid) => isCorrect(qid) && state.hints[qid])) earned.push("nutrient_test_misconception_reviser");
  if (accuracy === 1 && hintUsed === 0) earned.push("nutrient_test_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("nutrient_test_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_nutrient_test");
  return { unit_exp_cap: UNIT_EXP_CAP, completion_exp: completionExp, concept_exp: directExp, revision_exp: revisionExp, question_exp: reflectionEval.question_exp, question_exp_candidate: reflectionEval.question_exp_candidate ?? reflectionEval.question_exp, mastery_exp: masteryExp, retry_exp: retryExp, attempt_total_exp: attemptTotalExp, unit_credited_exp: unitCreditedExp, credited_delta: Math.max(0, unitCreditedExp - best), correct, total, accuracy, hint_used: hintUsed, correct_without_hint: correctWithoutHint, corrected_after_hint: correctedAfterHint, previous_accuracy: previousAccuracy, accuracy_delta: previousAccuracy === null ? null : accuracy - previousAccuracy, section_stats: sectionStats, misconceptions, concept_mastery_tags_json: conceptMastery(qids), badges: [...new Set(earned)], cumulative_badges_candidate: cumulativeBadgeIds(earned), no_hint_perfect: accuracy === 1 && hintUsed === 0, all_required_answered: allRequiredAnswered(), teacher_attention_needed: Number(state.answers.reflection.confidence_score || 3) <= 2 || accuracy < 0.6 || reflectionEval.reflection_review_status === "pending_review" || misconceptions.length >= 3, ...reflectionEval };
}

function misconceptionText(tag) {
  const map = {
    iodine_benedict_confusion: "建議再整理試劑目標：碘液主要連到澱粉，本氏液完成加熱觀察主要連到葡萄糖。",
    benedict_no_heat: "建議再確認本氏液的資料判讀條件：完成安全加熱觀察後，才能連到葡萄糖的顏色線索。",
    color_all_nutrients: "建議再把顏色現象放回該檢測目標，不把單一結果擴大成所有養分。",
    no_change_no_nutrients: "建議再確認未變色只代表該檢測未支持目標養分，不代表樣品沒有所有養分。",
    control_unnecessary: "建議再理解對照組：比較基準能幫助判讀未知樣品，不是多餘步驟。",
    unsafe_heating: "建議再留意加熱與試管安全：護目鏡、試管口方向與避免碰觸高溫器材。",
    lipid_overgeneralization: "建議再確認脂質證據要看指定染色或油斑線索，不能只靠外觀猜測。",
    protein_method_confusion: "建議再整理蛋白質檢測的紫色或紫紅色線索，避免和其他資料卡混淆。"
  };
  return map[tag] || "建議再把檢測目標、比較基準、安全條件與證據範圍連在一起檢查。";
}

function renderReview() {
  const result = calculateResult(); const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>食物證據檢測回饋</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理檢測證據的主要線索。</p>"}</div><div class="story-panel"><strong>建議再閱讀理解</strong>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>課堂提問方向</strong><p>碘液與本氏液的檢測目標、顏色現象支持的範圍、加熱安全、對照組和未變色的解讀。</p></div></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}

function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；只複製方向、無關玩笑或敷衍句不會取得高 EXP。具體且與試劑、顏色變化、加熱安全、對照組或證據判讀相關的疑問，才可能取得回報 EXP，正式分數由後台重算。</p></div><div class="form-grid"><label>我最能掌握的一項檢測證據概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定試劑目標、顏色判讀、安全或對照組中的哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個希望老師課堂解釋的方向，並用自己的話補充<textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div></div>`;
}

function buildBackendPayload(attempt) {
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
  const answerFor = (qid) => qid === "q09" ? state.answers.q09_sequence : state.answers[qid];
  const correctFor = (qid) => qid === "q09" ? correctSequence : multiSelectQuestions[qid] ? multiSelectQuestions[qid].answers : classifyQuestions[qid] ? Object.fromEntries(classifyQuestions[qid].items.map((item) => [item.id, item.answer])) : questionById(qid).answer;
  return {
    attempt_id: attempt.attempt_id, student_id: attempt.student.student_id, student_name: attempt.student.student_name, class_name: attempt.student.class_name, seat_no: attempt.student.seat_no, unit_id: mission.unit_id, unit_title: mission.unit_title,
    attempt_type: attempt.attempt_type, attempt_type_candidate: attempt.attempt_type_candidate, attempt_no_candidate: attempt.attempt_no, attempt_session_id: attempt.attempt_session_id, attempt_session_token: attempt.attempt_session_token, question_version: attempt.question_version, started_from_login: attempt.started_from_login, previous_attempt_id: attempt.previous_attempt_id, retry_validation_status: attempt.retry_validation_status,
    completion_status: attempt.completion_status, required_answer_count: attempt.required_answer_count, answered_required_count: attempt.answered_required_count, all_required_answered: attempt.all_required_answered, started_at: attempt.started_at, submitted_at: attempt.submitted_at,
    total_questions: attempt.total, correct: attempt.correct, accuracy: attempt.accuracy, hints_used: attempt.hint_used, correct_without_hint: attempt.correct_without_hint, corrected_after_hint: attempt.corrected_after_hint, completion_exp: attempt.completion_exp, concept_exp: attempt.concept_exp, revision_exp: attempt.revision_exp, question_exp: attempt.question_exp, mastery_exp: attempt.mastery_exp, retry_exp: attempt.retry_exp, attempt_total_exp: attempt.attempt_total_exp, unit_credited_exp: attempt.unit_credited_exp, credited_delta: attempt.credited_delta,
    confidence_score: attempt.confidence_score, reflection_quality: attempt.reflection_quality, reflection_quality_candidate: attempt.reflection_quality_candidate, reflection_exp_reason: attempt.reflection_exp_reason, reflection_review_status: attempt.reflection_review_status, reflection_original_text: attempt.reflection_original_text, reflection_normalized_text: attempt.reflection_normalized_text, reflection_similarity_score: attempt.reflection_similarity_score, reflection_similarity_source: attempt.reflection_similarity_source, reflection_copied_direction_flag: attempt.reflection_copied_direction_flag, reflection_irrelevant_flag: attempt.reflection_irrelevant_flag, reflection_low_effort_flag: attempt.reflection_low_effort_flag, reflection_examples_checked: attempt.reflection_examples_checked, reflection_frontend_only: true, teacher_attention_needed: attempt.teacher_attention_needed, student_question: attempt.student_question,
    badges_json: JSON.stringify(attempt.badges), existing_badges_json: JSON.stringify(cumulativeBadgeIds()), cumulative_badges_candidate_json: JSON.stringify(attempt.cumulative_badges_candidate),
    reagent_target_match_score: scoreForConcept(attempt, "starch_iodine_test", "glucose_benedict_test", "protein_biuret_test"), color_change_evidence_score: scoreForConcept(attempt, "starch_iodine_test", "glucose_benedict_test", "protein_biuret_test", "lipid_test"), heating_safety_score: scoreForConcept(attempt, "heating_safety"), control_group_score: scoreForConcept(attempt, "control_group"), evidence_limit_score: scoreForConcept(attempt, "evidence_limit"), sample_result_classification_score: Math.round((["q05","q06","q07","q08"].filter(isCorrect).length / 4) * 100),
    misconceptions_json: JSON.stringify(attempt.misconceptions), raw_answers_json: JSON.stringify(attempt.raw_answers), badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: qids.map((qid) => {
      const answer = answerFor(qid);
      const questionType = qid === "q09" ? "sequence" : multiSelectQuestions[qid] ? "set" : classifyQuestions[qid] ? "mapping" : "choice";
      const checkpointId = sectionMap.checkpoint1.includes(qid) ? "checkpoint1" : sectionMap.checkpoint2.includes(qid) ? "checkpoint2" : "checkpoint3";
      return {
        student_id: attempt.student.student_id,
        student_name: attempt.student.student_name,
        unit_id: mission.unit_id,
        unit_title: mission.unit_title,
        checkpoint_id: checkpointId,
        question_id: `${mission.unit_id}_${qid}`,
        question_type: questionType,
        concept_id: questionConcept(qid),
        skill_tag: questionConcept(qid),
        is_correct: isCorrect(qid),
        used_hint: Boolean(state.hints[qid]),
        hint_used: Boolean(state.hints[qid]),
        attempt_answer: JSON.stringify(answer),
        answer_json: JSON.stringify(answer),
        correct_answer: JSON.stringify(correctFor(qid)),
        misconception_tag: isCorrect(qid) ? "" : questionMisconception(qid),
        exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept",
        exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total)
      };
    })
  };
}

function renderAchievements() {
  const status = submissionStatus();
  const currentBadges = state.submitted_at ? (state.result || calculateResult()).badges : [];
  const litIds = status === "verified" ? cumulativeBadgeIds(currentBadges) : currentBadges;
  const scoreCopy = status === "verified"
    ? { a: ["累積徽章", litIds.length], b: ["累積 EXP", state.cumulative_total_exp || 0], c: ["已完成站數", state.completed_unit_count || 0] }
    : status === "guest"
      ? { a: ["本單元候選徽章", currentBadges.length], b: ["本次預估 EXP", Math.min((state.result || calculateResult()).attempt_total_exp || 0, UNIT_EXP_CAP)], c: ["正式累積狀態", "guest 不列入"] }
      : { a: ["本單元候選徽章", currentBadges.length], b: ["本次預估 EXP", Math.min((state.result || calculateResult()).attempt_total_exp || 0, UNIT_EXP_CAP)], c: ["正式累積狀態", "待後台確認"] };
  const note = status === "verified"
    ? "未取得徽章維持灰階，取得後亮燈；同一徽章在累積收藏只計一次。"
    : status === "guest"
      ? "guest 測試只顯示本次候選徽章，不列入正式累積。"
      : "本次候選徽章待後台確認後，才會寫入正式累積。";
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">成就亮燈</p><h2>食物證據檢測徽章牆</h2><div class="score-grid"><div class="score-box"><span>${scoreCopy.a[0]}</span><strong>${scoreCopy.a[1]}</strong></div><div class="score-box"><span>${scoreCopy.b[0]}</span><strong>${scoreCopy.b[1]}</strong></div><div class="score-box"><span>${scoreCopy.c[0]}</span><strong>${scoreCopy.c[1]}</strong></div></div><div class="badge-grid">${badges.map((badge) => { const lit = litIds.includes(badge.id); const gold = badge.id === "nutrient_test_flawless"; return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}"><img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}"><strong>${badge.name}</strong><p class="muted">${badge.condition}</p></div>`; }).join("")}</div><p class="muted">${note}</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
}

function renderRules() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務規則</p><h2>EXP、提示與再挑戰</h2><div class="card-grid"><div class="story-panel"><strong>單元上限</strong><p>本單元最高認列 500 EXP；零提示全對是最高表現路徑。</p></div><div class="story-panel"><strong>完成條件</strong><p>回答完所有必答題即可提交，不要求先全對。</p></div><div class="story-panel"><strong>提示後修正</strong><p>每題第一次需要調整時顯示一次概念提示；修正 EXP 低於直接答對。</p></div><div class="story-panel"><strong>再挑戰</strong><p>提交後答案鎖定；須重新登入並完整作答才算再挑戰。</p></div></div><div class="actions"><button class="primary" id="rulesBack">回到任務</button></div></div></div>`;
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
  if (attempt.student?.is_guest || state.student?.is_guest || state.backend_status === "local_guest") {
    return { ok: true, verification_status: "local_guest" };
  }
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
      if (state.student?.is_guest || state.backend_status === "local_guest") {
        state.backend_status = "guest_local";
        attempt = { ...attempt, ...state.result, backend_status: state.backend_status };
      } else {
        const response = await submitAttemptToBackend(attempt);
        state.backend_status = response.verification_status === "server_verified" ? "submitted_verified" : "pending_verification";
        if (response.verified_attempt) state.result = { ...state.result, ...response.verified_attempt };
        applyBackendProgress(response.student_progress || response.progress || {});
        attempt = { ...attempt, ...state.result, backend_status: state.backend_status, backend_attempt_id: response.attempt_id || attempt.attempt_id };
      }
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
    state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + (state.student?.is_guest ? 0 : 1);
    unlock("result", "achievements");
    saveState();
    setScreen("result");
  });
}
function submissionStatus() {
  if (state.student?.is_guest || state.backend_status === "guest_local" || state.backend_status === "local_guest") return "guest";
  if (state.submitted_at && state.backend_status !== "submitted_verified") return "pending";
  return "verified";
}
function resultStatusNotice(result) {
  const status = submissionStatus();
  const attemptExp = Math.min(result.attempt_total_exp || 0, UNIT_EXP_CAP);
  if (status === "guest") return `<div class="feedback warn">guest 測試：本次預估 ${attemptExp}/${UNIT_EXP_CAP} EXP，不列入正式累積。</div>`;
  if (status === "pending") {
    const detail = state.backend_status === "pending_local" ? "後台暫時無法寫入，本次提交已保留在本機待補送佇列。" : "本次資料正在等待後台確認。";
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
  window.BioQuestCharacterLayout?.enhance?.({ force: true });
  screen.dataset.bioquestScreen = state.screen;
  attachEvents();
}

render();
