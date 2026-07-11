(function initBioQuestTitleProgress(global) {
  const titleProgressCap = 23400;
  const fullBookExpMax = 26000;
  const levels = [
    { id: "trainee_investigator", order: "01", need: 0, title: "見習調查員" },
    { id: "life_observer", order: "02", need: 1400, title: "生命觀察員" },
    { id: "ecology_recorder", order: "03", need: 3000, title: "生態記錄員" },
    { id: "concept_solver", order: "04", need: 5900, title: "概念解謎者" },
    { id: "micro_explorer", order: "05", need: 8900, title: "微觀探索者" },
    { id: "systems_investigator", order: "06", need: 12600, title: "系統調查員" },
    { id: "life_researcher", order: "07", need: 16100, title: "生命研究員" },
    { id: "bioquest_expert", order: "08", need: 19900, title: "BioQuest 專家" },
    { id: "bioquest_guardian", order: "09", need: 23400, title: "生命祕境守護者" }
  ];

  function normalizeExp(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  function progressPercent(totalExp) {
    return Math.min(100, (normalizeExp(totalExp) / titleProgressCap) * 100);
  }

  function getTitleForExp(totalExp) {
    const exp = normalizeExp(totalExp);
    const currentIndex = levels.reduce((index, item, itemIndex) => exp >= item.need ? itemIndex : index, 0);
    const current = levels[currentIndex];
    const next = levels[currentIndex + 1];
    return next
      ? {
          id: current.id,
          current: current.title,
          next_id: next.id,
          next: next.title,
          need: next.need,
          remaining: Math.max(0, next.need - exp),
          title_progress_percent: progressPercent(exp)
        }
      : {
          id: current.id,
          current: current.title,
          next_id: current.id,
          next: "已達目前最高稱號",
          need: current.need,
          remaining: 0,
          title_progress_percent: 100
        };
  }

  global.BioQuestTitleProgress = Object.freeze({
    titleProgressCap,
    fullBookExpMax,
    levels: levels.map((level) => Object.freeze({ ...level })),
    progressPercent,
    getTitleForExp
  });
})(window);
