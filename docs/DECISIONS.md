# 決定記錄

## 已決定
- 開發工具：**Cursor**（不使用 Claude Code）。規則用 AGENTS.md + .cursor/rules，subagent 用 .cursor/agents，prompt 用 .cursor/commands
- 渲染：build time 處理資料，輸出靜態檔案；瀏覽器只負責畫
- 視覺：3D 場景降解像素化 + 限定色盤 + 窗戶紋理，做復古 screen cap 感
- 相機：正交，方位角 45°、仰角 30°（2:1 dimetric）
- 區域用真實地區名：helsinki-kruununhaka（MVP）、helsinki-kluuvi（M5）
- 同城共用原點，之後可以拼接；core 不含城市名
- 資料：Helsinki 3D（CityGML）做建築和地形，OSM 做道路、公園、水面、樹；Helsinki 3D Mesh 不進網頁
- 建築 ID：GMLID 優先，並保留 RATU / VTJ-PRT / OSM id 對照
- 處理後資料 commit 進 git；Cloudflare build 不下載資料
- 地標 id 不含區域名
- MVP 互動：拖動、縮放、點建築、地標資訊卡、地標清單、日/黃昏；不旋轉
- 驗收：截圖 + 預覽網址 + ?debug=1 + pipeline 單元測試
- 成本：純靜態、Cloudflare Pages 免費方案、PWA，之後 Capacitor

## 待決定（M0 之後）
- Helsinki 3D 下載是否可用；不可用時是否接受 OSM 建築作為 MVP 來源
- 執行環境（Cursor Cloud agent 或本機）能否連到 kartta.hel.fi
- 色盤具體色票
- 資料壓縮格式
- LoD2 屋頂簡化程度

## 之後再做（不要現在實作）
旋轉相機、人物與 NPC、故事系統、多人、天氣、季節、交通、其他城市、App
