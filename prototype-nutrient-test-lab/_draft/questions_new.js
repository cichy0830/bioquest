const questions = [
  { id: "q02", section: "checkpoint1", concept: "starch_iodine_test", answer: "starch_possible", prompt: "實驗中，甲試管的樣品滴入碘液後變成藍黑色。這個結果表示什麼？", hint: "回想課本：碘液遇到哪一種養分會變成藍黑色？", misconception: "iodine_benedict_confusion", lab: { sample: "A", show: ["iodine"] }, options: [{ id: "starch_possible", text: "甲樣品含有澱粉" }, { id: "glucose_certain", text: "甲樣品一定含有葡萄糖" }, { id: "all_absent", text: "甲樣品除了澱粉，不含其他任何養分" }, { id: "all_test", text: "碘液可以檢驗出所有的養分" }] },
  { id: "q03", section: "checkpoint1", concept: "glucose_benedict_test", answer: "glucose_possible", prompt: "乙試管的樣品加入本氏液並隔水加熱後，由藍色變成橙紅色。這個結果表示什麼？", hint: "本氏液是用來檢驗哪一種養分的試劑？", misconception: "benedict_no_heat", lab: { sample: "B", show: ["benedictCold", "benedictHot"] }, options: [{ id: "glucose_possible", text: "乙樣品含有葡萄糖" }, { id: "starch_certain", text: "乙樣品一定含有澱粉" }, { id: "no_nutrients", text: "乙樣品沒有葡萄糖以外的任何養分" }, { id: "all_nutrients", text: "只要顏色有變，就表示各種養分都很多" }] },
  { id: "q06", section: "checkpoint2", concept: "color_change_evidence", answer: "starch_not_supported", prompt: "丙試管的樣品滴入碘液後，沒有變成藍黑色。下列哪一個說法最合理？", hint: "碘液只能檢驗哪一種養分？沒有變色，能說明的範圍有多大？", misconception: "no_change_no_nutrients", lab: { sample: "C", show: ["iodine"] }, options: [{ id: "starch_not_supported", text: "丙樣品沒有驗出澱粉，但不能因此說它沒有任何養分" }, { id: "no_nutrients", text: "丙樣品完全沒有任何養分" }, { id: "glucose_large", text: "丙樣品一定含有大量葡萄糖" }, { id: "all_test", text: "碘液可以檢驗出所有的養分" }] },
  { id: "q07", section: "checkpoint2", concept: "evidence_limit", answer: "starch_supported_glucose_not_supported", prompt: "整理甲試管的兩項結果：滴入碘液變成藍黑色；加入本氏液隔水加熱後仍是藍色。哪一個結論最合理？", hint: "一次只看一種試劑：碘液的結果說明了什麼？本氏液的結果又說明了什麼？", misconception: "color_all_nutrients", lab: { sample: "A", show: ["iodine", "benedictHot"] }, options: [{ id: "starch_supported_glucose_not_supported", text: "甲樣品含有澱粉，但沒有驗出葡萄糖" }, { id: "all_nutrients", text: "甲樣品含有所有的養分" }, { id: "starch_means_glucose", text: "有澱粉就一定也有葡萄糖" }, { id: "none", text: "本氏液仍是藍色，表示甲樣品沒有任何養分" }] },
  { id: "q08", section: "checkpoint2", concept: "starch_iodine_test", answer: "iodine_starch", prompt: "想知道麵粉水中有沒有澱粉，最適合用哪一種方法檢驗？", hint: "要找的是澱粉，哪一種試劑專門用來檢驗澱粉？", misconception: "iodine_benedict_confusion", options: [{ id: "iodine_starch", text: "滴入碘液，觀察是否變成藍黑色" }, { id: "appearance", text: "看麵粉水是不是白色的" }, { id: "benedict_without_context", text: "滴入本氏液，不加熱直接看顏色" }, { id: "smell", text: "聞聞看有沒有味道" }] },
  { id: "q11", section: "checkpoint3", concept: "control_group", answer: "comparison_basis", prompt: "實驗中，丁試管裝的是清水，也和其他試管做了一樣的檢驗。加入清水這一組，主要目的是什麼？", hint: "如果沒有清水那一管，你怎麼知道其他試管的顏色「有變」還是「沒變」？", misconception: "control_unnecessary", lab: { sample: "D", show: ["iodine", "benedictHot"] }, options: [{ id: "comparison_basis", text: "作為比較的基準，幫助判斷其他試管的顏色有沒有改變" }, { id: "more_steps", text: "讓實驗看起來步驟比較多" }, { id: "replace_unknown", text: "用清水代替未知樣品" }, { id: "all_positive", text: "讓所有試管都變色" }] },
  { id: "q12", section: "checkpoint3", concept: "control_group", answer: "positive_negative", prompt: "如果要確認碘液變成藍黑色真的是因為澱粉，下列哪一種比較方式最合理？", hint: "想一想：需要一個「一定有澱粉」和一個「一定沒有澱粉」的樣品來比較嗎？", misconception: "control_unnecessary", options: [{ id: "positive_negative", text: "同時檢驗已知含澱粉的樣品和清水，再和未知樣品比較" }, { id: "one_unknown", text: "只檢驗未知樣品一次就好" }, { id: "mix_all", text: "把所有樣品倒在一起檢驗" }, { id: "no_record", text: "不用記錄滴入碘液前的顏色" }] },
  { id: "q13", section: "checkpoint2", concept: "evidence_limit", answer: "target_limit", prompt: "有同學說：「滴入試劑後顏色變得越深，就表示這個食物的各種養分都越多。」哪一個修正最合理？", hint: "每一種試劑只能檢驗哪些養分？", misconception: "color_all_nutrients", options: [{ id: "target_limit", text: "每種試劑只能檢驗特定的養分，顏色不能代表各種養分的多少" }, { id: "glucose_deeper", text: "顏色越深，一定表示葡萄糖越多" }, { id: "no_control", text: "只要顏色夠深，就不需要清水對照" }, { id: "same_meaning", text: "每一種試劑的顏色變化，意思都一樣" }] },
  { id: "q14", section: "checkpoint3", concept: "glucose_benedict_test", answer: "heat_required", prompt: "有同學說：「本氏液加進樣品後，馬上看顏色就能判斷有沒有葡萄糖，不用加熱。」哪一個修正最合理？", hint: "回想實驗台：乙試管剛加入本氏液時是什麼顏色？隔水加熱後呢？", misconception: "benedict_no_heat", lab: { sample: "B", show: ["benedictCold", "benedictHot"] }, options: [{ id: "heat_required", text: "本氏液要隔水加熱後，才能由顏色變化判斷有沒有葡萄糖" }, { id: "iodine_target", text: "本氏液是用來檢驗澱粉的" }, { id: "all_positive", text: "加熱會讓所有樣品都變色" }, { id: "all_test", text: "本氏液可以檢驗所有的養分" }] }
];

