const roster = {
  S70101: { student_id: "S70101", class_name: "701", seat_no: "01", student_name: "林安安" },
  S70102: { student_id: "S70102", class_name: "701", seat_no: "02", student_name: "陳柏宇" },
  S70103: { student_id: "S70103", class_name: "701", seat_no: "03", student_name: "許若晴" },
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbws7n-pzOGA7ZaQe044cAA4JElgjVsDTMokXf9ZifKZoGQHRyNSFpuxVppkC8PzZFATqQ/exec";
const VERSION = "20260711-cell-transport-p1-v3";
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
  mentorFallback: "../prototype-life-world/assets/mentor-life-world-azhe-v2.png",
  owlLogin: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.png",
  owlPrep: "assets/owl-cell-transport-prep-reminder.png",
  owlResult: "../prototype-cell-basic-unit/assets/owl-basic-unit-result.png",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.png",
  briefingSceneHook: "assets/bg-cell-transport-briefing-azhe-wide.png",
  ambientBackgroundHook: "assets/bg-cell-transport-ambient-wide.png",
  diffusionImage: "assets/cell-transport-diffusion-particle-sim.png",
  osmosisImage: "assets/cell-transport-osmosis-semipermeable-scene.png",
  potatoDataImage: "assets/cell-transport-potato-water-balance-samples.png",
  animalCellImage: "assets/cell-transport-animal-cell-concentration-set.png",
  plantCellImage: "assets/cell-transport-plant-cell-concentration-set.png"
};

