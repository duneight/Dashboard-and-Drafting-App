// API route for exporting draft data

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Try to import prisma, but handle gracefully if it fails
    let prisma
    try {
      const prismaModule = await import('@/lib/db/prisma')
      prisma = prismaModule.prisma
    } catch (prismaError) {
      console.log('Prisma not available, cannot export from database')
      return NextResponse.json(
        { success: false, error: 'Database not available for export' },
        { status: 503 }
      )
    }
    const body = await request.json()
    const { sessionId, format = 'json' } = body

    // Get draft session with picks
    const session = await prisma.draftSession.findUnique({
      where: { id: sessionId },
      include: {
        picks: {
          where: { playerName: { not: null } },
          orderBy: { pick: 'asc' }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Draft session not found' },
        { status: 404 }
      )
    }

    const settings = JSON.parse(session.settings)

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Pick', 'Round', 'Team', 'Player', 'Rank', 'Team', 'Position', 'Avg Pick', 'Picked At']
      const rows = session.picks.map((pick: any) => [
        pick.pick,
        pick.round,
        pick.teamName,
        pick.playerName,
        pick.playerRank,
        pick.playerTeam,
        pick.playerPosition,
        pick.averagePick,
        pick.pickedAt?.toISOString()
      ])
      
      const csvContent = [headers, ...rows]
        .map((row: any) => row.map((cell: any) => `"${cell || ''}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="draft-export-${session.year}.csv"`
        }
      })
    } else {
      // Generate JSON
      const exportData = {
        session: {
          id: session.id,
          year: session.year,
          status: session.status,
          settings
        },
        picks: session.picks.map((pick: any) => ({
          pick: pick.pick,
          round: pick.round,
          teamName: pick.teamName,
          playerName: pick.playerName,
          playerRank: pick.playerRank,
          playerTeam: pick.playerTeam,
          playerPosition: pick.playerPosition,
          averagePick: pick.averagePick,
          pickedAt: pick.pickedAt?.toISOString()
        })),
        exportedAt: new Date().toISOString()
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="draft-export-${session.year}.json"`
        }
      })
    }

  } catch (error) {
    console.error('Error exporting draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export draft' },
      { status: 500 }
    )
  }
}
