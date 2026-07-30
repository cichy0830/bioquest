const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260730-flower-observation-approved-visuals-v1";
const QUESTION_VERSION = "20260725-flower-observation-v1.1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_flower_observation_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_flower_observation_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "checkpoint4", "review", "reflection"]);

const mission = {
  "unit_id": "flower_observation",
  "unit_title": "花的觀察",
  "mission_title": "花部構造觀察任務",
  "mission_area": "花部觀察資料庫"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "assets/u31-flower-observation-owl-scan-cutout.webp",
  owlPrep: "assets/u31-flower-observation-owl-scan-cutout.webp",
  owlReport: "assets/u31-flower-observation-owl-result-cutout.webp",
  owlResult: "assets/u31-flower-observation-owl-result-cutout.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  loginScene: "assets/u31-flower-observation-login-background-zero-text.webp",
  loginScene1440: "assets/u31-flower-observation-login-background-zero-text-1440w.webp",
  loginScene960: "assets/u31-flower-observation-login-background-zero-text-960w.webp",
  loginScene390: "assets/u31-flower-observation-login-background-zero-text-390w.webp",
  briefScene: "assets/u31-flower-observation-brief-background-zero-text.webp",
  briefScene1440: "assets/u31-flower-observation-brief-background-zero-text-1440w.webp",
  briefScene960: "assets/u31-flower-observation-brief-background-zero-text-960w.webp",
  briefScene390: "assets/u31-flower-observation-brief-background-zero-text-390w.webp",
  scanScene: "assets/u31-flower-observation-scan-background-zero-text.webp",
  scanScene1440: "assets/u31-flower-observation-scan-background-zero-text-1440w.webp",
  scanScene960: "assets/u31-flower-observation-scan-background-zero-text-960w.webp",
  scanScene390: "assets/u31-flower-observation-scan-background-zero-text-390w.webp",
  resultScene: "assets/u31-flower-observation-result-background-zero-text.webp",
  resultScene1440: "assets/u31-flower-observation-result-background-zero-text-1440w.webp",
  resultScene960: "assets/u31-flower-observation-result-background-zero-text-960w.webp",
  resultScene390: "assets/u31-flower-observation-result-background-zero-text-390w.webp",
  azheLogin: "assets/u31-flower-observation-azhe-login-cutout.webp",
  azheBrief: "assets/u31-flower-observation-azhe-brief-cutout.webp",
  azheScan: "assets/u31-flower-observation-azhe-scan-cutout.webp",
  azheResult: "assets/u31-flower-observation-azhe-result-cutout.webp",
  briefingSceneHook: "assets/u31-flower-observation-brief-background-zero-text.webp",
  briefingSceneMobileHook: "assets/u31-flower-observation-brief-background-zero-text-390w.webp",
  ambientBackgroundHook: "assets/u31-flower-observation-scan-background-zero-text.webp",
  flowerStructureImage: "assets/flower-observation-q04-flower-structure-base.webp",
  flowerStructureImage1440: "assets/flower-observation-q04-flower-structure-base-1440w.webp",
  flowerStructureImage960: "assets/flower-observation-q04-flower-structure-base-960w.webp",
  flowerStructureImage390: "assets/flower-observation-q04-flower-structure-base-390w.webp"
};

const readyBadgeIds = new Set([
  "flower_observation_entry",
  "flower_safety_guard",
  "sepal_petal_observer",
  "flower_parts_labeler",
  "flower_structure_function_mapper",
  "stamen_pistil_basic_reader",
  "pollination_fertilization_separator",
  "flower_process_sequence_tracker",
  "ovary_ovule_fruit_seed_mapper",
  "flower_evidence_recording_reader",
  "u29_u30_u31_u32_flower_boundary_guardian",
  "flower_unit_boundary_guardian",
  "flower_observation_misconception_reviser",
  "flower_observation_flawless",
  "flower_observation_reflection_reporter",
  "retry_growth_flower_observation"
]);
const badgeAsset = (id) => readyBadgeIds.has(id)
  ? `../shared-assets/badges/flower_observation/badge-flower_observation-${id}.webp`
  : "";
const reflectionRules = {
  "conceptTerms": [
    "花的觀察",
    "安全觀察",
    "萼片",
    "花瓣",
    "花藥",
    "花絲",
    "柱頭",
    "花柱",
    "子房",
    "胚珠",
    "雄蕊",
    "雌蕊",
    "花粉",
    "授粉",
    "受精",
    "果實",
    "種子",
    "觀察證據",
    "推論",
    "U32 邊界"
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
    "萼片",
    "花瓣",
    "雄蕊",
    "雌蕊",
    "授粉",
    "受精",
    "子房與胚珠",
    "果實與種子",
    "觀察紀錄",
    "U32 邊界"
  ]
};

