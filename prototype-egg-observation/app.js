const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260725-egg-observation-readiness-v1";
const QUESTION_VERSION = "20260718-egg-observation-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_egg_observation_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  "unit_id": "egg_observation",
  "unit_title": "蛋的觀察",
  "mission_title": "蛋內構造判讀任務",
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
    "蛋的觀察",
    "安全觀察",
    "蛋殼",
    "蛋殼膜",
    "蛋白",
    "蛋黃",
    "氣室",
    "胚盤",
    "繫帶",
    "卵生",
    "胚胎",
    "養分",
    "保護",
    "觀察證據",
    "推論"
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
    "安全觀察",
    "蛋殼",
    "蛋白",
    "蛋黃",
    "氣室",
    "胚盤",
    "繫帶",
    "觀察紀錄",
    "U31 邊界"
  ]
};

const badges = [
  [
    "egg_observation_entry",
    "蛋觀察入門",
    "完成蛋內構造判讀任務。"
  ],
  [
    "raw_egg_safety_guard",
    "生蛋安全守門",
    "能辨識生蛋觀察的安全行為。"
  ],
  [
    "external_shell_observer",
    "外部蛋殼觀察員",
    "能辨識蛋殼與蛋殼的基本功能。"
  ],
  [
    "safe_egg_sequence_tracker",
    "安全觀察流程員",
    "能排出安全觀察雞蛋的流程。"
  ],
  [
    "egg_cross_section_labeler",
    "剖面構造標記員",
    "能辨識蛋殼、蛋白、蛋黃與氣室。"
  ],
  [
    "egg_structure_function_mapper",
    "蛋構造功能配對員",
    "能將蛋內構造與主要功能配對。"
  ],
  [
    "yolk_embryo_boundary_reader",
    "蛋黃胚胎邊界判讀員",
    "能分辨蛋黃、胚盤與胚胎發育的基礎邊界。"
  ],
  [
    "air_cell_evidence_reader",
    "氣室證據觀察員",
    "能辨識氣室位置與意義。"
  ],
  [
    "chalaza_anchor_reader",
    "繫帶定位觀察員",
    "能說明繫帶固定蛋黃的作用。"
  ],
  [
    "egg_development_evidence_checker",
    "蛋發育證據檢核員",
    "能用證據判斷蛋是否正在發育。"
  ],
  [
    "observation_inference_recorder",
    "觀察推論紀錄員",
    "能區分觀察紀錄與推論。"
  ],
  [
    "u28_u29_u30_u31_egg_boundary_guardian",
    "四站邊界守門",
    "能區分 U28 無性、U29 有性、U30 蛋觀察與 U31 花觀察。"
  ],
  [
    "egg_unit_boundary_guardian",
    "蛋的觀察核心守門",
    "能把蛋剖面觀察放回本單元核心。"
  ],
  [
    "egg_observation_misconception_reviser",
    "蛋的觀察迷思修正",
    "提示後修正本單元迷思。"
  ],
  [
    "egg_observation_flawless",
    "蛋觀察零提示全對",
    "全部答對且全程未使用提示。"
  ],
  [
    "egg_observation_reflection_reporter",
    "高品質蛋的觀察回報",
    "回報品質達 discussion_question。"
  ],
  [
    "retry_growth_egg_observation",
    "再探蛋觀察精熟進步",
    "再挑戰完整完成且正確率進步。"
  ]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const structureChoices = [
  {
    "id": "eggshell",
    "text": "蛋殼"
  },
  {
    "id": "albumen",
    "text": "蛋白"
  },
  {
    "id": "yolk",
    "text": "蛋黃"
  },
  {
    "id": "air_cell",
    "text": "氣室"
  }
];
const functionChoices = [
  {
    "id": "protects_inside",
    "text": "保護內部"
  },
  {
    "id": "water_and_cushion",
    "text": "提供水分並緩衝保護"
  },
  {
    "id": "nutrient_supply",
    "text": "提供發育所需養分"
  },
  {
    "id": "air_space",
    "text": "蛋內空氣空間"
  }
];
const boundaryChoices = [
  {
    "id": "u28_asexual_reproduction",
    "text": "第 28 站：無性生殖"
  },
  {
    "id": "u29_sexual_reproduction",
    "text": "第 29 站：有性生殖"
  },
  {
    "id": "u30_egg_observation",
    "text": "第 30 站：蛋的觀察"
  },
  {
    "id": "u31_flower_observation",
    "text": "第 31 站：花的觀察"
  }
];

const questions = [
  {
    "id": "egg_observation_q01",
    "section": "checkpoint1",
    "concept": "egg_observation_safety",
    "type": "choice",
    "answer": "safe_raw_egg_observation",
    "prompt": "觀察生蛋樣本時，哪一個做法最符合安全觀察？",
    "hint": "先找能避免入口、污染桌面與接觸後未清潔的做法。",
    "misconception": "raw_egg_safety_confusion",
    "options": [
      {
        "id": "safe_raw_egg_observation",
        "text": "使用托盤觀察，不入口，完成後清理並洗手"
      },
      {
        "id": "taste_raw_egg",
        "text": "直接嘗一點生蛋液確認味道"
      },
      {
        "id": "leave_shell_on_desk",
        "text": "把蛋殼留在桌上，等下課再整理"
      },
      {
        "id": "splash_to_classmate",
        "text": "把蛋液拿給同學靠近聞或互相傳遞"
      }
    ]
  },
  {
    "id": "egg_observation_q02",
    "section": "checkpoint1",
    "concept": "external_shell",
    "type": "choice",
    "answer": "shell_visible_externally",
    "prompt": "不打開雞蛋時，最容易直接觀察到哪個構造？",
    "hint": "先想想從外表就能看到、摸到的是哪一層。",
    "misconception": "external_internal_structure_confusion",
    "options": [
      {
        "id": "shell_visible_externally",
        "text": "蛋殼"
      },
      {
        "id": "yolk_visible_externally",
        "text": "蛋黃"
      },
      {
        "id": "air_cell_visible_externally",
        "text": "氣室"
      },
      {
        "id": "chalaza_visible_externally",
        "text": "繫帶"
      }
    ]
  },
  {
    "id": "egg_observation_q03",
    "section": "checkpoint1",
    "concept": "external_shell",
    "type": "choice",
    "answer": "shell_protection_gas_exchange",
    "prompt": "蛋殼最適合用哪個說法描述？",
    "hint": "蛋殼不是完全沒有功能的包裝，也不是主要提供養分的位置。",
    "misconception": "shell_no_function_confusion",
    "options": [
      {
        "id": "shell_protection_gas_exchange",
        "text": "保護內部，並透過細小孔洞和外界交換氣體"
      },
      {
        "id": "shell_main_nutrient",
        "text": "主要提供胚胎發育所需養分"
      },
      {
        "id": "shell_is_embryo",
        "text": "就是正在發育的胚胎"
      },
      {
        "id": "shell_no_function",
        "text": "只是沒有功能的外層"
      }
    ]
  },
  {
    "id": "egg_observation_q04",
    "section": "checkpoint1",
    "concept": "egg_observation_safety",
    "type": "sequence",
    "answer": [
      "prepare_tray_cleaning_wash_hands",
      "observe_external_shell",
      "carefully_open_and_observe_cross_section",
      "record_structures_locations_functions",
      "clean_shell_liquid_wash_hands"
    ],
    "prompt": "請拖曳排序，排出安全觀察雞蛋的合理流程。",
    "hint": "先找安全準備和清理應放在流程哪兩端，再安排外觀與剖面觀察。",
    "misconception": "egg_observation_sequence_confusion",
    "steps": [
      {
        "id": "prepare_tray_cleaning_wash_hands",
        "label": "準備托盤、清潔用具並洗手"
      },
      {
        "id": "observe_external_shell",
        "label": "先觀察外部蛋殼特徵"
      },
      {
        "id": "carefully_open_and_observe_cross_section",
        "label": "小心打開並觀察剖面構造"
      },
      {
        "id": "record_structures_locations_functions",
        "label": "記錄構造位置與功能線索"
      },
      {
        "id": "clean_shell_liquid_wash_hands",
        "label": "清理蛋殼與蛋液並再次洗手"
      }
    ]
  },
  {
    "id": "egg_observation_q05",
    "section": "checkpoint2",
    "concept": "structure_function_evidence",
    "type": "mapping",
    "answer": {
      "outer_hard_shell": "eggshell",
      "translucent_region": "albumen",
      "yellow_round_region": "yolk",
      "blunt_end_air_space": "air_cell"
    },
    "prompt": "請依剖面線索將構造配到名稱。",
    "hint": "先看位置：外層硬殼、透明區、黃色圓形區、鈍端空氣空間。",
    "misconception": "egg_structure_label_confusion",
    "items": [
      {
        "id": "outer_hard_shell",
        "label": "外層硬殼"
      },
      {
        "id": "translucent_region",
        "label": "透明或半透明部分"
      },
      {
        "id": "yellow_round_region",
        "label": "黃色圓形部分"
      },
      {
        "id": "blunt_end_air_space",
        "label": "鈍端空氣空間"
      }
    ],
    "choices": structureChoices
  },
  {
    "id": "egg_observation_q06",
    "section": "checkpoint2",
    "concept": "structure_function_evidence",
    "type": "mapping",
    "answer": {
      "eggshell": "protects_inside",
      "albumen": "water_and_cushion",
      "yolk": "nutrient_supply",
      "air_cell": "air_space"
    },
    "prompt": "請將雞蛋構造與主要功能配對。",
    "hint": "把外層、透明區、黃色區和鈍端空間分開判斷。",
    "misconception": "egg_structure_function_confusion",
    "items": [
      {
        "id": "eggshell",
        "label": "蛋殼"
      },
      {
        "id": "albumen",
        "label": "蛋白"
      },
      {
        "id": "yolk",
        "label": "蛋黃"
      },
      {
        "id": "air_cell",
        "label": "氣室"
      }
    ],
    "choices": functionChoices
  },
  {
    "id": "egg_observation_q07",
    "section": "checkpoint2",
    "concept": "yolk",
    "type": "choice",
    "answer": "yolk_nutrient_not_embryo",
    "prompt": "看到蛋黃時，哪個說法最符合本單元觀察？",
    "hint": "蛋黃是重要養分來源，但不能只因為看到蛋黃就判定那是胚胎。",
    "misconception": "yolk_is_embryo_confusion",
    "options": [
      {
        "id": "yolk_nutrient_not_embryo",
        "text": "蛋黃主要提供養分，不能直接等同於胚胎"
      },
      {
        "id": "yolk_always_embryo",
        "text": "蛋黃一定就是胚胎"
      },
      {
        "id": "yolk_is_shell",
        "text": "蛋黃是外層蛋殼"
      },
      {
        "id": "yolk_is_air",
        "text": "蛋黃是氣室中的空氣"
      }
    ]
  },
  {
    "id": "egg_observation_q08",
    "section": "checkpoint2",
    "concept": "air_cell",
    "type": "choice",
    "answer": "air_cell_blunt_end_space",
    "prompt": "氣室最常位於雞蛋哪一端，觀察時要注意什麼？",
    "hint": "氣室是靠近鈍端的空間，不是蛋黃或蛋白本身。",
    "misconception": "air_cell_damage_confusion",
    "options": [
      {
        "id": "air_cell_blunt_end_space",
        "text": "鈍端附近的空氣空間"
      },
      {
        "id": "air_cell_yolk_center",
        "text": "蛋黃中心的黃色部分"
      },
      {
        "id": "air_cell_outer_shell",
        "text": "蛋殼外表的斑點"
      },
      {
        "id": "air_cell_albumen",
        "text": "透明蛋白的全部區域"
      }
    ]
  },
  {
    "id": "egg_observation_q09",
    "section": "checkpoint2",
    "concept": "chalaza",
    "type": "choice",
    "answer": "chalaza_anchors_yolk",
    "prompt": "繫帶的觀察線索最接近哪個功能？",
    "hint": "繫帶位在蛋黃兩側附近，重點是協助固定位置。",
    "misconception": "chalaza_spoilage_confusion",
    "options": [
      {
        "id": "chalaza_anchors_yolk",
        "text": "協助固定蛋黃位置"
      },
      {
        "id": "chalaza_is_shell",
        "text": "形成硬的蛋殼"
      },
      {
        "id": "chalaza_is_air",
        "text": "儲存氣室中的空氣"
      },
      {
        "id": "chalaza_is_yolk_nutrient",
        "text": "就是蛋黃中的全部養分"
      }
    ]
  },
  {
    "id": "egg_observation_q10",
    "section": "checkpoint3",
    "concept": "germinal_disc",
    "type": "choice",
    "answer": "germinal_disc_on_yolk_surface",
    "prompt": "胚盤的觀察位置最接近哪個說法？",
    "hint": "胚盤通常和蛋黃表面的小白點線索有關。",
    "misconception": "germinal_disc_yolk_confusion",
    "options": [
      {
        "id": "germinal_disc_on_yolk_surface",
        "text": "蛋黃表面可見的小白點區域"
      },
      {
        "id": "germinal_disc_shell",
        "text": "蛋殼最外層"
      },
      {
        "id": "germinal_disc_air_cell",
        "text": "鈍端氣室"
      },
      {
        "id": "germinal_disc_albumen",
        "text": "全部透明蛋白"
      }
    ]
  },
  {
    "id": "egg_observation_q11",
    "section": "checkpoint3",
    "concept": "oviparous_development_basic",
    "type": "choice",
    "answer": "egg_not_always_developing_embryo",
    "prompt": "觀察到雞蛋構造時，哪個推論較合理？",
    "hint": "觀察到蛋構造不等於已確認正在發育；還需要更多證據。",
    "misconception": "every_egg_has_embryo_confusion",
    "options": [
      {
        "id": "egg_not_always_developing_embryo",
        "text": "蛋內有構造，但是否正在發育需看更多證據"
      },
      {
        "id": "every_egg_has_embryo",
        "text": "只要是蛋就一定有正在發育的胚胎"
      },
      {
        "id": "shell_is_development",
        "text": "蛋殼厚就代表胚胎正在發育"
      },
      {
        "id": "albumen_is_offspring",
        "text": "蛋白本身就是幼體"
      }
    ]
  },
  {
    "id": "egg_observation_q12",
    "section": "checkpoint3",
    "concept": "observation_recording",
    "type": "choice",
    "answer": "evidence_then_structure_inference",
    "prompt": "哪一筆觀察紀錄最符合「先記證據，再做推論」？",
    "hint": "先看是否寫下看見的位置、顏色或形狀，再提出構造判斷。",
    "misconception": "observation_inference_confusion",
    "options": [
      {
        "id": "evidence_then_structure_inference",
        "text": "在蛋黃表面看到小白點，因此推測可能是胚盤位置"
      },
      {
        "id": "guess_without_evidence",
        "text": "我覺得這一定是胚胎，因為看起來很像"
      },
      {
        "id": "copy_structure_only",
        "text": "蛋殼、蛋白、蛋黃、氣室"
      },
      {
        "id": "health_advice",
        "text": "這顆蛋看起來比較健康"
      }
    ]
  },
  {
    "id": "egg_observation_q13",
    "section": "checkpoint3",
    "concept": "unit_boundary_control",
    "type": "mapping",
    "answer": {
      "sperm_egg_zygote": "u29_sexual_reproduction",
      "shell_albumen_yolk_aircell": "u30_egg_observation",
      "stamen_pistil_labeling": "u31_flower_observation",
      "potato_tuber_new_plant": "u28_asexual_reproduction"
    },
    "prompt": "請把下列內容分到最合適的單元位置。",
    "hint": "先判斷是無性形成新個體、精卵結合、蛋內構造觀察，還是花部標記。",
    "misconception": "egg_unit_boundary_classification_confusion",
    "items": [
      {
        "id": "sperm_egg_zygote",
        "label": "精子與卵結合形成受精卵"
      },
      {
        "id": "shell_albumen_yolk_aircell",
        "label": "蛋殼、蛋白、蛋黃與氣室觀察"
      },
      {
        "id": "stamen_pistil_labeling",
        "label": "雄蕊、雌蕊等花部標記"
      },
      {
        "id": "potato_tuber_new_plant",
        "label": "馬鈴薯塊莖長出新植株"
      }
    ],
    "choices": [
      {
        "id": "u28_asexual_reproduction",
        "text": "第 28 站：無性生殖"
      },
      {
        "id": "u29_sexual_reproduction",
        "text": "第 29 站：有性生殖"
      },
      {
        "id": "u30_egg_observation",
        "text": "第 30 站：蛋的觀察"
      },
      {
        "id": "u31_flower_observation",
        "text": "第 31 站：花的觀察"
      }
    ]
  },
  {
    "id": "egg_observation_q14",
    "section": "checkpoint3",
    "concept": "unit_boundary_control",
    "type": "choice",
    "answer": "egg_cross_section_observation_belongs_u30",
    "prompt": "下列哪個情境最適合放在「蛋的觀察」本單元核心檢核？",
    "hint": "找出和蛋殼、蛋白、蛋黃、氣室等剖面觀察最直接相關的情境。",
    "misconception": "egg_unit_boundary_confusion",
    "options": [
      {
        "id": "egg_cross_section_observation_belongs_u30",
        "text": "觀察蛋殼、蛋白、蛋黃與氣室的位置"
      },
      {
        "id": "flower_pollination_process",
        "text": "說明花粉如何到達柱頭"
      },
      {
        "id": "sperm_egg_zygote_process",
        "text": "精子和卵結合形成受精卵的流程"
      },
      {
        "id": "potato_tuber_new_plant",
        "text": "草莓走莖或馬鈴薯塊莖長出新植株"
      }
    ]
  }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  "checkpoint1": [
    "egg_observation_q01",
    "egg_observation_q02",
    "egg_observation_q03",
    "egg_observation_q04"
  ],
  "checkpoint2": [
    "egg_observation_q05",
    "egg_observation_q06",
    "egg_observation_q07",
    "egg_observation_q08",
    "egg_observation_q09"
  ],
  "checkpoint3": [
    "egg_observation_q10",
    "egg_observation_q11",
    "egg_observation_q12",
    "egg_observation_q13",
    "egg_observation_q14"
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
  const attemptId = uid("egg_observation_guest_attempt");
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
  earned.push("egg_observation_entry");
  if (passed(["egg_observation_q01", "egg_observation_q04"])) earned.push("raw_egg_safety_guard");
  if (passed(["egg_observation_q02", "egg_observation_q03"])) earned.push("external_shell_observer");
  if (passed(["egg_observation_q04"])) earned.push("safe_egg_sequence_tracker");
  if (passed(["egg_observation_q05"])) earned.push("egg_cross_section_labeler");
  if (passed(["egg_observation_q06"])) earned.push("egg_structure_function_mapper");
  if (passed(["egg_observation_q07", "egg_observation_q10"])) earned.push("yolk_embryo_boundary_reader");
  if (passed(["egg_observation_q08"])) earned.push("air_cell_evidence_reader");
  if (passed(["egg_observation_q09"])) earned.push("chalaza_anchor_reader");
  if (passed(["egg_observation_q11"])) earned.push("egg_development_evidence_checker");
  if (passed(["egg_observation_q12"])) earned.push("observation_inference_recorder");
  if (passed(["egg_observation_q13"])) earned.push("u28_u29_u30_u31_egg_boundary_guardian");
  if (passed(["egg_observation_q14"])) earned.push("egg_unit_boundary_guardian");
  if (correctedCore) earned.push("egg_observation_misconception_reviser");
  if (flawless) earned.push("egg_observation_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("egg_observation_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_egg_observation");
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
    question_version: QUESTION_VERSION,
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
      concept_id: questionMap[log.question_id]?.concept || "",
      checkpoint_id: checkpointIdForQuestion(log.question_id),
      teacher_group_id: analysisGroupForQuestion(log.question_id),
      is_correct: log.is_correct,
      corrected_after_hint: Boolean(log.is_correct && log.hint_used),
      verification_status: state.student?.is_guest ? "local_guest" : "pending_backend",
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
  if (["egg_observation_q01", "egg_observation_q04"].includes(questionId)) return "egg_safety_observation_flow";
  if (["egg_observation_q02", "egg_observation_q05", "egg_observation_q08", "egg_observation_q09", "egg_observation_q10"].includes(questionId)) return "egg_external_internal_structures";
  if (["egg_observation_q03", "egg_observation_q06", "egg_observation_q07"].includes(questionId)) return "egg_structure_function";
  if (["egg_observation_q11"].includes(questionId)) return "egg_development_basic";
  if (["egg_observation_q12"].includes(questionId)) return "observation_recording";
  if (["egg_observation_q13", "egg_observation_q14"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "egg_observation_cp1_safety_and_external",
    checkpoint2: "egg_observation_cp2_internal_structures",
    checkpoint3: "egg_observation_cp3_function_and_data"
  }[section] || "egg_observation_cp5_reflection";
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
  const sceneMedia = assets.briefingSceneHook ? `<picture class="brief-scene-media">${assets.briefingSceneMobileHook ? `<source srcset="${assets.briefingSceneMobileHook}" media="(max-width: 640px)">` : ""}<img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="蛋的觀察簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')"></picture>` : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="生命延續資料庫場景待接"><strong>生命延續資料庫</strong><span>正式簡報圖核准後，會在此呈現阿澤老師與蛋的觀察判讀場景。</span></div>`;
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero"><figure class="brief-scene egg-observation-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>${sceneMedia}<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'"></figure><div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p>生命延續資料庫收到雞蛋樣本。請依外部與剖面證據，判斷蛋殼、蛋白、蛋黃、氣室、胚盤與繫帶的觀察線索，並守住 U28-U31 邊界。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入生命延續資料庫前，先抓住四個蛋的觀察線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚哪些是你真的看到的外觀與位置，哪些是根據證據做出的功能推測。</h3><p>本任務會用安全流程、剖面構造、功能判讀、觀察紀錄與 U28-U31 邊界，幫你整理蛋的觀察。</p></div></div><div class="concept-grid"><article><strong>安全觀察</strong><p>觀察用生蛋不可食用，操作前後洗手，並清理蛋殼與蛋液。</p></article><article><strong>由外到內</strong><p>先看蛋殼，再看剖面中的蛋白、蛋黃、氣室等線索。</p></article><article><strong>證據與推論</strong><p>先描述看到的位置與外觀，再推測構造或功能。</p></article><article><strong>守住邊界</strong><p>U28 看無性生殖；U29 看受精流程；U30 看蛋構造；U31 看花部觀察。</p></article></div><button class="primary" data-next="checkpoint1">開始蛋的觀察任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1:["安全、外部觀察與流程","先確認生蛋觀察安全、蛋殼外部線索與由外到內的觀察流程。"] ,
    checkpoint2:["剖面構造辨識","用位置與外觀線索辨識蛋殼、蛋白、蛋黃、氣室與繫帶。"] ,
    checkpoint3:["功能、資料與單元邊界","整理胚盤、發育、觀察紀錄，以及 U28-U31 的邊界判讀。"]
  }[section];
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

function conceptLabel(concept) { return {egg_observation_safety:"安全觀察",external_shell:"蛋殼外部線索",structure_function_evidence:"構造與功能證據",yolk:"蛋黃與養分",air_cell:"氣室",chalaza:"繫帶",germinal_disc:"胚盤",oviparous_development_basic:"蛋與發育基礎",observation_recording:"觀察紀錄",unit_boundary_control:"單元邊界"}[concept] || concept; }


function renderQuestionEvidence(qid) {
  if (qid === "egg_observation_q04") return `<div class="evidence-card"><strong>安全流程卡</strong><p>先找出安全準備與清理應放在哪兩端，再安排外部觀察、剖面觀察與紀錄的位置。</p></div>`;
  if (qid === "egg_observation_q05") return `<figure class="evidence-card"><strong>剖面辨識圖待接</strong><p>正式雞蛋剖面圖核准前，先依「外層硬殼、透明區、黃色圓形區、鈍端空氣空間」的文字線索完成配對。</p></figure>`;
  if (qid === "egg_observation_q12") return `<div class="evidence-card"><strong>紀錄判讀卡</strong><p>先描述看到的位置與外觀，再寫出你推測的構造或功能；不要把推測直接寫成已觀察事實。</p></div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的蛋的觀察判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的蛋的觀察概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section><aside class="panel mentor-card" data-feedback-state="${stateName}"><img src="../shared-assets/mentor-feedback/mentor-feedback-${stateName}.webp" alt="阿澤老師回饋" onerror="this.src='${assets.mentorFallback}'"><h3>${feedbackTitle(stateName)}</h3><p>請把不確定的概念轉成課堂上想確認的方向。</p></aside></div>`;
}


function misconceptionText(tag) { return {
  raw_egg_safety_confusion:"建議再確認安全觀察：觀察用生蛋不可食用，前後洗手並清理蛋殼與蛋液。",
  external_internal_structure_confusion:"建議再區分外部與剖面構造：蛋殼可外部觀察，蛋白、蛋黃、氣室多需剖面或照光資料。",
  shell_no_function_confusion:"建議再確認蛋殼功能：蛋殼可保護內部，也和氣體交換有關。",
  egg_observation_sequence_confusion:"建議再整理安全觀察流程：先準備與外部觀察，再剖面觀察、紀錄與清理。",
  egg_structure_label_confusion:"建議再用位置與外觀辨識：外層硬殼、透明部分、黃色部分、鈍端空間是重要線索。",
  egg_function_match_confusion:"建議再整理構造功能：蛋白緩衝保護，蛋黃提供養分，氣室是空氣空間。",
  yolk_is_embryo_confusion:"建議再確認蛋黃不是胚胎本身，蛋黃主要提供發育所需養分。",
  air_cell_damage_confusion:"建議再確認氣室：氣室是蛋內空氣空間，常在鈍端，不一定是破損。",
  chalaza_spoilage_confusion:"建議再確認繫帶：繫帶可幫助固定蛋黃位置，不是腐壞或雜質。",
  germinal_disc_yolk_confusion:"建議再確認胚盤位於蛋黃表面附近，不能把整個蛋黃都當成胚胎。",
  every_egg_has_embryo_confusion:"建議再確認蛋可支持胚胎發育，但不是每顆可見雞蛋都一定正在發育。",
  observation_inference_confusion:"建議再練習觀察紀錄：先寫看到的證據，再寫你推測的構造或功能。",
  egg_unit_boundary_classification_confusion:"建議再確認 U28-U31 站序邊界：U30 看蛋構造觀察，其他留在相鄰單元。",
  egg_unit_boundary_confusion:"建議再確認本單元核心：雞蛋外部、剖面構造與觀察紀錄。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從安全觀察、蛋殼、蛋白、蛋黃、氣室、胚盤、繫帶、觀察紀錄或 U31 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：氣室通常在鈍端，是蛋內空氣空間"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認胚盤和蛋黃有什麼差別，觀察時該看哪個線索？">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>蛋內構造判讀任務結算</h2>
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
      ${renderBadgeWall(result.earned_badges, { onlyEarned: true, mode: resultMode(result) })}
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
  const mode = options.mode || resultMode();
  const badgeList = options.onlyEarned
    ? [...earnedSet].map((id) => badges.find((badge) => badge.id === id)).filter(Boolean)
    : badges;
  const badgeVisual = (badge) => badge.image_status !== "ready" || !badge.badge_image_path
    ? `<span class="bq-badge-asset-pending" role="img" aria-label="${escapeHtml(badge.name)}素材待接">徽章素材待接</span>`
    : `<img src="${badge.badge_image_path}?v=${VERSION}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('fallback'); this.remove();">`;
  const statusText = {
    verified: "本次正式取得",
    pending: "本次可能取得，待後台確認",
    guest: "guest 測試徽章，不列入正式累積"
  }[mode] || "本次可能取得，待後台確認";
  return `<section class="panel">
    <p class="eyebrow">${options.onlyEarned ? "本次徽章" : "徽章收藏牆"}</p>
    <h2>${options.onlyEarned ? "本次取得徽章" : `本單元 ${badges.length} 枚徽章`}</h2>
    ${options.onlyEarned && !badgeList.length ? `<p class="muted">本次尚未取得徽章；正式徽章累積以後台確認為準。</p>` : ""}
    <div class="badge-wall">
      ${badgeList.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual" data-badge-image-status="${badge.image_status || "pending"}">
            ${badgeVisual(badge)}
          </div>
          <strong>${escapeHtml(badge.name)}</strong>
          ${options.onlyEarned ? `<span class="badge-state">${escapeHtml(statusText)}</span>` : ""}
          <p>${escapeHtml(badge.condition)}</p>
        </article>
      `).join("")}
    </div>
  </section>`;
}

function renderRules() {
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與安全觀察、蛋殼、蛋白、蛋黃、氣室、胚盤、繫帶、觀察紀錄或單元邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button></section></div>`;
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
  window.__egg_observationTest = {
    VERSION,
    QUESTION_VERSION,
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
