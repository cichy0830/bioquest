const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260904-prokaryotes-protists-fungi-q13-mobile-v1";
const QUESTION_VERSION = "20260819-prokaryotes-protists-fungi-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_prokaryotes_protists_fungi_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_prokaryotes_protists_fungi_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "checkpoint5", "checkpoint6", "review", "reflection"]);

const mission = {
  "unit_id": "prokaryotes_protists_fungi",
  "unit_title": "原核、原生生物及真菌界",
  "mission_title": "微小生命分類偵查",
  "mission_area": "微生物觀察站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  prokaryotes_protists_fungi_q01: 15,
  prokaryotes_protists_fungi_q02: 18,
  prokaryotes_protists_fungi_q03: 15,
  prokaryotes_protists_fungi_q04: 14,
  prokaryotes_protists_fungi_q05: 15,
  prokaryotes_protists_fungi_q06: 17,
  prokaryotes_protists_fungi_q07: 14,
  prokaryotes_protists_fungi_q08: 18,
  prokaryotes_protists_fungi_q09: 14,
  prokaryotes_protists_fungi_q10: 18,
  prokaryotes_protists_fungi_q11: 14,
  prokaryotes_protists_fungi_q12: 18,
  prokaryotes_protists_fungi_q13: 17,
  prokaryotes_protists_fungi_q14: 13
};
const revisionExpWeights = {
  prokaryotes_protists_fungi_q01: 12,
  prokaryotes_protists_fungi_q02: 15,
  prokaryotes_protists_fungi_q03: 12,
  prokaryotes_protists_fungi_q04: 11,
  prokaryotes_protists_fungi_q05: 12,
  prokaryotes_protists_fungi_q06: 14,
  prokaryotes_protists_fungi_q07: 11,
  prokaryotes_protists_fungi_q08: 15,
  prokaryotes_protists_fungi_q09: 11,
  prokaryotes_protists_fungi_q10: 15,
  prokaryotes_protists_fungi_q11: 11,
  prokaryotes_protists_fungi_q12: 15,
  prokaryotes_protists_fungi_q13: 14,
  prokaryotes_protists_fungi_q14: 12
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/prokaryotes_protists_fungi/badge-prokaryotes_protists_fungi-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: ["原核生物", "細菌", "藍菌", "明顯細胞核", "原生生物", "草履蟲", "真菌", "酵母菌", "黴菌", "蕈類", "香菇", "分解吸收", "光合作用", "微生物利害", "情境判斷", "分類不能只看大小", "U39", "U40", "U41"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["藍菌與藻類差異", "真菌為何不是植物", "微生物利害情境", "原核生物", "原生生物", "真菌"]
};

const formalBadgeCatalog = [
  ["prokaryotes_protists_fungi_entry", "微小生命入門", "完成 q01-q14 並提交 q15 回報。"],
  ["prokaryote_nucleus_identifier", "原核特徵辨識者", "q01 正確。"],
  ["microbe_example_group_mapper", "微生物例子配對者", "q02 answer_map 六項全對。"],
  ["fungi_absorptive_nutrition_reader", "真菌分解吸收判讀者", "q03 正確。"],
  ["size_only_misconception_corrector", "大小迷思修正者", "q04 與 q09 正確。"],
  ["microbe_context_reasoner", "微生物情境判讀者", "q05 正確。"],
  ["protist_diversity_observer", "原生多樣性觀察者", "q06 與 q13 正確。"],
  ["cyanobacteria_boundary_keeper", "藍菌邊界守門員", "q07 正確。"],
  ["microbe_group_classifier", "原核原生真菌分類員", "q08 answer_map 五項全對。"],
  ["unit_boundary_microbe_mapper", "U39-U41 邊界配對者", "q10 answer_map 三項全對。"],
  ["fungi_not_plant_master", "真菌不是植物守門員", "q03、q11、q14 全對。"],
  ["microbe_context_sorter", "微生物情境分類師", "q12 answer_map 三項全對。"],
  ["prokaryotes_protists_fungi_flawless", "零提示全對：微小生命分類", "q01-q14 第一次提交全對且未使用提示。"],
  ["prokaryotes_protists_fungi_reflection_reporter", "高品質回報：微小生命分類疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_prokaryotes_protists_fungi", "再挑戰進步：微小生命分類", "合法重新登入再挑戰且 verified 後比前次進步。"]
];
const formalBadgeIds = formalBadgeCatalog.map(([id]) => id);
const badges = formalBadgeCatalog.map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const microbeGroupChoices = [
  { id: "prokaryotes", text: "原核生物" },
  { id: "protists", text: "原生生物" },
  { id: "fungi", text: "真菌" }
];
const unitBoundaryChoices = [
  { id: "u39_dichotomous_key", text: "U39 檢索表的認識與應用" },
  { id: "u40_prokaryotes_protists_fungi", text: "U40 原核、原生生物及真菌界" },
  { id: "u41_plant_kingdom", text: "U41 植物界" }
];
const microbeContextChoices = [
  { id: "possible_benefit", text: "可能有助益" },
  { id: "possible_problem", text: "可能造成問題" },
  { id: "need_more_context", text: "需要更多資料" }
];

const questions = [
  { id: "prokaryotes_protists_fungi_q01", section: "checkpoint1", concept: "prokaryote_no_clear_nucleus", skill_tag: "prokaryote_no_clear_nucleus", type: "choice", answer: "no_clear_nucleus", prompt: "哪個敘述最符合原核生物的基本特徵？", hint: "回想原核和動植物細胞最大的細胞構造差異。", misconception: "prokaryote_nucleus_confusion", options: [ { id: "no_clear_nucleus", text: "沒有明顯細胞核" }, { id: "has_flowers", text: "會開花" }, { id: "has_fruit_seed", text: "有果實與種子" }, { id: "all_multicellular", text: "一定是多細胞" } ] },
  { id: "prokaryotes_protists_fungi_q02", section: "checkpoint1", concept: "examples_by_group", skill_tag: "examples_by_group", type: "mapping", backend_type: "mapping", answer: { bacteria: "prokaryotes", cyanobacteria: "prokaryotes", paramecium: "protists", yeast: "fungi", mold: "fungi", mushroom: "fungi" }, prompt: "將常見例子放入合適類群。", hint: "先找細菌與藍菌，再找酵母菌、黴菌、蕈類；草履蟲不是細菌也不是真菌。", misconception: "all_microbes_are_bacteria", items: [ { id: "bacteria", label: "細菌" }, { id: "cyanobacteria", label: "藍菌" }, { id: "paramecium", label: "草履蟲" }, { id: "yeast", label: "酵母菌" }, { id: "mold", label: "黴菌" }, { id: "mushroom", label: "蕈類" } ], choices: microbeGroupChoices },
  { id: "prokaryotes_protists_fungi_q03", section: "checkpoint2", concept: "fungi_absorptive_nutrition", skill_tag: "fungi_absorptive_nutrition", type: "choice", answer: "fungi_absorb", prompt: "下列哪個配對最能說明真菌取得養分的方式？", hint: "不要只看真菌會不會固定在一處，想想它如何取得養分。", misconception: "fungi_are_plants", options: [ { id: "fungi_absorb", text: "真菌常分解外界有機物並吸收養分" }, { id: "fungi_photosynthesis", text: "真菌主要靠光合作用製造養分" }, { id: "fungi_roots", text: "真菌用真正的根吸收土壤中的水分" }, { id: "fungi_ingest", text: "真菌像動物一樣吞食大塊食物" } ] },
  { id: "prokaryotes_protists_fungi_q04", section: "checkpoint1", concept: "classification_by_size_only", skill_tag: "classification_by_size_only", type: "choice", answer: "need_more_features", prompt: "看到一張顯微觀察卡顯示某生物很小，可以直接判定它一定是細菌嗎？", hint: "大小是線索之一，但分類還需要其他可觀察或可查證資料。", misconception: "classification_by_size_only", options: [ { id: "need_more_features", text: "需要更多構造、生活方式或例子資料" }, { id: "all_tiny_bacteria", text: "只要很小就是細菌" }, { id: "all_tiny_fungi", text: "只要很小就是真菌" }, { id: "visible_not_microbe", text: "只要看得到就不是微生物" } ] },
  { id: "prokaryotes_protists_fungi_q05", section: "checkpoint3", concept: "microbes_benefit_harm_context", skill_tag: "microbes_benefit_harm_context", type: "choice", answer: "context_matters", prompt: "情境卡顯示：酵母菌讓麵團膨脹；某些細菌會使食物腐敗。哪個判斷較合理？", hint: "同一大類生物在不同情境中，可能產生不同影響。", misconception: "all_bacteria_harmful", options: [ { id: "context_matters", text: "微生物影響需看情境" }, { id: "all_harmful", text: "所有微生物都有害" }, { id: "all_helpful", text: "所有微生物都有益" }, { id: "only_fungi_help", text: "只有真菌可能有益" } ] },
  { id: "prokaryotes_protists_fungi_q06", section: "checkpoint4", concept: "protist_diversity", skill_tag: "protist_diversity", type: "choice", answer: "protist_candidate", prompt: "觀察卡列出：單細胞、生活在水中、會移動，資料顯示有明顯細胞核構造。較適合往哪一類方向判讀？", hint: "先看它是微小單細胞，還是大型多細胞動物或植物。", misconception: "protist_as_animal_or_plant", options: [ { id: "protist_candidate", text: "原生生物方向" }, { id: "plant_group", text: "植物界方向" }, { id: "fungus_group", text: "真菌方向" }, { id: "mammal_group", text: "哺乳動物方向" } ] },
  { id: "prokaryotes_protists_fungi_q07", section: "checkpoint5", concept: "algae_cyanobacteria_plant_boundary", skill_tag: "algae_cyanobacteria_plant_boundary", type: "choice", answer: "not_necessarily_plant", prompt: "藍菌能行光合作用，所以它一定是植物嗎？", hint: "光合作用是重要線索，但還要看細胞構造與類群定義。", misconception: "algae_cyanobacteria_plant_confusion", options: [ { id: "not_necessarily_plant", text: "不一定，藍菌屬原核生物" }, { id: "all_photosynthesis_plants", text: "能光合作用就是植物" }, { id: "all_algae_bacteria", text: "所有藻類都是細菌" }, { id: "all_green_fungi", text: "綠色微生物都是真菌" } ] },
  { id: "prokaryotes_protists_fungi_q08", section: "checkpoint1", concept: "examples_by_group", skill_tag: "examples_by_group", type: "mapping", backend_type: "mapping", answer: { lactic_acid_bacteria: "prokaryotes", cyanobacteria: "prokaryotes", paramecium: "protists", yeast: "fungi", mushroom: "fungi" }, prompt: "將例子配到原核生物、原生生物或真菌。", hint: "先辨識細菌與藍菌，再分辨草履蟲、酵母菌和香菇。", misconception: "all_microbes_are_bacteria", items: [ { id: "lactic_acid_bacteria", label: "乳酸菌" }, { id: "cyanobacteria", label: "藍菌" }, { id: "paramecium", label: "草履蟲" }, { id: "yeast", label: "酵母菌" }, { id: "mushroom", label: "香菇" } ], choices: microbeGroupChoices },
  { id: "prokaryotes_protists_fungi_q09", section: "checkpoint1", concept: "classification_by_size_only", skill_tag: "classification_by_size_only", type: "choice", answer: "nucleus_nutrition_examples", prompt: "哪組線索較能協助分辨原核、原生與真菌？", hint: "好的分類線索要能讓不同人依相同資料判斷。", misconception: "classification_by_size_only", options: [ { id: "nucleus_nutrition_examples", text: "細胞核特徵、養分方式與常見例子" }, { id: "small_big_only", text: "只看大小" }, { id: "good_bad_only", text: "只看有益或有害" }, { id: "cute_scary_only", text: "只看主觀感受" } ] },
  { id: "prokaryotes_protists_fungi_q10", section: "checkpoint6", concept: "u39_u40_u41_boundary", skill_tag: "u39_u40_u41_boundary", type: "mapping", backend_type: "mapping", answer: { branch_key_task: "u39_dichotomous_key", microbe_group_task: "u40_prokaryotes_protists_fungi", plant_group_task: "u41_plant_kingdom" }, prompt: "將任務配到合適單元。", hint: "先判斷任務是在走檢索表、辨識微生物類群，還是分植物類群。", misconception: "u39_u40_u41_boundary_confusion", items: [ { id: "branch_key_task", label: "依二分檢索表逐步辨識" }, { id: "microbe_group_task", label: "辨識原核、原生與真菌類群" }, { id: "plant_group_task", label: "分辨植物界內部類群" } ], choices: unitBoundaryChoices },
  { id: "prokaryotes_protists_fungi_q11", section: "checkpoint2", concept: "fungi_absorptive_nutrition", skill_tag: "fungi_absorptive_nutrition", type: "choice", answer: "fungus_decomposer", prompt: "食物表面長出黴菌，較合理的敘述是？", hint: "注意「黴菌」這個例子屬於哪一類，以及它如何取得養分。", misconception: "fungi_are_plants", options: [ { id: "fungus_decomposer", text: "黴菌屬真菌，可分解並吸收養分" }, { id: "plant_seedling", text: "黴菌是植物幼苗" }, { id: "all_bacteria", text: "黴菌一定是細菌" }, { id: "photosynthesis_main", text: "黴菌主要靠光合作用製造養分" } ] },
  { id: "prokaryotes_protists_fungi_q12", section: "checkpoint3", concept: "microbes_benefit_harm_context", skill_tag: "microbes_benefit_harm_context", type: "mapping", backend_type: "card_sort", answer: { bread_yeast_rising: "possible_benefit", spoiled_food_bacteria: "possible_problem", unknown_water_sample: "need_more_context" }, prompt: "將微生物情境分成「可能有助益」「可能造成問題」「需要更多資料」。", hint: "先讀情境描述，不要先把整個類群貼上好或壞。", misconception: "all_bacteria_beneficial", items: [ { id: "bread_yeast_rising", label: "麵團加入酵母菌後逐漸膨脹" }, { id: "spoiled_food_bacteria", label: "食物放太久後出現酸敗味，資料指出有細菌大量繁殖" }, { id: "unknown_water_sample", label: "水樣中發現微小生物，但沒有更多生活方式或影響資料" } ], choices: microbeContextChoices },
  { id: "prokaryotes_protists_fungi_q13", section: "checkpoint4", concept: "protist_diversity", skill_tag: "protist_diversity", type: "choice", answer: "varied_features", prompt: "資料表列出三種微小生物的生活環境、運動方式與養分線索。哪個判斷最能支持「原生生物具多樣性」？", hint: "讀表時先看欄位：運動、生活環境與養分線索是否呈現差異。", misconception: "protist_diversity_overgeneralized", options: [ { id: "varied_features", text: "資料呈現不同運動方式與養分線索" }, { id: "same_size", text: "大小相近就代表同一類" }, { id: "same_color", text: "顏色相近就代表同一類" }, { id: "unknown_name", text: "名字未知所以不能比較" } ] },
  { id: "prokaryotes_protists_fungi_q14", section: "checkpoint2", concept: "fungi_absorptive_nutrition", skill_tag: "fungi_absorptive_nutrition", type: "choice", answer: "nutrition_and_group", prompt: "為什麼「香菇不會跑，所以它是植物」這個判斷不夠好？", hint: "分類不能只看會不會移動，還要看取得養分方式與類群特徵。", misconception: "fungi_are_plants", options: [ { id: "nutrition_and_group", text: "能否移動不是唯一判準，真菌取得養分方式不同" }, { id: "no_movement_plant", text: "不會動就是植物" }, { id: "edible_plant", text: "能吃就是植物" }, { id: "brown_not_life", text: "褐色就不是生物" } ] }
];
const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["prokaryotes_protists_fungi_q01", "prokaryotes_protists_fungi_q02", "prokaryotes_protists_fungi_q04", "prokaryotes_protists_fungi_q08", "prokaryotes_protists_fungi_q09"],
  checkpoint2: ["prokaryotes_protists_fungi_q03", "prokaryotes_protists_fungi_q11", "prokaryotes_protists_fungi_q14"],
  checkpoint3: ["prokaryotes_protists_fungi_q05", "prokaryotes_protists_fungi_q12"],
  checkpoint4: ["prokaryotes_protists_fungi_q06", "prokaryotes_protists_fungi_q13"],
  checkpoint5: ["prokaryotes_protists_fungi_q07"],
  checkpoint6: ["prokaryotes_protists_fungi_q10"]
};
const requiredQuestionIds = questions.map((question) => question.id);

