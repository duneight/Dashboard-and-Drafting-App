import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { ManagerStatsAnalytics } from '@/lib/analytics/managerStats'
import { HeadToHeadAnalytics } from '@/lib/analytics/headToHead'
import { LeagueTrendsAnalytics } from '@/lib/analytics/leagueTrends'
import { SharedTeamData } from '@/lib/analytics/sharedData'
import { withCache } from '@/lib/cache'

const limiter = rateLimit({ maxRequests: 30, windowMs: 60000 })

// Cache TTL for dashboard data (2 minutes)
const DASHBOARD_CACHE_TTL = 2 * 60 * 1000

// Helper function to calculate streaks
function calculateStreaks(matchups: any[]) {
  // Filter matchups with valid points and sort by season and week
  const validMatchups = matchups
    .filter(m => m.team1Points !== null && m.team2Points !== null)
    .sort((a, b) => {
      if (a.season !== b.season) return a.season.localeCompare(b.season)
      return a.week - b.week
    })

  const managerStreaks = new Map<string, { current: number; longest: number; type: 'win' | 'loss' | null }>()
  let longestWinStreak = { manager: '', streak: 0, start: '', end: '' }
  let longestLoseStreak = { manager: '', streak: 0, start: '', end: '' }

  for (const matchup of validMatchups) {
    const manager1 = matchup.team1.managerNickname || 'Unknown'
    const manager2 = matchup.team2.managerNickname || 'Unknown'
    const team1Won = (matchup.team1Points || 0) > (matchup.team2Points || 0)
    
    // Update streaks for both managers
    for (const [manager, won] of [[manager1, team1Won], [manager2, !team1Won]] as [string, boolean][]) {
      if (!managerStreaks.has(manager)) {
        managerStreaks.set(manager, { current: 0, longest: 0, type: null })
      }

      const streak = managerStreaks.get(manager)!
      const resultType: 'win' | 'loss' = won ? 'win' : 'loss'

      if (streak.type === resultType) {
        streak.current++
      } else {
        streak.current = 1
        streak.type = resultType
      }

      if (streak.current > streak.longest) {
        streak.longest = streak.current
        
        if (resultType === 'win' && streak.current > longestWinStreak.streak) {
          longestWinStreak = {
            manager,
            streak: streak.current,
            start: `${matchup.season} Week ${matchup.week - streak.current + 1}`,
            end: `${matchup.season} Week ${matchup.week}`
          }
        } else if (resultType === 'loss' && streak.current > longestLoseStreak.streak) {
          longestLoseStreak = {
            manager,
            streak: streak.current,
            start: `${matchup.season} Week ${matchup.week - streak.current + 1}`,
            end: `${matchup.season} Week ${matchup.week}`
          }
        }
      }
    }
  }

  return { longestWinStreak, longestLoseStreak }
}

// Helper function to get current season performance
function getCurrentSeasonPerformance(season: string, matchups: any[]) {
  // Filter matchups for the current season and sort by week desc
  const seasonMatchups = matchups
    .filter(m => m.season === season)
    .sort((a, b) => b.week - a.week)
    .slice(0, 50) // Last 5 weeks for 10 teams = 50 matchups

  // Calculate L5 records
  const managerL5 = new Map<string, { wins: number; losses: number; pointsFor: number }>()

  seasonMatchups.forEach(m => {
    const manager1 = m.team1.managerNickname || 'Unknown'
    const manager2 = m.team2.managerNickname || 'Unknown'
    const team1Won = (m.team1Points || 0) > (m.team2Points || 0)

    for (const [manager, points, won] of [
      [manager1, m.team1Points || 0, team1Won],
      [manager2, m.team2Points || 0, !team1Won]
    ] as [string, number, boolean][]) {
      if (!managerL5.has(manager)) {
        managerL5.set(manager, { wins: 0, losses: 0, pointsFor: 0 })
      }
      const record = managerL5.get(manager)!
      if (won) record.wins++
      else record.losses++
      record.pointsFor += points
    }
  })

  const l5Records = Array.from(managerL5.entries()).map(([manager, stats]) => ({
    manager,
    wins: stats.wins,
    losses: stats.losses,
    pointsFor: stats.pointsFor
  }))

  const hottest = l5Records.length > 0 ? l5Records.reduce((max, curr) => curr.wins > max.wins ? curr : max) : null
  const coldest = l5Records.length > 0 ? l5Records.reduce((min, curr) => curr.wins < min.wins ? curr : min) : null
  const scoringLeader = l5Records.length > 0 ? l5Records.reduce((max, curr) => curr.pointsFor > max.pointsFor ? curr : max) : null

  return {
    hottestManager: hottest,
    coldestManager: coldest,
    scoringLeader
  }
}

