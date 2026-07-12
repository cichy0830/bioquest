const roster = {
  S70101: { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安", profile_gender: "female" },
  S70102: { student_id: "S70102", class_name: "701", seat_no: "02", student_name: "陳柏宇", profile_gender: "male" },
  S70103: { student_id: "S70103", class_name: "701", seat_no: "03", student_name: "許若晴", profile_gender: "female" },
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", profile_gender: "neutral", is_guest: true }
};

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbws7n-pzOGA7ZaQe044cAA4JElgjVsDTMokXf9ZifKZoGQHRyNSFpuxVppkC8PzZFATqQ/exec";

const mission = {
  unit_id: "scientific_method",
  unit_title: "探究自然的科學方法",
  mission_title: "發霉吐司調查任務",
  mission_area: "科學偵查站"
};

const mentorName = "阿澤老師";
const mentorImages = {
  primary: "assets/mentor-method-azhe-v2.webp"
};
const sceneImages = {
  briefingSceneImage: "assets/bg-scientific-method-briefing-azhe-wide.webp",
  ambientBackgroundImage: "assets/bg-mold-toast-investigation-wide.webp"
};
const owlImages = {
  opening: "assets/owl-method-opening.webp",
  scan: "assets/owl-method-scan.webp",
  feedback: "assets/owl-method-feedback.webp",
  result: "assets/owl-method-result.webp"
};
const TITLE_AVATAR_BASE_PATH = "../shared-assets/title-avatars";
const titleProgressRules = window.BioQuestTitleProgress;
const TITLE_PROGRESS_CAP = titleProgressRules?.titleProgressCap || 23400;
const FULL_BOOK_EXP_MAX = titleProgressRules?.fullBookExpMax || 26000;
const TITLE_LEVELS = titleProgressRules?.levels || [
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
const titleIdAliases = {
  micro_world_explorer: "micro_explorer",
  system_investigator: "systems_investigator",
  life_mystery_guardian: "bioquest_guardian"
};
const titleAvatarImages = TITLE_LEVELS.reduce((images, title) => {
  images[title.id] = {
    male: `${TITLE_AVATAR_BASE_PATH}/title-${title.order}-${title.id}-male.webp`,
    female: `${TITLE_AVATAR_BASE_PATH}/title-${title.order}-${title.id}-female.webp`
  };
  return images;
}, {});
const fallbackTitleAvatarPath = `${TITLE_AVATAR_BASE_PATH}/title-01-trainee_investigator-male.webp`;
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const DIRECT_RAW_MAX = 453;
const REVISION_RAW_MAX = 270;
const badgeAsset = (id) => `../shared-assets/badges/scientific_method/badge-scientific_method-${id}.webp`;

const unitBadgeCatalog = [
  { id: "scientific_method_entry", name: "探究入門徽章", condition: "完成發霉吐司調查任務。" },
  { id: "inquiry_sequence_mapper", name: "探究流程排序徽章", condition: "科學流程與觀察推論關卡達 85% 以上。" },
  { id: "variable_identifier", name: "變因辨識徽章", condition: "操作變因、應變變因、控制變因辨識達 85% 以上。" },
  { id: "control_group_designer", name: "對照設計徽章", condition: "實驗組與對照組判斷達 85% 以上。" },
  { id: "evidence_reasoner", name: "證據推論徽章", condition: "資料判讀與根據證據下結論關卡達 85% 以上。" },
  { id: "scientific_method_flawless", name: "探究零提示全對徽章", condition: "全部答對，且全程未使用提示。本單元最高表現徽章。" },
  { id: "scientific_question_reporter", name: "高品質探究回報徽章", condition: "回報品質達 discussion_question，且未複製系統方向。" },
  { id: "retry_growth_scientific_method", name: "再探證據進步徽章", condition: "再挑戰完整完成，且本次正確率高於前一次完整挑戰。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const storageKey = "bioquest_scientific_method_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  remote_completed_attempts: 0,
  started_at: null,
  completedScreens: ["login", "rules"],
  activeToken: null,
  answers: {
    checkpoint1: { sequence: {}, observation: {} },
    checkpoint1Hints: {},
    checkpoint2: { variables: {} },
    checkpoint2Hints: {},
    checkpoint3: {},
    checkpoint3Hints: {},
    checkpoint4: {},
    checkpoint4Hints: {},
    reflection: {}
  },
  optionOrders: {},
  result: null,
  submitted_at: null,
  lockNotice: ""
};

let state = loadState();

const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

function isLockedScreen(next) {
  return Boolean(state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(next));
}

function redirectLockedAttempt() {
  state.lockNotice = LOCK_MESSAGE;
  state.screen = "result";
  unlock("result", "achievements");
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeLockedScreen() {
  if (!isLockedScreen(state.screen)) return;
  state.lockNotice = LOCK_MESSAGE;
  state.screen = "result";
  unlock("result", "achievements");
  saveState();
}

const sequenceSteps = [
  { id: "observe", label: "觀察現象", order: 1 },
  { id: "question", label: "提出問題", order: 2 },
  { id: "research", label: "參考資料", order: 3 },
  { id: "hypothesis", label: "形成假說", order: 4 },
  { id: "experiment", label: "設計與進行實驗", order: 5 },
  { id: "analyze", label: "分析結果", order: 6 },
  { id: "conclusion", label: "提出結論", order: 7 }
];

const observationItems = [
  { id: "room_95", label: "室溫吐司第十天發霉比例約 95%", answer: "observation", misconception: "inference_as_observation" },
  { id: "fridge_no_mold", label: "冰箱吐司第十天仍未明顯發霉", answer: "observation", misconception: "inference_as_observation" },
  { id: "cold_inhibits", label: "低溫可能抑制黴菌生長", answer: "inference", misconception: "inference_as_observation" },
  { id: "spots_more", label: "吐司上的黑綠色斑點變多", answer: "observation", misconception: "inference_as_observation" }
];

const observationCategories = [
  { id: "observation", title: "觀察：看見或量到的資料" },
  { id: "inference", title: "推論：根據資料提出可能原因" }
];

const variableItems = [
  { id: "temperature", label: "放置溫度", answer: "manipulated", misconception: "variable_confusion" },
  { id: "mold_ratio", label: "吐司發霉比例", answer: "responding", misconception: "variable_confusion" },
  { id: "toast_size", label: "吐司大小", answer: "controlled", misconception: "variable_confusion" },
  { id: "days", label: "觀察天數", answer: "controlled", misconception: "variable_confusion" },
  { id: "bag_type", label: "夾鏈袋種類", answer: "controlled", misconception: "variable_confusion" }
];

const variableCategories = [
  { id: "manipulated", title: "刻意改變的因素" },
  { id: "responding", title: "要測量的結果" },
  { id: "controlled", title: "需要保持相同" }
];

const checkpoint1Choices = [
  {
    id: "testable_question",
    concept_id: "testable_question",
    prompt: "觀察到室溫吐司比冰箱吐司更容易發霉後，下列哪個問題最適合用實驗檢驗？",
    options: ["吐司發霉是否和環境溫度有關？", "吐司為什麼這麼討厭？", "黴菌是不是故意長出來？", "所有食物都一定會在同一天發霉嗎？"],
    answer: "吐司發霉是否和環境溫度有關？",
    hint: "好的科學問題通常能設計比較或測量，不只是情緒或無法驗證的想法。",
    misconception: "untestable_question"
  },
  {
    id: "hypothesis",
    concept_id: "hypothesis",
    prompt: "下列哪個比較像可驗證的假說？",
    options: ["吐司放在低溫處較室溫處不易發霉", "吐司發霉很噁心", "我不喜歡發霉吐司", "所有黴菌都一定怕冰箱"],
    answer: "吐司放在低溫處較室溫處不易發霉",
    hint: "找一個能用實驗資料支持或不支持的合理解釋。",
    misconception: "hypothesis_as_fact"
  }
];

const checkpoint2Choices = [
  {
    id: "mung_water",
    concept_id: "variables",
    prompt: "如果想研究「水分是否影響綠豆發芽」，最可能被刻意改變的因素是什麼？",
    options: ["水分", "綠豆種類", "容器大小", "記錄表顏色"],
    answer: "水分",
    hint: "先找研究主題中被拿來比較的條件，不要先看結果。",
    misconception: "variable_confusion"
  },
  {
    id: "seedling_height",
    concept_id: "variables",
    prompt: "在「光照時間是否影響豆苗生長高度」實驗中，最適合作為要測量的結果是什麼？",
    options: ["豆苗生長高度", "光照時間", "種子種類", "花盆大小"],
    answer: "豆苗生長高度",
    hint: "找實驗後要觀察或測量的結果。",
    misconception: "variable_confusion"
  },
  {
    id: "control_reason",
    concept_id: "experimental_control_group",
    prompt: "吐司發霉實驗中，冰箱組和室溫組除了溫度不同外，吐司大小、包裝與觀察天數應盡量相同。主要目的是什麼？",
    options: ["減少其他因素干擾，讓溫度影響較容易判斷", "讓實驗看起來比較整齊", "讓吐司更好吃", "讓兩組都一定不會發霉"],
    answer: "減少其他因素干擾，讓溫度影響較容易判斷",
    hint: "如果兩組同時改變很多條件，最後會很難判斷是哪個因素造成差異。",
    misconception: "poor_control_design"
  },
  {
    id: "two_groups",
    concept_id: "experimental_control_group",
    prompt: "有同學說：「只要有兩組實驗，就一定能知道原因。」哪個修正較合理？",
    options: ["兩組需要設計成主要只差在操作變因，才較能比較", "兩組越不一樣越好", "對照組不需要任何紀錄", "實驗組一定要放在室溫"],
    answer: "兩組需要設計成主要只差在操作變因，才較能比較",
    hint: "兩組比較的價值在於控制其他條件，讓主要差異更清楚。",
    misconception: "poor_control_design"
  }
];

const checkpoint3Choices = [
  {
    id: "table_reading",
    concept_id: "data_graph_interpretation",
    prompt: "某吐司發霉紀錄顯示：低溫組第十天 0%，室溫組第十天 95%。下列哪個判讀最合理？",
    options: ["室溫組發霉比例明顯高於低溫組", "低溫組發霉最嚴重", "兩組完全沒有差異", "只看第一天就能確定全部結果"],
    answer: "室溫組發霉比例明顯高於低溫組",
    hint: "先比較同一天兩組數據，再看差距方向。",
    misconception: "graph_surface_reading"
  },
  {
    id: "chart_trend",
    concept_id: "data_graph_interpretation",
    prompt: "折線趨勢中，室溫組發霉比例從第四天後快速上升，低溫組維持接近 0%。這最支持哪個說法？",
    options: ["低溫處的吐司較室溫處不易發霉", "低溫處的吐司發霉更快", "溫度完全不影響發霉", "兩組結果完全相同"],
    answer: "低溫處的吐司較室溫處不易發霉",
    hint: "看兩組變化方向與最後差距，不要只看顏色或單一時間點。",
    misconception: "graph_surface_reading"
  },
  {
    id: "evidence_conclusion",
    concept_id: "evidence_conclusion",
    prompt: "下列哪個結論最符合「吐司低溫組發霉比例始終低於室溫組」的資料？",
    options: ["在此實驗條件下，吐司放在低溫處較室溫處不易發霉", "所有食物放冰箱都永遠不會壞", "吐司是否發霉只和包裝顏色有關", "只要第一天沒有發霉就一定不會發霉"],
    answer: "在此實驗條件下，吐司放在低溫處較室溫處不易發霉",
    hint: "好的結論要貼近實驗範圍，不要把資料沒有檢驗的事情說得太絕對。",
    misconception: "overgeneralized_conclusion"
  }
];

const checkpoint4Choices = [
  {
    id: "mismatch_revision",
    concept_id: "repeatable_verification",
    prompt: "如果實驗結果不支持原本假說，最適合的做法是什麼？",
    options: ["檢查假說與實驗設計，必要時修正後再驗證", "把資料改成符合假說", "直接宣布科學方法失敗", "只保留符合想法的紀錄"],
    answer: "檢查假說與實驗設計，必要時修正後再驗證",
    hint: "科學探究重視證據；結果不符合想法時，資料本身仍有價值。",
    misconception: "mismatch_means_failure"
  },
  {
    id: "repeatable",
    concept_id: "repeatable_verification",
    prompt: "為什麼同一個實驗常需要重複驗證，甚至讓不同人操作？",
    options: ["確認結果是否穩定可靠", "讓實驗花更多時間", "讓紀錄表變厚", "讓每個人都得到不同答案"],
    answer: "確認結果是否穩定可靠",
    hint: "一次結果可能受到偶然因素影響，重複驗證能幫助判斷穩定性。",
    misconception: "mismatch_means_failure"
  }
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getAttempts() {
  try {
    return JSON.parse(localStorage.getItem(attemptsKey)) || [];
  } catch {
    return [];
  }
}

function saveAttempt(attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));
}

function studentAttempts(studentId) {
  return getAttempts().filter((item) => item.student?.student_id === studentId && item.mission?.unit_id === mission.unit_id && item.completion_status === "complete");
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
  if (!state.optionOrders) state.optionOrders = {};
  if (!state.optionOrders[key]) {
    state.optionOrders[key] = shuffledCopy(options);
    saveState();
  }
  return state.optionOrders[key];
}

function orderedById(key, items) {
  const ids = optionOrder(key, items.map((item) => item.id));
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
}

function currentSequenceSteps() {
  const sequence = state.answers.checkpoint1.sequence || {};
  const allIds = sequenceSteps.map((item) => item.id);
  const hasSavedOrder = allIds.every((id) => Number.isInteger(sequence[id]));
  const ids = hasSavedOrder
    ? allIds
      .filter((id) => Number.isInteger(sequence[id]))
      .sort((a, b) => sequence[a] - sequence[b])
    : optionOrder("sequenceSteps", allIds);
  if (!hasSavedOrder) setSequenceOrder(ids);
  return ids.map((id) => sequenceSteps.find((item) => item.id === id)).filter(Boolean);
}

function setSequenceOrder(ids) {
  state.answers.checkpoint1.sequence = {};
  ids.forEach((id, index) => {
    state.answers.checkpoint1.sequence[id] = index + 1;
  });
}

function moveSequenceStep(id, direction) {
  const ids = currentSequenceSteps().map((item) => item.id);
  const index = ids.indexOf(id);
  if (index < 0) return;
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= ids.length) return;
  [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
  setSequenceOrder(ids);
  saveState();
  render();
}

function dropSequenceStep(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const ids = currentSequenceSteps().map((item) => item.id);
  const from = ids.indexOf(draggedId);
  const to = ids.indexOf(targetId);
  if (from < 0 || to < 0) return;
  ids.splice(from, 1);
  ids.splice(to, 0, draggedId);
  setSequenceOrder(ids);
  saveState();
  render();
}

function unlock(...screens) {
  screens.forEach((item) => {
    if (!state.completedScreens.includes(item)) state.completedScreens.push(item);
  });
}

function setScreen(next) {
  if (isLockedScreen(next)) {
    redirectLockedAttempt();
    return;
  }
  if (next !== "result") state.lockNotice = "";
  state.screen = next;
  if (!state.completedScreens.includes(next)) state.completedScreens.push(next);
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderNav() {
  let activeButton = null;
  navButtons.forEach((button) => {
    const key = button.dataset.nav;
    const active = key === state.screen;
    button.classList.toggle("active", active);
    button.disabled = !state.completedScreens.includes(key) && key !== "rules";
    if (active) activeButton = button;
  });
  if (activeButton && window.matchMedia("(max-width: 980px)").matches) {
    activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
  if (!state.student) {
    studentMini.innerHTML = `<p class="muted">尚未登入</p><p class="muted">可用測試學號 S70101 或 guest</p>`;
    return;
  }
  const attempts = state.remote_completed_attempts ?? studentAttempts(state.student.student_id).length;
  studentMini.innerHTML = `
    <p><strong>${state.student.student_name}</strong></p>
    <p>${state.student.class_name} 班 ${state.student.seat_no} 號</p>
    <p class="muted">${state.attempt_type === "retry" ? "再挑戰" : "首次挑戰"}</p>
    <p class="muted">完成紀錄：${attempts} 筆</p>
  `;
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!button.disabled) setScreen(button.dataset.nav);
  });
});

function mentorCard(title, text, image = mentorImages.primary) {
  return `
    <div class="mentor-card">
      <div class="mentor-avatar"><img src="${image}" alt="${mentorName}"></div>
      <div class="mentor-copy">
        <span>${mentorName}</span>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function layout(content, image = owlImages.opening, imageAlt = "貓頭鷹助理") {
  return `
    <div class="mission-layout">
      <div class="panel hero-panel">${content}</div>
      <div class="owl-frame"><img src="${image}" alt="${imageAlt}"></div>
    </div>
  `;
}

function renderLabScene() {
  return `
    <div class="lab-scene" aria-label="科學方法調查站場景">
      <span class="toast-sample" style="left:18%;top:68%"></span>
      <span class="toast-sample low" style="left:74%;top:68%"></span>
      <span class="scan-dot" style="left:22%;top:60%"></span>
      <span class="scan-dot" style="left:73%;top:58%"></span>
    </div>
  `;
}

function renderBriefBackground(src, alt, caption) {
  return `
    <figure class="brief-background-figure">
      <img src="${src}" alt="${alt}">
      <figcaption>${caption}</figcaption>
    </figure>
  `;
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return layout(`
    <p class="eyebrow">生命祕境 BioQuest</p>
    <h2 class="hero-title">任務登入</h2>
    ${mentorCard("先確認身分", "請先輸入學號並確認姓名。下一頁才會開啟本單元任務情境與角色說明。")}
    <div class="story-panel">
      <strong>任務登入</strong>
      <p>輸入學號後，系統會顯示姓名，請確認是否正確。老師測試流程時可使用 guest。</p>
    </div>
    <div class="mission-hud">
      <div><span>任務代號</span><strong>scientific_method</strong></div>
      <div><span>預估時間</span><strong>10-15 分鐘</strong></div>
      <div><span>任務類型</span><strong>預習檢核</strong></div>
    </div>
    <div class="form-grid">
      <label>
        學號
        <input id="studentIdInput" value="${value}" placeholder="例如 S70101 或 guest" autocomplete="off">
      </label>
    </div>
    <div class="actions">
      <button class="primary" id="loginButton">登入任務</button>
      <button class="secondary" id="guestButton">老師測試 guest</button>
      <button class="ghost" id="resetButton">清除本機測試紀錄</button>
    </div>
    <div id="loginMessage" class="status-line"></div>
  `);
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

async function fetchStudentStatus(id) {
  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
}

async function login(id) {
  const message = document.querySelector("#loginMessage");
  if (!id) {
    message.innerHTML = `<span class="pill warn">請先輸入學號。</span>`;
    return;
  }
  message.innerHTML = `<span class="pill">正在查詢後台名單...</span>`;
  let student = null;
  let attemptType = "first";
  let completedAttempts = 0;
  try {
    const remote = await fetchStudentStatus(id);
    if (!remote.ok) {
      message.innerHTML = `<span class="pill warn">查無此學號，請重新輸入。</span>`;
      return;
    }
    const remoteProgress = remote.progress || remote.student_progress || {};
    student = {
      ...remote.student,
      progress: remoteProgress,
      current_title_id: remoteProgress.current_title_id || remote.student.current_title_id,
      current_title: remoteProgress.current_title || remote.student.current_title,
      title_avatar_variant: remoteProgress.title_avatar_variant || remote.student.title_avatar_variant,
      title_avatar_path: remoteProgress.title_avatar_path || remote.student.title_avatar_path,
      total_exp: remoteProgress.total_exp ?? remote.student.total_exp,
      is_guest: remote.student.student_id === "guest" || String(remote.student.is_guest).toUpperCase() === "TRUE"
    };
    attemptType = remote.attempt_type || "first";
    completedAttempts = Number(remote.completed_attempts || 0);
  } catch (error) {
    student = roster[id];
    if (!student) {
      message.innerHTML = `<span class="pill warn">目前無法連線後台，且本機測試名單查無此學號。</span>`;
      return;
    }
    completedAttempts = studentAttempts(student.student_id).length;
    attemptType = completedAttempts > 0 ? "retry" : "first";
    message.innerHTML = `<span class="pill warn">後台暫時無法連線，先使用本機測試模式。</span>`;
  }
  if (!student) {
    message.innerHTML = `<span class="pill warn">查無此學號，請重新輸入。</span>`;
    return;
  }
  state = structuredClone(defaultState);
  state.student = { ...student, is_guest: Boolean(student.is_guest) };
  state.attempt_type = attemptType;
  state.remote_completed_attempts = completedAttempts;
  state.started_at = new Date().toISOString();
  state.optionOrders = {};
  unlock("brief", "rules", "achievements");
  saveState();
  setScreen("brief");
}

function renderBrief() {
  const title = currentStudentTitle();
  const titleCharacter = studentTitleCharacterPath(title.id);
  return `
    <div class="wide-layout">
      <div class="panel hero-panel brief-scene-card" data-briefing-scene-image="${sceneImages.briefingSceneImage}" data-ambient-background-image="${sceneImages.ambientBackgroundImage}" data-student-character-hook="${titleCharacter}">
        <p class="eyebrow">任務檔案開啟</p>
        <h2 class="hero-title">歡迎，${state.student.student_name}</h2>
        <div class="brief-visual-row">
          ${renderBriefBackground(sceneImages.briefingSceneImage, "阿澤老師在科學偵查站的任務簡報主視覺", "吐司樣本、紀錄板與調查站已就緒，請用科學方法整理證據。")}
          <aside class="brief-title-avatar-card" data-student-gender="${studentGenderKey()}" data-current-title-id="${title.id}" data-title-avatar-path="${titleCharacter}">
            <div class="brief-title-avatar">
              <img src="${titleCharacter}" alt="${state.student.student_name}的${title.current}稱號角色">
            </div>
            <div>
              <span>你的任務稱號</span>
              <strong>${title.current}</strong>
              <p>${studentTitleVariantLabel()}角色形象已接入簡報頁；稱號文字與 EXP 進度由網頁顯示。</p>
            </div>
          </aside>
        </div>
        <div class="story-panel highlight">
          <strong>吐司樣本出現差異</strong>
          <p>室溫吐司很快發霉，低溫吐司幾乎沒有變化。先不要急著猜原因，科學方法會幫我們把觀察轉成可檢驗的問題。</p>
        </div>
        <div class="story-panel">
          <strong>任務核心</strong>
          <p>整理科學探究流程，分辨觀察與推論，辨識變因和對照設計，最後用資料判讀結論並修正假說。</p>
        </div>
        <div class="status-line">
          <span class="pill">${state.student.class_name} 班 ${state.student.seat_no} 號</span>
          <span class="pill ${state.attempt_type === "retry" ? "warn" : ""}">${state.attempt_type === "retry" ? "再挑戰" : "首次挑戰"}</span>
          ${state.student.is_guest ? `<span class="pill warn">guest 測試</span>` : ""}
        </div>
        <div class="actions">
          <button class="primary" id="briefNext">開始任務準備</button>
        </div>
      </div>
    </div>
  `;
}

function renderScan() {
  const tools = ["先記錄觀察，再提出推論", "把問題轉成可驗證", "假說不是已確定答案", "變因要分清楚角色", "用資料支持或修正結論"];
  return `
    <div class="stack">
      <div class="panel hero-panel">
        <p class="eyebrow">任務準備</p>
        <h2 class="hero-title">進關卡前先整理證據工具</h2>
        <div class="prep-owl-hero">
          <div class="prep-owl-visual"><img src="${owlImages.scan}" alt="科學方法準備貓頭鷹助理"></div>
          <div class="story-panel">
            <strong>調查站掃描提醒</strong>
            <p>科學探究不是猜一次就結束。請從觀察現象開始，提出可驗證問題，設計公平比較，再依資料判斷假說是否被支持。</p>
          </div>
        </div>
        <div class="card-grid">
          ${tools.map((tool) => `<div class="method-card"><span class="method-icon"></span><strong>${tool}</strong></div>`).join("")}
        </div>
        <div class="actions">
          <button class="primary" id="scanNext">進入科學流程排序</button>
        </div>
      </div>
    </div>
  `;
}

function checkpointShell(title, description, rows, nextId) {
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">${mission.unit_title}</p>
        <h2>${title}</h2>
        <p class="lead">${description}</p>
      </div>
      <div class="panel checkpoint-grid">${rows}</div>
      <div class="panel">
        <div id="checkpointFeedback" class="feedback"></div>
        <div class="actions">
          <button class="primary" id="${nextId}">完成本關</button>
          <button class="secondary" data-nav-target="rules">查看 EXP 規則</button>
        </div>
      </div>
    </div>
  `;
}

function renderSequenceQuestion() {
  const sequence = state.answers.checkpoint1.sequence || {};
  const orderedSteps = currentSequenceSteps();
  return `
    <div class="question-row multi-question">
      <div>
        <span class="multi-badge">拖曳排序</span>
        <strong>請把科學方法流程排成較合理的順序。</strong>
        <p class="multi-instruction">拖曳流程卡調整先後，也可用上下按鈕微調。重點是判斷誰先誰後，不是背第幾步。</p>
        ${state.answers.checkpoint1Hints.sequence ? `<div class="hint">先從看到的現象開始，再把想法轉成可檢驗的設計，最後才根據資料下結論。</div>` : ""}
      </div>
      <div class="sequence-list" data-sequence-list>
        ${orderedSteps.map((step, index) => `
          <div class="sequence-item" draggable="true" data-sequence-card="${step.id}">
            <span class="drag-handle" aria-hidden="true"></span>
            <strong>${step.label}</strong>
            <div class="sequence-actions" aria-label="${step.label}排序調整">
              <button class="icon-button" data-sequence-move="${step.id}" data-direction="up" ${index === 0 ? "disabled" : ""} aria-label="${step.label}上移">↑</button>
              <button class="icon-button" data-sequence-move="${step.id}" data-direction="down" ${index === orderedSteps.length - 1 ? "disabled" : ""} aria-label="${step.label}下移">↓</button>
            </div>
          </div>
        `).join("")}
      </div>
      <button class="ghost hint-button" data-group="checkpoint1" data-id="sequence">提示</button>
    </div>
  `;
}

function renderObservationClassify() {
  const selected = state.answers.checkpoint1.observation || {};
  const orderedItems = orderedById("observationItems", observationItems);
  return `
    <div class="question-row classify-question">
      <div>
        <span class="multi-badge">可分類</span>
        <strong>請將敘述分成「觀察」或「推論」。</strong>
        <p class="multi-instruction">先點選一張敘述卡，再點選分類欄。</p>
        ${state.answers.checkpoint1Hints.observation ? `<div class="hint">先找哪些句子是在描述看見或量到的資料，哪些句子是在解釋可能原因。</div>` : ""}
      </div>
      <div>
        <div class="token-bank">
          ${orderedItems.map((item) => `<button class="token ${state.activeToken === item.id ? "selected" : ""}" data-token="${item.id}">${item.label}</button>`).join("")}
        </div>
        <div class="category-grid">
          ${observationCategories.map((category) => `
            <div class="category-column" data-category-group="checkpoint1" data-category-field="observation" data-category="${category.id}">
              <h3>${category.title}</h3>
              <div class="token-list">
                ${observationItems.filter((item) => selected[item.id] === category.id).map((item) => `<span class="pill">${item.label}</span>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
      <button class="ghost hint-button" data-group="checkpoint1" data-id="observation">提示</button>
    </div>
  `;
}

function renderCheckpoint1() {
  const rows = `
    ${renderSequenceQuestion()}
    ${renderObservationClassify()}
    ${orderedById("checkpoint1Choices", checkpoint1Choices).map((item) => renderChoiceQuestion("checkpoint1", item)).join("")}
  `;
  return checkpointShell("關卡一：科學流程與觀察判斷", "從發霉吐司現象出發，整理科學方法流程，並分辨觀察紀錄與推論說明。", rows, "checkpoint1Next");
}

function renderVariableClassify() {
  const selected = state.answers.checkpoint2.variables || {};
  const orderedItems = orderedById("variableItems", variableItems);
  return `
    <div class="question-row classify-question">
      <div>
        <span class="multi-badge">可分類</span>
        <strong>在「吐司發霉與溫度的關係」實驗中，請將項目分成三類。</strong>
        <p class="multi-instruction">提示只會提醒「刻意改變」「測量結果」「保持相同」，不直接說出分類答案。</p>
        ${state.answers.checkpoint2Hints.variables ? `<div class="hint">先找實驗中刻意改變的因素，再找要測量的結果；其他條件應盡量保持相同。</div>` : ""}
      </div>
      <div>
        <div class="token-bank">
          ${orderedItems.map((item) => `<button class="token ${state.activeToken === item.id ? "selected" : ""}" data-token="${item.id}">${item.label}</button>`).join("")}
        </div>
        <div class="category-grid">
          ${variableCategories.map((category) => `
            <div class="category-column" data-category-group="checkpoint2" data-category-field="variables" data-category="${category.id}">
              <h3>${category.title}</h3>
              <div class="token-list">
                ${variableItems.filter((item) => selected[item.id] === category.id).map((item) => `<span class="pill">${item.label}</span>`).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
      <button class="ghost hint-button" data-group="checkpoint2" data-id="variables">提示</button>
    </div>
  `;
}

function renderCheckpoint2() {
  const rows = `${renderVariableClassify()}${orderedById("checkpoint2Choices", checkpoint2Choices).map((item) => renderChoiceQuestion("checkpoint2", item)).join("")}`;
  return checkpointShell("關卡二：變因偵查室", "辨識操作變因、應變變因、控制變因，並檢查實驗組與對照組是否能公平比較。", rows, "checkpoint2Next");
}

function renderDataVisual() {
  return `
    <div class="data-grid">
      <div class="data-panel">
        <h3>吐司發霉比例紀錄</h3>
        <table class="data-table">
          <thead><tr><th>天數</th><th>低溫組</th><th>室溫組</th></tr></thead>
          <tbody>
            <tr><td>第 1 天</td><td>0%</td><td>0%</td></tr>
            <tr><td>第 4 天</td><td>0%</td><td>20%</td></tr>
            <tr><td>第 7 天</td><td>0%</td><td>70%</td></tr>
            <tr><td>第 10 天</td><td>0%</td><td>95%</td></tr>
          </tbody>
        </table>
      </div>
      <div class="data-panel">
        <h3>趨勢掃描</h3>
        <div class="chart-panel">
          <div class="chart-bars">
            <span class="bar cool" style="height:4%"></span>
            <span class="bar" style="height:20%"></span>
            <span class="bar cool" style="height:4%"></span>
            <span class="bar" style="height:70%"></span>
            <span class="bar" style="height:95%"></span>
          </div>
          <p class="muted">請比較同一天兩組數據與整體變化方向。</p>
        </div>
      </div>
    </div>
  `;
}

function renderCheckpoint3() {
  const rows = `${renderDataVisual()}${orderedById("checkpoint3Choices", checkpoint3Choices).map((item) => renderChoiceQuestion("checkpoint3", item)).join("")}`;
  return checkpointShell("關卡三：證據儀表板", "讀取資料表與趨勢圖，用數據支持合理結論，避免過度推論。", rows, "checkpoint3Next");
}

function renderCheckpoint4() {
  const rows = `
    <div class="story-panel highlight">
      <strong>假說修正不是失敗</strong>
      <p>如果資料不支持原本想法，不是把資料改掉，而是檢查假說、實驗設計與紀錄方式，再重新驗證。</p>
    </div>
    ${orderedById("checkpoint4Choices", checkpoint4Choices).map((item) => renderChoiceQuestion("checkpoint4", item)).join("")}
  `;
  return checkpointShell("關卡四：修正與再驗證", "理解科學態度：資料不支持假說時，可以修正並重複驗證。", rows, "checkpoint4Next");
}

function renderChoiceQuestion(group, item) {
  const current = state.answers[group][item.id] || "";
  const hintUsed = state.answers[`${group}Hints`][item.id];
  return `
    <div class="question-row">
      <div>
        <strong>${item.prompt}</strong>
        ${hintUsed ? `<div class="hint">${item.hint}</div>` : ""}
      </div>
      <div class="choice-grid">
        ${optionOrder(`options_${item.id}`, item.options).map((option) => `
          <button class="choice ${current === option ? "selected" : ""}" data-choice-group="${group}" data-id="${item.id}" data-value="${option}">${option}</button>
        `).join("")}
      </div>
      <button class="ghost hint-button" data-group="${group}" data-id="${item.id}">提示</button>
    </div>
  `;
}

function attachCheckpointHandlers() {
  document.querySelectorAll("[data-token]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeToken = button.dataset.token;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-category]").forEach((column) => {
    column.addEventListener("click", () => {
      if (!state.activeToken) return;
      const group = column.dataset.categoryGroup;
      const field = column.dataset.categoryField;
      if (!state.answers[group][field]) state.answers[group][field] = {};
      state.answers[group][field][state.activeToken] = column.dataset.category;
      state.activeToken = null;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-sequence-move]").forEach((button) => {
    button.addEventListener("click", () => moveSequenceStep(button.dataset.sequenceMove, button.dataset.direction));
  });
  attachSequenceDragHandlers();
  document.querySelectorAll("[data-choice-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.choiceGroup;
      const id = button.dataset.id;
      state.answers[group][id] = button.dataset.value;
      const item = findQuestion(id);
      if (item && button.dataset.value !== item.answer) state.answers[`${group}Hints`][id] = true;
      saveState();
      render();
    });
  });
  document.querySelectorAll(".hint-button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.group;
      const id = button.dataset.id;
      state.answers[`${group}Hints`][id] = true;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-nav-target]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.navTarget)));
}

function attachSequenceDragHandlers() {
  let draggedId = null;
  document.querySelectorAll("[data-sequence-card]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggedId = card.dataset.sequenceCard;
      card.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggedId);
      }
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      document.querySelectorAll(".sequence-item.drop-target").forEach((item) => item.classList.remove("drop-target"));
      draggedId = null;
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (draggedId && draggedId !== card.dataset.sequenceCard) card.classList.add("drop-target");
    });
    card.addEventListener("dragleave", () => card.classList.remove("drop-target"));
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const sourceId = event.dataTransfer?.getData("text/plain") || draggedId;
      card.classList.remove("drop-target");
      dropSequenceStep(sourceId, card.dataset.sequenceCard);
    });
  });
}

function findQuestion(id) {
  return [...checkpoint1Choices, ...checkpoint2Choices, ...checkpoint3Choices, ...checkpoint4Choices].find((item) => item.id === id);
}

function validateCheckpoint1() {
  const sequence = state.answers.checkpoint1.sequence || {};
  const observation = state.answers.checkpoint1.observation || {};
  return sequenceSteps.every((item) => sequence[item.id]) &&
    observationItems.every((item) => observation[item.id]) &&
    checkpoint1Choices.every((item) => state.answers.checkpoint1[item.id]);
}

function validateCheckpoint2() {
  const variables = state.answers.checkpoint2.variables || {};
  return variableItems.every((item) => variables[item.id]) && checkpoint2Choices.every((item) => state.answers.checkpoint2[item.id]);
}

function validateGroup(group, questions) {
  return questions.every((item) => state.answers[group][item.id]);
}

function advanceIf(ok, next) {
  if (!ok) {
    document.querySelector("#checkpointFeedback").textContent = "還有題目尚未完成。";
    return;
  }
  unlock(next);
  setScreen(next);
}

function scoreChoiceQuestions(questions, group, directPoints, revisionPoints) {
  let concept = 0;
  let revision = 0;
  let correct = 0;
  let correctWithoutHint = 0;
  let correctedAfterHint = 0;
  let hintUsed = 0;
  const misconceptions = [];
  questions.forEach((item) => {
    const selected = state.answers[group][item.id];
    const usedHint = Boolean(state.answers[`${group}Hints`][item.id]);
    if (usedHint) hintUsed += 1;
    if (selected === item.answer) {
      correct += 1;
      if (usedHint) {
        revision += revisionPoints;
        correctedAfterHint += 1;
      } else {
        concept += directPoints;
        correctWithoutHint += 1;
      }
    } else {
      misconceptions.push(item.misconception);
    }
  });
  return { concept, revision, correct, correctWithoutHint, correctedAfterHint, hintUsed, total: questions.length, misconceptions };
}

function scoreSequence() {
  const sequence = state.answers.checkpoint1.sequence || {};
  const usedHint = Boolean(state.answers.checkpoint1Hints.sequence);
  let correct = 0;
  const misconceptions = [];
  sequenceSteps.forEach((item) => {
    if (sequence[item.id] === item.order) correct += 1;
    else misconceptions.push("scientific_method_sequence");
  });
  return {
    concept: usedHint ? 0 : correct * 10,
    revision: usedHint ? correct * 6 : 0,
    correct,
    correctWithoutHint: usedHint ? 0 : correct,
    correctedAfterHint: usedHint ? correct : 0,
    hintUsed: usedHint ? 1 : 0,
    total: sequenceSteps.length,
    misconceptions
  };
}

function scoreObservation() {
  return scoreClassification("checkpoint1", "observation", observationItems, "observation", 12, 8);
}

function scoreVariables() {
  return scoreClassification("checkpoint2", "variables", variableItems, "variables", 14, 9);
}

function scoreClassification(group, field, items, hintId, directPoints, revisionPoints) {
  const selected = state.answers[group][field] || {};
  const usedHint = Boolean(state.answers[`${group}Hints`][hintId]);
  let correct = 0;
  const misconceptions = [];
  items.forEach((item) => {
    if (selected[item.id] === item.answer) correct += 1;
    else misconceptions.push(item.misconception);
  });
  return {
    concept: usedHint ? 0 : correct * directPoints,
    revision: usedHint ? correct * revisionPoints : 0,
    correct,
    correctWithoutHint: usedHint ? 0 : correct,
    correctedAfterHint: usedHint ? correct : 0,
    hintUsed: usedHint ? 1 : 0,
    total: items.length,
    misconceptions
  };
}

function combineScores(...scores) {
  return scores.reduce((sum, item) => ({
    concept: sum.concept + item.concept,
    revision: sum.revision + item.revision,
    correct: sum.correct + item.correct,
    correctWithoutHint: sum.correctWithoutHint + item.correctWithoutHint,
    correctedAfterHint: sum.correctedAfterHint + item.correctedAfterHint,
    hintUsed: sum.hintUsed + item.hintUsed,
    total: sum.total + item.total,
    misconceptions: [...sum.misconceptions, ...item.misconceptions]
  }), { concept: 0, revision: 0, correct: 0, correctWithoutHint: 0, correctedAfterHint: 0, hintUsed: 0, total: 0, misconceptions: [] });
}

function normalizeReflectionText(text) {
  return (text || "")
    .replace(/[？?！!。．.,，、；;：:\s]/g, "")
    .replace(/(.)\1{3,}/g, "$1$1")
    .trim();
}

function isCopiedSystemPrompt(text) {
  const normalized = normalizeReflectionText(text);
  const copiedTemplates = [
    /^生活現象如何變成可驗證問題$/,
    /^觀察與推論差異$/,
    /^吐司發霉實驗的變因設定$/,
    /^對照組的意義$/,
    /^圖表趨勢如何支持結論$/,
    /^假說不被支持時如何修正$/,
    /^實驗為什麼需要重複驗證$/
  ];
  return copiedTemplates.some((pattern) => pattern.test(normalized));
}

function evaluateReflectionQuality(reflection = {}) {
  const fields = [reflection.confident_concept, reflection.uncertain_concept, reflection.student_question];
  const joined = fields.map((item) => item || "").join(" ").trim();
  const normalized = normalizeReflectionText(joined);
  const rawQuestion = (reflection.student_question || "").trim();
  const conceptTerms = ["觀察", "推論", "提出問題", "查資料", "假說", "實驗", "分析", "結論", "操作變因", "控制變因", "應變變因", "變因", "實驗組", "對照組", "資料", "圖表", "證據", "重複驗證", "發霉", "溫度"];
  const learningPhrases = ["為什麼", "怎麼", "如何", "判斷", "差別", "是不是", "不確定", "混淆", "分辨", "不知道", "不懂", "看不懂", "關係", "證據", "修正"];
  const invalidPhrases = ["老師好帥", "老師很帥", "老師漂亮", "老師很漂亮", "午餐", "下課", "放學", "好累", "哈哈", "呵呵", "沒有", "無", "不會", "不知道"];
  const matchedConcepts = conceptTerms.filter((term) => joined.includes(term));
  const matchedLearning = learningPhrases.filter((term) => joined.includes(term));
  const hasQuestionSignal = /[?？]/.test(rawQuestion) || ["為什麼", "怎麼", "如何", "嗎", "可不可以", "能不能"].some((term) => rawQuestion.includes(term));

  if (!normalized) return { reflection_quality: "blank", question_exp: 0, reflection_exp_reason: "空白可提交，但沒有可判讀的回報內容。", reflection_review_status: "auto_scored" };
  const onlySymbolsOrNoise = /^[\dA-Za-zㄅ-ㄩ]+$/.test(normalized) || /^[?？!！.。]+$/.test(joined.trim());
  const clearlyInvalid = invalidPhrases.some((term) => normalized.includes(term)) && matchedConcepts.length === 0;
  if (onlySymbolsOrNoise || clearlyInvalid) return { reflection_quality: "invalid", question_exp: 0, reflection_exp_reason: "內容未指出本單元概念，或與學科學習無關。", reflection_review_status: "auto_scored" };
  if (isCopiedSystemPrompt(rawQuestion)) return { reflection_quality: "needs_review", question_exp: 0, reflection_exp_reason: "內容與系統提供的提問方向過於相似，請改寫成自己的問題；此筆不自動給予回報 EXP。", reflection_review_status: "pending_review" };
  if (matchedConcepts.length > 0 && hasQuestionSignal && rawQuestion.length >= 14) return { reflection_quality: "discussion_question", question_exp: 40, reflection_exp_reason: `可帶到課堂討論；命中概念詞：${matchedConcepts.slice(0, 3).join("、")}。`, reflection_review_status: "auto_scored" };
  if (matchedConcepts.length > 0 && (matchedLearning.length > 0 || matchedConcepts.length >= 2) && normalized.length >= 8) return { reflection_quality: "specific_uncertainty", question_exp: 25, reflection_exp_reason: `有具體不確定或混淆；命中概念詞：${matchedConcepts.slice(0, 3).join("、")}。`, reflection_review_status: "auto_scored" };
  if (matchedConcepts.length > 0) return { reflection_quality: "minimal_concept", question_exp: 10, reflection_exp_reason: `有本單元概念詞但說明較短：${matchedConcepts.slice(0, 3).join("、")}。`, reflection_review_status: "auto_scored" };
  if (["科學", "實驗", "那邊"].some((term) => joined.includes(term)) && ["難", "看不懂", "不懂", "不會"].some((term) => joined.includes(term))) return { reflection_quality: "needs_review", question_exp: 0, reflection_exp_reason: "可能有學習困難，但未指出明確概念，需教師複核。", reflection_review_status: "pending_review" };
  return { reflection_quality: "invalid", question_exp: 0, reflection_exp_reason: "內容沒有明確學科關聯。", reflection_review_status: "auto_scored" };
}

function previousAccuracy() {
  const attempts = studentAttempts(state.student.student_id);
  return attempts.length ? attempts[attempts.length - 1].accuracy : null;
}

function previousBestCreditedExp() {
  return studentAttempts(state.student.student_id).reduce((best, attempt) => {
    const credited = attempt.unit_credited_exp ?? Math.min(UNIT_EXP_CAP, attempt.attempt_total_exp ?? attempt.total_exp ?? 0);
    return Math.max(best, credited);
  }, 0);
}

function scaleExp(value, pool, rawMax) {
  if (!value) return 0;
  return Math.min(pool, Math.round((value / rawMax) * pool));
}

function scaleScore(score) {
  return {
    ...score,
    raw_concept: score.concept,
    raw_revision: score.revision,
    concept: scaleExp(score.concept, DIRECT_EXP_POOL, DIRECT_RAW_MAX),
    revision: scaleExp(score.revision, REVISION_EXP_POOL, REVISION_RAW_MAX)
  };
}

function calculateResult() {
  const sequenceScore = scoreSequence();
  const observationScore = scoreObservation();
  const s1 = scaleScore(combineScores(sequenceScore, observationScore, scoreChoiceQuestions(checkpoint1Choices, "checkpoint1", 20, 10)));
  const variableScore = scoreVariables();
  const variableChoices = scoreChoiceQuestions(checkpoint2Choices.slice(0, 2), "checkpoint2", 25, 14);
  const controlChoices = scoreChoiceQuestions(checkpoint2Choices.slice(2), "checkpoint2", 25, 14);
  const s2 = scaleScore(combineScores(variableScore, variableChoices, controlChoices));
  const s3 = scaleScore(scoreChoiceQuestions(checkpoint3Choices, "checkpoint3", 25, 15));
  const s4 = scaleScore(scoreChoiceQuestions(checkpoint4Choices, "checkpoint4", 25, 15));
  const completionExp = 100;
  const reflectionEvaluation = evaluateReflectionQuality(state.answers.reflection);
  const questionExp = reflectionEvaluation.question_exp;
  const rawConceptExp = s1.raw_concept + s2.raw_concept + s3.raw_concept + s4.raw_concept;
  const rawRevisionExp = s1.raw_revision + s2.raw_revision + s3.raw_revision + s4.raw_revision;
  const conceptExp = scaleExp(rawConceptExp, DIRECT_EXP_POOL, DIRECT_RAW_MAX);
  const revisionExp = scaleExp(rawRevisionExp, REVISION_EXP_POOL, REVISION_RAW_MAX);
  const correct = s1.correct + s2.correct + s3.correct + s4.correct;
  const correctWithoutHint = s1.correctWithoutHint + s2.correctWithoutHint + s3.correctWithoutHint + s4.correctWithoutHint;
  const correctedAfterHint = s1.correctedAfterHint + s2.correctedAfterHint + s3.correctedAfterHint + s4.correctedAfterHint;
  const hintUsed = s1.hintUsed + s2.hintUsed + s3.hintUsed + s4.hintUsed;
  const total = s1.total + s2.total + s3.total + s4.total;
  const accuracy = correct / total;
  const noHintPerfect = correct === total && hintUsed === 0;
  const perfect = correct === total;
  const masteryExp = noHintPerfect ? 140 : perfect ? 80 : accuracy >= 0.9 ? 50 : 0;
  const prevAccuracy = previousAccuracy();
  const retryImproved = state.attempt_type === "retry" && prevAccuracy !== null && accuracy > prevAccuracy;
  const retryExp = retryImproved ? Math.min(60, Math.max(1, Math.round((accuracy - prevAccuracy) * 100))) : 0;
  const accuracyDelta = prevAccuracy === null ? null : accuracy - prevAccuracy;
  const uncappedAttemptExp = completionExp + conceptExp + revisionExp + questionExp + retryExp + masteryExp;
  const attemptTotalExp = Math.min(UNIT_EXP_CAP, uncappedAttemptExp);
  const previousBestCredited = previousBestCreditedExp();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(previousBestCredited, attemptTotalExp));
  const creditedDelta = Math.max(0, unitCreditedExp - previousBestCredited);
  const misconceptions = [...new Set([...s1.misconceptions, ...s2.misconceptions, ...s3.misconceptions, ...s4.misconceptions].filter(Boolean))];
  const variableAreaScore = combineScores(variableScore, variableChoices);
  const badges = [unitBadgeCatalog[0].name];
  if (s1.correct / s1.total >= 0.85) badges.push(unitBadgeCatalog[1].name);
  if (variableAreaScore.correct / variableAreaScore.total >= 0.85) badges.push(unitBadgeCatalog[2].name);
  if (controlChoices.correct / controlChoices.total >= 0.85) badges.push(unitBadgeCatalog[3].name);
  if (s3.correct / s3.total >= 0.85) badges.push(unitBadgeCatalog[4].name);
  if (noHintPerfect) badges.push(unitBadgeCatalog[5].name);
  if (reflectionEvaluation.reflection_quality === "discussion_question") badges.push(unitBadgeCatalog[6].name);
  if (retryImproved) badges.push(unitBadgeCatalog[7].name);
  return {
    unit_max_exp: UNIT_EXP_CAP,
    unit_exp_cap: UNIT_EXP_CAP,
    completion_exp: completionExp,
    concept_exp: conceptExp,
    revision_exp: revisionExp,
    question_exp: questionExp,
    reflection_quality: reflectionEvaluation.reflection_quality,
    reflection_exp_reason: reflectionEvaluation.reflection_exp_reason,
    reflection_review_status: reflectionEvaluation.reflection_review_status,
    retry_exp: retryExp,
    retry_improved: retryImproved,
    mastery_exp: masteryExp,
    uncapped_attempt_exp: uncappedAttemptExp,
    attempt_total_exp: attemptTotalExp,
    total_exp: attemptTotalExp,
    previous_best_credited_exp: previousBestCredited,
    unit_credited_exp: unitCreditedExp,
    credited_delta: creditedDelta,
    no_hint_perfect: noHintPerfect,
    perfect,
    correct,
    total,
    correct_without_hint: correctWithoutHint,
    corrected_after_hint: correctedAfterHint,
    hint_used: hintUsed,
    accuracy,
    previous_accuracy: prevAccuracy,
    accuracy_delta: accuracyDelta,
    section_stats: [
      { title: "流程與觀察推論", correct: s1.correct, total: s1.total, correct_without_hint: s1.correctWithoutHint, corrected_after_hint: s1.correctedAfterHint, exp: s1.concept + s1.revision },
      { title: "變因與對照設計", correct: s2.correct, total: s2.total, correct_without_hint: s2.correctWithoutHint, corrected_after_hint: s2.correctedAfterHint, exp: s2.concept + s2.revision },
      { title: "資料判讀與結論", correct: s3.correct, total: s3.total, correct_without_hint: s3.correctWithoutHint, corrected_after_hint: s3.correctedAfterHint, exp: s3.concept + s3.revision },
      { title: "假說修正與再驗證", correct: s4.correct, total: s4.total, correct_without_hint: s4.correctWithoutHint, corrected_after_hint: s4.correctedAfterHint, exp: s4.concept + s4.revision }
    ],
    inquiry_sequence_score: s1.correct / s1.total,
    variable_identification_score: variableAreaScore.correct / variableAreaScore.total,
    control_group_score: controlChoices.correct / controlChoices.total,
    evidence_reasoning_score: s3.correct / s3.total,
    misconceptions,
    badges,
    teacher_attention_needed: state.answers.reflection.confidence_score <= 2 || accuracy < 0.6 || reflectionEvaluation.reflection_review_status === "pending_review" || misconceptions.length >= 3
  };
}

function buildAttempt() {
  const now = new Date().toISOString();
  return {
    timestamp: now,
    student: state.student,
    mission,
    attempt_type: state.attempt_type,
    attempt_no: studentAttempts(state.student.student_id).length + 1,
    started_at: state.started_at,
    submitted_at: state.submitted_at || now,
    completion_status: "complete",
    ...state.result,
    confidence_score: state.answers.reflection.confidence_score,
    confident_concept: state.answers.reflection.confident_concept,
    uncertain_concept: state.answers.reflection.uncertain_concept,
    student_question: state.answers.reflection.student_question,
    raw_answers: state.answers
  };
}

function buildBackendPayload(attempt) {
  return {
    attempt_id: `${mission.unit_id}_${attempt.student.student_id}_${Date.now()}`,
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
    hints_used: attempt.hint_used ? 1 : 0,
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
    question_logs: (attempt.section_stats || []).map((section, index) => ({
      question_id: `${attempt.mission.unit_id}_section_${index + 1}`,
      skill_tag: section.title,
      is_correct: section.correct === section.total,
      used_hint: section.corrected_after_hint > 0,
      attempt_answer: `答對 ${section.correct}/${section.total}`,
      correct_answer: "詳見單元題組",
      exp_awarded: section.exp
    }))
  };
}

async function submitAttemptToBackend(attempt) {
  const body = new URLSearchParams();
  body.set("payload", JSON.stringify(buildBackendPayload(attempt)));
  const response = await fetch(`${BACKEND_URL}?action=submitAttempt`, {
    method: "POST",
    body
  });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "backend_submit_failed");
  return data;
}

function misconceptionText(tag) {
  const map = {
    scientific_method_sequence: "建議再整理科學方法各步驟之間的關係：先從現象出發，再用資料檢驗想法。",
    inference_as_observation: "建議再比較觀察與推論：觀察描述資料，推論提出可能原因。",
    untestable_question: "建議再練習提出可驗證問題：問題要能透過資料、觀察或實驗檢查。",
    hypothesis_as_fact: "建議再閱讀假說：假說不是已確定答案，而是可被驗證的合理解釋。",
    variable_confusion: "建議再整理三種變因：刻意改變、測量結果、保持相同分別對應不同角色。",
    poor_control_design: "建議再檢查實驗組與對照組：除了操作變因外，其他條件應盡量相同。",
    graph_surface_reading: "建議再練習資料判讀：看欄位、單位、組別差異與趨勢，不只看圖形長相。",
    overgeneralized_conclusion: "建議再確認結論範圍：結論要根據資料，避免說成所有情況都一定如此。",
    mismatch_means_failure: "建議再理解科學態度：資料不支持假說時，可以修正假說或設計後再驗證。"
  };
  return map[tag] || "建議再用觀察、變因與資料證據檢查自己的判斷。";
}

function getConceptReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.8).map((item) => item.title);
  const revisit = result.misconceptions.map((tag) => ({ tag, text: misconceptionText(tag) }));
  const directions = ["生活現象如何變成可驗證問題", "觀察與推論差異", "吐司發霉實驗的變因設定", "對照組的意義", "圖表趨勢如何支持結論", "假說不被支持時如何修正", "實驗為什麼需要重複驗證"];
  return {
    stable: stable.length ? stable : ["任務已完成，接下來請整理自己最有把握的探究線索。"],
    revisit: revisit.length ? revisit.slice(0, 6) : [{ tag: "extension", text: "本次概念很穩定，可以試著把生活中的其他現象轉成可驗證問題。" }],
    directions
  };
}

function renderReview() {
  const review = getConceptReview();
  const result = calculateResult();
  const visualState = globalThis.BioQuestCharacterLayout?.feedbackState(result) || "stable";
  return `
    <div class="mission-layout" data-feedback-state="${visualState}">
      <div class="panel">
        <p class="eyebrow">貓頭鷹助理概念回饋</p>
        <h2>先整理證據，再回報</h2>
        ${mentorCard("課堂前提醒", "請不要只寫「不知道」或直接複製系統方向詞。試著用自己的話說明：你會怎麼判斷變因、資料或假說修正？")}
        <h3>目前較穩定的概念</h3>
        <div class="status-line">${review.stable.map((item) => `<span class="pill">${item}</span>`).join("")}</div>
        <h3>建議再閱讀理解</h3>
        <div class="checkpoint-grid">
          ${review.revisit.map((item) => `<div class="question-row"><strong>${item.text}</strong></div>`).join("")}
        </div>
        <h3>可以帶到課堂的提問方向</h3>
        <div class="status-line">${review.directions.map((item) => `<span class="pill warn">${item}</span>`).join("")}</div>
        <p class="muted">上面的方向詞只是提醒，回報時請用自己的話補充，不要直接複製。</p>
        <div class="actions">
          <button class="primary" id="reviewNext">填寫任務回報</button>
        </div>
      </div>
    </div>
  `;
}

function renderReflection() {
  const reflection = state.answers.reflection;
  return `
    <div class="mission-layout">
      <div class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把你的預習狀態回報給老師</h2>
        <div class="story-panel">
          <strong>回報 EXP 怎麼判定？</strong>
          <p>只寫「不知道」「好難」或直接複製提問方向不會取得高分。請寫出觀察、推論、假說、操作變因、控制變因、應變變因、實驗組、對照組、資料、證據或重複驗證等概念，並補充自己的疑問。</p>
        </div>
        <div class="form-grid">
          <label>這次任務中，我最能掌握的科學方法步驟或判斷線索是什麼？
            <textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea>
          </label>
          <label>我還不確定的變因、對照或資料判讀概念是什麼？
            <textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea>
          </label>
          <label>選一個你想帶到課堂討論的方向，並用自己的話補充
            <span class="field-help">方向可參考上一頁，但不要直接複製方向詞。</span>
            <textarea id="studentQuestion">${reflection.student_question || ""}</textarea>
          </label>
          <label>信心分數
            <span class="field-help">1 分代表「我需要老師帶著整理」；5 分代表「我能用證據說明」。</span>
            <select id="confidenceScore">
              ${[1, 2, 3, 4, 5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="actions">
          <button class="primary" id="submitMission">提交任務</button>
        </div>
      </div>
    </div>
  `;
}

function attachReflection() {
  document.querySelector("#submitMission").addEventListener("click", async (event) => {
    if (state.submitted_at) {
      setScreen("result");
      return;
    }
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
      await submitAttemptToBackend(attempt);
      saveAttempt(attempt);
      state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + 1;
      unlock("result", "achievements");
      saveState();
      setScreen("result");
    } catch (error) {
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

function renderResult() {
  const result = state.result?.section_stats ? state.result : calculateResult();
  const expRows = [
    { title: "完成任務", detail: "完整提交本次預習檢核", value: result.completion_exp },
    { title: "直接答對", detail: `未使用提示直接答對 ${result.correct_without_hint} 題，直接答對池最高 ${DIRECT_EXP_POOL} EXP。`, value: result.concept_exp },
    { title: "提示後修正", detail: `使用提示後完成修正 ${result.corrected_after_hint} 題，修正池低於直接答對池。`, value: result.revision_exp },
    { title: "回報品質", detail: result.reflection_exp_reason || "空白可提交，但沒有回報 EXP。", value: result.question_exp },
    { title: "精熟表現", detail: result.no_hint_perfect ? "全部答對且全程未使用提示，取得最高精熟 EXP。" : result.perfect ? "全部答對，但曾使用提示，精熟 EXP 低於零提示全對。" : result.mastery_exp ? "正確率達 90% 以上，取得高表現精熟 EXP。" : "尚未達到精熟門檻。", value: result.mastery_exp },
    { title: "再挑戰進步", detail: result.retry_improved ? `本次比前一次進步，取得進步補分；本單元認列仍最多 ${UNIT_EXP_CAP} EXP。` : state.attempt_type === "retry" ? "本次為再挑戰，但未高於前一次完整挑戰，不給進步補分。" : "首次挑戰不列入。", value: result.retry_exp }
  ];
  return `
    <div class="mission-layout">
      <div class="panel">
        <p class="eyebrow">任務結算</p>
        <h2 class="hero-title">${state.student.student_name}，任務完成</h2>
        <div class="story-panel highlight">
          <strong>提交後本次作答已鎖定</strong>
          <p>${state.lockNotice || "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。"}</p>
        </div>
        <div class="score-grid">
          <div class="score-box"><span>本次取得 EXP</span><strong>${result.attempt_total_exp}</strong></div>
          <div class="score-box"><span>本單元認列 EXP</span><strong>${result.unit_credited_exp}/${result.unit_exp_cap}</strong></div>
          <div class="score-box"><span>本次新增認列</span><strong>+${result.credited_delta}</strong></div>
          <div class="score-box"><span>答對項目</span><strong>${result.correct}/${result.total}</strong></div>
        </div>
        <div class="story-panel highlight">
          <strong>本次取得 vs 本單元認列</strong>
          <p>本次取得 EXP 是這次完整挑戰的表現分數；本單元認列 EXP 會取你在本單元歷次完整挑戰中的最高分，且最多 ${UNIT_EXP_CAP} EXP。再挑戰可以補進步，但不會讓本單元超過零提示全對的上限。</p>
        </div>
        <h3>各關表現</h3>
        <div class="result-table">
          ${result.section_stats.map((item) => `<div class="result-row"><strong>${item.title}</strong><span>答對 ${item.correct}/${item.total}</span><span>直接答對 ${item.correct_without_hint}</span><span>提示後修正 ${item.corrected_after_hint}</span><b>+${item.exp} EXP</b></div>`).join("")}
        </div>
        <h3>EXP 明細</h3>
        <div class="exp-ledger">
          ${expRows.map((item) => `<div class="exp-row ${item.value ? "" : "muted-row"}"><div><strong>${item.title}</strong><span>${item.detail}</span></div><b>+${item.value}</b></div>`).join("")}
        </div>
        <h3>亮起徽章</h3>
        ${renderBadgeCatalog(result.badges)}
        <div class="actions">
          <button class="primary" id="goAchievements">查看我的成就</button>
          <button class="secondary" id="goRules">查看 EXP 規則</button>
        </div>
      </div>
      <div class="owl-frame"><img src="${owlImages.result}" alt="任務結算貓頭鷹助理"></div>
    </div>
  `;
}

function aggregateStudent() {
  if (!state.student) return { totalExp: 0, badges: [], attempts: [], completedUnits: 0 };
  const attempts = getAttempts().filter((item) => item.student?.student_id === state.student.student_id && item.completion_status === "complete");
  const bestByUnit = new Map();
  attempts.forEach((attempt) => {
    const unitId = attempt.mission?.unit_id || mission.unit_id;
    const credited = attempt.unit_credited_exp ?? Math.min(UNIT_EXP_CAP, attempt.attempt_total_exp ?? attempt.total_exp ?? 0);
    bestByUnit.set(unitId, Math.max(bestByUnit.get(unitId) || 0, credited));
  });
  const totalExp = [...bestByUnit.values()].reduce((sum, value) => sum + value, 0);
  const badges = [...new Set(attempts.flatMap((item) => item.badges || []))];
  return { totalExp, badges, attempts, completedUnits: bestByUnit.size };
}

function renderBadgeCatalog(earnedBadges) {
  const earned = new Set(earnedBadges || []);
  return `<div class="badge-grid">${unitBadgeCatalog.map((badge) => `<div class="badge ${earned.has(badge.name) ? "earned" : "locked"}" data-badge-id="${badge.id}">${badge.badge_image_path ? `<img src="${badge.badge_image_path}" alt="${badge.name}">` : `<span class="bq-badge-asset-pending">徽章素材待補</span>`}<strong>${badge.name}</strong><p>${badge.condition}</p></div>`).join("")}</div>`;
}

function titleForExp(exp) {
  if (titleProgressRules) return titleProgressRules.getTitleForExp(exp);
  const currentIndex = TITLE_LEVELS.reduce((index, item, itemIndex) => exp >= item.need ? itemIndex : index, 0);
  const current = TITLE_LEVELS[currentIndex];
  const next = TITLE_LEVELS[currentIndex + 1];
  return next
    ? { id: current.id, current: current.title, next_id: next.id, next: next.title, need: next.need, remaining: next.need - exp }
    : { id: current.id, current: current.title, next_id: current.id, next: "已達目前最高稱號", need: current.need, remaining: 0 };
}

function normalizeTitleId(titleId) {
  const value = String(titleId || "").trim();
  return titleIdAliases[value] || value;
}

function titleLevelById(titleId) {
  const normalized = normalizeTitleId(titleId);
  return TITLE_LEVELS.find((item) => item.id === normalized) || TITLE_LEVELS[0];
}

function currentStudentTitle() {
  const remoteTotal = Number(state.student?.progress?.total_exp ?? state.student?.total_exp ?? NaN);
  if (Number.isFinite(remoteTotal)) return titleForExp(remoteTotal);
  const explicitId = normalizeTitleId(state.student?.progress?.current_title_id || state.student?.current_title_id);
  if (explicitId && TITLE_LEVELS.some((item) => item.id === explicitId)) {
    const title = titleLevelById(explicitId);
    return {
      id: title.id,
      current: state.student?.progress?.current_title || state.student?.current_title || title.title,
      next_id: title.id,
      next: "",
      need: title.need,
      remaining: 0
    };
  }
  const localTotal = state.student ? aggregateStudent().totalExp : 0;
  return titleForExp(localTotal);
}

function normalizeTitleAvatarPath(path) {
  if (!path) return "";
  if (/^(https?:|data:|\/|\.\.\/)/.test(path)) return path;
  if (path.startsWith("shared-assets/")) return `../${path}`;
  return path;
}

function studentGenderKey() {
  const value = String(
    state.student?.preferred_avatar_variant
    || state.student?.progress?.title_avatar_variant
    || state.student?.title_avatar_variant
    || state.student?.profile_gender
    || state.student?.gender
    || state.student?.sex
    || state.student?.student_gender
    || "neutral"
  ).toLowerCase();
  if (["m", "male", "boy", "男"].includes(value)) return "male";
  if (["f", "female", "girl", "女"].includes(value)) return "female";
  return "neutral";
}

function studentTitleVariantLabel() {
  const gender = studentGenderKey();
  if (gender === "male") return "男版";
  if (gender === "female") return "女版";
  return "預設";
}

function studentTitleCharacterPath(titleId) {
  const directPath = normalizeTitleAvatarPath(state.student?.title_avatar_path || state.student?.progress?.title_avatar_path);
  if (directPath) return directPath;
  const normalizedTitleId = titleLevelById(titleId).id;
  const gender = studentGenderKey();
  const avatarSet = titleAvatarImages[normalizedTitleId] || titleAvatarImages.trainee_investigator;
  return avatarSet?.[gender] || avatarSet?.male || fallbackTitleAvatarPath;
}

function renderAchievements() {
  if (!state.student) return renderLogin();
  const aggregate = aggregateStudent();
  const remoteTotal = Number(state.student?.progress?.total_exp ?? state.student?.total_exp ?? NaN);
  const totalExp = Number.isFinite(remoteTotal) ? remoteTotal : aggregate.totalExp;
  const title = titleForExp(totalExp);
  const progress = titleProgressRules?.progressPercent(totalExp) ?? Math.min(100, (totalExp / TITLE_PROGRESS_CAP) * 100);
  const unitBadges = [...new Set([...aggregate.badges, ...(state.result?.badges || [])])];
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">累積成就</p>
        <h2>${state.student.student_name}</h2>
        <p class="lead">${state.student.class_name} 班 ${state.student.seat_no} 號｜目前稱號：${title.current}</p>
        <div class="score-grid">
          <div class="score-box"><span>累積認列 EXP</span><strong>${totalExp}</strong></div>
          <div class="score-box"><span>亮起徽章</span><strong>${aggregate.badges.length}</strong></div>
          <div class="score-box"><span>已認列單元</span><strong>${aggregate.completedUnits}</strong></div>
        </div>
        <h3>下一稱號：${title.next}${title.remaining ? `｜還差 ${title.remaining} EXP` : ""}</h3>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="muted">稱號進度 ${totalExp >= TITLE_PROGRESS_CAP ? 100 : Math.floor(progress * 10) / 10}%｜稱號進度以 ${TITLE_PROGRESS_CAP.toLocaleString()} EXP 封頂；全冊理論仍可累積 ${FULL_BOOK_EXP_MAX.toLocaleString()} EXP，達最高稱號後 EXP 繼續累積。</p>
      </div>
      <div class="panel">
        <p class="eyebrow">本單元成就</p>
        <h3>發霉吐司調查任務</h3>
        ${renderBadgeCatalog(unitBadges)}
      </div>
      <div class="panel">
        <p class="eyebrow">全部任務徽章</p>
        <div class="badge-grid">${aggregate.badges.length ? aggregate.badges.map((badge) => `<div class="badge earned"><strong>${badge}</strong></div>`).join("") : `<p class="muted">目前沒有亮起的徽章。</p>`}</div>
      </div>
    </div>
  `;
}

function renderRules() {
  const rows = [
    ["單元上限", `每個標準單元最高認列 ${UNIT_EXP_CAP} EXP；累積 EXP 只採本單元歷次完整挑戰中的最高認列分數。`],
    ["最高路徑", `第一次全部答對且全程未使用提示，可取得本單元最高路徑：完成 100、直接答對最高 ${DIRECT_EXP_POOL}、回報最高 40、零提示全對精熟 140，合計 ${UNIT_EXP_CAP}。`],
    ["提示後修正", "提示只提供判斷線索，不直接公布答案；提示後修正仍有 EXP，但同題低於直接答對。"],
    ["回報 EXP", "具體且與觀察、推論、假說、變因、對照組、資料或證據相關的回報最高 40；空白、無關玩笑或直接複製方向詞不給高分。"],
    ["再挑戰進步", "已完成任務後，重新登入並從頭完成才算再挑戰；只有比前一次完整挑戰進步時給進步補分，且本單元認列仍不超過 500。"],
    ["稱號規劃", `稱號採前段較快、後段逐級增加的非線性門檻；全冊理論可累積 ${FULL_BOOK_EXP_MAX.toLocaleString()} EXP，稱號進度以 ${TITLE_PROGRESS_CAP.toLocaleString()} EXP 封頂。達門檻後稱號固定為生命祕境守護者，後續 EXP 仍照常累積。`]
  ];
  const titles = [
    ["0", "見習調查員"],
    ["500", "生命觀察員"],
    ["1,500", "生態記錄員"],
    ["3,000", "概念解謎者"],
    ["5,200", "微觀探索者"],
    ["8,000", "系統調查員"],
    ["11,800", "生命研究員"],
    ["16,700", "BioQuest 專家"],
    ["23,400", "生命祕境守護者"]
  ];
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">EXP 規則</p>
        <h2>零提示全對是最高路徑</h2>
        <p class="lead">提示與再挑戰用來鼓勵修正和進步，但不會比第一次就認真完成、全對且未使用提示更有利。</p>
      </div>
      <div class="panel checkpoint-grid">
        ${rows.map(([title, text]) => `<div class="question-row"><strong>${title}</strong><p>${text}</p></div>`).join("")}
      </div>
      <div class="panel">
        <h3>稱號門檻</h3>
        <div class="result-table">
          ${titles.map(([exp, title]) => `<div class="result-row"><strong>${title}</strong><span>${exp} EXP</span></div>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function attachCurrentScreen() {
  if (state.screen === "login") attachLogin();
  if (state.screen === "brief") document.querySelector("#briefNext").addEventListener("click", () => { unlock("scan"); setScreen("scan"); });
  if (state.screen === "scan") document.querySelector("#scanNext").addEventListener("click", () => { unlock("checkpoint1"); setScreen("checkpoint1"); });
  if (["checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4"].includes(state.screen)) attachCheckpointHandlers();
  if (state.screen === "checkpoint1") document.querySelector("#checkpoint1Next").addEventListener("click", () => advanceIf(validateCheckpoint1(), "checkpoint2"));
  if (state.screen === "checkpoint2") document.querySelector("#checkpoint2Next").addEventListener("click", () => advanceIf(validateCheckpoint2(), "checkpoint3"));
  if (state.screen === "checkpoint3") document.querySelector("#checkpoint3Next").addEventListener("click", () => advanceIf(validateGroup("checkpoint3", checkpoint3Choices), "checkpoint4"));
  if (state.screen === "checkpoint4") document.querySelector("#checkpoint4Next").addEventListener("click", () => advanceIf(validateGroup("checkpoint4", checkpoint4Choices), "review"));
  if (state.screen === "review") document.querySelector("#reviewNext").addEventListener("click", () => { unlock("reflection"); setScreen("reflection"); });
  if (state.screen === "reflection") attachReflection();
  if (state.screen === "result") {
    document.querySelector("#goAchievements").addEventListener("click", () => setScreen("achievements"));
    document.querySelector("#goRules").addEventListener("click", () => setScreen("rules"));
  }
}

function render() {
  normalizeLockedScreen();
  renderNav();
  const renderers = {
    login: renderLogin,
    brief: renderBrief,
    scan: renderScan,
    checkpoint1: renderCheckpoint1,
    checkpoint2: renderCheckpoint2,
    checkpoint3: renderCheckpoint3,
    checkpoint4: renderCheckpoint4,
    review: renderReview,
    reflection: renderReflection,
    result: renderResult,
    achievements: renderAchievements,
    rules: renderRules
  };
  screen.innerHTML = renderers[state.screen]();
  attachCurrentScreen();
}

render();
