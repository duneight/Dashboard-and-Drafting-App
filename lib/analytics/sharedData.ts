import { prisma } from '@/lib/db/prisma'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export type MatchupDataVariant = 'full' | 'light'

export class SharedTeamData {
  private static teamCache: CacheEntry<any[]> | null = null
  private static matchupCache: CacheEntry<any[]> | null = null
  private static matchupLightCache: CacheEntry<any[]> | null = null
  private static teamDataPromise: Promise<any[]> | null = null
  private static matchupDataPromise: Promise<any[]> | null = null
  private static matchupLightDataPromise: Promise<any[]> | null = null

  // Cache TTL: 30 minutes
  private static readonly CACHE_TTL = 30 * 60 * 1000
  
  static async getAllTeams(): Promise<any[]> {
    // Check if we have valid cached data
    if (this.teamCache && !this.isExpired(this.teamCache)) {
      console.log(`📋 SharedTeamData.getAllTeams() returning cached data (${this.teamCache.data.length} teams)`)
      return this.teamCache.data
    }
    
    // If there's already a request in progress, wait for it
    if (this.teamDataPromise) {
      console.log('⏳ SharedTeamData.getAllTeams() waiting for existing request...')
      return await this.teamDataPromise
    }
    
    // Start a new request and cache the promise
    console.log('🔄 SharedTeamData.getAllTeams() starting new fetch...')
    this.teamDataPromise = this.fetchTeamData()
    
    try {
      const result = await this.teamDataPromise
      return result
    } finally {
      // Clear the promise so future requests can start fresh
      this.teamDataPromise = null
    }
  }
  
  private static async fetchTeamData(): Promise<any[]> {
    try {
      const data = await prisma.team.findMany({
        select: {
          name: true,
          managerNickname: true,
          season: true,
          wins: true,
          losses: true,
          ties: true,
          percentage: true,
          pointsFor: true,
          pointsAgainst: true,
          rank: true,
          numberOfMoves: true,
          numberOfTrades: true,
          isFinished: true,
          league: {
            select: {
              numTeams: true,
              isFinished: true
            }
          }
        },
        orderBy: { season: 'desc' }
      })
      
      // Cache the data
      this.teamCache = {
        data,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      }
      
      console.log(`✅ SharedTeamData.getAllTeams() fetched and cached ${data.length} teams`)
      return data
    } catch (error) {
      console.error('❌ Error fetching team data:', error)
      
      // If we have stale data, return it as fallback
      if (this.teamCache) {
        console.warn('⚠️ Returning stale team data due to database error')
        return this.teamCache.data
      }
      
      // If no fallback data, return empty array
      console.warn('⚠️ No cached data available, returning empty array')
      return []
    }
  }
  
  /**
   * Get all matchups.
   *
   * `variant: 'full'` (default) includes the large team1Stats/team2Stats JSON
   * columns (needed by Hall of Fame's stat parsing). `variant: 'light'` omits
   * them for consumers that never parse stats (dashboard, Wall of Shame).
   * The two variants are cached separately with the same TTL + in-flight
   * promise pattern.
   */
  static async getAllMatchups(variant: MatchupDataVariant = 'full'): Promise<any[]> {
    const cache = variant === 'light' ? this.matchupLightCache : this.matchupCache

    // Check if we have valid cached data
    if (cache && !this.isExpired(cache)) {
      console.log(`📋 SharedTeamData.getAllMatchups(${variant}) returning cached data (${cache.data.length} matchups)`)
      return cache.data
    }

    // If there's already a request in progress, wait for it
    const existingPromise = variant === 'light' ? this.matchupLightDataPromise : this.matchupDataPromise
    if (existingPromise) {
      console.log(`⏳ SharedTeamData.getAllMatchups(${variant}) waiting for existing request...`)
      return await existingPromise
    }

    // Start a new request and cache the promise
    console.log(`🔄 SharedTeamData.getAllMatchups(${variant}) starting new fetch...`)
    const fetchPromise = this.fetchMatchupData(variant)
    if (variant === 'light') {
      this.matchupLightDataPromise = fetchPromise
    } else {
      this.matchupDataPromise = fetchPromise
    }

    try {
      const result = await fetchPromise
      return result
    } finally {
      // Clear the promise so future requests can start fresh
      if (variant === 'light') {
        this.matchupLightDataPromise = null
      } else {
        this.matchupDataPromise = null
      }
    }
  }

  private static async fetchMatchupData(variant: MatchupDataVariant): Promise<any[]> {
    try {
      const data = await prisma.matchup.findMany({
        select: {
          week: true,
          season: true,
          winnerTeamKey: true,
          isPlayoffs: true,
          team1Points: true,
          team2Points: true,
          // The stats JSON columns are the biggest payload — only fetch them
          // for the full variant
          ...(variant === 'full' ? { team1Stats: true, team2Stats: true } : {}),
          team1: {
            select: {
              teamKey: true,
              managerNickname: true,
            },
          },
          team2: {
            select: {
              teamKey: true,
              managerNickname: true,
            },
          },
          league: {
            select: {
              isFinished: true,
            },
          },
        },
        orderBy: { season: 'desc' }
      })

      // Cache the data
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      }
      if (variant === 'light') {
        this.matchupLightCache = cacheEntry
      } else {
        this.matchupCache = cacheEntry
      }

      console.log(`✅ SharedTeamData.getAllMatchups(${variant}) fetched and cached ${data.length} matchups`)
      return data
    } catch (error) {
      console.error('❌ Error fetching matchup data:', error)

      // If we have stale data, return it as fallback
      const staleCache = variant === 'light' ? this.matchupLightCache : this.matchupCache
      if (staleCache) {
        console.warn('⚠️ Returning stale matchup data due to database error')
        return staleCache.data
      }

      // If no fallback data, return empty array
      console.warn('⚠️ No cached data available, returning empty array')
      return []
    }
  }
  
  private static isExpired(cache: CacheEntry<any>): boolean {
    return Date.now() - cache.timestamp > cache.ttl
  }
  
  static clearCache(): void {
    console.log('🗑️ SharedTeamData.clearCache() clearing all caches')
    this.teamCache = null
    this.matchupCache = null
    this.matchupLightCache = null
    this.teamDataPromise = null
    this.matchupDataPromise = null
    this.matchupLightDataPromise = null
  }

  static getCacheStats() {
    return {
      teamCache: this.teamCache ? {
        size: this.teamCache.data.length,
        age: Date.now() - this.teamCache.timestamp,
        expired: this.isExpired(this.teamCache)
      } : null,
      matchupCache: this.matchupCache ? {
        size: this.matchupCache.data.length,
        age: Date.now() - this.matchupCache.timestamp,
        expired: this.isExpired(this.matchupCache)
      } : null,
      matchupLightCache: this.matchupLightCache ? {
        size: this.matchupLightCache.data.length,
        age: Date.now() - this.matchupLightCache.timestamp,
        expired: this.isExpired(this.matchupLightCache)
      } : null,
      activePromises: {
        team: !!this.teamDataPromise,
        matchup: !!this.matchupDataPromise,
        matchupLight: !!this.matchupLightDataPromise
      }
    }
  }
}

