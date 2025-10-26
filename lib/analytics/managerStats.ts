import { prisma } from '@/lib/db/prisma'
import { SharedTeamData } from '@/lib/analytics/sharedData'

export interface ManagerCareerStats {
  managerNickname: string
  seasonsPlayed: number
  totalWins: number
  totalLosses: number
  totalTies: number
  winPercentage: number
  totalPointsFor: number
  totalPointsAgainst: number
  avgPointsPerSeason: number
  championships: number
  runnerUps: number
  thirdPlace: number
  playoffAppearances: number
  bestFinish: number
  currentSeasonRank: number | null
  totalTransactions: number
  totalMoves: number
  totalTrades: number
}

export interface ManagerSeasonStats {
  managerNickname: string
  season: string
  wins: number
  losses: number
  ties: number
  winPercentage: number
  pointsFor: number
  pointsAgainst: number
  rank: number | null
}

export class ManagerStatsAnalytics {
  
  /**
   * Get aggregated career stats for all managers
   */
  async getManagerCareerStats(teams?: any[]): Promise<ManagerCareerStats[]> {
    // Get all teams grouped by manager
    const teamData = teams || await SharedTeamData.getAllTeams()

    // Find the most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]

    // Group by manager and aggregate stats
    const managerMap = new Map<string, ManagerCareerStats>()
    const currentYear = new Date().getFullYear().toString()

    for (const team of teamData) {
      const manager = team.managerNickname || 'Unknown'
      
      if (!managerMap.has(manager)) {
        managerMap.set(manager, {
          managerNickname: manager,
          seasonsPlayed: 0,
          totalWins: 0,
          totalLosses: 0,
          totalTies: 0,
          winPercentage: 0,
          totalPointsFor: 0,
          totalPointsAgainst: 0,
          avgPointsPerSeason: 0,
          championships: 0,
          runnerUps: 0,
          thirdPlace: 0,
          playoffAppearances: 0,
          bestFinish: 999,
          currentSeasonRank: null,
          totalTransactions: 0,
          totalMoves: 0,
          totalTrades: 0,
        })
      }

      const stats = managerMap.get(manager)!
      
      stats.seasonsPlayed++
      stats.totalWins += team.wins
      stats.totalLosses += team.losses
      stats.totalTies += team.ties
      stats.totalPointsFor += team.pointsFor
      stats.totalPointsAgainst += team.pointsAgainst
      stats.totalMoves += team.numberOfMoves || 0
      stats.totalTrades += team.numberOfTrades || 0
      stats.totalTransactions = stats.totalMoves + stats.totalTrades

      // Determine if season is finished
      const isSeasonFinished = team.season !== currentSeason || team.isFinished

      // Track championships (rank 1)
      if (team.rank === 1 && isSeasonFinished) {
        stats.championships++
      }

      // Track runner-ups (rank 2)
      if (team.rank === 2 && isSeasonFinished) {
        stats.runnerUps++
      }

      // Track third place (rank 3)
      if (team.rank === 3 && isSeasonFinished) {
        stats.thirdPlace++
      }

      // Track playoff appearances (top 6)
      if (team.rank && team.rank <= 6 && isSeasonFinished) {
        stats.playoffAppearances++
      }

      // Track best finish
      if (team.rank && team.rank < stats.bestFinish) {
        stats.bestFinish = team.rank
      }

      // Track current season rank
      if (team.season === currentYear) {
        stats.currentSeasonRank = team.rank
      }
    }

    // Calculate derived stats
    const managerStats = Array.from(managerMap.values()).map(stats => {
      const totalGames = stats.totalWins + stats.totalLosses + stats.totalTies
      stats.winPercentage = totalGames > 0 ? stats.totalWins / totalGames : 0
      stats.avgPointsPerSeason = stats.seasonsPlayed > 0 ? stats.totalPointsFor / stats.seasonsPlayed : 0
      if (stats.bestFinish === 999) stats.bestFinish = 0
      return stats
    })

    return managerStats.sort((a, b) => b.totalWins - a.totalWins)
  }

  /**
   * Get season-by-season stats for all managers
   */
  async getManagerSeasonStats(teams?: any[]): Promise<ManagerSeasonStats[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()

    return teamData.map(team => ({
      managerNickname: team.managerNickname || 'Unknown',
      season: team.season,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      winPercentage: team.percentage,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
      rank: team.rank,
    }))
  }

  /**
   * Get win percentage by season for charting
   */
  async getManagerWinPercentageOverTime(teams?: any[]): Promise<{ [manager: string]: { [season: string]: number } }> {
    const seasonStats = await this.getManagerSeasonStats(teams)
    
    const result: { [manager: string]: { [season: string]: number } } = {}
    
    for (const stat of seasonStats) {
      if (!result[stat.managerNickname]) {
        result[stat.managerNickname] = {}
      }
      result[stat.managerNickname][stat.season] = stat.winPercentage
    }
    
    return result
  }

  /**
   * Calculate league competitiveness metrics
   */
  async getLeagueCompetitivenessStats() {
    const managerStats = await this.getManagerCareerStats()
    
    // Handle empty data case
    if (managerStats.length === 0) {
      return {
        avgWinPercentage: 0,
        stdDevWinPercentage: 0,
        mostAverageManager: 'No data available',
        totalManagers: 0,
      }
    }
    
    // Calculate average win percentage
    const avgWinPct = managerStats.reduce((sum, m) => sum + m.winPercentage, 0) / managerStats.length
    
    // Calculate standard deviation of win percentages (lower = more competitive)
    const variance = managerStats.reduce((sum, m) => sum + Math.pow(m.winPercentage - avgWinPct, 2), 0) / managerStats.length
    const stdDev = Math.sqrt(variance)
    
    // Find the manager with win% closest to average (most "average" manager)
    const mostAverageManager = managerStats.reduce((closest, manager) => {
      const diff = Math.abs(manager.winPercentage - avgWinPct)
      const closestDiff = Math.abs(closest.winPercentage - avgWinPct)
      return diff < closestDiff ? manager : closest
    })
    
    return {
      avgWinPercentage: avgWinPct,
      stdDevWinPercentage: stdDev,
      mostAverageManager: mostAverageManager.managerNickname,
      totalManagers: managerStats.length,
    }
  }
}