const badges = [
  [
    "flower_observation_entry",
    "花觀察入門",
    "完成花部構造觀察任務。"
  ],
  [
    "flower_safety_guard",
    "花觀察安全守門",
    "能辨識取樣、工具與不品嘗原則。"
  ],
  [
    "sepal_petal_observer",
    "萼片花瓣觀察",
    "能分辨萼片位置、花瓣功能與種子來源。"
  ],
  [
    "flower_parts_labeler",
    "花部構造標記",
    "能標記花藥、花絲、柱頭與子房。"
  ],
  [
    "flower_structure_function_mapper",
    "花部功能配對",
    "能配對花藥、柱頭、子房與花瓣功能。"
  ],
  [
    "stamen_pistil_basic_reader",
    "雄蕊雌蕊基礎",
    "能區分雄蕊產粉與雌蕊接收花粉、含子房胚珠。"
  ],
  [
    "pollination_fertilization_separator",
    "授粉受精分辨",
    "能分開花粉到柱頭與精細胞和卵結合。"
  ],
  [
    "flower_process_sequence_tracker",
    "花到果實種子排序",
    "能排出花粉產生、授粉、受精與果實種子形成流程。"
  ],
  [
    "ovary_ovule_fruit_seed_mapper",
    "子房胚珠來源判讀",
    "能辨識子房可成果實、胚珠可成種子。"
  ],
  [
    "flower_evidence_recording_reader",
    "花形態證據紀錄",
    "能用花形態資料與觀察紀錄提出合理推論。"
  ],
  [
    "u29_u30_u31_u32_flower_boundary_guardian",
    "四站邊界守門",
    "能區分 U29 有性、U30 蛋觀察、U31 花觀察與 U32 遺傳。"
  ],
  [
    "flower_unit_boundary_guardian",
    "花的觀察核心守門",
    "能把花部觀察放回本單元核心。"
  ],
  [
    "flower_observation_misconception_reviser",
    "花的觀察迷思修正",
    "提示後修正本單元迷思。"
  ],
  [
    "flower_observation_flawless",
    "花部構造零提示全對",
    "全部答對且全程未使用提示。"
  ],
  [
    "flower_observation_reflection_reporter",
    "高品質花的觀察回報",
    "回報品質達 discussion_question。"
  ],
  [
    "retry_growth_flower_observation",
    "再探花部構造精熟進步",
    "再挑戰完整完成且正確率進步。"
  ]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: readyBadgeIds.has(id) ? "ready" : "pending" }));

const structureChoices = [
  {
    "id": "anther",
    "text": "花藥"
  },
  {
    "id": "filament",
    "text": "花絲"
  },
  {
    "id": "stigma",
    "text": "柱頭"
  },
  {
    "id": "ovary",
    "text": "子房"
  }
];
const functionChoices = [
  {
    "id": "produces_pollen",
    "text": "產生花粉"
  },
  {
    "id": "receives_pollen",
    "text": "接收花粉"
  },
  {
    "id": "contains_ovules_can_become_fruit",
    "text": "內含胚珠，受精後可發育成果實"
  },
  {
    "id": "may_attract_pollinators",
    "text": "常與吸引傳粉者有關"
  }
];
const boundaryChoices = [
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
  },
  {
    "id": "u32_genetics_chromosome_gene",
    "text": "第 32 站：遺傳、染色體與基因"
  }
];

