import { NextRequest, NextResponse } from 'next/server'
import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame'
import { SharedTeamData } from '@/lib/analytics/sharedData'
import { HALL_OF_FAME_CATEGORIES } from '@/lib/constants'
import { rateLimit } from '@/lib/rateLimit'

const limiter = rateLimit({ maxRequests: 30, windowMs: 60000 })

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const analytics = new HallOfFameAnalytics()

    // If specific category requested
    if (category) {
      const categoryConfig = HALL_OF_FAME_CATEGORIES.find(c => c.id === category)
      if (!categoryConfig) {
        return NextResponse.json({
          success: false,
          error: 'Category not found',
        }, { status: 404 })
      }

      let data: any[] = []
      switch (category) {
        case 'dynasty-king':
          data = await analytics.getDynastyKing()
          break
        case 'point-titan':
          data = await analytics.getPointTitan()
          break
        case 'the-consistent':
          data = await analytics.getTheConsistent()
          break
        case 'playoff-warrior':
          data = await analytics.getPlayoffWarrior()
          break
        case 'goal-machine':
          data = await analytics.getGoalMachine()
          break
        case 'iron-wall':
          data = await analytics.getIronWall()
          break
        case 'shutout-king':
          data = await analytics.getShutoutKing()
          break
        case 'the-playmaker':
          data = await analytics.getThePlaymaker()
          break
        case 'season-dominator':
          data = await analytics.getSeasonDominator()
          break
        case 'weekly-explosion':
          data = await analytics.getWeeklyExplosion()
          break
        case 'unstoppable':
          data = await analytics.getUnstoppable()
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
    console.log('🔄 Hall of Fame: Starting data fetch...')
    
    // Fetch shared data ONCE - SharedTeamData handles its own caching
    const [sharedTeamData, sharedMatchupData] = await Promise.all([
      SharedTeamData.getAllTeams(),
      SharedTeamData.getAllMatchups()
    ])
    
    console.log(`📊 Hall of Fame: Got ${sharedTeamData.length} teams, ${sharedMatchupData.length} matchups`)
    
    // Parallelize all category fetches, passing shared data
    const categoryPromises = HALL_OF_FAME_CATEGORIES.map(async (categoryConfig) => {
      try {
        let data: any[] = []
        switch (categoryConfig.id) {
          case 'dynasty-king':
            data = await analytics.getDynastyKing(sharedTeamData)
            break
          case 'point-titan':
            data = await analytics.getPointTitan(sharedTeamData)
            break
          case 'the-consistent':
            data = await analytics.getTheConsistent(sharedTeamData)
            break
          case 'playoff-warrior':
            data = await analytics.getPlayoffWarrior(sharedMatchupData)
            break
          case 'goal-machine':
            data = await analytics.getGoalMachine(sharedMatchupData)
            break
          case 'iron-wall':
            data = await analytics.getIronWall(sharedMatchupData)
            break
          case 'shutout-king':
            data = await analytics.getShutoutKing(sharedMatchupData)
            break
          case 'the-playmaker':
            data = await analytics.getThePlaymaker(sharedMatchupData)
            break
          case 'season-dominator':
            data = await analytics.getSeasonDominator(sharedTeamData)
            break
          case 'weekly-explosion':
            data = await analytics.getWeeklyExplosion(sharedMatchupData)
            break
          case 'unstoppable':
            data = await analytics.getUnstoppable(sharedMatchupData)
            break
          case 'close-game-specialist':
            data = await analytics.getCloseGameSpecialist(sharedMatchupData)
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
    console.error('Error in hall-of-fame route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}
