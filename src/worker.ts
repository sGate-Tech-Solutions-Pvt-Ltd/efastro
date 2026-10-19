// Cloudflare Worker entry point: serves the static Astro build and proxies
// dynamic WordPress media through this same domain, so neither the WordPress
// origin nor its "wp-content/uploads" path structure is exposed in page
// source (see the modernization plan's media-proxy architecture). Static
// assets (including the bundled theme images under /wp-content/themes/...)
// are served as-is; only post-upload media, rewritten at build time to
// /media/<year>/<month>/<file>, is mapped back and fetched from the CMS
// origin's real uploads path on demand.

interface Env {
  ASSETS: Fetcher;
}

const WP_MEDIA_ORIGIN = "https://www.elitefitness.com";
const MEDIA_PROXY_PATH_PATTERN = /^\/media\/(\d{4}\/\d{2}\/.+)$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(MEDIA_PROXY_PATH_PATTERN);

    if (match) {
      const originUrl = new URL(`/articles/wp-content/uploads/${match[1]}`, WP_MEDIA_ORIGIN);
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
