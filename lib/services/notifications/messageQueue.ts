import { logger } from '@/lib/logger'
import { TwilioWhatsAppClient, TwilioMessageResult } from './twilioWhatsApp'

export interface QueuedMessage {
  id: string
  groupId: string
  message: string
  priority: number // Higher priority messages sent first
  timestamp: number
}

export class MessageQueue {
  private queue: QueuedMessage[] = []
  private processing: boolean = false
  private twilioClient: TwilioWhatsAppClient
  private rateLimitMs: number = 1000 // 1 second between messages (Twilio limit)

  constructor(twilioClient: TwilioWhatsAppClient) {
    this.twilioClient = twilioClient
  }

  /**
   * Add a message to the queue
   */
  enqueue(
    groupId: string,
    message: string,
    priority: number = 0
  ): string {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const queuedMessage: QueuedMessage = {
      id,
      groupId,
      message,
      priority,
      timestamp: Date.now(),
    }

    this.queue.push(queuedMessage)
    // Sort by priority (higher first), then by timestamp
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.timestamp - b.timestamp
    })

    logger.debug('Message enqueued', { id, priority, queueLength: this.queue.length })

    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue().catch((error) => {
        logger.error('Error processing message queue', error as Error)
      })
    }

    return id
  }

  /**
   * Process the message queue with rate limiting
   */
  async processQueue(): Promise<void> {
    if (this.processing) {
      return
    }

    this.processing = true
    logger.info('Starting message queue processing', { queueLength: this.queue.length })

    const results: Array<{ id: string; result: TwilioMessageResult }> = []

    while (this.queue.length > 0) {
      const message = this.queue.shift()
      if (!message) {
        break
      }

      try {
        const result = await this.twilioClient.sendToGroup(
          message.groupId,
          message.message
        )

        results.push({ id: message.id, result })

        if (result.success) {
          logger.debug('Message sent successfully', {
            id: message.id,
            messageSid: result.messageSid,
          })
        } else {
          logger.warn('Message send failed', {
            id: message.id,
            error: result.error,
          })
        }

        // Rate limiting: wait before next message (except for last one)
        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs))
        }
      } catch (error) {
        logger.error('Error sending queued message', error as Error, {
          id: message.id,
        })
        results.push({
          id: message.id,
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })
      }
    }

    this.processing = false
    logger.info('Message queue processing completed', {
      totalProcessed: results.length,
      successful: results.filter((r) => r.result.success).length,
      failed: results.filter((r) => !r.result.success).length,
    })
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Check if queue is processing
   */
  isProcessing(): boolean {
    return this.processing
  }

  /**
   * Clear the queue (use with caution)
   */
  clear(): void {
    this.queue = []
    logger.warn('Message queue cleared')
  }
}