const badgeAsset = (id) => `../shared-assets/badges/cell_transport/badge-cell_transport-${id}.png`;
const reflectionRules = {
  conceptTerms: ["擴散", "滲透", "半透膜", "細胞膜", "濃度", "溶質", "水分", "紅血球", "植物細胞", "質壁分離", "馬鈴薯", "皺縮", "膨脹"],
  irrelevantTerms: ["老師好帥", "帥", "午餐", "下課", "遊戲", "天氣", "好笑"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["擴散與滲透的差異", "半透膜如何影響水分移動", "為什麼水分常往溶質濃度較高的一側移動", "細胞膜選擇性通透", "紅血球在清水或濃食鹽水中的變化", "植物細胞膨壓與質壁分離", "質量變化資料如何推論水分進出"]
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
    prompt: "一群有顏色的粒子進入清水後，逐漸向四周散開，最後分布較均勻。這主要可用哪個概念解釋？",
    answer: "diffusion", hint: "先看移動的是染料粒子，還是水分通過一層膜。",
    image: assets.diffusionImage, imageAlt: "粒子逐漸分散的未標註示意圖", imageEvidence: "比較圖中粒子由密集區走向較均勻分布的變化。",
    options: [
      { id: "diffusion", text: "擴散作用" }, { id: "osmosis", text: "滲透作用" }, { id: "division", text: "細胞分裂" }, { id: "photosynthesis", text: "光合作用" }
    ]
  },
  {
    id: "q02", section: "checkpoint1", concept: "diffusion", misconception: "diffusion_requires_cell_membrane",
    prompt: "有同學說：「擴散一定要有細胞膜才會發生。」哪個修正較合理？",
    answer: "no_membrane_needed", hint: "想想香味在教室中散開，是否一定要先穿過細胞膜。",
    image: assets.diffusionImage, imageAlt: "粒子逐漸分散的未標註示意圖",
    options: [
      { id: "no_membrane_needed", text: "擴散可發生在氣體或液體中，不一定需要細胞膜。" }, { id: "plant_only", text: "擴散只能發生在植物細胞裡。" }, { id: "water_only", text: "擴散就是水通過半透膜。" }, { id: "no_gradient", text: "擴散和濃度差無關。" }
    ]
  },
  {
    id: "q03", section: "checkpoint1", concept: "osmosis", misconception: "direction_by_water_amount_only",
    prompt: "半透膜兩側分別是清水與濃糖水，水可以通過，但糖較不容易通過。水分主要會往哪一側移動？",
    answer: "to_sugar", hint: "注意這題追蹤的是水；把兩側的溶質多寡與水分多寡分開比較。",
    image: assets.osmosisImage, imageAlt: "半透膜兩側粒子分布的未標註示意圖", imageEvidence: "辨認膜的位置，再比較膜兩側可通過的小粒子與受限制粒子的分布。",
    options: [
      { id: "to_sugar", text: "往濃糖水一側" }, { id: "to_water", text: "往清水一側" }, { id: "no_move", text: "完全不會移動" }, { id: "container", text: "只看容器大小決定" }
    ]
  },
  {
    id: "q04", section: "checkpoint1", concept: "semipermeable_membrane", misconception: "semipermeable_as_wall",
    prompt: "下列哪個說法最符合半透膜在滲透作用中的角色？",
    answer: "selective", hint: "關鍵不是有沒有膜而已，還要看哪些物質能通過、哪些被限制。",
    image: assets.osmosisImage, imageAlt: "半透膜兩側粒子分布的未標註示意圖",
    options: [
      { id: "selective", text: "讓某些物質通過、限制另一些物質通過。" }, { id: "all_free", text: "讓所有物質都完全自由通過。" }, { id: "all_block", text: "讓所有物質都完全不能通過。" }, { id: "color", text: "只負責讓細胞變色。" }
    ]
  },
  {
    id: "q05", section: "checkpoint2", concept: "concentration_gradient", misconception: "diffusion_direction_by_solute_concentration",
    prompt: "某物質在細胞外濃度較高、細胞內濃度較低，且此物質可通過細胞膜。若只考慮擴散趨勢，較可能的移動方向是什麼？",
    answer: "outside_in", hint: "先只比較該物質在膜兩側的濃度高低，不要先想細胞大小。",
    image: assets.diffusionImage, imageAlt: "膜兩側粒子密度不同的未標註示意圖",
    options: [
      { id: "outside_in", text: "由細胞外往細胞內" }, { id: "inside_out", text: "由細胞內往細胞外" }, { id: "none", text: "完全不會移動" }, { id: "same", text: "一定同時大量雙向移動且無差異" }
    ]
  },
  {
    id: "q06", section: "checkpoint2", concept: "cell_membrane_selectivity", misconception: "cell_membrane_all_or_none",
    prompt: "下列哪個說法較符合細胞膜與物質進出的關係？",
    answer: "regulate", hint: "想想細胞需要取得某些物質，也需要維持內部環境，不會只是完全開放或完全封閉。",
    options: [
      { id: "regulate", text: "細胞膜可調控物質進出，具有選擇性通透概念。" }, { id: "all_pass", text: "細胞膜讓所有物質隨意通過。" }, { id: "none_pass", text: "細胞膜讓任何物質都完全不能通過。" }, { id: "support", text: "細胞膜只用來支撐植物細胞。" }
    ]
  },
  {
    id: "q08", section: "checkpoint2", concept: "evidence_based_prediction", misconception: "data_not_evidence",
    prompt: "根據下表的前後質量資料，哪個判斷較合理？",
    answer: "water_direction", hint: "先把質量增加或減少和水分進出方向連起來，再判斷兩種溶液造成的差異。",
    image: assets.potatoDataImage, imageAlt: "馬鈴薯樣本變化的未標註比較圖", imageEvidence: "圖片提供實驗情境；判斷依據是下方可讀的前後質量數據。",
    dataTable: [
      { sample: "甲", before: "10.0 g", after: "10.6 g" },
      { sample: "乙", before: "10.0 g", after: "9.4 g" }
    ],
    options: [
      { id: "water_direction", text: "甲中水分較可能進入細胞，乙中水分較可能離開細胞。" }, { id: "break", text: "甲乙都一定讓細胞完全破裂。" }, { id: "irrelevant", text: "質量變化和水分進出無關。" }, { id: "no_water", text: "乙中一定沒有任何水。" }
    ]
  },
  {
    id: "q09", section: "checkpoint3", concept: "animal_cell_concentration_change", misconception: "animal_cell_wall_confusion",
    prompt: "紅血球放入濃食鹽水中，外界溶質濃度較高。較可能出現哪種變化方向？",
    answer: "shrink", hint: "先比較細胞外溶質濃度，再想水分通過細胞膜時的移動方向。",
    image: assets.animalCellImage, imageAlt: "動物細胞在不同濃度環境的未標註比較圖", imageEvidence: "比較紅血球外形，並用題幹提供的外界濃度解釋水分淨移動。",
    options: [
      { id: "shrink", text: "水分離開細胞，細胞可能皺縮。" }, { id: "swell", text: "水分大量進入細胞，細胞一定變大。" }, { id: "same", text: "外界濃度不會影響細胞。" }, { id: "wall", text: "細胞壁會阻止紅血球變形。" }
    ]
  },
  {
    id: "q10", section: "checkpoint3", concept: "animal_cell_concentration_change", misconception: "animal_cell_wall_confusion",
    prompt: "紅血球放入清水中，外界溶質濃度比細胞內低很多。較可能出現哪種變化方向？",
    answer: "swell", hint: "先判斷外界溶質濃度相對較低時，水分會更傾向往哪一側移動。",
    image: assets.animalCellImage, imageAlt: "動物細胞在不同濃度環境的未標註比較圖", imageEvidence: "比較紅血球外形，並用題幹提供的外界濃度解釋水分淨移動。",
    options: [
      { id: "swell", text: "水分進入細胞，細胞可能膨脹甚至破裂。" }, { id: "shrink", text: "水分離開細胞，細胞皺縮。" }, { id: "wall", text: "紅血球因細胞壁保護完全不變。" }, { id: "no_water", text: "清水中沒有水分能移動。" }
    ]
  },
  {
    id: "q11", section: "checkpoint3", concept: "plant_cell_concentration_change", misconception: "plant_cell_burst_like_animal",
    prompt: "植物細胞放入清水中，水分進入細胞後，哪個說法較合理？",
    answer: "wall_support", hint: "比較植物細胞與紅血球在清水中維持外形的情況。",
    image: assets.plantCellImage, imageAlt: "植物細胞在不同濃度環境的未標註比較圖", imageEvidence: "比較外框與內部體積的相對變化，不先替三種狀態命名。",
    options: [
      { id: "wall_support", text: "細胞會較膨脹，但細胞壁可提供支撐，不像動物細胞那樣容易破裂。" }, { id: "burst", text: "細胞一定立刻破裂。" }, { id: "no_water", text: "細胞膜完全不讓水通過。" }, { id: "wall_blocks", text: "細胞壁會讓水分完全不能進入。" }
    ]
  },
  {
    id: "q12", section: "checkpoint3", concept: "plant_cell_concentration_change", misconception: "plasmolysis_unknown",
    prompt: "植物細胞放入濃食鹽水中，水分離開細胞。顯微觀察下較可能看到哪種變化方向？",
    answer: "plasmolysis", hint: "比較細胞外框與細胞內部的相對位置有沒有改變。",
    image: assets.plantCellImage, imageAlt: "植物細胞在不同濃度環境的未標註比較圖", imageEvidence: "比較外框與內部體積的相對變化，不先替三種狀態命名。",
    options: [
      { id: "plasmolysis", text: "細胞內部縮小，細胞膜可能和細胞壁分離。" }, { id: "wall_gone", text: "細胞壁完全消失。" }, { id: "chloroplast_nucleus", text: "葉綠體全部變成細胞核。" }, { id: "only_in", text: "水分只會進入不會離開。" }
    ]
  },
  {
    id: "q13", section: "checkpoint3", concept: "osmosis", misconception: "direction_by_water_amount_only",
    prompt: "有同學說：「水一定往水比較多的地方移動，所以不需要看溶質濃度。」哪個修正較合理？",
    answer: "solute", hint: "先不要只看液體多少，改比較兩側溶質濃度與半透膜條件。",
    options: [
      { id: "solute", text: "判斷滲透時要看半透膜兩側溶質濃度差，水分常往溶質濃度較高的一側移動。" }, { id: "no_pass", text: "水分完全不會通過半透膜。" }, { id: "always_stop", text: "只要有水就一定平均不動。" }, { id: "color_only", text: "溶質濃度只影響顏色不影響水分。" }
    ]
  },
  {
    id: "q14", section: "checkpoint3", concept: "cell_membrane_selectivity", misconception: "cell_membrane_all_or_none",
    prompt: "有同學說：「細胞膜控制物質進出，所以任何物質都完全不能通過。」哪個修正較合理？",
    answer: "selective", hint: "想想細胞若完全不能和外界交換物質，是否能維持生命活動。",
    options: [
      { id: "selective", text: "細胞膜具選擇性通透，會影響不同物質進出。" }, { id: "none", text: "細胞膜讓所有物質完全不能通過。" }, { id: "plant_only", text: "細胞膜只存在植物細胞。" }, { id: "color", text: "細胞膜只負責讓細胞有顏色。" }
    ]
  }
];

