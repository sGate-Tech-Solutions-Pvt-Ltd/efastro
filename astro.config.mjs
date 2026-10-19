// @ts-check
import { defineConfig } from "astro/config";

// Static output: Cloudflare serves the built /dist folder as static assets.
// No adapter is needed for a static homepage. If you later add SSR routes,
// install @astrojs/cloudflare and set `output: "server", adapter: cloudflare()`.

// `astro dev` never runs src/worker.ts, so /media/<year>/<month>/<file>
// image URLs (see src/lib/wordpress.ts) 404 with no further setup. This dev
// middleware mirrors worker.ts's proxy so images also resolve in `astro dev`,
// not just `npm run preview` (wrangler). Keep the pattern/origin in sync with
// src/worker.ts if either changes.
const WP_MEDIA_ORIGIN = "https://www.elitefitness.com";
const MEDIA_PROXY_PATH_PATTERN = /^\/media\/(\d{4}\/\d{2}\/.+)$/;

/** @type {import("vite").Plugin} */
const mediaProxyDevMiddleware = {
  name: "wp-media-proxy-dev",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const match = (req.url ?? "").match(MEDIA_PROXY_PATH_PATTERN);
      if (!match) return next();

      try {
        const originUrl = new URL(`/articles/wp-content/uploads/${match[1]}`, WP_MEDIA_ORIGIN);
        const originResponse = await fetch(originUrl);
        res.statusCode = originResponse.status;
        res.setHeader("content-type", originResponse.headers.get("content-type") ?? "application/octet-stream");
        res.end(Buffer.from(await originResponse.arrayBuffer()));
      } catch {
        res.statusCode = 502;
        res.end("Media proxy fetch failed");
      }
    });
  },
};

export default defineConfig({
  site: "https://www.elitefitness.com",
  output: "static",
  build: { inlineStylesheets: "auto" },
  compressHTML: true,
  vite: { plugins: [mediaProxyDevMiddleware] },
});
