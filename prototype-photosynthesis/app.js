const roster = {
  guest: { student_id: "guest", class_name: "測試", seat_no: "00", student_name: "老師測試帳號", is_guest: true }
};

const BACKEND_URL = window.BioQuestBackend?.url || "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
const VERSION = "20260712-photosynthesis-v1";
const UNIT_EXP_CAP = 500;
const DIRECT_EXP_POOL = 220;
const REVISION_EXP_POOL = 180;
const storageKey = "bioquest_photosynthesis_state_v1";
const attemptsKey = "bioquest_attempts_v1";
const pendingQueueKey = "bioquest_pending_backend_queue_v1";
const screen = typeof document !== "undefined" ? document.querySelector("#screen") : null;
const navButtons = typeof document !== "undefined" ? [...document.querySelectorAll("[data-nav]")] : [];
const studentMini = typeof document !== "undefined" ? document.querySelector("#studentMini") : null;
const LOCK_MESSAGE = "本次任務已提交，作答結果已鎖定；若要再挑戰，請重新登入並從頭完成。";
const LOCKED_SCREENS_AFTER_SUBMIT = new Set(["brief", "scan", "checkpoint1", "checkpoint2", "checkpoint3", "review", "reflection"]);

const mission = {
  unit_id: "photosynthesis",
  unit_title: "植物如何製造養分",
  mission_title: "綠葉養分製造任務",
  mission_area: "綠葉能量研究站"
};

const assets = {
  mentorFallback: "../shared-assets/mentor-feedback/mentor-feedback-stable.webp",
  owlLogin: "../prototype-cell-basic-unit/assets/owl-basic-unit-micro-guide.webp",
  owlPrep: "assets/owl-photosynthesis-prep-reminder.webp",
  owlReport: "assets/owl-photosynthesis-report-reminder.webp",
  owlResult: "assets/owl-photosynthesis-result.webp",
  titleAvatarFallback: "../shared-assets/title-avatars/title-01-trainee_investigator-male.webp",
  briefingSceneHook: "assets/bg-photosynthesis-briefing-azhe-wide.webp",
  briefingSceneMobileHook: "assets/bg-photosynthesis-briefing-azhe-mobile",
  ambientBackgroundHook: "assets/bg-photosynthesis-entry-wide.webp",
  questionLeafStructure: "assets/img-photosynthesis-leaf-structure.webp",
  questionStarchEvidence: "assets/img-photosynthesis-starch-evidence.webp",
  questionLightShade: "assets/img-photosynthesis-light-shade.webp",
  questionBubbles: "assets/img-photosynthesis-aquatic-bubbles.webp",
  questionVariableControl: "assets/img-photosynthesis-variable-control.webp"
};

const badgeAsset = (id) => `../shared-assets/badges/photosynthesis/badge-photosynthesis-${id}.webp`;
const reflectionRules = {
  conceptTerms: ["光合作用", "二氧化碳", "水", "光", "光能", "葡萄糖", "養分", "氧氣", "葉綠體", "葉片", "氣孔", "葉脈", "澱粉", "碘液", "氣泡", "變因", "對照", "控制變因", "呼吸作用"],
  irrelevantTerms: ["老師好帥", "帥", "下課", "遊戲", "天氣", "好笑", "午餐", "放假"],
  lowEffortTerms: ["不知道", "沒有", "不會", "好難", "看不懂", "都不懂", "我會了", "沒問題", "不知道怎麼問"],
  copiedDirections: ["光合作用的原料、能量來源與產物", "葉綠體和綠色部位的關係", "氣孔、葉脈、葉肉細胞與光合作用", "碘液檢測澱粉如何作為光合作用證據", "水生植物氣泡資料如何判讀", "光照、二氧化碳或水分變因如何影響光合作用", "光合作用和呼吸作用的差異"]
};

