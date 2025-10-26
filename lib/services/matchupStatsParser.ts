import { prisma } from '@/lib/db/prisma'
import { NHL_STAT_CATEGORIES } from '@/lib/constants'

export interface ParsedStats {
  goals: number
  assists: number
  points: number
  plusMinus: number
  penaltyMinutes: number
  powerPlayGoals: number
  powerPlayAssists: number
  powerPlayPoints: number
  shorthandedGoals: number
  shorthandedAssists: number
  shorthandedPoints: number
  gameWinningGoals: number
  shotsOnGoal: number
  hits: number
  blocks: number
  wins: number
  losses: number
  goalsAgainst: number
  saves: number
  savePercentage: number
  shutouts: number
}

export interface TeamStatsSummary {
  teamKey: string
  teamName: string
  managerNickname?: string
  season?: string
  leagueName?: string
  stats: ParsedStats
  totalMatchups: number
}

export class MatchupStatsParser {
  /**
   * Parse individual stat values from matchup JSON
   */
  parseMatchupStats(matchup: any): { team1Stats: ParsedStats; team2Stats: ParsedStats } {
    const parseTeamStats = (statsJson: string): ParsedStats => {
      if (!statsJson) {
        return this.getEmptyStats()
      }

      try {
        const stats = JSON.parse(statsJson)
        const statArray = stats.stats?.stat || []
        
        // Convert array to object for easier lookup
        const statMap = statArray.reduce((acc: any, stat: any) => {
          acc[stat.stat_id] = stat.value || 0
          return acc
        }, {})

        return {
          goals: statMap[NHL_STAT_CATEGORIES.GOALS.id] || 0,
          assists: statMap[NHL_STAT_CATEGORIES.ASSISTS.id] || 0,
          points: statMap[NHL_STAT_CATEGORIES.POINTS.id] || 0,
          plusMinus: statMap[NHL_STAT_CATEGORIES.PLUS_MINUS.id] || 0,
          penaltyMinutes: statMap[NHL_STAT_CATEGORIES.PENALTY_MINUTES.id] || 0,
          powerPlayGoals: statMap[NHL_STAT_CATEGORIES.POWERPLAY_GOALS.id] || 0,
          powerPlayAssists: statMap[NHL_STAT_CATEGORIES.POWERPLAY_ASSISTS.id] || 0,
          powerPlayPoints: statMap[NHL_STAT_CATEGORIES.POWERPLAY_POINTS.id] || 0,
          shorthandedGoals: statMap[NHL_STAT_CATEGORIES.SHORTHANDED_GOALS.id] || 0,
          shorthandedAssists: statMap[NHL_STAT_CATEGORIES.SHORTHANDED_ASSISTS.id] || 0,
          shorthandedPoints: statMap[NHL_STAT_CATEGORIES.SHORTHANDED_POINTS.id] || 0,
          gameWinningGoals: statMap[NHL_STAT_CATEGORIES.GAME_WINNING_GOALS.id] || 0,
          shotsOnGoal: statMap[NHL_STAT_CATEGORIES.SHOTS_ON_GOAL.id] || 0,
          hits: statMap[NHL_STAT_CATEGORIES.HITS.id] || 0,
          blocks: statMap[NHL_STAT_CATEGORIES.BLOCKS.id] || 0,
          wins: statMap[NHL_STAT_CATEGORIES.WINS.id] || 0,
          losses: statMap[NHL_STAT_CATEGORIES.LOSSES.id] || 0,
          goalsAgainst: statMap[NHL_STAT_CATEGORIES.GOALS_AGAINST.id] || 0,
          saves: statMap[NHL_STAT_CATEGORIES.SAVES.id] || 0,
          savePercentage: statMap[NHL_STAT_CATEGORIES.SAVE_PERCENTAGE.id] || 0,
          shutouts: statMap[NHL_STAT_CATEGORIES.SHUTOUTS.id] || 0,
        }
      } catch (error) {
        console.error('Error parsing matchup stats:', error)
        return this.getEmptyStats()
      }
    }

    return {
      team1Stats: parseTeamStats(matchup.team1Stats),
      team2Stats: parseTeamStats(matchup.team2Stats)
    }
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): ParsedStats {
    return {
      goals: 0, assists: 0, points: 0, plusMinus: 0, penaltyMinutes: 0,
      powerPlayGoals: 0, powerPlayAssists: 0, powerPlayPoints: 0,
      shorthandedGoals: 0, shorthandedAssists: 0, shorthandedPoints: 0,
      gameWinningGoals: 0, shotsOnGoal: 0, hits: 0, blocks: 0,
      wins: 0, losses: 0, goalsAgainst: 0, saves: 0, savePercentage: 0, shutouts: 0
    }
  }

