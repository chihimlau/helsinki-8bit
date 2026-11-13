/** Convert area data chunks from *.json to *.json.gz and update manifest. */
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dataDir = process.argv[2] ?? 'areas/helsinki-kruununhaka/data';
const manifestPath = join(dataDir, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

let jsonBytes = 0;
let gzipBytes = 0;

for (const c of manifest.chunks) {
  const plain = c.file.replace(/\.gz$/, '');
  const jsonPath = join(dataDir, plain);
  if (!existsSync(jsonPath)) throw new Error(`missing ${jsonPath}`);

  const buf = readFileSync(jsonPath);
  const gzFile = plain.endsWith('.json') ? `${plain}.gz` : `${plain}.json.gz`;
  const gzPath = join(dataDir, gzFile);
  const gz = gzipSync(buf);
  writeFileSync(gzPath, gz);

  jsonBytes += buf.length;
  gzipBytes += gz.length;
  c.file = gzFile;
}

manifest.schemaVersion = Math.max(Number(manifest.schemaVersion) || 1, 2);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

for (const name of readdirSync(dataDir)) {
  if (/^chunk-.+\.json$/.test(name)) unlinkSync(join(dataDir, name));
}

console.log(
  JSON.stringify(
    {
      dataDir,
      chunks: manifest.chunks.length,
      jsonBytes,
      gzipBytes,
      ratio: +(gzipBytes / Math.max(jsonBytes, 1)).toFixed(3),
      manifestBytes: statSync(manifestPath).size,
      totalOnDisk: gzipBytes + statSync(manifestPath).size,
    },
    null,
    2,
  ),
);
