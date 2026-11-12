// M0 探測 v2：Helsinki 3D WFS 404 之後，改測其他可用來源
// 原則：不關閉 TLS 驗證；速率 <= 1 req/s；只讀取；不大量下載
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { wgs84ToGk25 } from './lib-gk25.mjs';

const UA = 'helsinki-8bit-m0-probe/0.2 (personal project; contact: chihimlau1386@gmail.com)';
const OUT = 'm0-output';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { probedAt: new Date().toISOString(), node: process.version, tests: [], findings: {} };

async function timed(name, url, opts = {}, timeoutMs = 45000) {
  const t0 = Date.now();
  const rec = { name, url: url.slice(0, 200) };
  try {
    const res = await fetch(url, { redirect: 'follow', ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) }, signal: AbortSignal.timeout(timeoutMs) });
    const text = opts.method === 'HEAD' ? '' : await res.text();
    Object.assign(rec, { ok: res.ok, status: res.status, contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'), bytes: text.length, ms: Date.now() - t0, finalUrl: res.url !== url ? res.url : undefined });
    rec._text = text;
  } catch (e) {
    Object.assign(rec, { ok: false, error: `${e.name}: ${e.message}`, cause: e.cause && (e.cause.code || e.cause.message), ms: Date.now() - t0 });
  }
  return rec;
}
const keep = (rec) => { const { _text, ...rest } = rec; report.tests.push(rest); return rec; };
const save = (file, text, max = 300000) => text && writeFileSync(`${OUT}/${file}`, text.slice(0, max));

// ---------- 1. 重測 Helsinki 3D CityGML WFS（確認是否暫時性） ----------
const wfs3d = 'https://kartta.hel.fi/3d/citydb-wfs/wfs?service=WFS&version=2.0.0&request=GetCapabilities';
let r = keep(await timed('helsinki3d-wfs-getcapabilities-retry', wfs3d));
report.findings.helsinki3dWfs = { status: r.status ?? null, error: r.error ?? null, ok: !!r.ok };
if (r._text) save('helsinki3d-wfs-response.txt', r._text, 5000);
await sleep(1000);

// ---------- 2. kartta.hel.fi/3d/ 下載頁是否仍停用 ----------
r = keep(await timed('helsinki3d-download-page', 'https://kartta.hel.fi/3d/'));
if (r._text) {
  report.findings.helsinki3dDownloadPage = {
    status: r.status,
    mentionsDisabled: /poissa k[aä]yt[oö]st[aä]|ei k[aä]yt[oö]ss[aä]|temporarily|unavailable/i.test(r._text),
  };
}
await sleep(1000);

// ---------- 3. 赫爾辛基開放資料 WFS（建築 footprint + 登記屬性） ----------
const AVO = 'https://kartta.hel.fi/ws/geoserver/avoindata/wfs';
r = keep(await timed('avoindata-wfs-getcapabilities', `${AVO}?service=WFS&version=2.0.0&request=GetCapabilities`));
if (r._text) {
  const names = [...r._text.matchAll(/<(?:\w+:)?Name>([^<]+)<\/(?:\w+:)?Name>/g)].map((m) => m[1]);
  report.findings.avoindataWfs = {
    ok: !!r.ok, status: r.status, totalLayers: names.length,
    buildingLayers: names.filter((n) => /rakennu|3d|korkeus|kerros/i.test(n)),
  };
  save('avoindata-wfs-capabilities.xml', r._text, 600000);
}
await sleep(1000);

const layers = ['avoindata:Rakennukset_alue', 'avoindata:Rakennukset_alue_rekisteritiedot'];
const sw = wgs84ToGk25(24.9500, 60.1685), ne = wgs84ToGk25(24.9550, 60.1715);
const [x1, y1, x2, y2] = [sw.x, sw.y, ne.x, ne.y].map((v) => Math.round(v));
// EPSG:3879 官方軸序是 北,東（y,x）；各種寫法都試，記錄哪一種有效
const variants = [
  { id: 'A_xy_EPSG3879', bbox: `${x1},${y1},${x2},${y2},EPSG:3879` },
  { id: 'B_yx_urn3879', bbox: `${y1},${x1},${y2},${x2},urn:ogc:def:crs:EPSG::3879` },
  { id: 'C_yx_EPSG3879', bbox: `${y1},${x1},${y2},${x2},EPSG:3879` },
  { id: 'D_lonlat_EPSG4326', bbox: `24.9500,60.1685,24.9550,60.1715,EPSG:4326` },
];
report.findings.bboxGk25 = { x1, y1, x2, y2 };
report.findings.avoindataBuildings = {};
for (const layer of layers) {
  const info = { workingVariant: null, tried: [] };
  report.findings.avoindataBuildings[layer] = info;

  // 屬性欄位
  const d = keep(await timed(`describe-${layer}`, `${AVO}?service=WFS&version=2.0.0&request=DescribeFeatureType&typeNames=${layer}&outputFormat=application/json`));
  if (d._text && d.ok) {
    try { info.attributes = JSON.parse(d._text).featureTypes[0].properties.map((p) => `${p.name}:${p.localType || p.type}`); } catch (e) { info.describeParseError = e.message; }
  }
  await sleep(1000);

  for (const v of variants) {
    const h = keep(await timed(`hits-${layer}-${v.id}`, `${AVO}?service=WFS&version=2.0.0&request=GetFeature&typeNames=${layer}&resultType=hits&bbox=${v.bbox}`));
    const m = h._text && h._text.match(/numberMatched="(\d+)"/);
    const n = m ? Number(m[1]) : null;
    info.tried.push({ variant: v.id, status: h.status ?? h.error, numberMatched: n });
    await sleep(1000);
    if (n && n > 0) {
      info.workingVariant = v.id;
      const g = keep(await timed(`features-${layer}`, `${AVO}?service=WFS&version=2.0.0&request=GetFeature&typeNames=${layer}&outputFormat=application/json&srsName=EPSG:3879&count=1000&bbox=${v.bbox}`));
      if (g._text && g.ok) {
        try {
          const feats = JSON.parse(g._text).features || [];
          info.features = feats.length;
          const keys = feats[0] ? Object.keys(feats[0].properties || {}) : [];
          info.propertyKeys = keys;
          info.heightLikeKeys = keys.filter((k) => /korkeus|height|kerros|floor|kerrosluku|kerrosala/i.test(k));
          info.sampleProperties = feats[0] ? feats[0].properties : null;
          // 各欄位有值的比例（看哪些欄位可用）
          info.nonEmptyRatio = Object.fromEntries(keys.map((k) => [k, +(feats.filter((f) => f.properties[k] !== null && f.properties[k] !== '' && f.properties[k] !== undefined).length / (feats.length || 1)).toFixed(2)]));
          save(`features-${layer.split(':')[1]}.json`, g._text, 400000);
        } catch (e) { info.parseError = e.message; }
      }
      await sleep(1000);
      break;
    }
  }
}

