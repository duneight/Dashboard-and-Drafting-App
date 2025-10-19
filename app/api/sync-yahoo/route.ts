import { NextRequest, NextResponse } from 'next/server'
import { getYahooSyncService } from '@/lib/services/yahooSync'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'
import type { ApiResponse, SyncResponse } from '@/types/yahoo'

const limiter = rateLimit({ maxRequests: 5, windowMs: 60000 })

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    logger.info('Starting Yahoo data sync')
    
    const syncService = await getYahooSyncService()
    const response = await syncService.syncAllLeagues()

    logger.info('Yahoo data sync completed', response)

    return NextResponse.json({
      success: true,
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
