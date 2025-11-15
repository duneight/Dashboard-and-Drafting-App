import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  YAHOO_CLIENT_ID: z.string().min(1).optional(),
  YAHOO_CLIENT_SECRET: z.string().min(1).optional(),
  YAHOO_REFRESH_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  // Twilio WhatsApp
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1).optional(),
  WHATSAPP_GROUP_ID: z.string().min(1).optional(),
  NOTIFICATIONS_ENABLED: z.string().optional(),
  DRY_RUN: z.string().optional(),
  NOTIFICATION_THROTTLE_MAX: z.string().optional(),
  // OpenAI (for AI summaries - Phase 2)
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().optional(),
  AI_SUMMARIES_ENABLED: z.string().optional(),
  AI_SUMMARY_DAY: z.string().optional(),
  AI_SUMMARY_TIMEZONE: z.string().optional(),
})

// During build time, environment variables may not be available
// Use safeParse to avoid build failures
const envResult = envSchema.safeParse(process.env)

export const env = envResult.success ? envResult.data : {
  DATABASE_URL: process.env.DATABASE_URL,
  YAHOO_CLIENT_ID: process.env.YAHOO_CLIENT_ID,
  YAHOO_CLIENT_SECRET: process.env.YAHOO_CLIENT_SECRET,
  YAHOO_REFRESH_TOKEN: process.env.YAHOO_REFRESH_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  // Twilio WhatsApp
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
  WHATSAPP_GROUP_ID: process.env.WHATSAPP_GROUP_ID,
  NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED,
  DRY_RUN: process.env.DRY_RUN,
  NOTIFICATION_THROTTLE_MAX: process.env.NOTIFICATION_THROTTLE_MAX,
  // OpenAI (for AI summaries - Phase 2)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  AI_SUMMARIES_ENABLED: process.env.AI_SUMMARIES_ENABLED,
  AI_SUMMARY_DAY: process.env.AI_SUMMARY_DAY,
  AI_SUMMARY_TIMEZONE: process.env.AI_SUMMARY_TIMEZONE,
}
