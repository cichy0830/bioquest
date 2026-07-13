const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260714-human-nutrition-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_human_nutrition_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "human_nutrition",
  unit_title: "人體如何獲得養分",
  mission_title: "養分轉運追蹤任務",
  mission_area: "生命補給轉運站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../shared-assets/login/bioquest-login-cover-wide.webp",
  owlPrep: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlReport: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  owlResult: "../shared-assets/characters/owl-bioquest-report-reminder.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  // Visual team handoff names: attach the approved WebP paths here when they land.
  briefingSceneHook: "human-nutrition-briefing-azhe-wide",
  briefingSceneMobileHook: "human-nutrition-briefing-azhe-mobile",
  ambientBackgroundHook: "human-nutrition-entry-wide",
  questionDigestiveMap: "human-nutrition-digestive-map",
  questionEnzymeCards: "human-nutrition-enzyme-cards",
  questionVilliEvidence: "human-nutrition-villi-evidence"
};

const badgeAsset = (id) => `../shared-assets/badges/human_nutrition/badge-human_nutrition-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["消化", "吸收", "消化道", "消化腺", "食物流向", "口腔", "食道", "胃", "小腸", "大腸", "肛門", "唾液腺", "肝臟", "胰臟", "酵素", "膽汁", "脂質", "蛋白質", "澱粉", "絨毛", "血液", "養分運送"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["消化道與消化腺的差異", "食物通過消化道的順序", "口腔、食道、胃、小腸與大腸的主要功能", "消化與吸收的差異", "酵素與膽汁在消化中的角色", "小腸絨毛和養分吸收", "養分如何經血液運送到全身"]
};

const badges = [
  { id: "human_nutrition_entry", name: "轉運任務入門徽章", condition: "完成養分轉運追蹤任務。" },
  { id: "digestive_parts_classifier", name: "消化系統分類徽章", condition: "能區分消化道與消化腺。" },
  { id: "food_path_sequencer", name: "食物流向排序徽章", condition: "能排出食物通過消化道的順序。" },
  { id: "organ_function_connector", name: "器官功能連結徽章", condition: "能連結主要器官與功能。" },
  { id: "digestion_absorption_splitter", name: "消化吸收分辨徽章", condition: "能區分消化與吸收。" },
  { id: "enzyme_digestive_linker", name: "消化酵素銜接徽章", condition: "能連結酵素與養分。" },
  { id: "bile_role_clarifier", name: "膽汁角色釐清徽章", condition: "能辨別膽汁不是酵素。" },
  { id: "small_intestine_absorber", name: "小腸吸收徽章", condition: "能判讀小腸絨毛與吸收。" },
  { id: "absorption_transport_tracker", name: "養分運送追蹤徽章", condition: "能連結吸收與血液運送。" },
  { id: "human_nutrition_misconception_reviser", name: "消化迷思修正徽章", condition: "提示後能修正至少一項消化概念。" },
  { id: "human_nutrition_flawless", name: "人體養分零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "human_nutrition_reflection_reporter", name: "高品質養分回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_human_nutrition", name: "再探養分轉運進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id), image_status: "pending" }));

const sequenceSteps = [
  { id: "mouth", label: "口腔" },
  { id: "esophagus", label: "食道" },
  { id: "stomach", label: "胃" },
  { id: "small_intestine", label: "小腸" },
  { id: "large_intestine", label: "大腸" },
  { id: "anus", label: "肛門" }
];
const correctSequence = ["mouth", "esophagus", "stomach", "small_intestine", "large_intestine", "anus"];

const questions = [
  { id: "q01", section: "checkpoint1", concept: "digestive_system_parts", type: "mapping", prompt: "請將構造分成「食物會通過的消化道」與「分泌消化液的消化腺」。", hint: "先想食物會不會實際通過該構造；會通過的是路線，分泌消化液的是支援站。", misconception: "tract_gland_confusion", items: [{ id: "mouth", label: "口腔" }, { id: "esophagus", label: "食道" }, { id: "stomach", label: "胃" }, { id: "small_intestine", label: "小腸" }, { id: "large_intestine", label: "大腸" }, { id: "salivary_gland", label: "唾液腺" }, { id: "liver", label: "肝臟" }, { id: "pancreas", label: "胰臟" }], choices: [{ id: "tract", text: "消化道" }, { id: "gland", text: "消化腺" }], answer: { mouth: "tract", esophagus: "tract", stomach: "tract", small_intestine: "tract", large_intestine: "tract", salivary_gland: "gland", liver: "gland", pancreas: "gland" } },
  { id: "q02", section: "checkpoint1", concept: "food_path", type: "sequence", prompt: "請拖曳排序卡，排出食物通過消化道的大致順序。", hint: "先從吃進食物的入口開始，再想推送、混合、主要吸收、吸收水分與排出的路線。", misconception: "gland_in_food_path", steps: sequenceSteps, answer: correctSequence },
  { id: "q03", section: "checkpoint1", concept: "digestive_system_parts", type: "choice", answer: "glands", prompt: "下列哪一組較適合稱為「消化腺」？", hint: "題目問的是分泌消化液的構造，不是食物通過的整條路線。", misconception: "tract_gland_confusion", options: [{ id: "glands", text: "唾液腺、肝臟、胰臟" }, { id: "tract", text: "食道、小腸、大腸" }, { id: "ends", text: "口腔、胃、肛門" }, { id: "other", text: "心臟、肺、腎臟" }] },
  { id: "q04", section: "checkpoint1", concept: "organ_functions", type: "mapping", prompt: "請將器官與較主要的功能配對。", hint: "先想食物到了哪一段，再判斷是咀嚼、推送、混合、吸收養分或吸收水分。", misconception: "all_organs_same_function", items: [{ id: "mouth", label: "口腔" }, { id: "esophagus", label: "食道" }, { id: "stomach", label: "胃" }, { id: "small_intestine", label: "小腸" }, { id: "large_intestine", label: "大腸" }], choices: [{ id: "chew", text: "咀嚼並開始部分消化" }, { id: "push", text: "推送食物" }, { id: "mix", text: "混合食物並進行部分消化" }, { id: "absorb_nutrients", text: "主要消化與吸收養分" }, { id: "absorb_water", text: "主要吸收水分並形成糞便" }], answer: { mouth: "chew", esophagus: "push", stomach: "mix", small_intestine: "absorb_nutrients", large_intestine: "absorb_water" } },
  { id: "q05", section: "checkpoint2", concept: "digestion_process", type: "choice", answer: "digestion", prompt: "澱粉、蛋白質、脂質等較大的養分需要被分解成較小物質，身體才較容易吸收。這描述的是哪個概念？", hint: "留意「分解成較小物質」和「較容易吸收」。", misconception: "digestion_absorption_same", options: [{ id: "digestion", text: "消化作用" }, { id: "absorption", text: "吸收作用" }, { id: "photosynthesis", text: "光合作用" }, { id: "excretion", text: "排泄作用" }] },
  { id: "q06", section: "checkpoint2", concept: "enzyme_digestive_link", type: "mapping", prompt: "請將常見消化酵素與較適合的作用對象配對。", hint: "回想酵素專一性，先看名稱與養分類型的線索。", misconception: "enzyme_target_confusion", items: [{ id: "amylase", label: "澱粉酶" }, { id: "protease", label: "蛋白酶" }, { id: "lipase", label: "脂肪酶" }], choices: [{ id: "starch", text: "澱粉" }, { id: "protein", text: "蛋白質" }, { id: "lipid", text: "脂質" }], answer: { amylase: "starch", protease: "protein", lipase: "lipid" } },
  { id: "q07", section: "checkpoint2", concept: "bile_not_enzyme", type: "choice", answer: "bile", prompt: "有同學說：「膽汁是分解脂質的酵素。」哪個修正較合理？", hint: "先分清楚「幫助消化」不一定等於「本身就是酵素」。", misconception: "bile_is_enzyme", options: [{ id: "bile", text: "膽汁可幫助脂質分散，利於後續消化，但本身不是酵素" }, { id: "starch", text: "膽汁會直接把澱粉變成葡萄糖" }, { id: "push", text: "膽汁只負責推送食物" }, { id: "acid", text: "膽汁是胃分泌的酸" }] },
  { id: "q08", section: "checkpoint2", concept: "enzyme_digestive_link", type: "choice", answer: "protein", prompt: "如果某消化液中含有可分解蛋白質的酵素，它較可能協助哪一類養分變成較小物質？", hint: "先看酵素的作用對象，再連到哪一類養分需要被分解。", misconception: "enzyme_target_confusion", options: [{ id: "protein", text: "蛋白質" }, { id: "starch", text: "澱粉" }, { id: "lipid", text: "脂質" }, { id: "water", text: "水" }] },
  { id: "q09", section: "checkpoint3", concept: "small_intestine_absorption", type: "choice", answer: "small_intestine", prompt: "人體中主要吸收養分的地方是哪一段？", hint: "想想哪一段具有許多絨毛，能增加吸收面積。", misconception: "stomach_main_absorption", options: [{ id: "small_intestine", text: "小腸" }, { id: "stomach", text: "胃" }, { id: "esophagus", text: "食道" }, { id: "mouth", text: "口腔" }] },
  { id: "q10", section: "checkpoint3", concept: "small_intestine_absorption", type: "choice", answer: "absorb", prompt: "某器官內壁有大量絨毛狀構造，可增加與養分接觸的面積。這個特徵最能支持哪個功能？", hint: "觀察「絨毛」和「增加面積」兩個線索，再連到養分進入體內。", misconception: "villi_as_digestion_only", options: [{ id: "absorb", text: "有利於吸收養分" }, { id: "grind", text: "只負責磨碎食物" }, { id: "breathe", text: "只負責呼吸" }, { id: "bile", text: "主要把血液變成膽汁" }] },
  { id: "q11", section: "checkpoint3", concept: "absorption_transport", type: "choice", answer: "absorb_transport", prompt: "養分被消化成可吸收的小分子後，進入小腸壁並由血液運送到全身。這段描述包含哪兩個概念？", hint: "先看養分是否「進入體內」，再看是否「被帶到全身」。", misconception: "food_chunk_enters_blood", options: [{ id: "absorb_transport", text: "吸收與運送" }, { id: "chew_swallow", text: "咀嚼與吞嚥" }, { id: "photosynthesis", text: "光合作用與蒸散作用" }, { id: "sweat", text: "呼吸與排汗" }] },
  { id: "q12", section: "checkpoint3", concept: "digestion_absorption_difference", type: "mapping", prompt: "請判斷下列敘述較接近「消化」還是「吸收」。", hint: "先看關鍵字是「分解」還是「進入體內／血液」。", misconception: "digestion_absorption_same", items: [{ id: "starch_break", label: "澱粉被分解成較小分子" }, { id: "enter_wall", label: "小分子養分進入小腸壁" }, { id: "protein_break", label: "蛋白質被酵素分解" }, { id: "enter_blood", label: "養分進入血液" }], choices: [{ id: "digestion", text: "消化" }, { id: "absorption", text: "吸收" }], answer: { starch_break: "digestion", enter_wall: "absorption", protein_break: "digestion", enter_blood: "absorption" } },
  { id: "q13", section: "checkpoint3", concept: "small_intestine_absorption", type: "choice", answer: "small_intestine", prompt: "有同學說：「胃是人體吸收養分的主要地方。」哪個修正較合理？", hint: "想想哪個器官有大量絨毛、適合增加吸收面積。", misconception: "stomach_main_absorption", options: [{ id: "small_intestine", text: "胃可混合食物並進行部分消化，小腸才是主要吸收養分的地方" }, { id: "stomach", text: "胃只負責吸收所有養分" }, { id: "large_intestine", text: "小腸只負責排便" }, { id: "none", text: "養分不需要經過吸收就能被使用" }] },
  { id: "q14", section: "checkpoint3", concept: "digestion_absorption_difference", type: "choice", answer: "different", prompt: "有同學說：「消化就是吸收，兩個詞意思一樣。」哪個修正較合理？", hint: "先看一件事是在「分解」，還是在「進入體內」。", misconception: "digestion_absorption_same", options: [{ id: "different", text: "消化是分解食物，吸收是小分子養分進入體內，兩者相關但不同" }, { id: "large", text: "消化只發生在大腸" }, { id: "chew", text: "吸收只代表咀嚼" }, { id: "waste", text: "兩者都只是在排出廢物" }] }
];

const questionMap = Object.fromEntries(questions.map((question) => [question.id, question]));
const sections = {
  checkpoint1: ["q01", "q02", "q03", "q04"],
  checkpoint2: ["q05", "q06", "q07", "q08"],
  checkpoint3: ["q09", "q10", "q11", "q12", "q13", "q14"]
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
  const attemptId = uid("human_nutrition_guest_attempt");
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
  const masteryExp = correctCount === logs.length ? (hintUsed === 0 ? 180 : 80) : (accuracy >= 0.9 ? 50 : 0);
  const retryExp = 0;
  const rawExp = completionExp + directExp + revisionExp + reflection.question_exp + masteryExp + retryExp;
  const totalExp = Math.min(UNIT_EXP_CAP, rawExp);
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
  earned.push("human_nutrition_entry");
  if (passed(["q01", "q03"])) earned.push("digestive_parts_classifier");
  if (passed(["q02"])) earned.push("food_path_sequencer");
  if (passed(["q04"])) earned.push("organ_function_connector");
  if (passed(["q05", "q12", "q14"])) earned.push("digestion_absorption_splitter");
  if (passed(["q06", "q08"])) earned.push("enzyme_digestive_linker");
  if (passed(["q07"])) earned.push("bile_role_clarifier");
  if (passed(["q09", "q10", "q13"])) earned.push("small_intestine_absorber");
  if (passed(["q11", "q12"])) earned.push("absorption_transport_tracker");
  if (correctedCore) earned.push("human_nutrition_misconception_reviser");
  if (flawless) earned.push("human_nutrition_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("human_nutrition_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_human_nutrition");
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
      attempt_answer: log.answer,
      used_hint: log.hint_used
    })),
    student_question: state.reflection.question,
    confident_concept: state.reflection.confident,
    confidence_level: state.reflection.confidence,
    client_summary: result
  };
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
  return `
    <div class="wide-layout">
      <section class="panel hero-panel brief-hero">
        <div class="brief-scene human-nutrition-brief-scene" data-asset-hook="${assets.briefingSceneHook}" data-mobile-hook="${assets.briefingSceneMobileHook}">
          <div class="scene-copy">
            <p class="eyebrow">${mission.mission_area}</p>
            <h2>${mission.mission_title}</h2>
            <p>生命補給轉運站收到一份食物進入人體後的追蹤紀錄。請協助整理它如何被分解、吸收並由血液運送。</p>
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
  return `
    <div class="stack">
      <section class="panel prep-panel">
        <p class="eyebrow">任務準備</p>
        <h2>進入生命補給轉運站前，先抓住四個判斷線索</h2>
        <div class="prep-owl-hero">
          <img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'">
          <div>
            <h3>先把食物流向、消化、吸收和運送分開看。</h3>
            <p>食物會通過消化道；消化腺提供消化液；小腸是主要吸收養分的地方。</p>
          </div>
        </div>
        <div class="concept-grid">
          <article><strong>路線</strong><p>食物依序通過口腔、食道、胃、小腸、大腸與肛門。</p></article>
          <article><strong>分工</strong><p>消化道是食物路線；消化腺分泌消化液協助消化。</p></article>
          <article><strong>消化與吸收</strong><p>消化是分解；吸收是小分子進入體內。</p></article>
          <article><strong>轉運</strong><p>小腸吸收養分後，血液可將養分運送到全身。</p></article>
        </div>
        <button class="primary" data-next="checkpoint1">開始消化路線整理</button>
      </section>
    </div>
  `;
}

