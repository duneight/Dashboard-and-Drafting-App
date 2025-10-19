// API route for saving draft state

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Try to import prisma, but handle gracefully if it fails
    let prisma
    try {
      const prismaModule = await import('@/lib/db/prisma')
      prisma = prismaModule.prisma
    } catch (prismaError) {
      console.log('Prisma not available, skipping database save')
      return NextResponse.json({
        success: true,
        message: 'Draft state saved to localStorage only'
      })
    }
    const body = await request.json()
    const { picks, selectedPlayers, sessionId } = body

    // Get or create draft session
    let session
    if (sessionId) {
      session = await prisma.draftSession.findUnique({
        where: { id: sessionId }
      })
    }

    if (!session) {
      session = await prisma.draftSession.create({
        data: {
          year: '2025',
          status: 'active',
          settings: JSON.stringify({
            teams: 10,
            numRounds: 25,
            owners: [
              'Luke (1st)', 'Dinesh (2nd)', 'Glis (3rd)', 'Toph (4th)', 
              'Geoff (5th)', 'Whidds (6th)', 'Dooger (7th)', 'Bendy (8th)', 
              'Blake (9th)', 'Deke (10th)'
            ]
          })
        }
      })
    }

    // Delete existing picks for this session
    await prisma.draftPick.deleteMany({
      where: { sessionId: session.id }
    })

    // Create new picks
    const draftPicks = picks.map((pick: any) => ({
      pick: pick.pick,
      round: pick.round,
      teamIndex: pick.teamIndex,
      teamName: pick.teamName,
      playerName: pick.playerName,
      playerRank: pick.playerRank,
      playerTeam: pick.playerTeam,
      playerPosition: pick.playerPosition,
      averagePick: pick.averagePick,
      pickedAt: pick.pickedAt ? new Date(pick.pickedAt) : new Date(),
      sessionId: session.id
    }))

    await prisma.draftPick.createMany({
      data: draftPicks
    })

    // Save snapshot for undo/redo
    await prisma.draftSnapshot.create({
      data: {
        snapshotData: JSON.stringify({
          picks,
          selectedPlayers: Array.from(selectedPlayers)
        }),
        description: 'Auto-save snapshot',
        sessionId: session.id
      }
    })

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      message: 'Draft state saved successfully' 
    })

  } catch (error) {
    console.error('Error saving draft state:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save draft state' },
      { status: 500 }
    )
  }
}
