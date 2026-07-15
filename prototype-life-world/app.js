const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", profile_gender: "neutral", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";

const mission = {
  unit_id: "life_world",
  unit_title: "多彩多姿的生命世界",
  mission_title: "生命訊號偵測任務",
  mission_area: "生命觀測站"
};

const mentorName = "阿澤老師";
const mentorImages = {
  primary: "assets/mentor-life-world-azhe-v2.webp"
};
const owlImages = {
  prep: "assets/owl-life-world-prep-reminder.webp",
  reflection: "assets/owl-life-feedback.webp",
  result: "assets/owl-life-result.webp"
};
const feedbackMentorImages = {
  excellent: { label: "零提示全對", image: "assets/mentor-life-world-feedback-excellent.webp" },
  strong: { label: "概念穩定", image: "assets/mentor-life-world-feedback-strong.webp" },
  stable: { label: "持續整理", image: "assets/mentor-life-world-feedback-stable.webp" },
  needs_review: { label: "需要再釐清", image: "assets/mentor-life-world-feedback-needs-review.webp" },
  retry_ready: { label: "再挑戰準備", image: "assets/mentor-life-world-feedback-retry-ready.webp" }
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
const DIRECT_RAW_MAX = 405;
const REVISION_RAW_MAX = 225;

const unitBadgeCatalog = [
  { id: "life_world_entry", name: "生命觀測入門徽章", condition: "完成生命訊號偵測任務。", badge_image_path: "assets/badges/life_world_entry.webp" },
  { id: "living_evidence_detector", name: "生命證據偵測徽章", condition: "生物與非生物判斷關卡達 85% 以上。", badge_image_path: "assets/badges/life_world_living_evidence_detector.webp" },
  { id: "life_phenomena_mapper", name: "生命現象配對徽章", condition: "生命現象配對關卡達 85% 以上。", badge_image_path: "assets/badges/life_world_life_phenomena_mapper.webp" },
  { id: "survival_condition_guardian", name: "生存條件守門徽章", condition: "生存條件題組達 85% 以上。", badge_image_path: "assets/badges/life_world_survival_condition_guardian.webp" },
  { id: "biosphere_observer", name: "生物圈觀察徽章", condition: "生物圈與環境關卡達 85% 以上。", badge_image_path: "assets/badges/life_world_biosphere_observer.webp" },
  { id: "life_signal_flawless", name: "生命訊號零提示全對徽章", condition: "全部答對，且全程未使用提示。本單元最高表現徽章。", badge_image_path: "assets/badges/life_world_life_signal_flawless.webp" },
  { id: "misconception_reviser_life_world", name: "生命迷思修正徽章", condition: "至少 1 題使用提示後修正成功。", badge_image_path: "assets/badges/life_world_misconception_reviser.webp" },
  { id: "retry_growth_life_world", name: "再探生命進步徽章", condition: "再挑戰完整完成，且本次正確率高於前一次完整挑戰。位階低於零提示全對。", badge_image_path: "assets/badges/life_world_retry_growth.webp" },
  { id: "reflection_reporter_life_world", name: "高品質回報候選徽章", condition: "回報內容能提出具體、可帶到課堂討論的本單元問題。", badge_image_path: "assets/badges/life_world_reflection_reporter.webp" }
];

const storageKey = "bioquest_life_world_state_v1";
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
    checkpoint1: {},
    checkpoint1Hints: {},
    checkpoint2: {},
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

function owlReminderCard(title, text, image = owlImages.prep) {
  return `
    <div class="owl-reminder-card">
      <div class="owl-reminder-avatar"><img src="${image}" alt="貓頭鷹助理"></div>
      <div>
        <span>貓頭鷹助理</span>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function feedbackMentorState(result) {
  if (result.retry_improved) return "retry_ready";
  if (result.no_hint_perfect) return "excellent";
  if (result.accuracy >= 0.85 && !result.teacher_attention_needed) return "strong";
  if (result.teacher_attention_needed || result.reflection_review_status === "pending_review") return "needs_review";
  return "stable";
}

function feedbackMentorCard(result) {
  const stateKey = feedbackMentorState(result);
  const visual = feedbackMentorImages[stateKey] || feedbackMentorImages.stable;
  const copy = {
    excellent: "你能不用提示完成全部判斷，接下來可以練習把判斷證據說給同學聽。",
    strong: "你的生命現象判斷已經穩定，請把仍想確認的例子帶到課堂討論。",
    stable: "你已完成任務，接下來請整理最能支持判斷的證據與還會混淆的情境。",
    needs_review: "系統偵測到幾個需要再釐清的概念，請先閱讀下方建議，再用自己的話提問。",
    retry_ready: "這次再挑戰有進步，請保留這次修正成功的判斷線索。"
  };
  return `
    <div class="feedback-mentor-card" data-feedback-mentor-state="${stateKey}" data-feedback-mentor-image-hook="${visual.image}">
      <div class="mentor-avatar"><img src="${visual.image}" alt="${mentorName}：${visual.label}"></div>
      <div class="mentor-copy">
        <span>${mentorName}｜${visual.label}</span>
        <strong>任務回饋</strong>
        <p>${copy[stateKey]}</p>
      </div>
    </div>
  `;
}

function layout(content, image = "assets/owl-life-opening.webp", imageAlt = "貓頭鷹助理") {
  return `
    <div class="mission-layout">
      <div class="panel hero-panel">${content}</div>
      <div class="owl-frame"><img src="${image}" alt="${imageAlt}"></div>
    </div>
  `;
}

function renderLifeScene() {
  return `
    <div class="life-scene" aria-label="校園生命觀察場景">
      <span class="scan-dot" style="left:24%;top:54%"></span>
      <span class="scan-dot" style="left:42%;top:72%"></span>
      <span class="scan-dot" style="left:66%;top:42%"></span>
      <span class="scan-dot" style="left:82%;top:68%"></span>
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
  return `
    <div class="wide-layout">
      <div class="panel hero-panel">
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">任務登入</h2>
        <div class="story-panel">
          <strong>先確認身分</strong>
          <p>請先輸入學號並確認姓名。下一頁才會開啟本單元任務情境與角色說明。老師測試流程時可使用 guest。</p>
        </div>
        <div class="mission-hud">
          <div><span>任務代號</span><strong>life_world</strong></div>
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
      </div>
    </div>
  `;
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
  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}&_=${Date.now()}`;
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
  window.BioQuestLoginUX?.begin({ guest: id === "guest" });
  await window.BioQuestLoginUX?.paint();
  message.innerHTML = `<span class="pill">正在連接 BioQuest 學習後台，請稍候……</span>`;
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
    if (id !== "guest") {
      message.innerHTML = `<span class="pill warn">後台目前無法連線，尚未登入。請檢查網路後重試或通知老師。</span>`;
      return;
    }
    student = roster.guest;
    completedAttempts = studentAttempts(student.student_id).length;
    attemptType = completedAttempts > 0 ? "retry" : "first";
    message.innerHTML = `<span class="pill warn">guest 已切換為本機測試模式，不列入正式統計。</span>`;
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
  const briefingBackground = "assets/bg-life-world-briefing-azhe-wide.webp";
  return `
    <div class="wide-layout">
      <div class="panel hero-panel brief-scene-card" data-brief-mentor-background-hook="${briefingBackground}" data-student-character-hook="${titleCharacter}">
        <p class="eyebrow">任務檔案開啟</p>
        <h2 class="hero-title">歡迎，${state.student.student_name}</h2>
        <div class="brief-visual-row">
          ${renderBriefBackground(briefingBackground, "阿澤老師在生命觀測站的任務簡報背景", "多彩環境影像已接入，請用生命現象與生存條件作為判斷證據。")}
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
          <strong>生命觀測站收到新影像</strong>
          <p>水族館、森林、沙漠、深海和校園角落傳來不同影像。這些畫面裡有生物，也有非生物。只看會不會動很容易誤判，這次任務要用生命現象和生存條件作為證據。</p>
        </div>
        <div class="story-panel">
          <strong>任務核心</strong>
          <p>掃描生命訊號，分辨生物與非生物，整理生命現象、生存條件與生物圈的概念。</p>
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
  const tools = ["不用單看會不會動", "尋找多種生命現象", "區分生物生長與非生物變大", "連結生存條件與環境", "用證據修正直覺判斷"];
  return `
    <div class="wide-layout">
      <div class="panel hero-panel">
        <p class="eyebrow">任務準備</p>
        <h2 class="hero-title">進關卡前先整理判斷工具</h2>
        ${owlReminderCard("生命訊號掃描提醒", "生物不一定會快速移動，會移動的物體也不一定是生物。接下來請用代謝、生長與發育、感應與運動、生殖，以及生存條件來判斷。")}
        <div class="card-grid">
          ${tools.map((tool) => `<div class="life-card"><span class="life-icon"></span><strong>${tool}</strong></div>`).join("")}
        </div>
        <div class="actions">
          <button class="primary" id="scanNext">進入生命訊號分類</button>
        </div>
      </div>
    </div>
  `;
}

