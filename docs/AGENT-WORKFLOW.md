# Agent 工作流程（Cursor 版）

## 參考 Isometric Warsaw
Warsaw 作者公開的資訊：程式由 AI coding agents 寫，最多 8 個 agent 並行，第一週超過 70 次運行；不用圖像 AI，只用開放資料和程式渲染。
他沒有公開每個 agent 的具體分工，以下 5 個 subagent 是為本項目設計的，並非複製他的設定。
本項目用 Cursor（Plan mode、subagents、cloud agents）取代他用的工具。

## 角色
- 你（Alex）：決定方向、用手機檢視預覽、判斷「像不像 Helsinki」
- 主 agent：讀 AGENTS.md 和 .cursor/rules，負責計劃和整合
- subagent（`.cursor/agents/`）：
  1. qa-reviewer：開頁面、截圖、寫報告（只報告）
  2. data-pipeline：Helsinki 3D + OSM 資料處理（M0 起）
  3. render-engine：渲染、像素化、相機、互動
  4. landmark-curator：地標、ID 對應、座標校正（M4）
  5. perf-guard：效能預算檢查（M3 起，只報告）

## 使用順序
- M0：data-pipeline
- M1：data-pipeline + render-engine，之後 qa-reviewer
- M3：加 perf-guard
- M4：加 landmark-curator

## 每輪循環
1. 切到 Plan mode，輸入 `/` 選這個 milestone 的 command
2. 主 agent 提出計劃，你批准（或要求修改）
3. 切到 Agent mode 執行
4. qa-reviewer 截圖和報告
5. 你用手機打開預覽網址，輸入 `/feedback` 填寫回饋
6. 進入下一輪

## 並行
- M0、M1 一次只用 1 個 agent，先走通流程
- M2 之後，互不影響的任務才並行，最多 2–3 個
- 並行時每個 agent 只改自己負責的資料夾

## 如果 subagent 沒有被自動調用
- 在 chat 輸入 `/` 加 subagent 名稱手動調用
- 或叫主 agent「按照 .cursor/agents/xxx.md 的規則做」，效果接近
