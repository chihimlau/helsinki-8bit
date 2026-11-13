import { Group, Mesh, type Material, type Object3D } from 'three';
import { buildingExtrude, mergeGeometries, polyGeometry, roadGeometry } from './geometry';
import { fetchChunk, type ChunkJson } from './loadArea';
import type { AreaManifest, WorldBuilding } from './types';

type ChunkEntry = AreaManifest['chunks'][number];

type ActiveChunk = {
  id: string;
  group: Group;
  bytes: number;
  buildingIds: string[];
};

export type ChunkManager = {
  sync: (centerX: number, centerZ: number, viewRadius: number) => void;
  getBytesLoaded: () => number;
  getLoadedChunkCount: () => number;
  getBuildings: () => WorldBuilding[];
  dispose: () => void;
};

function footprintCentroid(fp: [number, number][]): { x: number; z: number } {
  let sx = 0;
  let sz = 0;
  const n = Math.max(fp.length, 1);
  for (const [x, z] of fp) {
    sx += x;
    sz += z;
  }
  return { x: sx / n, z: sz / n };
}

function nearMute(
  b: WorldBuilding,
  muteNear: Array<{ x: number; z: number; radius: number }>,
): boolean {
  if (!muteNear.length) return false;
  const c = footprintCentroid(b.footprint);
  for (const m of muteNear) {
    if (Math.hypot(c.x - m.x, c.z - m.z) <= m.radius) return true;
  }
  return false;
}

function buildChunkGroup(
  chunk: ChunkJson,
  mats: {
    building: Material;
    park: Material;
    water: Material;
    road: Material;
  },
  skipBuildingIds: Set<string>,
  muteNear: Array<{ x: number; z: number; radius: number }>,
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
  const roads = [...(chunk.roads ?? [])].sort((a, b) => b.width - a.width).slice(0, 120);
  const roadGeos = roads
    .map((r) => roadGeometry(r))
    .filter((g): g is NonNullable<typeof g> => !!g);
  if (roadGeos.length) group.add(new Mesh(mergeGeometries(roadGeos), mats.road));

  const buildings = (chunk.buildings ?? []).filter(
    (b) => !skipBuildingIds.has(b.id) && !nearMute(b, muteNear),
  );
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
  skipBuildingIds?: Set<string>;
  /** Hide generic footprints near diorama landmarks (2A art pass). */
  muteNear?: Array<{ x: number; z: number; radius: number }>;
  onChange: () => void;
  initialBytes?: number;
}): ChunkManager {
  const active = new Map<string, ActiveChunk>();
  const inflight = new Map<string, Promise<void>>();
  const buildingMap = new Map<string, WorldBuilding>();
  let bytesLoaded = opts.initialBytes ?? 0;
  const byId = new Map(opts.manifest.chunks.map((c) => [c.id, c]));
  const skip = opts.skipBuildingIds ?? new Set<string>();
  const muteNear = opts.muteNear ?? [];

  const wantedIds = (cx: number, cz: number, radius: number): Set<string> => {
    const out = new Set<string>();
    const pad = opts.manifest.chunkSizeMeters;
    for (const c of opts.manifest.chunks) {
      const midX = (c.minX + c.maxX) / 2;
      const midZ = (c.minZ + c.maxZ) / 2;
      const dx = midX - cx;
      const dz = midZ - cz;
      const near =
        Math.hypot(dx, dz) <= radius + pad * 0.75 ||
        (cx >= c.minX - pad &&
          cx <= c.maxX + pad &&
          cz >= c.minZ - pad &&
          cz <= c.maxZ + pad);
      if (near) out.add(c.id);
    }
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
        if (!inflight.has(entry.id)) return;
        const buildingIds: string[] = [];
        for (const b of chunk.buildings ?? []) {
          buildingMap.set(b.id, b);
          buildingIds.push(b.id);
        }
        const group = buildChunkGroup(chunk, opts.materials, skip, muteNear);
        opts.scene.add(group);
        active.set(entry.id, { id: entry.id, group, bytes, buildingIds });
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
    for (const bid of a.buildingIds) buildingMap.delete(bid);
    active.delete(id);
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
    getBuildings: () => [...buildingMap.values()],
    dispose: () => {
      for (const id of [...active.keys()]) unloadOne(id);
      inflight.clear();
      buildingMap.clear();
    },
  };
}
