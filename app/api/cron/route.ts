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

    logger.info('Starting scheduled Yahoo data sync')

    const syncService = await getYahooSyncService()
    const result = await syncService.syncAllLeagues()

    logger.info('Scheduled Yahoo data sync completed', result)

    return NextResponse.json({
      success: true,
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
