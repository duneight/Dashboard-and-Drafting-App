import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import { NotificationDetector, DetectedChange } from './notificationDetector'
import { MessageFormatter, FormattedMessage } from './messageFormatter'
import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame'
import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { SharedTeamData } from '@/lib/analytics/sharedData'
import { HALL_OF_FAME_CATEGORIES, WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'

export interface NotificationResult {
  success: boolean
  changesDetected: number
  messagesSent: number
  errors: string[]
}

export class NotificationService {
  private detector: NotificationDetector
  private formatter: MessageFormatter
  private throttleMax: number

  constructor() {
    this.detector = new NotificationDetector()
    this.formatter = new MessageFormatter()
    this.throttleMax = parseInt(env.NOTIFICATION_THROTTLE_MAX || '10', 10)
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return env.NOTIFICATIONS_ENABLED === 'true'
  }

  /**
   * Check if season is active (not off-season)
   */
  async isSeasonActive(): Promise<boolean> {
    try {
      const games = await prisma.game.findMany({
        where: {
          isOffseason: false,
        },
        take: 1,
      })
      return games.length > 0
    } catch (error) {
      logger.warn('Error checking season status, assuming active', { error })
      return true // Default to active if check fails
    }
  }

  /**
   * Save current records as snapshots
   */
  private async saveSnapshots(
    syncTimestamp: string,
    season: string
  ): Promise<void> {
    try {
      const [teams, matchups] = await Promise.all([
        SharedTeamData.getAllTeams(),
        SharedTeamData.getAllMatchups(),
      ])

      const hallOfFameAnalytics = new HallOfFameAnalytics()
      const wallOfShameAnalytics = new WallOfShameAnalytics()

      const snapshots: Array<{
        categoryId: string
        categoryType: string
        manager: string
        value: string
        rank: number
        season: string
        syncTimestamp: string
      }> = []

      // Fetch and save Hall of Fame categories
      for (const category of HALL_OF_FAME_CATEGORIES) {
        try {
          let entries: any[] = []
          switch (category.id) {
            case 'dynasty-king':
              entries = await hallOfFameAnalytics.getDynastyKing(teams)
              break
            case 'point-titan':
              entries = await hallOfFameAnalytics.getPointTitan(teams)
              break
            case 'the-consistent':
              entries = await hallOfFameAnalytics.getTheConsistent(teams)
              break
            case 'playoff-warrior':
              entries = await hallOfFameAnalytics.getPlayoffWarrior(matchups)
              break
            case 'goal-machine':
              entries = await hallOfFameAnalytics.getGoalMachine(matchups)
              break
            case 'iron-wall':
              entries = await hallOfFameAnalytics.getIronWall(matchups)
              break
            case 'shutout-king':
              entries = await hallOfFameAnalytics.getShutoutKing(matchups)
              break
            case 'the-playmaker':
              entries = await hallOfFameAnalytics.getThePlaymaker(matchups)
              break
            case 'season-dominator':
              entries = await hallOfFameAnalytics.getSeasonDominator(teams)
              break
            case 'weekly-explosion':
              entries = await hallOfFameAnalytics.getWeeklyExplosion(matchups)
              break
            case 'unstoppable':
              entries = await hallOfFameAnalytics.getUnstoppable(matchups)
              break
            case 'close-game-specialist':
              entries = await hallOfFameAnalytics.getCloseGameSpecialist(matchups)
              break
          }

          for (const entry of entries.slice(0, 3)) {
            snapshots.push({
              categoryId: category.id,
              categoryType: 'hall-of-fame',
              manager: entry.manager,
              value: entry.value?.toString() || '',
              rank: entry.rank,
              season,
              syncTimestamp,
            })
          }
        } catch (error) {
          logger.warn(`Error saving snapshot for category ${category.id}`, { error })
        }
      }

      // Fetch and save Wall of Shame categories
      for (const category of WALL_OF_SHAME_CATEGORIES) {
        try {
          let entries: any[] = []
          switch (category.id) {
            case 'eternal-last':
              entries = await wallOfShameAnalytics.getEternalLast(teams)
              break
            case 'playoff-choker':
              entries = await wallOfShameAnalytics.getPlayoffChoker(matchups, teams)
              break
            case 'close-but-no-cigar':
              entries = await wallOfShameAnalytics.getCloseButNoCigar(teams)
              break
            case 'rock-bottom':
              entries = await wallOfShameAnalytics.getRockBottom(teams)
              break
            case 'the-collapse':
              entries = await wallOfShameAnalytics.getTheCollapse(matchups)
              break
            case 'brick-hands':
              entries = await wallOfShameAnalytics.getBrickHands(teams)
              break
            case 'the-heartbreak':
              entries = await wallOfShameAnalytics.getTheHeartbreak(matchups)
              break
            case 'glass-cannon':
              entries = await wallOfShameAnalytics.getGlassCannon(teams)
              break
            case 'the-snooze':
              entries = await wallOfShameAnalytics.getTheSnooze(matchups)
              break
          }

          for (const entry of entries.slice(0, 3)) {
            snapshots.push({
              categoryId: category.id,
              categoryType: 'wall-of-shame',
              manager: entry.manager,
              value: entry.value?.toString() || '',
              rank: entry.rank,
              season,
              syncTimestamp,
            })
          }
        } catch (error) {
          logger.warn(`Error saving snapshot for category ${category.id}`, { error })
        }
      }

      // Save all snapshots in a transaction
      await prisma.recordSnapshot.createMany({
        data: snapshots,
        skipDuplicates: true,
      })

      logger.info('Snapshots saved successfully', {
        syncTimestamp,
        season,
        count: snapshots.length,
      })
    } catch (error) {
      logger.error('Error saving snapshots', error as Error, { syncTimestamp, season })
      throw error
    }
  }

  /**
   * Log a notification to the database
   */
  private async logNotification(
    type: 'record-change' | 'weekly-summary',
    message: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          type,
          message,
          success,
          errorMessage,
          metadata: metadata || {},
        },
      })
    } catch (error) {
      // Don't fail if logging fails, but log the error
      logger.warn('Error logging notification', { error })
    }
  }

  /**
   * Send notifications for detected changes
   */
  async sendNotifications(syncResult?: any): Promise<NotificationResult> {
    if (!this.isEnabled()) {
      logger.info('Notifications disabled, skipping')
      return {
        success: true,
        changesDetected: 0,
        messagesSent: 0,
        errors: [],
      }
    }

    // Check if season is active
    const isActive = await this.isSeasonActive()
    if (!isActive) {
      logger.info('Season is inactive (off-season), skipping notifications')
      return {
        success: true,
        changesDetected: 0,
        messagesSent: 0,
        errors: ['Season is inactive'],
      }
    }

    const syncTimestamp = new Date().toISOString()
    const errors: string[] = []
    let changesDetected = 0
    let messagesSent = 0

    try {
      // Detect changes
      logger.info('Detecting record changes', { syncTimestamp })
      const changes = await this.detector.detectChanges(syncTimestamp)
      changesDetected = changes.length

      if (changes.length === 0) {
        logger.info('No changes detected, skipping notifications')
        return {
          success: true,
          changesDetected: 0,
          messagesSent: 0,
          errors: [],
        }
      }

      // Throttle if too many changes
      const limitedChanges = changes.slice(0, this.throttleMax)
      if (changes.length > this.throttleMax) {
        logger.warn('Too many changes detected, throttling', {
          total: changes.length,
          limited: this.throttleMax,
        })
        errors.push(`Throttled: ${changes.length} changes detected, only sending top ${this.throttleMax}`)
      }

      // Format messages
      const formattedMessages = this.formatter.formatChanges(limitedChanges, this.throttleMax)

      if (formattedMessages.length === 0) {
        logger.warn('No messages formatted from changes')
        return {
          success: true,
          changesDetected,
          messagesSent: 0,
          errors: ['No messages could be formatted'],
        }
      }

      // Log formatted messages (no actual sending)
      logger.info('Formatted messages for notifications', {
        count: formattedMessages.length,
        messages: formattedMessages.map((m) => m.text.substring(0, 100) + '...'),
      })
      messagesSent = formattedMessages.length

      // Log each message
      for (const msg of formattedMessages) {
        await this.logNotification(
          'record-change',
          msg.text,
          true,
          undefined,
          { changesDetected, priority: msg.priority }
        )
      }

      // Save snapshots after detecting changes
      if (messagesSent > 0) {
        try {
          const season = new Date().getFullYear().toString()
          await this.saveSnapshots(syncTimestamp, season)
        } catch (error) {
          const errorMsg = 'Failed to save snapshots after detecting notifications'
          errors.push(errorMsg)
          logger.error(errorMsg, error as Error)
        }
      }

      logger.info('Notification detection completed', {
        syncTimestamp,
        changesDetected,
        messagesSent,
        errors: errors.length,
      })

      return {
        success: errors.length === 0,
        changesDetected,
        messagesSent,
        errors,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error in notification service', error as Error, { syncTimestamp })
      return {
        success: false,
        changesDetected,
        messagesSent,
        errors: [errorMsg],
      }
    }
  }
}