const titleLevels = [
  { id: "trainee_investigator", need: 0, title: "見習調查員" },
  { id: "life_observer", need: 500, title: "生命觀察員" },
  { id: "ecology_recorder", need: 1500, title: "生態記錄員" },
  { id: "concept_solver", need: 3000, title: "概念解謎者" },
  { id: "micro_explorer", need: 5200, title: "微觀探索者" },
  { id: "systems_investigator", need: 8000, title: "系統調查員" },
  { id: "life_researcher", need: 11800, title: "生命研究員" },
  { id: "bioquest_expert", need: 16700, title: "BioQuest 專家" },
  { id: "bioquest_guardian", need: 23400, title: "生命祕境守護者" }
];

function createEmptyState() {
  return {
    screen: "login",
    student: null,
    attempt_id: "",
    attempt_session_token: "",
    attempt_session_id: "",
    previous_attempt_id: "",
    question_version: QUESTION_VERSION,
    verification_mode: "local_guest",
    optionOrders: {},
    answers: {},
    hints: {},
    hintEventStatus: {},
    submitted: false,
    submitLockedAt: "",
    completedScreens: ["login"],
    reflection: { confident: "", question: "", confidence: "3" },
    result: null,
    notice: ""
  };
}

let state = loadState();

function loadState() {
  if (typeof localStorage === "undefined") return createEmptyState();
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
    return parsed && parsed.question_version ? { ...createEmptyState(), ...parsed, question_version: QUESTION_VERSION } : createEmptyState();
  } catch (error) {
    return createEmptyState();
  }
}

function saveState() {
  if (typeof localStorage !== "undefined") localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadAttempts() {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(attemptsKey) || "[]");
  } catch (error) {
    return [];
  }
}

function saveAttemptRecord(attempt) {
  if (typeof localStorage === "undefined") return;
  const attempts = loadAttempts().filter((item) => item.attempt_id !== attempt.attempt_id);
  attempts.push(attempt);
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));
}

function loadVerifiedSnapshot() {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(verifiedSnapshotKey) || "null");
  } catch (error) {
    return null;
  }
}

