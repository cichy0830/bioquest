const roster = {
  S70101: { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安" },
  S70102: { student_id: "S70102", class_name: "701", seat_no: "02", student_name: "陳柏宇" },
  S70103: { student_id: "S70103", class_name: "701", seat_no: "03", student_name: "許若晴" },
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbws7n-pzOGA7ZaQe044cAA4JElgjVsDTMokXf9ZifKZoGQHRyNSFpuxVppkC8PzZFATqQ/exec";
const VERSION = "20260711-enzymes-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_enzymes_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = document.querySelector("#screen");
const navButtons = [...document.querySelectorAll("[data-nav]")];
const studentMini = document.querySelector("#studentMini");
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "enzymes",
  unit_title: "酵素",
  mission_title: "生命反應加速任務",
  mission_area: "生命反應研究站"
};

// Visual delivery can drop WebP files into this unit directory without changing the UI contract.
const ENZYME_ASSET_BASE = ["..", "shared-assets", "units", "enzymes"].join("/");
const assets = {
  mentorFallback: "../prototype-life-world/assets/mentor-life-world-azhe-v2.webp",
  owlLogin: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/assistants/owl-bioquest-result.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-enzymes-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "assets/bg-enzymes-briefing-azhe-mobile.webp",
  ambientBackgroundHook: `${ENZYME_ASSET_BASE}/bg-enzymes-ambient-wide.webp`
};

const badgeAsset = (id) => `../shared-assets/badges/enzymes/badge-enzymes-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["酵素", "受質", "專一性", "促進反應", "反應速率", "可重複作用", "不被消耗", "溫度", "酸鹼值", "pH", "消化酵素", "澱粉酶", "蛋白酶", "脂肪酶", "消化", "資料判讀", "反應條件", "反應速度"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "減肥", "身材", "酵素飲", "保健食品"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["酵素如何促進生物體內反應", "酵素專一性和受質配對", "酵素為什麼可以重複作用", "溫度過高為什麼不一定更快", "酸鹼值如何影響酵素作用", "消化酵素和養分分解的關係", "如何用資料判讀酵素作用"]
};

const badges = [
  { id: "enzymes_entry", name: "酵素研究入門徽章", condition: "完成生命反應加速任務。" },
  { id: "enzyme_function_booster", name: "反應促進理解徽章", condition: "酵素功能與反應角色題組達 85% 以上。" },
  { id: "enzyme_specificity_matcher", name: "酵素專一配對徽章", condition: "酵素與受質配對題組達 85% 以上。" },
  { id: "enzyme_reusable_guardian", name: "可重複作用徽章", condition: "酵素反應前後本質通常不變的題組達 85% 以上。" },
  { id: "condition_effect_reader", name: "條件影響判讀徽章", condition: "溫度與酸鹼值資料判讀題組達 85% 以上。" },
  { id: "digestion_context_connector", name: "消化情境連結徽章", condition: "消化情境與養分分解題組達 85% 以上。" },
  { id: "enzyme_data_interpreter", name: "酵素資料判讀徽章", condition: "資料表、曲線或排序流程題組達 85% 以上。" },
  { id: "enzyme_misconception_reviser", name: "酵素迷思修正徽章", condition: "至少一題提示後修正成功。" },
  { id: "enzymes_flawless", name: "酵素零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "enzymes_reflection_reporter", name: "高品質酵素回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_enzymes", name: "再探酵素進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id), image_status: "pending" }));

const sequenceSteps = [
  { id: "enzyme_substrate", label: "確認資料測的是哪個酵素與受質" },
  { id: "condition", label: "確認改變的是溫度或酸鹼值" },
  { id: "compare", label: "比較不同條件下的反應速率或產物量" },
  { id: "trend", label: "找出作用較強與較弱的條件" },
  { id: "conclusion", label: "用資料證據形成結論" }
];
const correctSequence = ["enzyme_substrate", "condition", "compare", "trend", "conclusion"];

const questions = [
  { id: "q01", section: "checkpoint1", concept: "enzyme_function", answer: "promote_reaction", prompt: "某生物體內反應在有某種物質參與時進行得更快，而這種物質反應後仍可繼續作用。這種物質最可能具有哪一類功能？", hint: "留意「反應變快」和「反應後仍可繼續作用」兩個線索。", misconception: "enzyme_as_energy", options: [{ id: "promote_reaction", text: "促進生物體內反應進行" }, { id: "all_energy", text: "直接提供所有能量" }, { id: "replace_nutrients", text: "取代所有養分" }, { id: "color_only", text: "只讓物質變色" }] },
  { id: "q02", section: "checkpoint1", concept: "enzyme_reusable", answer: "not_consumed", prompt: "有同學說：「酵素幫忙反應一次後就會被消耗掉。」哪個修正較合理？", hint: "先分辨協助反應進行，和被當成反應材料用掉，是不是同一件事。", misconception: "enzyme_consumed", options: [{ id: "not_consumed", text: "酵素促進反應後通常不被消耗，可繼續作用" }, { id: "becomes_product", text: "酵素一定變成產物" }, { id: "one_use", text: "酵素只能使用一次" }, { id: "waste", text: "酵素就是反應後產生的廢物" }] },
  { id: "q04", section: "checkpoint1", concept: "enzyme_specificity", answer: "not_match", prompt: "若某酵素主要能分解澱粉，卻被拿來處理蛋白質樣品，最合理的預測是什麼？", hint: "把酵素想成有適合對象的工具，先看工具和材料是否配對。", misconception: "no_specificity", options: [{ id: "not_match", text: "作用可能不明顯，因為作用對象不合適" }, { id: "fastest", text: "一定能把蛋白質分解最快" }, { id: "turns_lipase", text: "會變成脂肪酶" }, { id: "all_targets", text: "可以同時分解所有養分" }] },
  { id: "q05", section: "checkpoint2", concept: "temperature_effect", answer: "optimal_temperature", prompt: "某酵素在不同溫度下的反應速率：10 度很慢、25 度中等、37 度最快、70 度幾乎沒有作用。哪個解讀較合理？", hint: "不只看溫度高低，要看資料中反應速率在哪裡最高、在哪裡下降。", misconception: "hotter_always_better", options: [{ id: "optimal_temperature", text: "酵素有適合溫度，太高可能使作用變差" }, { id: "hotter", text: "溫度越高一定越快" }, { id: "cold_permanent", text: "10 度一定使酵素永久失效" }, { id: "seventy_best", text: "70 度一定是所有酵素最佳溫度" }] },
  { id: "q06", section: "checkpoint2", concept: "temperature_effect", answer: "not_always_hotter", prompt: "有同學說：「加熱一定能讓酵素越來越活躍，所以溫度越高越好。」哪個修正較合理？", hint: "想想資料曲線是否一直往上，還是可能在某個範圍後下降。", misconception: "hotter_always_better", options: [{ id: "not_always_hotter", text: "酵素通常有適合溫度，超過適合範圍可能使作用降低或失去作用" }, { id: "boiling", text: "所有酵素都適合沸水" }, { id: "cold_product", text: "低溫一定讓酵素變成產物" }, { id: "no_effect", text: "溫度不會影響酵素" }] },
  { id: "q07", section: "checkpoint2", concept: "ph_effect", answer: "acidic", prompt: "某酵素在酸鹼值 pH 2 作用強，在 pH 7 與 pH 10 作用弱。哪個推論較符合資料？", hint: "先找資料中作用最強的酸鹼值，再描述它較適合的環境。", misconception: "same_ph_for_all", options: [{ id: "acidic", text: "這種酵素較適合酸性環境" }, { id: "all_environments", text: "這種酵素一定適合所有環境" }, { id: "ph_none", text: "酸鹼值不會影響酵素" }, { id: "ten_fastest", text: "pH 10 一定最快" }] },
  { id: "q08", section: "checkpoint2", concept: "ph_effect", answer: "activity_lower", prompt: "胃中的某些消化酵素較適合酸性環境。若把它放到不適合的酸鹼環境中，較可能發生什麼事？", hint: "先看這種酵素原本適合哪種環境，再判斷環境改變後的作用情形。", misconception: "same_ph_for_all", options: [{ id: "activity_lower", text: "作用可能變差" }, { id: "all_faster", text: "一定分解所有養分更快" }, { id: "auto_change", text: "會自動變成另一種酵素" }, { id: "ph_none", text: "酸鹼值完全沒有影響" }] },
  { id: "q10", section: "checkpoint3", concept: "digestion_context", answer: "digest_specific", prompt: "唾液中的澱粉酶可以協助澱粉分解。這最能說明酵素和消化作用的哪個關係？", hint: "注意酵素與養分的配對，以及消化時物質變小的方向。", misconception: "enzyme_replaces_digestion", options: [{ id: "digest_specific", text: "消化酵素可協助特定養分分解成較小物質" }, { id: "replace_organs", text: "酵素會取代所有消化器官" }, { id: "starch_lipid", text: "澱粉酶主要分解脂質" }, { id: "none", text: "消化作用和酵素完全無關" }] },
  { id: "q11", section: "checkpoint3", concept: "digestion_context", answer: "protease", prompt: "若食物中主要含蛋白質，較可能需要哪一類消化酵素協助分解？", hint: "先看食物中主要養分，再找名稱或功能較相配的酵素。", misconception: "no_specificity", options: [{ id: "protease", text: "蛋白酶" }, { id: "amylase", text: "澱粉酶" }, { id: "lipase", text: "脂肪酶" }, { id: "chloroplast", text: "葉綠體" }] },
  { id: "q12", section: "checkpoint3", concept: "reaction_direction_boundary", answer: "not_only_breakdown", prompt: "有同學說：「酵素都只會做分解作用，沒有其他功能。」哪個修正較合理？", hint: "先分清楚消化分解是本單元的例子，不代表所有酵素功能都只限於分解。", misconception: "all_enzymes_only_breakdown", options: [{ id: "not_only_breakdown", text: "消化情境常見分解例子，但生物體內酵素也可促進其他類型反應" }, { id: "mouth_only", text: "酵素都只存在口腔" }, { id: "starch_only", text: "酵素一定只分解澱粉" }, { id: "color_only", text: "酵素只負責把食物變色" }] },
  { id: "q13", section: "checkpoint3", concept: "enzyme_function", answer: "not_energy", prompt: "有同學說：「酵素就是身體的能量，吃越多酵素反應就一定越快。」哪個修正較合理？", hint: "先看酵素在反應中扮演的角色，再想反應是否還需要合適對象和條件。", misconception: "enzyme_as_energy", options: [{ id: "not_energy", text: "酵素是促進反應的物質，不是能量本身；反應快慢還和受質與環境條件有關" }, { id: "calories", text: "酵素等於熱量" }, { id: "no_nutrients", text: "酵素越多就不需要養分" }, { id: "any_condition", text: "所有酵素都能在任何條件下作用" }] },
  { id: "q14", section: "checkpoint3", concept: "ph_effect", answer: "different_conditions", prompt: "有同學說：「只要是酵素，都喜歡同一個溫度和同一個酸鹼值。」哪個修正較合理？", hint: "比較不同酵素時，不要先假設條件都一樣；可從資料或作用位置找線索。", misconception: "same_ph_for_all", options: [{ id: "different_conditions", text: "不同酵素可能有不同適合條件，需要看資料或作用位置判斷" }, { id: "acid_only", text: "所有酵素都只適合酸性" }, { id: "hot_only", text: "所有酵素都只適合高溫" }, { id: "color_only", text: "酸鹼值只影響顏色不影響作用" }] }
];

const multiSelectQuestions = {};

const classifyQuestions = {
  q03: {
    prompt: "請將消化酵素和較適合的作用對象配對。每一列都要選擇。",
    hint: "先觀察酵素名稱中的線索，再想它較常對應哪一類養分。",
    misconception: "no_specificity",
    options: [{ id: "starch", label: "澱粉" }, { id: "protein", label: "蛋白質" }, { id: "lipid", label: "脂質" }],
    items: [{ id: "amylase", label: "澱粉酶", answer: "starch" }, { id: "protease", label: "蛋白酶", answer: "protein" }, { id: "lipase", label: "脂肪酶", answer: "lipid" }]
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
  answers: { q03: {}, q09_sequence: [], reflection: {} },
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
  return student.title_avatar_path || assets.titleAvatarFallback;
}

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return layout(`
    <p class="eyebrow">生命祕境 BioQuest</p><h2 class="hero-title">任務登入</h2>
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>enzymes</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
    <div class="form-grid"><label>學號<input id="studentIdInput" value="${value}" placeholder="例如 S70101 或 guest" autocomplete="off"></label></div>
    <div class="actions"><button class="primary" id="loginButton">登入任務</button><button class="secondary" id="guestButton">老師測試 guest</button><button class="ghost" id="resetButton">清除本機測試紀錄</button></div>
    <div id="loginMessage" class="status-line"></div>
  `, assets.owlLogin);
}

async function fetchStudentStatus(id) {
  const url = `${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}`;
  const response = await fetch(url);
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
  state.student = { ...student };
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

function selectedClass(question, option) {
  const selected = state.answers[question.id] === option.id;
  const checked = state.checkedWrong[question.id];
  if (checked && selected && option.id === question.answer) return " selected correct";
  if (checked && selected && option.id !== question.answer) return " selected wrong";
  return selected ? " selected" : "";
}
function evidenceTable(caption, headers, rows) {
  return `<section class="question-evidence" aria-label="${caption}"><strong>${caption}</strong><div class="evidence-table" role="table"><div class="evidence-row evidence-head" role="row">${headers.map((header) => `<span role="columnheader">${header}</span>`).join("")}</div>${rows.map((row) => `<div class="evidence-row" role="row">${row.map((cell) => `<span role="cell">${cell}</span>`).join("")}</div>`).join("")}</div></section>`;
}
function renderQuestionEvidence(qid) {
  if (qid === "q05") return evidenceTable("溫度與反應速率資料", ["溫度", "反應速率"], [["10 度", "很慢"], ["25 度", "中等"], ["37 度", "最快"], ["70 度", "幾乎沒有作用"]]);
  if (qid === "q07") return evidenceTable("酸鹼值與作用情形資料", ["酸鹼值", "作用情形"], [["pH 2", "強"], ["pH 7", "弱"], ["pH 10", "弱"]]);
  if (qid === "q09") return evidenceTable("資料判讀任務卡", ["欄位", "需要辨認的線索"], [["研究對象", "酵素與受質"], ["改變條件", "溫度或酸鹼值"], ["結果資料", "反應速率或產物量"]]);
  if (qid === "q13") return `<section class="question-evidence qualitative-note"><strong>概念邊界提醒</strong><p>酵素在反應中是促進者；判讀反應快慢仍需同時考慮受質與環境條件，不能把單一因素當成全部原因。</p></section>`;
  return "";
}
function renderChoiceQuestion(qid) {
  const question = questionById(qid);
  return `<div class="question-card" data-question-id="${qid}"><h3>${question.prompt}</h3>${renderQuestionEvidence(qid)}<div class="choice-grid">${orderedOptions(question).map((option) => `<button class="choice-button${selectedClass(question, option)}" data-choice="${qid}" data-value="${option.id}">${option.text}</button>`).join("")}</div><p class="selected-answer">${state.answers[qid] ? `已選：${question.options.find((option) => option.id === state.answers[qid])?.text || ""}` : "尚未選擇"}</p>${state.hints[qid] ? `<div class="feedback warn">${question.hint}</div>` : ""}</div>`;
}
function renderSequenceQuestion() {
  const order = ensureSequence();
  return `<div class="question-card" data-question-id="q09"><h3>判讀一組酵素活性資料時，拖曳整理較合理的思考流程。</h3><p class="field-help">排序題：可拖曳卡片；手機可使用上移 / 下移按鈕。重點是先辨認資料內容，再比較趨勢並形成結論。</p>${renderQuestionEvidence("q09")}<div class="sortable-list">${order.map((id, index) => { const step = sequenceSteps.find((item) => item.id === id); return `<div class="sortable-item" draggable="true" data-sequence-id="${id}"><span class="drag-handle" aria-hidden="true"></span><strong>${step.label}</strong><div class="sequence-move-buttons"><button class="icon-action" data-move="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-move="${id}" data-dir="1" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div></div>`; }).join("")}</div>${state.hints.q09 ? `<div class="feedback warn">先確認酵素與受質，再確認改變條件，接著比較資料趨勢；最後才用證據形成結論。</div>` : ""}${state.checkedWrong.q09 ? `<div class="feedback bad">順序仍可調整；先整理資料在測什麼與改變什麼，再比較結果。</div>` : ""}</div>`;
}
function renderClassifyQuestion(qid) {
  const config = classifyQuestions[qid];
  const items = optionOrder(`${qid}_items`, config.items.map((item) => item.id)).map((id) => config.items.find((item) => item.id === id));
  const options = optionOrder(`${qid}_options`, config.options.map((option) => option.id)).map((id) => config.options.find((option) => option.id === id));
  return `<div class="question-card" data-question-id="${qid}"><h3>${config.prompt}</h3><p class="field-help">配對題：請完成每一列；選後會直接顯示已選答案。先看酵素名稱與作用對象的關係。</p><div class="classify-list">${items.map((item) => { const selected = state.answers[qid]?.[item.id] || ""; return `<div class="classify-row"><strong>${item.label}</strong><label>選擇<select data-classify-question="${qid}" data-classify-item="${item.id}"><option value="">請選擇</option>${options.map((option) => `<option value="${option.id}" ${selected === option.id ? "selected" : ""}>${option.label}</option>`).join("")}</select></label><p class="selected-answer">${selected ? `已選：${config.options.find((option) => option.id === selected)?.label || ""}` : "尚未選擇"}</p></div>`; }).join("")}</div>${state.hints[qid] ? `<div class="feedback warn">${config.hint}</div>` : ""}</div>`;
}
function renderBrief() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務簡報</p><h2>生命反應加速任務</h2><div class="brief-scene enzymes-brief-scene" data-briefing-scene-hook="${assets.briefingSceneHook}"><div class="scene-copy"><div class="student-avatar-slot"><img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}';"></div><h3>為什麼同一種反應有時快、有時慢？</h3><p>生命反應研究站的資料顯示，酵素、受質與環境條件會一起影響反應。你要從配對、資料與生活情境中找出合理解釋。</p></div></div><div class="mission-hud"><div><span>任務區</span><strong>生命反應研究站</strong></div><div><span>重點</span><strong>專一性與條件</strong></div><div><span>原則</span><strong>用資料判讀</strong></div></div><div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div></div></div>`;
}
function renderScan() {
  return `<div class="mission-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的判斷線索</h2><div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>酵素能促進反應，但不是能量本身；先看作用對象是否配對，再看溫度、酸鹼值與資料趨勢。</p></div><div class="card-grid"><div class="concept-card"><strong>反應角色</strong><p>酵素可促進生物體內反應，反應後通常不被消耗。</p></div><div class="concept-card"><strong>專一性</strong><p>不同酵素通常有較適合的作用對象。</p></div><div class="concept-card"><strong>條件影響</strong><p>溫度與酸鹼值要看適合範圍，不是越高或越極端越好。</p></div><div class="concept-card"><strong>資料判讀</strong><p>先確認研究對象與改變條件，再比較多筆資料形成結論。</p></div></div><div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div><div class="owl-frame enzymes-prep-owl"><img src="${assets.owlPrep}" alt="酵素任務提醒貓頭鷹"></div></div>`;
}
function renderCheckpoint1() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>酵素功能與專一性</h2><div class="question-grid">${["q01","q02"].map(renderChoiceQuestion).join("")}${renderClassifyQuestion("q03")}${renderChoiceQuestion("q04")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`; }
function renderCheckpoint2() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>條件與資料判讀</h2><div class="question-grid">${["q05","q06","q07","q08"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`; }
function renderCheckpoint3() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>消化情境與迷思修正</h2><div class="question-grid">${renderSequenceQuestion()}${["q10","q11","q12","q13","q14"].map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`; }

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
  if (qid === "q03") return "enzyme_specificity";
  if (qid === "q09") return "data_interpretation";
  return questionById(qid)?.concept || "unknown";
}
function questionMisconception(qid) {
  if (classifyQuestions[qid]) return classifyQuestions[qid].misconception;
  if (qid === "q09") return "data_single_point";
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
  const masteryExp = accuracy === 1 && hintUsed === 0 ? 180 : accuracy === 1 ? 80 : accuracy >= 0.9 ? 50 : 0;
  const previousAccuracy = previousBestAccuracy(); const completionExp = allRequiredAnswered() ? 100 : 0;
  const baseExp = Math.min(UNIT_EXP_CAP, completionExp + directExp + revisionExp + reflectionEval.question_exp + masteryExp);
  const retryCandidate = state.attempt_type === "retry" && previousAccuracy !== null && accuracy > previousAccuracy ? Math.min(60, Math.round((accuracy - previousAccuracy) * 100)) : 0;
  const retryExp = Math.min(retryCandidate, Math.max(0, UNIT_EXP_CAP - baseExp));
  const attemptTotalExp = Math.min(UNIT_EXP_CAP, baseExp + retryExp); const best = previousBestCredited(); const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(best, attemptTotalExp));
  const sectionStats = [sectionStat("酵素功能與專一性", sectionMap.checkpoint1), sectionStat("條件與資料判讀", sectionMap.checkpoint2), sectionStat("消化情境與迷思修正", sectionMap.checkpoint3)];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? ["enzymes_entry"] : [];
  if (["q01","q13"].every(isCorrect)) earned.push("enzyme_function_booster");
  if (["q03","q04","q11"].every(isCorrect)) earned.push("enzyme_specificity_matcher");
  if (["q02"].every(isCorrect)) earned.push("enzyme_reusable_guardian");
  if (["q05","q06","q07","q08","q14"].every(isCorrect)) earned.push("condition_effect_reader");
  if (["q10","q11","q12"].every(isCorrect)) earned.push("digestion_context_connector");
  if (["q05","q07","q09"].every(isCorrect)) earned.push("enzyme_data_interpreter");
  if (qids.some((qid) => isCorrect(qid) && state.hints[qid])) earned.push("enzymes_misconception_reviser");
  if (accuracy === 1 && hintUsed === 0) earned.push("enzymes_flawless");
  if (reflectionEval.reflection_quality === "discussion_question" && reflectionEval.reflection_review_status === "server_recalculated") earned.push("enzymes_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_enzymes");
  return { unit_exp_cap: UNIT_EXP_CAP, completion_exp: completionExp, concept_exp: directExp, revision_exp: revisionExp, question_exp: reflectionEval.question_exp, question_exp_candidate: reflectionEval.question_exp_candidate ?? reflectionEval.question_exp, mastery_exp: masteryExp, retry_exp: retryExp, attempt_total_exp: attemptTotalExp, unit_credited_exp: unitCreditedExp, credited_delta: Math.max(0, unitCreditedExp - best), correct, total, accuracy, hint_used: hintUsed, correct_without_hint: correctWithoutHint, corrected_after_hint: correctedAfterHint, previous_accuracy: previousAccuracy, accuracy_delta: previousAccuracy === null ? null : accuracy - previousAccuracy, section_stats: sectionStats, misconceptions, concept_mastery_tags_json: conceptMastery(qids), badges: [...new Set(earned)], cumulative_badges_candidate: cumulativeBadgeIds(earned), no_hint_perfect: accuracy === 1 && hintUsed === 0, all_required_answered: allRequiredAnswered(), teacher_attention_needed: Number(state.answers.reflection.confidence_score || 3) <= 2 || accuracy < 0.6 || reflectionEval.reflection_review_status === "pending_review" || misconceptions.length >= 3, ...reflectionEval };
}

function misconceptionText(tag) {
  const map = {
    enzyme_as_energy: "建議再確認酵素是促進反應的物質，不是能量本身。",
    enzyme_consumed: "建議再區分促進反應與被反應消耗；酵素通常可重複作用。",
    no_specificity: "建議再整理酵素與受質的配對：不同酵素通常有較適合的作用對象。",
    hotter_always_better: "建議再回到溫度資料的最高與下降趨勢，不把溫度越高當成固定規則。",
    same_ph_for_all: "建議再用酸鹼值資料或作用位置判斷，不假設所有酵素適合相同條件。",
    enzyme_replaces_digestion: "建議再確認酵素協助特定反應，不能取代整個消化與吸收過程。",
    all_enzymes_only_breakdown: "建議再區分消化分解例子與生物體內酵素可促進的其他反應。",
    data_single_point: "建議先確認研究對象與改變條件，再比較多筆資料的趨勢形成結論。"
  };
  return map[tag] || "建議再把酵素角色、作用對象、環境條件與資料趨勢連在一起檢查。";
}

function renderReview() {
  const result = calculateResult(); const stable = result.section_stats.filter((item) => item.correct / item.total >= 0.85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>生命反應加速任務回饋</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理酵素判讀的主要線索。</p>"}</div><div class="story-panel"><strong>建議再閱讀理解</strong>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>課堂提問方向</strong><p>酵素為什麼能重複作用、專一性如何判斷、溫度與酸鹼值資料怎麼讀，以及消化情境的配對關係。</p></div></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}

function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="mission-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下希望老師課堂再解釋的部分</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；只複製方向、無關玩笑或敷衍句不會取得高 EXP。具體且與酵素功能、專一性、可重複作用、溫度、酸鹼值、消化或資料判讀相關的疑問，才可能取得回報 EXP，正式分數由後台重算。</p></div><div class="form-grid"><label>我最能掌握的一項酵素概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定酵素的作用對象、環境條件或資料趨勢中的哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個希望老師課堂解釋的方向，並用自己的話補充<textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1,2,3,4,5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div>${owlPanel("../shared-assets/characters/owl-bioquest-report-reminder.webp")}</div>`;
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
    enzyme_function_score: scoreForConcept(attempt, "enzyme_function"), enzyme_reusable_score: scoreForConcept(attempt, "enzyme_reusable"), enzyme_specificity_score: scoreForConcept(attempt, "enzyme_specificity"), condition_effect_score: scoreForConcept(attempt, "temperature_effect", "ph_effect"), digestion_context_score: scoreForConcept(attempt, "digestion_context"), enzyme_data_interpretation_score: scoreForConcept(attempt, "data_interpretation"), reaction_direction_boundary_score: scoreForConcept(attempt, "reaction_direction_boundary"), enzyme_misconceptions_json: JSON.stringify(attempt.misconceptions),
    misconceptions_json: JSON.stringify(attempt.misconceptions), raw_answers_json: JSON.stringify(attempt.raw_answers), badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: qids.map((qid) => ({ question_id: `${mission.unit_id}_${qid}`, skill_tag: questionConcept(qid), is_correct: isCorrect(qid), used_hint: Boolean(state.hints[qid]), attempt_answer: JSON.stringify(answerFor(qid)), correct_answer: JSON.stringify(correctFor(qid)), exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept", exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total) }))
  };
}

function renderAchievements() {
  const currentBadges = state.submitted_at ? (state.result || calculateResult()).badges : []; const litIds = cumulativeBadgeIds(currentBadges);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">成就亮燈</p><h2>酵素研究徽章牆</h2><div class="score-grid"><div class="score-box"><span>累積徽章</span><strong>${litIds.length}</strong></div><div class="score-box"><span>累積 EXP</span><strong>${state.cumulative_total_exp || 0}</strong></div><div class="score-box"><span>已完成單元</span><strong>${state.completed_unit_count || 0}</strong></div></div><div class="badge-grid">${badges.map((badge) => { const lit = litIds.includes(badge.id); const gold = badge.id === "enzymes_flawless"; const visual = badge.image_status === "ready" ? `<img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}">` : `<span class="bq-badge-asset-pending" aria-label="${badge.name}素材待補">徽章素材待補</span>`; return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}" data-badge-id="${badge.id}" data-badge-image-path="${badge.badge_image_path}">${visual}<strong>${badge.name}</strong><p class="muted">${badge.condition}</p></div>`; }).join("")}</div><p class="muted">未取得徽章維持灰階，取得後亮燈；正式圖片落地後會依 badge_id 自動串接。</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
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
      state.backend_status = response.verification_status === "server_verified" ? "submitted_verified" : "pending_verification";
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
function renderResult() {
  const result = state.result || calculateResult();
  const notice = state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : "";
  const backendNotice = state.backend_status === "pending_local" ? `<div class="feedback warn">後台暫時無法寫入，本機已保留原始作答；在後台驗證完成前不認列 EXP 或徽章。若憑證過期，請重新登入。</div>` : state.backend_status === "submitted_verified" ? `<div class="feedback good">本次任務已由後台驗證並鎖定。</div>` : `<div class="feedback warn">本次資料仍待後台驗證，暫不新增認列 EXP 或徽章。</div>`;
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>提交後本次作答已鎖定</h2>${notice}${backendNotice}
    <div class="score-grid"><div class="score-box"><span>本次取得</span><strong>${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)} EXP</strong></div><div class="score-box"><span>本單元認列</span><strong>${result.unit_credited_exp} EXP</strong></div><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div></div>
    <div class="card-grid">
      <div class="story-panel"><strong>EXP 明細</strong><p>完成 ${result.completion_exp}｜直接答對 ${result.concept_exp}｜提示後修正 ${result.revision_exp}｜回報 ${result.question_exp}｜精熟 ${result.mastery_exp}｜再挑戰 ${result.retry_exp}</p></div>
      <div class="story-panel"><strong>本次與認列差異</strong><p>本次取得是這次挑戰的原始表現；本單元認列會保留最高表現並受 500 EXP 上限限制。</p></div>
      <div class="story-panel"><strong>回報品質</strong><p>${result.reflection_quality}：${result.reflection_exp_reason}</p><p class="muted">前台候選 ${result.question_exp_candidate || 0} EXP；正式回報 EXP 以後台重算為準。</p></div>
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
  screen.innerHTML = views[state.screen]();
  attachEvents();
}

render();
