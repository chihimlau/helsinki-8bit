# 資料來源

## 1. Helsinki 3D 城市資訊模型（主要：建築和地形）
- 官方頁面：https://www.hel.fi/en/decision-making/information-on-helsinki/maps-and-geospatial-data/helsinki-3d
- 內容：地形模型 + 建築。建築有 LoD1（平屋頂方盒）和 LoD2（有屋頂結構）
- 格式：CityGML 2.0；座標系統 ETRS-GK25（EPSG:3879），高度系統 N2000
- 每棟建築有 GMLID、RATU、VTJ-PRT 識別碼
- 授權：CC BY 4.0（必須標示來源）
- 取得方式：
  - 下載服務 https://kartta.hel.fi/3d/ ，官方頁面曾顯示下載功能因更新問題暫停，M0 要先測試是否可用
  - WFS API：https://kartta.hel.fi/3d/citydb-wfs/wfs ，version 2.0.0
  - LoD1 另有 KMZ / SKP 版本，在 avoindata.suomi.fi 的 "3D city model of the City of Helsinki"

## 2. Helsinki 3D Mesh（只作參考，不放進網頁）
- 由航空照片產生的三角網格，OBJ / 3MX 格式，CC BY 4.0，精度約 20cm
- 檔案很大，不適合手機瀏覽器。只可以用來對照外觀、檢查地標形狀

## 3. OpenStreetMap
- 用途：道路、公園、水面、樹；以及 Helsinki 3D 不可用時的建築後備
- 原始資料 cache 在本地，不重複打 API，使用清楚的 User-Agent，速率不超過每秒一次

## 合併規則（M0 後現行）
- 全部轉成 EPSG:3879，再減去 city origin 得到世界座標
- 建築：**Helsinki avoindata** `Rakennukset_alue_rekisteritiedot` 優先（官方 footprint）。平屋頂擠出；CityGML LoD2 暫無
- 高度：`i_kerrlkm * 3.2` → OSM `height` / `building:levels * 3.2` → 預設值；統計各桶數量
- 同一棟若 OSM 也有，用 footprint 重疊度對照，只保存 osmId，不重複畫
- OSM 有、avoindata 沒有的建築：用 OSM footprint + 樓層／高度補上
- 道路、公園、水面貼在地形高度上（M1 地形先平地）
- WFS bbox（EPSG:3879）：使用 **easting,northing（x,y）**（M0 已驗證）
- 每次運行輸出統計：各來源物件數量、缺高度數量、LoD1 / LoD2（若無則記 0）、輸出大小
- CityGML WFS／圖幅下載若之後可用，再升為主建築來源（見 `docs/data-probe-report.md`）
