const roster = {
  guest: {
    student_id: "guest",
    class_name: "測試",
    seat_no: "00",
    student_name: "老師測試帳號",
    profile_gender: "male",
    current_title_id: "trainee_investigator",
    current_title: "見習調查員",
    title_avatar_path: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
    is_guest: true
  }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260716-cell-observation-achievement-overview-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_cell_observation_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "cell_observation",
  unit_title: "細胞的觀察",
  mission_title: "顯微視野偵查任務",
  mission_area: "微觀研究站"
};

const assets = {
  owlPrep: "assets/owl-cell-observation-prep-reminder.webp",
  briefingSceneHook: "assets/bg-cell-observation-briefing-azhe-wide.webp",
  ambientBackgroundHook: "assets/bg-cell-observation-entry-wide.webp",
  slidePreparation: "assets/cell-observation-slide-preparation-cards.webp",
  lowHighStrategy: "assets/cell-observation-low-high-power-strategy.webp",
  stainingComparison: "assets/cell-observation-staining-before-after.webp",
  scopeViews: {
    onion: "assets/cell-observation-onion-epidermis-view.webp",
    mouth: "assets/cell-observation-mouth-epithelial-view.webp",
    leaf: "assets/cell-observation-leaf-lower-epidermis-view.webp",
    bubble: "assets/cell-observation-bubble-artifact-view.webp"
  }
};

