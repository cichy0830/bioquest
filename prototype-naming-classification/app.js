const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260819-naming-classification-q04-evidence-fix-v1";
const QUESTION_VERSION = "20260818-naming-classification-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_naming_classification_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_naming_classification_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "naming_classification",
  "unit_title": "生物的命名與分類",
  "mission_title": "命名與分類資料整理任務",
  "mission_area": "生物分類研究站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  naming_classification_q01: 15,
  naming_classification_q02: 15,
  naming_classification_q03: 15,
  naming_classification_q04: 18,
  naming_classification_q05: 14,
  naming_classification_q06: 17,
  naming_classification_q07: 18,
  naming_classification_q08: 14,
  naming_classification_q09: 14,
  naming_classification_q10: 17,
  naming_classification_q11: 14,
  naming_classification_q12: 14,
  naming_classification_q13: 18,
  naming_classification_q14: 17
};
const revisionExpWeights = {
  naming_classification_q01: 12,
  naming_classification_q02: 12,
  naming_classification_q03: 12,
  naming_classification_q04: 15,
  naming_classification_q05: 11,
  naming_classification_q06: 14,
  naming_classification_q07: 15,
  naming_classification_q08: 11,
  naming_classification_q09: 11,
  naming_classification_q10: 14,
  naming_classification_q11: 11,
  naming_classification_q12: 11,
  naming_classification_q13: 15,
  naming_classification_q14: 16
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/naming_classification/badge-naming_classification-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: [
    "生物的命名與分類",
    "命名",
    "分類",
    "共同特徵",
    "俗名",
    "正式名稱",
    "二名法",
    "屬名",
    "種小名",
    "分類階層",
    "界",
    "門",
    "綱",
    "目",
    "科",
    "屬",
    "種",
    "五界",
    "原核生物界",
    "原生生物界",
    "真菌界",
    "植物界",
    "動物界",
    "外觀",
    "親緣",
    "資料表",
    "證據支持範圍",
    "推論",
    "U36",
    "U37",
    "U38",
    "U39"
  ],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["分類目的", "俗名與正式命名", "二名法", "分類階層", "五界基礎", "外觀與親緣", "證據支持範圍", "U37-U39 邊界"]
};

const formalBadgeCatalog = [
  ["naming_classification_entry", "命名分類入門", "完成 q01-q14 並提交 q15 回報。"],
  ["classification_purpose_organizer", "分類目的整理者", "q01 正確。"],
  ["formal_name_communicator", "正式名稱溝通者", "q02 正確。"],
  ["binomial_name_basic_reader", "二名法基礎判讀者", "q03 正確。"],
  ["classification_hierarchy_sequence_sorter", "分類階層排序者", "q04 順序正確。"],
  ["hierarchy_relationship_reader", "階層關係判讀者", "q05 與 q06 正確。"],
  ["five_kingdoms_mapper", "五界線索配對者", "q07 全對。"],
  ["classification_basis_keeper", "分類依據守門者", "q08 正確。"],
  ["appearance_relationship_guard", "外觀親緣推論守門者", "q09 與 q14 正確。"],
  ["classification_data_interpreter", "分類資料判讀者", "q10 正確。"],
  ["adjacent_unit_boundary_classifier", "相鄰單元邊界分類師", "q11 與 q13 正確。"],
  ["fungi_plant_boundary_reader", "真菌植物邊界判讀者", "q12 正確。"],
  ["naming_classification_flawless", "零提示全對：命名與分類", "q01-q14 第一次提交全對且未使用提示。"],
  ["naming_classification_reflection_reporter", "高品質回報：生物的命名與分類疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_naming_classification", "再挑戰進步：生物的命名與分類", "合法重新登入再挑戰且 verified 後比前次進步。"]
];
const formalBadgeIds = formalBadgeCatalog.map(([id]) => id);
const badges = formalBadgeCatalog.map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const kingdomChoices = [
  { id: "kingdom_monera", text: "原核生物界" },
  { id: "kingdom_protista", text: "原生生物界" },
  { id: "kingdom_fungi", text: "真菌界" },
  { id: "kingdom_plantae", text: "植物界" },
  { id: "kingdom_animalia", text: "動物界" }
];

