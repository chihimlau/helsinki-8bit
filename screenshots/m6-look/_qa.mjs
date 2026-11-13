import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/m6-look');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:4176';

async function waitReady(page) {
  await page.waitForSelector('#debug', { timeout: 25000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#dbg-fps');
    return el && /FPS:\s*\d+/.test(el.textContent || '');
  }, { timeout: 25000 });
  await page.waitForTimeout(1500);
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await page.goto(`${BASE}/?debug=1&preset=day&area=helsinki-kruununhaka`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await waitReady(page);
  await page.locator('#dbg-cams button', { hasText: 'Day' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'hero-cathedral-square.png') });

  const catBtn = page.locator('#dbg-cams button').filter({ hasText: /Cathedral|Helsinki/i }).first();
  if (await catBtn.count()) {
    await catBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(OUT, 'cathedral-close.png') });

  const harbour = page.locator('#landmark-list button', { hasText: 'Market Square' });
  if (await harbour.count()) {
    await harbour.click();
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: path.join(OUT, 'harbour-market.png') });

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
  await m.locator('#dbg-cams button', { hasText: 'Day' }).click().catch(() => undefined);
  await m.waitForTimeout(800);
  await m.screenshot({ path: path.join(OUT, 'mobile-390x844.png') });
  await mobile.close();
  await browser.close();
  console.log('ok');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
