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

### 第二輪（下一輪執行，一次只做這個）
目標：畫面要有「iso tile 的質感」，不是灰／棕方盒城。

1. **地面層（對齊 Slynyrd tiles）**  
   草地／泥土／石材／水面：頂面與兩個側面有不同明度；細點／dither 紋理；路緣、廣場鋪面  
2. **樹與點景**  
   由簡單幾何堆疊再「雕」細節（錐形樹冠＋樹幹），公園／廣場邊要看得見樹叢  
3. **建築體積**  
   屋頂簷口、牆／頂／暗面三階明度；窗戶成排可讀；一般樓也要比現在更像 cuboid 上色，不只 outline  
4. **地標再加碼（Helsinki 可辨）**  
   Cathedral 綠頂＋白階梯再強化；港邊／Market Square 要有水面與開闊感  
5. **像素規則**  
   維持 2:1 dimetric + 低解 RT；色盤仍限色；可加輕 dither，不用圖像生成模型、不用大型貼圖包

成功標準（你驗收後才定 baseline）：
- 固定鏡頭：認得出 Cathedral + Senate Square + 港  
- 截圖對照 Warsaw／Slynyrd：有地面紋理、樹、水面層次，不再是「只有方盒＋pin」  
- 手機 390×844 同樣可辨

## 之後再做
旋轉相機、人物、故事、多人、天氣、其他城市（例如 HK）、Capacitor App
