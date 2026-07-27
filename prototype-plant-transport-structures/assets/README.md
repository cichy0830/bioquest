# 植物的運輸構造素材接線

目前學生端使用正式 briefing scene、正式 prep/report owl、正式準備區概念總覽圖，以及不洩答的 CSS ambient botanical 背景。checkpoint 背景暫不接 bitmap；新的 U16 checkpoint ambient 圖需使用者核准後才可接線。

視覺素材核准後，請依 `app.js` 的 `assets` hook 補入：

- `plant-transport-structures-briefing-azhe-wide`
- `plant-transport-structures-briefing-azhe-mobile`
- `plant-transport-structures-root-hair`
- `plant-transport-structures-vascular-bundle`
- `plant-transport-structures-xylem-phloem`
- `plant-transport-structures-leaf-vein`

`plant-transport-structures-evidence-overview.webp` 只可用於準備區概念總覽，不得當作 checkpoint / 全頁背景，以免把作答證據和裝飾混用。

13 枚 active 徽章預留於 `../shared-assets/badges/plant_transport_structures/`。目前只有 `plant_transport_structures_entry` 與 `plant_transport_structures_flawless` 有正式 WebP；其餘 11 枚維持 controlled pending，不輸出不存在的圖片，也不在 result / achievements 冒充已有圖。
