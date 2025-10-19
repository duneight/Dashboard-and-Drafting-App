import { z } from 'zod'
import { NextResponse } from 'next/server'

export const syncRequestSchema = z.object({
  forceRefresh: z.boolean().optional()
})

export const draftSaveSchema = z.object({
  picks: z.array(z.object({
    round: z.number(),
    pick: z.number(),
    teamIndex: z.number(),
    player: z.object({
      id: z.string(),
      name: z.string(),
      position: z.string(),
      team: z.string()
    }).nullable()
  }))
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; response: NextResponse } {
  
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }
  }
  
  return { success: true, data: result.data }
}

