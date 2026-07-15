const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const UNIT_EXP_CAP = 500;

const mission = {
  mission_area: "微觀研究站",
  unit_id: "cell_structure",
  unit_title: "細胞的構造",
  mission_title: "細胞工廠的祕密"
};

const mentorName = "阿澤老師";
const cellStructureSceneImages = {
  briefing: "assets/bg-cell-structure-briefing-azhe-wide.webp"
};
const titleProgressRules = window.BioQuestTitleProgress;
const TITLE_PROGRESS_CAP = titleProgressRules?.titleProgressCap || 23400;
const FULL_BOOK_EXP_MAX = titleProgressRules?.fullBookExpMax || 26000;
const badgeAsset = (id) => `../shared-assets/badges/cell_structure/badge-cell_structure-${id}.webp`;
const cellStructureOwlAssets = {
  prep: "assets/owl-cell-structure-prep-scan.webp",
  report: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  result: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp"
};

const unitBadgeCatalog = [
  { id: "cell_structure_entry", name: "細胞工廠入門徽章", condition: "完成細胞工廠掃描任務。" },
  { id: "cell_organelle_identifier", name: "細胞構造辨識徽章", condition: "主要細胞構造辨識關卡達 85% 以上。" },
  { id: "cell_function_matcher", name: "細胞功能配對徽章", condition: "構造與功能配對關卡達 85% 以上。" },
  { id: "animal_plant_compare_guardian", name: "動植物細胞比較徽章", condition: "動植物細胞共有構造與差異分類關卡達 85% 以上。" },
  { id: "membrane_wall_distinctor", name: "膜壁分辨徽章", condition: "細胞膜與細胞壁位置、功能判斷題組達標。" },
  { id: "energy_photosynthesis_mapper", name: "能量與光合配對徽章", condition: "粒線體、葉綠體與呼吸作用、光合作用配對題組達標。" },
  { id: "cell_structure_flawless", name: "細胞工廠零提示全對徽章", condition: "全部答對，且全程未使用提示。" },
  { id: "cell_structure_reflection_reporter", name: "高品質細胞構造回報徽章", condition: "回報品質達 discussion_question，且具備細胞構造或功能關聯。" },
  { id: "retry_growth_cell_structure", name: "再探細胞工廠進步徽章", condition: "再挑戰完整完成，且本次正確率高於前一次完整挑戰。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const storageKey = "bioquest_cell_structure_state_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  started_at: null,
  completedScreens: ["login", "rules"],
  answers: {
    checkpoint1: {},
    checkpoint1Hints: {},
    checkpoint2: {},
    checkpoint2Hints: {},
    checkpoint3: {},
    checkpoint3Hints: {},
    checkpoint4: {},
    checkpoint4Hints: {},
    reviewNotes: {},
    reflection: {}
  },
  optionOrders: {},
  result: null,
  submitted_at: null,
  activeDiagramType: "animal",
  activeStructure: "",
  structureTargetResults: {},
  structureTransitionNotice: "",
  lockNotice: ""
};

let state = loadState();
let structureTransitionTimer = null;

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
    return JSON.parse(localStorage.getItem("bioquest_attempts_v1")) || [];
  } catch {
    return [];
  }
}

function saveAttempt(attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  localStorage.setItem("bioquest_attempts_v1", JSON.stringify(attempts));
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

function studentAttempts(studentId) {
  return getAttempts().filter((item) => item.student?.student_id === studentId && item.mission?.unit_id === mission.unit_id && item.completion_status === "complete");
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

function unlock(...screens) {
  screens.forEach((item) => {
    if (!state.completedScreens.includes(item)) state.completedScreens.push(item);
  });
}

function renderNav() {
  let activeButton = null;
  navButtons.forEach((button) => {
    const key = button.dataset.nav;
    const isActive = key === state.screen;
    button.classList.toggle("active", isActive);
    button.disabled = !state.completedScreens.includes(key) && key !== "rules";
    if (isActive) activeButton = button;
  });

  if (activeButton && window.matchMedia("(max-width: 980px)").matches) {
    activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  if (!state.student) {
    studentMini.innerHTML = `<p class="muted">尚未登入</p><p class="muted">可用測試學號 S70101 或 guest</p>`;
    return;
  }

  const attempts = studentAttempts(state.student.student_id);
  studentMini.innerHTML = `
    <p><strong>${state.student.student_name}</strong></p>
    <p>${state.student.class_name} 班 ${state.student.seat_no} 號</p>
    <p class="muted">${state.attempt_type === "retry" ? "再挑戰" : "首次挑戰"}</p>
    <p class="muted">完成紀錄：${attempts.length} 筆</p>
  `;
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!button.disabled) setScreen(button.dataset.nav);
  });
});

function layout(content, image = "", imageAlt = "貓頭鷹助理") {
  return `
    <div class="mission-layout">
      <div class="panel hero-panel">${content}</div>
      ${image ? `<div class="owl-frame"><img src="${image}" alt="${imageAlt}"></div>` : ""}
    </div>
  `;
}

