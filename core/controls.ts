import { OrthographicCamera, Vector3 } from 'three';

export type ControlsHandle = {
  dispose: () => void;
  getTarget: () => { x: number; z: number };
  setTarget: (x: number, z: number) => void;
  setZoom: (z: number) => void;
  getZoom: () => number;
};

/**
 * Orthographic pan + zoom. Drag = grab the map (content follows the pointer).
 * Mouse left-drag / one-finger pan; wheel / pinch zoom. No rotate.
 */
export function attachMapControls(
  dom: HTMLElement,
  camera: OrthographicCamera,
  opts: {
    getFrustum: () => number;
    setFrustum: (f: number) => void;
    /** Fixed render-target aspect (width/height), e.g. 480/270. */
    getAspect: () => number;
    onChange: () => void;
    minFrustum?: number;
    maxFrustum?: number;
  },
): ControlsHandle {
  const minF = opts.minFrustum ?? 80;
  const maxF = opts.maxFrustum ?? 1200;
  let targetX = 0;
  let targetZ = 0;
  let activeId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let pinchStartDist = 0;
  let pinchStartFrustum = opts.getFrustum();

  const right = new Vector3();
  const forward = new Vector3();

  const applyCamera = () => {
    const f = opts.getFrustum();
    const aspect = opts.getAspect();
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
    camera.far = Math.max(dist * 4, 2000);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    opts.onChange();
  };

  const panByPixels = (dx: number, dy: number) => {
    const f = opts.getFrustum();
    const scale = f / Math.max(dom.clientHeight, 1);
    // Camera axes projected onto ground (XZ)
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    else right.normalize();
    forward.set(0, 1, 0).applyQuaternion(camera.quaternion);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    else forward.normalize();

    // Grab-map: move target opposite to pointer so content follows the finger
    targetX -= (right.x * dx - forward.x * dy) * scale;
    targetZ -= (right.z * dx - forward.z * dy) * scale;
    applyCamera();
  };

  const pointers = new Map<number, { x: number; y: number }>();

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dom.setPointerCapture(e.pointerId);

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartFrustum = opts.getFrustum();
      activeId = null;
      return;
    }

    activeId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchStartDist > 1) {
        const next = Math.min(
          maxF,
          Math.max(minF, pinchStartFrustum * (pinchStartDist / dist)),
        );
        opts.setFrustum(next);
        applyCamera();
      }
      return;
    }

    if (activeId !== e.pointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (dx !== 0 || dy !== 0) panByPixels(dx, dy);
  };

  const onPointerUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (activeId === e.pointerId) activeId = null;
    try {
      dom.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (pointers.size === 1) {
      const [id, p] = [...pointers.entries()][0];
      activeId = id;
      lastX = p.x;
      lastY = p.y;
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const f = opts.getFrustum();
    const next = Math.min(maxF, Math.max(minF, f * (e.deltaY > 0 ? 1.12 : 0.9)));
    opts.setFrustum(next);
    applyCamera();
  };

  const onContextMenu = (e: Event) => e.preventDefault();

  dom.style.touchAction = 'none';
  dom.style.cursor = 'grab';
  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('pointercancel', onPointerUp);
  dom.addEventListener('pointerleave', onPointerUp);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', onContextMenu);

  const onDownCursor = () => {
    dom.style.cursor = 'grabbing';
  };
  const onUpCursor = () => {
    dom.style.cursor = 'grab';
  };
  dom.addEventListener('pointerdown', onDownCursor);
  dom.addEventListener('pointerup', onUpCursor);
  dom.addEventListener('pointercancel', onUpCursor);

  applyCamera();

  return {
    dispose: () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('pointerleave', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onContextMenu);
      dom.removeEventListener('pointerdown', onDownCursor);
      dom.removeEventListener('pointerup', onUpCursor);
      dom.removeEventListener('pointercancel', onUpCursor);
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
