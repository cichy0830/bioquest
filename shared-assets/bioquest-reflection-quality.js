(function initBioQuestReflectionQuality(global) {
  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}]+/gu, "");
  }

  function ngrams(value, size = 2) {
    const normalized = normalize(value);
    if (!normalized) return [];
    if (normalized.length <= size) return [normalized];
    return Array.from({ length: normalized.length - size + 1 }, (_, index) => normalized.slice(index, index + size));
  }

  function similarity(left, right) {
    const a = normalize(left);
    const b = normalize(right);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const shorter = a.length <= b.length ? a : b;
    const longer = a.length > b.length ? a : b;
    if (longer.includes(shorter) && shorter.length / longer.length >= 0.72) return shorter.length / longer.length;
    const aSet = new Set(ngrams(a));
    const bSet = new Set(ngrams(b));
    const union = new Set([...aSet, ...bSet]);
    const overlap = [...aSet].filter((item) => bSet.has(item)).length;
    return union.size ? overlap / union.size : 0;
  }

  function result(quality, exp, reason, reviewStatus, evidence) {
    return {
      reflection_quality: quality,
      reflection_quality_candidate: quality,
      question_exp: reviewStatus === "auto_scored" ? exp : 0,
      question_exp_candidate: exp,
      reflection_exp_reason: reason,
      reflection_review_status: reviewStatus,
      reflection_examples_checked: true,
      reflection_frontend_only: true,
      ...evidence
    };
  }

  function evaluate(reflection, config) {
    const question = String(reflection?.student_question || "").trim();
    const normalized = normalize(question);
    const conceptTerms = config?.conceptTerms || [];
    const copiedDirections = config?.copiedDirections || [];
    const irrelevantTerms = config?.irrelevantTerms || [];
    const lowEffortTerms = config?.lowEffortTerms || [];
    const matchedConcepts = conceptTerms.filter((term) => normalized.includes(normalize(term)));
    const similarities = copiedDirections.map((direction) => ({ direction, score: similarity(question, direction) }));
    const closest = similarities.sort((a, b) => b.score - a.score)[0] || { direction: "", score: 0 };
    const copiedDirection = closest.score >= 0.82;
    const irrelevant = irrelevantTerms.some((term) => normalized.includes(normalize(term))) && matchedConcepts.length === 0;
    const exactLowEffort = lowEffortTerms.some((term) => normalized === normalize(term));
    const repeated = normalized.length >= 6 && new Set([...normalized]).size <= 3;
    const lowEffort = exactLowEffort || repeated || normalized.length < 4;
    const hasQuestionShape = /為什麼|怎麼|如何|差別|不確定|混淆|判斷|原因|影響|什麼|是否|能不能|會不會/.test(question);
    const evidence = {
      reflection_original_text: question,
      reflection_normalized_text: normalized,
      reflection_matched_concepts: matchedConcepts,
      reflection_similarity_score: Number(closest.score.toFixed(3)),
      reflection_similarity_source: closest.direction,
      reflection_copied_direction_flag: copiedDirection,
      reflection_irrelevant_flag: irrelevant,
      reflection_low_effort_flag: lowEffort
    };

    if (!normalized) return result("blank", 0, "空白可提交但不給 EXP。", "auto_scored", evidence);
    if (irrelevant || lowEffort) return result("invalid", 0, "內容與本單元無關、過短或屬敷衍文字。", "auto_scored", evidence);
    if (copiedDirection) return result("needs_review", 0, "內容與系統提供方向高度相似，交由後台或教師複核。", "pending_review", evidence);
    if (!matchedConcepts.length) return result("needs_review", 0, "前台無法確認與本單元概念的關聯，交由後台或教師複核。", "pending_review", evidence);
    if (!hasQuestionShape) return result("minimal_concept", 10, "有本單元概念詞，但尚未指出具體疑問或不確定處。", "pending_backend_recalc", evidence);
    if (normalized.length >= 22 && matchedConcepts.length >= 1) return result("discussion_question", 40, "具體且與本單元概念相關；後台仍會依原文重新判定。", "pending_backend_recalc", evidence);
    if (normalized.length >= 10) return result("specific_uncertainty", 30, "有明確概念與疑問；後台仍會依原文重新判定。", "pending_backend_recalc", evidence);
    return result("minimal_concept", 10, "已指出概念，但內容仍偏短。", "pending_backend_recalc", evidence);
  }

  global.BioQuestReflectionQuality = Object.freeze({ normalize, similarity, evaluate });
})(typeof window !== "undefined" ? window : globalThis);