function mentorCard(title, text, image = "assets/mentor-base.webp") {
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

function titleAvatarGender() {
  const student = state.student || {};
  const variant = String(student.title_avatar_variant || student.profile_gender || "male").toLowerCase();
  return ["f", "female", "girl", "女"].includes(variant) ? "female" : "male";
}

function titleAvatarPath() {
  const student = state.student || {};
  if (student.title_avatar_path) {
    const directPath = String(student.title_avatar_path).trim();
    if (directPath.startsWith("shared-assets/")) return `../${directPath}`;
    return directPath;
  }
  const levels = titleProgressRules?.levels || [
    { id: "trainee_investigator", order: "01", need: 0, title: "見習調查員" }
  ];
  const aggregate = state.student ? aggregateStudent() : { totalExp: 0 };
  const titleId = student.current_title_id || titleProgressRules?.getTitleForExp(aggregate.totalExp)?.id || "trainee_investigator";
  const level = levels.find((item) => item.id === titleId) || levels[0];
  return `../shared-assets/title-avatars/title-${level.order}-${level.id}-${titleAvatarGender()}.webp`;
}

function renderTitleAvatarCard(context = "brief") {
  const title = titleForExp(state.student ? aggregateStudent().totalExp : 0);
  const displayTitle = state.student?.current_title || title.current;
  const fallbackAvatar = `../shared-assets/title-avatars/title-01-trainee_investigator-${titleAvatarGender()}.webp`;
  return `
    <aside class="title-avatar-card ${context}" data-title-avatar-path="${titleAvatarPath()}">
      <div class="title-avatar-visual"><img src="${titleAvatarPath()}" alt="${displayTitle}稱號角色" loading="eager" onerror="this.onerror=null;this.src='${fallbackAvatar}'"></div>
      <div>
        <span>學生稱號角色</span>
        <strong>${displayTitle}</strong>
        <p>${context === "brief" ? "以目前稱號進入本單元任務。" : `累積 ${state.student ? aggregateStudent().totalExp : 0} EXP`}</p>
      </div>
    </aside>
  `;
}

function renderBriefSceneFigure() {
  return `
    <figure class="brief-background-figure brief-scene-figure cell-structure-brief-scene" data-briefing-scene-hook="${cellStructureSceneImages.briefing}">
      <img src="${cellStructureSceneImages.briefing}" alt="阿澤老師在細胞工廠掃描站引導細胞構造任務" loading="eager">
      <figcaption>細胞工廠掃描站：依位置、形狀與功能，修復構造標記。</figcaption>
    </figure>
  `;
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return layout(`
    <p class="eyebrow">微觀研究站</p>
    <h2 class="hero-title">細胞工廠的祕密</h2>
    ${mentorCard("準備出發了嗎？", "我剛當老師時，最想讓學生看見的不是課本上被背起來的名詞，而是生命世界真的很有意思。今天我們先縮小到細胞裡，看看一個小小生命單位，怎麼像工廠一樣分工合作。", "assets/mentor-briefing-owl.webp")}
    <div class="story-panel">
      <strong>任務登入</strong>
      <p>輸入學號後，系統會顯示你的姓名，請確認是否正確。老師測試流程時可使用 guest。</p>
    </div>
    <div class="mission-hud">
      <div><span>任務代號</span><strong>cell_structure</strong></div>
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
    localStorage.removeItem("bioquest_attempts_v1");
    state = structuredClone(defaultState);
    render();
  });
}

async function fetchStudentStatus(id) {
  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
}

function normalizeBackendStudent(data, id) {
  if (!data?.ok || !data.student || String(data.student.student_id || "") !== String(id)) return null;
  const source = data.student;
  const progress = data.progress || data.student_progress || source.progress || {};
  return {
    student_id: source.student_id,
    class_name: source.class_name || source.class || "未設定",
    seat_no: source.seat_no || source.seat || "00",
    student_name: source.student_name || source.name || "未設定",
    profile_gender: progress.profile_gender || source.profile_gender || source.gender || "",
    current_title_id: progress.current_title_id || source.current_title_id || "",
    current_title: progress.current_title || source.current_title || "",
    title_avatar_path: progress.title_avatar_path || source.title_avatar_path || "",
    total_exp: progress.total_exp ?? source.total_exp,
    progress,
    is_guest: false
  };
}

async function login(id) {
  const message = document.querySelector("#loginMessage");
  if (!id) {
    message.innerHTML = `<span class="pill warn">查無此學號，請重新輸入。</span>`;
    return;
  }
  window.BioQuestLoginUX?.begin({ guest: id === "guest" });
  await window.BioQuestLoginUX?.paint();
  let student;
  let completedAttempts = 0;
  if (id === "guest") {
    student = roster.guest;
    completedAttempts = studentAttempts(student.student_id).length;
  } else {
    try {
      const data = await fetchStudentStatus(id);
      student = normalizeBackendStudent(data, id);
      if (!student) {
        message.innerHTML = `<span class="pill warn">查無此學號或後台資料不完整，尚未登入。</span>`;
        return;
      }
      completedAttempts = Number(data.attempt_status?.completed_attempt_count ?? data.completed_attempts ?? 0);
    } catch {
      message.innerHTML = `<span class="pill warn">後台目前無法連線，尚未登入。請檢查網路後重試或通知老師。</span>`;
      return;
    }
  }
  const attempts = studentAttempts(student.student_id);
  state = structuredClone(defaultState);
  state.student = { ...student, is_guest: Boolean(student.is_guest) };
  state.attempt_type = (completedAttempts || attempts.length) > 0 ? "retry" : "first";
  state.started_at = new Date().toISOString();
  state.optionOrders = {
    structureOptions: shuffledCopy(structureOptions),
    functionOptions: shuffledCopy(functionOptions)
  };
  unlock("brief", "rules", "achievements");
  saveState();
  setScreen("brief");
}

function renderBrief() {
  return `
    <div class="wide-layout">
      <div class="panel hero-panel brief-scene-card">
    <p class="eyebrow">任務檔案開啟</p>
    <h2 class="hero-title">歡迎，${state.student.student_name}</h2>
    ${renderBriefSceneFigure()}
    <div class="story-panel highlight">
      <strong>研究站的求救訊號</strong>
      <p>微觀研究站收到一份細胞掃描資料，但標籤系統發生錯亂。別急著背答案，我們先像真正的研究員一樣，從位置、形狀和功能慢慢判斷：每個構造為什麼在那裡？它又替細胞完成什麼工作？</p>
    </div>
    <div class="story-panel">
      <strong>任務核心</strong>
      <p>重新辨識細胞構造，確認每個構造的功能，並找出動物細胞與植物細胞的差異。</p>
    </div>
    <div class="scan-card">
      <div class="scan-orbit" aria-hidden="true"></div>
      <div>
        <strong>掃描資料：動物細胞 / 植物細胞</strong>
        <p>待修復標籤：細胞核、細胞質、粒線體、液胞、細胞膜、細胞壁、葉綠體</p>
      </div>
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
  return layout(`
    <p class="eyebrow">貓頭鷹助理預習掃描</p>
    <h2 class="hero-title">任務前知識盤點</h2>
    <div class="prep-owl-hero">
      <div class="prep-owl-visual"><img src="${cellStructureOwlAssets.prep}" alt="胞器掃描準備貓頭鷹助理"></div>
      <div class="story-panel">
        <strong>貓頭鷹助理的出發提醒</strong>
        <p>等等進入細胞工廠時，你會看到許多看起來很像、功能卻不同的構造。先別急著衝關，請先確認自己帶好了五個觀察工具：看得出主要構造、說得出功能、分得出動植物細胞差異，也願意在想錯時停下來修正。提示不是扣分陷阱，而是幫你把想法調整回正確方向的工具。</p>
      </div>
    </div>
    <div class="progress-steps" aria-label="任務進度">
      <span class="active">登入</span>
      <span class="active">簡報</span>
      <span class="active">掃描</span>
      <span>關卡</span>
      <span>回饋</span>
      <span>結算</span>
    </div>
    <div class="checkpoint-grid">
      ${["辨識細胞主要構造", "說明構造功能", "分辨動物細胞與植物細胞差異", "修正細胞膜與細胞壁混淆", "判斷葉綠體與液胞的差異"].map((item) => `<div class="pill">${item}</div>`).join("")}
    </div>
    <div class="actions">
      <button class="primary" id="scanNext">進入關卡一</button>
    </div>
  `);
}

const checkpoint1Items = [
  { id: "nucleus", answer: "細胞核", hint: "先找細胞內較明顯、接近圓形且保留原色的區域。" },
  { id: "mitochondria", answer: "粒線體", hint: "尋找同時保留原色的多個小橢圓形，內部常有彎曲紋理。" },
  { id: "chloroplast", answer: "葉綠體", hint: "在植物細胞圖中尋找同時保留原色的綠色橢圓形。" },
  { id: "vacuole", answer: "液胞", hint: "留意植物細胞中央占較大範圍、像空腔且保留原色的區域。" }
];

const CHECKPOINT1_CONCEPT_EXP = 140;
const CHECKPOINT1_REVISION_EXP = 70;
const CELL_SCAN_PHASE_TARGETS = { animal: 2, plant: 2 };
const CHECKPOINT1_TARGET_LOG_IDS = {
  nucleus: "nucleus",
  mitochondria: "mitochondrion",
  chloroplast: "chloroplast",
  vacuole: "large_vacuole"
};

const structureOptions = ["細胞核", "細胞質", "粒線體", "液胞", "細胞膜", "細胞壁", "葉綠體"];

const structureGuide = {
  nucleus: {
    label: "細胞核",
    clue: "通常較明顯，內含遺傳物質，像細胞的控制中心。",
    functionText: "控制細胞代謝作用，和遺傳有關。"
  },
  cytoplasm: {
    label: "細胞質",
    clue: "不是空白區，許多胞器分布在其中。",
    functionText: "許多代謝作用進行的場所。"
  },
  mitochondria: {
    label: "粒線體",
    clue: "常畫成小橢圓，內部有皺褶狀構造。",
    functionText: "進行呼吸作用，供應細胞活動所需能量。"
  },
  vacuole: {
    label: "液胞",
    clue: "像細胞內的儲存囊泡，可儲存水分、養分或廢物；比較圖像時，留意它的大小與明顯程度。",
    functionText: "儲存水分、養分或廢物。"
  },
  membrane: {
    label: "細胞膜",
    clue: "包圍細胞，動物細胞最外層可見，植物細胞則在細胞壁內側。",
    functionText: "區隔細胞內外環境，控制物質進出。"
  },
  wall: {
    label: "細胞壁",
    clue: "植物細胞外側較厚、較堅固的外框。",
    functionText: "保護細胞並維持形狀。"
  },
  chloroplast: {
    label: "葉綠體",
    clue: "綠色橢圓構造，通常出現在能行光合作用的綠色植物細胞。",
    functionText: "進行光合作用，製造葡萄糖。"
  }
};

const cellDiagrams = {
  animal: {
    title: "動物細胞",
    note: "動物細胞沒有細胞壁與葉綠體，外側主要以細胞膜包圍。",
    structures: [
      { id: "nucleus", x: 51, y: 39 },
      { id: "mitochondria", x: 78, y: 67 }
    ]
  },
  plant: {
    title: "植物細胞",
    note: "植物細胞外側有細胞壁，細胞膜在細胞壁內側；液胞常較大。",
    structures: [
      { id: "vacuole", x: 63, y: 50 },
      { id: "chloroplast", x: 77, y: 30 }
    ]
  }
};

const cellHighlightShapes = {
  animal: {
    nucleus: [
      { type: "ellipse", cx: 52, cy: 38, rx: 14, ry: 15.5, rotate: 2 }
    ],
    mitochondria: [
      { type: "path", d: "M25.4 15.7 C29.4 15.2 32.0 18.8 31.9 23.8 C31.8 28.8 29.5 32.2 25.7 32.7 C22.0 33.2 20.1 29.9 20.5 25.3 C20.8 20.9 22.1 16.8 25.4 15.7 Z" },
      { type: "path", d: "M65.0 19.0 C67.5 18.2 70.3 20.2 71.0 23.7 C71.8 26.8 70.8 29.4 68.7 30.2 C66.4 30.8 63.2 28.7 62.5 25.8 C61.9 23.1 63.0 19.9 65.0 19.0 Z" },
      { type: "path", d: "M28.2 54.3 C31.0 53.7 34.7 56.0 36.8 59.2 C38.4 62.1 37.2 65.2 34.8 66.8 C32.4 68.2 29.3 66.7 27.2 64.3 C25.3 62.0 25.4 56.5 28.2 54.3 Z" },
      { type: "path", d: "M76.0 49.7 C79.5 49.8 81.2 52.8 80.8 56.8 C80.2 61.4 77.8 65.5 74.4 66.6 C71.0 67.7 68.5 64.8 69.2 61.0 C69.8 57.1 72.7 50.7 76.0 49.7 Z" }
    ]
  },
  plant: {
    vacuole: [
      { type: "path", d: "M55 32 C64 30 73 34 77 42 C80 50 76 64 68 72 C60 78 51 77 47 68 C43 60 45 50 49 42 C51 37 53 34 55 32 Z" }
    ],
    chloroplast: [
      { type: "path", d: "M64.0 17.6 C67.9 16.4 72.6 19.0 74.4 23.3 C76.1 27.0 74.8 31.0 72.2 32.7 C68.8 34.5 63.6 32.0 61.3 28.0 C59.3 24.4 60.6 19.2 64.0 17.6 Z" },
      { type: "path", d: "M21.0 45.8 C24.8 44.7 27.9 48.4 28.9 53.7 C29.8 58.6 28.0 63.2 25.2 64.4 C23.9 65.0 22.8 64.5 21.8 63.5 C21.2 62.7 20.8 61.8 20.3 60.8 C19.4 60.7 18.8 60.2 18.3 59.3 C17.5 54.9 18.3 47.7 21.0 45.8 Z" },
      { type: "path", d: "M65.2 62.8 C68.6 61.4 73.2 62.3 75.2 65.3 C77.4 68.8 75.5 72.7 72.4 74.4 C68.9 76.2 64.4 74.8 62.8 71.6 C61.0 68.3 61.9 64.0 65.2 62.8 Z" }
    ]
  }
};

const cellRevealExclusions = {
  plant: {
    vacuole: [
      { type: "ellipse", cx: 70, cy: 27, rx: 10, ry: 7, rotate: -12 },
      { type: "ellipse", cx: 80, cy: 44, rx: 6, ry: 10, rotate: -5 },
      { type: "ellipse", cx: 70, cy: 69, rx: 10, ry: 6, rotate: -8 }
    ]
  }
};

function cellImageSource(type) {
  return type === "animal" ? "assets/cell-animal-3d.webp?v=20260709-orange-mito" : "assets/cell-plant-3d.webp";
}

function renderCellArt(type) {
  const src = cellImageSource(type);
  const alt = type === "animal" ? "動物細胞構造圖" : "植物細胞構造圖";
  return `<img class="cell-image cell-image-grayscale" src="${src}" alt="${alt}">`;
}

function renderHighlightShape(shape, selectedId, index, layer) {
  const className = `cell-highlight-shape cell-highlight-${layer} ${selectedId} shape-${shape.type} shape-${index}`;
  if (shape.type === "ellipse") {
    const rotate = shape.rotate ? ` transform="rotate(${shape.rotate} ${shape.cx} ${shape.cy})"` : "";
    const opacity = shape.opacity ? ` style="--shape-opacity:${shape.opacity}"` : "";
    return `<ellipse class="${className}" cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}"${rotate}${opacity}></ellipse>`;
  }
  if (shape.type === "polyline") {
    const points = shape.points.map(([x, y]) => `${x},${y}`).join(" ");
    const strokeWidth = shape.strokeWidth ? ` style="--shape-stroke:${shape.strokeWidth}"` : "";
    return `<polyline class="${className}" points="${points}"${strokeWidth}></polyline>`;
  }
  if (shape.type === "box") {
    const opacity = shape.opacity ? ` style="--shape-opacity:${shape.opacity}"` : "";
    return `<rect class="${className}" x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" rx="2" ry="2"${opacity}></rect>`;
  }
  if (shape.type === "path") {
    return `<path class="${className}" d="${shape.d}"></path>`;
  }
  return "";
}

function renderRevealShape(shape, fill) {
  if (shape.type === "ellipse") {
    const rotate = shape.rotate ? ` transform="rotate(${shape.rotate} ${shape.cx} ${shape.cy})"` : "";
    return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" fill="${fill}"${rotate}></ellipse>`;
  }
  if (shape.type === "path") return `<path d="${shape.d}" fill="${fill}"></path>`;
  return "";
}

function renderCellHighlightOverlay(type, selectedId) {
  const shapes = cellHighlightShapes[type]?.[selectedId] || [];
  if (!shapes.length) return "";
  const exclusions = cellRevealExclusions[type]?.[selectedId] || [];
  const maskId = `cell-reveal-${type}-${selectedId}`;
  const source = cellImageSource(type);
  return `
    <svg class="cell-highlight-overlay cell-color-reveal-overlay" data-highlight-target="${selectedId}" data-overlay-mode="color-reveal" data-reveal-shape-count="${shapes.length}" data-reveal-exclusion-count="${exclusions.length}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <mask id="${maskId}" class="cell-color-reveal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect x="0" y="0" width="100" height="100" fill="#000"></rect>
          ${shapes.map((shape) => renderRevealShape(shape, "#fff")).join("")}
          ${exclusions.map((shape) => renderRevealShape(shape, "#000")).join("")}
        </mask>
      </defs>
      <image class="cell-color-reveal-image" href="${source}" x="0" y="0" width="100" height="100" preserveAspectRatio="none" mask="url(#${maskId})"></image>
      <g class="cell-highlight-layer halo-layer">${shapes.map((shape, index) => renderHighlightShape(shape, selectedId, index, "halo")).join("")}</g>
      <g class="cell-highlight-layer core-layer">${shapes.map((shape, index) => renderHighlightShape(shape, selectedId, index, "core")).join("")}</g>
    </svg>
  `;
}

function renderStructureExplorer() {
  const target = currentStructureTarget();
  const type = target ? diagramTypeForTarget(target.id) : "plant";
  state.activeDiagramType = type;
  const diagram = cellDiagrams[type];
  const selectedId = state.activeStructure || "";
  const selected = selectedId ? structureGuide[selectedId] : null;
  const remaining = remainingStructureTargets();
  const completedCount = checkpoint1Items.length - remaining;
  const phaseProgress = type === "animal"
    ? `${Math.min(completedCount, CELL_SCAN_PHASE_TARGETS.animal)}/${CELL_SCAN_PHASE_TARGETS.animal}`
    : `${Math.max(0, completedCount - CELL_SCAN_PHASE_TARGETS.animal)}/${CELL_SCAN_PHASE_TARGETS.plant}`;
  const targetId = target?.id || "";
  return `
    <div class="structure-explorer">
      <div>
        <div class="cell-phase-status" aria-label="細胞辨識階段">
          <span class="${type === "animal" ? "active" : "complete"}">1. 動物細胞共同構造</span>
          <span class="${type === "plant" ? "active" : ""}">2. 植物細胞圖構造</span>
        </div>
        ${state.structureTransitionNotice ? `<div class="diagram-transition" role="status" aria-live="polite">${state.structureTransitionNotice}</div>` : ""}
        <div class="cell-board ${type}" data-cell-diagram-type="${type}" data-current-target="${targetId}">
          ${renderCellArt(type)}
          ${renderCellHighlightOverlay(type, targetId)}
        </div>
        <p class="cell-note"><strong>${diagram.title}</strong>｜${diagram.note}</p>
      </div>
      <div class="structure-card part-info">
        <span>目前 target</span>
        <strong>${target ? "請辨識圖中唯一保留原色的構造" : "所有構造已完成"}</strong>
        <p>${target ? `${type === "animal" ? "動物細胞共同構造" : "植物細胞圖構造"} ${phaseProgress}。請點選下方名稱標籤；尚有 ${remaining} 個構造未辨識。` : "已完成全部 4 個構造辨識。"}</p>
        ${target && state.answers.checkpoint1Hints[target.id] ? `<div class="hint">${target.hint}</div>` : ""}
        <span>目前選取</span>
        <strong>${selected ? selected.label : "尚未選取構造"}</strong>
        <p>${selected ? "已收到你的選擇，系統會依目前保留原色的構造判定。" : "請從下方標籤選擇目前唯一保留原色的構造名稱。"}</p>
        <div class="part-labels structure-chips" aria-label="細胞構造標籤">
          ${checkpoint1Items.map((item) => `<button class="part-chip structure-chip ${selectedId === item.id ? "active" : ""} ${state.answers.checkpoint1[item.id] === item.answer ? "locked" : ""}" data-structure-chip="${item.id}">${item.answer}</button>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function diagramTypeForTarget(structureId) {
  return ["chloroplast", "vacuole"].includes(structureId) ? "plant" : "animal";
}

function currentStructureTarget() {
  return checkpoint1Items.find((item) => state.answers.checkpoint1[item.id] !== item.answer) || null;
}

function remainingStructureTargets() {
  return checkpoint1Items.filter((item) => state.answers.checkpoint1[item.id] !== item.answer).length;
}

function selectStructureTarget(structureId) {
  const target = currentStructureTarget();
  if (!target) return;
  const targetResult = state.structureTargetResults[target.id] || { attempt_count: 0 };
  targetResult.attempt_count += 1;
  if (structureId === target.id) {
    const previousType = diagramTypeForTarget(target.id);
    state.answers.checkpoint1[target.id] = target.answer;
    state.structureTargetResults[target.id] = {
      correct: true,
      hint_used: Boolean(state.answers.checkpoint1Hints[target.id]),
      corrected_after_hint: Boolean(state.answers.checkpoint1Hints[target.id]),
      attempt_count: targetResult.attempt_count,
      final_completed: true
    };
    const nextTarget = currentStructureTarget();
    const nextType = nextTarget ? diagramTypeForTarget(nextTarget.id) : previousType;
    state.activeDiagramType = nextType;
    state.activeStructure = "";
    state.structureTransitionNotice = previousType === "animal" && nextType === "plant"
      ? "動物細胞辨識完成，正在切換植物細胞。"
      : "";
    saveState();
    render();
    return;
  }
  if (!state.answers.checkpoint1Hints[target.id]) {
    state.answers.checkpoint1Hints[target.id] = true;
  }
  state.structureTargetResults[target.id] = {
    ...targetResult,
    correct: false,
    hint_used: true,
    corrected_after_hint: false,
    final_completed: false
  };
  state.activeStructure = structureId;
  saveState();
  render();
}

function renderCheckpoint1() {
  const rows = `
    ${renderStructureExplorer()}
    <div class="section-divider">
      <strong>檢核任務</strong>
      <span>只辨識目前正在發光的構造名稱；功能判斷會在關卡二檢核。</span>
    </div>
  `;
  return checkpointShell("關卡一：細胞掃描標記", "觀察灰階細胞圖中唯一保留原色的構造，點選下方名稱標籤完成辨識。", rows, "checkpoint1Next");
}

function scheduleStructureTransitionClear() {
  if (structureTransitionTimer) clearTimeout(structureTransitionTimer);
  if (!state.structureTransitionNotice) return;
  structureTransitionTimer = setTimeout(() => {
    if (!state.structureTransitionNotice || state.screen !== "checkpoint1") return;
    state.structureTransitionNotice = "";
    saveState();
    render();
  }, 2400);
}

function selectRow(group, item) {
  const current = state.answers[group][item.id] || "";
  const hintUsed = state.answers[`${group}Hints`][item.id];
  const options = optionOrder("structureOptions", structureOptions);
  return `
    <div class="question-row">
      <div>
        <strong>${item.prompt}</strong>
        ${hintUsed ? `<div class="hint">${item.hint}</div>` : ""}
      </div>
      <select data-group="${group}" data-id="${item.id}">
        <option value="">選擇構造</option>
        ${options.map((option) => `<option value="${option}" ${current === option ? "selected" : ""}>${option}</option>`).join("")}
      </select>
      <span class="selected-answer">${current ? `已選：${current}` : "尚未選擇構造"}</span>
      <button class="ghost hint-button" data-group="${group}" data-id="${item.id}">提示</button>
    </div>
  `;
}

function checkpointShell(title, description, rows, nextId) {
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">細胞的構造</p>
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

function attachSelectHandlers() {
  document.querySelectorAll(".cell-hotspot, [data-structure-chip]").forEach((button) => {
    button.addEventListener("click", () => {
      selectStructureTarget(button.dataset.structure || button.dataset.structureChip);
    });
  });
  document.querySelectorAll("select[data-group]").forEach((select) => {
    select.addEventListener("change", () => {
      state.answers[select.dataset.group][select.dataset.id] = select.value;
      const item = select.dataset.group === "checkpoint1"
        ? checkpoint1Items.find((entry) => entry.id === select.dataset.id)
        : checkpoint2Items.find((entry) => entry.id === select.dataset.id);
      if (item && select.value && select.value !== item.answer) {
        state.answers[`${select.dataset.group}Hints`][select.dataset.id] = true;
      }
      if (select.dataset.group === "checkpoint1" && item && select.value === item.answer) {
        state.structureTargetResults[item.id] = {
          correct: true,
          hint_used: Boolean(state.answers.checkpoint1Hints[item.id])
        };
        state.activeStructure = item.id;
      }
      const row = select.closest(".question-row");
      const selectedLine = row?.querySelector(".selected-answer");
      if (selectedLine) selectedLine.textContent = select.value ? `已選：${select.value}` : "尚未選擇構造";
      saveState();
      if (item && select.value && select.value !== item.answer) render();
    });
  });
  document.querySelectorAll(".hint-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers[`${button.dataset.group}Hints`][button.dataset.id] = true;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-nav-target]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.navTarget)));
}

const checkpoint2Items = [
  { id: "nucleus", label: "細胞核", answer: "含有遺傳物質，控制細胞代謝作用" },
  { id: "cytoplasm", label: "細胞質", answer: "細胞進行代謝作用的場所，內有各種胞器" },
  { id: "mitochondria", label: "粒線體", answer: "利用養分進行呼吸作用，產生細胞所需能量" },
  { id: "vacuole", label: "液胞", answer: "儲存水分、養分或廢物" },
  { id: "membrane", label: "細胞膜", answer: "區隔細胞內外環境，控制物質進出" },
  { id: "wall", label: "細胞壁", answer: "保護並維持植物細胞形狀" },
  { id: "chloroplast", label: "葉綠體", answer: "進行光合作用，製造葡萄糖" }
];

const functionOptions = checkpoint2Items.map((item) => item.answer);

function renderCheckpoint2() {
  const options = optionOrder("functionOptions", functionOptions);
  const rows = checkpoint2Items.map((item) => {
    const current = state.answers.checkpoint2[item.id] || "";
    const hintUsed = state.answers.checkpoint2Hints[item.id];
    return `
      <div class="question-row">
        <div>
          <strong>${item.label}</strong>
          ${hintUsed ? `<div class="hint">${functionHint(item.id)}</div>` : ""}
        </div>
        <select data-group="checkpoint2" data-id="${item.id}">
          <option value="">選擇功能</option>
          ${options.map((option) => `<option value="${option}" ${current === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
        <button class="ghost hint-button" data-group="checkpoint2" data-id="${item.id}">提示</button>
      </div>
    `;
  }).join("");
  return checkpointShell("關卡二：功能配對", "把每個構造與正確功能配對。", rows, "checkpoint2Next");
}

function functionHint(id) {
  const hints = {
    nucleus: "控制中心，和遺傳物質有關。",
    cytoplasm: "不是空白區，許多代謝作用在這裡進行。",
    mitochondria: "和能量供應有關。",
    vacuole: "和儲存水分、養分或廢物有關。",
    membrane: "關鍵是控制物質進出。",
    wall: "像植物細胞外側的支架。",
    chloroplast: "和光合作用有關。"
  };
  return hints[id];
}

const compareTokens = ["細胞核", "細胞質", "粒線體", "細胞膜", "液胞", "細胞壁", "葉綠體"];
const compareCategories = [
  { id: "both", title: "動物細胞與植物細胞都有", answers: ["細胞核", "細胞質", "粒線體", "細胞膜", "液胞"] },
  { id: "plantTypical", title: "植物細胞較典型或特有", answers: ["細胞壁"] },
  { id: "depends", title: "需要看細胞種類", answers: ["葉綠體"] }
];

function renderCheckpoint3() {
  const selected = state.answers.checkpoint3 || {};
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">關卡三</p>
        <h2>動植物比較</h2>
        <p class="lead">先點選一張構造卡，再點選要放入的分類欄。遇到不確定的構造時，先回想它的功能、位置與圖像特徵，再判斷分類。</p>
      </div>
      <div class="panel">
        <h3>構造卡</h3>
        <div class="token-bank">
          ${compareTokens.map((token) => `<button class="token ${state.activeToken === token ? "selected" : ""}" data-token="${token}">${token}</button>`).join("")}
        </div>
      </div>
      <div class="compare-grid">
        ${compareCategories.map((category) => `
          <div class="compare-column" data-category="${category.id}">
            <h3>${category.title}</h3>
            <div class="token-list">
              ${compareTokens.filter((token) => selected[token] === category.id).map((token) => `<span class="token">${token}</span>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
      <div class="panel">
        <div id="checkpointFeedback" class="feedback"></div>
        <div class="actions">
          <button class="primary" id="checkpoint3Next">完成本關</button>
        </div>
      </div>
    </div>
  `;
}

function attachCompareHandlers() {
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
      state.answers.checkpoint3[state.activeToken] = column.dataset.category;
      state.activeToken = null;
      saveState();
      render();
    });
  });
}

const misconceptionQuestions = [
  {
    id: "wall",
    question: "這個構造位在細胞膜外側，可以保護並支撐細胞形狀。它最可能是什麼？",
    options: ["細胞膜", "細胞壁", "細胞質", "粒線體"],
    answer: "細胞壁",
    hint: "關鍵線索是「細胞膜外側」和「支撐形狀」。"
  },
  {
    id: "chloroplast",
    question: "一位同學說：「只要是植物細胞，就一定有葉綠體。」你認為這句話需要修正嗎？",
    options: ["不需要，所有植物細胞一定都有葉綠體。", "需要，葉綠體和光合作用有關，不是每一種植物細胞都一定有。", "不需要，因為葉綠體負責控制細胞代謝。", "需要，因為葉綠體只存在動物細胞。"],
    answer: "需要，葉綠體和光合作用有關，不是每一種植物細胞都一定有。",
    hint: "想想看，植物根部通常不進行光合作用，是否需要葉綠體？"
  },
  {
    id: "cytoplasm",
    question: "有人把細胞質想成「細胞裡沒有功能的空白區」。這個說法哪裡需要修正？",
    options: ["細胞質內有各種胞器，也是許多代謝作用進行的場所。", "細胞質只存在植物細胞。", "細胞質負責保護細胞外側。", "細胞質只負責製造葡萄糖。"],
    answer: "細胞質內有各種胞器，也是許多代謝作用進行的場所。",
    hint: "細胞質中散布著許多胞器，並不是沒有功能的空間。"
  }
];

function renderCheckpoint4() {
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">關卡四</p>
        <h2>迷思修正任務</h2>
        <p class="lead">選出最合理的判斷。使用提示後修正成功，也會獲得修正 EXP。</p>
      </div>
      ${misconceptionQuestions.map((item) => renderChoiceQuestion(item)).join("")}
      <div class="panel">
        <div id="checkpointFeedback" class="feedback"></div>
        <div class="actions">
          <button class="primary" id="checkpoint4Next">完成本關</button>
        </div>
      </div>
    </div>
  `;
}

function renderChoiceQuestion(item) {
  const current = state.answers.checkpoint4[item.id];
  const hintUsed = state.answers.checkpoint4Hints[item.id];
  return `
    <div class="panel">
      <h3>${item.question}</h3>
      <div class="choice-grid">
        ${item.options.map((option) => `<button class="choice-card ${current === option ? "selected" : ""}" data-choice-id="${item.id}" data-choice="${option}">${option}</button>`).join("")}
      </div>
      <div class="actions">
        <button class="ghost choice-hint" data-choice-hint="${item.id}">提示</button>
      </div>
      ${hintUsed ? `<div class="hint">${item.hint}</div>` : ""}
    </div>
  `;
}

function attachChoiceHandlers() {
  document.querySelectorAll("[data-choice-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers.checkpoint4[button.dataset.choiceId] = button.dataset.choice;
      const item = misconceptionQuestions.find((entry) => entry.id === button.dataset.choiceId);
      if (item && button.dataset.choice !== item.answer) {
        state.answers.checkpoint4Hints[button.dataset.choiceId] = true;
      }
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-choice-hint]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers.checkpoint4Hints[button.dataset.choiceHint] = true;
      saveState();
      render();
    });
  });
}

function renderReflection() {
  const reflection = state.answers.reflection;
  return `
    <div class="wide-layout reflection-layout">
      <div class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把你的預習狀態回報給老師</h2>
        <div class="bq-report-assistant report-owl-hero">
          <div class="report-owl-visual"><img src="${cellStructureOwlAssets.report}" alt="任務回報貓頭鷹助理"></div>
          <div class="story-panel">
            <strong>貓頭鷹助理提醒</strong>
            <p>空白可以提交但沒有回報 EXP；具體且和本單元概念相關的問題或不確定，才會取得回報 EXP。請寫給老師課堂上可以說明或追問的部分。</p>
          </div>
        </div>
        <div class="story-panel">
          <strong>回報 EXP 怎麼判定？</strong>
          <p>只寫「不知道」「好難」或和學科無關的內容不會取得 EXP。寫出細胞核、細胞膜、細胞壁、粒線體、葉綠體、液胞、細胞質等概念，並說明自己混淆或想問的地方，才會得到較高的回報 EXP。</p>
        </div>
        <div class="form-grid">
          <label>我最有把握的概念
            <textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea>
          </label>
          <label>我還不確定的概念
            <textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea>
          </label>
          <label>我想上課問老師的問題
            <span class="field-help">請寫自己的問題，可以從外觀、位置、功能或兩種構造的差異下手。</span>
            <textarea id="studentQuestion">${reflection.student_question || ""}</textarea>
          </label>
          <label>信心分數
            <span class="field-help">1 分代表「我幾乎不確定，需要老師帶著整理」；5 分代表「我能自己說明，還能舉例」。</span>
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

function getConceptReview() {
  const stable = [];
  const revisit = [];
  const questionSeeds = [];

  const addRevisit = (key, title, reason, seed) => {
    if (!revisit.some((item) => item.key === key)) {
      revisit.push({ key, title, reason });
      questionSeeds.push(seed);
    }
  };

  const addStable = (key, title) => {
    if (!stable.some((item) => item.key === key) && !revisit.some((item) => item.key === key)) {
      stable.push({ key, title });
    }
  };

  checkpoint1Items.forEach((item) => {
    const selected = state.answers.checkpoint1[item.id];
    const usedHint = state.answers.checkpoint1Hints[item.id];
    if (selected === item.answer && !usedHint) addStable(item.id, `${item.answer}的位置辨識`);
    if (selected !== item.answer || usedHint) {
      addRevisit(item.id, `${item.answer}的位置與特徵`, `貓頭鷹助理偵測到你在「${item.answer}」的辨識上需要再確認。`, `從「${item.answer}」的外觀或位置線索，寫出你還不確定的地方。`);
    }
  });

  checkpoint2Items.forEach((item) => {
    const selected = state.answers.checkpoint2[item.id];
    const usedHint = state.answers.checkpoint2Hints[item.id];
    if (selected === item.answer && !usedHint) addStable(`${item.id}_function`, `${item.label}的功能`);
    if (selected !== item.answer || usedHint) {
      addRevisit(`${item.id}_function`, `${item.label}的功能`, `建議再讀一次「${item.label}」和功能的對應。`, `從「${item.label}」的功能和生活例子，寫出你還想確認的地方。`);
    }
  });

  compareTokens.forEach((token) => {
    const category = compareCategories.find((item) => item.answers.includes(token));
    if (state.answers.checkpoint3[token] === category.id) addStable(`compare_${token}`, `${token}在動植物細胞中的比較`);
    else {
      addRevisit(`compare_${token}`, `${token}在動植物細胞中的比較`, `建議再確認「${token}」是共有、植物較典型，還是要看細胞種類。`, `從「${token}」是否出現在不同細胞中，寫出你想比較的地方。`);
    }
  });

  misconceptionQuestions.forEach((item) => {
    const selected = state.answers.checkpoint4[item.id];
    const usedHint = state.answers.checkpoint4Hints[item.id];
    if (selected === item.answer && !usedHint) addStable(`mis_${item.id}`, item.id === "wall" ? "細胞膜與細胞壁的區分" : item.id === "chloroplast" ? "葉綠體不是所有植物細胞都有" : "細胞質不是空白區");
    if (selected !== item.answer || usedHint) {
      if (item.id === "wall") addRevisit("membrane_wall", "細胞膜與細胞壁的區分", "建議再讀「控制物質進出」和「支撐保護」這兩個線索。", "從細胞膜和細胞壁的位置與功能差異，寫出自己的問題。");
      if (item.id === "chloroplast") addRevisit("chloroplast_generalization", "葉綠體與光合作用", "建議再讀葉綠體和光合作用的關係，並思考哪些植物細胞不一定有葉綠體。", "從葉綠體、光合作用和植物細胞種類，寫出自己的問題。");
      if (item.id === "cytoplasm") addRevisit("cytoplasm_meaning", "細胞質的功能", "建議再讀細胞質中有胞器，也是許多代謝作用進行的場所。", "從細胞質和胞器的關係，寫出自己的問題。");
    }
  });

  if (revisit.length === 0) {
    revisit.push({
      key: "extension",
      title: "延伸思考：構造與功能如何連在一起",
      reason: "本次概念很穩定，可以試著把細胞構造和之後的光合作用、呼吸作用連起來。",
    });
    questionSeeds.push("從不同細胞構造如何合作，寫出一個延伸問題。");
  }

  return {
    stable: stable.slice(0, 6),
    revisit: revisit.slice(0, 6),
    questionSeeds: [...new Set(questionSeeds)].slice(0, 4)
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
        <h2>先整理，再回報</h2>
        ${mentorCard("課堂前提醒", "我已經把你的操作整理成概念線索。等等回報時，請不要只寫「不會」，試著寫出你卡在哪裡；這會幫我在課堂上更快帶你們把問題拆開。", `../shared-assets/mentor-feedback/mentor-feedback-${visualState}.webp`)}
        <div class="story-panel">
          <strong>回饋怎麼看？</strong>
          <p>這裡不直接公布每一題答對或答錯，而是整理你需要再閱讀理解的概念。你可以把這些提示帶到下一頁，寫成自己的回報。</p>
        </div>
        <h3>目前較穩定的概念</h3>
        <div class="status-line">
          ${review.stable.length ? review.stable.map((item) => `<span class="pill">${item.title}</span>`).join("") : `<span class="pill warn">尚未形成穩定概念標記</span>`}
        </div>
        <h3>建議再閱讀理解</h3>
        <div class="checkpoint-grid">
          ${review.revisit.map((item) => `
            <div class="question-row">
              <strong>${item.title}</strong>
              <p>${item.reason}</p>
            </div>
          `).join("")}
        </div>
        <h3>可以帶到課堂的提問方向</h3>
        <p class="muted">這些只是提醒你可以從哪裡想，請改寫成自己的問題；直接複製提示不會取得回報 EXP。</p>
        <div class="checkpoint-grid">
          ${review.questionSeeds.map((seed) => `<div class="hint">${seed}</div>`).join("")}
        </div>
        <div class="actions">
          <button class="primary" id="reviewNext">填寫任務回報</button>
        </div>
      </div>
    </div>
  `;
}

function attachReflection() {
  document.querySelector("#submitMission").addEventListener("click", () => {
    if (state.submitted_at) {
      setScreen("result");
      return;
    }
    const confirmed = window.confirm("提交後會進行結算，本次作答將鎖定，不能再修改；若要再挑戰，請重新登入並從頭完成。");
    if (!confirmed) return;
    state.answers.reflection = {
      confident_concept: document.querySelector("#confidentConcept").value.trim(),
      uncertain_concept: document.querySelector("#uncertainConcept").value.trim(),
      student_question: document.querySelector("#studentQuestion").value.trim(),
      confidence_score: Number(document.querySelector("#confidenceScore").value)
    };
    Object.assign(state.answers.reflection, evaluateReflectionQuality(state.answers.reflection));
    state.result = calculateResult();
    state.submitted_at = new Date().toISOString();
    saveAttempt(buildAttempt());
    unlock("result", "achievements");
    saveState();
    setScreen("result");
  });
}

function scoreMap(items, answerGroup, hintGroup, points, revisionPoints) {
  let concept = 0;
  let revision = 0;
  let correct = 0;
  let correctWithoutHint = 0;
  let correctedAfterHint = 0;
  let hintUsed = 0;
  const misconceptions = [];
  items.forEach((item) => {
    const ok = state.answers[answerGroup][item.id] === item.answer;
    const usedHint = Boolean(state.answers[hintGroup]?.[item.id]);
    if (usedHint) hintUsed += 1;
    if (ok) {
      correct += 1;
      if (usedHint) {
        correctedAfterHint += 1;
        revision += revisionPoints;
      } else {
        correctWithoutHint += 1;
        concept += points;
      }
    } else {
      misconceptions.push(item.id);
    }
  });
  return { concept, revision, correct, correctWithoutHint, correctedAfterHint, hintUsed, total: items.length, misconceptions };
}

function calculateCheckpoint1Score() {
  const evidence = scoreMap(checkpoint1Items, "checkpoint1", "checkpoint1Hints", 0, 0);
  const complete = evidence.correct === checkpoint1Items.length;
  return {
    ...evidence,
    concept: complete && evidence.hintUsed === 0 ? CHECKPOINT1_CONCEPT_EXP : 0,
    revision: complete && evidence.hintUsed > 0 ? CHECKPOINT1_REVISION_EXP : 0,
    checkpoint_completion_status: complete ? "complete" : "incomplete",
    checkpoint_exp_type: !complete ? "none" : evidence.hintUsed > 0 ? "revision" : "concept"
  };
}

function calculateCompare() {
  let correct = 0;
  const misconceptions = [];
  compareTokens.forEach((token) => {
    const category = compareCategories.find((item) => item.answers.includes(token));
    if (state.answers.checkpoint3[token] === category.id) correct += 1;
    else misconceptions.push(token === "葉綠體" ? "chloroplast_overgeneralization" : token);
  });
  return {
    concept: correct * 15,
    revision: 0,
    correct,
    correctWithoutHint: correct,
    correctedAfterHint: 0,
    hintUsed: 0,
    total: compareTokens.length,
    misconceptions
  };
}

function normalizeReflectionText(text) {
  return (text || "")
    .replace(/[？?！!。．.,，、；;：:\s]/g, "")
    .replace(/(.)\1{3,}/g, "$1$1")
    .trim();
}

function isCopiedSystemPrompt(rawQuestion) {
  const normalized = normalizeReflectionText(rawQuestion);
  const copiedTemplates = [
    /^我想確認.+要怎麼從圖中判斷$/,
    /^我想問.+的功能可以用什麼例子記住$/,
    /^我想確認.+在動物細胞和植物細胞中的差異$/,
    /^細胞膜和細胞壁都在外層時要怎麼快速分辨$/,
    /^沒有葉綠體的植物細胞要怎麼取得養分$/,
    /^細胞質裡面有哪些重要構造$/,
    /^不同細胞構造如何一起維持細胞生命$/,
    /^從.+的外觀或位置線索寫出你還不確定的地方$/,
    /^從.+的功能和生活例子寫出你還想確認的地方$/,
    /^從.+是否出現在不同細胞中寫出你想比較的地方$/,
    /^從細胞膜和細胞壁的位置與功能差異寫出自己的問題$/,
    /^從葉綠體光合作用和植物細胞種類寫出自己的問題$/,
    /^從細胞質和胞器的關係寫出自己的問題$/,
    /^從不同細胞構造如何合作寫出一個延伸問題$/
  ];
  return copiedTemplates.some((pattern) => pattern.test(normalized));
}

function evaluateReflectionQuality(reflection = {}) {
  const fields = [
    reflection.confident_concept,
    reflection.uncertain_concept,
    reflection.student_question
  ];
  const joined = fields.map((item) => item || "").join(" ").trim();
  const normalized = normalizeReflectionText(joined);
  const rawQuestion = (reflection.student_question || "").trim();
  const conceptTerms = ["細胞核", "細胞膜", "細胞壁", "粒線體", "葉綠體", "液胞", "細胞質", "動物細胞", "植物細胞", "光合作用", "呼吸作用", "胞器", "構造", "功能"];
  const learningPhrases = ["為什麼", "怎麼", "如何", "差在哪", "差別", "是不是", "不確定", "混淆", "分辨", "不知道", "不懂", "看不懂", "功能", "關係"];
  const invalidPhrases = ["老師好帥", "老師很帥", "老師漂亮", "老師很漂亮", "午餐", "下課", "放學", "好累", "哈哈", "呵呵", "沒有", "無", "不會", "不知道"];
  const matchedConcepts = conceptTerms.filter((term) => joined.includes(term));
  const matchedLearning = learningPhrases.filter((term) => joined.includes(term));
  const hasQuestionSignal = /[?？]/.test(rawQuestion) || ["為什麼", "怎麼", "如何", "嗎", "可不可以", "能不能"].some((term) => rawQuestion.includes(term));

  if (!normalized) {
    return {
      reflection_quality: "blank",
      question_exp: 0,
      reflection_exp_reason: "空白可提交，但沒有可判讀的回報內容。",
      reflection_review_status: "auto_scored"
    };
  }

  const onlySymbolsOrNoise = /^[\dA-Za-zㄅ-ㄩ]+$/.test(normalized) || /^[?？!！.。]+$/.test(joined.trim());
  const clearlyInvalid = invalidPhrases.some((term) => normalized.includes(term)) && matchedConcepts.length === 0;
  if (onlySymbolsOrNoise || clearlyInvalid) {
    return {
      reflection_quality: "invalid",
      question_exp: 0,
      reflection_exp_reason: "內容未指出本單元概念，或與學科學習無關。",
      reflection_review_status: "auto_scored"
    };
  }

  if (isCopiedSystemPrompt(rawQuestion)) {
    return {
      reflection_quality: "needs_review",
      question_exp: 0,
      reflection_exp_reason: "內容與系統提供的提問方向過於相似，請改寫成自己的問題；此筆不自動給予回報 EXP。",
      reflection_review_status: "pending_review"
    };
  }

  if (matchedConcepts.length > 0 && hasQuestionSignal && rawQuestion.length >= 14) {
    return {
      reflection_quality: "discussion_question",
      question_exp: 50,
      reflection_exp_reason: `可帶到課堂討論；命中概念詞：${matchedConcepts.slice(0, 3).join("、")}。`,
      reflection_review_status: "auto_scored"
    };
  }

  if (matchedConcepts.length > 0 && (matchedLearning.length > 0 || matchedConcepts.length >= 2) && normalized.length >= 8) {
    return {
      reflection_quality: "specific_uncertainty",
      question_exp: 30,
      reflection_exp_reason: `有具體不確定或混淆；命中概念詞：${matchedConcepts.slice(0, 3).join("、")}。`,
      reflection_review_status: "auto_scored"
    };
  }

  if (matchedConcepts.length > 0) {
    return {
      reflection_quality: "minimal_concept",
      question_exp: 10,
      reflection_exp_reason: `有本單元概念詞但說明較短：${matchedConcepts.slice(0, 3).join("、")}。`,
      reflection_review_status: "auto_scored"
    };
  }

  if (["細胞", "構造", "那邊"].some((term) => joined.includes(term)) && ["難", "看不懂", "不懂", "不會"].some((term) => joined.includes(term))) {
    return {
      reflection_quality: "needs_review",
      question_exp: 0,
      reflection_exp_reason: "可能有學習困難，但未指出明確概念，需教師複核。",
      reflection_review_status: "pending_review"
    };
  }

  return {
    reflection_quality: "invalid",
    question_exp: 0,
    reflection_exp_reason: "內容沒有明確學科關聯。",
    reflection_review_status: "auto_scored"
  };
}

function calculateResult() {
  const s1 = calculateCheckpoint1Score();
  const s2 = scoreMap(checkpoint2Items, "checkpoint2", "checkpoint2Hints", 20, 10);
  const s3 = calculateCompare();
  const s4 = scoreMap(misconceptionQuestions, "checkpoint4", "checkpoint4Hints", 30, 15);
  const completionExp = 100;
  const reflectionEvaluation = evaluateReflectionQuality(state.answers.reflection);
  const questionExp = reflectionEvaluation.question_exp;
  const conceptExp = s1.concept + s2.concept + s3.concept + s4.concept;
  const revisionExp = s1.revision + s2.revision + s3.revision + s4.revision;
  const correct = s1.correct + s2.correct + s3.correct + s4.correct;
  const correctWithoutHint = s1.correctWithoutHint + s2.correctWithoutHint + s3.correctWithoutHint + s4.correctWithoutHint;
  const correctedAfterHint = s1.correctedAfterHint + s2.correctedAfterHint + s3.correctedAfterHint + s4.correctedAfterHint;
  const hintUsed = s1.hintUsed + s2.hintUsed + s3.hintUsed + s4.hintUsed;
  const total = s1.total + s2.total + s3.total + s4.total;
  const accuracy = correct / total;
  const masteryExp = accuracy >= 0.9 ? 100 : 0;
  const retryExp = state.attempt_type === "retry" ? 50 : 0;
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, questionExp)));
  const totalExp = Math.min(reflectionLedgerCap, completionExp + conceptExp + revisionExp + questionExp + masteryExp + retryExp);
  const misconceptions = [...s1.misconceptions, ...s2.misconceptions, ...s3.misconceptions, ...s4.misconceptions];
  const membraneWallCorrect = state.answers.checkpoint4.wall === misconceptionQuestions.find((item) => item.id === "wall")?.answer;
  const energyFunctionCorrect = ["mitochondria", "chloroplast"].every((id) => state.answers.checkpoint2[id] === checkpoint2Items.find((item) => item.id === id)?.answer);
  const chloroplastConceptCorrect = state.answers.checkpoint4.chloroplast === misconceptionQuestions.find((item) => item.id === "chloroplast")?.answer;
  const noHintPerfect = correct === total && hintUsed === 0;
  const previousAccuracies = state.student ? studentAttempts(state.student.student_id).map((attempt) => Number(attempt.accuracy)).filter(Number.isFinite) : [];
  const retryImproved = state.attempt_type === "retry" && previousAccuracies.length > 0 && accuracy > Math.max(...previousAccuracies);
  const badges = [unitBadgeCatalog[0].name];
  if (s1.correct / s1.total >= 0.85) badges.push(unitBadgeCatalog[1].name);
  if (s2.correct / s2.total >= 0.85) badges.push(unitBadgeCatalog[2].name);
  if (s3.correct / s3.total >= 0.85) badges.push(unitBadgeCatalog[3].name);
  if (membraneWallCorrect) badges.push(unitBadgeCatalog[4].name);
  if (energyFunctionCorrect && chloroplastConceptCorrect) badges.push(unitBadgeCatalog[5].name);
  if (noHintPerfect) badges.push(unitBadgeCatalog[6].name);
  if (reflectionEvaluation.reflection_quality === "discussion_question") badges.push(unitBadgeCatalog[7].name);
  if (retryImproved) badges.push(unitBadgeCatalog[8].name);
  return {
    completion_exp: completionExp,
    concept_exp: conceptExp,
    revision_exp: revisionExp,
    question_exp: questionExp,
    reflection_quality: reflectionEvaluation.reflection_quality,
    reflection_exp_reason: reflectionEvaluation.reflection_exp_reason,
    reflection_review_status: reflectionEvaluation.reflection_review_status,
    retry_exp: retryExp,
    mastery_exp: masteryExp,
    total_exp: totalExp,
    correct,
    total,
    correct_without_hint: correctWithoutHint,
    corrected_after_hint: correctedAfterHint,
    hint_used: hintUsed,
    accuracy,
    section_stats: [
      { title: "細胞構造辨識", correct: s1.correct, total: s1.total, correct_without_hint: s1.correctWithoutHint, corrected_after_hint: s1.correctedAfterHint, exp: s1.concept + s1.revision },
      { title: "功能配對", correct: s2.correct, total: s2.total, correct_without_hint: s2.correctWithoutHint, corrected_after_hint: s2.correctedAfterHint, exp: s2.concept + s2.revision },
      { title: "動植物比較", correct: s3.correct, total: s3.total, correct_without_hint: s3.correctWithoutHint, corrected_after_hint: s3.correctedAfterHint, exp: s3.concept + s3.revision },
      { title: "迷思修正", correct: s4.correct, total: s4.total, correct_without_hint: s4.correctWithoutHint, corrected_after_hint: s4.correctedAfterHint, exp: s4.concept + s4.revision }
    ],
    misconceptions,
    badges,
    teacher_attention_needed: state.answers.reflection.confidence_score <= 2 || accuracy < 0.6 || misconceptions.includes("wall") || misconceptions.includes("chloroplast_overgeneralization") || reflectionEvaluation.reflection_review_status === "pending_review"
  };
}

function buildCheckpoint1QuestionLogs() {
  return checkpoint1Items.map((item, index) => {
    const answer = state.answers.checkpoint1[item.id] || "";
    const hintUsed = Boolean(state.answers.checkpoint1Hints[item.id]);
    const isCorrect = answer === item.answer;
    const targetResult = state.structureTargetResults[item.id] || {};
    const targetLogId = CHECKPOINT1_TARGET_LOG_IDS[item.id];
    return {
      question_id: `${mission.unit_id}_scan_${targetLogId}`,
      checkpoint_id: "checkpoint1",
      question_type: "visual_target_choice",
      target_id: targetLogId,
      target_index: index + 1,
      target_count: checkpoint1Items.length,
      required_target_count: checkpoint1Items.length,
      diagram_type: diagramTypeForTarget(item.id),
      attempt_answer: answer,
      correct_answer: item.answer,
      is_correct: isCorrect,
      hint_used: hintUsed,
      attempt_count: Number(targetResult.attempt_count || (answer ? 1 : 0)),
      corrected_after_hint: Boolean(isCorrect && hintUsed),
      final_completed: isCorrect,
      exp_type: "evidence_only",
      exp_awarded: 0
    };
  });
}

function buildAttempt() {
  const now = new Date().toISOString();
  const completedTargetCount = checkpoint1Items.length - remainingStructureTargets();
  const checkpoint1Result = state.result?.section_stats?.find((item) => item.title === "細胞構造辨識");
  return {
    timestamp: now,
    student: state.student,
    mission,
    attempt_type: state.attempt_type,
    attempt_no: studentAttempts(state.student.student_id).length + 1,
    started_at: state.started_at,
    submitted_at: state.submitted_at || now,
    completion_status: completedTargetCount === checkpoint1Items.length ? "complete" : "incomplete",
    ...state.result,
    confidence_score: state.answers.reflection.confidence_score,
    confident_concept: state.answers.reflection.confident_concept,
    uncertain_concept: state.answers.reflection.uncertain_concept,
    student_question: state.answers.reflection.student_question,
    reflection_quality: state.result.reflection_quality,
    reflection_exp_reason: state.result.reflection_exp_reason,
    reflection_review_status: state.result.reflection_review_status,
    cell_structure_required_target_ids_json: Object.values(CHECKPOINT1_TARGET_LOG_IDS),
    cell_structure_required_target_count: checkpoint1Items.length,
    cell_structure_completed_target_count: completedTargetCount,
    cell_structure_missing_target_count: checkpoint1Items.length - completedTargetCount,
    cell_structure_checkpoint_completion_status: completedTargetCount === checkpoint1Items.length ? "complete" : "incomplete",
    cell_structure_checkpoint_exp_awarded: checkpoint1Result?.exp || 0,
    cell_structure_checkpoint_exp_type: checkpoint1Result?.exp === CHECKPOINT1_CONCEPT_EXP ? "concept" : checkpoint1Result?.exp === CHECKPOINT1_REVISION_EXP ? "revision" : "none",
    question_logs: buildCheckpoint1QuestionLogs(),
    raw_answers: state.answers
  };
}

function renderResult() {
  const result = state.result?.section_stats ? state.result : calculateResult();
  const expRows = [
    { title: "完成任務", detail: "完整提交本次預習檢核", value: result.completion_exp },
    { title: "概念答對", detail: `未使用提示直接答對 ${result.correct_without_hint} 題`, value: result.concept_exp },
    { title: "提示後修正", detail: `使用提示後仍完成修正 ${result.corrected_after_hint} 題`, value: result.revision_exp },
    { title: "回報品質", detail: result.reflection_exp_reason || "空白可提交，但沒有回報 EXP。", value: result.question_exp },
    { title: "再挑戰", detail: state.attempt_type === "retry" ? "本次為重新登入後從頭完成的再挑戰紀錄" : "首次挑戰不列入", value: result.retry_exp },
    { title: "精熟表現", detail: result.mastery_exp ? "正確率達到精熟門檻" : "尚未達到精熟門檻", value: result.mastery_exp }
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
          <div class="score-box"><span>總 EXP</span><strong>${result.total_exp}</strong></div>
          <div class="score-box"><span>答對題數</span><strong>${result.correct}/${result.total}</strong></div>
          <div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div>
        </div>

        <h3>各關表現</h3>
        <div class="result-table">
          ${result.section_stats.map((item) => `
            <div class="result-row">
              <strong>${item.title}</strong>
              <span>答對 ${item.correct}/${item.total}</span>
              <span>直接答對 ${item.correct_without_hint}</span>
              <span>提示後修正 ${item.corrected_after_hint}</span>
              <b>+${item.exp} EXP</b>
            </div>
          `).join("")}
        </div>

        <h3>EXP 明細</h3>
        <div class="exp-ledger">
          ${expRows.map((item) => `
            <div class="exp-row ${item.value ? "" : "muted-row"}">
              <div>
                <strong>${item.title}</strong>
                <span>${item.detail}</span>
              </div>
              <b>+${item.value}</b>
            </div>
          `).join("")}
        </div>

        <h3>取得徽章</h3>
        ${renderBadgeCatalog(result.badges)}
        <div class="actions">
          <button class="primary" id="goAchievements">查看我的成就</button>
          <button class="secondary" id="goRules">查看 EXP 規則</button>
        </div>
      </div>
      <div class="owl-frame"><img src="${cellStructureOwlAssets.result}" alt="任務結算貓頭鷹助理"></div>
    </div>
  `;
}

function aggregateStudent() {
  if (!state.student) return { totalExp: 0, badges: [], attempts: [] };
  const attempts = studentAttempts(state.student.student_id);
  const totalExp = attempts.reduce((sum, item) => sum + (item.total_exp || 0), 0);
  const badges = [...new Set(attempts.flatMap((item) => item.badges || []))];
  return { totalExp, badges, attempts };
}

function renderBadgeCatalog(earnedBadges) {
  const earned = new Set(earnedBadges || []);
  return `
    <div class="badge-grid">
      ${unitBadgeCatalog.map((badge) => `
        <div class="badge ${earned.has(badge.name) ? "earned" : "locked"}" data-badge-id="${badge.id}">
          <img src="${badge.badge_image_path}" alt="${badge.name}">
          <strong>${badge.name}</strong>
          <p>${badge.condition}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function titleForExp(exp) {
  if (titleProgressRules) return titleProgressRules.getTitleForExp(exp);
  const titles = [
    { need: 0, title: "見習調查員" }, { need: 500, title: "生命觀察員" }, { need: 1500, title: "生態記錄員" },
    { need: 3000, title: "概念解謎者" }, { need: 5200, title: "微觀探索者" }, { need: 8000, title: "系統調查員" },
    { need: 11800, title: "生命研究員" }, { need: 16700, title: "BioQuest 專家" }, { need: 23400, title: "生命祕境守護者" }
  ];
  const currentIndex = titles.reduce((index, item, itemIndex) => exp >= item.need ? itemIndex : index, 0);
  const current = titles[currentIndex];
  const next = titles[currentIndex + 1];
  return next ? { current: current.title, next: next.title, need: next.need, remaining: next.need - exp } : { current: current.title, next: "已達目前最高稱號", need: current.need, remaining: 0 };
}

function renderAchievements() {
  if (!state.student) return renderLogin();
  const aggregate = aggregateStudent();
  const title = titleForExp(aggregate.totalExp);
  const progress = titleProgressRules?.progressPercent(aggregate.totalExp) ?? Math.min(100, (aggregate.totalExp / TITLE_PROGRESS_CAP) * 100);
  const currentResultBadges = state.result?.badges || [];
  const unitBadges = [...new Set([...aggregate.badges, ...currentResultBadges])];
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">累積成就</p>
        <h2>${state.student.student_name}</h2>
        <p class="lead">${state.student.class_name} 班 ${state.student.seat_no} 號｜目前稱號：${title.current}</p>
        ${renderTitleAvatarCard("achievements")}
        <div class="score-grid">
          <div class="score-box"><span>累積 EXP</span><strong>${aggregate.totalExp}</strong></div>
          <div class="score-box"><span>已取得徽章</span><strong>${aggregate.badges.length}</strong></div>
          <div class="score-box"><span>完成任務</span><strong>${aggregate.attempts.length}</strong></div>
        </div>
        <h3>下一稱號：${title.next}${title.remaining ? `｜還差 ${title.remaining} EXP` : ""}</h3>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="muted">稱號進度 ${aggregate.totalExp >= TITLE_PROGRESS_CAP ? 100 : Math.floor(progress * 10) / 10}%｜稱號進度以 ${TITLE_PROGRESS_CAP.toLocaleString()} EXP 封頂；全冊理論仍可累積 ${FULL_BOOK_EXP_MAX.toLocaleString()} EXP，達最高稱號後 EXP 繼續累積。</p>
      </div>
      <div class="panel">
        <p class="eyebrow">本單元成就</p>
        <h3>細胞工廠的祕密</h3>
        <p class="muted">本單元可收集的徽章會全部列在這裡，已取得的徽章會亮燈。</p>
        ${renderBadgeCatalog(unitBadges)}
      </div>
      <div class="panel bq-all-unit-badge-overview" data-bq-badge-overview="true"></div>
      <div class="panel">
        <h3>可再挑戰任務</h3>
        <p>${aggregate.attempts.length ? "細胞工廠的祕密" : "完成首次任務後，這裡會出現可再挑戰項目。"}</p>
      </div>
    </div>
  `;
}

function renderRules() {
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">EXP 規則</p>
        <h2>第一次不熟不是失敗</h2>
        <p class="lead">能發現自己哪裡不確定，並願意回來修正，就是 BioQuest 重視的學習成果。</p>
      </div>
      <div class="panel checkpoint-grid">
        ${[
          ["完成 EXP", "完成整份任務即可獲得。"],
          ["概念 EXP", "核心概念判斷正確即可獲得。"],
          ["修正 EXP", "使用提示後成功修正也能獲得。"],
          ["提問 EXP", "提出具體問題可獲得。"],
          ["再挑戰 EXP", "已完成任務後，重新登入並從頭完成整份任務才會列為再挑戰。回到前面修改單題不會新增再挑戰紀錄。"],
          ["精熟 EXP", "完整挑戰後表現達成高正確率可獲得。"],
          ["稱號規劃", `稱號採前段較快、後段逐級增加的非線性門檻；全冊理論可累積 ${FULL_BOOK_EXP_MAX.toLocaleString()} EXP，稱號進度以 ${TITLE_PROGRESS_CAP.toLocaleString()} EXP 封頂，達門檻後 EXP 仍照常累積。`]
        ].map(([title, text]) => `<div class="question-row"><strong>${title}</strong><p>${text}</p></div>`).join("")}
      </div>
    </div>
  `;
}

function nextWithValidation(group, items, nextScreen) {
  const missing = items.filter((item) => !state.answers[group][item.id]);
  const remaining = group === "checkpoint1" ? remainingStructureTargets() : 0;
  if (missing.length || remaining) {
    document.querySelector("#checkpointFeedback").textContent = remaining
      ? `尚有 ${remaining} 個構造未辨識，完成所有 target 後才能進下一關。`
      : "還有題目尚未完成。";
    return;
  }
  unlock(nextScreen);
  setScreen(nextScreen);
}

function attachCurrentScreen() {
  if (state.screen === "login") attachLogin();
  if (state.screen === "brief") document.querySelector("#briefNext").addEventListener("click", () => { unlock("scan"); setScreen("scan"); });
  if (state.screen === "scan") document.querySelector("#scanNext").addEventListener("click", () => { unlock("checkpoint1"); setScreen("checkpoint1"); });
  if (state.screen === "checkpoint1") {
    attachSelectHandlers();
    scheduleStructureTransitionClear();
    document.querySelector("#checkpoint1Next").addEventListener("click", () => nextWithValidation("checkpoint1", checkpoint1Items, "checkpoint2"));
  }
  if (state.screen === "checkpoint2") {
    attachSelectHandlers();
    document.querySelector("#checkpoint2Next").addEventListener("click", () => nextWithValidation("checkpoint2", checkpoint2Items, "checkpoint3"));
  }
  if (state.screen === "checkpoint3") {
    attachCompareHandlers();
    document.querySelector("#checkpoint3Next").addEventListener("click", () => {
      const missing = compareTokens.filter((token) => !state.answers.checkpoint3[token]);
      if (missing.length) {
        document.querySelector("#checkpointFeedback").textContent = "還有構造卡尚未分類。";
        return;
      }
      unlock("checkpoint4");
      setScreen("checkpoint4");
    });
  }
  if (state.screen === "checkpoint4") {
    attachChoiceHandlers();
    document.querySelector("#checkpoint4Next").addEventListener("click", () => nextWithValidation("checkpoint4", misconceptionQuestions, "review"));
  }
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
