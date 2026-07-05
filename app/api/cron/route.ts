import { NextRequest, NextResponse } from 'next/server'
import { getYahooSyncService } from '@/lib/services/yahooSync'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import { getCurrentNhlSeason } from '@/lib/season'

// A full Yahoo sync spans many leagues with throttled requests and can take
// well over the platform default timeout. Without this the function is killed
// mid-sync and the cron "fails" silently. Vercel clamps to the plan limit
// (Hobby 60s, Pro up to 300s) — bump to 300 once on Pro.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Notify an external endpoint (Slack/Discord/healthchecks.io/etc.) when a sync
 * is unhealthy. No-op unless CRON_ALERT_WEBHOOK is set. Best-effort: never
 * throws, so an alerting failure can't mask the original result.
 */
async function sendAlert(payload: Record<string, unknown>) {
  const url = env.CRON_ALERT_WEBHOOK
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '⚠️ Keeper Tight cron sync unhealthy', ...payload }),
    })
  } catch (err) {
    logger.error('Failed to send cron alert webhook', err as Error)
  }
}

export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString()
  try {
    // Fail closed if the secret is unset so a misconfigured deploy is loud,
    // not silently open to anyone.
    if (!env.CRON_SECRET) {
      logger.error('CRON_SECRET is not configured; refusing to run cron')
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET not configured' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      logger.error('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentSeason = getCurrentNhlSeason()

    // Optional lever to re-sync data that smart caching would otherwise skip
    // (e.g. retroactively corrected past seasons). Configure in vercel.json as
    // "/api/cron?force=true" when needed; defaults to incremental.
    const forceRefresh = request.nextUrl.searchParams.get('force') === 'true'

    logger.info('Starting scheduled Yahoo data sync', { season: currentSeason, forceRefresh })

    const syncService = await getYahooSyncService()
    const result = await syncService.syncAllLeagues({
      mode: 'full',
      season: currentSeason,
      forceRefresh,
    })

    // syncAllLeagues records benign "skipping" messages (finished/recently
    // cached leagues) in the same errors[] array as real failures. Separate
    // them so a fully-cached run still counts as healthy while genuine
    // failures — including the "no leagues found" season-mismatch that caused
    // past silent outages — surface as a failed cron run.
    const skipped = result.errors.filter((e) => /skipping/i.test(e))
    const realErrors = result.errors.filter((e) => !/skipping/i.test(e))
    const hadActivity = result.leaguesProcessed > 0 || skipped.length > 0
    const healthy = hadActivity && realErrors.length === 0

    const summary = {
      season: currentSeason,
      forceRefresh,
      startedAt,
      finishedAt: new Date().toISOString(),
      leaguesProcessed: result.leaguesProcessed,
      teamsProcessed: result.teamsProcessed,
      matchupsProcessed: result.matchupsProcessed,
      skipped: skipped.length,
      realErrors,
    }

    if (!healthy) {
      // Non-2xx so Vercel marks the run as failed and sends its cron-failure
      // notification, instead of the old behaviour where a no-op looked OK.
      logger.error('Scheduled Yahoo data sync unhealthy', undefined, summary)
      await sendAlert(summary)
      return NextResponse.json({ success: false, ...summary }, { status: 500 })
    }

    logger.info('Scheduled Yahoo data sync completed', summary)
    return NextResponse.json({ success: true, ...summary })
  } catch (error) {
    logger.error('Error in cron route', error as Error)
    const summary = {
      startedAt,
      finishedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
    await sendAlert(summary)
    return NextResponse.json({ success: false, ...summary }, { status: 500 })
  }
}
