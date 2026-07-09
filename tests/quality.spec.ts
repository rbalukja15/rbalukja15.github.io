import { test, expect } from '@playwright/test';

test('unknown path serves the 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible();
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});
