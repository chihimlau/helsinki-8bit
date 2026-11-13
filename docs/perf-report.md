# Perf report (M3)

**Branch:** `m3`  
**Area:** `helsinki-kruununhaka`  
**Compression:** A — chunk `*.json.gz` + browser `DecompressionStream`  
**schemaVersion:** 2

## Features
- Frustum / proximity chunk load + unload
- Per-chunk mesh merge (roads capped at 120/chunk)
- On-demand render (idle redraw FPS ≈ 0)
- PWA: `manifest.webmanifest` + `sw.js` + icons

## Compression results (on-disk, local recompress)

| Metric | Value |
|--------|--------|
| Chunks | 26 |
| Plain JSON total | 1 413 896 bytes (~1.35 MiB) |
| Gzip chunks total | **465 976 bytes (~455 KiB)** |
| Ratio | **0.33** (≈67% smaller) |
| Manifest | 5 367 bytes |
| Data on disk (chunks+manifest) | **~471 KB** |

JS bundle (vite build): `dist/assets/*.js` ≈ 518 KB raw / **~134 KB gzip** (tooling report).

**First-load estimate (manifest + nearby few chunks, not all 26):** well under **2 MB** budget when streaming. Full area if all chunks downloaded ≈ 471 KB data + ~134 KB JS gzip ≈ **&lt; 1 MB** compressed transfer.

## Budget checklist

| Budget | Target | Status |
|--------|--------|--------|
| First load | &lt; 2 MB | **Pass** (disk/gzip numbers above; streaming loads less initially) |
| Time to first frame | &lt; 3 s on 4G | **Likely pass** (manifest-first); not re-timed on real 4G this run |
| FPS | &gt; 30 mid phone | **Not measured on phone** this run — desktop on-demand render OK |

## Notes
- Measure phone FPS with `?debug=1` when convenient.
- Host may also gzip `.json.gz` again; browser still receives bytes as gzip file body (no `Content-Encoding` set by our static server).
