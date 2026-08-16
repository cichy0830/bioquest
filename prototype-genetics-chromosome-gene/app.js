const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260816-genetics-chromosome-gene-functional-build-v1";
const QUESTION_VERSION = "20260725-genetics-chromosome-gene-v1.1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_genetics_chromosome_gene_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_genetics_chromosome_gene_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "genetics_chromosome_gene",
  "unit_title": "遺傳、染色體與基因",
  "mission_title": "遺傳訊息追蹤任務",
  "mission_area": "生命延續資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  geneLocationImage: "assets/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base.webp",
  geneLocationImage1440: "assets/sizes/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-1440w.webp",
  geneLocationImage960: "assets/sizes/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-960w.webp",
  geneLocationImage390: "assets/sizes/u32-genetics-chromosome-gene-q06-v4-gene-location-zero-text-base-390w.webp"
};

const readyBadgeIds = new Set([]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/genetics_chromosome_gene/badge-genetics_chromosome_gene-${id}.webp`
  : "";
const reflectionRules = {
  "conceptTerms": [
    "遺傳、染色體與基因",
    "遺傳",
    "親代",
    "子代",
    "性狀",
    "可遺傳",
    "後天",
    "細胞核",
    "染色體",
    "DNA",
    "基因",
    "遺傳訊息",
    "環境",
    "觀察證據",
    "推論",
    "單元邊界"
  ],
  "irrelevantTerms": [
    "老師好帥",
    "帥",
    "下課",
    "遊戲",
    "天氣",
    "好笑",
    "午餐",
    "放假"
  ],
  "lowEffortTerms": [
    "不知道",
    "沒有",
    "不會",
    "好難",
    "看不懂",
    "都不懂",
    "我會了",
    "沒問題",
    "不知道怎麼問"
  ],
  "copiedDirections": [
    "親代子代",
    "染色體DNA基因",
    "細胞核",
    "性狀分類",
    "單元邊界"
  ]
};

const badges = [
  [
    "genetics_chromosome_gene_entry",
    "遺傳訊息入門",
    "完成遺傳、染色體與基因任務。"
  ],
  [
    "trait_heredity_starter",
    "性狀遺傳起點",
    "能以親代、子代與性狀描述遺傳現象。"
  ],
  [
    "trait_acquired_state_classifier",
    "性狀與後天狀態分類",
    "能區分可觀察性狀、短期狀態與學習訓練結果。"
  ],
  [
    "environment_trait_evidence_reader",
    "環境性狀證據判讀",
    "能用資料分辨環境影響與可遺傳線索。"
  ],
  [
    "genetic_hierarchy_sequencer",
    "遺傳層級排序",
    "能排出細胞、細胞核、染色體、DNA、基因的層級。"
  ],
  [
    "chromosome_dna_gene_mapper",
    "染色體 DNA 基因配對",
    "能把染色體、DNA、基因與性狀配到正確角色。"
  ],
  [
    "gene_location_identifier",
    "基因位置辨識",
    "能從核准圖像中辨識基因位在 DNA 的一段。"
  ],
  [
    "chromosome_location_reader",
    "染色體位置判讀",
    "能判讀染色體主要位於細胞核內。"
  ],
  [
    "chromosome_dna_gene_relation_reader",
    "染色體 DNA 基因關係判讀",
    "能說明染色體、DNA 與基因的基本關係。"
  ],
  [
    "heredity_data_interpreter",
    "遺傳資料判讀",
    "能從親代、子代資料判讀遺傳現象。"
  ],
  [
    "calculation_boundary_guard",
    "計算邊界守門",
    "能辨識本單元不處理遺傳機率計算。"
  ],
  [
    "trait_factor_reasoner",
    "性狀因素推理",
    "能分辨遺傳與環境可能共同影響觀察結果。"
  ],
  [
    "u31_u32_u33_u34_genetics_boundary_guardian",
    "遺傳單元邊界守門",
    "能區分 U31 花的觀察、U32 染色體與基因、U33 人體遺傳與 U34 ABO 血型。"
  ],
  [
    "genetics_chromosome_gene_flawless",
    "遺傳訊息零提示全對",
    "全部答對且全程未使用提示。"
  ],
  [
    "genetics_chromosome_gene_reflection_reporter",
    "高品質遺傳、染色體與基因回報",
    "回報品質達 discussion_question。"
  ],
  [
    "retry_growth_genetics_chromosome_gene",
    "再探遺傳訊息精熟進步",
    "再挑戰完整完成且正確率進步。"
  ]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "pending" }));

const traitClassificationChoices = [
  { "id": "observable_trait", "text": "可觀察的性狀" },
  { "id": "acquired_or_short_term_state", "text": "短期或後天狀態" },
  { "id": "learned_or_training_result", "text": "學習或訓練結果" },
  { "id": "not_enough_evidence", "text": "資料不足，不能判定可遺傳" }
];

const geneticConceptChoices = [
  { "id": "carries_genetic_information_in_nucleus", "text": "主要位於細胞核內，可攜帶遺傳訊息" },
  { "id": "genetic_information_material", "text": "遺傳訊息的物質基礎" },
  { "id": "dna_segment_related_to_trait", "text": "DNA 上和性狀有關的一段" },
  { "id": "observable_or_describable_feature", "text": "可觀察或描述的特徵" }
];

const boundaryChoices = [
  {
    "id": "u31_flower_observation",
    "text": "第 31 站：花的觀察"
  },
  {
    "id": "u32_genetics_chromosome_gene",
    "text": "第 32 站：遺傳、染色體與基因"
  },
  {
    "id": "u33_human_genetics",
    "text": "第 33 站：人類的遺傳"
  },
  {
    "id": "u34_abo_blood_type",
    "text": "第 34 站：ABO 血型"
  }
];

const questions = [
  {
    "id": "genetics_chromosome_gene_q01",
    "section": "checkpoint1",
    "concept": "heredity_trait_intro",
    "skill_tag": "heredity_trait_intro",
    "type": "choice",
    "answer": "parent_to_offspring_trait_similarity",
    "prompt": "下列哪個敘述最符合「遺傳」的基本意思？",
    "hint": "想想親代和子代之間，哪些特徵可能有連續關係。",
    "misconception": "heredity_as_any_change_confusion",
    "options": [
      { "id": "parent_to_offspring_trait_similarity", "text": "親代能把和性狀有關的遺傳訊息傳給子代，使子代可能和親代有相似特徵" },
      { "id": "practice_changes_all_offspring", "text": "只要親代努力練習，子代一定會直接得到同樣能力" },
      { "id": "sunburn_is_inherited_immediately", "text": "今天曬太陽造成皮膚變紅，就是立即遺傳給下一代" },
      { "id": "any_living_change_is_heredity", "text": "生物身上任何短暫改變都稱為遺傳" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q02",
    "section": "checkpoint1",
    "concept": "trait_state_classification",
    "skill_tag": "trait_state_classifier",
    "type": "mapping",
    "answer": {
      "pea_flower_color": "observable_trait",
      "plant_fruit_shape": "observable_trait",
      "sun_red_skin_today": "acquired_or_short_term_state",
      "running_speed_after_practice": "learned_or_training_result"
    },
    "prompt": "請把下列例子分類到最合適的說明。",
    "hint": "先判斷這是穩定可描述的性狀，還是短期狀態或訓練結果。",
    "misconception": "trait_acquired_state_confusion",
    "items": [
      { "id": "pea_flower_color", "label": "豌豆花色" },
      { "id": "plant_fruit_shape", "label": "植物果實形狀" },
      { "id": "sun_red_skin_today", "label": "今天曬太陽後皮膚變紅" },
      { "id": "running_speed_after_practice", "label": "練習後跑步速度變快" }
    ],
    "choices": traitClassificationChoices
  },
  {
    "id": "genetics_chromosome_gene_q03",
    "section": "checkpoint1",
    "concept": "environment_trait_evidence",
    "skill_tag": "environment_trait_evidence",
    "type": "choice",
    "answer": "environment_can_affect_trait_expression_not_gene_change",
    "prompt": "同一種植物分成兩組栽培，光照較足的一組長得較高。下列哪個判讀較合適？",
    "hint": "資料只顯示環境條件不同後的外觀差異，還不能直接判定遺傳訊息改變。",
    "misconception": "environment_gene_change_confusion",
    "options": [
      { "id": "environment_can_affect_trait_expression_not_gene_change", "text": "環境可能影響觀察到的表現，但不能只憑這筆資料說基因已改變" },
      { "id": "light_changes_gene_into_height", "text": "光照會把所有基因直接變成長高基因" },
      { "id": "height_never_related_to_environment", "text": "高度一定只由遺傳決定，環境完全無關" },
      { "id": "practice_is_chromosome_increase", "text": "練習或照顧會讓染色體數量固定增加" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q04",
    "section": "checkpoint2",
    "concept": "genetic_hierarchy",
    "skill_tag": "genetic_hierarchy_sequence",
    "type": "sequence",
    "answer": [
      "cell",
      "nucleus",
      "chromosome",
      "dna",
      "gene"
    ],
    "prompt": "請把遺傳訊息從較大的構造到較小的單位排序。",
    "hint": "先從細胞裡的位置想，再往攜帶遺傳訊息的物質與片段整理。",
    "misconception": "genetic_hierarchy_sequence_confusion",
    "steps": [
      { "id": "cell", "label": "細胞" },
      { "id": "nucleus", "label": "細胞核" },
      { "id": "chromosome", "label": "染色體" },
      { "id": "dna", "label": "DNA" },
      { "id": "gene", "label": "基因" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q05",
    "section": "checkpoint2",
    "concept": "chromosome_dna_gene_relation",
    "skill_tag": "chromosome_dna_gene_mapper",
    "type": "mapping",
    "answer": {
      "chromosome": "carries_genetic_information_in_nucleus",
      "dna": "genetic_information_material",
      "gene": "dna_segment_related_to_trait",
      "trait": "observable_or_describable_feature"
    },
    "prompt": "請把遺傳相關名詞配到最合適的說明。",
    "hint": "先分辨構造、物質、片段與觀察到的特徵。",
    "misconception": "chromosome_dna_gene_trait_match_confusion",
    "items": [
      { "id": "chromosome", "label": "染色體" },
      { "id": "dna", "label": "DNA" },
      { "id": "gene", "label": "基因" },
      { "id": "trait", "label": "性狀" }
    ],
    "choices": geneticConceptChoices
  },
  {
    "id": "genetics_chromosome_gene_q06",
    "section": "checkpoint2",
    "concept": "gene_location",
    "skill_tag": "gene_location_identifier",
    "type": "image_select",
    "answer": "gene_is_dna_segment",
    "prompt": "依圖中標示，下列哪個說法最符合基因的位置？",
    "hint": "觀察圖中細胞核、染色體、DNA 與被框出的片段關係。",
    "misconception": "gene_location_confusion",
    "options": [
      { "id": "gene_is_dna_segment", "text": "基因是 DNA 上和性狀有關的一段" },
      { "id": "gene_is_whole_cell", "text": "基因就是整個細胞" },
      { "id": "gene_is_cell_wall", "text": "基因主要位在細胞壁上" },
      { "id": "gene_is_short_term_state", "text": "基因是今天觀察到的短期狀態" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q07",
    "section": "checkpoint2",
    "concept": "chromosome_location",
    "skill_tag": "chromosome_location_reader",
    "type": "choice",
    "answer": "chromosome_mainly_in_nucleus",
    "prompt": "下列哪個說法較符合染色體在細胞中的位置？",
    "hint": "先想細胞內哪個構造和遺傳訊息保存最有關。",
    "misconception": "chromosome_location_confusion",
    "options": [
      { "id": "chromosome_mainly_in_nucleus", "text": "染色體主要位於細胞核內，和遺傳訊息有關" },
      { "id": "chromosome_in_cell_wall_only", "text": "染色體只存在細胞壁中" },
      { "id": "chromosome_is_external_trait", "text": "染色體就是外表看見的性狀本身" },
      { "id": "chromosome_only_in_food", "text": "染色體只存在食物養分中" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q08",
    "section": "checkpoint2",
    "concept": "dna_gene_relation",
    "skill_tag": "chromosome_dna_gene_relation_reader",
    "type": "choice",
    "answer": "genes_are_segments_on_dna",
    "prompt": "關於 DNA 與基因的關係，下列哪個說法較合理？",
    "hint": "想想基因是不是整條 DNA，還是 DNA 上與性狀有關的一段。",
    "misconception": "gene_equals_whole_dna_confusion",
    "options": [
      { "id": "genes_are_segments_on_dna", "text": "基因可以看作 DNA 上和某些性狀有關的一段" },
      { "id": "dna_is_only_food_energy", "text": "DNA 主要是提供細胞能量的食物" },
      { "id": "gene_is_larger_than_cell", "text": "基因比整個細胞還大" },
      { "id": "trait_is_inside_dna_as_picture", "text": "性狀會以完整外觀照片直接放在 DNA 裡" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q09",
    "section": "checkpoint3",
    "concept": "heredity_data_interpretation",
    "skill_tag": "heredity_data_interpreter",
    "type": "choice",
    "answer": "offspring_trait_matches_parent_pattern",
    "prompt": "資料顯示：某植物親代多為紫花，子代中也多出現紫花。這筆資料最適合支持哪個推論？",
    "hint": "只根據親代與子代的性狀資料做保守判讀，不進行比例計算。",
    "misconception": "heredity_data_overclaim_confusion",
    "options": [
      { "id": "offspring_trait_matches_parent_pattern", "text": "子代性狀可能和親代遺傳訊息有關" },
      { "id": "must_calculate_hidden_probability", "text": "一定可以算出完整遺傳機率" },
      { "id": "flower_color_is_not_trait", "text": "花色不是可觀察的性狀" },
      { "id": "all_purple_from_practice", "text": "紫花一定是植物後天練習造成" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q10",
    "section": "checkpoint3",
    "concept": "calculation_boundary",
    "skill_tag": "calculation_boundary_guard",
    "type": "choice",
    "answer": "this_unit_stops_before_probability_calculation",
    "prompt": "有同學想用棋盤方格計算子代比例。依本單元範圍，下列處理較合適？",
    "hint": "本單元先確認染色體、DNA、基因與性狀的基本關係，遺傳機率計算是後續單元。",
    "misconception": "genetics_probability_boundary_confusion",
    "options": [
      { "id": "this_unit_stops_before_probability_calculation", "text": "先整理染色體、DNA、基因與性狀關係，不在本單元計算機率" },
      { "id": "must_compute_ratio_now", "text": "本單元一定要算出所有子代比例" },
      { "id": "ignore_gene_concept", "text": "只要會算比例，就不用理解基因是什麼" },
      { "id": "probability_replaces_observation", "text": "機率計算可以取代所有觀察資料" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q11",
    "section": "checkpoint3",
    "concept": "trait_factor_reasoning",
    "skill_tag": "trait_factor_reasoner",
    "type": "choice",
    "answer": "trait_can_be_related_to_genes_and_environment",
    "prompt": "某植物品系在不同水分條件下葉片大小不同。下列哪個說法較符合科學判讀？",
    "hint": "觀察到的性狀表現可能和遺傳訊息有關，也可能受到環境條件影響。",
    "misconception": "single_factor_trait_confusion",
    "options": [
      { "id": "trait_can_be_related_to_genes_and_environment", "text": "性狀表現可能和遺傳訊息及環境條件都有關" },
      { "id": "environment_never_matters", "text": "環境完全不可能影響性狀表現" },
      { "id": "genes_change_every_hour", "text": "水分不同會讓所有基因每小時重組一次" },
      { "id": "leaf_size_not_trait", "text": "葉片大小不能作為可觀察特徵" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q12",
    "section": "checkpoint3",
    "concept": "anonymous_human_trait_boundary",
    "skill_tag": "human_trait_boundary",
    "type": "choice",
    "answer": "use_anonymous_trait_model_without_private_data",
    "prompt": "課堂想討論人類性狀例子時，下列哪個做法較符合本單元邊界與隱私原則？",
    "hint": "本單元可用匿名模型理解性狀，不需要蒐集同學個資或討論醫療議題。",
    "misconception": "human_trait_privacy_boundary_confusion",
    "options": [
      { "id": "use_anonymous_trait_model_without_private_data", "text": "使用匿名模型或假想資料討論性狀，不收集同學個人資料" },
      { "id": "collect_family_medical_records", "text": "要求同學交出家族病史才能上課" },
      { "id": "rank_students_by_traits", "text": "用同學外表特徵分組排名" },
      { "id": "diagnose_disease_from_trait", "text": "依外觀直接判定某人疾病或基因型" }
    ]
  },
  {
    "id": "genetics_chromosome_gene_q13",
    "section": "checkpoint4",
    "concept": "unit_boundary_control",
    "skill_tag": "unit_boundary_control",
    "type": "mapping",
    "answer": {
      "flower_anther_stigma_ovary_ovule": "u31_flower_observation",
      "chromosome_dna_gene_trait_basic": "u32_genetics_chromosome_gene",
      "human_trait_anonymous_model": "u33_human_genetics",
      "abo_blood_type_possibility": "u34_abo_blood_type"
    },
    "prompt": "請把下列內容分到最合適的單元位置。",
    "hint": "先判斷是花部觀察、染色體與基因、人體遺傳，還是 ABO 血型可能性。",
    "misconception": "genetics_unit_boundary_classification_confusion",
    "items": [
      { "id": "flower_anther_stigma_ovary_ovule", "label": "花藥、柱頭、子房與胚珠觀察" },
      { "id": "chromosome_dna_gene_trait_basic", "label": "染色體、DNA、基因與性狀基本關係" },
      { "id": "human_trait_anonymous_model", "label": "以匿名資料討論人類性狀" },
      { "id": "abo_blood_type_possibility", "label": "ABO 血型可能性判讀" }
    ],
    "choices": boundaryChoices
  },
  {
    "id": "genetics_chromosome_gene_q14",
    "section": "checkpoint4",
    "concept": "unit_boundary_control",
    "skill_tag": "unit_boundary_control",
    "type": "choice",
    "answer": "chromosome_gene_trait_basic_belongs_u32",
    "prompt": "下列哪個情境最適合放在「遺傳、染色體與基因」本單元核心檢核？",
    "hint": "本單元聚焦染色體、DNA、基因與性狀的基本關係，不處理遺傳機率計算或醫療議題。",
    "misconception": "genetics_chromosome_gene_boundary_confusion",
    "options": [
      { "id": "chromosome_gene_trait_basic_belongs_u32", "text": "用模型整理染色體、DNA、基因與性狀的基本關係" },
      { "id": "flower_part_labeling_belongs_u31", "text": "標記花藥、柱頭、子房與胚珠的位置" },
      { "id": "abo_probability_belongs_u34", "text": "推論 ABO 血型可能性" },
      { "id": "embryo_medical_topic_out_of_scope", "text": "討論人體胚胎醫療技術" }
    ]
  }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  "checkpoint1": [
    "genetics_chromosome_gene_q01",
    "genetics_chromosome_gene_q02",
    "genetics_chromosome_gene_q03"
  ],
  "checkpoint2": [
    "genetics_chromosome_gene_q04",
    "genetics_chromosome_gene_q05",
    "genetics_chromosome_gene_q06",
    "genetics_chromosome_gene_q07",
    "genetics_chromosome_gene_q08"
  ],
  "checkpoint3": [
    "genetics_chromosome_gene_q09",
    "genetics_chromosome_gene_q10",
    "genetics_chromosome_gene_q11",
    "genetics_chromosome_gene_q12"
  ],
  "checkpoint4": [
    "genetics_chromosome_gene_q13",
    "genetics_chromosome_gene_q14"
  ]
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
    return `<div class="u32-scene-neutral" role="img" aria-label="${escapeHtml(alt || "遺傳、染色體與基因中性任務場景")}">
      <span class="u32-scene-strand"></span>
      <span class="u32-scene-card">細胞核</span>
      <span class="u32-scene-card">染色體</span>
      <span class="u32-scene-card">DNA</span>
      <span class="u32-scene-card">基因</span>
    </div>`;
  }
  return `<picture class="u32-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u32-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u32-page-scene u32-${prefix}-scene ${className}" data-u32-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "遺傳、染色體與基因任務場景")}
    ${azhe ? `<img class="u32-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u32-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl && owlSrc ? `<img class="u32-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u32-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
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
  if (question.id !== "genetics_chromosome_gene_q04" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
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
  const attemptId = uid("genetics_chromosome_gene_guest_attempt");
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
      skill_tag: questionMap[id].concept,
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
  const directExp = Math.round(DIRECT_EXP_POOL * (directCorrect / logs.length));
  const revisionExp = Math.round(REVISION_EXP_POOL * (revisedCorrect / logs.length));
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
    revision_exp: revisionExp,
    reflection_exp: reflection.question_exp,
    mastery_exp: masteryExp,
    retry_exp: retryExp,
    attempt_exp: totalExp,
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
  earned.push("genetics_chromosome_gene_entry");
  if (passed(["genetics_chromosome_gene_q01"])) earned.push("trait_heredity_starter");
  if (passed(["genetics_chromosome_gene_q02"])) earned.push("trait_acquired_state_classifier");
  if (passed(["genetics_chromosome_gene_q03"])) earned.push("environment_trait_evidence_reader");
  if (passed(["genetics_chromosome_gene_q04"])) earned.push("genetic_hierarchy_sequencer");
  if (passed(["genetics_chromosome_gene_q05"])) earned.push("chromosome_dna_gene_mapper");
  if (passed(["genetics_chromosome_gene_q06"])) earned.push("gene_location_identifier");
  if (passed(["genetics_chromosome_gene_q07"])) earned.push("chromosome_location_reader");
  if (passed(["genetics_chromosome_gene_q08"])) earned.push("chromosome_dna_gene_relation_reader");
  if (passed(["genetics_chromosome_gene_q09"])) earned.push("heredity_data_interpreter");
  if (passed(["genetics_chromosome_gene_q10"])) earned.push("calculation_boundary_guard");
  if (passed(["genetics_chromosome_gene_q11", "genetics_chromosome_gene_q12"])) earned.push("trait_factor_reasoner");
  if (passed(["genetics_chromosome_gene_q13", "genetics_chromosome_gene_q14"])) earned.push("u31_u32_u33_u34_genetics_boundary_guardian");
  if (flawless) earned.push("genetics_chromosome_gene_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("genetics_chromosome_gene_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_genetics_chromosome_gene");
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
  if (["genetics_chromosome_gene_q01", "genetics_chromosome_gene_q02", "genetics_chromosome_gene_q03"].includes(questionId)) return "trait_and_heredity";
  if (["genetics_chromosome_gene_q04", "genetics_chromosome_gene_q05", "genetics_chromosome_gene_q06", "genetics_chromosome_gene_q07", "genetics_chromosome_gene_q08"].includes(questionId)) return "chromosome_dna_gene";
  if (["genetics_chromosome_gene_q09", "genetics_chromosome_gene_q10", "genetics_chromosome_gene_q11", "genetics_chromosome_gene_q12"].includes(questionId)) return "heredity_evidence_boundary";
  if (["genetics_chromosome_gene_q13", "genetics_chromosome_gene_q14"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "genetics_chromosome_gene_cp1_trait_and_heredity",
    checkpoint2: "genetics_chromosome_gene_cp2_chromosome_dna_gene",
    checkpoint3: "genetics_chromosome_gene_cp3_evidence_and_boundary",
    checkpoint4: "genetics_chromosome_gene_cp4_boundary"
  }[section] || "genetics_chromosome_gene_cp5_reflection";
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
        <h2 class="hero-title">遺傳、染色體與基因</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene genetics-chromosome-gene-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "遺傳、染色體與基因中性簡報場景" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務會從親代與子代的性狀線索出發，整理細胞核、染色體、DNA、基因與性狀之間的基本關係。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入生命延續資料庫前，先抓住四個遺傳訊息線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { alt: "遺傳、染色體與基因準備場景" })}<div><h3>先把「看得到的性狀」和「細胞內攜帶遺傳訊息的構造」分開整理。</h3><p>本任務會用文字資料、層級排序、核准 q06 圖像證據與單元邊界題，幫你建立染色體、DNA、基因與性狀的基本連結。</p></div></div><div class="concept-grid"><article><strong>性狀與遺傳</strong><p>先看親代、子代資料與可觀察特徵，不把短期狀態直接當遺傳。</p></article><article><strong>層級關係</strong><p>從細胞到細胞核，再整理染色體、DNA 與基因的位置關係。</p></article><article><strong>證據判讀</strong><p>根據資料做保守推論，不直接跳到機率計算或醫療結論。</p></article><article><strong>守住邊界</strong><p>U31 看花的觀察；U32 看染色體與基因；U33、U34 才延伸到人體遺傳與 ABO 血型。</p></article></div><button class="primary" data-next="checkpoint1">開始遺傳、染色體與基因任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["性狀、遺傳與環境線索", "先確認親代、子代、性狀與後天狀態的差異。"],
    checkpoint2: ["細胞核、染色體、DNA 與基因", "用層級排序、名詞配對與 q06 核准圖像整理遺傳訊息的位置。"],
    checkpoint3: ["資料判讀與邊界控制", "用資料做保守推論，避免跳到機率計算或隱私醫療議題。"],
    checkpoint4: ["相鄰單元邊界", "把 U31 花的觀察、U32 染色體與基因、U33 人體遺傳與 U34 ABO 血型分清楚。"]
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
    heredity_trait_intro: "遺傳與性狀",
    trait_state_classification: "性狀分類",
    environment_trait_evidence: "環境與性狀證據",
    genetic_hierarchy: "遺傳層級",
    chromosome_dna_gene_relation: "染色體 DNA 基因",
    gene_location: "基因位置",
    chromosome_location: "染色體位置",
    dna_gene_relation: "DNA 與基因",
    heredity_data_interpretation: "遺傳資料判讀",
    calculation_boundary: "計算邊界",
    trait_factor_reasoning: "性狀因素推理",
    anonymous_human_trait_boundary: "隱私與邊界",
    unit_boundary_control: "單元邊界"
  }[concept] || concept;
}


