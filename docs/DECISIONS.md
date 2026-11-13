# 決定記錄

## 已決定
- 開發工具：**Cursor**（不使用 Claude Code）。規則用 AGENTS.md + .cursor/rules，subagent 用 .cursor/agents，prompt 用 .cursor/commands
- 渲染：build time 處理資料，輸出靜態檔案；瀏覽器只負責畫
- 視覺：3D 場景降解像素化 + 限定色盤 + 窗戶紋理，做復古 screen cap 感
- 相機：正交，方位角 45°、仰角 30°（2:1 dimetric）
- 區域用真實地區名：helsinki-kruununhaka（MVP）、helsinki-kluuvi（M5）
- 同城共用原點，之後可以拼接；core 不含城市名
- 資料（M0 後鎖定）：**建築**用 Helsinki avoindata WFS `Rakennukset_alue_rekisteritiedot`（2D footprint + RATU / VTJ-PRT / `i_kerrlkm`）；**道路、公園、水面、樹**用 OSM；高度優先 `i_kerrlkm * 3.2` m，其次 OSM `height` / `building:levels`，再預設值。Helsinki 3D CityGML WFS（文件上的 `citydb-wfs`）目前 **404**，暫不作為主來源；CityGML / LoD2 若之後恢復可再接入，不阻塞 M1–M2。Helsinki 3D Mesh（OBJ/3MX）仍不進網頁。頁面 attribution 仍標示 City of Helsinki（CC BY 4.0）與 © OpenStreetMap contributors
- 建築 ID：優先 avoindata `id` + RATU / VTJ-PRT；有 GMLID 時再優先 GMLID；並保留 `osmId` 對照
- 像素風可行性：M1 只輸出可擠出的 footprint + 高度（平屋頂）；M2 的低解像度 RT、色盤、窗戶 shader 不依賴 LoD2。地標（尤其 Cathedral）樓層數會偏低，M4 再覆寫高度／外觀
- 處理後資料 commit 進 git；Cloudflare build 不下載資料
- 地標 id 不含區域名
- MVP 互動：拖動、縮放、點建築、地標資訊卡、地標清單、日/黃昏；不旋轉
- 驗收：截圖 + 預覽網址 + ?debug=1 + pipeline 單元測試
- 成本：純靜態、Cloudflare Pages 免費方案、PWA，之後 Capacitor

## 待決定
- LoD2 屋頂簡化程度（若之後取得 CityGML）
- CityGML 圖幅／`kartta.hel.fi/3d` 區域下載是否可恢復為建築升級來源（不阻塞 MVP）

## M3 已決定
- 資料壓縮：**A** — `chunk-*.json.gz`（pipeline `zlib.gzipSync`）+ 瀏覽器 `DecompressionStream('gzip')`；manifest `schemaVersion: 2`
- Chunk 串流載入／卸載；PWA shell

## M2 已決定
- 內部分辨率 480×270，nearest 放大；邊緣在 upscale shader 做
- 色盤 day/dusk 寫在 `areas/helsinki-kruununhaka/area.config.json` → `render.palettes`（與 `core/palette.ts` 一致）
- Preset：`?preset=dusk` 或右下角 day/dusk 按鈕
- 拖動：抓地圖（內容跟手），觸控單指 + 滑鼠左鍵；雙指／滾輪縮放
- 仍平屋頂（無 CityGML LoD2）

## M0 已關閉
- 主建築來源：avoindata（非 CityGML WFS）；OSM 作道路等 + 建築補洞
- 執行環境：本機公司網不可靠；資料探測／下載用 GitHub Actions（或 Cloud Agent）

## 之後再做（不要現在實作）
旋轉相機、人物與 NPC、故事系統、多人、天氣、季節、交通、其他城市、App