function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["消化系統與食物流向", "先整理消化道、消化腺、食物流向與主要器官功能。"],
    checkpoint2: ["消化、酵素與膽汁", "把食物分解、酵素專一性與膽汁的角色分開判斷。"],
    checkpoint3: ["小腸吸收與血液運送", "用小腸絨毛、消化／吸收差異與迷思修正整理轉運概念。"]
  }[section];
  return `
    <div class="stack checkpoint-stack">
      <section class="panel">
        <p class="eyebrow">互動關卡</p>
        <h2>${heading[0]}</h2>
        <p class="lead">${heading[1]}</p>
      </section>
      ${sections[section].map((id) => renderQuestion(questionMap[id])).join("")}
      <section class="panel action-panel">
        <p class="muted">本區每題都需留下作答紀錄；不確定可先選擇，任務後會給概念回饋。</p>
        <button class="primary" data-section-next="${section}">${section === "checkpoint3" ? "整理任務回饋" : "前往下一關"}</button>
      </section>
    </div>
  `;
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
    digestive_system_parts: "消化系統組成",
    food_path: "食物流向",
    organ_functions: "主要器官功能",
    digestion_process: "消化作用",
    enzyme_digestive_link: "酵素與消化",
    bile_not_enzyme: "膽汁不是酵素",
    small_intestine_absorption: "小腸吸收",
    absorption_transport: "吸收與血液運送",
    digestion_absorption_difference: "消化與吸收差異"
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "q01") return `<div class="evidence-card"><strong>路線與支援站資料卡</strong><p>先依「食物是否實際通過」判斷，再看是否主要分泌消化液。</p></div>`;
  if (qid === "q02") return `<div class="evidence-card"><strong>食物流向任務</strong><p>拖曳排序題。手機可使用上移／下移按鈕調整順序；消化腺不是食物一定通過的路線。</p></div>`;
  if (qid === "q06") return `<div class="evidence-card"><strong>酵素專一性資料卡</strong><p>每種酵素有較適合的作用對象；請依養分類型配對。</p></div>`;
  if (qid === "q10") return `<div class="evidence-card"><strong>小腸內壁觀察紀錄</strong><table><thead><tr><th>特徵</th><th>可支持的判讀方向</th></tr></thead><tbody><tr><td>大量絨毛狀構造</td><td>增加與養分接觸的面積</td></tr><tr><td>養分已被分解成小分子</td><td>可進一步進入體內</td></tr></tbody></table></div>`;
  if (qid === "q11") return `<div class="evidence-card"><strong>養分轉運紀錄</strong><table><thead><tr><th>紀錄階段</th><th>描述</th></tr></thead><tbody><tr><td>小腸壁</td><td>小分子養分進入體內</td></tr><tr><td>血液</td><td>將已吸收養分帶往全身</td></tr></tbody></table></div>`;
  if (qid === "q12") return `<div class="evidence-card"><strong>分解或進入體內？</strong><p>依敘述判斷是在描述食物被分解，還是小分子養分進入體內。</p></div>`;
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
        <h2>先整理你目前的養分轉運線索</h2>
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