function saveVerifiedSnapshot(student = state.student) {
  if (typeof localStorage === "undefined" || !student || student.is_guest) return;
  const progress = student.progress || {};
  localStorage.setItem(verifiedSnapshotKey, JSON.stringify({
    student_id: student.student_id,
    class_name: student.class_name,
    seat_no: student.seat_no,
    student_name: student.student_name,
    profile_gender: student.profile_gender || "male",
    total_exp: Number(progress.total_exp ?? student.total_exp ?? 0),
    current_title_id: progress.current_title_id || student.current_title_id || "",
    current_title: progress.current_title || student.current_title || "",
    title_avatar_path: progress.title_avatar_path || student.title_avatar_path || "",
    progress
  }));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function cacheAsset(src) {
  if (!src) return "";
  return `${src}${src.includes("?") ? "&" : "?"}v=${VERSION}`;
}

function renderScenePicture(prefix, alt) {
  const main = assets[`${prefix}Scene`];
  const src390 = assets[`${prefix}Scene390`];
  const src960 = assets[`${prefix}Scene960`];
  const src1440 = assets[`${prefix}Scene1440`];
  if (!main) {
    return `<div class="u40-scene-neutral" role="img" aria-label="${escapeHtml(alt || "原核、原生生物及真菌界中性任務場景")}">
      <span class="u40-scene-strand"></span>
      <span class="u40-scene-card">觀察資料</span>
      <span class="u40-scene-card">細胞構造</span>
      <span class="u40-scene-card">生活方式</span>
      <span class="u40-scene-card">情境判讀</span>
    </div>`;
  }
  return `<picture class="u40-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u40-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u40-page-scene u40-${prefix}-scene ${className}" data-u40-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "原核、原生生物及真菌界中性任務場景")}
    ${azhe ? `<img class="u40-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u40-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl && owlSrc ? `<img class="u40-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u40-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
  </figure>`;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sameSet(a, b) {
  const aa = [...(a || [])].sort();
  const bb = [...(b || [])].sort();
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

function sameMapping(value, answer) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.keys(answer).every((key) => value[key] === answer[key]));
}

function questionAnswered(question) {
  const value = answerValue(question.id);
  if (question.type === "choice" || question.type === "image_select") return typeof value === "string" && value.length > 0;
  if (question.type === "mapping") return Boolean(value && Object.keys(question.answer).every((key) => value[key]));
  if (question.type === "sequence") return Array.isArray(value) && value.length === question.answer.length;
  if (isBranchQuestion(question)) return Boolean(normalizeBranchAnswer(question, value));
  if (question.type === "set") return Array.isArray(value) && value.length > 0;
  return false;
}

function answerValue(qid) {
  const question = questionMap[qid];
  if (question.type === "sequence") return state.answers[`${qid}_sequence`] || [];
  return state.answers[qid];
}

function isCorrect(qid) {
  const question = questionMap[qid];
  const value = answerValue(qid);
  if (question.type === "choice" || question.type === "image_select") return value === question.answer;
  if (question.type === "mapping") return sameMapping(value, question.answer);
  if (question.type === "sequence") return Array.isArray(value) && value.length === question.answer.length && value.every((id, index) => id === question.answer[index]);
  if (isBranchQuestion(question)) return sameBranchAnswer(normalizeBranchAnswer(question, value), question.answer);
  if (question.type === "set") return sameSet(value, question.answer);
  return false;
}

function stableShuffle(items, seed) {
  const copy = [...items];
  let value = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) || 37;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280;
    const swap = value % (index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function sameOrder(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((id, index) => id === right[index]);
}

function avoidCanonicalSequenceCollision(question, order) {
  if (question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function avoidBranchChoiceCollision(question, order) {
  if (!isBranchQuestion(question)) return order;
  const canonical = (question.options || []).map((option) => option.id);
  if (!sameOrder(order, canonical)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function isBranchQuestion(question) {
  return ["branch_choice", "branch_path", "branch_next_node"].includes(question?.type);
}

function normalizeBranchAnswer(question, value) {
  if (!question || !isBranchQuestion(question) || value == null || value === "") return null;
  if (question.type === "branch_choice") {
    const choiceId = typeof value === "string" ? value : value.choice_id;
    const option = (question.options || []).find((item) => item.id === choiceId);
    return option ? { node_id: option.node_id || "start", choice_id: option.id, next_node_id: option.next_node_id || "" } : null;
  }
  if (question.type === "branch_path") {
    const pathId = typeof value === "string" ? value : value.path_id;
    const nodePath = Array.isArray(value?.node_path) ? value.node_path : branchPathMap[pathId];
    return pathId && nodePath ? { path_id: pathId, node_path: [...nodePath] } : null;
  }
  if (question.type === "branch_next_node") {
    const nextNode = typeof value === "string" ? value : value.next_node_id;
    return nextNode ? { current_path: ["start", "has_wings"], next_node_id: nextNode } : null;
  }
  return null;
}

function sameBranchAnswer(value, answer) {
  if (!value || !answer) return false;
  if (answer.choice_id) return value.node_id === answer.node_id && value.choice_id === answer.choice_id && value.next_node_id === answer.next_node_id;
  if (answer.path_id) return value.path_id === answer.path_id && sameOrder(value.node_path, answer.node_path);
  if (answer.next_node_id) return value.next_node_id === answer.next_node_id && sameOrder(value.current_path, answer.current_path);
  return false;
}

function avoidMappingOrderCollision(question, order, canonicalIds) {
  let next = [...order];
  if (sameOrder(next, canonicalIds)) next = swapDeterministicPair(next, question);
  if (mappingGroupedByAnswer(question, next)) next = breakMappingGrouping(question, next);
  return next;
}

function swapDeterministicPair(order, question) {
  const next = [...order];
  const answer = question?.answer || {};
  const firstCategory = answer[next[0]];
  const swapIndex = next.findIndex((id, index) => index > 0 && answer[id] !== firstCategory);
  if (swapIndex > 0) [next[0], next[swapIndex]] = [next[swapIndex], next[0]];
  else if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function breakMappingGrouping(question, order) {
  const answer = question?.answer || {};
  for (let left = 0; left < order.length - 1; left += 1) {
    for (let right = order.length - 1; right > left; right -= 1) {
      if (!answer[order[left]] || !answer[order[right]] || answer[order[left]] === answer[order[right]]) continue;
      const target = Math.min(left + 1, order.length - 1);
      const candidate = [...order];
      [candidate[target], candidate[right]] = [candidate[right], candidate[target]];
      if (!sameOrder(candidate, order) && !mappingGroupedByAnswer(question, candidate)) return candidate;
    }
  }
  return swapDeterministicPair(order, question);
}

function mappingGroupedByAnswer(question, order) {
  const answer = question?.answer || {};
  const categories = order.map((id) => answer[id]).filter(Boolean);
  if (categories.length < 3) return false;
  const unique = [...new Set(categories)];
  if (unique.length < 2) return false;
  if (!unique.some((category) => categories.filter((value) => value === category).length > 1)) return false;
  return unique.every((category) => {
    const indexes = categories.map((value, index) => value === category ? index : -1).filter((index) => index >= 0);
    return indexes.every((index, offset) => offset === 0 || index === indexes[offset - 1] + 1);
  });
}

function mappingAlignedWithAnswer(question, itemOrder, choiceOrder) {
  if (!question?.answer || !Array.isArray(itemOrder) || !Array.isArray(choiceOrder)) return false;
  return itemOrder.length > 1 && itemOrder.every((itemId, index) => question.answer[itemId] === choiceOrder[index]);
}

function avoidMappingAnswerAlignment(question, itemOrder, choiceOrder, side) {
  if (!mappingAlignedWithAnswer(question, itemOrder, choiceOrder)) return side === "items" ? itemOrder : choiceOrder;
  const next = [...(side === "items" ? itemOrder : choiceOrder)];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function orderedOptions(question) {
  if (!state.optionOrders[question.id]) {
    const ids = (question.type === "sequence" ? question.steps : question.options || []).map((item) => item.id);
    let order = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}`);
    order = avoidCanonicalSequenceCollision(question, order);
    order = avoidBranchChoiceCollision(question, order);
    state.optionOrders[question.id] = order;
  }
  const source = Object.fromEntries((question.type === "sequence" ? question.steps : question.options || []).map((item) => [item.id, item]));
  return state.optionOrders[question.id].map((id) => source[id]).filter(Boolean);
}

function orderedMappingItems(question) {
  const key = `${question.id}_items`;
  if (!state.optionOrders[key]) {
    const ids = question.items.map((item) => item.id);
    let order = avoidMappingOrderCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${key}`), ids);
    const choiceOrder = state.optionOrders[`${question.id}_choices`];
    if (choiceOrder) order = avoidMappingAnswerAlignment(question, order, choiceOrder, "items");
    state.optionOrders[key] = order;
  }
  const source = Object.fromEntries(question.items.map((item) => [item.id, item]));
  return state.optionOrders[key].map((id) => source[id]).filter(Boolean);
}

function orderedMappingChoices(question) {
  const key = `${question.id}_choices`;
  if (!state.optionOrders[key]) {
    const ids = question.choices.map((choice) => choice.id);
    let order = avoidMappingOrderCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${key}`), Object.values(question.answer || {}));
    const itemOrder = state.optionOrders[`${question.id}_items`];
    if (itemOrder) order = avoidMappingAnswerAlignment(question, itemOrder, order, "choices");
    state.optionOrders[key] = order;
  }
  const source = Object.fromEntries(question.choices.map((choice) => [choice.id, choice]));
  return state.optionOrders[key].map((id) => source[id]).filter(Boolean);
}

function formatSelected(question) {
  const value = answerValue(question.id);
  if (question.type === "choice" || question.type === "image_select") return question.options.find((option) => option.id === value)?.text || "尚未選擇";
  if (isBranchQuestion(question)) {
    const normalized = normalizeBranchAnswer(question, value);
    if (!normalized) return "尚未選擇";
    if (normalized.choice_id) return `${normalized.node_id}｜${normalized.choice_id}`;
    if (normalized.path_id) return `${normalized.path_id}｜${normalized.node_path.join(" → ")}`;
    if (normalized.next_node_id) return `${normalized.current_path.join(" → ")}｜${normalized.next_node_id}`;
  }
  if (question.type === "mapping") {
    const choices = Object.fromEntries(question.choices.map((item) => [item.id, item.text]));
    return question.items.map((item) => `${item.label}：${choices[value?.[item.id]] || "尚未選擇"}`).join("；");
  }
  if (question.type === "sequence") {
    const labels = Object.fromEntries(question.steps.map((item) => [item.id, item.label]));
    return (value || []).map((id) => labels[id]).join(" → ") || "尚未排序";
  }
  if (question.type === "set") {
    return (value || []).map((id) => question.options.find((option) => option.id === id)?.text).filter(Boolean).join("、") || "尚未選擇";
  }
  return "尚未選擇";
}

function titleAvatarPath(student = state.student) {
  const gender = student?.profile_gender === "female" ? "female" : "male";
  const fallback = `../shared-assets/title-avatars/title-01-trainee_investigator-${gender}.webp`;
  const rawPath = student?.title_avatar_path || student?.progress?.title_avatar_path || fallback;
  if (rawPath.startsWith("../") || rawPath.startsWith("http")) return rawPath;
  if (rawPath.startsWith("shared-assets/")) return `../${rawPath}`;
  return fallback;
}

function titleAndProgress(student = state.student, localGain = 0) {
  const remoteTotal = Number(student?.progress?.total_exp ?? student?.total_exp);
  const localTotal = loadAttempts()
    .filter((attempt) => attempt.student_id === student?.student_id && attempt.unit_id !== mission.unit_id)
    .reduce((sum, attempt) => sum + Number(attempt.unit_credited_exp || 0), 0) + Number(localGain || 0);
  const explicitLevel = titleLevels.find((level) => level.id === (student?.current_title_id || student?.progress?.current_title_id));
  const totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, localTotal, explicitLevel?.need || 0);
  const current = titleLevels.filter((level) => totalExp >= level.need).at(-1) || titleLevels[0];
  const next = titleLevels.find((level) => level.need > totalExp) || null;
  return {
    totalExp,
    current,
    next,
    remaining: next ? Math.max(0, next.need - totalExp) : 0,
    progressPercent: Math.min(100, Math.round((totalExp / 23400) * 100))
  };
}

function studentIdentityLine(student = state.student) {
  if (!student) return "尚未登入";
  if (student.is_guest) return "guest 測試身分｜不列入正式統計";
  const parts = [
    student.class_name ? `${student.class_name}班` : "",
    student.seat_no ? `${student.seat_no}號` : "",
    student.student_id ? `學號 ${student.student_id}` : ""
  ].filter(Boolean);
  return parts.join("｜") || "已連接正式學生帳號";
}

function resetScreenScroll() {
  if (typeof window === "undefined") return;
  const apply = () => {
    window.scrollTo?.(0, 0);
    if (document?.documentElement) document.documentElement.scrollTop = 0;
    if (document?.body) document.body.scrollTop = 0;
    const stage = document?.querySelector?.(".main-stage");
    if (stage) stage.scrollTop = 0;
  };
  apply();
  const raf = window.requestAnimationFrame || ((callback) => setTimeout(callback, 0));
  raf(apply);
}

async function requestBackend(params) {
  const queryParams = params.action === "getStudentAndAttemptStatus"
    ? { ...params, _: String(Date.now()) }
    : { action: params.action, _: String(Date.now()) };
  const query = `?${new URLSearchParams(queryParams).toString()}`;
  const response = await fetch(`${BACKEND_URL}${query}`, {
    method: params.action === "getStudentAndAttemptStatus" ? "GET" : "POST",
    cache: "no-store",
    headers: params.action === "getStudentAndAttemptStatus" ? undefined : { "Content-Type": "text/plain;charset=utf-8" },
    body: params.action === "getStudentAndAttemptStatus" ? undefined : JSON.stringify(params)
  });
  if (!response.ok) throw new Error(`backend_http_${response.status}`);
  const data = await response.json();
  if (!data || data.ok === false) throw new Error(data?.error || "backend_error");
  return data;
}

function normalizeBackendStudent(data, inputId) {
  const student = data.student || data;
  if (!student || !student.student_id) throw new Error("student_not_found");
  return {
    student_id: String(student.student_id || inputId),
    class_name: String(student.class_name || student.class || ""),
    seat_no: String(student.seat_no || student.seat || ""),
    student_name: String(student.student_name || student.name || ""),
    profile_gender: student.profile_gender || student.gender || "male",
    total_exp: Number(student.total_exp || data.progress?.total_exp || 0),
    current_title_id: student.current_title_id || data.progress?.current_title_id || "",
    current_title: student.current_title || data.progress?.current_title || "",
    title_avatar_path: student.title_avatar_path || data.progress?.title_avatar_path || "",
    completed_attempts: Number(student.completed_attempts || data.completed_attempts || 0),
    progress: data.student_progress || data.progress || student.progress || {}
  };
}

