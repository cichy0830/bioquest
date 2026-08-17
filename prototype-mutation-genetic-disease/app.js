const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260818-mutation-genetic-disease-q07-evidence-v1";
const QUESTION_VERSION = "20260817-mutation-genetic-disease-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_mutation_genetic_disease_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_mutation_genetic_disease_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "mutation_genetic_disease",
  "unit_title": "突變與遺傳疾病",
  "mission_title": "遺傳線索安全判讀任務",
  "mission_area": "生命延續資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  mutation_genetic_disease_q01: 15,
  mutation_genetic_disease_q02: 18,
  mutation_genetic_disease_q03: 15,
  mutation_genetic_disease_q04: 15,
  mutation_genetic_disease_q05: 18,
  mutation_genetic_disease_q06: 16,
  mutation_genetic_disease_q07: 14,
  mutation_genetic_disease_q08: 17,
  mutation_genetic_disease_q09: 15,
  mutation_genetic_disease_q10: 15,
  mutation_genetic_disease_q11: 16,
  mutation_genetic_disease_q12: 18,
  mutation_genetic_disease_q13: 14,
  mutation_genetic_disease_q14: 14
};
const revisionExpWeights = {
  mutation_genetic_disease_q01: 13,
  mutation_genetic_disease_q02: 15,
  mutation_genetic_disease_q03: 13,
  mutation_genetic_disease_q04: 12,
  mutation_genetic_disease_q05: 15,
  mutation_genetic_disease_q06: 13,
  mutation_genetic_disease_q07: 11,
  mutation_genetic_disease_q08: 14,
  mutation_genetic_disease_q09: 12,
  mutation_genetic_disease_q10: 12,
  mutation_genetic_disease_q11: 13,
  mutation_genetic_disease_q12: 15,
  mutation_genetic_disease_q13: 11,
  mutation_genetic_disease_q14: 11
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/mutation_genetic_disease/badge-mutation_genetic_disease-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: [
    "突變",
    "遺傳物質",
    "基因",
    "DNA",
    "染色體",
    "環境因子",
    "遺傳疾病",
    "傳染病",
    "性染色體",
    "健康資訊",
    "去污名",
    "個人資料",
    "匿名模型",
    "U36",
    "生物技術"
  ],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["突變定義", "自然發生與環境因子", "影響不一定有害", "遺傳疾病與傳染病差異", "性染色體相關遺傳疾病", "健康資訊判讀", "去污名與尊重語言", "個人資料與家庭病史隱私", "U36 生物技術邊界"]
};