const classifyItems = [
  { id: "squirrel", label: "松鼠", icon: "living", answer: "living", concepts: ["living_nonliving_evidence"], misconceptions: [] },
  { id: "sprout", label: "豆苗", icon: "living", answer: "living", concepts: ["growth_development"], misconceptions: ["no_movement_not_life", "plant_not_living"] },
  { id: "rock", label: "石頭", icon: "nonliving", answer: "nonliving", concepts: ["living_nonliving_evidence"], misconceptions: [] },
  { id: "water", label: "水", icon: "water", answer: "nonliving", concepts: ["survival_resources"], misconceptions: ["single_resource_survival"] },
  { id: "livingstone", label: "生石花", icon: "living", answer: "living", concepts: ["growth_development", "reproduction"], misconceptions: ["growth_confusion", "no_movement_not_life"] }
];

const classifyCategories = [
  { id: "living", title: "有生命現象的生物" },
  { id: "nonliving", title: "沒有生命現象的非生物" }
];

const evidenceQuestions = [
  {
    id: "remote_car",
    concept_id: "living_nonliving_evidence",
    prompt: "一台遙控車會移動、會轉彎，這樣就能判定它是生物嗎？",
    options: ["不能，還需要生命現象證據", "能，因為會動就是生物", "能，因為會消耗電力", "不能，因為所有會動的東西都不是生物"],
    answer: "不能，還需要生命現象證據",
    hint: "觀察移動之外，還要找是否有生長、代謝、感應或生殖等生命現象。",
    misconception: "movement_equals_life"
  },
  {
    id: "livingstone",
    concept_id: "growth_development",
    prompt: "生石花外表像石頭，但會慢慢長大並開花。這些線索主要支持哪個判斷？",
    options: ["它是生物，因為有生長與生殖相關現象", "它是非生物，因為外表像石頭", "它是非生物，因為不會快速移動", "無法判斷，因為植物不算生物"],
    answer: "它是生物，因為有生長與生殖相關現象",
    hint: "不要只看外表，注意時間變化中出現了哪些生命現象。",
    misconception: "no_movement_not_life"
  }
];

