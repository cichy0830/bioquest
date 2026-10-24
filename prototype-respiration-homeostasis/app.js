const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20261025-respiration-homeostasis-reflection-spec-v1";
const QUESTION_VERSION = "20260718-respiration-homeostasis-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_respiration_homeostasis_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const verifiedSnapshotKey = "bioquest_respiration_homeostasis_verified_snapshot_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const RESULT_STATUS_COPY = {
  guest: {
    summaryLabel: "guest 測試預估",
    creditLabel: "正式累積狀態",
    creditValue: "不列入正式累積",
    noticeClass: "warn",
    lead: "guest 測試：本次預估 {exp}/500 EXP，不列入正式累積。",
    detail: "這次結果只供老師或學生試看流程，不會寫入 Google Sheet，也不更新正式徽章或稱號進度。"
  },
  pending: {
    summaryLabel: "本次預估",
    creditLabel: "後台確認狀態",
    creditValue: "待後台確認",
    noticeClass: "warn",
    lead: "本次預估 {exp}/500 EXP，待後台確認。",
    detail: "確認完成前，這些數字只代表本次作答預覽；不作為已確認結果或累積進度。"
  },
  verified: {
    summaryLabel: "本次取得",
    creditLabel: "本單元正式認列",
    creditValue: "{credit} EXP",
    noticeClass: "good",
    lead: "後台已回傳正式認列資料。",
    detail: "本次取得是這次挑戰的原始表現；本單元正式認列會保留最高表現並受 500 EXP 上限限制。"
  }
};

const mission = {
  unit_id: "respiration_homeostasis",
  unit_title: "呼吸與氣體的恆定",
  mission_title: "氣體平衡監測任務",
  mission_area: "恆定調節站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlReport: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: `assets/respiration-homeostasis-briefing-azhe-wide.webp?v=${VERSION}`,
  briefingSceneMobileHook: "",
  ambientBackgroundHook: ""
};

