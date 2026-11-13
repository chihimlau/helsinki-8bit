export type Vec2 = [number, number];

export type BuildingRecord = {
  id: string;
  ratu: number | null;
  vtjPrt: string | null;
  osmId: string | null;
  footprint: Vec2[];
  holes?: Vec2[][];
  height: number;
  groundZ: number;
  roof: 'flat';
  lod: 'lod1';
  source: 'helsinki-avoindata' | 'osm';
  heightSource: 'floors' | 'osm-height' | 'osm-levels' | 'default';
};

export type PolyFeature = {
  id: string;
  ring: Vec2[];
  source: 'osm';
};

export type LineFeature = {
  id: string;
  points: Vec2[];
  width: number;
  source: 'osm';
};

export type AreaDataset = {
  buildings: BuildingRecord[];
  roads: LineFeature[];
  parks: PolyFeature[];
  water: PolyFeature[];
  stats: PipelineStats;
};

export type PipelineStats = {
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

export type ChunkManifest = {
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
  stats: PipelineStats;
  attribution: string[];
};

export type ChunkData = {
  id: string;
  buildings: BuildingRecord[];
  roads: LineFeature[];
  parks: PolyFeature[];
  water: PolyFeature[];
};

export type BBoxWgs84 = {
  south: number;
  north: number;
  west: number;
  east: number;
};