const phenomenonQuestions = [
  { id: "metabolism", concept_id: "metabolism", prompt: "生物分解食物中的養分，並合成身體需要的物質，較符合哪一種生命現象？", options: ["代謝", "生殖", "保護色", "生物圈"], answer: "代謝", hint: "重點是體內物質與能量的轉換。", misconception: "metabolism_confusion" },
  { id: "growth", concept_id: "growth_development", prompt: "豆苗逐漸長高、個體逐漸成熟，較符合哪一種生命現象？", options: ["生長與發育", "生殖", "代謝", "生物圈"], answer: "生長與發育", hint: "關鍵線索是大小與成熟程度隨時間改變。", misconception: "growth_confusion" },
  { id: "response", concept_id: "response_movement", prompt: "含羞草受到觸碰後葉片合起來，較符合哪一種生命現象？", options: ["感應與運動", "生殖", "生物圈", "非生物堆積"], answer: "感應與運動", hint: "先找外界刺激，再看生物是否產生反應。", misconception: "no_movement_not_life" },
  { id: "reproduction", concept_id: "reproduction", prompt: "植物開花後形成種子，讓新個體有機會產生，較符合哪一種生命現象？", options: ["生殖", "代謝", "生物圈", "保護色"], answer: "生殖", hint: "這個現象重點是能否延續下一代。", misconception: "reproduction_confusion" },
  { id: "plant_response", concept_id: "response_movement", prompt: "有同學說：「植物不會跑，所以植物沒有感應與運動。」哪個修正較合理？", options: ["植物也可能對光、觸碰等刺激產生反應", "植物都不是生物", "只有動物有生命現象", "植物只有生殖，沒有其他生命現象"], answer: "植物也可能對光、觸碰等刺激產生反應", hint: "想想植物面對光線或觸碰時，是否可能出現方向或形態變化。", misconception: "plant_not_living" }
];

const resourceQuestion = {
  id: "aquarium_resources",
  concept_id: "survival_resources",
  prompt: "水族館中的魚、水草要維持生命，可能需要哪些條件？",
  options: ["水", "空氣或溶解在水中的氣體", "養分", "適合的光線", "玻璃顏色"],
  answer: ["水", "空氣或溶解在水中的氣體", "養分", "適合的光線"],
  hint: "想想生命現象需要哪些資源或環境條件；外觀裝飾不一定是生存需求。",
  misconception: "single_resource_survival"
};

const environmentQuestions = [
  { id: "biosphere_meaning", concept_id: "biosphere", prompt: "下列哪個說法最接近「生物圈」的意思？", options: ["所有生物與其生存環境的總和", "只有所有動物", "只有森林裡的植物", "整個地球中心到外太空"], answer: "所有生物與其生存環境的總和", hint: "關鍵是生物和環境一起看，不只看生物名單。", misconception: "biosphere_is_only_living_things" },
  { id: "warm_wet", concept_id: "biosphere", prompt: "熱帶雨林和珊瑚礁中都有許多生物，常和哪些環境條件有關？", options: ["溫暖且水分充足", "完全沒有光線", "沒有任何養分", "所有地方都一樣適合生物"], answer: "溫暖且水分充足", hint: "先想這些環境能提供哪些生命活動需要的條件。", misconception: "single_resource_survival" }
];

const adaptationPairs = [
  { id: "cactus", label: "仙人掌肥厚莖", answer: "儲存水分" },
  { id: "polar_bear", label: "北極熊濃密毛髮與皮下脂肪", answer: "保暖" },
  { id: "leaf_butterfly", label: "枯葉蝶外形像枯葉", answer: "降低被發現機會" },
  { id: "inch_worm", label: "尺蠖外形像樹枝", answer: "降低被發現機會" }
];

