const units = [
  {
    title: "多彩多姿的生命世界",
    unitId: "life_world",
    status: "ready",
    sequence: 1,
    summary: "正式順序第一單元。已完成學生端靜態原型，含生命現象、生物/非生物、環境條件、EXP 與徽章。",
    tags: ["正式原型", "生命現象", "已可測試"],
    aliases: ["多采多姿的生命世界"],
    url: "prototype-life-world/?v=20260720-life-world-server-verified-v1&title=20260720-title-next-progress-v1"
  },
  {
    title: "探究自然的科學方法",
    unitId: "scientific_method",
    status: "ready",
    sequence: 2,
    summary: "正式順序第二單元。已完成學生端靜態原型，含流程排序、變因分類、資料判讀與結論修正。",
    tags: ["正式原型", "科學方法", "已可測試"],
    url: "prototype-scientific-method/?v=20260721-scientific-method-server-verified-v1&title=20260720-title-next-progress-v1"
  },
  {
    title: "進入實驗室",
    unitId: "lab_intro",
    status: "ready",
    sequence: 3,
    summary: "正式順序第三單元。已完成學生端靜態原型，含器材功能、器材選用、安全情境、操作順序與實驗紀錄。",
    tags: ["正式原型", "實驗安全", "已可測試"],
    url: "prototype-lab-entry/?v=20260721-lab-intro-server-verified-v1&title=20260720-title-next-progress-v1"
  },
  {
    title: "顯微鏡的使用",
    unitId: "microscope_use",
    status: "ready",
    sequence: 4,
    summary: "正式順序第四單元。已完成學生端靜態原型，含部位功能、低倍到高倍操作、倍率視野與搬運收納安全。",
    tags: ["正式原型", "顯微鏡", "已可測試"],
    url: "prototype-microscope-use/?v=20260721-microscope-use-server-verified-v1&title=20260720-title-next-progress-v1"
  },
  {
    title: "生物體的基本單位",
    unitId: "cell_basic_unit",
    status: "ready",
    sequence: 5,
    summary: "正式順序第五單元。已完成學生端靜態原型，含細胞基本單位、單細胞/多細胞、形狀功能與顯微證據判讀。",
    tags: ["正式原型", "細胞", "已可測試"],
    url: "prototype-cell-basic-unit/?v=20260721-cell-basic-unit-readiness-v1&title=20260720-title-next-progress-v1"
  },
  { title: "細胞的構造", unitId: "cell_structure", status: "ready", sequence: 6, summary: "已有模板驗證原型，具細胞圖、構造高亮、配對、比較、EXP 明細與徽章。", tags: ["模板驗證", "細胞構造", "已可測試"], url: "prototype-cell-structure/?v=20260715-brief-scene-unified-u1u7-v1&title=20260720-title-next-progress-v1", note: "模板驗證單元" },
  { title: "細胞的觀察", unitId: "cell_observation", status: "ready", sequence: 7, summary: "正式順序第七單元。已完成學生端靜態原型，含玻片製作、低高倍策略、顯微視野判讀、染色目的與迷思修正。", tags: ["正式原型", "顯微觀察", "已可測試"], url: "prototype-cell-observation/?v=20260717-badge-icon-cleanup-v1&title=20260720-title-next-progress-v1" },
  { title: "物質進出細胞的方式", unitId: "cell_transport", status: "ready", sequence: 8, summary: "正式順序第八單元。已完成學生端靜態原型，含擴散與滲透、半透膜、濃度方向、資料判讀與動植物細胞變化。", tags: ["正式原型", "擴散", "滲透", "已可測試"], url: "prototype-cell-transport/?v=20260717-badge-icon-cleanup-v1&title=20260720-title-next-progress-v1" },
  { title: "生物體的組成層次", unitId: "biological_organization", status: "ready", sequence: 9, summary: "正式順序第九單元。已完成學生端靜態原型，含組成層次排序、例子分類、單多細胞判斷、植物器官與動植物比較。", tags: ["正式原型", "組成層次", "排序", "植物器官", "已可測試"], url: "prototype-biological-organization/?v=20260717-badge-icon-cleanup-v1&title=20260720-title-next-progress-v1" },
  { title: "尺度", unitId: "scale", status: "ready", sequence: 10, summary: "正式順序第十單元。已完成學生端靜態原型，含尺度排序、單位配對、觀察工具、比例尺判讀、圖像與實際大小。", tags: ["正式原型", "尺度", "比例尺", "觀察工具", "已可測試"], url: "prototype-scale/?v=20260717-scale-user-review-v2&title=20260720-title-next-progress-v1" },
  { title: "食物中的養分與能量", unitId: "nutrients_energy", status: "ready", sequence: 11, summary: "正式順序第十一單元。已完成學生端靜態原型，含養分功能、主要食物來源、能量判斷、營養資料與均衡飲食。", tags: ["正式原型", "養分", "能量", "均衡飲食", "已可測試"], url: "prototype-nutrients-energy/?v=20260717-badge-icon-cleanup-v1&title=20260720-title-next-progress-v1" },
  { title: "養分檢測", unitId: "nutrient_test", status: "ready", sequence: 12, summary: "正式順序第十二單元。已完成學生端靜態原型，含澱粉與葡萄糖檢測結果判讀、試劑與養分配對、對照組、資料證據與安全判斷。", tags: ["正式原型", "養分檢測", "證據判讀", "安全", "已可測試"], url: "prototype-nutrient-test/?v=20260721-nutrient-test-brief-ratio-v1&title=20260720-title-next-progress-v1" },
  { title: "酵素", unitId: "enzymes", status: "ready", sequence: 13, summary: "正式順序第十三單元。已完成學生端靜態原型，含酵素作用、專一性、可重複作用、溫度與酸鹼值資料判讀及消化情境。", tags: ["正式原型", "酵素", "專一性", "資料判讀", "已可測試"], url: "prototype-enzymes/?v=20260720-enzymes-user-review-v2&title=20260720-title-next-progress-v1" },
  { title: "植物如何製造養分", unitId: "photosynthesis", status: "ready", sequence: 14, summary: "正式順序第十四單元。已完成學生端靜態原型，含原料/能量/產物分類、葉片構造、澱粉與氣泡證據、變因判讀及光合作用/呼吸作用迷思修正。", tags: ["正式原型", "光合作用", "葉綠體", "變因判讀", "已可測試"], url: "prototype-photosynthesis/?v=20260720-photosynthesis-badge-cache-v2&title=20260720-title-next-progress-v1" },
  { title: "人體如何獲得養分", unitId: "human_nutrition", status: "ready", sequence: 15, summary: "正式順序第十五單元。已完成學生端靜態原型，含消化道與消化腺、食物流向、消化吸收、酵素與膽汁、小腸吸收與血液運送。", tags: ["正式原型", "消化", "吸收", "食物流向", "已可測試"], url: "prototype-human-nutrition/?v=20260719-human-nutrition-qa-v1&title=20260720-title-next-progress-v1" },
  { title: "植物的運輸構造", unitId: "plant_transport_structures", status: "ready", sequence: 16, summary: "正式順序第十六單元。已完成學生端靜態原型，含根毛、維管束、木質部、韌皮部、葉脈與蒸散作用基礎判讀。", tags: ["正式原型", "植物", "維管束", "運輸", "已可測試"], url: "prototype-plant-transport-structures/?v=20260720-plant-transport-structures-extension-v2&title=20260720-title-next-progress-v1" },
  { title: "植物體內物質的運輸", unitId: "plant_material_transport", status: "ready", sequence: 17, summary: "正式順序第十七單元。已完成來源端學生原型，含水分與礦物質、葉製造養分、木質部與韌皮部、蒸散作用、氣孔與資料證據判讀。", tags: ["正式原型", "植物運輸", "木質部", "韌皮部", "後台驗證"], url: "prototype-plant-material-transport/?v=20260720-plant-material-transport-badges-v1&title=20260720-title-next-progress-v1" },
  { title: "人體心血管系統的組成", unitId: "cardiovascular_components", status: "ready", sequence: 18, summary: "正式順序第十八單元。手機優先功能原型已可測試，含心臟、血管、血液成分、脈搏血壓與合作流程排序；正式視覺素材待核准後接線。", tags: ["可測試", "心血管", "血液", "後台驗證"], url: "prototype-cardiovascular-components/?v=20260720-cardiovascular-components-brief-visible-v2&title=20260720-title-next-progress-v1" },
  { title: "人體的循環系統", unitId: "human_circulation", status: "ready", sequence: 19, summary: "正式順序第十九單元。手機優先功能原型已可測試，含體循環、肺循環、含氧量變化、微血管交換與組織液/淋巴基礎；正式場景與 4 枚徽章已接線，其餘徽章待補。", tags: ["可測試", "循環", "體循環", "肺循環", "後台驗證"], url: "prototype-human-circulation/?v=20260720-human-circulation-badges-v1&title=20260720-human-circulation-achievement-order-v3" },
  { title: "刺激與反應", unitId: "stimulus_response", status: "ready", sequence: 20, summary: "正式順序第二十單元。手機優先功能原型已可測試，含刺激/反應辨識、受器與動器、基本流程、反應時間資料判讀與公平測量。", tags: ["可測試", "刺激", "反應", "受器", "反應時間"], url: "prototype-stimulus-response/?v=20260720-stimulus-response-qa-roles-badges-v2&title=20260720-title-next-progress-v1" },
  { title: "神經系統", unitId: "nervous_system", status: "ready", sequence: 21, summary: "正式順序第二十一單元。手機優先功能原型已可測試，含神經元與神經、中樞/周圍神經、三類神經元分工、反射路徑與腦脊髓迷思修正。", tags: ["可測試", "神經", "中樞", "反射", "後台驗證"], url: "prototype-nervous-system/?v=20260718-nervous-system-ready-v1&title=20260720-title-next-progress-v1" },
  { title: "內分泌系統", unitId: "endocrine_system", status: "ready", sequence: 22, summary: "激素、腺體、血液運送、目標器官與血糖調節。", tags: ["內分泌", "激素"], url: "prototype-endocrine-system/?v=20260718-endocrine-system-ready-v1&title=20260720-title-next-progress-v1" },
  { title: "行為與感應", unitId: "behavior_sensing", status: "ready", sequence: 23, summary: "正式順序第二十三單元。手機優先功能原型已可測試，含動物行為功能、趨性、向性、植物感應運動、睡眠運動與單元邊界判讀。", tags: ["可測試", "行為", "感應", "趨性", "向性"], url: "prototype-behavior-sensing/?v=20260718-behavior-sensing-ready-v1&title=20260720-title-next-progress-v1" },
  { title: "呼吸與氣體的恆定", unitId: "respiration_homeostasis", status: "ready", sequence: 24, summary: "正式順序第二十四單元。手機優先功能原型已可測試，含呼吸與細胞利用氧氣、空氣進入肺泡路徑、肺泡氣體交換、吸氣呼氣胸腔變化與活動時氣體恆定判讀。", tags: ["可測試", "呼吸", "氣體交換", "恆定", "肺泡"], url: "prototype-respiration-homeostasis/?v=20260718-respiration-homeostasis-v1&title=20260720-title-next-progress-v1" },
  { title: "排泄與水分的恆定", unitId: "excretion_water_homeostasis", status: "ready", sequence: 25, summary: "正式順序第二十五單元。手機優先功能原型已可測試，含排泄與排遺、代謝廢物、含氮廢物、泌尿系統、尿液路徑、水分收支與資料判讀。", tags: ["可測試", "排泄", "泌尿系統", "水分恆定", "資料判讀"], url: "prototype-excretion-water-homeostasis/?v=20260718-excretion-water-homeostasis-v1&title=20260720-title-next-progress-v1" },
  { title: "體溫與血糖的恆定", unitId: "temperature_glucose_homeostasis", status: "ready", sequence: 26, summary: "正式順序第二十六單元。手機優先功能原型已可測試，含恆定、負回饋、內溫/外溫、體溫調節、流汗水分、血糖調節與資料判讀。", tags: ["可測試", "體溫", "血糖", "恆定", "負回饋"], url: "prototype-temperature-glucose-homeostasis/?v=20260718-temperature-glucose-homeostasis-v1&title=20260720-title-next-progress-v1" },
  { title: "細胞的分裂", unitId: "cell_division", status: "ready", sequence: 27, summary: "正式順序第二十七單元。手機優先功能原型已可測試，含新細胞來源、生長修補、染色體與 DNA、先複製再分配、母細胞/子細胞、根尖證據與單元邊界。", tags: ["可測試", "細胞分裂", "染色體", "生長修補", "邊界"], url: "prototype-cell-division/?v=20260718-cell-division-v1&title=20260720-title-next-progress-v1" },
  { title: "無性生殖", unitId: "asexual_reproduction", status: "ready", sequence: 28, summary: "正式順序第二十八單元。手機優先功能原型已可測試，含無性生殖定義、親代來源、後代相似、常見方式、營養繁殖流程、優點限制與 U27/U29 邊界。", tags: ["可測試", "無性生殖", "出芽", "營養繁殖", "邊界"], url: "prototype-asexual-reproduction/?v=20260718-asexual-reproduction-v1&title=20260720-title-next-progress-v1" },
  { title: "有性生殖", unitId: "sexual_reproduction", status: "ready", sequence: 29, summary: "正式順序第二十九單元。手機優先功能原型已可測試，含配子、受精、親代來源、後代差異、體內/體外受精、植物授粉與受精、無性/有性比較與 U28/U30/U31 邊界。", tags: ["可測試", "有性生殖", "配子", "受精", "邊界"], url: "prototype-sexual-reproduction/?v=20260718-sexual-reproduction-v1&title=20260720-title-next-progress-v1" },
  { title: "蛋的觀察", unitId: "egg_observation", status: "planned", sequence: 30, summary: "卵的構造、胚胎發育與觀察判讀。", tags: ["觀察", "生殖"] },
  { title: "花的觀察", unitId: "flower_observation", status: "planned", sequence: 31, summary: "花的構造、授粉、受精與果實種子形成。", tags: ["花", "植物"] },
  { title: "遺傳、染色體與基因", unitId: "genetics_chromosome_gene", status: "planned", sequence: 32, summary: "染色體、基因、性狀與遺傳基本概念。", tags: ["遺傳", "基因"] },
  { title: "人類的遺傳", unitId: "human_genetics", status: "planned", sequence: 33, summary: "人類性狀、顯隱性與家族遺傳。", tags: ["人類遺傳"] },
  { title: "人類的 ABO 血型遺傳", unitId: "abo_blood_type", status: "planned", sequence: 34, summary: "ABO 血型基因型、表現型與遺傳推論。", tags: ["血型", "遺傳"] },
  { title: "突變與遺傳疾病", unitId: "mutation_genetic_disease", status: "planned", sequence: 35, summary: "突變、遺傳疾病與環境因子影響。", tags: ["突變", "疾病"] },
  { title: "生物技術", unitId: "biotechnology", status: "planned", sequence: 36, summary: "生物技術應用、風險與生活案例。", tags: ["生物技術"] },
  { title: "化石與演化", unitId: "fossils_evolution", status: "planned", sequence: 37, summary: "化石證據、演化概念與時間尺度。", tags: ["演化", "化石"] },
  { title: "生物的命名與分類", unitId: "naming_classification", status: "planned", sequence: 38, summary: "命名、分類階層與分類依據。", tags: ["分類", "命名"] },
  { title: "檢索表的認識與應用", unitId: "dichotomous_key", status: "planned", sequence: 39, summary: "二分檢索表、特徵比較與分類推理。", tags: ["檢索表"] },
  { title: "原核、原生生物及真菌界", unitId: "prokaryotes_protists_fungi", status: "planned", sequence: 40, summary: "原核生物、原生生物、真菌特徵與例子。", tags: ["五界", "微生物"] },
  { title: "植物界", unitId: "plant_kingdom", status: "planned", sequence: 41, summary: "植物分類、維管束、種子與花的特徵。", tags: ["植物界"] },
  { title: "蕨類植物的觀察", unitId: "fern_observation", status: "planned", sequence: 42, summary: "蕨類構造、孢子囊與生活史觀察。", tags: ["蕨類", "觀察"] },
  { title: "動物界", unitId: "animal_kingdom", status: "planned", sequence: 43, summary: "動物分類、特徵比較與主要類群。", tags: ["動物界"] },
  { title: "族群、群集與演替", unitId: "population_community_succession", status: "planned", sequence: 44, summary: "族群、群集、演替與生態層次。", tags: ["生態", "演替"] },
  { title: "族群個體數的調查", unitId: "population_sampling", status: "planned", sequence: 45, summary: "樣區、捉放法、族群數量估算。", tags: ["調查", "族群"] },
  { title: "生物間的互動關係", unitId: "biotic_interactions", status: "planned", sequence: 46, summary: "捕食、競爭、共生、寄生等互動。", tags: ["互動", "生態"] },
  { title: "生態系", unitId: "ecosystem", status: "planned", sequence: 47, summary: "生產者、消費者、分解者、能量流動與物質循環。", tags: ["生態系"] },
  { title: "生態系的類型", unitId: "ecosystem_types", status: "planned", sequence: 48, summary: "陸域、水域與不同生態系特徵。", tags: ["生態系類型"] },
  { title: "生物多樣性", unitId: "biodiversity", status: "planned", sequence: 49, summary: "遺傳、物種、生態系多樣性與價值。", tags: ["多樣性"] },
  { title: "生物多樣性面臨的危機", unitId: "biodiversity_crisis", status: "planned", sequence: 50, summary: "棲地破壞、外來種、污染、過度利用與氣候變遷。", tags: ["危機", "保育"] },
  { title: "保育的落實", unitId: "conservation_actions", status: "planned", sequence: 51, summary: "保育策略、保護區、永續利用與個人行動。", tags: ["保育"] },
  { title: "環境的永續發展", unitId: "environment_sustainability", status: "planned", sequence: 52, summary: "永續發展、資源利用與環境行動。", tags: ["永續"] }
];

