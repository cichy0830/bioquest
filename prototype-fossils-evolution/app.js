const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260819-fossils-evolution-p1-fix-v1";
const QUESTION_VERSION = "20260818-fossils-evolution-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_fossils_evolution_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_fossils_evolution_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "fossils_evolution",
  "unit_title": "化石與演化",
  "mission_title": "化石演化案例判讀任務",
  "mission_area": "生命延續資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  fossils_evolution_q01: 15,
  fossils_evolution_q02: 15,
  fossils_evolution_q03: 14,
  fossils_evolution_q04: 16,
  fossils_evolution_q05: 18,
  fossils_evolution_q06: 18,
  fossils_evolution_q07: 14,
  fossils_evolution_q08: 15,
  fossils_evolution_q09: 17,
  fossils_evolution_q10: 18,
  fossils_evolution_q11: 14,
  fossils_evolution_q12: 15,
  fossils_evolution_q13: 17,
  fossils_evolution_q14: 14
};
const revisionExpWeights = {
  fossils_evolution_q01: 12,
  fossils_evolution_q02: 12,
  fossils_evolution_q03: 11,
  fossils_evolution_q04: 13,
  fossils_evolution_q05: 15,
  fossils_evolution_q06: 15,
  fossils_evolution_q07: 11,
  fossils_evolution_q08: 12,
  fossils_evolution_q09: 14,
  fossils_evolution_q10: 15,
  fossils_evolution_q11: 11,
  fossils_evolution_q12: 12,
  fossils_evolution_q13: 14,
  fossils_evolution_q14: 13
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/fossils_evolution/badge-fossils_evolution-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: [
    "化石與演化",
    "化石",
    "地層",
    "相對先後",
    "演化",
    "族群",
    "長時間",
    "共同祖先",
    "分支",
    "證據",
    "化石紀錄",
    "不完整",
    "推論",
    "資料界線",
    "U36",
    "U37",
    "U38"
  ],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["化石定義", "地層相對先後", "化石證據", "演化概念", "共同祖先", "證據支持範圍", "U36-U38 邊界"]
};

const formalBadgeCatalog = [
  ["fossils_evolution_entry", "地層證據入門", "完成 q01-q14 並提交 q15 回報。"],
  ["fossil_definition_reader", "化石定義判讀者", "q01 正確。"],
  ["fossil_formation_condition_keeper", "化石保存條件守門員", "q02 與 q03 正確。"],
  ["strata_relative_order_interpreter", "地層相對先後判讀者", "q04 正確。"],
  ["strata_sequence_sorter", "地層排序解謎者", "q05 順序正確。"],
  ["fossil_evidence_clue_mapper", "化石線索配對者", "q06 四項全對。"],
  ["fossil_record_limit_reasoner", "化石紀錄限制判讀者", "q07 與 q14 正確。"],
  ["evolution_population_time_reader", "演化時間尺度判讀者", "q08 正確。"],
  ["trait_change_evidence_reader", "特徵改變證據判讀者", "q09 正確。"],
  ["common_trait_branching_mapper", "共同特徵分支配對者", "q10 與 q11 正確。"],
  ["evolution_not_ladder_guard", "非進步階梯守門員", "q12 正確。"],
  ["u36_u37_u38_boundary_classifier", "U36-U38 邊界分類師", "q13 五項全對。"],
  ["fossils_evolution_flawless", "零提示全對：化石與演化證據判讀", "q01-q14 第一次提交全對且未使用提示。"],
  ["fossils_evolution_reflection_reporter", "高品質回報：化石與演化疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_fossils_evolution", "再挑戰進步：化石與演化", "合法重新登入再挑戰且 verified 後比前次進步。"]
];
const formalBadgeIds = formalBadgeCatalog.map(([id]) => id);
const badges = formalBadgeCatalog.map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const fossilEvidenceChoices = [
  { id: "feeding_clue", text: "食性線索" },
  { id: "movement_activity_clue", text: "移動或活動線索" },
  { id: "ancient_environment_clue", text: "古環境線索" },
  { id: "plant_form_clue", text: "植物形態線索" }
];

