import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/m6-lab');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.M6_BASE || 'http://127.0.0.1:4178';
const LAB =
  '/?lab=senate-diorama&preset=day&debug=1&area=helsinki-kruununhaka';

async function waitReady(page) {
  await page.waitForSelector('#debug', { timeout: 30000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#dbg-fps');
    return el && /FPS:\s*\d+/.test(el.textContent || '');
  }, { timeout: 30000 });
  await page.waitForTimeout(2500);
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${LAB}`, { waitUntil: 'networkidle', timeout: 60000 });
  await waitReady(page);
  await page.locator('#dbg-cams button', { hasText: 'Day' }).click().catch(() => undefined);
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'lab-hero.png') });

  const cat = page.locator('#landmark-list button', { hasText: 'Helsinki Cathedral' });
  if (await cat.count()) {
    await cat.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'lab-cathedral.png') });
  }

  const sq = page.locator('#landmark-list button', { hasText: 'Senate Square' });
  if (await sq.count()) {
    await sq.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'lab-square.png') });
  }

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto(`${BASE}${LAB}`, { waitUntil: 'networkidle', timeout: 60000 });
  await waitReady(m);
  await m.screenshot({ path: path.join(OUT, 'lab-mobile-390x844.png') });
  await mobile.close();
  await browser.close();
  console.log('m6-lab screenshots ok');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