const adaptationOptions = ["儲存水分", "保暖", "降低被發現機會", "幫助在水中呼吸"];

const misconceptionQuestions = [
  { id: "cloud_growth", concept_id: "growth_development", prompt: "有同學說：「雲會變大，所以雲是生物。」哪個判斷較合理？", options: ["變大不一定是生長，還要看是否有其他生命現象", "雲會變大所以一定是生物", "只要會移動就一定是生物", "雲會下雨所以會生殖"], answer: "變大不一定是生長，還要看是否有其他生命現象", hint: "先分辨物質聚集造成變大，和生物體生長是否相同。", misconception: "growth_confusion" },
  { id: "best_evidence", concept_id: "living_nonliving_evidence", prompt: "判斷一個物體是否為生物時，下列哪個策略最可靠？", options: ["綜合多個生命現象與生存條件證據", "只看它會不會動", "只看它有沒有綠色", "只看它是否在水裡"], answer: "綜合多個生命現象與生存條件證據", hint: "單一外觀線索容易誤判，試著同時看多種生命現象。", misconception: "movement_equals_life" }
];

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

function renderCheckpoint1() {
  const selected = state.answers.checkpoint1.classify || {};
  const orderedClassifyItems = orderedById("classifyItems", classifyItems);
  const orderedEvidenceQuestions = orderedById("evidenceQuestions", evidenceQuestions);
  const rows = `
    <div class="story-panel">
      <strong>分類任務</strong>
      <p>先點選一張觀察卡，再點選分類欄。提示只會提醒判斷線索，不會直接公布分類答案。</p>
    </div>
    <div class="token-bank">
      ${orderedClassifyItems.map((item) => `
        <button class="token ${state.activeToken === item.id ? "selected" : ""}" data-token="${item.id}">
          ${item.label}
        </button>
      `).join("")}
    </div>
    <div class="category-grid">
      ${classifyCategories.map((category) => `
        <div class="category-column" data-category="${category.id}">
          <h3>${category.title}</h3>
          <div class="token-list">
            ${classifyItems.filter((item) => selected[item.id] === category.id).map((item) => `<span class="pill">${item.label}</span>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
    <button class="ghost hint-button" data-hint="checkpoint1" data-id="classify">提示</button>
    ${state.answers.checkpoint1Hints.classify ? `<div class="hint">先找能否生長、代謝、感應或生殖等證據，不要只看外表或會不會動。</div>` : ""}
    ${orderedEvidenceQuestions.map((item) => renderChoiceQuestion("checkpoint1", item)).join("")}
  `;
  return checkpointShell("關卡一：生命訊號分類", "用生命現象證據判斷生物與非生物。", rows, "checkpoint1Next");
}

function renderCheckpoint2() {
  const rows = orderedById("phenomenonQuestions", phenomenonQuestions).map((item) => renderChoiceQuestion("checkpoint2", item)).join("");
  return checkpointShell("關卡二：生命現象判讀", "分辨代謝、生長與發育、感應與運動、生殖等生命現象。", rows, "checkpoint2Next");
}

function renderCheckpoint3() {
  const checked = state.answers.checkpoint3[resourceQuestion.id] || [];
  const rows = `
    <div class="question-row multi-question">
      <div>
        <span class="multi-badge">可複選</span>
        <strong>${resourceQuestion.prompt}</strong>
        <p class="multi-instruction">請選出所有符合的選項，可能不只一個答案。</p>
        ${state.answers.checkpoint3Hints[resourceQuestion.id] ? `<div class="hint">${resourceQuestion.hint}</div>` : ""}
      </div>
      <div>
        <div class="multi-choice-title">可複選清單</div>
      <div class="checkbox-list">
        ${optionOrder(`options_${resourceQuestion.id}`, resourceQuestion.options).map((option) => `
          <label><input type="checkbox" value="${option}" data-multi="${resourceQuestion.id}" ${checked.includes(option) ? "checked" : ""}>${option}</label>
        `).join("")}
      </div>
      </div>
      <button class="ghost hint-button" data-group="checkpoint3" data-id="${resourceQuestion.id}">提示</button>
    </div>
    ${orderedById("environmentQuestions", environmentQuestions).map((item) => renderChoiceQuestion("checkpoint3", item)).join("")}
  `;
  return checkpointShell("關卡三：生存條件與生物圈", "整理生物生存需要的條件，並理解生物與環境共同構成生物圈。", rows, "checkpoint3Next");
}

function renderCheckpoint4() {
  const orderedAdaptationPairs = orderedById("adaptationPairs", adaptationPairs);
  const orderedMisconceptionQuestions = orderedById("misconceptionQuestions", misconceptionQuestions);
  const rows = `
    <div class="story-panel">
      <strong>生存策略配對</strong>
      <p>把生物特徵和可能的生存意義配對。提示會引導你觀察環境壓力，不會直接給答案。</p>
    </div>
    ${orderedAdaptationPairs.map((item) => {
      const current = state.answers.checkpoint4[item.id] || "";
      const hintUsed = state.answers.checkpoint4Hints[item.id];
      return `
        <div class="question-row">
          <div>
            <strong>${item.label}</strong>
            ${hintUsed ? `<div class="hint">${adaptationHint(item.id)}</div>` : ""}
          </div>
          <div class="match-field ${current ? "has-selection" : ""}">
            <select class="match-select" data-select-group="checkpoint4" data-id="${item.id}">
            <option value="">選擇生存意義</option>
            ${optionOrder("adaptationOptions", adaptationOptions).map((option) => `<option value="${option}" ${current === option ? "selected" : ""}>${option}</option>`).join("")}
            </select>
            <span class="selected-answer">${current ? `已選：${current}` : "尚未選擇生存意義"}</span>
          </div>
          <button class="ghost hint-button" data-group="checkpoint4" data-id="${item.id}">提示</button>
        </div>
      `;
    }).join("")}
    ${orderedMisconceptionQuestions.map((item) => renderChoiceQuestion("checkpoint4", item)).join("")}
  `;
  return checkpointShell("關卡四：生存策略與迷思修正", "觀察特徵與環境的關係，並修正常見判斷迷思。", rows, "checkpoint4Next");
}

function adaptationHint(id) {
  const hints = {
    cactus: "先想沙漠或乾燥環境中，水分可能是重要限制。",
    polar_bear: "先想寒冷環境中，維持體溫可能很重要。",
    leaf_butterfly: "先想外形像周圍環境時，可能比較不容易被發現。",
    inch_worm: "先想外形像樹枝時，可能和躲避捕食者有關。"
  };
  return hints[id];
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
      if (!state.answers.checkpoint1.classify) state.answers.checkpoint1.classify = {};
      state.answers.checkpoint1.classify[state.activeToken] = column.dataset.category;
      state.activeToken = null;
      saveState();
      render();
    });
  });
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
  document.querySelectorAll("[data-select-group]").forEach((select) => {
    select.addEventListener("change", () => {
      state.answers[select.dataset.selectGroup][select.dataset.id] = select.value;
      const item = adaptationPairs.find((entry) => entry.id === select.dataset.id);
      if (item && select.value !== item.answer) state.answers[`${select.dataset.selectGroup}Hints`][select.dataset.id] = true;
      saveState();
      const field = select.closest(".match-field");
      const selectedAnswer = field?.querySelector(".selected-answer");
      if (field && selectedAnswer) {
        field.classList.toggle("has-selection", Boolean(select.value));
        selectedAnswer.textContent = select.value ? `已選：${select.value}` : "尚未選擇生存意義";
      }
      if (item && select.value !== item.answer) render();
    });
  });
  document.querySelectorAll("[data-multi]").forEach((box) => {
    box.addEventListener("change", () => {
      const id = box.dataset.multi;
      const values = [...document.querySelectorAll(`[data-multi="${id}"]:checked`)].map((item) => item.value);
      state.answers.checkpoint3[id] = values;
      saveState();
    });
  });
  document.querySelectorAll(".hint-button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.group || button.dataset.hint;
      const id = button.dataset.id;
      state.answers[`${group}Hints`][id] = true;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-nav-target]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.navTarget)));
}

