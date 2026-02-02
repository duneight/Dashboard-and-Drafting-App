import { NextRequest, NextResponse } from 'next/server'
import { getYahooSyncService } from '@/lib/services/yahooSync'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const authHeader = request.headers.get('authorization')

    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      logger.error('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically determine current season (future-proof: 2025, 2026, etc.)
    // NHL seasons start in October, so Jan-Sept = previous year's season
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // 0-indexed: 0=Jan, 9=Oct
    const currentSeason = (month < 9 ? year - 1 : year).toString()
    logger.info('Starting scheduled Yahoo data sync', { season: currentSeason })

    const syncService = await getYahooSyncService()
    const result = await syncService.syncAllLeagues({
      mode: 'full',
      season: currentSeason,
      forceRefresh: false // Let smart caching handle incremental updates
    })

    logger.info('Scheduled Yahoo data sync completed', result)

    return NextResponse.json({
      success: true,
      season: currentSeason,
      timestamp: new Date().toISOString(),
      ...result,
    })

  } catch (error) {
    logger.error('Error in cron route', error as Error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