const multiSelectQuestions = {
  q10: {
    prompt: "用本氏液隔水加熱時，下列哪些做法是正確的？",
    concept: "benedict_safety",
    hint: "想想加熱時可能發生的危險：液體噴出來、燙傷。",
    misconception: "unsafe_heating",
    options: [{ id: "goggles", text: "戴上護目鏡" }, { id: "away", text: "試管口不要朝向自己或別人" }, { id: "hot", text: "不要直接用手碰加熱後的試管" }, { id: "teacher_safe_method", text: "依照老師指示的方法隔水加熱" }, { id: "toward_people", text: "把試管口對著同學，方便他觀察" }, { id: "smell", text: "把鼻子靠近試管口聞氣味" }],
    answers: ["goggles", "away", "hot", "teacher_safe_method"]
  }
};

const classifyQuestions = {
  q01: {
    prompt: "請將檢驗試劑與它可以檢驗出的養分配對。",
    hint: "回到實驗台的紀錄表：麵粉水對哪一種試劑有反應？葡萄糖水呢？",
    misconception: "iodine_benedict_confusion",
    options: [{ id: "starch", label: "澱粉" }, { id: "glucose", label: "葡萄糖" }],
    items: [{ id: "iodine", label: "碘液", answer: "starch" }, { id: "benedict", label: "本氏液", answer: "glucose" }]
  }
};
