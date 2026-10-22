// Build-time XenForo forum feed client.
// Each forum node exposes a public RSS feed at "<forum-url>index.rss" with no
// auth required. Set FORUM_RSS_ENABLED=1 to turn on live fetches; any caller
// falls back to the static data in src/data/home.ts when the flag is unset or
// a request fails, so `astro build` never breaks on a forum outage.

export interface ForumPost {
  title: string;
  href: string;
  date: string;
  author: string;
  excerpt: string;
}

export interface ForumStats {
  members: string;
  posts: string;
}

import { withTtlCache } from "./cache";

const FORUM_RSS_ENABLED = String(import.meta.env.FORUM_RSS_ENABLED) === "1";
const FORUM_STATS_ENABLED = String(import.meta.env.FORUM_STATS_ENABLED) === "1";
const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60_000;

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&hellip;/g, "…")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, "").trim());
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1] : null;
}

function formatDate(pubDate: string): string {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase()
    .replace(",", "");
}

export async function fetchLatestThreads(forumHref: string, count = 2): Promise<ForumPost[] | null> {
  if (!FORUM_RSS_ENABLED) return null;
  return withTtlCache(`threads:${forumHref}:${count}`, CACHE_TTL_MS, () => fetchLatestThreadsUncached(forumHref, count));
}

async function fetchLatestThreadsUncached(forumHref: string, count: number): Promise<ForumPost[] | null> {
  try {
    const feedUrl = new URL("index.rss", forumHref.endsWith("/") ? forumHref : `${forumHref}/`);
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Forum RSS responded ${res.status}`);
    const xml = await res.text();

    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    return items.slice(0, count).map((item): ForumPost => {
      const title = stripHtml(extractTag(item, "title") ?? "");
      const href = (extractTag(item, "link") ?? "").trim();
      const pubDate = extractTag(item, "pubDate") ?? "";
      const author = stripHtml(extractTag(item, "dc:creator") ?? "");
      const body = extractTag(item, "content:encoded") ?? extractTag(item, "description") ?? "";
      const description = stripHtml(body).replace(/\s*Read more\s*$/i, "");
      return {
        title,
        href,
        date: formatDate(pubDate),
        author,
        excerpt: description.slice(0, 180).trim() + (description.length > 180 ? "..." : ""),
      };
    });
  } catch (err) {
    console.warn(`[forum] Falling back to static posts for ${forumHref}: ${(err as Error).message}`);
    return null;
  }
}

// The forum index renders a "Forum statistics" sidebar widget (XenForo's
// forum_statistics widget) with member/post counts in dl.pairs blocks tagged
// by a `count--users` / `count--messages` class, e.g.:
//   <dl class="pairs pairs--justified count--users"><dt>Members</dt><dd>331,500</dd></dl>
// There's no JSON API for this, so we scrape that fragment directly.
function extractStatCount(html: string, countClass: string): string | null {
  const match = html.match(
    new RegExp(`count--${countClass}"[\\s\\S]*?<dd>([\\d,]+)</dd>`, "i")
  );
  return match ? match[1] : null;
}

export async function fetchForumStats(forumHref: string): Promise<ForumStats | null> {
  if (!FORUM_STATS_ENABLED) return null;
  return withTtlCache(`stats:${forumHref}`, CACHE_TTL_MS, () => fetchForumStatsUncached(forumHref));
}

async function fetchForumStatsUncached(forumHref: string): Promise<ForumStats | null> {
  try {
    const res = await fetch(forumHref, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Forum index responded ${res.status}`);
    const html = await res.text();

    const members = extractStatCount(html, "users");
    const posts = extractStatCount(html, "messages");
    if (!members || !posts) throw new Error("Forum statistics widget not found");

    return { members, posts };
  } catch (err) {
    console.warn(`[forum] Falling back to static stats for ${forumHref}: ${(err as Error).message}`);
    return null;
  }
}