const badgeAsset = (id) => `../shared-assets/badges/cell_observation/badge-cell_observation-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["玻片", "蓋玻片", "氣泡", "低倍率", "高倍率", "洋蔥表皮", "口腔皮膜", "葉片下表皮", "保衛細胞", "氣孔", "葉綠體", "染色", "細胞核", "顯微", "動物細胞", "植物細胞", "視野", "細胞壁"],
  irrelevantTerms: ["老師好帥", "帥", "午餐", "下課", "遊戲", "天氣", "好笑"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["染色前後差異", "氣泡與細胞構造判讀", "洋蔥表皮沒有明顯葉綠體的原因", "保衛細胞與氣孔功能連結", "低倍率與高倍率切換時機", "口腔皮膜細胞與植物表皮細胞外形差異"]
};
const badges = [
  { id: "cell_observation_entry", name: "顯微偵查入門徽章", condition: "完成顯微視野偵查任務。" },
  { id: "slide_preparation_sequencer", name: "玻片流程排序徽章", condition: "玻片製作與減少氣泡干擾題組達 85% 以上。" },
  { id: "low_high_power_strategist", name: "低高倍觀察策略徽章", condition: "低倍率尋找、高倍率觀察與調焦策略穩定。" },
  { id: "field_sample_identifier", name: "視野樣本辨識徽章", condition: "能判讀洋蔥表皮、口腔皮膜與葉片下表皮線索。" },
  { id: "guard_cell_stoma_spotter", name: "保衛細胞氣孔徽章", condition: "能辨認保衛細胞、氣孔與葉綠體觀察線索。" },
  { id: "staining_purpose_explainer", name: "染色目的理解徽章", condition: "能說明染色提高構造對比。" },
  { id: "artifact_detector", name: "氣泡雜質辨識徽章", condition: "能分辨氣泡、髒污與細胞構造。" },
  { id: "cell_observation_flawless", name: "顯微視野零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "cell_observation_reflection_reporter", name: "高品質觀察回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_cell_observation", name: "再探顯微視野進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const sequenceSteps = [
  { id: "water", label: "滴水" },
  { id: "sample", label: "將薄表皮展平於水滴中" },
  { id: "cover", label: "斜放蓋玻片" },
  { id: "paper", label: "用濾紙吸去多餘水分" }
];
const correctSequence = ["water", "sample", "cover", "paper"];

const questions = [
  {
    id: "q02",
    section: "checkpoint1",
    concept: "slide_preparation",
    answer: "angle",
    prompt: "蓋上蓋玻片時，哪一種操作最能減少氣泡干擾？",
    hint: "想想空氣若被突然壓在蓋玻片下，視野中可能會出現什麼干擾。",
    misconception: "bubble_as_cell",
    options: [
      { id: "angle", text: "讓蓋玻片斜放後慢慢蓋下。" },
      { id: "press", text: "直接從正上方快速壓下。" },
      { id: "dry", text: "先把標本吹乾再蓋。" },
      { id: "no_touch", text: "蓋玻片不用接觸水滴。" }
    ]
  },
  {
    id: "q03",
    section: "checkpoint1",
    concept: "low_high_power_observation",
    answer: "wide_view",
    prompt: "顯微鏡觀察細胞時，為什麼通常先用低倍率物鏡？",
    hint: "先想低倍率的視野範圍較大還是較小。",
    misconception: "high_power_first",
    options: [
      { id: "wide_view", text: "較容易找到標本與細胞位置。" },
      { id: "detail_first", text: "可以直接看到最細的構造。" },
      { id: "make_big", text: "可以讓細胞真正變大。" },
      { id: "skip_focus", text: "可以省略調焦。" }
    ]
  },
  {
    id: "q04",
    section: "checkpoint1",
    concept: "low_high_power_observation",
    answer: "fine_focus",
    prompt: "已在低倍率下將要觀察的洋蔥表皮細胞移到視野中央，想看更清楚的細胞核，下一步較合理的是什麼？",
    hint: "切換倍率前，先確認想看的細胞是否留在視野中央。",
    misconception: "high_power_first",
    options: [
      { id: "fine_focus", text: "換高倍率並細調焦。" },
      { id: "lift_slide", text: "把載玻片拿起來靠近眼睛。" },
      { id: "rough_focus", text: "大幅轉動粗調節輪。" },
      { id: "turn_off", text: "把光源關掉。" }
    ]
  },
  {
    id: "q05",
    section: "checkpoint2",
    concept: "onion_epidermis",
    answer: "onion",
    prompt: "某視野中可見許多排列整齊、像格子般的細胞外框，染色後有較明顯的深色圓形構造。這較符合哪種觀察材料？",
    hint: "觀察線索是排列規則、外框明顯，以及染色後可見較清楚的內部構造。",
    misconception: "observation_without_evidence",
    image: assets.scopeViews.onion,
    imageAlt: "未標註的洋蔥表皮細胞顯微視野",
    options: [
      { id: "onion", text: "洋蔥表皮細胞" },
      { id: "mouth", text: "口腔皮膜細胞" },
      { id: "bubble", text: "氣泡" },
      { id: "sand", text: "砂粒" }
    ]
  },
  {
    id: "q06",
    section: "checkpoint2",
    concept: "onion_epidermis",
    answer: "wall",
    prompt: "在洋蔥表皮細胞視野圖中，最適合標記為細胞壁的線索是什麼？",
    hint: "先找讓細胞呈現整齊邊界的線索，不要只看顏色深淺。",
    misconception: "plant_cell_wall_identification",
    image: assets.scopeViews.onion,
    imageAlt: "未標註的洋蔥表皮細胞顯微視野，需依格狀外框等線索判讀",
    options: [
      { id: "wall", text: "細胞間清楚的格狀外框" },
      { id: "nucleus", text: "細胞中央深色圓點" },
      { id: "edge", text: "視野邊緣的黑圈" },
      { id: "dust", text: "不規則漂浮顆粒" }
    ]
  },
  {
    id: "q07",
    section: "checkpoint2",
    concept: "mouth_epithelial_cell",
    answer: "mouth",
    prompt: "某視野中細胞形狀較不規則，沒有明顯格狀外框，染色後可見細胞核。這較符合哪種觀察材料？",
    hint: "觀察線索是沒有整齊格狀外框，且形狀較柔和、不規則。",
    misconception: "animal_cell_has_cell_wall",
    image: assets.scopeViews.mouth,
    imageAlt: "未標註的口腔皮膜細胞顯微視野",
    options: [
      { id: "mouth", text: "口腔皮膜細胞" },
      { id: "onion", text: "洋蔥表皮細胞" },
      { id: "leaf", text: "葉片下表皮保衛細胞" },
      { id: "wall_space", text: "細胞壁空腔" }
    ]
  },
  {
    id: "q08",
    section: "checkpoint2",
    concept: "mouth_epithelial_cell",
    answer: "animal_nucleus",
    prompt: "觀察口腔皮膜細胞時，哪一個說法較合理？",
    hint: "想想口腔皮膜來自身體哪一類生物組織，以及染色常讓哪個構造更容易看見。",
    misconception: "animal_cell_has_cell_wall",
    image: assets.scopeViews.mouth,
    imageAlt: "未標註的口腔皮膜細胞染色顯微視野",
    options: [
      { id: "animal_nucleus", text: "可觀察動物細胞，染色後細胞核較明顯。" },
      { id: "cell_wall", text: "可觀察細胞壁形成的規則格子。" },
      { id: "chloroplast", text: "可直接看到葉綠體進行光合作用。" },
      { id: "naked_eye", text: "不需要顯微鏡即可看清細胞。" }
    ]
  },
  {
    id: "q09",
    section: "checkpoint2",
    concept: "leaf_lower_epidermis",
    answer: "stoma",
    prompt: "葉片下表皮視野中，哪一個線索最適合判斷為氣孔？",
    hint: "先比較一般表皮細胞與成對特殊細胞周圍的形狀差異。",
    misconception: "all_plant_cells_have_chloroplast_in_view",
    image: assets.scopeViews.leaf,
    imageAlt: "未標註的葉片下表皮顯微視野，需依保衛細胞與開口線索判讀",
    options: [
      { id: "stoma", text: "兩個保衛細胞之間的開口" },
      { id: "grid", text: "整片規則格狀外框" },
      { id: "vacuole", text: "單一大型空泡" },
      { id: "scope_edge", text: "視野邊緣的黑色圓圈" }
    ]
  },
  {
    id: "q10",
    section: "checkpoint2",
    concept: "leaf_lower_epidermis",
    answer: "guard",
    prompt: "在葉片下表皮觀察中，哪種細胞最可能含有葉綠體？",
    hint: "想想哪一種細胞和氣孔開閉有關，視野中常可見綠色小顆粒。",
    misconception: "all_plant_cells_have_chloroplast_in_view",
    image: assets.scopeViews.leaf,
    imageAlt: "未標註的葉片下表皮顯微視野",
    options: [
      { id: "guard", text: "保衛細胞" },
      { id: "onion_skin", text: "洋蔥鱗葉表皮細胞" },
      { id: "mouth_cell", text: "口腔皮膜細胞" },
      { id: "bubble", text: "氣泡" }
    ]
  },
  {
    id: "q11",
    section: "checkpoint3",
    concept: "staining_purpose",
    answer: "contrast",
    prompt: "在本次洋蔥表皮或口腔皮膜的觀察中，使用適當染劑的主要目的較可能是什麼？",
    hint: "染色前有些構造透明不明顯，染色後哪類構造更容易被看見？",
    misconception: "stain_is_decoration",
    image: assets.stainingComparison,
    imageAlt: "染色前後的未標註對照圖",
    options: [
      { id: "contrast", text: "增加對比，使細胞核等構造較容易觀察。" },
      { id: "plant", text: "讓細胞變成植物細胞。" },
      { id: "alive", text: "讓細胞活得更久。" },
      { id: "erase_wall", text: "讓細胞壁消失。" }
    ]
  },
  {
    id: "q12",
    section: "checkpoint3",
    concept: "staining_purpose",
    answer: "contrast_fix",
    prompt: "有同學說：「染色只是讓標本比較漂亮，和觀察沒有關係。」哪個修正較合理？",
    hint: "回想染色前後，視野中哪類構造的清楚程度可能改變。",
    misconception: "stain_is_decoration",
    image: assets.stainingComparison,
    imageAlt: "染色前後的未標註對照圖",
    options: [
      { id: "contrast_fix", text: "染色可提高構造對比，讓某些構造更容易觀察。" },
      { id: "chloroplasts", text: "染色會讓所有細胞都長出葉綠體。" },
      { id: "no_scope", text: "染色後不用顯微鏡也能看見細胞。" },
      { id: "change_type", text: "染色會把動物細胞變成植物細胞。" }
    ]
  },
  {
    id: "q13",
    section: "checkpoint3",
    concept: "field_interpretation",
    answer: "bubble",
    prompt: "顯微視野中出現一個近圓形、邊緣明亮、沒有細胞排列脈絡的圓環狀影像。它最可能需要先被懷疑是什麼？",
    hint: "先不要只看「圓形」，要觀察是否有細胞內部構造或排列脈絡。",
    misconception: "bubble_as_cell",
    image: assets.scopeViews.bubble,
    imageAlt: "未標註的顯微視野干擾圖",
    options: [
      { id: "bubble", text: "氣泡" },
      { id: "nucleus", text: "細胞核" },
      { id: "guard", text: "保衛細胞" },
      { id: "chloroplast", text: "葉綠體" }
    ]
  }
];

const classifyItems = [
  { id: "grid_wall", label: "規則格狀外框", answer: "plant", misconception: "observation_without_evidence" },
  { id: "irregular_no_wall", label: "形狀較不規則且無明顯細胞壁", answer: "animal", misconception: "animal_cell_has_cell_wall" },
  { id: "guard_stoma", label: "保衛細胞與氣孔", answer: "plant", misconception: "all_plant_cells_have_chloroplast_in_view" },
  { id: "mouth_sample", label: "口腔刮取樣本", answer: "animal", misconception: "animal_cell_has_cell_wall" }
];

const sectionMap = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08", "q09", "q10"],
  checkpoint3: ["q11", "q12", "q13", "q14"]
};

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  attempt_session_id: "",
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
    q14: {},
    reflection: {}
  },
  hints: {},
  checkedWrong: {},
  interactions: {},
  optionOrders: {},
  activeScope: "onion",
  activeHotspot: "wall",
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
  const verified = studentAttempts(state.student.student_id)
    .filter((attempt) => !attempt.student?.is_guest && attempt.backend_status === "submitted");
  return Math.max(0, ...verified.map((attempt) => Number(attempt.unit_credited_exp || 0)));
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
function latestLocalAttempt() {
  if (!state.student) return null;
  return studentAttempts(state.student.student_id)
    .filter((attempt) => attempt.completion_status === "complete" && attempt.submitted_at)
    .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)))[0] || null;
}
function previousAttemptId() { return latestLocalAttempt()?.attempt_id || state.remote_previous_attempt_id || ""; }
function cumulativeBadgeIds(current = []) {
  if (!state.student) return [...new Set(current)];
  const local = studentAttempts(state.student.student_id)
    .filter((attempt) => !attempt.student?.is_guest && attempt.backend_status === "submitted")
    .flatMap((attempt) => parseArray(attempt.badges));
  return [...new Set([...(state.cumulative_badges || []), ...local, ...current])];
}
function isProgressPending() {
  return Boolean(state.submitted_at && state.backend_status !== "submitted");
}
function applyBackendProgress(progress = {}) {
  state.cumulative_badges = parseArray(progress.badges_json || progress.badges || state.cumulative_badges);
  state.cumulative_total_exp = Number(progress.total_exp ?? progress.total_credited_exp ?? state.cumulative_total_exp ?? 0);
  state.completed_unit_count = Number(progress.completed_unit_count ?? state.completed_unit_count ?? 0);
  if (state.student) {
    state.student.progress = { ...(state.student.progress || {}), ...progress };
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id || "";
    state.student.current_title = progress.current_title || state.student.current_title || "";
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path || "";
  }
}
function pendingQueue() {
  try { return JSON.parse(localStorage.getItem(pendingQueueKey)) || []; } catch { return []; }
}
function savePending(payload) {
  const queue = pendingQueue();
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

function owlPanel(image = assets.owlPrep, alt = "貓頭鷹助理") {
  return `<div class="owl-frame"><img src="${image}" alt="${alt}"></div>`;
}
function titleAvatarFallbackPath() {
  const gender = state.student?.profile_gender === "female" ? "female" : "male";
  return `../shared-assets/title-avatars/title-01-trainee_investigator-${gender}.webp`;
}
function titleAvatarPath() {
  const student = state.student || {};
  const gender = student.profile_gender === "female" ? "female" : "male";
  const titleId = student.current_title_id || student.progress?.current_title_id || "trainee_investigator";
  const level = window.BioQuestTitleProgress?.levels?.find((item) => item.id === titleId);
  const fallback = titleAvatarFallbackPath();
  const path = student.title_avatar_path || student.progress?.title_avatar_path || (level ? `../shared-assets/title-avatars/title-${level.order}-${level.id}-${gender}.webp` : fallback);
  if (/^(https?:|data:|\/|\.\/|\.\.\/)/.test(path) || path.startsWith("assets/")) return path;
  if (path.startsWith("shared-assets/")) return `../${path}`;
  return fallback;
}
function currentTitleName() {
  const student = state.student || {};
  if (student.current_title || student.progress?.current_title) return student.current_title || student.progress.current_title;
  const titleId = student.current_title_id || student.progress?.current_title_id;
  const explicit = window.BioQuestTitleProgress?.levels?.find((item) => item.id === titleId);
  if (explicit) return explicit.title;
  return window.BioQuestTitleProgress?.getTitleForExp(state.cumulative_total_exp || 0)?.current || "見習調查員";
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return `<div class="wide-layout"><div class="panel hero-panel">
    <p class="eyebrow">生命祕境 BioQuest</p>
    <h2 class="hero-title">任務登入</h2>
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>cell_observation</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
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
function normalizeBackendStudent(data, id) {
  if (!data?.ok) return null;
  const source = data.student || data;
  return {
    student_id: source.student_id || id,
    class_name: source.class_name || source.class || "未設定",
    seat_no: source.seat_no || source.seat || "00",
    student_name: source.student_name || source.name || "未設定",
    profile_gender: source.profile_gender || source.gender || "",
    current_title_id: source.current_title_id || data.progress?.current_title_id || data.student_progress?.current_title_id || "",
    current_title: source.current_title || data.progress?.current_title || data.student_progress?.current_title || "",
    title_avatar_path: source.title_avatar_path || data.progress?.title_avatar_path || data.student_progress?.title_avatar_path || "",
    progress: data.student_progress || data.progress || source.progress || {},
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
  let student = null;
  let completed = 0;
  let remoteProgress = {};
  let remoteAttemptStatus = {};
  try {
    const data = await fetchStudentStatus(id);
    student = normalizeBackendStudent(data, id);
    if (!student) {
      if (id === "guest") {
        student = roster.guest;
        completed = studentAttempts(student.student_id).length;
        message.innerHTML = `<span class="pill warn">guest 已切換為本機測試模式，不列入正式統計。</span>`;
      } else {
        message.innerHTML = `<span class="pill warn">${data?.message || "查無此學號，請重新輸入。"}</span>`;
        return;
      }
    }
    remoteProgress = data.progress || data.student_progress || {};
    remoteAttemptStatus = data.attempt_status || {};
    completed = Number(remoteAttemptStatus.completed_attempt_count ?? data.completed_attempts ?? 0);
  } catch {
    if (id !== "guest") {
      message.innerHTML = `<span class="pill warn">後台目前無法連線，尚未登入。請檢查網路後重試或通知老師。</span>`;
      return;
    }
    student = roster.guest;
    completed = studentAttempts(student.student_id).length;
    message.innerHTML = `<span class="pill warn">guest 已切換為本機測試模式，不列入正式統計。</span>`;
  }
  state = clone(defaultState);
  state.student = { ...student, progress: { ...(student.progress || {}), ...remoteProgress } };
  state.remote_completed_attempts = completed;
  state.attempt_type = completed > 0 ? "retry" : "first";
  state.started_at = new Date().toISOString();
  state.attempt_session_id = `${mission.unit_id}_${student.student_id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  state.remote_previous_attempt_id = remoteAttemptStatus.previous_attempt_id || remoteAttemptStatus.latest_attempt_id || remoteProgress.latest_attempt_id || "";
  const remoteAccuracy = remoteAttemptStatus.previous_accuracy ?? remoteAttemptStatus.best_accuracy;
  state.remote_previous_accuracy = remoteAccuracy === null || remoteAccuracy === undefined || remoteAccuracy === "" ? null : Number.isFinite(Number(remoteAccuracy)) ? Number(remoteAccuracy) : null;
  state.cumulative_badges = parseArray(remoteProgress.badges_json || remoteProgress.badges);
  state.cumulative_total_exp = Number(remoteProgress.total_exp ?? remoteProgress.total_credited_exp ?? 0);
  state.completed_unit_count = Number(remoteProgress.completed_unit_count || 0);
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

function renderBrief() {
  const studentName = state.student?.student_name || "學生";
  return `<div class="wide-layout">
    <div class="panel">
      <p class="eyebrow">任務簡報</p>
      <h2>顯微視野偵查任務</h2>
      <figure class="brief-scene" data-briefing-scene-hook="${assets.briefingSceneHook}" data-ambient-background-hook="${assets.ambientBackgroundHook}">
        <picture class="brief-scene-media">
          <img src="${assets.briefingSceneHook}" alt="阿澤老師在顯微觀察研究站簡報細胞視野任務">
        </picture>
        <div class="title-avatar-brief" data-student-title-card="true">
          <img src="${titleAvatarPath()}" alt="${currentTitleName()}稱號角色" onerror="this.onerror=null;this.src='${titleAvatarFallbackPath()}';">
          <div><span>登入身份</span><strong>${studentName}</strong><p>目前稱號：${currentTitleName()}</p></div>
        </div>
        <div class="scene-copy">
          <h3>微觀研究站收到三組視野</h3>
          <p>洋蔥表皮、口腔皮膜與葉片下表皮影像混在一起。請用觀察線索整理製片流程、判讀視野，並修正常見迷思。</p>
        </div>
      </figure>
      <div class="mission-hud"><div><span>任務區</span><strong>微觀研究站</strong></div><div><span>重點</span><strong>視野判讀</strong></div><div><span>排序題</span><strong>拖曳 + 上下移</strong></div></div>
      <div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div>
    </div>
  </div>`;
}
function renderScan() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的觀察線索</h2>
    <div class="prep-owl-reminder">${owlPanel(assets.owlPrep, "顯微觀察任務提醒貓頭鷹")}<div><span>貓頭鷹助理</span><strong>先聽完叮嚀再進入檢核</strong><p>先用線索判讀，不要只背材料名稱。觀察時會用到製片、倍率、染色與樣本特徵。</p></div></div>
    <div class="card-grid">
      <div class="concept-card"><strong>製片</strong><p>材料要薄且平整，蓋玻片斜放可減少氣泡。</p></div>
      <div class="concept-card"><strong>倍率</strong><p>先低倍找位置，再高倍觀察細節。</p></div>
      <div class="concept-card"><strong>染色</strong><p>染色提高對比，常讓細胞核較容易觀察。</p></div>
      <div class="concept-card"><strong>視野</strong><p>比較排列、邊界與染色後構造，不先用材料名稱猜答案。</p></div>
      <div class="concept-card"><strong>圖像證據</strong><p>先看形狀差異與構造彼此的位置，再對照題目敘述。</p></div>
      <div class="concept-card"><strong>干擾</strong><p>判讀影像時要同時檢查邊界、內部構造與排列脈絡。</p></div>
    </div>
    <div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div></div>`;
}

function selectedClass(question, option) {
  const selected = state.answers[question.id] === option.id;
  const checked = state.checkedWrong[question.id];
  if (checked && selected && option.id === question.answer) return " selected correct";
  if (checked && selected && option.id !== question.answer) return " selected wrong";
  return selected ? " selected" : "";
}
function renderQuestionImage(question) {
  if (!question.image) return "";
  return `<figure class="question-visual">
    <div class="question-image-wrap"><img src="${question.image}" alt="${question.imageAlt || "未標註觀察圖"}"></div>
    <figcaption>請只依這張未標註影像的外框、排列與構造線索判讀。</figcaption>
  </figure>`;
}
function renderChoiceQuestion(qid) {
  const question = questionById(qid);
  return `<div class="question-card" data-question-id="${qid}">
    <h3>${question.prompt}</h3>
    ${renderQuestionImage(question)}
    <div class="choice-grid">${orderedOptions(question).map((option) => `<button class="choice-button${selectedClass(question, option)}" data-choice="${qid}" data-value="${option.id}">${option.text}</button>`).join("")}</div>
    <p class="selected-answer">${state.answers[qid] ? `已選：${question.options.find((option) => option.id === state.answers[qid])?.text || ""}` : "尚未選擇"}</p>
    ${state.hints[qid] ? `<div class="feedback warn">${question.hint}</div>` : ""}
  </div>`;
}
function renderSequenceQuestion() {
  const order = ensureSequence();
  const isWrong = state.checkedWrong.q01;
  return `<div class="question-card"><h3>製作洋蔥表皮水封片時，請拖曳排序卡，排出較合理的操作順序。</h3>
    <p class="field-help">手機可使用每張卡片的上移 / 下移按鈕。</p>
    <div class="sortable-list">${order.map((id, index) => {
      const step = sequenceSteps.find((item) => item.id === id);
      return `<div class="sortable-item" draggable="true" data-sequence-id="${id}">
        <span class="drag-handle" aria-hidden="true"></span>
        <strong>${step.label}</strong>
        <div class="sequence-move-buttons"><button class="icon-action" data-move="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-move="${id}" data-dir="1" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div>
      </div>`;
    }).join("")}</div>
    ${state.hints.q01 ? `<div class="feedback warn">先比較每張卡對水分、材料平整與空氣的影響，再決定相鄰兩步誰應在前。</div>` : ""}
    ${isWrong ? `<div class="feedback bad">流程還需要修正。請依提示調整順序。</div>` : ""}
  </div>`;
}
function renderCheckpoint1() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>玻片製作與低高倍策略</h2>
    <div class="asset-strip"><figure><img src="${assets.slidePreparation}" alt="玻片製作流程圖卡" onerror="this.closest('figure').hidden=true"><figcaption>觀察圖卡：用流程線索安排步驟。</figcaption></figure><figure><img src="${assets.lowHighStrategy}" alt="低高倍率觀察策略對照圖" onerror="this.closest('figure').hidden=true"><figcaption>觀察圖卡：先低倍定位，再高倍看細節。</figcaption></figure></div>
    <div class="question-grid">${renderSequenceQuestion()}${["q02", "q03", "q04"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`;
}
function renderCheckpoint2() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>顯微視野判讀</h2>
    <div class="story-panel"><strong>未標註影像</strong><p>每題只顯示該題需要判讀的影像，不提供材料分頁或預先命名的構造熱點。</p></div>
    <div class="question-grid">${["q05", "q06", "q07", "q08", "q09", "q10"].map(renderChoiceQuestion).join("")}</div>
    <div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`;
}
function renderClassifyQuestion() {
  return `<div class="question-card"><h3>請依觀察到的線索或取材來源分類：哪些較支持植物細胞？哪些較支持動物細胞？</h3>
    <div class="classify-list">${classifyItems.map((item) => {
      const selected = state.answers.q14[item.id] || "";
      return `<div class="classify-row" data-classify-id="${item.id}">
        <strong>${item.label}</strong>
        <label>分類
          <select data-classify="${item.id}">
            <option value="">請選擇</option>
            <option value="plant" ${selected === "plant" ? "selected" : ""}>較支持植物細胞</option>
            <option value="animal" ${selected === "animal" ? "selected" : ""}>較支持動物細胞</option>
          </select>
        </label>
        <p class="selected-answer">${selected ? `已選：${selected === "plant" ? "較支持植物細胞" : "較支持動物細胞"}` : "尚未選擇"}</p>
      </div>`;
    }).join("")}</div>
    ${state.hints.q14 ? `<div class="feedback warn">先用外框、排列方式、取材來源與特殊構造判斷，不要只看細胞大小。</div>` : ""}
  </div>`;
}
function renderCheckpoint3() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>染色、干擾與動植物線索</h2><figure class="wide-asset"><img src="${assets.stainingComparison}" alt="染色前後觀察對照圖" onerror="this.closest('figure').hidden=true"><figcaption>觀察圖卡：染色會讓構造對比更清楚，不是裝飾。</figcaption></figure><div class="question-grid">${["q11", "q12", "q13"].map(renderChoiceQuestion).join("")}${renderClassifyQuestion()}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`;
}

function isCorrect(qid) {
  if (qid === "q01") return ensureSequence().join("|") === correctSequence.join("|");
  if (qid === "q14") return classifyItems.every((item) => state.answers.q14[item.id] === item.answer);
  const question = questionById(qid);
  return state.answers[qid] === question.answer;
}
function isAnswered(qid) {
  if (qid === "q01") return Boolean(state.interactions.q01) && ensureSequence().length === correctSequence.length;
  if (qid === "q14") return classifyItems.every((item) => Boolean(state.answers.q14[item.id]));
  return Boolean(state.answers[qid]);
}
function allRequiredAnswered() {
  return [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].every(isAnswered);
}
function markHint(qid) {
  if (!state.hints[qid]) state.hints[qid] = true;
  state.checkedWrong[qid] = true;
}
function checkSection(section) {
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
    newlyHinted.forEach(markHint);
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
    button.addEventListener("click", () => {
      const question = questionById(button.dataset.choice);
      state.answers[question.id] = button.dataset.value;
      state.interactions[question.id] = true;
      if (button.dataset.value !== question.answer) markHint(question.id);
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-classify]").forEach((select) => {
    select.addEventListener("change", () => {
      state.answers.q14[select.dataset.classify] = select.value;
      state.interactions.q14 = true;
      const item = classifyItems.find((candidate) => candidate.id === select.dataset.classify);
      if (select.value && item && select.value !== item.answer) markHint("q14");
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
  if (checkButton) checkButton.addEventListener("click", () => checkSection(checkButton.dataset.section));
}

function evaluateReflectionQuality(reflection) {
  return window.BioQuestReflectionQuality.evaluate(reflection, reflectionRules);
}
function questionConcept(qid) {
  if (qid === "q01") return "slide_preparation";
  if (qid === "q14") return "animal_plant_observation_compare";
  return questionById(qid)?.concept || "unknown";
}
function questionMisconception(qid) {
  if (qid === "q01") return "slide_preparation_sequence";
  if (qid === "q14") return "observation_without_evidence";
  return questionById(qid)?.misconception || "unknown";
}
function calculateExpLedger({ completionExp, directExp, revisionExp, questionExp, masteryExp, retryCandidate }) {
  const normalizedQuestionExp = Math.min(40, Math.max(0, Number(questionExp) || 0));
  const ledgerCap = Math.min(UNIT_EXP_CAP, 460 + normalizedQuestionExp);
  const values = [completionExp, directExp, revisionExp, normalizedQuestionExp, masteryExp, retryCandidate]
    .map((value) => Math.max(0, Number(value) || 0));
  let remaining = ledgerCap;
  const [completion, direct, revision, question, mastery, retry] = values.map((value) => {
    const awarded = Math.min(value, remaining);
    remaining -= awarded;
    return awarded;
  });
  return {
    completion_exp: completion,
    concept_exp: direct,
    revision_exp: revision,
    question_exp: question,
    mastery_exp: mastery,
    retry_exp: retry,
    attempt_total_exp: completion + direct + revision + question + mastery + retry
  };
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
  const masteryExp = accuracy === 1 && hintUsed === 0 ? 140 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const prevAcc = previousBestAccuracy();
  const completionExp = allRequiredAnswered() ? 100 : 0;
  const retryCandidate = state.attempt_type === "retry" && prevAcc !== null && accuracy > prevAcc ? Math.min(60, Math.round((accuracy - prevAcc) * 100)) : 0;
  const officialLedger = calculateExpLedger({ completionExp, directExp, revisionExp, questionExp: reflectionEval.question_exp, masteryExp, retryCandidate });
  const candidateLedger = calculateExpLedger({ completionExp, directExp, revisionExp, questionExp: reflectionEval.question_exp_candidate, masteryExp, retryCandidate });
  const best = previousBestCredited();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(best, officialLedger.attempt_total_exp));
  const sectionStats = [
    sectionStat("玻片製作與觀察策略", sectionMap.checkpoint1),
    sectionStat("顯微視野判讀", sectionMap.checkpoint2),
    sectionStat("染色與迷思修正", sectionMap.checkpoint3)
  ];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? [badges[0].id] : [];
  if (sectionStats[0].correct / sectionStats[0].total >= 0.85) earned.push("slide_preparation_sequencer", "low_high_power_strategist");
  if (sectionStats[1].correct / sectionStats[1].total >= 0.85) earned.push("field_sample_identifier", "guard_cell_stoma_spotter");
  if (sectionStats[2].correct / sectionStats[2].total >= 0.85) earned.push("staining_purpose_explainer", "artifact_detector");
  if (accuracy === 1 && hintUsed === 0) earned.push("cell_observation_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("cell_observation_reflection_reporter");
  if (candidateLedger.retry_exp > 0) earned.push("retry_growth_cell_observation");
  return {
    unit_exp_cap: UNIT_EXP_CAP,
    ...officialLedger,
    ...reflectionEval,
    retry_exp_candidate: candidateLedger.retry_exp,
    attempt_total_exp_candidate: candidateLedger.attempt_total_exp,
    unit_credited_exp: unitCreditedExp,
    credited_delta: Math.max(0, unitCreditedExp - best),
    correct,
    total,
    accuracy,
    hint_used: hintUsed,
    correct_without_hint: correctWithoutHint,
    corrected_after_hint: correctedAfterHint,
    previous_accuracy: prevAcc,
    accuracy_delta: prevAcc === null ? null : accuracy - prevAcc,
    section_stats: sectionStats,
    misconceptions,
    concept_mastery_tags_json: conceptMastery(qids),
    badges: [...new Set(earned)],
    cumulative_badges_candidate: cumulativeBadgeIds(earned),
    no_hint_perfect: accuracy === 1 && hintUsed === 0,
    all_required_answered: allRequiredAnswered(),
    teacher_attention_needed: Number(state.answers.reflection.confidence_score || 3) <= 2 || accuracy < 0.6 || reflectionEval.reflection_review_status === "pending_review" || misconceptions.length >= 3
  };
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
function misconceptionText(tag) {
  const map = {
    slide_preparation_sequence: "建議再把水滴、材料平整、蓋玻片與多餘液體各自的目的連起來，再用目的檢查前後關係。",
    stain_is_decoration: "建議再閱讀染色目的：染色能提高視野對比，使細胞核等構造更容易觀察。",
    high_power_first: "建議再整理顯微鏡觀察策略：先用低倍率找到細胞，再換高倍率看細節。",
    bubble_as_cell: "建議再練習視野判讀：氣泡常有明顯圓形邊緣，但缺少細胞排列與內部構造線索。",
    all_plant_cells_have_chloroplast_in_view: "建議再比較不同植物細胞觀察材料：洋蔥表皮和葉片下表皮能看到的重點不完全相同。",
    animal_cell_has_cell_wall: "建議再比較口腔皮膜與洋蔥表皮：口腔皮膜細胞沒有細胞壁，形狀較不規則。",
    plant_cell_wall_identification: "植物表皮細胞的外框可提供細胞壁線索；判讀時要分開看外框與染色後較深色的構造。",
    observation_without_evidence: "建議再用外框、排列、染色、取材來源、特殊構造等線索判斷顯微視野。"
  };
  return map[tag] || "建議再把觀察線索和顯微視野判讀連在一起。";
}
function renderReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>任務掃描結果</h2>
    <div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理主要概念。</p>"}</div>
      <div class="story-panel"><strong>建議再閱讀理解</strong><p class="muted">這些方向依剛剛仍需要提示或調整的概念整理，幫你回看關鍵線索。</p>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div>
      <div class="story-panel"><strong>課堂提問方向</strong><p>染色前後差異、氣泡與細胞構造判讀、保衛細胞與氣孔、低倍率與高倍率切換時機、口腔皮膜與植物表皮差異。</p></div>
    </div>
    <div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}
function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2>
    <div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；具體且與玻片製作、視野判讀、染色目的、樣本比較或觀察迷思相關的問題，可取得回報 EXP。</p></div>
    <div class="form-grid">
      <label>我最能判斷的顯微觀察線索是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label>
      <label>我還不確定的觀察步驟或視野判讀線索是什麼？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label>
      <label>選一個希望老師課堂解釋的方向，並用自己的話補充<span class="field-help">方向詞可以參考，但不要直接複製。</span><textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label>
      <label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label>
    </div>
    <div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div></div>`;
}
function buildAttempt() {
  const now = new Date().toISOString();
  return {
    attempt_id: state.attempt_session_id,
    timestamp: now,
    student: state.student,
    mission,
    attempt_type: state.attempt_type,
    attempt_type_candidate: state.attempt_type,
    attempt_no: Number(state.remote_completed_attempts || 0) + 1,
    attempt_session_id: state.attempt_session_id,
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
function buildBackendPayload(attempt) {
  return {
    attempt_id: attempt.attempt_id,
    student_id: attempt.student.student_id,
    student_name: attempt.student.student_name,
    class_name: attempt.student.class_name,
    seat_no: attempt.student.seat_no,
    unit_id: attempt.mission.unit_id,
    unit_title: attempt.mission.unit_title,
    attempt_type: attempt.attempt_type,
    attempt_type_candidate: attempt.attempt_type_candidate,
    attempt_no_candidate: attempt.attempt_no,
    attempt_session_id: attempt.attempt_session_id,
    started_from_login: attempt.started_from_login,
    previous_attempt_id: attempt.previous_attempt_id,
    retry_validation_status: attempt.retry_validation_status,
    completion_status: attempt.completion_status,
    required_answer_count: attempt.required_answer_count,
    answered_required_count: attempt.answered_required_count,
    all_required_answered: attempt.all_required_answered,
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
    question_exp_candidate: attempt.question_exp_candidate,
    mastery_exp: attempt.mastery_exp,
    retry_exp: attempt.retry_exp,
    retry_exp_candidate: attempt.retry_exp_candidate,
    attempt_total_exp: attempt.attempt_total_exp,
    attempt_total_exp_candidate: attempt.attempt_total_exp_candidate,
    unit_credited_exp: attempt.unit_credited_exp,
    credited_delta: attempt.credited_delta,
    confidence_score: attempt.confidence_score,
    reflection_quality: attempt.reflection_quality,
    reflection_quality_candidate: attempt.reflection_quality_candidate,
    reflection_exp_reason: attempt.reflection_exp_reason,
    reflection_review_status: attempt.reflection_review_status,
    reflection_original_text: attempt.reflection_original_text,
    reflection_normalized_text: attempt.reflection_normalized_text,
    reflection_similarity_score: attempt.reflection_similarity_score,
    reflection_similarity_source: attempt.reflection_similarity_source,
    reflection_copied_direction_flag: attempt.reflection_copied_direction_flag,
    reflection_irrelevant_flag: attempt.reflection_irrelevant_flag,
    reflection_low_effort_flag: attempt.reflection_low_effort_flag,
    reflection_examples_checked: attempt.reflection_examples_checked,
    reflection_frontend_only: true,
    teacher_attention_needed: attempt.teacher_attention_needed,
    student_question: attempt.student_question,
    badges_json: JSON.stringify(attempt.badges),
    existing_badges_json: JSON.stringify(cumulativeBadgeIds()),
    cumulative_badges_candidate_json: JSON.stringify(attempt.cumulative_badges_candidate),
    slide_preparation_score: scoreForConcept(attempt, "slide_preparation"),
    low_high_power_strategy_score: scoreForConcept(attempt, "low_high_power_observation"),
    field_sample_identification_score: scoreForConcept(attempt, "onion_epidermis", "mouth_epithelial_cell"),
    guard_cell_stoma_score: scoreForConcept(attempt, "leaf_lower_epidermis"),
    staining_purpose_score: scoreForConcept(attempt, "staining_purpose"),
    artifact_detection_score: scoreForConcept(attempt, "field_interpretation"),
    animal_plant_observation_compare_score: scoreForConcept(attempt, "animal_plant_observation_compare"),
    misconceptions_json: JSON.stringify(attempt.misconceptions),
    raw_answers_json: JSON.stringify(attempt.raw_answers),
    badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].map((qid) => ({
      question_id: `${mission.unit_id}_${qid}`,
      skill_tag: questionConcept(qid),
      is_correct: isCorrect(qid),
      used_hint: Boolean(state.hints[qid]),
      attempt_answer: JSON.stringify(qid === "q01" ? state.answers.q01_sequence : qid === "q14" ? state.answers.q14 : state.answers[qid]),
      correct_answer: qid === "q01" ? correctSequence.join(" > ") : qid === "q14" ? "依觀察線索分類動植物細胞" : questionById(qid).answer,
      exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept",
      exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total)
    }))
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
  const payload = buildBackendPayload(attempt);
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(payload));
  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: "POST", body });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "backend_submit_failed");
  return data;
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
      state.backend_status = "submitted";
      if (response.verified_attempt) state.result = { ...state.result, ...response.verified_attempt };
      const progress = response.student_progress || response.progress || null;
      if (progress && Object.keys(progress).length) applyBackendProgress(progress);
      else state.backend_status = "pending_progress";
      attempt = { ...attempt, ...state.result, backend_status: state.backend_status, backend_attempt_id: response.attempt_id || attempt.attempt_id };
    } catch {
      state.backend_status = "pending_local";
      attempt = { ...attempt, backend_status: state.backend_status };
      savePending(buildBackendPayload(attempt));
    }
    saveAttempt(attempt);
    state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + 1;
    unlock("result", "achievements");
    saveState();
    setScreen("result");
  });
}
function attemptCreditStatus() {
  if (state.student?.is_guest) return "guest";
  if (state.submitted_at && state.backend_status !== "submitted") return "pending";
  return "verified";
}
function displayExpLedger(result, status = attemptCreditStatus()) {
  const candidate = status !== "verified";
  return calculateExpLedger({
    completionExp: result.completion_exp,
    directExp: result.concept_exp,
    revisionExp: result.revision_exp,
    questionExp: candidate ? result.question_exp_candidate : result.question_exp,
    masteryExp: result.mastery_exp,
    retryCandidate: candidate ? result.retry_exp_candidate : result.retry_exp
  });
}
function resultStatusNotice(result, area = "result") {
  const status = attemptCreditStatus();
  const attemptExp = displayExpLedger(result, status).attempt_total_exp;
  if (status === "guest") {
    return `<div class="feedback warn">guest 測試：本次預估 ${attemptExp}/${UNIT_EXP_CAP} EXP，不列入正式累積。</div>`;
  }
  if (status === "pending") {
    const detail = state.backend_status === "pending_local"
      ? "後台暫時無法寫入，本次提交已保留在本機待補送佇列。"
      : "後台尚未完成本次確認。";
    return `<div class="feedback warn">${detail}本次預估 ${attemptExp}/${UNIT_EXP_CAP} EXP，待後台確認。</div>`;
  }
  return area === "result"
    ? `<div class="feedback good">本次任務已提交，作答結果已鎖定；後台已回傳正式認列資料。</div>`
    : "";
}
function renderResult() {
  const result = state.result || calculateResult();
  const notice = state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : "";
  const status = attemptCreditStatus();
  const ledger = displayExpLedger(result, status);
  const creditedExp = Math.min(Number(result.unit_credited_exp || ledger.attempt_total_exp || 0), UNIT_EXP_CAP);
  const backendNotice = resultStatusNotice(result, "result");
  const creditedLabel = status === "verified" ? "本單元正式認列" : "認列狀態";
  const creditedValue = status === "verified" ? `${creditedExp} EXP` : status === "guest" ? "guest 不累積" : "待後台確認";
  const recognitionCopy = status === "verified"
    ? "本次取得是這次挑戰的原始表現；本單元正式認列會保留最高表現並受 500 EXP 上限限制。"
    : status === "guest"
      ? `guest 測試：本次預估 ${ledger.attempt_total_exp}/${UNIT_EXP_CAP} EXP，不列入正式累積。請使用學生學號登入，才會送交後台確認。`
      : `本次預估 ${ledger.attempt_total_exp}/${UNIT_EXP_CAP} EXP，待後台確認；確認完成前，這些數字只代表本次作答預覽。`;
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>提交後本次作答已鎖定</h2>${notice}${backendNotice}
    <div class="score-grid"><div class="score-box"><span>${status === "verified" ? "本次取得" : "本次預估"}</span><strong>${ledger.attempt_total_exp} EXP</strong></div><div class="score-box"><span>${creditedLabel}</span><strong>${creditedValue}</strong></div><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel" data-exp-ledger-total="${ledger.attempt_total_exp}"><strong>EXP 明細</strong><p>完成 ${ledger.completion_exp}｜直接答對 ${ledger.concept_exp}｜提示後修正 ${ledger.revision_exp}｜回報 ${ledger.question_exp}｜精熟 ${ledger.mastery_exp}｜再挑戰 ${ledger.retry_exp}</p></div>
      <div class="story-panel"><strong>${status === "verified" ? "本次與正式累積差異" : "本次預估狀態"}</strong><p>${recognitionCopy}</p></div>
      <div class="story-panel"><strong>回報品質</strong><p>${result.reflection_quality}：${result.reflection_exp_reason}</p><p class="muted">${status === "verified" ? `後台正式認列 ${ledger.question_exp} EXP。` : `前台候選 ${ledger.question_exp} EXP，待後台重算。`}</p></div>
    </div>
    <div class="actions"><button class="primary" id="resultAchievements">查看成就</button><button class="secondary" id="resultRules">查看規則</button></div></div></div>`;
}
function renderAchievements() {
  const currentBadges = state.submitted_at ? (state.result || calculateResult()).badges : [];
  const litIds = cumulativeBadgeIds(currentBadges);
  const status = attemptCreditStatus();
  const pending = status === "pending";
  const guest = status === "guest";
  const officialBadgeIds = [...new Set(state.cumulative_badges || [])];
  const estimatedExp = displayExpLedger(state.result || calculateResult(), status).attempt_total_exp;
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
      : "亮燈狀態合併後台 StudentProgress 與本機完整 Attempts；同一徽章只計一次。";
  return `<div class="wide-layout"><div class="panel" data-bq-unit-achievements="cell_observation"><p class="eyebrow">本單元成就</p><h2>本單元成就｜顯微觀察徽章牆</h2>
    <div class="score-grid"><div class="score-box"><span>${badgeLabel}</span><strong>${badgeCount}</strong></div><div class="score-box"><span>${expLabel}</span><strong>${expValue}</strong></div><div class="score-box"><span>${unitLabel}</span><strong>${unitValue}</strong></div></div>
    ${guest || pending ? `<div class="feedback warn">${syncNote}</div>` : ""}
    <div class="badge-grid">${badges.map((badge) => {
      const lit = litIds.includes(badge.id);
      const official = officialBadgeIds.includes(badge.id);
      const gold = badge.id === "cell_observation_flawless";
      const pendingBadge = pending && lit && !official;
      return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}" data-badge-id="${badge.id}" data-badge-image-path="${badge.badge_image_path}"><img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="badge-icon" hidden>${lit ? "亮" : "徽"}</div><strong>${badge.name}</strong>${pendingBadge ? `<span class="pill warn">待同步</span>` : ""}<p class="muted">${badge.condition}</p></div>`;
    }).join("")}</div><p class="muted">${syncNote}</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
}
function renderRules() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務規則</p><h2>EXP、提示與再挑戰</h2>
    <div class="card-grid">
      <div class="story-panel"><strong>單元上限</strong><p>本單元最高認列 500 EXP。一次零提示全對是最高路徑。</p></div>
      <div class="story-panel"><strong>完成條件</strong><p>回答完所有必答題即可提交，不必先全對；需要調整的概念會保留提示與回饋。</p></div>
      <div class="story-panel"><strong>提示後修正</strong><p>每題第一次錯選會出現一次提示；提示後修正仍有 EXP，但低於直接答對。</p></div>
      <div class="story-panel"><strong>再挑戰</strong><p>提交後本次作答鎖定。若要再挑戰，請重新登入並從頭完成整份任務。</p></div>
    </div>
    <div class="actions"><button class="primary" id="rulesBack">回到任務</button></div></div></div>`;
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
  screen.dataset.bioquestScreen = state.screen;
  screen.innerHTML = views[state.screen]();
  attachEvents();
  if (window.BioQuestCharacterLayout?.enhance) {
    window.BioQuestCharacterLayout.enhance({ force: true });
  }
}

window.__cellObservationTest = {
  getState: () => clone(state),
  setState: (next) => {
    state = { ...clone(defaultState), ...clone(next), answers: { ...clone(defaultState.answers), ...clone(next.answers || {}) } };
    render();
  },
  answerKey: () => ({
    sequence: [...correctSequence],
    choices: Object.fromEntries(questions.map((question) => [question.id, question.answer])),
    classify: Object.fromEntries(classifyItems.map((item) => [item.id, item.answer]))
  }),
  calculateResult,
  displayExpLedger
};

render();
