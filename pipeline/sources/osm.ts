import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BBoxWgs84, BuildingRecord, LineFeature, PolyFeature } from '../types';
import { toWorld, wgs84ToGk25 } from '../coords';

const UA = 'helsinki-8bit-pipeline/0.1 (personal; contact: chihimlau1386@gmail.com)';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const FLOOR_M = 3.2;
const DEFAULT_HEIGHT_M = 10;

type OsmEl = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  members?: Array<{
    type: string;
    ref: number;
    role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function roadWidth(highway: string | undefined): number {
  if (!highway) return 6;
  if (highway === 'footway' || highway === 'path' || highway === 'steps') return 2.5;
  if (highway === 'service' || highway === 'residential') return 6;
  if (highway === 'tertiary' || highway === 'unclassified') return 8;
  if (highway === 'secondary') return 10;
  if (highway === 'primary') return 12;
  return 7;
}

function geomToWorld(
  geom: Array<{ lat: number; lon: number }>,
  origin: { x: number; y: number },
): [number, number][] {
  return geom.map((g) => {
    const p = wgs84ToGk25(g.lon, g.lat);
    const w = toWorld(p.x, p.y, origin);
    return [w.x, w.z] as [number, number];
  });
}

function parseHeight(tags: Record<string, string> | undefined): {
  height: number;
  heightSource: BuildingRecord['heightSource'];
} {
  if (!tags) return { height: DEFAULT_HEIGHT_M, heightSource: 'default' };
  if (tags.height) {
    const h = parseFloat(tags.height);
    if (!Number.isNaN(h) && h > 0) return { height: h, heightSource: 'osm-height' };
  }
  if (tags['building:levels']) {
    const n = parseFloat(tags['building:levels']);
    if (!Number.isNaN(n) && n > 0) return { height: n * FLOOR_M, heightSource: 'osm-levels' };
  }
  return { height: DEFAULT_HEIGHT_M, heightSource: 'default' };
}

export function parseOsmPayload(
  payload: { elements?: OsmEl[] },
  origin: { x: number; y: number },
): {
  buildings: BuildingRecord[];
  roads: LineFeature[];
  parks: PolyFeature[];
  water: PolyFeature[];
} {
  const elements = payload.elements ?? [];
  const buildings: BuildingRecord[] = [];
  const roads: LineFeature[] = [];
  const parks: PolyFeature[] = [];
  const water: PolyFeature[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    if (el.type === 'way' && el.geometry && el.geometry.length >= 2) {
      const pts = geomToWorld(el.geometry, origin);
      if (tags.building) {
        if (pts.length >= 3) {
          const { height, heightSource } = parseHeight(tags);
          buildings.push({
            id: `osm-way-${el.id}`,
            ratu: null,
            vtjPrt: null,
            osmId: `way/${el.id}`,
            footprint: pts,
            height,
            groundZ: 0,
            roof: 'flat',
            lod: 'lod1',
            source: 'osm',
            heightSource,
          });
        }
      } else if (tags.highway) {
        roads.push({
          id: `osm-way-${el.id}`,
          points: pts,
          width: roadWidth(tags.highway),
          source: 'osm',
        });
      } else if (
        tags.natural === 'water' ||
        tags.waterway === 'riverbank' ||
        tags.water ||
        tags.landuse === 'basin'
      ) {
        if (pts.length >= 3) {
          water.push({ id: `osm-way-${el.id}`, ring: pts, source: 'osm' });
        }
      } else if (
        tags.leisure === 'park' ||
        tags.landuse === 'grass' ||
        tags.landuse === 'recreation_ground' ||
        tags.leisure === 'garden'
      ) {
        if (pts.length >= 3) {
          parks.push({ id: `osm-way-${el.id}`, ring: pts, source: 'osm' });
        }
      }
    }

  }

  for (const el of elements) {
    if (el.type !== 'relation' || !el.members?.length) continue;
    const tags = el.tags ?? {};
    const outers = el.members.filter((m) => m.role === 'outer' && m.geometry && m.geometry.length >= 3);
    for (const m of outers) {
      const pts = geomToWorld(m.geometry!, origin);
      if (pts.length < 3) continue;
      if (tags.building) {
        const { height, heightSource } = parseHeight(tags);
        buildings.push({
          id: `osm-rel-${el.id}-${m.ref}`,
          ratu: null,
          vtjPrt: null,
          osmId: `relation/${el.id}`,
          footprint: pts,
          height,
          groundZ: 0,
          roof: 'flat',
          lod: 'lod1',
          source: 'osm',
          heightSource,
        });
      } else if (tags.natural === 'water' || tags.water || tags.natural === 'bay') {
        water.push({ id: `osm-rel-${el.id}-${m.ref}`, ring: pts, source: 'osm' });
      } else if (tags.leisure === 'park' || tags.landuse === 'grass') {
        parks.push({ id: `osm-rel-${el.id}-${m.ref}`, ring: pts, source: 'osm' });
      }
    }
  }

  return { buildings, roads, parks, water };
}

export async function fetchOsmLayers(
  areaId: string,
  bbox: BBoxWgs84,
  origin: { x: number; y: number },
  rawDir: string,
): Promise<{
  buildings: BuildingRecord[];
  roads: LineFeature[];
  parks: PolyFeature[];
  water: PolyFeature[];
}> {
  mkdirSync(rawDir, { recursive: true });
  const cachePath = join(rawDir, 'osm-layers.json');
  if (existsSync(cachePath)) {
    return parseOsmPayload(JSON.parse(readFileSync(cachePath, 'utf8')), origin);
  }

  const { south, west, north, east } = bbox;
  const q = `
[out:json][timeout:120];
(
  way["building"](${south},${west},${north},${east});
  relation["building"](${south},${west},${north},${east});
  way["highway"](${south},${west},${north},${east});
  way["natural"="water"](${south},${west},${north},${east});
  relation["natural"="water"](${south},${west},${north},${east});
  way["waterway"="riverbank"](${south},${west},${north},${east});
  way["water"](${south},${west},${north},${east});
  way["natural"="bay"](${south},${west},${north},${east});
  way["natural"="coastline"](${south},${west},${north},${east});
  relation["natural"="coastline"](${south},${west},${north},${east});
  way["place"="sea"](${south},${west},${north},${east});
  relation["place"="sea"](${south},${west},${north},${east});
  way["leisure"="park"](${south},${west},${north},${east});
  way["landuse"="grass"](${south},${west},${north},${east});
  way["landuse"="recreation_ground"](${south},${west},${north},${east});
  way["leisure"="garden"](${south},${west},${north},${east});
);
out geom;
`.trim();

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(1000);
    try {
      const res = await fetch(OVERPASS, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'data=' + encodeURIComponent(q),
      });
      if (!res.ok) {
        lastErr = new Error(`Overpass HTTP ${res.status}`);
        await sleep(30000);
        continue;
      }
      const text = await res.text();
      writeFileSync(cachePath, text);
      return parseOsmPayload(JSON.parse(text), origin);
    } catch (e) {
      lastErr = e;
      await sleep(30000);
    }
  }
  throw new Error(`OSM fetch failed for ${areaId}: ${String(lastErr)}`);
}
