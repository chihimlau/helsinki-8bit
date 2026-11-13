export type WorldBuilding = {
  id: string;
  footprint: [number, number][];
  holes?: [number, number][][];
  height: number;
  groundZ: number;
  source: string;
  heightSource: string;
  lod: string;
};

export type WorldLine = {
  id: string;
  points: [number, number][];
  width: number;
};

export type WorldPoly = {
  id: string;
  ring: [number, number][];
};

export type AreaManifest = {
  schemaVersion: number;
  areaId: string;
  cityId: string;
  origin: { x: number; y: number };
  chunkSizeMeters: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  chunks: Array<{
    id: string;
    file: string;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    buildingCount: number;
  }>;
  stats: {
    buildingsTotal: number;
    buildingsBySource: Record<string, number>;
    missingHeight: number;
    heightBySource: Record<string, number>;
    lod1: number;
    lod2: number;
    roads: number;
    parks: number;
    water: number;
  };
  attribution: string[];
};

export type LoadedArea = {
  manifest: AreaManifest;
  buildings: WorldBuilding[];
  roads: WorldLine[];
  parks: WorldPoly[];
  water: WorldPoly[];
  bytesLoaded: number;
};
