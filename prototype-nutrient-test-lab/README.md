# 第 12 站互動實驗台（預覽版）

- 由 `prototype-nutrient-test` 複製後改寫；只在分支 `preview/nutrient-test-lab`，**不可合併到 dev 或 main**，待老師試玩核准後才取代原第 12 站。
- 新增「實驗台」頁（`lab.js`、`lab.css`）：先猜、碘液檢驗、本氏液加入與隔水加熱（需先戴護目鏡）、自動紀錄表、根據紀錄判斷、揭曉四支試管內容。不計分。
- 11 題依 `ROADMAP.md` 題目用語原則改寫，題號、選項代號、正解、`QUESTION_VERSION` 都不變（後台不需重新部署）；題目旁顯示學生自己做出的實驗紀錄。
- 預覽版另用 localStorage key `bioquest_nutrient_test_lab_state_v1`，不覆蓋原第 12 站的作答狀態；`unit_id` 仍是 `nutrient_test`，正式學號登入會寫入正式後台，試玩請用 guest。
