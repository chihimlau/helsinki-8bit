import type { AreaManifest, LoadedArea, WorldBuilding, WorldLine, WorldPoly } from './types';

type ChunkJson = {
  buildings: WorldBuilding[];
  roads: WorldLine[];
  parks: WorldPoly[];
  water: WorldPoly[];
};

/** `dataBaseUrl` is a path like `/areas/<id>/data` — no city names inside this module. */
export async function loadAreaData(dataBaseUrl: string): Promise<LoadedArea> {
  const manifestRes = await fetch(`${dataBaseUrl}/manifest.json`);
  if (!manifestRes.ok) throw new Error(`manifest HTTP ${manifestRes.status}`);
  const manifestText = await manifestRes.text();
  const manifest = JSON.parse(manifestText) as AreaManifest;
  let bytesLoaded = new TextEncoder().encode(manifestText).length;

  const buildings: WorldBuilding[] = [];
  const roads: WorldLine[] = [];
  const parks: WorldPoly[] = [];
  const water: WorldPoly[] = [];

  for (const c of manifest.chunks) {
    const res = await fetch(`${dataBaseUrl}/${c.file}`);
    if (!res.ok) throw new Error(`chunk ${c.file} HTTP ${res.status}`);
    const text = await res.text();
    bytesLoaded += new TextEncoder().encode(text).length;
    const chunk = JSON.parse(text) as ChunkJson;
    buildings.push(...(chunk.buildings ?? []));
    roads.push(...(chunk.roads ?? []));
    parks.push(...(chunk.parks ?? []));
    water.push(...(chunk.water ?? []));
  }

  return { manifest, buildings, roads, parks, water, bytesLoaded };
}
