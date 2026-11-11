# 架構

## 資料流（單向）
來源（Helsinki 3D CityGML + OSM）→ `pipeline/sources/*`（各自 adapter）→ 統一內部格式 → 清理、合併、投影、分 chunk、壓縮 → `areas/<id>/data/`（commit 進 git）→ `core/` 渲染 → 瀏覽器

## 資料夾
```
AGENTS.md      專案規則（Cursor 自動讀取）
.cursor/
  rules/       *.mdc 規則（有 frontmatter，按檔案範圍載入）
  agents/      subagent
  commands/    在 chat 輸入 / 就會出現的 prompt
core/          渲染、相機、像素化、互動、debug 面板、PWA（不含任何城市名）
pipeline/
  sources/     helsinki3d.ts、osm.ts（每個來源一個 adapter）
  merge/       合併和清理
  build/       分 chunk、壓縮
cities/<id>/   city.config.json（座標系統、共用原點、來源、attribution）
areas/<id>/    area.config.json、landmarks.json、data/（處理後，要 commit）、raw/（原始，不 commit）
stories/       之後才用
scripts/       截圖、檢查腳本
docs/          文件
```

## 命名
- 區域：`<city>-<neighbourhood>`，例如 `helsinki-kruununhaka`、`helsinki-kluuvi`、之後 `hongkong-xxx`
- 地標：`hel-<slug>`，與區域無關

## 世界座標
- 單位：米；= 城市投影座標（Helsinki 為 EPSG:3879）減去 city origin
- 同一城市的所有區域共用 origin，所以可以拼接
- x 東、y 上、z 南
- core 只看世界座標；不同城市只需要在 city.config 換 crs

## 統一內部建築格式
id（GMLID 優先）、ratu / vtjPrt / osmId（如有）、footprint（世界座標）、height、groundZ、roof（flat / LoD2 屋頂幾何）、lod、source

## Chunk
- 每 chunk 約 250m x 250m，每個 chunk 一個壓縮檔
- 同 chunk 的建築合併成一至數個 mesh
- manifest.json 列出所有 chunk 的範圍和檔名，並有 `schemaVersion`

## 渲染
- 正交相機（方位角 45°、仰角 30°）
- 低解像度 render target（480x270）→ nearest-neighbour 放大
- 色盤量化 16–24 色；窗戶、牆身用 shader 生成
- 按需渲染（相機移動或有動畫才畫）

## 部署
- push 到 GitHub → Cloudflare Pages 自動 build（只跑 `npm run build`）→ 預覽網址
- build 不下載外部資料；資料已經在 repo 內

## 擴展點
- 新區域：新增 `areas/<id>/`，不改 core
- 新城市：新增 `cities/<id>/` 和 source adapter
- 故事：`stories/<landmark-id>.md`
- 人物 / NPC：之後掛在世界座標和 landmark id 上
