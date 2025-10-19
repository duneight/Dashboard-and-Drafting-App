import { NextRequest, NextResponse } from 'next/server'
import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame'
import { HALL_OF_FAME_CATEGORIES } from '@/lib/constants'
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

    const analytics = new HallOfFameAnalytics()

    if (category) {
      // Return specific category
      const categoryConfig = HALL_OF_FAME_CATEGORIES.find(c => c.id === category)
      if (!categoryConfig) {
        return NextResponse.json({
          success: false,
          error: 'Category not found',
        } as ApiResponse, { status: 404 })
      }

      let data
      switch (category) {
        case 'dynasty-builder':
          data = await analytics.getDynastyBuilder()
          break
        case 'the-champion':
          data = await analytics.getTheChampion()
          break
        case 'playoff-merchant':
          data = await analytics.getPlayoffMerchant()
          break
        case 'the-consistent-one':
          data = await analytics.getTheConsistentOne()
          break
        case 'point-machine':
          data = await analytics.getPointMachine()
          break
        case 'perfect-season':
          data = await analytics.getPerfectSeason()
          break
        case 'scoring-explosion':
          data = await analytics.getScoringExplosion()
          break
        case 'runaway-winner':
          data = await analytics.getRunawayWinner()
          break
        case 'week-winner':
          data = await analytics.getWeekWinner()
          break
        case 'the-clutch-performer':
          data = await analytics.getTheClutchPerformer()
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
          categories: HALL_OF_FAME_CATEGORIES,
          data: allCategories,
        },
      } as ApiResponse)
    }

  } catch (error) {
    console.error('Error in hall-of-fame route:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse, { status: 500 })
  }
}