// ---------- 4. LoD1 3D 建築檔案（KMZ / SKP）：只看來源與大小，不下載 ----------
report.findings.lod1Files = [];
for (const id of ['helsingin-3d-rakennukset', 'helsingin-pintamalli']) {
  const p = keep(await timed(`ckan-${id}`, `https://avoindata.suomi.fi/data/api/3/action/package_show?id=${id}`));
  await sleep(1000);
  if (!p._text || !p.ok) continue;
  let resources = [];
  try { resources = JSON.parse(p._text).result.resources || []; } catch { /* ignore */ }
  for (const res of resources.slice(0, 6)) {
    const url = res.url || res.download_url;
    if (!url) continue;
    const h = keep(await timed(`head-${id}-${res.format || 'file'}`, url, { method: 'HEAD' }, 30000));
    report.findings.lod1Files.push({
      dataset: id, format: res.format, declaredSize: res.size ?? null, url,
      headStatus: h.status ?? h.error, contentLength: h.contentLength ?? null, contentType: h.contentType ?? null,
    });
    await sleep(1000);
  }
}

// ---------- 5. OSM（含 relation 建築） ----------
const q = '[out:json][timeout:25];(way["building"](60.1685,24.9500,60.1715,24.9550);relation["building"](60.1685,24.9500,60.1715,24.9550););out tags;';
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
    const tag = (e, k) => e.tags && e.tags[k];
    Object.assign(osm, { buildings: els.length, ways: els.filter((e) => e.type === 'way').length, relations: els.filter((e) => e.type === 'relation').length,
      withHeight: els.filter((e) => tag(e, 'height')).length, withLevels: els.filter((e) => tag(e, 'building:levels')).length, withName: els.filter((e) => tag(e, 'name')).length });
  } catch (e) { osm.parseError = e.message; }
}
keep(osm);
report.findings.osm = { ok: !!osm.ok, buildings: osm.buildings ?? null, ways: osm.ways ?? null, relations: osm.relations ?? null, withHeight: osm.withHeight ?? null, withLevels: osm.withLevels ?? null };

// ---------- 輸出 ----------
writeFileSync(`${OUT}/m0-probe.json`, JSON.stringify(report, null, 2));
const f = report.findings;
const lines = [
  '# M0 probe v2（自動）', '',
  `- 時間：${report.probedAt}（Node ${report.node}）`,
  `- Helsinki 3D CityGML WFS：${f.helsinki3dWfs.ok ? '可用' : `不可用（status ${f.helsinki3dWfs.status ?? f.helsinki3dWfs.error}）`}`,
  `- kartta.hel.fi/3d 頁面顯示停用：${f.helsinki3dDownloadPage ? f.helsinki3dDownloadPage.mentionsDisabled : '未知'}`,
  `- 開放資料 WFS：${f.avoindataWfs ? (f.avoindataWfs.ok ? `可用，${f.avoindataWfs.totalLayers} 個圖層` : '不可用') : '無回應'}`,
];
for (const [layer, i] of Object.entries(f.avoindataBuildings)) {
  lines.push(`- ${layer}：有效 bbox 寫法 = ${i.workingVariant ?? '無'}；範圍內 ${i.features ?? 0} 個物件；高度/樓層類欄位 = ${(i.heightLikeKeys || []).join(', ') || '無'}`);
  if (i.attributes) lines.push(`  - 欄位：${i.attributes.join(', ')}`);
}
lines.push(`- LoD1 檔案：${f.lod1Files.length ? f.lod1Files.map((x) => `${x.format}(${x.headStatus}, ${x.contentLength ?? x.declaredSize ?? '?'} bytes)`).join('；') : '無資料'}`);
lines.push(`- OSM：${f.osm.ok ? `${f.osm.buildings} 個（way ${f.osm.ways} / relation ${f.osm.relations}；有 height ${f.osm.withHeight}；有 levels ${f.osm.withLevels}）` : '不可用'}`);
const md = lines.join('\n');
writeFileSync(`${OUT}/m0-probe.md`, md);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
console.log(md);
