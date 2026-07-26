# U26 temperature_glucose_homeostasis assets

本資料夾只放已核准 runtime 素材與中性 fallback 所需檔案。U26 F-U26-04 的 q07 / q12 科學圖表已由使用者核准，其餘 briefing scene、prep/report owl 與徽章仍未核准，runtime 不得接入待審圖。

已核准圖表素材：

- `u26-f-u26-04-q07-body-temperature-chart-base.svg`：q07 體溫曲線零文字底圖。
- `u26-f-u26-04-q12-glucose-insulin-chart-base.svg`：q12 血糖 / 胰島素曲線零文字底圖。
- `u26-f-u26-04-chart-data-overlay-spec.json`：q07 / q12 中文軸標、刻度、圖例、事件、caption / alt 與資料點契約，用於 QA 對照。

禁止接入 runtime：approved archive 的 `record_only/`、contact sheet、review preview、HTML preview、`_generated_sources` 或待審來源路徑。

正式素材核准後建議 hook：

- `temperature-glucose-homeostasis-entry-wide.webp`：一般頁純背景。
- `temperature-glucose-homeostasis-briefing-azhe-wide.webp`：簡報頁 safe scene。
- `temperature-glucose-homeostasis-briefing-azhe-mobile.webp`：若視覺線另提供手機版，再接入 `<picture>`。
- `temperature-glucose-homeostasis-prep-owl.webp`：準備頁單元專屬貓頭鷹。
- `temperature-glucose-homeostasis-report-owl.webp`：若需要單元專屬回報貓頭鷹，需先由視覺線核准。

17 枚正式徽章預留於 `../shared-assets/badges/temperature_glucose_homeostasis/`。圖檔落地前，收藏牆顯示中性「正式徽章素材待接」狀態並保留亮燈/灰階條件，不使用幾何徽章 placeholder。
