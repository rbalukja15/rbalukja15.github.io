import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders all six home sections', async ({ page }) => {
  await expect(page.locator('header nav')).toBeVisible();
  await expect(page.locator('#hero')).toBeVisible();
  await expect(page.locator('#projects')).toBeVisible();
  await expect(page.locator('#skills')).toBeVisible();
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
});

test('hero states title and positioning', async ({ page }) => {
  await expect(page.locator('#hero .kicker')).toHaveText(
    'Senior Software Engineer · Full-Stack & DevOps'
  );
  await expect(page.locator('#hero h1')).toBeVisible();
  await expect(page.locator('#hero')).toContainText('7+ years');
});

test('skills renders six groups, no progress bars', async ({ page }) => {
  await expect(page.locator('#skills .skill-group')).toHaveCount(6);
  await expect(page.locator('#skills progress, #skills .bar')).toHaveCount(0);
});

test('experience renders five roles in CV order', async ({ page }) => {
  const roles = page.locator('#experience li');
  await expect(roles).toHaveCount(5);
  await expect(roles.first()).toContainText('Senior Software Engineer');
  await expect(roles.last()).toContainText('Kreatx');
});
