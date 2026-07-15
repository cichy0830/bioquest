const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260711-biological-organization-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_biological_organization_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "biological_organization",
  unit_title: "生物體的組成層次",
  mission_title: "生命階層整理任務",
  mission_area: "微觀研究站"
};

const assets = {
  mentorFallback: "../prototype-life-world/assets/mentor-life-world-azhe-v2.png",
  owlLogin: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.png",
  owlPrep: "assets/owl-biological-organization-prep-reminder.png",
  owlScan: "../prototype-cell-basic-unit/assets/owl-basic-unit-cell-scan.png",
  owlResult: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.png",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-biological-organization-briefing-azhe-wide.webp",
  ambientBackgroundHook: "assets/bg-biological-organization-ambient-wide.png",
  hierarchyCards: "assets/biological-organization-animal-hierarchy-cards.png",
  relationExamples: "assets/biological-organization-tissue-organ-system-examples.png",
  unicellularExamples: "assets/biological-organization-unicellular-multicellular-examples.png",
  plantOrgans: "assets/biological-organization-plant-organs-set.png",
  animalPlantCompare: "assets/biological-organization-animal-plant-compare.png"
};

const badgeAsset = (id) => `../shared-assets/badges/biological_organization/badge-biological_organization-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["細胞", "組織", "器官", "器官系統", "個體", "單細胞", "多細胞", "營養器官", "生殖器官", "根", "莖", "葉", "花", "果實", "種子"],
  irrelevantTerms: ["老師好帥", "帥", "午餐", "下課", "遊戲", "天氣", "好笑"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["細胞到個體的排列順序", "組織器官器官系統的差異", "單細胞生物如何完成生命現象", "植物營養器官與生殖器官", "動物與植物組成層次的異同"]
};
const badges = [
  { id: "biological_organization_entry", name: "生命階層入門徽章", condition: "完成生命階層整理任務。" },
  { id: "organization_hierarchy_sorter", name: "層級排序徽章", condition: "細胞到個體的階層題組達 85% 以上。" },
  { id: "tissue_organ_system_identifier", name: "組織器官系統辨識徽章", condition: "組織、器官與器官系統題組達 85% 以上。" },
  { id: "organization_relation_mapper", name: "階層關係連結徽章", condition: "能以組成關係說明相鄰層次。" },
  { id: "unicellular_multicellular_judge", name: "單多細胞判讀徽章", condition: "單細胞與多細胞題組判讀穩定。" },
  { id: "plant_organ_classifier", name: "植物器官分類徽章", condition: "能區分植物營養器官與生殖器官。" },
  { id: "organization_misconception_reviser", name: "階層迷思修正徽章", condition: "提示後完成至少一項概念修正。" },
  { id: "biological_organization_flawless", name: "生命階層零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "biological_organization_reflection_reporter", name: "高品質階層回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_biological_organization", name: "再探生命階層進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id) }));

const sequenceSteps = [
  { id: "cell", label: "細胞" },
  { id: "tissue", label: "組織" },
  { id: "organ", label: "器官" },
  { id: "system", label: "器官系統" },
  { id: "individual", label: "個體" }
];
const correctSequence = ["cell", "tissue", "organ", "system", "individual"];

const questions = [
  {
    id: "q03",
    section: "checkpoint1",
    concept: "organization_hierarchy",
    answer: "individual",
    prompt: "下列哪個最符合『個體』的概念？",
    hint: "判斷它是否已是一個能獨立完成生命現象的完整生物。",
    misconception: "individual_as_system",
    image: assets.hierarchyCards,
    imageAlt: "動物由細胞到個體的組成層次圖卡",
    imageEvidence: "用圖卡比較完整生物與體內局部構造的差異。",
    options: [
      { id: "individual", text: "一株番茄植株" }, { id: "system", text: "一片葉" },
      { id: "organ", text: "一群表皮細胞" }, { id: "tissue", text: "一個胃" }
    ]
  },
  {
    id: "q04",
    section: "checkpoint1",
    concept: "organization_relation",
    answer: "composed",
    prompt: "圖卡依序呈現細胞、組織、器官、器官系統與人體，這組圖卡主要表示什麼？",
    hint: "看圖卡是否從細胞逐漸整理到完整生物，而不是描述生物彼此互動。",
    misconception: "levels_are_unrelated",
    image: assets.hierarchyCards,
    imageAlt: "動物由細胞到個體的組成層次圖卡",
    imageEvidence: "沿著圖卡觀察較小層次如何共同形成較高層次。",
    options: [
      { id: "composed", text: "生物體由小到大的組成層次" },
      { id: "unrelated", text: "生態系中的食物鏈" },
      { id: "same", text: "物質進出細胞的方向" },
      { id: "reverse", text: "植物的生殖過程" }
    ]
  },
  {
    id: "q05", section: "checkpoint2", concept: "tissue_definition", answer: "similar_cells",
    prompt: "哪一個敘述最符合『組織』？", hint: "比較它是單一細胞、完整器官，還是一群共同工作的相似細胞。", misconception: "tissue_as_cell_group_any",
    image: assets.relationExamples, imageAlt: "組織、器官與器官系統例子圖", imageEvidence: "比較圖中相似細胞群與完整器官的層次差異。",
    options: [
      { id: "similar_cells", text: "形態與功能相近的細胞共同形成的層次。" },
      { id: "one_cell", text: "任何一個單獨細胞。" }, { id: "whole_body", text: "完整的一個生物個體。" },
      { id: "many_organs", text: "許多器官共同工作的層次。" }
    ]
  },
  {
    id: "q06", section: "checkpoint2", concept: "organ_identification", answer: "organ",
    prompt: "心臟由多種組織共同構成並執行輸送血液的功能，心臟屬於哪一層？", hint: "判斷它是否由多種組織構成、具有特定功能。", misconception: "organ_as_tissue",
    image: assets.relationExamples, imageAlt: "組織、器官與器官系統例子圖", imageEvidence: "圖中完整構造由多種組織共同完成特定功能。",
    options: [
      { id: "organ", text: "器官" }, { id: "tissue", text: "組織" },
      { id: "system", text: "器官系統" }, { id: "cell", text: "細胞" }
    ]
  },
  {
    id: "q07", section: "checkpoint2", concept: "organ_system", answer: "system",
    prompt: "口腔、食道、胃與腸等器官共同完成消化與吸收，合稱哪一層？", hint: "多個器官彼此協調、共同完成一組功能時，層次會再提高。", misconception: "system_as_organ",
    image: assets.relationExamples, imageAlt: "組織、器官與器官系統例子圖", imageEvidence: "追蹤多個器官如何共同執行一組功能。",
    options: [
      { id: "system", text: "器官系統" }, { id: "organ", text: "器官" },
      { id: "tissue", text: "組織" }, { id: "individual", text: "個體" }
    ]
  },
  {
    id: "q08", section: "checkpoint2", concept: "organ_system", answer: "stomach_organ",
    prompt: "哪個比較正確？", hint: "分清楚單一構造與多個器官共同工作的集合。", misconception: "organ_system_confusion",
    image: assets.relationExamples, imageAlt: "組織、器官與器官系統例子圖", imageEvidence: "比較單一胃與整套消化系統的組成範圍。",
    options: [
      { id: "stomach_organ", text: "胃是器官；胃與其他消化器官共同構成消化系統。" },
      { id: "stomach_system", text: "胃本身就是完整的器官系統。" },
      { id: "same_level", text: "胃與消化系統屬於完全相同層次。" },
      { id: "system_tissue", text: "消化系統只是一種組織。" }
    ]
  },
  {
    id: "q09", section: "checkpoint3", concept: "unicellular_individual", answer: "complete_individual",
    prompt: "草履蟲只有一個細胞，為什麼仍可稱為一個個體？", hint: "判斷這一個細胞是否能完成生物所需的生命現象。", misconception: "unicellular_not_individual",
    image: assets.unicellularExamples, imageAlt: "單細胞與多細胞生物例子圖", imageEvidence: "比較一個細胞即為完整生物與多個細胞共同形成個體的情況。",
    options: [
      { id: "complete_individual", text: "單一細胞就能完成維持生命所需的活動。" },
      { id: "has_tissues", text: "它有完整的組織與器官系統。" },
      { id: "too_small", text: "只要體型小就一定是個體。" },
      { id: "not_individual", text: "一個細胞不可能是個體。" }
    ]
  },
  {
    id: "q11", section: "checkpoint3", concept: "unicellular_individual", answer: "one_cell_individual",
    prompt: "同學說：『單細胞生物只有細胞層次，不算個體。』哪個修正合理？", hint: "層次名稱要看它在生物體中的角色，不只數細胞數量。", misconception: "unicellular_not_individual",
    image: assets.unicellularExamples, imageAlt: "單細胞與多細胞生物例子圖", imageEvidence: "確認單細胞生物的一個細胞同時也是完整個體。",
    options: [
      { id: "one_cell_individual", text: "單細胞生物的一個細胞可同時代表細胞層次與完整個體。" },
      { id: "needs_organs", text: "一定要有器官系統才算個體。" },
      { id: "not_living", text: "單細胞生物不屬於生物。" },
      { id: "many_cells", text: "單細胞生物其實由許多細胞構成。" }
    ]
  },
  {
    id: "q13", section: "checkpoint3", concept: "plant_organ", answer: "organ",
    prompt: "一片完整的葉由多種組織構成，並能執行光合作用等功能，因此葉屬於哪一層？", hint: "判斷它是否由多種組織共同構成並具有特定功能。", misconception: "plant_part_not_organ",
    image: assets.plantOrgans, imageAlt: "植物營養器官與生殖器官圖", imageEvidence: "把葉看成由多種組織形成、具有特定功能的完整構造。",
    options: [
      { id: "organ", text: "器官" }, { id: "tissue", text: "組織" },
      { id: "system", text: "器官系統" }, { id: "cell", text: "細胞" }
    ]
  },
  {
    id: "q14", section: "checkpoint3", concept: "animal_plant_organization", answer: "both_organs",
    prompt: "有同學說：『只有動物有器官，植物只有細胞和葉綠體。』哪個修正較合理？", hint: "從植物體中能負責特定功能的構造找線索，不要只想到動物身體。", misconception: "plants_have_no_organs",
    image: assets.animalPlantCompare, imageAlt: "動物與植物組成層次比較圖", imageEvidence: "比較動物與植物都可由細胞、組織與器官形成完整個體。",
    options: [
      { id: "both_organs", text: "植物也有器官，例如根、莖、葉、花、果實與種子。" },
      { id: "plants_no_organs", text: "植物沒有細胞。" },
      { id: "animals_no_tissue", text: "植物器官一定等於動物器官系統。" },
      { id: "all_same", text: "葉綠體就是完整植物個體。" }
    ]
  }
];

const classifyQuestions = {
  q02: {
    prompt: "請把例子分類到正確的組成層次。每一列都要選擇。",
    hint: "先判斷是單一細胞、相似細胞群、完整器官、多器官協作，或完整生物。",
    misconception: "hierarchy_example_confusion",
    options: [{ id: "cell", label: "細胞" }, { id: "tissue", label: "組織" }, { id: "organ", label: "器官" }, { id: "system", label: "器官系統" }, { id: "individual", label: "個體" }],
    items: [
      { id: "muscle_cell", label: "肌肉細胞", answer: "cell" }, { id: "muscle_tissue", label: "肌肉組織", answer: "tissue" },
      { id: "heart", label: "心臟", answer: "organ" }, { id: "circulatory", label: "循環系統", answer: "system" }, { id: "person", label: "一個人", answer: "individual" }
    ]
  },
  q10: {
    prompt: "請將生物分類為單細胞或多細胞生物。每一列都要選擇。",
    hint: "判斷完整個體由一個細胞或許多分工細胞組成。",
    misconception: "unicellular_multicellular_confusion",
    options: [{ id: "single", label: "單細胞生物" }, { id: "multi", label: "多細胞生物" }],
    items: [
      { id: "paramecium", label: "草履蟲", answer: "single" }, { id: "amoeba", label: "變形蟲", answer: "single" },
      { id: "yeast", label: "酵母菌", answer: "single" }, { id: "human", label: "人", answer: "multi" },
      { id: "banyan", label: "榕樹", answer: "multi" }, { id: "butterfly", label: "蝴蝶", answer: "multi" }
    ]
  },
  q12: {
    prompt: "請將植物器官分類為營養器官或生殖器官。每一列都要選擇。",
    hint: "比較器官主要負責生長與養分取得，或與繁殖形成新個體有關。",
    misconception: "plant_organ_classification",
    options: [{ id: "vegetative", label: "營養器官" }, { id: "reproductive", label: "生殖器官" }],
    items: [
      { id: "root", label: "根", answer: "vegetative" }, { id: "stem", label: "莖", answer: "vegetative" }, { id: "leaf", label: "葉", answer: "vegetative" },
      { id: "flower", label: "花", answer: "reproductive" }, { id: "fruit", label: "果實", answer: "reproductive" }, { id: "seed", label: "種子", answer: "reproductive" }
    ]
  }
};

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
    q02: {},
    q10: {},
    q12: {},
    reflection: {}
  },
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
  return layout(`
    <p class="eyebrow">生命祕境 BioQuest</p>
    <h2 class="hero-title">任務登入</h2>
    ${mentorCard("先確認身分", "請輸入學號並確認姓名。下一頁才會開啟本單元任務情境。")}
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>biological_organization</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
    <div class="form-grid"><label>學號<input id="studentIdInput" value="${value}" placeholder="例如 S70101 或 guest" autocomplete="off"></label></div>
    <div class="actions"><button class="primary" id="loginButton">登入任務</button><button class="secondary" id="guestButton">老師測試 guest</button><button class="ghost" id="resetButton">清除本機測試紀錄</button></div>
    <div id="loginMessage" class="status-line"></div>
  `, assets.owlLogin);
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
    current_title_id: source.current_title_id || "",
    title_avatar_path: source.title_avatar_path || "",
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
      message.innerHTML = `<span class="pill warn">${data?.message || "查無此學號，請重新輸入。"}</span>`;
      return;
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
  state.student = { ...student };
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
  return `<div class="wide-layout">
    <div class="panel">
      <p class="eyebrow">任務簡報</p>
      <h2>生命階層整理任務</h2>
      <div class="brief-scene" data-briefing-scene-hook="${assets.briefingSceneHook}" data-ambient-background-hook="${assets.ambientBackgroundHook}">
        <div class="scene-copy">
          <div class="student-avatar-slot"><img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}';"></div>
          <h3>生命階層檔案需要重新歸位</h3>
          <p>細胞、組織、器官、器官系統與完整個體的資料混在一起。請整理層級關係，比較單細胞與多細胞生物，並完成植物器官分類。</p>
        </div>
      </div>
      <div class="mission-hud"><div><span>任務區</span><strong>生命階層檔案站</strong></div><div><span>重點</span><strong>組成層次</strong></div><div><span>排序題</span><strong>拖曳 + 上下移</strong></div></div>
      <div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div>
    </div>
  </div>`;
}
function renderScan() {
  return `<div class="mission-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的階層線索</h2>
    <div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>先判斷例子是單一細胞、共同工作的細胞群、完整器官、多個器官協作，還是一個完整生物。</p></div>
    <div class="card-grid">
      <div class="concept-card"><strong>細胞與組織</strong><p>相似細胞可共同形成具有特定功能的組織。</p></div>
      <div class="concept-card"><strong>器官</strong><p>多種組織共同構成、執行特定功能的構造。</p></div>
      <div class="concept-card"><strong>器官系統</strong><p>多個器官彼此協調，完成一組重要功能。</p></div>
      <div class="concept-card"><strong>個體</strong><p>能獨立完成生命現象的一個完整生物。</p></div>
      <div class="concept-card"><strong>單細胞</strong><p>一個細胞同時也是一個完整個體。</p></div>
      <div class="concept-card"><strong>植物器官</strong><p>根、莖、葉偏向營養功能；花、果實、種子與生殖有關。</p></div>
    </div>
    <div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div>${owlPanel(assets.owlPrep, "生命階層任務提醒貓頭鷹")}</div>`;
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
  const targets = question.imageTargets || [];
  return `<figure class="question-visual">
    <div class="question-image-wrap"><img src="${question.image}" alt="${question.imageAlt || "未標註觀察圖"}">
      ${targets.map((target) => `<button type="button" class="image-target ${state.answers[question.id] === target.id ? "selected" : ""}" style="left:${target.left}%;top:${target.top}%" data-choice="${question.id}" data-value="${target.id}" aria-label="圖中位置 ${target.label}">${target.label}</button>`).join("")}
    </div>
    <figcaption>${question.imageEvidence || (targets.length ? "請比較圖中位置，再選擇最符合題意的答案。" : "請依圖像與題目提供的組成線索判讀。")}</figcaption>
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
  return `<div class="question-card"><h3>請從較小到較大的組成層次拖曳排序。</h3>
    <p class="field-help">手機可使用每張卡片的上移 / 下移按鈕。</p>
    <div class="sortable-list">${order.map((id, index) => {
      const step = sequenceSteps.find((item) => item.id === id);
      return `<div class="sortable-item" draggable="true" data-sequence-id="${id}">
        <span class="drag-handle" aria-hidden="true"></span>
        <strong>${step.label}</strong>
        <div class="sequence-move-buttons"><button class="icon-action" data-move="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-move="${id}" data-dir="1" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div>
      </div>`;
    }).join("")}</div>
    ${state.hints.q01 ? `<div class="feedback warn">先比較相鄰兩層：較高層次通常由哪些較低層次共同形成，再逐段調整。</div>` : ""}
    ${isWrong ? `<div class="feedback bad">層級順序還需要修正。請依組成關係調整。</div>` : ""}
  </div>`;
}
function renderCheckpoint1() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>組成層次與階層關係</h2>
    <figure class="wide-asset"><img src="${assets.hierarchyCards}" alt="動物組成層次圖卡"><figcaption>先理解層次的組成關係，再完成排序與分類。</figcaption></figure>
    <div class="question-grid">${renderSequenceQuestion()}${renderClassifyQuestion("q02")}${["q03", "q04"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`;
}
function renderCheckpoint2() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>組織、器官與器官系統</h2>
    <figure class="wide-asset"><img src="${assets.relationExamples}" alt="組織器官器官系統例子"><figcaption>比較單一構造與多個器官協作的範圍。</figcaption></figure>
    <div class="question-grid">${["q05", "q06", "q07", "q08"].map(renderChoiceQuestion).join("")}</div>
    <div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`;
}
function renderClassifyQuestion(qid) {
  const config = classifyQuestions[qid];
  const orderedItems = optionOrder(`${qid}_classify_items`, config.items.map((item) => item.id)).map((id) => config.items.find((item) => item.id === id)).filter(Boolean);
  const orderedBuckets = optionOrder(`${qid}_classify_options`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id)).filter(Boolean);
  return `<div class="question-card" data-question-id="${qid}"><h3>${config.prompt}</h3><p class="field-help">分類題：請完成每一列。</p>
    <div class="classify-list">${orderedItems.map((item) => {
      const selected = state.answers[qid]?.[item.id] || "";
      return `<div class="classify-row" data-classify-id="${item.id}">
        <strong>${item.label}</strong>
        <label>分類
          <select data-classify-question="${qid}" data-classify-item="${item.id}">
            <option value="">請選擇</option>
            ${orderedBuckets.map((option) => `<option value="${option.id}" ${selected === option.id ? "selected" : ""}>${option.label}</option>`).join("")}
          </select>
        </label>
        <p class="selected-answer">${selected ? `已選：${config.options.find((option) => option.id === selected)?.label || ""}` : "尚未選擇"}</p>
      </div>`;
    }).join("")}</div>
    ${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}
  </div>`;
}
function renderCheckpoint3() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>單多細胞與植物器官</h2><div class="asset-strip"><figure><img src="${assets.unicellularExamples}" alt="單細胞與多細胞例子"><figcaption>比較完整個體由一個或許多細胞構成。</figcaption></figure><figure><img src="${assets.plantOrgans}" alt="植物器官分類"><figcaption>比較植物器官的主要功能。</figcaption></figure></div><div class="question-grid">${renderChoiceQuestion("q09")}${renderClassifyQuestion("q10")}${renderChoiceQuestion("q11")}${renderClassifyQuestion("q12")}${["q13", "q14"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`;
}

function isCorrect(qid) {
  if (qid === "q01") return ensureSequence().join("|") === correctSequence.join("|");
  if (classifyQuestions[qid]) return classifyQuestions[qid].items.every((item) => state.answers[qid]?.[item.id] === item.answer);
  const question = questionById(qid);
  return state.answers[qid] === question.answer;
}
function isAnswered(qid) {
  if (qid === "q01") return Boolean(state.interactions.q01) && ensureSequence().length === correctSequence.length;
  if (classifyQuestions[qid]) return classifyQuestions[qid].items.every((item) => Boolean(state.answers[qid]?.[item.id]));
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
  document.querySelectorAll("[data-classify-question]").forEach((select) => {
    select.addEventListener("change", () => {
      const qid = select.dataset.classifyQuestion;
      const itemId = select.dataset.classifyItem;
      state.answers[qid] ||= {};
      state.answers[qid][itemId] = select.value;
      state.interactions[qid] = true;
      const item = classifyQuestions[qid].items.find((candidate) => candidate.id === itemId);
      if (select.value && item && select.value !== item.answer) markHint(qid);
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
  if (qid === "q01" || qid === "q02") return "organization_hierarchy";
  if (qid === "q10" || qid === "q11") return "unicellular_multicellular";
  if (qid === "q12") return "plant_organ_classification";
  return questionById(qid)?.concept || "unknown";
}
function questionMisconception(qid) {
  if (qid === "q01") return "organization_hierarchy_sequence";
  if (classifyQuestions[qid]) return classifyQuestions[qid].misconception;
  return questionById(qid)?.misconception || "unknown";
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
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, reflectionEval.question_exp)));
  const baseExp = Math.min(reflectionLedgerCap, completionExp + directExp + revisionExp + reflectionEval.question_exp + masteryExp);
  const retryCandidate = state.attempt_type === "retry" && prevAcc !== null && accuracy > prevAcc ? Math.min(60, Math.round((accuracy - prevAcc) * 100)) : 0;
  const retryExp = Math.min(retryCandidate, Math.max(0, reflectionLedgerCap - baseExp));
  const attemptTotalExp = Math.min(reflectionLedgerCap, baseExp + retryExp);
  const best = previousBestCredited();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(best, attemptTotalExp));
  const sectionStats = [
    sectionStat("組成層次與階層關係", sectionMap.checkpoint1),
    sectionStat("組織、器官與器官系統", sectionMap.checkpoint2),
    sectionStat("單多細胞與植物器官", sectionMap.checkpoint3)
  ];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? [badges[0].id] : [];
  if (sectionStats[0].correct / sectionStats[0].total >= 0.85) earned.push("organization_hierarchy_sorter");
  if (["q02", "q04"].every(isCorrect)) earned.push("organization_relation_mapper");
  if (sectionStats[1].correct / sectionStats[1].total >= 0.85) earned.push("tissue_organ_system_identifier");
  if (["q09", "q10", "q11"].every(isCorrect)) earned.push("unicellular_multicellular_judge");
  if (["q12", "q13", "q14"].every(isCorrect)) earned.push("plant_organ_classifier");
  if (["q01", "q09", "q11", "q12", "q13", "q14"].some((qid) => isCorrect(qid) && state.hints[qid])) earned.push("organization_misconception_reviser");
  if (accuracy === 1 && hintUsed === 0) earned.push("biological_organization_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("biological_organization_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_biological_organization");
  return {
    unit_exp_cap: UNIT_EXP_CAP,
    completion_exp: completionExp,
    concept_exp: directExp,
    revision_exp: revisionExp,
    question_exp: reflectionEval.question_exp,
    ...reflectionEval,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_total_exp: attemptTotalExp,
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
    organization_hierarchy_sequence: "建議再用『較高層次由哪些較低層次共同形成』逐段檢查細胞到個體的順序。",
    hierarchy_example_confusion: "建議再比較單一細胞、相似細胞群、完整器官、多器官協作與完整生物的差異。",
    individual_as_system: "個體是能獨立完成生命現象的完整生物；器官系統只是個體內多個器官的協作。",
    levels_are_unrelated: "組成層次不是互不相關的名稱；較小層次能共同形成較大的層次。",
    tissue_as_cell_group_any: "組織通常由形態與功能相近的細胞共同形成，不是任意細胞混在一起。",
    organ_as_tissue: "器官由多種組織共同構成，且能執行特定功能。",
    system_as_organ: "器官系統由多個器官協調工作，範圍大於單一器官。",
    organ_system_confusion: "請分開比較單一胃與由多個消化器官共同形成的消化系統。",
    unicellular_not_individual: "單細胞生物的一個細胞能完成生命現象，因此同時也是完整個體。",
    unicellular_multicellular_confusion: "分類時要看完整個體由一個細胞或許多分工細胞組成。",
    plant_organ_classification: "植物的根、莖、葉主要與營養生長有關；花、果實、種子與生殖有關。",
    plant_part_not_organ: "植物的葉由多種組織構成並具有特定功能，因此可視為器官。",
    plants_have_no_organs: "植物也具有細胞、組織、器官與完整個體等組成層次。"
  };
  return map[tag] || "建議再把例子放回細胞、組織、器官、器官系統與個體的組成關係中檢查。";
}
function renderReview() {
  const result = calculateResult();
  const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>任務掃描結果</h2>
    <div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理主要概念。</p>"}</div>
      <div class="story-panel"><strong>建議再閱讀理解</strong><p class="muted">這些方向依剛剛仍需要提示或調整的概念整理，幫你回看關鍵線索。</p>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div>
      <div class="story-panel"><strong>課堂提問方向</strong><p>組織與器官的分界、器官與器官系統的關係、單細胞生物為何也是個體、植物營養器官與生殖器官的分類。</p></div>
    </div>
    <div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}
function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="mission-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2>
    <div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；具體且與組成層次、單多細胞或植物器官相關的問題，才可能取得回報 EXP。前台只做初篩，正式分數由後台重算。</p></div>
    <div class="form-grid">
      <label>我最能說明的組成層次關係是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label>
      <label>我還不確定的階層、單多細胞或植物器官概念是什麼？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label>
      <label>選一個希望老師課堂解釋的方向，並用自己的話補充<span class="field-help">方向詞可以參考，但不要直接複製。</span><textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label>
      <label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label>
    </div>
    <div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div>${owlPanel(assets.owlResult)}</div>`;
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
    mastery_exp: attempt.mastery_exp,
    retry_exp: attempt.retry_exp,
    attempt_total_exp: attempt.attempt_total_exp,
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
    organization_hierarchy_score: scoreForConcept(attempt, "organization_hierarchy", "organization_relation"),
    tissue_organ_system_score: scoreForConcept(attempt, "tissue_definition", "organ_identification", "organ_system"),
    unicellular_multicellular_score: scoreForConcept(attempt, "unicellular_individual", "unicellular_multicellular"),
    plant_organ_score: scoreForConcept(attempt, "plant_organ_classification", "plant_organ", "animal_plant_organization"),
    misconceptions_json: JSON.stringify(attempt.misconceptions),
    raw_answers_json: JSON.stringify(attempt.raw_answers),
    badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].map((qid) => ({
      question_id: `${mission.unit_id}_${qid}`,
      skill_tag: questionConcept(qid),
      is_correct: isCorrect(qid),
      used_hint: Boolean(state.hints[qid]),
      attempt_answer: JSON.stringify(qid === "q01" ? state.answers.q01_sequence : state.answers[qid]),
      correct_answer: qid === "q01" ? correctSequence.join(" > ") : classifyQuestions[qid] ? JSON.stringify(Object.fromEntries(classifyQuestions[qid].items.map((item) => [item.id, item.answer]))) : questionById(qid).answer,
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
      applyBackendProgress(response.student_progress || response.progress || {});
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
function renderResult() {
  const result = state.result || calculateResult();
  const notice = state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : "";
  const backendNotice = state.backend_status === "pending_local" ? `<div class="feedback warn">後台暫時無法寫入，本次提交已保留在本機待補送佇列。</div>` : `<div class="feedback good">本次任務已提交，作答結果已鎖定。</div>`;
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>提交後本次作答已鎖定</h2>${notice}${backendNotice}
    <div class="score-grid"><div class="score-box"><span>本次取得</span><strong>${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)} EXP</strong></div><div class="score-box"><span>本單元認列</span><strong>${result.unit_credited_exp} EXP</strong></div><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel"><strong>EXP 明細</strong><p>完成 ${result.completion_exp}｜直接答對 ${result.concept_exp}｜提示後修正 ${result.revision_exp}｜回報 ${result.question_exp}｜精熟 ${result.mastery_exp}｜再挑戰 ${result.retry_exp}</p></div>
      <div class="story-panel"><strong>本次與認列差異</strong><p>本次取得是這次挑戰的原始表現；本單元認列會保留最高表現並受 500 EXP 上限限制。</p></div>
      <div class="story-panel"><strong>回報品質</strong><p>${result.reflection_quality}：${result.reflection_exp_reason}</p><p class="muted">前台候選 ${result.question_exp_candidate || 0} EXP；正式回報 EXP 以後台重算為準。</p></div>
    </div>
    <div class="actions"><button class="primary" id="resultAchievements">查看成就</button><button class="secondary" id="resultRules">查看規則</button></div></div></div>`;
}
function renderAchievements() {
  const currentBadges = state.submitted_at ? (state.result || calculateResult()).badges : [];
  const litIds = cumulativeBadgeIds(currentBadges);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">成就亮燈</p><h2>生命階層徽章牆</h2>
    <div class="score-grid"><div class="score-box"><span>累積徽章</span><strong>${litIds.length}</strong></div><div class="score-box"><span>累積 EXP</span><strong>${state.cumulative_total_exp || 0}</strong></div><div class="score-box"><span>已完成單元</span><strong>${state.completed_unit_count || 0}</strong></div></div>
    <div class="badge-grid">${badges.map((badge) => {
      const lit = litIds.includes(badge.id);
      const gold = badge.id === "biological_organization_flawless";
      return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}" data-badge-id="${badge.id}" data-badge-image-path="${badge.badge_image_path}"><img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="badge-icon" hidden>${lit ? "亮" : "徽"}</div><strong>${badge.name}</strong><p class="muted">${badge.condition}</p></div>`;
    }).join("")}</div><p class="muted">亮燈狀態合併後台 StudentProgress 與本機完整 Attempts；同一徽章只計一次。</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
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
  screen.innerHTML = views[state.screen]();
  attachEvents();
}

render();