const statusText = {
  ready: "可測試",
  testing: "測試中",
  spec: "已備料",
  planned: "待製作"
};

const grid = document.querySelector("#unitGrid");
const searchInput = document.querySelector("#unitSearch");
const filters = [...document.querySelectorAll(".filter")];
let activeFilter = "all";

function renderUnits() {
  grid.innerHTML = units.map((unit) => {
    const tagText = unit.tags.map((tag) => `<span>${tag}</span>`).join("");
    const action = unit.url
      ? `<a class="unit-link" href="${unit.url}">開啟網頁</a>`
      : `<span class="disabled-link">尚未開放</span>`;
    return `
      <article class="unit-card ${unit.url ? "clickable" : ""}" data-status="${unit.status}" data-url="${unit.url || ""}" data-keywords="${unit.title} ${(unit.aliases || []).join(" ")} ${unit.unitId} ${unit.summary} ${unit.tags.join(" ")}" ${unit.url ? `role="link" tabindex="0" aria-label="開啟${unit.title}"` : ""}>
        <div class="unit-top">
          <div>
            <p class="unit-meta">第 ${unit.sequence} 站｜${unit.title}${unit.note ? `｜${unit.note}` : ""}</p>
            <h3>${unit.title}</h3>
          </div>
          <span class="status-pill ${unit.status}">${statusText[unit.status]}</span>
        </div>
        <p class="unit-meta">${unit.summary}</p>
        <div class="unit-tags">${tagText}</div>
        <div class="unit-actions">${action}</div>
      </article>
    `;
  }).join("");
  updateStats();
  applyFilters();
}

function updateStats() {
  document.querySelector("#readyCount").textContent = units.filter((unit) => unit.status === "ready").length;
  const testingCount = document.querySelector("#testingCount");
  if (testingCount) testingCount.textContent = units.filter((unit) => unit.status === "testing").length;
  document.querySelector("#specCount").textContent = units.filter((unit) => unit.status === "spec").length;
  document.querySelector("#plannedCount").textContent = units.filter((unit) => unit.status === "planned").length;
}

function applyFilters() {
  const keyword = searchInput.value.trim().toLowerCase();
  document.querySelectorAll(".unit-card").forEach((card) => {
    const statusMatched = activeFilter === "all" || card.dataset.status === activeFilter;
    const keywordMatched = !keyword || card.dataset.keywords.toLowerCase().includes(keyword);
    card.classList.toggle("hidden", !(statusMatched && keywordMatched));
  });
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);

document.addEventListener("click", (event) => {
  const card = event.target.closest(".unit-card.clickable");
  if (!card || event.target.closest("a, button, input")) return;
  window.location.href = card.dataset.url;
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".unit-card.clickable");
  if (!card) return;
  event.preventDefault();
  window.location.href = card.dataset.url;
});

renderUnits();
