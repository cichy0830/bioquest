/* 生命祕境 BioQuest 共用成就顯示模組（ROADMAP R4-2：結算／成就頁共用）
 *
 * 需在各站 app.js 之前載入。各站保留同名的薄包裝函式（renderAchievements、titleAndProgress），
 * 把站內資料（稱號等級表、本機紀錄、單元代號）交給這裡處理。
 *
 * renderAchievements()：成就頁（只放「重新登入／再挑戰」區塊；成就總覽由 bioquest-character-layout.js 疊加）。
 * titleAndProgress(ctx, student, localGain)：簡報頁「目前稱號｜EXP」。
 *   ctx = { titleLevels, countLocalAttempts, loadAttempts, unitId }
 *   countLocalAttempts 為 true（第 24–40 站原寫法）時，另把本機其他單元紀錄加總當下限；
 *   false（第 21–23 站原寫法）只看後台累積與目前稱號門檻。
 *
 * renderBadgeWall(ctx, earned, options)：結算頁「本次取得項目」徽章牆（options.onlyEarned）與本單元徽章牆。
 *   ctx = { badges, version }；version 為各站 cache key，加在徽章圖片網址後。
 *   R4-2b（2026-11-11）：先收第 30–40 站（11 站原本逐字相同）；第 16–29 站還有 9 種寫法（文字與圖片備援不同），
 *   統一會改學生畫面，待老師決定後再收。
 *
 * applySubmitResponse(ctx, response, localResult)：結算頁送出後，用後台回應（verified_attempt／attempt_result／student_progress）
 *   覆寫本機結算結果與學生累積資料；ctx = { student, saveVerifiedSnapshot }（student 會被就地更新，與原寫法相同）。
 *   R4-2c（2026-11-12）：先收第 31–40 站（10 站原本逐字相同，連同 numberFromAliases／objectFromValue／badgeIdsFromValue／backendBadgeIds）；
 *   第 16、17、18–21、22–30 站另有 4 種寫法（取數字的先後順序與本機備援不同），之後再以選項收。
 *
 * R4-2a（2026-11-10）、R4-2b（2026-11-11）、R4-2c（2026-11-12）：輸出與各站原本內嵌的函式逐字等價
 * （原寫法保留在 scripts/tests/legacy-achievements.mjs，scripts/tests/achievements.test.mjs 逐案比對）。
 */
