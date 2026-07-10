const roster = {
  S70101: { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安", profile_gender: "female" },
  S70102: { student_id: "S70102", class_name: "701", seat_no: "02", student_name: "陳柏宇", profile_gender: "male" },
  S70103: { student_id: "S70103", class_name: "701", seat_no: "03", student_name: "許若晴", profile_gender: "female" },
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", profile_gender: "neutral", is_guest: true }
};

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbws7n-pzOGA7ZaQe044cAA4JElgjVsDTMokXf9ZifKZoGQHRyNSFpuxVppkC8PzZFATqQ/exec";

const mission = {
  unit_id: "lab_intro",
  unit_title: "進入實驗室",
  mission_title: "實驗室安全啟動任務",
  mission_area: "安全訓練室"
};

const mentorName = "阿澤老師";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const DIRECT_RAW_MAX = 435;
const REVISION_RAW_MAX = 261;
const LAB_ENTRY_VERSION = "20260711-unit23-title-avatar-v1";

const labVisualAssets = {
  briefingSceneImage: "assets/bg-lab-entry-briefing-azhe-wide.png",
  ambientBackgroundImage: "assets/bg-lab-entry-safety-station-wide.png",
  mentorPrimary: "assets/mentor-lab-azhe-v2.png",
  mentorFallback: "assets/mentor-life-world-azhe.png",
  mentorReplacementHook: "assets/mentor-lab-azhe-v2.png",
  owlHooks: {
    opening: "assets/owl-lab-safety-scan.png",
    scan: "assets/owl-lab-safety-scan.png",
    equipment: "assets/owl-lab-equipment-check.png",
    risk: "assets/owl-lab-risk-alert.png",
    cleanup: "assets/owl-lab-cleanup.png",
    result: "assets/owl-lab-cleanup.png"
  }
};

const TITLE_AVATAR_BASE_PATH = "../shared-assets/title-avatars";
const TITLE_LEVELS = [
  { id: "trainee_investigator", order: "01", need: 0, title: "見習調查員" },
  { id: "life_observer", order: "02", need: 1500, title: "生命觀察員" },
  { id: "ecology_recorder", order: "03", need: 3500, title: "生態記錄員" },
  { id: "concept_solver", order: "04", need: 6500, title: "概念解謎者" },
  { id: "micro_explorer", order: "05", need: 10000, title: "微觀探索者" },
  { id: "systems_investigator", order: "06", need: 14000, title: "系統調查員" },
  { id: "life_researcher", order: "07", need: 18000, title: "生命研究員" },
  { id: "bioquest_expert", order: "08", need: 22000, title: "BioQuest 專家" },
  { id: "bioquest_guardian", order: "09", need: 26000, title: "生命祕境守護者" }
];
const titleIdAliases = {
  micro_world_explorer: "micro_explorer",
  system_investigator: "systems_investigator",
  life_mystery_guardian: "bioquest_guardian"
};
const titleAvatarImages = TITLE_LEVELS.reduce((images, title) => {
  images[title.id] = {
    male: `${TITLE_AVATAR_BASE_PATH}/title-${title.order}-${title.id}-male.png`,
    female: `${TITLE_AVATAR_BASE_PATH}/title-${title.order}-${title.id}-female.png`
  };
  return images;
}, {});
const fallbackTitleAvatarPath = `${TITLE_AVATAR_BASE_PATH}/title-01-trainee_investigator-male.png`;

const unitBadgeCatalog = [
  { id: "lab_intro_entry", name: "實驗室入門徽章", condition: "完成實驗室安全啟動任務。" },
  { id: "equipment_function_identifier", name: "器材功能辨識徽章", condition: "器材功能配對關卡達 85% 以上。" },
  { id: "equipment_selection_planner", name: "器材選用徽章", condition: "依實驗目的選用合適器材關卡達 85% 以上。" },
  { id: "lab_safety_judge", name: "安全情境判斷徽章", condition: "實驗室安全情境判斷關卡達 85% 以上。" },
  { id: "operation_sequence_mapper", name: "操作順序徽章", condition: "基本安全處理步驟排序關卡達 85% 以上。" },
  { id: "lab_intro_flawless", name: "實驗室零提示全對徽章", condition: "全部答對，且全程未使用提示。本單元最高表現徽章。" },
  { id: "lab_safety_reflector", name: "安全態度回報徽章", condition: "回報品質達 discussion_question，且具備安全、器材或操作關聯。" },
  { id: "retry_growth_lab_intro", name: "再探實驗室進步徽章", condition: "再挑戰完整完成，且本次正確率高於前一次完整挑戰。" }
];

const storageKey = "bioquest_lab_intro_state_v1";
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
    checkpoint1: { apparatus: {} },
    checkpoint1Hints: {},
    checkpoint2: { sequence: {} },
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
let draggedSequenceId = null;

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

const apparatusItems = [
  { id: "cylinder", label: "量筒", answer: "量取液體體積", misconception: "tube_beaker_confusion" },
  { id: "beaker", label: "燒杯", answer: "盛裝、混合或加熱液體", misconception: "beaker_as_precise_measure" },
  { id: "test_tube", label: "試管", answer: "少量反應或觀察", misconception: "tube_beaker_confusion" },
  { id: "dropper", label: "滴管", answer: "少量滴加液體", misconception: "memorize_names_only" },
  { id: "forceps", label: "鑷子", answer: "夾取小物", misconception: "direct_touch_tools" },
  { id: "slide", label: "載玻片", answer: "承載觀察標本", misconception: "memorize_names_only" }
];

const apparatusOptions = ["量取液體體積", "盛裝、混合或加熱液體", "少量反應或觀察", "少量滴加液體", "夾取小物", "承載觀察標本"];

const slideToolsQuestion = {
  id: "slide_tools",
  concept_id: "apparatus_selection",
  prompt: "要製作洋蔥表皮臨時玻片，下列哪些器材較可能用到？",
  options: ["載玻片", "蓋玻片", "滴管", "鑷子", "量筒", "燒杯"],
  answer: ["載玻片", "蓋玻片", "滴管", "鑷子"],
  hint: "先想製片需要承載、覆蓋、滴加與夾取；不必選所有桌上的器材。",
  misconception: "memorize_names_only"
};

const checkpoint1Choices = [
  {
    id: "measure_20ml",
    concept_id: "volume_containers",
    prompt: "想比較準確地量取 20 mL 水，較適合先選哪一種器材？",
    options: ["量筒", "燒杯", "試管", "鑷子"],
    answer: "量筒",
    hint: "留意題目要的是量取體積，而不是只把水裝起來。",
    misconception: "beaker_as_precise_measure"
  },
  {
    id: "small_reaction",
    concept_id: "volume_containers",
    prompt: "要讓少量液體在容器中反應並方便觀察變化，較適合使用哪一種器材？",
    options: ["試管", "載玻片", "鑷子", "量筒"],
    answer: "試管",
    hint: "想想哪種器材適合少量液體反應，也方便手持或放在架上觀察。",
    misconception: "tube_beaker_confusion"
  },
  {
    id: "water_drop",
    concept_id: "small_tools",
    prompt: "做顯微鏡觀察前，要把一小滴水加在載玻片上，較適合使用哪一種器材？",
    options: ["滴管", "量筒", "燒杯", "試管夾"],
    answer: "滴管",
    hint: "看動作是否需要少量、逐滴加入液體。",
    misconception: "memorize_names_only"
  }
];

const sequenceSteps = [
  { id: "stop", label: "停止操作", order: 1 },
  { id: "warn", label: "提醒附近同學避開", order: 2 },
  { id: "tell_teacher", label: "通知老師", order: 3 },
  { id: "tool_cleanup", label: "依老師指示用工具處理", order: 4 }
];

const checkpoint2Choices = [
  {
    id: "unknown_bottle",
    concept_id: "lab_safety_rules",
    prompt: "進入實驗室後，看到桌上有未標示的藥品瓶，最合適的做法是什麼？",
    options: ["不擅自打開，先依教師指示確認", "聞一聞確認味道", "倒一點出來看看", "和同學猜內容物"],
    answer: "不擅自打開，先依教師指示確認",
    hint: "未知物質的風險在於不知道成分與處理方式，先降低接觸風險。",
    misconception: "chemical_casual_handling"
  },
  {
    id: "heat_direction",
    concept_id: "heating_glass_safety",
    prompt: "加熱試管中的液體時，下列哪個方向較安全？",
    options: ["試管口不要朝向自己或他人", "試管口對著同學方便觀察", "試管口朝自己才看得清楚", "試管口方向不重要"],
    answer: "試管口不要朝向自己或他人",
    hint: "想想液體受熱時可能噴濺，開口方向會影響誰暴露在風險中。",
    misconception: "heating_low_risk"
  },
  {
    id: "waste_liquid",
    concept_id: "chemicals_waste",
    prompt: "實驗後剩下的液體不知道能不能倒入水槽，最合適的做法是什麼？",
    options: ["依教師指示倒入指定廢液容器或處理位置", "直接倒掉再沖水", "倒回原藥品瓶", "混進其他組的廢液杯"],
    answer: "依教師指示倒入指定廢液容器或處理位置",
    hint: "廢液處理要考慮污染、反應與回收方式；先找指定處理規則。",
    misconception: "waste_sink_default"
  },
  {
    id: "running_lab",
    concept_id: "lab_safety_rules",
    prompt: "有同學說：「只要我很小心，實驗室裡跑一下也沒關係。」哪個修正較合理？",
    options: ["實驗室可能有火源、玻璃與藥品，跑動會增加碰撞與翻倒風險", "只要速度不快就可以", "靠牆跑比較安全", "老師沒看到就沒關係"],
    answer: "實驗室可能有火源、玻璃與藥品，跑動會增加碰撞與翻倒風險",
    hint: "安全判斷要看環境中有哪些可能被碰撞、灑出或打翻的風險。",
    misconception: "heating_low_risk"
  }
];

const chemicalRulesQuestion = {
  id: "chemical_rules",
  concept_id: "chemicals_waste",
  prompt: "使用藥品時，下列哪些注意事項較合適？",
  options: ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問", "剩餘藥品一定倒回原瓶", "不同藥品可隨意混合"],
  answer: ["不任意聞或嘗藥品", "用完依指示處理", "標籤不清楚時先詢問"],
  hint: "先排除會讓未知物質接觸身體、污染原瓶或發生未知反應的做法。",
  misconception: "chemical_casual_handling"
};

const checkpoint3Choices = [
  {
    id: "beaker_precision",
    concept_id: "apparatus_selection",
    prompt: "有同學說：「燒杯有刻度，所以一定適合精準量體積。」哪個修正較合理？",
    options: ["燒杯刻度多用於粗略估計，較準確量體積應選合適的量測器材", "燒杯刻度比量筒更準", "燒杯只能裝固體", "有刻度的器材都一樣準"],
    answer: "燒杯刻度多用於粗略估計，較準確量體積應選合適的量測器材",
    hint: "注意題目比較的是精準量取和大致盛裝或混合兩種目的。",
    misconception: "beaker_as_precise_measure"
  },
  {
    id: "honest_record",
    concept_id: "records_attitude",
    prompt: "如果觀察結果和預期不同，實驗紀錄最合適的做法是什麼？",
    options: ["如實記錄結果與可能異常，再和老師討論", "把資料改成預期結果", "只寫成功的部分", "不交紀錄"],
    answer: "如實記錄結果與可能異常，再和老師討論",
    hint: "實驗紀錄的價值在於呈現真實過程，異常資料也能幫助找原因。",
    misconception: "record_success_only"
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

function imageWithFallback(src, fallback, alt, className = "") {
  const safeClass = className ? ` class="${className}"` : "";
  return `<img src="${src}" alt="${alt}"${safeClass} onerror="this.onerror=null;this.src='${fallback}';this.classList.add('using-fallback');">`;
}

function mentorCard(title, text, image = labVisualAssets.mentorPrimary) {
  return `
    <div class="mentor-card">
      <div class="mentor-avatar">${imageWithFallback(image, labVisualAssets.mentorFallback, mentorName)}</div>
      <div class="mentor-copy">
        <span>${mentorName}</span>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function owlPanel(stage = "opening", imageAlt = "貓頭鷹助理") {
  const asset = labVisualAssets.owlHooks[stage];
  return `
    <div class="owl-frame lab-owl-frame lab-owl-${stage}">
      <img class="unit-owl-img" src="${asset}" alt="${imageAlt}" onerror="this.remove();this.closest('.owl-frame').classList.add('use-fallback');">
      <div class="lab-owl-fallback" role="img" aria-label="${imageAlt}">
        <span class="owl-goggle left"></span>
        <span class="owl-goggle right"></span>
        <span class="owl-beak"></span>
        <span class="owl-scanner"></span>
      </div>
      <p class="asset-todo">TODO：若正式素材需替換，維持同一 asset hook：${asset}</p>
    </div>
  `;
}

function layout(content, owlStage = "opening", imageAlt = "貓頭鷹助理") {
  return `
    <div class="mission-layout">
      <div class="panel hero-panel">${content}</div>
      ${owlPanel(owlStage, imageAlt)}
    </div>
  `;
}

function renderLabScene() {
  return `
    <div class="lab-scene" aria-label="實驗室安全訓練站場景">
      <span class="tool-shape beaker-shape" style="left:16%;top:63%"></span>
      <span class="tool-shape tube-shape" style="left:36%;top:59%"></span>
      <span class="tool-shape goggles-shape" style="left:62%;top:66%"></span>
      <span class="scan-dot" style="left:20%;top:58%"></span>
      <span class="scan-dot" style="left:66%;top:60%"></span>
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
      <div><span>任務代號</span><strong>lab_intro</strong></div>
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
  `, "opening", "實驗室安全掃描貓頭鷹助理");
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
      <div class="panel hero-panel brief-scene-card" data-briefing-scene-image="${labVisualAssets.briefingSceneImage}" data-ambient-background-image="${labVisualAssets.ambientBackgroundImage}" data-student-character-hook="${titleCharacter}">
        <p class="eyebrow">任務檔案開啟</p>
        <h2 class="hero-title">歡迎，${state.student.student_name}</h2>
        <div class="brief-visual-row">
          ${renderBriefBackground(labVisualAssets.briefingSceneImage, "阿澤老師在實驗室安全訓練站的任務簡報主視覺", "安全訓練站已開啟，請用器材用途與風險線索完成判斷。")}
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
          <strong>實驗室入口檢查</strong>
          <p>器材不是只背名稱，安全也不是口號。今天要用「我要做什麼」和「可能有什麼風險」來判斷每一步。</p>
        </div>
        <div class="story-panel">
          <strong>任務核心</strong>
          <p>辨識器材用途，選擇合適器材，判斷加熱、玻璃、藥品與廢液風險，並理解安全處理順序與實驗紀錄態度。</p>
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
  const tools = ["先看目的：量、盛、反應、滴加、夾取、觀察", "遇到未知藥品先停下並詢問", "加熱要注意開口方向與防燙", "破裂玻璃不可徒手處理", "紀錄要保留真實結果與異常"];
  return layout(`
    <p class="eyebrow">任務準備</p>
    <h2 class="hero-title">進關卡前先整理安全線索</h2>
    <div class="story-panel">
      <strong>安全訓練提醒</strong>
      <p>提示會給用途或風險線索，不會直接公布器材或安全答案。請先判斷任務目的，再檢查火源、高溫、玻璃、藥品、未知物質與廢液風險。</p>
    </div>
    <div class="card-grid">
      ${tools.map((tool) => `<div class="method-card"><span class="method-icon"></span><strong>${tool}</strong></div>`).join("")}
    </div>
    <div class="actions">
      <button class="primary" id="scanNext">進入器材準備台</button>
    </div>
  `, "scan", "實驗室安全掃描貓頭鷹助理");
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

function renderApparatusMatch() {
  const selected = state.answers.checkpoint1.apparatus || {};
  const orderedItems = orderedById("apparatusItems", apparatusItems);
  return `
    <div class="question-row classify-question">
      <div>
        <span class="multi-badge">可配對</span>
        <strong>請將器材和主要用途配對。</strong>
        <p class="multi-instruction">每個器材選一個主要用途。提示只會引導量、盛、反應、滴加、夾取、觀察等線索。</p>
        ${state.answers.checkpoint1Hints.apparatus ? `<div class="hint">先想每個動作是量、盛、反應、滴加、夾取，還是顯微鏡觀察前準備。</div>` : ""}
      </div>
      <div class="sequence-list">
        ${orderedItems.map((item) => `
          <label class="sequence-item match-item ${selected[item.id] ? "has-selection" : ""}">
            <strong>${item.label}</strong>
            <select class="match-select" data-match="apparatus" data-id="${item.id}">
              <option value="">選擇用途</option>
              ${optionOrder("apparatusOptions", apparatusOptions).map((option) => `<option value="${option}" ${selected[item.id] === option ? "selected" : ""}>${option}</option>`).join("")}
            </select>
            <span class="selected-answer">${selected[item.id] ? `已選：${selected[item.id]}` : "尚未選擇用途"}</span>
          </label>
        `).join("")}
      </div>
      <button class="ghost hint-button" data-group="checkpoint1" data-id="apparatus">提示</button>
    </div>
  `;
}

function renderMultiQuestion(group, item) {
  const checked = state.answers[group][item.id] || [];
  return `
    <div class="question-row multi-question">
      <div>
        <span class="multi-badge">可複選</span>
        <strong>${item.prompt}</strong>
        <p class="multi-instruction">請選出所有符合的選項，可能不只一個答案。</p>
        ${state.answers[`${group}Hints`][item.id] ? `<div class="hint">${item.hint}</div>` : ""}
      </div>
      <div>
        <div class="multi-choice-title">可複選清單</div>
        <div class="checkbox-list">
          ${optionOrder(`options_${item.id}`, item.options).map((option) => `
            <label><input type="checkbox" value="${option}" data-multi-group="${group}" data-multi="${item.id}" ${checked.includes(option) ? "checked" : ""}>${option}</label>
          `).join("")}
        </div>
      </div>
      <button class="ghost hint-button" data-group="${group}" data-id="${item.id}">提示</button>
    </div>
  `;
}

function renderCheckpoint1() {
  const rows = `
    ${renderApparatusMatch()}
    ${orderedById("checkpoint1Choices", checkpoint1Choices).map((item) => renderChoiceQuestion("checkpoint1", item)).join("")}
    ${renderMultiQuestion("checkpoint1", slideToolsQuestion)}
  `;
  return checkpointShell("關卡一：器材準備台", "依實驗目的判斷器材用途，並選擇合適的觀察與製片工具。", rows, "checkpoint1Next");
}

function renderSequenceQuestion() {
  const orderedSteps = getSequenceOrder().map((id) => sequenceSteps.find((step) => step.id === id)).filter(Boolean);
  return `
    <div class="question-row multi-question">
      <div>
        <span class="multi-badge">拖曳排序</span>
        <strong>玻璃器材不小心破裂時，請排出較安全的處理順序。</strong>
        <p class="multi-instruction">請拖曳步驟卡排出完整順序；手機可用上移 / 下移按鈕。提示只提供風險處理方向，不直接排好答案。</p>
        ${state.answers.checkpoint2Hints.sequence ? `<div class="hint">先處理眼前風險，再通知可協助處理的人；避免直接徒手接觸。</div>` : ""}
      </div>
      <div class="sequence-list sortable-list" data-sequence-list="checkpoint2">
        ${orderedSteps.map((step, index) => `
          <div class="sequence-item sortable-item" draggable="true" data-sequence-id="${step.id}">
            <span class="drag-handle" aria-hidden="true"></span>
            <strong>${step.label}</strong>
            <div class="sequence-move-buttons" aria-label="${step.label}排序控制">
              <button class="ghost icon-action" data-sequence-move="up" data-sequence-id="${step.id}" ${index === 0 ? "disabled" : ""}>上移</button>
              <button class="ghost icon-action" data-sequence-move="down" data-sequence-id="${step.id}" ${index === orderedSteps.length - 1 ? "disabled" : ""}>下移</button>
            </div>
          </div>
        `).join("")}
      </div>
      <button class="ghost hint-button" data-group="checkpoint2" data-id="sequence">提示</button>
    </div>
  `;
}

function renderCheckpoint2() {
  const rows = `${renderSequenceQuestion()}${orderedById("checkpoint2Choices", checkpoint2Choices).map((item) => renderChoiceQuestion("checkpoint2", item)).join("")}`;
  return checkpointShell("關卡二：安全風險掃描", "判斷未知藥品、加熱、玻璃器材、廢液與走動碰撞等風險。", rows, "checkpoint2Next");
}

function renderCheckpoint3() {
  const rows = `${renderMultiQuestion("checkpoint3", chemicalRulesQuestion)}${orderedById("checkpoint3Choices", checkpoint3Choices).map((item) => renderChoiceQuestion("checkpoint3", item)).join("")}`;
  return checkpointShell("關卡三：收拾與紀錄檢查", "整理藥品與廢液處理原則，並理解實驗紀錄需要誠實保留結果與異常。", rows, "checkpoint3Next");
}

function renderCheckpoint4() {
  return checkpointShell("關卡四：安全態度確認", "選一個進入實驗室前最需要提醒自己的方向，並在下一頁用自己的話補充原因。", `
    <div class="story-panel highlight">
      <strong>最後檢查</strong>
      <p>等一下的任務回報會請你選一個方向，例如器材用途、加熱安全、藥品與廢液、玻璃器材或實驗紀錄，再寫下自己的提醒理由。</p>
    </div>
    <div class="question-row">
      <strong>完成安全態度確認後，請進入任務回報。</strong>
      <p>這一關不另外計入答題，重點是讓你先整理自己的安全提醒。</p>
    </div>
  `, "checkpoint4Next");
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
  document.querySelectorAll("[data-match]").forEach((select) => {
    select.addEventListener("change", () => {
      const id = select.dataset.id;
      state.answers.checkpoint1.apparatus[id] = select.value;
      const item = apparatusItems.find((entry) => entry.id === id);
      if (item && select.value !== item.answer) state.answers.checkpoint1Hints.apparatus = true;
      saveState();
      if (state.answers.checkpoint1Hints.apparatus) render();
    });
  });
  attachSequenceSortHandlers();
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
  document.querySelectorAll("[data-multi]").forEach((box) => {
    box.addEventListener("change", () => {
      const group = box.dataset.multiGroup;
      const id = box.dataset.multi;
      const values = [...document.querySelectorAll(`[data-multi-group="${group}"][data-multi="${id}"]:checked`)].map((item) => item.value);
      state.answers[group][id] = values;
      saveState();
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

function sequenceIds() {
  return sequenceSteps.map((step) => step.id);
}

function normalizeSequenceAnswer() {
  const saved = state.answers.checkpoint2.sequence;
  const validIds = sequenceIds();
  if (Array.isArray(saved) && saved.length) {
    const unique = saved.filter((id, index) => validIds.includes(id) && saved.indexOf(id) === index);
    return [...unique, ...validIds.filter((id) => !unique.includes(id))];
  }
  if (saved && typeof saved === "object" && Object.keys(saved).length) {
    const fromOldSelect = Object.entries(saved)
      .filter(([id, order]) => validIds.includes(id) && Number(order))
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map(([id]) => id);
    return [...fromOldSelect, ...validIds.filter((id) => !fromOldSelect.includes(id))];
  }
  return optionOrder("sequenceSteps", validIds);
}

function getSequenceOrder() {
  const normalized = normalizeSequenceAnswer();
  state.answers.checkpoint2.sequence = normalized;
  return normalized;
}

function setSequenceOrder(order) {
  const validIds = sequenceIds();
  state.answers.checkpoint2.sequence = order.filter((id) => validIds.includes(id));
  saveState();
}

function moveSequenceStep(id, direction) {
  const order = [...getSequenceOrder()];
  const index = order.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= order.length) return;
  [order[index], order[target]] = [order[target], order[index]];
  setSequenceOrder(order);
  render();
}

function moveDraggedSequence(beforeId) {
  if (!draggedSequenceId || draggedSequenceId === beforeId) return;
  const order = getSequenceOrder().filter((id) => id !== draggedSequenceId);
  const targetIndex = order.indexOf(beforeId);
  order.splice(targetIndex < 0 ? order.length : targetIndex, 0, draggedSequenceId);
  setSequenceOrder(order);
  draggedSequenceId = null;
  render();
}

function attachSequenceSortHandlers() {
  document.querySelectorAll("[data-sequence-id][draggable]").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      draggedSequenceId = item.dataset.sequenceId;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedSequenceId);
    });
    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedSequenceId = null;
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drag-over");
    });
    item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drag-over");
      moveDraggedSequence(item.dataset.sequenceId);
    });
  });
  document.querySelectorAll("[data-sequence-move]").forEach((button) => {
    button.addEventListener("click", () => moveSequenceStep(button.dataset.sequenceId, button.dataset.sequenceMove));
  });
}

function findQuestion(id) {
  return [...checkpoint1Choices, slideToolsQuestion, ...checkpoint2Choices, chemicalRulesQuestion, ...checkpoint3Choices].find((item) => item.id === id);
}

function validateCheckpoint1() {
  const apparatus = state.answers.checkpoint1.apparatus || {};
  return apparatusItems.every((item) => apparatus[item.id]) &&
    checkpoint1Choices.every((item) => state.answers.checkpoint1[item.id]) &&
    (state.answers.checkpoint1[slideToolsQuestion.id] || []).length > 0;
}

function validateCheckpoint2() {
  const sequence = getSequenceOrder();
  return sequence.length === sequenceSteps.length && checkpoint2Choices.every((item) => state.answers.checkpoint2[item.id]);
}

function validateCheckpoint3() {
  return (state.answers.checkpoint3[chemicalRulesQuestion.id] || []).length > 0 && checkpoint3Choices.every((item) => state.answers.checkpoint3[item.id]);
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

function scoreApparatus() {
  const selected = state.answers.checkpoint1.apparatus || {};
  const usedHint = Boolean(state.answers.checkpoint1Hints.apparatus);
  let correct = 0;
  const misconceptions = [];
  apparatusItems.forEach((item) => {
    if (selected[item.id] === item.answer) correct += 1;
    else misconceptions.push(item.misconception);
  });
  return {
    concept: usedHint ? 0 : correct * 15,
    revision: usedHint ? correct * 9 : 0,
    correct,
    correctWithoutHint: usedHint ? 0 : correct,
    correctedAfterHint: usedHint ? correct : 0,
    hintUsed: usedHint ? 1 : 0,
    total: apparatusItems.length,
    misconceptions
  };
}

function scoreSequence() {
  const sequence = getSequenceOrder();
  const usedHint = Boolean(state.answers.checkpoint2Hints.sequence);
  let correct = 0;
  const misconceptions = [];
  sequenceSteps.forEach((item) => {
    if (sequence[item.order - 1] === item.id) correct += 1;
    else misconceptions.push("direct_touch_tools");
  });
  return {
    concept: usedHint ? 0 : correct * 15,
    revision: usedHint ? correct * 9 : 0,
    correct,
    correctWithoutHint: usedHint ? 0 : correct,
    correctedAfterHint: usedHint ? correct : 0,
    hintUsed: usedHint ? 1 : 0,
    total: sequenceSteps.length,
    misconceptions
  };
}

function scoreMultiSelect(group, item, directPoints, revisionPoints) {
  const selected = state.answers[group][item.id] || [];
  const answer = item.answer;
  const correctItems = answer.filter((entry) => selected.includes(entry)).length;
  const wrongItems = selected.filter((entry) => !answer.includes(entry)).length;
  const correct = correctItems === answer.length && wrongItems === 0 ? 1 : 0;
  const usedHint = Boolean(state.answers[`${group}Hints`][item.id]);
  return {
    concept: correct && !usedHint ? directPoints : 0,
    revision: correct && usedHint ? revisionPoints : 0,
    correct,
    correctWithoutHint: correct && !usedHint ? 1 : 0,
    correctedAfterHint: correct && usedHint ? 1 : 0,
    hintUsed: usedHint ? 1 : 0,
    total: 1,
    misconceptions: correct ? [] : [item.misconception]
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
    /^量筒燒杯與試管的選用差異$/,
    /^滴管鑷子玻片在製片時的角色$/,
    /^加熱試管的安全風險$/,
    /^破裂玻璃的處理方式$/,
    /^未知藥品與剩餘藥品的處理$/,
    /^廢液是否能倒入水槽的判斷$/,
    /^實驗紀錄為什麼要寫異常結果$/
  ];
  return copiedTemplates.some((pattern) => pattern.test(normalized));
}

function evaluateReflectionQuality(reflection = {}) {
  const fields = [reflection.confident_concept, reflection.uncertain_concept, reflection.student_question];
  const joined = fields.map((item) => item || "").join(" ").trim();
  const normalized = normalizeReflectionText(joined);
  const rawQuestion = (reflection.student_question || "").trim();
  const conceptTerms = ["實驗室", "安全", "器材", "玻片", "蓋玻片", "滴管", "鑷子", "量筒", "燒杯", "試管", "酒精燈", "藥品", "廢液", "玻璃", "操作順序", "顯微鏡", "觀察", "紀錄", "加熱"];
  const learningPhrases = ["為什麼", "怎麼", "如何", "判斷", "差別", "是不是", "不確定", "混淆", "分辨", "不知道", "不懂", "看不懂", "處理", "風險"];
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
  if (["實驗", "安全", "那邊"].some((term) => joined.includes(term)) && ["難", "看不懂", "不懂", "不會"].some((term) => joined.includes(term))) return { reflection_quality: "needs_review", question_exp: 0, reflection_exp_reason: "可能有學習困難，但未指出明確概念，需教師複核。", reflection_review_status: "pending_review" };
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
  const equipmentFunctionScore = scoreApparatus();
  const equipmentSelectionScore = combineScores(scoreChoiceQuestions(checkpoint1Choices, "checkpoint1", 25, 15), scoreMultiSelect("checkpoint1", slideToolsQuestion, 30, 18));
  const s1 = scaleScore(combineScores(equipmentFunctionScore, equipmentSelectionScore));
  const operationSequenceScore = scoreSequence();
  const safetyChoiceScore = scoreChoiceQuestions(checkpoint2Choices, "checkpoint2", 25, 15);
  const s2 = scaleScore(combineScores(operationSequenceScore, safetyChoiceScore));
  const s3 = scaleScore(combineScores(scoreMultiSelect("checkpoint3", chemicalRulesQuestion, 30, 18), scoreChoiceQuestions(checkpoint3Choices, "checkpoint3", 25, 15)));
  const s4 = { concept: 0, revision: 0, raw_concept: 0, raw_revision: 0, correct: 0, correctWithoutHint: 0, correctedAfterHint: 0, hintUsed: 0, total: 0, misconceptions: [] };
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
  const badges = [unitBadgeCatalog[0].name];
  if (equipmentFunctionScore.correct / equipmentFunctionScore.total >= 0.85) badges.push(unitBadgeCatalog[1].name);
  if (equipmentSelectionScore.correct / equipmentSelectionScore.total >= 0.85) badges.push(unitBadgeCatalog[2].name);
  if (s2.correct / s2.total >= 0.85) badges.push(unitBadgeCatalog[3].name);
  if (operationSequenceScore.correct / operationSequenceScore.total >= 0.85) badges.push(unitBadgeCatalog[4].name);
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
      { title: "器材功能與選用", correct: s1.correct, total: s1.total, correct_without_hint: s1.correctWithoutHint, corrected_after_hint: s1.correctedAfterHint, exp: s1.concept + s1.revision },
      { title: "安全情境與操作順序", correct: s2.correct, total: s2.total, correct_without_hint: s2.correctWithoutHint, corrected_after_hint: s2.correctedAfterHint, exp: s2.concept + s2.revision },
      { title: "藥品廢液與實驗紀錄", correct: s3.correct, total: s3.total, correct_without_hint: s3.correctWithoutHint, corrected_after_hint: s3.correctedAfterHint, exp: s3.concept + s3.revision }
    ],
    equipment_function_score: equipmentFunctionScore.correct / equipmentFunctionScore.total,
    equipment_selection_score: equipmentSelectionScore.correct / equipmentSelectionScore.total,
    lab_safety_score: s2.correct / s2.total,
    operation_sequence_score: operationSequenceScore.correct / operationSequenceScore.total,
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
    memorize_names_only: "建議再用實驗目的整理器材：量取、盛裝、反應、滴加、夾取與觀察需要不同工具。",
    beaker_as_precise_measure: "建議再比較量筒與燒杯：量筒較適合量取體積，燒杯多用於盛裝、混合或粗略估計。",
    tube_beaker_confusion: "建議再確認燒杯、量筒與試管的使用情境，不要只看外形或是否能裝液體。",
    direct_touch_tools: "建議再理解鑷子與玻璃安全：小物可用工具夾取，破裂玻璃不可徒手處理。",
    heating_low_risk: "建議再閱讀加熱安全：開口方向、高溫、防燙與噴濺風險都要注意。",
    chemical_casual_handling: "建議再整理藥品安全：未知藥品不可擅自打開、聞、嘗、混合或倒回原瓶。",
    waste_sink_default: "建議再確認廢液處理：不是所有液體都能直接倒入水槽，需依教師指示分類。",
    record_success_only: "建議再理解實驗紀錄：不符合預期的結果也要如實記錄，才能幫助後續討論。"
  };
  return map[tag] || "建議再用目的與風險檢查自己的實驗室判斷。";
}

function getConceptReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.8).map((item) => item.title);
  const revisit = result.misconceptions.map((tag) => ({ tag, text: misconceptionText(tag) }));
  const directions = ["量筒、燒杯與試管的選用差異", "滴管、鑷子、玻片在製片時的角色", "加熱試管的安全風險", "破裂玻璃的處理方式", "未知藥品與剩餘藥品的處理", "廢液是否能倒入水槽的判斷", "實驗紀錄為什麼要寫異常結果"];
  return {
    stable: stable.length ? stable : ["任務已完成，接下來請整理自己最有把握的安全判斷線索。"],
    revisit: revisit.length ? revisit.slice(0, 6) : [{ tag: "extension", text: "本次概念很穩定，可以試著把下次實驗前的器材與風險檢查說出來。" }],
    directions
  };
}

function renderReview() {
  const review = getConceptReview();
  return `
    <div class="mission-layout">
      <div class="panel">
        <p class="eyebrow">貓頭鷹助理概念回饋</p>
        <h2>先整理風險，再回報</h2>
        ${mentorCard("課堂前提醒", "請不要只寫「不知道」或直接複製系統方向詞。試著用自己的話說明：哪個器材用途或安全情境你還想確認？")}
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
      ${owlPanel("risk", "實驗室風險整理貓頭鷹助理")}
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
        ${mentorCard("留下自己的安全提醒", "空白可以提交但沒有回報 EXP；具體且和本單元概念相關的問題或不確定，才會取得回報 EXP。")}
        <div class="story-panel">
          <strong>回報 EXP 怎麼判定？</strong>
          <p>請寫出實驗室、安全、器材、量筒、燒杯、試管、滴管、鑷子、玻璃器材、加熱、藥品、廢液、操作順序或實驗紀錄等概念，並補充自己的疑問或提醒。</p>
        </div>
        <div class="form-grid">
          <label>這次任務中，我最能掌握的一項器材用途或安全判斷是什麼？
            <textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea>
          </label>
          <label>我還不確定哪一種器材選用、加熱安全或藥品處理規則？
            <textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea>
          </label>
          <label>選一個你想帶到課堂討論的方向，並用自己的話補充
            <span class="field-help">方向可參考上一頁，但不要直接複製方向詞。</span>
            <textarea id="studentQuestion">${reflection.student_question || ""}</textarea>
          </label>
          <label>信心分數
            <span class="field-help">1 分代表「我需要老師帶著整理」；5 分代表「我能安全說明」。</span>
            <select id="confidenceScore">
              ${[1, 2, 3, 4, 5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="actions">
          <button class="primary" id="submitMission">提交任務</button>
        </div>
      </div>
      ${owlPanel("cleanup", "實驗室回報貓頭鷹助理")}
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
      ${owlPanel("result", "實驗室任務結算貓頭鷹助理")}
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
  return `<div class="badge-grid">${unitBadgeCatalog.map((badge) => `<div class="badge ${earned.has(badge.name) ? "earned" : "locked"}"><strong>${badge.name}</strong><p>${badge.condition}</p></div>`).join("")}</div>`;
}

function titleForExp(exp) {
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
  const remoteTotal = Number(state.student?.progress?.total_exp ?? state.student?.total_exp ?? NaN);
  const localTotal = state.student ? aggregateStudent().totalExp : 0;
  return titleForExp(Number.isFinite(remoteTotal) ? remoteTotal : localTotal);
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
  const title = titleForExp(aggregate.totalExp);
  const progress = title.remaining === 0 ? 100 : Math.min(100, Math.round((aggregate.totalExp / title.need) * 100));
  const unitBadges = [...new Set([...aggregate.badges, ...(state.result?.badges || [])])];
  return `
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">累積成就</p>
        <h2>${state.student.student_name}</h2>
        <p class="lead">${state.student.class_name} 班 ${state.student.seat_no} 號｜目前稱號：${title.current}</p>
        <div class="score-grid">
          <div class="score-box"><span>累積認列 EXP</span><strong>${aggregate.totalExp}</strong></div>
          <div class="score-box"><span>亮起徽章</span><strong>${aggregate.badges.length}</strong></div>
          <div class="score-box"><span>已認列單元</span><strong>${aggregate.completedUnits}</strong></div>
        </div>
        <h3>下一稱號：${title.next}${title.remaining ? `｜還差 ${title.remaining} EXP` : ""}</h3>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="muted">稱號依 52 個標準單元、每單元最高認列 500 EXP 規劃；全冊滿分 26,000 EXP，最高稱號為生命祕境守護者。</p>
      </div>
      <div class="panel">
        <p class="eyebrow">本單元成就</p>
        <h3>實驗室安全啟動任務</h3>
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
    ["提示後修正", "提示只提供用途或風險線索，不直接公布答案；提示後修正仍有 EXP，但同題低於直接答對。"],
    ["回報 EXP", "具體且與器材、安全、加熱、玻璃、藥品、廢液、操作順序或實驗紀錄相關的回報最高 40；空白、無關玩笑或直接複製方向詞不給高分。"],
    ["再挑戰進步", "已完成任務後，重新登入並從頭完成才算再挑戰；只有比前一次完整挑戰進步時給進步補分，且本單元認列仍不超過 500。"],
    ["稱號規劃", "全冊暫以 52 個單元、每單元 500 EXP 規劃，滿分 26,000 EXP；最高稱號為生命祕境守護者。"]
  ];
  const titles = [
    ["0", "見習調查員"],
    ["1,500", "生命觀察員"],
    ["3,500", "生態記錄員"],
    ["6,500", "概念解謎者"],
    ["10,000", "微觀探索者"],
    ["14,000", "系統調查員"],
    ["18,000", "生命研究員"],
    ["22,000", "BioQuest 專家"],
    ["26,000", "生命祕境守護者"]
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
  if (state.screen === "checkpoint3") document.querySelector("#checkpoint3Next").addEventListener("click", () => advanceIf(validateCheckpoint3(), "checkpoint4"));
  if (state.screen === "checkpoint4") document.querySelector("#checkpoint4Next").addEventListener("click", () => { unlock("review"); setScreen("review"); });
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
