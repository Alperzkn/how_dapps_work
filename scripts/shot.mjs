// Dev helper: screenshot a route. usage: node scripts/shot.mjs <hash-route> <out.png> [width] [height] [theme]
import { chromium } from '@playwright/test';
const [route, out, w = '1440', h = '900', theme = 'light'] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:5273';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: theme });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/#${route}`);
await page.waitForSelector('[data-scene-ready], [data-scene-fallback], .home, .glossary, .not-found', { timeout: 20000 }).catch(() => errors.push('timeout waiting for page'));
if (process.env.FILL) {
  const [sel, val] = process.env.FILL.split('=');
  await page.fill(sel, val);
}
if (process.env.CLICK) for (const sel of process.env.CLICK.split(';;')) await page.click(sel);
await page.waitForTimeout(+(process.env.WAIT ?? 2500));
await page.screenshot({ path: out });
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
else console.log('ok', out);
await browser.close();
