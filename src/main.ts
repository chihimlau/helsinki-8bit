import { createApp } from '../core/createApp';
import { loadAreaData } from '../core/loadArea';

const AREA_ID = 'helsinki-kruununhaka';
const DATA_URL = `/areas/${AREA_ID}/data`;

async function boot() {
  const container = document.getElementById('app');
  const hud = document.getElementById('hud');
  const debugEl = document.getElementById('debug');
  if (!container || !hud || !debugEl) throw new Error('missing DOM nodes');

  const debug = new URLSearchParams(location.search).get('debug') === '1';
  try {
    const area = await loadAreaData(DATA_URL);
    createApp({ container, hud, debugEl, area, debug });
  } catch (e) {
    hud.textContent =
      'No area data yet. Run pipeline with --fetch on Actions/Cloud, then npm run build.';
    console.error(e);
  }
}

boot();
