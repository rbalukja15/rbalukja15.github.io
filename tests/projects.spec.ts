import { test, expect } from '@playwright/test';
import { CANONICAL } from './canonical';

test.describe('home cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders three project cards, lowest order featured full-width', async ({ page }) => {
    const cards = page.locator('#projects article');
    await expect(cards).toHaveCount(3);
    // order-driven, not slug-driven (spec §3.1): first card = order 1 = tenantiq
    await expect(cards.first()).toContainText('tenantiq');
    await expect(cards.first()).toHaveClass(/featured/);
  });

  test('every card shows bullets, stack chips, and a case-study link', async ({ page }) => {
    const cards = page.locator('#projects article');
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);
      await expect(card.locator('ul li').first()).toBeVisible();
      await expect(card.locator('.chip').first()).toBeVisible();
      await expect(card.locator('a[href^="/projects/"]')).toBeVisible();
    }
  });

  test('cards render thumbnail or monogram fallback (both states valid)', async ({ page }) => {
    const cards = page.locator('#projects article');
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);
      const hasVisual =
        (await card.locator('img.thumb').count()) + (await card.locator('.monogram').count());
      expect(hasVisual).toBe(1);
    }
  });

  test('public projects link out; vetapp does not', async ({ page }) => {
    const projects = page.locator('#projects');
    await expect(projects.locator(`a[href="${CANONICAL.tenantiqGithub}"]`)).toBeVisible();
    await expect(projects.locator(`a[href="${CANONICAL.uiKitGithub}"]`)).toBeVisible();
    await expect(projects.locator(`a[href="${CANONICAL.storybook}"]`)).toBeVisible();
    const vetappCard = projects.locator('article', { hasText: 'vetapp' });
    await expect(vetappCard.locator('a[href*="github.com"]')).toHaveCount(0);
  });
});

const CASE_STUDIES = ['/projects/tenantiq/', '/projects/react-ui-kit/', '/projects/vetapp/'];

for (const path of CASE_STUDIES) {
  test(`case study ${path} loads with header`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.tagline')).toBeVisible();
    await expect(page.locator('.chip').first()).toBeVisible();
  });
}

test('vetapp case study shows private note, no repo links', async ({ page }) => {
  await page.goto('/projects/vetapp/');
  await expect(page.locator('main')).toContainText('Private production codebase');
  await expect(page.locator('main a[href*="github.com"]')).toHaveCount(0);
});

test('tenantiq case study links to its repo', async ({ page }) => {
  await page.goto('/projects/tenantiq/');
  await expect(page.locator(`main a[href="${CANONICAL.tenantiqGithub}"]`)).toBeVisible();
});

test('react-ui-kit case study links to its Storybook', async ({ page }) => {
  await page.goto('/projects/react-ui-kit/');
  await expect(page.locator(`main a[href="${CANONICAL.storybook}"]`)).toContainText('Storybook');
});
