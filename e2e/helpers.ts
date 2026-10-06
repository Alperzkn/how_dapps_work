import { expect, type Page } from '@playwright/test';

export const LESSONS = ['blockchain', 'transactions', 'network', 'pow', 'pos', 'btc-vs-eth', 'other-l1s', 'layer2', 'smart-contracts', 'tokens', 'dapp', 'uniswap-v2', 'uniswap-v3', 'uniswap-v4', 'mev'];

/** Collects console errors and uncaught exceptions for the page's lifetime. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    // A crashed scene is caught by its boundary and logged as a warning.
    if (m.type() === 'error' || /^Scene failed/.test(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

export async function openLesson(page: Page, route: string) {
  await page.goto(`/#${route}`);
  await expect(page.locator('[data-scene-ready]')).toBeVisible({ timeout: 30_000 });
}

export async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
}

/** Text shown to the user must never contain leaked non-values. */
export async function expectCleanText(page: Page) {
  const text = await page.locator('.lesson').innerText();
  expect(text).not.toMatch(/\bNaN\b|\bInfinity\b|\bundefined\b|\[\[|\]\]/);
}
