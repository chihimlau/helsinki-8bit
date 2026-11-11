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

## 之後再做
旋轉相機、人物、故事、多人、天氣、其他城市（例如 HK）、Capacitor App
