import { OrthographicCamera, Raycaster, Vector2, Vector3 } from 'three';
import type { WorldBuilding } from './types';

function pointInRing(x: number, z: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const zi = ring[i][1];
    const xj = ring[j][0];
    const zj = ring[j][1];
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Ray from camera through CSS pixel → hit building (top-most by height). */
export function pickBuilding(
  clientX: number,
  clientY: number,
  dom: HTMLElement,
  camera: OrthographicCamera,
  buildings: WorldBuilding[],
): WorldBuilding | null {
  const rect = dom.getBoundingClientRect();
  const ndc = new Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const origin = raycaster.ray.origin.clone();
  const dir = raycaster.ray.direction.clone().normalize();

  // March along ray in world Y from high to ground-ish
  let best: WorldBuilding | null = null;
  let bestY = -Infinity;
  for (const b of buildings) {
    const top = b.groundZ + b.height;
    // Intersect ray with plane y = top (approx roof pick) and y mid
    for (const yPlane of [top, b.groundZ + b.height * 0.5, b.groundZ + 1]) {
      if (Math.abs(dir.y) < 1e-6) continue;
      const t = (yPlane - origin.y) / dir.y;
      if (t < 0) continue;
      const hit = origin.clone().addScaledVector(dir, t);
      if (pointInRing(hit.x, hit.z, b.footprint)) {
        if (top > bestY) {
          bestY = top;
          best = b;
        }
        break;
      }
    }
  }
  return best;
}

export function screenProject(
  x: number,
  y: number,
  z: number,
  camera: OrthographicCamera,
  dom: HTMLElement,
): { left: number; top: number } | null {
  const v = new Vector3(x, y, z).project(camera);
  if (v.z > 1) return null;
  const rect = dom.getBoundingClientRect();
  return {
    left: ((v.x + 1) / 2) * rect.width + rect.left,
    top: ((-v.y + 1) / 2) * rect.height + rect.top,
  };
}
