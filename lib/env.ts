import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  YAHOO_CLIENT_ID: z.string().min(1).optional(),
  YAHOO_CLIENT_SECRET: z.string().min(1).optional(),
  YAHOO_REFRESH_TOKEN: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NOTIFICATIONS_ENABLED: z.string().optional(),
  NOTIFICATION_THROTTLE_MAX: z.string().optional(),
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
  NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED,
  NOTIFICATION_THROTTLE_MAX: process.env.NOTIFICATION_THROTTLE_MAX,
}
