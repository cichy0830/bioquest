const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260817-abo-blood-type-local-functional-v1";
const QUESTION_VERSION = "20260817-abo-blood-type-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_abo_blood_type_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_abo_blood_type_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "abo_blood_type",
  "unit_title": "人類的 ABO 血型遺傳",
  "mission_title": "ABO 血型模型判讀任務",
  "mission_area": "生命延續資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  abo_blood_type_q01: 15,
  abo_blood_type_q02: 18,
  abo_blood_type_q03: 15,
  abo_blood_type_q04: 15,
  abo_blood_type_q05: 16,
  abo_blood_type_q06: 18,
  abo_blood_type_q07: 15,
  abo_blood_type_q08: 15,
  abo_blood_type_q09: 16,
  abo_blood_type_q10: 15,
  abo_blood_type_q11: 15,
  abo_blood_type_q12: 15,
  abo_blood_type_q13: 17,
  abo_blood_type_q14: 15
};
const revisionExpWeights = {
  abo_blood_type_q01: 13,
  abo_blood_type_q02: 15,
  abo_blood_type_q03: 12,
  abo_blood_type_q04: 12,
  abo_blood_type_q05: 13,
  abo_blood_type_q06: 15,
  abo_blood_type_q07: 12,
  abo_blood_type_q08: 12,
  abo_blood_type_q09: 13,
  abo_blood_type_q10: 12,
  abo_blood_type_q11: 13,
  abo_blood_type_q12: 12,
  abo_blood_type_q13: 14,
  abo_blood_type_q14: 12
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/abo_blood_type/badge-abo_blood_type-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: [
    "ABO",
    "血型",
    "等位基因",
    "I^A",
    "I^B",
    "i",
    "基因型",
    "表現型",
    "共同顯性",
    "隱性",
    "棋盤方格",
    "可能",
    "不可能",
    "匿名模型",
    "倫理邊界"
  ],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["人類性狀", "基因型", "表現型", "顯性", "隱性", "體染色體", "性染色體", "匿名資料", "U34 邊界", "U35 邊界"]
};

