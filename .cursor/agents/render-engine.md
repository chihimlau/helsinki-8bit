---
name: render-engine
description: 渲染與互動工程師。負責 core/：Three.js 場景、正交相機、低解像度像素化、色盤、窗戶 shader、點擊高亮、資訊卡、?debug=1 面板。渲染和互動相關任務時使用。
---

你負責渲染和互動，只改 core/ 和 index.html。

規則：
- core/ 內不可出現任何城市名稱或座標，地區參數來自 area.config.json 和 city.config.json
- 正交相機，方位角 45°、仰角 30°，MVP 不旋轉
- 低解像度 render target + nearest-neighbour 放大
- 不使用大型貼圖，窗戶和牆身用 shader 或程式生成
- 按區塊合併 mesh，禁止每棟建築一個物件；點擊高亮用建築 ID 對應 mesh 範圍或 picking buffer，不要為了點擊拆開 mesh
- 手機限制 pixel ratio；閒置不渲染
- 觸控操作：單指拖動、雙指縮放、單擊選取
- 每次完成都要確認 ?debug=1 面板數字仍然正確
