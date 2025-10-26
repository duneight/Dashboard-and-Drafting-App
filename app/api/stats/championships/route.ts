import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { rateLimit } from '@/lib/rateLimit'

const limiter = rateLimit({ maxRequests: 30, windowMs: 60000 })

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    // Get all champions (teams with rank = 1)
    const champions = await prisma.team.findMany({
      where: {
        rank: 1,
      },
      select: {
        managerNickname: true,
        season: true,
      },
    })

    // Count unique championships
    const championshipCount = champions.length

    // Get unique managers who have won championships
    const championManagers = new Set(
      champions.map(c => c.managerNickname).filter(Boolean)
    )

    return NextResponse.json({
      success: true,
      data: {
        totalChampionships: championshipCount,
        uniqueChampions: championManagers.size,
        champions: Array.from(championManagers),
      },
    })
  } catch (error) {
    console.error('Error in championships route:', error)
    
    // Return empty data instead of error when database is unavailable
    return NextResponse.json({
      success: true,
      data: {
        totalChampionships: 0,
        uniqueChampions: 0,
        champions: [],
      },
    })
  }
}
