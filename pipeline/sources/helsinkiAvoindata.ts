import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BBoxWgs84, BuildingRecord } from '../types';
import { toWorld, wgs84ToGk25 } from '../coords';

const UA = 'helsinki-8bit-pipeline/0.1 (personal; contact: chihimlau1386@gmail.com)';
const WFS = 'https://kartta.hel.fi/ws/geoserver/avoindata/wfs';
const LAYER = 'avoindata:Rakennukset_alue_rekisteritiedot';
const FLOOR_M = 3.2;
const DEFAULT_HEIGHT_M = 10;

type GjFeature = {
  type: string;
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: number[][][] | number[][][][] } | null;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ringToWorld(
  ring: number[][],
  origin: { x: number; y: number },
): [number, number][] {
  const out: [number, number][] = [];
  for (const c of ring) {
    const easting = c[0];
    const northing = c[1];
    const w = toWorld(easting, northing, origin);
    out.push([w.x, w.z]);
  }
  if (out.length > 1) {
    const a = out[0];
    const b = out[out.length - 1];
    if (a[0] === b[0] && a[1] === b[1]) out.pop();
  }
  return out;
}

function heightFromProps(p: Record<string, unknown>): {
  height: number;
  heightSource: BuildingRecord['heightSource'];
} {
  const floors = p.i_kerrlkm;
  if (typeof floors === 'number' && floors > 0) {
    return { height: floors * FLOOR_M, heightSource: 'floors' };
  }
  return { height: DEFAULT_HEIGHT_M, heightSource: 'default' };
}

export function parseAvoindataGeoJson(
  geojson: { features?: GjFeature[] },
  origin: { x: number; y: number },
): BuildingRecord[] {
  const buildings: BuildingRecord[] = [];
  for (const f of geojson.features ?? []) {
    if (!f.geometry) continue;
    const p = f.properties ?? {};
    let rings: number[][][] = [];
    if (f.geometry.type === 'Polygon') {
      rings = f.geometry.coordinates as number[][][];
    } else if (f.geometry.type === 'MultiPolygon') {
      const multi = f.geometry.coordinates as number[][][][];
      rings = multi[0] ?? [];
    } else continue;
    if (!rings[0] || rings[0].length < 3) continue;
    const footprint = ringToWorld(rings[0], origin);
    if (footprint.length < 3) continue;
    const holes = rings.slice(1).map((r) => ringToWorld(r, origin)).filter((h) => h.length >= 3);
    const { height, heightSource } = heightFromProps(p);
    const idNum = p.id ?? f.id;
    buildings.push({
      id: `avo-${idNum}`,
      ratu: typeof p.ratu === 'number' ? p.ratu : null,
      vtjPrt: typeof p.vtj_prt === 'string' ? p.vtj_prt : null,
      osmId: null,
      footprint,
      holes: holes.length ? holes : undefined,
      height,
      groundZ: 0,
      roof: 'flat',
      lod: 'lod1',
      source: 'helsinki-avoindata',
      heightSource,
    });
  }
  return buildings;
}

export async function fetchAvoindataBuildings(
  areaId: string,
  bbox: BBoxWgs84,
  origin: { x: number; y: number },
  rawDir: string,
): Promise<BuildingRecord[]> {
  mkdirSync(rawDir, { recursive: true });
  const cachePath = join(rawDir, 'avoindata-buildings.json');
  if (existsSync(cachePath)) {
    const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
    return parseAvoindataGeoJson(cached, origin);
  }

  const sw = wgs84ToGk25(bbox.west, bbox.south);
  const ne = wgs84ToGk25(bbox.east, bbox.north);
  const x1 = Math.round(Math.min(sw.x, ne.x));
  const y1 = Math.round(Math.min(sw.y, ne.y));
  const x2 = Math.round(Math.max(sw.x, ne.x));
  const y2 = Math.round(Math.max(sw.y, ne.y));
  // M0: easting,northing + EPSG:3879 works
  const bboxParam = `${x1},${y1},${x2},${y2},EPSG:3879`;
  const url =
    `${WFS}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeNames=${encodeURIComponent(LAYER)}` +
    `&outputFormat=application/json&srsName=EPSG:3879&count=5000` +
    `&bbox=${bboxParam}`;

  await sleep(1000);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    throw new Error(`avoindata WFS HTTP ${res.status} for ${areaId}`);
  }
  const text = await res.text();
  writeFileSync(cachePath, text);
  const geojson = JSON.parse(text);
  return parseAvoindataGeoJson(geojson, origin);
}
