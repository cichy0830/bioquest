/* 生命祕境 BioQuest 共用成就顯示模組（ROADMAP R4-2：結算／成就頁共用）
 *
 * 需在各站 app.js 之前載入。各站保留同名的薄包裝函式（renderAchievements、titleAndProgress），
 * 把站內資料（稱號等級表、本機紀錄、單元代號）交給這裡處理。
 *
 * renderAchievements()：成就頁（只放「重新登入／再挑戰」區塊；成就總覽由 bioquest-character-layout.js 疊加）。
 * renderRetryAchievements(options)：第 1–10 站成就頁（R4-2d 第四批，2026-11-19），選項見函式上方說明。
 * renderOverviewAchievements(options)／renderReloginAction(context, options)：第 11–15 站成就頁與「重新登入／再挑戰」區塊
 *   （R4-2d 第四批 b，2026-11-21），選項見函式上方說明。
 * titleAndProgress(ctx, student, localGain)：簡報頁「目前稱號｜EXP」。
 *   ctx = { titleLevels, countLocalAttempts, loadAttempts, unitId }
 *   countLocalAttempts 為 true（第 14、24–40 站原寫法）時，另把本機其他單元紀錄加總當下限；
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
 * applyVerifiedSubmitResponse(ctx, response, localResult)：同上，第 22–30 站的寫法（R4-2c 第二批，2026-11-13；9 站原本逐字相同）：
 *   只在有 verified_attempt／attempt 時覆寫；後台已確認時數字不用本機備援。第 16、17、18–21 站還有 3 種寫法，之後再收。
 *   R4-2c 第三批（2026-11-14）：第 18–21 站也改用 applyVerifiedSubmitResponse，原寫法差異以 ctx 選項保留：
 *   ctx.assumeVerified（第 18–21 站）：verified／attempt 沒寫狀態時一律當 server_verified；有 response.verified_attempt 就算後台已確認
 *     （server_verified_credited 不算，除非有 verified_attempt）。
 *   ctx.plainBadgeIds（第 18 站）：徽章陣列只濾掉空值、不從物件取 badge_id；JSON 不是陣列時視為沒有；
 *     也不讀 response 層的 newly_credited_badges_json／earned_badges_json。
 *   R4-2c 第四批（2026-11-15）：第 16、17 站也改用 applyVerifiedSubmitResponse（都帶 assumeVerified），另加選項：
 *   ctx.rawAttemptResult（第 16、17 站）：attempt_result 照原值使用，不解析 JSON 字串。
 *   ctx.localCounts（第 16、17 站）：答對題數／總題數／正確率／提示次數 = Number(verified 值 ?? 本機值)，不讀 attempt_result；
 *     ctx.countAliases（第 16 站）另讀 verified.correct、verified.hints_used。
 *   ctx.badgeOrder：徽章 JSON 解析後不是陣列就當沒有、逗號字串可分隔、物件取 badge_id／id／badgeId；
 *     "skipEmpty"（第 16 站）依序取第一個「有內容」的清單並去重，都沒有內容才取第一個空清單；
 *     "attemptFirst"（第 17 站）依序取第一個清單（attempt_result 的 newly_credited 先於 earned）。
 *   ctx.saveVerifiedSnapshot 可省略（第 17 站原本不存本機快照）。
 *
 * applyAttemptSubmitResponse(ctx, response, localResult)：第 1–4、6 站的寫法（R4-2d 第一批，2026-11-16；第 1–4 站原本逐字相同）：
 *   欄位名稱是第 1–13 站的舊格式（total／correct／hint_used／concept_exp…）；沒有 verified_attempt／attempt 時，
 *   回傳本機結果加上 verification_status（預設 pending_backend）；ctx = { student, trackCompletedAttempts }，
 *   student 為 null 時不更新學生資料；ctx.trackCompletedAttempts（第 6 站）另存 progress.completed_attempts。
 *
 * mergeVerifiedAttempt(result, response)：第 7–13 站送出流程，後台有 verified_attempt 時把它疊到本機結果上（沒有就回傳原物件）。
 * applyLegacyStudentProgress(ctx, progress)：第 7–13 站 applyBackendProgress（R4-2d 第二批，2026-11-17；第 9–13 站原本逐字相同）：
 *   就地更新 ctx.state 的 cumulative_badges／cumulative_total_exp／completed_unit_count 與 state.student 的稱號、頭像。
 *   ctx = { state, ignoreInvalid, syncProfileAndExp, afterApply }
 *   ctx.ignoreInvalid（第 9–13 站）：progress 不是物件時直接略過（第 7、8 站原寫法沒有這個檢查，遇到 null 會丟錯，照舊）。
 *   ctx.syncProfileAndExp（第 8–13 站）：另存 profile_gender 與 student.total_exp。
 *   ctx.afterApply（第 9–13 站傳 updateBadgeOverviewBridge）：更新完後呼叫。
 *
 * applyNumberedSubmitResponse(ctx, response, localResult)：第 14、15 站（R4-2d 第三批，2026-11-18）：
 *   欄位是新格式（correct_count／direct_exp…），數字 = Number(後台值 ?? 本機值)；ctx = { student, applyProgress, badgeIds }，
 *   見函式上方說明。
 * applyMergedStudentProgress(student, data)／applyServerVerifiedAttempt(localAttempt, response)：第 5 站（R4-2d 第三批）。
 *
 * R4-2a（2026-11-10）、R4-2b（2026-11-11）、R4-2c（2026-11-12）：輸出與各站原本內嵌的函式逐字等價
 * （原寫法保留在 scripts/tests/legacy-achievements.mjs，scripts/tests/achievements.test.mjs 逐案比對）。
 */