  /**
   * Aggregate stats for a specific team across a season or all-time
   */
  async aggregatePlayerStats(teamKey: string, season?: string): Promise<TeamStatsSummary> {
    const whereClause: any = {
      OR: [
        { team1Key: teamKey },
        { team2Key: teamKey }
      ]
    }

    if (season) {
      whereClause.season = season
    }

    const matchups = await prisma.matchup.findMany({
      where: whereClause,
      include: {
        team1: true,
        team2: true,
        league: true
      }
    })

    const aggregatedStats = this.getEmptyStats()
    let totalMatchups = 0

    for (const matchup of matchups) {
      const { team1Stats, team2Stats } = this.parseMatchupStats(matchup)
      const isTeam1 = matchup.team1Key === teamKey
      const teamStats = isTeam1 ? team1Stats : team2Stats

      // Add stats to aggregated total
      Object.keys(aggregatedStats).forEach(key => {
        aggregatedStats[key as keyof ParsedStats] += teamStats[key as keyof ParsedStats]
      })
      totalMatchups++
    }

    // Get team info
    const team = await prisma.team.findFirst({
      where: { teamKey },
      include: { league: true }
    })

    return {
      teamKey,
      teamName: team?.name || 'Unknown Team',
      managerNickname: team?.managerNickname || undefined,
      season: team?.season,
      leagueName: team?.league?.name || undefined,
      stats: aggregatedStats,
      totalMatchups
    }
  }

  /**
   * Get top performers for a specific stat category
   */
  async getTopPerformers(statCategory: keyof ParsedStats, limit: number = 10, season?: string): Promise<TeamStatsSummary[]> {
    const whereClause: any = {}
    if (season) {
      whereClause.season = season
    }

    const matchups = await prisma.matchup.findMany({
      where: whereClause,
      take: 1000, // Limit to prevent memory issues
      include: {
        team1: {
          select: {
            name: true,
            managerNickname: true
          }
        },
        team2: {
          select: {
            name: true,
            managerNickname: true
          }
        }
      }
    })

    const teamStatsMap = new Map<string, TeamStatsSummary>()

    for (const matchup of matchups) {
      const { team1Stats, team2Stats } = this.parseMatchupStats(matchup)

      // Process team1
      const team1Key = matchup.team1Key
      if (!teamStatsMap.has(team1Key)) {
        teamStatsMap.set(team1Key, {
          teamKey: team1Key,
          teamName: matchup.team1.name,
          managerNickname: matchup.team1.managerNickname || undefined,
          season: matchup.season,
          leagueName: undefined,
          stats: this.getEmptyStats(),
          totalMatchups: 0
        })
      }
      const team1Summary = teamStatsMap.get(team1Key)!
      team1Summary.stats[statCategory] += team1Stats[statCategory]
      team1Summary.totalMatchups++

      // Process team2
      const team2Key = matchup.team2Key
      if (!teamStatsMap.has(team2Key)) {
        teamStatsMap.set(team2Key, {
          teamKey: team2Key,
          teamName: matchup.team2.name,
          managerNickname: matchup.team2.managerNickname || undefined,
          season: matchup.season,
          leagueName: undefined,
          stats: this.getEmptyStats(),
          totalMatchups: 0
        })
      }
      const team2Summary = teamStatsMap.get(team2Key)!
      team2Summary.stats[statCategory] += team2Stats[statCategory]
      team2Summary.totalMatchups++
    }

    return Array.from(teamStatsMap.values())
      .sort((a, b) => b.stats[statCategory] - a.stats[statCategory])
      .slice(0, limit)
  }

  /**
   * Get worst performers for a specific stat category
   */
  async getWorstPerformers(statCategory: keyof ParsedStats, limit: number = 10, season?: string): Promise<TeamStatsSummary[]> {
    const performers = await this.getTopPerformers(statCategory, limit * 2, season)
    return performers
      .sort((a, b) => a.stats[statCategory] - b.stats[statCategory])
      .slice(0, limit)
  }

