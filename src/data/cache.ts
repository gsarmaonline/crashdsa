/**
 * Generic TTL (Time-To-Live) cache utility for memoizing async function results.
 *
 * This module provides a simple in-memory cache with TTL support.
 * Ideal for caching expensive database queries or API calls that change infrequently.
 *
 * Usage:
 *   const cachedFn = createTTLCache(asyncFn, 5 * 60 * 1000) // 5-minute TTL
 *   const result = await cachedFn()
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

interface CachedFunction<T> {
  (): Promise<T>
  __invalidate?: () => void
}

/**
 * Creates a cached version of an async function with TTL support.
 *
 * @param fn - The async function to cache
 * @param ttlMs - Time-to-live in milliseconds
 * @returns A function that returns cached results until TTL expires
 *
 * @example
 * const getStats = async () => {
 *   return { total: 100, easy: 30 }
 * }
 * const cachedGetStats = createTTLCache(getStats, 5 * 60 * 1000)
 * const stats = await cachedGetStats() // Calls getStats() first time
 * const statsAgain = await cachedGetStats() // Returns cached result within 5 minutes
 */
export function createTTLCache<T>(
  fn: () => Promise<T>,
  ttlMs: number,
): CachedFunction<T> {
  let cached: CacheEntry<T> | null = null

  const cachedFn = async (): Promise<T> => {
    const now = Date.now()

    // Return cached value if it exists and hasn't expired
    if (cached && cached.expiresAt > now) {
      return cached.value
    }

    // Fetch fresh data
    const value = await fn()

    // Store in cache with TTL
    cached = {
      value,
      expiresAt: now + ttlMs,
    }

    return value
  }

  // Add an invalidate method for testing
  cachedFn.__invalidate = () => {
    cached = null
  }

  return cachedFn
}

interface CachedFunctionWithParam<T, P> {
  (param: P): Promise<T>
  __invalidate?: () => void
}

/**
 * Creates a cached version of an async function with a single parameter and TTL support.
 *
 * @param fn - The async function to cache (takes one parameter)
 * @param ttlMs - Time-to-live in milliseconds
 * @returns A function that returns cached results per parameter value
 *
 * @example
 * const getProblemsByPattern = async (pattern: string) => {
 *   return await db.problems.where({ pattern })
 * }
 * const cachedGetProblemsByPattern = createTTLCacheWithParam(getProblemsByPattern, 5 * 60 * 1000)
 * const result = await cachedGetProblemsByPattern('two-pointers') // Calls fn first time
 * const resultAgain = await cachedGetProblemsByPattern('two-pointers') // Cached
 * const resultOther = await cachedGetProblemsByPattern('dp') // Different param, calls fn again
 */
export function createTTLCacheWithParam<T, P>(
  fn: (param: P) => Promise<T>,
  ttlMs: number,
): CachedFunctionWithParam<T, P> {
  const cache = new Map<P, CacheEntry<T>>()

  const cachedFn = async (param: P): Promise<T> => {
    const now = Date.now()

    // Check if we have a cached entry for this parameter
    const cached = cache.get(param)
    if (cached && cached.expiresAt > now) {
      return cached.value
    }

    // Fetch fresh data
    const value = await fn(param)

    // Store in cache with TTL
    cache.set(param, {
      value,
      expiresAt: now + ttlMs,
    })

    return value
  }

  // Add an invalidate method for testing
  cachedFn.__invalidate = () => {
    cache.clear()
  }

  return cachedFn
}

/**
 * Global registry of all cached functions.
 * Used for testing to invalidate all caches at once.
 */
const allCachedFunctions: Array<{
  __invalidate?: () => void
}> = []

/**
 * Register a cached function for global invalidation.
 * @internal
 */
export function __registerCachedFunction<T, P>(
  cachedFn: CachedFunction<T> | CachedFunctionWithParam<T, P>,
): void {
  allCachedFunctions.push(cachedFn)
}

/**
 * Clears all cached entries immediately.
 * Useful for testing or manual cache invalidation.
 */
export function invalidateAll(): void {
  for (const cachedFn of allCachedFunctions) {
    if (cachedFn.__invalidate) {
      cachedFn.__invalidate()
    }
  }
}

/**
 * Clears all cached entries immediately.
 * Alias for invalidateAll(), kept for backwards compatibility.
 */
export function clearAllCaches(): void {
  invalidateAll()
}
