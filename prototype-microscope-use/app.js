const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";

const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const mission = {
  unit_id: "microscope_use",
  unit_title: "顯微鏡的使用",
  mission_title: "微觀視野校準任務",
  mission_area: "微觀操作室"
};

const mentorName = "阿澤老師";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const DIRECT_RAW_MAX = 527;
const REVISION_RAW_MAX = 315;
const MICROSCOPE_VERSION = "20260714-microscope-paramecium-v3";
const titleProgressRules = window.BioQuestTitleProgress;
const TITLE_PROGRESS_CAP = titleProgressRules?.titleProgressCap || 23400;
const FULL_BOOK_EXP_MAX = titleProgressRules?.fullBookExpMax || 26000;

const microscopeVisualAssets = {
  mentorPrimary: "assets/mentor-life-world-azhe.webp",
  mentorFallback: "assets/mentor-life-world-azhe.webp",
  briefingSceneWide: `assets/bg-microscope-use-briefing-azhe-wide.webp?v=${MICROSCOPE_VERSION}`,
  briefingSceneMobile: `assets/bg-microscope-use-briefing-azhe-mobile.webp?v=${MICROSCOPE_VERSION}`,
  diagramParts: `assets/microscope-parts-interactive.webp?v=${MICROSCOPE_VERSION}`,
  onionLowPower: `assets/img-microscope-onion-low-power.webp?v=${MICROSCOPE_VERSION}`,
  onionHighPower: `assets/img-microscope-onion-high-power.webp?v=${MICROSCOPE_VERSION}`,
  parameciumViewLeft: `assets/img-microscope-paramecium-view-left.webp?v=${MICROSCOPE_VERSION}`,
  parameciumViewCenter: `assets/img-microscope-paramecium-view-center.webp?v=${MICROSCOPE_VERSION}`,
  parameciumViewRight: `assets/img-microscope-paramecium-view-right.webp?v=${MICROSCOPE_VERSION}`,
  owlHooks: {
    opening: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.webp",
    scan: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.webp",
    parts: "../prototype-cell-basic-unit/assets/owl-basic-unit-cell-scan.webp",
    focus: "../prototype-cell-basic-unit/assets/owl-basic-unit-cell-scan.webp",
    field: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp",
    review: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp",
    result: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp"
  }
};