  /**
   * Get all-time aggregated stats for all teams
   */
  async getAllTimeTeamStats(): Promise<TeamStatsSummary[]> {
    // Fetch matchups with limited data to avoid memory issues
    const matchups = await prisma.matchup.findMany({
      take: 1000, // Limit to prevent memory issues
      include: {
        team1: {
          select: {
            name: true,
            managerNickname: true
          }
        },
        team2: {
          select: {
            name: true,
            managerNickname: true
          }
        }
      }
    })

    const teamStatsMap = new Map<string, TeamStatsSummary>()

    for (const matchup of matchups) {
      const { team1Stats, team2Stats } = this.parseMatchupStats(matchup)

      // Process team1
      const team1Key = matchup.team1Key
      if (!teamStatsMap.has(team1Key)) {
        teamStatsMap.set(team1Key, {
          teamKey: team1Key,
          teamName: matchup.team1.name,
          managerNickname: matchup.team1.managerNickname || undefined,
          season: matchup.season,
          leagueName: undefined,
          stats: this.getEmptyStats(),
          totalMatchups: 0
        })
      }
      const team1Summary = teamStatsMap.get(team1Key)!
      Object.keys(team1Summary.stats).forEach(key => {
        team1Summary.stats[key as keyof ParsedStats] += team1Stats[key as keyof ParsedStats]
      })
      team1Summary.totalMatchups++

      // Process team2
      const team2Key = matchup.team2Key
      if (!teamStatsMap.has(team2Key)) {
        teamStatsMap.set(team2Key, {
          teamKey: team2Key,
          teamName: matchup.team2.name,
          managerNickname: matchup.team2.managerNickname || undefined,
          season: matchup.season,
          leagueName: undefined,
          stats: this.getEmptyStats(),
          totalMatchups: 0
        })
      }
      const team2Summary = teamStatsMap.get(team2Key)!
      Object.keys(team2Summary.stats).forEach(key => {
        team2Summary.stats[key as keyof ParsedStats] += team2Stats[key as keyof ParsedStats]
      })
      team2Summary.totalMatchups++
    }

    return Array.from(teamStatsMap.values())
  }

  /**
   * Get single-week extremes (highest/lowest scores)
   */
  async getWeeklyExtremes(): Promise<{
    highestWeek: { teamKey: string; teamName: string; points: number; week: number; season: string }
    lowestWeek: { teamKey: string; teamName: string; points: number; week: number; season: string }
  }> {
    const matchups = await prisma.matchup.findMany({
      where: {
        team1Points: { not: null },
        team2Points: { not: null }
      },
      include: {
        team1: true,
        team2: true
      },
      orderBy: [
        { team1Points: 'desc' },
        { team2Points: 'desc' }
      ]
    })

    let highest = { teamKey: '', teamName: '', points: 0, week: 0, season: '' }
    let lowest = { teamKey: '', teamName: '', points: Infinity, week: 0, season: '' }

    for (const matchup of matchups) {
      if (matchup.team1Points && matchup.team1Points > highest.points) {
        highest = {
          teamKey: matchup.team1Key,
          teamName: matchup.team1.name,
          points: matchup.team1Points,
          week: matchup.week,
          season: matchup.season
        }
      }
      if (matchup.team2Points && matchup.team2Points > highest.points) {
        highest = {
          teamKey: matchup.team2Key,
          teamName: matchup.team2.name,
          points: matchup.team2Points,
          week: matchup.week,
          season: matchup.season
        }
      }
      if (matchup.team1Points && matchup.team1Points < lowest.points) {
        lowest = {
          teamKey: matchup.team1Key,
          teamName: matchup.team1.name,
          points: matchup.team1Points,
          week: matchup.week,
          season: matchup.season
        }
      }
      if (matchup.team2Points && matchup.team2Points < lowest.points) {
        lowest = {
          teamKey: matchup.team2Key,
          teamName: matchup.team2.name,
          points: matchup.team2Points,
          week: matchup.week,
          season: matchup.season
        }
      }
    }

    return { highestWeek: highest, lowestWeek: lowest }
  }
}