const questions = [
  {
    "id": "flower_observation_q01",
    "section": "checkpoint1",
    "concept": "flower_observation_safety",
    "type": "choice",
    "answer": "safe_flower_observation",
    "prompt": "課堂要觀察花的構造，下列哪個做法較安全也較尊重生命？",
    "hint": "先想這是觀察任務，不是品嘗或破壞植物。",
    "misconception": "flower_observation_safety_confusion",
    "options": [
      {
        "id": "safe_flower_observation",
        "text": "經老師同意取樣，使用鑷子或解剖針時小心，不任意品嘗"
      },
      {
        "id": "rub_pollen_eye",
        "text": "看到花粉就直接用手抹眼睛觀察反應"
      },
      {
        "id": "pick_all_flowers",
        "text": "為了看清楚，把校園花朵全部摘下"
      },
      {
        "id": "taste_flower_parts",
        "text": "把花瓣和花粉放入口中確認味道"
      }
    ]
  },
  {
    "id": "flower_observation_q02",
    "section": "checkpoint1",
    "concept": "sepal",
    "type": "choice",
    "answer": "sepal_outer_protection",
    "prompt": "觀察花朵外側或下方，常看到像包住花苞、具有保護功能的構造。這較可能是哪個構造？",
    "hint": "看位置是花外側或下方，功能線索是保護花苞。",
    "misconception": "sepal_petal_confusion",
    "options": [
      {
        "id": "sepal_outer_protection",
        "text": "萼片"
      },
      {
        "id": "anther_pollen_part",
        "text": "花藥"
      },
      {
        "id": "ovule_inside_ovary",
        "text": "胚珠"
      },
      {
        "id": "egg_shell_part",
        "text": "蛋殼"
      }
    ]
  },
  {
    "id": "flower_observation_q03",
    "section": "checkpoint1",
    "concept": "petal",
    "type": "choice",
    "answer": "petal_attraction_not_seed",
    "prompt": "有同學說：「所有花瓣都一定很大、鮮豔，而且直接變成種子。」哪個修正較合理？",
    "hint": "先分開想：花瓣外觀可能吸引傳粉者，種子來源則看花內哪個構造。",
    "misconception": "petal_seed_confusion",
    "options": [
      {
        "id": "petal_attraction_not_seed",
        "text": "花瓣常和吸引傳粉者有關，但不一定都大而鮮豔；種子形成和胚珠有關"
      },
      {
        "id": "petal_produces_pollen",
        "text": "花瓣就是花粉產生的位置"
      },
      {
        "id": "petal_is_egg_air_cell",
        "text": "花瓣就是雞蛋的氣室"
      },
      {
        "id": "petal_controls_blood_sugar",
        "text": "花瓣只負責讓動物血糖上升"
      }
    ]
  },
  {
    "id": "flower_observation_q04",
    "section": "checkpoint2",
    "concept": "flower_structure_evidence",
    "type": "mapping",
    "answer": {
      "anther_target": "anther",
      "filament_target": "filament",
      "stigma_target": "stigma",
      "ovary_target": "ovary"
    },
    "prompt": "請依清楚的花構造圖，把「花藥、花絲、柱頭、子房」配到正確位置。",
    "hint": "先看外形與位置：雄蕊通常有花藥和花絲；雌蕊有頂端柱頭與基部子房。",
    "misconception": "stamen_pistil_label_confusion",
    "items": [
      { "id": "anther_target", "label": "目標 1" },
      { "id": "filament_target", "label": "目標 2" },
      { "id": "stigma_target", "label": "目標 3" },
      { "id": "ovary_target", "label": "目標 4" }
    ],
    "choices": structureChoices
  },
  {
    "id": "flower_observation_q05",
    "section": "checkpoint2",
    "concept": "flower_structure_evidence",
    "type": "mapping",
    "answer": {
      "anther": "produces_pollen",
      "stigma": "receives_pollen",
      "ovary": "contains_ovules_can_become_fruit",
      "petal": "may_attract_pollinators"
    },
    "prompt": "請把花部構造配到較合理的功能。",
    "hint": "先想每個構造在花上的位置：產生花粉、接收花粉、包住胚珠、吸引傳粉者。",
    "misconception": "flower_function_match_confusion",
    "items": [
      { "id": "anther", "label": "花藥" },
      { "id": "stigma", "label": "柱頭" },
      { "id": "ovary", "label": "子房" },
      { "id": "petal", "label": "花瓣" }
    ],
    "choices": functionChoices
  },
  {
    "id": "flower_observation_q06",
    "section": "checkpoint2",
    "concept": "stamen",
    "type": "choice",
    "answer": "stamen_anther_filament_pollen",
    "prompt": "下列哪一組最符合「雄蕊」的基本概念？",
    "hint": "找出和「花粉產生」最直接相關的構造組合。",
    "misconception": "stamen_pistil_confusion",
    "options": [
      { "id": "stamen_anther_filament_pollen", "text": "花藥與花絲，花藥可產生花粉" },
      { "id": "pistil_stigma_ovary", "text": "柱頭與子房，負責接收花粉並含有胚珠" },
      { "id": "egg_yolk_air_cell", "text": "蛋黃與氣室，提供養分與空氣空間" },
      { "id": "chromosome_gene_trait", "text": "染色體與基因，決定所有遺傳機率" }
    ]
  },
  {
    "id": "flower_observation_q07",
    "section": "checkpoint2",
    "concept": "pistil",
    "type": "choice",
    "answer": "pistil_stigma_style_ovary_ovule",
    "prompt": "下列哪一組最符合「雌蕊」的基本概念？",
    "hint": "找出和「接收花粉」與「子房、胚珠」最相關的構造組合。",
    "misconception": "stamen_pistil_confusion",
    "options": [
      { "id": "pistil_stigma_style_ovary_ovule", "text": "柱頭、花柱與子房，柱頭接收花粉，子房內有胚珠" },
      { "id": "stamen_anther_filament_pollen", "text": "花藥、花絲與花粉，是產生花粉的位置" },
      { "id": "egg_parts_cross_section", "text": "蛋殼、蛋白與氣室，是雞蛋剖面構造" },
      { "id": "dominant_recessive_grid", "text": "顯性、隱性與棋盤方格，是遺傳推論工具" }
    ]
  },
  {
    "id": "flower_observation_q08",
    "section": "checkpoint2",
    "concept": "pollination",
    "type": "choice",
    "answer": "pollination_not_fertilization",
    "prompt": "有同學說：「花粉碰到柱頭就已經完成受精。」哪個修正較合理？",
    "hint": "先分清「到達柱頭」和「細胞結合」是不是同一件事。",
    "misconception": "pollination_fertilization_confusion",
    "options": [
      { "id": "pollination_not_fertilization", "text": "花粉到達柱頭是授粉；受精是精細胞與卵結合" },
      { "id": "pollination_is_egg_air_cell", "text": "花粉到柱頭就是雞蛋氣室形成" },
      { "id": "petal_color_always_fertilized", "text": "只要花瓣鮮豔就一定完成受精" },
      { "id": "petal_becomes_seed", "text": "受精就是花瓣直接變成種子" }
    ]
  },
  {
    "id": "flower_observation_q09",
    "section": "checkpoint3",
    "concept": "pollination",
    "type": "sequence",
    "answer": [
      "anther_produces_pollen",
      "pollen_reaches_stigma",
      "sperm_cell_joins_egg_in_ovule",
      "ovary_and_ovule_develop_into_fruit_and_seed"
    ],
    "prompt": "請拖曳排序，排出花從花粉產生到受精後形成果實與種子的基本流程。",
    "hint": "先找花粉從哪裡來、先到哪裡，再想受精後哪些構造會形成果實與種子。",
    "misconception": "flower_process_sequence_confusion",
    "steps": [
      { "id": "anther_produces_pollen", "label": "花藥產生花粉" },
      { "id": "pollen_reaches_stigma", "label": "花粉到達柱頭" },
      { "id": "sperm_cell_joins_egg_in_ovule", "label": "精細胞與卵在胚珠內結合" },
      { "id": "ovary_and_ovule_develop_into_fruit_and_seed", "label": "受精後，子房可發育成果實，胚珠可發育成種子" }
    ]
  },
  {
    "id": "flower_observation_q10",
    "section": "checkpoint3",
    "concept": "flower_to_fruit_seed",
    "type": "choice",
    "answer": "ovary_fruit_ovule_seed",
    "prompt": "受精後，下列哪個配對最合理？",
    "hint": "想想哪個構造包住胚珠，哪個構造在子房裡。",
    "misconception": "ovary_ovule_fruit_seed_confusion",
    "options": [
      { "id": "ovary_fruit_ovule_seed", "text": "子房可發育成果實，胚珠可發育成種子" },
      { "id": "petal_seed_anther_fruit", "text": "花瓣可發育成種子，花藥可發育成果實" },
      { "id": "egg_yolk_pollen_aircell_fruit", "text": "蛋黃可發育成花粉，氣室可發育成果實" },
      { "id": "gene_fruit_chromosome_seed", "text": "基因可直接變成果實，染色體可直接變成種子" }
    ]
  },
  {
    "id": "flower_observation_q11",
    "section": "checkpoint3",
    "concept": "flower_form_pollination",
    "type": "choice",
    "answer": "flower_form_pollination_evidence",
    "prompt": "觀察資料：某花花瓣鮮豔且有氣味，常見昆蟲停留；另一種花花瓣不明顯、花粉量多且容易被風吹散。這份資料最適合支持哪個推測？",
    "hint": "看資料同時給了外觀、花粉量和可能移動方式。",
    "misconception": "all_flowers_same_pollination_confusion",
    "options": [
      { "id": "flower_form_pollination_evidence", "text": "花的形態可能和不同授粉方式有關" },
      { "id": "all_flowers_insect_pollinated", "text": "所有花都一定靠昆蟲授粉" },
      { "id": "small_petal_no_reproduction", "text": "花瓣不明顯就沒有生殖功能" },
      { "id": "pollen_amount_genetic_probability", "text": "看到花粉量多就能算出子代遺傳機率" }
    ]
  },
  {
    "id": "flower_observation_q12",
    "section": "checkpoint3",
    "concept": "observation_recording",
    "type": "choice",
    "answer": "flower_evidence_then_function_inference",
    "prompt": "學生紀錄：「我看到花中央有柱狀構造，頂端有黏性的部分，因此推測它可能和接收花粉有關。」這份紀錄較符合哪個原則？",
    "hint": "看紀錄是否先說看到什麼，再說推測功能。",
    "misconception": "flower_observation_inference_confusion",
    "options": [
      { "id": "flower_evidence_then_function_inference", "text": "先描述看到的位置與外觀，再提出功能推測" },
      { "id": "memorize_name_only", "text": "不需要觀察證據，只要背名稱" },
      { "id": "sticky_part_genotype", "text": "看到黏性部分就直接判定基因型" },
      { "id": "flower_center_egg_disc", "text": "把花中央構造記成雞蛋胚盤" }
    ]
  },
  {
    "id": "flower_observation_q13",
    "section": "checkpoint4",
    "concept": "unit_boundary_control",
    "type": "mapping",
    "answer": {
      "egg_shell_albumen_yolk_air_cell": "u30_egg_observation",
      "anther_stigma_ovary_ovule": "u31_flower_observation",
      "chromosome_gene_trait": "u32_genetics_chromosome_gene",
      "sperm_egg_zygote": "u29_sexual_reproduction"
    },
    "prompt": "請把下列內容分到最合適的單元位置。",
    "hint": "先判斷是在看花的構造，還是在看蛋、一般有性生殖或遺傳概念。",
    "misconception": "flower_unit_boundary_classification_confusion",
    "items": [
      {
        "id": "egg_shell_albumen_yolk_air_cell",
        "label": "蛋殼、蛋白、蛋黃與氣室觀察"
      },
      {
        "id": "anther_stigma_ovary_ovule",
        "label": "花藥、柱頭、子房與胚珠觀察"
      },
      {
        "id": "chromosome_gene_trait",
        "label": "染色體、基因與性狀"
      },
      {
        "id": "sperm_egg_zygote",
        "label": "精子與卵結合形成受精卵"
      }
    ],
    "choices": boundaryChoices
  },
  {
    "id": "flower_observation_q14",
    "section": "checkpoint4",
    "concept": "unit_boundary_control",
    "type": "choice",
    "answer": "flower_observation_belongs_u31",
    "prompt": "下列哪個情境最適合放在「花的觀察」本單元核心檢核？",
    "hint": "找出和花部構造、授粉受精基礎最直接相關的情境。",
    "misconception": "flower_unit_boundary_confusion",
    "options": [
      {
        "id": "flower_observation_belongs_u31",
        "text": "觀察花構造，辨識雄蕊、雌蕊、子房與胚珠，並判斷授粉和受精差異"
      },
      {
        "id": "egg_cross_section_observation",
        "text": "觀察雞蛋剖面中的氣室與蛋黃"
      },
      {
        "id": "punnett_square_trait_ratio",
        "text": "用棋盤方格推測子代性狀比例"
      },
      {
        "id": "human_embryo_medical_technology",
        "text": "討論人體胚胎醫療技術"
      }
    ]
  }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  "checkpoint1": [
    "flower_observation_q01",
    "flower_observation_q02",
    "flower_observation_q03"
  ],
  "checkpoint2": [
    "flower_observation_q04",
    "flower_observation_q05",
    "flower_observation_q06",
    "flower_observation_q07",
    "flower_observation_q08"
  ],
  "checkpoint3": [
    "flower_observation_q09",
    "flower_observation_q10",
    "flower_observation_q11",
    "flower_observation_q12"
  ],
  "checkpoint4": [
    "flower_observation_q13",
    "flower_observation_q14"
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
  return `<picture class="u31-scene-media">
    ${src390 ? `<source srcset="${cacheAsset(src390)}" media="(max-width: 520px)">` : ""}
    ${src960 ? `<source srcset="${cacheAsset(src960)}" media="(max-width: 900px)">` : ""}
    ${src1440 ? `<source srcset="${cacheAsset(src1440)}" media="(max-width: 1360px)">` : ""}
    <img src="${cacheAsset(main)}" alt="${escapeHtml(alt)}" onerror="this.closest('.u31-page-scene')?.classList.add('asset-missing'); this.remove();">
  </picture>`;
}

function renderPageScene(prefix, { className = "", studentAvatar = false, owl = false, alt = "" } = {}) {
  const azhe = assets[`azhe${prefix[0].toUpperCase()}${prefix.slice(1)}`];
  const owlSrc = prefix === "scan" ? assets.owlPrep : assets.owlResult;
  return `<figure class="u31-page-scene u31-${prefix}-scene ${className}" data-u31-scene="${prefix}"${studentAvatar ? ' data-bq-brief-dual-role="true"' : ""}>
    ${renderScenePicture(prefix, alt || "花的觀察任務場景")}
    <img class="u31-scene-azhe" src="${cacheAsset(azhe)}" alt="阿澤老師" onerror="this.closest('.u31-page-scene')?.classList.add('asset-missing'); this.remove();">
    ${studentAvatar ? `<img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">` : ""}
    ${owl ? `<img class="u31-scene-owl" src="${cacheAsset(owlSrc)}" alt="貓頭鷹助理" onerror="this.closest('.u31-page-scene')?.classList.add('asset-missing'); this.remove();">` : ""}
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

function sameOrder(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((id, index) => id === right[index]);
}

function avoidCanonicalSequenceCollision(question, order) {
  if (question.id !== "flower_observation_q09" || question.type !== "sequence" || !sameOrder(order, question.answer)) return order;
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
  const attemptId = uid("flower_observation_guest_attempt");
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
  const correctedCore = logs.some((log) => log.is_correct && log.hint_used);
  const earned = [];
  earned.push("flower_observation_entry");
  if (passed(["flower_observation_q01"])) earned.push("flower_safety_guard");
  if (passed(["flower_observation_q02", "flower_observation_q03"])) earned.push("sepal_petal_observer");
  if (passed(["flower_observation_q04"])) earned.push("flower_parts_labeler");
  if (passed(["flower_observation_q05"])) earned.push("flower_structure_function_mapper");
  if (passed(["flower_observation_q06", "flower_observation_q07"])) earned.push("stamen_pistil_basic_reader");
  if (passed(["flower_observation_q08"])) earned.push("pollination_fertilization_separator");
  if (passed(["flower_observation_q09"])) earned.push("flower_process_sequence_tracker");
  if (passed(["flower_observation_q10"])) earned.push("ovary_ovule_fruit_seed_mapper");
  if (passed(["flower_observation_q11", "flower_observation_q12"])) earned.push("flower_evidence_recording_reader");
  if (passed(["flower_observation_q13"])) earned.push("u29_u30_u31_u32_flower_boundary_guardian");
  if (passed(["flower_observation_q14"])) earned.push("flower_unit_boundary_guardian");
  if (correctedCore) earned.push("flower_observation_misconception_reviser");
  if (flawless) earned.push("flower_observation_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("flower_observation_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_flower_observation");
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
  if (["flower_observation_q01"].includes(questionId)) return "flower_safety_observation";
  if (["flower_observation_q02", "flower_observation_q03"].includes(questionId)) return "flower_external_parts";
  if (["flower_observation_q04", "flower_observation_q06", "flower_observation_q07"].includes(questionId)) return "flower_stamen_pistil_parts";
  if (["flower_observation_q05"].includes(questionId)) return "flower_structure_function";
  if (["flower_observation_q08", "flower_observation_q09", "flower_observation_q10"].includes(questionId)) return "pollination_fertilization_process";
  if (["flower_observation_q11", "flower_observation_q12"].includes(questionId)) return "flower_evidence_data";
  if (["flower_observation_q13", "flower_observation_q14"].includes(questionId)) return "unit_boundary_control";
  return "reflection_quality";
}

function checkpointIdForQuestion(questionId) {
  const section = questionMap[questionId]?.section;
  return {
    checkpoint1: "flower_observation_cp1_safety_and_external",
    checkpoint2: "flower_observation_cp2_reproductive_structures",
    checkpoint3: "flower_observation_cp3_process_and_evidence",
    checkpoint4: "flower_observation_cp4_boundary"
  }[section] || "flower_observation_cp5_reflection";
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
    saveVerifiedSnapshot(state.student);
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
  resetScreenScroll();
}

function renderLogin() {
  return `
    <div class="wide-layout login-layout">
      <section class="panel hero-panel">
        ${renderPageScene("login", { className: "login-scene-panel", alt: "花的觀察登入場景，呈現花部觀察任務的環境" })}
        <p class="eyebrow">生命祕境 BioQuest</p>
        <h2 class="hero-title">花的觀察</h2>
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
  return `<div class="wide-layout"><section class="panel hero-panel brief-hero">${renderPageScene("brief", { className: "brief-scene flower-observation-brief-scene bq-brief-scene-stage", studentAvatar: true, alt: "花的觀察簡報場景，呈現阿澤老師與花部觀察任務環境" })}<div class="scene-copy bq-brief-scene-caption"><p class="eyebrow">${mission.mission_area}</p><h2>${mission.mission_title}</h2><p class="identity-confirm">你好，${escapeHtml(studentName)}｜${escapeHtml(studentIdentityLine())}</p><p>本任務會從花的外觀與構造位置出發，整理萼片、花瓣、雄蕊、雌蕊、授粉、受精，以及果實和種子的形成線索。</p><p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p></div><div class="button-row"><button class="primary" data-next="scan">查看進關卡提醒</button><button class="secondary" data-next="rules">先看規則</button></div></section></div>`;
}


function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入花部觀察資料庫前，先抓住四個花的觀察線索</h2><div class="prep-owl-hero">${renderPageScene("scan", { owl: true, alt: "花的觀察準備場景，呈現觀察任務環境與貓頭鷹助理" })}<div><h3>先分清楚哪些是你真的看到的花部位置，哪些是根據證據做出的功能推測。</h3><p>本任務會用安全觀察、花部標記、功能配對、授粉受精流程、觀察紀錄與 U29-U32 邊界，幫你整理花的觀察。</p></div></div><div class="concept-grid"><article><strong>安全觀察</strong><p>取樣需經老師同意，工具使用保持安全，不任意品嘗或破壞植物。</p></article><article><strong>花部構造</strong><p>先看萼片、花瓣、雄蕊與雌蕊的位置，再整理花藥、花絲、柱頭、子房等線索。</p></article><article><strong>證據與推論</strong><p>先描述看到的位置、形態與資料，再推測構造名稱或功能。</p></article><article><strong>守住邊界</strong><p>U29 看有性生殖流程；U30 看蛋構造；U31 看花部觀察；U32 才進入遺傳概念。</p></article></div><button class="primary" data-next="checkpoint1">開始花的觀察任務</button></section></div>`;
}


function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["安全、花外部線索與基礎構造", "先確認安全觀察，再分辨萼片、花瓣與種子來源的基礎概念。"],
    checkpoint2: ["花部標記與功能配對", "用核准花構造圖與文字線索，整理雄蕊、雌蕊、花藥、柱頭、子房等位置與功能。"],
    checkpoint3: ["授粉受精流程與觀察資料", "用流程、資料與觀察紀錄，判讀授粉、受精、果實種子形成與證據推論。"],
    checkpoint4: ["相鄰單元邊界", "把花的觀察和 U29 有性生殖、U30 蛋觀察、U32 遺傳概念分清楚。"]
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

function conceptLabel(concept) { return {flower_observation_safety:"安全觀察",sepal:"萼片",petal:"花瓣",flower_structure_evidence:"花部構造證據",stamen:"雄蕊",pistil:"雌蕊",pollination:"授粉與受精",flower_to_fruit_seed:"果實與種子",flower_form_pollination:"花形態資料",observation_recording:"觀察紀錄",unit_boundary_control:"單元邊界"}[concept] || concept; }


function renderQuestionEvidence(qid) {
  if (qid === "flower_observation_q04") return `
    <figure class="question-asset flower-structure-figure">
      <picture>
        <source srcset="${assets.flowerStructureImage390}?v=${VERSION}" media="(max-width: 520px)">
        <source srcset="${assets.flowerStructureImage960}?v=${VERSION}" media="(max-width: 860px)">
        <source srcset="${assets.flowerStructureImage1440}?v=${VERSION}" media="(max-width: 1280px)">
        <img src="${assets.flowerStructureImage}?v=${VERSION}" alt="未標註的花部構造觀察圖，呈現花中央與周圍可觀察構造的位置關係" onerror="this.closest('.question-asset')?.classList.add('asset-fallback'); this.remove();">
      </picture>
      <div class="flower-hotspot-layer" aria-hidden="true">
        <span class="flower-hotspot anther-target">目標 1</span>
        <span class="flower-hotspot filament-target">目標 2</span>
        <span class="flower-hotspot stigma-target">目標 3</span>
        <span class="flower-hotspot ovary-target">目標 4</span>
      </div>
      <figcaption>
        <strong>花部位置標記</strong>
        <span>請依圖中目標位置，從下方選單配對花部名稱。</span>
      </figcaption>
      <div class="target-list" aria-label="等效目標清單">
        <span>目標 1</span>
        <span>目標 2</span>
        <span>目標 3</span>
        <span>目標 4</span>
      </div>
    </figure>`;
  if (qid === "flower_observation_q11") return `<div class="evidence-card evidence-table-card"><strong>觀察資料</strong><div class="data-table" role="table" aria-label="兩種花的可觀察資料"><div role="row"><span role="columnheader">資料組</span><span role="columnheader">可觀察線索</span></div><div role="row"><span role="cell">甲花</span><span role="cell">花瓣鮮豔、有氣味，常見昆蟲停留。</span></div><div role="row"><span role="cell">乙花</span><span role="cell">花瓣不明顯，花粉量多，容易被風吹散。</span></div></div></div>`;
  if (qid === "flower_observation_q12") return `<div class="evidence-card evidence-table-card"><strong>觀察與推論紀錄</strong><div class="data-table two-column" role="table" aria-label="觀察與推論紀錄"><div role="row"><span role="columnheader">觀察</span><span role="columnheader">推論</span></div><div role="row"><span role="cell">花中央有柱狀構造，頂端有黏性部分。</span><span role="cell">可能和接收花粉有關。</span></div></div></div>`;
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
  return `<div class="mission-layout review-layout" data-feedback-state="${stateName}"><section class="panel"><p class="eyebrow">概念回饋</p><h2>先整理你目前的花的觀察判讀線索</h2><p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的花的觀察概念。</p><div class="feedback-columns"><article><h3>目前較穩定</h3><ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article><article><h3>建議再確認</h3><ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article></div><button class="primary" data-next="reflection">前往任務回報</button></section></div>`;
}


function misconceptionText(tag) { return {
  flower_observation_safety_confusion:"建議再確認安全觀察：取樣需經老師同意，工具小心使用，也不任意品嘗花部。",
  sepal_petal_confusion:"建議再分辨萼片與花瓣：萼片常在外側或下方保護花苞，花瓣常和吸引傳粉者有關。",
  petal_seed_confusion:"建議再確認種子來源：花瓣不直接變成種子，種子形成和胚珠有關。",
  stamen_pistil_label_confusion:"建議再用花構造位置辨識雄蕊與雌蕊各部分。",
  flower_function_match_confusion:"建議再整理花部功能：花藥產生花粉、柱頭接收花粉、子房內有胚珠。",
  stamen_pistil_confusion:"建議再區分雄蕊與雌蕊：雄蕊含花藥與花絲，雌蕊含柱頭、花柱與子房。",
  pollination_fertilization_confusion:"建議再分開授粉與受精：花粉到柱頭是授粉，精細胞與卵結合才是受精。",
  flower_process_sequence_confusion:"建議再整理花到果實種子的流程順序。",
  ovary_ovule_fruit_seed_confusion:"建議再確認子房與胚珠的後續：子房可發育成果實，胚珠可發育成種子。",
  all_flowers_same_pollination_confusion:"建議再讀資料證據：不同花形態可能對應不同授粉線索，不宜一概而論。",
  flower_observation_inference_confusion:"建議再練習觀察紀錄：先寫看到的位置與外觀，再提出功能推論。",
  flower_unit_boundary_classification_confusion:"建議再確認 U29-U32 邊界：U31 聚焦花部構造觀察與基礎授粉受精線索。",
  flower_unit_boundary_confusion:"建議再確認本單元核心：花部構造、授粉受精基礎、果實種子形成與觀察紀錄。"
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
  return `<div class="stack reflection-layout"><section class="panel"><p class="eyebrow">任務回報</p><h2>把想帶到課堂的問題留下來</h2><p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p><p class="muted">可以從萼片、花瓣、雄蕊、雌蕊、花藥、柱頭、子房、胚珠、授粉、受精、果實種子、觀察紀錄或 U31 邊界中選一個方向。</p><label>我最能掌握的一項概念<input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：柱頭接收花粉，子房內有胚珠"></label><label>我想上課請老師說明的部分<textarea id="studentQuestion" rows="5" placeholder="例如：我想確認授粉和受精的差別，觀察花時該看哪些線索？">${escapeHtml(state.reflection.question)}</textarea></label><label>信心程度<select id="confidenceLevel">${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}</select></label><div class="button-row"><button class="primary" id="submitMission">提交任務</button><button class="secondary" data-next="review">回到回饋整理</button></div></section></div>`;
}


function renderResult() {
  const result = state.result || scoreAttempt();
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        ${renderPageScene("result", { owl: true, alt: "花的觀察結算場景，呈現任務完成後的回顧環境與貓頭鷹助理" })}
        <p class="eyebrow">任務結算</p>
        <h2>花部構造觀察任務結算</h2>
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
  return `<div class="stack"><section class="panel"><p class="eyebrow">成就規則</p><h2>本單元 EXP 與再挑戰規則</h2><ul class="rule-list"><li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li><li>提示後修正仍可取得 EXP，但低於直接答對。</li><li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li><li>回報空白可提交但 0 EXP；具體且與花部構造、授粉、受精、果實種子、觀察紀錄或單元邊界相關的問題才會取得回報 EXP。</li><li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li></ul><div class="button-row"><button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}</div></section></div>`;
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
  window.__flower_observationTest = {
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
    avoidCanonicalSequenceCollision,
    answerValue,
    isCorrect,
    scoreAttempt,
    buildBackendPayload,
    evaluateReflection,
    titleAvatarPath,
    studentIdentityLine,
    resetScreenScroll,
    renderBrief,
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
