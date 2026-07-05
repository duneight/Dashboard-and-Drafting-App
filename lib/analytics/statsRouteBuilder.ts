import { NextRequest, NextResponse } from 'next/server'
import { MatchupDataVariant, SharedTeamData } from './sharedData'
import { AnalyticsEntry } from './types'
import { rateLimit } from '@/lib/rateLimit'

// Server-side caching for the stats routes: results only change on Yahoo
// sync (twice a week), so let the CDN serve them for 10 minutes and
// revalidate in the background for up to an hour.
const STATS_CACHE_HEADERS = {
  'Cache-Control': 's-maxage=600, stale-while-revalidate=3600',
}

export interface StatsCategoryConfig {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly type: string
}

export interface SharedStatsData {
  teams: any[]
  matchups: any[]
}

/**
 * One resolver per category id. The SAME map serves both the
 * single-category path (?category=...) and the all-categories path, so the
 * two can never drift apart.
 */
export type CategoryDispatchMap = {
  [categoryId: string]: (data: SharedStatsData) => Promise<AnalyticsEntry[]>
}

/**
 * Build a GET handler for a stats route (Hall of Fame / Wall of Shame).
 *
 * Shared behavior: rate limiting, single-category branch (unknown category
 * -> 404; known category -> full entry list), shared-data fetch, parallel
 * per-category computation with per-category error isolation (failed
 * category -> empty entries), and a 500 catch-all.
 */
export function createStatsRouteHandler(options: {
  routeName: string
  categories: ReadonlyArray<StatsCategoryConfig>
  dispatch: CategoryDispatchMap
  /** 'full' includes the stats JSON columns (needed only by Hall of Fame) */
  matchupVariant?: MatchupDataVariant
}) {
  const { routeName, categories, dispatch, matchupVariant = 'full' } = options
  const limiter = rateLimit({ maxRequests: 30, windowMs: 60000 })

  // Fetch shared data ONCE - SharedTeamData handles its own caching
  const fetchSharedData = async (): Promise<SharedStatsData> => {
    const [teams, matchups] = await Promise.all([
      SharedTeamData.getAllTeams(),
      SharedTeamData.getAllMatchups(matchupVariant),
    ])
    return { teams, matchups }
  }

  return async function GET(request: NextRequest) {
    try {
      // Apply rate limiting
      const rateLimitResult = await limiter(request)
      if (rateLimitResult) return rateLimitResult

      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')

      // If specific category requested
      if (category) {
        const categoryConfig = categories.find(c => c.id === category)
        if (!categoryConfig) {
          return NextResponse.json({
            success: false,
            error: 'Category not found',
          }, { status: 404 })
        }

        const compute = dispatch[category]
        const data = compute ? await compute(await fetchSharedData()) : []

        return NextResponse.json({
          success: true,
          categoryId: category,
          data,
        }, { headers: STATS_CACHE_HEADERS })
      }

      // Return all categories
      console.log(`🔄 ${routeName}: Starting data fetch...`)

      const sharedData = await fetchSharedData()

      console.log(`📊 ${routeName}: Got ${sharedData.teams.length} teams, ${sharedData.matchups.length} matchups`)

      // Parallelize all category fetches, passing shared data
      const categoryPromises = categories.map(async (categoryConfig) => {
        try {
          const compute = dispatch[categoryConfig.id]
          const data = compute ? await compute(sharedData) : []

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
      }, { headers: STATS_CACHE_HEADERS })
    } catch (error) {
      console.error(`Error in ${routeName} route:`, error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }, { status: 500 })
    }
  }
}
