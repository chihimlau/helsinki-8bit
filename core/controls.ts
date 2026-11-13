import type { OrthographicCamera } from 'three';

export type ControlsHandle = {
  dispose: () => void;
  getTarget: () => { x: number; z: number };
  setTarget: (x: number, z: number) => void;
  setZoom: (z: number) => void;
  getZoom: () => number;
};

/** Orthographic pan (1-finger / mouse drag) + zoom (wheel / pinch). No rotate. */
export function attachMapControls(
  dom: HTMLElement,
  camera: OrthographicCamera,
  opts: {
    getFrustum: () => number;
    setFrustum: (f: number) => void;
    onChange: () => void;
    minFrustum?: number;
    maxFrustum?: number;
  },
): ControlsHandle {
  const minF = opts.minFrustum ?? 80;
  const maxF = opts.maxFrustum ?? 1200;
  let targetX = 0;
  let targetZ = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinchStartDist = 0;
  let pinchStartFrustum = opts.getFrustum();

  const applyCamera = () => {
    const f = opts.getFrustum();
    const aspect = camera.right / camera.top;
    // Dimetric: azimuth 45°, elevation 30°
    const az = (Math.PI / 180) * 45;
    const el = (Math.PI / 180) * 30;
    const dist = f * 2.2;
    camera.position.set(
      targetX + dist * Math.cos(el) * Math.sin(az),
      dist * Math.sin(el),
      targetZ + dist * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(targetX, 0, targetZ);
    camera.left = (-f * aspect) / 2;
    camera.right = (f * aspect) / 2;
    camera.top = f / 2;
    camera.bottom = -f / 2;
    camera.near = 1;
    camera.far = dist * 4;
    camera.updateProjectionMatrix();
    opts.onChange();
  };

  const clientToDelta = (dx: number, dy: number) => {
    const f = opts.getFrustum();
    const scale = f / dom.clientHeight;
    // Screen drag aligned roughly with ground under dimetric view
    const worldDx = (-dx + dy) * scale * 0.7;
    const worldDz = (-dx - dy) * scale * 0.7;
    targetX += worldDx;
    targetZ += worldDz;
    applyCamera();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    dom.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    clientToDelta(dx, dy);
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    try {
      dom.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const f = opts.getFrustum();
    const next = Math.min(maxF, Math.max(minF, f * (e.deltaY > 0 ? 1.1 : 0.9)));
    opts.setFrustum(next);
    applyCamera();
  };

  const pointers = new Map<number, { x: number; y: number }>();
  const onPointerDownMulti = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartFrustum = opts.getFrustum();
      dragging = false;
    } else {
      onPointerDown(e);
    }
  };
  const onPointerMoveMulti = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartDist > 0) {
        const next = Math.min(
          maxF,
          Math.max(minF, pinchStartFrustum * (pinchStartDist / dist)),
        );
        opts.setFrustum(next);
        applyCamera();
      }
      return;
    }
    onPointerMove(e);
  };
  const onPointerUpMulti = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    onPointerUp(e);
  };

  dom.addEventListener('pointerdown', onPointerDownMulti);
  dom.addEventListener('pointermove', onPointerMoveMulti);
  dom.addEventListener('pointerup', onPointerUpMulti);
  dom.addEventListener('pointercancel', onPointerUpMulti);
  dom.addEventListener('wheel', onWheel, { passive: false });

  applyCamera();

  return {
    dispose: () => {
      dom.removeEventListener('pointerdown', onPointerDownMulti);
      dom.removeEventListener('pointermove', onPointerMoveMulti);
      dom.removeEventListener('pointerup', onPointerUpMulti);
      dom.removeEventListener('pointercancel', onPointerUpMulti);
      dom.removeEventListener('wheel', onWheel);
    },
    getTarget: () => ({ x: targetX, z: targetZ }),
    setTarget: (x, z) => {
      targetX = x;
      targetZ = z;
      applyCamera();
    },
    setZoom: (z) => {
      opts.setFrustum(Math.min(maxF, Math.max(minF, z)));
      applyCamera();
    },
    getZoom: () => opts.getFrustum(),
  };
}
