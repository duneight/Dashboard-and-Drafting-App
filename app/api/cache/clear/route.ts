import { NextRequest, NextResponse } from 'next/server'
import { SharedTeamData } from '@/lib/analytics/sharedData'

export async function POST(request: NextRequest) {
  try {
    SharedTeamData.clearCache()
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in cache clear route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}
