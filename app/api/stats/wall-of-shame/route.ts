import { NextRequest, NextResponse } from 'next/server'
import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { SharedTeamData } from '@/lib/analytics/sharedData'
import { WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'
import { rateLimit } from '@/lib/rateLimit'

const limiter = rateLimit({ maxRequests: 30, windowMs: 60000 })

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9)
  console.log(`🔄 [${requestId}] Wall of Shame API called`)
  
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) {
      console.log(`⚠️ [${requestId}] Wall of Shame rate limited`)
      return rateLimitResult
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const analytics = new WallOfShameAnalytics()

    // If specific category requested
    if (category) {
      const categoryConfig = WALL_OF_SHAME_CATEGORIES.find(c => c.id === category)
      if (!categoryConfig) {
        return NextResponse.json({
          success: false,
          error: 'Category not found',
        }, { status: 404 })
      }

      let data: any[] = []
      switch (category) {
        case 'eternal-last':
          data = await analytics.getEternalLast()
          break
        case 'playoff-choker':
          data = await analytics.getPlayoffChoker()
          break
        case 'close-but-no-cigar':
          data = await analytics.getCloseButNoCigar()
          break
        case 'rock-bottom':
          data = await analytics.getRockBottom()
          break
        case 'the-collapse':
          data = await analytics.getTheCollapse()
          break
        case 'brick-hands':
          data = await analytics.getBrickHands()
          break
        case 'the-heartbreak':
          data = await analytics.getTheHeartbreak()
          break
        case 'glass-cannon':
          data = await analytics.getGlassCannon()
          break
        case 'the-snooze':
          data = await analytics.getTheSnooze()
          break
        default:
          data = []
      }

      return NextResponse.json({
        success: true,
        categoryId: category,
        data,
      })
    }

    // Return all categories
    console.log('🔄 Wall of Shame: Starting data fetch...')
    
    // Fetch shared data ONCE - SharedTeamData handles its own caching
    const [sharedTeamData, sharedMatchupData] = await Promise.all([
      SharedTeamData.getAllTeams(),
      SharedTeamData.getAllMatchups()
    ])
    
    console.log(`📊 Wall of Shame: Got ${sharedTeamData.length} teams, ${sharedMatchupData.length} matchups`)
    
    // Parallelize all category fetches, passing shared data
    const categoryPromises = WALL_OF_SHAME_CATEGORIES.map(async (categoryConfig) => {
      try {
        let data: any[] = []
        switch (categoryConfig.id) {
          case 'eternal-last':
            data = await analytics.getEternalLast(sharedTeamData)
            break
          case 'playoff-choker':
            data = await analytics.getPlayoffChoker(sharedMatchupData, sharedTeamData)
            break
          case 'close-but-no-cigar':
            data = await analytics.getCloseButNoCigar(sharedTeamData)
            break
          case 'rock-bottom':
            data = await analytics.getRockBottom(sharedTeamData)
            break
          case 'the-collapse':
            data = await analytics.getTheCollapse(sharedMatchupData)
            break
          case 'brick-hands':
            data = await analytics.getBrickHands(sharedTeamData)
            break
          case 'the-heartbreak':
            data = await analytics.getTheHeartbreak(sharedMatchupData)
            break
          case 'glass-cannon':
            data = await analytics.getGlassCannon(sharedTeamData)
            break
          case 'the-snooze':
            data = await analytics.getTheSnooze(sharedMatchupData)
            break
          default:
            data = []
        }
        
        return {
          id: categoryConfig.id,
          name: categoryConfig.name,
          description: categoryConfig.description,
          type: categoryConfig.type,
          entries: data.slice(0, 3)
        }
      } catch (error) {
        console.error(`Error fetching data for category ${categoryConfig.id}:`, error)
        return {
          id: categoryConfig.id,
          name: categoryConfig.name,
          description: categoryConfig.description,
          type: categoryConfig.type,
          entries: []
        }
      }
    })
    
    const results = await Promise.all(categoryPromises)

    return NextResponse.json({
      success: true,
      categories: results,
    })
  } catch (error) {
    console.error('Error in wall-of-shame route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}
