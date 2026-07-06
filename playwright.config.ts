import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4399',
    url: 'http://localhost:4399/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4399/',
  },
});
