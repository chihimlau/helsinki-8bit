# Perf report (M3)

**Branch:** `m3`  
**Measured:** local (pending full numbers after build)  
**Area:** `helsinki-kruununhaka`

## Changes in M3
- Chunk streaming: only nearby chunks load; leave view → unload meshes
- Per-chunk mesh merge (buildings batched, roads capped at 120/chunk)
- On-demand render (unchanged from M2; idle FPS redraw = 0)
- PWA: `manifest.webmanifest` + `sw.js` (add to home screen)

## Compression (awaiting decision)
See chat / DECISIONS — not applied until you approve.

**Recommendation:** store `chunk-*.json.gz` (Node `zlib`), fetch + `DecompressionStream('gzip')` in browser (no new npm dep). Cloudflare also gzip/brotli on the wire for plain JSON.

| Option | Pros | Cons |
|--------|------|------|
| A. `.json.gz` + DecompressionStream | Smaller on disk/git & first fetch; no npm dep | Pipeline rewrite; slightly more fetch code |
| B. Plain JSON only (host gzip) | Zero code change; Pages already compresses transfer | Repo/disk larger; SW cache stores uncompressed |
| C. Custom binary | Smallest | Schema work; harder debug |

## Budget checklist
| Budget | Target | Status |
|--------|--------|--------|
| First load | < 2 MB | Measure after streaming (manifest-first) |
| Time to first frame | < 3 s on 4G | Measure locally / Actions |
| FPS | > 30 mid phone | Measure with `?debug=1` |

## Notes
- Fill in exact KB / FPS after local preview once build succeeds.
