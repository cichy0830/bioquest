// 跨站成就一致性 2a（結算頁）：把後台模擬的提交回應注入第 13–23 站，作答到提交，
// 檢查結算頁與提交後成就頁；含「再挑戰有 retry_exp」情境。
// 會啟動 Playwright（瀏覽器對外連線由 run-tests.mjs 阻擋；Apps Script 請求全部被攔截）。
import assert from "node:assert/strict";
import { runResultAudit } from "../audit-achievement-result.mjs";

// 已知、已回報老師但尚未修正的差異。修正後請從這裡移除，讓測試重新守住。
const KNOWN_ISSUES = [
  /^\[photosynthesis[^\]]*\] 結算頁沒有回到頁首/, // submitMission 結尾沒有捲回頁首（22 站共同問題，2026-10-08 記錄，整頓時處理）
  // 第 18 站 14 枚徽章只有 2 枚有正式圖（其餘 image_status=pending，刻意不顯示、不請求缺圖）；2026-10-18 已列生圖需求，圖接上後移除
  /^\[cardiovascular_components[^\]]*\] 本次徽章少顯示 \d+ 枚/,
  /^\[cardiovascular_components[^\]]*\] 提交後總覽本站縮圖 \d+ 張/,
  // 第 19 站 15 枚徽章只有 4 枚有正式圖（其餘 image_status=pending）；2026-10-20 已列生圖需求，圖接上後移除
  /^\[human_circulation[^\]]*\] 本次徽章少顯示 \d+ 枚/,
  /^\[human_circulation[^\]]*\] 提交後總覽本站縮圖 \d+ 張/,
  // 第 21 站 15 枚徽章皆尚無正式圖（image_status=pending）；2026-10-24 已列生圖需求，圖接上後移除
  /^\[nervous_system[^\]]*\] 本次徽章少顯示 \d+ 枚/,
  /^\[nervous_system[^\]]*\] 提交後總覽本站縮圖 \d+ 張/,
  // 第 22 站 15 枚徽章皆尚無正式圖（image_status=pending、badgeAsset 回傳空字串）；圖接上後移除
  /^\[endocrine_system[^\]]*\] 本次徽章少顯示 \d+ 枚/,
  /^\[endocrine_system[^\]]*\] 提交後總覽本站縮圖 \d+ 張/,
  // 第 23 站 15 枚徽章皆尚無正式圖（image_status=pending、badgeAsset 回傳空字串）；圖接上後移除
  /^\[behavior_sensing[^\]]*\] 本次徽章少顯示 \d+ 枚/,
  /^\[behavior_sensing[^\]]*\] 提交後總覽本站縮圖 \d+ 張/,
];

const result = await runResultAudit();
if (result.skipped) {
  console.log(`略過：${result.reason}`);
  process.exit(0);
}
assert.ok(result.checked.some((c) => c.retry_exp > 0), "應包含後台給 retry_exp > 0 的再挑戰情境");
const lines = result.failures.map((f) => `[${f.where}] ${f.message}`);
const unexpected = lines.filter((line) => !KNOWN_ISSUES.some((re) => re.test(line)));
assert.deepEqual(unexpected, [], `結算頁出現新的不一致：\n${unexpected.join("\n")}`);
for (const re of KNOWN_ISSUES) assert.ok(lines.some((line) => re.test(line)), `已知問題 ${re} 已不再出現，請從 KNOWN_ISSUES 移除`);

// 自我驗證：竄改注入的提交回應，檢查必須抓得到（避免檢查形同虛設）
const tampered = await runResultAudit({
  units: ["enzymes"],
  scenarios: ["retry"],
  mutateSubmit(res) {
    const v = res.verified_attempt;
    v.retry_exp += 5;
    v.attempt_total_exp += 5;
    v.badges = v.badges.slice(1);
    res.student_progress.total_exp += 9;
    return res;
  },
});
const tamperedLines = tampered.failures.map((f) => f.message).join("\n");
assert.match(tamperedLines, /EXP 明細「再挑戰補分」顯示 \d+，後台 \d+/, "竄改 retry_exp 應被抓到");
assert.match(tamperedLines, /本次取得顯示 \d+ EXP，後台 attempt_total_exp=/, "竄改 attempt_total_exp 應被抓到");
assert.match(tamperedLines, /本次徽章少顯示 1 枚/, "少給一枚徽章應被抓到");
assert.match(tamperedLines, /提交後成就頁沒有顯示累積 \d+ EXP/, "竄改累積 EXP 應被抓到");

console.log(`achievement result audit passed (${result.checked.length} 次提交, 已知問題 ${lines.length} 項, 備註 ${result.notes.length} 項)`);
