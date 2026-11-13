import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/m4');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.M4_BASE || 'http://127.0.0.1:4175';

async function waitReady(page) {
  await page.waitForSelector('#debug', { timeout: 25000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#dbg-fps');
    return el && /FPS:\s*\d+/.test(el.textContent || '');
  }, { timeout: 25000 });
  await page.waitForTimeout(1000);
}

async function readDebug(page) {
  return page.evaluate(() => {
    const text = document.querySelector('#debug')?.innerText || '';
    const pins = document.querySelectorAll('#landmarks-layer button').length;
    const list = !!document.querySelector('#landmark-list');
    const card = document.querySelector('#landmark-card');
    return {
      text,
      pins,
      list,
      cardDisplay: card ? getComputedStyle(card).display : null,
    };
  });
}

async function clickCam(page, label) {
  await page.locator('#dbg-cams button', { hasText: label }).click();
  await page.waitForTimeout(700);
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { desktop: {}, mobile: {}, interactions: {}, errors: [] };

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => report.errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.errors.push(msg.text());
  });

  await page.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle', timeout: 60000 });
  await waitReady(page);

  await clickCam(page, 'Square');
  await page.screenshot({ path: path.join(OUT, 'desktop-square.png') });
  report.desktop.square = await readDebug(page);

  await clickCam(page, 'Cathedral');
  await page.screenshot({ path: path.join(OUT, 'desktop-cathedral.png') });
  report.desktop.cathedral = await readDebug(page);

  await clickCam(page, 'Harbour');
  await page.screenshot({ path: path.join(OUT, 'desktop-harbour.png') });
  report.desktop.harbour = await readDebug(page);

  // Landmark list jump + card
  const listBtn = page.locator('#landmark-list button', { hasText: 'Helsinki Cathedral' });
  await listBtn.click();
  await page.waitForTimeout(900);
  const cardVisible = await page.evaluate(
    () => getComputedStyle(document.querySelector('#landmark-card')).display !== 'none',
  );
  report.interactions.listOpensCard = cardVisible;
  await page.screenshot({ path: path.join(OUT, 'desktop-landmark-card.png') });

  // Tap building near center (should highlight)
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.48, box.y + box.height * 0.45);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(OUT, 'desktop-tap-highlight.png') });

  // Drag still works
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy + 80, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    report.interactions.dragOk = true;
  }
  await page.screenshot({ path: path.join(OUT, 'desktop-after-drag.png') });

  await context.close();

  // Mobile viewport
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mobile.newPage();
  mpage.on('pageerror', (e) => report.errors.push('mobile:' + String(e)));
  await mpage.goto(`${BASE}/?debug=1`, { waitUntil: 'networkidle', timeout: 60000 });
  await waitReady(mpage);
  await clickCam(mpage, 'Square');
  await mpage.screenshot({ path: path.join(OUT, 'mobile-390x844.png') });
  report.mobile = await readDebug(mpage);
  await mobile.close();

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'qa-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
