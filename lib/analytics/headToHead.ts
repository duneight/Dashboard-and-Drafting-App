import { prisma } from '@/lib/db/prisma'
import { SharedTeamData } from './sharedData'

export interface HeadToHeadRecord {
  manager1: string
  manager2: string
  manager1Wins: number
  manager2Wins: number
  ties: number
  totalGames: number
  manager1AvgMargin: number
  manager2AvgMargin: number
  closestGame: {
    margin: number
    week: number
    season: string
    winner: string
  } | null
  biggestBlowout: {
    margin: number
    week: number
    season: string
    winner: string
  } | null
}

export interface MatchupExtreme {
  week: number
  season: string
  manager1: string
  manager2: string
  manager1Score: number
  manager2Score: number
  winner: string
  margin: number
  isPlayoffs: boolean
}

export class HeadToHeadAnalytics {
  
  /**
   * Get raw matchup data (shared by multiple methods to avoid duplicate queries)
   */
  public async getRawMatchupData() {
    // Use SharedTeamData for consistency and caching
    return await SharedTeamData.getAllMatchups()
  }

  /**
   * Get all head-to-head records between managers
   */
  async getHeadToHeadRecords(matchups?: any[]): Promise<HeadToHeadRecord[]> {
    // Get all matchups with team information
    const matchupData = matchups || await this.getRawMatchupData()

    // Build H2H matrix
    const h2hMap = new Map<string, HeadToHeadRecord>()

    for (const matchup of matchupData) {
      const manager1 = matchup.team1.managerNickname || 'Unknown'
      const manager2 = matchup.team2.managerNickname || 'Unknown'
      
      // Skip if same manager (shouldn't happen but just in case)
      if (manager1 === manager2) continue

      // Create consistent key (alphabetically sorted)
      const [managerA, managerB] = [manager1, manager2].sort()
      const key = `${managerA}|||${managerB}`

      if (!h2hMap.has(key)) {
        h2hMap.set(key, {
          manager1: managerA,
          manager2: managerB,
          manager1Wins: 0,
          manager2Wins: 0,
          ties: 0,
          totalGames: 0,
          manager1AvgMargin: 0,
          manager2AvgMargin: 0,
          closestGame: null,
          biggestBlowout: null,
        })
      }

      const record = h2hMap.get(key)!
      const team1Score = matchup.team1Points || 0
      const team2Score = matchup.team2Points || 0
      const margin = Math.abs(team1Score - team2Score)

      record.totalGames++

      // Determine winner and update records
      if (team1Score > team2Score) {
        if (manager1 === record.manager1) {
          record.manager1Wins++
          record.manager1AvgMargin += margin
        } else {
          record.manager2Wins++
          record.manager2AvgMargin += margin
        }
      } else if (team2Score > team1Score) {
        if (manager2 === record.manager2) {
          record.manager2Wins++
          record.manager2AvgMargin += margin
        } else {
          record.manager1Wins++
          record.manager1AvgMargin += margin
        }
      } else {
        record.ties++
      }

      // Track closest game
      if (!record.closestGame || margin < record.closestGame.margin) {
        record.closestGame = {
          margin,
          week: matchup.week,
          season: matchup.season,
          winner: team1Score > team2Score ? manager1 : team2Score > team1Score ? manager2 : 'Tie'
        }
      }

      // Track biggest blowout
      if (!record.biggestBlowout || margin > record.biggestBlowout.margin) {
        record.biggestBlowout = {
          margin,
          week: matchup.week,
          season: matchup.season,
          winner: team1Score > team2Score ? manager1 : manager2
        }
      }
    }

    // Calculate average margins
    const records = Array.from(h2hMap.values()).map(record => {
      if (record.manager1Wins > 0) {
        record.manager1AvgMargin = record.manager1AvgMargin / record.manager1Wins
      }
      if (record.manager2Wins > 0) {
        record.manager2AvgMargin = record.manager2AvgMargin / record.manager2Wins
      }
      return record
    })

    return records.sort((a, b) => b.totalGames - a.totalGames)
  }

  /**
   * Get H2H matrix format for display
   */
  async getHeadToHeadMatrix(matchups?: any[]): Promise<{ [manager: string]: { [opponent: string]: string } }> {
    const records = await this.getHeadToHeadRecords(matchups)
    const matrix: { [manager: string]: { [opponent: string]: string } } = {}

    // Get all unique managers
    const managers = new Set<string>()
    records.forEach(record => {
      managers.add(record.manager1)
      managers.add(record.manager2)
    })

    // Initialize matrix
    managers.forEach(manager => {
      matrix[manager] = {}
      managers.forEach(opponent => {
        if (manager === opponent) {
          matrix[manager][opponent] = '-'
        } else {
          matrix[manager][opponent] = '0-0'
        }
      })
    })

    // Fill in records
    records.forEach(record => {
      matrix[record.manager1][record.manager2] = `${record.manager1Wins}-${record.manager2Wins}${record.ties > 0 ? `-${record.ties}` : ''}`
      matrix[record.manager2][record.manager1] = `${record.manager2Wins}-${record.manager1Wins}${record.ties > 0 ? `-${record.ties}` : ''}`
    })

    return matrix
  }