const badgeAsset = () => "";
const reflectionRules = {
  conceptTerms: ["呼吸", "呼吸運動", "細胞呼吸", "氧氣", "二氧化碳", "鼻腔", "口腔", "氣管", "支氣管", "肺", "肺泡", "微血管", "氣體交換", "吸氣", "呼氣", "橫膈", "胸腔", "肋骨", "運動", "鰓", "氣孔", "資料判讀"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["呼吸運動與細胞呼吸作用", "空氣進入肺泡路徑", "肺泡氣體交換", "吸氣呼氣胸腔變化", "運動時氣體需求", "不同生物氣體交換構造"]
};
// 規格 active contract：reflection_report_question_id = respiration_homeostasis_q15（不列入直接計分題）。
const REPORT_QUESTION_ID = "respiration_homeostasis_q15";
// 規格 q15 任務回報的六個方向詞，與前後台 copiedDirections 相同（只複製方向詞判為複製、不給回報 EXP）。
const REPORT_DIRECTIONS = [...reflectionRules.copiedDirections];

const badges = [
  ["respiration_homeostasis_entry", "氣體平衡入門", "完成氣體平衡監測任務。"],
  ["respiration_terms_boundary_keeper", "呼吸名詞邊界", "能區分呼吸運動與細胞利用氧氣。"],
  ["air_path_sequence_tracker", "空氣路徑排序", "能排出空氣進入肺泡的大方向路徑。"],
  ["respiratory_structure_mapper", "呼吸構造功能配對", "能配對鼻腔、氣管、支氣管與肺泡功能。"],
  ["alveoli_exchange_structure_reader", "肺泡交換構造判讀", "能判斷肺泡適合氣體交換的構造特徵。"],
  ["gas_direction_interpreter", "氣體方向判讀", "能判斷氧氣與二氧化碳交換方向。"],
  ["inhalation_mechanics_reader", "吸氣機制觀察", "能用橫膈與胸腔變化判斷吸氣。"],
  ["exhalation_mechanics_reader", "呼氣機制觀察", "能用橫膈與胸腔變化判斷呼氣。"],
  ["inhale_exhale_classifier", "吸吐氣特徵分類", "能完整分類吸氣與呼氣線索。"],
  ["gas_balance_activity_monitor", "活動氣體需求監測", "能連結活動量、氧氣需求與二氧化碳排出。"],
  ["gas_exchange_diversity_mapper", "多樣氣體交換構造", "能配對不同生物的氣體交換構造。"],
  ["plant_respiration_boundary_reader", "植物也需氣體交換", "能修正植物不需要呼吸作用的迷思。"],
  ["respiration_unit_boundary_guardian", "呼吸單元邊界守門", "能分辨呼吸氣體交換與相鄰單元。"],
  ["respiration_homeostasis_misconception_reviser", "呼吸迷思修正", "提示後修正本單元迷思。"],
  ["respiration_homeostasis_flawless", "氣體平衡零提示全對", "全部答對且全程未使用提示。"],
  ["respiration_homeostasis_reflection_reporter", "高品質呼吸回報", "回報品質達 discussion_question。"],
  ["retry_growth_respiration_homeostasis", "再探氣體平衡進步", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const respiratoryFunctionChoices = [
  { id: "filter_warm_moisten", text: "協助過濾、溫暖或濕潤空氣" },
  { id: "air_passage_to_lungs", text: "讓空氣通往肺部" },
  { id: "branches_to_lungs", text: "把空氣分送到左右肺" },
  { id: "gas_exchange_site", text: "氣體交換的重要位置" }
];
const inhaleExhaleChoices = [
  { id: "inhale", text: "吸氣" },
  { id: "exhale", text: "呼氣" }
];
const gasExchangeChoices = [
  { id: "lungs_alveoli", text: "肺與肺泡" },
  { id: "gills", text: "鰓" },
  { id: "tracheal_system", text: "氣管系統" },
  { id: "stomata", text: "氣孔" }
];

const questions = [
  {id:"respiration_homeostasis_q01",section:"checkpoint1",concept:"breathing_vs_cellular_respiration",type:"choice",answer:"breathing_and_cellular_respiration_distinct",prompt:"有同學說：「呼吸就是空氣進出肺，所以身體取得能量只發生在肺。」哪個修正較合理？",hint:"先分清楚「空氣進出肺」和「細胞利用氧氣」是不是同一件事。",misconception:"breathing_cellular_respiration_confusion",options:[{id:"breathing_and_cellular_respiration_distinct",text:"空氣進出肺是呼吸運動，身體各處細胞也會利用氧氣和養分釋放能量"},{id:"behavior_only",text:"呼吸只和植物向光有關"},{id:"kidney_urine",text:"呼吸只是在腎臟形成尿液"},{id:"oxygen_stays_alveoli",text:"氧氣只會停在肺泡，不會被血液運送"}]},
  {id:"respiration_homeostasis_q02",section:"checkpoint1",concept:"breathing_vs_cellular_respiration",type:"choice",answer:"cells_use_oxygen_for_energy",prompt:"跑步時肌肉需要更多能量。氧氣最後主要在哪裡被利用來幫助釋放能量？",hint:"想想氧氣被血液送到身體各處後，哪裡真正需要能量。",misconception:"oxygen_used_only_in_lungs",options:[{id:"cells_use_oxygen_for_energy",text:"身體各處需要能量的細胞"},{id:"nasal_surface_only",text:"只有鼻腔表面"},{id:"trachea_cartilage_only",text:"只有氣管軟骨"},{id:"urine_only",text:"只在尿液中"}]},
  {id:"respiration_homeostasis_q03",section:"checkpoint1",concept:"respiratory_air_path",type:"sequence",answer:["nose_or_mouth","trachea","bronchi","lungs","alveoli"],prompt:"請拖曳排序，排出空氣從外界進入肺泡的大方向路徑。",hint:"先找外界空氣入口，再看管道如何分支進入肺部較小構造。",misconception:"respiratory_path_order_confusion",steps:[{id:"nose_or_mouth",label:"鼻腔或口腔"},{id:"trachea",label:"氣管"},{id:"bronchi",label:"支氣管"},{id:"lungs",label:"肺"},{id:"alveoli",label:"肺泡"}]},
  {id:"respiration_homeostasis_q04",section:"checkpoint1",concept:"respiratory_air_path",type:"mapping",answer:{nasal_cavity:"filter_warm_moisten",trachea:"air_passage_to_lungs",bronchi:"branches_to_lungs",alveoli:"gas_exchange_site"},prompt:"請將呼吸構造與較合適的功能方向配對。",hint:"先看構造是在入口、通道、分支，還是最末端交換位置。",misconception:"respiratory_structure_function_confusion",items:[{id:"nasal_cavity",label:"鼻腔"},{id:"trachea",label:"氣管"},{id:"bronchi",label:"支氣管"},{id:"alveoli",label:"肺泡"}],choices:respiratoryFunctionChoices},
  {id:"respiration_homeostasis_q05",section:"checkpoint2",concept:"alveolus_exchange_structure",type:"choice",answer:"alveoli_thin_many_capillaries",prompt:"下列哪一組特徵最能說明肺泡適合氣體交換？",hint:"找出最有利氣體快速進出血液的構造條件。",misconception:"alveoli_storage_only",options:[{id:"alveoli_thin_many_capillaries",text:"數量多、壁薄、周圍有微血管"},{id:"thick_no_vessels",text:"厚硬、沒有血管、只負責支撐"},{id:"stores_food",text:"只用來儲存食物"},{id:"makes_urine",text:"只負責製造尿液"}]},
  {id:"respiration_homeostasis_q06",section:"checkpoint2",concept:"alveolus_gas_direction",type:"choice",answer:"alveoli_o2_in_co2_out",prompt:"在肺泡和微血管之間，下列哪個氣體移動方向較合理？",hint:"想想吸進來的空氣要提供哪種氣體給血液，而身體產生的哪種氣體要被呼出。",misconception:"gas_exchange_direction_reversed",options:[{id:"alveoli_o2_in_co2_out",text:"氧氣由肺泡進入血液，二氧化碳由血液進入肺泡"},{id:"reversed_gases",text:"氧氣由血液進入肺泡，二氧化碳由肺泡進入血液"},{id:"stay_in_alveoli",text:"兩種氣體都只留在肺泡"},{id:"go_to_kidney",text:"兩種氣體都只進入腎臟"}]},
  {id:"respiration_homeostasis_q07",section:"checkpoint2",concept:"inhalation_mechanics",type:"choice",answer:"inhalation_diaphragm_down_chest_expands",prompt:"吸氣時，哪一組描述較合理？",hint:"先判斷吸氣時空氣要進入，胸腔空間應變大或變小。",misconception:"inhalation_diaphragm_direction_confusion",options:[{id:"inhalation_diaphragm_down_chest_expands",text:"橫膈下降、肋骨上舉，胸腔變大，空氣進入"},{id:"diaphragm_up_air_in",text:"橫膈上升、胸腔變小，空氣進入"},{id:"alveoli_stop",text:"肺泡停止交換氣體"},{id:"kidney_push_air",text:"腎臟把空氣推進肺"}]},
  {id:"respiration_homeostasis_q08",section:"checkpoint2",concept:"exhalation_mechanics",type:"choice",answer:"exhalation_diaphragm_up_chest_smaller",prompt:"呼氣時，哪一組描述較合理？",hint:"先判斷呼氣時空氣要離開，胸腔空間應變大或變小。",misconception:"exhalation_mechanics_confusion",options:[{id:"exhalation_diaphragm_up_chest_smaller",text:"橫膈上升、肋骨下降，胸腔變小，空氣排出"},{id:"diaphragm_down_air_out",text:"橫膈下降、胸腔變大，空氣排出"},{id:"alveoli_to_urine",text:"肺泡把血液變成尿液"},{id:"mimosa_exhale",text:"含羞草閉合造成呼氣"}]},
  {id:"respiration_homeostasis_q09",section:"checkpoint3",concept:"inhalation_mechanics",type:"mapping",answer:{diaphragm_down:"inhale",chest_expands:"inhale",air_enters_lungs:"inhale",diaphragm_up:"exhale",chest_smaller:"exhale",air_leaves_lungs:"exhale"},prompt:"請將情境線索分到「吸氣」或「呼氣」。",hint:"先用空氣方向判斷，再對照胸腔變大或變小。",misconception:"inhale_exhale_feature_confusion",items:[{id:"diaphragm_down",label:"橫膈下降"},{id:"chest_expands",label:"胸腔變大"},{id:"air_enters_lungs",label:"空氣進入肺"},{id:"diaphragm_up",label:"橫膈上升"},{id:"chest_smaller",label:"胸腔變小"},{id:"air_leaves_lungs",label:"空氣排出肺"}],choices:inhaleExhaleChoices},
  {id:"respiration_homeostasis_q10",section:"checkpoint3",concept:"alveolus_gas_direction",type:"choice",answer:"exhaled_air_less_o2_more_co2",prompt:"一組資料顯示：呼出的空氣比吸入的空氣氧氣較少、二氧化碳較多。哪個解讀較合理？",hint:"比較吸入和呼出空氣的氣體差異，再想這些氣體和細胞活動有什麼關係。",misconception:"exhaled_air_data_misread",options:[{id:"exhaled_air_less_o2_more_co2",text:"身體細胞利用氧氣並產生二氧化碳，血液把二氧化碳帶回肺排出"},{id:"oxygen_disappears",text:"氧氣在肺泡中完全消失"},{id:"kidney_makes_co2_air",text:"二氧化碳主要由腎臟變成空氣"},{id:"plant_sleep_only",text:"資料只能證明植物正在睡眠運動"}]},
  {id:"respiration_homeostasis_q11",section:"checkpoint3",concept:"gas_balance_activity",type:"choice",answer:"exercise_breathing_gas_balance",prompt:"跑步後呼吸通常會變快或變深。哪個說明較符合本單元概念？",hint:"想想運動時細胞需要什麼，也會產生什麼需要排出。",misconception:"lung_makes_energy_confusion",options:[{id:"exercise_breathing_gas_balance",text:"細胞活動增加時需要更多氧氣，也會產生較多二氧化碳，呼吸變化有助氣體調節"},{id:"lungs_make_muscle",text:"肺直接把空氣變成肌肉"},{id:"plant_tropism",text:"呼吸變快是植物向性"},{id:"kidney_oxygen",text:"腎臟直接把氧氣送進肺泡"}]},
  {id:"respiration_homeostasis_q12",section:"checkpoint3",concept:"gas_exchange_diversity",type:"mapping",answer:{human:"lungs_alveoli",fish:"gills",insect:"tracheal_system",plant_leaf:"stomata"},prompt:"請將生物與較合適的氣體交換構造配對。",hint:"先依生物生活環境與構造名稱判斷，不要把所有例子都套成人類呼吸系統。",misconception:"all_organisms_use_lungs",items:[{id:"human",label:"人類"},{id:"fish",label:"魚類"},{id:"insect",label:"昆蟲"},{id:"plant_leaf",label:"植物葉片"}],choices:gasExchangeChoices},
  {id:"respiration_homeostasis_q13",section:"checkpoint3",concept:"gas_exchange_diversity",type:"choice",answer:"plants_also_respire_exchange_gases",prompt:"有同學說：「植物會行光合作用，所以植物細胞完全不需要呼吸作用。」哪個修正較合理？",hint:"分辨「製造養分」和「利用養分取得能量」是不是同一件事。",misconception:"plants_do_not_respire",options:[{id:"plants_also_respire_exchange_gases",text:"植物細胞也需要利用養分釋放能量，植物葉片也可透過氣孔和外界交換氣體"},{id:"plants_use_lungs",text:"植物只能用肺泡呼吸"},{id:"plants_kidney_urine",text:"植物只在腎臟形成尿液"},{id:"mimosa_alveoli",text:"植物碰觸閉合就是肺泡交換"}]},
  {id:"respiration_homeostasis_q14",section:"checkpoint3",concept:"unit_boundary_control",type:"choice",answer:"alveoli_exchange_belongs_respiration",prompt:"下列哪一個情境最適合放在「呼吸與氣體的恆定」本單元核心檢核？",hint:"找出與空氣進出、肺泡或氣體交換最直接相關的情境。",misconception:"respiration_unit_boundary_confusion",options:[{id:"alveoli_exchange_belongs_respiration",text:"肺泡和微血管之間交換氧氣與二氧化碳"},{id:"mimosa_touch",text:"含羞草受到碰觸後葉片閉合"},{id:"kidney_water",text:"腎臟形成尿液並調節水分"},{id:"bird_feeding",text:"鳥類築巢餵食幼鳥"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["respiration_homeostasis_q01", "respiration_homeostasis_q02", "respiration_homeostasis_q03", "respiration_homeostasis_q04"],
  checkpoint2: ["respiration_homeostasis_q05", "respiration_homeostasis_q06", "respiration_homeostasis_q07", "respiration_homeostasis_q08"],
  checkpoint3: ["respiration_homeostasis_q09", "respiration_homeostasis_q10", "respiration_homeostasis_q11", "respiration_homeostasis_q12", "respiration_homeostasis_q13", "respiration_homeostasis_q14"]
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
    reflection: { confident: "", uncertain: "", direction: "", question: "", confidence: "3" },
    result: null,
    notice: ""
  };
}

let state = loadState();

function loadState() {
  if (typeof localStorage === "undefined") return createEmptyState();
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "null");
    return parsed && parsed.question_version === QUESTION_VERSION ? { ...createEmptyState(), ...parsed, question_version: QUESTION_VERSION } : createEmptyState();
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

function guardedOptionOrder(order, question, ids) {
  const allowed = new Set(ids);
  const normalized = Array.isArray(order) ? order.filter((id) => allowed.has(id)) : [];
  ids.forEach((id) => { if (!normalized.includes(id)) normalized.push(id); });
  if (question.type === "sequence" && Array.isArray(question.answer) && normalized.length > 1 && normalized.every((id, index) => id === question.answer[index])) {
    [normalized[0], normalized[1]] = [normalized[1], normalized[0]];
  }
  return normalized;
}

function orderedOptions(question) {
  const ids = (question.type === "sequence" ? question.steps : question.options || []).map((item) => item.id);
  if (!state.optionOrders[question.id]) {
    state.optionOrders[question.id] = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}`);
  }
  state.optionOrders[question.id] = guardedOptionOrder(state.optionOrders[question.id], question, ids);
  const source = Object.fromEntries((question.type === "sequence" ? question.steps : question.options || []).map((item) => [item.id, item]));
  return state.optionOrders[question.id].map((id) => source[id]).filter(Boolean);
}

function mappingItemsLookGrouped(question, ids) {
  const choiceIndex = Object.fromEntries((question.choices || []).map((choice, index) => [choice.id, index]));
  const groups = ids.map((id) => question.answer?.[id]);
  const indexes = groups.map((group) => choiceIndex[group] ?? 0);
  // 與選項順序一一對齊（例如 q04 第 1 項配第 1 個功能…）或答案群組只在一處切換（例如 q09 吸氣×3、呼氣×3），都會讓排列透露答案
  if (indexes.every((value, index) => index === 0 || value >= indexes[index - 1])) return true;
  let changes = 0;
  for (let index = 1; index < groups.length; index += 1) if (groups[index] !== groups[index - 1]) changes += 1;
  return new Set(groups).size < groups.length && changes <= new Set(groups).size - 1;
}

function orderedMappingItems(question) {
  const key = `${question.id}_items`;
  const ids = (question.items || []).map((item) => item.id);
  if (!state.optionOrders[key] || state.optionOrders[key].length !== ids.length) {
    let order = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}-items`);
    for (let tries = 1; tries < 24 && mappingItemsLookGrouped(question, order); tries += 1) {
      order = stableShuffle(ids, `${state.attempt_id || VERSION}-${question.id}-items-${tries}`);
    }
    if (mappingItemsLookGrouped(question, order)) {
      // 備援：依選項倒序輪流從各答案群組取項目，保證不對齊、不成群
      const buckets = [...(question.choices || [])].reverse().map((choice) => ids.filter((id) => question.answer?.[id] === choice.id));
      order = [];
      while (order.length < ids.length && buckets.some((bucket) => bucket.length)) buckets.forEach((bucket) => { if (bucket.length) order.push(bucket.shift()); });
    }
    state.optionOrders[key] = order;
  }
  const source = Object.fromEntries((question.items || []).map((item) => [item.id, item]));
  return state.optionOrders[key].map((id) => source[id]).filter(Boolean);
}

function formatSelected(question) {
  const value = answerValue(question.id);
  if (question.type === "choice") return question.options.find((option) => option.id === value)?.text || "尚未選擇";
  if (question.type === "mapping") {
    const choices = Object.fromEntries(question.choices.map((item) => [item.id, item.text]));
    return orderedMappingItems(question).map((item) => `${item.label}：${choices[value?.[item.id]] || "尚未選擇"}`).join("；");
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
  const attemptId = uid("respiration_homeostasis_guest_attempt");
  state = {
    ...createEmptyState(),
    student,
    attempt_id: attemptId,
    attempt_session_token: `guest_${attemptId}`,
    attempt_session_id: `guest_session_${attemptId}`,
    question_version: QUESTION_VERSION,
    verification_mode: "local_guest",
    screen: "brief",
    completedScreens: ["login", "brief"]
  };
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
    saveVerifiedSnapshot(student);
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

function resetViewportScroll() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const apply = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (error) {
      try { window.scrollTo(0, 0); } catch (innerError) {}
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainStage = document.querySelector(".main-stage");
    if (mainStage) mainStage.scrollTop = 0;
  };
  apply();
  if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(apply);
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
  resetViewportScroll();
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
    const hintUsed = Boolean(state.hints[id]);
    const expAwarded = correct
      ? Math.round((hintUsed ? REVISION_EXP_POOL : DIRECT_EXP_POOL) / requiredQuestionIds.length)
      : 0;
    return {
      question_id: id,
      answer: answerValue(id),
      question_type: questionMap[id].type,
      is_correct: correct,
      hint_used: hintUsed,
      corrected_after_hint: correct && hintUsed,
      exp_type: correct ? (hintUsed ? "revision" : "concept") : "none",
      exp_awarded: expAwarded,
      concept_id: questionMap[id].concept,
      checkpoint_id: checkpointIdForQuestion(id),
      teacher_group_id: analysisGroupForQuestion(id),
      verification_status: state.student?.is_guest ? "local_guest" : "client_candidate",
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
  earned.push("respiration_homeostasis_entry");
  if (passed(["respiration_homeostasis_q01", "respiration_homeostasis_q02"])) earned.push("respiration_terms_boundary_keeper");
  if (passed(["respiration_homeostasis_q03"])) earned.push("air_path_sequence_tracker");
  if (passed(["respiration_homeostasis_q04"])) earned.push("respiratory_structure_mapper");
  if (passed(["respiration_homeostasis_q05"])) earned.push("alveoli_exchange_structure_reader");
  if (passed(["respiration_homeostasis_q06", "respiration_homeostasis_q10"])) earned.push("gas_direction_interpreter");
  if (passed(["respiration_homeostasis_q07", "respiration_homeostasis_q09"])) earned.push("inhalation_mechanics_reader");
  if (passed(["respiration_homeostasis_q08", "respiration_homeostasis_q09"])) earned.push("exhalation_mechanics_reader");
  if (passed(["respiration_homeostasis_q09"])) earned.push("inhale_exhale_classifier");
  if (passed(["respiration_homeostasis_q11"])) earned.push("gas_balance_activity_monitor");
  if (passed(["respiration_homeostasis_q12", "respiration_homeostasis_q13"])) earned.push("gas_exchange_diversity_mapper");
  if (passed(["respiration_homeostasis_q13"])) earned.push("plant_respiration_boundary_reader");
  if (passed(["respiration_homeostasis_q14"])) earned.push("respiration_unit_boundary_guardian");
  if (correctedCore) earned.push("respiration_homeostasis_misconception_reviser");
  if (flawless) earned.push("respiration_homeostasis_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("respiration_homeostasis_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_respiration_homeostasis");
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
  result.logs.forEach((log) => {
    rawAnswers[log.question_id] = log.answer;
    const shortId = shortQuestionId(log.question_id);
    if (shortId) {
      rawAnswers[shortId] = log.answer;
      if (questionMap[log.question_id]?.type === "sequence") {
        rawAnswers[`${shortId}_sequence`] = log.answer;
      }
    }
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
    question_logs: result.logs.map((log) => ({
      question_id: log.question_id,
      unit_id: mission.unit_id,
      student_id: state.student.student_id,
      question_type: log.question_type || questionMap[log.question_id]?.type || "",
      attempt_answer: log.answer,
      answer_json: JSON.stringify(log.answer),
      used_hint: log.hint_used,
      hint_used: log.hint_used,
      is_correct: log.is_correct,
      corrected_after_hint: log.corrected_after_hint,
      exp_type: log.exp_type,
      exp_awarded: log.exp_awarded,
      concept_id: log.concept_id,
      checkpoint_id: log.checkpoint_id,
      teacher_group_id: log.teacher_group_id,
      verification_status: log.verification_status,
      analysis_group: analysisGroupForQuestion(log.question_id),
      skill_tag: log.skill_tag,
      misconception_tag: log.misconception_tag
    })),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    uncertain_concept: state.reflection.uncertain || "",
    report_question_id: REPORT_QUESTION_ID,
    question_direction: state.reflection.direction || "",
    confidence_score: state.reflection.confidence,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
}

function shortQuestionId(questionId) {
  const matched = String(questionId || "").match(/q\d+$/);
  return matched ? matched[0] : String(questionId || "");
}

function analysisGroupForQuestion(questionId) {
  if (["respiration_homeostasis_q01", "respiration_homeostasis_q02"].includes(questionId)) return "respiration_terms_boundary";
  if (["respiration_homeostasis_q03", "respiration_homeostasis_q04"].includes(questionId)) return "respiratory_path_structures";
  if (["respiration_homeostasis_q05", "respiration_homeostasis_q06", "respiration_homeostasis_q10"].includes(questionId)) return "alveoli_gas_exchange";
  if (["respiration_homeostasis_q07", "respiration_homeostasis_q08", "respiration_homeostasis_q09"].includes(questionId)) return "breathing_mechanics";
  if (["respiration_homeostasis_q11", "respiration_homeostasis_q12", "respiration_homeostasis_q13"].includes(questionId)) return "gas_balance_diversity";
  if (questionId === "respiration_homeostasis_q14") return "unit_boundary_control";
  return "respiration_terms_boundary";
}

const SPEC_CHECKPOINT_IDS = {
  respiration_homeostasis_cp1_terms_and_air_path: [1, 2, 3, 4],
  respiration_homeostasis_cp2_alveoli_and_gas_exchange: [5, 6, 10],
  respiration_homeostasis_cp3_breathing_mechanics: [7, 8, 9],
  respiration_homeostasis_cp4_balance_diversity_boundary: [11, 12, 13, 14]
};

function checkpointIdForQuestion(questionId) {
  // 規格 checkpoint IDs 依題號分組（與網頁三個關卡分段不同）
  const number = Number(String(questionId || "").match(/q(\d+)$/)?.[1] || 0);
  return Object.keys(SPEC_CHECKPOINT_IDS).find((id) => SPEC_CHECKPOINT_IDS[id].includes(number)) || "";
}

async function submitAttemptToBackend(payload) {
  if (state.student?.is_guest) return { ok: true, verification_status: "local_guest" };
  return requestBackend(payload);
}

function numberFromAliases(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function badgeIdsFromValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.badge_id || item.id || item.badgeId || "";
      return "";
    }).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      return badgeIdsFromValue(JSON.parse(value));
    } catch (error) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return null;
}

function objectFromValue(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }
  return {};
}

function firstBadgeIds(...values) {
  for (const value of values) {
    const ids = badgeIdsFromValue(value);
    if (ids) return ids;
  }
  return null;
}

function backendBadgeIds(response = {}, verified = null) {
  const attemptResult = objectFromValue(response.attempt_result || response.attempt_result_json || response.result);
  return firstBadgeIds(
    attemptResult.newly_credited_badges_json,
    attemptResult.earned_badges_json,
    attemptResult.newly_credited_badges,
    attemptResult.earned_badges,
    response.newly_credited_badges_json,
    response.earned_badges_json,
    verified?.earned_badges,
    verified?.badges,
    verified?.badges_json
  );
}

function applyBackendSubmitResponse(response, localResult) {
  if (!response || response.ok === false) return localResult;
  const verified = response.verified_attempt || response.attempt || null;
  const attemptResult = objectFromValue(response.attempt_result || response.attempt_result_json || response.result);
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
  const verificationStatus = verified.verification_status || response.verification_status || (response.verified_attempt ? "server_verified" : localResult.verification_status || "pending_backend");
  const serverVerified = verificationStatus === "server_verified" || verificationStatus === "server_verified_credited";
  const serverBadgeIds = backendBadgeIds(response, verified);
  const localFallback = (key) => (serverVerified ? null : localResult[key]);
  return {
    ...localResult,
    verification_status: verificationStatus,
    correct_count: numberFromAliases(verified.correct_count, attemptResult.correct_count, localFallback("correct_count")) ?? 0,
    total_questions: numberFromAliases(verified.total_questions, attemptResult.total_questions, localFallback("total_questions")) ?? 0,
    accuracy: numberFromAliases(verified.accuracy, attemptResult.accuracy, localFallback("accuracy")) ?? 0,
    hint_used_count: numberFromAliases(verified.hint_used_count, attemptResult.hint_used_count, localFallback("hint_used_count")) ?? 0,
    completion_exp: numberFromAliases(verified.completion_exp, attemptResult.completion_exp, localFallback("completion_exp")) ?? 0,
    direct_exp: numberFromAliases(verified.direct_exp, verified.concept_exp, attemptResult.direct_exp, attemptResult.concept_exp, localFallback("direct_exp")) ?? 0,
    revision_exp: numberFromAliases(verified.revision_exp, attemptResult.revision_exp, localFallback("revision_exp")) ?? 0,
    reflection_exp: numberFromAliases(verified.reflection_exp, verified.question_exp, attemptResult.reflection_exp, attemptResult.question_exp, localFallback("reflection_exp")) ?? 0,
    mastery_exp: numberFromAliases(verified.mastery_exp, attemptResult.mastery_exp, localFallback("mastery_exp")) ?? 0,
    retry_exp: numberFromAliases(verified.retry_exp, attemptResult.retry_exp, localFallback("retry_exp")) ?? 0,
    attempt_exp: numberFromAliases(verified.attempt_exp, verified.attempt_total_exp, attemptResult.attempt_exp, attemptResult.attempt_total_exp, localFallback("attempt_exp")) ?? 0,
    unit_credited_exp: numberFromAliases(verified.unit_credited_exp, attemptResult.unit_credited_exp, localFallback("unit_credited_exp")) ?? 0,
    exp_delta: numberFromAliases(verified.credited_delta, verified.exp_delta, attemptResult.credited_delta, attemptResult.exp_delta, localFallback("exp_delta")) ?? 0,
    earned_badges: serverVerified ? (serverBadgeIds || []) : (serverBadgeIds || localResult.earned_badges),
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
  resetViewportScroll();
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
  const sceneMedia = assets.briefingSceneHook
    ? `<picture class="brief-scene-media">
        ${assets.briefingSceneMobileHook ? `<source srcset="${assets.briefingSceneMobileHook}" media="(max-width: 640px)">` : ""}
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="呼吸與氣體的恆定簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')">
      </picture>`
    : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="恆定調節站場景待接">
        <strong>恆定調節站</strong>
        <span>正式簡報圖核准後，會在此呈現阿澤老師與氣體平衡監測場景。</span>
      </div>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene respiration-homeostasis-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>恆定調節站的氣體監測器亮起提醒：身體需要讓氧氣進入血液並送到細胞，同時把細胞產生的二氧化碳帶回肺部排出。阿澤老師請你協助判讀呼吸道、肺泡、胸腔運動與氣體資料。貓頭鷹助理準備了呼吸道卡、肺泡觀察卡、胸腔變化卡與不同生物的氣體交換構造卡，協助你分清楚呼吸運動、氣體交換與細胞利用氧氣，完成後會整理概念回饋給你。</p>
          <p class="muted">目前稱號：${escapeHtml(titleInfo.current.title)}｜${titleInfo.totalExp} EXP</p>
        </div>
       <div class="button-row">
          <button class="primary" data-next="scan">查看進關卡提醒</button>
          <button class="secondary" data-next="rules">先看規則</button>
        </div>
      </section>
    </div>
  `;
}

function renderScan() {
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入恆定調節站前，先記得三個判讀方向</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>上一站看生物怎麼回應外在環境，這一站要追蹤身體裡的氣體進出與平衡。</h3><p>關卡中會用到下面三個判讀方向；答案要在關卡中自己判斷。</p></div></div><div class="concept-grid"><article><strong>看到「呼吸」先分清楚</strong><p>題目說的是空氣進出身體、氣體被運送，還是身體某處需要能量？不要只看到「呼吸」兩字就當成同一件事。</p></article><article><strong>空氣走到哪裡</strong><p>先找外界空氣的入口，再追蹤管道如何往肺內分支，留意每個構造在路徑上的位置。</p></article><article><strong>胸腔與氣體的變化</strong><p>留意空氣是進入還是離開、胸腔空間如何改變，以及氣體在哪兩側之間移動。</p></article></div><button class="primary" data-next="checkpoint1">開始監測氣體平衡</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["呼吸名詞與空氣路徑","先區分呼吸運動與細胞利用氧氣，並整理空氣進入肺泡的大方向。"], checkpoint2:["肺泡與吸吐氣機制","判斷肺泡交換構造、氣體方向，以及吸氣呼氣時胸腔與橫膈變化。"], checkpoint3:["氣體平衡、多樣構造與邊界","用資料、活動情境與不同生物構造，守住呼吸與氣體恆定的單元邊界。"] }[section];
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

function conceptLabel(concept) { return {breathing_vs_cellular_respiration:"呼吸名詞",respiratory_air_path:"呼吸道",alveolus_exchange_structure:"肺泡構造",alveolus_gas_direction:"氣體方向",inhalation_mechanics:"吸氣機制",exhalation_mechanics:"呼氣機制",gas_balance_activity:"活動需求",gas_exchange_diversity:"多樣構造",unit_boundary_control:"單元邊界"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["respiration_homeostasis_q01", "respiration_homeostasis_q02"].includes(qid)) return `<div class="evidence-card"><strong>呼吸概念觀察卡</strong><p>先判斷題目是在說空氣進出身體、氣體被運送，還是身體細胞需要能量；不要只看到「呼吸」兩字就當成同一件事。</p></div>`;
  if (qid === "respiration_homeostasis_q03") return `<div class="evidence-card"><strong>空氣路徑觀察卡</strong><p>先找外界空氣的入口，再觀察主要管道如何往肺內分支；排序時用構造位置判斷，不靠背第幾步。</p></div>`;
  if (qid === "respiration_homeostasis_q04") return `<div class="evidence-card"><strong>構造位置觀察卡</strong><p>先看構造位在入口、主要通道、左右分支，還是肺內末端；再回到題目判斷較合適的功能。</p></div>`;
  if (["respiration_homeostasis_q05", "respiration_homeostasis_q06"].includes(qid)) return `<div class="evidence-card"><strong>肺泡觀察卡</strong><p>先觀察肺泡和周圍微血管的距離、壁的厚薄與接觸位置，再判斷哪些條件有利氣體在兩側移動。</p></div>`;
  if (["respiration_homeostasis_q07", "respiration_homeostasis_q08", "respiration_homeostasis_q09"].includes(qid)) return `<div class="evidence-card"><strong>胸腔變化觀察卡</strong><p>先看空氣是進入還是離開，再對照胸腔空間與橫膈位置如何改變；不要只背單一構造名稱。</p></div>`;
  if (qid === "respiration_homeostasis_q10") return `<div class="evidence-card evidence-chart-card">
    <strong>資料閱讀卡</strong>
    <p>先分清楚比較對象是吸入空氣和呼出空氣，再看每一種氣體的相對變化；解讀時只使用資料支持的範圍。</p>
    <div class="gas-chart" role="img" aria-label="橫軸是吸入空氣與呼出空氣，縱軸是相對含量百分比。氧氣在吸入空氣約二十一、呼出空氣約十六；二氧化碳在吸入空氣約零點零四、呼出空氣約四。">
      <span class="chart-y-label">相對含量（%）</span>
      <div class="chart-bars">
        <span class="chart-bar oxygen" style="--value:84"><b>21</b></span>
        <span class="chart-bar carbon" style="--value:1"><b>0.04</b></span>
        <span class="chart-bar oxygen" style="--value:64"><b>16</b></span>
        <span class="chart-bar carbon" style="--value:16"><b>4</b></span>
      </div>
      <div class="chart-x-labels"><span>吸入空氣</span><span>呼出空氣</span></div>
      <div class="chart-legend"><span><i class="oxygen"></i>氧氣</span><span><i class="carbon"></i>二氧化碳</span></div>
    </div>
  </div>`;
  if (qid === "respiration_homeostasis_q11") return `<div class="evidence-card"><strong>活動情境觀察卡</strong><p>先看活動前後身體需求是否改變，再思考呼吸變化可能和氣體進出、血液運送或細胞活動哪一部分有關。</p></div>`;
  if (["respiration_homeostasis_q12", "respiration_homeostasis_q13"].includes(qid)) return `<div class="evidence-card"><strong>生物構造觀察卡</strong><p>先觀察生物類型與交換氣體的位置，再判斷哪個構造較可能負責和外界交換氣體；不要把所有生物都套成人類。</p></div>`;
  if (qid === "respiration_homeostasis_q14") return `<div class="evidence-card"><strong>單元範圍判斷卡</strong><p>先找哪個情境最直接呈現空氣進出、肺泡或氣體交換；其他熟悉名詞要再確認是否屬於本單元核心。</p></div>`;
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
  return `<div class="mapping-list">${orderedMappingItems(question).map((item) => `
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
  const groupStable = (ids) => {
    const correct = ids.filter((id) => isCorrect(id)).length;
    const clean = ids.every((id) => isCorrect(id) && !state.hints[id]);
    return clean || (ids.length >= 2 && correct / ids.length >= 0.8);
  };
  const stable = STABLE_CONCEPT_TEXT.filter((item) => groupStable(item.questions.map(Q_ID))).map((item) => item.text);
  return { missed: unique, stable };
}

// 規格「目前較穩定概念」7 句。每句對應的題目：全部首次答對且未用提示，或兩題以上且答對率達 80%，才顯示。
// 分組依規格各題 concept_id 與迷思出現位置；q14（單元邊界）規格未列穩定語句。
const Q_ID = (n) => `respiration_homeostasis_q${String(n).padStart(2, "0")}`;
const STABLE_CONCEPT_TEXT = [
  { questions: [1, 2], text: "你能區分呼吸運動與細胞利用氧氣釋放能量。" },
  { questions: [3, 4], text: "你能整理空氣進入肺泡的大方向路徑。" },
  { questions: [5], text: "你能說明肺泡為何適合氣體交換。" },
  { questions: [6, 10], text: "你能判斷氧氣與二氧化碳在肺泡和血液間的移動方向。" },
  { questions: [7, 8, 9], text: "你能用橫膈、胸腔與空氣方向判斷吸氣和呼氣。" },
  { questions: [11], text: "你能理解運動時呼吸改變和氣體需求有關。" },
  { questions: [12, 13], text: "你能分辨不同生物的氣體交換構造。" }
];

function renderReview() {
  const result = scoreAttempt();
  const feedback = conceptFeedback();
  const stateName = result.accuracy >= 1 && result.hint_used_count === 0 ? "excellent" : result.accuracy >= .86 ? "strong" : result.accuracy >= .64 ? "stable" : result.accuracy >= .4 ? "needs_review" : "retry_ready";
  return `
    <div class="stack review-layout" data-feedback-state="${stateName}">
      <section class="panel">
        <p class="eyebrow">概念回饋</p>
        <h2>先整理你目前的氣體平衡判讀線索</h2>
        <p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的方向。</p>
        <div class="feedback-columns">
          <article>
            <h3>目前較穩定</h3>
            <ul>${(feedback.stable.length ? feedback.stable : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
          <article>
            <h3>建議再確認</h3>
            <ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
        </div>
        <button class="primary" data-next="reflection">前往任務回報</button>
      </section>
    </div>
  `;
}

function misconceptionText(tag) { return {
  breathing_cellular_respiration_confusion:"剛才有幾個概念還值得再確認：呼吸運動是空氣進出肺，細胞呼吸作用是細胞利用氧氣與養分釋放能量。",
  oxygen_used_only_in_lungs:"建議再確認氧氣的去向：氧氣會由血液運送到身體各處細胞，不是只停在肺部。",
  respiratory_path_order_confusion:"建議再整理空氣路徑：鼻腔或口腔、氣管、支氣管、肺、肺泡。",
  respiratory_structure_function_confusion:"建議再用位置與功能配對呼吸構造：入口、通道、分支、氣體交換位置。",
  alveoli_storage_only:"建議再閱讀肺泡特色：數量多、壁薄、周圍有微血管，適合交換氣體。",
  gas_exchange_direction_reversed:"建議再確認氣體交換方向：氧氣由肺泡進入血液，二氧化碳由血液進入肺泡。",
  inhalation_diaphragm_direction_confusion:"建議再觀察吸氣圖：橫膈下降、胸腔變大、空氣進入。",
  exhalation_mechanics_confusion:"建議再觀察呼氣圖：橫膈上升、胸腔變小、空氣排出。",
  inhale_exhale_feature_confusion:"建議再用空氣方向搭配胸腔大小，分辨吸氣與呼氣。",
  exhaled_air_data_misread:"建議再練習資料判讀：呼出空氣氧氣較少、二氧化碳較多，代表身體使用氧氣並排出二氧化碳。",
  lung_makes_energy_confusion:"建議再連結活動量和細胞：肺協助換氣，能量釋放主要在細胞中進行。",
  all_organisms_use_lungs:"建議再比較不同生物：魚類用鰓，昆蟲有氣管系統，植物葉片有氣孔。",
  plants_do_not_respire:"建議再確認植物也需要利用養分釋放能量，並會和外界交換氣體。",
  respiration_unit_boundary_confusion:"建議再確認單元邊界：呼吸與氣體交換在本單元；腎臟與尿液形成留到下一站。"
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
  const selectedDirection = state.reflection.direction || "";
  return `
    <div class="stack reflection-layout">
      <section class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把想問老師的地方留下來</h2>
        <p class="lead">空白可以提交但沒有回報 EXP；只複製方向詞、無關玩笑或敷衍句不會取得回報 EXP。具體且與本單元概念相關的疑問，才會取得較高回報 EXP。</p>
        <label>這次任務中，我最能掌握的一項呼吸與氣體恆定概念是什麼？
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="關鍵詞：構造、氣體、方向">
        </label>
        <label>我還不確定呼吸運動、呼吸道、肺泡氣體交換、吸氣呼氣變化或不同生物氣體交換構造中的哪一部分？
          <input id="uncertainConcept" type="text" value="${escapeHtml(state.reflection.uncertain || "")}" placeholder="關鍵詞：哪個名詞、哪個方向容易混淆">
        </label>
        <fieldset class="direction-picker">
          <legend>選一個你想帶到課堂討論、希望老師再解釋的方向</legend>
          <div class="direction-grid" role="group" aria-label="課堂討論方向">
            ${REPORT_DIRECTIONS.map((direction) => `<button type="button" class="option-card direction-chip ${selectedDirection === direction ? "selected" : ""}" data-direction="${escapeHtml(direction)}" aria-pressed="${selectedDirection === direction ? "true" : "false"}">${escapeHtml(direction)}</button>`).join("")}
          </div>
        </fieldset>
        <label>用自己的話補充你想確認的地方
          <span class="field-help">可以先想你最容易混淆的是名詞、構造路徑、氣體方向，還是吸吐氣胸腔變化。</span>
          <textarea id="studentQuestion" rows="5" placeholder="關鍵詞：方向＋我不確定的地方＋為什麼">${escapeHtml(state.reflection.question)}</textarea>
        </label>
        <label>完成任務後，我對「呼吸與氣體的恆定」的理解信心是幾分？
          <span class="field-help">5 分代表我能自己說明本單元重點概念。</span>
          <select id="confidenceLevel">
            ${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level} 分</option>`).join("")}
          </select>
        </label>
        <div class="button-row">
          <button class="primary" id="submitMission">提交任務</button>
          <button class="secondary" data-next="review">回到回饋整理</button>
        </div>
      </section>
    </div>
  `;
}

function renderResult() {
  const result = state.result || scoreAttempt();
  const statusCopy = resultStatusCopy(result);
  const mode = resultMode(result);
  const estimatedTotal = Number(result.attempt_exp ?? result.unit_credited_exp ?? 0) || 0;
  const officialTotal = mode === "verified" ? Number(result.unit_credited_exp ?? estimatedTotal) || 0 : 0;
  const officialDelta = mode === "verified" ? Number(result.exp_delta ?? result.credited_delta ?? officialTotal) || 0 : 0;
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>氣體平衡監測任務結算</h2>
        <p class="lock-note">提交後本次作答已鎖定；若要再挑戰，請重新登入並從頭完成。</p>
        <div class="feedback ${statusCopy.noticeClass}">${statusCopy.lead}</div>
        <div class="exp-summary">
          <strong>${statusCopy.summaryValue}</strong>
          <span>${statusCopy.summaryLabel}：${estimatedTotal}｜${statusCopy.creditLabel}：${statusCopy.creditValue}</span>
        </div>
        <div class="ledger-grid">
          ${ledgerRow("完成任務", result.completion_exp)}
          ${ledgerRow("直接答對", result.direct_exp)}
          ${ledgerRow("提示後修正", result.revision_exp)}
          ${ledgerRow("回報 EXP", result.reflection_exp)}
          ${ledgerRow("精熟 EXP", result.mastery_exp)}
          ${ledgerRow("再挑戰補分", result.retry_exp)}
          ${ledgerRow(mode === "verified" ? "正式認列總計" : "本次預估明細總計", mode === "verified" ? officialTotal : estimatedTotal)}
          ${ledgerRow("正式認列／累積增量", officialDelta)}
        </div>
        <p class="muted">${statusCopy.detail}</p>
        <div class="button-row">
          <button class="primary" data-next="achievements">查看成就</button>
          <button class="secondary" data-next="rules">查看規則</button>
          <button class="secondary" data-relogin="true">重新登入／再挑戰</button>
        </div>
      </section>
      ${renderBadgeWall(result.earned_badges, { onlyEarned: true, mode })}
    </div>
  `;
}

function ledgerRow(label, value) {
  return `<article><span>${label}</span><strong>${Number(value || 0)}</strong></article>`;
}

function resultMode(result = state.result || {}) {
  const status = result?.verification_status || (state.student?.is_guest ? "local_guest" : "pending_backend");
  if (state.student?.is_guest || status === "local_guest") return "guest";
  if (String(status).includes("server_verified") || status === "verified") return "verified";
  return "pending";
}

function resultStatusCopy(result = state.result || scoreAttempt()) {
  const mode = resultMode(result);
  const copy = RESULT_STATUS_COPY[mode] || RESULT_STATUS_COPY.pending;
  const attemptExp = Number(result.attempt_exp ?? result.unit_credited_exp ?? 0) || 0;
  const creditExp = Number(result.unit_credited_exp ?? attemptExp) || 0;
  return {
    ...copy,
    summaryValue: mode === "verified" ? `${creditExp} / ${UNIT_EXP_CAP} EXP` : `${attemptExp} / ${UNIT_EXP_CAP} EXP`,
    lead: copy.lead.replace("{exp}", String(attemptExp)).replace("{credit}", String(creditExp)),
    creditValue: copy.creditValue.replace("{exp}", String(attemptExp)).replace("{credit}", String(creditExp))
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

function renderBadgeWall(earned = [], options = {}) {
  const earnedSet = new Set(earned);
  const badgeList = options.onlyEarned
    ? [...earnedSet]
        .map((id) => badges.find((badge) => badge.id === id))
        .filter((badge) => badge?.image_status === "ready" && badge.badge_image_path)
    : badges;
  const statusText = {
    verified: "本次正式取得",
    pending: "本次可能取得，待後台確認",
    guest: "guest 測試徽章，不列入正式累積"
  }[options.mode || "pending"] || "本次可能取得，待後台確認";
  return `<section class="panel" data-bq-unit-achievements="${mission.unit_id}">
    <p class="eyebrow">${options.onlyEarned ? "本次徽章" : "徽章收藏牆"}</p>
    <h2>${options.onlyEarned ? "本次取得徽章" : `本單元 ${badges.length} 枚徽章`}</h2>
    ${options.onlyEarned && !badgeList.length ? `<p class="muted">本次尚未取得可顯示的正式徽章；正式徽章累積以後台確認為準。</p>` : ""}
    <div class="badge-wall">
      ${badgeList.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual ${badge.image_status === "pending" ? "asset-missing" : ""}" data-badge-image-status="${escapeHtml(badge.image_status || "ready")}">
            ${badge.image_status === "pending" ? "" : `<img src="${badge.badge_image_path}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();">`}
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
  return `
    <div class="stack">
      <section class="panel">
        <p class="eyebrow">成就規則</p>
        <h2>本單元 EXP 與再挑戰規則</h2>
        <ul class="rule-list">
          <li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li>
          <li>提示後修正仍可取得 EXP，但低於直接答對。</li>
          <li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li>
          <li>回報空白可提交但 0 EXP；具體且與呼吸名詞、空氣路徑、肺泡氣體交換、吸吐氣胸腔變化、活動需求或不同生物氣體交換構造相關的問題才會取得回報 EXP。</li>
          <li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li>
        </ul>
        <div class="button-row">
          <button class="secondary" data-next="${state.submitted ? "result" : state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>
          ${state.submitted ? `<button class="secondary" data-relogin="true">重新登入／再挑戰</button>` : ""}
        </div>
      </section>
    </div>
  `;
}

function renderApp() {
  if (!screen) return;
  const screenChanged = renderApp.lastScreen !== state.screen;
  renderApp.lastScreen = state.screen;
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
  if (screenChanged) resetViewportScroll();
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
  const uncertain = screen.querySelector("#uncertainConcept");
  uncertain?.addEventListener("input", () => { state.reflection.uncertain = uncertain.value; saveState(); });
  screen.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => {
    const direction = button.dataset.direction;
    state.reflection.direction = state.reflection.direction === direction ? "" : direction;
    screen.querySelectorAll("[data-direction]").forEach((item) => {
      const active = item.dataset.direction === state.reflection.direction;
      item.classList.toggle("selected", active);
      item.setAttribute("aria-pressed", active ? "true" : "false");
    });
    saveState();
  }));
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
  window.__respiration_homeostasisTest = {
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
    answerValue,
    isCorrect,
    scoreAttempt,
    buildBackendPayload,
    applyBackendSubmitResponse,
    shortQuestionId,
    guardedOptionOrder,
    orderedOptions,
    backendBadgeIds,
    evaluateReflection,
    REPORT_DIRECTIONS,
    reflectionRules,
    conceptFeedback,
    titleAvatarPath,
    resultMode,
    renderBrief,
    renderScan,
    orderedMappingItems,
    mappingItemsLookGrouped,
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements,
    renderRules,
    resetForRelogin,
    canUseNav,
    resetViewportScroll
  };
}