function beginLocalAttempt(student) {
  const attemptId = uid("prokaryotes_protists_fungi_guest_attempt");
  state = { ...createEmptyState(), student, attempt_id: attemptId, attempt_session_token: `guest_${attemptId}`, attempt_session_id: `guest_session_${attemptId}`, question_version: QUESTION_VERSION, verification_mode: "local_guest", screen: "brief", completedScreens: ["login", "brief"] };
  saveState();
}


async function handleLogin(useGuest) {
  const message = document.querySelector("#loginMessage");
  const input = document.querySelector("#studentId");
  const studentId = useGuest ? "guest" : String(input?.value || "").trim();
  if (!studentId) {
    if (message) message.textContent = "請輸入學號，或使用 guest 測試。";
    return;
  }
  window.BioQuestLoginUX?.begin({ guest: useGuest || studentId === "guest" });
  await window.BioQuestLoginUX?.paint();
  if (useGuest || studentId === "guest") {
    beginLocalAttempt(roster.guest);
    renderApp();
    resetScreenScroll();
    return;
  }
  try {
    if (message) message.textContent = "正在連接 BioQuest 學習後台，請稍候……";
    const loginData = await requestBackend({ action: "getStudentAndAttemptStatus", student_id: studentId, unit_id: mission.unit_id });
    const student = normalizeBackendStudent(loginData, studentId);
    const startData = await requestBackend({
      action: "startAttempt",
      student_id: student.student_id,
      unit_id: mission.unit_id,
      question_version: QUESTION_VERSION
    });
    if (startData.verification_mode !== "server_verified" || !startData.attempt_session_token || startData.question_version !== QUESTION_VERSION) {
      throw new Error("backend_registry_not_ready");
    }
    state = {
      ...createEmptyState(),
      student,
      attempt_id: startData.attempt_id,
      attempt_session_token: startData.attempt_session_token,
      attempt_session_id: startData.attempt_session_id,
      previous_attempt_id: startData.previous_attempt_id || "",
      question_version: QUESTION_VERSION,
      verification_mode: startData.verification_mode,
      screen: "brief",
      completedScreens: ["login", "brief"]
    };
    saveState();
    saveVerifiedSnapshot(student);
    renderApp();
    resetScreenScroll();
  } catch (error) {
    state = createEmptyState();
    saveState();
    if (message) {
      message.textContent = error.message === "backend_registry_not_ready"
        ? "後台版本尚未更新，請通知老師。"
        : "無法連線或讀取 Google Sheet 學生資料，請稍後重試或通知老師。";
    }
  }
}

function setScreen(nextScreen) {
  if (state.submitted && LOCKED_SCREENS_AFTER_SUBMIT.has(nextScreen)) {
    state.notice = LOCK_MESSAGE;
    state.screen = "result";
  } else {
    state.screen = nextScreen;
    state.notice = "";
    if (!state.completedScreens.includes(nextScreen)) state.completedScreens.push(nextScreen);
  }
  saveState();
  renderApp();
  resetScreenScroll();
}

function canUseNav(target) {
  if (target === "rules") return true;
  if (!state.student) return target === "login";
  if (state.submitted) return ["login", "result", "achievements", "rules"].includes(target);
  return state.completedScreens.includes(target);
}

function resetForRelogin() {
  saveVerifiedSnapshot();
  state = createEmptyState();
  state.notice = "請重新登入以開始新的挑戰。";
  saveState();
  renderApp();
  resetScreenScroll();
}

async function markHint(questionId) {
  if (state.hints[questionId]) return;
  state.hints[questionId] = true;
  state.hintEventStatus[questionId] = state.student?.is_guest ? "sent" : "pending";
  saveState();
  if (!state.student?.is_guest) await flushHintEvents([questionId]).catch(() => {});
}

async function flushHintEvents(ids = Object.keys(state.hintEventStatus)) {
  if (state.student?.is_guest) return true;
  const pending = ids.filter((id) => state.hintEventStatus[id] !== "sent");
  for (const questionId of pending) {
    try {
      await requestBackend({
        action: "hintEvent",
        student_id: state.student.student_id,
        unit_id: mission.unit_id,
        attempt_id: state.attempt_id,
        attempt_session_token: state.attempt_session_token,
        question_id: questionId,
        question_version: state.question_version
      });
      state.hintEventStatus[questionId] = "sent";
    } catch (error) {
      state.hintEventStatus[questionId] = "failed";
    }
  }
  saveState();
  return Object.values(state.hintEventStatus).every((status) => status === "sent");
}

function setAnswer(questionId, value) {
  const question = questionMap[questionId];
  if (state.submitted) return;
  state.answers[question.type === "sequence" ? `${questionId}_sequence` : questionId] = isBranchQuestion(question) ? normalizeBranchAnswer(question, value) : value;
  if ((question.type === "choice" || question.type === "image_select" || isBranchQuestion(question)) && value && !isCorrect(questionId)) markHint(questionId).then(renderApp);
  if (question.type === "mapping" && value && Object.entries(value).some(([key, selected]) => selected && selected !== question.answer[key])) markHint(questionId).then(renderApp);
  saveState();
  renderApp();
}

function toggleSetAnswer(questionId, optionId) {
  if (state.submitted) return;
  const current = new Set(state.answers[questionId] || []);
  if (current.has(optionId)) current.delete(optionId);
  else current.add(optionId);
  state.answers[questionId] = [...current];
  saveState();
  renderApp();
}

async function confirmSetAnswer(questionId) {
  if (!isCorrect(questionId)) await markHint(questionId);
  renderApp();
}

