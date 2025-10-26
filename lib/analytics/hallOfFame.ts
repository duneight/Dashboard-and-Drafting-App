import { prisma } from '@/lib/db/prisma'
import { MatchupStatsParser } from '@/lib/services/matchupStatsParser'
import { SharedTeamData } from './sharedData'
import { getManagerAvatarUrl, getManagerDisplayName } from '@/lib/avatars'

export interface HallOfFameEntry {
  rank: number
  manager: string
  value: number | string
  description: string
  season?: string
  avatarUrl?: string
}

export class HallOfFameAnalytics {
  private matchupStatsParser = new MatchupStatsParser()

  /**
   * Helper method to deduplicate entries by manager and return top 3
   */
  private deduplicateAndLimit(entries: HallOfFameEntry[]): HallOfFameEntry[] {
    return entries
      .filter((entry, index, array) => {
        // Remove duplicates - only keep the first occurrence of each manager
        return array.findIndex(e => e.manager === entry.manager) === index
      })
      .slice(0, 3) // Take only top 3 after deduplication
  }

  // ============================================================================
  // ALL-TIME ACHIEVEMENTS
  // ============================================================================

  /**
   * Dynasty King - Most championships (1st place finishes)
   */
  async getDynastyKing(teams?: any[]): Promise<HallOfFameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find the most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    // Filter champions (rank 1) with proper finished logic
    const champions = teamData.filter(t => {
      const isSeasonFinished = t.season !== currentSeason || t.isFinished
      return t.rank === 1 && isSeasonFinished
    })

    // Group by manager and calculate average finish for tiebreaker
    const counts = new Map<string, { count: number; seasons: string[]; averageFinish: number }>()
    
    // First, count championships
    for (const champ of champions) {
      const manager = champ.managerNickname || 'Unknown'
      if (!counts.has(manager)) {
        counts.set(manager, { count: 0, seasons: [], averageFinish: 0 })
      }
      const entry = counts.get(manager)!
      entry.count++
      entry.seasons.push(champ.season)
    }

    // Then calculate average finish for each manager with championships
    for (const [manager, data] of counts.entries()) {
      const managerTeams = teamData.filter(t => {
        const isSeasonFinished = t.season !== currentSeason || t.isFinished
        return (t.managerNickname || 'Unknown') === manager && isSeasonFinished
      })
      
      if (managerTeams.length > 0) {
        const totalRank = managerTeams.reduce((sum, team) => sum + (team.rank || 0), 0)
        data.averageFinish = totalRank / managerTeams.length
      }
    }

