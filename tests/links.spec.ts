import { test, expect } from '@playwright/test';

// Canonical URLs — spec §9.1. Frontmatter and this file must agree.
export const CANONICAL = {
  tenantiqGithub: 'https://github.com/rbalukja15/tenantiq',
  uiKitGithub: 'https://github.com/rbalukja15/react-ui-kit',
  storybook: 'https://rbalukja15.github.io/react-ui-kit/',
  githubProfile: 'https://github.com/rbalukja15',
  linkedin: 'https://www.linkedin.com/in/romarjo-balukja',
  email: 'mailto:romarjo.balukja@gmail.com',
  cv: '/Romarjo_Balukja_CV.pdf',
};

test('nav renders brand, section links, and CV button', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('header nav');
  await expect(nav.locator(`a[href="/"]`)).toContainText('Romarjo Balukja');
  await expect(nav.locator('a[href="/#projects"]')).toBeVisible();
  await expect(nav.locator('a[href="/#skills"]')).toBeVisible();
  await expect(nav.locator('a[href="/#experience"]')).toBeVisible();
  const cv = nav.locator(`a[href="${CANONICAL.cv}"]`);
  await expect(cv).toBeVisible();
  await expect(cv).toHaveAttribute('target', '_blank');
  // No forced download — recruiters preview first (spec §3.1)
  await expect(cv).not.toHaveAttribute('download', /.*/);
});

test('footer renders contact links', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.locator(`a[href="${CANONICAL.email}"]`)).toBeVisible();
  await expect(footer.locator(`a[href="${CANONICAL.githubProfile}"]`)).toBeVisible();
  await expect(footer.locator(`a[href="${CANONICAL.linkedin}"]`)).toBeVisible();
  await expect(footer.locator(`a[href="${CANONICAL.cv}"]`)).toBeVisible();
});

test('CV link resolves to a real PDF', async ({ request }) => {
  const response = await request.get(CANONICAL.cv);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('mobile nav hides section links, keeps CV', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.locator('header nav');
  await expect(nav.locator('a[href="/#projects"]')).toBeHidden();
  await expect(nav.locator(`a[href="${CANONICAL.cv}"]`)).toBeVisible();
});
