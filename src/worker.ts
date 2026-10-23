// Cloudflare Worker entry point: serves the static Astro build and proxies
// dynamic WordPress media through this same domain, so neither the WordPress
// origin nor its "wp-content/uploads" path structure is exposed in page
// source (see the modernization plan's media-proxy architecture). Static
// assets (including the bundled theme images under /assets/theme/...) are
// served as-is; only post-upload media, rewritten at build time to
// /media/<year>/<month>/<file>, is mapped back and fetched from the CMS
// origin's real uploads path on demand.

interface Env {
  ASSETS: Fetcher;
}

const WP_MEDIA_ORIGIN = "https://www.elitefitness.com";
const MEDIA_PROXY_PATH_PATTERN = /^\/media\/(articles|root)\/(\d{4}\/\d{2}\/.+)$/;
const MEDIA_CACHE_SECONDS = 86400;
const MEDIA_FETCH_TIMEOUT_MS = 5000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(MEDIA_PROXY_PATH_PATTERN);

    if (match) {
      const prefix = match[1] === "articles" ? "articles/" : "";
      const originUrl = new URL(`/${prefix}wp-content/uploads/${match[2]}`, WP_MEDIA_ORIGIN);

      let originResponse: Response;
      try {
        originResponse = await fetch(originUrl.toString(), {
          cf: { cacheTtl: MEDIA_CACHE_SECONDS, cacheEverything: true },
          signal: AbortSignal.timeout(MEDIA_FETCH_TIMEOUT_MS),
        });
      } catch {
        return new Response("Media temporarily unavailable", { status: 504 });
      }

      // Re-wrap so we control headers and never leak the origin via redirects.
      // Set our own long-lived Cache-Control so the edge/browser cache holds
      // regardless of what (if anything) the WordPress origin sends.
      const headers = new Headers(originResponse.headers);
      headers.set("Cache-Control", `public, max-age=${MEDIA_CACHE_SECONDS}, immutable`);

      return new Response(originResponse.body, {
        status: originResponse.status,
        headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
