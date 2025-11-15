import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import { NotificationDetector, DetectedChange } from './notificationDetector'
import { MessageFormatter, FormattedMessage } from './messageFormatter'
import { MessageQueue } from './messageQueue'
import { TwilioWhatsAppClient } from './twilioWhatsApp'
import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame'
import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { SharedTeamData } from '@/lib/analytics/sharedData'
import { HALL_OF_FAME_CATEGORIES, WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'
import { WeeklyDataAggregator } from './weeklyDataAggregator'
import { AISummaryGenerator } from './aiSummaryGenerator'

export interface NotificationResult {
  success: boolean
  changesDetected: number
  messagesSent: number
  aiSummarySent: boolean
  errors: string[]
}

export class NotificationService {
  private detector: NotificationDetector
  private formatter: MessageFormatter
  private twilioClient: TwilioWhatsAppClient
  private messageQueue: MessageQueue
  private weeklyAggregator: WeeklyDataAggregator
  private aiGenerator: AISummaryGenerator
  private dryRun: boolean
  private throttleMax: number

  constructor() {
    this.detector = new NotificationDetector()
    this.formatter = new MessageFormatter()
    this.twilioClient = new TwilioWhatsAppClient()
    this.messageQueue = new MessageQueue(this.twilioClient)
    this.weeklyAggregator = new WeeklyDataAggregator()
    this.aiGenerator = new AISummaryGenerator()
    this.dryRun = env.DRY_RUN === 'true'
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
      const { teams, matchups } = await Promise.all([
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
    messageSid?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          type,
          message,
          success,
          errorMessage,
          messageSid,
          metadata: metadata || {},
        },
      })
    } catch (error) {
      // Don't fail if logging fails, but log the error
      logger.warn('Error logging notification', { error })
    }
  }

  /**
   * Check if it's the day to send AI summary
   */
  private isSummaryDay(): boolean {
    if (env.AI_SUMMARIES_ENABLED !== 'true') {
      return false
    }

    const summaryDay = (env.AI_SUMMARY_DAY || 'monday').toLowerCase()
    const timezone = env.AI_SUMMARY_TIMEZONE || 'UTC'

    // Get current day in specified timezone
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    // Simple UTC-based check (for more accuracy, use a timezone library)
    const currentDay = dayNames[now.getUTCDay()]
    
    return currentDay === summaryDay
  }

  /**
   * Send AI weekly summary if enabled and it's the right day
   */
  private async sendAISummary(groupId: string): Promise<boolean> {
    if (!this.aiGenerator.isConfigured() || !this.isSummaryDay()) {
      return false
    }

    try {
      logger.info('Generating AI weekly summary')
      const weeklyData = await this.weeklyAggregator.aggregateWeeklyData()

      if (!weeklyData.matchups || weeklyData.matchups.length === 0) {
        logger.warn('No matchups data for AI summary, skipping')
        return false
      }

      const result = await this.aiGenerator.generateWeeklySummary(weeklyData)

      if (!result.success || !result.summary) {
        logger.warn('AI summary generation failed, using fallback', { error: result.error })
        // Use fallback summary
        const fallback = this.aiGenerator.generateFallbackSummary(weeklyData)
        
        if (this.dryRun) {
          logger.info('DRY RUN: Would send AI summary (fallback)', {
            length: fallback.length,
          })
          return true
        }

        const sendResult = await this.twilioClient.sendToGroup(groupId, fallback)
        if (sendResult.success) {
          await this.logNotification(
            'weekly-summary',
            fallback,
            true,
            undefined,
            sendResult.messageSid,
            { isFallback: true }
          )
          return true
        }
        return false
      }

      // Split summary if too long
      const maxLength = 1600
      const summary = result.summary
      let messagesToSend: string[] = []

      if (summary.length <= maxLength) {
        messagesToSend = [summary]
      } else {
        // Split into multiple messages
        const parts = Math.ceil(summary.length / maxLength)
        for (let i = 0; i < parts; i++) {
          const start = i * maxLength
          const end = Math.min(start + maxLength, summary.length)
          const part = summary.substring(start, end)
          messagesToSend.push(`${part}\n\n[Part ${i + 1}/${parts}]`)
        }
      }

      if (this.dryRun) {
        logger.info('DRY RUN: Would send AI summary', {
          parts: messagesToSend.length,
          tokensUsed: result.tokensUsed,
        })
        return true
      }

      // Send all parts
      let allSuccess = true
      for (let i = 0; i < messagesToSend.length; i++) {
        const sendResult = await this.twilioClient.sendToGroup(groupId, messagesToSend[i])
        if (sendResult.success) {
          await this.logNotification(
            'weekly-summary',
            messagesToSend[i],
            true,
            undefined,
            sendResult.messageSid,
            {
              part: i + 1,
              totalParts: messagesToSend.length,
              tokensUsed: result.tokensUsed,
            }
          )
          // Wait between parts
          if (i < messagesToSend.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } else {
          allSuccess = false
          await this.logNotification('weekly-summary', messagesToSend[i], false, sendResult.error)
        }
      }

      logger.info('AI summary sent successfully', {
        parts: messagesToSend.length,
        tokensUsed: result.tokensUsed,
      })

      return allSuccess
    } catch (error) {
      logger.error('Error sending AI summary', error as Error)
      return false
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
        aiSummarySent: false,
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
        aiSummarySent: false,
        errors: ['Season is inactive'],
      }
    }

    // Check Twilio configuration
    if (!this.twilioClient.isConfigured()) {
      const error = 'Twilio not configured. Check environment variables.'
      logger.warn(error)
      return {
        success: false,
        changesDetected: 0,
        messagesSent: 0,
        aiSummarySent: false,
        errors: [error],
      }
    }

    const groupId = env.WHATSAPP_GROUP_ID || ''
    if (!groupId || groupId === 'YOUR_GROUP_ID_HERE') {
      const error = 'WhatsApp group ID not configured'
      logger.warn(error)
      return {
        success: false,
        changesDetected: 0,
        messagesSent: 0,
        aiSummarySent: false,
        errors: [error],
      }
    }

    const syncTimestamp = new Date().toISOString()
    const errors: string[] = []
    let changesDetected = 0
    let messagesSent = 0
    let aiSummarySent = false

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
          aiSummarySent: false,
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
          aiSummarySent: false,
          errors: ['No messages could be formatted'],
        }
      }

      // Send messages
      if (this.dryRun) {
        logger.info('DRY RUN: Would send messages', {
          count: formattedMessages.length,
          messages: formattedMessages.map((m) => m.text.substring(0, 100) + '...'),
        })
        messagesSent = formattedMessages.length
      } else {
        for (const msg of formattedMessages) {
          try {
            const result = await this.twilioClient.sendToGroup(groupId, msg.text)
            if (result.success) {
              messagesSent++
              await this.logNotification(
                'record-change',
                msg.text,
                true,
                undefined,
                result.messageSid,
                { changesDetected, priority: msg.priority }
              )
            } else {
              errors.push(result.error || 'Unknown error sending message')
              await this.logNotification('record-change', msg.text, false, result.error)
            }
            // Rate limiting: wait 1 second between messages
            if (formattedMessages.length > 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            errors.push(errorMsg)
            await this.logNotification('record-change', msg.text, false, errorMsg)
            logger.error('Error sending notification message', error as Error)
          }
        }
      }

      // Save snapshots AFTER successful sends (transaction safety)
      if (messagesSent > 0 || this.dryRun) {
        try {
          const season = new Date().getFullYear().toString()
          await this.saveSnapshots(syncTimestamp, season)
        } catch (error) {
          const errorMsg = 'Failed to save snapshots after sending notifications'
          errors.push(errorMsg)
          logger.error(errorMsg, error as Error)
        }
      }

      // Send AI summary if enabled and it's the right day
      if (env.AI_SUMMARIES_ENABLED === 'true') {
        try {
          aiSummarySent = await this.sendAISummary(groupId)
        } catch (error) {
          logger.error('Error sending AI summary (non-fatal)', error as Error)
          errors.push(`AI summary error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      logger.info('Notification sending completed', {
        syncTimestamp,
        changesDetected,
        messagesSent,
        aiSummarySent,
        errors: errors.length,
      })

      return {
        success: errors.length === 0,
        changesDetected,
        messagesSent,
        aiSummarySent,
        errors,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error in notification service', error as Error, { syncTimestamp })
      return {
        success: false,
        changesDetected,
        messagesSent,
        aiSummarySent: false,
        errors: [errorMsg],
      }
    }
  }
}