function moveSequence(questionId, itemId, direction) {
  if (state.submitted) return;
  const current = [...(state.answers[`${questionId}_sequence`] || orderedOptions(questionMap[questionId]).map((item) => item.id))];
  const index = current.indexOf(itemId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return;
  [current[index], current[nextIndex]] = [current[nextIndex], current[index]];
  state.answers[`${questionId}_sequence`] = current;
  saveState();
  renderApp();
}

function initSequence(questionId) {
  if (!state.answers[`${questionId}_sequence`]) {
    state.answers[`${questionId}_sequence`] = orderedOptions(questionMap[questionId]).map((item) => item.id);
  }
}

function checkSection(section) {
  const ids = sections[section];
  return ids.every((id) => questionAnswered(questionMap[id]));
}

function nextAfterSection(section) {
  const next = { checkpoint1: "checkpoint2", checkpoint2: "checkpoint3", checkpoint3: "checkpoint4", checkpoint4: "checkpoint5", checkpoint5: "checkpoint6", checkpoint6: "review" }[section];
  if (!checkSection(section)) {
    state.notice = "請先完成本區所有必答題；可以保留不確定，任務後會整理概念回饋。";
    saveState();
    renderApp();
    return;
  }
  const firstWrong = sections[section].filter((id) => !isCorrect(id) && !state.hints[id]);
  if (firstWrong.length) {
    Promise.all(firstWrong.map((id) => markHint(id))).then(() => {
      state.notice = "已為需要調整的題目開啟概念提示；閱讀後可以繼續下一段，不需要本次全部改到正確。";
      saveState();
      renderApp();
    });
    return;
  }
  setScreen(next);
}

function scoreAttempt() {
  const logs = requiredQuestionIds.map((id) => {
    const correct = isCorrect(id);
    return {
      question_id: id,
      answer: answerValue(id),
      is_correct: correct,
      hint_used: Boolean(state.hints[id]),
      skill_tag: questionMap[id].skill_tag || questionMap[id].concept,
      misconception_tag: correct ? "" : questionMap[id].misconception
    };
  });
  const correctCount = logs.filter((log) => log.is_correct).length;
  const directCorrect = logs.filter((log) => log.is_correct && !log.hint_used).length;
  const revisedCorrect = logs.filter((log) => log.is_correct && log.hint_used).length;
  const hintUsed = logs.filter((log) => log.hint_used).length;
  const accuracy = correctCount / logs.length;
  const reflection = evaluateReflection();
  const completionExp = 100;
  const directExp = logs.reduce((sum, log) => sum + (log.is_correct && !log.hint_used ? Number(directExpWeights[log.question_id] || 0) : 0), 0);
  const revisionExp = logs.reduce((sum, log) => sum + (log.is_correct && log.hint_used ? Number(revisionExpWeights[log.question_id] || 0) : 0), 0);
  const masteryExp = correctCount === logs.length ? (hintUsed === 0 ? 140 : 80) : (accuracy >= 0.9 ? 50 : 0);
  const retryExp = 0;
  const rawExp = completionExp + directExp + revisionExp + reflection.question_exp + masteryExp + retryExp;
  const reflectionLedgerCap = Math.min(UNIT_EXP_CAP, 460 + Math.min(40, Math.max(0, reflection.question_exp)));
  const totalExp = Math.min(reflectionLedgerCap, rawExp);
  const earnedBadges = badgeIdsForScore(logs, reflection, retryExp, correctCount === logs.length && hintUsed === 0);
  return {
    unit_id: mission.unit_id,
    attempt_id: state.attempt_id,
    completion_status: "complete",
    verification_status: state.student?.is_guest ? "local_guest" : "pending_backend",
    total_questions: logs.length,
    correct_count: correctCount,
    accuracy,
    hint_used_count: hintUsed,
    direct_correct_count: directCorrect,
    revised_correct_count: revisedCorrect,
    completion_exp: completionExp,
    direct_exp: directExp,
    concept_exp: directExp,
    revision_exp: revisionExp,
    reflection_exp: reflection.question_exp,
    question_exp: reflection.question_exp,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_exp: totalExp,
    attempt_total_exp: totalExp,
    unit_credited_exp: totalExp,
    exp_delta: totalExp,
    logs,
    reflection,
    earned_badges: earnedBadges
  };
}

function badgeIdsForScore(logs, reflection, retryExp, flawless) {
  const byId = Object.fromEntries(logs.map((log) => [log.question_id, log]));
  const passed = (ids) => ids.every((id) => byId[id]?.is_correct);
  const earned = [];
  earned.push("prokaryotes_protists_fungi_entry");
  if (passed(["prokaryotes_protists_fungi_q01"])) earned.push("prokaryote_nucleus_identifier");
  if (passed(["prokaryotes_protists_fungi_q02"])) earned.push("microbe_example_group_mapper");
  if (passed(["prokaryotes_protists_fungi_q03"])) earned.push("fungi_absorptive_nutrition_reader");
  if (passed(["prokaryotes_protists_fungi_q04", "prokaryotes_protists_fungi_q09"])) earned.push("size_only_misconception_corrector");
  if (passed(["prokaryotes_protists_fungi_q05"])) earned.push("microbe_context_reasoner");
  if (passed(["prokaryotes_protists_fungi_q06", "prokaryotes_protists_fungi_q13"])) earned.push("protist_diversity_observer");
  if (passed(["prokaryotes_protists_fungi_q07"])) earned.push("cyanobacteria_boundary_keeper");
  if (passed(["prokaryotes_protists_fungi_q08"])) earned.push("microbe_group_classifier");
  if (passed(["prokaryotes_protists_fungi_q10"])) earned.push("unit_boundary_microbe_mapper");
  if (passed(["prokaryotes_protists_fungi_q03", "prokaryotes_protists_fungi_q11", "prokaryotes_protists_fungi_q14"])) earned.push("fungi_not_plant_master");
  if (passed(["prokaryotes_protists_fungi_q12"])) earned.push("microbe_context_sorter");
  if (flawless) earned.push("prokaryotes_protists_fungi_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("prokaryotes_protists_fungi_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_prokaryotes_protists_fungi");
  return [...new Set(earned)];
}

function evaluateReflection() {
  const original = state.reflection.question || "";
  if (typeof window !== "undefined" && typeof window.evaluateReflectionQuality === "function") {
    return window.evaluateReflectionQuality(original, reflectionRules);
  }
  const normalized = normalizeText(original);
  if (!normalized) return reflectionResult("blank", 0, "空白可提交，但不給回報 EXP。", "auto", normalized, original);
  const irrelevant = reflectionRules.irrelevantTerms.some((term) => normalized.includes(normalizeText(term)));
  const lowEffort = reflectionRules.lowEffortTerms.some((term) => normalized === normalizeText(term) || normalized.includes(normalizeText(term)));
  const copied = reflectionRules.copiedDirections.some((term) => normalized === normalizeText(term));
  const matched = reflectionRules.conceptTerms.filter((term) => normalized.includes(normalizeText(term)));
  const conceptOnly = matched.length === 1 && normalized === normalizeText(matched[0]);
  if (irrelevant || lowEffort || copied || conceptOnly) return reflectionResult("invalid", 0, "回報目前較像玩笑、敷衍、單一概念詞或複製方向，保留給老師複核但不給 EXP。", "auto", normalized, original, { irrelevant, lowEffort: lowEffort || conceptOnly, copied });
  if (matched.length === 0) return reflectionResult("needs_review", 0, "尚未看出和本單元概念的明確關聯，交由老師複核。", "needs_review", normalized, original);
  if (normalized.length >= 24 && /為什麼|如何|怎麼|差異|關係|證據|判斷|影響|確認/.test(original)) return reflectionResult("discussion_question", 40, "能連結本單元概念並提出可討論的疑問。", "auto", normalized, original);
  if (normalized.length >= 12) return reflectionResult("specific_uncertainty", 30, "有連結本單元概念，但還可以再說明想確認的地方。", "auto", normalized, original);
  return reflectionResult("minimal_concept", 10, "有提到本單元概念，但內容仍偏簡短。", "auto", normalized, original);
}

function reflectionResult(quality, questionExp, reason, reviewStatus, normalized, original, flags = {}) {
  return {
    reflection_quality: quality,
    question_exp: questionExp,
    reflection_exp_reason: reason,
    reflection_review_status: reviewStatus,
    reflection_similarity_score: flags.copied ? 1 : 0,
    reflection_similarity_source: flags.copied ? "copied_direction" : "",
    reflection_copied_direction_flag: Boolean(flags.copied),
    reflection_irrelevant_flag: Boolean(flags.irrelevant),
    reflection_low_effort_flag: Boolean(flags.lowEffort),
    reflection_original_text: original,
    reflection_normalized_text: normalized
  };
}

function buildBackendPayload(result = scoreAttempt()) {
  const rawAnswers = {};
  result.logs.forEach((log) => {
    const shortId = shortQuestionId(log.question_id);
    const question = questionMap[log.question_id];
    rawAnswers[log.question_id] = log.answer;
    rawAnswers[shortId] = log.answer;
    if (question?.type === "sequence") rawAnswers[`${shortId}_sequence`] = log.answer;
    if (question?.type === "branch_choice") rawAnswers[`${shortId}_branch`] = log.answer;
    if (question?.type === "branch_path") rawAnswers[`${shortId}_path`] = log.answer;
    if (question?.type === "branch_next_node") rawAnswers[`${shortId}_next_node`] = log.answer;
    if (question?.type === "mapping") rawAnswers[`${shortId}_map`] = log.answer;
  });
  return {
    action: "submitAttempt",
    unit_id: mission.unit_id,
    unit_title: mission.unit_title,
    student_id: state.student.student_id,
    class_name: state.student.class_name,
    seat_no: state.student.seat_no,
    student_name: state.student.student_name,
    attempt_id: state.attempt_id,
    attempt_session_token: state.attempt_session_token,
    previous_attempt_id: state.previous_attempt_id,
    question_version: QUESTION_VERSION,
    raw_answers: rawAnswers,
    raw_answers_json: JSON.stringify(rawAnswers),
    question_logs: result.logs.map((log) => {
      const question = questionMap[log.question_id];
      const perQuestionExp = log.is_correct ? Math.round((log.hint_used ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / Math.max(1, result.logs.length)) : 0;
      return ({
      question_id: log.question_id,
      bare_question_id: shortQuestionId(log.question_id),
      question_version: QUESTION_VERSION,
      unit_id: mission.unit_id,
      student_id: state.student.student_id,
      question_type: question?.backend_type || question?.type || "",
      attempt_answer: log.answer,
      answer_id: typeof log.answer === "string" ? log.answer : "",
      answer_raw: JSON.stringify(log.answer),
      answer_normalized: JSON.stringify(log.answer),
      answer_json: JSON.stringify(log.answer),
      branch_answer_json: isBranchQuestion(question) ? JSON.stringify(log.answer) : "",
      answer_map_json: question?.type === "mapping" ? JSON.stringify(log.answer) : "",
      evidence_id: evidenceIdForQuestion(log.question_id),
      used_hint: log.hint_used,
      hint_used: log.hint_used,
      analysis_group: analysisGroupForQuestion(log.question_id),
      concept_id: question?.concept || "",
      checkpoint_id: checkpointIdForQuestion(log.question_id),
      teacher_group_id: analysisGroupForQuestion(log.question_id),
      is_correct: log.is_correct,
      corrected_after_hint: Boolean(log.is_correct && log.hint_used),
      exp_type: log.is_correct ? (log.hint_used ? "revision" : "direct") : "none",
      exp_awarded: perQuestionExp,
      verification_status: state.student?.is_guest ? "local_guest" : "pending_backend",
      skill_tag: log.skill_tag,
      misconception_tag: log.misconception_tag
    });
    }),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
}

function shortQuestionId(questionId) {
  const match = String(questionId || "").match(/_q(\d{2})$/);
  return match ? `q${match[1]}` : String(questionId || "");
}

function analysisGroupForQuestion(questionId) {
  if (["prokaryotes_protists_fungi_q01", "prokaryotes_protists_fungi_q02", "prokaryotes_protists_fungi_q04", "prokaryotes_protists_fungi_q08", "prokaryotes_protists_fungi_q09"].includes(questionId)) return "microbe_group_features";
  if (["prokaryotes_protists_fungi_q03", "prokaryotes_protists_fungi_q11", "prokaryotes_protists_fungi_q14"].includes(questionId)) return "fungi_not_plants";
  if (["prokaryotes_protists_fungi_q05", "prokaryotes_protists_fungi_q12"].includes(questionId)) return "microbe_context_reasoning";
  if (["prokaryotes_protists_fungi_q06", "prokaryotes_protists_fungi_q13"].includes(questionId)) return "protist_diversity";
  if (questionId === "prokaryotes_protists_fungi_q07") return "algae_cyanobacteria_boundary";
  if (questionId === "prokaryotes_protists_fungi_q10") return "unit_boundary_control";
  return "reflection_question_quality";
}

function checkpointIdForQuestion(questionId) {
  if (["prokaryotes_protists_fungi_q01", "prokaryotes_protists_fungi_q02", "prokaryotes_protists_fungi_q04", "prokaryotes_protists_fungi_q08", "prokaryotes_protists_fungi_q09"].includes(questionId)) return "microbe_cp1_group_features";
  if (["prokaryotes_protists_fungi_q03", "prokaryotes_protists_fungi_q11", "prokaryotes_protists_fungi_q14"].includes(questionId)) return "microbe_cp2_fungi_nutrition";
  if (["prokaryotes_protists_fungi_q05", "prokaryotes_protists_fungi_q12"].includes(questionId)) return "microbe_cp3_context_reasoning";
  if (["prokaryotes_protists_fungi_q06", "prokaryotes_protists_fungi_q13"].includes(questionId)) return "microbe_cp4_protist_diversity";
  if (questionId === "prokaryotes_protists_fungi_q07") return "microbe_cp5_algae_cyanobacteria_boundary";
  if (questionId === "prokaryotes_protists_fungi_q10") return "microbe_cp6_unit_boundary";
  return "microbe_cp7_reflection";
}

function submitAttemptToBackend(payload) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  return requestBackend(payload);
}

function applyBackendSubmitResponse(response, localResult) {
  if (!response || response.ok === false) return localResult;
  const verified = response.verified_attempt || response.attempt || null;
  const attemptResult = response.attempt_result || response.result || null;
  const progress = response.student_progress || response.progress || null;
  if (progress) {
    state.student.progress = progress;
    state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id;
    state.student.current_title = progress.current_title || state.student.current_title;
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path;
    saveVerifiedSnapshot(state.student);
  }
  if (!verified && !attemptResult) return { ...localResult, backend_response: response };
  const verificationStatus = verified?.verification_status || attemptResult?.verification_status || response.verification_status || "server_verified";
  const serverVerified = verificationStatus === "server_verified" || verificationStatus === "server_verified_credited";
  const serverBadgeIds = backendBadgeIds(response, verified, attemptResult);
  const earnedBadges = serverBadgeIds.length ? serverBadgeIds : (serverVerified ? [] : localResult.earned_badges);
  const authoritative = verified || attemptResult || {};
  return {
    ...localResult,
    verification_status: verificationStatus,
    correct_count: numberFromAliases(localResult.correct_count, authoritative.correct_count, attemptResult?.correct_count),
    total_questions: numberFromAliases(localResult.total_questions, authoritative.total_questions, attemptResult?.total_questions),
    accuracy: numberFromAliases(localResult.accuracy, authoritative.accuracy, attemptResult?.accuracy),
    hint_used_count: numberFromAliases(localResult.hint_used_count, authoritative.hint_used_count, attemptResult?.hint_used_count),
    completion_exp: numberFromAliases(localResult.completion_exp, authoritative.completion_exp, attemptResult?.completion_exp),
    direct_exp: numberFromAliases(localResult.direct_exp, authoritative.direct_exp, authoritative.concept_exp, attemptResult?.direct_exp, attemptResult?.concept_exp),
    revision_exp: numberFromAliases(localResult.revision_exp, authoritative.revision_exp, attemptResult?.revision_exp),
    reflection_exp: numberFromAliases(localResult.reflection_exp, authoritative.reflection_exp, authoritative.question_exp, attemptResult?.reflection_exp, attemptResult?.question_exp),
    mastery_exp: numberFromAliases(localResult.mastery_exp, authoritative.mastery_exp, attemptResult?.mastery_exp),
    retry_exp: numberFromAliases(localResult.retry_exp, authoritative.retry_exp, attemptResult?.retry_exp),
    attempt_exp: numberFromAliases(localResult.attempt_exp, authoritative.attempt_exp, authoritative.attempt_total_exp, attemptResult?.attempt_exp, attemptResult?.attempt_total_exp),
    unit_credited_exp: numberFromAliases(localResult.unit_credited_exp, authoritative.unit_credited_exp, attemptResult?.unit_credited_exp, authoritative.attempt_exp, authoritative.attempt_total_exp, attemptResult?.attempt_exp, attemptResult?.attempt_total_exp),
    exp_delta: numberFromAliases(localResult.exp_delta, authoritative.credited_delta, authoritative.exp_delta, attemptResult?.credited_delta, attemptResult?.exp_delta),
    earned_badges: earnedBadges,
    backend_response: response
  };
}

function numberFromAliases(fallback, ...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return Number(fallback || 0);
}

function objectFromValue(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return null;
}

function badgeIdsFromValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : item?.badge_id || item?.id).filter(Boolean);
  const parsed = objectFromValue(value);
  if (Array.isArray(parsed)) return badgeIdsFromValue(parsed);
  if (parsed && typeof parsed === "object") return Object.keys(parsed).filter((id) => parsed[id]);
  return [];
}

function backendBadgeIds(response, verified, attemptResult) {
  const sources = [
    attemptResult?.newly_credited_badges_json,
    attemptResult?.earned_badges_json,
    attemptResult?.newly_credited_badges,
    attemptResult?.earned_badges,
    verified?.newly_credited_badges_json,
    verified?.earned_badges_json,
    verified?.earned_badges,
    verified?.badges,
    verified?.badges_json,
    response?.newly_credited_badges_json,
    response?.earned_badges_json,
    response?.earned_badges,
    response?.badges_json
  ];
  for (const value of sources) {
    const ids = badgeIdsFromValue(value);
    if (ids.length) return [...new Set(ids)];
  }
  return [];
}


async function submitMission() {
  if (!requiredQuestionIds.every((id) => questionAnswered(questionMap[id]))) {
    state.notice = "請先完成所有必答題，再提交任務。";
    saveState();
    renderApp();
    return;
  }
  if (typeof window !== "undefined" && !window.confirm("提交後會進入任務結算，本次作答不能再修改；若要再挑戰，需重新登入並從頭完成。確定提交嗎？")) return;
  const hintSynced = await flushHintEvents();
  if (!hintSynced && !state.student?.is_guest) {
    state.notice = "提示紀錄尚未同步成功，請稍後重試再提交，避免後台誤判零提示。";
    saveState();
    renderApp();
    return;
  }
  const localResult = scoreAttempt();
  let finalResult = localResult;
  try {
    finalResult = applyBackendSubmitResponse(await submitAttemptToBackend(buildBackendPayload(localResult)), localResult);
  } catch (error) {
    if (!state.student?.is_guest) {
      state.notice = "提交到後台時發生問題，本次正式認列尚未完成。請檢查網路後重試。";
      saveState();
      renderApp();
      return;
    }
  }
  state.result = finalResult;
  state.submitted = true;
  state.submitLockedAt = new Date().toISOString();
  state.screen = "result";
  for (const item of ["result", "achievements", "rules"]) {
    if (!state.completedScreens.includes(item)) state.completedScreens.push(item);
  }
  saveAttemptRecord({
    attempt_id: state.attempt_id,
    student_id: state.student.student_id,
    unit_id: mission.unit_id,
    unit_credited_exp: finalResult.unit_credited_exp,
    earned_badges: finalResult.earned_badges,
    submitted_at: state.submitLockedAt
  });
  saveState();
  renderApp();
  resetScreenScroll();
}

function renderLogin() {
  return `
    <div class="wide-layout login-layout">
      <section class="panel hero-panel">
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">原核、原生生物及真菌界</h2>
        <p class="lead">請先確認身份。登入後會開啟本次任務簡報。</p>
        <div class="login-card">
          <label for="studentId">學生學號</label>
          <input id="studentId" type="text" autocomplete="username" placeholder="例如 S70101">
          <div class="button-row">
            <button class="primary" id="loginBtn">登入任務</button>
            <button class="secondary" id="guestBtn">guest 測試</button>
          </div>
          <p class="muted" id="loginMessage">正式學生資料一律以 Google Sheet 後台為準；guest 僅供老師測試。</p>
        </div>
      </section>
    </div>
  `;
}

function renderBrief() {
  const titleInfo = titleAndProgress();
  const studentName = state.student?.student_name || "同學";
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene prokaryotes_protists_fungi-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "原核、原生生物及真菌界中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用例子卡、觀察資料與情境卡，練習分辨原核生物、原生生物與真菌的基礎特徵。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}

function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入微小生命分類任務前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "原核、原生生物及真菌界準備場景" })}<div><h3>讀資料時先看細胞構造、常見例子、取得養分方式與具體情境。</h3><p>本任務不使用顯微照片或專屬 bitmap；每一題依文字資料與 stable ID 判讀，不靠卡片位置或顏色猜答案。</p></div></div><div class="concept-grid"><article><strong>構造</strong><p>原核生物沒有明顯細胞核。</p></article><article><strong>例子</strong><p>細菌、藍菌、草履蟲、酵母菌、黴菌與蕈類分屬不同範圍。</p></article><article><strong>養分</strong><p>真菌常以分解吸收取得養分，不是植物。</p></article><article><strong>情境</strong><p>微生物影響需依具體資料判斷，不用絕對好壞標籤。</p></article></div><button class="primary" data-next="checkpoint1">開始微小生命任務</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["基礎特徵與例子分群", "從細胞核特徵、常見例子與大小迷思整理原核、原生與真菌的入門線索。"],
    checkpoint2: ["真菌不是植物", "閱讀真菌取得養分方式與例子，避免用能否移動或外觀直接分類。"],
    checkpoint3: ["微生物影響看情境", "用情境卡判讀微生物可能的助益、問題或資料不足。"],
    checkpoint4: ["原生生物多樣性", "從觀察卡與資料表讀取生活環境、運動方式與養分線索。"],
    checkpoint5: ["藍菌、藻類與植物邊界", "確認光合作用只是線索之一，仍需回到細胞構造與類群資料。"],
    checkpoint6: ["相鄰單元邊界", "分辨 U39 檢索操作、U40 微生物類群與 U41 植物界分類。"]
  }[section];
  return `<div class="stack checkpoint-stack"><section class="panel"><p class="eyebrow">互動關卡</p><h2>${heading[0]}</h2><p class="lead">${heading[1]}</p></section>${renderCheckpointEvidence(section)}${sections[section].map((id)=>renderQuestion(questionMap[id])).join("")}<section class="panel action-panel"><p class="muted">本區每題都需留下作答紀錄；不確定時可先選擇，任務後會整理概念回饋。</p><button class="primary" data-section-next="${section}">${section === "checkpoint6" ? "整理任務回饋" : "前往下一關"}</button></section></div>`;
}

