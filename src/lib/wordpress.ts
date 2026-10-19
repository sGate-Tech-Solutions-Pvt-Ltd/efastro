// Build-time WordPress REST API client.
// Set WP_API_BASE (e.g. https://cms.elitefitness.com/wp-json/wp/v2) to enable live fetches.
// Any caller falls back to the static data in src/data/home.ts when the env var
// is unset or the request fails, so `astro build` never breaks on a CMS outage.

export interface Article {
  title: string;
  href: string;
  excerpt: string;
  day: string;
  month: string;
  image?: string;
}

const WP_API_BASE = import.meta.env.WP_API_BASE;

const HTML_ENTITIES: Record<string, string> = {
  "&#8211;": "–",
  "&#8212;": "—",
  "&#8216;": "‘",
  "&#8217;": "’",
  "&#8220;": "“",
  "&#8221;": "”",
  "&#8230;": "…",
  "&hellip;": "…",
  "&amp;": "&",
  "&nbsp;": " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&#?\w+;/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

function stripHtml(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, "").trim();
  // WordPress sometimes double-escapes entities (e.g. "&amp;hellip;"), so a
  // single decode pass can leave a literal "&hellip;" behind. Decode twice.
  return decodeEntities(decodeEntities(withoutTags));
}

// The podcast player plugin injects player-control and subscribe-link text
// ("0.75x 1x ... Apple PodcastsGoogle Podcasts ... Spotify ") ahead of the
// real summary in post excerpts. The boilerplate reliably ends in "Spotify ",
// so drop everything up to and including that marker when present.
function stripPodcastPlayerBoilerplate(text: string): string {
  const marker = /spotify\s+/i;
  const match = text.match(marker);
  if (!match || match.index === undefined) return text;
  return text.slice(match.index + match[0].length);
}

// Image URLs come back absolute (https://www.elitefitness.com/articles/wp-content/...),
// which bakes the WordPress origin straight into the page source. Cloudflare
// proxies /wp-content/* and /articles/wp-content/* paths on the same domain
// (see the architecture plan), so a relative path resolves the same way
// without exposing the CMS host directly.
function toRelativeMediaPath(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function formatDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleString("en-US", { month: "short" }),
  };
}

export async function fetchLatestArticles(count = 3): Promise<Article[] | null> {
  if (!WP_API_BASE) return null;

  try {
    const res = await fetch(`${WP_API_BASE}/posts?per_page=${count}&_embed`);
    if (!res.ok) throw new Error(`WP API responded ${res.status}`);
    const posts = await res.json();

    return posts.map((p: any) => {
      // This site's `date` field is unreliable (seen desynced from `date_gmt`
      // by months on some posts); `date_gmt` matches what the live site displays.
      const { day, month } = formatDate(p.date_gmt);
      const image = toRelativeMediaPath(p._embedded?.["wp:featuredmedia"]?.[0]?.source_url);
      const excerpt = stripPodcastPlayerBoilerplate(stripHtml(p.excerpt.rendered));
      return {
        title: stripHtml(p.title.rendered),
        href: p.link,
        excerpt: excerpt.slice(0, 180).trim() + "...",
        day,
        month,
        image,
      } satisfies Article;
    });
  } catch (err) {
    console.warn(`[wordpress] Falling back to static articles: ${(err as Error).message}`);
    return null;
  }
}