    const sortedEntries = Array.from(counts.entries())
      .sort((a, b) => {
        // Primary sort: most championships
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count
        }
        // Tiebreaker: best average finish (lower is better)
        return a[1].averageFinish - b[1].averageFinish
      })
      .slice(0, 10)

    return this.deduplicateAndLimit(sortedEntries.map(([manager, data], index) => {
      // Check if this entry is tied with the leader
      const isTied = index > 0 && data.count === sortedEntries[0][1].count
      
      return {
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: data.count,
        description: `${data.count} championship${data.count > 1 ? 's' : ''}${isTied ? '\n(tiebreaker: avg finish)' : ''}`,
        avatarUrl: getManagerAvatarUrl(manager),
      }
    }))
  }

  /**
   * Point Titan - Most total fantasy points all-time
   */
  async getPointTitan(teams?: any[]): Promise<HallOfFameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()

    // Sum by manager
    const totals = new Map<string, number>()
    for (const team of teamData) {
      const manager = team.managerNickname || 'Unknown'
      totals.set(manager, (totals.get(manager) || 0) + team.pointsFor)
    }

    return this.deduplicateAndLimit(Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, points], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: Math.round(points),
        description: `${Math.round(points).toLocaleString()} points`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * The Consistent - Best win percentage (min 5 seasons)
   */
  async getTheConsistent(teams?: any[]): Promise<HallOfFameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()

    // Calculate win% per manager
    const stats = new Map<string, { wins: number; games: number }>()
    for (const team of teamData) {
      const manager = team.managerNickname || 'Unknown'
      if (!stats.has(manager)) {
        stats.set(manager, { wins: 0, games: 0 })
      }
      const entry = stats.get(manager)!
      entry.wins += team.wins + team.ties * 0.5
      entry.games += team.wins + team.losses + team.ties
    }

    // No minimum games filter - include all managers
    return this.deduplicateAndLimit(Array.from(stats.entries())
      .map(([manager, data]) => ({
        manager,
        winPct: (data.wins / data.games) * 100,
      }))
      .sort((a, b) => b.winPct - a.winPct)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(entry.manager),
        value: entry.winPct.toFixed(1),
        description: `${entry.winPct.toFixed(1)}% win rate`,
        avatarUrl: getManagerAvatarUrl(entry.manager),
      })))
  }

  /**
   * Playoff Warrior - Most playoff wins all-time
   */
  async getPlayoffWarrior(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    // Detect current season and filter it out
    const seasons = [...new Set(allMatchups.map(m => m.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    const filteredMatchups = allMatchups.filter(m => m.season !== currentSeason)
    
    const playoffMatchups = filteredMatchups.filter(m => m.isPlayoffs === true && m.winnerTeamKey !== null)

    // Count playoff wins by manager
    const wins = new Map<string, number>()
    for (const matchup of playoffMatchups) {
      const winner = matchup.winnerTeamKey
      const winnerManager = 
        matchup.team1.teamKey === winner ? matchup.team1.managerNickname :
        matchup.team2.teamKey === winner ? matchup.team2.managerNickname :
        null

      if (winnerManager) {
        wins.set(winnerManager, (wins.get(winnerManager) || 0) + 1)
      }
    }

    return this.deduplicateAndLimit(Array.from(wins.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} playoff win${count > 1 ? 's' : ''}`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * Goal Machine - Most goals scored all-time
   */
  async getGoalMachine(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithStats = allMatchups.filter(m => m.team1Stats !== null && m.team2Stats !== null)

    // Parse goals and sum by manager
    const goals = new Map<string, number>()
    for (const matchup of matchupsWithStats) {
      try {
        const { team1Stats, team2Stats } = this.matchupStatsParser.parseMatchupStats(matchup)
        
        const manager1 = matchup.team1.managerNickname || 'Unknown'
        const manager2 = matchup.team2.managerNickname || 'Unknown'
        
        goals.set(manager1, (goals.get(manager1) || 0) + (team1Stats.goals || 0))
        goals.set(manager2, (goals.get(manager2) || 0) + (team2Stats.goals || 0))
      } catch (error) {
        // Skip matchups with parsing errors
        continue
      }
    }

    return this.deduplicateAndLimit(Array.from(goals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} goals`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * Iron Wall - Most goalie wins all-time
   */
  async getIronWall(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithStats = allMatchups.filter(m => m.team1Stats !== null && m.team2Stats !== null)

    // Parse goalie wins and sum by manager
    const goalieWins = new Map<string, number>()
    for (const matchup of matchupsWithStats) {
      try {
        const { team1Stats, team2Stats } = this.matchupStatsParser.parseMatchupStats(matchup)
        
        const manager1 = matchup.team1.managerNickname || 'Unknown'
        const manager2 = matchup.team2.managerNickname || 'Unknown'
        
        goalieWins.set(manager1, (goalieWins.get(manager1) || 0) + (team1Stats.wins || 0))
        goalieWins.set(manager2, (goalieWins.get(manager2) || 0) + (team2Stats.wins || 0))
      } catch (error) {
        continue
      }
    }

    return this.deduplicateAndLimit(Array.from(goalieWins.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} goalie wins`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * Shutout King - Most shutouts all-time
   */
  async getShutoutKing(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithStats = allMatchups.filter(m => m.team1Stats !== null && m.team2Stats !== null)

    // Parse shutouts and sum by manager
    const shutouts = new Map<string, number>()
    for (const matchup of matchupsWithStats) {
      try {
        const { team1Stats, team2Stats } = this.matchupStatsParser.parseMatchupStats(matchup)
        
        const manager1 = matchup.team1.managerNickname || 'Unknown'
        const manager2 = matchup.team2.managerNickname || 'Unknown'
        
        shutouts.set(manager1, (shutouts.get(manager1) || 0) + (team1Stats.shutouts || 0))
        shutouts.set(manager2, (shutouts.get(manager2) || 0) + (team2Stats.shutouts || 0))
      } catch (error) {
        continue
      }
    }

    return this.deduplicateAndLimit(Array.from(shutouts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} shutout${count > 1 ? 's' : ''}`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * The Playmaker - Most assists all-time
   */
  async getThePlaymaker(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithStats = allMatchups.filter(m => m.team1Stats !== null && m.team2Stats !== null)

    // Parse assists and sum by manager
    const assists = new Map<string, number>()
    for (const matchup of matchupsWithStats) {
      try {
        const { team1Stats, team2Stats } = this.matchupStatsParser.parseMatchupStats(matchup)
        
        const manager1 = matchup.team1.managerNickname || 'Unknown'
        const manager2 = matchup.team2.managerNickname || 'Unknown'
        
        assists.set(manager1, (assists.get(manager1) || 0) + (team1Stats.assists || 0))
        assists.set(manager2, (assists.get(manager2) || 0) + (team2Stats.assists || 0))
      } catch (error) {
        continue
      }
    }

    return this.deduplicateAndLimit(Array.from(assists.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} assists`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  // ============================================================================
  // SINGLE-SEASON RECORDS
  // ============================================================================

  /**
   * Season Dominator - Best single-season record + points
   */
  async getSeasonDominator(teams?: any[]): Promise<HallOfFameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    const sortedTeams = [...teamData]
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.pointsFor - a.pointsFor
      })
      .slice(0, 10)

    return this.deduplicateAndLimit(sortedTeams.map((team, index) => ({
      rank: index + 1,
      manager: getManagerDisplayName(team.managerNickname),
      value: `${team.wins}-${team.losses}-${team.ties}`,
      description: `${team.wins}-${team.losses}-${team.ties} record\n${Math.round(team.pointsFor)} points\n${team.season}`,
      avatarUrl: getManagerAvatarUrl(team.managerNickname),
    })))
  }

  /**
   * Weekly Explosion - Highest single-week score ever
   */
  async getWeeklyExplosion(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithPoints = allMatchups.filter(m => m.team1Points !== null || m.team2Points !== null)

    // Collect all weekly scores
    const scores: Array<{
      manager: string
      points: number
      week: number
      season: string
    }> = []

    for (const matchup of matchupsWithPoints) {
      if (matchup.team1Points) {
        scores.push({
          manager: matchup.team1.managerNickname || 'Unknown',
          points: matchup.team1Points,
          week: matchup.week,
          season: matchup.season,
        })
      }
      if (matchup.team2Points) {
        scores.push({
          manager: matchup.team2.managerNickname || 'Unknown',
          points: matchup.team2Points,
          week: matchup.week,
          season: matchup.season,
        })
      }
    }

    return this.deduplicateAndLimit(scores
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((score, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(score.manager),
        value: score.points.toFixed(1),
        description: `${score.points.toFixed(1)} points in Week ${score.week}\n${score.season}`,
        avatarUrl: getManagerAvatarUrl(score.manager),
      })))
  }

  /**
   * Unstoppable - Longest win streak
   */
  async getUnstoppable(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithWinners = allMatchups.filter(m => m.winnerTeamKey !== null)

    // Calculate win streaks
    const streaks: Array<{
      manager: string
      streak: number
      startWeek: number
      endWeek: number
      season: string
    }> = []

    const currentStreaks = new Map<string, {
      count: number
      startWeek: number
      season: string
      manager: string
    }>()

    for (const matchup of matchupsWithWinners) {
      const winnerManager = 
        matchup.team1.teamKey === matchup.winnerTeamKey ? matchup.team1.managerNickname :
        matchup.team2.teamKey === matchup.winnerTeamKey ? matchup.team2.managerNickname :
        null

      if (!winnerManager) continue

      const key = `${winnerManager}-${matchup.season}`

      if (!currentStreaks.has(key)) {
        currentStreaks.set(key, {
          count: 1,
          startWeek: matchup.week,
          season: matchup.season,
          manager: winnerManager,
        })
      } else {
        const streak = currentStreaks.get(key)!
        streak.count++
      }

      // Check for streak end or record current
      const loserManager = 
        matchup.team1.teamKey !== matchup.winnerTeamKey ? matchup.team1.managerNickname :
        matchup.team2.managerNickname

      if (loserManager) {
        const loserKey = `${loserManager}-${matchup.season}`
        const loserStreak = currentStreaks.get(loserKey)
        if (loserStreak && loserStreak.count > 0) {
          streaks.push({
            manager: loserStreak.manager,
            streak: loserStreak.count,
            startWeek: loserStreak.startWeek,
            endWeek: matchup.week - 1,
            season: loserStreak.season,
          })
          currentStreaks.delete(loserKey)
        }
      }
    }

    // Add remaining streaks
    for (const [_, streak] of currentStreaks) {
      streaks.push({
        manager: streak.manager,
        streak: streak.count,
        startWeek: streak.startWeek,
        endWeek: streak.startWeek + streak.count - 1,
        season: streak.season,
      })
    }

    return this.deduplicateAndLimit(streaks
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 10)
      .map((s, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(s.manager),
        value: s.streak,
        description: `${s.streak} game win streak\n${s.season} (Weeks ${s.startWeek}-${s.endWeek})`,
        avatarUrl: getManagerAvatarUrl(s.manager),
      })))
  }

  /**
   * Close Game Specialist - Best win percentage in close games (<10 point margin)
   */
  async getCloseGameSpecialist(matchups?: any[]): Promise<HallOfFameEntry[]> {
    const matchupData = matchups || await SharedTeamData.getAllMatchups()
    
    const managerStats = new Map<string, { closeGames: number; closeWins: number }>()
    
    matchupData.forEach(m => {
      const margin = Math.abs((m.team1Points || 0) - (m.team2Points || 0))
      
      if (margin < 10) {
        const manager1 = m.team1.managerNickname || 'Unknown'
        const manager2 = m.team2.managerNickname || 'Unknown'
        
        if (!managerStats.has(manager1)) {
          managerStats.set(manager1, { closeGames: 0, closeWins: 0 })
        }
        if (!managerStats.has(manager2)) {
          managerStats.set(manager2, { closeGames: 0, closeWins: 0 })
        }
        
        const stats1 = managerStats.get(manager1)!
        const stats2 = managerStats.get(manager2)!
        
        stats1.closeGames++
        stats2.closeGames++
        
        if ((m.team1Points || 0) > (m.team2Points || 0)) {
          stats1.closeWins++
        } else {
          stats2.closeWins++
        }
      }
    })
    
    return this.deduplicateAndLimit(Array.from(managerStats.entries())
      .map(([manager, stats]) => ({
        manager,
        closeGames: stats.closeGames,
        closeGameWins: stats.closeWins,
        closeGameWinPct: stats.closeGames > 0 ? stats.closeWins / stats.closeGames : 0
      }))
      .filter(m => m.closeGames >= 5) // At least 5 close games
      .sort((a, b) => b.closeGameWinPct - a.closeGameWinPct)
      .slice(0, 10)
      .map((specialist, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(specialist.manager),
        value: `${(specialist.closeGameWinPct * 100).toFixed(1)}%`,
        description: `${specialist.closeGameWins}/${specialist.closeGames} close game wins`,
        avatarUrl: getManagerAvatarUrl(specialist.manager),
      })))
  }
}
