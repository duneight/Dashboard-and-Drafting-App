// Shared API-layer types. Prisma model types come from @prisma/client;
// the hand-written mirrors that used to live here drifted from the schema
// and had no importers, so they were removed.

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SyncResponse {
  leaguesProcessed: number
  teamsProcessed: number
  matchupsProcessed: number
  errors: string[]
}
