const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20261029-cell-transport-wording-r3-v1";
const QUESTION_VERSION = "20260721-cell-transport-q07-inactive-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_cell_transport_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "cell_transport",
  unit_title: "物質進出細胞的方式",
  mission_title: "細胞邊界通行任務",
  mission_area: "微觀研究站"
};

const assets = {
  owlPrep: "assets/owl-cell-transport-prep-reminder.webp",
  owlResult: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-cell-transport-briefing-azhe-wide.webp",
  ambientBackgroundHook: "assets/bg-cell-transport-ambient-wide.webp",
  diffusionImage: "assets/cell-transport-diffusion-particle-sim.webp",
  osmosisImage: "assets/cell-transport-osmosis-semipermeable-scene.webp",
  potatoDataImage: "assets/cell-transport-potato-water-balance-samples.webp",
  animalCellImage: "assets/cell-transport-animal-cell-concentration-set.webp",
  plantCellImage: "assets/cell-transport-plant-cell-concentration-set.webp"
};

const badgeAsset = (id) => `../shared-assets/badges/cell_transport/badge-cell_transport-${id}.webp?v=${VERSION}`;
const reflectionRules = {
  conceptTerms: ["擴散", "滲透", "半透膜", "細胞膜", "濃度", "溶液濃度", "水分", "紅血球", "植物細胞", "質壁分離", "馬鈴薯", "皺縮", "膨脹"],
  irrelevantTerms: ["老師好帥", "帥", "午餐", "下課", "遊戲", "天氣", "好笑"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["擴散與滲透的差異", "半透膜如何影響水分移動", "為什麼水分常往溶液較濃、溶解物質較多的一側淨移動", "細胞膜選擇性通透", "紅血球在清水或濃食鹽水中的變化", "植物細胞膨壓與質壁分離", "質量變化資料如何推論水分進出"]
};
const badges = [
  { id: "cell_transport_entry", name: "細胞通行入門徽章", condition: "完成細胞邊界通行任務。" },
  { id: "diffusion_direction_judge", name: "擴散方向判斷徽章", condition: "擴散方向與濃度高低題組達 85% 以上。" },
  { id: "osmosis_flow_mapper", name: "滲透方向推理徽章", condition: "水分通過半透膜的方向題組達 85% 以上。" },
  { id: "semipermeable_membrane_keeper", name: "半透膜理解徽章", condition: "半透膜與細胞膜選擇性通過概念題組達 85% 以上。" },
  { id: "concentration_data_reader", name: "濃度差資料判讀徽章", condition: "依資料判斷移動方向題組達 85% 以上。" },
  { id: "cell_change_explainer", name: "細胞變化解釋徽章", condition: "動植物細胞濃度變化題組達 85% 以上。" },
  { id: "transport_misconception_reviser", name: "運輸迷思修正徽章", condition: "提示後修正至少一項核心迷思。" },
  { id: "cell_transport_flawless", name: "細胞通行零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "cell_transport_reflection_reporter", name: "高品質細胞通行回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_cell_transport", name: "再探細胞通行進步徽章", condition: "重新登入後完整再挑戰且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const questions = [
  {
    id: "q01", section: "checkpoint1", concept: "diffusion", misconception: "diffusion_osmosis_confusion",
    prompt: "把色素滴進清水，色素粒子慢慢向四周散開，最後分布均勻。這是什麼作用？",
    answer: "diffusion", hint: "移動的是色素粒子還是水？中間有沒有隔著一層膜？",
    image: assets.diffusionImage, imageAlt: "粒子在水中由密集處慢慢散開的示意圖", imageEvidence: "看看粒子從哪裡往哪裡移動。",
    options: [
      { id: "diffusion", text: "擴散作用" }, { id: "osmosis", text: "滲透作用" }, { id: "division", text: "細胞分裂" }, { id: "photosynthesis", text: "光合作用" }
    ]
  },
  {
    id: "q02", section: "checkpoint1", concept: "diffusion", misconception: "diffusion_requires_cell_membrane",
    prompt: "小明說：「擴散一定要有細胞膜才會發生。」這句話對嗎？",
    answer: "no_membrane_needed", hint: "噴了香水，香味會在教室裡散開。香味散開時有經過細胞膜嗎？",
    options: [
      { id: "no_membrane_needed", text: "不對，擴散在空氣或水中都會發生，不一定要有細胞膜。" }, { id: "plant_only", text: "不對，擴散只會發生在植物細胞裡，動物細胞沒有。" }, { id: "water_only", text: "對，擴散就是水分子通過半透膜進入細胞的過程。" }, { id: "no_gradient", text: "對，擴散只在細胞膜發生，和兩邊的濃度高低無關。" }
    ]
  },
  {
    id: "q03", section: "checkpoint1", concept: "osmosis", misconception: "direction_by_water_amount_only",
    prompt: "半透膜兩側是清水和濃糖水，水能通過、糖不易通過。水分主要往哪一側移動？",
    answer: "to_sugar", hint: "這題追蹤的是水，不是糖。比較兩側溶液的濃度，不要只看水的多少。",
    image: assets.osmosisImage, imageAlt: "半透膜隔開清水和濃糖水的示意圖", imageEvidence: "中間是半透膜，左邊是清水，右邊是濃糖水。",
    options: [
      { id: "to_sugar", text: "往濃糖水那一側移動" }, { id: "to_water", text: "往清水那一側移動" }, { id: "no_move", text: "兩側都不會有水分移動" }, { id: "container", text: "往容器比較大的那一側移動" }
    ]
  },
  {
    id: "q04", section: "checkpoint1", concept: "semipermeable_membrane", misconception: "semipermeable_as_wall",
    prompt: "半透膜在滲透作用中有什麼特性？",
    answer: "selective", hint: "「半透」的「半」是什麼意思？想想上一題的水和糖。",
    options: [
      { id: "selective", text: "讓某些物質通過，另一些物質不容易通過。" }, { id: "all_free", text: "讓所有物質都可以自由通過，沒有限制。" }, { id: "all_block", text: "讓所有物質都完全不能通過，像一道牆。" }, { id: "color", text: "只負責讓溶液變色，和物質進出無關。" }
    ]
  },
  {
    id: "q05", section: "checkpoint2", concept: "concentration_gradient", misconception: "diffusion_direction_by_solute_concentration",
    prompt: "某物質在細胞外濃度高、細胞內濃度低，而且能通過細胞膜。它會往哪個方向擴散？",
    answer: "outside_in", hint: "只比較這種物質在細胞內外的濃度，不用管細胞大小。",
    options: [
      { id: "outside_in", text: "由細胞外往細胞內移動" }, { id: "inside_out", text: "由細胞內往細胞外移動" }, { id: "none", text: "細胞內外都不會有移動" }, { id: "same", text: "細胞內外的移動量完全相同" }
    ]
  },
  {
    id: "q06", section: "checkpoint2", concept: "cell_membrane_selectivity", misconception: "cell_membrane_all_or_none",
    prompt: "關於細胞膜和物質進出，哪一個說法正確？",
    answer: "regulate", hint: "細胞需要從外界取得物質，也要維持內部的環境穩定。",
    options: [
      { id: "regulate", text: "細胞膜能控制物質進出，有些能通過、有些不能。" }, { id: "all_pass", text: "細胞膜讓所有物質隨意進出，沒有任何控制。" }, { id: "none_pass", text: "細胞膜讓任何物質都不能進出，把細胞封住。" }, { id: "support", text: "細胞膜主要用來支撐植物細胞，維持形狀。" }
    ]
  },
  {
    id: "q08", section: "checkpoint2", concept: "evidence_based_prediction", misconception: "data_not_evidence",
    prompt: "兩條馬鈴薯分別泡在甲、乙兩杯溶液中，質量變化如下表。哪一個推論正確？",
    answer: "water_direction", hint: "馬鈴薯變重，是水分進入還是離開馬鈴薯？",
    dataTable: [
      { sample: "甲", before: "10.0 g", after: "10.6 g" },
      { sample: "乙", before: "10.0 g", after: "9.4 g" }
    ],
    options: [
      { id: "water_direction", text: "甲的馬鈴薯細胞吸收水分，乙的馬鈴薯細胞失去水分。" }, { id: "break", text: "甲、乙的馬鈴薯細胞都已經全部吸水破裂了。" }, { id: "irrelevant", text: "質量變化和水分進出無關，無法推論任何事。" }, { id: "no_water", text: "乙的溶液裡完全沒有水，所以質量才會減少。" }
    ]
  },
  {
    id: "q09", section: "checkpoint3", concept: "animal_cell_concentration_change", misconception: "animal_cell_wall_confusion",
    prompt: "把紅血球放進濃食鹽水中，紅血球會有什麼變化？",
    answer: "shrink", hint: "濃食鹽水比紅血球內部濃還是稀？水分會往哪一側移動？",
    image: assets.animalCellImage, imageAlt: "紅血球在三種不同溶液中的外形", imageEvidence: "這三個紅血球放在不同的溶液中，比較它們的外形。",
    options: [
      { id: "shrink", text: "水分離開紅血球，紅血球皺縮。" }, { id: "swell", text: "水分大量進入紅血球，紅血球脹大。" }, { id: "same", text: "食鹽水不會影響紅血球，外形不變。" }, { id: "wall", text: "細胞壁會撐住紅血球，所以不會變形。" }
    ]
  },
  {
    id: "q10", section: "checkpoint3", concept: "animal_cell_concentration_change", misconception: "animal_cell_wall_confusion",
    prompt: "把紅血球放進清水中，紅血球會有什麼變化？",
    answer: "swell", hint: "清水比紅血球內部濃還是稀？紅血球有沒有細胞壁？",
    options: [
      { id: "swell", text: "水分進入紅血球，紅血球膨脹甚至破裂。" }, { id: "shrink", text: "水分離開紅血球，紅血球皺縮變小。" }, { id: "wall", text: "紅血球有細胞壁保護，外形完全不變。" }, { id: "no_water", text: "清水裡的水分子不會移動，所以不變。" }
    ]
  },
  {
    id: "q11", section: "checkpoint3", concept: "plant_cell_concentration_change", misconception: "plant_cell_burst_like_animal",
    prompt: "把植物細胞放進清水中，水分進入細胞後會怎樣？",
    answer: "wall_support", hint: "植物細胞有什麼構造是紅血球沒有的？",
    image: assets.plantCellImage, imageAlt: "植物細胞在三種不同溶液中的樣子", imageEvidence: "比較三個細胞的細胞壁，和裡面部分的大小。",
    options: [
      { id: "wall_support", text: "細胞會膨脹，但有細胞壁支撐，不容易破裂。" }, { id: "burst", text: "細胞會像紅血球一樣膨脹，然後立刻破裂。" }, { id: "no_water", text: "細胞膜完全不讓水通過，所以細胞不變。" }, { id: "wall_blocks", text: "細胞壁擋住水分，水分完全不能進入。" }
    ]
  },
  {
    id: "q12", section: "checkpoint3", concept: "plant_cell_concentration_change", misconception: "plasmolysis_unknown",
    prompt: "把植物細胞放進濃食鹽水中，在顯微鏡下會看到什麼？",
    answer: "plasmolysis", hint: "水分離開後，細胞壁和細胞內部，哪一個比較容易縮小？",
    options: [
      { id: "plasmolysis", text: "細胞內部縮小，細胞膜可能和細胞壁分開。" }, { id: "wall_gone", text: "細胞壁被食鹽溶解，整個細胞壁消失。" }, { id: "chloroplast_nucleus", text: "葉綠體吸收鹽分後，全部變成細胞核。" }, { id: "only_in", text: "水分只會進入細胞，細胞變得更飽滿。" }
    ]
  },
  {
    id: "q13", section: "checkpoint3", concept: "osmosis", misconception: "direction_by_water_amount_only",
    prompt: "小華說：「水一定往水比較多的地方移動，不用看溶液濃度。」哪一個說法才正確？",
    answer: "solute", hint: "回想清水和濃糖水那一題，水分是往哪一側移動？",
    options: [
      { id: "solute", text: "要比較半透膜兩側溶液的濃度，水分會往較濃的一側移動。" }, { id: "no_pass", text: "水分完全不能通過半透膜，所以兩側都不會改變。" }, { id: "always_stop", text: "只要兩側都有水，水分就會平均分布、停止移動。" }, { id: "color_only", text: "溶液濃度只會影響顏色，和水分移動方向無關。" }
    ]
  },
  {
    id: "q14", section: "checkpoint3", concept: "cell_membrane_selectivity", misconception: "cell_membrane_all_or_none",
    prompt: "小美說：「細胞膜控制物質進出，所以任何物質都不能通過。」哪一個說法才正確？",
    answer: "selective", hint: "如果細胞完全不能和外界交換物質，還能活下去嗎？",
    options: [
      { id: "selective", text: "細胞膜有選擇性，有些物質能通過、有些不能。" }, { id: "none", text: "細胞膜讓所有物質都完全不能通過，這句話對。" }, { id: "plant_only", text: "只有植物細胞有細胞膜，動物細胞沒有細胞膜。" }, { id: "color", text: "細胞膜的工作只是讓細胞有顏色，和進出無關。" }
    ]
  }
];

const sectionMap = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q08"],
  checkpoint3: ["q09", "q10", "q11", "q12", "q13", "q14"]
};

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  attempt_session_id: "",
  remote_completed_attempts: 0,
  remote_previous_attempt_id: "",
  remote_previous_accuracy: null,
  attempt_id: "",
  attempt_session_token: "",
  question_version: "",
  session_expires_at: "",
  cumulative_badges: [],
  cumulative_total_exp: 0,
  completed_unit_count: 0,
  started_at: null,
  completedScreens: ["login", "rules"],
  answers: { reflection: {} },
  hints: {},
  checkedWrong: {},
  interactions: {},
  optionOrders: {},
  activeSimulator: "diffusion",
  result: null,
  submitted_at: null,
  lockNotice: "",
  backend_status: ""
};
let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    const next = saved ? { ...clone(defaultState), ...saved, answers: { ...clone(defaultState.answers), ...(saved.answers || {}) }, interactions: { ...(saved.interactions || {}) } } : clone(defaultState);
    delete next.answers.q07_sequence;
    delete next.hints.q07;
    delete next.checkedWrong.q07;
    delete next.interactions.q07;
    return next;
  }
  catch { return clone(defaultState); }
}
function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function saveAttempt(attempt) {
  const all = JSON.parse(localStorage.getItem(attemptsKey) || "[]");
  const withoutSame = all.filter((item) => item.attempt_id !== attempt.attempt_id);
  withoutSame.push(attempt);
  localStorage.setItem(attemptsKey, JSON.stringify(withoutSame));
}
function savePending(payload) {
  const queue = JSON.parse(localStorage.getItem(pendingQueueKey) || "[]");
  queue.push({ ...payload, queued_at: new Date().toISOString() });
  localStorage.setItem(pendingQueueKey, JSON.stringify(queue));
}
function studentAttempts(studentId) {
  return JSON.parse(localStorage.getItem(attemptsKey) || "[]")
    .filter((item) => item?.student?.student_id === studentId && item?.mission?.unit_id === mission.unit_id);
}
function previousBestCredited() {
  if (!state.student) return 0;
  return studentAttempts(state.student.student_id).reduce((best, item) => Math.max(best, Number(item.unit_credited_exp || 0)), 0);
}
function previousBestAccuracy() {
  if (!state.student) return null;
  const attempts = studentAttempts(state.student.student_id);
  const localBest = attempts.length ? Math.max(...attempts.map((item) => Number(item.accuracy || 0))) : null;
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
  state.cumulative_badges = parseArray(progress.badges_json || progress.badges || state.cumulative_badges);
  state.cumulative_total_exp = Number(progress.total_exp ?? progress.total_credited_exp ?? state.cumulative_total_exp ?? 0);
  state.completed_unit_count = Number(progress.completed_unit_count ?? state.completed_unit_count ?? 0);
  if (state.student) {
    state.student.progress = { ...(state.student.progress || {}), ...progress };
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id || "";
    state.student.current_title = progress.current_title || state.student.current_title || "";
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path || "";
    state.student.profile_gender = progress.profile_gender || state.student.profile_gender || "";
    state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
  }
}
function questionById(qid) { return questions.find((question) => question.id === qid); }
function activeQuestionIds() { return [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3]; }
function activeRawAnswers() {
  const raw = { reflection: clone(state.answers.reflection || {}) };
  activeQuestionIds().forEach((qid) => { raw[qid] = state.answers[qid]; });
  return raw;
}
function shuffle(ids) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function orderedOptions(question) {
  if (!state.optionOrders[question.id]) state.optionOrders[question.id] = shuffle(question.options.map((option) => option.id));
  return state.optionOrders[question.id].map((id) => question.options.find((option) => option.id === id));
}
function unlock(...screens) {
  screens.forEach((item) => { if (!state.completedScreens.includes(item)) state.completedScreens.push(item); });
}
function isLockedScreen(next) { return Boolean(state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(next)); }
function redirectLockedAttempt() { state.lockNotice = LOCK_MESSAGE; state.screen = "result"; saveState(); }
function resetForRelogin() {
  state = clone(defaultState);
  saveState();
  render();
}
function setScreen(next) {
  if (isLockedScreen(next)) redirectLockedAttempt();
  else { state.screen = next; saveState(); }
  render();
}
function renderNav() {
  navButtons.forEach((button) => {
    const target = button.dataset.nav;
    const locked = isLockedScreen(target);
    button.disabled = !state.completedScreens.includes(target) || locked;
    button.classList.toggle("active", state.screen === target);
    button.onclick = () => {
      if (target === "login" && state.submitted_at) { resetForRelogin(); return; }
      if (locked) { redirectLockedAttempt(); render(); return; }
      if (!button.disabled) setScreen(target);
    };
  });
}
function renderStudentMini() {
  studentMini.innerHTML = state.student
    ? `<p><strong>${state.student.student_name}</strong></p><p class="muted">${state.student.class_name}｜${state.student.student_id}</p>`
    : "<p class=\"muted\">尚未登入</p>";
}
function normalizeTitleAvatarPath(rawPath = "") {
  const value = String(rawPath || "").trim();
  if (!value) return assets.titleAvatarFallback;
  if (/^(https?:|data:|\/|\.\/|\.\.\/)/.test(value)) return value;
  if (value.startsWith("shared-assets/")) return `../${value}`;
  return value;
}
function titleAvatarPath() {
  return normalizeTitleAvatarPath(state.student?.title_avatar_path || state.student?.progress?.title_avatar_path);
}
function owlPanel(image, alt = "貓頭鷹助理") { return `<div class="owl-frame"><img src="${image}" alt="${alt}" onerror="this.closest('.owl-frame').hidden=true"></div>`; }

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return `<div class="wide-layout"><div class="panel">
    <p class="eyebrow">生命祕境 BioQuest</p><h2 class="hero-title">任務登入</h2>
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>cell_transport</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
    <div class="form-grid"><label>學號<input id="studentIdInput" value="${value}" placeholder="例如 115001" autocomplete="off"></label></div>
    <div class="actions"><button class="primary" id="loginButton">登入任務</button><button class="secondary" id="guestButton">老師測試 guest</button><button class="ghost" id="resetButton">清除本機測試紀錄</button></div><div id="loginMessage" class="status-line"></div>
  </div></div>`;
}
async function fetchStudentStatus(id) {
  const response = await fetch(`${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
}
async function postBackendAction(action, payload) {
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => body.set(key, typeof value === "object" ? JSON.stringify(value) : String(value ?? "")));
  const response = await fetch(`${BACKEND_URL}?action=${encodeURIComponent(action)}&_=${Date.now()}`, { method: "POST", body, cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || `${action}_failed`);
  return data;
}
function startAttemptSession(studentId) {
  return postBackendAction("startAttempt", { student_id: studentId, unit_id: mission.unit_id });
}
function validServerSession(session) {
  return session?.verification_mode === "server_verified"
    && session.attempt_id
    && session.attempt_session_id
    && session.attempt_session_token
    && session.question_version === QUESTION_VERSION;
}
function normalizeBackendStudent(data, id) {
  if (!data?.ok) return null;
  const source = data.student || data;
  return {
    student_id: source.student_id || id, class_name: source.class_name || source.class || "未設定", seat_no: source.seat_no || source.seat || "00",
    student_name: source.student_name || source.name || "未設定", profile_gender: source.profile_gender || source.gender || "",
    current_title_id: source.current_title_id || "", current_title: source.current_title || "", title_avatar_path: source.title_avatar_path || "",
    title_avatar_variant: source.title_avatar_variant || "", total_exp: Number(source.total_exp || 0), is_guest: id === "guest" || Boolean(source.is_guest)
  };
}
async function login(id) {
  const message = document.querySelector("#loginMessage");
  if (!id) { message.innerHTML = "<span class=\"pill warn\">請輸入學號。</span>"; return; }
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
    state.question_version = QUESTION_VERSION;
    state.backend_status = "local_guest";
    unlock("brief", "rules", "achievements");
    saveState();
    setScreen("brief");
    return;
  }
  let student; let completed = 0; let remoteProgress = {}; let remoteAttemptStatus = {};
  try {
    const data = await fetchStudentStatus(id);
    student = normalizeBackendStudent(data, id);
    if (!student) {
      window.BioQuestLoginUX?.end();
      message.innerHTML = `<span class="pill warn">${data?.message || "查無此學號，請重新輸入。"}</span>`;
      return;
    }
    remoteProgress = data.progress || data.student_progress || {};
    remoteAttemptStatus = data.attempt_status || {};
    completed = Number(remoteAttemptStatus.completed_attempt_count ?? data.completed_attempts ?? 0);
    const session = await startAttemptSession(student.student_id);
    if (!validServerSession(session)) {
      throw new Error(session?.verification_mode === "pending_canonical_registry" || session?.question_version === "pending_registry" ? "backend_registry_not_ready" : "backend_session_not_ready");
    }
    state = clone(defaultState);
    state.student = { ...student, progress: remoteProgress };
    state.remote_completed_attempts = completed;
    state.attempt_type = session.attempt_type || (completed > 0 ? "retry" : "first");
    state.started_at = session.issued_at || new Date().toISOString();
    state.attempt_id = session.attempt_id;
    state.attempt_session_id = session.attempt_session_id;
    state.attempt_session_token = session.attempt_session_token;
    state.question_version = session.question_version;
    state.session_expires_at = session.expires_at || "";
    state.remote_previous_attempt_id = session.previous_attempt_id || remoteAttemptStatus.previous_attempt_id || remoteAttemptStatus.latest_attempt_id || remoteProgress.latest_attempt_id || "";
  } catch (error) {
    window.BioQuestLoginUX?.end();
    const text = String(error?.message || error);
    const detail = text.includes("backend_registry_not_ready")
      ? "後台版本尚未更新，請通知老師。"
      : "後台目前無法連線或安全任務憑證無法建立，尚未登入。請檢查網路後重試或通知老師。";
    message.innerHTML = `<span class="pill warn">${detail}</span>`;
    return;
  }
  const remoteAccuracy = remoteAttemptStatus.previous_accuracy ?? remoteAttemptStatus.best_accuracy;
  state.remote_previous_accuracy = remoteAccuracy === null || remoteAccuracy === undefined || remoteAccuracy === "" ? null : Number.isFinite(Number(remoteAccuracy)) ? Number(remoteAccuracy) : null;
  state.cumulative_badges = parseArray(remoteProgress.badges_json || remoteProgress.badges);
  state.cumulative_total_exp = Number(remoteProgress.total_exp ?? remoteProgress.total_credited_exp ?? 0);
  state.completed_unit_count = Number(remoteProgress.completed_unit_count || 0);
  unlock("brief", "rules", "achievements");
  saveState();
  setScreen("brief");
}
function attachLogin() {
  document.querySelector("#loginButton").addEventListener("click", () => login(document.querySelector("#studentIdInput").value.trim()));
  document.querySelector("#guestButton").addEventListener("click", () => login("guest"));
  document.querySelector("#resetButton").addEventListener("click", () => { localStorage.removeItem(storageKey); localStorage.removeItem(attemptsKey); state = clone(defaultState); render(); });
}

function renderBrief() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務簡報</p><h2>細胞邊界通行任務</h2>
    <figure class="brief-scene transport-scene bq-brief-scene-stage" data-briefing-scene-hook="${assets.briefingSceneHook}" data-ambient-background-hook="${assets.ambientBackgroundHook}" data-bq-brief-dual-role="true">
      <picture class="bq-brief-scene-media">
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="阿澤老師在細胞邊界通行任務研究站，引導學生判斷物質進出細胞">
      </picture>
      <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
    </figure>
    <div class="scene-copy bq-brief-scene-caption"><h3>微觀研究站偵測到濃度異常</h3><p>有些粒子慢慢散開，有些細胞在不同溶液中改變外形。請用擴散和滲透的觀念，解釋這些變化是怎麼發生的。</p></div>
    <div class="mission-hud"><div><span>任務區</span><strong>微觀研究站</strong></div><div><span>重點</span><strong>擴散與滲透</strong></div><div><span>實驗</span><strong>馬鈴薯與紅血球</strong></div></div>
    <div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div></div></div>`;
}
function renderScan() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的複習</h2>
    ${owlPanel(assets.owlPrep, "細胞通行任務提醒貓頭鷹")}
    <div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>每次先確認追蹤的是水還是其他物質，再看是否有半透膜，最後比較兩側濃度。</p></div>
    <div class="card-grid"><div class="concept-card"><strong>擴散</strong><p>粒子常由濃度較高處往較低處移動。</p></div><div class="concept-card"><strong>滲透</strong><p>水分通過半透膜時，要比較兩側溶液濃度。</p></div><div class="concept-card"><strong>細胞膜</strong><p>細胞膜調控物質進出，不是完全開放或封閉。</p></div><div class="concept-card"><strong>動物細胞</strong><p>沒有細胞壁，水分進出時外形較容易改變。</p></div><div class="concept-card"><strong>植物細胞</strong><p>有細胞壁支撐，高濃度時內部仍可能縮小。</p></div><div class="concept-card"><strong>實驗結果</strong><p>質量增加常表示水分進入，減少常表示水分離開。</p></div></div>
    <div class="actions"><button class="primary" id="scanNext">開始關卡</button></div></div></div>`;
}

function selectedClass(question, option) {
  const selected = state.answers[question.id] === option.id;
  if (state.checkedWrong[question.id] && selected && option.id === question.answer) return " selected correct";
  if (state.checkedWrong[question.id] && selected && option.id !== question.answer) return " selected wrong";
  return selected ? " selected" : "";
}
function renderQuestionImage(question) {
  if (!question.image) return "";
  return `<figure class="question-visual"><div class="question-image-wrap"><img src="${question.image}" alt="${question.imageAlt || "題目附圖"}"></div><figcaption>${question.imageEvidence || "請仔細看圖再作答。"}</figcaption></figure>`;
}
function renderQuestionData(question) {
  if (!question.dataTable) return "";
  return `<div class="data-table-wrap"><table class="evidence-table"><caption>馬鈴薯條泡在溶液前後的質量</caption><thead><tr><th scope="col">溶液</th><th scope="col">放入前</th><th scope="col">30 分鐘後</th><th scope="col">質量變化</th></tr></thead><tbody>${question.dataTable.map((row) => {
    const before = Number.parseFloat(row.before);
    const after = Number.parseFloat(row.after);
    const delta = after - before;
    return `<tr><th scope="row">${row.sample}</th><td>${row.before}</td><td>${row.after}</td><td>${delta > 0 ? "+" : ""}${delta.toFixed(1)} g</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function renderChoiceQuestion(qid) {
  const question = questionById(qid);
  return `<div class="question-card" data-question-id="${qid}"><h3>${question.prompt}</h3>${renderQuestionImage(question)}${renderQuestionData(question)}<div class="choice-grid">${orderedOptions(question).map((option) => `<button class="choice-button${selectedClass(question, option)}" data-choice="${qid}" data-value="${option.id}">${option.text}</button>`).join("")}</div><p class="selected-answer">${state.answers[qid] ? `已選：${question.options.find((option) => option.id === state.answers[qid])?.text || ""}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${question.hint}</div>` : ""}</div>`;
}
function renderCheckpoint1() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡一</p><h2>擴散、滲透與半透膜</h2><div class="question-grid">${sectionMap.checkpoint1.map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`; }
function renderCheckpoint2() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡二</p><h2>物質移動的方向</h2><div class="question-grid">${sectionMap.checkpoint2.map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`; }
function renderCheckpoint3() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">關卡三</p><h2>細胞在不同溶液中的變化</h2><div class="cell-change-strip"><div class="change-card animal"><strong>紅血球</strong><span>沒有細胞壁</span></div><div class="change-card plant"><strong>植物細胞</strong><span>有細胞壁支撐</span></div><div class="change-card data"><strong>清水和濃食鹽水</strong><span>先比較細胞內外哪一邊比較濃</span></div></div><div class="question-grid">${sectionMap.checkpoint3.map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`; }

function isCorrect(qid) {
  const question = questionById(qid);
  return state.answers[qid] === question?.answer;
}
function isAnswered(qid) {
  return Boolean(state.answers[qid]);
}
function allRequiredAnswered() {
  return activeQuestionIds().every(isAnswered);
}
async function markHint(qid) {
  if (state.hints[qid]) {
    state.checkedWrong[qid] = true;
    return true;
  }
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
    return true;
  } catch (error) {
    window.alert("提示紀錄暫時無法寫入，為避免成就誤判，請重新登入或稍後再試。");
    return false;
  }
}
async function checkSection(section) {
  const unanswered = sectionMap[section].filter((qid) => !isAnswered(qid));
  if (unanswered.length) {
    const message = document.querySelector("#sectionMessage");
    if (message) message.innerHTML = `<span class="pill warn">請先完成本區 ${unanswered.length} 題必答內容；不要求全對。</span>`;
    return;
  }
  const wrong = sectionMap[section].filter((qid) => !isCorrect(qid));
  const newlyHinted = wrong.filter((qid) => !state.hints[qid]);
  if (newlyHinted.length) {
    for (const qid of newlyHinted) {
      const recorded = await markHint(qid);
      if (!recorded) return;
    }
    saveState(); render();
    const message = document.querySelector("#sectionMessage");
    if (message) message.innerHTML = `<span class="pill warn">已顯示 ${newlyHinted.length} 題概念提示；同一題只提示一次。可調整答案，也可保留本次作答再按一次前進。</span>`;
    return;
  }
  const next = section === "checkpoint1" ? "checkpoint2" : section === "checkpoint2" ? "checkpoint3" : "review";
  if (next === "review") state.result = calculateResult();
  unlock(next); saveState(); setScreen(next);
}
function attachQuestionEvents() {
  document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", async () => {
    const question = questionById(button.dataset.choice);
    state.answers[question.id] = button.dataset.value;
    state.interactions[question.id] = true;
    if (button.dataset.value !== question.answer) {
      const recorded = await markHint(question.id);
      if (!recorded) return;
    }
    saveState(); render();
  }));
  const checkButton = document.querySelector("#checkSection");
  if (checkButton) checkButton.addEventListener("click", () => checkSection(checkButton.dataset.section));
}

