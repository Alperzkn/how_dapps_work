import { expect, test } from '@playwright/test';
import { expectNoOverflow, LESSONS, openLesson, watchErrors } from './helpers';

test.use({ viewport: { width: 1440, height: 900 } });

test('level switch changes the text but not the step', async ({ page }) => {
  await openLesson(page, '/en/lesson/blockchain/3?level=beginner');
  const title = await page.locator('.prose h1').innerText();
  const before = await page.locator('.prose').innerText();
  await page.locator('.level-switch [data-level="expert"]').click();
  await expect(page).toHaveURL(/lesson\/blockchain\/3\?level=expert/);
  await expect(page.locator('.prose h1')).toHaveText(title);
  await expect(page.locator('.code-panel')).toBeVisible();
  expect(await page.locator('.prose').innerText()).not.toBe(before);
});

test('language switch keeps lesson, step and level, and the scene stays mounted', async ({ page }) => {
  await openLesson(page, '/en/lesson/blockchain/3?level=intermediate');
  await page.locator('canvas').evaluate((c) => ((c as HTMLCanvasElement).dataset.mark = 'same'));
  await page.locator('.topbar-wide .seg button', { hasText: 'TR' }).click();
  await expect(page).toHaveURL(/#\/tr\/lesson\/blockchain\/3\?level=intermediate/);
  await expect(page.locator('.prose h1')).toContainText('parmak izini');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await expect(page.locator('canvas')).toHaveAttribute('data-mark', 'same');
});

test('Turkish shows technical terms in English inside quotes', async ({ page }) => {
  await openLesson(page, '/tr/lesson/blockchain/3?level=beginner');
  const term = page.locator('.prose .term').first();
  await expect(term).toHaveText(/^"[A-Za-z0-9 -]+"$/);
  await page.goto('/#/en/lesson/blockchain/3?level=beginner');
  await expect(page.locator('.prose .term').first()).toHaveText(/^[A-Za-z0-9 -]+$/);
});

test('a term shows a tooltip on hover and a dialog on click, without leaving the step', async ({ page }) => {
  await openLesson(page, '/en/lesson/blockchain/3?level=intermediate');
  const url = page.url();
  const term = page.locator('.prose .term', { hasText: 'SHA-256' }).first();
  await term.hover();
  await expect(page.locator('.term-tip').first()).toContainText('256');
  await term.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'SHA-256' })).toBeVisible();
  // A related term opens on top, and Back returns.
  await dialog.locator('.chip-btn', { hasText: 'hash' }).click();
  await expect(dialog.getByRole('heading', { name: 'hash', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Back' }).click();
  await expect(dialog.getByRole('heading', { name: 'SHA-256' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(page.url()).toBe(url);
});

test('on a phone a term opens as a sheet with a More button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLesson(page, '/tr/lesson/blockchain/3?level=beginner');
  await page.locator('.prose .term').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.term-short')).toBeVisible();
  await expect(dialog.locator('.term-long')).toBeHidden();
  await dialog.locator('.term-more').click();
  await expect(dialog.locator('.term-long')).toBeVisible();
  await expectNoOverflow(page);
});

test('editing a block breaks the chain with real hashes', async ({ page }) => {
  await openLesson(page, '/en/lesson/blockchain/4?level=intermediate');
  const hash = page.locator('.ctl-stat strong');
  const before = await hash.innerText();
  await expect(page.locator('.scene-labels')).not.toContainText('link broken');
  await page.locator('.ctl input[type="text"]').fill('Ayşe → Ben: 500');
  await expect(hash).not.toHaveText(before);
  await expect(page.locator('.scene-labels')).toContainText('Block 2 · edited');
  await expect(page.locator('.scene-labels')).toContainText('Block 3 · link broken');
  await page.locator('.ctl .btn').click();
  await expect(hash).toHaveText(before);
  await expect(page.locator('.scene-labels')).not.toContainText('link broken');
});

test('moving to the next lesson keeps the 3D scene (old canvas teardown is not a failure)', async ({ page }) => {
  const errors = watchErrors(page);
  await openLesson(page, '/en/lesson/blockchain/99');
  await page.locator('.next-lesson').click();
  await expect(page).toHaveURL(/lesson\/transactions\/1/);
  await expect(page.locator('[data-scene-ready]')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-scene-fallback]')).toHaveCount(0);
  // Through the lesson menu as well.
  await page.locator('.topbar > .icon-btn').first().click();
  await page.locator('.drawer .lesson-card', { hasText: 'Uniswap v3' }).click();
  await expect(page.locator('[data-scene-ready]')).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.locator('[data-scene-fallback]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('dragging slides the view to off-screen parts, and reset brings it back', async ({ page }) => {
  await openLesson(page, '/en/lesson/transactions/1?level=intermediate');
  const label = page.locator('.scene-label', { hasText: "Alice's wallet" });
  await page.waitForTimeout(800);
  const start = (await label.boundingBox())!;
  const canvas = (await page.locator('.scene-canvas canvas').boundingBox())!;
  await page.mouse.move(canvas.x + 600, canvas.y + 400);
  await page.mouse.down();
  await page.mouse.move(canvas.x + 300, canvas.y + 400, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const moved = (await label.boundingBox())!;
  expect(start.x - moved.x).toBeGreaterThan(200);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await expect.poll(async () => Math.abs((await label.boundingBox())!.x - start.x), { timeout: 5000 }).toBeLessThan(3);
});

test('presentation mode is driven from the keyboard', async ({ page }) => {
  await openLesson(page, '/en/lesson/blockchain/2?level=beginner');
  // Assert on what is rendered (the caption counter), not just the URL, before the next key.
  const counter = page.locator('.caption small');
  await page.locator('.present-btn').click();
  await expect(page.locator('.caption')).toBeVisible();
  await expect(page.locator('.topbar')).toBeHidden();
  await expect(page.locator('.lesson-text')).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(counter).toContainText('3/6');
  await page.keyboard.press('Space');
  await expect(counter).toContainText('4/6');
  await page.keyboard.press('PageUp');
  await expect(counter).toContainText('3/6');
  await expect(page).toHaveURL(/blockchain\/3/);
  await page.keyboard.press('l');
  await expect(counter).toContainText('Intermediate');
  await expect(page).toHaveURL(/level=intermediate/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.caption')).toBeHidden();
  await expect(page.locator('.topbar')).toBeVisible();
});

test('the Uniswap v2 slider changes the numbers', async ({ page }) => {
  await openLesson(page, '/en/lesson/uniswap-v2/4?level=intermediate');
  const controls = page.locator('.scene-controls');
  const slider = controls.locator('input[type="range"]').first();
  await expect(slider).toBeVisible();
  const before = await controls.innerText();
  await slider.focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  const after = await controls.innerText();
  expect(after).not.toBe(before);
  expect(after).not.toMatch(/NaN|Infinity/);
  await slider.press('End');
  expect(await controls.innerText()).not.toMatch(/NaN|Infinity/);
  await slider.press('Home');
  expect(await controls.innerText()).not.toMatch(/NaN|Infinity/);
});

test('the Uniswap v3 range sliders stay ordered and finite at the extremes', async ({ page }) => {
  await openLesson(page, '/en/lesson/uniswap-v3/2?level=expert');
  const controls = page.locator('.scene-controls');
  const sliders = controls.locator('input[type="range"]');
  expect(await sliders.count()).toBeGreaterThanOrEqual(2);
  const before = await controls.innerText();
  await sliders.nth(0).press('End');
  await sliders.nth(1).press('Home');
  const after = await controls.innerText();
  expect(after).not.toBe(before);
  expect(after).not.toMatch(/NaN|Infinity/);
});

test('mining finds a real nonce', async ({ page }) => {
  await openLesson(page, '/en/lesson/pow/2?level=intermediate');
  const controls = page.locator('.scene-controls');
  await expect(controls.locator('input[type="range"]')).toBeVisible();
  await controls.locator('input[type="range"]').press('Home');
  await controls.getByRole('button').first().click();
  await expect(controls).toContainText(/\b0[0-9a-f]{5,}/, { timeout: 20_000 });
  expect(await controls.innerText()).not.toMatch(/NaN|Infinity/);
});

test('bad deep links degrade gracefully', async ({ page }) => {
  const errors = watchErrors(page);
  // Out-of-range step and unknown level: last step, stored level.
  await openLesson(page, '/tr/lesson/uniswap-v3/99?level=guru');
  await expect(page.locator('.step-next')).toBeDisabled();
  await expect(page.locator('.level-switch [aria-pressed="true"]')).toHaveAttribute('data-level', 'beginner');
  // Unknown lesson and unknown term.
  await page.goto('/#/en/lesson/nope/1');
  await expect(page.locator('.not-found')).toBeVisible();
  await page.goto('/#/en/glossary/nope');
  await expect(page.locator('.not-found')).toBeVisible();
  // Unknown language falls back to the stored one.
  await page.goto('/#/xx/lesson/pow/1');
  await expect(page).toHaveURL(/#\/(en|tr)$/);
  await expect(page.locator('.home')).toBeVisible();
  expect(errors).toEqual([]);
});

test('glossary page searches, filters and deep-links a term', async ({ page }) => {
  await page.goto('/#/en/glossary');
  const cards = page.locator('.term-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(100);
  await page.locator('.search').fill('impermanent');
  await expect(cards).toHaveCount(1);
  await page.locator('.search').fill('zzzz');
  await expect(page.locator('.muted')).toBeVisible();
  await page.goto('/#/tr/glossary/liquidity-pool');
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'liquidity pool' })).toBeVisible();
});

test('home lists every lesson, tracks progress and loads no 3D code', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  await page.goto('/#/en');
  await expect(page.locator('.lesson-card')).toHaveCount(LESSONS.length);
  await expect(page.locator('.map-block')).toHaveCount(LESSONS.length);
  await expect(page.locator('.scope-note')).toContainText('financial');
  await page.waitForLoadState('networkidle');
  expect(scripts.filter((u) => /LessonPage|Scene/.test(u))).toEqual([]);

  await openLesson(page, '/en/lesson/blockchain/99');
  await page.goto('/#/en');
  await expect(page.locator('.lesson-num[data-done]')).toHaveCount(1);
  await expect(page.locator('.hero-actions .btn-primary')).toContainText('Continue');
  await page.reload();
  await expect(page.locator('.lesson-num[data-done]')).toHaveCount(1);
});

test('phone in landscape keeps scene, text and controls reachable', async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 360 });
  await openLesson(page, '/en/lesson/blockchain/3?level=intermediate');
  const scene = await page.locator('.lesson-scene').boundingBox();
  const text = await page.locator('.lesson-text').boundingBox();
  const next = await page.locator('.step-next').boundingBox();
  expect(scene!.height).toBeGreaterThan(180);
  expect(scene!.width).toBeGreaterThan(300);
  expect(text!.width).toBeGreaterThan(250);
  expect(next!.y + next!.height).toBeLessThanOrEqual(360);
  await expectNoOverflow(page);
});

test('small phone has no overflow and thumb-sized controls', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openLesson(page, '/tr/lesson/uniswap-v2/4?level=expert');
  await expectNoOverflow(page);
  for (const sel of ['.step-next', '.step-prev', '.topbar .icon-btn']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(Math.min(box!.width, box!.height), sel).toBeGreaterThanOrEqual(44);
  }
  // Swiping the text moves to the next step.
  const text = page.locator('.lesson-text');
  const b = (await text.boundingBox())!;
  await text.dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: b.x + 300, clientY: b.y + 80 }] });
  await text.dispatchEvent('touchend', { changedTouches: [{ identifier: 0, clientX: b.x + 60, clientY: b.y + 84 }] });
  await expect(page).toHaveURL(/uniswap-v2\/5/);
});

test('without WebGL the lesson still works with a still image', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  const errors = watchErrors(page);
  await page.goto('/#/en/lesson/pow/1?level=beginner');
  await expect(page.locator('[data-scene-fallback] img')).toBeVisible();
  expect(await page.locator('[data-scene-fallback] img').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(100);
  await expect(page.locator('.prose h1')).not.toBeEmpty();
  await page.locator('.step-next').click();
  await expect(page).toHaveURL(/pow\/2/);
  await page.locator('.prose .term').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('theme toggle switches and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.topbar-wide .icon-btn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
