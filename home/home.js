/* 生命祕境 BioQuest 學生版入口頁（佇列 W16 老師決定 B：主畫面只有一個 BioQuest 圖示，開這一頁）。
 * 站名與網址讀 ../portal.js 的 units；只列 studentOpenUnitIds（已正式發布給學生的站）。
 * 不顯示教師後台連結與「測試中／待製作」等狀態。
 */
(function renderStudentHome(global) {
  "use strict";

  const LAST_KEY = "bioquest-home-last-station";
  const data = global.BioQuestUnits || { units: [], studentOpenUnitIds: [] };
  const open = new Set(data.studentOpenUnitIds);
  const stations = data.units
    .filter((unit) => open.has(unit.unitId) && unit.url)
    .sort((a, b) => a.sequence - b.sequence);

  function hrefFor(unit) {
    return `../${unit.url}`;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }

  const list = document.querySelector("#stationList");
  list.innerHTML = stations
    .map(
      (unit) => `
      <li>
        <a class="station-card" href="${escapeHtml(hrefFor(unit))}" data-unit-id="${escapeHtml(unit.unitId)}">
          <span class="station-no">第 ${unit.sequence} 站</span>
          <span class="station-title">${escapeHtml(unit.title)}</span>
          <span class="station-go" aria-hidden="true">進入</span>
        </a>
      </li>`,
    )
    .join("");

  // 記住上次進入的站（只存在這台裝置的瀏覽器；讀不到就不顯示）
  list.addEventListener("click", (event) => {
    const card = event.target.closest(".station-card");
    if (!card) return;
    try {
      global.localStorage.setItem(LAST_KEY, card.dataset.unitId);
    } catch (error) {
      /* 私密瀏覽等情況無法儲存，不影響進站 */
    }
  });

  let lastId = "";
  try {
    lastId = global.localStorage.getItem(LAST_KEY) || "";
  } catch (error) {
    lastId = "";
  }
  const last = stations.find((unit) => unit.unitId === lastId);
  if (last) {
    const link = document.querySelector("#lastStationLink");
    link.href = hrefFor(last);
    link.textContent = `第 ${last.sequence} 站　${last.title}`;
    document.querySelector("#lastStation").hidden = false;
  }

  global.BioQuestHome = { stationCount: stations.length };
})(window);
