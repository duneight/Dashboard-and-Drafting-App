import { NextRequest, NextResponse } from 'next/server'
import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'
import { rateLimit } from '@/lib/rateLimit'
import type { ApiResponse } from '@/types/yahoo'

const limiter = rateLimit({ maxRequests: 30, windowMs: 60000 })

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const season = searchParams.get('season')

    const analytics = new WallOfShameAnalytics()

    if (category) {
      // Return specific category
      const categoryConfig = WALL_OF_SHAME_CATEGORIES.find(c => c.id === category)
      if (!categoryConfig) {
        return NextResponse.json({
          success: false,
          error: 'Category not found',
        } as ApiResponse, { status: 404 })
      }

      let data
      switch (category) {
        case 'eternal-loser':
          data = await analytics.getEternalLoser()
          break
        case 'last-place-larry':
          data = await analytics.getLastPlaceLarry()
          break
        case 'the-unlucky-one':
          data = await analytics.getTheUnluckyOne()
          break
        case 'worst-record':
          data = await analytics.getWorstRecord()
          break
        case 'point-desert':
          data = await analytics.getPointDesert()
          break
        case 'rock-bottom':
          data = await analytics.getRockBottom()
          break
        case 'playoff-choke':
          data = await analytics.getPlayoffChoke()
          break
        case 'losing-streak':
          data = await analytics.getLosingStreak()
          break
        case 'waiver-warrior':
          data = await analytics.getWaiverWarrior()
          break
        case 'the-overthinker':
          data = await analytics.getTheOverthinker()
          break
        case 'inactive-owner':
          data = await analytics.getInactiveOwner()
          break
        case 'goalie-graveyard':
          data = await analytics.getGoalieGraveyard()
          break
        case 'cant-buy-a-goal':
          data = await analytics.getCantBuyAGoal()
          break
        case 'penalty-box':
          data = await analytics.getPenaltyBox()
          break
        case 'the-minus':
          data = await analytics.getTheMinus()
          break
        case 'blowout-victim':
          data = await analytics.getBlowoutVictim()
          break
        case 'never-stood-a-chance':
          data = await analytics.getNeverStoodAChance()
          break
        case 'the-heartbreaker':
          data = await analytics.getTheHeartbreaker()
          break
        case 'commissioner-fails':
          data = await analytics.getCommissionerFails()
          break
        case 'cursed-team-name':
          data = await analytics.getCursedTeamName()
          break
        default:
          return NextResponse.json({
            success: false,
            error: 'Category not implemented',
          } as ApiResponse, { status: 404 })
      }

      // Filter by season if specified
      if (season && data) {
        data = data.filter(entry => entry.season === season)
      }

      return NextResponse.json({
        success: true,
        data: {
          category: categoryConfig,
          entries: data,
        },
      } as ApiResponse)
    } else {
      // Return all categories
      const allCategories = await analytics.getAllCategories()

      // Filter by season if specified
      if (season) {
        Object.keys(allCategories).forEach(key => {
          allCategories[key] = allCategories[key].filter(entry => entry.season === season)
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          categories: WALL_OF_SHAME_CATEGORIES,
          data: allCategories,
        },
      } as ApiResponse)
    }

  } catch (error) {
    console.error('Error in wall-of-shame route:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse, { status: 500 })
  }
}
