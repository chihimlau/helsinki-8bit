M2 已通過。現在執行 Milestone 3：效能與 chunk。

要求：
- 按 chunkSizeMeters 分 chunk，只載入視野附近
- 同 chunk 建築合併 mesh
- 資料壓縮（請提出建議並說明取捨，等我同意再做）
- 按需渲染，閒置不重畫
- PWA（可加到主畫面）
- 用 perf-guard 檢查：首次載入 < 2MB、3 秒內見到畫面、> 30 FPS
- 輸出一份效能報告到 docs/perf-report.md
