import type { LoadedArea } from './types';

export type DebugApi = {
  setFps: (fps: number) => void;
  setDrawCalls: (n: number) => void;
  mountCameras: (buttons: Array<{ label: string; onClick: () => void }>) => void;
};

export function createDebugPanel(
  el: HTMLElement,
  area: LoadedArea,
  enabled: boolean,
): DebugApi {
  if (!enabled) {
    el.style.display = 'none';
    return {
      setFps: () => undefined,
      setDrawCalls: () => undefined,
      mountCameras: () => undefined,
    };
  }
  el.style.display = 'block';
  const stats = area.manifest.stats;
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
    <div>load: ${(area.bytesLoaded / 1024).toFixed(1)} KB</div>
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