const commonTraitChoices = [
  { id: "shared_trait_clue", text: "共同特徵線索" },
  { id: "branch_specific_trait", text: "各類不同特徵" },
  { id: "unsupported_direct_parent_claim", text: "超出資料的直接親子說法" }
];

const strataSequenceSteps = [
  { id: "L1", label: "L1｜相對位置：最上方" },
  { id: "L2", label: "L2｜相對位置：中間" },
  { id: "L3", label: "L3｜相對位置：最下方" }
];

const unitBoundaryChoices = [
  { id: "u36_biotechnology", text: "第 36 站：生物技術" },
  { id: "u37_fossils_evolution", text: "第 37 站：化石與演化" },
  { id: "u38_naming_classification", text: "第 38 站：生物的命名與分類" },
  { id: "not_preclass_task", text: "不屬於課前任務" }
];

const questions = [
  { id: "fossils_evolution_q01", section: "checkpoint1", concept: "fossil_basic_definition", skill_tag: "fossil_basic_definition", type: "choice", answer: "fossil_is_past_life_trace", prompt: "下列哪個說法最符合「化石」的基本概念？", hint: "先看這個東西是否和過去生物留下的證據有關。", misconception: "fossil_definition_confusion", options: [ { id: "fossil_is_past_life_trace", text: "過去生物留下的遺體、遺跡或活動痕跡" }, { id: "any_beautiful_stone", text: "任何漂亮或奇特的石頭" }, { id: "modern_photo", text: "現代生物的照片" }, { id: "human_model_toy", text: "人類製作的古生物模型玩具" } ] },
  { id: "fossils_evolution_q02", section: "checkpoint1", concept: "fossil_formation_conditions", skill_tag: "fossil_formation_conditions", type: "choice", answer: "rapid_cover_less_destroyed_preservation", prompt: "哪個情境較可能讓生物遺體或痕跡保存成化石？", hint: "找出是否有較快覆蓋、較少破壞等保存條件。", misconception: "fossil_always_forms_confusion", options: [ { id: "rapid_cover_less_destroyed_preservation", text: "較快被沉積物覆蓋，且較少被破壞" }, { id: "long_exposure_destroyed", text: "長時間暴露在風化和分解作用中" }, { id: "fully_eaten_no_trace", text: "完全被吃掉或分解，沒有留下痕跡" }, { id: "large_animals_only", text: "只有大型動物才可能留下化石" } ] },
  { id: "fossils_evolution_q03", section: "checkpoint1", concept: "fossil_formation_conditions", skill_tag: "fossil_formation_conditions", type: "choice", answer: "fossil_requires_preservation_conditions", prompt: "有同學說：「只要生物死掉，就一定會形成化石。」哪個修正較合理？", hint: "想想死亡和保存成化石之間是否還需要其他條件。", misconception: "fossil_always_forms_confusion", options: [ { id: "fossil_requires_preservation_conditions", text: "需要遇到較適合保存的條件，才較可能形成化石" }, { id: "all_dead_become_fossils", text: "所有生物死後都一定成為化石" }, { id: "fossils_human_made", text: "化石只能由人類製造" }, { id: "dinosaurs_only_fossils", text: "只有恐龍才會形成化石" } ] },
  { id: "fossils_evolution_q04", section: "checkpoint2", concept: "relative_strata_order", skill_tag: "relative_strata_order", type: "choice", backend_type: "data_interpret", answer: "undisturbed_lower_layer_generally_older", prompt: "一份地層資料列出 L1 在最上方、L2 在中間、L3 在最下方，且未見翻轉或擾動線索。哪個相對先後判斷較合理？", hint: "先看資料中的相對位置與地層狀態，再判斷相對先後。", misconception: "strata_order_without_condition_confusion", options: [ { id: "undisturbed_lower_layer_generally_older", text: "L3 通常較早形成" }, { id: "l1_always_oldest", text: "L1 一定最早形成" }, { id: "layers_same_time", text: "三層必定同時形成" }, { id: "exact_year_calculation", text: "這份資料可以算出精確年份" } ] },
  { id: "fossils_evolution_q05", section: "checkpoint2", concept: "relative_strata_order", skill_tag: "relative_strata_order", type: "sequence", answer: ["L3", "L2", "L1"], prompt: "依未受擾動地層位置，將 L1、L2、L3 由較早到較晚排序。", hint: "先看三個地層的相對位置，再由較早到較晚排列。", misconception: "relative_absolute_age_confusion", steps: strataSequenceSteps },
  { id: "fossils_evolution_q06", section: "checkpoint3", concept: "fossil_as_evidence", skill_tag: "fossil_as_evidence", type: "mapping", answer: { tooth_shape_fossil: "feeding_clue", footprint_track_fossil: "movement_activity_clue", marine_shell_in_rock: "ancient_environment_clue", leaf_imprint_fossil: "plant_form_clue" }, prompt: "把化石資料和它較能提供的線索配對。", hint: "先看每種化石資料呈現的是形狀、痕跡、環境或植物形態。", misconception: "fossil_evidence_type_confusion", items: [ { id: "tooth_shape_fossil", label: "牙齒形狀化石" }, { id: "footprint_track_fossil", label: "足跡痕跡化石" }, { id: "marine_shell_in_rock", label: "岩石中的海生貝類化石" }, { id: "leaf_imprint_fossil", label: "葉片印痕化石" } ], choices: fossilEvidenceChoices },
  { id: "fossils_evolution_q07", section: "checkpoint3", concept: "incomplete_fossil_record", skill_tag: "incomplete_fossil_record", type: "choice", answer: "limited_fossil_record_cautious_inference", prompt: "如果某一時期找到的化石很少，哪個說法較合理？", hint: "想想證據較少時，推論要保留哪些限制。", misconception: "fossil_record_useless_confusion", options: [ { id: "limited_fossil_record_cautious_inference", text: "目前證據有限，推論時需要保留限制" }, { id: "no_reasonable_inference", text: "完全不能提出任何合理推論" }, { id: "no_life_at_that_time", text: "一定代表當時完全沒有生物" }, { id: "invent_missing_species", text: "可以直接補上想像中的物種" } ] },
  { id: "fossils_evolution_q08", section: "checkpoint4", concept: "evolution_population_time", skill_tag: "evolution_population_time", type: "choice", answer: "evolution_population_change_over_time", prompt: "哪個說法較符合七年級對演化的理解？", hint: "留意是族群在長時間中的改變，不是單一個體立刻改變。", misconception: "individual_effort_evolution_confusion", options: [ { id: "evolution_population_change_over_time", text: "生物族群在長時間中累積改變" }, { id: "individual_effort_change_species", text: "單一個體努力就能在一生中變成另一種生物" }, { id: "modern_always_higher", text: "現代生物一定比古代生物高等" }, { id: "pretty_fossil_story", text: "演化只是在說漂亮的古生物故事" } ] },
  { id: "fossils_evolution_q09", section: "checkpoint4", concept: "trait_change_over_time", skill_tag: "trait_change_over_time", type: "choice", backend_type: "data_interpret", answer: "fossil_traits_differ_across_layers", prompt: "三個地層中的化石形態資料顯示某構造在不同相對位置的地層中有所差異。這份資料較能支持哪種判斷？", hint: "先讀表中相對位置與形態描述，再判斷資料可支持的範圍。", misconception: "evidence_overclaim_confusion", options: [ { id: "fossil_traits_differ_across_layers", text: "某些特徵在不同相對位置的地層中有差異，可作為長時間改變的線索" }, { id: "single_individual_changed_now", text: "單一個體在現場立刻改變" }, { id: "exact_years_for_each_fossil", text: "可以算出每個化石的精確年份" }, { id: "direct_parent_child_proof", text: "能直接證明完整親子關係" } ] },
  { id: "fossils_evolution_q10", section: "checkpoint4", concept: "common_ancestor_branching", skill_tag: "common_ancestor_branching", type: "mapping", answer: { both_have_segmented_support: "shared_trait_clue", a_has_wide_tail_plate: "branch_specific_trait", b_has_long_tail_spine: "branch_specific_trait", a_modern_parent_of_b: "unsupported_direct_parent_claim" }, prompt: "根據共同特徵比較卡，把下列資料放到較合適的線索類別。", hint: "先比較卡片中的共同描述、各自不同描述，以及是否超出資料。", misconception: "common_ancestor_direct_parent_confusion", items: [ { id: "both_have_segmented_support", label: "A 類與 B 類都有相似的分節支撐構造。" }, { id: "a_has_wide_tail_plate", label: "A 類另有寬尾板。" }, { id: "b_has_long_tail_spine", label: "B 類另有長尾刺。" }, { id: "a_modern_parent_of_b", label: "A 類現代個體一定生下 B 類現代個體。" } ], choices: commonTraitChoices },
  { id: "fossils_evolution_q11", section: "checkpoint4", concept: "evidence_limit_boundary", skill_tag: "evidence_limit_boundary", type: "choice", answer: "single_fossil_not_direct_parent_child_proof", prompt: "有同學說：「找到一個化石，就能直接證明它是某現代生物的爸爸或媽媽。」哪個修正較合理？", hint: "先想單一化石可以提供線索，還是能直接證明完整親子關係。", misconception: "single_fossil_parent_child_confusion", options: [ { id: "single_fossil_not_direct_parent_child_proof", text: "化石可提供關係線索，但單一化石不能直接證明完整親子關係" }, { id: "always_direct_parent_child", text: "一定能證明直接親子關係" }, { id: "fossils_no_value", text: "化石完全沒有任何研究價值" }, { id: "looks_alike_parent", text: "只要長得像就必定是親代" } ] },
  { id: "fossils_evolution_q12", section: "checkpoint4", concept: "evolution_not_progress_ladder", skill_tag: "evolution_not_progress_ladder", type: "choice", answer: "evolution_not_progress_ladder", prompt: "有同學說：「現在的生物一定比古代生物高等。」哪個修正較合理？", hint: "留意題目是不是把演化誤看成高低排行榜。", misconception: "evolution_progress_ladder_confusion", options: [ { id: "evolution_not_progress_ladder", text: "演化不是高低等級排行榜，而是長時間中的特徵變化" }, { id: "modern_all_perfect", text: "現代生物一定都比較完美" }, { id: "ancient_all_worse", text: "古代生物一定都比較差" }, { id: "only_humans_evolve", text: "只有人類會演化" } ] },
  { id: "fossils_evolution_q13", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "mapping", answer: { gene_transfer_application: "u36_biotechnology", strata_fossil_evidence: "u37_fossils_evolution", binomial_classification_task: "u38_naming_classification", religion_value_debate: "not_preclass_task", radiometric_age_calculation: "not_preclass_task" }, prompt: "把下列學習任務放到最合適的處理位置。", hint: "先判斷任務是在看生物技術、化石演化、命名分類，還是超出課前任務。", misconception: "u36_u37_u38_boundary_confusion", items: [ { id: "gene_transfer_application", label: "基因轉殖技術應用" }, { id: "strata_fossil_evidence", label: "地層與化石證據判讀" }, { id: "binomial_classification_task", label: "二名法與分類階層任務" }, { id: "religion_value_debate", label: "宗教或價值立場辯論" }, { id: "radiometric_age_calculation", label: "放射性定年計算" } ], choices: unitBoundaryChoices },
  { id: "fossils_evolution_q14", section: "checkpoint3", concept: "evidence_limit_boundary", skill_tag: "evidence_limit_boundary", type: "choice", backend_type: "data_interpret", answer: "evidence_supports_limited_relative_trait_inference", prompt: "一份資料只有三層地層的相對位置與化石外形比較。最合理的結論界線是什麼？", hint: "先確認資料實際包含哪些項目，再判斷結論可到哪個範圍。", misconception: "evidence_overclaim_confusion", options: [ { id: "evidence_supports_limited_relative_trait_inference", text: "可支持相對先後與外形差異的初步推論" }, { id: "complete_tree_exact_year_parent", text: "可直接推出完整演化樹、精確年份與親子關係" }, { id: "incomplete_so_useless", text: "因為資料不完整，所以完全不能看" }, { id: "biotech_safety_judgment", text: "可用來判斷生物技術安全" } ] }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["fossils_evolution_q01", "fossils_evolution_q02", "fossils_evolution_q03"],
  checkpoint2: ["fossils_evolution_q04", "fossils_evolution_q05"],
  checkpoint3: ["fossils_evolution_q06", "fossils_evolution_q07", "fossils_evolution_q14"],
  checkpoint4: ["fossils_evolution_q08", "fossils_evolution_q09", "fossils_evolution_q10", "fossils_evolution_q11", "fossils_evolution_q12", "fossils_evolution_q13"]
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
    return `<div class="u36-scene-neutral" role="img" aria-label="${escapeHtml(alt || "化石與演化中性任務場景")}">
      <span class="u36-scene-strand"></span>
      <span class="u36-scene-card">地層資料</span>
      <span class="u36-scene-card">化石形態</span>
      <span class="u36-scene-card">共同特徵</span>
      <span class="u36-scene-card">觀察範圍</span>
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
    ${renderScenePicture(prefix, alt || "化石與演化中性任務場景")}
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
  if (question.id !== "fossils_evolution_q05" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
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
    state.optionOrders[key] = avoidMappingOrderCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${key}`), ids);
  }
  const source = Object.fromEntries(question.items.map((item) => [item.id, item]));
  return state.optionOrders[key].map((id) => source[id]).filter(Boolean);
}

