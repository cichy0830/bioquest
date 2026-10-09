// 跨站成就一致性 2a：後台累積模擬（第 1–15 站）。
// 不連網路；需要 bioquest-workspace（BIOQUEST_WORKSPACE 或相鄰資料夾）。
import assert from "node:assert/strict";
import { runSimulation } from "../simulate-achievement-progress.mjs";

// 已知、已回報老師但尚未修正的差異。修正後請從這裡移除，讓測試重新守住。
const KNOWN_ISSUES = [
  /^\[photosynthesis(#\d)?\] /, // 第 14 站：後台無徽章目錄、前端未送 badge_eval_json（2026-10-09 回報）
];

const result = runSimulation();
if (result.skipped) {
  console.log(`略過：${result.reason}`);
  process.exit(0);
}

assert.equal(result.steps.length, result.units.length * 3, "每站應完成 3 次提交");
const lines = result.failures.map((f) => `[${f.where}] ${f.message}`);
const unexpected = lines.filter((line) => !KNOWN_ISSUES.some((re) => re.test(line)));
assert.deepEqual(unexpected, [], `出現新的成就累積不一致：\n${unexpected.join("\n")}`);
for (const re of KNOWN_ISSUES) {
  assert.ok(lines.some((line) => re.test(line)), `已知問題 ${re} 已不再出現，請從 KNOWN_ISSUES 移除`);
}
// 每站最佳成績 500 → 15 站共 7500 EXP，稱號「微觀探索者」
assert.equal(result.finalTotal, result.units.length * 500);
assert.equal(result.finalTitle, "micro_explorer");
console.log(`achievement progress simulation passed (${result.units.length} 站, ${result.steps.length} 次提交, 已知問題 ${lines.length} 項)`);
