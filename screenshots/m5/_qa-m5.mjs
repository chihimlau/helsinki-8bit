import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/m5');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.M5_BASE || 'http://127.0.0.1:4175';

async function waitReady(page) {
  await page.waitForSelector('#debug', { timeout: 25000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('#dbg-fps');
    return el && /FPS:\s*\d+/.test(el.textContent || '');
  }, { timeout: 25000 });
  await page.waitForTimeout(1200);
}

async function shotArea(browser, areaId, name) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/?debug=1&area=${areaId}`, { waitUntil: 'networkidle', timeout: 60000 });
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const debug = await page.evaluate(() => document.querySelector('#debug')?.innerText || '');
  const pins = await page.evaluate(() => document.querySelectorAll('#landmarks-layer button').length);
  const switcher = await page.evaluate(() => !!document.querySelector('#area-switcher'));
  await context.close();
  return { areaId, debug, pins, switcher, errors };
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = {
    kruununhaka: await shotArea(browser, 'helsinki-kruununhaka', 'desktop-kruununhaka'),
    kluuvi: await shotArea(browser, 'helsinki-kluuvi', 'desktop-kluuvi'),
  };

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mobile.newPage();
  await mpage.goto(`${BASE}/?debug=1&area=helsinki-kluuvi`, {
    waitUntil: 'networkidle',
    timeout: 60000,
  });
  await waitReady(mpage);
  await mpage.screenshot({ path: path.join(OUT, 'mobile-kluuvi-390x844.png') });
  report.mobileKluuvi = {
    debug: await mpage.evaluate(() => document.querySelector('#debug')?.innerText || ''),
    pins: await mpage.evaluate(() => document.querySelectorAll('#landmarks-layer button').length),
  };
  await mobile.close();
  await browser.close();

  fs.writeFileSync(path.join(OUT, 'qa-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
