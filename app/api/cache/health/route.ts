import { NextRequest, NextResponse } from 'next/server'
import { SharedTeamData } from '@/lib/analytics/sharedData'

export async function GET(request: NextRequest) {
  try {
    const cacheStats = SharedTeamData.getCacheStats()
    
    return NextResponse.json({
      success: true,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in cache health route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}