// Helper function to get playoff success by seed
function getPlayoffSuccessBySeed(teams: any[]) {
  // Filter teams with ranks
  const teamsWithRanks = teams.filter(t => t.rank !== null)

  // Find the most current season
  const seasons = [...new Set(teamsWithRanks.map(t => t.season))].sort()
  const currentSeason = seasons[seasons.length - 1]

  // Count championships by seed (only finished seasons)
  const seedSuccess = new Map<number, { appearances: number; championships: number }>()

  for (let seed = 1; seed <= 6; seed++) {
    const teamsWithSeed = teamsWithRanks.filter(t => {
      const isSeasonFinished = t.season !== currentSeason
      return t.rank === seed && isSeasonFinished
    })
    const championships = teamsWithSeed.filter(t => t.rank === 1).length
    
    seedSuccess.set(seed, {
      appearances: teamsWithSeed.length,
      championships
    })
  }

  return Array.from(seedSuccess.entries()).map(([seed, stats]) => ({
    seed,
    appearances: stats.appearances,
    championships: stats.championships,
    successRate: stats.appearances > 0 ? stats.championships / stats.appearances : 0
  }))
}

// Helper function to calculate weekly trends
function calculateWeeklyTrends(matchups: any[]) {
  const weeklyMap = new Map<number, { scores: number[]; count: number }>()

  matchups.forEach(m => {
    if (!weeklyMap.has(m.week)) {
      weeklyMap.set(m.week, { scores: [], count: 0 })
    }
    const weekData = weeklyMap.get(m.week)!
    weekData.scores.push(m.team1Points, m.team2Points)
    weekData.count++
  })

  return Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week,
      avgScore: data.scores.length > 0 ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length : 0,
      highScore: data.scores.length > 0 ? Math.max(...data.scores) : 0,
      lowScore: data.scores.length > 0 ? Math.min(...data.scores) : 0
    }))
    .sort((a, b) => a.week - b.week)
}

