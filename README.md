# helsinki-8bit 起步包 v3（Cursor 版）

## 資料夾
- `AGENTS.md`：專案規則（Cursor 自動讀取）
- `.cursor/rules/`：4 個 .mdc 規則（總則 + 按資料夾載入）
- `.cursor/agents/`：5 個 subagent
- `.cursor/commands/`：在 chat 輸入 `/` 就會出現的 prompt（start-plan、m0 到 m5、feedback）
- `docs/`：MVP、資料來源、架構、里程碑、決定記錄、工作流程
- `cities/helsinki/`、`areas/helsinki-kruununhaka/`、`areas/helsinki-kluuvi/`：設定和地標

## 開始
1. 建立個人 GitHub 空 repo（例如 helsinki-8bit），把這個資料夾的內容放進去並 push
2. 在 Cursor 連接 GitHub，選這個 repo
3. 模式改成 Plan，輸入 `/start-plan` 後送出
4. 看計劃，同意後切到 Agent mode，輸入 `/m0-data-probe`
5. 把 `docs/data-probe-report.md` 的結論決定好，再 `/m1-data-and-shapes`

## 個人項目提醒
請用個人 GitHub、個人 Cloudflare 帳戶，不要放在公司租戶或公司帳戶。
