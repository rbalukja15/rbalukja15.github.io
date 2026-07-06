import { test, expect } from '@playwright/test';

test('home page serves', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Romarjo Balukja');
});
