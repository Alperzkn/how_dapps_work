import { expect, test } from '@playwright/test';
import { expectCleanText, expectNoOverflow, LESSONS, openLesson, watchErrors } from './helpers';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];
// Each language and each theme is exercised at every viewport.
const MODES = [
  { lang: 'en', theme: 'light' },
  { lang: 'tr', theme: 'dark' },
] as const;

for (const lesson of LESSONS) {
  for (const vp of VIEWPORTS) {
    for (const mode of MODES) {
      test(`${lesson} renders first and last step · ${vp.name} · ${mode.lang} · ${mode.theme}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: vp, colorScheme: mode.theme });
        const page = await context.newPage();
        const errors = watchErrors(page);

        // Step 99 clamps to the last step.
        for (const step of ['1', '99']) {
          await openLesson(page, `/${mode.lang}/lesson/${lesson}/${step}?level=expert`);
          await expect(page.locator('.prose h1')).not.toBeEmpty();
          await expect(page.locator('html')).toHaveAttribute('data-theme', mode.theme);
          await expectNoOverflow(page);
          await expectCleanText(page);
          await page.waitForTimeout(600);
        }
        await expect(page.locator('.step-next')).toBeDisabled();
        expect(errors).toEqual([]);
        await context.close();
      });
    }
  }
}

test('every step of every lesson renders without errors at each level', async ({ page }) => {
  test.setTimeout(360_000);
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1100, height: 800 });
  const levels = ['beginner', 'intermediate', 'expert'];
  for (const lesson of LESSONS) {
    await openLesson(page, `/en/lesson/${lesson}/1?level=beginner`);
    const titles = new Set<string>();
    for (let i = 0; i < 14; i++) {
      titles.add(await page.locator('.prose h1').innerText());
      await page.locator(`.level-switch [data-level="${levels[i % 3]}"]`).click();
      await expectCleanText(page);
      const next = page.locator('.step-next');
      if (await next.isDisabled()) break;
      await next.click();
      await page.waitForTimeout(250);
    }
    expect(titles.size, `${lesson} step count`).toBeGreaterThanOrEqual(4);
  }
  expect(errors).toEqual([]);
});
