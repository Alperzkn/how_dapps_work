// Renders every lesson step to public/fallback/<lesson>/<step>.jpg, shown when WebGL is unavailable.
// Needs a running server: BASE=http://localhost:5273 npm run capture
import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.BASE ?? 'http://localhost:5273';
const lessonsDir = 'src/content/lessons';

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 760 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' });
await page.addInitScript(() => localStorage.clear());

let count = 0;
for (const id of readdirSync(lessonsDir)) {
  const meta = readFileSync(join(lessonsDir, id, 'meta.ts'), 'utf8');
  const steps = [...(meta.match(/steps:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  mkdirSync(join('public/fallback', id), { recursive: true });
  for (const [i, step] of steps.entries()) {
    await page.goto(`${base}/#/en/lesson/${id}/${i + 1}?level=intermediate`);
    await page.waitForSelector('[data-scene-ready]', { timeout: 30_000 });
    await page.addStyleTag({ content: '.scene-tools, .scene-controls, .scene-hint, .celebrate, .lesson-progress { display: none !important; }' });
    await page.waitForTimeout(1200);
    await page.locator('.lesson-scene').screenshot({ path: join('public/fallback', id, `${step}.jpg`), type: 'jpeg', quality: 78 });
    count++;
  }
}
console.log(`captured ${count} steps`);
await browser.close();
