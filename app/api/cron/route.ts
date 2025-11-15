import { NextRequest, NextResponse } from 'next/server'
import { getYahooSyncService } from '@/lib/services/yahooSync'
import { NotificationService } from '@/lib/services/notifications/notificationService'
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
    const currentSeason = new Date().getFullYear().toString()
    logger.info('Starting scheduled Yahoo data sync', { season: currentSeason })

    const syncService = await getYahooSyncService()
    const result = await syncService.syncAllLeagues({
      mode: 'full',
      season: currentSeason,
      forceRefresh: false // Let smart caching handle incremental updates
    })

    logger.info('Scheduled Yahoo data sync completed', result)

    // Send notifications if enabled (after successful sync)
    let notificationResult = null
    if (env.NOTIFICATIONS_ENABLED === 'true') {
      try {
        logger.info('Sending notifications after sync')
        const notificationService = new NotificationService()
        notificationResult = await notificationService.sendNotifications(result)
        logger.info('Notification sending completed', notificationResult)
      } catch (error) {
        // Don't fail the cron job if notifications fail
        logger.error('Error sending notifications (non-fatal)', error as Error)
        notificationResult = {
          success: false,
          changesDetected: 0,
          messagesSent: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        }
      }
    } else {
      logger.info('Notifications disabled, skipping')
    }

    return NextResponse.json({
      success: true,
      season: currentSeason,
      timestamp: new Date().toISOString(),
      ...result,
      notifications: notificationResult,
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
