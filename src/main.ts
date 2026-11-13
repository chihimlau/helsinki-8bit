import { createApp, resolvePreset } from '../core/createApp';
import { loadManifest } from '../core/loadArea';

const AREA_ID = 'helsinki-kruununhaka';
const DATA_URL = `/areas/${AREA_ID}/data`;
const CONFIG_URL = `/areas/${AREA_ID}/area.config.json`;

type AreaConfig = {
  render?: { internalWidth?: number; internalHeight?: number; palette?: string };
};

async function boot() {
  const container = document.getElementById('app');
  const hud = document.getElementById('hud');
  const debugEl = document.getElementById('debug');
  if (!container || !hud || !debugEl) throw new Error('missing DOM nodes');

  const params = new URLSearchParams(location.search);
  const debug = params.get('debug') === '1';
  const preset = resolvePreset(params.get('preset'));

  try {
    const t0 = performance.now();
    const [manifestLoad, configRes] = await Promise.all([
      loadManifest(DATA_URL),
      fetch(CONFIG_URL).then(async (r) => {
        if (!r.ok) return {} as AreaConfig;
        return (await r.json()) as AreaConfig;
      }),
    ]);

    createApp({
      container,
      hud,
      debugEl,
      manifest: manifestLoad.manifest,
      dataBaseUrl: manifestLoad.dataBaseUrl,
      initialBytes: manifestLoad.bytesLoaded,
      debug,
      preset,
      internalWidth: configRes.render?.internalWidth ?? 480,
      internalHeight: configRes.render?.internalHeight ?? 270,
    });

    console.info(`first paint setup ${Math.round(performance.now() - t0)} ms (manifest only)`);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  } catch (e) {
    hud.textContent =
      'No area data yet. Run pipeline with --fetch on Actions/Cloud, then npm run build.';
    console.error(e);
  }
}

boot();
