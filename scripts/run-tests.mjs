#!/usr/bin/env node
// 執行全部站別的 node 測試，並阻擋瀏覽器連往外部網路（避免誤寫正式後台）。
// 用法：
//   npm install            # 第一次，安裝 playwright
//   BIOQUEST_WORKSPACE=../bioquest-workspace node scripts/run-tests.mjs [篩選字串...]
// 例：node scripts/run-tests.mjs prototype-enzymes prototype-photosynthesis
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filters = process.argv.slice(2);
const testDirs = fs
  .readdirSync(root)
  .filter((name) => name.startsWith("prototype-") || name === "teacher-dashboard-prototype")
  .map((name) => path.join(name, "tests"))
  .concat([path.join("scripts", "tests")]);

const files = testDirs
  .filter((dir) => fs.existsSync(path.join(root, dir)))
  .flatMap((dir) =>
    fs
      .readdirSync(path.join(root, dir))
      .filter((name) => /\.test\.(js|mjs)$/.test(name))
      .map((name) => path.join(dir, name)),
  )
  .filter((file) => filters.length === 0 || filters.some((f) => file.includes(f)))
  .sort();

// 把所有對外連線導向不存在的 proxy；本機測試 server（localhost／127.0.0.1）不受影響。
const blocked = "http://127.0.0.1:9";
const env = {
  ...process.env,
  HTTP_PROXY: blocked,
  HTTPS_PROXY: blocked,
  http_proxy: blocked,
  https_proxy: blocked,
  NO_PROXY: "localhost,127.0.0.1",
  no_proxy: "localhost,127.0.0.1",
};

const failed = [];
for (const file of files) {
  const result = spawnSync(process.execPath, [file], { cwd: root, env, encoding: "utf8", timeout: 180000 });
  const ok = result.status === 0;
  if (!ok) {
    const lines = `${result.stderr || ""}\n${result.stdout || ""}`
      .split("\n")
      .filter((line) => line.trim() && !/^\s+at /.test(line) && !/MODULE_TYPELESS|Reparsing as ES|add "type"|trace-warnings/.test(line));
    failed.push({ file, reason: lines.slice(0, 4).join(" | ").slice(0, 300) });
  }
  console.log(`${ok ? "PASS" : "FAIL"} ${file}`);
}
console.log(`\n通過 ${files.length - failed.length} / ${files.length}`);
for (const { file, reason } of failed) console.log(`- ${file}: ${reason}`);
process.exit(failed.length ? 1 : 0);