function evaluateReflectionQuality(reflection) {
  return window.BioQuestReflectionQuality.evaluate(reflection, reflectionRules);
}
function questionConcept(qid) { return questionById(qid)?.concept || "unknown"; }
function questionMisconception(qid) { return questionById(qid)?.misconception || "unknown"; }
function answerDescription(qid) {
  const map = {
    q03: "水分主要往濃糖水一側移動",
    q09: "水分離開細胞，紅血球可能皺縮",
    q10: "水分進入細胞，紅血球可能膨脹甚至破裂",
    q13: "判斷滲透要比較半透膜兩側溶液濃度差"
  };
  if (map[qid]) return map[qid];
  const question = questionById(qid);
  return question?.options?.find((option) => option.id === question.answer)?.text || "";
}
function sectionStat(title, qids) {
  const correct = qids.filter(isCorrect);
  return { title, correct: correct.length, total: qids.length, correct_without_hint: correct.filter((qid) => !state.hints[qid]).length, corrected_after_hint: correct.filter((qid) => state.hints[qid]).length };
}
function conceptMastery(qids) {
  return qids.reduce((map, qid) => {
    const concept = questionConcept(qid); if (!map[concept]) map[concept] = { correct: 0, total: 0, used_hint: false };
    map[concept].total += 1; if (isCorrect(qid)) map[concept].correct += 1; if (state.hints[qid]) map[concept].used_hint = true; return map;
  }, {});
}
function calculateResult() {
  const qids = activeQuestionIds();
  const correctIds = qids.filter(isCorrect); const total = qids.length; const correct = correctIds.length;
  const hintUsed = Object.values(state.hints).filter(Boolean).length;
  const direct = correctIds.filter((qid) => !state.hints[qid]).length;
  const revised = correctIds.filter((qid) => state.hints[qid]).length;
  const directExp = Math.round(DIRECT_EXP_POOL * (direct / total));
  const revisionExp = Math.round(REVISION_EXP_POOL * (revised / total));
  const reflectionEval = evaluateReflectionQuality(state.answers.reflection || {});
  const accuracy = correct / total;
  const masteryExp = accuracy === 1 && hintUsed === 0 ? 140 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const previousAccuracy = previousBestAccuracy();
  const completionExp = allRequiredAnswered() ? 100 : 0;
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, reflectionEval.question_exp)));
  const baseExp = Math.min(reflectionLedgerCap, completionExp + directExp + revisionExp + reflectionEval.question_exp + masteryExp);
  const retryCandidate = state.attempt_type === "retry" && previousAccuracy !== null && accuracy > previousAccuracy ? Math.min(60, Math.round((accuracy - previousAccuracy) * 100)) : 0;
  const retryExp = Math.min(retryCandidate, Math.max(0, reflectionLedgerCap - baseExp));
  const attemptTotalExp = Math.min(reflectionLedgerCap, baseExp + retryExp);
  const previousCredited = previousBestCredited();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(previousCredited, attemptTotalExp));
  const stats = [sectionStat("擴散、滲透與半透膜", sectionMap.checkpoint1), sectionStat("濃度方向與資料判讀", sectionMap.checkpoint2), sectionStat("細胞環境變化", sectionMap.checkpoint3)];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? ["cell_transport_entry"] : [];
  if (["q01", "q02", "q05"].filter(isCorrect).length / 3 >= .85) earned.push("diffusion_direction_judge");
  if (["q03", "q13"].filter(isCorrect).length / 2 >= .85) earned.push("osmosis_flow_mapper");
  if (["q04", "q06", "q14"].filter(isCorrect).length / 3 >= .85) earned.push("semipermeable_membrane_keeper");
  if (["q05", "q08"].every(isCorrect)) earned.push("concentration_data_reader");
  if (["q09", "q10", "q11", "q12"].filter(isCorrect).length / 4 >= .85) earned.push("cell_change_explainer");
  if (correctIds.some((qid) => state.hints[qid] && ["diffusion", "osmosis", "semipermeable_membrane", "concentration_gradient"].includes(questionConcept(qid)))) earned.push("transport_misconception_reviser");
  if (accuracy === 1 && hintUsed === 0) earned.push("cell_transport_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("cell_transport_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_cell_transport");
  return {
    unit_exp_cap: UNIT_EXP_CAP, completion_exp: completionExp, concept_exp: directExp, revision_exp: revisionExp, question_exp: reflectionEval.question_exp,
    ...reflectionEval,
    mastery_exp: masteryExp, retry_exp: retryExp, attempt_total_exp: attemptTotalExp, unit_credited_exp: unitCreditedExp, credited_delta: Math.max(0, unitCreditedExp - previousCredited),
    correct, total, accuracy, hint_used: hintUsed, correct_without_hint: direct, corrected_after_hint: revised, previous_accuracy: previousAccuracy, accuracy_delta: previousAccuracy === null ? null : accuracy - previousAccuracy,
    section_stats: stats, misconceptions, concept_mastery_tags_json: conceptMastery(qids), badges: [...new Set(earned)], cumulative_badges_candidate: cumulativeBadgeIds(earned), no_hint_perfect: accuracy === 1 && hintUsed === 0, all_required_answered: allRequiredAnswered(),
    teacher_attention_needed: Number(state.answers.reflection.confidence_score || 3) <= 2 || accuracy < .6 || reflectionEval.reflection_review_status === "pending_review" || misconceptions.length >= 3
  };
}
function scoreForConcept(attempt, ...concepts) {
  const rows = concepts.map((concept) => attempt.concept_mastery_tags_json?.[concept]).filter(Boolean);
  const total = rows.reduce((sum, row) => sum + row.total, 0); const correct = rows.reduce((sum, row) => sum + row.correct, 0);
  return total ? Math.round((correct / total) * 100) : 0;
}
function misconceptionText(tag) {
  const map = {
    diffusion_requires_cell_membrane: "建議再閱讀擴散：擴散不一定需要細胞膜，重點是粒子受濃度差影響。",
    diffusion_osmosis_confusion: "建議再比較擴散與滲透：滲透特別強調水分通過半透膜。",
    semipermeable_as_wall: "建議再確認半透膜：它不是完全封閉，而是讓某些物質通過、限制另一些物質通過。",
    direction_by_water_amount_only: "建議再練習方向判斷：比較兩側溶液濃度，不要只看水量或容器大小。",
    diffusion_direction_by_solute_concentration: "建議再複習擴散方向：先看題目問的是哪一種物質，再比較它在細胞內外的濃度；擴散是由濃度高處往濃度低處移動。",
    cell_membrane_all_or_none: "建議再理解細胞膜選擇性通透：不是完全開放，也不是完全封閉。",
    animal_cell_wall_confusion: "建議再比較動物與植物細胞：紅血球沒有細胞壁，外形較容易受水分進出影響。",
    plant_cell_burst_like_animal: "建議再確認植物細胞壁的支撐作用：在清水中通常較膨脹，但不容易像動物細胞那樣破裂。",
    plasmolysis_unknown: "建議再閱讀植物細胞在高濃度環境的變化：細胞內部縮小，細胞壁仍在。",
    data_not_evidence: "建議再看一次馬鈴薯實驗：質量增加常表示水分進入，減少常表示水分離開。"
  };
  return map[tag] || "建議再把擴散、滲透、半透膜和細胞的變化連在一起複習。";
}
function renderReview() {
  const result = calculateResult(); const stable = result.section_stats.filter((item) => item.correct / item.total >= .85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>這次的學習回饋</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理主要概念。</p>"}</div><div class="story-panel"><strong>建議再閱讀理解</strong>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>課堂提問方向</strong><p>擴散與滲透的差異、半透膜、水分方向、細胞膜選擇性通透、紅血球與植物細胞變化、質量資料判讀。</p></div></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}
function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；具體且與擴散、滲透、半透膜、濃度差或細胞變化相關的問題，可取得回報 EXP。</p></div><div class="form-grid"><label>這次任務中，我最能掌握的一項物質進出細胞概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定擴散、滲透、半透膜、濃度差或細胞變化中的哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個希望老師課堂解釋的方向，並用自己的話補充<span class="field-help">方向詞可以參考，但不要直接複製。</span><textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1, 2, 3, 4, 5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div></div>`;
}
function buildAttempt() {
  const now = new Date().toISOString();
  const qids = activeQuestionIds();
  return { attempt_id: state.attempt_id || state.attempt_session_id, timestamp: now, student: state.student, mission, attempt_type: state.attempt_type, attempt_type_candidate: state.attempt_type, attempt_no: Number(state.remote_completed_attempts || 0) + 1, attempt_session_id: state.attempt_session_id, attempt_session_token: state.attempt_session_token, question_version: state.question_version || QUESTION_VERSION, started_from_login: true, previous_attempt_id: previousAttemptId(), retry_validation_status: state.attempt_type === "retry" ? "pending_backend_validation" : "not_retry", started_at: state.started_at, submitted_at: state.submitted_at || now, completion_status: "complete", required_answer_count: qids.length, answered_required_count: qids.filter(isAnswered).length, backend_status: state.backend_status, ...state.result, confidence_score: state.answers.reflection.confidence_score, confident_concept: state.answers.reflection.confident_concept, uncertain_concept: state.answers.reflection.uncertain_concept, student_question: state.answers.reflection.student_question, raw_answers: activeRawAnswers(), payload_version: VERSION };
}
function buildBackendPayload(attempt) {
  const qids = activeQuestionIds();
  return {
    attempt_id: attempt.attempt_id, student_id: attempt.student.student_id, student_name: attempt.student.student_name, class_name: attempt.student.class_name, seat_no: attempt.student.seat_no,
    unit_id: mission.unit_id, unit_title: mission.unit_title, mission_title: mission.mission_title, attempt_type: attempt.attempt_type, attempt_type_candidate: attempt.attempt_type_candidate, attempt_no_candidate: attempt.attempt_no, attempt_session_id: attempt.attempt_session_id, attempt_session_token: attempt.attempt_session_token, question_version: attempt.question_version, started_from_login: attempt.started_from_login, previous_attempt_id: attempt.previous_attempt_id, retry_validation_status: attempt.retry_validation_status, completion_status: attempt.completion_status, required_answer_count: attempt.required_answer_count, answered_required_count: attempt.answered_required_count, all_required_answered: attempt.all_required_answered, started_at: attempt.started_at, submitted_at: attempt.submitted_at,
    total_questions: attempt.total, correct: attempt.correct, accuracy: attempt.accuracy, hints_used: attempt.hint_used, correct_without_hint: attempt.correct_without_hint, corrected_after_hint: attempt.corrected_after_hint,
    completion_exp: attempt.completion_exp, concept_exp: attempt.concept_exp, revision_exp: attempt.revision_exp, question_exp: attempt.question_exp, mastery_exp: attempt.mastery_exp, retry_exp: attempt.retry_exp,
    attempt_total_exp: attempt.attempt_total_exp, unit_exp_cap: attempt.unit_exp_cap, unit_credited_exp: attempt.unit_credited_exp, credited_delta: attempt.credited_delta, no_hint_perfect: attempt.no_hint_perfect,
    confidence_score: attempt.confidence_score, reflection_quality: attempt.reflection_quality, reflection_quality_candidate: attempt.reflection_quality_candidate, reflection_exp_reason: attempt.reflection_exp_reason, reflection_review_status: attempt.reflection_review_status, reflection_original_text: attempt.reflection_original_text, reflection_normalized_text: attempt.reflection_normalized_text, reflection_similarity_score: attempt.reflection_similarity_score, reflection_similarity_source: attempt.reflection_similarity_source, reflection_copied_direction_flag: attempt.reflection_copied_direction_flag, reflection_irrelevant_flag: attempt.reflection_irrelevant_flag, reflection_low_effort_flag: attempt.reflection_low_effort_flag, reflection_examples_checked: attempt.reflection_examples_checked, reflection_frontend_only: true,
    teacher_attention_needed: attempt.teacher_attention_needed, student_question: attempt.student_question,
    diffusion_direction_score: scoreForConcept(attempt, "diffusion"), osmosis_flow_score: scoreForConcept(attempt, "osmosis"), semipermeable_membrane_score: scoreForConcept(attempt, "semipermeable_membrane", "cell_membrane_selectivity"), concentration_data_score: scoreForConcept(attempt, "concentration_gradient", "evidence_based_prediction"), cell_change_explanation_score: scoreForConcept(attempt, "animal_cell_concentration_change", "plant_cell_concentration_change"), diffusion_osmosis_compare_score: scoreForConcept(attempt, "diffusion", "osmosis"),
    misconceptions_json: JSON.stringify(attempt.misconceptions), raw_answers_json: JSON.stringify(attempt.raw_answers), badges_json: JSON.stringify(attempt.badges), existing_badges_json: JSON.stringify(cumulativeBadgeIds()), cumulative_badges_candidate_json: JSON.stringify(attempt.cumulative_badges_candidate), badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: qids.map((qid) => ({ question_id: `${mission.unit_id}_${qid}`, question_version: attempt.question_version, question_type: "choice", skill_tag: questionConcept(qid), concept_id: questionConcept(qid), checkpoint_id: questionById(qid)?.section, is_correct: isCorrect(qid), hint_used: Boolean(state.hints[qid]), used_hint: Boolean(state.hints[qid]), attempt_answer: JSON.stringify(state.answers[qid]), answer_json: JSON.stringify(state.answers[qid]), correct_answer: questionById(qid)?.answer, answer_description: answerDescription(qid), exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept", exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total) }))
  };
}
async function submitAttemptToBackend(attempt) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  const body = new URLSearchParams(); body.set("payload", JSON.stringify(buildBackendPayload(attempt)));
  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, { method: "POST", body });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json(); if (!data.ok) throw new Error(data.error || "backend_submit_failed"); return data;
}
function attachReflection() {
  document.querySelector("#submitMission").addEventListener("click", async (event) => {
    if (state.submitted_at) { setScreen("result"); return; }
    if (!allRequiredAnswered()) { window.alert("請先完成所有必答題，再提交完整任務。"); return; }
    if (!window.confirm("提交後會進行結算，本次作答不能再修改；若要再挑戰，請重新登入並從頭完成。")) return;
    const button = event.currentTarget; button.disabled = true; button.textContent = "送出中...";
    state.answers.reflection = { confident_concept: document.querySelector("#confidentConcept").value.trim(), uncertain_concept: document.querySelector("#uncertainConcept").value.trim(), student_question: document.querySelector("#studentQuestion").value.trim(), confidence_score: Number(document.querySelector("#confidenceScore").value) };
    Object.assign(state.answers.reflection, evaluateReflectionQuality(state.answers.reflection)); state.result = calculateResult(); state.submitted_at = new Date().toISOString();
    let attempt = buildAttempt();
    try {
      const response = await submitAttemptToBackend(attempt);
      state.backend_status = state.student?.is_guest ? "local_guest" : "submitted";
      if (response.verified_attempt) state.result = { ...state.result, ...response.verified_attempt };
      const progress = response.student_progress || response.progress || {};
      if (progress && Object.keys(progress).length) applyBackendProgress(progress);
      attempt = { ...attempt, ...state.result, backend_status: state.backend_status, backend_attempt_id: response.attempt_id || attempt.attempt_id };
    }
    catch {
      state.backend_status = "pending_local";
      attempt = { ...attempt, backend_status: state.backend_status };
      savePending(buildBackendPayload(attempt));
    }
    saveAttempt(attempt); state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + 1; unlock("result", "achievements"); saveState(); setScreen("result");
  });
}
function attemptCreditStatus() {
  if (state.student?.is_guest) return "guest";
  if (state.submitted_at && state.backend_status !== "submitted") return "pending";
  return "verified";
}
function displayExpLedger(result) {
  const values = {
    completion_exp: Number(result.completion_exp || 0),
    concept_exp: Number(result.concept_exp || 0),
    revision_exp: Number(result.revision_exp || 0),
    question_exp: Number(result.question_exp || 0),
    mastery_exp: Number(result.mastery_exp || 0),
    retry_exp: Number(result.retry_exp || 0)
  };
  return { ...values, attempt_total_exp: Math.min(UNIT_EXP_CAP, Object.values(values).reduce((sum, value) => sum + value, 0)) };
}
function titleProgressSummary() {
  const progress = state.student?.progress || {};
  const totalExp = Number(progress.total_exp ?? state.student?.total_exp ?? state.cumulative_total_exp ?? 0) || 0;
  const title = progress.current_title || state.student?.current_title || window.BioQuestTitleProgress?.getTitleForExp?.(totalExp)?.current || "見習調查員";
  const next = progress.next_title || window.BioQuestTitleProgress?.getTitleForExp?.(totalExp)?.next || "下一稱號";
  const remaining = Number(progress.next_title_need_exp ?? window.BioQuestTitleProgress?.getTitleForExp?.(totalExp)?.remaining ?? 0) || 0;
  const percent = Number(progress.title_progress_percent ?? window.BioQuestTitleProgress?.progressPercent?.(totalExp) ?? 0) || 0;
  return { totalExp, title, next, remaining, percent: Math.max(0, Math.min(100, percent)) };
}
function renderTitleProgressSummary() {
  const info = titleProgressSummary();
  const status = attemptCreditStatus();
  const label = status === "verified" ? "正式稱號進度" : status === "guest" ? "guest 稱號預覽" : "待後台確認稱號進度";
  return `<div class="story-panel title-progress-summary"><strong>${label}</strong><p>目前稱號：${info.title}｜累積 ${info.totalExp} EXP</p><div class="title-progress-bar" aria-label="稱號進度 ${Math.round(info.percent)}%"><span style="width:${info.percent}%"></span></div><p class="muted">${status === "verified" ? `下一稱號：${info.next}，還差 ${info.remaining} EXP。` : "正式累積與稱號需待後台確認；guest 不列入正式累積。"}</p></div>`;
}
function resultStatusNotice(result) {
  const status = attemptCreditStatus();
  const ledger = displayExpLedger(result);
  if (status === "guest") return `<div class="feedback warn">guest 測試：本次預估 ${ledger.attempt_total_exp}/${UNIT_EXP_CAP} EXP，不列入正式累積。</div>`;
  if (status === "pending") return `<div class="feedback warn">本次預估 ${ledger.attempt_total_exp}/${UNIT_EXP_CAP} EXP，待後台確認；確認完成前不顯示正式認列或正式累積。</div>`;
  return `<div class="feedback good">本次任務已提交，作答結果已鎖定；後台已回傳正式認列資料。</div>`;
}
function renderResultBadges(result) {
  const earned = new Set(result.badges || []);
  return `<section class="story-panel result-badges"><strong>本次取得徽章</strong><div class="badge-mini-row">${badges.filter((badge) => earned.has(badge.id)).map((badge) => `<img src="${badge.badge_image_path}" alt="${badge.name}" title="${badge.name}">`).join("") || "<span class=\"muted\">本次尚未取得新徽章。</span>"}</div></section>`;
}
function renderResult() {
  const result = state.result || calculateResult();
  const ledger = displayExpLedger(result);
  const status = attemptCreditStatus();
  const creditedLabel = status === "verified" ? "本單元正式認列" : "認列狀態";
  const creditedValue = status === "verified" ? `${Math.min(Number(result.unit_credited_exp || ledger.attempt_total_exp || 0), UNIT_EXP_CAP)} EXP` : status === "guest" ? "guest 不累積" : "待後台確認";
  const deltaValue = status === "verified" ? `${Number(result.credited_delta || 0)} EXP` : status === "guest" ? "guest 不累積" : "待確認";
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>提交後本次作答已鎖定</h2>${state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : ""}${resultStatusNotice(result)}
    <div class="score-grid"><div class="score-box"><span>${status === "verified" ? "本次取得" : "本次預估"}</span><strong>${ledger.attempt_total_exp} EXP</strong></div><div class="score-box"><span>${creditedLabel}</span><strong>${creditedValue}</strong></div><div class="score-box"><span>本次增量</span><strong>${deltaValue}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel" data-exp-ledger-total="${ledger.attempt_total_exp}"><strong>EXP 明細</strong><p>完成 ${ledger.completion_exp}｜直接答對 ${ledger.concept_exp}｜提示後修正 ${ledger.revision_exp}｜回報 ${ledger.question_exp}｜精熟 ${ledger.mastery_exp}｜再挑戰 ${ledger.retry_exp}｜總計 ${ledger.attempt_total_exp}</p></div>
      <div class="story-panel"><strong>${status === "verified" ? "正式認列說明" : "本次預估狀態"}</strong><p>${status === "verified" ? "本單元正式認列會保留最高表現並受 500 EXP 上限限制。" : status === "guest" ? "guest 測試只供老師預覽，不寫入正式 Attempts 或 StudentProgress。" : "本次數字是本機預估，後台確認前不列入正式累積。"}</p></div>
      <div class="story-panel"><strong>回報品質</strong><p>${result.reflection_quality}：${result.reflection_exp_reason}</p><p class="muted">${status === "verified" ? `後台正式認列 ${ledger.question_exp} EXP。` : `本次預估回報 ${ledger.question_exp} EXP，待後台重算。`}</p></div>
    </div>${renderTitleProgressSummary()}${renderResultBadges(result)}<div class="actions"><button class="primary" id="resultAchievements">查看成就</button><button class="secondary" id="resultRules">查看規則</button><button class="secondary" data-relogin-action="true">重新登入，並從登入頁開始</button></div></div></div>`;
}
function renderAchievements() {
  return `<div class="wide-layout achievements-stack" data-bq-achievements-overview-only="true"><div class="panel"><p class="eyebrow">${state.submitted_at ? "再挑戰" : "目前進度"}</p><h2>${state.submitted_at ? "重新登入後開始新的挑戰" : "目前稱號與全冊徽章總覽"}</h2><p class="muted">${state.submitted_at ? "本次作答與結算已鎖定；若要再挑戰，請重新登入並從頭完成。這不會刪除既有正式累積資料。" : "這裡只顯示正式稱號進度與全冊徽章總覽；本單元徽章改在結算頁呈現本次實得。"}</p><div class="actions"><button class="secondary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button>${state.submitted_at ? `<button class="secondary" data-relogin-action="true">重新登入，並從登入頁開始</button>` : ""}</div></div><div class="panel bq-all-unit-badge-overview" data-bq-badge-overview="true"></div></div>`;
}
function renderRules() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務規則</p><h2>EXP、提示與再挑戰</h2><div class="card-grid"><div class="story-panel"><strong>單元上限</strong><p>本單元最高認列 500 EXP。一次零提示全對是最高路徑。</p></div><div class="story-panel"><strong>完成條件</strong><p>回答完所有必答題即可提交，不必先全對；需要調整的概念會保留提示與回饋。</p></div><div class="story-panel"><strong>提示後修正</strong><p>每題第一次錯選會出現一次提示；提示後修正仍有 EXP，但低於直接答對。</p></div><div class="story-panel"><strong>再挑戰</strong><p>提交後本次作答鎖定。若要再挑戰，請重新登入並從頭完成整份任務。</p></div></div><div class="actions"><button class="primary" id="rulesBack">回到任務</button>${state.submitted_at ? `<button class="secondary" data-relogin-action="true">重新登入，並從登入頁開始</button>` : ""}</div></div></div>`;
}
function attachEvents() {
  if (state.screen === "login") attachLogin();
  if (state.screen === "brief") document.querySelector("#briefNext").addEventListener("click", () => { unlock("scan"); setScreen("scan"); });
  if (state.screen === "scan") document.querySelector("#scanNext").addEventListener("click", () => { unlock("checkpoint1"); setScreen("checkpoint1"); });
  if (["checkpoint1", "checkpoint2", "checkpoint3"].includes(state.screen)) attachQuestionEvents();
  if (state.screen === "review") document.querySelector("#reviewNext").addEventListener("click", () => { unlock("reflection"); setScreen("reflection"); });
  if (state.screen === "reflection") attachReflection();
  if (state.screen === "result") { document.querySelector("#resultAchievements").addEventListener("click", () => setScreen("achievements")); document.querySelector("#resultRules").addEventListener("click", () => setScreen("rules")); }
  if (state.screen === "achievements") document.querySelector("#achieveResult").addEventListener("click", () => setScreen(state.submitted_at ? "result" : "brief"));
  if (state.screen === "rules") document.querySelector("#rulesBack").addEventListener("click", () => setScreen(state.student ? (state.submitted_at ? "result" : "brief") : "login"));
  document.querySelectorAll("[data-relogin-action='true']").forEach((button) => button.addEventListener("click", resetForRelogin));
}
function render() {
  if (state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(state.screen)) state.screen = "result";
  renderNav(); renderStudentMini();
  const views = { login: renderLogin, brief: renderBrief, scan: renderScan, checkpoint1: renderCheckpoint1, checkpoint2: renderCheckpoint2, checkpoint3: renderCheckpoint3, review: renderReview, reflection: renderReflection, result: renderResult, achievements: renderAchievements, rules: renderRules };
  screen.dataset.bioquestScreen = state.screen;
  screen.innerHTML = views[state.screen]();
  attachEvents();
  updateBadgeOverviewBridge();
  window.BioQuestCharacterLayout?.enhance?.({ force: true });
}

render();

window.__cellTransportTest = {
  getState: () => clone(state),
  state: () => clone(state),
  resetForRelogin
};
