import { test, expect } from '@playwright/test';

test('home page serves', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  // Deliberately copy-independent: the headline is placeholder text pending a rewrite
  // (Task 12, Gate 1). A smoke test should prove the page renders, not pin its wording —
  // tests/home.spec.ts is where positioning is asserted.
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  await expect(h1).not.toBeEmpty();
});
