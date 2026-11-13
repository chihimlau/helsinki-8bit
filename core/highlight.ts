import { EdgesGeometry, LineBasicMaterial, LineSegments, type Object3D } from 'three';
import { buildingExtrude } from './geometry';
import type { WorldBuilding } from './types';

export type HighlightHandle = {
  set: (b: WorldBuilding | null) => void;
  clear: () => void;
  dispose: () => void;
};

export function createHighlight(scene: Object3D, onChange: () => void): HighlightHandle {
  let current: LineSegments | null = null;
  const mat = new LineBasicMaterial({ color: 0xff8c00, linewidth: 2 });

  const clear = () => {
    if (current) {
      scene.remove(current);
      current.geometry.dispose();
      current = null;
      onChange();
    }
  };

  return {
    set: (b) => {
      clear();
      if (!b) return;
      const geo = buildingExtrude(b);
      const edges = new EdgesGeometry(geo, 20);
      geo.dispose();
      current = new LineSegments(edges, mat);
      scene.add(current);
      onChange();
    },
    clear,
    dispose: () => {
      clear();
      mat.dispose();
    },
  };
}
