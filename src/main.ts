import { createApp, resolvePreset } from '../core/createApp';
import { loadManifest } from '../core/loadArea';
import type { LandmarkWorld } from '../core/types';
import { toWorld, wgs84ToGk25 } from '../pipeline/coords';

const AREA_ID = 'helsinki-kruununhaka';
const DATA_URL = `/areas/${AREA_ID}/data`;
const CONFIG_URL = `/areas/${AREA_ID}/area.config.json`;
const LANDMARKS_URL = `/areas/${AREA_ID}/landmarks.json`;

type AreaConfig = {
  render?: { internalWidth?: number; internalHeight?: number };
};

type LandmarkFile = {
  landmarks: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    type: string;
    priority: string;
    blurb?: string;
    avoindataId?: string | null;
    ratu?: number | null;
    special?: LandmarkWorld['special'];
  }>;
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
    const [manifestLoad, configRes, landmarksFile] = await Promise.all([
      loadManifest(DATA_URL),
      fetch(CONFIG_URL).then(async (r) => (r.ok ? ((await r.json()) as AreaConfig) : {})),
      fetch(LANDMARKS_URL).then(async (r) => (await r.json()) as LandmarkFile),
    ]);

    const origin = manifestLoad.manifest.origin;
    const landmarks: LandmarkWorld[] = landmarksFile.landmarks.map((lm) => {
      const p = wgs84ToGk25(lm.lon, lm.lat);
      const w = toWorld(p.x, p.y, origin);
      return {
        id: lm.id,
        name: lm.name,
        blurb: lm.blurb ?? '',
        type: lm.type,
        priority: lm.priority,
        x: w.x,
        z: w.z,
        buildingId: lm.avoindataId ?? null,
        ratu: lm.ratu ?? null,
        special: lm.special ?? null,
      };
    });

    createApp({
      container,
      hud,
      debugEl,
      manifest: manifestLoad.manifest,
      dataBaseUrl: manifestLoad.dataBaseUrl,
      initialBytes: manifestLoad.bytesLoaded,
      landmarks,
      debug,
      preset,
      internalWidth: configRes.render?.internalWidth ?? 480,
      internalHeight: configRes.render?.internalHeight ?? 270,
    });

    console.info(`M4 boot ${Math.round(performance.now() - t0)} ms`);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  } catch (e) {
    hud.textContent = 'Failed to load area / landmarks.';
    console.error(e);
  }
}

boot();
