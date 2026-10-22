// Tiny in-memory TTL cache for live CMS/forum fetches. These external calls
// are slow (the WordPress origin alone takes several seconds per request) and
// Astro's dev server re-executes page frontmatter on every request, so
// without this every reload re-pays the full network cost. Module state
// survives across requests within a single dev/build process, so this is
// enough to avoid redundant round trips without needing a real cache store.
const store = new Map<string, { value: unknown; expiresAt: number }>();

export async function withTtlCache<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const cached = store.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const value = await load();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}
