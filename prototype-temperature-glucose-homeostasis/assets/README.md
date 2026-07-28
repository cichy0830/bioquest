# U26 temperature_glucose_homeostasis assets

本資料夾只放已核准 runtime 素材與中性 fallback 所需檔案。U26 F-U26-01 briefing scene 與 F-U26-04 q07 / q12 科學圖表已由使用者核准；prep/report owl 與徽章仍未核准，runtime 不得接入待審圖。

已核准簡報素材：

- `temperature-glucose-homeostasis-briefing-azhe-wide.webp`：簡報頁阿澤老師正式場景，來源為 approved archive `u26-temperature-glucose-homeostasis-briefing-azhe-f-u26-01.webp`。
- `temperature-glucose-homeostasis-briefing-azhe-mobile.webp`：簡報頁手機 `<picture>` source，來源為 approved archive `sizes/u26-temperature-glucose-homeostasis-briefing-azhe-f-u26-01-960w.webp`。

已核准圖表素材：

- `u26-f-u26-04-q07-body-temperature-chart-base.svg`：q07 體溫曲線零文字底圖。
- `u26-f-u26-04-q12-glucose-insulin-chart-base.svg`：q12 血糖 / 胰島素曲線零文字底圖。
- `u26-f-u26-04-chart-data-overlay-spec.json`：q07 / q12 中文軸標、刻度、圖例、事件、caption / alt 與資料點契約，用於 QA 對照。

禁止接入 runtime：approved archive 的 `record_only/`、contact sheet、review preview、HTML preview、`_generated_sources` 或待審來源路徑。

正式素材核准後建議 hook：

- `temperature-glucose-homeostasis-entry-wide.webp`：一般頁純背景。
- `temperature-glucose-homeostasis-prep-owl.webp`：準備頁單元專屬貓頭鷹。
- `temperature-glucose-homeostasis-report-owl.webp`：若需要單元專屬回報貓頭鷹，需先由視覺線核准。

17 枚正式徽章預留於 `../shared-assets/badges/temperature_glucose_homeostasis/`。圖檔經使用者核准前，result 只可顯示本次達成的中性「圖像待核准」狀態，不建立不存在的圖片請求，也不在 achievements 輸出本單元徽章牆。
