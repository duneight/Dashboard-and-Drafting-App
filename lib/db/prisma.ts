import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client Singleton
 * 
 * Connection Strategy:
 * - Uses DATABASE_URL from environment (Transaction Pooler for production)
 * - This client is used for all application database queries
 * - Connection pooling is handled by Supabase Transaction Pooler (port 6543)
 * 
 * For Migrations:
 * - Prisma Migrate uses DIRECT_URL separately (configured in schema.prisma)
 * - DIRECT_URL must use Session Pooler (port 5432) or Direct Database
 * - Migrations cannot use Transaction Pooler (port 6543)
 * 
 * See: prisma/schema.prisma for connection configuration details
 * See: docs/DATABASE_CONNECTIONS.md for troubleshooting
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