// Helper function to calculate regular vs playoff stats
function calculateRegularVsPlayoffStats(matchups: any[]) {
  const regularSeason = matchups.filter(m => !m.isPlayoffs)
  const playoffs = matchups.filter(m => m.isPlayoffs)

  const calcStats = (games: any[]) => {
    if (games.length === 0) {
      return { avgScore: 0, highScore: 0, lowScore: 0, games: 0 }
    }
    const allScores = games.flatMap(m => [m.team1Points, m.team2Points])
    return {
      avgScore: allScores.reduce((sum, s) => sum + s, 0) / allScores.length,
      highScore: Math.max(...allScores),
      lowScore: Math.min(...allScores),
      games: games.length
    }
  }

  return {
    regularSeason: calcStats(regularSeason),
    playoffs: calcStats(playoffs)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await limiter(request)
    if (rateLimitResult) return rateLimitResult

    // Check for cache bypass via query param
    const url = new URL(request.url)
    const bypassCache = url.searchParams.has('refresh')

    // Use cached response if available (2 minute TTL)
    const dashboardData = await withCache(
      'dashboard-response',
      async () => {
        console.log('Starting dashboard data fetch (cache miss)...')
        return fetchDashboardData()
      },
      { ttl: bypassCache ? 0 : DASHBOARD_CACHE_TTL }
    )

    console.log('Dashboard data fetch completed successfully!')
    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Error in dashboard route:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}

// Extracted dashboard data fetching logic
async function fetchDashboardData() {
  const managerAnalytics = new ManagerStatsAnalytics()
  const h2hAnalytics = new HeadToHeadAnalytics()
  const trendsAnalytics = new LeagueTrendsAnalytics()

    // ==================== CONTROLLED PARALLEL DATA FETCHING ====================
    console.log('Fetching analytics data with controlled parallelization...')
    
    // Fetch shared team data first - SharedTeamData handles its own caching
    const [sharedTeamData, sharedMatchupData] = await Promise.all([
      SharedTeamData.getAllTeams(),
      SharedTeamData.getAllMatchups()
    ])
      
      // Group 1: Manager analytics (can run in parallel)
      const [managerCareerStats, managerWinPctOverTime, competitivenessStats] = await Promise.all([
        managerAnalytics.getManagerCareerStats(sharedTeamData),
        managerAnalytics.getManagerWinPercentageOverTime(sharedTeamData),
        managerAnalytics.getLeagueCompetitivenessStats()
      ])
      console.log('Manager analytics fetched')
      
      // Group 2: Seasons data (extract from cached team data)
      const seasons = [...new Set(sharedTeamData.map(t => t.season))]
        .sort()
        .reverse() // Most recent first
        .map(season => ({ season }))
      console.log('Seasons extracted from cached team data')
      
      // Group 3: Derive H2H data from cached matchups (no additional DB queries)
      const [headToHeadRecords, headToHeadMatrix, rivalryInsights, matchupExtremes] = await Promise.all([
        h2hAnalytics.getHeadToHeadRecords(sharedMatchupData),
        h2hAnalytics.getHeadToHeadMatrix(sharedMatchupData),
        h2hAnalytics.getRivalryInsights(sharedMatchupData),
        h2hAnalytics.getMatchupExtremes(sharedMatchupData)
      ])
      console.log('H2H derived data calculated')
      
      const totalSeasons = seasons.length

      // ==================== SEASON DEEP DIVE DATA ====================
      console.log('Processing season data from cached teams...')
      
      // Process season data from cached team data instead of additional DB query
      const seasonMap = new Map<string, any[]>()
      sharedTeamData.forEach(team => {
        if (!seasonMap.has(team.season)) {
          seasonMap.set(team.season, [])
        }
        seasonMap.get(team.season)!.push(team)
      })
      
      const seasonData = Array.from(seasonMap.entries()).map(([season, seasonTeams]) => {
        // Find the most current season
        const allSeasonsList = [...new Set(sharedTeamData.map(t => t.season))].sort()
        const currentSeason = allSeasonsList[allSeasonsList.length - 1]
        
        // Determine if this season is finished
        const isSeasonFinished = season !== currentSeason
        
        const champion = isSeasonFinished ? seasonTeams.find(t => t.rank === 1) : null
        const runnerUp = isSeasonFinished ? seasonTeams.find(t => t.rank === 2) : null
        const playoffTeams = isSeasonFinished ? seasonTeams.filter(t => t.rank && t.rank <= 6) : []
        
        // Calculate season competitiveness (std dev of win%)
        const avgWinPct = seasonTeams.length > 0 
          ? seasonTeams.reduce((sum, t) => sum + (t.percentage || 0), 0) / seasonTeams.length 
          : 0
        const variance = seasonTeams.length > 0 
          ? seasonTeams.reduce((sum, t) => sum + Math.pow((t.percentage || 0) - avgWinPct, 2), 0) / seasonTeams.length 
          : 0
        const stdDev = Math.sqrt(variance)

        return {
          season,
          name: `Season ${season}`,
          isFinished: isSeasonFinished,
          champion: champion ? {
            name: champion.name || 'Unknown',
            manager: champion.managerNickname,
            record: `${champion.wins}-${champion.losses}${champion.ties > 0 ? `-${champion.ties}` : ''}`,
            pointsFor: champion.pointsFor
          } : null,
          runnerUp: runnerUp ? {
            name: runnerUp.name || 'Unknown',
            manager: runnerUp.managerNickname
          } : null,
          playoffTeams: playoffTeams.map(t => ({
            name: t.name || 'Unknown',
            manager: t.managerNickname,
            rank: t.rank,
            hasBye: t.rank && t.rank <= 2
          })),
          standings: seasonTeams.map(t => ({
            rank: t.rank,
            name: t.name || 'Unknown',
            manager: t.managerNickname,
            wins: t.wins,
            losses: t.losses,
            ties: t.ties,
            winPercentage: t.percentage,
            pointsFor: t.pointsFor,
            pointsAgainst: t.pointsAgainst
          })),
          competitiveness: stdDev,
          avgWinPercentage: avgWinPct,
          numTeams: seasonTeams.length
        }
      }).sort((a, b) => b.season.localeCompare(a.season))

      // Process weekly scores from cached matchup data
      console.log('Processing weekly scores from cached matchups...')
      
      // Filter matchups with valid points
      const validMatchups = sharedMatchupData.filter(m => 
        m.team1Points !== null && m.team2Points !== null
      )

      // Group by season in memory
      const weeklyScoresBySeason: { [season: string]: { week: number; scores: number[] }[] } = {}
      
      validMatchups.forEach(m => {
        if (!weeklyScoresBySeason[m.season]) {
          weeklyScoresBySeason[m.season] = []
        }
        
        let weekEntry = weeklyScoresBySeason[m.season].find(w => w.week === m.week)
        if (!weekEntry) {
          weekEntry = { week: m.week, scores: [] }
          weeklyScoresBySeason[m.season].push(weekEntry)
        }
        
        weekEntry.scores.push(m.team1Points || 0, m.team2Points || 0)
      })

      // Sort weeks within each season
      Object.keys(weeklyScoresBySeason).forEach(season => {
        weeklyScoresBySeason[season].sort((a, b) => a.week - b.week)
      })
      
      console.log('Weekly scores processing completed')

      // ==================== LEAGUE TRENDS DATA ====================
      console.log('Calculating league trends analytics from cached data...')
      
      const [
        competitivenessOverTime,
        championshipSeedSuccess,
        scoringEvolution,
        managerConsistency,
        experienceCurve,
        transactionCorrelation,
        regularVsPlayoff,
        regularVsPlayoffScoring,
        luckIndex,
        closeGamePerf,
        startFinishAnalysis,
        byeAdvantage
      ] = await Promise.all([
        trendsAnalytics.getLeagueCompetitivenessOverTime(sharedTeamData),
        trendsAnalytics.getChampionshipSuccessByPlayoffSeed(sharedTeamData),
        trendsAnalytics.getScoringEvolutionBySeasonWeek(sharedMatchupData),
        trendsAnalytics.getManagerConsistencyRankings(sharedTeamData),
        trendsAnalytics.getExperienceCurveAnalysis(sharedTeamData),
        trendsAnalytics.getTransactionVolumeVsSuccess(sharedTeamData),
        trendsAnalytics.getRegularSeasonVsPlayoffPerformance(sharedMatchupData, sharedTeamData),
        trendsAnalytics.getRegularSeasonVsPlayoffScoring(sharedMatchupData, sharedTeamData),
        trendsAnalytics.getLuckIndexAnalysis(sharedTeamData),
        trendsAnalytics.getCloseGamePerformance(sharedMatchupData),
        trendsAnalytics.getSlowStarterVsFastStarterAnalysis(sharedMatchupData),
        trendsAnalytics.getPlayoffByeAdvantageAnalysis(sharedTeamData)
      ])
      
      console.log('League trends analytics completed')
      
      // Get current season stats (L5 records) for mini-widget
      console.log('Calculating current season performance...')
      const currentSeason = new Date().getFullYear().toString()
      const recentPerformance = getCurrentSeasonPerformance(currentSeason, sharedMatchupData)
      console.log('Current season performance calculated')

      // ==================== RETURN ALL DATA ====================
      return {
        // Manager Rankings Tab
        managerRankings: {
          careerStats: managerCareerStats,
          winPercentageOverTime: managerWinPctOverTime,
          leagueStats: {
            totalManagers: competitivenessStats.totalManagers,
            totalSeasons,
            avgWinPercentage: competitivenessStats.avgWinPercentage,
            competitivenessScore: competitivenessStats.stdDevWinPercentage,
            mostAverageManager: competitivenessStats.mostAverageManager
          },
          streaks: calculateStreaks(sharedMatchupData)
        },

        // Head-to-Head Tab
        headToHead: {
          records: headToHeadRecords,
          matrix: headToHeadMatrix,
          insights: rivalryInsights
        },

        // Season Deep Dive Tab
        seasons: {
          allSeasons: seasonData,
          weeklyScoresBySeason
        },

        // League Trends Tab
        trends: {
          competitiveness: competitivenessOverTime,
          championshipPatterns: {
            seedSuccess: getPlayoffSuccessBySeed(sharedTeamData),
            byeAdvantage
          },
          scoringTrends: scoringEvolution,
          managerPatterns: {
            consistency: managerConsistency,
            experienceCurve,
            regularVsPlayoff,
            regularVsPlayoffScoring,
            startFinish: startFinishAnalysis
          },
          transactionAnalysis: transactionCorrelation,
          advancedMetrics: {
            luckIndex,
            closeGamePerformance: closeGamePerf
          },
          currentSeason: recentPerformance
        }
      }
}