function renderQuestion(question) {
  const evidence = renderQuestionEvidence(question.id);
  const hint = state.hints[question.id] ? `<div class="hint-box"><strong>提示</strong><p>${escapeHtml(question.hint)}</p></div>` : "";
  return `
    <article class="panel question-card" data-question-id="${question.id}">
      <p class="eyebrow">${question.id.toUpperCase()}｜${conceptLabel(question.concept)}</p>
      <h3>${escapeHtml(question.prompt)}</h3>
      ${evidence}
      ${renderQuestionControl(question)}
      <p class="selected-answer">已選：${escapeHtml(formatSelected(question))}</p>
      ${hint}
    </article>
  `;
}

function conceptLabel(concept) {
  return {
    prokaryote_no_clear_nucleus: "原核特徵",
    examples_by_group: "例子分群",
    fungi_absorptive_nutrition: "真菌養分方式",
    classification_by_size_only: "大小迷思",
    microbes_benefit_harm_context: "情境判斷",
    protist_diversity: "原生多樣性",
    algae_cyanobacteria_plant_boundary: "藍菌與植物邊界",
    u39_u40_u41_boundary: "相鄰單元邊界",
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "prokaryotes_protists_fungi_q02") return `<div class="evidence-card microbe-classification-evidence" role="group" aria-label="例子卡列出常見微小或小型生物名稱與可查證線索。"><strong>例子卡</strong><div class="microbe-card-grid"><article><span class="model-field-label">例子 A</span><span class="model-field-value">細菌｜單細胞；沒有明顯細胞核</span></article><article><span class="model-field-label">例子 B</span><span class="model-field-value">藍菌｜可行光合作用；沒有明顯細胞核</span></article><article><span class="model-field-label">例子 C</span><span class="model-field-value">草履蟲｜水中單細胞；可見明顯細胞核線索</span></article><article><span class="model-field-label">例子 D</span><span class="model-field-value">酵母菌、黴菌、蕈類｜常與分解吸收資料一起出現</span></article></div><p class="muted">資料卡只列出例子名稱與必要線索，請依題目配對。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q04") return `<div class="evidence-card microbe-observation-evidence" role="group" aria-label="微小生物觀察資料卡列出大小、細胞構造、養分線索與例子欄位。"><strong>顯微觀察資料卡</strong><div class="microbe-data-table" role="table" aria-label="微小生物觀察資料欄位"><div role="row"><span role="columnheader">欄位</span><span role="columnheader">目前紀錄</span></div><div role="row"><span role="cell">大小</span><span role="cell">很小，需要顯微觀察</span></div><div role="row"><span role="cell">細胞構造</span><span role="cell">資料未完整</span></div><div role="row"><span role="cell">生活方式</span><span role="cell">資料未完整</span></div><div role="row"><span role="cell">常見例子</span><span role="cell">尚待比對</span></div></div><p class="muted">表格只呈現觀察欄位，沒有先標示類群。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q05") return `<div class="evidence-card microbe-situation-evidence" role="group" aria-label="微生物情境卡列出麵團與食物腐敗兩個情境。"><strong>情境卡</strong><div class="microbe-card-grid"><article><span class="model-field-label">情境甲</span><span class="model-field-value">麵團加入酵母菌後逐漸膨脹</span></article><article><span class="model-field-label">情境乙</span><span class="model-field-value">食物放太久後出現酸敗味，資料指出有細菌大量繁殖</span></article></div><p class="muted">卡片只描述情境與資料，不先標示好或壞。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q06") return `<div class="evidence-card microbe-protist-evidence" role="group" aria-label="水中微小生物觀察卡列出單細胞、生活環境、運動與細胞核線索。"><strong>水中微小生物觀察卡</strong><div class="microbe-card-grid"><article><span class="model-field-label">細胞數</span><span class="model-field-value">單細胞</span></article><article><span class="model-field-label">生活環境</span><span class="model-field-value">水中</span></article><article><span class="model-field-label">運動線索</span><span class="model-field-value">可移動</span></article><article><span class="model-field-label">細胞核線索</span><span class="model-field-value">資料顯示有明顯細胞核構造</span></article></div><p class="muted">卡片只列出可觀察資料，請依題目判讀。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q08") return `<div class="evidence-card microbe-example-evidence" role="group" aria-label="例子卡列出乳酸菌、藍菌、草履蟲、酵母菌與香菇。"><strong>例子資料卡</strong><div class="microbe-card-grid"><article><span class="model-field-label">例子 1</span><span class="model-field-value">乳酸菌｜微小單細胞</span></article><article><span class="model-field-label">例子 2</span><span class="model-field-value">藍菌｜可行光合作用</span></article><article><span class="model-field-label">例子 3</span><span class="model-field-value">草履蟲｜水中單細胞</span></article><article><span class="model-field-label">例子 4</span><span class="model-field-value">酵母菌｜常見於發酵資料</span></article><article><span class="model-field-label">例子 5</span><span class="model-field-value">香菇｜蕈類例子</span></article></div><p class="muted">卡片不以顏色、位置或大小暗示分類。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q10") return `<div class="evidence-card microbe-boundary-evidence" role="group" aria-label="相鄰單元任務卡列出三個學習任務文字。"><strong>相鄰單元任務卡</strong><div class="microbe-card-grid"><article><span class="model-field-label">任務 A</span><span class="model-field-value">依二分檢索表逐步辨識</span></article><article><span class="model-field-label">任務 B</span><span class="model-field-value">辨識原核、原生與真菌類群</span></article><article><span class="model-field-label">任務 C</span><span class="model-field-value">分辨植物界內部類群</span></article></div><p class="muted">資料卡只列出任務內容，不先標是哪一站。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q12") return `<div class="evidence-card microbe-context-sort-evidence" role="group" aria-label="三張情境卡列出酵母菌麵團、食物細菌與未知水樣資料。"><strong>情境分類卡</strong><div class="microbe-card-grid"><article><span class="model-field-label">情境 A</span><span class="model-field-value">麵團加入酵母菌後逐漸膨脹</span></article><article><span class="model-field-label">情境 B</span><span class="model-field-value">食物放太久後出現酸敗味，資料指出有細菌大量繁殖</span></article><article><span class="model-field-label">情境 C</span><span class="model-field-value">水樣中發現微小生物，但沒有更多生活方式或影響資料</span></article></div><p class="muted">卡片只呈現情境，不先標示類別。</p></div>`;
  if (qid === "prokaryotes_protists_fungi_q13") return `<div class="evidence-card microbe-protist-table-evidence" role="group" aria-label="資料表列出三種微小生物的代碼、生活環境、運動方式與養分線索。"><strong>微小生物資料表</strong><div class="microbe-data-table microbe-data-table--q13" role="table" aria-label="三種微小生物的可觀察紀錄"><div role="row" class="microbe-data-header"><span role="columnheader">代碼</span><span role="columnheader">生活環境</span><span role="columnheader">運動方式</span><span role="columnheader">養分線索</span></div><div role="row" class="microbe-data-record"><span role="cell" data-field-label="代碼"><span class="microbe-cell-label" aria-hidden="true">代碼</span><span class="microbe-cell-value">甲</span></span><span role="cell" data-field-label="生活環境"><span class="microbe-cell-label" aria-hidden="true">生活環境</span><span class="microbe-cell-value">淡水</span></span><span role="cell" data-field-label="運動方式"><span class="microbe-cell-label" aria-hidden="true">運動方式</span><span class="microbe-cell-value">以纖毛移動</span></span><span role="cell" data-field-label="養分線索"><span class="microbe-cell-label" aria-hidden="true">養分線索</span><span class="microbe-cell-value">吞入微小食物顆粒</span></span></div><div role="row" class="microbe-data-record"><span role="cell" data-field-label="代碼"><span class="microbe-cell-label" aria-hidden="true">代碼</span><span class="microbe-cell-value">乙</span></span><span role="cell" data-field-label="生活環境"><span class="microbe-cell-label" aria-hidden="true">生活環境</span><span class="microbe-cell-value">池水表層</span></span><span role="cell" data-field-label="運動方式"><span class="microbe-cell-label" aria-hidden="true">運動方式</span><span class="microbe-cell-value">資料未列出明顯移動構造</span></span><span role="cell" data-field-label="養分線索"><span class="microbe-cell-label" aria-hidden="true">養分線索</span><span class="microbe-cell-value">有葉綠體線索，可利用光</span></span></div><div role="row" class="microbe-data-record"><span role="cell" data-field-label="代碼"><span class="microbe-cell-label" aria-hidden="true">代碼</span><span class="microbe-cell-value">丙</span></span><span role="cell" data-field-label="生活環境"><span class="microbe-cell-label" aria-hidden="true">生活環境</span><span class="microbe-cell-value">潮濕環境</span></span><span role="cell" data-field-label="運動方式"><span class="microbe-cell-label" aria-hidden="true">運動方式</span><span class="microbe-cell-value">會伸出偽足</span></span><span role="cell" data-field-label="養分線索"><span class="microbe-cell-label" aria-hidden="true">養分線索</span><span class="microbe-cell-value">取得小型食物</span></span></div></div><p class="muted">表格只列可觀察紀錄，請依題目判讀。</p></div>`;
  return "";
}

