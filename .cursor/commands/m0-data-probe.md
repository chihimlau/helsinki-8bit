計劃已批准。現在只做 M0：資料探測。不要建立網頁，不要寫渲染 code。使用 data-pipeline subagent。

要求：
1. 先測試你目前的環境能不能連到 https://kartta.hel.fi 和 OSM Overpass API；不能的話立即告訴我，並停下
2. 測試 Helsinki 3D WFS（https://kartta.hel.fi/3d/citydb-wfs/wfs ，version 2.0.0）：先 GetCapabilities，列出可用的 feature types
3. 嘗試抓 Senate Square 附近約 300m x 300m 的建築（CityGML）。如果 WFS 不可用，檢查 https://kartta.hel.fi/3d/ 下載服務和 avoindata 的 LoD1 資料是否可用
4. 檢查欄位：GMLID、RATU、VTJ-PRT、高度、LoD1 / LoD2、座標系統（應為 EPSG:3879）
5. 抓同一範圍的 OSM 建築，比較數量和高度完整度
6. 嘗試找出 Helsinki Cathedral 在兩個來源中分別是哪一個物件
7. 原始資料存 areas/helsinki-kruununhaka/raw/（不 commit），不要大量下載，速率不超過每秒一次

輸出 docs/data-probe-report.md：
- 一句結論：Helsinki 3D 能不能用作主要建築來源
- 實際取得的數字（建築數量、LoD2 比例、缺高度數量）
- 問題和限制
- 建議的合併方式
- 如果不可用，建議的後備方案

只報告你真正測試到的結果，不要猜。
