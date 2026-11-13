import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wgs84ToGk25 } from './coords';
import { fetchAvoindataBuildings, parseAvoindataGeoJson } from './sources/helsinkiAvoindata';
import { fetchOsmLayers, parseOsmPayload } from './sources/osm';
import { mergeAreaData } from './merge';
import { writeChunkedArea } from './build/chunks';
import { buildHarbourWaterFill, waterAreaApprox } from './harbourWater';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const doFetch = process.argv.includes('--fetch');
const areaId = process.argv.find((a) => a.startsWith('--area='))?.slice(7) ?? 'helsinki-kruununhaka';

async function main() {
  const areaPath = join(root, 'areas', areaId, 'area.config.json');
  const area = JSON.parse(readFileSync(areaPath, 'utf8')) as {
    id: string;
    city: string;
    bbox: { south: number; north: number; west: number; east: number };
    chunkSizeMeters: number;
  };
  const cityPath = join(root, 'cities', area.city, 'city.config.json');
  const city = JSON.parse(readFileSync(cityPath, 'utf8')) as {
    id: string;
    origin: { x: number | null; y: number | null; note?: string };
    attribution: string[];
  };

  let origin: { x: number; y: number };
  if (city.origin.x == null || city.origin.y == null) {
    const p = wgs84ToGk25(24.9525, 60.1699);
    origin = { x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 };
    city.origin = {
      x: origin.x,
      y: origin.y,
      note: 'Locked to Senate Square (lon 24.9525, lat 60.1699) EPSG:3879. Do not change.',
    };
    writeFileSync(cityPath, JSON.stringify(city, null, 2) + '\n');
    console.log('Locked city origin', origin);
  } else {
    origin = { x: city.origin.x, y: city.origin.y };
  }

  const rawDir = join(root, 'areas', areaId, 'raw', 'pipeline');
  const outDir = join(root, 'areas', areaId, 'data');
  mkdirSync(rawDir, { recursive: true });

  let avoBuildings;
  let osm;

  if (doFetch) {
    console.log('Fetching avoindata + OSM…');
    avoBuildings = await fetchAvoindataBuildings(areaId, area.bbox, origin, rawDir);
    osm = await fetchOsmLayers(areaId, area.bbox, origin, rawDir);
  } else {
    const avoCache = join(rawDir, 'avoindata-buildings.json');
    const osmCache = join(rawDir, 'osm-layers.json');
    if (!existsSync(avoCache) || !existsSync(osmCache)) {
      throw new Error(
        'Missing raw cache. Run with --fetch on GitHub Actions / Cloud Agent (not company LAN).',
      );
    }
    avoBuildings = parseAvoindataGeoJson(JSON.parse(readFileSync(avoCache, 'utf8')), origin);
    osm = parseOsmPayload(JSON.parse(readFileSync(osmCache, 'utf8')), origin);
  }

  let water = [...osm.water];
  // South Harbour rarely comes through as large OSM water polygons; ensure a sea fill.
  if (waterAreaApprox(water) < 50_000) {
    water = [...water, buildHarbourWaterFill(area.bbox, origin)];
  }

  const merged = mergeAreaData({
    avoBuildings,
    osmBuildings: osm.buildings,
    roads: osm.roads,
    parks: osm.parks,
    water,
  });

  const manifest = writeChunkedArea({
    outDir,
    areaId: area.id,
    cityId: city.id,
    origin,
    chunkSizeMeters: area.chunkSizeMeters,
    attribution: city.attribution,
    data: merged,
  });

  console.log(JSON.stringify({ areaId, stats: manifest.stats, chunks: manifest.chunks.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
