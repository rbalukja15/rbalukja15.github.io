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

const ALL_PAGES = [
  '/',
  '/projects/pipelinemd/',
  '/projects/tenantiq/',
  '/projects/react-ui-kit/',
  '/projects/vetapp/',
];

for (const path of ALL_PAGES) {
  test(`no console errors on ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

test('home sections reveal on scroll', async ({ page }) => {
  await page.goto('/');
  const skills = page.locator('#skills');
  await skills.scrollIntoViewIfNeeded();
  await expect(skills.locator('.reveal').first()).toHaveClass(/is-visible/);
});

test('hero is painted immediately, never behind the reveal', async ({ page }) => {
  await page.goto('/');
  // The hero is the reason this redesign exists: it must never start invisible.
  await expect(page.locator('#hero .reveal')).toHaveCount(0);
  await expect(page.locator('#hero h1')).toHaveCSS('opacity', '1');
});

test('the featured project card is painted immediately too', async ({ page }) => {
  await page.goto('/');
  const featured = page.locator('#projects .featured');
  await expect(featured).toHaveCount(1);
  // Descendant check, not a parent-axis one: `.locator('..')` walks exactly one level, so
  // wrapping the card in any intervening div would let the bug back in while still passing.
  await expect(page.locator('#projects .reveal .featured')).toHaveCount(0);
});

test('the non-featured cards still reveal on scroll', async ({ page }) => {
  await page.goto('/');
  // The other half of the contract: un-gating the featured card must not disable the
  // animation for the pair below it.
  const pair = page.locator('#projects .pair');
  await pair.scrollIntoViewIfNeeded();
  await expect(page.locator('#projects .reveal').first()).toHaveClass(/is-visible/);
});

test('reduced motion shows everything without scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // CSS force-shows .reveal under reduced motion; content must be readable immediately.
  // toBeVisible() ignores opacity, so assert opacity:1 explicitly — that is the real guarantee.
  const revealed = page.locator('#experience .reveal').first();
  await expect(revealed).toBeVisible();
  await expect(revealed).toHaveCSS('opacity', '1');
});
