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
 * R4-2a（2026-11-10）、R4-2b（2026-11-11）：輸出與各站原本內嵌的函式逐字等價
 * （原寫法保留在 scripts/tests/legacy-achievements.mjs，scripts/tests/achievements.test.mjs 逐案比對）。
 */
(function configureBioQuestAchievements(global) {
  "use strict";

  const VERSION = "20261111-achievements-v2";

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

  global.BioQuestAchievements = Object.freeze({ VERSION, renderAchievements, titleAndProgress, renderBadgeWall });
})(typeof window !== "undefined" ? window : globalThis);
