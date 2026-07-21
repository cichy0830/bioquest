const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260721-nervous-system-minimal-p1-v1";
const QUESTION_VERSION = "20260718-nervous-system-ready-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_nervous_system_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "nervous_system",
  unit_title: "神經系統",
  mission_title: "神經訊號追蹤任務",
  mission_area: "神經訊號中樞"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlReport: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/nervous-system-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "",
  ambientBackgroundHook: "assets/nervous-system-entry-wide.webp",
  questionNeuronBase: "nervous-system-neuron-base",
  questionCnsPnsMap: "nervous-system-cns-pns-map",
  questionRoleCards: "nervous-system-neuron-role-cards",
  questionReflexPathway: "nervous-system-reflex-pathway"
};

const badgeAsset = () => "";
const reflectionRules = {
  conceptTerms: ["神經", "神經元", "神經系統", "訊息", "傳遞", "中樞", "周圍", "腦", "脊髓", "感覺神經元", "運動神經元", "中間神經元", "反射", "路徑", "受器", "動器", "肌肉", "頭骨", "脊柱"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["神經元與神經", "腦與脊髓", "周圍神經", "感覺/運動/中間神經元", "反射路徑", "反射和大腦的關係"]
};

const badges = [
  ["nervous_system_entry", "神經訊號入門徽章", "完成神經訊號追蹤任務。"],
  ["neuron_signal_messenger", "神經元訊息傳遞徽章", "能辨識神經元接收與傳遞訊息。"],
  ["neuron_nerve_distinction", "神經元神經分辨徽章", "能區分神經元與神經的層級。"],
  ["central_nervous_mapper", "中樞神經定位徽章", "能辨識腦與脊髓屬於中樞神經系統。"],
  ["peripheral_connection_mapper", "周圍連線辨識徽章", "能理解周圍神經連結中樞與身體各處。"],
  ["sensory_motor_interneuron_router", "三類神經元分工徽章", "能分辨感覺、運動與中間神經元。"],
  ["signal_pathway_sequencer", "神經訊號路徑排序徽章", "能排出反射情境的訊息路徑。"],
  ["reflex_arc_reasoner", "反射路徑推理徽章", "能理解反射仍由神經系統傳遞與協調。"],
  ["brain_spinal_cord_role_reader", "腦脊髓角色判讀徽章", "能判斷腦、脊髓與保護構造的角色。"],
  ["reflex_consciousness_spotter", "反射迷思辨識徽章", "能修正反射和有意識思考的迷思。"],
  ["nervous_evidence_reader", "神經證據判讀徽章", "能用情境證據判斷神經訊息角色。"],
  ["nervous_system_misconception_reviser", "神經迷思修正徽章", "提示後修正本單元迷思。"],
  ["nervous_system_flawless", "神經訊號零提示全對徽章", "全部答對且全程未使用提示。"],
  ["nervous_system_reflection_reporter", "高品質神經回報徽章", "回報品質達 discussion_question。"],
  ["retry_growth_nervous_system", "再探神經進步徽章", "再挑戰完整完成且正確率進步。"]
].map(([id, name, condition]) => ({ id, name, condition, badge_image_path: badgeAsset(id), image_status: "pending" }));

const sequenceSteps = [
  { id: "skin_receptor", label: "皮膚受器接收熱刺激" },
  { id: "sensory_to_spinal", label: "感覺神經元把訊息傳向脊髓" },
  { id: "interneuron_spinal", label: "脊髓內神經元協調訊息" },
  { id: "motor_to_muscle", label: "運動神經元把訊息傳向手臂肌肉" },
  { id: "muscle_contract", label: "手臂肌肉收縮而縮手" }
];
const correctSequence = sequenceSteps.map((step) => step.id);
const roleChoices = [
  { id: "sensory", text: "感覺神經元" },
  { id: "interneuron", text: "中間神經元" },
  { id: "motor", text: "運動神經元" },
  { id: "effector", text: "動器" }
];

const questions = [
  {id:"nervous_system_q01",section:"checkpoint1",concept:"neuron_basic_unit",type:"choice",answer:"neuron_transmits_messages",prompt:"下列哪一項最能描述神經元在神經系統中的角色？",hint:"找出和「訊息傳遞」最直接相關的描述。",misconception:"neuron_nerve_confusion",options:[{id:"neuron_transmits_messages",text:"接收並傳遞訊息的細胞"},{id:"blood_tube",text:"專門輸送血液的管道"},{id:"storage_vacuole",text:"儲存養分的大型囊泡"},{id:"bone_protector",text:"只負責保護骨骼"}]},
  {id:"nervous_system_q02",section:"checkpoint1",concept:"neuron_basic_unit",type:"choice",answer:"neuron_cell_nerve_bundle",prompt:"有同學說：「神經元和神經完全一樣，只是名字不同。」哪個修正較合理？",hint:"想想「一個細胞」和「許多纖維集合」是不是同一層級。",misconception:"neuron_nerve_confusion",options:[{id:"neuron_cell_nerve_bundle",text:"神經元是細胞，神經可視為許多神經纖維集合形成的通道"},{id:"blood_cell_vessel",text:"神經元是血球，神經是血管"},{id:"plant_only",text:"神經元只存在植物"},{id:"digestion_only",text:"神經只負責消化食物"}]},
  {id:"nervous_system_q03",section:"checkpoint1",concept:"central_nervous_system",type:"mapping",answer:{brain:"central",spinal_cord:"central",arm_nerve:"peripheral",leg_nerve:"peripheral"},prompt:"請將構造分到「中樞神經系統」或「周圍神經系統」。",hint:"先找腦和脊髓，再看哪些神經是在連結中樞和身體各處。",misconception:"cns_pns_confusion",items:[{id:"brain",label:"腦"},{id:"spinal_cord",label:"脊髓"},{id:"arm_nerve",label:"連到手臂的神經"},{id:"leg_nerve",label:"連到腿部的神經"}],choices:[{id:"central",text:"中樞神經系統"},{id:"peripheral",text:"周圍神經系統"}]},
  {id:"nervous_system_q04",section:"checkpoint1",concept:"peripheral_nervous_system",type:"choice",answer:"peripheral_nerves_connect_body_cns",prompt:"如果手指碰到尖銳物後，訊息需要從手指傳向脊髓，哪一類構造最直接負責連接身體末端和中樞？",hint:"找出連接身體各處和腦、脊髓的訊息通道。",misconception:"cns_pns_confusion",options:[{id:"peripheral_nerves_connect_body_cns",text:"周圍神經"},{id:"stomach",text:"胃"},{id:"chloroplast",text:"葉綠體"},{id:"villi",text:"小腸絨毛"}]},
  {id:"nervous_system_q05",section:"checkpoint2",concept:"sensory_neuron_role",type:"choice",answer:"sensory_neuron_to_cns",prompt:"皮膚受器感受到高溫後，將訊息傳向脊髓的神經元較接近哪一類？",hint:"看訊息方向是從受器往中樞，還是從中樞往動器。",misconception:"sensory_motor_confusion",options:[{id:"sensory_neuron_to_cns",text:"感覺神經元"},{id:"motor_neuron_to_effector",text:"運動神經元"},{id:"red_blood_cell",text:"紅血球"},{id:"digestive_enzyme",text:"消化酵素"}]},
  {id:"nervous_system_q06",section:"checkpoint2",concept:"motor_neuron_role",type:"choice",answer:"motor_neuron_to_effector",prompt:"脊髓傳出訊息使手臂肌肉收縮，這段從中樞到肌肉的訊息較接近哪一類神經元的功能？",hint:"想想訊息是要送到產生反應的動器。",misconception:"sensory_motor_confusion",options:[{id:"motor_neuron_to_effector",text:"運動神經元"},{id:"sensory_neuron_to_cns",text:"感覺神經元"},{id:"leaf_cell",text:"葉肉細胞"},{id:"white_blood_cell",text:"白血球"}]},
  {id:"nervous_system_q07",section:"checkpoint2",concept:"interneuron_role",type:"mapping",answer:{sensory:"to_cns",interneuron:"inside_cns",motor:"to_effector"},prompt:"請將神經元類型與主要角色配對。",hint:"先看訊息從哪裡來、到哪裡去，以及是否在中樞內連接。",misconception:"neuron_role_confusion",items:[{id:"sensory",label:"感覺神經元"},{id:"interneuron",label:"中間神經元"},{id:"motor",label:"運動神經元"}],choices:[{id:"to_cns",text:"把訊息傳向中樞"},{id:"inside_cns",text:"在中樞內協助連接與統整"},{id:"to_effector",text:"把訊息傳向動器"}]},
  {id:"nervous_system_q08",section:"checkpoint2",concept:"reflex_pathway",type:"sequence",answer:correctSequence,prompt:"碰到熱杯快速縮手時，請拖曳排序，排出較合理的神經訊息路徑。",hint:"先找接收刺激的位置，再看訊息進入中樞，最後才送到肌肉產生反應。",misconception:"reflex_pathway_order_confusion",steps:sequenceSteps},
  {id:"nervous_system_q09",section:"checkpoint3",concept:"reflex_pathway",type:"choice",answer:"reflex_still_nervous_system",prompt:"有同學說：「反射很快，所以完全不受神經系統控制。」哪個修正較合理？",hint:"快速不代表沒有路徑，想想訊息是否仍需傳遞到動器。",misconception:"reflex_not_nervous_system",options:[{id:"reflex_still_nervous_system",text:"反射仍由神經系統傳遞與協調，只是不一定先經過有意識思考"},{id:"blood_pushes_muscle",text:"反射是血液自己推動肌肉"},{id:"enzyme_only",text:"反射只和消化酵素有關"},{id:"plant_only",text:"反射一定是植物才有"}]},
  {id:"nervous_system_q10",section:"checkpoint3",concept:"central_nervous_system",type:"choice",answer:"spinal_cord_cns_reflex",prompt:"下列哪一項最符合脊髓在神經系統中的角色？",hint:"注意脊髓和保護它的脊柱不是同一件事。",misconception:"brain_spinal_cord_confusion",options:[{id:"spinal_cord_cns_reflex",text:"屬於中樞神經系統，可傳遞訊息並參與部分反射處理"},{id:"digestion_organ",text:"是消化養分的主要器官"},{id:"oxygen_maker",text:"是製造氧氣的構造"},{id:"bone_only",text:"只是骨骼，不和訊息有關"}]},
  {id:"nervous_system_q11",section:"checkpoint3",concept:"brain_spinal_cord_protection",type:"choice",answer:"skull_protects_brain",prompt:"有同學說：「頭骨就是神經系統的一部分，負責思考。」哪個修正較合理？",hint:"分清楚被保護的構造和保護它的構造。",misconception:"protection_vs_nervous_tissue",options:[{id:"skull_protects_brain",text:"頭骨主要保護腦；腦才是中樞神經系統的重要部分"},{id:"skull_signal_muscle",text:"頭骨會把訊息傳到肌肉"},{id:"skull_peripheral_nerve",text:"頭骨是周圍神經"},{id:"brain_digest_food",text:"腦只負責消化食物"}]},
  {id:"nervous_system_q12",section:"checkpoint3",concept:"reflex_pathway",type:"choice",answer:"brain_awareness_after_reflex",prompt:"摸到熱鍋立刻縮手後，過一會兒才明確感到痛。哪個說明較符合國中範圍？",hint:"思考快速反應和後續感覺可以有先後，不必二選一。",misconception:"brain_reflex_all_or_none",options:[{id:"brain_awareness_after_reflex",text:"快速縮手可經較短神經路徑處理，腦之後仍可能接收到訊息形成痛覺"},{id:"brain_never_receives",text:"只要縮手就代表腦完全沒有收到任何訊息"},{id:"chloroplast_pain",text:"痛覺由葉綠體產生"},{id:"muscle_first_knows",text:"肌肉先知道溫度再通知神經"}]},
  {id:"nervous_system_q13",section:"checkpoint3",concept:"sensory_neuron_role",type:"mapping",answer:{to_cns:"sensory",inside_spinal:"interneuron",to_muscle:"motor",muscle_contract:"effector"},prompt:"請判斷下列敘述較接近哪個角色。",hint:"先判斷是傳訊息、在中樞內連接，還是實際產生反應。",misconception:"neuron_effector_confusion",items:[{id:"to_cns",label:"從受器傳向中樞"},{id:"inside_spinal",label:"在脊髓內協調"},{id:"to_muscle",label:"從中樞傳向肌肉"},{id:"muscle_contract",label:"產生收縮反應"}],choices:roleChoices},
  {id:"nervous_system_q14",section:"checkpoint3",concept:"central_nervous_system",type:"choice",answer:"nervous_system_more_than_brain",prompt:"有同學說：「神經系統就是腦，其他構造都不重要。」哪個修正較合理？",hint:"想想訊息如何從身體各處送到中樞，又如何傳回動器。",misconception:"nervous_system_brain_only",options:[{id:"nervous_system_more_than_brain",text:"腦很重要，但脊髓和周圍神經也參與訊息傳遞與反應"},{id:"muscle_only",text:"神經系統只包含肌肉"},{id:"pns_blood",text:"周圍神經只負責運送血液"},{id:"spinal_makes_food",text:"脊髓只負責製造養分"}]}
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["nervous_system_q01", "nervous_system_q02", "nervous_system_q03", "nervous_system_q04"],
  checkpoint2: ["nervous_system_q05", "nervous_system_q06", "nervous_system_q07", "nervous_system_q08"],
  checkpoint3: ["nervous_system_q09", "nervous_system_q10", "nervous_system_q11", "nervous_system_q12", "nervous_system_q13", "nervous_system_q14"]
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

function titleAndProgress(student = state.student) {
  const remoteTotal = Number(student?.progress?.total_exp ?? student?.total_exp);
  const explicitLevel = titleLevels.find((level) => level.id === (student?.current_title_id || student?.progress?.current_title_id));
  const totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, explicitLevel?.need || 0);
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
  const attemptId = uid("nervous_system_guest_attempt");
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
  earned.push("nervous_system_entry");
  if (passed(["nervous_system_q01"])) earned.push("neuron_signal_messenger");
  if (passed(["nervous_system_q02"])) earned.push("neuron_nerve_distinction");
  if (passed(["nervous_system_q03", "nervous_system_q10"])) earned.push("central_nervous_mapper");
  if (passed(["nervous_system_q04"])) earned.push("peripheral_connection_mapper");
  if (passed(["nervous_system_q05", "nervous_system_q06", "nervous_system_q07", "nervous_system_q13"])) earned.push("sensory_motor_interneuron_router");
  if (passed(["nervous_system_q08"])) earned.push("signal_pathway_sequencer");
  if (passed(["nervous_system_q08", "nervous_system_q09", "nervous_system_q12"])) earned.push("reflex_arc_reasoner");
  if (passed(["nervous_system_q10", "nervous_system_q11"])) earned.push("brain_spinal_cord_role_reader");
  if (passed(["nervous_system_q09", "nervous_system_q12"])) earned.push("reflex_consciousness_spotter");
  if (passed(["nervous_system_q03", "nervous_system_q07", "nervous_system_q08", "nervous_system_q13", "nervous_system_q14"])) earned.push("nervous_evidence_reader");
  if (correctedCore) earned.push("nervous_system_misconception_reviser");
  if (flawless) earned.push("nervous_system_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("nervous_system_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_nervous_system");
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
  if (sections.checkpoint1.includes(questionId)) return "neuron_central_peripheral";
  if (sections.checkpoint2.includes(questionId)) return "neuron_roles_signal_pathway";
  if (["nervous_system_q09", "nervous_system_q10", "nervous_system_q11", "nervous_system_q12"].includes(questionId)) return "reflex_cns_reasoning";
  return "nervous_system_boundary_review";
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
  const sceneAttrs = `${assets.briefingSceneHook ? ` data-asset-hook="${assets.briefingSceneHook}"` : ""}${assets.briefingSceneMobileHook ? ` data-mobile-hook="${assets.briefingSceneMobileHook}"` : ""}`;
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <div class="brief-scene nervous-system-brief-scene"${sceneAttrs}>
          <div class="scene-copy">
            <p class="eyebrow">${mission.mission_area}</p>
            <h2>${mission.mission_title}</h2>
            <p>反應控制室收到多筆身體訊號紀錄。請追蹤神經元、腦與脊髓、周圍神經如何合作，並判斷快速反射的訊息路徑。</p>
          </div>
          <div class="title-avatar-brief">
            <img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.src='${assets.titleAvatarFallback}'">
            <div>
              <span>目前稱號</span>
              <strong>${escapeHtml(titleInfo.current.title)}</strong>
              <p>${titleInfo.totalExp} EXP</p>
            </div>
          </div>
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
  return `<div class="stack"><section class="panel prep-panel"><p class="eyebrow">任務準備</p><h2>進入神經訊號中樞前，先抓住四個判斷線索</h2><div class="prep-owl-hero"><img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'"><div><h3>先用「構造層級、訊息方向、中樞位置、反射路徑」拆解情境。</h3><p>神經元是傳遞訊息的細胞；腦與脊髓屬於中樞神經系統；周圍神經把中樞和身體各處連起來。</p></div></div><div class="concept-grid"><article><strong>神經元與神經</strong><p>神經元是細胞；神經可視為許多神經纖維集合成的訊息通道。</p></article><article><strong>中樞與周圍</strong><p>腦與脊髓屬中樞；連到身體各處的是周圍神經。</p></article><article><strong>三類神經元</strong><p>感覺神經元傳入中樞，中間神經元在中樞連接，運動神經元傳向動器。</p></article><article><strong>反射路徑</strong><p>反射很快，但仍由神經系統傳遞與協調，不代表沒有神經路徑。</p></article></div><button class="primary" data-next="checkpoint1">開始追蹤神經訊號</button></section></div>`;
}

function renderCheckpoint(section) {
  const heading = { checkpoint1:["神經元、中樞與周圍","先區分神經元、神經、中樞神經系統與周圍神經系統。"], checkpoint2:["神經元角色與路徑","整理感覺、運動與中間神經元的方向和位置。"], checkpoint3:["反射與中樞迷思","判斷反射路徑、腦與脊髓角色，以及常見迷思。"] }[section];
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

function conceptLabel(concept) { return {neuron_basic_unit:"神經元與神經",central_nervous_system:"中樞神經",peripheral_nervous_system:"周圍神經",sensory_neuron_role:"感覺神經元",motor_neuron_role:"運動神經元",interneuron_role:"中間神經元",reflex_pathway:"反射路徑",brain_spinal_cord_protection:"保護構造"}[concept] || concept; }

function renderQuestionEvidence(qid) {
  if (["nervous_system_q01", "nervous_system_q02"].includes(qid)) return `<div class="evidence-card"><strong>層級判斷卡</strong><p>先分清楚單一神經元和許多神經纖維集合成的神經，不把它們當成血管或肌肉。</p></div>`;
  if (["nervous_system_q03", "nervous_system_q04"].includes(qid)) return `<div class="evidence-card"><strong>中樞 / 周圍提醒</strong><p>腦與脊髓屬於中樞；連到身體各處、讓訊息進出中樞的是周圍神經。</p></div>`;
  if (["nervous_system_q05", "nervous_system_q06", "nervous_system_q07", "nervous_system_q13"].includes(qid)) return `<div class="evidence-card"><strong>訊息方向卡</strong><p>感覺神經元把訊息傳向中樞；運動神經元把訊息傳向動器；中間神經元在中樞內協調。</p></div>`;
  if (qid === "nervous_system_q08") return `<div class="evidence-card"><strong>反射排序卡</strong><p>排序題請拖曳卡片；手機可用上移 / 下移。提示只協助判斷路徑方向，不直接列答案。</p></div>`;
  if (["nervous_system_q09", "nervous_system_q12"].includes(qid)) return `<div class="evidence-card"><strong>反射迷思提醒</strong><p>反射可以很快發生，但仍需要神經系統傳遞與協調；腦也可能在反射後接收訊息形成感覺。</p></div>`;
  if (["nervous_system_q10", "nervous_system_q11", "nervous_system_q14"].includes(qid)) return `<div class="evidence-card"><strong>中樞角色提醒</strong><p>腦與脊髓是中樞神經系統的重要構造；頭骨和脊柱主要是保護構造。</p></div>`;
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
        <h2>先整理你目前的神經訊號線索</h2>
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
  neuron_nerve_confusion:"建議再區分：神經元是細胞，神經是許多神經纖維集合成的訊息通道。",
  cns_pns_confusion:"建議再比較中樞與周圍神經：腦和脊髓是中樞，周圍神經連結身體各處與中樞。",
  sensory_motor_confusion:"建議用訊息方向判斷：傳向中樞的是感覺神經元，傳向動器的是運動神經元。",
  neuron_role_confusion:"建議再整理三種神經元：感覺傳入、中間在中樞連接、運動傳出。",
  reflex_pathway_order_confusion:"建議再練習反射路徑：受器接收後，訊息傳入脊髓，再傳出到肌肉產生反應。",
  reflex_not_nervous_system:"建議再確認：反射很快，但仍需要神經系統傳遞與協調訊息。",
  brain_spinal_cord_confusion:"建議再閱讀中樞神經系統：腦與脊髓是重要中樞，頭骨與脊柱主要是保護構造。",
  protection_vs_nervous_tissue:"建議再區分保護構造與神經構造，不要把頭骨或脊柱當成負責思考的神經組織。",
  brain_reflex_all_or_none:"建議再理解反射與大腦的關係：反射可快速發生，但腦仍可能接收後續訊息形成感覺。",
  neuron_effector_confusion:"建議再區分神經元和動器：神經元傳訊息，肌肉或腺體產生反應。",
  nervous_system_brain_only:"建議再整理神經系統範圍：除了腦，脊髓與周圍神經也有重要角色。"
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
        <p class="muted">可以從神經元與神經、腦與脊髓、周圍神經、三類神經元、反射路徑或反射和大腦的關係中選一個方向。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：感覺神經元把訊息傳向中樞">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認反射為什麼不一定先經過大腦完整思考，卻仍然算神經系統控制？">${escapeHtml(state.reflection.question)}</textarea>
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
        <h2>神經訊號追蹤任務結算</h2>
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
  return `
    <div class="stack achievements-stack">
      ${renderBadgeWall(result.earned_badges)}
    </div>
  `;
}

function renderBadgeWall(earned = []) {
  const earnedSet = new Set(earned);
  return `<section class="panel" data-bq-unit-achievements="${mission.unit_id}">
    <p class="eyebrow">徽章收藏牆</p>
    <h2>本單元 ${badges.length} 枚徽章</h2>
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
          <li>回報空白可提交但 0 EXP；具體且與神經元、神經、中樞/周圍、三類神經元或反射路徑相關的問題才會取得回報 EXP。</li>
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
  window.__nervous_systemTest = {
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
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements
  };
}
