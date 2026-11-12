現在只做 M0：資料探測（雲端版）。不要建立網頁，不要寫渲染 code。使用 data-pipeline subagent（如可用）。

環境規則見 .cursor/rules/environment.mdc：在雲端環境執行，新 branch，開 pull request，不可關閉 TLS 驗證。

要求：
1. 先測試目前環境能不能連到 https://kartta.hel.fi 和 https://overpass-api.de ；連不到就停下並如實報告，不要略過任何安全檢查
2. 如果可以，執行 scripts/m0-probe.mjs 取得基本結果（WFS GetCapabilities + 小範圍 OSM 建築統計）
3. 測試 Helsinki 3D WFS（https://kartta.hel.fi/3d/citydb-wfs/wfs ，version 2.0.0）：列出可用的 feature types
4. 嘗試抓 Senate Square 附近約 300m x 300m 的建築（CityGML）。WFS 範圍查詢時，EPSG:3879 座標順序兩種都試，並記錄哪一種有效。WFS 不可用時，檢查 https://kartta.hel.fi/3d/ 下載服務和 avoindata 的 LoD1 資料
5. 檢查欄位：GMLID、RATU、VTJ-PRT、高度、LoD1 / LoD2、座標系統（應為 EPSG:3879）
6. 比較同一範圍 OSM 建築的數量和高度完整度
7. 嘗試找出 Helsinki Cathedral 在兩個來源中分別是哪一個物件；找不到標 unresolved，不要猜
8. 原始資料存 areas/helsinki-kruununhaka/raw/（不 commit），速率不超過每秒一次，使用清楚的 User-Agent

輸出 docs/data-probe-report.md：
- 一句結論：Helsinki 3D 能不能用作主要建築來源
- 實際取得的數字（建築數量、LoD2 比例、缺高度數量）
- 問題和限制、建議的合併方式、不可用時的後備方案

只報告真正測試到的結果。完成後開 pull request，不要合併。
