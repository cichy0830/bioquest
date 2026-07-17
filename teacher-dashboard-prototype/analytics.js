(function initBioQuestTeacherAnalytics(global) {
  "use strict";

  const GUIDANCE = {
    cell_as_basic_unit: ["細胞是構造與功能基本單位", "用單細胞生物能完成生命現象的例子，連結細胞的構造與功能。"],
    microscope_cell_evidence: ["顯微觀察是細胞概念的證據", "先請學生描述看見的排列與構造，再判斷材料與層級。"],
    organisms_made_of_cells: ["生物體由細胞組成", "將微生物、動物與植物並列，避免把細胞組成侷限在動植物。"],
    unicellular_multicellular: ["單細胞與多細胞", "以草履蟲和人類對照，強調一個細胞也能構成完整個體。"],
    cell_shape_function: ["細胞形狀與功能相關", "讓學生先由形狀推測運輸、收縮或傳訊功能，再回到細胞例子。"],
    scale_levels: ["生物尺度排序", "把所有量值換成同一單位，再逐段比較相鄰物件。"],
    length_units: ["長度單位與換算", "先建立公尺、毫米、微米的大小軸，再進行換算。"],
    unit_choice: ["依尺度選擇單位", "比較同一物件用不同單位表示時，哪一種數字最容易閱讀。"],
    observation_tools: ["依目的選擇觀察工具", "用教室、葉片與細胞三種尺度比較直尺、放大鏡與顯微鏡。"],
    microscopic_scale: ["微觀尺度", "把細胞尺度與生活物件並列，連結微米與顯微鏡。"],
    scale_bar_reading: ["顯微影像比例尺判讀", "先讀一段比例尺代表的實際長度，再估算物體跨過幾段。"],
    image_actual_size: ["影像大小與實際大小", "對照同一影像在不同螢幕尺寸下的顯示，強調實際大小需看比例尺或倍率。"],
    magnification_reasoning: ["倍率與實際大小", "用影像長度除以倍率估算實物，並說明放大的是影像。"],
    nutrient_types: ["養分類型與功能", "先區分食物與養分，再用功能分類六大養分。"],
    energy_sources: ["提供能量的養分", "比較醣類、脂質與蛋白質的角色，避免只把醣類視為能量來源。"],
    food_nutrient_mix: ["食物通常含多種養分", "用營養標示或同一食物的多項成分，打破一種食物只有一種養分的想法。"],
    balanced_diet: ["均衡飲食", "用多樣與適量兩個判準檢查一日飲食，不以單一食物判定。"],
    starch_iodine_test: ["碘液與澱粉檢測", "將試劑、檢測目標與顏色證據三欄配對。"],
    glucose_benedict_test: ["本氏液與葡萄糖檢測", "補上安全加熱條件，再比較反應前後顏色。"],
    protein_biuret_test: ["蛋白質檢測", "用檢測目標與紫色反應連結，不與澱粉或葡萄糖試劑混用。"],
    lipid_test: ["脂質檢測", "區分油斑或染色證據與其他養分檢測反應。"],
    control_group: ["對照組與比較基準", "用陽性與陰性對照說明顏色變化是否來自目標養分。"],
    evidence_limit: ["檢測證據的限制", "強調未出現某反應只表示該檢測目標未獲支持，不等於沒有任何養分。"],
    heating_safety: ["加熱操作安全", "以護目鏡、試管口方向與水浴加熱逐項檢查。"],
    enzyme_function: ["酵素促進反應", "區分酵素與能量來源，說明酵素改變反應速度。"],
    enzyme_specificity: ["酵素專一性", "用酵素與受質配對，確認不是所有酵素都能作用於所有養分。"],
    enzyme_reusable: ["酵素可重複作用", "以反應前後酵素仍可再作用的模型，避免視為被消耗的材料。"],
    temperature_effect: ["溫度影響酵素作用", "用趨勢資料找最適溫度，避免推論溫度越高一定越快。"],
    ph_effect: ["酸鹼值影響酵素作用", "比較不同酵素的適合環境，避免套用單一酸鹼值。"],
    data_interpretation: ["資料趨勢判讀", "先讀變因、單位與比較組，再描述趨勢並限制結論範圍。"],
    digestion_context: ["消化酵素與養分", "把作用位置、受質與產物放在同一條消化流程中。"],
    photosynthesis_overview: ["植物製造養分的整體概念", "用二氧化碳、水、光能、葡萄糖與氧氣建立完整因果鏈，避免把土壤當成食物來源。"],
    reactants_energy: ["光合作用的原料與能量", "將物質原料與光能分欄整理，確認光提供能量但不是反應物。"],
    chloroplast_site: ["葉綠體與光合作用位置", "比較葉片綠色細胞與根部細胞，避免推論所有植物細胞都能進行光合作用。"],
    leaf_structure_support: ["葉片構造如何支持光合作用", "把氣孔、葉脈與葉綠體分別連到氣體交換、運輸與反應場所。"],
    products: ["光合作用產物", "用物質來源與去向區分葡萄糖、氧氣和二氧化碳。"],
    variable_evidence: ["變因控制與光合作用證據", "先標出改變、控制與測量的條件，再比較澱粉或氣泡資料。"],
    starch_evidence: ["澱粉檢測作為光合作用證據", "說明碘液反應支持澱粉存在，再限制結論只到有無製造並累積養分的證據。"],
    photosynthesis_respiration_boundary: ["光合作用與呼吸作用", "同時比較兩作用的原料、產物、能量角色與發生條件，強調植物也會呼吸作用。"]
  };

  const TOKEN_LABELS = {
    true: "是", false: "否", single: "單細胞", multi: "多細胞", human: "人類", onion: "洋蔥",
    yeast: "酵母菌", paramecium: "草履蟲", amoeba: "變形蟲", butterfly: "蝴蝶", cell: "細胞",
    tissue: "組織", organism: "個體", compound: "複式顯微鏡", magnifier: "放大鏡", tape: "捲尺",
    height_rule: "身高尺", carb: "醣類", protein: "蛋白質", lipid: "脂質", vitamin: "維生素",
    mineral: "礦物質", water: "水", starch: "澱粉", glucose: "葡萄糖", iodine: "碘液",
    benedict: "本氏液", biuret: "雙縮脲試劑", amylase: "澱粉酶", protease: "蛋白酶", lipase: "脂肪酶"
  };

  function booleanValue(value) {
    return value === true || String(value).toLowerCase() === "true" || String(value) === "1";
  }

  function parseJson(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value !== "string") return value;
    try { return JSON.parse(value); } catch { return value; }
  }

  function humanizeToken(value) {
    const text = String(value ?? "").trim();
    if (!text) return "未作答";
    if (Object.prototype.hasOwnProperty.call(TOKEN_LABELS, text)) return TOKEN_LABELS[text];
    return text.replaceAll("_", " ");
  }

  function answerBuckets(rawAnswer, questionType) {
    const answer = parseJson(rawAnswer, "");
    if (Array.isArray(answer)) {
      if (questionType === "sequence") return [answer.map(humanizeToken).join(" → ")];
      return answer.length ? answer.map(humanizeToken) : ["未作答"];
    }
    if (answer && typeof answer === "object") {
      const entries = Object.entries(answer);
      return entries.length ? entries.map(([key, value]) => `${humanizeToken(key)} → ${humanizeToken(value)}`) : ["未作答"];
    }
    return [humanizeToken(answer)];
  }

  function buildQuestionAnalytics(questionLogs, attemptIds) {
    const allowed = new Set((attemptIds || []).map(String));
    const groups = new Map();
    (questionLogs || []).filter((log) => allowed.has(String(log.attempt_id))).forEach((log) => {
      const id = String(log.question_id || "未標記題目");
      if (!groups.has(id)) groups.set(id, {
        questionId: id,
        questionType: String(log.question_type || "choice"),
        skillTag: String(log.skill_tag || log.concept_id || ""),
        attempts: new Set(), correct: 0, hinted: 0, answerRecorded: 0, options: new Map()
      });
      const group = groups.get(id);
      group.attempts.add(String(log.attempt_id));
      if (booleanValue(log.is_correct)) group.correct += 1;
      if (booleanValue(log.hint_used) || booleanValue(log.used_hint)) group.hinted += 1;
      const storedAnswer = log.answer_json || log.attempt_answer;
      if (storedAnswer !== "" && storedAnswer !== null && storedAnswer !== undefined) {
        group.answerRecorded += 1;
        answerBuckets(storedAnswer, group.questionType).forEach((bucket) => group.options.set(bucket, (group.options.get(bucket) || 0) + 1));
      }
    });
    return [...groups.values()].map((group) => {
      const responses = group.attempts.size;
      return {
        questionId: group.questionId,
        questionType: group.questionType,
        skillTag: group.skillTag,
        responses,
        correctRate: responses ? group.correct / responses : 0,
        hintRate: responses ? group.hinted / responses : 0,
        answerRecorded: group.answerRecorded,
        options: [...group.options.entries()].map(([label, count]) => ({ label, count, rate: responses ? count / responses : 0 })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-Hant"))
      };
    }).sort((a, b) => a.questionId.localeCompare(b.questionId, undefined, { numeric: true }));
  }

  function guidanceFor(skillTag) {
    const fallback = humanizeToken(skillTag || "未標記概念");
    const entry = GUIDANCE[skillTag];
    return entry ? { title: entry[0], strategy: entry[1] } : { title: fallback, strategy: "先以一題口頭判斷確認學生使用的線索，再依作答理由補充關鍵區辨。" };
  }

  function buildConceptDiagnostics(questionLogs, attemptIds) {
    const allowed = new Set((attemptIds || []).map(String));
    const groups = new Map();
    (questionLogs || []).filter((log) => allowed.has(String(log.attempt_id))).forEach((log) => {
      const tag = String(log.skill_tag || log.concept_id || log.misconception_tag || "未標記概念");
      if (!groups.has(tag)) groups.set(tag, { tag, participants: new Set(), affected: new Set(), questions: new Set(), misconceptions: new Map() });
      const group = groups.get(tag);
      const attemptId = String(log.attempt_id);
      group.participants.add(attemptId);
      group.questions.add(String(log.question_id || ""));
      const needsClarification = !booleanValue(log.is_correct) || booleanValue(log.hint_used) || booleanValue(log.used_hint) || booleanValue(log.corrected_after_hint);
      if (needsClarification) group.affected.add(attemptId);
      const misconception = String(log.misconception_tag || "").trim();
      if (misconception) group.misconceptions.set(misconception, (group.misconceptions.get(misconception) || 0) + 1);
    });
    return [...groups.values()].map((group) => {
      const sample = group.participants.size;
      const affected = group.affected.size;
      const rate = sample ? affected / sample : 0;
      let level = "C";
      if (sample < 5) level = "N";
      else if (sample >= 10 && affected >= 4 && rate >= .35) level = "A";
      else if ((rate >= .2 && rate < .35) || affected >= 3) level = "B";
      const guidance = guidanceFor(group.tag);
      return {
        ...guidance, tag: group.tag, sample, affected, rate, level,
        questionIds: [...group.questions].filter(Boolean),
        misconceptions: [...group.misconceptions.entries()].sort((a, b) => b[1] - a[1])
      };
    }).sort((a, b) => ({ A: 0, B: 1, N: 2, C: 3 }[a.level] - ({ A: 0, B: 1, N: 2, C: 3 }[b.level]) || b.rate - a.rate));
  }

  function buildFeedbackSummary(attempts, reviews) {
    const rows = (attempts || []).map((attempt) => ({
      attemptId: String(attempt.attempt_id || ""), studentId: String(attempt.student_id || ""),
      studentName: String(attempt.student_name || attempt.student_id || ""), seatNo: String(attempt.seat_no || ""),
      confidence: Number(attempt.confidence_score || 0),
      confident: String(attempt.confident_concept || "").trim(),
      uncertain: String(attempt.uncertain_concept || "").trim(),
      question: String(attempt.student_question || "").trim(),
      reviewStatus: String(attempt.reflection_review_status || "")
    }));
    return {
      confident: rows.filter((row) => row.confident),
      uncertain: rows.filter((row) => row.uncertain),
      questions: rows.filter((row) => row.question),
      lowConfidence: rows.filter((row) => row.confidence > 0 && row.confidence <= 2),
      pendingReviews: (reviews || []).map((row) => ({
        studentId: String(row.student_id || ""), studentName: String(row.student_name || row.student_id || ""),
        question: String(row.student_question || row.teacher_note || "").trim(), issueType: String(row.issue_type || "待複核")
      }))
    };
  }

  global.BioQuestTeacherAnalytics = Object.freeze({
    answerBuckets, buildQuestionAnalytics, buildConceptDiagnostics, buildFeedbackSummary, guidanceFor, humanizeToken
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