const badges = [
  ["abo_blood_type_entry", "ABO 模型入門", "完成 q01-q14 並提交 q15 回報。"],
  ["abo_allele_model_reader", "等位基因模型判讀者", "q01、q03、q04 正確。"],
  ["abo_genotype_phenotype_mapper", "基因型表現型配對者", "q02 六項全對。"],
  ["abo_phenotype_ambiguity_reader", "表現型線索判讀者", "q07 正確。"],
  ["abo_punnett_possibility_reader", "棋盤可能性判讀者", "q05、q08、q10 正確。"],
  ["abo_punnett_grid_mapper", "棋盤方格組合師", "q06 四格全對。"],
  ["abo_probability_boundary_guard", "機率邊界守門員", "q09 正確。"],
  ["abo_anonymous_ethics_guard", "匿名模型倫理守門員", "q11 正確。"],
  ["abo_scope_boundary_guard", "醫療延伸邊界守門員", "q12 正確。"],
  ["u33_u34_u35_boundary_classifier", "遺傳站序分類師", "q13 四項全對。"],
  ["abo_model_not_parentage_guard", "模型不等於親子結論", "q14 正確。"],
  ["abo_misconception_reviser", "迷思修正者：ABO", "至少 2 題提示後修正成功且 final correct。"],
  ["abo_blood_type_flawless", "零提示全對：ABO 模型", "q01-q14 第一次提交全對且未使用提示。"],
  ["abo_blood_type_reflection_reporter", "高品質回報：ABO 疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_abo_blood_type", "再挑戰進步：ABO 模型", "合法重新登入再挑戰且 verified 後比前次進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const phenotypeChoices = [
  { id: "phenotype_a", text: "A 型" },
  { id: "phenotype_b", text: "B 型" },
  { id: "phenotype_ab", text: "AB 型" },
  { id: "phenotype_o", text: "O 型" }
];

const genotypeChoices = [
  { id: "geno_ia_ib", text: "I^AI^B" },
  { id: "geno_ia_i", text: "I^Ai" },
  { id: "geno_ib_i", text: "I^Bi" },
  { id: "geno_i_i", text: "ii" }
];

const unitBoundaryChoices = [
  { id: "u33_human_genetics", text: "第 33 站：人類性狀與基因型/表現型" },
  { id: "u34_abo_blood_type", text: "第 34 站：ABO 血型可能性" },
  { id: "u35_mutation_genetic_disease", text: "第 35 站：突變與遺傳疾病" },
  { id: "not_preclass_model_task", text: "不屬於課前模型任務" }
];

const questions = [
  { id: "abo_blood_type_q01", section: "checkpoint1", concept: "abo_alleles", skill_tag: "abo_alleles", type: "choice", answer: "abo_alleles_three_types", prompt: "下列哪一個說法最符合 ABO 血型遺傳的簡化模型？", hint: "先判斷這個說法是不是在描述等位基因模型，不要把表現型、醫療用途混在一起。", misconception: "allele_model_overgeneralized", options: [ { id: "abo_alleles_three_types", text: "ABO 可用 I^A、I^B、i 三種等位基因描述" }, { id: "a_type_only_iaia", text: "A 型一定只有 I^AI^A" }, { id: "o_type_no_alleles", text: "O 型代表沒有等位基因" }, { id: "abo_diagnoses_disease", text: "ABO 血型可直接用來診斷疾病" } ] },
  { id: "abo_blood_type_q02", section: "checkpoint2", concept: "abo_genotype_phenotype", skill_tag: "abo_genotype_phenotype", type: "mapping", answer: { geno_ia_ia: "phenotype_a", geno_ia_i: "phenotype_a", geno_ib_ib: "phenotype_b", geno_ib_i: "phenotype_b", geno_ia_ib: "phenotype_ab", geno_i_i: "phenotype_o" }, prompt: "把下列 ABO 基因型配到最合適的血型表現。", hint: "看看兩個等位基因中是否有 I^A、I^B，以及是否只有 i。", misconception: "phenotype_genotype_one_to_one", items: [ { id: "geno_ia_ia", label: "I^AI^A" }, { id: "geno_ia_i", label: "I^Ai" }, { id: "geno_ib_ib", label: "I^BI^B" }, { id: "geno_ib_i", label: "I^Bi" }, { id: "geno_ia_ib", label: "I^AI^B" }, { id: "geno_i_i", label: "ii" } ], choices: phenotypeChoices },
  { id: "abo_blood_type_q03", section: "checkpoint1", concept: "abo_codominance", skill_tag: "abo_codominance", type: "choice", answer: "ia_ib_codominant_ab", prompt: "某人的 ABO 基因型是 I^AI^B，在簡化模型中最可能表現為哪一種血型？", hint: "留意 I^A 和 I^B 在一起時，是否會其中一個完全蓋過另一個。", misconception: "codominance_as_dominance", options: [ { id: "phenotype_a_only", text: "A 型" }, { id: "phenotype_b_only", text: "B 型" }, { id: "ia_ib_codominant_ab", text: "AB 型" }, { id: "phenotype_o_only", text: "O 型" } ] },
  { id: "abo_blood_type_q04", section: "checkpoint1", concept: "abo_recessive_i", skill_tag: "abo_recessive_i", type: "choice", answer: "ii_phenotype_o", prompt: "下列哪一個基因型在 ABO 簡化模型中表現為 O 型？", hint: "先找出兩個等位基因是否都沒有 I^A 或 I^B 的表現。", misconception: "o_type_no_gene_or_any_i", options: [ { id: "iaib_phenotype_o", text: "I^AI^B" }, { id: "iai_phenotype_o", text: "I^Ai" }, { id: "ibi_phenotype_o", text: "I^Bi" }, { id: "ii_phenotype_o", text: "ii" } ] },
  { id: "abo_blood_type_q05", section: "checkpoint3", concept: "abo_punnett_square", skill_tag: "abo_punnett_square", type: "choice", backend_type: "data_interpret", answer: "ii_x_iaib_possible_a_or_b", prompt: "匿名模型資料顯示：一方基因型為 ii，另一方為 I^AI^B。依棋盤方格，子代可能出現哪些血型？", hint: "先看 ii 只能提供哪一種等位基因，再看另一方能提供哪兩種。", misconception: "parent_phenotype_direct_copy", options: [ { id: "ii_x_iaib_possible_a_or_b", text: "只可能 A 或 B" }, { id: "ii_x_iaib_possible_ab_or_o", text: "只可能 AB 或 O" }, { id: "ii_x_iaib_all_equal", text: "四種血型都一樣可能" }, { id: "ii_x_iaib_only_o", text: "一定只有 O" } ] },
  { id: "abo_blood_type_q06", section: "checkpoint3", concept: "abo_punnett_square", skill_tag: "abo_punnett_square", type: "mapping", backend_type: "grid_mapping", answer: { cell_top_ia_side_ib: "geno_ia_ib", cell_top_ia_side_i: "geno_ia_i", cell_top_i_side_ib: "geno_ib_i", cell_top_i_side_i: "geno_i_i" }, prompt: "完成匿名模型的棋盤方格：一方提供 I^A 或 i，另一方提供 I^B 或 i。", hint: "每格只把該欄與該列各一個等位基因合在一起，不需要先算百分比。", misconception: "punnett_cell_combination_error", items: [ { id: "cell_top_ia_side_ib", label: "欄 I^A，列 I^B" }, { id: "cell_top_ia_side_i", label: "欄 I^A，列 i" }, { id: "cell_top_i_side_ib", label: "欄 i，列 I^B" }, { id: "cell_top_i_side_i", label: "欄 i，列 i" } ], choices: genotypeChoices },
  { id: "abo_blood_type_q07", section: "checkpoint2", concept: "abo_genotype_phenotype", skill_tag: "abo_genotype_phenotype", type: "choice", answer: "phenotype_a_two_possible_genotypes", prompt: "只知道某位匿名個案的表現型是 A 型。下列哪個判斷最合理？", hint: "先想 A 型是否只有一種基因型。", misconception: "phenotype_as_exact_genotype", options: [ { id: "phenotype_a_two_possible_genotypes", text: "可能是 I^AI^A 或 I^Ai" }, { id: "phenotype_a_must_iaia", text: "一定是 I^AI^A" }, { id: "phenotype_a_must_ib", text: "一定帶有 I^B" }, { id: "phenotype_a_family_relation", text: "一定能推出家族關係" } ] },
  { id: "abo_blood_type_q08", section: "checkpoint3", concept: "abo_possible_impossible", skill_tag: "abo_possible_impossible", type: "choice", backend_type: "data_interpret", answer: "iaia_x_ii_only_a_supported", prompt: "匿名模型中，一方是 I^AI^A，另一方是 ii。依此資料，哪個子代表現型被模型支持？", hint: "把每個親代能提供的等位基因先列出，再組合子代基因型。", misconception: "single_parent_type_decides_child", options: [ { id: "iaia_x_ii_only_a_supported", text: "A 型" }, { id: "iaia_x_ii_b_supported", text: "B 型" }, { id: "iaia_x_ii_ab_supported", text: "AB 型" }, { id: "iaia_x_ii_o_supported", text: "O 型" } ] },
  { id: "abo_blood_type_q09", section: "checkpoint3", concept: "abo_probability_boundary", skill_tag: "abo_probability_boundary", type: "choice", backend_type: "data_interpret", answer: "probability_not_family_quota", prompt: "某棋盤方格中，四格之一為 ii。對「25%」的理解，哪一句最適合七年級課前檢核？", hint: "分辨模型中的可能比例和真實家庭一定照順序發生是否相同。", misconception: "probability_as_fixed_family_quota", options: [ { id: "probability_not_family_quota", text: "代表模型中每一次子代都有可能出現 O 型，但不是保證四個孩子剛好一個 O 型" }, { id: "every_four_one_o", text: "代表每四個孩子一定一個 O 型" }, { id: "first_child_o", text: "代表第一個孩子一定是 O 型" }, { id: "o_type_healthier", text: "代表 O 型一定比較健康" } ] },
  { id: "abo_blood_type_q10", section: "checkpoint3", concept: "abo_possible_impossible", skill_tag: "abo_possible_impossible", type: "choice", answer: "a_phenotype_needs_genotype_for_o", prompt: "只知道兩位匿名親代都表現為 A 型，想判斷是否可能出現 O 型子代。哪個說法最合理？", hint: "先確認題目給的是表現型還是完整基因型。", misconception: "phenotype_only_overclaim", options: [ { id: "a_phenotype_needs_genotype_for_o", text: "需要知道兩人是否都帶有 i，只有 A 型表現型不足以判斷" }, { id: "a_never_carries_i", text: "一定不可能，因為 A 型不會帶 i" }, { id: "all_a_carry_i", text: "一定可能，因為所有 A 型都帶 i" }, { id: "a_parentage_decision", text: "可以直接拿來判定真實親子關係" } ] },
  { id: "abo_blood_type_q11", section: "checkpoint4", concept: "abo_ethics_boundary", skill_tag: "abo_ethics_boundary", type: "choice", answer: "anonymous_model_no_parentage_medical", prompt: "在課堂使用 ABO 遺傳模型資料時，哪一種做法最符合本單元的學習目的？", hint: "想想本單元是在練習遺傳模型，還是在做真實身分或醫療判斷。", misconception: "blood_type_as_identity_or_medical_tool", options: [ { id: "anonymous_model_no_parentage_medical", text: "使用匿名、假設的模型資料練習可能/不可能推論" }, { id: "publish_real_blood_type", text: "要求同學公開自己的血型" }, { id: "judge_real_parentage", text: "用血型判斷真實親子關係" }, { id: "decide_transfusion", text: "用血型決定輸血方式" } ] },
  { id: "abo_blood_type_q12", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "choice", answer: "rh_transfusion_not_u34", prompt: "下列哪個主題不屬於本單元的課前檢核範圍？", hint: "找出哪一項已經離開 ABO 遺傳簡化模型而進入醫療或延伸內容。", misconception: "scope_creep_rh_transfusion", options: [ { id: "rh_transfusion_not_u34", text: "Rh 因子與輸血醫療判斷" }, { id: "abo_allele_basic", text: "I^A、I^B、i 的基本關係" }, { id: "a_type_two_genotypes", text: "A 型可能有兩種基因型" }, { id: "anonymous_punnett_reasoning", text: "匿名棋盤方格中的可能/不可能推論" } ] },
  { id: "abo_blood_type_q13", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "mapping", answer: { human_trait_genotype_phenotype_basic: "u33_human_genetics", abo_punnett_possibility: "u34_abo_blood_type", mutation_genetic_disease: "u35_mutation_genetic_disease", real_parentage_or_transfusion_decision: "not_preclass_model_task" }, prompt: "把下列學習任務放到最合適的處理位置。", hint: "先判斷任務是在講一般人類性狀、ABO 模型、突變疾病，還是真實身分或醫療判斷。", misconception: "unit_boundary_mixing", items: [ { id: "human_trait_genotype_phenotype_basic", label: "人類性狀、基因型與表現型基礎" }, { id: "abo_punnett_possibility", label: "ABO 棋盤方格可能性" }, { id: "mutation_genetic_disease", label: "突變與遺傳疾病" }, { id: "real_parentage_or_transfusion_decision", label: "真實親子或輸血判斷" } ], choices: unitBoundaryChoices },
  { id: "abo_blood_type_q14", section: "checkpoint4", concept: "abo_possible_impossible", skill_tag: "abo_possible_impossible", type: "choice", answer: "model_not_supported_not_parentage", prompt: "匿名模型資料顯示：一方 ii，另一方 I^AI^B。若有人說「這組資料支持 O 型子代」，哪一句修正最合適？", hint: "看看這句話是否同時做到兩件事：根據模型修正推論，並守住倫理邊界。", misconception: "model_impossible_as_real_world_verdict", options: [ { id: "model_not_supported_not_parentage", text: "在此簡化模型下，O 型子代不被資料支持；但不能拿來下真實親子結論" }, { id: "proves_not_biological_child", text: "這證明某人不是親生" }, { id: "decides_transfusion_choice", text: "這可以決定輸血選擇" }, { id: "o_type_is_disease", text: "這代表 O 型是一種疾病" } ] }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["abo_blood_type_q01", "abo_blood_type_q03", "abo_blood_type_q04"],
  checkpoint2: ["abo_blood_type_q02", "abo_blood_type_q07"],
  checkpoint3: ["abo_blood_type_q05", "abo_blood_type_q06", "abo_blood_type_q08", "abo_blood_type_q09", "abo_blood_type_q10"],
  checkpoint4: ["abo_blood_type_q11", "abo_blood_type_q12", "abo_blood_type_q13", "abo_blood_type_q14"]
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
    return `<div class="u34-scene-neutral" role="img" aria-label="${escapeHtml(alt || "人類的 ABO 血型遺傳中性任務場景")}">
      <span class="u34-scene-strand"></span>
      <span class="u34-scene-card">匿名資料</span>
      <span class="u34-scene-card">基因型</span>
      <span class="u34-scene-card">表現型</span>
      <span class="u34-scene-card">棋盤方格</span>
    </div>`;
  }
  return `<picture class="u34-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u34-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u34-page-scene u34-${prefix}-scene ${className}" data-u34-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "人類的 ABO 血型遺傳任務場景")}
    ${azhe ? `<img class="u34-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u34-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl && owlSrc ? `<img class="u34-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u34-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
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
  if (question.id !== "abo_blood_type_q04" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
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
  const attemptId = uid("abo_blood_type_guest_attempt");
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
  const correctedCore = logs.filter((log) => log.is_correct && log.hint_used && log.misconception_tag).length >= 2;
  const earned = [];
  earned.push("abo_blood_type_entry");
  if (passed(["abo_blood_type_q01", "abo_blood_type_q03", "abo_blood_type_q04"])) earned.push("abo_allele_model_reader");
  if (passed(["abo_blood_type_q02"])) earned.push("abo_genotype_phenotype_mapper");
  if (passed(["abo_blood_type_q07"])) earned.push("abo_phenotype_ambiguity_reader");
  if (passed(["abo_blood_type_q05", "abo_blood_type_q08", "abo_blood_type_q10"])) earned.push("abo_punnett_possibility_reader");
  if (passed(["abo_blood_type_q06"])) earned.push("abo_punnett_grid_mapper");
  if (passed(["abo_blood_type_q09"])) earned.push("abo_probability_boundary_guard");
  if (passed(["abo_blood_type_q11"])) earned.push("abo_anonymous_ethics_guard");
  if (passed(["abo_blood_type_q12"])) earned.push("abo_scope_boundary_guard");
  if (passed(["abo_blood_type_q13"])) earned.push("u33_u34_u35_boundary_classifier");
  if (passed(["abo_blood_type_q14"])) earned.push("abo_model_not_parentage_guard");
  if (correctedCore) earned.push("abo_misconception_reviser");
  if (flawless) earned.push("abo_blood_type_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("abo_blood_type_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_abo_blood_type");
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
  if (["abo_blood_type_q01", "abo_blood_type_q03", "abo_blood_type_q04"].includes(questionId)) return "abo_allele_model";
  if (["abo_blood_type_q02", "abo_blood_type_q07"].includes(questionId)) return "abo_genotype_phenotype";
  if (["abo_blood_type_q05", "abo_blood_type_q06", "abo_blood_type_q08", "abo_blood_type_q09", "abo_blood_type_q10"].includes(questionId)) return "abo_punnett_reasoning";
  if (["abo_blood_type_q11", "abo_blood_type_q12", "abo_blood_type_q13", "abo_blood_type_q14"].includes(questionId)) return "abo_ethics_boundary";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "abo_cp1_allele_model",
    checkpoint2: "abo_cp2_genotype_phenotype",
    checkpoint3: "abo_cp3_punnett_reasoning",
    checkpoint4: "abo_cp4_ethics_boundary"
  }[section] || "abo_cp5_reflection";
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
        <h2 class="hero-title">人類的 ABO 血型遺傳</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene abo-blood-type-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "ABO 血型遺傳中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用匿名模型練習 ABO 等位基因、基因型、表現型與棋盤方格判讀，並把真實身分與醫療判斷留在任務外。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入 ABO 血型模型任務前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "ABO 血型遺傳準備場景" })}<div><h3>先分清等位基因、基因型、表現型與模型邊界。</h3><p>本任務只使用匿名、假設資料，不要求任何同學提供家庭、血型或健康資訊。</p></div></div><div class="concept-grid"><article><strong>等位基因</strong><p>用 I^A、I^B、i 描述 ABO 模型中的三種等位基因。</p></article><article><strong>表現型</strong><p>從兩個等位基因形成的基因型，判讀可觀察到的血型表現。</p></article><article><strong>棋盤方格</strong><p>依匿名模型資料組合每一格，判讀可能與不可能。</p></article><article><strong>倫理邊界</strong><p>本單元不處理真實親子、輸血、Rh 或疾病判斷。</p></article></div><button class="primary" data-next="checkpoint1">開始人類的 ABO 血型遺傳任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["等位基因模型", "先確認 ABO 模型中的等位基因、共同顯性與隱性。"],
    checkpoint2: ["基因型與表現型", "用匿名資料分辨血型表現和完整基因型的關係。"],
    checkpoint3: ["棋盤方格與可能性", "依每格資料判讀模型支持的可能結果。"],
    checkpoint4: ["匿名模型與單元邊界", "守住課堂模型、真實身分、醫療與相鄰單元的界線。"]
  }[section];
  return `<div class="stack checkpoint-stack"><section class="panel"><p class="eyebrow">互動關卡</p><h2>${heading[0]}</h2><p class="lead">${heading[1]}</p></section>${sections[section].map((id)=>renderQuestion(questionMap[id])).join("")}<section class="panel action-panel"><p class="muted">本區每題都需留下作答紀錄；不確定時可先選擇，任務後會給概念回饋。</p><button class="primary" data-section-next="${section}">${section === "checkpoint4" ? "整理任務回饋" : "前往下一關"}</button></section></div>`;
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
    abo_alleles: "ABO 等位基因",
    abo_codominance: "共同顯性",
    abo_recessive_i: "隱性 i",
    abo_genotype_phenotype: "基因型與表現型",
    abo_punnett_square: "棋盤方格",
    abo_possible_impossible: "可能與不可能",
    abo_probability_boundary: "機率邊界",
    abo_ethics_boundary: "匿名模型倫理",
    unit_boundary_control: "單元邊界"
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "abo_blood_type_q05") return `<div class="evidence-card evidence-table-card abo-punnett-evidence" role="img" aria-label="ABO 棋盤方格，列出一方可提供的等位基因與另一方可提供的等位基因，四格結果需由學生判讀。"><strong>匿名棋盤方格資料</strong><div class="abo-punnett-grid readonly-grid" role="table" aria-label="一方 ii 與另一方 I^AI^B 的四格資料"><div class="corner" role="columnheader">模型</div><div role="columnheader">欄 I^A</div><div role="columnheader">欄 I^B</div><div role="rowheader">列 i</div><div role="cell">I^Ai</div><div role="cell">I^Bi</div><div role="rowheader">列 i</div><div role="cell">I^Ai</div><div role="cell">I^Bi</div></div><p class="muted">表格只呈現匿名親代可提供的等位基因與四格組合，需依本單元模型判讀。</p></div>`;
  if (qid === "abo_blood_type_q06") return `<div class="evidence-card evidence-table-card"><strong>空白棋盤方格</strong><p class="muted">每格由上方與左側各一個等位基因組合而成；下方選單需依格子的欄列資料完成。</p></div>`;
  if (qid === "abo_blood_type_q09") return `<div class="evidence-card evidence-table-card abo-probability-card" role="img" aria-label="四格 ABO 模型資料，其中每格代表一種可能組合，需由學生判讀比例意義。"><strong>四格模型資料</strong><div class="data-table" role="table" aria-label="四格模型格數與比例欄位"><div role="row"><span role="columnheader">資料欄位</span><span role="columnheader">記錄值</span></div><div role="row"><span role="cell">模型總格數</span><span role="cell">4 格</span></div><div role="row"><span role="cell">其中一格標記</span><span role="cell">ii</span></div><div role="row"><span role="cell">標記格數比例</span><span role="cell">1 / 4 = 25%</span></div></div><p class="muted">資料卡列出模型格數、標記格數與比例欄位。</p></div>`;
  if (qid === "abo_blood_type_q13") return `<div class="evidence-card evidence-table-card abo-boundary-cards"><strong>學習任務資料卡</strong><div class="concept-grid"><article><span>任務甲</span><p>討論一般人類性狀、基因型與表現型。</p></article><article><span>任務乙</span><p>使用 ABO 棋盤方格判讀匿名模型。</p></article><article><span>任務丙</span><p>討論突變與遺傳疾病概念。</p></article><article><span>任務丁</span><p>涉及真實身分或醫療決策。</p></article></div><p class="muted">請依任務內容選擇合適的處理位置。</p></div>`;
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
  if (question.id === "abo_blood_type_q06") return renderPunnettGridMappingQuestion(question);
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

