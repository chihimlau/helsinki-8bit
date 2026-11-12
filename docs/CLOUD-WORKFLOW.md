# 雲端工作流程（v4）

## 為甚麼
開發電腦是公司電腦，網絡攔截 HTTPS：連不到 kartta.hel.fi，Overpass 回 502 或超時，Node 報 UNABLE_TO_GET_ISSUER_CERT_LOCALLY。M0 在本機失敗（2026-11-11）。
這是個人項目，不處理公司證書，也不用 IT 放行。所有需要網絡的工作改在雲端做。

## 分工
- 本機（公司電腦）：只用 Cursor 看檔案、寫文件、git commit / push（push 已證實可用）
- 雲端：Cursor Cloud Agent（cursor.com/agents，手機可用）執行 M0 到 M5
- GitHub Actions：備用。資料下載或探測不能在 Cloud Agent 做時，用 workflow_dispatch 手動觸發
- Cloudflare Pages：每個 pull request 產生預覽網址，用手機檢查

## 每一輪
1. 手機或電腦開 cursor.com/agents，選 chihimlau/helsinki-8bit
2. 貼 milestone command 的內容（或小修改模板）
3. Agent 在新 branch 上做，開 pull request
4. Cloudflare 預覽網址更新，用手機打開檢查
5. OK：由你在 GitHub 按 Merge；不 OK：再給一句修改指示

## 規則
- 不直接 push 到 main
- 不關閉 TLS 驗證（見 .cursor/rules/environment.mdc）
- 不把 token、key 寫進 repo
- 處理好的資料 commit 進 git；Cloudflare build 不下載資料

## 待確認（M0 在雲端第一次運行時回答）
- Cloud Agent 能否連到 kartta.hel.fi 和 Overpass
- Cloud Agent 是否讀取 .cursor/rules 和 .cursor/agents
- Cursor 方案到期後，Cloud Agent 是否可用及費用
- GitHub 手機版能否直接觸發 workflow（手機瀏覽器可以）
