/**
 * Simple in-memory TTL cache using a Map.
 *
 * Designed for a ~326-problem dataset that only changes during seeding.
 * Eliminates redundant Prisma round-trips on every page load.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

const store = new Map<string, CacheEntry<unknown>>()

/**
 * Retrieve a cached value, or compute and store it if missing / expired.
 *
 * @param key   - Unique cache key
 * @param fn    - Async function that produces the value on a cache miss
 * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined

  if (entry && Date.now() < entry.expiresAt) {
    return entry.value
  }

  const value = await fn()
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

/** Remove a single key from the cache. */
export function invalidate(key: string): boolean {
  return store.delete(key)
}

/** Remove all entries from the cache. */
export function invalidateAll(): void {
  store.clear()
}

/** Return the number of entries currently in the cache (useful for tests). */
export function cacheSize(): number {
  return store.size
}