function findQuestion(id) {
  return [...evidenceQuestions, ...phenomenonQuestions, resourceQuestion, ...environmentQuestions, ...misconceptionQuestions].find((item) => item.id === id);
}

function validateCheckpoint1() {
  const classify = state.answers.checkpoint1.classify || {};
  const missingClassify = classifyItems.some((item) => !classify[item.id]);
  const missingChoices = evidenceQuestions.some((item) => !state.answers.checkpoint1[item.id]);
  return !(missingClassify || missingChoices);
}

function validateGroup(group, questions) {
  return questions.every((item) => state.answers[group][item.id]);
}

function validateCheckpoint3() {
  return (state.answers.checkpoint3[resourceQuestion.id] || []).length > 0 && validateGroup("checkpoint3", environmentQuestions);
}

function validateCheckpoint4() {
  return adaptationPairs.every((item) => state.answers.checkpoint4[item.id]) && validateGroup("checkpoint4", misconceptionQuestions);
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

function scoreCheckpoint1() {
  const classify = state.answers.checkpoint1.classify || {};
  let correct = 0;
  const misconceptions = [];
  classifyItems.forEach((item) => {
    if (classify[item.id] === item.answer) correct += 1;
    else misconceptions.push(...item.misconceptions, item.answer === "living" ? "no_movement_not_life" : "movement_equals_life");
  });
  const usedHint = Boolean(state.answers.checkpoint1Hints.classify);
  const classifyScore = {
    concept: usedHint ? 0 : correct * 15,
    revision: usedHint ? correct * 10 : 0,
    correct,
    correctWithoutHint: usedHint ? 0 : correct,
    correctedAfterHint: usedHint ? correct : 0,
    hintUsed: usedHint ? 1 : 0,
    total: classifyItems.length,
    misconceptions
  };
  const evidenceScore = scoreChoiceQuestions(evidenceQuestions, "checkpoint1", 20, 10);
  return combineScores(classifyScore, evidenceScore);
}

function scoreMultiSelect() {
  const selected = state.answers.checkpoint3[resourceQuestion.id] || [];
  const answer = resourceQuestion.answer;
  const correctItems = answer.filter((item) => selected.includes(item)).length;
  const wrongItems = selected.filter((item) => !answer.includes(item)).length;
  const correct = correctItems === answer.length && wrongItems === 0 ? 1 : 0;
  const usedHint = Boolean(state.answers.checkpoint3Hints[resourceQuestion.id]);
  return {
    concept: correct && !usedHint ? 30 : 0,
    revision: correct && usedHint ? 15 : 0,
    correct,
    correctWithoutHint: correct && !usedHint ? 1 : 0,
    correctedAfterHint: correct && usedHint ? 1 : 0,
    hintUsed: usedHint ? 1 : 0,
    total: 1,
    misconceptions: correct ? [] : [resourceQuestion.misconception]
  };
}

function scoreAdaptation() {
  let correct = 0;
  let concept = 0;
  let revision = 0;
  let correctWithoutHint = 0;
  let correctedAfterHint = 0;
  let hintUsed = 0;
  const misconceptions = [];
  adaptationPairs.forEach((item) => {
    const usedHint = Boolean(state.answers.checkpoint4Hints[item.id]);
    if (usedHint) hintUsed += 1;
    if (state.answers.checkpoint4[item.id] === item.answer) {
      correct += 1;
      if (usedHint) {
        revision += 10;
        correctedAfterHint += 1;
      } else {
        concept += 15;
        correctWithoutHint += 1;
      }
    } else {
      misconceptions.push("adaptation_strategy_confusion");
    }
  });
  return { concept, revision, correct, correctWithoutHint, correctedAfterHint, hintUsed, total: adaptationPairs.length, misconceptions };
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
    /^會動但不是生物的例子$/,
    /^不太會動但屬於生物的例子$/,
    /^生石花的生命現象$/,
    /^植物感應與運動$/,
    /^生物圈和環境的關係$/,
    /^特殊環境中的生物生存策略$/
  ];
  return copiedTemplates.some((pattern) => pattern.test(normalized));
}

