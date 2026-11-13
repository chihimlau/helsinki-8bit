import type { AreaManifest } from './types';

export type DebugApi = {
  setFps: (fps: number) => void;
  setDrawCalls: (n: number) => void;
  setLoad: (bytes: number, chunksLoaded: number, chunksTotal: number) => void;
  mountCameras: (buttons: Array<{ label: string; onClick: () => void }>) => void;
};

export function createDebugPanel(
  el: HTMLElement,
  manifest: AreaManifest,
  enabled: boolean,
): DebugApi {
  if (!enabled) {
    el.style.display = 'none';
    return {
      setFps: () => undefined,
      setDrawCalls: () => undefined,
      setLoad: () => undefined,
      mountCameras: () => undefined,
    };
  }
  el.style.display = 'block';
  const stats = manifest.stats;
  const sourceLines = Object.entries(stats.buildingsBySource)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  el.innerHTML = `
    <div><strong>debug</strong></div>
    <div>buildings: ${stats.buildingsTotal}</div>
    <div>missingHeight (default): ${stats.missingHeight}</div>
    <div>sources: ${sourceLines || '—'}</div>
    <div>LoD1 / LoD2: ${stats.lod1} / ${stats.lod2}</div>
    <div>roads / parks / water: ${stats.roads} / ${stats.parks} / ${stats.water}</div>
    <div id="dbg-load">load: —</div>
    <div id="dbg-chunks">chunks: —</div>
    <div id="dbg-draw">drawCalls: —</div>
    <div id="dbg-fps">FPS: —</div>
    <div id="dbg-cams"></div>
  `;
  return {
    setFps: (fps) => {
      const n = el.querySelector('#dbg-fps');
      if (n) n.textContent = `FPS: ${fps.toFixed(0)}`;
    },
    setDrawCalls: (n) => {
      const d = el.querySelector('#dbg-draw');
      if (d) d.textContent = `drawCalls: ${n}`;
    },
    setLoad: (bytes, chunksLoaded, chunksTotal) => {
      const l = el.querySelector('#dbg-load');
      if (l) l.textContent = `load: ${(bytes / 1024).toFixed(1)} KB`;
      const c = el.querySelector('#dbg-chunks');
      if (c) c.textContent = `chunks: ${chunksLoaded} / ${chunksTotal}`;
    },
    mountCameras: (buttons) => {
      const box = el.querySelector('#dbg-cams');
      if (!box) return;
      box.innerHTML = '';
      for (const b of buttons) {
        const btn = document.createElement('button');
        btn.textContent = b.label;
        btn.addEventListener('click', b.onClick);
        box.appendChild(btn);
      }
    },
  };
}
