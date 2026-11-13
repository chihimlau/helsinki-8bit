# Helsinki 8-bit City

Pixel-style 3D city map of Helsinki (browser, static site).

## Dev

```bash
npm install
npm test
npm run build
npm run dev
```

- Area data lives in `areas/<id>/data/` (committed). `npm run build` does **not** download anything.
- Fetch/process data (Actions / Cloud only): `npm run pipeline:fetch -- --area=helsinki-kruununhaka`

## Cloudflare Pages

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `22` |
| Root | `/` |

Connect the GitHub repo; previews on PRs. Do not run pipeline download in the Pages build.

## Attribution

City of Helsinki open geographic data (avoindata), CC BY 4.0 · © OpenStreetMap contributors
