import type { AreaManifest, LoadedArea, WorldBuilding, WorldLine, WorldPoly } from './types';

export type ChunkJson = {
  buildings: WorldBuilding[];
  roads: WorldLine[];
  parks: WorldPoly[];
  water: WorldPoly[];
};

export type ManifestLoad = {
  manifest: AreaManifest;
  bytesLoaded: number;
  dataBaseUrl: string;
};

/** Load only manifest — chunks stream later. */
export async function loadManifest(dataBaseUrl: string): Promise<ManifestLoad> {
  const manifestRes = await fetch(`${dataBaseUrl}/manifest.json`);
  if (!manifestRes.ok) throw new Error(`manifest HTTP ${manifestRes.status}`);
  const manifestText = await manifestRes.text();
  const manifest = JSON.parse(manifestText) as AreaManifest;
  const bytesLoaded = new TextEncoder().encode(manifestText).length;
  return { manifest, bytesLoaded, dataBaseUrl };
}

async function gunzipToText(buf: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream unsupported — use a modern browser');
  }
  const stream = new Response(buf).body!.pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

export async function fetchChunk(
  dataBaseUrl: string,
  file: string,
): Promise<{ chunk: ChunkJson; bytes: number }> {
  const res = await fetch(`${dataBaseUrl}/${file}`);
  if (!res.ok) throw new Error(`chunk ${file} HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = buf.byteLength;
  const text = file.endsWith('.gz') ? await gunzipToText(buf) : new TextDecoder().decode(buf);
  return {
    chunk: JSON.parse(text) as ChunkJson,
    bytes,
  };
}

/** Full load (tests / tools). Prefer streaming via chunkManager in the app. */
export async function loadAreaData(dataBaseUrl: string): Promise<LoadedArea> {
  const { manifest, bytesLoaded: base } = await loadManifest(dataBaseUrl);
  let bytesLoaded = base;
  const buildings: WorldBuilding[] = [];
  const roads: WorldLine[] = [];
  const parks: WorldPoly[] = [];
  const water: WorldPoly[] = [];

  for (const c of manifest.chunks) {
    const { chunk, bytes } = await fetchChunk(dataBaseUrl, c.file);
    bytesLoaded += bytes;
    buildings.push(...(chunk.buildings ?? []));
    roads.push(...(chunk.roads ?? []));
    parks.push(...(chunk.parks ?? []));
    water.push(...(chunk.water ?? []));
  }

  return { manifest, buildings, roads, parks, water, bytesLoaded };
}
