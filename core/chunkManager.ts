import { Group, Mesh, type Material, type Object3D } from 'three';
import { buildingExtrude, mergeGeometries, polyGeometry, roadGeometry } from './geometry';
import { fetchChunk, type ChunkJson } from './loadArea';
import type { AreaManifest } from './types';

type ChunkEntry = AreaManifest['chunks'][number];

type ActiveChunk = {
  id: string;
  group: Group;
  bytes: number;
};

export type ChunkManager = {
  sync: (centerX: number, centerZ: number, viewRadius: number) => void;
  getBytesLoaded: () => number;
  getLoadedChunkCount: () => number;
  dispose: () => void;
};

function buildChunkGroup(
  chunk: ChunkJson,
  mats: {
    building: Material;
    park: Material;
    water: Material;
    road: Material;
  },
): Group {
  const group = new Group();
  group.name = 'chunk';

  if (chunk.parks?.length) {
    const geos = chunk.parks.map((p) => polyGeometry(p, 0.04));
    group.add(new Mesh(mergeGeometries(geos), mats.park));
  }
  if (chunk.water?.length) {
    const geos = chunk.water.map((w) => polyGeometry(w, 0.02));
    group.add(new Mesh(mergeGeometries(geos), mats.water));
  }
  // Cap road density: keep wider roads first for perf
  const roads = [...(chunk.roads ?? [])].sort((a, b) => b.width - a.width).slice(0, 120);
  const roadGeos = roads
    .map((r) => roadGeometry(r))
    .filter((g): g is NonNullable<typeof g> => !!g);
  if (roadGeos.length) group.add(new Mesh(mergeGeometries(roadGeos), mats.road));

  const buildings = chunk.buildings ?? [];
  const batch = 100;
  for (let i = 0; i < buildings.length; i += batch) {
    const slice = buildings.slice(i, i + batch);
    group.add(new Mesh(mergeGeometries(slice.map(buildingExtrude)), mats.building));
  }
  return group;
}

function disposeObject(obj: Object3D) {
  obj.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh) {
      m.geometry?.dispose();
      // shared materials — do not dispose here
    }
  });
}

export function createChunkManager(opts: {
  scene: Object3D;
  manifest: AreaManifest;
  dataBaseUrl: string;
  materials: {
    building: Material;
    park: Material;
    water: Material;
    road: Material;
  };
  onChange: () => void;
  initialBytes?: number;
}): ChunkManager {
  const active = new Map<string, ActiveChunk>();
  const inflight = new Map<string, Promise<void>>();
  let bytesLoaded = opts.initialBytes ?? 0;
  const byId = new Map(opts.manifest.chunks.map((c) => [c.id, c]));

  const wantedIds = (cx: number, cz: number, radius: number): Set<string> => {
    const out = new Set<string>();
    const pad = opts.manifest.chunkSizeMeters;
    for (const c of opts.manifest.chunks) {
      const midX = (c.minX + c.maxX) / 2;
      const midZ = (c.minZ + c.maxZ) / 2;
      const dx = midX - cx;
      const dz = midZ - cz;
      // include if chunk AABB near view circle
      const near =
        Math.hypot(dx, dz) <= radius + pad * 0.75 ||
        (cx >= c.minX - pad &&
          cx <= c.maxX + pad &&
          cz >= c.minZ - pad &&
          cz <= c.maxZ + pad);
      if (near) out.add(c.id);
    }
    // Always keep at least chunks around origin if empty
    if (out.size === 0) {
      for (const c of opts.manifest.chunks.slice(0, 4)) out.add(c.id);
    }
    return out;
  };

  const loadOne = (entry: ChunkEntry) => {
    if (active.has(entry.id) || inflight.has(entry.id)) return;
    const p = (async () => {
      try {
        const { chunk, bytes } = await fetchChunk(opts.dataBaseUrl, entry.file);
        if (!inflight.has(entry.id)) return; // cancelled
        const group = buildChunkGroup(chunk, opts.materials);
        opts.scene.add(group);
        active.set(entry.id, { id: entry.id, group, bytes });
        bytesLoaded += bytes;
        opts.onChange();
      } catch (e) {
        console.error('chunk load failed', entry.id, e);
      } finally {
        inflight.delete(entry.id);
      }
    })();
    inflight.set(entry.id, p);
  };

  const unloadOne = (id: string) => {
    const a = active.get(id);
    if (!a) return;
    opts.scene.remove(a.group);
    disposeObject(a.group);
    active.delete(id);
    // keep bytesLoaded as cumulative downloaded (debug "load" = network so far)
    opts.onChange();
  };

  return {
    sync: (centerX, centerZ, viewRadius) => {
      const want = wantedIds(centerX, centerZ, viewRadius);
      for (const id of [...active.keys()]) {
        if (!want.has(id)) unloadOne(id);
      }
      for (const id of want) {
        const entry = byId.get(id);
        if (entry) loadOne(entry);
      }
    },
    getBytesLoaded: () => bytesLoaded,
    getLoadedChunkCount: () => active.size,
    dispose: () => {
      for (const id of [...active.keys()]) unloadOne(id);
      inflight.clear();
    },
  };
}
