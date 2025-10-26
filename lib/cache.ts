interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string // Custom cache key
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const isExpired = now - entry.timestamp > entry.ttl

    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Check if cache has valid (non-expired) data
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    const isExpired = now - entry.timestamp > entry.ttl

    if (isExpired) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern: string | RegExp): number {
    let deletedCount = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let deletedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }
}

// Global cache instance
const cache = new InMemoryCache()

/**
 * Cache decorator function for API routes
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 24 * 60 * 60 * 1000 } = options // Default 24 hours
  const cacheKey = options.key || key

  // Check if we should bypass cache (for manual refresh)
  const shouldBypassCache = process.env.NODE_ENV === 'development' && 
    typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).has('refresh')

  if (!shouldBypassCache && cache.has(cacheKey)) {
    return cache.get<T>(cacheKey)!
  }

  try {
    // Add timeout to prevent hanging on database issues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 30000) // 30 second timeout
    })
    
    const data = await Promise.race([fetcher(), timeoutPromise])
    cache.set(cacheKey, data, ttl)
    return data
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error)
    
    // If there's an error, try to return stale data if available
    const staleData = cache.get<T>(cacheKey)
    if (staleData) {
      console.warn(`Returning stale data for ${cacheKey} due to error`)
      return staleData
    }
    
    // If no stale data and it's a database connection error, return empty result
    if (error instanceof Error && (error.message.includes('P1001') || error.message.includes('Database timeout'))) {
      console.warn(`Database connection error for ${cacheKey}, returning empty result`)
      const emptyResult = [] as T
      cache.set(cacheKey, emptyResult, 5 * 60 * 1000) // Cache empty result for 5 minutes
      return emptyResult
    }
    
    throw error
  }
}

/**
 * Generate cache key for API routes
 */
export function generateCacheKey(route: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return sortedParams ? `${route}?${sortedParams}` : route
}

/**
 * Invalidate cache entries
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidatePattern(pattern: string | RegExp): number {
  return cache.clearPattern(pattern)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats()
}

/**
 * Clean up expired cache entries
 */
export function cleanupCache(): number {
  return cache.cleanup()
}

// Export the cache instance for direct access if needed
export { cache }