const badgeAsset = (id) => `../shared-assets/badges/microscope_use/badge-microscope_use-${id}.webp`;
const unitBadgeCatalog = [
  { id: "microscope_use_entry", name: "微觀校準入門徽章", condition: "完成微觀視野校準任務。" },
  { id: "microscope_parts_identifier", name: "顯微鏡部位功能徽章", condition: "顯微鏡部位與功能辨識關卡達 85% 以上。" },
  { id: "low_to_high_operator", name: "低倍到高倍操作徽章", condition: "低倍尋找、高倍觀察與調焦順序關卡達 85% 以上。" },
  { id: "field_movement_judge", name: "視野移動判斷徽章", condition: "玻片移動方向與視野影像移動方向判斷關卡達 85% 以上。" },
  { id: "magnification_light_tuner", name: "倍率亮度判讀徽章", condition: "倍率、視野範圍、亮度與光圈或光源調整關卡達 85% 以上。" },
  { id: "microscope_use_flawless", name: "顯微鏡零提示全對徽章", condition: "全部答對，且全程未使用提示。本單元最高表現徽章。" },
  { id: "microscope_reflection_reporter", name: "高品質顯微回報徽章", condition: "回報品質達 discussion_question，且具備顯微操作或視野概念。" },
  { id: "retry_growth_microscope_use", name: "再探微觀視野進步徽章", condition: "再挑戰完整完成，且本次正確率高於前一次完整挑戰。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const storageKey = "bioquest_microscope_use_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");

const defaultState = {
  screen: "login",
  student: null,
  attempt_type: "first",
  started_at: null,
  completedScreens: ["login", "rules"],
  activeToken: null,
  activePart: null,
  partTargetIndex: 0,
  partTargetResults: {},
  fieldSlider: 0,
  answers: {
    checkpoint1: { parts: {}, functions: {} },
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

const partItems = [
  { id: "eyepiece", label: "目鏡", answer: "上方觀察處", function: "讓眼睛觀察，並與物鏡一起放大影像。", x: 35, y: 13, w: 18, h: 18, shape: "rect", misconception: "parts_names_only" },
  { id: "objective", label: "物鏡", answer: "靠近玻片的放大鏡頭", function: "靠近標本，負責主要放大；觀察時會先低倍再高倍。", x: 42, y: 40, w: 22, h: 18, shape: "rect", misconception: "parts_names_only" },
  { id: "stage", label: "載物臺", answer: "承放玻片的位置", function: "放置並固定玻片，讓標本位在光線通過的位置。", x: 43, y: 52, w: 38, h: 12, shape: "rect", misconception: "parts_names_only" },
  { id: "coarse", label: "粗調節輪", answer: "側邊大幅調焦", function: "大幅調整焦距，通常在低倍找焦時使用。", x: 73, y: 61, w: 16, h: 16, shape: "circle", misconception: "coarse_on_high_power" },
  { id: "fine", label: "細調節輪", answer: "側邊微調焦距", function: "小幅微調焦距，高倍下影像稍微模糊時使用。", x: 62, y: 69, w: 11, h: 11, shape: "circle", misconception: "coarse_on_high_power" },
  { id: "light", label: "光圈或光源", answer: "載物臺下方調整進光", function: "調整進入視野的光量；視野太暗時先檢查這裡。", x: 43, y: 72, w: 20, h: 12, shape: "rect", misconception: "focus_vs_light_confusion" }
];

const partPositionOptions = ["上方觀察處", "靠近玻片的放大鏡頭", "承放玻片的位置", "側邊大幅調焦", "側邊微調焦距", "載物臺下方調整進光"];

const functionItems = [
  { id: "viewing_path", label: "需要用眼睛觀察影像時，會從哪裡看？", answer: "目鏡", hint: "找最靠近眼睛、讓你觀看影像的部位。", misconception: "parts_names_only" },
  { id: "first_magnify", label: "靠近玻片並負責主要放大的是哪個部位？", answer: "物鏡", hint: "找離標本最近、會轉換低倍或高倍的鏡頭。", misconception: "parts_names_only" },
  { id: "slide_support", label: "玻片需要平放並固定在哪個位置？", answer: "載物臺", hint: "找承載玻片、讓光線通過標本的位置。", misconception: "parts_names_only" },
  { id: "large_focus", label: "低倍剛開始找焦，通常先用哪個部位大幅調整？", answer: "粗調節輪", hint: "找調整幅度較大的焦距控制，不適合高倍時大轉。", misconception: "coarse_on_high_power" },
  { id: "tiny_focus", label: "高倍下影像稍微模糊，應該微調哪個部位？", answer: "細調節輪", hint: "找調整幅度較小、用來微調清晰度的控制。", misconception: "coarse_on_high_power" },
  { id: "brightness_control", label: "視野太暗但已接近焦點時，應先檢查哪個部位？", answer: "光圈", hint: "先想進光量，不是先大幅改變焦距。", misconception: "focus_vs_light_confusion" }
];

const functionOptions = ["目鏡", "物鏡", "載物臺", "粗調節輪", "細調節輪", "光圈"];

const checkpoint1Choices = [
  {
    id: "fine_focus",
    concept_id: "focus_adjustment",
    prompt: "視野已經接近清楚，但還有一點模糊，最適合先調整哪個部位？",
    options: ["細調節輪", "目鏡", "鏡座", "載物臺夾"],
    answer: "細調節輪",
    hint: "題目說已經接近清楚，代表需要小幅度微調，而不是大幅改變位置。",
    misconception: "coarse_on_high_power"
  },
  {
    id: "too_dark",
    concept_id: "brightness_adjustment",
    prompt: "視野太暗，但標本大致已在焦點附近，下列哪個處理方向較合理？",
    options: ["調整光源、反光鏡或光圈", "用力轉粗調節輪", "把玻片拿掉", "直接換最高倍物鏡"],
    answer: "調整光源、反光鏡或光圈",
    hint: "先判斷問題是看不清焦點，還是進入視野的光線不足。",
    misconception: "focus_vs_light_confusion"
  }
];

const sequenceSteps = [
  { id: "low_power", label: "轉到低倍物鏡", order: 1 },
  { id: "place_slide", label: "放上玻片並固定", order: 2 },
  { id: "adjust_light", label: "調整光線", order: 3 },
  { id: "coarse_focus", label: "用粗調節輪找焦", order: 4 },
  { id: "fine_focus", label: "用細調節輪調清楚", order: 5 },
  { id: "high_power", label: "需要時再轉高倍觀察", order: 6 }
];

const storageQuestion = {
  id: "storage_steps",
  concept_id: "carrying_storage",
  prompt: "收納顯微鏡前，下列哪些做法較合適？",
  options: ["轉回低倍物鏡", "取下玻片", "下降載物臺或鏡筒至安全位置", "整理電源線或防塵", "讓高倍物鏡停在工作位置", "把玻片留在載物臺上"],
  answer: ["轉回低倍物鏡", "取下玻片", "下降載物臺或鏡筒至安全位置", "整理電源線或防塵"],
  hint: "收納時要避免鏡頭、玻片和載物臺互相碰撞，也要讓下一次使用者能安全開始。",
  misconception: "unsafe_carrying"
};

const checkpoint2Choices = [
  {
    id: "high_power_first",
    concept_id: "low_to_high_power",
    prompt: "有同學說：「高倍放大比較多，所以一開始就用高倍找標本最快。」哪個修正較合理？",
    options: ["低倍視野較大、較亮，通常較容易先找到標本", "高倍視野較大所以更容易找", "高倍一定比低倍亮", "倍率和找標本沒有關係"],
    answer: "低倍視野較大、較亮，通常較容易先找到標本",
    hint: "找標本時，視野範圍和亮度很重要，不只看放大倍率。",
    misconception: "high_power_first"
  },
  {
    id: "high_power_focus",
    concept_id: "focus_adjustment",
    prompt: "已轉到高倍物鏡後，影像稍微模糊，較安全的做法是什麼？",
    options: ["輕微轉動細調節輪", "快速轉粗調節輪", "把物鏡壓近玻片", "用手推鏡筒往下"],
    answer: "輕微轉動細調節輪",
    hint: "高倍時物鏡與玻片距離較近，調整幅度太大可能造成碰撞。",
    misconception: "coarse_on_high_power"
  },
  {
    id: "carry_scope",
    concept_id: "carrying_storage",
    prompt: "搬運顯微鏡時，下列哪個動作較安全？",
    options: ["一手握鏡臂，一手托鏡座", "單手抓目鏡提起", "拖著鏡座在桌上滑動", "拿著電線移動"],
    answer: "一手握鏡臂，一手托鏡座",
    hint: "顯微鏡重且精密，搬運時要同時控制上方支撐與下方重量。",
    misconception: "unsafe_carrying"
  }
];

const checkpoint3Choices = [
  {
    id: "magnification_400",
    concept_id: "magnification",
    prompt: "目鏡 10x、物鏡 40x 時，總倍率是多少？",
    options: ["400x", "50x", "30x", "40x"],
    answer: "400x",
    hint: "總倍率要把兩個放大倍率相乘，不是相加。",
    misconception: "magnification_addition"
  },
  {
    id: "magnification_add",
    concept_id: "magnification",
    prompt: "有同學把目鏡 10x 和物鏡 40x 算成 50x。哪個修正較合理？",
    options: ["總倍率應為目鏡倍率乘以物鏡倍率", "總倍率只看目鏡", "總倍率只看物鏡", "倍率越高越不用計算"],
    answer: "總倍率應為目鏡倍率乘以物鏡倍率",
    hint: "兩個鏡頭會連續放大影像，想想放大效果是疊加相乘還是把數字相加。",
    misconception: "magnification_addition"
  },
  {
    id: "slide_right",
    concept_id: "image_movement",
    prompt: "如果把玻片向右移動，視野中的影像通常會往哪個方向移動？",
    options: ["向左", "向右", "不動", "一定向上"],
    answer: "向左",
    hint: "先想玻片和視野影像通常呈相反移動關係，再判斷影像方向。",
    misconception: "image_same_direction"
  },
  {
    id: "center_right",
    concept_id: "image_movement",
    prompt: "視野中的標本影像偏在右邊，想把影像移到中央，玻片通常要往哪個方向移動？",
    options: ["向右", "向左", "向下", "不需要移動"],
    answer: "向右",
    hint: "先想影像要往哪裡移才會到中央，再利用玻片和影像相反移動的關係判斷。",
    misconception: "image_same_direction"
  },
  {
    id: "high_power_change",
    concept_id: "field_power_difference",
    prompt: "從低倍轉到高倍後，視野通常會有什麼變化？",
    options: ["視野範圍變小、亮度常變暗", "視野範圍變大、亮度一定更亮", "看到的標本數量一定變多", "完全沒有變化"],
    answer: "視野範圍變小、亮度常變暗",
    hint: "倍率提高時，每個細節被放大，但一次能看到的範圍通常會減少。",
    misconception: "high_power_always_better"
  },
  {
    id: "high_power_better",
    concept_id: "field_power_difference",
    prompt: "有同學說：「倍率越高，一定越容易觀察所有東西。」哪個修正較合理？",
    options: ["高倍能看細節，但視野較小且較暗，找標本時不一定方便", "高倍視野最大", "倍率高就不需要調光", "低倍完全不能觀察"],
    answer: "高倍能看細節，但視野較小且較暗，找標本時不一定方便",
    hint: "觀察需要找到標本、看清楚細節，也需要足夠亮度，不是只比放大倍數。",
    misconception: "high_power_always_better"
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
  if (next === "checkpoint1" && state.screen !== "checkpoint1") state.activePart = null;
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

function imageWithFallback(src, fallback, alt, className = "") {
  const safeClass = className ? ` class="${className}"` : "";
  return `<img src="${src}" alt="${alt}"${safeClass} onerror="this.onerror=null;this.src='${fallback}';this.classList.add('using-fallback');">`;
}

function mentorCard(title, text, image = microscopeVisualAssets.mentorPrimary) {
  return `
    <div class="mentor-card">
      <div class="mentor-avatar">${imageWithFallback(image, microscopeVisualAssets.mentorFallback, mentorName)}</div>
      <div class="mentor-copy">
        <span>${mentorName}</span>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function owlStageFor(screenName = state.screen) {
  const map = {
    login: "opening",
    brief: "opening",
    scan: "scan",
    checkpoint1: "parts",
    checkpoint2: "focus",
    checkpoint3: "field",
    review: "review",
    reflection: "review",
    result: "result",
    achievements: "result"
  };
  return map[screenName] || "scan";
}

function owlPanel(stage = owlStageFor(), imageAlt = "貓頭鷹助理") {
  const asset = microscopeVisualAssets.owlHooks[stage] || microscopeVisualAssets.owlHooks.scan;
  return `
    <div class="owl-frame microscope-owl-frame owl-${stage}">
      <img src="${asset}" alt="${imageAlt}">
      <div class="microscope-owl-fallback" role="img" aria-label="${imageAlt}">
        <span class="owl-lens"></span>
        <span class="owl-eye left"></span>
        <span class="owl-eye right"></span>
        <span class="owl-beak"></span>
        <span class="owl-field-tool"></span>
      </div>
    </div>
  `;
}

function owlImageFor(stage = "result") {
  return {
    src: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.webp",
    className: `microscope-owl-frame owl-${stage} using-fallback`
  };
}

function layout(content, owlStage = owlStageFor(), imageAlt = "貓頭鷹助理") {
  return `
    <div class="mission-layout">
      <div class="panel hero-panel">${content}</div>
      ${owlPanel(owlStage, imageAlt)}
    </div>
  `;
}

function briefLayout(content) {
  return `
    <div class="wide-layout microscope-briefing-layout">
      <div class="microscope-brief-scene" data-brief-scene aria-label="阿澤老師帶領學生進入顯微觀察訓練站">
        <div class="microscope-bg-fallback">${renderMicroscopeScene()}</div>
        <picture class="microscope-brief-picture">
          <source media="(max-width: 680px)" srcset="${microscopeVisualAssets.briefingSceneMobile}">
          <img id="microscopeBriefScene" src="${microscopeVisualAssets.briefingSceneWide}" alt="阿澤老師在顯微觀察訓練站引導微觀視野校準任務">
        </picture>
      </div>
      <div class="panel brief-copy-panel">
        ${content}
        <div class="brief-asset-status" data-brief-asset-status hidden>顯微鏡單元主視覺製作中，目前先顯示操作站示意。</div>
      </div>
    </div>
  `;
}

function attachBriefSceneFallback() {
  const scene = document.querySelector("[data-brief-scene]");
  const image = document.querySelector("#microscopeBriefScene");
  const mobileSource = document.querySelector(".microscope-brief-picture source");
  const status = document.querySelector("[data-brief-asset-status]");
  if (!scene || !image) return;
  const showFallback = () => {
    scene.classList.add("using-fallback");
    image.hidden = true;
    if (status) status.hidden = false;
  };
  const recoverScene = () => {
    if (mobileSource?.isConnected) {
      mobileSource.remove();
      image.hidden = false;
      image.src = microscopeVisualAssets.briefingSceneWide;
      return;
    }
    showFallback();
  };
  const verifyScene = () => {
    window.setTimeout(() => {
      if (image.isConnected && image.complete && image.naturalWidth === 0) recoverScene();
    }, 120);
  };
  image.addEventListener("error", recoverScene);
  window.addEventListener("resize", verifyScene, { once: true, passive: true });
  verifyScene();
}

function renderMicroscopeScene() {
  return `
    <div class="microscope-scene" aria-label="顯微觀察訓練站場景">
      <span class="scope-body"></span>
      <span class="scope-eyepiece"></span>
      <span class="scope-stage"></span>
      <span class="field-circle"></span>
      <span class="sample-dot"></span>
      <span class="scan-dot" style="left:28%;top:46%"></span>
      <span class="scan-dot" style="left:72%;top:42%"></span>
    </div>
  `;
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return `
    <div class="stack">
      <div class="panel hero-panel">
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">任務登入</h2>
        <div class="story-panel">
          <strong>請先確認身分</strong>
          <p>輸入學號後，系統會以 Google Sheet 名單顯示姓名。老師測試流程時可使用 guest。</p>
        </div>
        <div class="mission-hud">
          <div><span>任務代號</span><strong>microscope_use</strong></div>
          <div><span>預估時間</span><strong>10-15 分鐘</strong></div>
          <div><span>名單來源</span><strong>Google Sheet</strong></div>
        </div>
        <div class="form-grid">
          <label>
            學號
            <input id="studentIdInput" value="${value}" placeholder="例如 S70102 或 guest" autocomplete="off">
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
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
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
    is_guest: Boolean(source.is_guest)
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
  let completedAttempts = 0;
  if (id === "guest") {
    student = roster.guest;
    completedAttempts = studentAttempts(student.student_id).length;
  } else {
    try {
      const data = await fetchStudentStatus(id);
      student = normalizeBackendStudent(data, id);
      if (!student) {
        message.innerHTML = `<span class="pill warn">${data?.error === "student_not_found" ? "查無此學號，請確認後重試。" : "後台回傳的學生資料不完整，尚未登入。"}</span>`;
        return;
      }
      completedAttempts = Number(data.attempt_status?.completed_attempt_count ?? data.completed_attempts ?? 0);
    } catch (error) {
      message.innerHTML = `<span class="pill warn">後台目前無法連線，尚未登入。請檢查網路後重試，或通知老師。</span>`;
      return;
    }
  }
  const attempts = studentAttempts(student.student_id);
  state = structuredClone(defaultState);
  state.student = { ...student, is_guest: Boolean(student.is_guest) };
  state.attempt_type = (completedAttempts || attempts.length) > 0 ? "retry" : "first";
  state.started_at = new Date().toISOString();
  state.optionOrders = {};
  unlock("brief", "rules", "achievements");
  saveState();
  setScreen("brief");
}

function renderBrief() {
  return briefLayout(`
    <p class="eyebrow">任務檔案開啟</p>
    <h2 class="hero-title">歡迎，${state.student.student_name}</h2>
    <p class="lead">阿澤老師已開啟微觀操作室。今天你要先認得顯微鏡部位如何合作，再練習從低倍到高倍、安全調焦，最後校準視野移動方向。</p>
    <div class="story-panel highlight">
      <strong>任務核心</strong>
      <p>顯微鏡不是只把東西放大；你需要先找得到標本、調得清楚、判斷亮度與倍率，還要知道玻片移動時視野影像會往相反方向移動。</p>
    </div>
    <div class="status-line">
      <span class="pill">${state.student.class_name} 班 ${state.student.seat_no} 號</span>
      <span class="pill ${state.attempt_type === "retry" ? "warn" : ""}">${state.attempt_type === "retry" ? "再挑戰" : "首次挑戰"}</span>
      ${state.student.is_guest ? `<span class="pill warn">guest 測試</span>` : ""}
    </div>
    <div class="actions">
      <button class="primary" id="briefNext">開始任務準備</button>
    </div>
  `);
}

function renderScan() {
  const tools = ["先低倍找得到，再高倍看細節", "粗調找焦，細調微調", "太暗時先想光源、反光鏡或光圈", "總倍率是目鏡乘以物鏡", "玻片和視野影像通常反向移動"];
  return layout(`
    <p class="eyebrow">貓頭鷹助理任務準備</p>
    <h2 class="hero-title">校準微觀視野</h2>
    <div class="story-panel">
      <strong>顯微掃描提醒</strong>
      <p>進關卡前，先帶著這幾個概念：部位要用功能判斷，操作要先低倍再高倍，亮度與焦距不是同一件事，玻片移動與視野影像方向通常相反。</p>
    </div>
    <div class="card-grid">
      ${tools.map((tool) => `<div class="method-card"><span class="method-icon"></span><strong>${tool}</strong></div>`).join("")}
    </div>
    <div class="actions">
      <button class="primary" id="scanNext">進入部位掃描</button>
    </div>
  `, "scan", "顯微鏡準備貓頭鷹助理");
}

function checkpointShell(title, description, rows, nextId, owlState = state.screen) {
  return `
    <div class="wide-layout checkpoint-layout" data-checkpoint-screen="${owlState}">
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

function renderMatchQuestion(group, field, items, options, title, hint, hintId, badge = "可配對") {
  const selected = state.answers[group][field] || {};
  const orderedItems = orderedById(`${field}Items`, items);
  return `
    <div class="question-row classify-question">
      <div>
        <span class="multi-badge">${badge}</span>
        <strong>${title}</strong>
        <p class="multi-instruction">每個項目選一個對應。提示只會引導功能、位置或用途線索。</p>
      </div>
      <div class="sequence-list">
        ${orderedItems.map((item) => `
          <label class="sequence-item">
            <span class="sequence-prompt">${item.label}</span>
            ${matchHintUsed(group, field, item.id) ? `<span class="hint">${item.hint || hint}</span>` : ""}
            <select data-match-group="${group}" data-match-field="${field}" data-id="${item.id}">
              <option value="">選擇</option>
              ${optionOrder(`${field}Options`, options).map((option) => `<option value="${option}" ${selected[item.id] === option ? "selected" : ""}>${option}</option>`).join("")}
            </select>
            <span class="selected-answer">${selected[item.id] ? `已選：${selected[item.id]}` : "尚未選擇"}</span>
          </label>
        `).join("")}
      </div>
      <button class="ghost hint-button" data-group="${group}" data-id="${hintId}">提示</button>
    </div>
  `;
}

function matchHintUsed(group, field, itemId) {
  const fieldHints = state.answers[`${group}Hints`]?.[field];
  if (fieldHints === true) return true;
  return Boolean(fieldHints && typeof fieldHints === "object" && fieldHints[itemId]);
}

function markMatchHintUsed(group, field, itemId) {
  const groupHints = state.answers[`${group}Hints`] || (state.answers[`${group}Hints`] = {});
  if (groupHints[field] === true) return false;
  if (!groupHints[field] || typeof groupHints[field] !== "object") groupHints[field] = {};
  if (groupHints[field][itemId]) return false;
  groupHints[field][itemId] = true;
  return true;
}

function getActivePart() {
  return partItems.find((item) => item.id === state.activePart) || null;
}

function currentPartTarget() {
  const index = Math.min(Number(state.partTargetIndex || 0), partItems.length - 1);
  return partItems[index] || null;
}

function remainingPartTargets() {
  return partItems.filter((part) => state.answers.checkpoint1.parts[part.id] !== part.answer).length;
}

function selectPartTarget(partId) {
  const target = currentPartTarget();
  if (!target || state.answers.checkpoint1.parts[target.id] === target.answer) return;
  if (partId === target.id) {
    state.activePart = target.id;
    state.answers.checkpoint1.parts[target.id] = target.answer;
    state.partTargetResults[target.id] = {
      correct: true,
      hint_used: Boolean(state.answers.checkpoint1Hints.parts?.[target.id])
    };
    const nextIndex = Math.min((Number(state.partTargetIndex || 0) + 1), partItems.length);
    state.partTargetIndex = nextIndex;
    const nextTarget = partItems[nextIndex] || target;
    state.activePart = nextTarget.id;
    saveState();
    render();
    return;
  }
  markMatchHintUsed("checkpoint1", "parts", target.id);
  state.activePart = target.id;
  saveState();
  render();
}

function renderMicroscopePartsExplorer() {
  const active = getActivePart();
  const viewed = state.answers.checkpoint1.parts || {};
  const target = currentPartTarget();
  const remaining = remainingPartTargets();
  return `
    <div class="question-row microscope-parts-question">
      <div>
        <span class="multi-badge">可點選</span>
        <strong>依序找出指定部位，正確後才會切換下一個目標。</strong>
        <p class="multi-instruction">${target ? `目前目標：${target.function}` : "所有部位已完成。"}${remaining ? ` 尚有 ${remaining} 個部位未辨識。` : " 已完成全部部位辨識。"}</p>
        ${target && matchHintUsed("checkpoint1", "parts", target.id) ? `<div class="hint">${target.hint || `找出「${target.answer}」對應的部位。`}</div>` : ""}
      </div>
      <div class="microscope-explorer">
        <div class="microscope-diagram" aria-label="顯微鏡構造互動圖">
          <div class="microscope-diagram-asset">
            <img
              class="microscope-parts-image"
              src="${microscopeVisualAssets.diagramParts}"
              alt="複式顯微鏡部位互動圖"
              onerror="this.hidden=true;this.parentElement.classList.add('image-failed');"
            >
            <div class="microscope-css-fallback" role="img" aria-label="顯微鏡示意圖">
              <span class="fallback-eyepiece"></span>
              <span class="fallback-arm"></span>
              <span class="fallback-stage"></span>
              <span class="fallback-focus"></span>
              <span class="fallback-light"></span>
              <span class="fallback-base"></span>
            </div>
          </div>
          ${partItems.map((part) => `
            <button
              class="part-hotspot ${target?.id === part.id || active?.id === part.id ? "active" : ""} ${viewed[part.id] === part.answer ? "viewed" : ""} ${part.shape}"
              style="--x:${part.x}%;--y:${part.y}%;--w:${part.w}%;--h:${part.h}%;"
              data-part-id="${part.id}"
              aria-label="查看${part.label}"
            ></button>
          `).join("")}
        </div>
        <div class="part-labels">
          ${partItems.map((part) => `<button class="part-chip ${target?.id === part.id || active?.id === part.id ? "active" : ""} ${viewed[part.id] === part.answer ? "locked" : ""}" data-part-id="${part.id}">${part.label}</button>`).join("")}
        </div>
        <div class="part-info">
          ${active ? `
            <strong>${active.label}</strong>
            <p>${active.function}</p>
            <span>${active.answer}</span>
          ` : `
            <strong>尚未選擇構造</strong>
            <p>請點選圖片中的部位或下方標籤，查看位置與功能。</p>
          `}
        </div>
      </div>
      <button class="ghost hint-button" data-group="checkpoint1" data-id="parts">提示</button>
    </div>
  `;
}

function getSequenceOrder() {
  const saved = state.answers.checkpoint2.sequence || {};
  const hasCompleteOrder = sequenceSteps.every((step) => Number(saved[step.id]) > 0);
  if (hasCompleteOrder) {
    return sequenceSteps
      .map((step) => step.id)
      .sort((left, right) => Number(saved[left]) - Number(saved[right]));
  }
  const order = optionOrder("sequenceSteps", sequenceSteps.map((step) => step.id));
  state.answers.checkpoint2.sequence = Object.fromEntries(order.map((id, index) => [id, index + 1]));
  saveState();
  return order;
}

function setSequenceOrder(order) {
  state.answers.checkpoint2.sequence = Object.fromEntries(order.map((id, index) => [id, index + 1]));
  saveState();
  render();
}

function moveSequenceStep(stepId, direction) {
  const order = getSequenceOrder();
  const fromIndex = order.indexOf(stepId);
  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= order.length) return;
  [order[fromIndex], order[toIndex]] = [order[toIndex], order[fromIndex]];
  setSequenceOrder(order);
}

function renderSequenceQuestion() {
  const orderedSteps = getSequenceOrder().map((id) => sequenceSteps.find((step) => step.id === id)).filter(Boolean);
  return `
    <div class="question-row multi-question">
      <div>
        <span class="multi-badge">拖曳排序</span>
        <strong>第一次觀察玻片時，請排出較合理的操作順序。</strong>
        <p class="multi-instruction">請拖曳步驟卡排出完整順序；手機可用上移 / 下移按鈕。提示只提供操作邏輯，不直接排好答案。</p>
        ${state.answers.checkpoint2Hints.sequence ? `<div class="hint">先用容易找到標本的設定開始，再逐步讓影像清楚，最後才放大觀察細節。</div>` : ""}
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

function fieldViewForSlidePosition(sliderValue) {
  const slider = Math.max(-1, Math.min(1, Number(sliderValue) || 0));
  if (slider < 0) {
    return {
      slideLabel: "向左",
      imageLabel: "向右",
      viewPosition: "right",
      asset: microscopeVisualAssets.parameciumViewRight
    };
  }
  if (slider > 0) {
    return {
      slideLabel: "向右",
      imageLabel: "向左",
      viewPosition: "left",
      asset: microscopeVisualAssets.parameciumViewLeft
    };
  }
  return {
    slideLabel: "置中",
    imageLabel: "置中",
    viewPosition: "center",
    asset: microscopeVisualAssets.parameciumViewCenter
  };
}

function renderFieldDemo() {
  const slider = Number(state.fieldSlider || 0);
  const slideShift = slider * 64;
  const fieldView = fieldViewForSlidePosition(slider);
  return `
    <div class="data-grid">
      <div class="data-panel">
        <h3>視野移動滑桿</h3>
        <p class="muted">拖動滑桿觀察：玻片標本往左移，視野中的影像會往右；玻片往右移，影像會往左。</p>
        <div class="field-slider-demo">
          <div class="slide-track">
            <span class="slide-sample" style="transform: translateX(${slideShift}px);"></span>
          </div>
          <figure class="field-demo interactive-field" data-field-view="${fieldView.viewPosition}">
            <img class="field-view-image" src="${fieldView.asset}" alt="複式顯微鏡視野中的草履蟲影像位於${fieldView.imageLabel}" onerror="this.hidden=true;this.parentElement.classList.add('image-failed');">
            <span class="field-view-fallback" aria-hidden="true"></span>
          </figure>
          <label class="field-slider-label">移動玻片
            <input type="range" min="-1" max="1" step="1" value="${slider}" id="fieldShiftSlider">
          </label>
          <div class="direction-readout">
            <span>玻片：${fieldView.slideLabel}</span>
            <span>視野影像：${fieldView.imageLabel}</span>
          </div>
        </div>
      </div>
      <div class="data-panel">
        <h3>低倍 / 高倍比較</h3>
        <div class="power-compare">
          <figure class="power-card">
            <img class="power-image" src="${microscopeVisualAssets.onionLowPower}" alt="低倍複式顯微鏡下的洋蔥表皮，視野較亮、範圍較廣、細胞較多且較小" onerror="this.hidden=true;this.parentElement.classList.add('image-failed');">
            <span class="wide-field power-fallback" aria-hidden="true"></span>
            <figcaption>低倍洋蔥表皮：視野較亮、範圍較廣，可看到較多較小的細胞。</figcaption>
          </figure>
          <figure class="power-card">
            <img class="power-image" src="${microscopeVisualAssets.onionHighPower}" alt="高倍複式顯微鏡下的洋蔥表皮，視野較暗、範圍較窄、細胞較少但較大" onerror="this.hidden=true;this.parentElement.classList.add('image-failed');">
            <span class="narrow-field power-fallback" aria-hidden="true"></span>
            <figcaption>高倍洋蔥表皮：視野較暗、範圍較窄，可看到較少但較大的細胞。</figcaption>
          </figure>
        </div>
      </div>
    </div>
  `;
}

function renderCheckpoint1() {
  const rows = `
    ${renderMicroscopePartsExplorer()}
    ${renderMatchQuestion("checkpoint1", "functions", functionItems, functionOptions, "請依使用情境選出最合適的顯微鏡部位。", "問自己這個情境主要是在觀察、放大、承載、調焦，還是控制光線。", "functions")}
    ${orderedById("checkpoint1Choices", checkpoint1Choices).map((item) => renderChoiceQuestion("checkpoint1", item)).join("")}
  `;
  return checkpointShell("關卡一：部位與功能掃描", "用功能、位置與調整目的辨識顯微鏡主要部位。", rows, "checkpoint1Next", "checkpoint1");
}

function renderCheckpoint2() {
  const rows = `
    ${renderSequenceQuestion()}
    ${orderedById("checkpoint2Choices", checkpoint2Choices).map((item) => renderChoiceQuestion("checkpoint2", item)).join("")}
    ${renderMultiQuestion("checkpoint2", storageQuestion)}
  `;
  return checkpointShell("關卡二：低倍到高倍操作", "整理從低倍找到標本到高倍觀察細節的安全流程。", rows, "checkpoint2Next", "checkpoint2");
}

function renderCheckpoint3() {
  const rows = `${renderFieldDemo()}${orderedById("checkpoint3Choices", checkpoint3Choices).map((item) => renderChoiceQuestion("checkpoint3", item)).join("")}`;
  return checkpointShell("關卡三：倍率與視野校準", "判斷總倍率、視野移動方向，以及高低倍下範圍與亮度的變化。", rows, "checkpoint3Next", "checkpoint3");
}

function renderCheckpoint4() {
  return checkpointShell("關卡四：觀察安全確認", "最後整理顯微鏡搬運、收納與視野判讀中自己最需要確認的一點。", `
    <div class="story-panel highlight">
      <strong>最後檢查</strong>
      <p>下一頁會請你選一個方向，例如粗細調節輪、低倍高倍、視野移動、倍率計算或收納安全，再用自己的話補充。</p>
    </div>
    <div class="question-row">
      <strong>完成觀察安全確認後，請進入任務回報。</strong>
      <p>這一關不另外計入答題，重點是整理自己的顯微鏡操作疑問。</p>
    </div>
  `, "checkpoint4Next", "review");
}

function attachCheckpointHandlers() {
  document.querySelectorAll("[data-part-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const partId = button.dataset.partId;
      if (!partItems.some((part) => part.id === partId)) return;
      selectPartTarget(partId);
    });
  });
  document.querySelectorAll("[data-match-group]").forEach((select) => {
    select.addEventListener("change", () => {
      const group = select.dataset.matchGroup;
      const field = select.dataset.matchField;
      const list = field === "parts" ? partItems : functionItems;
      const item = list.find((entry) => entry.id === select.dataset.id);
      state.answers[group][field][select.dataset.id] = select.value;
      const shouldRevealHint = Boolean(item && select.value && select.value !== item.answer);
      const didRevealHint = shouldRevealHint ? markMatchHintUsed(group, field, item.id) : false;
      const row = select.closest(".sequence-item");
      row?.classList.toggle("has-selection", Boolean(select.value));
      const selectedLine = row?.querySelector(".selected-answer");
      if (selectedLine) selectedLine.textContent = select.value ? `已選：${select.value}` : "尚未選擇";
      saveState();
      if (didRevealHint) render();
    });
  });
  document.querySelectorAll("[data-sequence-move]").forEach((button) => {
    button.addEventListener("click", () => moveSequenceStep(button.dataset.sequenceId, button.dataset.sequenceMove));
  });
  let draggedSequenceId = null;
  document.querySelectorAll("[data-sequence-id].sortable-item").forEach((item) => {
    item.addEventListener("dragstart", () => { draggedSequenceId = item.dataset.sequenceId; });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const targetId = item.dataset.sequenceId;
      if (!draggedSequenceId || draggedSequenceId === targetId) return;
      const order = getSequenceOrder().filter((id) => id !== draggedSequenceId);
      order.splice(order.indexOf(targetId), 0, draggedSequenceId);
      setSequenceOrder(order);
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
  document.querySelectorAll("[data-multi]").forEach((box) => {
    box.addEventListener("change", () => {
      const group = box.dataset.multiGroup;
      const id = box.dataset.multi;
      const values = [...document.querySelectorAll(`[data-multi-group="${group}"][data-multi="${id}"]:checked`)].map((item) => item.value);
      state.answers[group][id] = values;
      saveState();
    });
  });
  const fieldSlider = document.querySelector("#fieldShiftSlider");
  if (fieldSlider) {
    fieldSlider.addEventListener("input", () => {
      state.fieldSlider = Number(fieldSlider.value);
      saveState();
      render();
    });
  }
  document.querySelectorAll(".hint-button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.group;
      const id = button.dataset.id;
      if (group === "checkpoint1" && id === "parts") {
        const target = currentPartTarget();
        if (target) markMatchHintUsed("checkpoint1", "parts", target.id);
        state.activePart = target?.id || state.activePart;
      } else {
        state.answers[`${group}Hints`][id] = true;
      }
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-nav-target]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.navTarget)));
}

function findQuestion(id) {
  return [...checkpoint1Choices, ...checkpoint2Choices, storageQuestion, ...checkpoint3Choices].find((item) => item.id === id);
}

function validateCheckpoint1() {
  return partItems.every((item) => state.answers.checkpoint1.parts[item.id]) &&
    functionItems.every((item) => state.answers.checkpoint1.functions[item.id]) &&
    checkpoint1Choices.every((item) => state.answers.checkpoint1[item.id]);
}

function validateCheckpoint2() {
  const sequence = state.answers.checkpoint2.sequence || {};
  return sequenceSteps.every((item) => sequence[item.id]) &&
    checkpoint2Choices.every((item) => state.answers.checkpoint2[item.id]) &&
    (state.answers.checkpoint2[storageQuestion.id] || []).length > 0;
}

function validateCheckpoint3() {
  return checkpoint3Choices.every((item) => state.answers.checkpoint3[item.id]);
}

function advanceIf(ok, next) {
  if (!ok) {
    const remaining = state.screen === "checkpoint1" ? remainingPartTargets() : 0;
    document.querySelector("#checkpointFeedback").textContent = remaining
      ? `尚有 ${remaining} 個部位未辨識，完成所有 target 後才能進下一關。`
      : "還有題目尚未完成。";
    return;
  }
  unlock(next);
  setScreen(next);
}

function scoreMatch(group, field, items, directPoints, revisionPoints) {
  const selected = state.answers[group][field] || {};
  const usedHint = Boolean(state.answers[`${group}Hints`][field]);
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

function scoreSequence() {
  const sequence = state.answers.checkpoint2.sequence || {};
  const usedHint = Boolean(state.answers.checkpoint2Hints.sequence);
  let correct = 0;
  const misconceptions = [];
  sequenceSteps.forEach((item) => {
    if (sequence[item.id] === item.order) correct += 1;
    else misconceptions.push("high_power_first");
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
    /^目鏡與物鏡的功能差異$/,
    /^粗調節輪與細調節輪的使用時機$/,
    /^為什麼要先用低倍找標本$/,
    /^視野太暗時可以檢查哪些部位$/,
    /^目鏡倍率與物鏡倍率如何算總倍率$/,
    /^玻片移動與影像移動方向的關係$/,
    /^高倍與低倍視野大小亮度差異$/,
    /^顯微鏡搬運與收納安全$/
  ];
  return copiedTemplates.some((pattern) => pattern.test(normalized));
}

function evaluateReflectionQuality(reflection = {}) {
  const fields = [reflection.confident_concept, reflection.uncertain_concept, reflection.student_question];
  const joined = fields.map((item) => item || "").join(" ").trim();
  const normalized = normalizeReflectionText(joined);
  const rawQuestion = (reflection.student_question || "").trim();
  const conceptTerms = ["顯微鏡", "目鏡", "物鏡", "低倍", "高倍", "粗調節輪", "細調節輪", "載物台", "載物臺", "玻片", "視野", "影像方向", "光圈", "光源", "反光鏡", "倍率", "亮度", "調焦", "收納", "搬運"];
  const learningPhrases = ["為什麼", "怎麼", "如何", "判斷", "差別", "是不是", "不確定", "混淆", "分辨", "不知道", "不懂", "看不懂", "方向", "關係"];
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
  if (["顯微", "視野", "那邊"].some((term) => joined.includes(term)) && ["難", "看不懂", "不懂", "不會"].some((term) => joined.includes(term))) return { reflection_quality: "needs_review", question_exp: 0, reflection_exp_reason: "可能有學習困難，但未指出明確概念，需教師複核。", reflection_review_status: "pending_review" };
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
  const partsScore = combineScores(scoreMatch("checkpoint1", "parts", partItems, 10, 6), scoreMatch("checkpoint1", "functions", functionItems, 12, 7));
  const partsChoices = scoreChoiceQuestions(checkpoint1Choices, "checkpoint1", 25, 15);
  const s1 = scaleScore(combineScores(partsScore, partsChoices));
  const operationScore = combineScores(scoreSequence(), scoreChoiceQuestions(checkpoint2Choices, "checkpoint2", 25, 15), scoreMultiSelect("checkpoint2", storageQuestion, 30, 18));
  const s2 = scaleScore(operationScore);
  const fieldScore = scoreChoiceQuestions(checkpoint3Choices, "checkpoint3", 25, 15);
  const s3 = scaleScore(fieldScore);
  const completionExp = 100;
  const reflectionEvaluation = evaluateReflectionQuality(state.answers.reflection);
  const questionExp = reflectionEvaluation.question_exp;
  const rawConceptExp = s1.raw_concept + s2.raw_concept + s3.raw_concept;
  const rawRevisionExp = s1.raw_revision + s2.raw_revision + s3.raw_revision;
  const conceptExp = scaleExp(rawConceptExp, DIRECT_EXP_POOL, DIRECT_RAW_MAX);
  const revisionExp = scaleExp(rawRevisionExp, REVISION_EXP_POOL, REVISION_RAW_MAX);
  const correct = s1.correct + s2.correct + s3.correct;
  const correctWithoutHint = s1.correctWithoutHint + s2.correctWithoutHint + s3.correctWithoutHint;
  const correctedAfterHint = s1.correctedAfterHint + s2.correctedAfterHint + s3.correctedAfterHint;
  const hintUsed = s1.hintUsed + s2.hintUsed + s3.hintUsed;
  const total = s1.total + s2.total + s3.total;
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
  const misconceptions = [...new Set([...s1.misconceptions, ...s2.misconceptions, ...s3.misconceptions].filter(Boolean))];
  const movementScore = scoreChoiceQuestions(checkpoint3Choices.filter((item) => item.concept_id === "image_movement"), "checkpoint3", 25, 15);
  const magLightScore = scoreChoiceQuestions(checkpoint3Choices.filter((item) => item.concept_id !== "image_movement"), "checkpoint3", 25, 15);
  const badges = [unitBadgeCatalog[0].name];
  if (s1.correct / s1.total >= 0.85) badges.push(unitBadgeCatalog[1].name);
  if (s2.correct / s2.total >= 0.85) badges.push(unitBadgeCatalog[2].name);
  if (movementScore.correct / movementScore.total >= 0.85) badges.push(unitBadgeCatalog[3].name);
  if (magLightScore.correct / magLightScore.total >= 0.85) badges.push(unitBadgeCatalog[4].name);
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
      { title: "顯微鏡部位與功能", correct: s1.correct, total: s1.total, correct_without_hint: s1.correctWithoutHint, corrected_after_hint: s1.correctedAfterHint, exp: s1.concept + s1.revision },
      { title: "低倍到高倍與收納", correct: s2.correct, total: s2.total, correct_without_hint: s2.correctWithoutHint, corrected_after_hint: s2.correctedAfterHint, exp: s2.concept + s2.revision },
      { title: "倍率與視野校準", correct: s3.correct, total: s3.total, correct_without_hint: s3.correctWithoutHint, corrected_after_hint: s3.correctedAfterHint, exp: s3.concept + s3.revision }
    ],
    microscope_parts_score: s1.correct / s1.total,
    low_high_sequence_score: s2.correct / s2.total,
    field_movement_score: movementScore.correct / movementScore.total,
    magnification_light_score: magLightScore.correct / magLightScore.total,
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

function misconceptionText(tag) {
  const map = {
    parts_names_only: "建議再用功能整理顯微鏡部位：放大、承載、調焦、調光與支撐各有對應構造。",
    focus_vs_light_confusion: "建議再區分亮度與焦距：視野太暗時先檢查光源、反光鏡或光圈，不一定是焦距問題。",
    high_power_first: "建議再理解低倍先找標本：低倍視野較大、較亮，通常較容易定位。",
    coarse_on_high_power: "建議再確認高倍調焦安全：高倍時應以細調節輪微調，避免物鏡碰到玻片。",
    unsafe_carrying: "建議再整理搬運與收納規則：一手握鏡臂、一手托鏡座，收納前取下玻片並整理倍率與電源。",
    magnification_addition: "建議再練習倍率計算：總倍率等於目鏡倍率乘以物鏡倍率，不是相加。",
    image_same_direction: "建議再練習視野方向：玻片往一邊移動，視野中的影像通常往相反方向移動。",
    high_power_always_better: "建議再比較高低倍：高倍看細節，但視野範圍較小、亮度常下降。"
  };
  return map[tag] || "建議再用功能、倍率、視野與安全邏輯檢查自己的判斷。";
}

function getConceptReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.8).map((item) => item.title);
  const revisit = result.misconceptions.map((tag) => ({ tag, text: misconceptionText(tag) }));
  const directions = ["目鏡與物鏡的功能差異", "粗調節輪與細調節輪的使用時機", "為什麼要先用低倍找標本", "視野太暗時可以檢查哪些部位", "目鏡倍率與物鏡倍率如何算總倍率", "玻片移動與影像移動方向的關係", "高倍與低倍視野大小、亮度差異", "顯微鏡搬運與收納安全"];
  return {
    stable: stable.length ? stable : ["任務已完成，接下來請整理自己最有把握的顯微操作線索。"],
    revisit: revisit.length ? revisit.slice(0, 6) : [{ tag: "extension", text: "本次概念很穩定，可以試著說明下次使用顯微鏡時的完整操作順序。" }],
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
        <h2>先校準概念，再回報</h2>
        ${mentorCard("課堂前提醒", "請不要只寫「不知道」或直接複製系統方向詞。試著用自己的話說明：哪個顯微鏡操作或視野概念還想確認？")}
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
          <p>請寫出顯微鏡、目鏡、物鏡、低倍、高倍、粗調節輪、細調節輪、玻片、視野、倍率、亮度、光圈、光源、影像方向或收納等概念，並補充自己的疑問。</p>
        </div>
        <div class="form-grid">
          <label>這次任務中，我最能掌握的一項顯微鏡操作或視野判斷是什麼？
            <textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea>
          </label>
          <label>我還不確定哪一個顯微鏡部位、調焦時機、倍率或視野方向概念？
            <textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea>
          </label>
          <label>選一個你想帶到課堂討論的方向，並用自己的話補充
            <span class="field-help">方向可參考上一頁，但不要直接複製方向詞。</span>
            <textarea id="studentQuestion">${reflection.student_question || ""}</textarea>
          </label>
          <label>信心分數
            <span class="field-help">1 分代表「我需要老師帶著整理」；5 分代表「我能安全操作並說明」。</span>
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
  document.querySelector("#submitMission").addEventListener("click", () => {
    if (state.submitted_at) {
      setScreen("result");
      return;
    }
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
      <div class="owl-frame ${owlImageFor("result").className}"><img src="${owlImageFor("result").src}" alt="任務結算貓頭鷹助理"></div>
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
  return `<div class="badge-grid">${unitBadgeCatalog.map((badge) => `<div class="badge ${earned.has(badge.name) ? "earned" : "locked"}" data-badge-id="${badge.id}"><img src="${badge.badge_image_path}" alt="${badge.name}"><strong>${badge.name}</strong><p>${badge.condition}</p></div>`).join("")}</div>`;
}

function titleForExp(exp) {
  if (titleProgressRules) return titleProgressRules.getTitleForExp(exp);
  const titles = [
    { need: 0, title: "見習調查員" },
    { need: 500, title: "生命觀察員" },
    { need: 1500, title: "生態記錄員" },
    { need: 3000, title: "概念解謎者" },
    { need: 5200, title: "微觀探索者" },
    { need: 8000, title: "系統調查員" },
    { need: 11800, title: "生命研究員" },
    { need: 16700, title: "BioQuest 專家" },
    { need: 23400, title: "生命祕境守護者" }
  ];
  const currentIndex = titles.reduce((index, item, itemIndex) => exp >= item.need ? itemIndex : index, 0);
  const current = titles[currentIndex];
  const next = titles[currentIndex + 1];
  return next
    ? { current: current.title, next: next.title, need: next.need, remaining: next.need - exp }
    : { current: current.title, next: "已達目前最高稱號", need: current.need, remaining: 0 };
}

function renderAchievements() {
  if (!state.student) return renderLogin();
  const aggregate = aggregateStudent();
  const title = titleForExp(aggregate.totalExp);
  const progress = titleProgressRules?.progressPercent(aggregate.totalExp) ?? Math.min(100, (aggregate.totalExp / TITLE_PROGRESS_CAP) * 100);
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
        <p class="muted">稱號進度 ${aggregate.totalExp >= TITLE_PROGRESS_CAP ? 100 : Math.floor(progress * 10) / 10}%｜稱號進度以 ${TITLE_PROGRESS_CAP.toLocaleString()} EXP 封頂；全冊理論仍可累積 ${FULL_BOOK_EXP_MAX.toLocaleString()} EXP，達最高稱號後 EXP 繼續累積。</p>
      </div>
      <div class="panel">
        <p class="eyebrow">本單元成就</p>
        <h3>微觀視野校準任務</h3>
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
    ["提示後修正", "提示只提供功能、倍率、視野或安全線索，不直接公布答案；提示後修正仍有 EXP，但同題低於直接答對。"],
    ["回報 EXP", "具體且與顯微鏡部位、操作、視野、倍率或亮度相關的回報最高 40；空白、無關玩笑或直接複製方向詞不給高分。"],
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
  if (state.screen === "brief") {
    attachBriefSceneFallback();
    document.querySelector("#briefNext").addEventListener("click", () => { unlock("scan"); setScreen("scan"); });
  }
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
