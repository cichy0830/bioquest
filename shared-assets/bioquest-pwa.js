/* 生命祕境 BioQuest：加到主畫面（ROADMAP R2）
 * 註冊網站根目錄的 sw.js（範圍＝整個網站）。sw.js 只快取本站靜態檔，後台請求一律走網路。
 * 本檔放在 shared-assets/，sw.js 位置由本檔網址推算，入口頁與各站都能用同一行載入：
 *   <script src="../shared-assets/bioquest-pwa.js?v=..." defer></script>
 */
(function registerBioQuestPwa(global) {
  "use strict";

  const VERSION = "20261025-pwa-v1";
  const script = document.currentScript;
  const info = { version: VERSION, supported: false, registered: false, error: "" };
  global.BioQuestPwa = info;

  if (!("serviceWorker" in navigator) || !global.isSecureContext) return;
  if (!script || !script.src) return;
  info.supported = true;

  const swUrl = new URL("../sw.js", script.src);
  const scope = new URL("../", script.src);

  function register() {
    navigator.serviceWorker
      .register(swUrl.href, { scope: scope.href })
      .then((registration) => {
        info.registered = true;
        info.scope = registration.scope;
      })
      .catch((error) => {
        // 註冊失敗不影響任務本身，只是不能離線開啟
        info.error = String((error && error.message) || error);
      });
  }

  if (document.readyState === "complete") register();
  else global.addEventListener("load", register, { once: true });
})(window);