  /**
   * Get all matchup extremes (highest/lowest scores, biggest blowouts, etc)
   * Reuses data from getRawMatchupData to avoid duplicate queries
   */
  async getMatchupExtremes(matchups?: any[]): Promise<{
    highestScore: MatchupExtreme | null
    lowestScore: MatchupExtreme | null
    biggestBlowout: MatchupExtreme | null
    closestGame: MatchupExtreme | null
  }> {
    // Use provided matchups or fetch if not provided
    const matchupData = matchups || await this.getRawMatchupData()

    let highestScore: MatchupExtreme | null = null
    let lowestScore: MatchupExtreme | null = null
    let biggestBlowout: MatchupExtreme | null = null
    let closestGame: MatchupExtreme | null = null

    for (const matchup of matchupData) {
      const team1Score = matchup.team1Points || 0
      const team2Score = matchup.team2Points || 0
      const margin = Math.abs(team1Score - team2Score)
      const maxScore = Math.max(team1Score, team2Score)
      const minScore = Math.min(team1Score, team2Score)

      const extreme: MatchupExtreme = {
        week: matchup.week,
        season: matchup.season,
        manager1: matchup.team1.managerNickname || 'Unknown',
        manager2: matchup.team2.managerNickname || 'Unknown',
        manager1Score: team1Score,
        manager2Score: team2Score,
        winner: team1Score > team2Score ? matchup.team1.managerNickname || 'Unknown' : matchup.team2.managerNickname || 'Unknown',
        margin,
        isPlayoffs: matchup.isPlayoffs
      }

      // Track highest score
      if (!highestScore || maxScore > Math.max(highestScore.manager1Score, highestScore.manager2Score)) {
        highestScore = extreme
      }

      // Track lowest score
      if (!lowestScore || minScore < Math.min(lowestScore.manager1Score, lowestScore.manager2Score)) {
        lowestScore = extreme
      }

      // Track biggest blowout
      if (!biggestBlowout || margin > biggestBlowout.margin) {
        biggestBlowout = extreme
      }

      // Track closest game (non-ties)
      if (margin > 0 && (!closestGame || margin < closestGame.margin)) {
        closestGame = extreme
      }
    }

    return {
      highestScore,
      lowestScore,
      biggestBlowout,
      closestGame
    }
  }

  /**
   * Get rivalry insights (most competitive, most lopsided, etc)
   */
  async getRivalryInsights(matchups?: any[]) {
    const records = await this.getHeadToHeadRecords(matchups)

    // Handle empty data case
    if (records.length === 0) {
      return {
        biggestRivalry: { manager1: 'No data', manager2: 'No data', totalGames: 0 },
        mostCompetitive: { manager1: 'No data', manager2: 'No data', totalGames: 0 },
        mostLopsided: { manager1: 'No data', manager2: 'No data', totalGames: 0 }
      }
    }

    // Most games played (biggest rivalry)
    const biggestRivalry = records.reduce((max, record) => 
      record.totalGames > max.totalGames ? record : max
    , records[0])

    // Most competitive (closest to .500)
    const mostCompetitive = records.reduce((closest, record) => {
      const recordWinPct = record.totalGames > 0 ? record.manager1Wins / record.totalGames : 0.5
      const closestWinPct = closest.totalGames > 0 ? closest.manager1Wins / closest.totalGames : 0.5
      const recordDiff = Math.abs(recordWinPct - 0.5)
      const closestDiff = Math.abs(closestWinPct - 0.5)
      return recordDiff < closestDiff ? record : closest
    }, records[0])

    // Most lopsided (furthest from .500, min 5 games)
    const mostLopsided = records
      .filter(r => r.totalGames >= 5)
      .reduce((lopsided, record) => {
        const recordWinPct = record.totalGames > 0 ? record.manager1Wins / record.totalGames : 0.5
        const lopsidedWinPct = lopsided.totalGames > 0 ? lopsided.manager1Wins / lopsided.totalGames : 0.5
        const recordDiff = Math.abs(recordWinPct - 0.5)
        const lopsidedDiff = Math.abs(lopsidedWinPct - 0.5)
        return recordDiff > lopsidedDiff ? record : lopsided
      }, records.filter(r => r.totalGames >= 5)[0] || records[0])

    return {
      biggestRivalry,
      mostCompetitive,
      mostLopsided
    }
  }
}

