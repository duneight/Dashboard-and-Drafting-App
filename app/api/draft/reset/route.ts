// API route for resetting draft

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Try to import prisma, but handle gracefully if it fails
    let prisma
    try {
      const prismaModule = await import('@/lib/db/prisma')
      prisma = prismaModule.prisma
    } catch (prismaError) {
      console.log('Prisma not available, cannot reset database')
      return NextResponse.json(
        { success: false, error: 'Database not available for reset' },
        { status: 503 }
      )
    }
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Delete all picks and snapshots for the session
    await prisma.draftPick.deleteMany({
      where: { sessionId }
    })

    await prisma.draftSnapshot.deleteMany({
      where: { sessionId }
    })

    // Update session status
    await prisma.draftSession.update({
      where: { id: sessionId },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Draft reset successfully'
    })

  } catch (error) {
    console.error('Error resetting draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset draft' },
      { status: 500 }
    )
  }
}
