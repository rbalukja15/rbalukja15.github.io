// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rbalukja15.github.io',
  integrations: [sitemap()],
  // The stylesheet is ~4.7KB, just over Astro's 4KB auto-inline threshold. Letting it go
  // external costs a render-blocking round trip on every page (measured: LCP +43%).
  // Inlining always is the better trade for a 5-page static site.
  build: { inlineStylesheets: 'always' },
});
