import { describe, it, expect } from 'bun:test'
import { createTTLCache, createTTLCacheWithParam, invalidateAll, __registerCachedFunction } from './cache'

describe('TTL Cache', () => {
  describe('createTTLCache', () => {
    it('should return the same cached value within TTL', async () => {
      let callCount = 0
      const expensiveFn = async () => {
        callCount++
        return { value: 'result', callCount }
      }

      const cached = createTTLCache(expensiveFn, 100) // 100ms TTL
      const result1 = await cached()
      const result2 = await cached()

      expect(result1).toEqual({ value: 'result', callCount: 1 })
      expect(result2).toEqual({ value: 'result', callCount: 1 }) // Same value (cached)
      expect(callCount).toBe(1) // Function called once
    })

    it('should call the function again after TTL expires', async () => {
      let callCount = 0
      const expensiveFn = async () => {
        callCount++
        return { value: 'result', callCount }
      }

      const cached = createTTLCache(expensiveFn, 50) // 50ms TTL
      const result1 = await cached()
      expect(result1.callCount).toBe(1)

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60))

      const result2 = await cached()
      expect(result2.callCount).toBe(2) // Function called again
      expect(callCount).toBe(2) // Function called twice total
    })

    it('should handle async errors properly', async () => {
      let callCount = 0
      const failingFn = async () => {
        callCount++
        throw new Error('Test error')
      }

      const cached = createTTLCache(failingFn, 100)

      try {
        await cached()
      } catch (e) {
        expect((e as Error).message).toBe('Test error')
      }

      // Cache should not store failed results, so next call should try again
      callCount = 0
      try {
        await cached()
      } catch (e) {
        expect((e as Error).message).toBe('Test error')
      }
      expect(callCount).toBe(1) // Function called again for retry
    })

    it('should handle multiple concurrent calls', async () => {
      let callCount = 0
      const delayedFn = async () => {
        callCount++
        await new Promise((resolve) => setTimeout(resolve, 50))
        return { value: 'result', callCount }
      }

      const cached = createTTLCache(delayedFn, 200)

      // Call multiple times concurrently
      const results = await Promise.all([cached(), cached(), cached()])

      // All results should be the same
      expect(results[0]).toEqual(results[1])
      expect(results[1]).toEqual(results[2])
      // In this implementation, concurrent calls may call the function multiple times
      // because the cache is not set until the first call completes
      // This is a documented trade-off for simplicity
    })
  })

  describe('createTTLCacheWithParam', () => {
    it('should cache results per parameter', async () => {
      let callCount = 0
      const parameterizedFn = async (param: string) => {
        callCount++
        return { value: param, callCount }
      }

      const cached = createTTLCacheWithParam(parameterizedFn, 100)

      const result1 = await cached('a')
      const result1Again = await cached('a')
      const result2 = await cached('b')
      const result2Again = await cached('b')

      expect(result1).toEqual({ value: 'a', callCount: 1 })
      expect(result1Again).toEqual({ value: 'a', callCount: 1 }) // Cached
      expect(result2).toEqual({ value: 'b', callCount: 2 })
      expect(result2Again).toEqual({ value: 'b', callCount: 2 }) // Cached
      expect(callCount).toBe(2) // Called once per unique parameter
    })

    it('should expire cache per parameter independently', async () => {
      let callCount = 0
      const parameterizedFn = async (param: string) => {
        callCount++
        return { value: param, callCount }
      }

      const cached = createTTLCacheWithParam(parameterizedFn, 50)

      const result1 = await cached('a')
      expect(result1.callCount).toBe(1)

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60))

      const result1Again = await cached('a')
      expect(result1Again.callCount).toBe(2) // Cache expired for 'a'

      const result2 = await cached('b')
      expect(result2.callCount).toBe(3) // Different parameter, never cached
    })

    it('should handle undefined as a parameter', async () => {
      let callCount = 0
      const parameterizedFn = async (param?: string) => {
        callCount++
        return { value: param, callCount }
      }

      const cached = createTTLCacheWithParam(parameterizedFn, 100)

      const result1 = await cached(undefined)
      const result1Again = await cached(undefined)

      expect(result1).toEqual({ value: undefined, callCount: 1 })
      expect(result1Again).toEqual({ value: undefined, callCount: 1 }) // Cached
      expect(callCount).toBe(1)
    })

    it('should handle numeric parameters', async () => {
      let callCount = 0
      const parameterizedFn = async (param: number) => {
        callCount++
        return { value: param * 2, callCount }
      }

      const cached = createTTLCacheWithParam(parameterizedFn, 100)

      const result1 = await cached(5)
      const result1Again = await cached(5)
      const result2 = await cached(10)

      expect(result1).toEqual({ value: 10, callCount: 1 })
      expect(result1Again).toEqual({ value: 10, callCount: 1 }) // Cached
      expect(result2).toEqual({ value: 20, callCount: 2 })
      expect(callCount).toBe(2)
    })
  })

  describe('invalidateAll', () => {
    it('should clear all caches', async () => {
      let callCount1 = 0
      let callCount2 = 0

      const fn1 = async () => {
        callCount1++
        return { value: 'result1', callCount: callCount1 }
      }

      const fn2 = async (param: string) => {
        callCount2++
        return { value: param, callCount: callCount2 }
      }

      const cached1 = createTTLCache(fn1, 5000)
      const cached2 = createTTLCacheWithParam(fn2, 5000)

      // Register both caches
      __registerCachedFunction(cached1)
      __registerCachedFunction(cached2)

      // Call them once to populate cache
      await cached1()
      await cached2('test')

      // Verify caching works
      const result1 = await cached1()
      const result2 = await cached2('test')
      expect(callCount1).toBe(1)
      expect(callCount2).toBe(1)

      // Clear all caches
      invalidateAll()

      // After clearing, functions should be called again
      const result1Again = await cached1()
      const result2Again = await cached2('test')
      expect(callCount1).toBe(2)
      expect(callCount2).toBe(2)
    })
  })
})
