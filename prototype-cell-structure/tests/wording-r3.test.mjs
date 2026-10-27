#!/usr/bin/env node
// ROADMAP R3 第 6 站題目用語修正（2026-10-27）：
// - 第 6 站後台以文字比對 → 正解文字、構造名稱、功能選項文字、比較欄代號與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、關卡說明不含內部用語
// - 關卡四正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - QUESTION_VERSION 不變
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

function constValue(name, open = "[", close = "\n];") {
  const start = source.indexOf(`const ${name} = ${open}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(close, start);
  return Function(`"use strict"; return ${source.slice(start + `const ${name} = `.length, end + close.length - 1)};`)();
}

// 後台正解（cell_structure，question_version 20260720-cell-structure-canonical-v1）
const backend = {
  q01: { nucleus: "細胞核", mitochondrion: "粒線體", chloroplast: "葉綠體", large_vacuole: "液胞" },
  q02: "是許多代謝作用進行的場所，內有各種胞器",
  q03: "粒線體", q04: "液胞", q05: "細胞膜", q06: "細胞壁", q07: "葉綠體",
  q08: { 細胞核: "both", 細胞質: "both", 粒線體: "both", 液胞: "both", 細胞膜: "both", 細胞壁: "plantTypical", 葉綠體: "depends" },
  q09: "動植物細胞都有液胞，但植物細胞常有較明顯的大型液胞",
  q10: "葉綠體和光合作用有關，不是每一種植物細胞都一定有",
  q11: "細胞膜", q12: "細胞壁",
  q13: "粒線體：呼吸作用產生能量；葉綠體：光合作用製造葡萄糖"
};

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  cell_structure: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes('question_version: "20260720-cell-structure-canonical-v1"'));
  const map = (obj) => Object.entries(obj).map(([k, v]) => `${k}: "${v}"`).join(", ");
  for (const [qid, answer] of Object.entries(backend)) {
    const expected = typeof answer === "string"
      ? `${qid}: { type: "choice", answer: "${answer}"`
      : `${qid}: { type: "mapping", answer: { ${map(answer)} }`;
    assert.ok(block.includes(expected), `${qid} 後台答案不符`);
  }
}

assert.ok(source.includes('const QUESTION_VERSION = "20260720-cell-structure-canonical-v1"'), "question_version 不可改");

// 關卡一：構造代號與名稱
const cp1 = constValue("checkpoint1Items");
const logIds = constValue("CHECKPOINT1_TARGET_LOG_IDS", "{", "\n};");
assert.deepEqual(Object.fromEntries(cp1.map((i) => [logIds[i.id], i.answer])), backend.q01, "q01 構造名稱不可改");

// 關卡二：功能選項文字（q02 直接送文字；q03–q07 由功能文字反查構造名稱）
const cp2 = constValue("checkpoint2Items");
assert.equal(cp2.find((i) => i.id === "cytoplasm").answer, backend.q02, "q02 細胞質功能文字不可改");
const labelOf = (id) => cp2.find((i) => i.id === id).label;
assert.deepEqual([labelOf("mitochondria"), labelOf("vacuole"), labelOf("membrane"), labelOf("wall"), labelOf("chloroplast")],
  [backend.q03, backend.q04, backend.q05, backend.q06, backend.q07], "q03–q07 構造名稱不可改");
assert.equal(new Set(cp2.map((i) => i.answer)).size, cp2.length, "功能選項文字不可重複");

// 關卡三：比較欄代號
const categories = constValue("compareCategories");
const compare = {};
categories.forEach((c) => c.answers.forEach((token) => { compare[token] = c.id; }));
assert.deepEqual(compare, backend.q08, "q08 比較分類不可改");

// 關卡四
const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|target|保留原色|canonical|修正較合理|最合理|最可能/;
const cp4 = constValue("misconceptionQuestions");
const cp4Answers = { vacuole: backend.q09, chloroplast: backend.q10, membrane: backend.q11, wall: backend.q12, energy: backend.q13 };
assert.deepEqual(cp4.map((q) => q.id), ["vacuole", "wall", "chloroplast", "membrane", "energy"]);
for (const q of cp4) {
  assert.equal(q.answer, cp4Answers[q.id], `${q.id} 正解文字不可改`);
  assert.equal(q.options.filter((o) => o === q.answer).length, 1, `${q.id} 正解應恰好出現一次`);
  assert.equal(new Set(q.options).size, 4, `${q.id} 選項不可重複`);
  const longestWrong = Math.max(...q.options.filter((o) => o !== q.answer).map((o) => [...o].length));
  assert.ok([...q.answer].length - longestWrong <= 5, `${q.id} 正解比誘答長太多：${q.answer}`);
  for (const text of [q.question, q.hint, ...q.options]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}

for (const item of cp1) assert.ok(!internalTerms.test(item.hint), `關卡一提示含內部用語：${item.hint}`);
const fnHints = source.slice(source.indexOf("function functionHint(id)"), source.indexOf("const compareTokens"));
assert.ok(!internalTerms.test(fnHints), "關卡二提示含內部用語");
assert.ok(!/控制物質進出|和光合作用有關|和儲存水分、養分或廢物有關/.test(fnHints), "關卡二提示不可直接寫出功能選項");

for (const phrase of [
  "目前 target", "完成所有 target", "唯一保留原色", "細胞掃描標記", "<h2>動植物比較</h2>", "迷思修正任務",
  "貓頭鷹助理預習掃描", "胞器掃描準備", "細胞掃描資料", "掃描資料：", "待修復標籤", "細胞工廠掃描站", "正在發光",
  "植物細胞較典型或特有", "需要看細胞種類", "五個觀察工具", "提示不是扣分陷阱"
]) {
  assert.ok(!source.includes(phrase), `不應再出現：${phrase}`);
}
assert.ok(!index.includes(">掃描<"), "步驟列不應再顯示「掃描」");

console.log("cell structure wording r3 test passed");