function evidenceIdForQuestion(questionId) {
  const shortId = shortQuestionId(questionId);
  return ["q02", "q04", "q05", "q06", "q08", "q10", "q12", "q13"].includes(shortId) ? `prokaryotes_protists_fungi_${shortId}_html_evidence` : "";
}

function renderCheckpointEvidence(section) {
  return "";
}

function renderQuestionControl(question) {
  if (question.type === "choice" || question.type === "image_select") return renderChoiceQuestion(question);
  if (question.type === "mapping") return renderMappingQuestion(question);
  if (question.type === "sequence") return renderSequenceQuestion(question);
  if (isBranchQuestion(question)) return renderBranchQuestion(question);
  if (question.type === "set") return renderSetQuestion(question);
  return "";
}

function renderChoiceQuestion(question) {
  const selected = state.answers[question.id];
  return `<div class="option-grid">${orderedOptions(question).map((option) => `
    <button class="option-card ${selected === option.id ? "selected" : ""}" data-answer="${question.id}" data-value="${option.id}">
      ${escapeHtml(option.text)}
    </button>
  `).join("")}</div>`;
}

function renderBranchQuestion(question) {
  const selected = normalizeBranchAnswer(question, state.answers[question.id]);
  return `<div class="option-grid branch-option-grid" data-branch-question="${question.id}">${orderedOptions(question).map((option) => `
    <button class="option-card ${selected && (selected.choice_id === option.id || selected.path_id === option.id || selected.next_node_id === option.id) ? "selected" : ""}" data-answer="${question.id}" data-value="${option.id}">
      ${escapeHtml(option.text)}
    </button>
  `).join("")}</div>`;
}

function renderMappingQuestion(question) {
  const current = state.answers[question.id] || {};
  const items = orderedMappingItems(question);
  const choices = orderedMappingChoices(question);
  return `<div class="mapping-list">${items.map((item) => `
    <label class="mapping-row">
      <span>${escapeHtml(item.label)}</span>
      <select data-map-question="${question.id}" data-map-item="${item.id}">
        <option value="">尚未選擇</option>
        ${choices.map((choice) => `<option value="${choice.id}" ${current[item.id] === choice.id ? "selected" : ""}>${escapeHtml(choice.text)}</option>`).join("")}
      </select>
    </label>
  `).join("")}</div>`;
}

function renderSequenceQuestion(question) {
  initSequence(question.id);
  const labels = Object.fromEntries(question.steps.map((step) => [step.id, step.label]));
  return `<div class="sequence-list" data-sequence="${question.id}">
    ${(state.answers[`${question.id}_sequence`] || []).map((id, index) => `
      <article class="sequence-item" draggable="true" data-sequence-item="${id}">
        <span class="sequence-number">${index + 1}</span>
        <strong>${escapeHtml(labels[id])}</strong>
        <div class="sequence-actions">
          <button class="icon-btn" data-move="${question.id}" data-item="${id}" data-dir="-1" aria-label="上移">↑</button>
          <button class="icon-btn" data-move="${question.id}" data-item="${id}" data-dir="1" aria-label="下移">↓</button>
        </div>
      </article>
    `).join("")}
  </div>`;
}

function renderSetQuestion(question) {
  const selected = new Set(state.answers[question.id] || []);
  return `<div class="option-grid multi-grid">${orderedOptions(question).map((option) => `
    <button class="option-card ${selected.has(option.id) ? "selected" : ""}" data-toggle-set="${question.id}" data-value="${option.id}">
      <span class="checkbox-dot">${selected.has(option.id) ? "✓" : ""}</span>${escapeHtml(option.text)}
    </button>
  `).join("")}</div>
  <div class="multi-check-row">
    <button class="secondary" data-confirm-set="${question.id}">確認這組答案</button>
    <span class="muted">未確認的部分選取不會記提示。</span>
  </div>`;
}

function conceptFeedback() {
  const missed = requiredQuestionIds.filter((id) => !isCorrect(id)).map((id) => questionMap[id].misconception);
  const unique = [...new Set(missed)];
  const stable = requiredQuestionIds.filter((id) => isCorrect(id) && !state.hints[id]).map((id) => conceptLabel(questionMap[id].concept));
  return { missed: unique, stable: [...new Set(stable)] };
}

function renderReview() {
  const result = scoreAttempt();
  const feedback = conceptFeedback();
  const stateName = result.accuracy >= 1 && result.hint_used_count === 0 ? "excellent" : result.accuracy >= .86 ? "strong" : result.accuracy >= .64 ? "stable" : result.accuracy >= .4 ? "needs_review" : "retry_ready";
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的微小生命分類線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的原核特徵、真菌養分方式、微生物情境與相鄰單元邊界。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}

function misconceptionText(tag) { return {
  prokaryote_nucleus_confusion: "建議再確認原核生物特徵：細胞中沒有明顯細胞核。",
  all_microbes_are_bacteria: "建議再確認例子分群：微小或小型生物不一定都屬細菌。",
  fungi_are_plants: "建議再確認真菌不是植物：要看取得養分方式與例子。",
  classification_by_size_only: "建議再確認分類線索：不能只靠大小或是否看得到。",
  all_bacteria_harmful: "建議再確認微生物情境：不能把微生物一概判定有害。",
  all_bacteria_beneficial: "建議再確認微生物情境：也不能把微生物一概判定有益。",
  protist_as_animal_or_plant: "建議再確認原生生物多樣性：不要只用會不會動或水中生活判成動植物。",
  protist_diversity_overgeneralized: "建議再確認資料表：生活環境、運動方式與養分線索都要一起看。",
  algae_cyanobacteria_plant_confusion: "建議再確認藍菌邊界：光合作用不是植物唯一判準。",
  u39_u40_u41_boundary_confusion: "建議再確認 U39、U40、U41 的學習任務差異。"
}[tag] || tag; }

function feedbackTitle(stateName) {
  return {
    excellent: "概念連線非常穩定",
    strong: "概念掌握良好",
    stable: "可以再補幾個線索",
    needs_review: "適合回到證據慢慢整理",
    retry_ready: "先整理關鍵概念再挑戰"
  }[stateName];
}

function renderReflection() {
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從藍菌與藻類差異、真菌為何不是植物、微生物利害情境、原核與原生差異或 U39-U41 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：原核生物沒有明顯細胞核"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認藍菌和一般藻類在分類上為什麼不完全一樣。">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}