function misconceptionText(tag) {
  return {
    tract_gland_confusion: "消化道是食物通過的路線；消化腺是分泌消化液的支援構造。",
    gland_in_food_path: "食物會通過消化道，不會直接通過肝臟或胰臟。",
    all_organs_same_function: "口腔、食道、胃、小腸和大腸負責不同步驟。",
    digestion_absorption_same: "消化是分解；吸收是小分子養分進入體內或血液。",
    enzyme_target_confusion: "消化酵素通常有較適合的作用對象。",
    bile_is_enzyme: "膽汁可幫助脂質分散，但本身不是酵素。",
    stomach_main_absorption: "胃會混合並進行部分消化，小腸才是主要吸收養分的位置。",
    food_chunk_enters_blood: "食物需先被消化成較小分子，才能被吸收並由血液運送。",
    villi_as_digestion_only: "小腸絨毛可增加吸收面積，利於養分進入體內。"
  }[tag] || tag;
}

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
    <div class="mission-layout reflection-layout">
      <section class="panel">
        <p class="eyebrow">任務回報</p>
        <h2>把想問老師的地方留下來</h2>
        <p class="lead">空白可以提交但沒有回報 EXP；具體且與本單元概念相關的問題，會取得較高回報 EXP。</p>
        <label>我最能掌握的一項概念
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：消化和吸收的差異">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認消化和吸收各發生什麼事，以及養分怎麼進入血液。">${escapeHtml(state.reflection.question)}</textarea>
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
      <aside class="panel owl-panel bq-report-assistant">
        <img src="${assets.owlReport}" alt="貓頭鷹助理提醒" onerror="this.src='../shared-assets/characters/owl-bioquest-report-reminder.webp'">
        <h3>回報方向</h3>
        <p>可以從消化道與消化腺、食物流向、器官功能、消化與吸收差異、酵素與膽汁、小腸絨毛或血液運送中選一個方向。</p>
      </aside>
    </div>
  `;
}

function renderResult() {
  const result = state.result || scoreAttempt();
  return `
    <div class="stack result-stack">
      <section class="panel result-panel">
        <p class="eyebrow">任務結算</p>
        <h2>養分轉運追蹤任務結算</h2>
        <p class="lock-note">提交後本次作答已鎖定；若要再挑戰，請重新登入並從頭完成。</p>
        <div class="exp-summary">
          <strong>${result.unit_credited_exp} / ${UNIT_EXP_CAP} EXP</strong>
          <span>本次取得：${result.attempt_exp}｜本單元認列：${result.unit_credited_exp}</span>
        </div>
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

