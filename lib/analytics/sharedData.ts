import { prisma } from '@/lib/db/prisma'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class SharedTeamData {
  private static teamCache: CacheEntry<any[]> | null = null
  private static matchupCache: CacheEntry<any[]> | null = null
  private static teamDataPromise: Promise<any[]> | null = null
  private static matchupDataPromise: Promise<any[]> | null = null
  
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
              numTeams: true
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
  
  static async getAllMatchups(): Promise<any[]> {
    // Check if we have valid cached data
    if (this.matchupCache && !this.isExpired(this.matchupCache)) {
      console.log(`📋 SharedTeamData.getAllMatchups() returning cached data (${this.matchupCache.data.length} matchups)`)
      return this.matchupCache.data
    }
    
    // If there's already a request in progress, wait for it
    if (this.matchupDataPromise) {
      console.log('⏳ SharedTeamData.getAllMatchups() waiting for existing request...')
      return await this.matchupDataPromise
    }
    
    // Start a new request and cache the promise
    console.log('🔄 SharedTeamData.getAllMatchups() starting new fetch...')
    this.matchupDataPromise = this.fetchMatchupData()
    
    try {
      const result = await this.matchupDataPromise
      return result
    } finally {
      // Clear the promise so future requests can start fresh
      this.matchupDataPromise = null
    }
  }
  
  private static async fetchMatchupData(): Promise<any[]> {
    try {
      const data = await prisma.matchup.findMany({
        select: {
          week: true,
          season: true,
          winnerTeamKey: true,
          isPlayoffs: true,
          team1Points: true,
          team2Points: true,
          team1Stats: true,
          team2Stats: true,
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
        },
        orderBy: { season: 'desc' }
      })
      
      // Cache the data
      this.matchupCache = {
        data,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      }
      
      console.log(`✅ SharedTeamData.getAllMatchups() fetched and cached ${data.length} matchups`)
      return data
    } catch (error) {
      console.error('❌ Error fetching matchup data:', error)
      
      // If we have stale data, return it as fallback
      if (this.matchupCache) {
        console.warn('⚠️ Returning stale matchup data due to database error')
        return this.matchupCache.data
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
    this.teamDataPromise = null
    this.matchupDataPromise = null
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
      activePromises: {
        team: !!this.teamDataPromise,
        matchup: !!this.matchupDataPromise
      }
    }
  }
}