function orderedMappingChoices(question) {
  const key = `${question.id}_choices`;
  if (!state.optionOrders[key]) {
    const ids = question.choices.map((choice) => choice.id);
    state.optionOrders[key] = avoidMappingOrderCollision(question, stableShuffle(ids, `${state.attempt_id || VERSION}-${key}`), Object.values(question.answer || {}));
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
  const attemptId = uid("fossils_evolution_guest_attempt");
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
  earned.push("fossils_evolution_entry");
  if (passed(["fossils_evolution_q01"])) earned.push("fossil_definition_reader");
  if (passed(["fossils_evolution_q02", "fossils_evolution_q03"])) earned.push("fossil_formation_condition_keeper");
  if (passed(["fossils_evolution_q04"])) earned.push("strata_relative_order_interpreter");
  if (passed(["fossils_evolution_q05"])) earned.push("strata_sequence_sorter");
  if (passed(["fossils_evolution_q06"])) earned.push("fossil_evidence_clue_mapper");
  if (passed(["fossils_evolution_q07", "fossils_evolution_q14"])) earned.push("fossil_record_limit_reasoner");
  if (passed(["fossils_evolution_q08"])) earned.push("evolution_population_time_reader");
  if (passed(["fossils_evolution_q09"])) earned.push("trait_change_evidence_reader");
  if (passed(["fossils_evolution_q10", "fossils_evolution_q11"])) earned.push("common_trait_branching_mapper");
  if (passed(["fossils_evolution_q12"])) earned.push("evolution_not_ladder_guard");
  if (passed(["fossils_evolution_q13"])) earned.push("u36_u37_u38_boundary_classifier");
  if (flawless) earned.push("fossils_evolution_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("fossils_evolution_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_fossils_evolution");
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
  if (["fossils_evolution_q01", "fossils_evolution_q02", "fossils_evolution_q03"].includes(questionId)) return "fossil_basic_model";
  if (["fossils_evolution_q04", "fossils_evolution_q05"].includes(questionId)) return "strata_relative_order";
  if (["fossils_evolution_q06", "fossils_evolution_q07", "fossils_evolution_q14"].includes(questionId)) return "fossil_evidence_reasoning";
  if (["fossils_evolution_q08", "fossils_evolution_q09", "fossils_evolution_q10", "fossils_evolution_q11", "fossils_evolution_q12"].includes(questionId)) return "evolution_basic_model";
  if (["fossils_evolution_q13"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  if (questionId === "fossils_evolution_q13") return "fossils_cp5_unit_boundary";
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "fossils_cp1_fossil_basics",
    checkpoint2: "fossils_cp2_strata_order",
    checkpoint3: "fossils_cp3_fossil_evidence",
    checkpoint4: "fossils_cp4_evolution_basics"
  }[section] || "fossils_cp6_reflection";
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
        <h2 class="hero-title">化石與演化</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene fossils_evolution-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "化石與演化中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用中性地層表、化石資料卡與共同特徵卡，練習化石概念、相對先後、演化基礎與證據支持範圍。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入化石與演化任務前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "化石與演化準備場景" })}<div><h3>讀資料時先看地層位置、化石形態、共同特徵與資料範圍。</h3><p>本任務只使用匿名模型與觀察資料，不要求任何真實年代計算、家庭資料、宗教或價值立場辯論。</p></div></div><div class="concept-grid"><article><strong>化石概念</strong><p>判斷是否為過去生物留下的遺體、遺跡或活動痕跡。</p></article><article><strong>地層資料</strong><p>讀取相對位置與未受擾動線索，練習相對先後排序。</p></article><article><strong>證據判讀</strong><p>比較化石形態、活動痕跡與共同特徵，避免超出資料。</p></article><article><strong>任務邊界</strong><p>分清 U36 生物技術、U37 化石與演化、U38 命名分類。</p></article></div><button class="primary" data-next="checkpoint1">開始化石與演化任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["化石概念與保存條件", "確認化石定義、形成條件與常見迷思修正。"],
    checkpoint2: ["地層相對先後", "讀取地層相對位置資料，完成唯一標準排序。"],
    checkpoint3: ["化石資料與證據界線", "把化石資料配對到可支持的線索，並保留證據限制。"],
    checkpoint4: ["演化基礎、共同特徵與單元邊界", "判讀長時間特徵變化、共同特徵資料與 U36-U38 邊界。"]
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
    fossil_basic_definition: "化石基本概念",
    fossil_formation_conditions: "化石形成條件",
    relative_strata_order: "地層相對先後",
    fossil_as_evidence: "化石證據線索",
    incomplete_fossil_record: "化石紀錄限制",
    evolution_population_time: "族群長時間改變",
    trait_change_over_time: "形態資料判讀",
    common_ancestor_branching: "共同特徵與分支",
    evidence_limit_boundary: "證據支持範圍",
    evolution_not_progress_ladder: "演化不是等級階梯",
    unit_boundary_control: "單元邊界",
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "fossils_evolution_q04" || qid === "fossils_evolution_q05") return "";
  if (qid === "fossils_evolution_q09") return `<div class="evidence-card evidence-table-card fossil-trait-evidence" role="group" aria-label="資料表列出三個地層位置與其中化石的可觀察形態特徵。"><strong>化石形態資料</strong><div class="fossil-data-table" role="table" aria-label="地層位置與化石形態資料表"><div role="row"><span role="columnheader">地層代碼</span><span role="columnheader">相對位置</span><span role="columnheader">化石代碼</span><span role="columnheader">可觀察形態</span></div><div role="row"><span role="cell">L3</span><span role="cell">下方</span><span role="cell">F3</span><span role="cell">殼紋較少</span></div><div role="row"><span role="cell">L2</span><span role="cell">中間</span><span role="cell">F2</span><span role="cell">殼紋中等</span></div><div role="row"><span role="cell">L1</span><span role="cell">上方</span><span role="cell">F1</span><span role="cell">殼紋較多</span></div></div><p class="muted">資料表列出三個地層位置與其中化石的可觀察形態特徵。</p></div>`;
  if (qid === "fossils_evolution_q10") return `<div class="evidence-card fossil-comparison-cards" role="group" aria-label="卡片列出兩類模型生物的共同特徵與不同特徵描述。"><strong>共同特徵比較卡</strong><div class="fossil-card-grid"><article><span class="model-field-label">資料 A</span><span class="model-field-value">A 類與 B 類都有相似的分節支撐構造。</span></article><article><span class="model-field-label">資料 B</span><span class="model-field-value">A 類另有寬尾板。</span></article><article><span class="model-field-label">資料 C</span><span class="model-field-value">B 類另有長尾刺。</span></article><article><span class="model-field-label">資料 D</span><span class="model-field-value">A 類現代個體一定生下 B 類現代個體。</span></article></div><p class="muted">卡片列出兩類模型生物的共同特徵與不同特徵描述。</p></div>`;
  if (qid === "fossils_evolution_q14") return `<div class="evidence-card fossil-limit-cards" role="group" aria-label="資料卡列出一組地層與化石外形比較資料。"><strong>證據資料卡</strong><div class="fossil-card-grid"><article><span class="model-field-label">資料組</span><span class="model-field-value">E1</span></article><article><span class="model-field-label">資料項目</span><span class="model-field-value">三層地層的相對位置、三個化石代碼、三項外形描述</span></article><article><span class="model-field-label">觀察範圍</span><span class="model-field-value">同一地點的三層地層資料</span></article><article><span class="model-field-label">可見紀錄</span><span class="model-field-value">地層相對位置與化石外形比較</span></article></div><p class="muted">資料卡列出一組地層與化石外形比較資料。</p></div>`;
  return "";
}

function renderCheckpointEvidence(section) {
  if (section === "checkpoint2") return `<section class="panel checkpoint-evidence-panel"><div class="evidence-card evidence-table-card fossil-strata-evidence" role="group" aria-label="資料表列出三個地層代碼、相對位置、地層狀態與化石代碼。"><strong>地層位置資料</strong><div class="fossil-data-table" role="table" aria-label="三個地層的相對位置資料表"><div role="row"><span role="columnheader">地層代碼</span><span role="columnheader">相對位置</span><span role="columnheader">地層狀態</span><span role="columnheader">化石代碼</span></div><div role="row"><span role="cell">L1</span><span role="cell">最上方</span><span role="cell">未見翻轉或擾動線索</span><span role="cell">F1</span></div><div role="row"><span role="cell">L2</span><span role="cell">中間</span><span role="cell">未見翻轉或擾動線索</span><span role="cell">F2</span></div><div role="row"><span role="cell">L3</span><span role="cell">最下方</span><span role="cell">未見翻轉或擾動線索</span><span role="cell">F3</span></div></div><p class="muted">資料表列出三個地層代碼、相對位置、地層狀態與化石代碼。</p></div></section>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的化石與演化判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的化石、地層、演化基礎、共同特徵與證據支持範圍。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  fossil_definition_confusion: "建議再確認化石基本概念：重點是過去生物留下的遺體、遺跡或活動痕跡。",
  fossil_always_forms_confusion: "建議再確認形成條件：生物死亡不等於一定形成化石，仍需要較適合保存的條件。",
  strata_order_without_condition_confusion: "建議再確認地層相對先後：需同時看相對位置與是否有擾動線索。",
  relative_absolute_age_confusion: "建議再確認相對先後與精確年代的差別：本任務只做相對排序。",
  fossil_evidence_type_confusion: "建議再確認不同化石資料能提供的線索種類。",
  fossil_record_useless_confusion: "建議再確認化石紀錄不完整時仍可提出有限且謹慎的推論。",
  individual_effort_evolution_confusion: "建議再確認演化是族群在長時間中的改變，不是單一個體一生內努力改變。",
  evidence_overclaim_confusion: "建議再確認資料支持範圍：不能把有限資料推出完整親子關係、精確年代或完整演化樹。",
  common_ancestor_direct_parent_confusion: "建議再確認共同特徵與直接親子關係的差別。",
  single_fossil_parent_child_confusion: "建議再確認單一化石提供的是關係線索，不是完整親子證明。",
  evolution_progress_ladder_confusion: "建議再確認演化不是高低等級排行榜。",
  u36_u37_u38_boundary_confusion: "建議再確認 U36、U37、U38 與非課前任務的邊界。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從化石、地層、相對先後、演化、共同祖先、分支、證據支持範圍或 U36-U38 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：化石是過去生物留下的證據"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認化石形態資料能支持到哪個推論範圍。">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "化石與演化結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>化石與演化任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與化石、地層、相對先後、演化、共同特徵、證據支持範圍或 U36-U38 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__fossilsEvolutionTest = {
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
