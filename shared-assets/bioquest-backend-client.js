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
 * 表單協定（第 1–13 站的寫法，R4-1c 起集中到這裡；各站原本的網址參數、快取設定與錯誤字樣不同，由選項保留）：
 *   getStatusForm(studentId, unitId, options)：GET ?action=getStudentAndAttemptStatus&student_id=…&unit_id=…&_=時間。
 *     HTTP 非 2xx → backend_<狀態碼>；回應內容直接交給各站判斷（不檢查 ok）。
 *     options.invalidJsonError：回應不是 JSON 時改丟這個錯誤字樣（第 5 站）。
 *   postForm(action, body, options)：POST ?action=…，body 為 URLSearchParams（formPayload／formFields 產生）。
 *     options.query：網址在 action 後面多帶的參數（依序）；options.cacheBust：網址加 _=時間；
 *     options.noStore：fetch 加 cache: "no-store"；options.failError：回應 ok 為假且沒有 error 時的錯誤字樣。
 *     HTTP 非 2xx → backend_<狀態碼>；回應 ok 為假 → 後台 error 或 failError。
 *   formPayload(obj)：payload=<JSON>；formFields(obj)：每個欄位各自一個表單欄位（物件轉 JSON，其他轉字串）。
 */
(function configureBioQuestBackendClient(global) {
  "use strict";

  const VERSION = "20261109-backend-client-v2";
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

  function formPayload(payload) {
    const body = new URLSearchParams();
    body.set("payload", JSON.stringify(payload));
    return body;
  }

  function formFields(payload) {
    const body = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => body.set(key, typeof value === "object" ? JSON.stringify(value) : String(value ?? "")));
    return body;
  }

  async function getStatusForm(studentId, unitId, options = {}) {
    const url = `${backendUrl()}?action=${STATUS_ACTION}&student_id=${encodeURIComponent(studentId)}&unit_id=${encodeURIComponent(unitId)}&_=${Date.now()}`;
    const response = await global.fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`backend_${response.status}`);
    if (!options.invalidJsonError) return response.json();
    try {
      return await response.json();
    } catch {
      throw new Error(options.invalidJsonError);
    }
  }

  async function postForm(action, body, options = {}) {
    let url = `${backendUrl()}?action=${encodeURIComponent(action)}`;
    Object.entries(options.query || {}).forEach(([key, value]) => { url += `&${key}=${encodeURIComponent(value)}`; });
    if (options.cacheBust) url += `&_=${Date.now()}`;
    const init = { method: "POST", body };
    if (options.noStore) init.cache = "no-store";
    const response = await global.fetch(url, init);
    if (!response.ok) throw new Error(`backend_${response.status}`);
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || options.failError || "backend_error");
    return data;
  }

  global.BioQuestBackendClient = Object.freeze({
    version: VERSION,
    url: backendUrl,
    request,
    getStatusForm,
    postForm,
    formPayload,
    formFields
  });
})(window);
