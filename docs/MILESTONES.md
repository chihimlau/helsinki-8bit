# Milestones（一次只做一個）

## M0：資料探測（不寫畫面）
- 確認執行環境能連到 kartta.hel.fi 和 OSM
- 測試 Helsinki 3D WFS 和下載服務是否可用
- 抓 Senate Square 附近約 300m x 300m 的 CityGML，檢查欄位和座標系統
- 比較同一區域 OSM 的建築數量和高度完整度
- 輸出 docs/data-probe-report.md

成功標準：我看到報告，能決定 Helsinki 3D 是否作為主要建築來源。

## M1：資料與形狀（不做像素風）
- 專案結構、Vite + TS + Three.js + vitest
- pipeline（source adapters）處理 helsinki-kruununhaka
- 顯示地面、水面、道路、建築，正交相機可拖動縮放
- `?debug=1` 面板、pipeline 單元測試
- 截圖、預覽網址

成功標準：打開就認得出 Senate Square、Cathedral 和海岸線。

## M2：像素風渲染
- 低解像度 render target + nearest-neighbour
- 16–24 色色盤、窗戶 shader、簡化陰影、建築輪廓
- day / dusk 兩個 preset

## M3：效能與 chunk
- chunk 載入、mesh 合併、壓縮資料、按需渲染、PWA
- 達成效能預算（< 2MB、3 秒、> 30 FPS）

## M4：互動與地標（MVP 完成）
- 點建築高亮、地標 pin、資訊卡、地標清單
- landmark-curator 對應 Helsinki 3D GMLID / OSM id
- 特別處理 Cathedral 等 3–5 個地標外觀

## M5：發布 + 第二區域
- 正式部署、來源標示、手機測試
- 加入 helsinki-kluuvi，驗證不需改 core，兩區共用原點可以拼接

## M6-look：美術（baseline 前必須過）
參考：Isometric Warsaw + [Slynyrd Pixelblog 41 – Isometric Pixel Art](https://www.slynyrd.com/blog/2022/11/28/pixelblog-41-isometric-pixel-art)（2:1 iso、cuboid 上色、地面／樹／水要有紋理層級）。

### 第一輪（已做，尚未達標）
- Cathedral／Square／Station special mesh、黃 `i` pin、窗戶加密、道路加寬、色盤對比
- 結論：地標略可辨，但整體仍「空、扁、無材質」— **不接受為 baseline**

### 第二輪（執行中）
美術參考：Warsaw + [Slynyrd Pixelblog 41](https://www.slynyrd.com/blog/2022/11/28/pixelblog-41-isometric-pixel-art)。  
策略：**先做 Helsinki Cathedral + Senate Square 一塊「示範島」**；這兩處達標後，再把同一套材質／樹／鋪面擴到全圖。

#### 2A — Cathedral + Senate Square only（目前）
1. Senate Square：鋪石／廣場 tile 質感（頂／側面分色 + dither）、中心雕像區、邊緣樹  
2. Cathedral：白牆三面明度、階梯、廊柱、中央＋四角綠圓頂再雕細節，體量壓過周圍方盒  
3. 鏡頭預設鎖在 Square→Cathedral，方便驗收  
4. 暫不改全圖一般建築／港／Kluuvi（避免散焦）

成功標準（2A）：固定鏡頭一眼認得出 **Cathedral + Senate Square**，質感接近 Slynyrd cuboid（不是灰盒子＋pin）。

#### M6-lab（旁路驗收）
- 分支 `m6-lab-diorama`；入口 `?lab=senate-diorama&preset=day&debug=1`
- 浮島＋奶油底＋只留 Square／Cathedral／側翼；跟參考 diorama 並排驗收
- 過關後把幾何／材質／色盤合回 `m6-look` 全圖（Lab 旗標可留作 debug）

#### 2B — 擴到全圖（2A 過關後）
地面草／路／水、一般建築三面明度、樹叢、港／Market Square、其他地標 — 複用 2A 的材質語言。

## 之後再做
旋轉相機、人物、故事、多人、天氣、其他城市（例如 HK）、Capacitor App
