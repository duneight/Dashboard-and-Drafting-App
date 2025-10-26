import { NextRequest, NextResponse } from 'next/server'
import { SharedTeamData } from '@/lib/analytics/sharedData'

export async function GET(request: NextRequest) {
  try {
    const cacheStats = SharedTeamData.getCacheStats()
    
    // Try to fetch data to see current status
    const [teams, matchups] = await Promise.all([
      SharedTeamData.getAllTeams(),
      SharedTeamData.getAllMatchups()
    ])
    
    return NextResponse.json({
      success: true,
      cache: cacheStats,
      data: {
        teams: {
          count: teams.length,
          sample: teams.slice(0, 2) // First 2 teams for debugging
        },
        matchups: {
          count: matchups.length,
          sample: matchups.slice(0, 2) // First 2 matchups for debugging
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in debug cache route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      cache: SharedTeamData.getCacheStats(),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
