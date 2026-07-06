type CacheEntry = { value: unknown; expiresAt: number };

const store = new Map<string, CacheEntry>();

/**
 * Return a cached value if still fresh, otherwise compute it, cache it for
 * `ttlSeconds`, and return it. Mirrors Laravel's Cache::remember for the
 * dashboard endpoints. In-memory (per-process) — swap for Redis if the app is
 * ever run as multiple instances.
 */
export async function remember<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }
  const value = await compute();
  store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  return value;
}

/** Drop a cached entry (Laravel's Cache::forget). */
export function forget(key: string): void {
  store.delete(key);
}