function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "原核、原生生物及真菌界結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>原核、原生生物及真菌界任務結算</h2>
        <p class="lock-note">提交後本次作答已鎖定；若要再挑戰，請重新登入並從頭完成。</p>
        <div class="exp-summary">
          <strong>${result.unit_credited_exp} / ${UNIT_EXP_CAP} EXP</strong>
          <span>${escapeHtml(credit.resultLine)}</span>
        </div>
        <p class="muted">${escapeHtml(credit.note)}</p>
        <div class="ledger-grid">
          ${ledgerRow("完成任務", result.completion_exp)}
          ${ledgerRow("直接答對", result.direct_exp)}
          ${ledgerRow("提示後修正", result.revision_exp)}
          ${ledgerRow("回報 EXP", result.reflection_exp)}
          ${ledgerRow("精熟 EXP", result.mastery_exp)}
          ${ledgerRow("再挑戰補分", result.retry_exp)}
          ${ledgerRow("總計", result.unit_credited_exp)}
        </div>
        <div class="button-row">
          <button class="primary" data-next="achievements">查看成就</button>
          <button class="secondary" data-next="rules">查看規則</button>
          <button class="secondary" data-relogin="true">重新登入／再挑戰</button>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges, { onlyEarned: true })}
    </div>
  `;
}

function ledgerRow(label, value) {
  return `<article><span>${label}</span><strong>${Number(value || 0)}</strong></article>`;
}

function creditStatusText(result) {
  const status = result?.verification_status || (state.student?.is_guest ? "local_guest" : "pending_backend");
  if (state.student?.is_guest || status === "local_guest") {
    return {
      status: "guest",
      resultLine: `guest 測試：本次預估 ${result.unit_credited_exp}/${UNIT_EXP_CAP} EXP，不列入正式累積`,
      note: "正式累積、完成單元與全冊徽章需使用學生帳號登入並經後台確認。"
    };
  }
  if (status === "server_verified" || status === "server_verified_credited") {
    return {
      status: "verified",
      resultLine: `本單元後台認列 ${result.unit_credited_exp}/${UNIT_EXP_CAP} EXP`,
      note: "已依後台回傳資料更新正式累積與稱號。"
    };
  }
  return {
    status: "pending",
    resultLine: `本次預估 ${result.unit_credited_exp}/${UNIT_EXP_CAP} EXP，待後台確認`,
    note: "本次資料已保留為待確認狀態，完成後台同步後才會更新正式累積。"
  };
}

function renderAchievements() {
  return `
    <div class="stack achievements-stack" data-bq-achievements-overview-only="true">
      <section class="panel action-panel">
        <p class="eyebrow">再挑戰</p>
        <h2>重新登入後開始新的挑戰</h2>
        <p class="muted">本次作答與結算已鎖定；若要再挑戰，請重新登入並從頭完成。這不會刪除既有正式累積資料。</p>
        <button class="secondary" data-relogin="true">重新登入／再挑戰</button>
      </section>
    </div>
  `;
}

function resultMode(result = state.result || scoreAttempt()) {
  const status = result?.verification_status || (state.student?.is_guest ? "local_guest" : "pending_backend");
  if (state.student?.is_guest || status === "local_guest") return "guest";
  if (status === "server_verified" || status === "server_verified_credited") return "verified";
  return "pending";
}

function renderBadgeWall(earned = [], options = {}) {
  const earnedSet = new Set(earned);
  const earnedBadges = [...earnedSet].map((id) => badges.find((badge) => badge.id === id)).filter(Boolean);
  const visibleBadges = options.onlyEarned ? earnedBadges.filter((badge) => badge.image_status === "ready" && badge.badge_image_path) : badges;
  const candidateBadges = options.onlyEarned ? earnedBadges.filter((badge) => badge.image_status !== "ready" || !badge.badge_image_path) : [];
  if (options.onlyEarned && visibleBadges.length === 0 && candidateBadges.length === 0) {
    return `<section class="panel">
      <p class="eyebrow">本次取得項目</p>
      <h2>本次尚未取得新項目</h2>
      <p class="muted">完成任務後會依本次表現列出實際取得的正式圖像徽章；正式累積以後台確認為準。</p>
    </section>`;
  }
  return `<section class="panel">
    <p class="eyebrow">${options.onlyEarned ? "本次取得項目" : "本單元項目"}</p>
    <h2>${options.onlyEarned ? "本次正式圖像徽章" : `本單元 ${badges.length} 項`}</h2>
    ${visibleBadges.length ? `<div class="${options.onlyEarned ? "earned-badge-list" : "badge-wall"}">
      ${visibleBadges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual" data-badge-image-status="${badge.image_status || "pending"}"><img src="${badge.badge_image_path}?v=${VERSION}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();"></div>
          <strong>${escapeHtml(badge.name)}</strong>
          ${options.onlyEarned ? "" : `<p>${escapeHtml(badge.condition)}</p>`}
        </article>
      `).join("")}
    </div>` : `<p class="muted">本次沒有已核准正式圖像徽章可顯示；正式累積以後台確認為準。</p>`}
    ${candidateBadges.length ? `<div class="candidate-badge-list" aria-label="本次達成但未列正式圖像的項目"><h3>本次達成候選項目</h3><p class="muted">以下項目等正式圖像核准後才會進入正式徽章圖像展示；本頁不請求不存在的圖檔。</p><ul>${candidateBadges.map((badge) => `<li><strong>${escapeHtml(badge.name)}</strong><span>${escapeHtml(badge.condition)}</span></li>`).join("")}</ul></div>` : ""}
  </section>`;
}

function renderRules() {
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與原核生物、原生生物、真菌、藍菌、微生物情境或 U39-U41 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
}

function renderApp() {
  if (!screen) return;
  const views = {
    login: renderLogin,
    brief: renderBrief,
    scan: renderScan,
    checkpoint1: () => renderCheckpoint("checkpoint1"),
    checkpoint2: () => renderCheckpoint("checkpoint2"),
    checkpoint3: () => renderCheckpoint("checkpoint3"),
    checkpoint4: () => renderCheckpoint("checkpoint4"),
    checkpoint5: () => renderCheckpoint("checkpoint5"),
    checkpoint6: () => renderCheckpoint("checkpoint6"),
    review: renderReview,
    reflection: renderReflection,
    result: renderResult,
    achievements: renderAchievements,
    rules: renderRules
  };
  screen.dataset.bioquestScreen = state.screen;
  screen.innerHTML = `${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}${(views[state.screen] || renderLogin)()}`;
  updateNav();
  bindScreenEvents();
  if (typeof window !== "undefined" && window.BioQuestCharacterLayout?.enhance) window.BioQuestCharacterLayout.enhance({ force: true });
}

function updateNav() {
  navButtons.forEach((button) => {
    const target = button.dataset.nav;
    button.classList.toggle("active", target === state.screen);
    button.disabled = !canUseNav(target);
  });
  if (studentMini) {
    studentMini.innerHTML = state.student
      ? `<p><strong>${escapeHtml(state.student.student_name)}</strong></p><p>${escapeHtml(state.student.class_name)} ${escapeHtml(state.student.seat_no)}｜${escapeHtml(state.student.student_id)}</p>`
      : `<p class="muted">尚未登入</p>`;
  }
}

function bindScreenEvents() {
  screen.querySelector("#loginBtn")?.addEventListener("click", () => handleLogin(false));
  screen.querySelector("#guestBtn")?.addEventListener("click", () => handleLogin(true));
  screen.querySelectorAll("[data-relogin]").forEach((button) => button.addEventListener("click", resetForRelogin));
  screen.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.next)));
  screen.querySelectorAll("[data-section-next]").forEach((button) => button.addEventListener("click", () => nextAfterSection(button.dataset.sectionNext)));
  screen.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => setAnswer(button.dataset.answer, button.dataset.value)));
  screen.querySelectorAll("[data-toggle-set]").forEach((button) => button.addEventListener("click", () => toggleSetAnswer(button.dataset.toggleSet, button.dataset.value)));
  screen.querySelectorAll("[data-confirm-set]").forEach((button) => button.addEventListener("click", () => confirmSetAnswer(button.dataset.confirmSet)));
  screen.querySelectorAll("[data-map-question]").forEach((select) => select.addEventListener("change", () => {
    const qid = select.dataset.mapQuestion;
    const current = { ...(state.answers[qid] || {}) };
    current[select.dataset.mapItem] = select.value;
    setAnswer(qid, current);
  }));
  screen.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => moveSequence(button.dataset.move, button.dataset.item, Number(button.dataset.dir))));
  screen.querySelectorAll("[data-sequence-item]").forEach((item) => {
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", item.dataset.sequenceItem);
    });
    item.addEventListener("dragover", (event) => event.preventDefault());
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const draggedId = event.dataTransfer?.getData("text/plain");
      const targetId = item.dataset.sequenceItem;
      const qid = item.closest("[data-sequence]")?.dataset.sequence;
      if (!qid || !draggedId || draggedId === targetId) return;
      const current = [...(state.answers[`${qid}_sequence`] || orderedOptions(questionMap[qid]).map((step) => step.id))];
      const from = current.indexOf(draggedId);
      const to = current.indexOf(targetId);
      if (from < 0 || to < 0) return;
      current.splice(from, 1);
      current.splice(to, 0, draggedId);
      state.answers[`${qid}_sequence`] = current;
      saveState();
      renderApp();
    });
  });
  const textarea = screen.querySelector("#studentQuestion");
  const confident = screen.querySelector("#confidentConcept");
  const confidence = screen.querySelector("#confidenceLevel");
  textarea?.addEventListener("input", () => { state.reflection.question = textarea.value; saveState(); });
  confident?.addEventListener("input", () => { state.reflection.confident = confident.value; saveState(); });
  confidence?.addEventListener("change", () => { state.reflection.confidence = confidence.value; saveState(); });
  screen.querySelector("#submitMission")?.addEventListener("click", submitMission);
}

if (typeof document !== "undefined") {
  navButtons.forEach((button) => button.addEventListener("click", () => {
    if (!canUseNav(button.dataset.nav)) return;
    if (state.submitted && button.dataset.nav === "login") resetForRelogin();
    else setScreen(button.dataset.nav);
  }));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderApp);
  else renderApp();
}

if (typeof window !== "undefined") {
  window.__prokaryotesProtistsFungiTest = {
    VERSION,
    QUESTION_VERSION,
    mission,
    assets,
    formalBadgeIds,
    badges,
    questions,
    state: () => state,
    setState: (next) => { state = { ...createEmptyState(), ...next }; },
    createEmptyState,
    loadAttempts,
    loadVerifiedSnapshot,
    saveVerifiedSnapshot,
    resetForRelogin,
    canUseNav,
    orderedOptions,
    orderedMappingItems,
    orderedMappingChoices,
    mappingAlignedWithAnswer,
    mappingGroupedByAnswer,
    breakMappingGrouping,
    avoidCanonicalSequenceCollision,
    avoidBranchChoiceCollision,
    normalizeBranchAnswer,
    sameBranchAnswer,
    answerValue,
    isCorrect,
    scoreAttempt,
    buildBackendPayload,
    applyBackendSubmitResponse,
    evaluateReflection,
    titleAvatarPath,
    studentIdentityLine,
    resetScreenScroll,
    checkpointIdForQuestion,
    renderLogin,
    renderBrief,
    renderScan,
    renderQuestionEvidence,
    renderCheckpointEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements,
    renderBadgeWall,
    renderRules
  };
}