(function configureBioQuestAchievements(global) {
  "use strict";

  const VERSION = "20261121-achievements-v11";

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

  const RETRY_LOCKED_TEXT = "本次作答與結算已鎖定；若要再挑戰，請重新登入並從頭完成。這不會刪除既有正式累積資料。";
  const OVERVIEW_PANEL = `<div class="panel bq-all-unit-badge-overview" data-bq-badge-overview="true"></div>`;

  // 第 1–10 站成就頁（R4-2d 第四批，2026-11-19）：「再挑戰」區塊＋全冊徽章總覽空殼（總覽由 bioquest-character-layout.js 填入）。
  // 原本 7 種寫法，差異以選項保留（輸出只差標籤之間的空白，畫面逐像素相同）：
  //   overviewOnly：外框加 achievements-stack 與 data-bq-achievements-overview-only（第 1、2、7–10 站）
  //   overviewFirst：總覽放在再挑戰區塊之前（第 6 站）；headingTag：標題標籤（第 6 站 h3）；plainText：說明不加 muted（第 6 站）
  //   backPrefix：有就顯示「返回／回到＋結算或任務」按鈕並把重新登入按鈕放進 .actions（第 5–10 站）；沒有就只放「重新登入／再挑戰」（第 1–4 站）
  //   submitted：false 時改顯示「目前進度」文字、只留回到任務按鈕（第 8–10 站依 state.submitted_at）
  function renderRetryAchievements(options = {}) {
    const submitted = options.submitted !== false;
    const tag = options.headingTag || "h2";
    const textClass = options.plainText ? "" : ` class="muted"`;
    const eyebrow = submitted ? "再挑戰" : "目前進度";
    const title = submitted ? "重新登入後開始新的挑戰" : "目前稱號與全冊徽章總覽";
    const text = submitted ? RETRY_LOCKED_TEXT : "這裡只顯示正式稱號進度與全冊徽章總覽；本單元徽章改在結算頁呈現本次實得。";
    const actions = options.backPrefix
      ? `<div class="actions"><button class="secondary" id="achieveResult">${options.backPrefix}${submitted ? "結算" : "任務"}</button>${submitted ? `<button class="secondary" data-relogin-action="true">重新登入，並從登入頁開始</button>` : ""}</div>`
      : `<button class="secondary" data-relogin-action="true">重新登入／再挑戰</button>`;
    const retryPanel = `<div class="panel"><p class="eyebrow">${eyebrow}</p><${tag}>${title}</${tag}><p${textClass}>${text}</p>${actions}</div>`;
    const wrapper = options.overviewOnly
      ? `<div class="wide-layout achievements-stack" data-bq-achievements-overview-only="true">`
      : `<div class="wide-layout">`;
    return `${wrapper}${options.overviewFirst ? OVERVIEW_PANEL + retryPanel : retryPanel + OVERVIEW_PANEL}</div>`;
  }

  // 第 11–15 站成就頁（R4-2d 第四批 b，2026-11-21）：「全冊成就」說明＋回到結算／任務按鈕，送出後另附重新登入區塊
  // （全冊徽章總覽由 bioquest-character-layout.js 疊加）。原本 4 種寫法，差異以選項保留（輸出只差標籤之間的空白）：
  //   status：verified／guest／其他（待確認），決定說明框顏色與預設說明文字
  //   syncNote：自訂說明文字（第 11 站另顯示本次預估 EXP）；省略時用第 12–14 站的三句說明
  //   overviewNote：說明框下方的灰字
  //   submitted：是否已送出（決定按鈕文字與是否顯示重新登入區塊）
  //   layout："stack"（第 14 站：section 外框、data-next 按鈕、重新登入區塊在 section 外）；省略為第 11–13 站寫法
  //   shellOnly：只輸出空的外框（第 15 站）
  const OVERVIEW_SYNC_NOTES = {
    verified: "稱號、EXP 與全冊徽章總覽以後台正式認列資料為準。",
    guest: "guest 測試不列入正式稱號進度；此頁只顯示目前可驗證的全冊總覽。",
    pending: "本次提交等待後台確認；正式稱號進度確認後才會更新。"
  };

  function renderOverviewAchievements(options = {}) {
    if (options.shellOnly) {
      return `<div class="stack achievements-stack" data-bq-achievements-overview-only="true"></div>`;
    }
    const status = options.status;
    const submitted = Boolean(options.submitted);
    const syncNote = options.syncNote ?? (status === "verified" ? OVERVIEW_SYNC_NOTES.verified : status === "guest" ? OVERVIEW_SYNC_NOTES.guest : OVERVIEW_SYNC_NOTES.pending);
    const back = `回到${submitted ? "結算" : "任務"}`;
    const head = `<p class="eyebrow">全冊成就</p><h2>稱號進度與全冊徽章總覽</h2><div class="feedback ${status === "verified" ? "good" : "warn"}">${syncNote}</div><p class="muted">${options.overviewNote}</p>`;
    if (options.layout === "stack") {
      return `<div class="stack achievements-stack" data-bq-achievements-overview-only="true"><section class="panel">${head}<div class="button-row"><button class="primary" data-next="${submitted ? "result" : "brief"}">${back}</button></div></section>${submitted ? renderReloginAction("achievements", { layout: "stack" }) : ""}</div>`;
    }
    return `<div class="wide-layout achievements-stack" data-bq-achievements-overview-only="true"><div class="panel">${head}<div class="actions"><button class="primary" id="achieveResult">${back}</button></div>${submitted ? renderReloginAction("achievements") : ""}</div></div>`;
  }

  // 第 11–14 站「重新登入／再挑戰」區塊（結算頁、成就頁、規則頁共用）；layout "stack" 為第 14 站寫法。
  function renderReloginAction(context, options = {}) {
    const stack = options.layout === "stack";
    return `<div class="${stack ? "" : "story-panel "}relogin-panel" data-relogin-entry="${context}"><strong>重新登入／再挑戰</strong><p>若要重新作答，請回到登入頁開始新的完整任務；既有正式累積與歷史紀錄不會被清除。</p><div class="${stack ? "button-row" : "actions"}"><button class="secondary" data-relogin-action="true">重新登入，並從登入頁開始</button></div></div>`;
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

  // 第 14–40 站與第 1–4、6 站送出後共用的學生資料更新（progress 整個取代，稱號／頭像沒給就保留原值）。
  function copyProgressToStudent(student, progress) {
    student.progress = progress;
    student.total_exp = Number(progress.total_exp ?? student.total_exp ?? 0);
    student.current_title_id = progress.current_title_id || student.current_title_id;
    student.current_title = progress.current_title || student.current_title;
    student.title_avatar_path = progress.title_avatar_path || student.title_avatar_path;
  }

  // R4-2c：第 31–40 站 applyBackendSubmitResponse 與輔助函式（state.student → ctx.student）。
  function applySubmitResponse(ctx, response, localResult) {
    if (!response || response.ok === false) return localResult;
    const verified = response.verified_attempt || response.attempt || null;
    const attemptResult = response.attempt_result || response.result || null;
    const progress = response.student_progress || response.progress || null;
    if (progress) {
      copyProgressToStudent(ctx.student, progress);
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

  // R4-2c 第二批（2026-11-13）：第 22–30 站 applyBackendSubmitResponse 與輔助函式（9 站原本逐字相同；
  // state.student → ctx.student，輔助函式改名以免和第 31–40 站寫法同名）。
  // 和 applySubmitResponse 的差別：只在有 verified_attempt／attempt 時覆寫；後台已確認時數字不用本機備援；
  // attempt_result 可為 JSON 字串；徽章字串可用逗號分隔。
  function numberOrNull(...values) {
    for (const value of values) {
      if (value === null || value === undefined || value === "") continue;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return null;
  }

  function badgeIdsOrNull(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.badge_id || item.id || item.badgeId || "";
        return "";
      }).filter(Boolean);
    }
    if (typeof value === "string") {
      try {
        return badgeIdsOrNull(JSON.parse(value));
      } catch (error) {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    return null;
  }

  function plainObjectFromValue(value) {
    if (!value) return {};
    if (typeof value === "object" && !Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  // 第 18 站原寫法（ctx.plainBadgeIds）：陣列只濾空值；JSON 字串解析後不是陣列就當沒有。
  function plainBadgeIdsOrNull(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (error) {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    return null;
  }

  function verifiedBackendBadgeIds(response = {}, verified = null, plain = false) {
    const attemptResult = plainObjectFromValue(response.attempt_result || response.attempt_result_json || response.result);
    const candidates = plain
      ? [attemptResult.newly_credited_badges_json, attemptResult.earned_badges_json, attemptResult.newly_credited_badges, attemptResult.earned_badges,
        verified?.earned_badges, verified?.badges, verified?.badges_json]
      : [attemptResult.newly_credited_badges_json, attemptResult.earned_badges_json, attemptResult.newly_credited_badges, attemptResult.earned_badges,
        response.newly_credited_badges_json, response.earned_badges_json,
        verified?.earned_badges, verified?.badges, verified?.badges_json];
    const parse = plain ? plainBadgeIdsOrNull : badgeIdsOrNull;
    for (const value of candidates) {
      const ids = parse(value);
      if (ids) return ids;
    }
    return null;
  }

  // 第 16、17 站原寫法（ctx.badgeOrder）：JSON 解析後不是陣列就當沒有。
  function strictBadgeIdsOrNull(value) {
    if (value === undefined || value === null || value === "") return null;
    let source = value;
    if (typeof source === "string") {
      try {
        source = JSON.parse(source);
      } catch (error) {
        source = source.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(source)) return null;
    return source.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.badge_id || item.id || item.badgeId || "";
      return "";
    }).filter(Boolean);
  }

  function orderedBackendBadgeIds(response, verified, attemptResult, order) {
    const sources = order === "skipEmpty"
      ? [attemptResult.newly_credited_badges_json, attemptResult.newly_credited_badges, response.newly_credited_badges_json, verified?.newly_credited_badges_json,
        attemptResult.earned_badges_json, attemptResult.earned_badges, response.earned_badges_json, verified?.earned_badges_json,
        verified?.earned_badges, verified?.badges, verified?.badges_json]
      : [attemptResult.newly_credited_badges_json, attemptResult.newly_credited_badges, attemptResult.earned_badges_json, attemptResult.earned_badges,
        response.newly_credited_badges_json, response.earned_badges_json,
        verified?.earned_badges, verified?.badges, verified?.badges_json];
    if (order === "skipEmpty") {
      for (const value of sources) {
        const ids = strictBadgeIdsOrNull(value);
        if (ids && ids.length) return [...new Set(ids)];
      }
    }
    for (const value of sources) {
      const ids = strictBadgeIdsOrNull(value);
      if (ids) return ids;
    }
    return null;
  }

  function applyVerifiedSubmitResponse(ctx, response, localResult) {
    if (!response || response.ok === false) return localResult;
    const verified = response.verified_attempt || response.attempt || null;
    const attemptResult = ctx.rawAttemptResult
      ? (response.attempt_result || response.attempt_result_json || response.result || {})
      : plainObjectFromValue(response.attempt_result || response.attempt_result_json || response.result);
    const progress = response.student_progress || response.progress || null;
    if (progress) {
      copyProgressToStudent(ctx.student, progress);
      if (ctx.saveVerifiedSnapshot) ctx.saveVerifiedSnapshot(ctx.student);
    }
    if (!verified) return { ...localResult, backend_response: response };
    const verificationStatus = ctx.assumeVerified
      ? (verified.verification_status || response.verification_status || "server_verified")
      : (verified.verification_status || response.verification_status || (response.verified_attempt ? "server_verified" : localResult.verification_status || "pending_backend"));
    const serverVerified = ctx.assumeVerified
      ? (verificationStatus === "server_verified" || Boolean(response.verified_attempt))
      : (verificationStatus === "server_verified" || verificationStatus === "server_verified_credited");
    const serverBadgeIds = ctx.badgeOrder
      ? orderedBackendBadgeIds(response, verified, attemptResult, ctx.badgeOrder)
      : verifiedBackendBadgeIds(response, verified, Boolean(ctx.plainBadgeIds));
    const localFallback = (key) => (serverVerified ? null : localResult[key]);
    const counts = ctx.localCounts
      ? {
        correct_count: Number(verified.correct_count ?? (ctx.countAliases ? verified.correct : undefined) ?? localResult.correct_count),
        total_questions: Number(verified.total_questions ?? localResult.total_questions),
        accuracy: Number(verified.accuracy ?? localResult.accuracy),
        hint_used_count: Number(verified.hint_used_count ?? (ctx.countAliases ? verified.hints_used : undefined) ?? localResult.hint_used_count)
      }
      : {
        correct_count: numberOrNull(verified.correct_count, attemptResult.correct_count, localFallback("correct_count")) ?? 0,
        total_questions: numberOrNull(verified.total_questions, attemptResult.total_questions, localFallback("total_questions")) ?? 0,
        accuracy: numberOrNull(verified.accuracy, attemptResult.accuracy, localFallback("accuracy")) ?? 0,
        hint_used_count: numberOrNull(verified.hint_used_count, attemptResult.hint_used_count, localFallback("hint_used_count")) ?? 0
      };
    return {
      ...localResult,
      verification_status: verificationStatus,
      ...counts,
      completion_exp: numberOrNull(verified.completion_exp, attemptResult.completion_exp, localFallback("completion_exp")) ?? 0,
      direct_exp: numberOrNull(verified.direct_exp, verified.concept_exp, attemptResult.direct_exp, attemptResult.concept_exp, localFallback("direct_exp")) ?? 0,
      revision_exp: numberOrNull(verified.revision_exp, attemptResult.revision_exp, localFallback("revision_exp")) ?? 0,
      reflection_exp: numberOrNull(verified.reflection_exp, verified.question_exp, attemptResult.reflection_exp, attemptResult.question_exp, localFallback("reflection_exp")) ?? 0,
      mastery_exp: numberOrNull(verified.mastery_exp, attemptResult.mastery_exp, localFallback("mastery_exp")) ?? 0,
      retry_exp: numberOrNull(verified.retry_exp, attemptResult.retry_exp, localFallback("retry_exp")) ?? 0,
      attempt_exp: numberOrNull(verified.attempt_exp, verified.attempt_total_exp, attemptResult.attempt_exp, attemptResult.attempt_total_exp, localFallback("attempt_exp")) ?? 0,
      unit_credited_exp: numberOrNull(verified.unit_credited_exp, attemptResult.unit_credited_exp, localFallback("unit_credited_exp")) ?? 0,
      exp_delta: numberOrNull(verified.credited_delta, verified.exp_delta, attemptResult.credited_delta, attemptResult.exp_delta, localFallback("exp_delta")) ?? 0,
      earned_badges: serverVerified ? (serverBadgeIds || []) : (serverBadgeIds || localResult.earned_badges),
      backend_response: response
    };
  }

  function applyAttemptSubmitResponse(ctx, response, localResult) {
    if (!response || response.ok === false) return localResult;
    const progress = response.student_progress || response.progress || null;
    const student = ctx.student;
    if (progress && student) {
      copyProgressToStudent(student, progress);
      student.title_avatar_variant = progress.title_avatar_variant || student.title_avatar_variant;
      if (ctx.trackCompletedAttempts) student.completed_attempts = Number(progress.completed_attempts ?? student.completed_attempts ?? 0);
    }
    const verified = response.verified_attempt || response.attempt || null;
    if (!verified) {
      return {
        ...localResult,
        verification_status: response.verification_status || "pending_backend",
        backend_response: response
      };
    }
    return {
      ...localResult,
      ...verified,
      total: Number(verified.total_questions ?? localResult.total),
      correct: Number(verified.correct ?? localResult.correct),
      correct_without_hint: Number(verified.correct_without_hint ?? localResult.correct_without_hint),
      corrected_after_hint: Number(verified.corrected_after_hint ?? localResult.corrected_after_hint),
      hint_used: Number(verified.hints_used ?? localResult.hint_used),
      concept_exp: Number(verified.concept_exp ?? localResult.concept_exp),
      revision_exp: Number(verified.revision_exp ?? localResult.revision_exp),
      question_exp: Number(verified.question_exp ?? localResult.question_exp),
      mastery_exp: Number(verified.mastery_exp ?? localResult.mastery_exp),
      retry_exp: Number(verified.retry_exp ?? localResult.retry_exp),
      attempt_total_exp: Number(verified.attempt_total_exp ?? localResult.attempt_total_exp),
      total_exp: Number(verified.attempt_total_exp ?? localResult.total_exp),
      unit_credited_exp: Number(verified.unit_credited_exp ?? localResult.unit_credited_exp),
      credited_delta: Number(verified.credited_delta ?? localResult.credited_delta),
      no_hint_perfect: Boolean(verified.no_hint_perfect),
      badges: Array.isArray(verified.badges) ? verified.badges : localResult.badges,
      verification_status: verified.verification_status || response.verification_status || "server_verified",
      hint_verification_status: verified.hint_verification_status || response.hint_verification_status || "",
      backend_response: response
    };
  }

  function parseLegacyArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }

  function mergeVerifiedAttempt(result, response) {
    if (response.verified_attempt) return { ...result, ...response.verified_attempt };
    return result;
  }

  function applyLegacyStudentProgress(ctx, progress = {}) {
    const state = ctx.state;
    if (ctx.ignoreInvalid && (!progress || typeof progress !== "object")) return;
    state.cumulative_badges = parseLegacyArray(progress.badges_json || progress.badges || state.cumulative_badges);
    state.cumulative_total_exp = Number(progress.total_exp ?? progress.total_credited_exp ?? state.cumulative_total_exp ?? 0);
    state.completed_unit_count = Number(progress.completed_unit_count ?? state.completed_unit_count ?? 0);
    if (state.student) {
      state.student.progress = { ...(state.student.progress || {}), ...progress };
      state.student.current_title_id = progress.current_title_id || state.student.current_title_id || "";
      state.student.current_title = progress.current_title || state.student.current_title || "";
      state.student.title_avatar_path = progress.title_avatar_path || state.student.title_avatar_path || "";
      if (ctx.syncProfileAndExp) {
        state.student.profile_gender = progress.profile_gender || state.student.profile_gender || "";
        state.student.total_exp = Number(progress.total_exp ?? state.student.total_exp ?? 0);
      }
    }
    if (ctx.afterApply) ctx.afterApply();
  }

  // R4-2d 第三批（2026-11-18）：第 14、15 站 applyBackendSubmitResponse（兩站回傳欄位逐字相同）。
  // 學生資料：預設照 copyProgressToStudent 更新 ctx.student（第 14 站）；ctx.applyProgress(progress, response) 另行處理（第 15 站）。
  // 徽章：ctx.badgeIds(response, verified) 回傳後台徽章清單；清單是空的時，後台有正式列出徽章欄（badges 陣列或 badges_json 字串）
  // 就當本次沒有徽章，否則用本機判定；ctx.defaultLocalBadges（第 15 站）本機結果沒有 earned_badges 時給空清單。
  function applyNumberedSubmitResponse(ctx, response, localResult) {
    if (!response || response.ok === false) return localResult;
    const verified = response.verified_attempt || response.attempt || null;
    const progress = response.student_progress || response.progress || null;
    if (progress) {
      if (ctx.applyProgress) ctx.applyProgress(progress, response);
      else copyProgressToStudent(ctx.student, progress);
    }
    if (!verified) return { ...localResult, backend_response: response };
    const serverBadgeIds = ctx.badgeIds(response, verified);
    const backendListedBadges = Array.isArray(verified.badges) || typeof verified.badges_json === "string";
    return {
      ...localResult,
      verification_status: verified.verification_status || response.verification_status || "server_verified",
      correct_count: Number(verified.correct_count ?? verified.correct ?? localResult.correct_count),
      total_questions: Number(verified.total_questions ?? localResult.total_questions),
      accuracy: Number(verified.accuracy ?? localResult.accuracy),
      hint_used_count: Number(verified.hint_used_count ?? verified.hints_used ?? localResult.hint_used_count),
      completion_exp: Number(verified.completion_exp ?? localResult.completion_exp),
      direct_exp: Number(verified.direct_exp ?? verified.concept_exp ?? localResult.direct_exp),
      revision_exp: Number(verified.revision_exp ?? localResult.revision_exp),
      reflection_exp: Number(verified.reflection_exp ?? verified.question_exp ?? localResult.reflection_exp),
      mastery_exp: Number(verified.mastery_exp ?? localResult.mastery_exp),
      retry_exp: Number(verified.retry_exp ?? localResult.retry_exp),
      attempt_exp: Number(verified.attempt_exp ?? verified.attempt_total_exp ?? localResult.attempt_exp),
      unit_credited_exp: Number(verified.unit_credited_exp ?? localResult.unit_credited_exp),
      exp_delta: Number(verified.credited_delta ?? verified.exp_delta ?? localResult.exp_delta),
      earned_badges: serverBadgeIds.length || backendListedBadges ? serverBadgeIds : (ctx.defaultLocalBadges ? localResult.earned_badges ?? [] : localResult.earned_badges),
      backend_response: response
    };
  }

  // R4-2d 第三批（2026-11-18）：第 5 站 applyBackendStudentProgress（progress 合併進原有資料，有給的欄位才覆寫；
  // 回傳是否有同步）與 applyVerifiedAttempt（只認 server_verified；第 1–13 站舊欄位格式，數字沒給當 0）。
  function applyMergedStudentProgress(student, data) {
    const progress = data?.student_progress || data?.progress;
    if (!progress || typeof progress !== "object" || !student) return false;
    student.progress = { ...(student.progress || {}), ...progress };
    ["total_exp", "current_title_id", "current_title", "profile_gender", "title_avatar_variant", "title_avatar_path"].forEach((field) => {
      if (progress[field] !== undefined && progress[field] !== null) student[field] = progress[field];
    });
    return true;
  }

  function applyServerVerifiedAttempt(localAttempt, backendResponse) {
    const verified = backendResponse?.verified_attempt || backendResponse?.attempt || null;
    if (!verified || verified.verification_status !== "server_verified") return localAttempt;
    const badgeIds = parseLegacyArray(verified.badges || verified.badges_json);
    const totalQuestions = Number(verified.total_questions || localAttempt.total || 0);
    const correct = Number(verified.correct || 0);
    const accuracy = Number(verified.accuracy ?? (totalQuestions ? correct / totalQuestions : 0));
    return {
      ...localAttempt,
      verification_status: verified.verification_status,
      hint_verification_status: verified.hint_verification_status,
      total: totalQuestions,
      total_questions: totalQuestions,
      correct,
      accuracy,
      correct_without_hint: Number(verified.correct_without_hint || 0),
      corrected_after_hint: Number(verified.corrected_after_hint || 0),
      hint_used: Number(verified.hints_used || verified.hint_used || 0),
      completion_exp: Number(verified.completion_exp || 0),
      concept_exp: Number(verified.concept_exp || 0),
      revision_exp: Number(verified.revision_exp || 0),
      question_exp: Number(verified.question_exp || 0),
      mastery_exp: Number(verified.mastery_exp || 0),
      retry_exp: Number(verified.retry_exp || 0),
      attempt_total_exp: Number(verified.attempt_total_exp || 0),
      unit_credited_exp: Number(verified.unit_credited_exp || 0),
      credited_delta: Number(verified.credited_delta || 0),
      badges: badgeIds,
      question_logs: verified.question_logs || localAttempt.question_logs || [],
      reflection_quality: verified.reflection_quality || localAttempt.reflection_quality,
      reflection_exp_reason: verified.reflection_exp_reason || localAttempt.reflection_exp_reason,
      teacher_attention_needed: Boolean(verified.teacher_attention_needed)
    };
  }

  global.BioQuestAchievements = Object.freeze({ VERSION, renderAchievements, renderRetryAchievements, renderOverviewAchievements, renderReloginAction, titleAndProgress, renderBadgeWall, applySubmitResponse, applyVerifiedSubmitResponse, applyAttemptSubmitResponse, mergeVerifiedAttempt, applyLegacyStudentProgress, applyNumberedSubmitResponse, applyMergedStudentProgress, applyServerVerifiedAttempt });
})(typeof window !== "undefined" ? window : globalThis);
