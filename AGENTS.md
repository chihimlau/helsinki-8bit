# 項目：Helsinki 8-bit City

## 一句話目標
做一個在瀏覽器（手機和電腦）運行的像素風 3D 城市地圖。
風格參考 Isometric Warsaw：3D 場景、低解像度渲染後放大、限定色盤、窗戶紋理、地標 pin。
MVP 只做一個區域：`helsinki-kruununhaka`（Senate Square、Helsinki Cathedral、Government Palace、大學主樓、國家圖書館、Market Square），約 1km x 1km。
第二個區域 `helsinki-kluuvi` 要到 M5 才做。

## 最高優先：成本與效能
- 純靜態網站。不使用後端、資料庫、付費 API、圖像生成模型
- 部署：Cloudflare Pages（免費方案）。限制：每個 site 最多 20,000 個檔案、單檔最大 25 MiB
- 內部渲染解像度固定約 480x270，再用 nearest-neighbour 放大
- 不使用大型貼圖。窗戶和牆身用 shader 或程式生成
- 建築按區塊合併成少數 mesh，禁止每棟建築一個獨立物件
- 地圖資料分 chunk，只載入視野附近的；資料用壓縮或二進位格式，瀏覽器不載入原始 GeoJSON / CityGML
- 手機限制 pixel ratio；閒置時不持續渲染（按需渲染）
- 效能預算：首次載入 < 2MB、4G 下 3 秒內見到畫面、中階手機 > 30 FPS
- 做成 PWA。保持純網頁技術，之後用 Capacitor 包裝成 App

## 資料來源（見 docs/DATA-SOURCES.md）
- 建築形狀、高度、屋頂、地形：**Helsinki 3D 城市資訊模型**（CityGML，LoD1 / LoD2），主要來源
- 道路、公園、水面、樹：OpenStreetMap
- **不可把 Helsinki 3D 的 3D mesh（OBJ / 3MX，有貼圖）放進網頁**，太重。最多當作離線參考
- 若 Helsinki 3D 下載不可用，退而使用 OSM 建築，並在報告中明確告訴我
- 頁面必須標示：Helsinki 3D © City of Helsinki (CC BY 4.0) 和 © OpenStreetMap contributors

## 架構硬性規則
1. `core/` 內不可出現任何城市名稱或座標。所有地區資訊只能來自 `areas/<id>/area.config.json` 和 `cities/<city>/city.config.json`
2. 區域用真實地區名稱：`helsinki-kruununhaka`、`helsinki-kluuvi`。加區域不可改動 core
3. 同一城市的所有區域共用同一個座標原點（見 city.config.json），這樣之後可以拼接
4. 世界座標：單位米，由城市的投影座標系統減去原點。Helsinki 用 EPSG:3879；x 向東、y 向上、z 向南。經緯度和投影轉換只出現在 pipeline
5. 資料在 build time 處理成靜態檔案。瀏覽器不直接打任何外部 API
6. 資料來源用 adapter 分開（`pipeline/sources/helsinki3d.ts`、`pipeline/sources/osm.ts`），輸出同一種內部格式，之後加其他城市只需新增 adapter
7. 建築 ID：優先用 Helsinki 3D 的 GMLID，同時保存 RATU / VTJ-PRT 和 OSM id 作對照（如有）
8. 地標放在 `landmarks.json`，每個地標有固定、永不改變的 id（`hel-xxx`，不含區域名）
9. 故事內容放 `stories/<landmark-id>.md`，不寫進渲染 code

## 技術
Vite + TypeScript + Three.js。**正交相機（OrthographicCamera）**，方位角 45°、仰角 30°（2:1 dimetric）。
像素化：低解像度 render target + nearest-neighbour 放大。色盤 16–24 色。

## 資料與部署流程
- 處理後的資料（`areas/<id>/data/`）**要 commit 進 git**；原始資料（`raw/`）不 commit
- Cloudflare 的 build 只執行 `npm run build`，**不可以在 build 時下載 Helsinki 3D 或 OSM**
- 部署方式：push 到 GitHub，由 Cloudflare Pages 的 Git 整合自動 build 和產生預覽網址（build command: `npm run build`，output: `dist`）
- 不要把任何 token、密碼寫進 repo

## 測試（M1 起）
pipeline 要有基本單元測試（vitest）：座標轉換正確、地標 id 不重複、建築高度不為空、manifest 有 `schemaVersion`。

## MVP 互動（見 docs/MVP.md）
拖動、縮放（手機雙指）、點建築高亮、點地標看資訊卡、地標清單跳轉、日 / 黃昏切換。

## 暫時不做
旋轉相機、角色、NPC、故事系統、多人、天氣、交通、季節、其他城市。想到點子請寫入 `docs/DECISIONS.md` 的「之後再做」，不要實作。

## 驗收方式
- 每個 milestone 在固定鏡頭截圖，存入 `screenshots/<milestone>/`（桌面 3 張 + 手機尺寸 390x844 一張）
- `?debug=1` 顯示：建築數量、缺高度數量、資料來源統計（Helsinki 3D / OSM 各多少）、draw call、載入大小、FPS，以及固定鏡頭按鈕
- 每個 milestone 完成後 push 到分支，產生預覽網址，讓我用手機檢查
- 每個 milestone 完成後 git commit

## 工作方式
- 一次只做一個 milestone。見 `docs/MILESTONES.md`
- 動手前先用 Plan mode 提出計劃，等我同意
- 出錯時先解釋原因，再修；不要重寫整個專案
- 完成前一定要自己開頁面截圖檢查，不要只靠「code 看起來對」
- 可以使用 `.cursor/agents/` 內的 subagent（qa-reviewer 最先用）；沒有被調用時，由主 agent 自己照該檔案的規則做
- 重要決定記錄在 `docs/DECISIONS.md`
- 只報告真正測試或看到的結果，不要猜