function evaluateReflectionQuality(reflection = {}) {
  const fields = [reflection.confident_concept, reflection.uncertain_concept, reflection.student_question];
  const joined = fields.map((item) => item || "").join(" ").trim();
  const normalized = normalizeReflectionText(joined);
  const rawQuestion = (reflection.student_question || "").trim();
  const conceptTerms = ["生物", "非生物", "生命現象", "代謝", "生長", "發育", "感應", "運動", "生殖", "生存條件", "生物圈", "環境", "養分", "呼吸", "證據", "植物", "生石花"];
  const learningPhrases = ["為什麼", "怎麼", "如何", "判斷", "差別", "是不是", "不確定", "混淆", "分辨", "不知道", "不懂", "看不懂", "關係", "證據"];
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
  if (["生命", "判斷", "那邊"].some((term) => joined.includes(term)) && ["難", "看不懂", "不懂", "不會"].some((term) => joined.includes(term))) return { reflection_quality: "needs_review", question_exp: 0, reflection_exp_reason: "可能有學習困難，但未指出明確概念，需教師複核。", reflection_review_status: "pending_review" };
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
  const s1 = scaleScore(scoreCheckpoint1());
  const s2 = scaleScore(scoreChoiceQuestions(phenomenonQuestions, "checkpoint2", 20, 10));
  const s3 = scaleScore(combineScores(scoreMultiSelect(), scoreChoiceQuestions(environmentQuestions, "checkpoint3", 20, 10)));
  const s4 = scaleScore(combineScores(scoreAdaptation(), scoreChoiceQuestions(misconceptionQuestions, "checkpoint4", 30, 15)));
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
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, questionExp)));
  const attemptTotalExp = Math.min(reflectionLedgerCap, uncappedAttemptExp);
  const previousBestCredited = previousBestCreditedExp();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(previousBestCredited, attemptTotalExp));
  const creditedDelta = Math.max(0, unitCreditedExp - previousBestCredited);
  const misconceptions = [...new Set([...s1.misconceptions, ...s2.misconceptions, ...s3.misconceptions, ...s4.misconceptions].filter(Boolean))];
  const badges = [unitBadgeCatalog[0].name];
  if (s1.correct / s1.total >= 0.85) badges.push(unitBadgeCatalog[1].name);
  if (s2.correct / s2.total >= 0.85) badges.push(unitBadgeCatalog[2].name);
  if (resourceQuestion && scoreMultiSelect().correct / scoreMultiSelect().total >= 0.85) badges.push(unitBadgeCatalog[3].name);
  const biosphereCorrect = environmentQuestions.filter((item) => state.answers.checkpoint3[item.id] === item.answer).length;
  if (biosphereCorrect / environmentQuestions.length >= 0.85) badges.push(unitBadgeCatalog[4].name);
  if (noHintPerfect) badges.push(unitBadgeCatalog[5].name);
  if (revisionExp > 0) badges.push(unitBadgeCatalog[6].name);
  if (retryImproved) badges.push(unitBadgeCatalog[7].name);
  if (reflectionEvaluation.reflection_quality === "discussion_question") badges.push(unitBadgeCatalog[8].name);
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
      { title: "生命訊號分類", correct: s1.correct, total: s1.total, correct_without_hint: s1.correctWithoutHint, corrected_after_hint: s1.correctedAfterHint, exp: s1.concept + s1.revision },
      { title: "生命現象判讀", correct: s2.correct, total: s2.total, correct_without_hint: s2.correctWithoutHint, corrected_after_hint: s2.correctedAfterHint, exp: s2.concept + s2.revision },
      { title: "生存條件與生物圈", correct: s3.correct, total: s3.total, correct_without_hint: s3.correctWithoutHint, corrected_after_hint: s3.correctedAfterHint, exp: s3.concept + s3.revision },
      { title: "生存策略與迷思修正", correct: s4.correct, total: s4.total, correct_without_hint: s4.correctWithoutHint, corrected_after_hint: s4.correctedAfterHint, exp: s4.concept + s4.revision }
    ],
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
    movement_equals_life: "會動不一定是生物，機械移動或被動移動不等於生命現象。",
    no_movement_not_life: "不會快速移動不代表不是生物，植物也能表現生命現象。",
    growth_confusion: "非生物變大不等於生物生長，需要放在生命活動脈絡中判斷。",
    plant_not_living: "植物也是生物，能代謝、生長、感應與生殖。",
    biosphere_is_only_living_things: "生物圈包含生物及其生存環境，不只有生物本身。",
    single_resource_survival: "水很重要，但生物通常還需要其他資源與適合環境。",
    adaptation_strategy_confusion: "生物特徵可從環境壓力與生存機會來思考。"
  };
  return map[tag] || "建議再用生命現象與環境證據檢查自己的判斷。";
}

function getConceptReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.8).map((item) => item.title);
  const revisit = result.misconceptions.map((tag) => ({ tag, text: misconceptionText(tag) }));
  const directions = ["會動但不是生物的例子", "不太會動但屬於生物的例子", "生石花的生命現象", "植物感應與運動", "生物圈和環境的關係", "特殊環境中的生物生存策略"];
  return {
    stable: stable.length ? stable : ["任務已完成，接下來請整理自己最有把握的判斷線索。"],
    revisit: revisit.length ? revisit.slice(0, 6) : [{ tag: "extension", text: "本次概念很穩定，可以試著找生活中更多需要用證據判斷的例子。" }],
    directions
  };
}

function renderReview() {
  const review = getConceptReview();
  const result = calculateResult();
  const visualState = globalThis.BioQuestCharacterLayout?.feedbackState(result) || feedbackMentorState(result);
  return `
    <div class="wide-layout" data-feedback-state="${visualState}">
      <div class="panel">
        <p class="eyebrow">貓頭鷹助理概念回饋</p>
        <h2>先整理證據，再回報</h2>
        ${feedbackMentorCard(result)}
        <h3>目前較穩定的概念</h3>
        <div class="status-line">${review.stable.map((item) => `<span class="pill">${item}</span>`).join("")}</div>
        <h3>建議再閱讀理解</h3>
        <p class="section-note">這裡列出的是本次作答中可能需要再釐清的概念，請先回到題目情境想一想：你是用生命現象、生存條件，還是只用外表直覺判斷？</p>
        <div class="checkpoint-grid">
          ${review.revisit.map((item) => `<div class="question-row"><strong>${item.text}</strong></div>`).join("")}
        </div>
        <h3>可以帶到課堂的提問方向</h3>
        <p class="section-note">這些方向是幫你準備「希望老師課堂再解釋的部分」。填寫回報時，請選擇一個方向並改成自己的問題。</p>
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
    <div class="wide-layout">
      <div class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把你的預習狀態回報給老師</h2>
        ${owlReminderCard("留下自己的判斷線索", "空白可以提交但沒有回報 EXP；具體且和本單元概念相關、希望老師課堂再解釋的問題，才會取得回報 EXP。", owlImages.reflection)}
        <div class="story-panel">
          <strong>回報 EXP 怎麼判定？</strong>
          <p>只寫「不知道」「好難」或直接複製提問方向不會取得高分。請寫出生物、非生物、生命現象、代謝、生長、感應、生殖、生存條件或生物圈等概念，並補充自己的疑問。</p>
        </div>
        <div class="form-grid">
          <label>這次任務中，我最能判斷的生命現象是什麼？
            <textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea>
          </label>
          <label>我還不確定的生物與非生物判斷線索是什麼？
            <textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea>
          </label>
          <label>選一個你想帶到課堂討論的方向，並用自己的話補充
            <span class="field-help">請寫下你希望老師在課堂上再解釋的部分。方向可參考上一頁，但不要直接複製方向詞。</span>
            <textarea id="studentQuestion">${reflection.student_question || ""}</textarea>
          </label>
          <label>信心分數
            <span class="field-help">1 分代表「我需要老師帶著整理」；5 分代表「我能自己說明本單元重點概念」。</span>
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
    const confirmed = window.confirm("提交後會進行結算，本次作答不能再修改；若要再挑戰，請重新登入並從頭完成。確定要提交任務嗎？");
    if (!confirmed) return;
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
    const submittedAt = new Date().toISOString();
    state.submitted_at = submittedAt;
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
          <div class="score-box"><span>答對題數</span><strong>${result.correct}/${result.total}</strong></div>
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
        <h3>取得徽章</h3>
        ${renderBadgeCatalog(result.badges)}
        <div class="actions">
          <button class="primary" id="goAchievements">查看我的成就</button>
          <button class="secondary" id="goRules">查看 EXP 規則</button>
        </div>
      </div>
      <div class="owl-frame"><img src="assets/owl-life-result.webp" alt="任務結算貓頭鷹助理"></div>
    </div>
  `;
}

