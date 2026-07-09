import { test, expect } from '@playwright/test';

test('unknown path serves the 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible();
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});

test('meta and OG tags on home', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Romarjo Balukja — Senior Software Engineer');
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute('content', /.{40,}/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://rbalukja15.github.io/images/og.png'
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image'
  );
});

test('meta tags on a case study', async ({ page }) => {
  await page.goto('/projects/tenantiq/');
  await expect(page).toHaveTitle(/tenantiq — Romarjo Balukja/);
});

for (const asset of [
  '/favicon.svg',
  '/favicon.ico',
  '/images/og.png',
  '/robots.txt',
  '/sitemap-index.xml',
]) {
  test(`asset ${asset} resolves`, async ({ request }) => {
    const response = await request.get(asset);
    expect(response.status()).toBe(200);
  });
}
