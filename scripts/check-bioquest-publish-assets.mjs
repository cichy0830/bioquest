#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publishRoot = path.join(root, "_publish", "bioquest");
const bundledModules = "/Users/biomin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const sharp = (() => {
  try { return require("sharp"); }
  catch (_error) { return require(path.join(process.env.NODE_PATH || bundledModules, "sharp")); }
})();

async function walk(directory) {
  const output = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute));
    else output.push(absolute);
  }
  return output;
}

function categoryFor(file) {
  const normalized = file.split(path.sep).join("/").toLowerCase();
  const name = path.basename(normalized);
  if (normalized.includes("/badges/") || name.includes("badge")) return ["badges", 384];
  if (normalized.includes("title-avatars") || /(mentor|owl|avatar)/.test(name)) return ["characters", 768];
  if (/(^|\/)(bg-|.*briefing|.*ambient|.*cover|.*entry-wide|.*station-scene)/.test(normalized)) return ["backgrounds", 1920];
  if (name.startsWith("human-nutrition-digestive-system-map")) return ["question_and_ui", 1600];
  if (name.startsWith("egg-observation-cross-section-hotspot-base")) return ["question_and_ui", 1600];
  if (name.startsWith("asexual-reproduction-q05-hydra-budding-observation")) return ["question_and_ui", 1600];
  if (name.startsWith("asexual-reproduction-q12-cutting-materials-data")) return ["question_and_ui", 1600];
  return ["question_and_ui", 1280];
}

function localAssetReferences(content) {
  const refs = new Set();
  const patterns = [
    /(?:src|srcset|data-[\w-]+)=["']([^"']+\.webp(?:[?#][^"']*)?)["']/gi,
    /url\(["']?([^"')]+\.webp(?:[?#][^"')]+)?)['"]?\)/gi,
    /["']((?:\.\.\/|\.\/|assets\/|shared-assets\/|prototype-)[^"']+\.webp(?:[?#][^"']*)?)["']/gi
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) refs.add(match[1]);
  }
  return [...refs].filter((ref) => !ref.includes("${") && !/^https?:/i.test(ref));
}

const files = await walk(publishRoot);
const generatedDirectories = new Set(files.filter((file) => file.includes(`${path.sep}_generated_sources${path.sep}`)).map((file) => file.split(`${path.sep}_generated_sources${path.sep}`)[0]));
if (generatedDirectories.size) throw new Error(`generated sources remain: ${[...generatedDirectories].join(", ")}`);

const legacyImages = files.filter((file) => /\.(png|jpe?g)$/i.test(file));
if (legacyImages.length) throw new Error(`legacy public images remain: ${legacyImages.slice(0, 8).join(", ")}`);

const webpFiles = files.filter((file) => /\.webp$/i.test(file));
const categoryCounts = {};
const categoryBytes = {};
let imageBytes = 0;
for (const file of webpFiles) {
  const [category, limit] = categoryFor(file);
  const fileStat = await fs.stat(file);
  const metadata = await sharp(file).metadata();
  if (metadata.format !== "webp" || !metadata.width || !metadata.height) throw new Error(`invalid webp: ${file}`);
  if (Math.max(metadata.width, metadata.height) > limit) throw new Error(`oversized ${category}: ${path.relative(publishRoot, file)} ${metadata.width}x${metadata.height}`);
  categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  categoryBytes[category] = (categoryBytes[category] || 0) + fileStat.size;
  imageBytes += fileStat.size;
}

const runtimeReferenceFiles = files.filter((item) => {
  const normalized = item.split(path.sep).join("/");
  return /\.(html|css|js)$/i.test(item) && !normalized.includes("/tests/");
});
const missing = [];
for (const file of runtimeReferenceFiles) {
  const content = await fs.readFile(file, "utf8");
  for (const reference of localAssetReferences(content)) {
    const clean = reference.split(/[?#]/)[0];
    const absolute = path.resolve(path.dirname(file), clean);
    try { await fs.access(absolute); }
    catch (_error) { missing.push(`${path.relative(publishRoot, file)} -> ${reference}`); }
  }
}
if (missing.length) throw new Error(`missing public asset references:\n${missing.slice(0, 30).join("\n")}`);

const portal = await fs.readFile(path.join(publishRoot, "portal.js"), "utf8");
const readyUrls = [...portal.matchAll(/status:\s*"ready"[\s\S]*?url:\s*"([^"?]+)(?:\?[^"/]*)?"/g)].map((match) => match[1]);
for (const url of readyUrls) {
  const target = path.join(publishRoot, url, "index.html");
  try { await fs.access(target); }
  catch (_error) { throw new Error(`ready portal target missing: ${url}`); }
}

let totalBytes = 0;
for (const file of files) totalBytes += (await fs.stat(file)).size;
console.log(JSON.stringify({ webpFiles: webpFiles.length, checkedFiles: files.length, readyUrls: readyUrls.length, totalBytes, imageBytes, categoryCounts, categoryBytes }, null, 2));