(function configureBioQuestAchievements(global) {
  "use strict";

  const VERSION = "20261112-achievements-v3";

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

  function titleAndProgress(ctx, student, localGain = 0) {
    const { titleLevels } = ctx;
    const remoteTotal = Number(student?.progress?.total_exp ?? student?.total_exp);
    const explicitLevel = titleLevels.find((level) => level.id === (student?.current_title_id || student?.progress?.current_title_id));
    let totalExp;
    if (ctx.countLocalAttempts) {
      const localTotal = ctx.loadAttempts()
        .filter((attempt) => attempt.student_id === student?.student_id && attempt.unit_id !== ctx.unitId)
        .reduce((sum, attempt) => sum + Number(attempt.unit_credited_exp || 0), 0) + Number(localGain || 0);
      totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, localTotal, explicitLevel?.need || 0);
    } else {
      totalExp = Math.max(Number.isFinite(remoteTotal) ? remoteTotal : 0, explicitLevel?.need || 0);
    }
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

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }

  // 函式本體保持第 30–40 站原本的縮排：樣板字串內的空白會出現在輸出的 HTML，縮排不同就不再逐字相同。
function renderBadgeWall(ctx, earned = [], options = {}) {
  const { badges, version } = ctx;
  const earnedSet = new Set(earned);
  const earnedBadges = [...earnedSet].map((id) => badges.find((badge) => badge.id === id)).filter(Boolean);
  const visibleBadges = options.onlyEarned ? earnedBadges.filter((badge) => badge.image_status === "ready" && badge.badge_image_path) : badges;
  const candidateBadges = options.onlyEarned ? earnedBadges.filter((badge) => badge.image_status !== "ready" || !badge.badge_image_path) : [];
  if (options.onlyEarned && visibleBadges.length === 0 && candidateBadges.length === 0) {
    return `<section class="panel">
      <p class="eyebrow">本次取得項目</p>
      <h2>本次尚未取得新項目</h2>
      <p class="muted">完成任務後會依本次表現列出實際取得的正式圖像徽章；正式累積以後台確認為準。</p>
    </section>`;
  }
  return `<section class="panel">
    <p class="eyebrow">${options.onlyEarned ? "本次取得項目" : "本單元項目"}</p>
    <h2>${options.onlyEarned ? "本次正式圖像徽章" : `本單元 ${badges.length} 項`}</h2>
    ${visibleBadges.length ? `<div class="${options.onlyEarned ? "earned-badge-list" : "badge-wall"}">
      ${visibleBadges.map((badge) => `
        <article class="badge ${earnedSet.has(badge.id) ? "earned" : "locked"}">
          <div class="badge-visual" data-badge-image-status="${badge.image_status || "pending"}"><img src="${badge.badge_image_path}?v=${version}" alt="${escapeHtml(badge.name)}" onerror="this.closest('.badge-visual').classList.add('asset-missing'); this.remove();"></div>
          <strong>${escapeHtml(badge.name)}</strong>
          ${options.onlyEarned ? "" : `<p>${escapeHtml(badge.condition)}</p>`}
        </article>
      `).join("")}
    </div>` : `<p class="muted">本次沒有已核准正式圖像徽章可顯示；正式累積以後台確認為準。</p>`}
    ${candidateBadges.length ? `<div class="candidate-badge-list" aria-label="本次達成但未列正式圖像的項目"><h3>本次達成候選項目</h3><p class="muted">以下項目等正式圖像核准後才會進入正式徽章圖像展示；本頁不請求不存在的圖檔。</p><ul>${candidateBadges.map((badge) => `<li><strong>${escapeHtml(badge.name)}</strong><span>${escapeHtml(badge.condition)}</span></li>`).join("")}</ul></div>` : ""}
  </section>`;
}

  // R4-2c：第 31–40 站 applyBackendSubmitResponse 與輔助函式（state.student → ctx.student）。
  function applySubmitResponse(ctx, response, localResult) {
    if (!response || response.ok === false) return localResult;
    const verified = response.verified_attempt || response.attempt || null;
    const attemptResult = response.attempt_result || response.result || null;
    const progress = response.student_progress || response.progress || null;
    if (progress) {
      ctx.student.progress = progress;
      ctx.student.total_exp = Number(progress.total_exp ?? ctx.student.total_exp ?? 0);
      ctx.student.current_title_id = progress.current_title_id || ctx.student.current_title_id;
      ctx.student.current_title = progress.current_title || ctx.student.current_title;
      ctx.student.title_avatar_path = progress.title_avatar_path || ctx.student.title_avatar_path;
      ctx.saveVerifiedSnapshot(ctx.student);
    }
    if (!verified && !attemptResult) return { ...localResult, backend_response: response };
    const verificationStatus = verified?.verification_status || attemptResult?.verification_status || response.verification_status || "server_verified";
    const serverVerified = verificationStatus === "server_verified" || verificationStatus === "server_verified_credited";
    const serverBadgeIds = backendBadgeIds(response, verified, attemptResult);
    const earnedBadges = serverBadgeIds.length ? serverBadgeIds : (serverVerified ? [] : localResult.earned_badges);
    const authoritative = verified || attemptResult || {};
    return {
      ...localResult,
      verification_status: verificationStatus,
      correct_count: numberFromAliases(localResult.correct_count, authoritative.correct_count, attemptResult?.correct_count),
      total_questions: numberFromAliases(localResult.total_questions, authoritative.total_questions, attemptResult?.total_questions),
      accuracy: numberFromAliases(localResult.accuracy, authoritative.accuracy, attemptResult?.accuracy),
      hint_used_count: numberFromAliases(localResult.hint_used_count, authoritative.hint_used_count, attemptResult?.hint_used_count),
      completion_exp: numberFromAliases(localResult.completion_exp, authoritative.completion_exp, attemptResult?.completion_exp),
      direct_exp: numberFromAliases(localResult.direct_exp, authoritative.direct_exp, authoritative.concept_exp, attemptResult?.direct_exp, attemptResult?.concept_exp),
      revision_exp: numberFromAliases(localResult.revision_exp, authoritative.revision_exp, attemptResult?.revision_exp),
      reflection_exp: numberFromAliases(localResult.reflection_exp, authoritative.reflection_exp, authoritative.question_exp, attemptResult?.reflection_exp, attemptResult?.question_exp),
      mastery_exp: numberFromAliases(localResult.mastery_exp, authoritative.mastery_exp, attemptResult?.mastery_exp),
      retry_exp: numberFromAliases(localResult.retry_exp, authoritative.retry_exp, attemptResult?.retry_exp),
      attempt_exp: numberFromAliases(localResult.attempt_exp, authoritative.attempt_exp, authoritative.attempt_total_exp, attemptResult?.attempt_exp, attemptResult?.attempt_total_exp),
      unit_credited_exp: numberFromAliases(localResult.unit_credited_exp, authoritative.unit_credited_exp, attemptResult?.unit_credited_exp, authoritative.attempt_exp, authoritative.attempt_total_exp, attemptResult?.attempt_exp, attemptResult?.attempt_total_exp),
      exp_delta: numberFromAliases(localResult.exp_delta, authoritative.credited_delta, authoritative.exp_delta, attemptResult?.credited_delta, attemptResult?.exp_delta),
      earned_badges: earnedBadges,
      backend_response: response
    };
  }

  function numberFromAliases(fallback, ...values) {
    for (const value of values) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return Number(fallback || 0);
  }

  function objectFromValue(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function badgeIdsFromValue(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : item?.badge_id || item?.id).filter(Boolean);
    const parsed = objectFromValue(value);
    if (Array.isArray(parsed)) return badgeIdsFromValue(parsed);
    if (parsed && typeof parsed === "object") return Object.keys(parsed).filter((id) => parsed[id]);
    return [];
  }

  function backendBadgeIds(response, verified, attemptResult) {
    const sources = [
      attemptResult?.newly_credited_badges_json,
      attemptResult?.earned_badges_json,
      attemptResult?.newly_credited_badges,
      attemptResult?.earned_badges,
      verified?.newly_credited_badges_json,
      verified?.earned_badges_json,
      verified?.earned_badges,
      verified?.badges,
      verified?.badges_json,
      response?.newly_credited_badges_json,
      response?.earned_badges_json,
      response?.earned_badges,
      response?.badges_json
    ];
    for (const value of sources) {
      const ids = badgeIdsFromValue(value);
      if (ids.length) return [...new Set(ids)];
    }
    return [];
  }

  global.BioQuestAchievements = Object.freeze({ VERSION, renderAchievements, titleAndProgress, renderBadgeWall, applySubmitResponse });
})(typeof window !== "undefined" ? window : globalThis);
