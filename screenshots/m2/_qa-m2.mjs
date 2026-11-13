import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/m2');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://127.0.0.1:4173';

async function waitReady(page) {
  await page.waitForSelector('#debug', { timeout: 20000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#dbg-fps');
    return el && /FPS:\s*\d+/.test(el.textContent || '');
  }, { timeout: 20000 });
  await page.waitForTimeout(800);
}

async function readDebug(page) {
  return page.evaluate(() => {
    const text = document.querySelector('#debug')?.innerText || '';
    const canvas = document.querySelector('canvas');
    return {
      text,
      canvasW: canvas?.width ?? null,
      canvasH: canvas?.height ?? null,
      cssW: canvas?.clientWidth ?? null,
      cssH: canvas?.clientHeight ?? null,
    };
  });
}

async function clickCam(page, label) {
  await page.locator('#dbg-cams button', { hasText: label }).click();
  await page.waitForTimeout(600);
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function dragTest(page) {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('no canvas bbox');

  const before = await page.screenshot({ path: path.join(OUT, '_drag-before.png') });
  const beforeBuf = fs.readFileSync(path.join(OUT, '_drag-before.png'));

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 140, cy + 90, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(700);

  await page.screenshot({ path: path.join(OUT, '_drag-after.png') });
  const afterBuf = fs.readFileSync(path.join(OUT, '_drag-after.png'));

  // crude pixel diff: count differing bytes
  let diffs = 0;
  const n = Math.min(beforeBuf.length, afterBuf.length);
  for (let i = 0; i < n; i += 17) {
    if (beforeBuf[i] !== afterBuf[i]) diffs += 1;
  }
  return { diffs, beforeBytes: beforeBuf.length, afterBytes: afterBuf.length, moved: diffs > 50 };
}

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const report = { day: null, dusk: null, drag: null, console: [], errors: [] };

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('console', (msg) => report.console.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => report.errors.push(String(err)));

  // DAY
  await page.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await waitReady(page);
  report.day = await readDebug(page);

  await clickCam(page, 'Square');
  await shot(page, 'day-square.png');
  await clickCam(page, 'Cathedral');
  await shot(page, 'day-cathedral.png');
  await clickCam(page, 'Harbour');
  await shot(page, 'day-harbour.png');

  // Drag from Square view
  await clickCam(page, 'Square');
  report.drag = await dragTest(page);

  // DUSK
  await page.goto(`${BASE}/?debug=1&preset=dusk`, { waitUntil: 'networkidle', timeout: 30000 });
  await waitReady(page);
  report.dusk = await readDebug(page);

  await clickCam(page, 'Square');
  await shot(page, 'dusk-square.png');
  await clickCam(page, 'Cathedral');
  await shot(page, 'dusk-cathedral.png');
  await clickCam(page, 'Harbour');
  await shot(page, 'dusk-harbour.png');

  await context.close();

  // Mobile day
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mobile.newPage();
  mpage.on('pageerror', (err) => report.errors.push(`mobile: ${err}`));
  await mpage.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle', timeout: 30000 });
  await waitReady(mpage);
  await mpage.locator('#dbg-cams button', { hasText: 'Square' }).click();
  await mpage.waitForTimeout(600);
  await mpage.screenshot({ path: path.join(OUT, 'mobile-day.png') });
  report.mobile = await readDebug(mpage);
  await mobile.close();

  await browser.close();

  fs.writeFileSync(path.join(OUT, '_qa-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

run().catch((e) => {
  console.error('QA_FAILED', e);
  process.exit(1);
});
