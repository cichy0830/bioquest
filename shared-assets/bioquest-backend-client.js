/* 生命祕境 BioQuest 共用後台呼叫模組（ROADMAP R4／原則 2：後台呼叫集中在一處）
 *
 * 各站對 Apps Script 的請求都經過這裡；日後換資料庫只改本檔。
 * 需在 bioquest-backend-config.js 之後、各站 app.js 之前載入。
 *
 * request(params)：JSON 協定（第 14 站以後的寫法，與各站原本的 requestBackend 逐字等價）
 *   - action 為 getStudentAndAttemptStatus：GET，參數全部放網址。
 *   - 其他 action：POST，網址只帶 action，內容以 text/plain JSON 送出（避免 CORS 預檢）。
 *   - HTTP 非 2xx → backend_http_<狀態碼>；回應 ok === false → 後台 error 或 backend_error。
 *
 * 第 1–13 站使用表單協定（payload=JSON），尚未遷移，留待下一批。
 */
(function configureBioQuestBackendClient(global) {
  "use strict";

  const VERSION = "20261107-backend-client-v1";
  const FALLBACK_URL = "https://script.google.com/macros/s/AKfycbzR4R-sQXvXfteglNgtQpzsLpiTEOaAYBX9YaCzn6IX_yRl5tI8kVw2XrPpT2Xue_cK-A/exec";
  const STATUS_ACTION = "getStudentAndAttemptStatus";

  function backendUrl() {
    return global.BioQuestBackend?.url || FALLBACK_URL;
  }

  async function request(params) {
    const isStatus = params.action === STATUS_ACTION;
    const queryParams = isStatus
      ? { ...params, _: String(Date.now()) }
      : { action: params.action, _: String(Date.now()) };
    const query = `?${new URLSearchParams(queryParams).toString()}`;
    const response = await global.fetch(`${backendUrl()}${query}`, {
      method: isStatus ? "GET" : "POST",
      cache: "no-store",
      headers: isStatus ? undefined : { "Content-Type": "text/plain;charset=utf-8" },
      body: isStatus ? undefined : JSON.stringify(params)
    });
    if (!response.ok) throw new Error(`backend_http_${response.status}`);
    const data = await response.json();
    if (!data || data.ok === false) throw new Error(data?.error || "backend_error");
    return data;
  }

  global.BioQuestBackendClient = Object.freeze({ version: VERSION, url: backendUrl, request });
})(window);