function aggregateStudent() {
  if (!state.student) return { totalExp: 0, badges: [], attempts: [] };
  const attempts = studentAttempts(state.student.student_id);
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

function badgeFallbackIcon(badge) {
  if (badge.id === "life_signal_flawless") return "★";
  if (badge.id.includes("retry")) return "↗";
  if (badge.id.includes("reviser")) return "✓";
  return "◆";
}

function renderBadgeCatalog(earnedBadges) {
  const earned = new Set(earnedBadges || []);
  return `<div class="badge-grid">${unitBadgeCatalog.map((badge) => {
    const isEarned = earned.has(badge.name);
    const imageMarkup = badge.badge_image_path
      ? `<img src="${badge.badge_image_path}" alt="${badge.name}">`
      : `<span aria-hidden="true">${badgeFallbackIcon(badge)}</span>`;
    return `
      <div class="badge ${isEarned ? "earned" : "locked"}" data-badge-id="${badge.id}" data-badge-image-hook="${badge.badge_image_path}">
        <div class="badge-visual ${badge.id === "life_signal_flawless" ? "gold" : ""}">${imageMarkup}</div>
        <strong>${badge.name}</strong>
        <p>${badge.condition}</p>
      </div>
    `;
  }).join("")}</div>`;
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
        <div class="student-title-card" data-student-gender="${studentGenderKey()}" data-current-title-id="${title.id}" data-title-character-hook="${studentTitleCharacterPath(title.id)}">
          <div class="student-character"><img src="${studentTitleCharacterPath(title.id)}" alt="${title.current}稱號角色"></div>
          <div>
            <span>稱號角色</span>
            <strong>${title.current}</strong>
            <p>依登入資料與目前稱號顯示；缺少性別或稱號資料時使用穩定預設角色。</p>
          </div>
        </div>
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
        <h3>生命訊號偵測任務</h3>
        ${renderBadgeCatalog(unitBadges)}
      </div>
      <div class="panel bq-all-unit-badge-overview" data-bq-badge-overview="true"></div>
    </div>
  `;
}

function renderRules() {
  const rows = [
    ["單元上限", `每個標準單元最高認列 ${UNIT_EXP_CAP} EXP；累積 EXP 只採本單元歷次完整挑戰中的最高認列分數。`],
    ["最高路徑", `第一次全部答對且全程未使用提示，可取得本單元最高路徑：完成 100、直接答對最高 ${DIRECT_EXP_POOL}、回報最高 40、零提示全對精熟 140，合計 ${UNIT_EXP_CAP}。`],
    ["提示後修正", `使用提示後修正仍有 EXP，但同題低於直接答對；提示後全對的精熟 EXP 是 80，低於零提示全對。`],
    ["回報 EXP", "具體且與生命現象、生物圈或判斷證據相關的回報最高 40；空白、無關內容或直接複製方向詞不給高分。"],
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
  if (state.screen === "checkpoint2") document.querySelector("#checkpoint2Next").addEventListener("click", () => advanceIf(validateGroup("checkpoint2", phenomenonQuestions), "checkpoint3"));
  if (state.screen === "checkpoint3") document.querySelector("#checkpoint3Next").addEventListener("click", () => advanceIf(validateCheckpoint3(), "checkpoint4"));
  if (state.screen === "checkpoint4") document.querySelector("#checkpoint4Next").addEventListener("click", () => advanceIf(validateCheckpoint4(), "review"));
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
