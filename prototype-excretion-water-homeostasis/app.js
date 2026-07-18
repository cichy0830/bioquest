const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260718-excretion-water-homeostasis-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_excretion_water_homeostasis_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "excretion_water_homeostasis",
  unit_title: "排泄與水分的恆定",
  mission_title: "水分與廢物調節任務",
  mission_area: "恆定調節站"
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
  conceptTerms: ["排泄", "排遺", "代謝廢物", "含氮廢物", "尿素", "尿酸", "氨", "腎臟", "輸尿管", "膀胱", "尿道", "尿液", "泌尿系統", "水分收支", "飲水", "流汗", "排尿", "水分恆定", "尿量", "資料判讀"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["排泄與排遺", "代謝廢物", "含氮廢物", "泌尿系統構造", "尿液排出路徑", "尿液成分", "水分收支", "資料判讀"]
};

const badges = [
  ["excretion_water_homeostasis_entry", "水分廢物入門", "完成水分與廢物調節任務。"],
  ["excretion_egestion_boundary_keeper", "排泄排遺邊界", "能區分代謝廢物與消化道殘渣。"],
  ["metabolic_waste_identifier", "代謝廢物辨識", "能辨識二氧化碳、尿素、多餘水分與鹽分等代謝廢物或多餘物質。"],
  ["nitrogenous_waste_reader", "含氮廢物基礎", "能把尿素等例子歸為含氮廢物。"],
  ["urinary_organ_mapper", "泌尿構造功能配對", "能配對腎臟、輸尿管、膀胱與尿道功能。"],
  ["urine_path_sequence_tracker", "尿液路徑排序", "能排出尿液由形成到排出的路徑。"],
  ["kidney_urine_formation_reader", "腎臟形成尿液判讀", "能分辨腎臟形成尿液與膀胱儲存尿液。"],
  ["urine_composition_reader", "尿液成分判讀", "能修正尿液只是水的迷思。"],
  ["water_balance_direction_reader", "水分收支方向", "能用流汗與飲水判斷尿量方向。"],
  ["water_data_interpreter", "水分資料判讀", "能用飲水量與尿量資料判斷水分調節方向。"],
  ["water_gain_loss_classifier", "水分進出分類", "能分類水分進入與流失。"],
  ["healthy_water_balance_guardian", "適量水分守門", "能修正少喝水越健康的迷思。"],
  ["excretion_unit_boundary_guardian", "排泄水分邊界守門", "能分辨排泄水分恆定與相鄰單元。"],
  ["excretion_water_misconception_reviser", "排泄水分迷思修正", "提示後修正本單元迷思。"],
  ["excretion_water_homeostasis_flawless", "水分廢物零提示全對", "全部答對且全程未使用提示。"],
  ["excretion_water_homeostasis_reflection_reporter", "高品質排泄水分回報", "回報品質達 discussion_question。"],
  ["retry_growth_excretion_water_homeostasis", "再探水分廢物進步", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const urinaryFunctionChoices = [
  { id: "urine_formation", text: "處理血液中的代謝廢物與多餘水分、鹽分，形成尿液" },
  { id: "urine_to_bladder", text: "把尿液由腎臟送到膀胱" },
  { id: "urine_storage", text: "暫時儲存尿液" },
  { id: "urine_out_body", text: "把尿液排出體外" }
];
const waterBalanceChoices = [
  { id: "water_gain", text: "水分進入身體" },
  { id: "water_loss", text: "水分流失" }
];

const questions = [
  {id:"excretion_water_homeostasis_q01",section:"checkpoint1",concept:"excretion_vs_egestion",type:"choice",answer:"excretion_not_egestion",prompt:"有同學說：「排泄就是把糞便排出來。」哪個修正較合理？",hint:"先判斷排出的東西來自細胞代謝，還是來自消化道殘渣。",misconception:"excretion_egestion_confusion",options:[{id:"excretion_not_egestion",text:"排泄是排出代謝廢物；糞便主要是消化道未消化或未吸收的殘渣，屬排遺"},{id:"alveoli_only",text:"排泄只發生在肺泡"},{id:"blood_glucose_drop",text:"排泄等於血糖降低"},{id:"mimosa_closes",text:"排泄是含羞草葉片閉合"}]},
  {id:"excretion_water_homeostasis_q02",section:"checkpoint1",concept:"metabolic_waste_basic",type:"choice",answer:"metabolic_waste_examples",prompt:"下列哪一組最適合作為代謝廢物或多餘物質的例子？",hint:"找出和細胞活動後需要排出，或體內多餘需調節的物質較有關的一組。",misconception:"metabolic_waste_confusion",options:[{id:"metabolic_waste_examples",text:"二氧化碳、尿素、多餘水分與鹽分"},{id:"undigested_food",text:"完整未咀嚼的食物"},{id:"stimulus_light_sound",text:"光線和聲音"},{id:"insulin_glucagon",text:"胰島素和升糖素"}]},
  {id:"excretion_water_homeostasis_q03",section:"checkpoint1",concept:"nitrogenous_waste_basic",type:"choice",answer:"nitrogenous_waste_urea_example",prompt:"關於含氮廢物，下列哪個說法較符合七年級範圍？",hint:"注意「含氮」和蛋白質等物質代謝後的廢物較有關。",misconception:"nitrogenous_waste_confusion",options:[{id:"nitrogenous_waste_urea_example",text:"蛋白質等含氮物質代謝後會產生含氮廢物，尿素是例子之一"},{id:"alveoli_only",text:"含氮廢物只會出現在肺泡"},{id:"vegetable_fiber",text:"含氮廢物就是未消化的蔬菜纖維"},{id:"blood_glucose_control",text:"含氮廢物能直接調節血糖"}]},
  {id:"excretion_water_homeostasis_q04",section:"checkpoint2",concept:"urinary_system_organs",type:"mapping",answer:{kidney:"urine_formation",ureter:"urine_to_bladder",bladder:"urine_storage",urethra:"urine_out_body"},prompt:"請將泌尿系統構造與較合適的功能方向配對。",hint:"先找哪個構造形成尿液，再看尿液往哪裡被運送、暫存與排出。",misconception:"urinary_organ_function_confusion",items:[{id:"kidney",label:"腎臟"},{id:"ureter",label:"輸尿管"},{id:"bladder",label:"膀胱"},{id:"urethra",label:"尿道"}],choices:urinaryFunctionChoices},
  {id:"excretion_water_homeostasis_q05",section:"checkpoint2",concept:"urine_path",type:"sequence",answer:["kidney","ureter","bladder","urethra"],prompt:"請拖曳排序，排出尿液從形成到排出體外的大方向路徑。",hint:"先找尿液在哪裡形成，再看它經由哪條管道送到暫存位置，最後排出。",misconception:"urine_path_order_confusion",steps:[{id:"kidney",label:"腎臟"},{id:"ureter",label:"輸尿管"},{id:"bladder",label:"膀胱"},{id:"urethra",label:"尿道"}]},
  {id:"excretion_water_homeostasis_q06",section:"checkpoint2",concept:"kidney_urine_formation",type:"choice",answer:"kidney_forms_urine_from_blood",prompt:"下列哪一項最能描述腎臟在本單元的主要角色？",hint:"找出和血液、代謝廢物、多餘水分以及尿液形成最直接相關的構造。",misconception:"kidney_bladder_confusion",options:[{id:"kidney_forms_urine_from_blood",text:"處理血液中的代謝廢物與多餘水分、鹽分，形成尿液"},{id:"stores_urine",text:"儲存尿液直到排出"},{id:"alveoli_gas_exchange",text:"讓氧氣從肺泡進入血液"},{id:"insulin_control",text:"分泌胰島素調節血糖"}]},
  {id:"excretion_water_homeostasis_q07",section:"checkpoint2",concept:"urine_composition",type:"choice",answer:"urine_contains_water_urea_salts",prompt:"有同學說：「尿液只是身體不要的清水。」哪個修正較合理？",hint:"想想尿液除了水，還可能帶走哪些代謝廢物或多餘物質。",misconception:"urine_is_only_water",options:[{id:"urine_contains_water_urea_salts",text:"尿液含水，也含尿素、鹽分等物質"},{id:"oxygen_only",text:"尿液只含氧氣"},{id:"undigested_food",text:"尿液就是未消化食物殘渣"},{id:"blood_glucose_hormone",text:"尿液主要是用來調節血糖的激素"}]},
  {id:"excretion_water_homeostasis_q08",section:"checkpoint3",concept:"water_balance_basic",type:"choice",answer:"sweating_less_water_less_urine",prompt:"天氣炎熱、大量流汗又喝水較少時，身體為了維持水分，尿量常會怎麼變化？",hint:"先想水分流失增加、補充減少時，身體是否還會排出很多水。",misconception:"water_balance_direction_confusion",options:[{id:"sweating_less_water_less_urine",text:"尿量可能減少，尿液可能較濃"},{id:"more_clear_urine",text:"尿量一定大量增加且更淡"},{id:"kidney_stops_all",text:"腎臟停止所有作用"},{id:"alveoli_make_urine",text:"立刻改由肺泡形成尿液"}]},
  {id:"excretion_water_homeostasis_q09",section:"checkpoint3",concept:"water_data_interpretation",type:"choice",answer:"more_water_more_urine_data",prompt:"一組資料顯示：同一人上午飲水 300 mL 時尿量較少；下午飲水 900 mL 後，尿量增加。哪個解讀較合理？",hint:"先比較飲水量和尿量的變化方向，不要加入題目沒有測量的項目。",misconception:"water_data_misread",options:[{id:"more_water_more_urine_data",text:"飲水量增加時，身體可透過增加排尿排出較多水分"},{id:"more_water_zero_urine",text:"飲水越多，尿量一定永遠為零"},{id:"alveoli_make_urine",text:"資料證明肺泡形成尿液"},{id:"blood_glucose_down",text:"資料證明血糖一定下降"}]},
  {id:"excretion_water_homeostasis_q10",section:"checkpoint3",concept:"water_balance_basic",type:"choice",answer:"water_intake_needed_for_balance",prompt:"有同學說：「少喝水就能少上廁所，所以越少喝水越健康。」哪個修正較合理？",hint:"注意身體維持水分相對穩定，不代表越少補充越好。",misconception:"less_water_is_healthier",options:[{id:"water_intake_needed_for_balance",text:"身體需要適量水分，飲水不足可能影響水分恆定"},{id:"no_water_needed",text:"身體完全不需要水"},{id:"alveoli_more_oxygen",text:"少喝水會讓肺泡製造更多氧氣"},{id:"blood_glucose_stable_forever",text:"少喝水會直接讓血糖永遠穩定"}]},
  {id:"excretion_water_homeostasis_q11",section:"checkpoint3",concept:"water_balance_basic",type:"mapping",answer:{drinking_water:"water_gain",water_in_food:"water_gain",urination:"water_loss",sweating:"water_loss"},prompt:"請將下列項目分成「水分進入身體」或「水分流失」。",hint:"先判斷每個項目會讓身體水分增加，還是讓水分離開身體。",misconception:"water_gain_loss_confusion",items:[{id:"drinking_water",label:"飲水"},{id:"water_in_food",label:"食物中的水分"},{id:"urination",label:"排尿"},{id:"sweating",label:"流汗"}],choices:waterBalanceChoices},
  {id:"excretion_water_homeostasis_q12",section:"checkpoint3",concept:"nitrogenous_waste_basic",type:"choice",answer:"nitrogenous_waste_forms_vary",prompt:"不同動物排出含氮廢物的形式可能不同。下列哪個說法較合理？",hint:"看題目問的是含氮廢物的形式，不是食物殘渣或植物感應。",misconception:"nitrogenous_waste_confusion",options:[{id:"nitrogenous_waste_forms_vary",text:"氨、尿素、尿酸都可作含氮廢物例子，但不同動物不一定用同一種形式排出"},{id:"only_glucose",text:"所有動物一定只排出葡萄糖"},{id:"undigested_food",text:"含氮廢物一定是未消化食物"},{id:"mimosa_leaf",text:"含氮廢物只會由含羞草葉片排出"}]},
  {id:"excretion_water_homeostasis_q13",section:"checkpoint3",concept:"urinary_system_organs",type:"choice",answer:"kidney_forms_bladder_stores",prompt:"有同學說：「膀胱負責製造尿液，腎臟只是儲存尿液。」哪個修正較合理？",hint:"先用「形成尿液」和「暫時儲存尿液」分辨兩個構造。",misconception:"kidney_bladder_confusion",options:[{id:"kidney_forms_bladder_stores",text:"腎臟形成尿液，膀胱暫時儲存尿液"},{id:"bladder_alveoli",text:"膀胱負責肺泡氣體交換"},{id:"kidney_glucose_only",text:"腎臟只負責調節血糖"},{id:"digest_food",text:"膀胱和腎臟都只負責消化食物"}]},
  {id:"excretion_water_homeostasis_q14",section:"checkpoint3",concept:"unit_boundary_control",type:"choice",answer:"kidney_urine_belongs_excretion_water",prompt:"下列哪一個情境最適合放在「排泄與水分的恆定」本單元核心檢核？",hint:"找出和代謝廢物、尿液形成或水分收支最直接相關的情境。",misconception:"excretion_unit_boundary_confusion",options:[{id:"kidney_urine_belongs_excretion_water",text:"腎臟形成尿液並協助排出代謝廢物與多餘水分"},{id:"alveoli_gas_exchange",text:"肺泡和微血管交換氧氣與二氧化碳"},{id:"insulin_blood_glucose",text:"胰島素協助血糖降低"},{id:"sweat_cooling_temperature",text:"流汗協助散熱以維持體溫"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["excretion_water_homeostasis_q01", "excretion_water_homeostasis_q02", "excretion_water_homeostasis_q03"],
  checkpoint2: ["excretion_water_homeostasis_q04", "excretion_water_homeostasis_q05", "excretion_water_homeostasis_q06", "excretion_water_homeostasis_q07"],
  checkpoint3: ["excretion_water_homeostasis_q08", "excretion_water_homeostasis_q09", "excretion_water_homeostasis_q10", "excretion_water_homeostasis_q11", "excretion_water_homeostasis_q12", "excretion_water_homeostasis_q13", "excretion_water_homeostasis_q14"]
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
  const attemptId = uid("excretion_water_homeostasis_guest_attempt");
  state = {
    ...createEmptyState(),
    student,
    attempt_id: attemptId,
    attempt_session_token: `guest_${attemptId}`,
    attempt_session_id: `guest_session_${attemptId}`,
    question_version: VERSION,
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
  earned.push("excretion_water_homeostasis_entry");
  if (passed(["excretion_water_homeostasis_q01", "excretion_water_homeostasis_q02"])) earned.push("excretion_egestion_boundary_keeper");
  if (passed(["excretion_water_homeostasis_q02"])) earned.push("metabolic_waste_identifier");
  if (passed(["excretion_water_homeostasis_q03", "excretion_water_homeostasis_q12"])) earned.push("nitrogenous_waste_reader");
  if (passed(["excretion_water_homeostasis_q04"])) earned.push("urinary_organ_mapper");
  if (passed(["excretion_water_homeostasis_q05"])) earned.push("urine_path_sequence_tracker");
  if (passed(["excretion_water_homeostasis_q06", "excretion_water_homeostasis_q13"])) earned.push("kidney_urine_formation_reader");
  if (passed(["excretion_water_homeostasis_q07"])) earned.push("urine_composition_reader");
  if (passed(["excretion_water_homeostasis_q08", "excretion_water_homeostasis_q10"])) earned.push("water_balance_direction_reader");
  if (passed(["excretion_water_homeostasis_q09"])) earned.push("water_data_interpreter");
  if (passed(["excretion_water_homeostasis_q11"])) earned.push("water_gain_loss_classifier");
  if (passed(["excretion_water_homeostasis_q10"])) earned.push("healthy_water_balance_guardian");
  if (passed(["excretion_water_homeostasis_q14"])) earned.push("excretion_unit_boundary_guardian");
  if (correctedCore) earned.push("excretion_water_misconception_reviser");
  if (flawless) earned.push("excretion_water_homeostasis_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("excretion_water_homeostasis_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_excretion_water_homeostasis");
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
  if (["excretion_water_homeostasis_q01", "excretion_water_homeostasis_q02", "excretion_water_homeostasis_q03"].includes(questionId)) return "excretion_basics";
  if (["excretion_water_homeostasis_q04", "excretion_water_homeostasis_q05", "excretion_water_homeostasis_q06", "excretion_water_homeostasis_q07"].includes(questionId)) return "urinary_system";
  if (["excretion_water_homeostasis_q08", "excretion_water_homeostasis_q09", "excretion_water_homeostasis_q10", "excretion_water_homeostasis_q11", "excretion_water_homeostasis_q12"].includes(questionId)) return "water_balance";
  if (["excretion_water_homeostasis_q13", "excretion_water_homeostasis_q14"].includes(questionId)) return "boundary_misconception";
  if (questionId === "excretion_water_homeostasis_q14") return "unit_boundary_control";
  return "excretion_basics";
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
  const sceneMedia = assets.briefingSceneHook
    ? `<picture class="brief-scene-media">
        ${assets.briefingSceneMobileHook ? `<source srcset="${assets.briefingSceneMobileHook}" media="(max-width: 640px)">` : ""}
        <img class="bq-brief-scene-image" src="${assets.briefingSceneHook}" alt="排泄與水分的恆定簡報主視覺" onerror="this.closest('.brief-scene-media')?.classList.add('asset-missing')">
      </picture>`
    : `<div class="brief-scene-fallback bq-brief-scene-missing" role="img" aria-label="恆定調節站場景待接">
        <strong>恆定調節站</strong>
        <span>正式簡報圖核准後，會在此呈現阿澤老師與水分廢物監測場景。</span>
      </div>`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <figure class="brief-scene excretion-water-homeostasis-brief-scene bq-brief-scene-stage" data-bq-brief-dual-role="true"${sceneAttrs}>
          ${sceneMedia}
          <img class="bq-brief-student-avatar" src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.onerror=null;this.src='${assets.titleAvatarFallback}'">
        </figure>
        <div class="scene-copy bq-brief-scene-caption">
          <p class="eyebrow">${mission.mission_area}</p>
          <h2>${mission.mission_title}</h2>
          <p>恆定調節站收到水分與廢物監測紀錄。請協助分辨排泄與排遺，追蹤尿液形成與排出路徑，並用飲水、流汗與尿量資料判斷身體如何維持水分相對穩定。</p>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入恆定調節站前，先抓住四個水分廢物線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先分清楚「代謝廢物、泌尿系統、尿液路徑、水分收支」。</h3><p>本任務會用器官功能、排序路徑與資料判讀，幫你判斷排泄與水分恆定。</p></div></div><div class="concept-grid"><article><strong>排泄與排遺</strong><p>排泄排出代謝廢物；排遺排出消化道中未消化或未吸收的食物殘渣。</p></article><article><strong>泌尿系統</strong><p>腎臟形成尿液，輸尿管運送，膀胱暫存，尿道排出。</p></article><article><strong>尿液不是只有水</strong><p>尿液含水，也含尿素、鹽分等物質。</p></article><article><strong>水分收支</strong><p>飲水、食物含水、排尿與流汗會影響體內水分相對穩定。</p></article></div><button class="primary" data-next="checkpoint1">開始監測水分廢物</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["排泄、排遺與代謝廢物","先區分代謝廢物、含氮廢物與消化道殘渣。"], checkpoint2:["泌尿系統與尿液路徑","判斷腎臟、輸尿管、膀胱、尿道如何分工，並排出尿液路徑。"], checkpoint3:["水分收支、資料判讀與邊界","用流汗、飲水與尿量資料判斷水分恆定，並守住相鄰單元邊界。"] }[section];
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

function conceptLabel(concept) { return {excretion_vs_egestion:"排泄排遺",metabolic_waste_basic:"代謝廢物",nitrogenous_waste_basic:"含氮廢物",urinary_system_organs:"泌尿構造",kidney_urine_formation:"腎臟形成尿液",urine_path:"尿液路徑",urine_composition:"尿液成分",water_balance_basic:"水分收支",water_data_interpretation:"資料判讀",unit_boundary_control:"單元邊界"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["excretion_water_homeostasis_q01", "excretion_water_homeostasis_q02", "excretion_water_homeostasis_q03"].includes(qid)) return `<div class="evidence-card"><strong>代謝廢物概念卡</strong><p>排泄看的是代謝廢物或多餘物質；排遺看的是消化道中的食物殘渣。</p></div>`;
  if (["excretion_water_homeostasis_q04", "excretion_water_homeostasis_q06", "excretion_water_homeostasis_q13"].includes(qid)) return `<div class="evidence-card"><strong>泌尿構造功能卡</strong><p>用形成、運送、儲存、排出四個功能整理泌尿系統。</p></div>`;
  if (qid === "excretion_water_homeostasis_q05") return `<div class="evidence-card"><strong>尿液路徑卡</strong><p>先找尿液形成位置，再追蹤運送、暫存與排出的大方向。</p></div>`;
  if (qid === "excretion_water_homeostasis_q07") return `<div class="evidence-card"><strong>尿液成分卡</strong><p>尿液含水，也可能含尿素、鹽分等物質。</p></div>`;
  if (["excretion_water_homeostasis_q08", "excretion_water_homeostasis_q09", "excretion_water_homeostasis_q10", "excretion_water_homeostasis_q11"].includes(qid)) return `<div class="evidence-card"><strong>水分收支資料卡</strong><p>比較水分進入與流失，從飲水、流汗與尿量變化判斷水分調節方向。</p></div>`;
  if (qid === "excretion_water_homeostasis_q12") return `<div class="evidence-card"><strong>含氮廢物卡</strong><p>氨、尿素、尿酸都可作含氮廢物例子，不同動物排出形式不一定相同。</p></div>`;
  if (qid === "excretion_water_homeostasis_q14") return `<div class="evidence-card"><strong>單元邊界卡</strong><p>本單元聚焦排泄、泌尿與水分收支；肺泡交換、體溫與血糖留在相鄰單元。</p></div>`;
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
  return `
    <div class="mission-layout review-layout" data-feedback-state="${stateName}">
      <section class="panel">
        <p class="eyebrow">概念回饋</p>
        <h2>先整理你目前的水分廢物判讀線索</h2>
        <p class="lead">這裡不只看分數，也會整理你可以再閱讀或帶到課堂討論的方向。</p>
        <div class="feedback-columns">
          <article>
            <h3>目前較穩定</h3>
            <ul>${(feedback.stable.length ? feedback.stable.slice(0, 6) : ["完成作答後會列出穩定概念"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
          <article>
            <h3>建議再確認</h3>
            <ul>${(feedback.missed.length ? feedback.missed.map(misconceptionText) : ["目前沒有明顯需要補強的迷思標籤"]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
        </div>
        <button class="primary" data-next="reflection">前往任務回報</button>
      </section>
      <aside class="panel mentor-card" data-feedback-state="${stateName}">
        <img src="../shared-assets/mentor-feedback/mentor-feedback-${stateName}.webp" alt="阿澤老師回饋" onerror="this.src='${assets.mentorFallback}'">
        <h3>${feedbackTitle(stateName)}</h3>
        <p>請把不確定的概念轉成課堂上想確認的方向。</p>
      </aside>
    </div>
  `;
}

function misconceptionText(tag) { return {
  excretion_egestion_confusion:"建議再確認：排泄排出代謝廢物，排遺排出消化道中未消化或未吸收的殘渣。",
  metabolic_waste_confusion:"建議再確認代謝廢物：細胞活動後可能產生二氧化碳、尿素等需要排出的物質。",
  nitrogenous_waste_confusion:"建議再閱讀含氮廢物：尿素是常見例子之一，不是未消化的食物殘渣。",
  urinary_organ_function_confusion:"建議再用功能整理泌尿系統：腎臟形成、輸尿管運送、膀胱儲存、尿道排出。",
  urine_path_order_confusion:"建議再整理尿液路徑：腎臟、輸尿管、膀胱、尿道。",
  kidney_bladder_confusion:"建議再比較腎臟與膀胱：腎臟形成尿液，膀胱暫時儲存尿液。",
  urine_is_only_water:"建議再確認尿液成分：尿液含水，也含尿素、鹽分等物質。",
  water_balance_direction_confusion:"建議再用水分收支判斷：流汗多、喝水少時，尿量可能減少且較濃。",
  water_data_misread:"建議再練習資料判讀：先比較飲水量與尿量的變化方向。",
  less_water_is_healthier:"建議再確認身體需要適量水分，水分恆定不是越少喝水越好。",
  water_gain_loss_confusion:"建議再分辨水分進入與流失：飲水與食物含水增加水分，排尿與流汗會流失水分。",
  excretion_unit_boundary_confusion:"建議再確認單元邊界：肺泡氣體交換屬 U24；體溫與血糖調節屬 U26；本單元聚焦排泄與水分。"
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
  return `
    <div class="stack reflection-layout">
      <section class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把想問老師的地方留下來</h2>
        <p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p>
        <p class="muted">可以從排泄與排遺、代謝廢物、含氮廢物、泌尿系統構造、尿液排出路徑、尿液成分、水分收支與資料判讀中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：腎臟形成尿液，膀胱暫時儲存尿液">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認排泄和排遺怎麼分辨，為什麼糞便不算排泄？">${escapeHtml(state.reflection.question)}</textarea>
        </label>
        <label>信心程度
          <select id="confidenceLevel">
            ${[1,2,3,4,5].map((level) => `<option value="${level}" ${String(state.reflection.confidence) === String(level) ? "selected" : ""}>${level}｜${level === 5 ? "能自己說明本單元重點概念" : "仍需要一些協助"}</option>`).join("")}
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
  const credit = creditStatusText(result);
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>水分與廢物調節任務結算</h2>
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
  return `
    <div class="stack">
      <section class="panel">
        <p class="eyebrow">成就規則</p>
        <h2>本單元 EXP 與再挑戰規則</h2>
        <ul class="rule-list">
          <li>本單元最高認列 ${UNIT_EXP_CAP} EXP；零提示全對是最高路徑。</li>
          <li>提示後修正仍可取得 EXP，但低於直接答對。</li>
          <li>提交後本次作答鎖定；再挑戰必須重新登入並完整完成。</li>
          <li>回報空白可提交但 0 EXP；具體且與排泄/排遺、代謝廢物、含氮廢物、泌尿系統、尿液路徑、尿液成分或水分收支相關的問題才會取得回報 EXP。</li>
          <li>稱號進度 23,400 EXP 封頂；全冊理論可累積 26,000 EXP。</li>
        </ul>
        <button class="secondary" data-next="${state.student ? state.screen === "rules" ? "brief" : state.screen : "login"}">返回任務</button>
      </section>
    </div>
  `;
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
  window.__excretion_water_homeostasisTest = {
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
