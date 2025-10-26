import { NextRequest, NextResponse } from 'next/server'
import { getYahooSyncService } from '@/lib/services/yahooSync'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'
import type { ApiResponse, SyncResponse } from '@/types/yahoo'
import type { SyncOptions } from '@/lib/services/yahooSync'

const limiter = rateLimit({ maxRequests: 5, windowMs: 60000 })

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('mode') as 'full' | 'test' | 'single' | null
    const leagueKey = searchParams.get('leagueKey')
    const season = searchParams.get('season')
    const seasons = searchParams.get('seasons') // Comma-separated seasons
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    // Parse seasons if provided
    const seasonsArray = seasons ? seasons.split(',').map(s => s.trim()) : undefined

    const syncOptions: SyncOptions = {
      mode: mode || 'full',
      leagueKey: leagueKey || undefined,
      season: season || undefined,
      seasons: seasonsArray,
      forceRefresh: forceRefresh || false
    }

    logger.info('Starting Yahoo data sync', syncOptions)
    
    const syncService = await getYahooSyncService()
    const response = await syncService.syncAllLeagues(syncOptions)

    logger.info('Yahoo data sync completed', response)

    return NextResponse.json({
      success: true,
      mode: syncOptions.mode,
      data: response,
      message: `Sync completed: ${response.leaguesProcessed} leagues, ${response.teamsProcessed} teams, ${response.matchupsProcessed} matchups processed`,
    } as ApiResponse<SyncResponse>)

  } catch (error) {
    logger.error('Error in sync-yahoo route', error as Error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse, { status: 500 })
  }
}
