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
 * 徽章牆 renderBadgeWall 第 16–40 站有 10 種寫法（文字與圖片備援不同），留待 R4-2b 處理。
 *
 * R4-2a（2026-11-10）：輸出與第 16–40 站原本內嵌的函式逐字等價
 * （原寫法保留在 scripts/tests/legacy-achievements.mjs，scripts/tests/achievements.test.mjs 逐案比對）。
 */
(function configureBioQuestAchievements(global) {
  "use strict";

  const VERSION = "20261110-achievements-v1";

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

  global.BioQuestAchievements = Object.freeze({ VERSION, renderAchievements, titleAndProgress });
})(typeof window !== "undefined" ? window : globalThis);
