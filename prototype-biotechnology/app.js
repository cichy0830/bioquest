const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260818-biotechnology-local-functional-v1";
const QUESTION_VERSION = "20260817-biotechnology-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_biotechnology_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_biotechnology_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "biotechnology",
  "unit_title": "生物技術",
  "mission_title": "生技案例判讀任務",
  "mission_area": "生命延續資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp"
};

const directExpWeights = {
  biotechnology_q01: 15,
  biotechnology_q02: 18,
  biotechnology_q03: 15,
  biotechnology_q04: 15,
  biotechnology_q05: 15,
  biotechnology_q06: 16,
  biotechnology_q07: 18,
  biotechnology_q08: 15,
  biotechnology_q09: 17,
  biotechnology_q10: 15,
  biotechnology_q11: 14,
  biotechnology_q12: 18,
  biotechnology_q13: 18,
  biotechnology_q14: 11
};
const revisionExpWeights = {
  biotechnology_q01: 12,
  biotechnology_q02: 15,
  biotechnology_q03: 12,
  biotechnology_q04: 12,
  biotechnology_q05: 12,
  biotechnology_q06: 13,
  biotechnology_q07: 15,
  biotechnology_q08: 12,
  biotechnology_q09: 14,
  biotechnology_q10: 12,
  biotechnology_q11: 11,
  biotechnology_q12: 15,
  biotechnology_q13: 15,
  biotechnology_q14: 10
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/biotechnology/badge-biotechnology-${id}.webp`
  : "";
const reflectionRules = {
  conceptTerms: [
    "生物技術",
    "生技",
    "生命作用",
    "傳統育種",
    "組織培養",
    "複製",
    "基因轉殖",
    "基因改造",
    "用途",
    "證據",
    "效益",
    "風險",
    "倫理",
    "個人資料",
    "匿名案例",
    "U36",
    "U37"
  ],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["生物技術定義", "傳統育種", "組織培養", "複製", "基因轉殖", "效益與風險", "資訊宣稱", "匿名與尊重討論", "U35-U37 邊界"]
};

const badges = [
  ["biotechnology_entry", "生技案例入門", "完成 q01-q14 並提交 q15 回報。"],
  ["biotech_basic_definition_reader", "生物技術定義判讀者", "q01 正確。"],
  ["biotech_example_classifier", "生技案例分類師", "q02 六項全對。"],
  ["breeding_tissue_culture_identifier", "育種與組織培養辨識者", "q03 與 q04 正確。"],
  ["cloning_gene_transfer_basic_reader", "複製與基因轉殖基礎辨識者", "q05 與 q06 正確。"],
  ["biotech_application_purpose_mapper", "生技用途配對者", "q07 四項全對。"],
  ["benefit_risk_context_judger", "效益風險脈絡判讀者", "q08 與 q14 正確。"],
  ["limited_evidence_scope_reader", "有限證據範圍判讀者", "q09 正確。"],
  ["information_claim_guard", "生技資訊宣稱守門員", "q10 正確。"],
  ["privacy_ethics_guard", "匿名與尊重討論守門員", "q11 正確。"],
  ["cloning_gene_transfer_comparer", "複製與基因轉殖比較者", "q12 兩項全對。"],
  ["u35_u36_u37_boundary_classifier", "U35-U37 邊界分類師", "q13 四項全對。"],
  ["biotechnology_flawless", "零提示全對：生技案例安全判讀", "q01-q14 第一次提交全對且未使用提示。"],
  ["biotechnology_reflection_reporter", "高品質回報：生物技術疑問", "q15 達 specific_uncertainty 或 discussion_question。"],
  ["retry_growth_biotechnology", "再挑戰進步：生技案例", "合法重新登入再挑戰且 verified 後比前次進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "controlled_pending" }));

const biotechExampleChoices = [
  { id: "traditional_breeding", text: "傳統育種" },
  { id: "tissue_culture", text: "組織培養" },
  { id: "cloning", text: "複製" },
  { id: "gene_transfer", text: "基因轉殖" },
  { id: "not_u36_core", text: "不屬 U36 核心或不適合課前任務" }
];

const applicationPurposeChoices = [
  { id: "accumulate_desired_traits", text: "累積想要的性狀線索" },
  { id: "rapid_many_similar_plants", text: "快速取得許多相似植株" },
  { id: "changed_gene_trait_application", text: "讓基因特徵被加入或改變" },
  { id: "similar_genetic_information_individual", text: "保留遺傳資訊相似的個體" }
];

const cloneTransferChoices = [
  { id: "cloning", text: "複製" },
  { id: "gene_transfer", text: "基因轉殖" }
];

const unitBoundaryChoices = [
  { id: "u35_mutation_genetic_disease", text: "第 35 站：突變與遺傳疾病" },
  { id: "u36_biotechnology", text: "第 36 站：生物技術" },
  { id: "u37_fossils_evolution", text: "第 37 站：化石與演化" },
  { id: "not_preclass_task", text: "不屬於課前任務" }
];

const questions = [
  { id: "biotechnology_q01", section: "checkpoint1", concept: "biotech_basic_definition", skill_tag: "biotech_basic_definition", type: "choice", answer: "biotech_uses_living_systems", prompt: "下列哪個說法最符合七年級對「生物技術」的基本理解？", hint: "先看這個說法是否和生物、生命作用或生物組成有關。", misconception: "biotech_definition_confusion", options: [ { id: "biotech_uses_living_systems", text: "利用生物或生命作用解決問題或生產物品" }, { id: "any_computer_is_biotech", text: "只要用到電腦就一定是生物技術" }, { id: "new_expensive_is_biotech", text: "只要很新、很昂貴就是生物技術" }, { id: "all_biotech_cures_disease", text: "所有生物技術都能治療疾病" } ] },
  { id: "biotechnology_q02", section: "checkpoint1", concept: "biotech_example_classification", skill_tag: "biotech_example_classification", type: "mapping", answer: { select_high_yield_plants: "traditional_breeding", plant_tissue_many_seedlings: "tissue_culture", clone_similar_genetic_animal: "cloning", introduced_gene_trait_crop: "gene_transfer", fossil_layer_compare: "not_u36_core", student_genetic_test_advice: "not_u36_core" }, prompt: "把下列案例放到最合適的類別。", hint: "判斷案例的核心線索：是選拔交配、小組織培養、遺傳資訊相似、基因特徵被加入或改變，還是已超出本單元。", misconception: "biotech_type_confusion", items: [ { id: "select_high_yield_plants", label: "從多株作物中選出產量較高者再繁殖" }, { id: "plant_tissue_many_seedlings", label: "利用植物小部分組織培養出許多相似幼苗" }, { id: "clone_similar_genetic_animal", label: "產生與來源個體遺傳資訊大致相同的動物" }, { id: "introduced_gene_trait_crop", label: "讓作物具有被加入或改變的基因特徵" }, { id: "fossil_layer_compare", label: "比較化石所在的地層位置" }, { id: "student_genetic_test_advice", label: "建議某位學生做真實基因檢測" } ], choices: biotechExampleChoices },
  { id: "biotechnology_q03", section: "checkpoint1", concept: "traditional_breeding", skill_tag: "traditional_breeding", type: "choice", answer: "traditional_breeding_selection_crossing", prompt: "下列哪個例子較接近傳統育種？", hint: "找出是否以選拔、交配與多代累積想要的性狀為主要線索。", misconception: "breeding_equals_gene_engineering_confusion", options: [ { id: "traditional_breeding_selection_crossing", text: "選出符合需求的親代並繁殖，逐代累積想要的性狀" }, { id: "gene_transfer_changed_gene", text: "直接把某基因特徵加入另一種生物" }, { id: "fossil_layer_compare", text: "比較不同地層中的化石" }, { id: "real_person_gene_test", text: "判斷真實個人的基因檢測結果" } ] },
  { id: "biotechnology_q04", section: "checkpoint1", concept: "tissue_culture_basic", skill_tag: "tissue_culture_basic", type: "choice", answer: "tissue_culture_many_similar_plants", prompt: "某案例描述：由植物小部分組織在適當條件下培養出許多相似植株。較接近哪種概念？", hint: "找出案例中「植物小部分組織」和「大量相似植株」兩個線索。", misconception: "tissue_culture_confusion", options: [ { id: "tissue_culture_many_similar_plants", text: "組織培養" }, { id: "fossil_formation", text: "化石形成" }, { id: "infectious_disease_treatment", text: "傳染病治療" }, { id: "abo_blood_type_reasoning", text: "ABO 血型推論" } ] },
  { id: "biotechnology_q05", section: "checkpoint2", concept: "cloning_basic", skill_tag: "cloning_basic", type: "choice", answer: "cloning_similar_genetic_information", prompt: "下列哪個說法較符合「複製」的基本概念？", hint: "注意案例是否強調和來源個體的遺傳資訊大致相同。", misconception: "cloning_sexual_reproduction_confusion", options: [ { id: "cloning_similar_genetic_information", text: "產生與來源個體遺傳資訊大致相同的個體" }, { id: "cloning_means_random_mixture", text: "一定是兩個親代隨機混合後的結果" }, { id: "cloning_is_medical_diagnosis", text: "用來診斷真實個人疾病" }, { id: "cloning_is_fossil_compare", text: "用來比較化石年代" } ] },
  { id: "biotechnology_q06", section: "checkpoint2", concept: "gene_transfer_basic", skill_tag: "gene_transfer_basic", type: "choice", answer: "gene_transfer_changed_gene_trait", prompt: "下列哪個說法較符合「基因轉殖 / 基因改造」的基本概念？", hint: "找出是否描述基因特徵被加入或改變，而不是直接下安全或危險結論。", misconception: "gmo_all_harmful_or_all_safe_confusion", options: [ { id: "gene_transfer_changed_gene_trait", text: "讓生物具有被加入或改變的基因特徵，出現特定性狀" }, { id: "gene_transfer_all_harmful", text: "所有基因改造生物一定全部有害" }, { id: "gene_transfer_all_safe", text: "所有基因改造生物一定完全沒有風險" }, { id: "gene_transfer_is_cloning_only", text: "基因轉殖和複製完全是同一件事" } ] },
  { id: "biotechnology_q07", section: "checkpoint2", concept: "application_purpose", skill_tag: "application_purpose", type: "mapping", answer: { traditional_breeding_crop: "accumulate_desired_traits", tissue_culture_seedlings: "rapid_many_similar_plants", gene_transfer_pest_trait: "changed_gene_trait_application", cloning_preserve_trait: "similar_genetic_information_individual" }, prompt: "把生物技術案例和較合理的用途線索配對。", hint: "先看案例是在累積性狀、快速繁殖、基因特徵改變，還是遺傳資訊相似。", misconception: "application_purpose_confusion", items: [ { id: "traditional_breeding_crop", label: "透過親代選拔與繁殖累積作物性狀" }, { id: "tissue_culture_seedlings", label: "由小部分植物組織得到許多相似幼苗" }, { id: "gene_transfer_pest_trait", label: "讓作物具有被加入或改變的抗害蟲基因特徵" }, { id: "cloning_preserve_trait", label: "保留來源個體的遺傳資訊相似性" } ], choices: applicationPurposeChoices },
  { id: "biotechnology_q08", section: "checkpoint3", concept: "benefit_risk_ethics", skill_tag: "benefit_risk_ethics", type: "choice", answer: "judge_biotech_with_evidence_context", prompt: "面對一項生物技術應用，哪個判斷方式較合理？", hint: "想想判斷科技時是否只靠單一感覺或標籤。", misconception: "technology_new_is_better_confusion", options: [ { id: "judge_biotech_with_evidence_context", text: "同時看效益、風險、用途、證據與可能影響" }, { id: "judge_only_by_like", text: "只看自己喜不喜歡" }, { id: "judge_only_by_new", text: "只看是不是新技術" }, { id: "judge_only_by_ad_title", text: "只看網路標題或廣告" } ] },
  { id: "biotechnology_q09", section: "checkpoint3", concept: "evidence_based_judgment", skill_tag: "evidence_based_judgment", type: "choice", backend_type: "data_interpret", answer: "table_supports_limited_agricultural_effect", prompt: "一張資料表列出某農業生技案例與比較品系在同一季觀察中的資料。這份資料最多能支持哪個判斷？", hint: "先看資料的條件、比較對象和限制，再想它能支持到哪個範圍。", misconception: "evidence_policy_overclaim_confusion", options: [ { id: "table_supports_limited_agricultural_effect", text: "在表中條件下，此案例可能和觀察到的害蟲受害差異有關，但不能直接推出所有安全、政策或醫療結論" }, { id: "prove_all_food_safe", text: "可以證明所有基因改造食品完全安全" }, { id: "prove_all_biotech_unusable", text: "可以證明所有生物技術都不能使用" }, { id: "recommend_personal_treatment", text: "可以用來建議個人治療或基因檢測" } ] },
  { id: "biotechnology_q10", section: "checkpoint3", concept: "information_claim_literacy", skill_tag: "information_claim_literacy", type: "choice", backend_type: "data_interpret", answer: "absolute_claim_without_evidence_warning", prompt: "某文章摘句寫：「這項技術保證百分之百安全，反對者都不懂科學！」閱讀時最需要先注意哪個問題？", hint: "找出句子中是否有絕對保證或攻擊他人的語氣。", misconception: "information_overclaim_confusion", options: [ { id: "absolute_claim_without_evidence_warning", text: "用保證與貶抑語氣取代證據" }, { id: "clear_research_limits", text: "清楚列出研究限制" }, { id: "many_sources_given", text: "提供多方資料來源" }, { id: "scope_of_use_explained", text: "說明用途範圍" } ] },
  { id: "biotechnology_q11", section: "checkpoint3", concept: "ethics_privacy_discussion", skill_tag: "ethics_privacy_discussion", type: "choice", answer: "anonymous_case_evidence_respect", prompt: "進行生物技術課堂討論時，哪種做法較適合？", hint: "看哪個做法能討論概念，同時避免暴露個人或家庭資料。", misconception: "privacy_ethics_confusion", options: [ { id: "anonymous_case_evidence_respect", text: "使用匿名案例並討論證據、用途與可能影響" }, { id: "publish_classmate_family_history", text: "公開同學家庭病史" }, { id: "require_gene_test_result", text: "要求個人基因檢測結果" }, { id: "mock_specific_group", text: "用嘲笑語言描述特定族群" } ] },
  { id: "biotechnology_q12", section: "checkpoint2", concept: "cloning_gene_transfer_distinction", skill_tag: "cloning_gene_transfer_distinction", type: "mapping", answer: { case_similar_genetic_information: "cloning", case_changed_gene_trait: "gene_transfer" }, prompt: "兩張案例卡各描述一種生技概念。請把案例放到較合適的概念類別。", hint: "比較每張卡強調的是「遺傳資訊大致相同」還是「基因特徵被加入或改變」。", misconception: "cloning_gene_transfer_confusion", items: [ { id: "case_similar_genetic_information", label: "案例一：由來源個體的細胞取得遺傳資訊，產生與來源個體遺傳資訊大致相同的個體。" }, { id: "case_changed_gene_trait", label: "案例二：讓某生物具有來自其他生物或被改變的基因特徵，使它出現特定性狀。" } ], choices: cloneTransferChoices },
  { id: "biotechnology_q13", section: "checkpoint4", concept: "unit_boundary_control", skill_tag: "unit_boundary_control", type: "mapping", answer: { mutation_disease_health_info: "u35_mutation_genetic_disease", gene_transfer_application: "u36_biotechnology", fossil_layer_evolution_evidence: "u37_fossils_evolution", real_person_genetic_testing_advice: "not_preclass_task" }, prompt: "把下列學習任務放到最合適的處理位置。", hint: "先判斷任務是在看突變疾病、生物技術、化石演化，還是個人醫療 / 檢測建議。", misconception: "u35_u36_u37_boundary_confusion", items: [ { id: "mutation_disease_health_info", label: "突變、遺傳疾病與健康資訊判讀" }, { id: "gene_transfer_application", label: "基因轉殖技術的應用與風險討論" }, { id: "fossil_layer_evolution_evidence", label: "化石所在層位與演化證據判讀" }, { id: "real_person_genetic_testing_advice", label: "針對真實個人提出基因檢測建議" } ], choices: unitBoundaryChoices },
  { id: "biotechnology_q14", section: "checkpoint3", concept: "biotech_risk_balance", skill_tag: "biotech_risk_balance", type: "choice", answer: "biotech_risk_needs_context_evidence", prompt: "有同學說：「基因改造生物一定全部有害。」另一位說：「一定完全沒有風險。」哪個修正較合理？", hint: "留意題目中兩個說法是不是都用了「一定」。", misconception: "gmo_all_harmful_or_all_safe_confusion", options: [ { id: "biotech_risk_needs_context_evidence", text: "需要看具體用途、證據、限制與可能影響" }, { id: "all_gmo_harmful", text: "一定全部有害" }, { id: "all_gmo_zero_risk", text: "一定完全零風險" }, { id: "judge_by_ad_or_fear_image", text: "只看廣告或恐嚇圖片就能判斷" } ] }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["biotechnology_q01", "biotechnology_q02", "biotechnology_q03", "biotechnology_q04"],
  checkpoint2: ["biotechnology_q05", "biotechnology_q06", "biotechnology_q07", "biotechnology_q12"],
  checkpoint3: ["biotechnology_q08", "biotechnology_q09", "biotechnology_q10", "biotechnology_q11", "biotechnology_q14"],
  checkpoint4: ["biotechnology_q13"]
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
    return `<div class="u36-scene-neutral" role="img" aria-label="${escapeHtml(alt || "生物技術中性任務場景")}">
      <span class="u36-scene-strand"></span>
      <span class="u36-scene-card">匿名資料</span>
      <span class="u36-scene-card">案例線索</span>
      <span class="u36-scene-card">觀察資料</span>
      <span class="u36-scene-card">資料邊界</span>
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
    ${renderScenePicture(prefix, alt || "人類的 生物技術任務場景")}
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
  if (question.id !== "biotechnology_q04" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
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
  const attemptId = uid("biotechnology_guest_attempt");
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
  earned.push("biotechnology_entry");
  if (passed(["biotechnology_q01"])) earned.push("biotech_basic_definition_reader");
  if (passed(["biotechnology_q02"])) earned.push("biotech_example_classifier");
  if (passed(["biotechnology_q03", "biotechnology_q04"])) earned.push("breeding_tissue_culture_identifier");
  if (passed(["biotechnology_q05", "biotechnology_q06"])) earned.push("cloning_gene_transfer_basic_reader");
  if (passed(["biotechnology_q07"])) earned.push("biotech_application_purpose_mapper");
  if (passed(["biotechnology_q08", "biotechnology_q14"])) earned.push("benefit_risk_context_judger");
  if (passed(["biotechnology_q09"])) earned.push("limited_evidence_scope_reader");
  if (passed(["biotechnology_q10"])) earned.push("information_claim_guard");
  if (passed(["biotechnology_q11"])) earned.push("privacy_ethics_guard");
  if (passed(["biotechnology_q12"])) earned.push("cloning_gene_transfer_comparer");
  if (passed(["biotechnology_q13"])) earned.push("u35_u36_u37_boundary_classifier");
  if (flawless) earned.push("biotechnology_flawless");
  if (["specific_uncertainty", "discussion_question"].includes(reflection.reflection_quality)) earned.push("biotechnology_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_biotechnology");
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
  if (["biotechnology_q01", "biotechnology_q02", "biotechnology_q03", "biotechnology_q04"].includes(questionId)) return "biotech_basic_model";
  if (["biotechnology_q05", "biotechnology_q06", "biotechnology_q07", "biotechnology_q12"].includes(questionId)) return "biotech_methods_distinction";
  if (["biotechnology_q08", "biotechnology_q09", "biotechnology_q10", "biotechnology_q11", "biotechnology_q14"].includes(questionId)) return "biotech_evidence_ethics";
  if (["biotechnology_q13"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "biotechnology_cp1_definition_examples",
    checkpoint2: "biotechnology_cp2_methods",
    checkpoint3: "biotechnology_cp3_evidence_ethics",
    checkpoint4: "biotechnology_cp4_unit_boundary"
  }[section] || "biotechnology_cp5_reflection";
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
        <h2 class="hero-title">生物技術</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene biotechnology-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "生物技術中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務使用中性案例與資料卡，練習生物技術概念、用途、證據範圍與相鄰單元邊界判讀。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入生技案例判讀前，先抓住四個判讀線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "生物技術準備場景" })}<div><h3>先分清概念類型、用途、證據範圍與課堂邊界。</h3><p>本任務只使用匿名、假設與公開概念資料，不要求任何同學提供家庭、健康、基因檢測或真實個人資料。</p></div></div><div class="concept-grid"><article><strong>基本概念</strong><p>生物技術和生物、生命作用或生物組成有關，不是只看新不新。</p></article><article><strong>方法線索</strong><p>分辨傳統育種、組織培養、複製與基因轉殖。</p></article><article><strong>資料判讀</strong><p>讀取表格、文章摘句與案例卡，只判斷資料能支持的範圍。</p></article><article><strong>任務邊界</strong><p>把 U35、U36、U37 和非課前任務分清楚。</p></article></div><button class="primary" data-next="checkpoint1">開始生物技術任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["定義與常見例子", "確認生物技術定義、案例分類、傳統育種與組織培養。"],
    checkpoint2: ["方法與用途線索", "分辨複製、基因轉殖、用途配對與方法差異。"],
    checkpoint3: ["證據、資訊與倫理", "讀取資料表、文章摘句與情境，練習不過度推論。"],
    checkpoint4: ["相鄰單元邊界", "分辨 U35、U36、U37 與不適合課前任務的內容。"]
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
    biotech_basic_definition: "生物技術定義",
    biotech_example_classification: "生技案例分類",
    traditional_breeding: "傳統育種",
    tissue_culture_basic: "組織培養",
    cloning_basic: "複製概念",
    gene_transfer_basic: "基因轉殖概念",
    application_purpose: "應用與用途",
    benefit_risk_ethics: "效益風險與倫理",
    evidence_based_judgment: "資料支持範圍",
    information_claim_literacy: "資訊宣稱判讀",
    ethics_privacy_discussion: "匿名與尊重討論",
    cloning_gene_transfer_distinction: "複製與基因轉殖比較",
    unit_boundary_control: "單元邊界",
    biotech_risk_balance: "風險效益脈絡"
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "biotechnology_q09") return `<div class="evidence-card evidence-table-card biotech-data-evidence" role="group" aria-label="資料表列出兩個作物案例在同一季觀察中的受害葉片比例、觀察條件與資料限制。"><strong>農業生技資料</strong><div class="biotech-data-table" role="table" aria-label="農業生技觀察資料表"><div role="row"><span role="columnheader">案例代碼</span><span role="columnheader">案例類型</span><span role="columnheader">受害葉片比例</span><span role="columnheader">觀察條件</span><span role="columnheader">資料限制</span></div><div role="row"><span role="cell">B1</span><span role="cell">具有抗某害蟲基因特徵的作物案例</span><span role="cell">12%</span><span role="cell">同一地區、同一季、同一種害蟲壓力下的觀察資料</span><span role="cell">未提供長期生態、食品安全、政策或醫療資料</span></div><div role="row"><span role="cell">C1</span><span role="cell">同田區比較品系</span><span role="cell">38%</span><span role="cell">同一地區、同一季、同一種害蟲壓力下的觀察資料</span><span role="cell">未提供長期生態、食品安全、政策或醫療資料</span></div></div><p class="muted">資料表列出兩個作物案例在同一季觀察中的受害葉片比例、觀察條件與資料限制。</p></div>`;
  if (qid === "biotechnology_q10") return `<div class="evidence-card biotech-article-excerpt" role="group" aria-label="文章摘句卡，列出一則關於生物技術的評論句。"><strong>文章摘句卡</strong><blockquote>這項技術保證百分之百安全，反對者都不懂科學！</blockquote><p class="muted">文章摘句卡，列出一則關於生物技術的評論句。</p></div>`;
  if (qid === "biotechnology_q12") return `<div class="evidence-card biotech-comparison-cards" role="group" aria-label="兩張案例卡，各描述一種生物技術案例線索。"><strong>生技案例比較卡</strong><div class="biotech-comparison-cards-grid"><article><span class="model-field-label">案例一</span><span class="model-field-value">由來源個體的細胞取得遺傳資訊，產生與來源個體遺傳資訊大致相同的個體。</span></article><article><span class="model-field-label">案例二</span><span class="model-field-value">讓某生物具有來自其他生物或被改變的基因特徵，使它出現特定性狀。</span></article></div><p class="muted">兩張案例卡，各描述一種生物技術案例線索。</p></div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的生技案例判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的生物技術概念、用途、資料支持範圍與單元邊界。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  biotech_definition_confusion: "建議再確認生物技術定義：重點是利用生物、生命作用或生物組成，不是只看新或昂貴。",
  biotech_type_confusion: "建議再確認常見例子：傳統育種、組織培養、複製、基因轉殖與非 U36 任務要分開。",
  breeding_equals_gene_engineering_confusion: "建議再確認傳統育種：它可透過選拔與交配累積性狀，不等於基因轉殖。",
  tissue_culture_confusion: "建議再確認組織培養：看植物小部分組織與大量相似植株線索，不問操作流程。",
  cloning_sexual_reproduction_confusion: "建議再確認複製：重點是與來源個體遺傳資訊大致相同。",
  gmo_all_harmful_or_all_safe_confusion: "建議再確認基因轉殖與風險判讀：不能用全部有害或完全零風險概括。",
  application_purpose_confusion: "建議再確認用途配對：只看案例線索，不延伸成政策、食品安全或醫療建議。",
  technology_new_is_better_confusion: "建議再確認判斷方式：效益、風險、用途、證據與可能影響要一起看。",
  evidence_policy_overclaim_confusion: "建議再確認資料支持範圍：表格只支持它實際呈現的條件與範圍。",
  information_overclaim_confusion: "建議再確認資訊宣稱：保證式、攻擊式語句不能直接當作證據。",
  privacy_ethics_confusion: "建議再確認匿名與尊重：討論生物技術不蒐集同學或家庭敏感資料。",
  cloning_gene_transfer_confusion: "建議再確認複製與基因轉殖：比較遺傳資訊相似與基因特徵被加入或改變。",
  u35_u36_u37_boundary_confusion: "建議再確認 U35、U36、U37 與非課前任務的邊界。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從生物技術定義、傳統育種、組織培養、複製、基因轉殖、資料支持範圍、資訊宣稱、匿名與尊重或 U35-U37 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：生物技術是利用生物或生命作用解決問題"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認農業生技資料表能支持到哪個判斷範圍。">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "生物技術結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>生技案例判讀任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與生物技術定義、方法、資料支持範圍、資訊宣稱、匿名與尊重或 U35-U37 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__biotechnologyTest = {
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
