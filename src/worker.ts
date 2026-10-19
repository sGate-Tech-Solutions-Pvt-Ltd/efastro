// Cloudflare Worker entry point: serves the static Astro build and proxies
// dynamic WordPress media through this same domain, so the WordPress origin
// is never exposed in page source (see the modernization plan's media-proxy
// architecture). Static assets (including the bundled theme images under
// /wp-content/themes/...) are served as-is; only post-upload media under
// /articles/wp-content/uploads/* is fetched from the CMS origin on demand.

interface Env {
  ASSETS: Fetcher;
}

const WP_MEDIA_ORIGIN = "https://www.elitefitness.com";
const WP_MEDIA_PATH_PATTERN = /^\/articles\/wp-content\/uploads\//;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (WP_MEDIA_PATH_PATTERN.test(url.pathname)) {
      const originUrl = new URL(url.pathname + url.search, WP_MEDIA_ORIGIN);
      const originResponse = await fetch(originUrl.toString(), {
        cf: { cacheTtl: 3600, cacheEverything: true },
      });
      // Re-wrap so we control headers and never leak the origin via redirects.
      return new Response(originResponse.body, {
        status: originResponse.status,
        headers: originResponse.headers,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
