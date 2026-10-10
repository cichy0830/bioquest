// 跨站成就一致性 2a（前端部分）：把後台模擬的登入回應注入第 1–15 站，檢查成就頁顯示。
// 會啟動 Playwright（瀏覽器對外連線由 run-tests.mjs 阻擋；Apps Script 請求全部被攔截）。
import assert from "node:assert/strict";
import { runInjectionAudit } from "../audit-achievement-injection.mjs";

// 已知、已回報老師但尚未修正的差異。修正後請從這裡移除，讓測試重新守住。
const KNOWN_ISSUES = [
  /^\[[a-z_]+@\d+\] 稱號頭像=/, // 後台登入回應沿用 StudentProgress 舊頭像（性別錯、升級後未更新）（2026-10-10 回報）
];

const result = await runInjectionAudit();
if (result.skipped) {
  console.log(`略過：${result.reason}`);
  process.exit(0);
}
assert.equal(result.checked.length, result.units.length * 2, "每站應檢查手機與桌機兩種視窗");
const lines = result.failures.map((f) => `[${f.where}] ${f.message}`);
const unexpected = lines.filter((line) => !KNOWN_ISSUES.some((re) => re.test(line)));
assert.deepEqual(unexpected, [], `成就頁出現新的不一致：\n${unexpected.join("\n")}`);
for (const re of KNOWN_ISSUES) assert.ok(lines.some((line) => re.test(line)), `已知問題 ${re} 已不再出現，請從 KNOWN_ISSUES 移除`);

// 自我驗證：竄改注入資料，檢查必須抓得到（避免檢查形同虛設）
const tampered = await runInjectionAudit({
  units: ["scale"],
  viewports: [{ width: 390, height: 844 }],
  mutateLogin(login) {
    const p = login.progress;
    p.total_exp += 7;
    const summary = JSON.parse(p.unit_badge_summary_json);
    summary[0].earned_count += 1;
    p.unit_badge_summary_json = JSON.stringify(summary);
    return login;
  },
});
const tamperedLines = tampered.failures.map((f) => f.message).join("\n");
assert.match(tamperedLines, /沒有顯示累積 \d+ EXP/, "竄改 total_exp 應被抓到");
assert.match(tamperedLines, /總覽 scale 顯示 \d+\/\d+，後台 earned_count=/, "竄改 earned_count 應被抓到");

console.log(`achievement injection audit passed (${result.checked.length} 個站×視窗, 已知問題 ${lines.length} 項, 備註 ${result.notes.length} 項)`);
