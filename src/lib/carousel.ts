// The homepage carousel is a "Post Carousel Pro"-style plugin (WP custom post
// type `sp_post_carousel`) with its own manually curated, manually-uploaded
// banner images — it is NOT simply "latest posts in a category": new episodes
// lag until someone adds a slide for them. That custom post type doesn't
// expose its slide list over REST, so the only faithful source is the
// rendered carousel markup on the live homepage itself.
import { toRelativeMediaPath } from "./wordpress";
import { withTtlCache } from "./cache";

export interface CarouselItem {
  href: string;
  img?: string;
  w: number;
  h: number;
}

const HOME_URL = "https://www.elitefitness.com/";
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60_000;
const CAROUSEL_WRAPPER_ID = "pcp_wrapper-5693";
const SLIDE_PATTERN = /<a class="sp-pcp-thumb" href="([^"]+)"[^>]*>\s*<img\s+([^>]*)>/gs;

// Slides for posts without a custom banner yet fall back to the plugin's own
// placeholder, which lives outside /wp-content/uploads/ and so can't be
// proxied through /media/ — treat it the same as "no image".
const PLUGIN_PLACEHOLDER_MARKER = "/post-carousel/public/assets/img/placeholder";

// Standard banner aspect ratio used by every real slide image; applied to
// placeholder slides too so they don't render as an oversized, mismatched box.
const DEFAULT_W = 800;
const DEFAULT_H = 450;

export async function fetchLiveCarousel(): Promise<CarouselItem[] | null> {
  return withTtlCache("carousel", CACHE_TTL_MS, fetchLiveCarouselUncached);
}

async function fetchLiveCarouselUncached(): Promise<CarouselItem[] | null> {
  try {
    const res = await fetch(HOME_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Homepage responded ${res.status}`);
    const html = await res.text();

    const start = html.indexOf(CAROUSEL_WRAPPER_ID);
    if (start === -1) throw new Error("Carousel wrapper not found in homepage markup");
    const end = html.indexOf("pcp-pagination", start);
    const section = html.slice(start, end === -1 ? undefined : end);

    const items: CarouselItem[] = [];
    for (const [, href, imgAttrs] of section.matchAll(SLIDE_PATTERN)) {
      let dataSrc = imgAttrs.match(/data-src="([^"]+)"/)?.[1];
      const isPlaceholder = dataSrc?.includes(PLUGIN_PLACEHOLDER_MARKER) ?? false;
      if (isPlaceholder) dataSrc = undefined;

      const w = imgAttrs.match(/width="(\d+)"/)?.[1];
      const h = imgAttrs.match(/height="(\d+)"/)?.[1];
      items.push({
        href,
        img: toRelativeMediaPath(dataSrc),
        w: isPlaceholder || !w ? DEFAULT_W : Number(w),
        h: isPlaceholder || !h ? DEFAULT_H : Number(h),
      });
    }

    return items.length ? items : null;
  } catch (err) {
    console.warn(`[carousel] Falling back to static carousel: ${(err as Error).message}`);
    return null;
  }
}