const sequenceSteps = [
  { id: "track", label: "確認要追蹤的是水還是其他物質" },
  { id: "membrane", label: "確認是否有膜或半透膜" },
  { id: "concentration", label: "比較兩側濃度" },
  { id: "predict", label: "預測主要移動方向" }
];
const correctSequence = sequenceSteps.map((step) => step.id);
const sectionMap = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08"],
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
  cumulative_badges: [],
  cumulative_total_exp: 0,
  completed_unit_count: 0,
  started_at: null,
  completedScreens: ["login", "rules"],
  answers: { q07_sequence: [], reflection: {} },
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
let draggedSequenceId = null;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    return saved ? { ...clone(defaultState), ...saved, answers: { ...clone(defaultState.answers), ...(saved.answers || {}) }, interactions: { ...(saved.interactions || {}) } } : clone(defaultState);
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
function questionById(qid) { return questions.find((question) => question.id === qid); }
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
function ensureSequence() {
  if (!Array.isArray(state.answers.q07_sequence) || state.answers.q07_sequence.length !== sequenceSteps.length) state.answers.q07_sequence = shuffle(sequenceSteps.map((step) => step.id));
  return state.answers.q07_sequence;
}
function unlock(...screens) {
  screens.forEach((item) => { if (!state.completedScreens.includes(item)) state.completedScreens.push(item); });
}
function isLockedScreen(next) { return Boolean(state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(next)); }
function redirectLockedAttempt() { state.lockNotice = LOCK_MESSAGE; state.screen = "result"; saveState(); }
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
function titleAvatarPath() { return state.student?.title_avatar_path || assets.titleAvatarFallback; }
function mentorCard(title, text) {
  return `<div class="mentor-card"><div class="mentor-avatar"><img src="${assets.mentorFallback}" alt="阿澤老師" onerror="this.closest('.mentor-card').hidden=true"></div><div class="mentor-copy"><span>阿澤老師</span><strong>${title}</strong><p>${text}</p></div></div>`;
}
function owlPanel(image, alt = "貓頭鷹助理") { return `<div class="owl-frame"><img src="${image}" alt="${alt}" onerror="this.closest('.owl-frame').hidden=true"></div>`; }
function layout(content, owlImage = assets.owlLogin) { return `<div class="mission-layout"><div class="panel hero-panel">${content}</div>${owlPanel(owlImage)}</div>`; }

