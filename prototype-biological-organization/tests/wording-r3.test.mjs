#!/usr/bin/env node
// ROADMAP R3 第 9 站題目用語修正（2026-10-30）：
// - 第 9 站後台以選項代號比對 → 正解代號與後台 10_canonical_registry.gs 一致
// - 學生看得到的題幹、提示、選項、圖說不含內部用語
// - 選擇題正解選項不比最長的誘答長超過 5 個字（不靠字數洩答）
// - QUESTION_VERSION 不變；排序與分類題答案不變
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");

function constValue(name, open = "[", close = "\n];") {
  const start = source.indexOf(`const ${name} = ${open}`);
  assert.ok(start >= 0, `找不到 ${name}`);
  const end = source.indexOf(close, start);
  const body = source.slice(start + `const ${name} = `.length, end + close.length - 1).replace(/assets\.(\w+)/g, '"$1"');
  return Function(`"use strict"; return ${body};`)();
}

// 後台正解（biological_organization，question_version 20260716-biological-organization-canonical-v1）
const backend = {
  q03: "individual", q04: "composed", q05: "similar_cells", q06: "organ", q07: "system", q08: "stomach_organ",
  q09: "complete_individual", q11: "one_cell_individual", q13: "organ", q14: "both_organs"
};
const backendMapping = {
  q02: { muscle_cell: "cell", muscle_tissue: "tissue", heart: "organ", circulatory: "system", person: "individual" },
  q10: { paramecium: "single", amoeba: "single", yeast: "single", human: "multi", banyan: "multi", butterfly: "multi" },
  q12: { root: "vegetative", stem: "vegetative", leaf: "vegetative", flower: "reproductive", fruit: "reproductive", seed: "reproductive" }
};

const workspace = process.env.BIOQUEST_WORKSPACE;
const registryFile = workspace && path.join(workspace, "05_教師後台", "10_canonical_registry.gs");
if (registryFile && fs.existsSync(registryFile)) {
  const registry = fs.readFileSync(registryFile, "utf8");
  const start = registry.indexOf("  biological_organization: {");
  const block = registry.slice(start, registry.indexOf("\n    reflection:", start));
  assert.ok(block.includes('question_version: "20260716-biological-organization-canonical-v1"'));
  assert.ok(block.includes('q01: { type: "sequence", answer: ["cell", "tissue", "organ", "system", "individual"]'));
  for (const [qid, answer] of Object.entries(backend)) {
    assert.ok(block.includes(`${qid}: { type: "choice", answer: "${answer}"`), `${qid} 後台答案不符`);
  }
  for (const [qid, map] of Object.entries(backendMapping)) {
    const text = Object.entries(map).map(([k, v]) => `${k}: "${v}"`).join(", ");
    assert.ok(block.includes(`${qid}: { type: "mapping", answer: { ${text} }`), `${qid} 後台分類答案不符`);
  }
}

assert.ok(source.includes('const QUESTION_VERSION = "20260716-biological-organization-canonical-v1"'), "question_version 不可改");
assert.ok(source.includes('const correctSequence = ["cell", "tissue", "organ", "system", "individual"];'), "排序答案不可改");

const internalTerms = /資料卡|觀察紀錄|證據|判讀|候選|掃描|校準|未標註|干擾|脈絡|較支持|較合理|最合理|最可能|最適合|最符合|較符合|檢核|修正合理|哪個比較正確/;
const questions = constValue("questions");
assert.deepEqual(questions.map((q) => q.id), Object.keys(backend));
for (const q of questions) {
  assert.equal(q.answer, backend[q.id], `${q.id} 正解代號不可改`);
  const ids = q.options.map((o) => o.id);
  assert.equal(new Set(ids).size, 4, `${q.id} 選項代號不可重複`);
  assert.equal(ids.filter((id) => id === q.answer).length, 1, `${q.id} 正解應恰好出現一次`);
  const texts = q.options.map((o) => o.text);
  assert.equal(new Set(texts).size, 4, `${q.id} 選項文字不可重複`);
  const answerText = q.options.find((o) => o.id === q.answer).text;
  const longestWrong = Math.max(...q.options.filter((o) => o.id !== q.answer).map((o) => [...o.text].length));
  assert.ok([...answerText].length - longestWrong <= 5, `${q.id} 正解比誘答長太多：${answerText}`);
  for (const text of [q.prompt, q.hint, q.imageAlt || "", q.imageEvidence || "", ...texts]) assert.ok(!internalTerms.test(text), `${q.id} 含內部用語：${text}`);
}
// 同一關卡內同一張圖只放一次（含關卡頂端的大圖）
const checkpointHeadImages = {
  checkpoint1: [],
  checkpoint2: ["relationExamples"],
  checkpoint3: ["unicellularExamples", "plantOrgans"]
};
for (const [section, headImages] of Object.entries(checkpointHeadImages)) {
  const imgs = [...headImages, ...questions.filter((q) => q.section === section && q.image).map((q) => q.image)];
  assert.equal(new Set(imgs).size, imgs.length, `${section} 同一張圖重複出現`);
}
// 分類題答案與後台一致
const classify = constValue("classifyQuestions", "{", "\n};");
for (const [qid, map] of Object.entries(backendMapping)) {
  assert.deepEqual(Object.fromEntries(classify[qid].items.map((item) => [item.id, item.answer])), map, `${qid} 分類答案不可改`);
  for (const text of [classify[qid].prompt, classify[qid].hint]) assert.ok(!internalTerms.test(text), `${qid} 含內部用語：${text}`);
}

const screens = source.slice(source.indexOf("function renderBrief()"), source.indexOf("function isCorrect(qid)"))
  + source.slice(source.indexOf("function renderReview()"), source.indexOf("function renderReflection()"));
assert.ok(!/掃描|未標註|判讀|較合理|檢核|證據/.test(screens), "簡報、準備頁、關卡或回饋畫面仍有內部用語");

console.log("biological organization wording r3 test passed");
