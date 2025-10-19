// API route for loading draft state

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Try to import prisma, but handle gracefully if it fails
    let prisma
    try {
      const prismaModule = await import('@/lib/db/prisma')
      prisma = prismaModule.prisma
    } catch (prismaError) {
      console.log('Prisma not available, returning empty state')
      return NextResponse.json({
        success: true,
        data: {
          picks: [],
          selectedPlayers: [],
          sessionId: null
        }
      })
    }
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    // Get draft session
    const session = await prisma.draftSession.findFirst({
      where: sessionId ? { id: sessionId } : { year: '2025' },
      include: {
        picks: {
          orderBy: { pick: 'asc' }
        },
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          picks: [],
          selectedPlayers: [],
          sessionId: null
        }
      })
    }

    // Convert picks to frontend format
    const picks = session.picks.map((pick: any) => ({
      pick: pick.pick,
      round: pick.round,
      teamIndex: pick.teamIndex,
      teamName: pick.teamName,
      playerName: pick.playerName,
      playerRank: pick.playerRank,
      playerTeam: pick.playerTeam,
      playerPosition: pick.playerPosition,
      averagePick: pick.averagePick,
      pickedAt: pick.pickedAt?.toISOString()
    }))

    // Get selected players
    const selectedPlayers = picks
      .filter((pick: any) => pick.playerName)
      .map((pick: any) => pick.playerName!)

    return NextResponse.json({
      success: true,
      data: {
        picks,
        selectedPlayers,
        sessionId: session.id,
        settings: JSON.parse(session.settings)
      }
    })

  } catch (error) {
    console.error('Error loading draft state:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load draft state' },
      { status: 500 }
    )
  }
}
