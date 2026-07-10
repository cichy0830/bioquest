# 生命祕境 BioQuest

七年級生物自主學習互動網頁測試版。

本次公開測試版包含：

- 多彩多姿的生命世界
- 探究自然的科學方法
- 進入實驗室
- 生物體的基本單位

測試目的：

- 檢查 GitHub Pages 發布後的圖片與連結路徑
- 檢查手機瀏覽與互動操作
- 蒐集畢業生或測試者的操作回饋

本 repository 不應放入學生正式名單、備課用書 PDF、內部規格文件或未公開素材。

## GitHub Pages 更新流程

每次原型或入口頁更新後，發布包都要同步更新，避免本機可測但 GitHub Pages 仍顯示舊版。

最小流程：

1. 在主工作區完成原型修改與基本語法檢查。
2. 將更新過的 `index.html`、`portal.js`、`portal.css` 與相關 `prototype-*` 資料夾同步複製到 `_publish/bioquest/`。
3. 確認 `_publish/bioquest/` 內的 cache busting 版本與主工作區一致。
4. 在發布 repository 中檢查變更，確認沒有放入學生正式名單、內部規格文件或未公開素材。
5. commit。
6. push 到 GitHub Pages 對應分支。
7. 等 GitHub Pages 更新後，用公開網址檢查入口頁、圖片路徑與三種進入方式。

注意：

- 只更新主工作區 prototype 不會自動更新 GitHub Pages。
- 若角色圖、背景圖或題目互動有改，必須同步複製該單元完整資料夾。
- 若入口頁 URL 或 cache busting 有改，必須同步更新 `_publish/bioquest/index.html` 與 `_publish/bioquest/portal.js`。
