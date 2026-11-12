// M0 基本探測：連線 + Helsinki 3D WFS GetCapabilities + 小範圍 OSM 建築統計
// 不關閉 TLS 驗證；速率 <= 1 req/s；只做讀取
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

const UA = 'helsinki-8bit-m0-probe/0.1 (personal project; contact: chihimlau1386@gmail.com)';
const OUT = 'm0-output';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { probedAt: new Date().toISOString(), node: process.version, tests: [] };

async function timed(name, url, opts = {}, timeoutMs = 45000) {
  const t0 = Date.now();
  const rec = { name, url: url.slice(0, 160) };
  try {
    const res = await fetch(url, { ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) }, signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    Object.assign(rec, { ok: res.ok, status: res.status, contentType: res.headers.get('content-type'), bytes: text.length, ms: Date.now() - t0 });
    rec._text = text;
  } catch (e) {
    Object.assign(rec, { ok: false, error: `${e.name}: ${e.message}`, cause: e.cause && (e.cause.code || e.cause.message), ms: Date.now() - t0 });
  }
  return rec;
}
const keep = (rec) => { const { _text, ...rest } = rec; report.tests.push(rest); };

// 1. WFS GetCapabilities
const wfsUrl = 'https://kartta.hel.fi/3d/citydb-wfs/wfs?service=WFS&version=2.0.0&request=GetCapabilities';
const wfs = await timed('helsinki3d-wfs-getcapabilities', wfsUrl);
if (wfs._text) {
  const blocks = wfs._text.match(/<(?:\w+:)?FeatureType[\s>][\s\S]*?<\/(?:\w+:)?FeatureType>/g) || [];
  wfs.featureTypes = blocks.map((b) => (b.match(/<(?:\w+:)?Name[^>]*>([^<]+)</) || [])[1]).filter(Boolean);
  wfs.snippet = wfs._text.slice(0, 300);
  writeFileSync(`${OUT}/wfs-capabilities.xml`, wfs._text);
}
keep(wfs); await sleep(1000);

// 2. OSM Overpass：Senate Square 附近約 300m x 300m 的建築
const q = '[out:json][timeout:25];(way["building"](60.1685,24.9500,60.1715,24.9550););out tags;';
let osm;
for (let i = 1; i <= 3; i++) {
  osm = await timed('overpass-buildings-senate-square', 'https://overpass-api.de/api/interpreter', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q),
  });
  osm.attempt = i;
  if (osm.ok || (osm.status && osm.status < 500)) break;
  keep({ ...osm }); await sleep(30000);
}
if (osm._text && osm.ok) {
  try {
    const els = JSON.parse(osm._text).elements || [];
    osm.buildings = els.length;
    osm.withHeight = els.filter((e) => e.tags && e.tags.height).length;
    osm.withLevels = els.filter((e) => e.tags && e.tags['building:levels']).length;
    osm.withName = els.filter((e) => e.tags && e.tags.name).length;
  } catch (e) { osm.parseError = e.message; }
}
keep(osm);

report.summary = {
  helsinki3dWfsReachable: !!wfs.ok,
  wfsFeatureTypes: wfs.featureTypes || null,
  osmReachable: !!osm.ok,
  osmBuildings: osm.buildings ?? null,
  osmWithHeight: osm.withHeight ?? null,
  osmWithLevels: osm.withLevels ?? null,
};
writeFileSync(`${OUT}/m0-probe.json`, JSON.stringify(report, null, 2));

const md = [
  '# M0 probe（自動，基本連線）',
  '',
  `- 時間：${report.probedAt}（Node ${report.node}）`,
  `- Helsinki 3D WFS 可連：${report.summary.helsinki3dWfsReachable}`,
  `- WFS feature types：${(report.summary.wfsFeatureTypes || []).join(', ') || '無'}`,
  `- OSM Overpass 可連：${report.summary.osmReachable}`,
  `- OSM 建築數：${report.summary.osmBuildings}（有 height：${report.summary.osmWithHeight}，有 building:levels：${report.summary.osmWithLevels}）`,
  '',
  '這個腳本只做基本連線和統計，不包括 CityGML 樣本與欄位檢查（由 /m0-data-probe 完成）。',
].join('\n');
writeFileSync(`${OUT}/m0-probe.md`, md);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
console.log(md);
