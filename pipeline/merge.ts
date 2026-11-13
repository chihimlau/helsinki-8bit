import type { AreaDataset, BuildingRecord, PipelineStats } from './types';

function ringCentroid(ring: [number, number][]): { x: number; z: number } {
  let sx = 0;
  let sz = 0;
  for (const [x, z] of ring) {
    sx += x;
    sz += z;
  }
  const n = ring.length || 1;
  return { x: sx / n, z: sz / n };
}

function pointInRing(x: number, z: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const zi = ring[i][1];
    const xj = ring[j][0];
    const zj = ring[j][1];
    const intersect = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function footprintsOverlap(a: [number, number][], b: [number, number][]): boolean {
  const ca = ringCentroid(a);
  const cb = ringCentroid(b);
  if (pointInRing(ca.x, ca.z, b) || pointInRing(cb.x, cb.z, a)) return true;
  const dist = Math.hypot(ca.x - cb.x, ca.z - cb.z);
  return dist < 8;
}

export function mergeAreaData(input: {
  avoBuildings: BuildingRecord[];
  osmBuildings: BuildingRecord[];
  roads: AreaDataset['roads'];
  parks: AreaDataset['parks'];
  water: AreaDataset['water'];
}): AreaDataset {
  const buildings: BuildingRecord[] = [...input.avoBuildings];
  for (const ob of input.osmBuildings) {
    const hit = buildings.find((b) => footprintsOverlap(b.footprint, ob.footprint));
    if (hit) {
      if (!hit.osmId) hit.osmId = ob.osmId;
      continue;
    }
    buildings.push(ob);
  }

  const buildingsBySource: Record<string, number> = {};
  const heightBySource: Record<string, number> = {};
  let missingHeight = 0;
  for (const b of buildings) {
    buildingsBySource[b.source] = (buildingsBySource[b.source] ?? 0) + 1;
    heightBySource[b.heightSource] = (heightBySource[b.heightSource] ?? 0) + 1;
    if (b.heightSource === 'default') missingHeight += 1;
  }

  const stats: PipelineStats = {
    buildingsTotal: buildings.length,
    buildingsBySource,
    missingHeight,
    heightBySource,
    lod1: buildings.length,
    lod2: 0,
    roads: input.roads.length,
    parks: input.parks.length,
    water: input.water.length,
  };

  return {
    buildings,
    roads: input.roads,
    parks: input.parks,
    water: input.water,
    stats,
  };
}
