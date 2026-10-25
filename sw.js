/* 生命祕境 BioQuest service worker（ROADMAP R2：加到主畫面）
 *
 * 原則：
 * - 只處理本站（同源）的 GET 請求；Apps Script 等外部請求、POST 一律不碰，照常走網路，
 *   正式成績與後台資料不會被快取。
 * - 網頁（HTML、換頁）：先走網路，離線時才用上次快取的版本（網址的 ?v= 不同也可）。
 * - 有 ?v= 版本號的 JS／CSS：版本號就是快取鍵，先用快取（改版時各站會換 ?v=）。
 * - 沒有版本號的 JS／CSS、JSON、manifest：先走網路，失敗才用快取。
 * - 圖片、字型：先用快取並在背景更新；圖片快取有數量上限。
 * - 只在執行時快取，不預先下載整站（避免學生手機一次下載大量圖片）。
 *
 * 要停用：把 VERSION 改掉並讓 fetch 處理器直接 return，或改用會 unregister 的版本部署。
 */
"use strict";

const VERSION = "20261025-pwa-v1";
const CACHE_PREFIX = "bioquest-";
const PAGE_CACHE = `${CACHE_PREFIX}pages-${VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-${VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${VERSION}`;
const CURRENT_CACHES = [PAGE_CACHE, ASSET_CACHE, IMAGE_CACHE];
const MAX_IMAGE_ENTRIES = 300;
const MAX_ASSET_ENTRIES = 200;
const MAX_PAGE_ENTRIES = 80;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

function classify(request, url) {
  if (request.mode === "navigate" || request.destination === "document") return "page";
  const path = url.pathname;
  if (/\.(?:png|jpe?g|webp|gif|svg|ico|avif)$/i.test(path) || request.destination === "image") return "image";
  if (/\.(?:woff2?|ttf|otf)$/i.test(path) || request.destination === "font") return "image";
  if (/\.(?:js|mjs|css)$/i.test(path)) return url.searchParams.has("v") ? "versioned" : "fresh";
  if (/\.(?:json|webmanifest)$/i.test(path)) return "fresh";
  return null;
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}

function cacheable(response) {
  return response && response.ok && response.type === "basic";
}

async function networkFirst(event, cacheName, max, ignoreSearch = false) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(event.request);
    if (cacheable(response)) {
      const copy = response.clone();
      event.waitUntil(cache.put(event.request, copy).then(() => trimCache(cacheName, max)));
    }
    return response;
  } catch (error) {
    const cached = (await cache.match(event.request)) || (ignoreSearch ? await cache.match(event.request, { ignoreSearch: true }) : undefined);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(event, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (cacheable(response)) {
    const copy = response.clone();
    event.waitUntil(cache.put(event.request, copy).then(() => trimCache(cacheName, max)));
  }
  return response;
}

async function staleWhileRevalidate(event, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const update = fetch(event.request)
    .then(async (response) => {
      if (cacheable(response)) {
        await cache.put(event.request, response.clone());
        await trimCache(cacheName, max);
      }
      return response;
    });
  if (cached) {
    event.waitUntil(update.catch(() => undefined));
    return cached;
  }
  return update;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const scopePath = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scopePath)) return;
  if (request.headers.has("range")) return;

  const kind = classify(request, url);
  if (kind === "page") event.respondWith(networkFirst(event, PAGE_CACHE, MAX_PAGE_ENTRIES, true));
  else if (kind === "versioned") event.respondWith(cacheFirst(event, ASSET_CACHE, MAX_ASSET_ENTRIES));
  else if (kind === "fresh") event.respondWith(networkFirst(event, ASSET_CACHE, MAX_ASSET_ENTRIES));
  else if (kind === "image") event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE, MAX_IMAGE_ENTRIES));
});
