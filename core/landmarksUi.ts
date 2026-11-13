import type { OrthographicCamera } from 'three';
import { screenProject } from './picking';
import type { LandmarkWorld } from './types';

export type LandmarksUi = {
  update: () => void;
  dispose: () => void;
  /** Open card and jump camera. */
  open: (id: string) => void;
  /** Open card only (e.g. after tapping the building in-world). */
  showCard: (id: string) => void;
};

export function createLandmarksUi(opts: {
  landmarks: LandmarkWorld[];
  camera: OrthographicCamera;
  canvas: HTMLElement;
  onJump: (lm: LandmarkWorld) => void;
  onChange: () => void;
}): LandmarksUi {
  const layer = document.createElement('div');
  layer.id = 'landmarks-layer';
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;';
  document.body.appendChild(layer);

  const pins = new Map<string, HTMLButtonElement>();
  for (const lm of opts.landmarks) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = lm.name;
    btn.textContent = '▼';
    btn.dataset.id = lm.id;
    btn.style.cssText =
      'position:fixed;transform:translate(-50%,-100%);pointer-events:auto;border:none;background:#c62828;color:#fff;width:22px;height:22px;border-radius:50% 50% 50% 0;rotate:-45deg;font-size:10px;line-height:22px;padding:0;cursor:pointer;box-shadow:0 1px 3px #0008;';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCard(lm);
      opts.onJump(lm);
    });
    layer.appendChild(btn);
    pins.set(lm.id, btn);
  }

  const list = document.createElement('div');
  list.id = 'landmark-list';
  list.style.cssText =
    'position:fixed;top:10px;right:10px;z-index:8;max-width:min(260px,70vw);max-height:55vh;overflow:auto;background:rgba(0,0,0,0.92);color:#f2f2f2;font:12px/1.4 ui-monospace,Consolas,monospace;border-radius:6px;padding:8px;pointer-events:auto;';
  list.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Landmarks</div>`;
  for (const lm of opts.landmarks) {
    const row = document.createElement('button');
    row.type = 'button';
    row.textContent = lm.name;
    row.style.cssText =
      'display:block;width:100%;text-align:left;background:transparent;border:none;color:#e8eef2;padding:4px 2px;cursor:pointer;font:inherit;border-bottom:1px solid #333;';
    row.addEventListener('click', () => {
      openCard(lm);
      opts.onJump(lm);
    });
    list.appendChild(row);
  }
  document.body.appendChild(list);

  const card = document.createElement('div');
  card.id = 'landmark-card';
  card.style.cssText =
    'display:none;position:fixed;left:50%;bottom:56px;transform:translateX(-50%);z-index:9;width:min(360px,92vw);background:rgba(20,24,28,0.96);color:#f5f5f5;padding:12px 14px;border-radius:8px;font:13px/1.45 system-ui,Segoe UI,sans-serif;pointer-events:auto;box-shadow:0 4px 16px #0008;';
  document.body.appendChild(card);

  const overlapsUi = (left: number, top: number) => {
    const hit = (el: Element | null) => {
      if (!el) return false;
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      // pin tip approx 22x22, hide if center enters panel
      return left >= r.left - 8 && left <= r.right + 8 && top >= r.top - 8 && top <= r.bottom + 8;
    };
    return (
      hit(list) ||
      hit(card.style.display === 'none' ? null : card) ||
      hit(document.getElementById('debug'))
    );
  };

  function openCard(lm: LandmarkWorld) {
    card.style.display = 'block';
    card.innerHTML = `<div style="font-weight:700;font-size:15px;margin-bottom:4px">${lm.name}</div><div style="opacity:0.9">${lm.blurb}</div><button type="button" id="card-close" style="margin-top:8px;font:12px monospace;background:#243038;color:#eee;border:1px solid #4a5a64;border-radius:4px;padding:4px 8px;cursor:pointer">Close</button>`;
    card.querySelector('#card-close')?.addEventListener('click', () => {
      card.style.display = 'none';
      opts.onChange();
    });
    opts.onChange();
  }

  const update = () => {
    for (const lm of opts.landmarks) {
      const pin = pins.get(lm.id);
      if (!pin) continue;
      const p = screenProject(lm.x, 28, lm.z, opts.camera, opts.canvas);
      if (!p || overlapsUi(p.left, p.top)) {
        pin.style.display = 'none';
        continue;
      }
      pin.style.display = 'block';
      pin.style.left = `${p.left}px`;
      pin.style.top = `${p.top}px`;
    }
  };

  return {
    update,
    open: (id) => {
      const lm = opts.landmarks.find((l) => l.id === id);
      if (lm) {
        openCard(lm);
        opts.onJump(lm);
      }
    },
    showCard: (id) => {
      const lm = opts.landmarks.find((l) => l.id === id);
      if (lm) openCard(lm);
    },
    dispose: () => {
      layer.remove();
      list.remove();
      card.remove();
    },
  };
}
