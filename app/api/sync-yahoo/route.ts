import { NextRequest, NextResponse } from 'next/server'
import { getYahooSyncService } from '@/lib/services/yahooSync'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'
import { env } from '@/lib/env'
import type { ApiResponse, SyncResponse } from '@/types/yahoo'
import type { SyncOptions } from '@/lib/services/yahooSync'

// A full sync spans many throttled Yahoo requests; without this it hits the
// platform default timeout mid-run. Clamped to the plan limit (Hobby 60s,
// Pro up to 300s).
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const limiter = rateLimit({ maxRequests: 5, windowMs: 60000 })

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    // Same gate as /api/cron: fail closed if the secret is unset so a
    // misconfigured deploy is loud, not silently open to anyone.
    if (!env.CRON_SECRET) {
      logger.error('CRON_SECRET is not configured; refusing to run manual sync')
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET not configured' } as ApiResponse,
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      logger.error('Unauthorized manual sync request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
