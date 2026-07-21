const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260721-nutrients-energy-q11-inactive-cache-v1";
const QUESTION_VERSION = "20260721-nutrients-energy-q11-inactive-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_nutrients_energy_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "nutrients_energy",
  unit_title: "食物中的養分與能量",
  mission_title: "生命補給辨識任務",
  mission_area: "生命補給站"
};

const assets = {
  mentorFallback: "../prototype-life-world/assets/mentor-life-world-azhe-v2.webp",
  owlLogin: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.webp",
  owlPrep: "assets/owl-nutrients-energy-prep-reminder.webp",
  owlResult: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-nutrients-energy-briefing-azhe-wide.webp",
  ambientBackgroundHook: "assets/bg-nutrients-energy-ambient-wide.webp",
  nutrientFunctionCards: "assets/nutrient-function-cards.webp",
  foodSourceCards: "assets/food-source-cards.webp",
  energySourceCards: "assets/energy-source-cards.webp",
  balancedMealComparison: "assets/balanced-meal-comparison.webp",
  nutritionLabelBoard: "assets/nutrition-label-blank-board.webp"
};

const badgeAsset = (id) => `../shared-assets/badges/nutrients_energy/badge-nutrients_energy-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["養分", "醣類", "蛋白質", "脂質", "維生素", "礦物質", "水", "能量", "熱量", "食物來源", "均衡飲食", "身體材料", "生理功能", "營養標示", "多樣", "適量"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "我喜歡炸雞", "青菜不好吃"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["食物和養分的差異", "醣類蛋白質脂質的功能比較", "哪些養分提供能量", "維生素與礦物質為什麼重要", "水不提供能量但仍必要的原因", "食物常含多種養分的例子", "均衡飲食和食物多樣性"]
};

const badges = [
  { id: "nutrients_energy_entry", name: "養分補給入門徽章", condition: "完成生命補給辨識任務。" },
  { id: "nutrient_function_matcher", name: "營養素功能配對徽章", condition: "養分種類與主要功能題組達 85% 以上。" },
  { id: "food_source_classifier", name: "食物來源分類徽章", condition: "主要養分來源題組達 85% 以上。" },
  { id: "energy_source_judge", name: "能量來源判斷徽章", condition: "能量來源題組達 85% 以上。" },
  { id: "balanced_diet_decider", name: "均衡飲食判斷徽章", condition: "均衡飲食情境題組達 85% 以上。" },
  { id: "nutrition_label_reader", name: "營養標示判讀徽章", condition: "能由簡化資料判斷養分與能量線索。" },
  { id: "nutrient_role_balancer", name: "養分角色平衡徽章", condition: "能區分供能與維持功能的養分。" },
  { id: "nutrients_misconception_reviser", name: "養分迷思修正徽章", condition: "提示後完成至少一項概念修正。" },
  { id: "nutrients_energy_flawless", name: "養分能量零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "nutrients_energy_reflection_reporter", name: "高品質養分回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_nutrients_energy", name: "再探養分能量進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const questions = [
  { id: "q04", section: "checkpoint1", concept: "vitamins_minerals_regulation", answer: "regulation_not_energy", prompt: "有同學說：『維生素很重要，所以一定能提供大量能量。』哪個修正較合理？", hint: "重要不等於提供大量能量；先看它主要協助哪一類身體功能。", misconception: "vitamins_as_energy", visual: "function", options: [{ id: "regulation_not_energy", text: "維生素很重要，但主要協助身體功能，不提供主要能量" }, { id: "vitamin_lipid", text: "維生素就是脂質" }, { id: "more_heat", text: "維生素越多越能提供熱量" }, { id: "meat_only", text: "維生素只存在肉類" }] },
  { id: "q06", section: "checkpoint2", concept: "food_nutrient_mix", answer: "mixed_nutrients", prompt: "牛奶可能同時含有水、蛋白質、脂質、醣類與礦物質。這最能提醒我們什麼？", hint: "先想真實食物通常是混合物，分類題多半是在問主要來源或特定判斷目的。", misconception: "one_food_one_nutrient", visual: "food", options: [{ id: "mixed_nutrients", text: "食物常含多種養分，不一定只能歸成單一成分" }, { id: "one_nutrient", text: "牛奶只含一種養分" }, { id: "water_only", text: "有水的食物就不含其他養分" }, { id: "mineral_energy", text: "礦物質會提供大量能量" }] },
  { id: "q07", section: "checkpoint2", concept: "protein_body_material", answer: "build_repair", prompt: "成長中的學生需要足夠蛋白質，主要和哪一類功能較有關？", hint: "把蛋白質和生長、組織材料與修補連起來思考，而不只看能量。", misconception: "protein_only_muscle", visual: "food", options: [{ id: "build_repair", text: "身體組織建造與修補" }, { id: "all_vitamins", text: "直接提供所有維生素" }, { id: "no_energy", text: "讓食物完全沒有熱量" }, { id: "replace_water", text: "取代水分" }] },
  { id: "q08", section: "checkpoint2", concept: "lipid_energy_storage", answer: "needed_in_moderation", prompt: "有同學說：『脂質都不好，完全不需要吃。』哪個修正較合理？", hint: "不要用好壞二分法判斷養分；先看它的功能，再思考適量與食物組合。", misconception: "lipid_all_bad", visual: "energy", options: [{ id: "needed_in_moderation", text: "脂質是身體需要的養分之一，重點是適量與食物組合" }, { id: "no_function", text: "脂質完全沒有功能" }, { id: "vegetable_only", text: "脂質只存在蔬菜" }, { id: "no_energy", text: "脂質一定不能提供能量" }] },
  { id: "q09", section: "checkpoint3", concept: "energy_sources", answer: "provides_energy", prompt: "某食物資料顯示醣類與脂質含量較明顯。若只從養分功能判斷，它較可能和哪個概念有關？", hint: "先找資料中哪些養分能提供能量，不需要做複雜熱量計算。", misconception: "only_carbs_energy", visual: "label", options: [{ id: "provides_energy", text: "可提供能量" }, { id: "no_energy", text: "完全沒有能量" }, { id: "water_only", text: "只提供水分" }, { id: "mineral_only", text: "只提供礦物質" }] },
  { id: "q10", section: "checkpoint3", concept: "balanced_diet", answer: "add_variety", prompt: "小志早餐只吃餅乾，午餐也只吃白飯。哪個調整方向較符合均衡飲食概念？", hint: "先看食物組合是否過度單一，再想還缺少哪些不同功能的養分來源。", misconception: "single_food_balance", visual: "balanced", options: [{ id: "add_variety", text: "增加不同類型食物，讓養分來源更完整" }, { id: "full_enough", text: "只要吃得飽就不用管種類" }, { id: "vitamin_only", text: "只補維生素就能取代所有食物" }, { id: "no_staple", text: "完全不吃主食" }] },
  { id: "q12", section: "checkpoint3", concept: "water_body_function", answer: "transport_regulate", prompt: "水不提供能量，但仍是身體不可缺少的物質。哪個說法較合理？", hint: "不提供能量不代表不重要；想想身體內許多作用是否需要水。", misconception: "water_not_important", visual: "function", options: [{ id: "transport_regulate", text: "水參與運輸、調節體溫與許多身體功能" }, { id: "unimportant", text: "水沒有熱量所以完全不重要" }, { id: "athlete_only", text: "水只在運動員身上有用" }, { id: "replace_all", text: "水可以取代所有養分" }] },
  { id: "q13", section: "checkpoint3", concept: "balanced_diet", answer: "variety_moderation", prompt: "有同學說：『只要某種食物含有一項重要養分，每天只吃那一種也很均衡。』哪個修正較合理？", hint: "先想單一食物是否能穩定提供所有身體需要的養分。", misconception: "single_food_balance", visual: "balanced", options: [{ id: "variety_moderation", text: "均衡飲食需要多樣食物取得不同養分" }, { id: "all_in_one", text: "一種食物一定包含所有養分" }, { id: "fruit_only", text: "只吃水果就能取代所有食物" }, { id: "protein_only", text: "只吃蛋白質就不用其他養分" }] },
  { id: "q14", section: "checkpoint3", concept: "nutrient_types", answer: "food_contains_nutrients", prompt: "有同學把『飯、肉、蔬菜』直接說成養分種類。哪個修正較合理？", hint: "先分清楚『吃進去的食物』和『食物中含有的養分』。", misconception: "food_vs_nutrient_confusion", visual: "food", options: [{ id: "food_contains_nutrients", text: "飯、肉、蔬菜是食物；醣類、蛋白質、脂質、維生素、礦物質、水等才是養分" }, { id: "rice_vitamin", text: "飯就是維生素" }, { id: "meat_not_food", text: "肉不是食物" }, { id: "vegetable_water", text: "蔬菜只提供水" }] }
];

const multiSelectQuestions = {
  q01: {
    prompt: "下列哪些屬於食物中常見的主要養分？",
    hint: "先想這些物質是否是身體可利用、維持生命活動需要的成分。",
    misconception: "food_vs_nutrient_confusion",
    options: [{ id: "carb", text: "醣類" }, { id: "protein", text: "蛋白質" }, { id: "lipid", text: "脂質" }, { id: "vitamin", text: "維生素" }, { id: "mineral", text: "礦物質" }, { id: "water", text: "水" }, { id: "plastic", text: "塑膠" }, { id: "glass", text: "玻璃" }],
    answers: ["carb", "protein", "lipid", "vitamin", "mineral", "water"],
    image: assets.nutrientFunctionCards
  },
  q03: {
    prompt: "哪些養分可以提供能量？",
    hint: "想想哪些養分會被身體用來取得能量，哪些主要協助調節或維持功能。",
    misconception: "only_carbs_energy",
    options: [{ id: "carb", text: "醣類" }, { id: "lipid", text: "脂質" }, { id: "protein", text: "蛋白質" }, { id: "vitamin", text: "維生素" }, { id: "mineral", text: "礦物質" }, { id: "water", text: "水" }],
    answers: ["carb", "lipid", "protein"],
    image: assets.energySourceCards
  }
};

const classifyQuestions = {
  q02: {
    prompt: "請將養分和較主要的功能配對。每一列都要選擇。",
    hint: "先把提供能量、建造材料、協助調節與不供能但必要等功能分開看。",
    misconception: "food_vs_nutrient_confusion",
    options: [{ id: "common_energy", label: "提供常用能量" }, { id: "build_repair", label: "建造與修補身體材料" }, { id: "store_energy", label: "提供並儲存能量" }, { id: "regulate", label: "協助維持身體功能" }, { id: "transport", label: "參與運輸與調節" }],
    items: [{ id: "carb", label: "醣類", answer: "common_energy" }, { id: "protein", label: "蛋白質", answer: "build_repair" }, { id: "lipid", label: "脂質", answer: "store_energy" }, { id: "vitamin_mineral", label: "維生素與礦物質", answer: "regulate" }, { id: "water", label: "水", answer: "transport" }],
    image: assets.nutrientFunctionCards
  },
  q05: {
    prompt: "請將食物依較能代表的主要養分分類。每一列都要選擇。",
    hint: "題目問主要來源，不代表食物只含一種養分；先看它最常代表哪一類。",
    misconception: "one_food_one_nutrient",
    options: [{ id: "carb", label: "醣類主要來源" }, { id: "protein", label: "蛋白質主要來源" }, { id: "lipid", label: "脂質主要來源" }],
    items: [{ id: "rice", label: "米飯", answer: "carb" }, { id: "bread", label: "麵包", answer: "carb" }, { id: "egg", label: "雞蛋", answer: "protein" }, { id: "tofu", label: "豆腐", answer: "protein" }, { id: "oil", label: "食用油", answer: "lipid" }, { id: "nuts", label: "堅果", answer: "lipid" }],
    image: assets.foodSourceCards
  }
};

const sectionMap = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08"],
  checkpoint3: ["q09", "q10", "q12", "q13", "q14"]
};
const activeDirectQuestionIds = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
const inactiveLegacyQuestionIds = ["q11"];
const inactiveLegacyAnswerKeys = ["q11", "q11_sequence"];

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  attempt_id: "",
  attempt_session_id: "",
  attempt_session_token: "",
  question_version: QUESTION_VERSION,
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
  answers: { q01: [], q02: {}, q03: [], q05: {}, reflection: {} },
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

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function questionById(id) { return questions.find((question) => question.id === id); }
function sanitizeInactiveLegacy(nextState) {
  inactiveLegacyAnswerKeys.forEach((key) => {
    delete nextState.answers?.[key];
    delete nextState.hints?.[key];
    delete nextState.checkedWrong?.[key];
    delete nextState.interactions?.[key];
    delete nextState.optionOrders?.[key];
    delete nextState.optionOrders?.[`${key}_multi`];
  });
  return nextState;
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const loaded = saved ? { ...clone(defaultState), ...saved, question_version: QUESTION_VERSION, answers: { ...clone(defaultState.answers), ...(saved.answers || {}) } } : clone(defaultState);
    return sanitizeInactiveLegacy(loaded);
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

function mentorCard(title, text) {
  return `<div class="mentor-card"><div class="mentor-avatar"><img src="${assets.mentorFallback}" alt="阿澤老師"></div><div class="mentor-copy"><span>阿澤老師</span><strong>${title}</strong><p>${text}</p></div></div>`;
}
function owlPanel(image = assets.owlPrep, alt = "貓頭鷹助理") {
  return `<div class="owl-frame"><img src="${image}" alt="${alt}"></div>`;
}
function layout(content, image = assets.owlPrep) {
  return `<div class="mission-layout"><div class="panel hero-panel">${content}</div>${owlPanel(image)}</div>`;
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
    <div class="mission-hud"><div><span>任務代號</span><strong>nutrients_energy</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
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
  return postBackendAction("startAttempt", { student_id: studentId, unit_id: mission.unit_id, question_version: QUESTION_VERSION });
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
    if (serverSession.verification_mode !== "server_verified" || !serverSession.attempt_session_token || serverSession.question_version !== QUESTION_VERSION) {
      throw new Error("backend_registry_not_ready");
    }
  } catch (error) {
    message.innerHTML = error.message === "backend_registry_not_ready"
      ? `<span class="pill warn">後台版本尚未更新，請通知老師後再重新登入。</span>`
      : `<span class="pill warn">無法取得安全任務憑證（${error.message}）。請確認後台已重新部署並連線後再登入。</span>`;
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
  state.question_version = QUESTION_VERSION;
  state.session_expires_at = serverSession.expires_at;
  state.remote_previous_attempt_id = serverSession.previous_attempt_id || remoteAttemptStatus.previous_attempt_id || remoteAttemptStatus.latest_attempt_id || remoteProgress.latest_attempt_id || "";
  const remoteAccuracy = remoteAttemptStatus.previous_accuracy ?? remoteAttemptStatus.best_accuracy;
  state.remote_previous_accuracy = remoteAccuracy === null || remoteAccuracy === undefined || remoteAccuracy === "" ? null : Number.isFinite(Number(remoteAccuracy)) ? Number(remoteAccuracy) : null;
  applyBackendProgress(remoteProgress);
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
  return `<figure class="question-visual nutrients-question-image"><img src="${src}" alt="${alt}"><figcaption>${caption}</figcaption></figure>`;
}
function renderQuestionImage(question) {
  if (question.visual === "label") {
    return `<figure class="question-visual nutrition-data-figure"><img src="${assets.nutritionLabelBoard}" alt="無文字的營養資料板背景"><div class="nutrition-data-table" role="table" aria-label="每份食物的簡化養分資料"><div role="row"><strong role="columnheader">養分</strong><strong role="columnheader">每份含量</strong></div><div role="row"><span role="cell">醣類</span><b role="cell">32 g</b></div><div role="row"><span role="cell">脂質</span><b role="cell">12 g</b></div><div role="row"><span role="cell">蛋白質</span><b role="cell">4 g</b></div></div><figcaption>數據由網頁 DOM 提供；只需辨認哪些養分可提供能量，不做複雜熱量計算。</figcaption></figure>`;
  }
  const map = { function: [assets.nutrientFunctionCards, "養分功能圖卡", "用養分的主要角色判斷。"], food: [assets.foodSourceCards, "常見食物來源圖卡", "食物可含多種養分；題目問的是主要來源。"], energy: [assets.energySourceCards, "供能養分圖卡", "比較供能與維持功能的角色。"], balanced: [assets.balancedMealComparison, "多樣與單一餐點比較圖", "以食物多樣、適量與養分來源判斷。"] };
  const row = map[question.visual];
  return row ? assetFigure(row[0], row[1], row[2]) : "";
}
function renderChoiceQuestion(qid) {
  const question = questionById(qid);
  return `<div class="question-card" data-question-id="${qid}"><h3>${question.prompt}</h3>${renderQuestionImage(question)}<div class="choice-grid">${orderedOptions(question).map((option) => `<button class="choice-button${selectedClass(question, option)}" data-choice="${qid}" data-value="${option.id}">${option.text}</button>`).join("")}</div><p class="selected-answer">${state.answers[qid] ? `已選：${question.options.find((option) => option.id === state.answers[qid])?.text || ""}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${question.hint}</div>` : ""}</div>`;
}
function renderMultiSelect(qid) {
  const config = multiSelectQuestions[qid];
  const selected = state.answers[qid] || [];
  const order = optionOrder(`${qid}_multi`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id));
  return `<div class="question-card multi-select-card" data-question-id="${qid}"><div class="question-mode-banner"><strong>可複選</strong><span>請選出所有符合的選項</span></div><h3>${config.prompt}</h3>${assetFigure(config.image, "養分辨識圖卡", "圖像只提供養分或食物線索；答案以選項文字為準。")}<div class="choice-grid">${order.map((option) => `<button class="choice-button ${selected.includes(option.id) ? "selected" : ""}" data-multi="${qid}" data-value="${option.id}" aria-pressed="${selected.includes(option.id)}">${option.text}</button>`).join("")}</div><p class="selected-answer">${selected.length ? `已選：${selected.map((id) => config.options.find((option) => option.id === id)?.text).filter(Boolean).join("、")}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}</div>`;
}
function renderClassifyQuestion(qid) {
  const config = classifyQuestions[qid];
  const items = optionOrder(`${qid}_items`, config.items.map((item) => item.id)).map((id) => config.items.find((item) => item.id === id));
  const options = optionOrder(`${qid}_options`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id));
  return `<div class="question-card" data-question-id="${qid}"><h3>${config.prompt}</h3>${assetFigure(config.image, qid === "q02" ? "養分功能圖卡" : "常見食物來源圖卡", qid === "q05" ? "主要來源不代表食物只含一種養分。" : "用主要功能完成每一列配對。")}<p class="field-help">配對／分類題：請完成每一列，選後會直接顯示已選答案。</p><div class="classify-list">${items.map((item) => { const selected = state.answers[qid]?.[item.id] || ""; return `<div class="classify-row"><strong>${item.label}</strong><label>選擇<select data-classify-question="${qid}" data-classify-item="${item.id}"><option value="">請選擇</option>${options.map((option) => `<option value="${option.id}" ${selected === option.id ? "selected" : ""}>${option.label}</option>`).join("")}</select></label><p class="selected-answer">${selected ? `已選：${config.options.find((option) => option.id === selected)?.label || ""}` : "尚未選擇"}</p></div>`; }).join("")}</div>${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}</div>`;
}
function renderBrief() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務簡報</p><h2>生命補給辨識任務</h2><div class="brief-scene nutrients-brief-scene" data-briefing-scene-hook="${assets.briefingSceneHook}"><div class="scene-copy"><div class="student-avatar-slot"><img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}';"></div><h3>生命補給站需要整理食物資料</h3><p>請把食物例子連到主要養分與功能，判斷能量來源，並用多樣與適量的概念整理餐點線索。</p></div></div><div class="mission-hud"><div><span>任務區</span><strong>生命補給站</strong></div><div><span>重點</span><strong>養分與能量</strong></div><div><span>原則</span><strong>多樣與適量</strong></div></div><div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div></div></div>`;
}
function renderScan() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的養分線索</h2><div class="owl-frame nutrients-prep-owl"><img src="${assets.owlPrep}" alt="養分任務提醒貓頭鷹"></div><div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>食物是混合物；分類多半問主要來源。能量不是唯一功能，不供能的養分也可能很重要。</p></div><div class="card-grid"><div class="concept-card"><strong>主要養分</strong><p>醣類、蛋白質、脂質、維生素、礦物質與水各有角色。</p></div><div class="concept-card"><strong>能量來源</strong><p>醣類、脂質與蛋白質可提供能量。</p></div><div class="concept-card"><strong>不只一種</strong><p>多數食物同時含有多種養分。</p></div><div class="concept-card"><strong>均衡判斷</strong><p>以食物多樣與適量思考，不用好壞二分。</p></div></div><div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div></div>`;
}
function renderCheckpoint1() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>養分種類與主要功能</h2><div class="question-grid">${renderMultiSelect("q01")}${renderClassifyQuestion("q02")}${renderMultiSelect("q03")}${renderChoiceQuestion("q04")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`; }
function renderCheckpoint2() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>食物來源與養分角色</h2><div class="question-grid">${renderClassifyQuestion("q05")}${["q06","q07","q08"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`; }
function renderCheckpoint3() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>能量資料與均衡判斷</h2><div class="question-grid">${renderChoiceQuestion("q09")}${renderChoiceQuestion("q10")}${["q12","q13","q14"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`; }

function isCorrect(qid) {
  if (multiSelectQuestions[qid]) {
    const selected = [...(state.answers[qid] || [])].sort();
    const expected = [...multiSelectQuestions[qid].answers].sort();
    return JSON.stringify(selected) === JSON.stringify(expected);
  }
  if (classifyQuestions[qid]) return classifyQuestions[qid].items.every((item) => state.answers[qid]?.[item.id] === item.answer);
  return state.answers[qid] === questionById(qid).answer;
}
function isAnswered(qid) {
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
  const checkButton = document.querySelector("#checkSection");
  if (checkButton) checkButton.addEventListener("click", async () => checkSection(checkButton.dataset.section));
}

function evaluateReflectionQuality(reflection) {
  return window.BioQuestReflectionQuality.evaluate(reflection, reflectionRules);
}
function questionConcept(qid) {
  if (qid === "q01") return "nutrient_types";
  if (qid === "q02") return "carbohydrate_energy";
  if (qid === "q03") return "energy_sources";
  if (qid === "q05") return "food_nutrient_mix";
  return questionById(qid)?.concept || "unknown";
}
function questionMisconception(qid) {
  if (multiSelectQuestions[qid]) return multiSelectQuestions[qid].misconception;
  if (classifyQuestions[qid]) return classifyQuestions[qid].misconception;
  return questionById(qid)?.misconception || "unknown";
}

function calculateResult() {
  const qids = activeDirectQuestionIds;
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
  const sectionStats = [sectionStat("養分種類與主要功能", sectionMap.checkpoint1), sectionStat("食物來源與養分角色", sectionMap.checkpoint2), sectionStat("能量資料與均衡判斷", sectionMap.checkpoint3)];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? ["nutrients_energy_entry"] : [];
  if (["q01","q02","q04"].every(isCorrect)) earned.push("nutrient_function_matcher");
  if (["q05","q06"].every(isCorrect)) earned.push("food_source_classifier");
  if (["q03","q09"].every(isCorrect)) earned.push("energy_source_judge");
  if (["q10","q13"].every(isCorrect)) earned.push("balanced_diet_decider");
  if (isCorrect("q09")) earned.push("nutrition_label_reader");
  if (["q02","q03","q04","q07","q08","q12"].every(isCorrect)) earned.push("nutrient_role_balancer");
  if (qids.some((qid) => isCorrect(qid) && state.hints[qid])) earned.push("nutrients_misconception_reviser");
  if (accuracy === 1 && hintUsed === 0) earned.push("nutrients_energy_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("nutrients_energy_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_nutrients_energy");
  return { unit_exp_cap: UNIT_EXP_CAP, completion_exp: completionExp, concept_exp: directExp, revision_exp: revisionExp, question_exp: reflectionEval.question_exp, question_exp_candidate: reflectionEval.question_exp_candidate ?? reflectionEval.question_exp, mastery_exp: masteryExp, retry_exp: retryExp, attempt_total_exp: attemptTotalExp, unit_credited_exp: unitCreditedExp, credited_delta: Math.max(0, unitCreditedExp - best), correct, total, accuracy, hint_used: hintUsed, correct_without_hint: correctWithoutHint, corrected_after_hint: correctedAfterHint, previous_accuracy: previousAccuracy, accuracy_delta: previousAccuracy === null ? null : accuracy - previousAccuracy, section_stats: sectionStats, misconceptions, concept_mastery_tags_json: conceptMastery(qids), badges: [...new Set(earned)], cumulative_badges_candidate: cumulativeBadgeIds(earned), no_hint_perfect: accuracy === 1 && hintUsed === 0, all_required_answered: allRequiredAnswered(), teacher_attention_needed: Number(state.answers.reflection.confidence_score || 3) <= 2 || accuracy < 0.6 || reflectionEval.reflection_review_status === "pending_review" || misconceptions.length >= 3, ...reflectionEval };
}

function misconceptionText(tag) {
  const map = {
    food_vs_nutrient_confusion: "建議再區分食物和養分：飯、肉、蔬菜是食物例子，醣類、蛋白質、脂質等才是養分。",
    only_carbs_energy: "建議再整理能量來源：醣類、脂質和蛋白質都可提供能量。",
    vitamins_as_energy: "建議再確認維生素功能：維生素很重要，但不是主要能量來源。",
    lipid_all_bad: "建議再理解脂質功能：脂質是需要的養分，重點是適量與搭配。",
    protein_only_muscle: "建議再閱讀蛋白質功能：蛋白質與身體建造、修補及多種生命功能有關。",
    water_not_important: "建議再確認水的功能：水不提供能量，但參與運輸、調節與許多身體作用。",
    single_food_balance: "建議再理解均衡飲食：重點是多樣與適量，不依賴單一食物。",
    one_food_one_nutrient: "建議再練習主要來源判斷：食物常含多種養分，分類要看題目目的。"
  };
  return map[tag] || "建議再把食物例子、養分功能與能量來源連在一起檢查。";
}

function renderReview() {
  const result = calculateResult(); const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>生命補給辨識回饋</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理養分與能量線索。</p>"}</div><div class="story-panel"><strong>建議再閱讀理解</strong>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>課堂提問方向</strong><p>食物與養分的差異、供能養分、維生素與礦物質、水的功能、主要食物來源、均衡飲食與食物多樣性。</p></div></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}

function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；只複製方向、寫飲食偏好或無關玩笑不會取得高 EXP。具體且與養分、功能、能量或均衡飲食相關的疑問，才可能取得回報 EXP，正式分數由後台重算。</p></div><div class="form-grid"><label>我最能掌握的一項養分或能量概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定養分種類、功能、能量來源或均衡飲食中的哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個希望老師再解釋的方向，並用自己的話補充<textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div></div>`;
}

function activeRawAnswers() {
  const raw = {};
  activeDirectQuestionIds.forEach((qid) => {
    raw[qid] = state.answers[qid];
  });
  raw.reflection = state.answers.reflection || {};
  return raw;
}

function buildBackendPayload(attempt) {
  const qids = activeDirectQuestionIds;
  const answerFor = (qid) => state.answers[qid];
  const correctFor = (qid) => multiSelectQuestions[qid] ? multiSelectQuestions[qid].answers : classifyQuestions[qid] ? Object.fromEntries(classifyQuestions[qid].items.map((item) => [item.id, item.answer])) : questionById(qid).answer;
  return {
    attempt_id: attempt.attempt_id, student_id: attempt.student.student_id, student_name: attempt.student.student_name, class_name: attempt.student.class_name, seat_no: attempt.student.seat_no, unit_id: mission.unit_id, unit_title: mission.unit_title,
    attempt_type: attempt.attempt_type, attempt_type_candidate: attempt.attempt_type_candidate, attempt_no_candidate: attempt.attempt_no, attempt_session_id: attempt.attempt_session_id, attempt_session_token: attempt.attempt_session_token, question_version: attempt.question_version, started_from_login: attempt.started_from_login, previous_attempt_id: attempt.previous_attempt_id, retry_validation_status: attempt.retry_validation_status,
    completion_status: attempt.completion_status, required_answer_count: attempt.required_answer_count, answered_required_count: attempt.answered_required_count, all_required_answered: attempt.all_required_answered, started_at: attempt.started_at, submitted_at: attempt.submitted_at,
    total_questions: attempt.total, correct: attempt.correct, accuracy: attempt.accuracy, hints_used: attempt.hint_used, correct_without_hint: attempt.correct_without_hint, corrected_after_hint: attempt.corrected_after_hint, completion_exp: attempt.completion_exp, concept_exp: attempt.concept_exp, revision_exp: attempt.revision_exp, question_exp: attempt.question_exp, mastery_exp: attempt.mastery_exp, retry_exp: attempt.retry_exp, attempt_total_exp: attempt.attempt_total_exp, unit_credited_exp: attempt.unit_credited_exp, credited_delta: attempt.credited_delta,
    confidence_score: attempt.confidence_score, reflection_quality: attempt.reflection_quality, reflection_quality_candidate: attempt.reflection_quality_candidate, reflection_exp_reason: attempt.reflection_exp_reason, reflection_review_status: attempt.reflection_review_status, reflection_original_text: attempt.reflection_original_text, reflection_normalized_text: attempt.reflection_normalized_text, reflection_similarity_score: attempt.reflection_similarity_score, reflection_similarity_source: attempt.reflection_similarity_source, reflection_copied_direction_flag: attempt.reflection_copied_direction_flag, reflection_irrelevant_flag: attempt.reflection_irrelevant_flag, reflection_low_effort_flag: attempt.reflection_low_effort_flag, reflection_examples_checked: attempt.reflection_examples_checked, reflection_frontend_only: true, teacher_attention_needed: attempt.teacher_attention_needed, student_question: attempt.student_question,
    badges_json: JSON.stringify(attempt.badges), existing_badges_json: JSON.stringify(cumulativeBadgeIds()), cumulative_badges_candidate_json: JSON.stringify(attempt.cumulative_badges_candidate),
    nutrient_function_score: scoreForConcept(attempt, "nutrient_types", "carbohydrate_energy", "vitamins_minerals_regulation"), food_source_classification_score: scoreForConcept(attempt, "food_nutrient_mix"), energy_source_score: scoreForConcept(attempt, "energy_sources"), balanced_diet_score: scoreForConcept(attempt, "balanced_diet"), nutrition_label_reading_score: isCorrect("q09") ? 100 : 0, nutrient_role_balance_score: scoreForConcept(attempt, "protein_body_material", "lipid_energy_storage", "vitamins_minerals_regulation", "water_body_function"), nutrient_test_extension_flag: false, nutrition_health_advice_flag: false,
    misconceptions_json: JSON.stringify(attempt.misconceptions), raw_answers_json: JSON.stringify(attempt.raw_answers), badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: qids.map((qid) => {
      const answer = answerFor(qid);
      const questionType = multiSelectQuestions[qid] ? "multi_select" : classifyQuestions[qid] ? "mapping" : "choice";
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
        misconception_tag: isCorrect(qid) ? "" : questionById(qid)?.misconception || multiSelectQuestions[qid]?.misconception || classifyQuestions[qid]?.misconception || "",
        exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept",
        exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total)
      };
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
    : pending ? `本次預估 ${estimatedExp}/${UNIT_EXP_CAP} EXP，待後台確認；徽章亮燈先顯示本次作答預覽。` : "";
  return `<div class="wide-layout"><div class="panel" data-bq-unit-achievements="nutrients_energy"><p class="eyebrow">本單元成就</p><h2>本單元成就：生命補給徽章牆</h2>${guest || pending ? `<div class="feedback warn">${syncNote}</div>` : ""}<div class="score-grid"><div class="score-box"><span>${badgeLabel}</span><strong>${badgeCount}</strong></div><div class="score-box"><span>${expLabel}</span><strong>${expValue}</strong></div><div class="score-box"><span>${unitLabel}</span><strong>${unitValue}</strong></div></div><div class="badge-grid">${badges.map((badge) => { const lit = litIds.includes(badge.id); const gold = badge.id === "nutrients_energy_flawless"; const pendingBadge = pending && lit && !state.cumulative_badges.includes(badge.id); return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}" data-badge-id="${badge.id}" data-badge-image-path="${badge.badge_image_path}"><img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><strong>${badge.name}</strong>${pendingBadge ? `<span class="pill warn">待同步</span>` : ""}<p class="muted">${badge.condition}</p></div>`; }).join("")}</div><p class="muted">${status === "verified" ? "正式亮燈狀態合併後台 StudentProgress 與本機完整 Attempts；同一徽章只計一次。" : "目前只顯示本次作答預覽；正式徽章需等待後台確認。"}</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
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
    required_answer_count: activeDirectQuestionIds.length,
    answered_required_count: activeDirectQuestionIds.filter(isAnswered).length,
    backend_status: state.backend_status,
    ...state.result,
    confidence_score: state.answers.reflection.confidence_score,
    confident_concept: state.answers.reflection.confident_concept,
    uncertain_concept: state.answers.reflection.uncertain_concept,
    student_question: state.answers.reflection.student_question,
    raw_answers: activeRawAnswers(),
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
  return { ...result, verification_status: "pending_network", badges: [], completion_exp: 0, concept_exp: 0, revision_exp: 0, question_exp: 0, mastery_exp: 0, retry_exp: 0, attempt_total_exp: 0, unit_credited_exp: 0, credited_delta: 0, no_hint_perfect: false };
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
  const recognitionCopy = status === "verified" ? "本次取得是這次挑戰的原始表現；本單元正式認列會保留最高表現並受 500 EXP 上限限制。" : status === "guest" ? `guest 測試：本次預估 ${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)}/${UNIT_EXP_CAP} EXP，不列入正式累積。請使用學生學號登入，才會送交後台確認。` : `本次預估 ${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)}/${UNIT_EXP_CAP} EXP，待後台確認；確認完成前，這些數字只代表本次作答預覽。`;
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
