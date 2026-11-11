M0 報告已確認，來源決定：（請在這裡寫你的決定，例如「Helsinki 3D 做建築，OSM 做其他」或「暫時只用 OSM」）

現在執行 Milestone 1（見 docs/MILESTONES.md）。

要求：
1. 建立專案結構（Vite + TypeScript + Three.js + vitest），pipeline 用 source adapter 分開 Helsinki 3D 和 OSM
2. 設定 cities/helsinki/city.config.json 的共用原點（EPSG:3879，Senate Square 附近），之後不可再改
3. 處理 areas/helsinki-kruununhaka 的建築、地形、道路、公園、水面；原始資料不 commit，處理後資料要 commit
4. 網頁顯示地面、水面、道路、建築（如有 LoD2 屋頂就用），正交相機可拖動縮放（手機也要可以用手指）
5. ?debug=1 面板：建築數量、缺高度數量、各來源數量、LoD1 / LoD2 數量、draw call、載入大小、FPS、3 個固定鏡頭按鈕
6. 頁面標示 Helsinki 3D 和 OSM 的來源
7. pipeline 基本單元測試：座標轉換、地標 id 不重複、建築高度不為空、manifest 有 schemaVersion
8. 用 qa-reviewer 在 3 個固定鏡頭加手機尺寸截圖，存入 screenshots/m1/
9. 確認 npm run build 可以在「不下載任何資料」的情況下成功
10. commit 並 push 到分支 m1；告訴我在 Cloudflare Pages 要填的設定（build command、output directory、Node 版本）

完成後只報告：做了甚麼、debug 面板的數字、測試結果、你覺得最大的問題。
