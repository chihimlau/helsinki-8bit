import { createApp, resolvePreset } from '../core/createApp';
import { loadManifest } from '../core/loadArea';
import type { LandmarkWorld } from '../core/types';
import { toWorld, wgs84ToGk25 } from '../pipeline/coords';

const CATALOG_URL = '/areas/catalog.json';

type AreaConfig = {
  render?: { internalWidth?: number; internalHeight?: number };
};

type Catalog = {
  defaultAreaId: string;
  areas: Array<{ id: string; name: string; city: string }>;
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

function mountAreaSwitcher(catalog: Catalog, activeId: string) {
  const existing = document.getElementById('area-switcher');
  if (existing) existing.remove();
  const wrap = document.createElement('label');
  wrap.id = 'area-switcher';
  wrap.style.cssText =
    'position:fixed;left:10px;top:10px;z-index:6;display:flex;gap:6px;align-items:center;background:rgba(0,0,0,0.72);color:#e8eef2;font:12px ui-monospace,Consolas,monospace;padding:6px 8px;border-radius:6px;';
  wrap.innerHTML = `<span>Area</span>`;
  const sel = document.createElement('select');
  sel.style.cssText =
    'font:inherit;background:#243038;color:#e8eef2;border:1px solid #4a5a64;border-radius:4px;padding:2px 4px;';
  for (const a of catalog.areas) {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name;
    if (a.id === activeId) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('area', sel.value);
    location.href = url.toString();
  });
  wrap.appendChild(sel);
  document.body.appendChild(wrap);
  // When debug panel is open, nudge switcher below it on wide screens
  if (new URLSearchParams(location.search).get('debug') === '1') {
    wrap.style.top = 'auto';
    wrap.style.bottom = '48px';
  }
}

async function boot() {
  const container = document.getElementById('app');
  const hud = document.getElementById('hud');
  const debugEl = document.getElementById('debug');
  if (!container || !hud || !debugEl) throw new Error('missing DOM nodes');

  const params = new URLSearchParams(location.search);
  const debug = params.get('debug') === '1';
  const preset = resolvePreset(params.get('preset'));
  const labRaw = params.get('lab');
  const labMode = labRaw === 'senate-diorama' ? ('senate-diorama' as const) : null;

  try {
    const t0 = performance.now();
    const catalog = (await fetch(CATALOG_URL).then((r) => r.json())) as Catalog;
    const areaId =
      params.get('area') && catalog.areas.some((a) => a.id === params.get('area'))
        ? (params.get('area') as string)
        : catalog.defaultAreaId;

    mountAreaSwitcher(catalog, areaId);

    const dataUrl = `/areas/${areaId}/data`;
    const configUrl = `/areas/${areaId}/area.config.json`;
    const landmarksUrl = `/areas/${areaId}/landmarks.json`;

    const [manifestLoad, configRes, landmarksFile] = await Promise.all([
      loadManifest(dataUrl),
      fetch(configUrl).then(async (r) => (r.ok ? ((await r.json()) as AreaConfig) : {})),
      fetch(landmarksUrl).then(async (r) => (await r.json()) as LandmarkFile),
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
      labMode,
      // Lab uses its own RT size inside createApp when labMode is set
      internalWidth: labMode ? undefined : (configRes.render?.internalWidth ?? 480),
      internalHeight: labMode ? undefined : (configRes.render?.internalHeight ?? 270),
    });

    console.info(
      `boot ${areaId}${labMode ? ` lab=${labMode}` : ''} ${Math.round(performance.now() - t0)} ms`,
    );

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  } catch (e) {
    hud.textContent = 'Failed to load area / landmarks.';
    console.error(e);
  }
}

boot();
