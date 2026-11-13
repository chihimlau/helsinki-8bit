import type { BBoxWgs84, PolyFeature } from './types';
import { toWorld, wgs84ToGk25 } from './coords';

/**
 * Helsinki South Harbour / Market Square shoreline is poorly covered by small
 * natural=water ponds in OSM. Build a simple sea polygon south of an approx
 * shoreline latitude so coastline is recognizable in M1.
 */
export function buildHarbourWaterFill(
  bbox: BBoxWgs84,
  origin: { x: number; y: number },
): PolyFeature {
  // Shoreline roughly south of Kauppatori / Eteläsatama edge
  const shoreLat = 60.16835;
  const sw = wgs84ToGk25(bbox.west, bbox.south);
  const se = wgs84ToGk25(bbox.east, bbox.south);
  const nw = wgs84ToGk25(bbox.west, shoreLat);
  const ne = wgs84ToGk25(bbox.east, shoreLat);
  const corners = [nw, ne, se, sw].map((p) => {
    const w = toWorld(p.x, p.y, origin);
    return [w.x, w.z] as [number, number];
  });
  return {
    id: 'harbour-water-fill',
    ring: corners,
    source: 'osm',
  };
}

export function waterAreaApprox(polys: PolyFeature[]): number {
  let area = 0;
  for (const p of polys) {
    const ring = p.ring;
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      area += ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1];
    }
  }
  return Math.abs(area) / 2;
}
