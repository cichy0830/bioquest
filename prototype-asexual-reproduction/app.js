const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-asexual-reproduction-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_asexual_reproduction_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  "unit_id": "asexual_reproduction",
  "unit_title": "無性生殖",
  "mission_title": "繁殖樣本分類任務",
  "mission_area": "生命延續資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlReport: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: ""
};

const badgeAsset = () => "";
const reflectionRules = {
  "conceptTerms": [
    "無性生殖",
    "親代",
    "單一親代",
    "後代相似",
    "分裂生殖",
    "出芽生殖",
    "斷裂生殖",
    "孢子",
    "孢子繁殖",
    "營養器官",
    "營養器官繁殖",
    "組織培養",
    "走莖",
    "塊莖",
    "精卵結合",
    "U29 邊界",
    "優點",
    "限制",
    "風險"
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
    "無性生殖定義",
    "親代數量",
    "後代相似",
    "分裂生殖",
    "出芽生殖",
    "斷裂生殖",
    "孢子繁殖",
    "營養器官繁殖",
    "優點與限制",
    "U29 邊界"
  ]
};

const badges = [
  [
    "asexual_reproduction_entry",
    "無性生殖入門",
    "完成繁殖樣本分類任務。"
  ],
  [
    "asexual_no_gamete_single_parent_guard",
    "單一親代守門",
    "能辨識無性生殖不需精卵結合。"
  ],
  [
    "offspring_similarity_interpreter",
    "後代相似判讀",
    "能判斷無性生殖後代通常與親代相似。"
  ],
  [
    "asexual_method_example_classifier",
    "方式例子分類",
    "能把常見無性生殖方式與例子配對。"
  ],
  [
    "budding_fragmentation_spotter",
    "出芽斷裂辨識",
    "能辨識出芽或斷裂生殖的特徵。"
  ],
  [
    "vegetative_sequence_tracker",
    "營養繁殖流程追蹤",
    "能排出馬鈴薯等營養器官繁殖流程。"
  ],
  [
    "spore_reproduction_reader",
    "孢子繁殖讀圖",
    "能理解孢子可發育成新個體。"
  ],
  [
    "tissue_culture_basic_reader",
    "組織培養基礎",
    "能辨識組織培養可快速產生相似植株。"
  ],
  [
    "asexual_fast_similarity_applicator",
    "快速相似應用",
    "能在情境中應用快速產生相似後代的概念。"
  ],
  [
    "asexual_advantage_risk_balancer",
    "優點風險平衡",
    "能同時判斷無性生殖的效率與限制。"
  ],
  [
    "asexual_vs_sexual_boundary_classifier",
    "無性有性邊界分類",
    "能分辨無性生殖與精卵結合情境。"
  ],
  [
    "u27_u28_u29_boundary_guardian",
    "27-29 站邊界守門",
    "能區分細胞分裂、無性生殖與有性生殖。"
  ],
  [
    "asexual_unit_boundary_guardian",
    "無性生殖單元邊界",
    "能排除不屬於本單元的內容。"
  ],
  [
    "asexual_reproduction_misconception_reviser",
    "無性生殖迷思修正",
    "提示後修正本單元迷思。"
  ],
  [
    "asexual_reproduction_flawless",
    "無性生殖零提示全對",
    "全部答對且全程未使用提示。"
  ],
  [
    "asexual_reproduction_reflection_reporter",
    "高品質無性生殖回報",
    "回報品質達 discussion_question。"
  ],
  [
    "retry_growth_asexual_reproduction",
    "再探無性生殖進步",
    "再挑戰完整完成且正確率進步。"
  ]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const boundaryChoices = [
  {
    "id": "u27_cell_division",
    "text": "第 27 站：細胞的分裂"
  },
  {
    "id": "u28_asexual_reproduction",
    "text": "第 28 站：無性生殖"
  },
  {
    "id": "u29_sexual_reproduction",
    "text": "第 29 站：有性生殖"
  }
];

const methodChoices = [
  {
    "id": "binary_fission",
    "text": "分裂生殖"
  },
  {
    "id": "budding",
    "text": "出芽生殖"
  },
  {
    "id": "fragmentation",
    "text": "斷裂生殖"
  },
  {
    "id": "spore_reproduction",
    "text": "孢子繁殖"
  },
  {
    "id": "vegetative_propagation",
    "text": "營養器官繁殖"
  }
];
const coreChoices = [
  {
    "id": "asexual_core",
    "text": "符合無性生殖核心"
  },
  {
    "id": "not_this_unit_core",
    "text": "不屬於本單元核心"
  }
];

const questions = [
  {
    "id": "asexual_reproduction_q01",
    "section": "checkpoint1",
    "concept": "asexual_definition",
    "type": "choice",
    "answer": "asexual_no_sperm_egg_fusion",
    "prompt": "下列哪個說法最符合「無性生殖」的核心？",
    "hint": "先判斷是否需要精子和卵結合。",
    "misconception": "asexual_requires_gametes_confusion",
    "options": [
      {
        "id": "asexual_no_sperm_egg_fusion",
        "text": "不經精子與卵結合，也能產生新個體"
      },
      {
        "id": "must_use_sperm_egg",
        "text": "一定要精子與卵結合才算生殖"
      },
      {
        "id": "only_body_asexual_reproduction",
        "text": "只是在一個個體體內增加細胞，不會形成新個體"
      },
      {
        "id": "always_many_parents",
        "text": "一定需要兩個以上親代共同形成後代"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q02",
    "section": "checkpoint1",
    "concept": "single_parent",
    "type": "choice",
    "answer": "single_parent_part_forms_new_individual",
    "prompt": "關於無性生殖的親代來源，下列哪個判斷較合理？",
    "hint": "先想新個體是否可由一個親代的一部分或一個細胞形成。",
    "misconception": "single_parent_source_confusion",
    "options": [
      {
        "id": "single_parent_part_forms_new_individual",
        "text": "可由單一親代的細胞、構造或部分身體形成新個體"
      },
      {
        "id": "two_parents_required",
        "text": "一定需要兩個親代各提供一半遺傳資訊"
      },
      {
        "id": "only_food_growth",
        "text": "只要養分足夠，非生物也會生出後代"
      },
      {
        "id": "requires_fertilized_egg",
        "text": "一定要先形成受精卵才會開始"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q03",
    "section": "checkpoint1",
    "concept": "offspring_similarity",
    "type": "choice",
    "answer": "offspring_usually_genetically_similar",
    "prompt": "無性生殖產生的後代，通常和親代有什麼關係？",
    "hint": "想想沒有精卵結合時，後代遺傳資訊主要來自哪裡。",
    "misconception": "offspring_random_difference_confusion",
    "options": [
      {
        "id": "offspring_usually_genetically_similar",
        "text": "通常與親代在遺傳資訊上相似"
      },
      {
        "id": "offspring_always_unrelated",
        "text": "通常和親代完全沒有關聯"
      },
      {
        "id": "offspring_must_be_gametes",
        "text": "後代一定是精子或卵"
      },
      {
        "id": "offspring_never_alive",
        "text": "後代一定不是生命體"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q04",
    "section": "checkpoint2",
    "concept": "method_example_classification",
    "type": "mapping",
    "answer": {
      "amoeba_split": "binary_fission",
      "hydra_bud": "budding",
      "body_fragment": "fragmentation",
      "mold_spore": "spore_reproduction",
      "potato_tuber": "vegetative_propagation"
    },
    "prompt": "請把例子配對到較適合的無性生殖方式。",
    "hint": "先看新個體從哪裡出現：一個細胞分開、小芽、身體片段、孢子，或植物營養器官。",
    "misconception": "asexual_method_example_mismatch",
    "items": [
      {
        "id": "amoeba_split",
        "label": "單細胞生物一分為二形成新個體"
      },
      {
        "id": "hydra_bud",
        "label": "水螅身體側邊長出小芽"
      },
      {
        "id": "body_fragment",
        "label": "身體片段可長成新個體"
      },
      {
        "id": "mold_spore",
        "label": "孢子散布後可發育"
      },
      {
        "id": "potato_tuber",
        "label": "馬鈴薯塊莖上的芽長成新植株"
      }
    ],
    "choices": [
      {
        "id": "binary_fission",
        "text": "分裂生殖"
      },
      {
        "id": "budding",
        "text": "出芽生殖"
      },
      {
        "id": "fragmentation",
        "text": "斷裂生殖"
      },
      {
        "id": "spore_reproduction",
        "text": "孢子繁殖"
      },
      {
        "id": "vegetative_propagation",
        "text": "營養器官繁殖"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q05",
    "section": "checkpoint2",
    "concept": "budding_fragmentation",
    "type": "choice",
    "answer": "budding_from_parent_body",
    "prompt": "觀察到某生物身體側邊長出小突起，逐漸形成新個體。這較符合哪個概念？",
    "hint": "注意新個體是從親代身體側邊的小芽開始。",
    "misconception": "budding_feature_confusion",
    "options": [
      {
        "id": "budding_from_parent_body",
        "text": "出芽生殖"
      },
      {
        "id": "sperm_egg_fusion",
        "text": "精卵結合"
      },
      {
        "id": "blood_transport",
        "text": "血液運輸"
      },
      {
        "id": "thermoregulation",
        "text": "體溫恆定"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q06",
    "section": "checkpoint2",
    "concept": "vegetative_sequence",
    "type": "sequence",
    "answer": [
      "parent_plant_forms_tuber_with_bud",
      "bud_on_tuber_begins_growth",
      "new_shoots_and_roots_grow",
      "new_potato_plant_forms"
    ],
    "prompt": "請拖曳排序，排出馬鈴薯利用塊莖繁殖新植株的簡化流程。",
    "hint": "先找親代植物形成帶芽塊莖，再看芽如何長成新植株。",
    "misconception": "vegetative_sequence_order_confusion",
    "steps": [
      {
        "id": "parent_plant_forms_tuber_with_bud",
        "label": "親代植物形成帶芽的塊莖"
      },
      {
        "id": "bud_on_tuber_begins_growth",
        "label": "塊莖上的芽開始生長"
      },
      {
        "id": "new_shoots_and_roots_grow",
        "label": "新芽與根逐漸長出"
      },
      {
        "id": "new_potato_plant_forms",
        "label": "形成新的馬鈴薯植株"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q07",
    "section": "checkpoint2",
    "concept": "spore_reproduction",
    "type": "choice",
    "answer": "spores_develop_into_new_individuals",
    "prompt": "關於孢子繁殖，下列哪個說法較合理？",
    "hint": "想想孢子在適合環境中可能發展成什麼。",
    "misconception": "spore_seed_or_gamete_confusion",
    "options": [
      {
        "id": "spores_develop_into_new_individuals",
        "text": "孢子在適合環境中可發育成新個體"
      },
      {
        "id": "spores_are_sperm_egg",
        "text": "孢子一定是精子和卵的結合"
      },
      {
        "id": "spores_are_waste",
        "text": "孢子只是排泄廢物"
      },
      {
        "id": "spores_need_two_parents",
        "text": "孢子繁殖一定需要兩個親代"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q08",
    "section": "checkpoint2",
    "concept": "tissue_culture",
    "type": "choice",
    "answer": "plant_tissue_culture_many_similar_plants",
    "prompt": "植物組織培養常可由植物的一小部分培養出許多植株。這和哪個無性生殖概念較接近？",
    "hint": "先看新植株主要來自一個親代的植物組織，還是精卵結合。",
    "misconception": "tissue_culture_confusion",
    "options": [
      {
        "id": "plant_tissue_culture_many_similar_plants",
        "text": "可快速產生許多與親代相似的植株"
      },
      {
        "id": "random_unrelated_plants",
        "text": "一定產生和親代完全無關的植株"
      },
      {
        "id": "animal_fertilization",
        "text": "一定需要動物精卵結合"
      },
      {
        "id": "blood_glucose_control",
        "text": "主要是在調節血糖"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q09",
    "section": "checkpoint3",
    "concept": "vegetative_application",
    "type": "choice",
    "answer": "runner_fast_similar_plants",
    "prompt": "草莓可利用走莖長出新植株。若農場想快速增加相似植株，哪個判斷較合理？",
    "hint": "想想走莖形成新植株時，親代來源和後代相似性。",
    "misconception": "vegetative_application_confusion",
    "options": [
      {
        "id": "runner_fast_similar_plants",
        "text": "利用走莖可較快產生與親代相似的新植株"
      },
      {
        "id": "runner_requires_fertilization",
        "text": "走莖一定要和另一株完成受精才會長成新植株"
      },
      {
        "id": "runner_is_blood_vessel",
        "text": "走莖是動物血管的一種"
      },
      {
        "id": "runner_never_living",
        "text": "走莖產生的新植株不是生命體"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q10",
    "section": "checkpoint3",
    "concept": "advantage_risk",
    "type": "choice",
    "answer": "similar_offspring_fast_but_risky",
    "prompt": "大量使用無性生殖繁殖同一種相似植株，哪個優點與限制判斷最平衡？",
    "hint": "同時思考「快且相似」與「環境改變時的風險」。",
    "misconception": "asexual_advantage_only_confusion",
    "options": [
      {
        "id": "similar_offspring_fast_but_risky",
        "text": "可快速產生相似後代，但環境改變時可能較有風險"
      },
      {
        "id": "always_best_no_risk",
        "text": "一定永遠最好，完全沒有風險"
      },
      {
        "id": "always_unrelated",
        "text": "一定產生完全不相似後代，所以無法應用"
      },
      {
        "id": "requires_two_parents",
        "text": "優點來自一定需要兩個親代"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q11",
    "section": "checkpoint3",
    "concept": "asexual_vs_sexual_boundary",
    "type": "mapping",
    "answer": {
      "yeast_budding": "asexual_core",
      "potato_tuber": "asexual_core",
      "body_fragment": "asexual_core",
      "sperm_egg_fusion": "not_this_unit_core"
    },
    "prompt": "請判斷下列情境是否屬於無性生殖本單元核心。",
    "hint": "先問：是否不經精卵結合，且可由單一親代或其部分形成新個體？",
    "misconception": "asexual_sexual_boundary_confusion",
    "items": [
      {
        "id": "yeast_budding",
        "label": "酵母菌形成小芽"
      },
      {
        "id": "potato_tuber",
        "label": "馬鈴薯塊莖上的芽長成新植株"
      },
      {
        "id": "body_fragment",
        "label": "身體片段可發育成新個體"
      },
      {
        "id": "sperm_egg_fusion",
        "label": "精子和卵結合形成受精卵"
      }
    ],
    "choices": [
      {
        "id": "asexual_core",
        "text": "符合無性生殖核心"
      },
      {
        "id": "not_this_unit_core",
        "text": "不屬於本單元核心"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q12",
    "section": "checkpoint3",
    "concept": "offspring_similarity",
    "type": "choice",
    "answer": "cutting_offspring_similar_to_parent",
    "prompt": "同一株植物的枝條扦插後長成新植株。新植株通常和原植物有什麼關係？",
    "hint": "想想新植株主要來自同一親代的植物部分。",
    "misconception": "cutting_similarity_confusion",
    "options": [
      {
        "id": "cutting_offspring_similar_to_parent",
        "text": "通常與原植物相似"
      },
      {
        "id": "cutting_always_unrelated",
        "text": "一定與原植物完全無關"
      },
      {
        "id": "cutting_is_fertilization",
        "text": "一定是精卵結合形成"
      },
      {
        "id": "cutting_is_asexual_reproduction_only",
        "text": "只是在同一個體內多出細胞，沒有形成新個體"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q13",
    "section": "checkpoint3",
    "concept": "unit_boundary_control",
    "type": "mapping",
    "answer": {
      "chromosome_copy_distribution": "u27_cell_division",
      "potato_tuber_new_plant": "u28_asexual_reproduction",
      "hydra_budding": "u28_asexual_reproduction",
      "sperm_egg_fusion": "u29_sexual_reproduction"
    },
    "prompt": "請把下列內容配到較適合的學習站。",
    "hint": "先分辨是在說細胞如何分裂、無性方式產生新個體，還是精卵結合。",
    "misconception": "u27_u28_u29_boundary_confusion",
    "items": [
      {
        "id": "chromosome_copy_distribution",
        "label": "染色體複製後分配到兩個子細胞"
      },
      {
        "id": "potato_tuber_new_plant",
        "label": "馬鈴薯塊莖長成新植株"
      },
      {
        "id": "hydra_budding",
        "label": "水螅身體側邊長出新個體"
      },
      {
        "id": "sperm_egg_fusion",
        "label": "精子和卵結合形成受精卵"
      }
    ],
    "choices": [
      {
        "id": "u27_cell_division",
        "text": "第 27 站：細胞的分裂"
      },
      {
        "id": "u28_asexual_reproduction",
        "text": "第 28 站：無性生殖"
      },
      {
        "id": "u29_sexual_reproduction",
        "text": "第 29 站：有性生殖"
      }
    ]
  },
  {
    "id": "asexual_reproduction_q14",
    "section": "checkpoint3",
    "concept": "unit_boundary_control",
    "type": "choice",
    "answer": "budding_belongs_asexual_reproduction",
    "prompt": "下列哪個最適合放在「無性生殖」本單元核心檢核？",
    "hint": "找出不經精卵結合且形成新個體的情境。",
    "misconception": "asexual_unit_boundary_confusion",
    "options": [
      {
        "id": "budding_belongs_asexual_reproduction",
        "text": "親代身體側邊長出小芽，形成新個體"
      },
      {
        "id": "chromosome_copy_only",
        "text": "染色體複製後分配到兩個子細胞"
      },
      {
        "id": "fertilization_belongs_u28",
        "text": "精子和卵結合形成受精卵"
      },
      {
        "id": "insulin_control",
        "text": "胰島素協助血糖調節"
      }
    ]
  }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  "checkpoint1": [
    "asexual_reproduction_q01",
    "asexual_reproduction_q02",
    "asexual_reproduction_q03"
  ],
  "checkpoint2": [
    "asexual_reproduction_q04",
    "asexual_reproduction_q05",
    "asexual_reproduction_q06",
    "asexual_reproduction_q07",
    "asexual_reproduction_q08"
  ],
  "checkpoint3": [
    "asexual_reproduction_q09",
    "asexual_reproduction_q10",
    "asexual_reproduction_q11",
    "asexual_reproduction_q12",
    "asexual_reproduction_q13",
    "asexual_reproduction_q14"
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
    question_version: VERSION,
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
    return parsed && parsed.question_version ? { ...createEmptyState(), ...parsed } : createEmptyState();
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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
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
  if (question.type === "choice") return typeof value === "string" && value.length > 0;
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
  if (question.type === "choice") return value === question.answer;
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

function orderedOptions(question) {
  if (!state.optionOrders[question.id]) {
    const ids = (question.type === "sequence" ? question.steps : question.options || []).map((item) => item.id);
    state.optionOrders[question.id] = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}`);
  }
  const source = Object.fromEntries((question.type === "sequence" ? question.steps : question.options || []).map((item) => [item.id, item]));
  return state.optionOrders[question.id].map((id) => source[id]).filter(Boolean);
}

function formatSelected(question) {
  const value = answerValue(question.id);
  if (question.type === "choice") return question.options.find((option) => option.id === value)?.text || "尚未選擇";
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
  const attemptId = uid("asexual_reproduction_guest_attempt");
  state = { ...createEmptyState(), student, attempt_id: attemptId, attempt_session_token: `guest_${attemptId}`, attempt_session_id: `guest_session_${attemptId}`, question_version: VERSION, verification_mode: "local_guest", screen: "brief", completedScreens: ["login", "brief"] };
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
      question_version: VERSION
    });
    if (startData.verification_mode !== "server_verified" || !startData.attempt_session_token || startData.question_version !== VERSION) {
      throw new Error("backend_registry_not_ready");
    }
    state = {
      ...createEmptyState(),
      student,
      attempt_id: startData.attempt_id,
      attempt_session_token: startData.attempt_session_token,
      attempt_session_id: startData.attempt_session_id,
      previous_attempt_id: startData.previous_attempt_id || "",
      question_version: startData.question_version,
      verification_mode: startData.verification_mode,
      screen: "brief",
      completedScreens: ["login", "brief"]
    };
    saveState();
    renderApp();
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
}

function canUseNav(target) {
  if (target === "rules") return true;
  if (!state.student) return target === "login";
  if (state.submitted) return ["result", "achievements", "rules"].includes(target);
  return state.completedScreens.includes(target);
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
  if (question.type === "choice" && value && value !== question.answer) markHint(questionId).then(renderApp);
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
  const next = { checkpoint1: "checkpoint2", checkpoint2: "checkpoint3", checkpoint3: "review" }[section];
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
  const correctedCore = logs.some((log) => log.is_correct && log.hint_used);
  const earned = [];
  earned.push("asexual_reproduction_entry");
  if (passed(["asexual_reproduction_q01", "asexual_reproduction_q02"])) earned.push("asexual_no_gamete_single_parent_guard");
  if (passed(["asexual_reproduction_q03", "asexual_reproduction_q12"])) earned.push("offspring_similarity_interpreter");
  if (passed(["asexual_reproduction_q04"])) earned.push("asexual_method_example_classifier");
  if (passed(["asexual_reproduction_q05"])) earned.push("budding_fragmentation_spotter");
  if (passed(["asexual_reproduction_q06", "asexual_reproduction_q09"])) earned.push("vegetative_sequence_tracker");
  if (passed(["asexual_reproduction_q07"])) earned.push("spore_reproduction_reader");
  if (passed(["asexual_reproduction_q08"])) earned.push("tissue_culture_basic_reader");
  if (passed(["asexual_reproduction_q09"])) earned.push("asexual_fast_similarity_applicator");
  if (passed(["asexual_reproduction_q10"])) earned.push("asexual_advantage_risk_balancer");
  if (passed(["asexual_reproduction_q11"])) earned.push("asexual_vs_sexual_boundary_classifier");
  if (passed(["asexual_reproduction_q13"])) earned.push("u27_u28_u29_boundary_guardian");
  if (passed(["asexual_reproduction_q14"])) earned.push("asexual_unit_boundary_guardian");
  if (correctedCore) earned.push("asexual_reproduction_misconception_reviser");
  if (flawless) earned.push("asexual_reproduction_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("asexual_reproduction_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_asexual_reproduction");
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
  if (irrelevant || lowEffort || copied) return reflectionResult("invalid", 0, "回報目前較像玩笑、敷衍或複製方向，保留給老師複核但不給 EXP。", "auto", normalized, original, { irrelevant, lowEffort, copied });
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
  result.logs.forEach((log) => { rawAnswers[log.question_id] = log.answer; });
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
    question_version: state.question_version,
    raw_answers: rawAnswers,
    raw_answers_json: JSON.stringify(rawAnswers),
    question_logs: result.logs.map((log) => ({
      question_id: log.question_id,
      unit_id: mission.unit_id,
      student_id: state.student.student_id,
      question_type: questionMap[log.question_id]?.type || "",
      attempt_answer: log.answer,
      answer_json: JSON.stringify(log.answer),
      used_hint: log.hint_used,
      analysis_group: analysisGroupForQuestion(log.question_id),
      skill_tag: log.skill_tag,
      misconception_tag: log.misconception_tag
    })),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
}

function analysisGroupForQuestion(questionId) {
  if (["asexual_reproduction_q01", "asexual_reproduction_q02"].includes(questionId)) return "asexual_definition_parent";
  if (["asexual_reproduction_q03", "asexual_reproduction_q12"].includes(questionId)) return "offspring_similarity";
  if (["asexual_reproduction_q04", "asexual_reproduction_q05", "asexual_reproduction_q07", "asexual_reproduction_q08"].includes(questionId)) return "asexual_method_matching";
  if (["asexual_reproduction_q06", "asexual_reproduction_q09"].includes(questionId)) return "vegetative_sequence";
  if (["asexual_reproduction_q10"].includes(questionId)) return "advantage_risk";
  if (["asexual_reproduction_q11", "asexual_reproduction_q13", "asexual_reproduction_q14"].includes(questionId)) return "unit_boundary_control";
  return "asexual_definition_parent";
}


async function submitAttemptToBackend(payload) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  return requestBackend(payload);
}

function applyBackendSubmitResponse(response, localResult) {
  if (!response || response.ok === false) return localResult;
  const verified = response.verified_attempt || response.attempt || null;
  const progress = response.student_progress || response.progress || null;
  if (progress) {
    state.student.progress = progress;
    state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
    state.student.current_title_id = progress.current_title_id || state.student.current_title_id;
    state.student.current_title = progress.current_title || state.student.current_title;
    state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path;
  }
  if (!verified) return { ...localResult, backend_response: response };
  return {
    ...localResult,
    verification_status: verified.verification_status || response.verification_status || "server_verified",
    correct_count: Number(verified.correct_count ?? localResult.correct_count),
    total_questions: Number(verified.total_questions ?? localResult.total_questions),
    accuracy: Number(verified.accuracy ?? localResult.accuracy),
    hint_used_count: Number(verified.hint_used_count ?? localResult.hint_used_count),
    completion_exp: Number(verified.completion_exp ?? localResult.completion_exp),
    direct_exp: Number(verified.direct_exp ?? localResult.direct_exp),
    revision_exp: Number(verified.revision_exp ?? localResult.revision_exp),
    reflection_exp: Number(verified.reflection_exp ?? localResult.reflection_exp),
    mastery_exp: Number(verified.mastery_exp ?? localResult.mastery_exp),
    retry_exp: Number(verified.retry_exp ?? localResult.retry_exp),
    attempt_exp: Number(verified.attempt_exp ?? localResult.attempt_exp),
    unit_credited_exp: Number(verified.unit_credited_exp ?? localResult.unit_credited_exp),
    exp_delta: Number(verified.credited_delta ?? verified.exp_delta ?? localResult.exp_delta),
    earned_badges: Array.isArray(verified.earned_badges) ? verified.earned_badges : localResult.earned_badges,
    backend_response: response
  };
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
}

function renderLogin() {
  return `
    <div class="wide-layout login-layout">
      <section class="panel hero-panel">
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">歡迎進入生命祕境</h2>
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
  const sceneAttrs = `${assets.briefingSceneHook ? ` data-briefing-scene-hook="${assets.briefingSceneHook}"` : ""}${assets.briefingSceneMobileHook ? ` data-mobile-hook="${assets.briefingSceneMobileHook}"` : ""}`;
  const sceneMedia = assets.briefingSceneHook ? `<picture class="brief-scene-media">${assets.briefingSceneMobileHook ? `<source srcset="${assets.briefingSceneMobileHook}" media="(max-width: 640px)">` : ""}<img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="無性生殖簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')"></picture>` : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="生命延續資料庫場景待接"><strong>生命延續資料庫</strong><span>正式簡報圖核准後，會在此呈現阿澤老師與無性生殖樣本分類場景。</span></div>`;
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero"><figure class="brief-scene asexual-reproduction-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>${sceneMedia}<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'"></figure><div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p>生命延續資料庫收到多份繁殖樣本。請協助分辨無性生殖的核心特徵、常見方式與相鄰單元邊界。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入生命延續資料庫前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先判斷是否不經精卵結合、是否由單一親代或其部分形成新個體。</h3><p>本任務會用例子配對、流程排序、情境判斷與單元邊界，幫你辨識無性生殖。</p></div></div><div class="concept-grid"><article><strong>核心定義</strong><p>無性生殖不經精子與卵結合，也能形成新個體。</p></article><article><strong>親代來源</strong><p>新個體可由單一親代的細胞、構造或身體部分形成。</p></article><article><strong>後代相似</strong><p>後代通常與親代在遺傳資訊上相似，但環境仍可能影響表現。</p></article><article><strong>守住邊界</strong><p>細胞分裂是 U27；精卵結合與有性生殖留到 U29。</p></article></div><button class="primary" data-next="checkpoint1">開始分類繁殖樣本</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = { checkpoint1:["定義、親代數量與後代相似","先判斷無性生殖的核心特徵，以及後代和親代的關係。"], checkpoint2:["常見方式與例子","配對分裂生殖、出芽生殖、斷裂生殖、孢子繁殖與營養器官繁殖。"], checkpoint3:["情境應用、優點限制與邊界","用情境判斷無性生殖的應用與風險，並分清 U27/U28/U29。"] }[section];
  return `<div class="stack checkpoint-stack"><section class="panel"><p class="eyebrow">互動關卡</p><h2>${heading[0]}</h2><p class="lead">${heading[1]}</p></section>${sections[section].map((id)=>renderQuestion(questionMap[id])).join("")}<section class="panel action-panel"><p class="muted">本區每題都需留下作答紀錄；不確定時可先選擇，任務後會給概念回饋。</p><button class="primary" data-section-next="${section}">${section === "checkpoint3" ? "整理任務回饋" : "前往下一關"}</button></section></div>`;
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

function conceptLabel(concept) { return {asexual_definition:"無性生殖定義",single_parent:"單一親代",offspring_similarity:"後代相似",method_example_classification:"方式與例子",budding_fragmentation:"出芽/斷裂",vegetative_sequence:"營養器官繁殖",spore_reproduction:"孢子繁殖",tissue_culture:"組織培養",vegetative_application:"情境應用",advantage_risk:"優點與限制",asexual_vs_sexual_boundary:"無性/有性邊界",unit_boundary_control:"單元邊界"}[concept] || concept; }


function renderQuestionEvidence(qid) {
  if (qid === "asexual_reproduction_q04") return `<div class="evidence-card"><strong>樣本分類卡</strong><p>觀察新個體出現的位置與來源，再配對到較適合的無性生殖方式。</p></div>`;
  if (qid === "asexual_reproduction_q05") return `<div class="evidence-card"><strong>側芽觀察卡</strong><p>親代身體側邊出現小突起，逐漸形成新個體。</p></div>`;
  if (qid === "asexual_reproduction_q06") return `<div class="evidence-card"><strong>塊莖流程卡</strong><p>請依「親代形成帶芽構造」到「新植株形成」的順序整理。</p></div>`;
  if (qid === "asexual_reproduction_q12") return `<div class="evidence-card"><strong>扦插資料卡</strong><p>新植株由同一親代的枝條發育而來，用來判斷後代相似性。</p></div>`;
  return "";
}


function renderQuestionControl(question) {
  if (question.type === "choice") return renderChoiceQuestion(question);
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
  return `<div class="mapping-list">${question.items.map((item) => `
    <label class="mapping-row">
      <span>${escapeHtml(item.label)}</span>
      <select data-map-question="${question.id}" data-map-item="${item.id}">
        <option value="">尚未選擇</option>
        ${question.choices.map((choice) => `<option value="${choice.id}" ${current[item.id] === choice.id ? "selected" : ""}>${escapeHtml(choice.text)}</option>`).join("")}
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的無性生殖判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的無性生殖概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section><aside class="panel mentor-card" data-feedback-state="${stateName}"><img src="../shared-assets/mentor-feedback/mentor-feedback-${stateName}.webp" alt="阿澤老師回饋" onerror="this.src='${assets.mentorFallback}'"><h3>${feedbackTitle(stateName)}</h3><p>請把不確定的概念轉成課堂上想確認的方向。</p></aside></div>`;
}


function misconceptionText(tag) { return {
  asexual_requires_gametes_confusion:"建議再確認無性生殖定義：無性生殖不經精子與卵結合也能產生新個體。",
  single_parent_source_confusion:"建議再整理親代來源：新個體可由單一親代的細胞、構造或部分身體形成。",
  offspring_random_difference_confusion:"建議再確認後代相似性：無性生殖後代通常與親代在遺傳資訊上相似。",
  asexual_method_example_mismatch:"建議再用來源線索配對方式：一分為二、小芽、片段、孢子或營養器官。",
  budding_feature_confusion:"建議再確認出芽生殖特徵：新個體從親代身體側邊的小芽開始。",
  vegetative_sequence_order_confusion:"建議再整理營養器官繁殖流程，先看帶芽構造，再看新芽與根長成植株。",
  spore_seed_or_gamete_confusion:"建議再確認孢子繁殖：孢子可發育成新個體，不等於精卵結合。",
  tissue_culture_confusion:"建議再確認組織培養與無性生殖的關聯：可由植物組織培養出相似植株。",
  vegetative_application_confusion:"建議再用走莖、塊莖等情境判斷快速產生相似植株。",
  asexual_advantage_only_confusion:"建議再平衡優點與限制：快速且相似，但環境改變時可能有風險。",
  asexual_sexual_boundary_confusion:"建議再分辨無性生殖與精卵結合情境。",
  cutting_similarity_confusion:"建議再確認扦插等營養繁殖後代通常與原植物相似。",
  u27_u28_u29_boundary_confusion:"建議再確認 U27/U28/U29 邊界，避免把細胞分裂或有性生殖混入本單元。",
  asexual_unit_boundary_confusion:"建議再確認本單元核心：不經精卵結合並形成新個體。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想問老師的地方留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從無性生殖定義、親代數量、後代相似、分裂/出芽/斷裂/孢子/營養器官繁殖、優點限制或 U29 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：無性生殖不經精卵結合"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認出芽生殖和斷裂生殖要怎麼用例子分辨？">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>繁殖樣本分類任務結算</h2>
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
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges)}
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
  const result = state.result || scoreAttempt();
  const titleInfo = titleAndProgress(state.student, result.unit_credited_exp);
  const credit = creditStatusText(result);
  return `
    <div class="stack achievements-stack">
      <section class="panel title-card">
        <p class="eyebrow">全冊稱號</p>
        <div class="title-card-content">
          <img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.src='${assets.titleAvatarFallback}'">
          <div>
            <h2>${escapeHtml(titleInfo.current.title)}</h2>
            <p>${credit.status === "verified" ? `${titleInfo.totalExp} EXP｜稱號進度 ${titleInfo.progressPercent}%` : credit.resultLine}</p>
            <p>${credit.status === "verified" ? (titleInfo.next ? `距離 ${titleInfo.next.title} 還差 ${titleInfo.remaining} EXP` : "已達最高稱號，後續 EXP 仍會累積。") : credit.note}</p>
          </div>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges)}
    </div>
  `;
}

function renderBadgeWall(earned = []) {
  const earnedSet = new Set(earned);
  return `<section class="panel">
    <p class="eyebrow">徽章收藏牆</p>
    <h2>本單元 17 枚徽章</h2>
    <div class="badge-wall">
      ${badges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual ${badge.image_status === "pending" ? "asset-missing" : ""}" data-badge-image-status="${escapeHtml(badge.image_status || "ready")}">
            ${badge.image_status === "pending" ? "" : `<img src="${badge.badge_image_path}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();">`}
          </div>
          <strong>${escapeHtml(badge.name)}</strong>
          <p>${escapeHtml(badge.condition)}</p>
        </article>
      `).join("")}
    </div>
  </section>`;
}

function renderRules() {
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與無性生殖、親代、後代相似、常見方式、優點限制或 U29 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button></section></div>`;
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
    if (canUseNav(button.dataset.nav)) setScreen(button.dataset.nav);
  }));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderApp);
  else renderApp();
}

if (typeof window !== "undefined") {
  window.__asexual_reproductionTest = {
    VERSION,
    mission,
    assets,
    badges,
    questions,
    state: () => state,
    setState: (next) => { state = { ...createEmptyState(), ...next }; },
    createEmptyState,
    answerValue,
    isCorrect,
    scoreAttempt,
    buildBackendPayload,
    evaluateReflection,
    titleAvatarPath,
    renderBrief,
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements
  };
}
