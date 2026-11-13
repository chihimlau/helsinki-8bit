import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { AreaDataset, ChunkData, ChunkManifest } from '../types';

function buildingCenter(b: AreaDataset['buildings'][number]): { x: number; z: number } {
  let sx = 0;
  let sz = 0;
  for (const [x, z] of b.footprint) {
    sx += x;
    sz += z;
  }
  const n = b.footprint.length || 1;
  return { x: sx / n, z: sz / n };
}

export function writeChunkedArea(opts: {
  outDir: string;
  areaId: string;
  cityId: string;
  origin: { x: number; y: number };
  chunkSizeMeters: number;
  attribution: string[];
  data: AreaDataset;
}): ChunkManifest {
  mkdirSync(opts.outDir, { recursive: true });
  const size = opts.chunkSizeMeters;
  const allX = opts.data.buildings.flatMap((b) => b.footprint.map((p) => p[0]));
  const allZ = opts.data.buildings.flatMap((b) => b.footprint.map((p) => p[1]));
  for (const r of opts.data.roads) {
    for (const p of r.points) {
      allX.push(p[0]);
      allZ.push(p[1]);
    }
  }
  for (const poly of [...opts.data.parks, ...opts.data.water]) {
    for (const p of poly.ring) {
      allX.push(p[0]);
      allZ.push(p[1]);
    }
  }
  const minX = Math.floor(Math.min(...allX, -1) / size) * size;
  const maxX = Math.ceil(Math.max(...allX, 1) / size) * size;
  const minZ = Math.floor(Math.min(...allZ, -1) / size) * size;
  const maxZ = Math.ceil(Math.max(...allZ, 1) / size) * size;

  const chunkMap = new Map<string, ChunkData>();

  const ensure = (cx: number, cz: number) => {
    const id = `${cx}_${cz}`;
    let c = chunkMap.get(id);
    if (!c) {
      c = { id, buildings: [], roads: [], parks: [], water: [] };
      chunkMap.set(id, c);
    }
    return c;
  };

  for (const b of opts.data.buildings) {
    const c = buildingCenter(b);
    const cx = Math.floor(c.x / size) * size;
    const cz = Math.floor(c.z / size) * size;
    ensure(cx, cz).buildings.push(b);
  }
  for (const r of opts.data.roads) {
    if (!r.points.length) continue;
    const c = r.points[Math.floor(r.points.length / 2)];
    const cx = Math.floor(c[0] / size) * size;
    const cz = Math.floor(c[1] / size) * size;
    ensure(cx, cz).roads.push(r);
  }
  for (const p of opts.data.parks) {
    const c = p.ring[0];
    const cx = Math.floor(c[0] / size) * size;
    const cz = Math.floor(c[1] / size) * size;
    ensure(cx, cz).parks.push(p);
  }
  for (const w of opts.data.water) {
    const c = w.ring[0];
    const cx = Math.floor(c[0] / size) * size;
    const cz = Math.floor(c[1] / size) * size;
    ensure(cx, cz).water.push(w);
  }

  // Remove previous plain/gzip chunk files so we don't leave stale assets
  for (const name of readdirSync(opts.outDir)) {
    if (/^chunk-.*\.json(\.gz)?$/.test(name)) {
      unlinkSync(join(opts.outDir, name));
    }
  }

  const chunks: ChunkManifest['chunks'] = [];
  for (const chunk of chunkMap.values()) {
    const file = `chunk-${chunk.id}.json.gz`;
    const json = JSON.stringify(chunk);
    writeFileSync(join(opts.outDir, file), gzipSync(Buffer.from(json, 'utf8')));
    const [sx, sz] = chunk.id.split('_').map(Number);
    chunks.push({
      id: chunk.id,
      file,
      minX: sx,
      maxX: sx + size,
      minZ: sz,
      maxZ: sz + size,
      buildingCount: chunk.buildings.length,
    });
  }

  const manifest: ChunkManifest = {
    schemaVersion: 2,
    areaId: opts.areaId,
    cityId: opts.cityId,
    origin: opts.origin,
    chunkSizeMeters: size,
    bounds: { minX, maxX, minZ, maxZ },
    chunks: chunks.sort((a, b) => a.id.localeCompare(b.id)),
    stats: opts.data.stats,
    attribution: opts.attribution,
  };
  writeFileSync(join(opts.outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}