const badges = [
  ["mutation_genetic_disease_entry", "遺傳線索入門", "完成 q01-q14 並提交 q15 回報。"],
  ["mutation_basic_model_reader", "突變基本模型判讀者", "q01 正確。"],
  ["mutation_factor_classifier", "突變因子分類師", "q02 六項全對。"],
  ["mutation_effect_range_reader", "突變影響多樣性判讀者", "q03 與 q11 正確。"],
  ["health_claim_certainty_guard", "健康資訊必然化守門員", "q04 與 q10 正確。"],
  ["genetic_disease_boundary_mapper", "遺傳疾病邊界配對者", "q05 四項全對。"],
  ["anonymous_evidence_scope_reader", "匿名資料範圍判讀者", "q06 正確。"],
  ["sex_linked_boundary_reader", "性染色體概念守門員", "q07 正確。"],
  ["disease_infection_classifier", "遺傳疾病與傳染病分辨者", "q08 四項全對。"],
  ["no_stigma_language_guard", "去污名語言守門員", "q09 正確。"],
  ["privacy_model_data_guard", "隱私資料守門員", "q13 正確。"],
  ["u33_u34_u35_u36_boundary_classifier", "遺傳單元邊界分類師", "q12 五項全對且 q14 正確。"],
  ["mutation_genetic_disease_flawless", "零提示全對：遺傳線索安全判讀", "q01-q14 第一次提交全對且未使用提示。"],
  ["mutation_genetic_disease_reflection_reporter", "高品質回報：突變與遺傳疾病疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_mutation_genetic_disease", "再挑戰進步：遺傳線索", "合法重新登入再挑戰且 verified 後比前次進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const mutationFactorChoices = [
  { id: "possible_mutation_factor", text: "可能與突變發生有關" },
  { id: "not_supported_mutation_factor", text: "本題資料不支持為突變因子" }
];

const diseaseBoundaryChoices = [
  { id: "genetic_disease_related", text: "遺傳疾病相關" },
  { id: "infectious_disease_related", text: "傳染病相關" },
  { id: "acquired_injury_not_genetic", text: "後天傷害，不屬遺傳疾病" },
  { id: "inappropriate_personal_data", text: "不適合課前蒐集的個人資料" }
];

const diseaseInfectionChoices = [
  { id: "genetic_disease_concept", text: "遺傳疾病概念" },
  { id: "infectious_disease_concept", text: "傳染病概念" },
  { id: "not_genetic_acquired_injury", text: "後天事件，不屬遺傳疾病" },
  { id: "not_appropriate_classroom_data", text: "不適合作為課前任務資料" }
];

const unitBoundaryChoices = [
  { id: "u33_human_genetics", text: "第 33 站：人類的遺傳" },
  { id: "u34_abo_blood_type", text: "第 34 站：人類的 ABO 血型遺傳" },
  { id: "u35_mutation_genetic_disease", text: "第 35 站：突變與遺傳疾病" },
  { id: "u36_biotechnology", text: "第 36 站：生物技術" },
  { id: "not_preclass_task", text: "不屬於課前任務" }
];

const questions = [
  { id: "mutation_genetic_disease_q01", section: "checkpoint1", concept: "mutation_basic_change", skill_tag: "mutation_basic_change", type: "choice", answer: "mutation_is_genetic_material_change", prompt: "下列哪個說法最符合七年級對「突變」的基本理解？", hint: "先看這個說法是否在描述遺傳物質，而不是外觀想像或傳染。", misconception: "mutation_monster_confusion", options: [ { id: "mutation_is_genetic_material_change", text: "突變是遺傳物質發生改變，結果不一定立刻從外觀判斷" }, { id: "mutation_makes_monster", text: "突變一定會讓生物變成怪物" }, { id: "mutation_is_contagious", text: "突變是被同學傳染來的" }, { id: "mutation_is_effort_to_improve", text: "突變只代表生物努力讓自己變好" } ] },
  { id: "mutation_genetic_disease_q02", section: "checkpoint1", concept: "mutation_source_factor", skill_tag: "mutation_source_factor", type: "mapping", answer: { natural_change_event: "possible_mutation_factor", excess_ultraviolet_exposure: "possible_mutation_factor", certain_chemical_exposure: "possible_mutation_factor", catching_a_cold: "not_supported_mutation_factor", studying_harder: "not_supported_mutation_factor", exercise_training: "not_supported_mutation_factor" }, prompt: "把下列項目分成「可能與突變發生有關」與「本題資料不支持為突變因子」。", hint: "判斷這個項目是否可能影響遺傳物質，而不是只讓身體狀態短期改變。", misconception: "mutation_source_confusion", items: [ { id: "natural_change_event", label: "自然發生的遺傳資料變化" }, { id: "excess_ultraviolet_exposure", label: "過量紫外線暴露" }, { id: "certain_chemical_exposure", label: "某些化學物質暴露" }, { id: "catching_a_cold", label: "感冒" }, { id: "studying_harder", label: "更努力讀書" }, { id: "exercise_training", label: "運動訓練" } ], choices: mutationFactorChoices },
  { id: "mutation_genetic_disease_q03", section: "checkpoint1", concept: "mutation_effect_range", skill_tag: "mutation_effect_range", type: "choice", answer: "mutation_effects_can_vary", prompt: "有同學說：「只要是突變就一定有害。」哪個修正較合理？", hint: "留意題目問的是「一定」還是「可能」。", misconception: "mutation_always_harmful_confusion", options: [ { id: "mutation_effects_can_vary", text: "突變可能有害、沒有明顯影響，少數情況也可能有利" }, { id: "all_mutations_harmful", text: "所有突變一定有害" }, { id: "all_mutations_helpful", text: "所有突變一定有利" }, { id: "mutation_unrelated_to_genetic_material", text: "突變和遺傳物質完全無關" } ] },
  { id: "mutation_genetic_disease_q04", section: "checkpoint1", concept: "health_info_literacy", skill_tag: "health_info_literacy", type: "choice", answer: "risk_claim_overstates_certainty", prompt: "某健康文章說：「只要接觸一次某環境因子，就一定會產生遺傳疾病。」最需要提高警覺的是哪一點？", hint: "找找看哪一句把「可能增加風險」變成「一定發生」。", misconception: "environment_factor_determinism_confusion", options: [ { id: "risk_claim_overstates_certainty", text: "把風險說成必然結果，且沒有足夠證據" }, { id: "source_check_reminder", text: "提醒讀者看資料來源" }, { id: "research_limit_note", text: "說明研究限制" }, { id: "anonymous_data_discussion", text: "使用匿名資料討論風險" } ] },
  { id: "mutation_genetic_disease_q05", section: "checkpoint2", concept: "genetic_disease_basic", skill_tag: "genetic_disease_basic", type: "mapping", answer: { gene_or_chromosome_abnormality: "genetic_disease_related", pathogen_spread_between_people: "infectious_disease_related", fall_injury: "acquired_injury_not_genetic", asking_classmate_family_history: "inappropriate_personal_data" }, prompt: "把下列描述配到較合適的概念類別。", hint: "先判斷描述指向遺傳資料、病原傳播、後天傷害，還是個人隱私。", misconception: "genetic_disease_infection_confusion", items: [ { id: "gene_or_chromosome_abnormality", label: "基因或染色體異常相關" }, { id: "pathogen_spread_between_people", label: "病原在人與人之間傳播" }, { id: "fall_injury", label: "跌倒造成受傷" }, { id: "asking_classmate_family_history", label: "詢問同學家族病史" } ], choices: diseaseBoundaryChoices },
  { id: "mutation_genetic_disease_q06", section: "checkpoint2", concept: "anonymous_evidence_scope", skill_tag: "anonymous_evidence_scope", type: "choice", backend_type: "data_interpret", answer: "anonymous_model_supports_limited_association", prompt: "匿名模型資料列出幾個代碼的遺傳資料摘要與可觀察表現。這份資料最多能支持哪個判斷？", hint: "先看資料只提供哪些欄位，再判斷它能支持到哪個層級。", misconception: "genetic_disease_diagnosis_overclaim", options: [ { id: "anonymous_model_supports_limited_association", text: "在此匿名模型中，某遺傳資料標記與可觀察表現可能有關" }, { id: "diagnose_real_student", text: "可以診斷某個真實學生是否生病" }, { id: "family_responsibility_claim", text: "可以判定某個家庭應負責" }, { id: "personality_ability_claim", text: "可以推論一個人的人格或能力" } ] },
  { id: "mutation_genetic_disease_q07", section: "checkpoint2", concept: "sex_linked_basic", skill_tag: "sex_linked_basic", type: "choice", answer: "sex_linked_basic_without_diagnosis", prompt: "下列哪個說法較符合「有些遺傳疾病與性染色體相關」的七年級理解？", hint: "分辨「與性染色體相關」和「價值判斷或診斷」是否相同。", misconception: "sex_linked_value_stigma_confusion", options: [ { id: "sex_linked_basic_without_diagnosis", text: "有些遺傳疾病可能與性染色體上的遺傳資料有關" }, { id: "sex_value_judgment", text: "可以用來評斷不同性別的價值" }, { id: "only_one_sex_always", text: "一定只出現在某一個性別" }, { id: "classroom_diagnosis_any_disease", text: "可以用課堂題目診斷任何疾病" } ] },
  { id: "mutation_genetic_disease_q08", section: "checkpoint2", concept: "disease_vs_infection", skill_tag: "disease_vs_infection", type: "mapping", answer: { gene_chromosome_abnormality_related: "genetic_disease_concept", pathogen_transmission_related: "infectious_disease_concept", sprain_after_fall: "not_genetic_acquired_injury", public_classmate_medical_history: "not_appropriate_classroom_data" }, prompt: "把下列敘述分到較合適的類別。", hint: "看敘述是在說遺傳資料、病原傳播、後天事件，還是不適合蒐集的資料。", misconception: "genetic_disease_infection_confusion", items: [ { id: "gene_chromosome_abnormality_related", label: "與基因或染色體異常相關" }, { id: "pathogen_transmission_related", label: "與病原傳播相關" }, { id: "sprain_after_fall", label: "跌倒後扭傷" }, { id: "public_classmate_medical_history", label: "公開同學病史" } ], choices: diseaseInfectionChoices },
  { id: "mutation_genetic_disease_q09", section: "checkpoint3", concept: "ethics_no_stigma", skill_tag: "ethics_no_stigma", type: "choice", answer: "genetic_condition_does_not_define_value", prompt: "同學看到「遺傳疾病」一詞後說：「有這種疾病的人一定比較不好。」哪個回應較合適？", hint: "想想這句話是在討論科學概念，還是在做價值判斷。", misconception: "genetic_condition_stigma_confusion", options: [ { id: "genetic_condition_does_not_define_value", text: "遺傳差異或疾病不代表人的價值高低，應使用尊重且中性的語言" }, { id: "blame_family", text: "可以責怪他的家庭" }, { id: "require_public_history", text: "應該要求他公開病史" }, { id: "disease_as_ability_label", text: "可以把疾病當成能力標籤" } ] },
  { id: "mutation_genetic_disease_q10", section: "checkpoint3", concept: "health_info_literacy", skill_tag: "health_info_literacy", type: "choice", answer: "health_info_overclaim_private_data_warning", prompt: "下列哪一類健康資訊最需要提高警覺？", hint: "找出哪個說法同時出現保證語氣與敏感資料要求。", misconception: "health_info_overclaim_confusion", options: [ { id: "health_info_overclaim_private_data_warning", text: "宣稱保證診斷或治療，並要求上傳家族資料" }, { id: "explains_sources_limits", text: "說明資料來源與限制" }, { id: "ask_professional_when_needed", text: "提醒有疑問要找合格專業人員" }, { id: "anonymous_model_practice", text: "使用匿名模型資料做課堂練習" } ] },
  { id: "mutation_genetic_disease_q11", section: "checkpoint3", concept: "mutation_effect_range", skill_tag: "mutation_effect_range", type: "choice", backend_type: "data_interpret", answer: "mutation_effects_differ_by_case", prompt: "一張模型資料表列出三種遺傳物質變化與觀察結果。最合理的結論是什麼？", hint: "比較每列資料的觀察結果是否都相同。", misconception: "mutation_always_harmful_confusion", options: [ { id: "mutation_effects_differ_by_case", text: "不同突變的影響可能不同" }, { id: "all_mutations_harmful", text: "所有突變都一定有害" }, { id: "all_mutations_helpful", text: "所有突變都一定有利" }, { id: "mutation_unrelated_to_condition", text: "突變影響與環境條件完全無關" } ] },
  { id: "mutation_genetic_disease_q12", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "mapping", answer: { human_dominant_recessive_model: "u33_human_genetics", abo_blood_type_punnett: "u34_abo_blood_type", mutation_genetic_disease_concept: "u35_mutation_genetic_disease", gene_transfer_technology_application: "u36_biotechnology", real_family_disease_diagnosis: "not_preclass_task" }, prompt: "把下列學習任務放到最合適的處理位置。", hint: "判斷任務是在看人類遺傳模型、血型、突變疾病、生物技術，還是真實診斷。", misconception: "u35_u36_boundary_confusion", items: [ { id: "human_dominant_recessive_model", label: "人類顯性與隱性簡化模型" }, { id: "abo_blood_type_punnett", label: "ABO 血型棋盤方格可能性" }, { id: "mutation_genetic_disease_concept", label: "突變與遺傳疾病概念" }, { id: "gene_transfer_technology_application", label: "基因轉殖技術應用" }, { id: "real_family_disease_diagnosis", label: "真實家庭疾病診斷" } ], choices: unitBoundaryChoices },
  { id: "mutation_genetic_disease_q13", section: "checkpoint3", concept: "privacy_boundary", skill_tag: "privacy_boundary", type: "choice", answer: "anonymous_model_data_for_genetic_disease_learning", prompt: "課前任務想練習遺傳疾病資料判讀，哪種資料最適合？", hint: "找出哪一種資料能練習概念，又不暴露個人或家庭隱私。", misconception: "privacy_family_history_confusion", options: [ { id: "anonymous_model_data_for_genetic_disease_learning", text: "匿名模型資料與可觀察描述" }, { id: "classmate_family_history", text: "同學家族病史" }, { id: "real_genetic_test_report", text: "真實個人基因檢測報告" }, { id: "family_disease_report", text: "要求學生回報家人疾病" } ] },
  { id: "mutation_genetic_disease_q14", section: "checkpoint4", concept: "biotechnology_boundary", skill_tag: "biotechnology_boundary", type: "choice", answer: "u35_not_testing_or_treatment_advice", prompt: "有同學說：「學到遺傳疾病後，我們就應該建議大家做基因檢測或治療。」哪個修正較合適？", hint: "先判斷這件事是在學科概念判讀，還是在提供醫療或生物技術方案。", misconception: "u35_u36_boundary_confusion", options: [ { id: "u35_not_testing_or_treatment_advice", text: "本單元只做概念理解與健康資訊判讀，不提供檢測或治療建議" }, { id: "everyone_should_test_now", text: "所有人都應該立刻做基因檢測" }, { id: "students_decide_treatment", text: "治療方案可以由同學決定" }, { id: "change_to_gene_transfer_process", text: "這一題應改成基因轉殖技術流程" } ] }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["mutation_genetic_disease_q01", "mutation_genetic_disease_q02", "mutation_genetic_disease_q03", "mutation_genetic_disease_q04"],
  checkpoint2: ["mutation_genetic_disease_q05", "mutation_genetic_disease_q06", "mutation_genetic_disease_q07", "mutation_genetic_disease_q08"],
  checkpoint3: ["mutation_genetic_disease_q09", "mutation_genetic_disease_q10", "mutation_genetic_disease_q11", "mutation_genetic_disease_q13"],
  checkpoint4: ["mutation_genetic_disease_q12", "mutation_genetic_disease_q14"]
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
    return `<div class="u35-scene-neutral" role="img" aria-label="${escapeHtml(alt || "突變與遺傳疾病中性任務場景")}">
      <span class="u35-scene-strand"></span>
      <span class="u35-scene-card">匿名資料</span>
      <span class="u35-scene-card">遺傳資料</span>
      <span class="u35-scene-card">觀察結果</span>
      <span class="u35-scene-card">資料邊界</span>
    </div>`;
  }
  return `<picture class="u35-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u35-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u35-page-scene u35-${prefix}-scene ${className}" data-u35-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "人類的 突變與遺傳疾病任務場景")}
    ${azhe ? `<img class="u35-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u35-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl && owlSrc ? `<img class="u35-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u35-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
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
  if (question.id !== "mutation_genetic_disease_q04" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
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
  const attemptId = uid("mutation_genetic_disease_guest_attempt");
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
  earned.push("mutation_genetic_disease_entry");
  if (passed(["mutation_genetic_disease_q01"])) earned.push("mutation_basic_model_reader");
  if (passed(["mutation_genetic_disease_q02"])) earned.push("mutation_factor_classifier");
  if (passed(["mutation_genetic_disease_q03", "mutation_genetic_disease_q11"])) earned.push("mutation_effect_range_reader");
  if (passed(["mutation_genetic_disease_q04", "mutation_genetic_disease_q10"])) earned.push("health_claim_certainty_guard");
  if (passed(["mutation_genetic_disease_q05"])) earned.push("genetic_disease_boundary_mapper");
  if (passed(["mutation_genetic_disease_q06"])) earned.push("anonymous_evidence_scope_reader");
  if (passed(["mutation_genetic_disease_q07"])) earned.push("sex_linked_boundary_reader");
  if (passed(["mutation_genetic_disease_q08"])) earned.push("disease_infection_classifier");
  if (passed(["mutation_genetic_disease_q09"])) earned.push("no_stigma_language_guard");
  if (passed(["mutation_genetic_disease_q13"])) earned.push("privacy_model_data_guard");
  if (passed(["mutation_genetic_disease_q12", "mutation_genetic_disease_q14"])) earned.push("u33_u34_u35_u36_boundary_classifier");
  if (flawless) earned.push("mutation_genetic_disease_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("mutation_genetic_disease_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_mutation_genetic_disease");
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
  if (["mutation_genetic_disease_q01", "mutation_genetic_disease_q02", "mutation_genetic_disease_q04"].includes(questionId)) return "mutation_basic_model";
  if (["mutation_genetic_disease_q03", "mutation_genetic_disease_q11"].includes(questionId)) return "mutation_effect_reasoning";
  if (["mutation_genetic_disease_q05", "mutation_genetic_disease_q06", "mutation_genetic_disease_q08"].includes(questionId)) return "genetic_disease_boundary";
  if (["mutation_genetic_disease_q07"].includes(questionId)) return "sex_linked_boundary";
  if (["mutation_genetic_disease_q09", "mutation_genetic_disease_q10", "mutation_genetic_disease_q13"].includes(questionId)) return "health_info_ethics";
  if (["mutation_genetic_disease_q12", "mutation_genetic_disease_q14"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "mutation_cp1_mutation_model",
    checkpoint2: "mutation_cp2_genetic_disease_boundary",
    checkpoint3: "mutation_cp3_health_info_ethics",
    checkpoint4: "mutation_cp4_unit_boundary"
  }[section] || "mutation_cp5_reflection";
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
        <h2 class="hero-title">突變與遺傳疾病</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene mutation-genetic-disease-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "突變與遺傳疾病中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用匿名模型資料，練習突變、遺傳疾病、健康資訊與相鄰單元邊界判讀。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入遺傳線索安全任務前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "突變與遺傳疾病準備場景" })}<div><h3>先分清遺傳物質改變、疾病概念、資料判讀與課堂邊界。</h3><p>本任務只使用匿名、假設資料，不要求任何同學提供家庭、健康或基因資料。</p></div></div><div class="concept-grid"><article><strong>突變模型</strong><p>把突變理解為遺傳物質發生改變，不用外觀想像代替概念。</p></article><article><strong>資料來源</strong><p>分辨可能與突變相關的因素，以及本題資料不支持的項目。</p></article><article><strong>匿名證據</strong><p>讀取匿名代碼、遺傳資料摘要與可觀察表現。</p></article><article><strong>任務邊界</strong><p>把 U33、U34、U35、U36 和非課前任務分清楚。</p></article></div><button class="primary" data-next="checkpoint1">開始突變與遺傳疾病任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["突變模型與資訊風險", "先確認突變定義、來源、影響範圍與健康資訊語氣。"],
    checkpoint2: ["遺傳疾病與資料邊界", "分辨遺傳疾病、傳染病、後天事件與匿名資料判讀。"],
    checkpoint3: ["健康資訊與去污名", "讀取模型資料，練習尊重語言與隱私邊界。"],
    checkpoint4: ["相鄰單元與醫療邊界", "分辨 U33-U36 與非課前任務，不把概念題擴成醫療建議。"]
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
    mutation_basic_change: "突變基本概念",
    mutation_source_factor: "突變來源因素",
    mutation_effect_range: "突變影響範圍",
    health_info_literacy: "健康資訊判讀",
    genetic_disease_basic: "遺傳疾病邊界",
    anonymous_evidence_scope: "匿名資料範圍",
    sex_linked_basic: "性染色體基礎",
    disease_vs_infection: "遺傳疾病與傳染病",
    ethics_no_stigma: "去污名語言",
    unit_boundary_control: "單元邊界",
    privacy_boundary: "隱私資料邊界",
    biotechnology_boundary: "生物技術邊界"
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "mutation_genetic_disease_q06") return `<div class="evidence-card evidence-table-card mutation-data-evidence" role="group" aria-label="匿名資料表，三列資料分別列出代碼、遺傳資料摘要和可觀察表現。"><strong>匿名模型資料</strong><div class="mutation-data-table" role="table" aria-label="匿名資料表"><div role="row"><span role="columnheader">匿名代碼</span><span role="columnheader">遺傳資料摘要</span><span role="columnheader">可觀察表現</span></div><div role="row"><span role="cell">M01</span><span role="cell">某染色體區段有變化標記</span><span role="cell">觀察到模型性狀 M</span></div><div role="row"><span role="cell">M02</span><span role="cell">同一區段未標示變化</span><span role="cell">未觀察到模型性狀 M</span></div><div role="row"><span role="cell">M03</span><span role="cell">某染色體區段有變化標記</span><span role="cell">觀察到模型性狀 M</span></div></div><p class="muted">表格列出匿名代碼、遺傳資料摘要與可觀察表現。</p></div>`;
  if (qid === "mutation_genetic_disease_q07") return `<div class="evidence-card sex-chromosome-model" role="group" aria-label="性染色體模型卡，列出模型代碼、X / Y 性染色體模型、遺傳資料位置與模型說明。"><strong>性染色體模型卡</strong><div class="sex-chromosome-model-grid" aria-label="性染色體與遺傳資料位置模型"><article><span class="model-field-label">模型代碼</span><span class="model-field-value">S1</span><span class="model-field-label">染色體模型</span><span class="model-field-value chromosome-token">X / Y 性染色體模型</span><span class="model-field-label">遺傳資料位置</span><span class="model-field-value">染色體上可有遺傳資料片段</span><span class="model-field-label">模型說明</span><span class="model-field-value">此卡只用來看遺傳資料與性染色體的位置關係</span></article></div><p class="muted">模型卡呈現 X / Y 性染色體與遺傳資料位置關係。</p></div>`;
  if (qid === "mutation_genetic_disease_q11") return `<div class="evidence-card evidence-table-card mutation-data-evidence" role="group" aria-label="模型資料表，三列資料分別列出變化代碼、觀察條件和觀察結果。"><strong>模型變化觀察資料</strong><div class="mutation-data-table" role="table" aria-label="模型變化觀察資料表"><div role="row"><span role="columnheader">模型變化代碼</span><span role="columnheader">觀察條件</span><span role="columnheader">觀察結果</span></div><div role="row"><span role="cell">V1</span><span role="cell">一般環境</span><span role="cell">某模型性狀明顯改變</span></div><div role="row"><span role="cell">V2</span><span role="cell">一般環境</span><span role="cell">未觀察到明顯差異</span></div><div role="row"><span role="cell">V3</span><span role="cell">特定環境</span><span role="cell">存活或表現較佳</span></div></div><p class="muted">表格列出三種模型變化、觀察條件與觀察結果。</p></div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的遺傳線索安全判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的突變、遺傳疾病、匿名資料與健康資訊邊界概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  mutation_monster_confusion: "建議再確認突變基本概念：突變是遺傳物質改變，不等於怪物化、傳染或外觀必然改變。",
  mutation_source_confusion: "建議再確認突變來源：分辨可能影響遺傳物質的因素與一般生活狀態。",
  mutation_always_harmful_confusion: "建議再確認突變影響：不同資料與情境可能有不同觀察結果。",
  environment_factor_determinism_confusion: "建議再確認健康資訊語氣：風險不等於必然結果。",
  genetic_disease_infection_confusion: "建議再確認遺傳疾病、傳染病與後天傷害的差異。",
  genetic_disease_diagnosis_overclaim: "建議再確認匿名模型資料的支持範圍。",
  sex_linked_value_stigma_confusion: "建議再確認性染色體相關概念：生物模型不是能力、價值或責怪。",
  genetic_condition_stigma_confusion: "建議再確認去污名語言：遺傳差異或疾病不代表人的價值高低。",
  health_info_overclaim_confusion: "建議再確認健康資訊判讀：保證診斷、保證治療或要求敏感資料的資訊要特別小心。",
  privacy_family_history_confusion: "建議再確認隱私資料邊界：課前任務只使用匿名模型資料。",
  u35_u36_boundary_confusion: "建議再確認 U33、U34、U35、U36 與非課前任務的邊界。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從突變定義、環境因子、影響不一定相同、遺傳疾病與傳染病差異、性染色體、健康資訊、去污名、隱私資料或 U36 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：突變是遺傳物質發生改變"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認匿名模型資料能支持到哪個判斷層級。">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "突變與遺傳疾病結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>遺傳線索安全判讀任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與突變、遺傳疾病、匿名模型、健康資訊、去污名、隱私資料或 U36 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__mutation_genetic_diseaseTest = {
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