function renderPunnettGridMappingQuestion(question) {
  const current = state.answers[question.id] || {};
  const items = orderedMappingItems(question);
  const choices = orderedMappingChoices(question);
  return `<div class="abo-punnett-grid interactive-grid" data-abo-grid="${question.id}">
    ${items.map((item) => `
      <label class="abo-grid-cell">
        <span>${escapeHtml(item.label)}</span>
        <select data-map-question="${question.id}" data-map-item="${item.id}">
          <option value="">尚未選擇</option>
          ${choices.map((choice) => `<option value="${choice.id}" ${current[item.id] === choice.id ? "selected" : ""}>${escapeHtml(choice.text)}</option>`).join("")}
        </select>
      </label>
    `).join("")}
  </div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的 ABO 血型模型判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的 ABO 等位基因、棋盤方格與倫理邊界概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  allele_model_overgeneralized: "建議再確認 ABO 等位基因模型：三種等位基因描述模型，每個人就此性狀有兩個等位基因。",
  phenotype_genotype_one_to_one: "建議再確認基因型與表現型：A 型與 B 型表現不一定只對應一種基因型。",
  codominance_as_dominance: "建議再確認共同顯性：I^A 與 I^B 在一起時可共同表現。",
  o_type_no_gene_or_any_i: "建議再確認 O 型模型：ii 才表現為 O 型，O 型不是沒有等位基因。",
  parent_phenotype_direct_copy: "建議再確認棋盤方格：先列出親代可提供的等位基因，再讀出子代可能組合。",
  punnett_cell_combination_error: "建議再確認每格組合：每格由上方與左側各一個等位基因形成。",
  phenotype_as_exact_genotype: "建議再確認表現型線索：只知道 A 型仍不足以推出唯一基因型。",
  single_parent_type_decides_child: "建議再確認可能與不可能：不能只看一方資料就下完整結論。",
  probability_as_fixed_family_quota: "建議再確認模型比例：25% 是簡化模型中的比例，不是真實家庭固定配額。",
  phenotype_only_overclaim: "建議再確認表現型與基因型：只知道兩位都是 A 型仍需要更多模型資料。",
  blood_type_as_identity_or_medical_tool: "建議再確認倫理邊界：本單元使用匿名模型，不處理真實親子或醫療判斷。",
  scope_creep_rh_transfusion: "建議再確認單元範圍：Rh 與輸血醫療不屬於 U34 課前檢核。",
  unit_boundary_mixing: "建議再確認 U33、U34、U35 與非課前模型任務的邊界。",
  model_impossible_as_real_world_verdict: "建議再確認模型與真實世界邊界：模型可支持或不支持某結果，但不能下真實身分結論。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從 ABO、I^A、I^B、i、基因型、表現型、共同顯性、隱性、棋盤方格、可能/不可能、匿名模型或倫理邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：棋盤方格每格由兩個等位基因組合"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認 ABO 棋盤方格中的可能性，怎麼判斷基因型和表現型？">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "人類的 ABO 血型遺傳結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>ABO 血型模型判讀任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與 ABO、等位基因、基因型、表現型、棋盤方格、匿名模型或倫理邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__abo_blood_typeTest = {
    VERSION,
    QUESTION_VERSION,
    mission,
    assets,
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
    renderLogin,
    renderBrief,
    renderScan,
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements,
    renderBadgeWall,
    renderRules
  };
}