function renderLogin() {
  const value = state.student?.student_id && state.student.student_id !== "guest" ? state.student.student_id : "";
  return layout(`
    <p class="eyebrow">生命祕境 BioQuest</p><h2 class="hero-title">任務登入</h2>
    ${mentorCard("先確認身分", "請輸入學號並確認姓名。登入後會開啟本次任務簡報。")}
    <div class="story-panel"><strong>固定登入招呼</strong><p>輸入學號後，系統會顯示姓名。老師測試流程時可使用 guest。</p></div>
    <div class="mission-hud"><div><span>任務代號</span><strong>cell_transport</strong></div><div><span>預估時間</span><strong>10-15 分鐘</strong></div><div><span>後台</span><strong>Google Sheet</strong></div></div>
    <div class="form-grid"><label>學號<input id="studentIdInput" value="${value}" placeholder="例如 S70101 或 guest" autocomplete="off"></label></div>
    <div class="actions"><button class="primary" id="loginButton">登入任務</button><button class="secondary" id="guestButton">老師測試 guest</button><button class="ghost" id="resetButton">清除本機測試紀錄</button></div><div id="loginMessage" class="status-line"></div>
  `);
}
async function fetchStudentStatus(id) {
  const response = await fetch(`${BACKEND_URL}?action=getStudentAndAttemptStatus&student_id=${encodeURIComponent(id)}&unit_id=${encodeURIComponent(mission.unit_id)}`);
  if (!response.ok) throw new Error(`backend_${response.status}`);
  return response.json();
}
function normalizeBackendStudent(data, id) {
  if (!data?.ok) return null;
  const source = data.student || data;
  return {
    student_id: source.student_id || id, class_name: source.class_name || source.class || "未設定", seat_no: source.seat_no || source.seat || "00",
    student_name: source.student_name || source.name || "未設定", profile_gender: source.profile_gender || source.gender || "",
    current_title_id: source.current_title_id || "", title_avatar_path: source.title_avatar_path || "", is_guest: id === "guest" || Boolean(source.is_guest)
  };
}
async function login(id) {
  const message = document.querySelector("#loginMessage");
  if (!id) { message.innerHTML = "<span class=\"pill warn\">請輸入學號。</span>"; return; }
  let student; let completed = 0; let remoteProgress = {}; let remoteAttemptStatus = {};
  try {
    const data = await fetchStudentStatus(id);
    student = normalizeBackendStudent(data, id);
    if (!student) { message.innerHTML = `<span class="pill warn">${data?.message || "查無此學號，請重新輸入。"}</span>`; return; }
    remoteProgress = data.progress || data.student_progress || {};
    remoteAttemptStatus = data.attempt_status || {};
    completed = Number(remoteAttemptStatus.completed_attempt_count ?? data.completed_attempts ?? 0);
  } catch {
    student = roster[id];
    if (!student) { message.innerHTML = "<span class=\"pill warn\">後台暫時無法連線，且本機測試名單查無此學號。</span>"; return; }
    completed = studentAttempts(student.student_id).length;
    message.innerHTML = "<span class=\"pill warn\">後台暫時無法連線，已使用本機測試名單。</span>";
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
  document.querySelector("#resetButton").addEventListener("click", () => { localStorage.removeItem(storageKey); localStorage.removeItem(attemptsKey); state = clone(defaultState); render(); });
}

function renderBrief() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務簡報</p><h2>細胞邊界通行任務</h2>
    <div class="brief-scene transport-scene" data-briefing-scene-hook="${assets.briefingSceneHook}" data-ambient-background-hook="${assets.ambientBackgroundHook}">
      <div class="scene-copy"><div class="student-avatar-slot"><img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'"></div><h3>微觀研究站偵測到濃度異常</h3><p>有些粒子慢慢散開，有些細胞在不同溶液中改變外形。請先判斷追蹤物質、膜的條件與濃度差，再用證據解釋變化。</p></div>
    </div>
    <div class="mission-hud"><div><span>任務區</span><strong>微觀研究站</strong></div><div><span>重點</span><strong>擴散與滲透</strong></div><div><span>排序題</span><strong>拖曳 + 上下移</strong></div></div>
    <div class="actions"><button class="primary" id="briefNext">前往任務準備</button></div></div></div>`;
}
function renderScan() {
  return `<div class="mission-layout"><div class="panel"><p class="eyebrow">任務準備</p><h2>進關卡前的判斷線索</h2>
    <div class="story-panel highlight"><strong>貓頭鷹提醒</strong><p>每次先確認追蹤的是水還是其他物質，再看是否有半透膜，最後比較兩側濃度。</p></div>
    <div class="card-grid"><div class="concept-card"><strong>擴散</strong><p>粒子常由濃度較高處往較低處移動。</p></div><div class="concept-card"><strong>滲透</strong><p>水分通過半透膜時，要比較兩側溶質濃度。</p></div><div class="concept-card"><strong>細胞膜</strong><p>細胞膜調控物質進出，不是完全開放或封閉。</p></div><div class="concept-card"><strong>動物細胞</strong><p>沒有細胞壁，水分進出時外形較容易改變。</p></div><div class="concept-card"><strong>植物細胞</strong><p>有細胞壁支撐，高濃度時內部仍可能縮小。</p></div><div class="concept-card"><strong>資料證據</strong><p>質量增加常表示水分進入，減少常表示水分離開。</p></div></div>
    <div class="actions"><button class="primary" id="scanNext">開始檢核</button></div></div>${owlPanel(assets.owlPrep, "細胞通行任務提醒貓頭鷹")}</div>`;
}

function selectedClass(question, option) {
  const selected = state.answers[question.id] === option.id;
  if (state.checkedWrong[question.id] && selected && option.id === question.answer) return " selected correct";
  if (state.checkedWrong[question.id] && selected && option.id !== question.answer) return " selected wrong";
  return selected ? " selected" : "";
}
function renderQuestionImage(question) {
  if (!question.image) return "";
  return `<figure class="question-visual"><div class="question-image-wrap"><img src="${question.image}" alt="${question.imageAlt || "未標註觀察圖"}"></div><figcaption>${question.imageEvidence || "請依圖中的粒子分布、膜、樣本或細胞外形判讀；圖內不預先標示答案。"}</figcaption></figure>`;
}
function renderQuestionData(question) {
  if (!question.dataTable) return "";
  return `<div class="data-table-wrap"><table class="evidence-table"><caption>馬鈴薯樣本前後質量</caption><thead><tr><th scope="col">樣本</th><th scope="col">放入前</th><th scope="col">30 分鐘後</th><th scope="col">質量變化</th></tr></thead><tbody>${question.dataTable.map((row) => {
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
function renderSequenceQuestion() {
  const order = ensureSequence();
  return `<div class="question-card"><h3>判斷細胞膜兩側物質移動方向時，請拖曳排序卡，排出較合理的思考流程。</h3><p class="field-help">操作方式：拖曳卡片排序。手機可使用每張卡片的上移 / 下移按鈕。</p><div class="sortable-list">${order.map((id, index) => {
    const step = sequenceSteps.find((item) => item.id === id);
    return `<div class="sortable-item" draggable="true" data-sequence-id="${id}"><span class="drag-handle" aria-hidden="true"></span><strong>${step.label}</strong><div class="sequence-move-buttons"><button class="icon-action" data-move="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>上移</button><button class="icon-action" data-move="${id}" data-dir="1" ${index === order.length - 1 ? "disabled" : ""}>下移</button></div></div>`;
  }).join("")}</div>${state.hints.q07 ? "<div class=\"feedback warn\">先確認本題研究的對象與限制條件；方向判斷要建立在兩側環境比較之後。</div>" : ""}</div>`;
}
function renderCheckpoint1() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核一</p><h2>擴散、滲透與半透膜</h2><div class="question-grid">${sectionMap.checkpoint1.map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint1">檢查並前進</button></div></div></div>`; }
function renderCheckpoint2() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核二</p><h2>濃度方向與資料判讀</h2><div class="question-grid">${["q05", "q06"].map(renderChoiceQuestion).join("")}${renderSequenceQuestion()}${renderChoiceQuestion("q08")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint2">檢查並前進</button></div></div></div>`; }
function renderCheckpoint3() { return `<div class="wide-layout"><div class="panel"><p class="eyebrow">檢核三</p><h2>細胞環境模擬與迷思修正</h2><div class="cell-change-strip"><div class="change-card animal"><strong>紅血球</strong><span>沒有細胞壁</span></div><div class="change-card plant"><strong>植物細胞</strong><span>有細胞壁支撐</span></div><div class="change-card data"><strong>資料線索</strong><span>質量改變可作為水分進出的證據</span></div></div><div class="question-grid">${sectionMap.checkpoint3.map(renderChoiceQuestion).join("")}</div><div id="sectionMessage" class="status-line"></div><div class="actions"><button class="primary" id="checkSection" data-section="checkpoint3">檢查並前往回饋</button></div></div></div>`; }

function isCorrect(qid) {
  if (qid === "q07") return ensureSequence().join("|") === correctSequence.join("|");
  const question = questionById(qid);
  return state.answers[qid] === question?.answer;
}
function isAnswered(qid) {
  if (qid === "q07") return Boolean(state.interactions.q07) && ensureSequence().length === correctSequence.length;
  return Boolean(state.answers[qid]);
}
function allRequiredAnswered() {
  return [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3].every(isAnswered);
}
function markHint(qid) { if (!state.hints[qid]) state.hints[qid] = true; state.checkedWrong[qid] = true; }
function checkSection(section) {
  const unanswered = sectionMap[section].filter((qid) => !isAnswered(qid));
  if (unanswered.length) {
    const message = document.querySelector("#sectionMessage");
    if (message) message.innerHTML = `<span class="pill warn">請先完成本區 ${unanswered.length} 題必答內容；不要求全對。</span>`;
    return;
  }
  const wrong = sectionMap[section].filter((qid) => !isCorrect(qid));
  const newlyHinted = wrong.filter((qid) => !state.hints[qid]);
  if (newlyHinted.length) {
    newlyHinted.forEach(markHint); saveState(); render();
    const message = document.querySelector("#sectionMessage");
    if (message) message.innerHTML = `<span class="pill warn">已顯示 ${newlyHinted.length} 題概念提示；同一題只提示一次。可調整答案，也可保留本次作答再按一次前進。</span>`;
    return;
  }
  const next = section === "checkpoint1" ? "checkpoint2" : section === "checkpoint2" ? "checkpoint3" : "review";
  if (next === "review") state.result = calculateResult();
  unlock(next); saveState(); setScreen(next);
}
function moveSequence(id, dir) {
  const order = ensureSequence(); const index = order.indexOf(id); const next = index + dir;
  if (index < 0 || next < 0 || next >= order.length) return;
  [order[index], order[next]] = [order[next], order[index]]; state.answers.q07_sequence = order; state.interactions.q07 = true; saveState(); render();
}
function dropSequence(targetId) {
  if (!draggedSequenceId || draggedSequenceId === targetId) return;
  const order = ensureSequence().filter((id) => id !== draggedSequenceId);
  order.splice(order.indexOf(targetId), 0, draggedSequenceId); state.answers.q07_sequence = order; state.interactions.q07 = true; draggedSequenceId = null; saveState(); render();
}
function attachQuestionEvents() {
  document.querySelectorAll("[data-choice]").forEach((button) => button.addEventListener("click", () => {
    const question = questionById(button.dataset.choice);
    state.answers[question.id] = button.dataset.value;
    state.interactions[question.id] = true;
    if (button.dataset.value !== question.answer) markHint(question.id);
    saveState(); render();
  }));
  document.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => moveSequence(button.dataset.move, Number(button.dataset.dir))));
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
function questionConcept(qid) { return qid === "q07" ? "concentration_gradient" : questionById(qid)?.concept || "unknown"; }
function questionMisconception(qid) { return qid === "q07" ? "transport_decision_sequence" : questionById(qid)?.misconception || "unknown"; }
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
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
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
  const baseExp = Math.min(UNIT_EXP_CAP, completionExp + directExp + revisionExp + reflectionEval.question_exp + masteryExp);
  const retryCandidate = state.attempt_type === "retry" && previousAccuracy !== null && accuracy > previousAccuracy ? Math.min(60, Math.round((accuracy - previousAccuracy) * 100)) : 0;
  const retryExp = Math.min(retryCandidate, Math.max(0, UNIT_EXP_CAP - baseExp));
  const attemptTotalExp = Math.min(UNIT_EXP_CAP, baseExp + retryExp);
  const previousCredited = previousBestCredited();
  const unitCreditedExp = Math.min(UNIT_EXP_CAP, Math.max(previousCredited, attemptTotalExp));
  const stats = [sectionStat("擴散、滲透與半透膜", sectionMap.checkpoint1), sectionStat("濃度方向與資料判讀", sectionMap.checkpoint2), sectionStat("細胞環境變化", sectionMap.checkpoint3)];
  const misconceptions = [...new Set(qids.filter((qid) => !isCorrect(qid) || state.hints[qid]).map(questionMisconception))];
  const earned = completionExp ? ["cell_transport_entry"] : [];
  if (["q01", "q02", "q05"].filter(isCorrect).length / 3 >= .85) earned.push("diffusion_direction_judge");
  if (["q03", "q13"].filter(isCorrect).length / 2 >= .85) earned.push("osmosis_flow_mapper");
  if (["q04", "q06", "q14"].filter(isCorrect).length / 3 >= .85) earned.push("semipermeable_membrane_keeper");
  if (["q05", "q07", "q08"].filter(isCorrect).length / 3 >= .85) earned.push("concentration_data_reader");
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
    direction_by_water_amount_only: "建議再練習方向判斷：比較兩側溶質濃度，不要只看水量或容器大小。",
    diffusion_direction_by_solute_concentration: "建議先鎖定題目追蹤的物質本身，再比較它在膜兩側的濃度；若可通過，淨移動趨勢由該物質濃度較高處往較低處。",
    transport_decision_sequence: "建議再把每一步的判斷目的連起來：先確認追蹤對象，再確認會影響通過的膜條件，最後才用兩側濃度推論主要方向。",
    cell_membrane_all_or_none: "建議再理解細胞膜選擇性通透：不是完全開放，也不是完全封閉。",
    animal_cell_wall_confusion: "建議再比較動物與植物細胞：紅血球沒有細胞壁，外形較容易受水分進出影響。",
    plant_cell_burst_like_animal: "建議再確認植物細胞壁的支撐作用：在清水中通常較膨脹，但不容易像動物細胞那樣破裂。",
    plasmolysis_unknown: "建議再閱讀植物細胞在高濃度環境的變化：細胞內部縮小，細胞壁仍在。",
    data_not_evidence: "建議再練習資料判讀：質量增加常表示水分進入，減少常表示水分離開。"
  };
  return map[tag] || "建議再把追蹤物質、膜的條件、濃度差與細胞變化連在一起。";
}
function renderReview() {
  const result = calculateResult(); const stable = result.section_stats.filter((item) => item.correct / item.total >= .85);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">概念回饋</p><h2>任務掃描結果</h2><div class="score-grid"><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div><div class="score-box"><span>提示使用</span><strong>${result.hint_used}</strong></div><div class="score-box"><span>提示後修正</span><strong>${result.corrected_after_hint}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>目前較穩定</strong>${stable.length ? stable.map((item) => `<p>${item.title}</p>`).join("") : "<p>還需要再整理主要概念。</p>"}</div><div class="story-panel"><strong>建議再閱讀理解</strong>${result.misconceptions.length ? result.misconceptions.map((tag) => `<p>${misconceptionText(tag)}</p>`).join("") : "<p>目前沒有明顯迷思標籤。</p>"}</div><div class="story-panel"><strong>課堂提問方向</strong><p>擴散與滲透的差異、半透膜、水分方向、細胞膜選擇性通透、紅血球與植物細胞變化、質量資料判讀。</p></div></div><div class="actions"><button class="primary" id="reviewNext">填寫任務回報</button></div></div></div>`;
}
function renderReflection() {
  const reflection = state.answers.reflection || {};
  return `<div class="mission-layout"><div class="panel"><p class="eyebrow">任務回報</p><h2>留下你的課堂線索</h2><div class="story-panel highlight"><strong>回報 EXP 規則</strong><p>空白可提交但無 EXP；具體且與擴散、滲透、半透膜、濃度差或細胞變化相關的問題，可取得回報 EXP。</p></div><div class="form-grid"><label>這次任務中，我最能掌握的一項物質進出細胞概念是什麼？<textarea id="confidentConcept">${reflection.confident_concept || ""}</textarea></label><label>我還不確定擴散、滲透、半透膜、濃度差或細胞變化中的哪一部分？<textarea id="uncertainConcept">${reflection.uncertain_concept || ""}</textarea></label><label>選一個希望老師課堂解釋的方向，並用自己的話補充<span class="field-help">方向詞可以參考，但不要直接複製。</span><textarea id="studentQuestion">${reflection.student_question || ""}</textarea></label><label>信心分數<span class="field-help">5 分代表我能自己說明本單元重點概念。</span><select id="confidenceScore">${[1, 2, 3, 4, 5].map((num) => `<option value="${num}" ${String(reflection.confidence_score || "3") === String(num) ? "selected" : ""}>${num} 分</option>`).join("")}</select></label></div><div class="actions"><button class="primary" id="submitMission">提交任務</button></div></div>${owlPanel(assets.owlResult, "任務回報貓頭鷹")}</div>`;
}
function buildAttempt() {
  const now = new Date().toISOString();
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
  return { attempt_id: state.attempt_session_id, timestamp: now, student: state.student, mission, attempt_type: state.attempt_type, attempt_type_candidate: state.attempt_type, attempt_no: Number(state.remote_completed_attempts || 0) + 1, attempt_session_id: state.attempt_session_id, started_from_login: true, previous_attempt_id: previousAttemptId(), retry_validation_status: state.attempt_type === "retry" ? "pending_backend_validation" : "not_retry", started_at: state.started_at, submitted_at: state.submitted_at || now, completion_status: "complete", required_answer_count: qids.length, answered_required_count: qids.filter(isAnswered).length, backend_status: state.backend_status, ...state.result, confidence_score: state.answers.reflection.confidence_score, confident_concept: state.answers.reflection.confident_concept, uncertain_concept: state.answers.reflection.uncertain_concept, student_question: state.answers.reflection.student_question, raw_answers: state.answers, payload_version: VERSION };
}
function buildBackendPayload(attempt) {
  const qids = [...sectionMap.checkpoint1, ...sectionMap.checkpoint2, ...sectionMap.checkpoint3];
  return {
    attempt_id: attempt.attempt_id, student_id: attempt.student.student_id, student_name: attempt.student.student_name, class_name: attempt.student.class_name, seat_no: attempt.student.seat_no,
    unit_id: mission.unit_id, unit_title: mission.unit_title, mission_title: mission.mission_title, attempt_type: attempt.attempt_type, attempt_type_candidate: attempt.attempt_type_candidate, attempt_no_candidate: attempt.attempt_no, attempt_session_id: attempt.attempt_session_id, started_from_login: attempt.started_from_login, previous_attempt_id: attempt.previous_attempt_id, retry_validation_status: attempt.retry_validation_status, completion_status: attempt.completion_status, required_answer_count: attempt.required_answer_count, answered_required_count: attempt.answered_required_count, all_required_answered: attempt.all_required_answered, started_at: attempt.started_at, submitted_at: attempt.submitted_at,
    total_questions: attempt.total, correct: attempt.correct, accuracy: attempt.accuracy, hints_used: attempt.hint_used, correct_without_hint: attempt.correct_without_hint, corrected_after_hint: attempt.corrected_after_hint,
    completion_exp: attempt.completion_exp, concept_exp: attempt.concept_exp, revision_exp: attempt.revision_exp, question_exp: attempt.question_exp, mastery_exp: attempt.mastery_exp, retry_exp: attempt.retry_exp,
    attempt_total_exp: attempt.attempt_total_exp, unit_exp_cap: attempt.unit_exp_cap, unit_credited_exp: attempt.unit_credited_exp, credited_delta: attempt.credited_delta, no_hint_perfect: attempt.no_hint_perfect,
    confidence_score: attempt.confidence_score, reflection_quality: attempt.reflection_quality, reflection_quality_candidate: attempt.reflection_quality_candidate, reflection_exp_reason: attempt.reflection_exp_reason, reflection_review_status: attempt.reflection_review_status, reflection_original_text: attempt.reflection_original_text, reflection_normalized_text: attempt.reflection_normalized_text, reflection_similarity_score: attempt.reflection_similarity_score, reflection_similarity_source: attempt.reflection_similarity_source, reflection_copied_direction_flag: attempt.reflection_copied_direction_flag, reflection_irrelevant_flag: attempt.reflection_irrelevant_flag, reflection_low_effort_flag: attempt.reflection_low_effort_flag, reflection_examples_checked: attempt.reflection_examples_checked, reflection_frontend_only: true,
    teacher_attention_needed: attempt.teacher_attention_needed, student_question: attempt.student_question,
    diffusion_direction_score: scoreForConcept(attempt, "diffusion"), osmosis_flow_score: scoreForConcept(attempt, "osmosis"), semipermeable_membrane_score: scoreForConcept(attempt, "semipermeable_membrane", "cell_membrane_selectivity"), concentration_data_score: scoreForConcept(attempt, "concentration_gradient", "evidence_based_prediction"), cell_change_explanation_score: scoreForConcept(attempt, "animal_cell_concentration_change", "plant_cell_concentration_change"), diffusion_osmosis_compare_score: scoreForConcept(attempt, "diffusion", "osmosis"),
    misconceptions_json: JSON.stringify(attempt.misconceptions), raw_answers_json: JSON.stringify(attempt.raw_answers), badges_json: JSON.stringify(attempt.badges), existing_badges_json: JSON.stringify(cumulativeBadgeIds()), cumulative_badges_candidate_json: JSON.stringify(attempt.cumulative_badges_candidate), badge_eval_json: JSON.stringify(badges.map((badge) => ({ badge_id: badge.id, earned_candidate: attempt.badges.includes(badge.id), badge_image_path: badge.badge_image_path }))),
    question_logs: qids.map((qid) => ({ question_id: `${mission.unit_id}_${qid}`, concept_id: questionConcept(qid), checkpoint_id: qid === "q07" ? "checkpoint2" : questionById(qid)?.section, is_correct: isCorrect(qid), hint_used: Boolean(state.hints[qid]), attempt_answer: JSON.stringify(qid === "q07" ? state.answers.q07_sequence : state.answers[qid]), correct_answer: qid === "q07" ? correctSequence.join(" > ") : questionById(qid)?.answer, exp_type: !isCorrect(qid) ? "none" : state.hints[qid] ? "revision" : "concept", exp_awarded: !isCorrect(qid) ? 0 : Math.round((state.hints[qid] ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / attempt.total) }))
  };
}
async function submitAttemptToBackend(attempt) {
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
    try { const response = await submitAttemptToBackend(attempt); state.backend_status = "submitted"; if (response.verified_attempt) state.result = { ...state.result, ...response.verified_attempt }; applyBackendProgress(response.student_progress || response.progress || {}); attempt = { ...attempt, ...state.result, backend_status: state.backend_status, backend_attempt_id: response.attempt_id || attempt.attempt_id }; }
    catch { state.backend_status = "pending_local"; attempt = { ...attempt, backend_status: state.backend_status }; savePending(buildBackendPayload(attempt)); }
    saveAttempt(attempt); state.remote_completed_attempts = Number(state.remote_completed_attempts || 0) + 1; unlock("result", "achievements"); saveState(); setScreen("result");
  });
}
function renderResult() {
  const result = state.result || calculateResult();
  const backend = state.backend_status === "pending_local" ? "<div class=\"feedback warn\">後台暫時無法寫入，本次提交已保留在本機待補送佇列。</div>" : "<div class=\"feedback good\">本次任務已提交，作答結果已鎖定。</div>";
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務結算</p><h2>提交後本次作答已鎖定</h2>${state.lockNotice ? `<div class="feedback warn">${state.lockNotice}</div>` : ""}${backend}<div class="score-grid"><div class="score-box"><span>本次取得</span><strong>${Math.min(result.attempt_total_exp, UNIT_EXP_CAP)} EXP</strong></div><div class="score-box"><span>本單元認列</span><strong>${result.unit_credited_exp} EXP</strong></div><div class="score-box"><span>答對</span><strong>${result.correct}/${result.total}</strong></div></div><div class="card-grid"><div class="story-panel"><strong>EXP 明細</strong><p>完成 ${result.completion_exp}｜直接答對 ${result.concept_exp}｜提示後修正 ${result.revision_exp}｜回報 ${result.question_exp}｜精熟 ${result.mastery_exp}｜再挑戰 ${result.retry_exp}</p></div><div class="story-panel"><strong>本次與認列差異</strong><p>本次取得是這次挑戰的原始表現；本單元認列會保留最高表現並受 500 EXP 上限限制。</p></div><div class="story-panel"><strong>回報品質</strong><p>${result.reflection_quality}：${result.reflection_exp_reason}</p><p class="muted">前台候選 ${result.question_exp_candidate || 0} EXP；正式回報 EXP 以後台重算為準。</p></div></div><div class="actions"><button class="primary" id="resultAchievements">查看成就</button><button class="secondary" id="resultRules">查看規則</button></div></div></div>`;
}
function renderAchievements() {
  const currentBadges = state.submitted_at ? (state.result || calculateResult()).badges : [];
  const litIds = cumulativeBadgeIds(currentBadges);
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">成就亮燈</p><h2>細胞通行徽章牆</h2><div class="score-grid"><div class="score-box"><span>累積徽章</span><strong>${litIds.length}</strong></div><div class="score-box"><span>累積 EXP</span><strong>${state.cumulative_total_exp || 0}</strong></div><div class="score-box"><span>已完成單元</span><strong>${state.completed_unit_count || 0}</strong></div></div><div class="badge-grid">${badges.map((badge) => { const lit = litIds.includes(badge.id); const gold = badge.id === "cell_transport_flawless"; return `<div class="badge-card ${lit ? "lit" : ""} ${gold ? "gold" : ""}" data-badge-id="${badge.id}" data-badge-image-path="${badge.badge_image_path}"><img class="badge-image" src="${badge.badge_image_path}" alt="${badge.name}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="badge-icon" hidden>${lit ? "亮" : "徽"}</div><strong>${badge.name}</strong><p class="muted">${badge.condition}</p></div>`; }).join("")}</div><p class="muted">亮燈狀態合併後台 StudentProgress 與本機完整 Attempts；同一徽章只計一次。</p><div class="actions"><button class="primary" id="achieveResult">回到${state.submitted_at ? "結算" : "任務"}</button></div></div></div>`;
}
function renderRules() {
  return `<div class="wide-layout"><div class="panel"><p class="eyebrow">任務規則</p><h2>EXP、提示與再挑戰</h2><div class="card-grid"><div class="story-panel"><strong>單元上限</strong><p>本單元最高認列 500 EXP。一次零提示全對是最高路徑。</p></div><div class="story-panel"><strong>完成條件</strong><p>回答完所有必答題即可提交，不必先全對；需要調整的概念會保留提示與回饋。</p></div><div class="story-panel"><strong>提示後修正</strong><p>每題第一次錯選會出現一次提示；提示後修正仍有 EXP，但低於直接答對。</p></div><div class="story-panel"><strong>再挑戰</strong><p>提交後本次作答鎖定。若要再挑戰，請重新登入並從頭完成整份任務。</p></div></div><div class="actions"><button class="primary" id="rulesBack">回到任務</button></div></div></div>`;
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
}
function render() {
  if (state.submitted_at && LOCKED_SCREENS_AFTER_SUBMIT.has(state.screen)) state.screen = "result";
  renderNav(); renderStudentMini();
  const views = { login: renderLogin, brief: renderBrief, scan: renderScan, checkpoint1: renderCheckpoint1, checkpoint2: renderCheckpoint2, checkpoint3: renderCheckpoint3, review: renderReview, reflection: renderReflection, result: renderResult, achievements: renderAchievements, rules: renderRules };
  screen.innerHTML = views[state.screen](); attachEvents();
}

render();