function renderQuestionEvidence(qid) {
  if (qid === "genetics_chromosome_gene_q03") return `<div class="evidence-card evidence-table-card"><strong>觀察資料</strong><div class="data-table two-column" role="table" aria-label="環境條件與外觀紀錄"><div role="row"><span role="columnheader">條件</span><span role="columnheader">觀察</span></div><div role="row"><span role="cell">光照較足</span><span role="cell">平均高度較高</span></div><div role="row"><span role="cell">光照較少</span><span role="cell">平均高度較低</span></div></div><p class="muted">請依資料判斷，避免直接宣稱遺傳訊息已改變。</p></div>`;
  if (qid === "genetics_chromosome_gene_q06") return `
    <figure class="question-asset gene-location-figure">
      <picture>
        <source srcset="${assets.geneLocationImage390}?v=${VERSION}" media="(max-width: 520px)">
        <source srcset="${assets.geneLocationImage960}?v=${VERSION}" media="(max-width: 860px)">
        <source srcset="${assets.geneLocationImage1440}?v=${VERSION}" media="(max-width: 1280px)">
        <img src="${assets.geneLocationImage}?v=${VERSION}" alt="未標註的遺傳訊息位置示意圖，呈現細胞核、染色體、DNA 與被框選片段的位置關係" onerror="this.closest('.question-asset')?.classList.add('asset-fallback'); this.remove();">
      </picture>
      <figcaption>
        <strong>q06 圖像證據</strong>
        <span>觀察圖中不同層級的位置關係，再依題目選出最合適的說法。</span>
      </figcaption>
      <div class="target-list" aria-label="等效觀察清單">
        <span>細胞核位置</span>
        <span>染色體位置</span>
        <span>DNA 長條結構</span>
        <span>框選片段</span>
      </div>
    </figure>`;
  if (qid === "genetics_chromosome_gene_q09") return `<div class="evidence-card evidence-table-card"><strong>親子代資料</strong><div class="data-table" role="table" aria-label="親代與子代性狀資料"><div role="row"><span role="columnheader">資料組</span><span role="columnheader">可觀察性狀</span></div><div role="row"><span role="cell">親代</span><span role="cell">多數樣本呈紫花</span></div><div role="row"><span role="cell">子代</span><span role="cell">多數樣本也呈紫花</span></div></div></div>`;
  if (qid === "genetics_chromosome_gene_q11") return `<div class="evidence-card evidence-table-card"><strong>條件紀錄</strong><div class="data-table two-column" role="table" aria-label="水分條件與葉片大小紀錄"><div role="row"><span role="columnheader">觀察條件</span><span role="columnheader">外觀紀錄</span></div><div role="row"><span role="cell">水分供應較穩定</span><span role="cell">平均葉片較大</span></div><div role="row"><span role="cell">水分供應較少</span><span role="cell">平均葉片較小</span></div></div></div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的遺傳、染色體與基因判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的遺傳、染色體與基因概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  heredity_as_any_change_confusion: "建議再確認遺傳：親代傳給子代的是和性狀有關的遺傳訊息，不是所有短期變化。",
  trait_acquired_state_confusion: "建議再分辨可觀察性狀、短期狀態與訓練結果。",
  environment_gene_change_confusion: "建議再讀環境資料：環境會影響表現，但不能直接說基因已改變。",
  genetic_hierarchy_sequence_confusion: "建議再整理細胞、細胞核、染色體、DNA、基因的層級順序。",
  chromosome_dna_gene_trait_match_confusion: "建議再配對染色體、DNA、基因與性狀的角色。",
  gene_location_confusion: "建議再觀察 q06 圖像：基因是 DNA 上和性狀有關的一段。",
  chromosome_location_confusion: "建議再確認染色體主要位於細胞核內。",
  gene_equals_whole_dna_confusion: "建議再分清 DNA 與基因：基因不是整條 DNA，而是 DNA 上的一段。",
  heredity_data_overclaim_confusion: "建議再練習資料判讀：資料可支持遺傳關聯，但本單元不做機率過度推論。",
  genetics_probability_boundary_confusion: "建議再守住範圍：本單元先建基本關係，不處理棋盤方格機率。",
  single_factor_trait_confusion: "建議再分辨性狀表現可能同時受遺傳與環境影響。",
  human_trait_privacy_boundary_confusion: "建議再注意人類性狀討論需使用匿名模型，不蒐集同學個資或做醫療判斷。",
  genetics_unit_boundary_classification_confusion: "建議再確認 U31-U34 的單元邊界。",
  genetics_chromosome_gene_boundary_confusion: "建議再確認本單元核心：染色體、DNA、基因與性狀的基本關係。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從親代與子代、性狀、細胞核、染色體、DNA、基因、環境影響、資料判讀或單元邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：基因是 DNA 上和性狀有關的一段"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認染色體、DNA 和基因的層級關係，應該怎麼用圖說明？">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "遺傳、染色體與基因結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>遺傳訊息追蹤任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與親代子代、性狀、染色體、DNA、基因、資料判讀或單元邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__genetics_chromosome_geneTest = {
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
