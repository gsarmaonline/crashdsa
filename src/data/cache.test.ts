import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { cached, invalidate, invalidateAll, cacheSize } from './cache.js'

describe('TTL cache', () => {
  beforeEach(() => {
    invalidateAll()
  })

  describe('cached()', () => {
    it('calls the factory function on a cache miss', async () => {
      const fn = mock(() => Promise.resolve(42))

      const result = await cached('key1', fn)

      expect(result).toBe(42)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('returns the cached value on a cache hit without calling the factory', async () => {
      let callCount = 0
      const fn = mock(() => Promise.resolve(++callCount))

      const first = await cached('key2', fn)
      const second = await cached('key2', fn)

      expect(first).toBe(1)
      expect(second).toBe(1)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('uses separate entries for different keys', async () => {
      const result1 = await cached('a', () => Promise.resolve('alpha'))
      const result2 = await cached('b', () => Promise.resolve('beta'))

      expect(result1).toBe('alpha')
      expect(result2).toBe('beta')
      expect(cacheSize()).toBe(2)
    })

    it('re-fetches after the TTL expires', async () => {
      let callCount = 0
      const fn = mock(() => Promise.resolve(++callCount))

      const first = await cached('expire-key', fn, 1)

      await new Promise((resolve) => setTimeout(resolve, 10))

      const second = await cached('expire-key', fn, 1)

      expect(first).toBe(1)
      expect(second).toBe(2)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('caches null and undefined values', async () => {
      const fnNull = mock(() => Promise.resolve(null))
      const fnUndef = mock(() => Promise.resolve(undefined))

      const r1 = await cached('null-key', fnNull)
      const r2 = await cached('null-key', fnNull)

      expect(r1).toBeNull()
      expect(r2).toBeNull()
      expect(fnNull).toHaveBeenCalledTimes(1)

      const r3 = await cached('undef-key', fnUndef)
      const r4 = await cached('undef-key', fnUndef)

      expect(r3).toBeUndefined()
      expect(r4).toBeUndefined()
      expect(fnUndef).toHaveBeenCalledTimes(1)
    })

    it('does not cache when the factory throws', async () => {
      const fn = mock(() => Promise.reject(new Error('db down')))

      await expect(cached('err-key', fn)).rejects.toThrow('db down')
      expect(cacheSize()).toBe(0)
    })
  })

  describe('invalidate()', () => {
    it('removes a single cached entry', async () => {
      await cached('x', () => Promise.resolve(1))
      await cached('y', () => Promise.resolve(2))

      expect(cacheSize()).toBe(2)

      const removed = invalidate('x')

      expect(removed).toBe(true)
      expect(cacheSize()).toBe(1)
    })

    it('returns false when the key does not exist', () => {
      expect(invalidate('nonexistent')).toBe(false)
    })

    it('causes the next cached() call to re-fetch', async () => {
      let callCount = 0
      const fn = mock(() => Promise.resolve(++callCount))

      await cached('inv-key', fn)
      invalidate('inv-key')
      const second = await cached('inv-key', fn)

      expect(second).toBe(2)
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('invalidateAll()', () => {
    it('clears all cached entries', async () => {
      await cached('a', () => Promise.resolve(1))
      await cached('b', () => Promise.resolve(2))
      await cached('c', () => Promise.resolve(3))

      expect(cacheSize()).toBe(3)

      invalidateAll()

      expect(cacheSize()).toBe(0)
    })
  })

  describe('cacheSize()', () => {
    it('returns 0 for an empty cache', () => {
      expect(cacheSize()).toBe(0)
    })

    it('tracks the number of entries', async () => {
      await cached('s1', () => Promise.resolve('a'))
      expect(cacheSize()).toBe(1)

      await cached('s2', () => Promise.resolve('b'))
      expect(cacheSize()).toBe(2)
    })
  })
})