const badges = [
  { id: "photosynthesis_entry", name: "綠葉任務入門徽章", condition: "完成綠葉養分製造任務。" },
  { id: "photosynthesis_overview_mapper", name: "光合作用總覽徽章", condition: "能掌握光合作用整體概念與植物養分來源。" },
  { id: "reactants_energy_classifier", name: "原料能量分類徽章", condition: "能分類二氧化碳、水、光、葡萄糖與氧氣角色。" },
  { id: "chloroplast_site_locator", name: "葉綠體場所徽章", condition: "能判斷葉綠體與綠色部位的關係。" },
  { id: "leaf_structure_connector", name: "葉片構造連結徽章", condition: "能配對氣孔、葉脈與葉綠體功能。" },
  { id: "products_evidence_reader", name: "產物證據判讀徽章", condition: "能判讀氧氣氣泡與澱粉證據。" },
  { id: "variable_evidence_interpreter", name: "變因證據判讀徽章", condition: "能用變因、對照與資料形成結論。" },
  { id: "photosynthesis_boundary_reviser", name: "光合迷思修正徽章", condition: "提示後能修正光合作用常見迷思。" },
  { id: "photosynthesis_flawless", name: "光合作用零提示全對徽章", condition: "全部答對且全程未使用提示。" },
  { id: "photosynthesis_reflection_reporter", name: "高品質光合回報徽章", condition: "回報品質達 discussion_question。" },
  { id: "retry_growth_photosynthesis", name: "再探光合作用進步徽章", condition: "再挑戰完整完成且正確率進步。" }
].map((badge) => ({ ...badge, badge_image_path: badgeAsset(badge.id), image_status: "pending" }));

const sequenceSteps = [
  { id: "research_question", label: "確認研究問題" },
  { id: "changed_condition", label: "找出被改變的條件" },
  { id: "controlled_conditions", label: "確認其他條件是否盡量相同" },
  { id: "compare_evidence", label: "比較澱粉或氧氣等結果證據" },
  { id: "data_conclusion", label: "用資料形成結論" }
];
const correctSequence = ["research_question", "changed_condition", "controlled_conditions", "compare_evidence", "data_conclusion"];

