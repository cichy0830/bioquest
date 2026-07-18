const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-sexual-reproduction-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_sexual_reproduction_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  "unit_id": "sexual_reproduction",
  "unit_title": "有性生殖",
  "mission_title": "配子會合判讀任務",
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
    "有性生殖",
    "配子",
    "精子",
    "卵",
    "受精",
    "受精卵",
    "親代來源",
    "後代差異",
    "體內受精",
    "體外受精",
    "授粉",
    "花粉",
    "柱頭",
    "胚珠",
    "無性生殖",
    "U30 邊界",
    "U31 邊界"
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
    "有性生殖定義",
    "配子",
    "受精",
    "親代來源",
    "後代差異",
    "體內/體外受精",
    "授粉與受精",
    "無性/有性比較",
    "U30 邊界"
  ]
};

const badges = [
  [
    "sexual_reproduction_entry",
    "配子會合入門",
    "完成配子會合判讀任務。"
  ],
  [
    "sexual_gamete_definition_guard",
    "有性配子定義",
    "能辨識有性生殖涉及配子並知道精子與卵是配子。"
  ],
  [
    "fertilization_basic_reader",
    "受精概念判讀",
    "能區分受精與授粉、蛋構造或出芽。"
  ],
  [
    "sexual_sequence_tracker",
    "有性流程排序",
    "能排出有性生殖的簡化概念流程。"
  ],
  [
    "parent_sources_reader",
    "親代來源判讀",
    "能連結後代接受來自親代雙方或兩種配子的遺傳資訊。"
  ],
  [
    "offspring_variation_interpreter",
    "後代差異資料判讀",
    "能用差異與精卵結合資料判斷有性生殖。"
  ],
  [
    "fertilization_location_classifier",
    "受精位置分類",
    "能以精卵結合位置判斷體內/體外受精。"
  ],
  [
    "pollination_fertilization_boundary_reader",
    "授粉受精分辨",
    "能修正授粉等於受精的迷思。"
  ],
  [
    "plant_sexual_reproduction_reader",
    "植物有性生殖判讀",
    "能辨識植物有性生殖的基本線索。"
  ],
  [
    "internal_fertilization_development_separator",
    "受精發育分開判斷",
    "能區分體內受精與胎生/卵生。"
  ],
  [
    "asexual_sexual_comparison_classifier",
    "無性有性比較",
    "能用是否精卵結合比較無性與有性生殖。"
  ],
  [
    "u28_u29_u30_u31_boundary_guardian",
    "四站邊界守門",
    "能區分 U28 無性、U29 有性、U30 蛋觀察與 U31 花觀察。"
  ],
  [
    "sexual_unit_boundary_guardian",
    "有性生殖核心守門",
    "能排除蛋構造、無性繁殖或細胞分裂流程。"
  ],
  [
    "sexual_reproduction_misconception_reviser",
    "有性生殖迷思修正",
    "提示後修正本單元迷思。"
  ],
  [
    "sexual_reproduction_flawless",
    "配子會合零提示全對",
    "全部答對且全程未使用提示。"
  ],
  [
    "sexual_reproduction_reflection_reporter",
    "高品質有性生殖回報",
    "回報品質達 discussion_question。"
  ],
  [
    "retry_growth_sexual_reproduction",
    "再探配子會合精熟進步",
    "再挑戰完整完成且正確率進步。"
  ]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const fertilizationChoices = [
  {
    "id": "internal_fertilization",
    "text": "體內受精"
  },
  {
    "id": "external_fertilization",
    "text": "體外受精"
  }
];
const compareChoices = [
  {
    "id": "sexual_reproduction",
    "text": "較符合有性生殖"
  },
  {
    "id": "asexual_reproduction",
    "text": "較符合無性生殖"
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
    "id": "sexual_reproduction_q01",
    "section": "checkpoint1",
    "concept": "sexual_gamete_fusion",
    "type": "choice",
    "answer": "sexual_reproduction_needs_gamete_fusion",
    "prompt": "有同學說：「有性生殖和無性生殖一樣，都不需要精子和卵。」哪個修正較合理？",
    "hint": "先看題目是否出現精子、卵或受精。",
    "misconception": "sexual_definition_confusion",
    "options": [
      {
        "id": "sexual_reproduction_needs_gamete_fusion",
        "text": "有性生殖通常涉及精子與卵等配子結合"
      },
      {
        "id": "sweat_forms_new_individual",
        "text": "有性生殖只要流汗就能形成新個體"
      },
      {
        "id": "egg_yolk_position_only",
        "text": "有性生殖只是在看蛋黃位置"
      },
      {
        "id": "potato_tuber_always",
        "text": "有性生殖一定是馬鈴薯塊莖長新株"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q02",
    "section": "checkpoint1",
    "concept": "gamete_basic",
    "type": "choice",
    "answer": "sperm_and_egg_are_gametes",
    "prompt": "下列哪一組最符合本單元的「配子」例子？",
    "hint": "想想哪些細胞會參與受精。",
    "misconception": "gamete_identity_confusion",
    "options": [
      {
        "id": "sperm_and_egg_are_gametes",
        "text": "精子與卵"
      },
      {
        "id": "eggshell_aircell",
        "text": "蛋殼與氣室"
      },
      {
        "id": "potato_runner",
        "text": "馬鈴薯塊莖與走莖"
      },
      {
        "id": "skin_vessel_sweat_gland",
        "text": "皮膚血管與汗腺"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q03",
    "section": "checkpoint1",
    "concept": "fertilization_basic",
    "type": "choice",
    "answer": "fertilization_sperm_egg_form_zygote",
    "prompt": "「受精」最適合描述下列哪個過程？",
    "hint": "先找是否真的發生「精子和卵結合」。",
    "misconception": "fertilization_pollination_confusion",
    "options": [
      {
        "id": "fertilization_sperm_egg_form_zygote",
        "text": "精子與卵結合形成受精卵"
      },
      {
        "id": "pollen_reaches_stigma",
        "text": "花粉剛到達柱頭"
      },
      {
        "id": "albumen_wraps_yolk",
        "text": "蛋白包住蛋黃"
      },
      {
        "id": "yeast_grows_bud",
        "text": "酵母菌長出小芽"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q04",
    "section": "checkpoint2",
    "concept": "fertilization_basic",
    "type": "sequence",
    "answer": [
      "parents_produce_sperm_and_egg",
      "sperm_and_egg_meet",
      "fertilization_forms_zygote",
      "zygote_begins_development"
    ],
    "prompt": "請拖曳排序，排出動物有性生殖的簡化概念流程。",
    "hint": "先找精子與卵在哪一步相遇，再看受精卵在何時出現。",
    "misconception": "sexual_sequence_order_confusion",
    "steps": [
      {
        "id": "parents_produce_sperm_and_egg",
        "label": "親代產生精子與卵"
      },
      {
        "id": "sperm_and_egg_meet",
        "label": "精子與卵相遇"
      },
      {
        "id": "fertilization_forms_zygote",
        "label": "受精形成受精卵"
      },
      {
        "id": "zygote_begins_development",
        "label": "受精卵開始發育成新個體"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q05",
    "section": "checkpoint2",
    "concept": "parent_sources",
    "type": "choice",
    "answer": "offspring_inherit_from_two_parent_sources",
    "prompt": "小狗和牠的兄弟姊妹外型有些相似，又不會完全一樣。哪個說法較合理？",
    "hint": "想想有性生殖後代的遺傳資訊可能來自幾個來源。",
    "misconception": "parent_source_confusion",
    "options": [
      {
        "id": "offspring_inherit_from_two_parent_sources",
        "text": "有性生殖後代通常接受來自兩個親代的遺傳資訊，所以可能有差異"
      },
      {
        "id": "single_parent_budding_only",
        "text": "牠們一定都由單一親代出芽形成"
      },
      {
        "id": "no_genetic_information",
        "text": "牠們一定完全沒有遺傳資訊"
      },
      {
        "id": "eggshell_thickness_decides",
        "text": "牠們的差異只能由蛋殼厚度決定"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q06",
    "section": "checkpoint2",
    "concept": "offspring_variation",
    "type": "choice",
    "answer": "sexual_offspring_show_variation",
    "prompt": "一組資料顯示：同一對親代繁殖出的後代，在花色或體型上有些差異。這最能支持哪個概念？",
    "hint": "看資料重點是同親代後代之間的相似與差異。",
    "misconception": "offspring_variation_misread",
    "options": [
      {
        "id": "sexual_offspring_show_variation",
        "text": "有性生殖後代通常有較多差異"
      },
      {
        "id": "sexual_offspring_identical",
        "text": "有性生殖後代一定完全相同"
      },
      {
        "id": "must_be_vegetative_propagation",
        "text": "這表示一定是營養器官繁殖"
      },
      {
        "id": "judge_yolk_embryo",
        "text": "這是在判斷蛋黃是不是胚胎"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q07",
    "section": "checkpoint2",
    "concept": "internal_external_fertilization",
    "type": "mapping",
    "answer": {
      "frog_water_fertilization": "external_fertilization",
      "human_internal_fertilization": "internal_fertilization",
      "fish_water_fertilization": "external_fertilization",
      "bird_internal_fertilization": "internal_fertilization"
    },
    "prompt": "請把情境配到較合適的受精位置。",
    "hint": "先看精子和卵結合的位置是在母體內還是母體外。",
    "misconception": "internal_external_fertilization_confusion",
    "items": [
      {
        "id": "frog_water_fertilization",
        "label": "青蛙在水中釋放精子與卵並在水中結合"
      },
      {
        "id": "human_internal_fertilization",
        "label": "人類精子與卵在母體內結合"
      },
      {
        "id": "fish_water_fertilization",
        "label": "魚類在水中完成精卵結合"
      },
      {
        "id": "bird_internal_fertilization",
        "label": "鳥類精子與卵在母體內結合"
      }
    ],
    "choices": [
      {
        "id": "internal_fertilization",
        "text": "體內受精"
      },
      {
        "id": "external_fertilization",
        "text": "體外受精"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q08",
    "section": "checkpoint3",
    "concept": "plant_pollination_fertilization_basic",
    "type": "choice",
    "answer": "pollination_not_same_as_fertilization",
    "prompt": "有同學說：「授粉就是受精，兩個詞完全一樣。」哪個修正較合理？",
    "hint": "先分辨花粉移動到柱頭，和精細胞與卵真正結合是否是同一步。",
    "misconception": "pollination_fertilization_confusion",
    "options": [
      {
        "id": "pollination_not_same_as_fertilization",
        "text": "授粉是花粉到達柱頭；受精是精細胞與卵結合"
      },
      {
        "id": "pollination_albumen_yolk",
        "text": "授粉是蛋白包住蛋黃"
      },
      {
        "id": "pollination_potato_tuber",
        "text": "授粉是馬鈴薯塊莖長新株"
      },
      {
        "id": "fertilization_temperature_drop",
        "text": "受精是體溫下降"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q09",
    "section": "checkpoint3",
    "concept": "animal_plant_examples",
    "type": "choice",
    "answer": "plant_pollen_sperm_egg_fertilization",
    "prompt": "下列哪個情境較符合植物有性生殖的基礎例子？",
    "hint": "找出是否出現花粉中的精細胞與卵結合。",
    "misconception": "plant_sexual_reproduction_confusion",
    "options": [
      {
        "id": "plant_pollen_sperm_egg_fertilization",
        "text": "花粉到達柱頭後，花粉中的精細胞可與胚珠中的卵結合"
      },
      {
        "id": "strawberry_runner_new_plant",
        "text": "草莓走莖長出新株"
      },
      {
        "id": "yeast_budding",
        "text": "酵母菌長出小芽"
      },
      {
        "id": "chromosome_copy_distribution",
        "text": "染色體複製後均分到兩個子細胞"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q10",
    "section": "checkpoint3",
    "concept": "internal_external_fertilization",
    "type": "choice",
    "answer": "internal_fertilization_not_always_viviparous",
    "prompt": "有同學說：「只要是體內受精，動物就一定是胎生。」哪個修正較合理？",
    "hint": "先分開看「受精位置」和「胚胎發育位置」。",
    "misconception": "internal_fertilization_viviparous_confusion",
    "options": [
      {
        "id": "internal_fertilization_not_always_viviparous",
        "text": "體內受精指精卵在母體內結合，不代表一定胎生"
      },
      {
        "id": "internal_is_water_fertilization",
        "text": "體內受精就是精卵在水中結合"
      },
      {
        "id": "internal_only_potato",
        "text": "體內受精只會出現在馬鈴薯"
      },
      {
        "id": "viviparous_hard_eggshell",
        "text": "胎生就是蛋殼比較硬"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q11",
    "section": "checkpoint3",
    "concept": "asexual_sexual_compare",
    "type": "mapping",
    "answer": {
      "sperm_egg_zygote": "sexual_reproduction",
      "strawberry_runner": "asexual_reproduction",
      "hydra_budding": "asexual_reproduction",
      "plant_sperm_egg": "sexual_reproduction"
    },
    "prompt": "請把情境分成「較符合有性生殖」或「較符合無性生殖」。",
    "hint": "先看是否出現精子與卵結合；沒有時再看是否由親代部分形成新個體。",
    "misconception": "asexual_sexual_comparison_confusion",
    "items": [
      {
        "id": "sperm_egg_zygote",
        "label": "精子與卵結合形成受精卵"
      },
      {
        "id": "strawberry_runner",
        "label": "草莓走莖長新株"
      },
      {
        "id": "hydra_budding",
        "label": "水螅出芽"
      },
      {
        "id": "plant_sperm_egg",
        "label": "花粉中的精細胞與胚珠中的卵結合"
      }
    ],
    "choices": [
      {
        "id": "sexual_reproduction",
        "text": "較符合有性生殖"
      },
      {
        "id": "asexual_reproduction",
        "text": "較符合無性生殖"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q12",
    "section": "checkpoint3",
    "concept": "asexual_sexual_compare",
    "type": "choice",
    "answer": "sexual_reproduction_from_variation_and_fertilization_data",
    "prompt": "甲方式後代多與親代相似，乙方式後代常有較多差異；乙方式還出現精子與卵結合。乙方式較可能是哪一類？",
    "hint": "同時看兩個線索：是否精卵結合，以及後代差異是否較多。",
    "misconception": "offspring_variation_misread",
    "options": [
      {
        "id": "sexual_reproduction_from_variation_and_fertilization_data",
        "text": "有性生殖"
      },
      {
        "id": "asexual_reproduction_only",
        "text": "無性生殖"
      },
      {
        "id": "egg_observation",
        "text": "蛋的觀察"
      },
      {
        "id": "temperature_regulation",
        "text": "體溫調節"
      }
    ]
  },
  {
    "id": "sexual_reproduction_q13",
    "section": "checkpoint3",
    "concept": "unit_boundary_control",
    "type": "mapping",
    "answer": {
      "strawberry_runner_new_plant": "u28_asexual_reproduction",
      "sperm_egg_zygote": "u29_sexual_reproduction",
      "egg_shell_albumen_yolk_aircell": "u30_egg_observation",
      "full_flower_structure_labeling": "u31_flower_observation"
    },
    "prompt": "請把下列內容分到最合適的單元位置。",
    "hint": "先判斷是無性形成新個體、精卵結合、蛋內構造觀察，還是花部完整標記。",
    "misconception": "u28_u29_u30_u31_boundary_confusion",
    "items": [
      {
        "id": "strawberry_runner_new_plant",
        "label": "草莓走莖長出新株"
      },
      {
        "id": "sperm_egg_zygote",
        "label": "精子與卵結合形成受精卵"
      },
      {
        "id": "egg_shell_albumen_yolk_aircell",
        "label": "蛋殼、蛋白、蛋黃與氣室觀察"
      },
      {
        "id": "full_flower_structure_labeling",
        "label": "花的完整構造標記"
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
    "id": "sexual_reproduction_q14",
    "section": "checkpoint3",
    "concept": "unit_boundary_control",
    "type": "choice",
    "answer": "fertilization_belongs_sexual_reproduction",
    "prompt": "下列哪個情境最適合放在「有性生殖」本單元核心檢核？",
    "hint": "找出和配子、受精、受精卵最直接相關的情境。",
    "misconception": "sexual_unit_boundary_confusion",
    "options": [
      {
        "id": "fertilization_belongs_sexual_reproduction",
        "text": "精子與卵結合形成受精卵"
      },
      {
        "id": "egg_albumen_yolk_position",
        "text": "蛋白和蛋黃在雞蛋中的位置"
      },
      {
        "id": "potato_tuber_new_plant",
        "text": "馬鈴薯塊莖長出新植株"
      },
      {
        "id": "chromosome_copy_before_division",
        "text": "細胞分裂前染色體先複製"
      }
    ]
  }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  "checkpoint1": [
    "sexual_reproduction_q01",
    "sexual_reproduction_q02",
    "sexual_reproduction_q03"
  ],
  "checkpoint2": [
    "sexual_reproduction_q04",
    "sexual_reproduction_q05",
    "sexual_reproduction_q06",
    "sexual_reproduction_q07"
  ],
  "checkpoint3": [
    "sexual_reproduction_q08",
    "sexual_reproduction_q09",
    "sexual_reproduction_q10",
    "sexual_reproduction_q11",
    "sexual_reproduction_q12",
    "sexual_reproduction_q13",
    "sexual_reproduction_q14"
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
  const attemptId = uid("sexual_reproduction_guest_attempt");
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
  earned.push("sexual_reproduction_entry");
  if (passed(["sexual_reproduction_q01", "sexual_reproduction_q02"])) earned.push("sexual_gamete_definition_guard");
  if (passed(["sexual_reproduction_q03"])) earned.push("fertilization_basic_reader");
  if (passed(["sexual_reproduction_q04"])) earned.push("sexual_sequence_tracker");
  if (passed(["sexual_reproduction_q05"])) earned.push("parent_sources_reader");
  if (passed(["sexual_reproduction_q06", "sexual_reproduction_q12"])) earned.push("offspring_variation_interpreter");
  if (passed(["sexual_reproduction_q07"])) earned.push("fertilization_location_classifier");
  if (passed(["sexual_reproduction_q08"])) earned.push("pollination_fertilization_boundary_reader");
  if (passed(["sexual_reproduction_q09"])) earned.push("plant_sexual_reproduction_reader");
  if (passed(["sexual_reproduction_q10"])) earned.push("internal_fertilization_development_separator");
  if (passed(["sexual_reproduction_q11"])) earned.push("asexual_sexual_comparison_classifier");
  if (passed(["sexual_reproduction_q13"])) earned.push("u28_u29_u30_u31_boundary_guardian");
  if (passed(["sexual_reproduction_q14"])) earned.push("sexual_unit_boundary_guardian");
  if (correctedCore) earned.push("sexual_reproduction_misconception_reviser");
  if (flawless) earned.push("sexual_reproduction_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("sexual_reproduction_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_sexual_reproduction");
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
  if (["sexual_reproduction_q01", "sexual_reproduction_q02", "sexual_reproduction_q03"].includes(questionId)) return "sexual_definition_gametes";
  if (["sexual_reproduction_q04"].includes(questionId)) return "sexual_process_sequence";
  if (["sexual_reproduction_q05", "sexual_reproduction_q06", "sexual_reproduction_q12"].includes(questionId)) return "parent_sources_variation";
  if (["sexual_reproduction_q07", "sexual_reproduction_q10"].includes(questionId)) return "fertilization_location";
  if (["sexual_reproduction_q08", "sexual_reproduction_q09"].includes(questionId)) return "plant_sexual_basics";
  if (["sexual_reproduction_q11"].includes(questionId)) return "asexual_sexual_compare";
  if (["sexual_reproduction_q13", "sexual_reproduction_q14"].includes(questionId)) return "unit_boundary_control";
  return "sexual_definition_gametes";
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
  const sceneMedia = assets.briefingSceneHook ? `<picture class="brief-scene-media">${assets.briefingSceneMobileHook ? `<source srcset="${assets.briefingSceneMobileHook}" media="(max-width: 640px)">` : ""}<img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="有性生殖簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')"></picture>` : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="生命延續資料庫場景待接"><strong>生命延續資料庫</strong><span>正式簡報圖核准後，會在此呈現阿澤老師與有性生殖判讀場景。</span></div>`;
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero"><figure class="brief-scene sexual-reproduction-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>${sceneMedia}<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'"></figure><div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p>生命延續資料庫收到有性生殖樣本。請協助判斷配子、受精、親代來源、後代差異與相鄰單元邊界。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入生命延續資料庫前，先抓住四個有性生殖線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先判斷是否有精子與卵等配子結合、受精是否發生，以及後代是否帶有雙方來源。</h3><p>本任務會用流程排序、情境判斷、分類配對與單元邊界，幫你辨識有性生殖。</p></div></div><div class="concept-grid"><article><strong>核心定義</strong><p>有性生殖通常涉及精子與卵等配子結合。</p></article><article><strong>受精</strong><p>受精是精子與卵結合形成受精卵的過程。</p></article><article><strong>後代差異</strong><p>有性生殖後代通常不會和親代或手足完全一樣。</p></article><article><strong>守住邊界</strong><p>U28 看無性方式；U30 看蛋構造；U31 看花部完整標記。</p></article></div><button class="primary" data-next="checkpoint1">開始判讀配子會合</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = { checkpoint1:["定義、配子與受精","先判斷有性生殖、配子與受精的核心線索。"], checkpoint2:["流程、親代來源與受精位置","整理有性生殖流程、後代差異與體內/體外受精。"], checkpoint3:["植物例子、比較與邊界","用情境分辨授粉/受精、無性/有性，以及 U28/U29/U30/U31。"] }[section];
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

function conceptLabel(concept) { return {sexual_gamete_fusion:"有性生殖定義",gamete_basic:"配子",fertilization_basic:"受精",parent_sources:"親代來源",offspring_variation:"後代差異",internal_external_fertilization:"受精位置",plant_pollination_fertilization_basic:"授粉與受精",animal_plant_examples:"植物有性生殖",asexual_sexual_compare:"無性/有性比較",unit_boundary_control:"單元邊界"}[concept] || concept; }


function renderQuestionEvidence(qid) {
  if (qid === "sexual_reproduction_q04") return `<div class="evidence-card"><strong>概念流程卡</strong><p>請依配子相遇、受精與受精卵開始發育的概念順序整理，不需要背減數分裂步驟。</p></div>`;
  if (qid === "sexual_reproduction_q07") return `<div class="evidence-card"><strong>受精位置卡</strong><p>判斷重點是精子與卵結合的位置在母體內或母體外。</p></div>`;
  if (qid === "sexual_reproduction_q12") return `<div class="evidence-card"><strong>資料線索卡</strong><p>甲：後代多與親代相似。乙：出現精卵結合，後代常有較多差異。</p></div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的有性生殖判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的有性生殖概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section><aside class="panel mentor-card" data-feedback-state="${stateName}"><img src="../shared-assets/mentor-feedback/mentor-feedback-${stateName}.webp" alt="阿澤老師回饋" onerror="this.src='${assets.mentorFallback}'"><h3>${feedbackTitle(stateName)}</h3><p>請把不確定的概念轉成課堂上想確認的方向。</p></aside></div>`;
}


function misconceptionText(tag) { return {
  sexual_definition_confusion:"建議再確認有性生殖定義：通常涉及精子與卵等配子結合。",
  gamete_identity_confusion:"建議再確認配子：精子和卵是參與有性生殖的生殖細胞。",
  fertilization_pollination_confusion:"建議再比較受精與授粉：授粉是花粉到柱頭，受精才是精細胞與卵結合。",
  sexual_sequence_order_confusion:"建議再整理流程：配子相遇、受精形成受精卵，之後才開始發育。",
  parent_source_confusion:"建議再確認親代來源：有性後代通常帶有來自兩個親代或兩種配子的遺傳資訊。",
  offspring_variation_misread:"建議再用資料判斷後代差異：有性生殖後代通常不會和親代或手足完全一樣。",
  internal_external_fertilization_confusion:"建議再確認體內/體外受精：重點是精子與卵結合的位置。",
  pollination_fertilization_confusion:"建議再確認授粉與受精不是同一步。",
  plant_sexual_reproduction_confusion:"建議再確認植物也可能透過精細胞與卵結合完成有性生殖。",
  internal_fertilization_viviparous_confusion:"建議再分開受精位置與胚胎發育方式：體內受精不代表一定胎生。",
  asexual_sexual_comparison_confusion:"建議再用「是否精卵結合」比較無性與有性生殖。",
  u28_u29_u30_u31_boundary_confusion:"建議再確認 U28/U29/U30/U31 站序邊界。",
  sexual_unit_boundary_confusion:"建議再確認本單元核心：配子、受精與有性/無性比較。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想問老師的地方留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從有性生殖定義、配子、受精、親代來源、後代差異、體內/體外受精、授粉與受精、無性/有性比較或 U30 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：受精是精子與卵結合"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認授粉和受精要怎麼分辨？">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>配子會合判讀任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與有性生殖、配子、受精、親代來源、後代差異、受精位置、授粉與受精或 U30 邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button></section></div>`;
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
  window.__sexual_reproductionTest = {
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
