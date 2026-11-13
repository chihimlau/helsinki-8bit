import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/m6-look');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:4177';

async function waitReady(page) {
  await page.waitForSelector('#debug', { timeout: 25000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#dbg-fps');
    return el && /FPS:\s*\d+/.test(el.textContent || '');
  }, { timeout: 25000 });
  await page.waitForTimeout(2000);
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?debug=1&preset=day&area=helsinki-kruununhaka`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await waitReady(page);
  await page.locator('#dbg-cams button', { hasText: 'Day' }).click().catch(() => undefined);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '2a-square-cathedral.png') });

  const cat = page.locator('#landmark-list button', { hasText: 'Helsinki Cathedral' });
  await cat.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '2a-cathedral.png') });

  const sq = page.locator('#landmark-list button', { hasText: 'Senate Square' });
  await sq.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, '2a-senate-square.png') });

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto(`${BASE}/?debug=1&preset=day&area=helsinki-kruununhaka`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await waitReady(m);
  await m.screenshot({ path: path.join(OUT, '2a-mobile-390x844.png') });
  await mobile.close();
  await browser.close();
  console.log('2a ok');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
