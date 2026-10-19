// @ts-check
import { defineConfig } from "astro/config";

// Static output: Cloudflare serves the built /dist folder as static assets.
// No adapter is needed for a static homepage. If you later add SSR routes,
// install @astrojs/cloudflare and set `output: "server", adapter: cloudflare()`.
export default defineConfig({
  site: "https://www.elitefitness.com",
  output: "static",
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
});
