import { createApp, resolvePreset } from '../core/createApp';
import { loadAreaData } from '../core/loadArea';

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
    const [area, configRes] = await Promise.all([
      loadAreaData(DATA_URL),
      fetch(CONFIG_URL).then(async (r) => {
        if (!r.ok) return {} as AreaConfig;
        return (await r.json()) as AreaConfig;
      }),
    ]);
    createApp({
      container,
      hud,
      debugEl,
      area,
      debug,
      preset,
      internalWidth: configRes.render?.internalWidth ?? 480,
      internalHeight: configRes.render?.internalHeight ?? 270,
    });
  } catch (e) {
    hud.textContent =
      'No area data yet. Run pipeline with --fetch on Actions/Cloud, then npm run build.';
    console.error(e);
  }
}

boot();