function renderAchievements() {
  const result = state.result || scoreAttempt();
  const titleInfo = titleAndProgress(state.student, result.unit_credited_exp);
  return `
    <div class="stack achievements-stack">
      <section class="panel title-card">
        <p class="eyebrow">全冊稱號</p>
        <div class="title-card-content">
          <img src="${titleAvatarPath()}" alt="學生稱號角色" onerror="this.src='${assets.titleAvatarFallback}'">
          <div>
            <h2>${escapeHtml(titleInfo.current.title)}</h2>
            <p>${titleInfo.totalExp} EXP｜稱號進度 ${titleInfo.progressPercent}%</p>
            <p>${titleInfo.next ? `距離 ${titleInfo.next.title} 還差 ${titleInfo.remaining} EXP` : "已達最高稱號，後續 EXP 仍會累積。"}</p>
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
    <h2>本單元 13 枚徽章</h2>
    <div class="badge-wall">
      ${badges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual">
            <img src="${badge.badge_image_path}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('fallback'); this.remove();">
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
          <li>回報空白可提交但 0 EXP；具體且與人體如何獲得養分概念相關的問題才會取得回報 EXP。</li>
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
  if (typeof window !== "undefined" && window.BioQuestCharacterLayout?.enhance) window.BioQuestCharacterLayout.enhance();
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
  window.__human_nutritionTest = {
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
    renderQuestionEvidence,
    renderCheckpoint,
    renderReview,
    renderReflection,
    renderResult,
    renderAchievements
  };
}
