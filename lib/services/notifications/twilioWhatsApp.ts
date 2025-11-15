import twilio from 'twilio'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'

export interface TwilioMessageResult {
  success: boolean
  messageSid?: string
  error?: string
}

export class TwilioWhatsAppClient {
  private client: twilio.Twilio | null = null
  private accountSid: string
  private authToken: string
  private whatsappNumber: string

  constructor() {
    this.accountSid = env.TWILIO_ACCOUNT_SID || ''
    this.authToken = env.TWILIO_AUTH_TOKEN || ''
    this.whatsappNumber = env.TWILIO_WHATSAPP_NUMBER || ''

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken)
    }
  }

  /**
   * Check if Twilio client is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.client &&
      this.accountSid &&
      this.authToken &&
      this.whatsappNumber
    )
  }

  /**
   * Check connection by attempting to fetch account info
   */
  async checkConnection(): Promise<boolean> {
    if (!this.client) {
      return false
    }

    try {
      await this.client.api.accounts(this.accountSid).fetch()
      return true
    } catch (error) {
      logger.error('Twilio connection check failed', error as Error)
      return false
    }
  }

  /**
   * Send a WhatsApp message to a group
   */
  async sendToGroup(
    groupId: string,
    message: string,
    retries: number = 3
  ): Promise<TwilioMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio client not configured. Check environment variables.',
      }
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized',
      }
    }

    // Validate group ID is not placeholder
    if (groupId === 'YOUR_GROUP_ID_HERE' || !groupId) {
      return {
        success: false,
        error: 'WhatsApp group ID not configured. Please set WHATSAPP_GROUP_ID environment variable.',
      }
    }

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.client.messages.create({
          from: this.whatsappNumber,
          to: groupId,
          body: message,
        })

        logger.info('Twilio message sent successfully', {
          messageSid: result.sid,
          to: groupId,
          attempt,
        })

        return {
          success: true,
          messageSid: result.sid,
        }
      } catch (error) {
        lastError = error as Error
        logger.warn(`Twilio send attempt ${attempt} failed`, {
          error: lastError.message,
          attempt,
          retries,
        })

        // Exponential backoff: wait 2^attempt seconds
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    logger.error('Twilio message send failed after retries', lastError as Error, {
      groupId,
      retries,
    })

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
    }
  }

  /**
   * Send a WhatsApp message (alias for sendToGroup for consistency)
   */
  async sendMessage(
    to: string,
    message: string,
    retries: number = 3
  ): Promise<TwilioMessageResult> {
    return this.sendToGroup(to, message, retries)
  }
}