const hierarchySequenceSteps = [
  { id: "kingdom", label: "界" },
  { id: "phylum", label: "門" },
  { id: "class", label: "綱" },
  { id: "order", label: "目" },
  { id: "family", label: "科" },
  { id: "genus", label: "屬" },
  { id: "species", label: "種" }
];

const unitBoundaryChoices = [
  { id: "u36_biotechnology", text: "第 36 站：生物技術" },
  { id: "u37_fossils_evolution", text: "第 37 站：化石與演化" },
  { id: "u38_naming_classification", text: "第 38 站：生物的命名與分類" },
  { id: "u39_dichotomous_key", text: "第 39 站：檢索表的認識與應用" }
];

const questions = [
  { id: "naming_classification_q01", section: "checkpoint1", concept: "classification_purpose", skill_tag: "classification_purpose", type: "choice", answer: "shared_traits", prompt: "學校採集到多種生物資料，哪一種做法最能幫助整理與溝通？", hint: "想想哪一種方式能讓不同人用同一套線索討論。", misconception: "classification_purpose_confusion", options: [ { id: "shared_traits", text: "依共同特徵分類" }, { id: "personal_preference", text: "依每個人的喜好排列" }, { id: "size_only", text: "只按照體型大小排" }, { id: "random_names", text: "每個人自己取名字" } ] },
  { id: "naming_classification_q02", section: "checkpoint1", concept: "common_vs_scientific_name", skill_tag: "common_vs_scientific_name", type: "choice", answer: "avoid_confusion", prompt: "同一種生物在不同地區有不同俗名，為什麼仍需要正式名稱？", hint: "比較同一筆標本資料在不同地區名稱欄位中的差異。", misconception: "common_name_as_formal_name", options: [ { id: "avoid_confusion", text: "降低溝通混淆" }, { id: "sound_better", text: "讓名稱聽起來比較漂亮" }, { id: "replace_local_culture", text: "完全取代地方文化" }, { id: "scientists_only", text: "只讓科學家能使用" } ] },
  { id: "naming_classification_q03", section: "checkpoint1", concept: "binomial_name_basic", skill_tag: "binomial_name_basic", type: "choice", answer: "genus_species", prompt: "一個七年級簡化學名通常由哪兩個主要部分組成？", hint: "觀察正式名稱資料卡中分成哪兩個欄位。", misconception: "binomial_as_memory_task", options: [ { id: "genus_species", text: "屬名與種小名" }, { id: "kingdom_phylum", text: "界名與門名" }, { id: "common_nickname", text: "俗名與暱稱" }, { id: "shape_habitat", text: "形狀與棲地" } ] },
  { id: "naming_classification_q04", section: "checkpoint2", concept: "classification_hierarchy", skill_tag: "classification_hierarchy", type: "sequence", answer: ["kingdom", "phylum", "class", "order", "family", "genus", "species"], prompt: "將分類階層由大範圍排到小範圍。", hint: "先找出分類階層名稱，再回想由大到小的包含關係。", misconception: "hierarchy_order_reversed", steps: hierarchySequenceSteps },
  { id: "naming_classification_q05", section: "checkpoint2", concept: "classification_hierarchy", skill_tag: "classification_hierarchy", type: "choice", answer: "species", prompt: "哪一個分類階層通常範圍最小？", hint: "比較界、門、綱、種四個階層的包含範圍。", misconception: "species_as_largest_group", options: [ { id: "species", text: "種" }, { id: "kingdom", text: "界" }, { id: "phylum", text: "門" }, { id: "class", text: "綱" } ] },
  { id: "naming_classification_q06", section: "checkpoint2", concept: "hierarchy_relationship_clue", skill_tag: "hierarchy_relationship_clue", type: "choice", backend_type: "data_interpret", answer: "same_genus", prompt: "依分類資料判斷，哪一組生物通常共同特徵較多？", hint: "比較各組資料共同到哪一個分類階層。", misconception: "hierarchy_relationship_confusion", options: [ { id: "same_genus", text: "同屬的一組" }, { id: "same_kingdom", text: "同界的一組" }, { id: "same_phylum", text: "同門的一組" }, { id: "not_enough", text: "完全無法比較任何線索" } ] },
  { id: "naming_classification_q07", section: "checkpoint3", concept: "five_kingdoms_basic", skill_tag: "five_kingdoms_basic", type: "mapping", answer: { bacteria_no_nucleus: "kingdom_monera", paramecium_single_cell: "kingdom_protista", mushroom_absorbs_food: "kingdom_fungi", fern_photosynthesis: "kingdom_plantae", fish_ingests_food: "kingdom_animalia" }, prompt: "將生物線索配到七年級五界基礎類別。", hint: "先讀每張線索卡的可觀察特徵，再選擇較合適的五界類別。", misconception: "five_kingdoms_basic_confusion", items: [ { id: "bacteria_no_nucleus", label: "資料卡 A：單細胞，沒有明顯細胞核。" }, { id: "paramecium_single_cell", label: "資料卡 B：單細胞，有細胞核，可自行移動。" }, { id: "mushroom_absorbs_food", label: "資料卡 C：以吸收方式取得養分，不行光合作用。" }, { id: "fern_photosynthesis", label: "資料卡 D：多細胞，具有葉綠體，可行光合作用。" }, { id: "fish_ingests_food", label: "資料卡 E：多細胞，以攝食方式取得養分。" } ], choices: kingdomChoices },
  { id: "naming_classification_q08", section: "checkpoint4", concept: "classification_basis", skill_tag: "classification_basis", type: "choice", answer: "observable_traits", prompt: "如果要把一批生物卡分類，哪一組依據比較適合？", hint: "比較哪些依據能讓不同人重複觀察與討論。", misconception: "classification_basis_subjective", options: [ { id: "observable_traits", text: "可觀察且可比較的特徵" }, { id: "student_preference", text: "學生個人的喜好" }, { id: "name_length", text: "名稱字數長短" }, { id: "picture_color", text: "卡片背景顏色" } ] },
  { id: "naming_classification_q09", section: "checkpoint4", concept: "appearance_not_relationship", skill_tag: "appearance_not_relationship", type: "choice", answer: "one_clue_only", prompt: "兩種生物外觀很像，能不能只用這點判定牠們親緣最近？", hint: "想想只看單一外觀線索時，推論範圍是否足夠。", misconception: "appearance_equals_closest_relation", options: [ { id: "one_clue_only", text: "不宜只靠單一外觀線索判定" }, { id: "always_closest", text: "外觀像就一定親緣最近" }, { id: "no_comparison", text: "完全不能比較任何特徵" }, { id: "body_size_only", text: "只要體型相近就足夠" } ] },
  { id: "naming_classification_q10", section: "checkpoint4", concept: "hierarchy_relationship_clue", skill_tag: "hierarchy_relationship_clue", type: "choice", backend_type: "data_interpret", answer: "pair_shared_genus", prompt: "依分類階層表判斷，哪一組生物分類關係較接近？", hint: "比較資料表中各組共同到哪一個階層。", misconception: "single_trait_overgeneralization", options: [ { id: "pair_shared_genus", text: "共同到屬的一組" }, { id: "pair_shared_family", text: "共同到科的一組" }, { id: "pair_shared_order", text: "共同到目的一組" }, { id: "pair_outer_look", text: "只列外觀相似的一組" } ] },
  { id: "naming_classification_q11", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "choice", answer: "binomial_task", prompt: "下列哪一個任務最符合本單元「生物的命名與分類」？", hint: "先分辨本單元重點與前後相鄰單元的任務。", misconception: "unit_boundary_confusion", options: [ { id: "binomial_task", text: "判讀二名法與分類階層資料" }, { id: "strata_task", text: "用地層與化石資料討論演化" }, { id: "key_full_task", text: "完整操作二分檢索表找物種" }, { id: "biotech_task", text: "分析基因轉殖技術應用" } ] },
  { id: "naming_classification_q12", section: "checkpoint3", concept: "five_kingdoms_basic", skill_tag: "five_kingdoms_basic", type: "choice", answer: "fungi_not_plants", prompt: "下列哪一種說法較符合七年級五界基礎？", hint: "比較真菌、植物與動物取得養分的方式。", misconception: "fungi_as_plants", options: [ { id: "fungi_not_plants", text: "真菌和植物分屬不同類別" }, { id: "all_microbes_same", text: "所有微小生物都放同一類" }, { id: "plants_hunt", text: "植物主要靠獵食取得養分" }, { id: "animals_photosynthesis", text: "動物主要靠光合作用製造養分" } ] },
  { id: "naming_classification_q13", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "mapping", answer: { gene_transfer_application: "u36_biotechnology", strata_fossil_evidence: "u37_fossils_evolution", binomial_classification_task: "u38_naming_classification", stepwise_key_identification: "u39_dichotomous_key" }, prompt: "將學習任務放到合適單元或處理位置。", hint: "先看每張任務卡的資料類型，再對應相鄰單元的核心任務。", misconception: "adjacent_unit_boundary_confusion", items: [ { id: "gene_transfer_application", label: "任務 A：討論基因轉殖技術的應用案例。" }, { id: "strata_fossil_evidence", label: "任務 B：讀取地層與化石資料。" }, { id: "binomial_classification_task", label: "任務 C：整理正式名稱與分類階層。" }, { id: "stepwise_key_identification", label: "任務 D：依二分檢索表一步步辨識。" } ], choices: unitBoundaryChoices },
  { id: "naming_classification_q14", section: "checkpoint4", concept: "appearance_not_relationship", skill_tag: "appearance_not_relationship", type: "choice", backend_type: "data_interpret", answer: "classification_clue", prompt: "一張分類資料表可以支持哪一種較保守的說法？", hint: "先確認資料表實際列出哪些欄位，再判斷結論可到哪個範圍。", misconception: "evidence_scope_overclaim", options: [ { id: "classification_clue", text: "可作為分類關係判讀的線索" }, { id: "parent_child_proof", text: "可直接證明親子關係" }, { id: "exact_age", text: "可直接算出精確年代" }, { id: "dna_sequence", text: "可直接得知 DNA 序列" } ] }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["naming_classification_q01", "naming_classification_q02", "naming_classification_q03"],
  checkpoint2: ["naming_classification_q04", "naming_classification_q05", "naming_classification_q06"],
  checkpoint3: ["naming_classification_q07", "naming_classification_q12"],
  checkpoint4: ["naming_classification_q08", "naming_classification_q09", "naming_classification_q10", "naming_classification_q11", "naming_classification_q13", "naming_classification_q14"]
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
    return `<div class="u36-scene-neutral" role="img" aria-label="${escapeHtml(alt || "生物的命名與分類中性任務場景")}">
      <span class="u36-scene-strand"></span>
      <span class="u36-scene-card">名稱資料</span>
      <span class="u36-scene-card">分類階層</span>
      <span class="u36-scene-card">五界線索</span>
      <span class="u36-scene-card">比較資料</span>
    </div>`;
  }
  return `<picture class="u36-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u36-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u36-page-scene u36-${prefix}-scene ${className}" data-u36-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "生物的命名與分類中性任務場景")}
    ${azhe ? `<img class="u36-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u36-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl && owlSrc ? `<img class="u36-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u36-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
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
  if (question.id !== "naming_classification_q04" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

function avoidMappingOrderCollision(question, order, canonicalIds) {
  if (!sameOrder(order, canonicalIds)) return order;
  const next = [...order];
  if (next.length > 2) [next[1], next[2]] = [next[2], next[1]];
  else if (next.length > 1) [next[0], next[1]] = [next[1], next[0]];
  return next;
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
    state.optionOrders[question.id] = avoidCanonicalSequenceCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}`));
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
  const attemptId = uid("naming_classification_guest_attempt");
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
  state.answers[question.type === "sequence" ? `${questionId}_sequence` : questionId] = value;
  if ((question.type === "choice" || question.type === "image_select") && value && value !== question.answer) markHint(questionId).then(renderApp);
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
  const next = { checkpoint1: "checkpoint2", checkpoint2: "checkpoint3", checkpoint3: "checkpoint4", checkpoint4: "review" }[section];
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
  earned.push("naming_classification_entry");
  if (passed(["naming_classification_q01"])) earned.push("classification_purpose_organizer");
  if (passed(["naming_classification_q02"])) earned.push("formal_name_communicator");
  if (passed(["naming_classification_q03"])) earned.push("binomial_name_basic_reader");
  if (passed(["naming_classification_q04"])) earned.push("classification_hierarchy_sequence_sorter");
  if (passed(["naming_classification_q05", "naming_classification_q06"])) earned.push("hierarchy_relationship_reader");
  if (passed(["naming_classification_q07"])) earned.push("five_kingdoms_mapper");
  if (passed(["naming_classification_q08"])) earned.push("classification_basis_keeper");
  if (passed(["naming_classification_q09", "naming_classification_q14"])) earned.push("appearance_relationship_guard");
  if (passed(["naming_classification_q10"])) earned.push("classification_data_interpreter");
  if (passed(["naming_classification_q11", "naming_classification_q13"])) earned.push("adjacent_unit_boundary_classifier");
  if (passed(["naming_classification_q12"])) earned.push("fungi_plant_boundary_reader");
  if (flawless) earned.push("naming_classification_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("naming_classification_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_naming_classification");
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
    rawAnswers[log.question_id] = log.answer;
    rawAnswers[shortId] = log.answer;
    if (questionMap[log.question_id]?.type === "sequence") rawAnswers[`${shortId}_sequence`] = log.answer;
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
      const perQuestionExp = log.is_correct ? Math.round((log.hint_used ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / Math.max(1, result.logs.length)) : 0;
      return ({
      question_id: log.question_id,
      question_version: QUESTION_VERSION,
      unit_id: mission.unit_id,
      student_id: state.student.student_id,
      question_type: questionMap[log.question_id]?.backend_type || questionMap[log.question_id]?.type || "",
      attempt_answer: log.answer,
      answer_json: JSON.stringify(log.answer),
      used_hint: log.hint_used,
      hint_used: log.hint_used,
      analysis_group: analysisGroupForQuestion(log.question_id),
      concept_id: questionMap[log.question_id]?.concept || "",
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
  if (["naming_classification_q01"].includes(questionId)) return "classification_purpose";
  if (["naming_classification_q02"].includes(questionId)) return "common_vs_scientific_name";
  if (["naming_classification_q03"].includes(questionId)) return "binomial_name_basic";
  if (["naming_classification_q04", "naming_classification_q05"].includes(questionId)) return "classification_hierarchy";
  if (["naming_classification_q06", "naming_classification_q10"].includes(questionId)) return "hierarchy_relationship_clue";
  if (["naming_classification_q07", "naming_classification_q12"].includes(questionId)) return "five_kingdoms_basic";
  if (["naming_classification_q08"].includes(questionId)) return "classification_basis";
  if (["naming_classification_q09", "naming_classification_q14"].includes(questionId)) return "appearance_not_relationship";
  if (["naming_classification_q11", "naming_classification_q13"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  if (["naming_classification_q11", "naming_classification_q13"].includes(questionId)) return "naming_cp5_boundary";
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "naming_cp1_purpose_naming",
    checkpoint2: "naming_cp2_hierarchy",
    checkpoint3: "naming_cp3_five_kingdoms",
    checkpoint4: "naming_cp4_traits_relationship"
  }[section] || "naming_cp6_reflection";
}

async function submitAttemptToBackend(payload) {
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
        <h2 class="hero-title">生物的命名與分類</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene naming_classification-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "生物的命名與分類中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用名稱資料、分類階層、五界線索與比較資料，練習用一致的分類語言整理生物資料。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入生物的命名與分類任務前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "生物的命名與分類準備場景" })}<div><h3>讀資料時先看名稱欄位、階層位置、可觀察特徵與資料支持範圍。</h3><p>本任務只使用匿名模型與觀察資料，不要求二分檢索表完整操作、真實物種鑑定或基因資料分析。</p></div></div><div class="concept-grid"><article><strong>名稱溝通</strong><p>比較俗名與正式名稱在資料整理中的使用情境。</p></article><article><strong>分類階層</strong><p>讀取階層名稱與包含範圍，練習由大到小排序。</p></article><article><strong>五界線索</strong><p>依細胞與營養等可觀察資料，配對七年級五界基礎類別。</p></article><article><strong>任務邊界</strong><p>分清 U36 生物技術、U37 化石與演化、U38 命名分類與 U39 檢索表。</p></article></div><button class="primary" data-next="checkpoint1">開始生物的命名與分類任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["分類目的與正式名稱", "讀取名稱資料，整理俗名、正式名稱與二名法基礎。"],
    checkpoint2: ["分類階層與關係線索", "讀取階層名稱與分類資料，完成唯一標準排序與資料判讀。"],
    checkpoint3: ["五界基礎分類", "依可觀察特徵配對五界基礎類別，並確認真菌與植物邊界。"],
    checkpoint4: ["分類依據、外觀線索與單元邊界", "判讀可觀察特徵、分類資料與 U36-U39 相鄰單元任務。"]
  }[section];
  return `<div class="stack checkpoint-stack"><section class="panel"><p class="eyebrow">互動關卡</p><h2>${heading[0]}</h2><p class="lead">${heading[1]}</p></section>${renderCheckpointEvidence(section)}${sections[section].map((id)=>renderQuestion(questionMap[id])).join("")}<section class="panel action-panel"><p class="muted">本區每題都需留下作答紀錄；不確定時可先選擇，任務後會給概念回饋。</p><button class="primary" data-section-next="${section}">${section === "checkpoint4" ? "整理任務回饋" : "前往下一關"}</button></section></div>`;
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
    classification_purpose: "分類目的",
    common_vs_scientific_name: "俗名與正式名稱",
    binomial_name_basic: "二名法基礎",
    classification_hierarchy: "分類階層",
    hierarchy_relationship_clue: "階層關係線索",
    five_kingdoms_basic: "五界基礎",
    classification_basis: "分類依據",
    appearance_not_relationship: "外觀與親緣推論",
    unit_boundary_control: "單元邊界",
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "naming_classification_q02") return `<div class="evidence-card naming-common-name-evidence" role="group" aria-label="資料卡列出同一標本在不同地區的名稱紀錄。"><strong>名稱紀錄卡</strong><div class="naming-card-grid"><article><span class="model-field-label">標本代碼</span><span class="model-field-value">S-08</span></article><article><span class="model-field-label">地區甲紀錄</span><span class="model-field-value">俗名 A</span></article><article><span class="model-field-label">地區乙紀錄</span><span class="model-field-value">俗名 B</span></article><article><span class="model-field-label">正式名稱欄</span><span class="model-field-value">同一欄位格式記錄</span></article></div><p class="muted">資料卡列出名稱欄位與地區紀錄，請依題目判讀。</p></div>`;
  if (qid === "naming_classification_q03") return `<div class="evidence-card naming-binomial-evidence" role="group" aria-label="資料卡列出一筆正式名稱分成兩個欄位。"><strong>正式名稱欄位卡</strong><div class="naming-card-grid"><article><span class="model-field-label">欄位一</span><span class="model-field-value">Genus</span></article><article><span class="model-field-label">欄位二</span><span class="model-field-value">species</span></article><article><span class="model-field-label">標本代碼</span><span class="model-field-value">S-12</span></article><article><span class="model-field-label">紀錄用途</span><span class="model-field-value">資料庫一致欄位</span></article></div><p class="muted">資料卡只顯示正式名稱的欄位結構。</p></div>`;
  if (qid === "naming_classification_q04" || qid === "naming_classification_q05") return "";
  if (qid === "naming_classification_q06") return `<div class="evidence-card evidence-table-card naming-relationship-evidence" role="group" aria-label="資料表列出不同資料組共同到的分類階層。"><strong>分類階層比較表</strong><div class="naming-data-table" role="table" aria-label="資料組與共同分類階層"><div role="row"><span role="columnheader">資料組</span><span role="columnheader">共同階層代碼</span><span role="columnheader">補充紀錄</span></div><div role="row"><span role="cell">A 組</span><span role="cell">G</span><span role="cell">兩筆資料在 G 欄相同</span></div><div role="row"><span role="cell">B 組</span><span role="cell">K</span><span role="cell">兩筆資料在 K 欄相同</span></div><div role="row"><span role="cell">C 組</span><span role="cell">P</span><span role="cell">兩筆資料在 P 欄相同</span></div></div><p class="muted">請比較資料共同到的階層代碼，再依題目判讀。</p></div>`;
  if (qid === "naming_classification_q07") return `<div class="evidence-card naming-kingdom-evidence" role="group" aria-label="資料卡列出五筆生物可觀察線索。"><strong>五界線索資料</strong><div class="naming-card-grid"><article><span class="model-field-label">資料 A</span><span class="model-field-value">單細胞，沒有明顯細胞核。</span></article><article><span class="model-field-label">資料 B</span><span class="model-field-value">單細胞，有細胞核，可自行移動。</span></article><article><span class="model-field-label">資料 C</span><span class="model-field-value">以吸收方式取得養分，不行光合作用。</span></article><article><span class="model-field-label">資料 D</span><span class="model-field-value">多細胞，具有葉綠體，可行光合作用。</span></article><article><span class="model-field-label">資料 E</span><span class="model-field-value">多細胞，以攝食方式取得養分。</span></article></div><p class="muted">資料卡只列出可觀察線索，請依題目配對。</p></div>`;
  if (qid === "naming_classification_q10") return `<div class="evidence-card evidence-table-card naming-relationship-table" role="group" aria-label="資料表列出三組生物共同到的分類欄位。"><strong>分類資料比較表</strong><div class="naming-data-table" role="table" aria-label="分類資料比較表"><div role="row"><span role="columnheader">資料組</span><span role="columnheader">共同欄位</span><span role="columnheader">外觀備註</span></div><div role="row"><span role="cell">甲組</span><span role="cell">屬欄相同</span><span role="cell">體色不同</span></div><div role="row"><span role="cell">乙組</span><span role="cell">科欄相同</span><span role="cell">體型相近</span></div><div role="row"><span role="cell">丙組</span><span role="cell">目欄相同</span><span role="cell">棲地相近</span></div></div><p class="muted">資料表列出分類欄位與外觀備註，請依題目判讀。</p></div>`;
  if (qid === "naming_classification_q13") return `<div class="evidence-card naming-boundary-evidence" role="group" aria-label="資料卡列出相鄰單元任務與資料類型。"><strong>相鄰單元任務卡</strong><div class="naming-card-grid"><article><span class="model-field-label">任務 A</span><span class="model-field-value">討論基因轉殖技術的應用案例。</span></article><article><span class="model-field-label">任務 B</span><span class="model-field-value">讀取地層與化石資料。</span></article><article><span class="model-field-label">任務 C</span><span class="model-field-value">整理正式名稱與分類階層。</span></article><article><span class="model-field-label">任務 D</span><span class="model-field-value">依二分檢索表一步步辨識。</span></article></div><p class="muted">資料卡只呈現任務資料類型，請依題目對應。</p></div>`;
  if (qid === "naming_classification_q14") return `<div class="evidence-card naming-scope-evidence" role="group" aria-label="資料卡列出一筆分類資料表的欄位與觀察範圍。"><strong>分類資料範圍卡</strong><div class="naming-card-grid"><article><span class="model-field-label">資料組</span><span class="model-field-value">C-14</span></article><article><span class="model-field-label">資料項目</span><span class="model-field-value">名稱欄位、階層欄位、可觀察特徵描述</span></article><article><span class="model-field-label">觀察範圍</span><span class="model-field-value">同一批標本資料</span></article><article><span class="model-field-label">可見紀錄</span><span class="model-field-value">分類欄位與外觀比較</span></article></div><p class="muted">資料卡列出分類資料表的欄位與觀察範圍。</p></div>`;
  return "";
}

function renderCheckpointEvidence(section) {
  return "";
}

function renderQuestionControl(question) {
  if (question.type === "choice" || question.type === "image_select") return renderChoiceQuestion(question);
  if (question.type === "mapping") return renderMappingQuestion(question);
  if (question.type === "sequence") return renderSequenceQuestion(question);
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的生物的命名與分類判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的命名、分類階層、五界線索、分類依據與資料支持範圍。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  classification_purpose_confusion: "建議再確認分類目的：重點是用共同特徵讓資料整理與溝通更一致。",
  common_name_as_formal_name: "建議再確認俗名與正式名稱的差別：同一資料需要穩定欄位協助溝通。",
  binomial_as_memory_task: "建議再確認二名法基礎：正式名稱不是只背字，而是有固定欄位結構。",
  hierarchy_order_reversed: "建議再確認分類階層由大範圍到小範圍的包含關係。",
  species_as_largest_group: "建議再確認種在本單元分類階層中的範圍。",
  hierarchy_relationship_confusion: "建議再確認分類階層資料如何提供關係判讀線索。",
  five_kingdoms_basic_confusion: "建議再確認五界基礎：可從細胞與營養等線索進行配對。",
  classification_basis_subjective: "建議再確認分類依據：應使用可觀察且可比較的特徵。",
  appearance_equals_closest_relation: "建議再確認外觀線索的支持範圍：單一外觀不等於完整分類關係。",
  single_trait_overgeneralization: "建議再確認分類資料判讀：不要只用單一外觀取代階層資料。",
  unit_boundary_confusion: "建議再確認本單元與相鄰單元任務的邊界。",
  fungi_as_plants: "建議再確認真菌與植物在七年級五界基礎中的分類差異。",
  adjacent_unit_boundary_confusion: "建議再確認 U36、U37、U38 與 U39 的任務資料類型。",
  evidence_scope_overclaim: "建議再確認資料支持範圍：分類資料表提供線索，但不能推出未列出的結論。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從命名、分類階層、五界基礎、分類依據、外觀線索、資料支持範圍或 U36-U39 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：分類階層可由大範圍排到小範圍"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認正式名稱與俗名在資料整理時怎麼搭配使用。">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "生物的命名與分類結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>生物的命名與分類任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與命名、分類階層、五界基礎、分類依據、外觀線索、資料支持範圍或 U36-U39 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__namingClassificationTest = {
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
    avoidCanonicalSequenceCollision,
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