const questions = [
  { id: "q01", section: "checkpoint1", concept: "photosynthesis_overview", type: "choice", answer: "photosynthesis", prompt: "綠色植物在有光時，能利用二氧化碳和水製造葡萄糖等養分，並釋放氧氣。這描述的是哪一種作用？", hint: "留意題目中同時出現光、二氧化碳、水、養分與氧氣。", misconception: "soil_as_food_source", options: [{ id: "photosynthesis", text: "光合作用" }, { id: "diffusion", text: "擴散作用" }, { id: "nutrient_test", text: "養分檢測" }, { id: "water_only", text: "單純吸水" }] },
  { id: "q02", section: "checkpoint1", concept: "reactants_energy", type: "mapping", prompt: "請將光合作用相關項目分類。", hint: "先分辨哪些是被用來製造養分的物質，哪些是提供能量，哪些是產生的結果。", misconception: "light_as_reactant", items: [{ id: "carbon_dioxide", label: "二氧化碳" }, { id: "water", label: "水" }, { id: "light", label: "光" }, { id: "glucose", label: "葡萄糖" }, { id: "oxygen", label: "氧氣" }], choices: [{ id: "reactant", text: "原料" }, { id: "energy", text: "能量來源" }, { id: "product", text: "產物" }], answer: { carbon_dioxide: "reactant", water: "reactant", light: "energy", glucose: "product", oxygen: "product" } },
  { id: "q03", section: "checkpoint1", concept: "chloroplast_site", type: "choice", answer: "chloroplast", prompt: "葉片中哪一種構造最直接和光合作用進行有關？", hint: "想想哪個構造常出現在綠色植物細胞中，並和吸收光能製造養分有關。", misconception: "all_cells_photosynthesize", options: [{ id: "chloroplast", text: "葉綠體" }, { id: "cell_wall", text: "細胞壁" }, { id: "vacuole", text: "液胞" }, { id: "nuclear_membrane", text: "細胞核外膜" }] },
  { id: "q04", section: "checkpoint1", concept: "reactants_energy", type: "choice", answer: "energy_not_reactant", prompt: "有同學說：「光是光合作用的原料之一。」哪個修正較合理？", hint: "先把「能量來源」和「被用來製造產物的物質」分開看。", misconception: "light_as_reactant", options: [{ id: "energy_not_reactant", text: "光提供能量，二氧化碳和水才是主要物質原料" }, { id: "light_to_oxygen", text: "光會變成氧氣" }, { id: "light_food", text: "光是植物吸收的養分" }, { id: "no_light_needed", text: "沒有光也一定能大量製造養分" }] },
  { id: "q05", section: "checkpoint2", concept: "leaf_structure_support", type: "mapping", prompt: "請將葉片構造與較主要的功能配對。", hint: "先想氣體從哪裡進出、物質怎麼運送、哪裡能利用光製造養分。", misconception: "leaf_structure_confusion", items: [{ id: "stomata", label: "氣孔" }, { id: "vein", label: "葉脈" }, { id: "chloroplast_in_leaf", label: "葉肉細胞中的葉綠體" }], choices: [{ id: "gas_exchange", text: "與二氧化碳、氧氣等氣體進出有關" }, { id: "transport", text: "協助運送水分與養分" }, { id: "site", text: "進行光合作用的重要場所" }], answer: { stomata: "gas_exchange", vein: "transport", chloroplast_in_leaf: "site" } },
  { id: "q06", section: "checkpoint2", concept: "products", type: "choice", answer: "oxygen", prompt: "水生植物在強光下產生較多氣泡。若其他條件相近，這些氣泡常被用來作為哪一種產物的線索？", hint: "想想光合作用除了製造葡萄糖等養分，還會釋放哪一種氣體。", misconception: "oxygen_as_reactant", options: [{ id: "oxygen", text: "氧氣" }, { id: "starch", text: "澱粉" }, { id: "minerals", text: "土壤礦物質" }, { id: "protein", text: "蛋白質" }] },
  { id: "q07", section: "checkpoint2", concept: "chloroplast_site", type: "choice", answer: "green_cells", prompt: "有同學說：「植物身上每一個細胞都一定能行光合作用。」哪個修正較合理？", hint: "回想葉綠體和綠色部位的線索，並想想根部或非綠色組織是否都一樣。", misconception: "all_cells_photosynthesize", options: [{ id: "green_cells", text: "光合作用主要在含葉綠體的綠色細胞中進行，不是每個植物細胞都一定能進行" }, { id: "all_roots", text: "所有根細胞都有大量葉綠體" }, { id: "animals_only", text: "只有動物細胞能行光合作用" }, { id: "cell_wall_site", text: "細胞壁就是光合作用場所" }] },
  { id: "q08", section: "checkpoint2", concept: "photosynthesis_overview", type: "choice", answer: "soil_water_minerals_food_made", prompt: "有同學說：「植物的養分主要都是從土壤直接吸收來的。」哪個修正較合理？", hint: "不要把「吸收水和礦物質」和「製造有機養分」混成同一件事。", misconception: "soil_as_food_source", options: [{ id: "soil_water_minerals_food_made", text: "植物會從土壤吸收水和礦物質，也能用光合作用製造葡萄糖等養分" }, { id: "no_water", text: "植物完全不需要水" }, { id: "soil_glucose", text: "土壤直接提供所有葡萄糖" }, { id: "oxygen_food", text: "植物只靠氧氣製造養分" }] },
  { id: "q09", section: "checkpoint3", concept: "variable_evidence", type: "sequence", prompt: "判讀一組光合作用變因資料時，請拖曳排序卡，排出較合理的思考流程。", hint: "先看實驗想問什麼，再找改變的條件；確認公平比較後，才用結果證據形成結論。", misconception: "no_control_variable", steps: sequenceSteps, answer: correctSequence },
  { id: "q10", section: "checkpoint3", concept: "starch_evidence", type: "choice", answer: "light_starch", prompt: "同一片葉子一半照光、一半遮光，之後用碘液檢測。照光處呈藍黑色，遮光處沒有明顯藍黑色。哪個解讀較合理？", hint: "先連結碘液和澱粉，再比較照光與遮光兩部分的差異。", misconception: "starch_test_overread", evidence: "starch", options: [{ id: "light_starch", text: "光照有助於葉片產生並累積澱粉證據" }, { id: "shade_oxygen", text: "遮光處產生最多氧氣" }, { id: "iodine_co2", text: "碘液可直接測出二氧化碳" }, { id: "same", text: "照光和遮光結果完全相同" }] },
  { id: "q11", section: "checkpoint3", concept: "variable_evidence", type: "choice", answer: "strong_light_more_bubbles", prompt: "某水生植物在弱光下每分鐘約 2 個氣泡，在較強光下每分鐘約 10 個氣泡。若其他條件相近，較合理的推論是什麼？", hint: "比較兩個光照條件下的氣泡數，並想想氣泡常作為哪種產物的線索。", misconception: "no_control_variable", evidence: "bubbles", options: [{ id: "strong_light_more_bubbles", text: "光照增強時，光合作用產生氧氣的速率可能增加" }, { id: "weak_none", text: "弱光一定沒有任何生命活動" }, { id: "no_relation", text: "氣泡數和光合作用無關" }, { id: "water_glucose", text: "強光一定代表水變成葡萄糖" }] },
  { id: "q12", section: "checkpoint3", concept: "variable_evidence", type: "set", answer: ["light_time", "plant_type_size", "water_amount", "temperature"], prompt: "若要檢查二氧化碳是否影響光合作用，哪些條件應盡量保持相同，才比較能判斷二氧化碳的影響？", hint: "題目想看二氧化碳的影響，因此除了二氧化碳以外，其他可能影響結果的條件要盡量相同。", misconception: "no_control_variable", options: [{ id: "light_time", text: "光照時間" }, { id: "plant_type_size", text: "植物種類與大小" }, { id: "water_amount", text: "水量" }, { id: "temperature", text: "溫度" }, { id: "co2_supply", text: "二氧化碳供應量" }, { id: "container_color", text: "容器顏色隨意改變" }] },
  { id: "q13", section: "checkpoint3", concept: "photosynthesis_respiration_boundary", type: "choice", answer: "plants_respire_too", prompt: "有同學說：「植物白天行光合作用，所以植物不需要呼吸作用。」哪個修正較合理？", hint: "先分辨「製造養分」和「利用養分取得能量」是不是同一件事。", misconception: "plants_do_not_respire", options: [{ id: "plants_respire_too", text: "植物會行光合作用製造養分，也會進行呼吸作用利用養分釋放能量" }, { id: "night_only_alive", text: "植物只有夜晚才活著" }, { id: "no_energy", text: "植物完全不需要能量" }, { id: "chloroplast_respiration", text: "呼吸作用只會發生在葉綠體" }] },
  { id: "q14", section: "checkpoint3", concept: "products", type: "choice", answer: "oxygen_product", prompt: "有同學說：「氧氣是光合作用的原料，植物會把氧氣變成葡萄糖。」哪個修正較合理？", hint: "回到原料和產物的分類，想想哪個氣體進入、哪個氣體常被釋放。", misconception: "oxygen_as_reactant", options: [{ id: "oxygen_product", text: "氧氣是光合作用的產物之一；二氧化碳和水才是主要物質原料" }, { id: "oxygen_reactant", text: "氧氣是主要原料" }, { id: "glucose_sunlight", text: "葡萄糖會直接變成陽光" }, { id: "water_unrelated", text: "水不是光合作用相關物質" }] }
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
    question_version: "20260712-photosynthesis-v1",
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
  const attemptId = uid("photosynthesis_guest_attempt");
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
  if (useGuest || studentId === "guest") {
    beginLocalAttempt(roster.guest);
    renderApp();
    return;
  }
  try {
    if (message) message.textContent = "正在連線 Google Sheet 後台確認學生資料...";
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
  earned.push("photosynthesis_entry");
  if (passed(["q01", "q04", "q08"])) earned.push("photosynthesis_overview_mapper");
  if (passed(["q02", "q04", "q14"])) earned.push("reactants_energy_classifier");
  if (passed(["q03", "q07"])) earned.push("chloroplast_site_locator");
  if (passed(["q05"])) earned.push("leaf_structure_connector");
  if (passed(["q06", "q10", "q11", "q14"])) earned.push("products_evidence_reader");
  if (passed(["q09", "q10", "q11", "q12"])) earned.push("variable_evidence_interpreter");
  if (correctedCore) earned.push("photosynthesis_boundary_reviser");
  if (flawless) earned.push("photosynthesis_flawless");
  if (reflection.reflection_quality === "discussion_question") earned.push("photosynthesis_reflection_reporter");
  if (retryExp > 0) earned.push("retry_growth_photosynthesis");
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
        <div class="brief-scene photosynthesis-brief-scene" data-asset-hook="${assets.briefingSceneHook}" data-mobile-hook="${assets.briefingSceneMobileHook}">
          <div class="scene-copy">
            <p class="eyebrow">${mission.mission_area}</p>
            <h2>${mission.mission_title}</h2>
            <p>綠葉能量研究站正在比較葉片在光下累積養分的證據。請協助追蹤原料、能量、產物與資料線索。</p>
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
        <h2>進入綠葉能量研究站前，先抓住四個判斷線索</h2>
        <div class="prep-owl-hero">
          <img src="${assets.owlPrep}" alt="貓頭鷹助理提醒" onerror="this.style.display='none'">
          <div>
            <h3>光合作用不是背公式，而是追蹤原料、能量、產物和證據。</h3>
            <p>遇到資料題時，先確認改變條件，再比較澱粉或氣泡等結果。</p>
          </div>
        </div>
        <div class="concept-grid">
          <article><strong>原料</strong><p>二氧化碳與水是主要物質原料。</p></article>
          <article><strong>能量</strong><p>光提供能量，但不是物質原料。</p></article>
          <article><strong>場所</strong><p>主要在含葉綠體的綠色細胞中進行。</p></article>
          <article><strong>證據</strong><p>澱粉檢測與氧氣氣泡都要搭配對照條件判讀。</p></article>
        </div>
        <button class="primary" data-next="checkpoint1">開始光合作用基礎</button>
      </section>
    </div>
  `;
}

function renderCheckpoint(section) {
  const heading = {
    checkpoint1: ["光合作用基礎", "先整理光、二氧化碳、水、養分、氧氣與葉綠體。"],
    checkpoint2: ["葉片構造與產物", "把葉片功能、氣泡與植物養分來源迷思串起來。"],
    checkpoint3: ["證據與變因判讀", "用拖曳排序、資料表與控制變因判斷光合作用證據。"]
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
    photosynthesis_overview: "光合作用概念",
    reactants_energy: "原料、能量與產物",
    chloroplast_site: "葉綠體場所",
    leaf_structure_support: "葉片構造",
    products: "產物與證據",
    variable_evidence: "變因與資料",
    starch_evidence: "澱粉證據",
    photosynthesis_respiration_boundary: "光合作用與呼吸作用"
  }[concept] || concept;
}

function renderQuestionEvidence(qid) {
  if (qid === "q05") {
    return `<figure class="question-asset"><img src="${assets.questionLeafStructure}" alt="葉片構造示意圖" onerror="this.closest('figure').classList.add('asset-fallback'); this.remove();"><figcaption>葉片構造觀察圖。請依構造功能配對，不只看位置。</figcaption></figure>`;
  }
  if (qid === "q10") {
    return `<figure class="question-asset"><img src="${assets.questionLightShade}" alt="同一葉片不同光照區域示意圖" onerror="this.closest('figure').classList.add('asset-fallback'); this.remove();"><figcaption>同一片葉子的兩個區域比較。</figcaption></figure><div class="evidence-card"><strong>遮光葉片紀錄</strong><table><thead><tr><th>區域</th><th>光照</th><th>碘液結果</th></tr></thead><tbody><tr><td>A</td><td>照光</td><td>呈藍黑色</td></tr><tr><td>B</td><td>遮光</td><td>沒有明顯藍黑色</td></tr></tbody></table></div>`;
  }
  if (qid === "q11") {
    return `<figure class="question-asset"><img src="${assets.questionBubbles}" alt="水生植物氣泡觀察圖" onerror="this.closest('figure').classList.add('asset-fallback'); this.remove();"><figcaption>水生植物氣泡觀察。請搭配數據比較。</figcaption></figure><div class="evidence-card"><strong>水生植物氣泡紀錄</strong><table><thead><tr><th>條件</th><th>每分鐘氣泡數</th></tr></thead><tbody><tr><td>弱光</td><td>約 2 個</td></tr><tr><td>較強光</td><td>約 10 個</td></tr></tbody></table></div>`;
  }
  if (qid === "q12") {
    return `<figure class="question-asset"><img src="${assets.questionVariableControl}" alt="光合作用變因比較示意圖" onerror="this.closest('figure').classList.add('asset-fallback'); this.remove();"><figcaption>變因比較示意圖。請判斷哪些條件應保持相同。</figcaption></figure><div class="multi-note">可複選。先選出所有應保持相同的條件，再按「確認這組答案」。</div>`;
  }
  if (qid === "q09") {
    return `<figure class="question-asset"><img src="${assets.questionStarchEvidence}" alt="光合作用證據觀察紀錄圖" onerror="this.closest('figure').classList.add('asset-fallback'); this.remove();"><figcaption>證據觀察紀錄。排序重點是判讀流程，不是背步驟號碼。</figcaption></figure><div class="multi-note">拖曳排序題。手機可用上移／下移按鈕調整順序。</div>`;
  }
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
        <h2>先整理你目前的光合作用線索</h2>
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
    soil_as_food_source: "植物會從土壤吸收水和礦物質，但葡萄糖等養分可由光合作用製造。",
    light_as_reactant: "光提供能量；二氧化碳和水才是主要物質原料。",
    oxygen_as_reactant: "二氧化碳是主要氣體原料，氧氣是光合作用產物之一。",
    all_cells_photosynthesize: "光合作用主要在含葉綠體的綠色細胞中進行。",
    leaf_structure_confusion: "氣孔與氣體進出有關，葉脈協助運送，葉綠體和製造養分有關。",
    starch_test_overread: "碘液可支持澱粉存在，需搭配光照或對照條件判斷。",
    no_control_variable: "判讀實驗要找改變條件、控制條件與結果差異。",
    plants_do_not_respire: "植物能製造養分，也需要利用養分取得能量。"
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
          <input id="confidentConcept" type="text" value="${escapeHtml(state.reflection.confident)}" placeholder="例如：光是能量來源">
        </label>
        <label>我想上課請老師說明的部分
          <textarea id="studentQuestion" rows="5" placeholder="例如：我想確認碘液變藍黑色能支持哪些結論，不能過度推論哪些事。">${escapeHtml(state.reflection.question)}</textarea>
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
        <p>可以從原料與產物、葉綠體、葉片構造、澱粉證據、氣泡資料、變因判讀、光合作用與呼吸作用中選一個方向。</p>
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
        <h2>綠葉養分製造任務結算</h2>
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
    <h2>本單元 11 枚徽章</h2>
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
          <li>回報空白可提交但 0 EXP；具體且與光合作用概念相關的問題才會取得回報 EXP。</li>
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
  window.__photosynthesisTest = {
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
