import { SharedTeamData } from '@/lib/analytics/sharedData'
import { HeadToHeadAnalytics } from '@/lib/analytics/headToHead'
import { logger } from '@/lib/logger'

export interface WeeklyMatchup {
  week: number
  team1: {
    name: string
    manager: string
    points: number
  }
  team2: {
    name: string
    manager: string
    points: number
  }
  winner: string
  margin: number
  isClose: boolean // Margin < 10 points
  isBlowout: boolean // Margin > 50 points
}

export interface SeasonContext {
  phase: 'early' | 'mid' | 'playoff-race' | 'playoffs' | 'offseason'
  weeksRemaining: number
  totalWeeks: number
  playoffCutoff: number
  teamsInPlayoffRace: number
  isPlayoffWeek: boolean
}

export interface ManagerTrend {
  manager: string
  recentWins: number
  recentLosses: number
  recentPoints: number
  trend: 'hot' | 'cold' | 'steady'
  streak: { type: 'win' | 'loss'; count: number } | null
}

export interface EnhancedHeadToHeadContext {
  manager1: string
  manager2: string
  allTimeRecord: string // e.g., "5-3"
  seasonRecord: string // e.g., "2-1"
  lastMeeting: string // e.g., "Week 10: Manager1 won 120-115"
  closestGame: { margin: number; week: number; season: string } | null
  biggestBlowout: { margin: number; week: number; season: string } | null
  avgMargin: number
  totalGames: number
}

export interface WeeklySummaryData {
  currentWeek: number
  season: string
  seasonContext: SeasonContext
  matchups: WeeklyMatchup[]
  closeGames: WeeklyMatchup[]
  blowouts: WeeklyMatchup[]
  standings: Array<{
    rank: number
    manager: string
    wins: number
    losses: number
    pointsFor: number
    gamesBack: number
  }>
  interestingStats: {
    highestScore: { manager: string; points: number; week: number }
    closestGame: WeeklyMatchup | null
    biggestBlowout: WeeklyMatchup | null
    activeStreaks: Array<{ manager: string; type: 'win' | 'loss'; count: number }>
  }
  headToHeadContext: EnhancedHeadToHeadContext[]
  managerTrends: ManagerTrend[]
  playoffImplications: {
    teamsClinched: string[]
    teamsEliminated: string[]
    teamsOnBubble: string[]
    keyMatchupsNextWeek: Array<{ manager1: string; manager2: string; reason: string }>
  }
}

export class WeeklyDataAggregator {
  private cachedTeamData: any[] | null = null
  private cachedMatchupData: any[] | null = null

  /**
   * Get cached team and matchup data
   */
  private async getCachedData() {
    if (!this.cachedTeamData || !this.cachedMatchupData) {
      const [teams, matchups] = await Promise.all([
        SharedTeamData.getAllTeams(),
        SharedTeamData.getAllMatchups(),
      ])
      this.cachedTeamData = teams
      this.cachedMatchupData = matchups
    }
    return { teams: this.cachedTeamData, matchups: this.cachedMatchupData }
  }

  /**
   * Get current season and week
   */
  private getCurrentSeasonAndWeek(teams: any[], matchups: any[]): { season: string; week: number } {
    const seasons = [...new Set(teams.map((t) => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1] || new Date().getFullYear().toString()

    const currentSeasonMatchups = matchups.filter((m) => m.season === currentSeason)
    const weeks = [...new Set(currentSeasonMatchups.map((m) => m.week))].sort()
    const currentWeek = weeks[weeks.length - 1] || 1

    return { season: currentSeason, week: currentWeek }
  }

  /**
   * Get weekly matchups for current week
   */
  async getWeeklyMatchups(week?: number): Promise<WeeklyMatchup[]> {
    const { teams, matchups } = await this.getCachedData()
    const { season, week: currentWeek } = this.getCurrentSeasonAndWeek(teams, matchups)
    const targetWeek = week || currentWeek

    const weekMatchups = matchups.filter(
      (m) => m.season === season && m.week === targetWeek && m.team1Points !== null && m.team2Points !== null
    )

    const formatted: WeeklyMatchup[] = []

    for (const matchup of weekMatchups) {
      const team1 = teams.find((t) => t.teamKey === matchup.team1Key && t.season === season)
      const team2 = teams.find((t) => t.teamKey === matchup.team2Key && t.season === season)

      if (!team1 || !team2) continue

      const team1Points = matchup.team1Points || 0
      const team2Points = matchup.team2Points || 0
      const margin = Math.abs(team1Points - team2Points)
      const winner = team1Points > team2Points ? team1.managerNickname || team1.name : team2.managerNickname || team2.name

      formatted.push({
        week: targetWeek,
        team1: {
          name: team1.name,
          manager: team1.managerNickname || 'Unknown',
          points: team1Points,
        },
        team2: {
          name: team2.name,
          manager: team2.managerNickname || 'Unknown',
          points: team2Points,
        },
        winner,
        margin,
        isClose: margin < 10,
        isBlowout: margin > 50,
      })
    }

    return formatted
  }

  /**
   * Get season context (early, mid, playoff race, playoffs)
   */
  getSeasonContext(week: number, totalWeeks: number, standings: Array<{ rank: number; wins: number; losses: number }>): SeasonContext {
    const weeksRemaining = totalWeeks - week
    const playoffCutoff = Math.ceil(standings.length / 2) // Top half make playoffs
    const teamsInPlayoffRace = standings.filter(s => {
      const gamesBack = (standings[playoffCutoff - 1]?.wins || 0) - s.wins
      return gamesBack <= 2 && s.rank > playoffCutoff
    }).length

    let phase: SeasonContext['phase'] = 'mid'
    if (week <= 4) {
      phase = 'early'
    } else if (week >= totalWeeks - 2) {
      phase = 'playoffs'
    } else if (weeksRemaining <= 4 && weeksRemaining > 0) {
      phase = 'playoff-race'
    } else if (weeksRemaining <= 0) {
      phase = 'offseason'
    }

    return {
      phase,
      weeksRemaining,
      totalWeeks,
      playoffCutoff,
      teamsInPlayoffRace,
      isPlayoffWeek: week >= totalWeeks - 2,
    }
  }

  /**
   * Get manager trends (hot/cold streaks, recent performance)
   */
  async getManagerTrends(week: number): Promise<ManagerTrend[]> {
    const { teams, matchups } = await this.getCachedData()
    const { season } = this.getCurrentSeasonAndWeek(teams, matchups)

    // Get last 3 weeks of matchups for trend analysis
    const recentMatchups = matchups.filter(
      (m) => m.season === season && m.week >= week - 3 && m.week < week && m.team1Points !== null && m.team2Points !== null
    )

    const managerStats = new Map<string, { wins: number; losses: number; points: number; lastResults: ('win' | 'loss')[] }>()

    for (const matchup of recentMatchups) {
      const team1 = teams.find((t) => t.teamKey === matchup.team1Key && t.season === season)
      const team2 = teams.find((t) => t.teamKey === matchup.team2Key && t.season === season)
      if (!team1 || !team2) continue

      const manager1 = team1.managerNickname || 'Unknown'
      const manager2 = team2.managerNickname || 'Unknown'
      const team1Won = (matchup.team1Points || 0) > (matchup.team2Points || 0)

      if (!managerStats.has(manager1)) {
        managerStats.set(manager1, { wins: 0, losses: 0, points: 0, lastResults: [] })
      }
      if (!managerStats.has(manager2)) {
        managerStats.set(manager2, { wins: 0, losses: 0, points: 0, lastResults: [] })
      }

      const stats1 = managerStats.get(manager1)!
      const stats2 = managerStats.get(manager2)!

      stats1.points += matchup.team1Points || 0
      stats2.points += matchup.team2Points || 0

      if (team1Won) {
        stats1.wins++
        stats1.lastResults.push('win')
        stats2.losses++
        stats2.lastResults.push('loss')
      } else {
        stats2.wins++
        stats2.lastResults.push('win')
        stats1.losses++
        stats1.lastResults.push('loss')
      }
    }

    const trends: ManagerTrend[] = []
    for (const [manager, stats] of managerStats.entries()) {
      const winPct = stats.wins + stats.losses > 0 ? stats.wins / (stats.wins + stats.losses) : 0.5
      let trend: 'hot' | 'cold' | 'steady' = 'steady'
      if (winPct >= 0.67) trend = 'hot'
      else if (winPct <= 0.33) trend = 'cold'

      // Calculate current streak
      let streak: { type: 'win' | 'loss'; count: number } | null = null
      if (stats.lastResults.length > 0) {
        const lastResult = stats.lastResults[stats.lastResults.length - 1]
        let count = 1
        for (let i = stats.lastResults.length - 2; i >= 0; i--) {
          if (stats.lastResults[i] === lastResult) count++
          else break
        }
        streak = { type: lastResult, count }
      }

      trends.push({
        manager,
        recentWins: stats.wins,
        recentLosses: stats.losses,
        recentPoints: stats.points,
        trend,
        streak,
      })
    }

    return trends.sort((a, b) => b.recentWins - a.recentWins)
  }

  /**
   * Get enhanced historical context for head-to-head matchups
   */
  async getHistoricalContext(): Promise<EnhancedHeadToHeadContext[]> {
    const { matchups, teams } = await this.getCachedData()
    const { season } = this.getCurrentSeasonAndWeek(teams, matchups)

    const h2hAnalytics = new HeadToHeadAnalytics()
    const h2hRecords = await h2hAnalytics.getHeadToHeadRecords(matchups)

    const context: EnhancedHeadToHeadContext[] = []

    for (const record of h2hRecords.slice(0, 15)) {
      // Find last meeting this season
      const lastMeeting = matchups
        .filter((m) => {
          const t1 = teams.find((t) => t.teamKey === m.team1Key && t.season === season)
          const t2 = teams.find((t) => t.teamKey === m.team2Key && t.season === season)
          if (!t1 || !t2) return false
          const m1 = t1.managerNickname || 'Unknown'
          const m2 = t2.managerNickname || 'Unknown'
          return (
            (m1 === record.manager1 && m2 === record.manager2) ||
            (m1 === record.manager2 && m2 === record.manager1)
          )
        })
        .sort((a, b) => b.week - a.week)[0]

      // Get season record
      const seasonMatchups = matchups.filter((m) => {
        const t1 = teams.find((t) => t.teamKey === m.team1Key && t.season === season)
        const t2 = teams.find((t) => t.teamKey === m.team2Key && t.season === season)
        if (!t1 || !t2) return false
        const m1 = t1.managerNickname || 'Unknown'
        const m2 = t2.managerNickname || 'Unknown'
        return (
          (m1 === record.manager1 && m2 === record.manager2) ||
          (m1 === record.manager2 && m2 === record.manager1)
        )
      })

      let seasonWins1 = 0
      let seasonWins2 = 0
      for (const m of seasonMatchups) {
        const t1 = teams.find((t) => t.teamKey === m.team1Key && t.season === season)
        const t2 = teams.find((t) => t.teamKey === m.team2Key && t.season === season)
        if (!t1 || !t2) continue
        const m1 = t1.managerNickname || 'Unknown'
        const won = (m.team1Points || 0) > (m.team2Points || 0)
        if (m1 === record.manager1) {
          if (won) seasonWins1++
          else seasonWins2++
        } else {
          if (won) seasonWins2++
          else seasonWins1++
        }
      }

      let lastMeetingText = 'No meetings this season'
      if (lastMeeting) {
        const t1 = teams.find((t) => t.teamKey === lastMeeting.team1Key && t.season === season)
        const t2 = teams.find((t) => t.teamKey === lastMeeting.team2Key && t.season === season)
        if (t1 && t2) {
          const winner = (lastMeeting.team1Points || 0) > (lastMeeting.team2Points || 0) 
            ? t1.managerNickname || t1.name
            : t2.managerNickname || t2.name
          const score1 = lastMeeting.team1Points || 0
          const score2 = lastMeeting.team2Points || 0
          lastMeetingText = `Week ${lastMeeting.week}: ${winner} won ${Math.max(score1, score2).toFixed(1)}-${Math.min(score1, score2).toFixed(1)}`
        }
      }

      const avgMargin = record.totalGames > 0 
        ? ((record.manager1AvgMargin + record.manager2AvgMargin) / record.totalGames)
        : 0

      context.push({
        manager1: record.manager1,
        manager2: record.manager2,
        allTimeRecord: `${record.manager1Wins}-${record.manager2Wins}${record.ties > 0 ? `-${record.ties}` : ''}`,
        seasonRecord: seasonMatchups.length > 0 ? `${seasonWins1}-${seasonWins2}` : '0-0',
        lastMeeting: lastMeetingText,
        closestGame: record.closestGame,
        biggestBlowout: record.biggestBlowout,
        avgMargin: Math.round(avgMargin * 10) / 10,
        totalGames: record.totalGames,
      })
    }

    return context
  }

  /**
   * Get interesting stats for the week
   */
  async getInterestingStats(weekMatchups: WeeklyMatchup[]): Promise<WeeklySummaryData['interestingStats']> {
    if (weekMatchups.length === 0) {
      return {
        highestScore: { manager: 'N/A', points: 0, week: 0 },
        closestGame: null,
        biggestBlowout: null,
        activeStreaks: [],
      }
    }

    // Find highest score
    let highestScore = { manager: 'N/A', points: 0, week: 0 }
    for (const matchup of weekMatchups) {
      if (matchup.team1.points > highestScore.points) {
        highestScore = { manager: matchup.team1.manager, points: matchup.team1.points, week: matchup.week }
      }
      if (matchup.team2.points > highestScore.points) {
        highestScore = { manager: matchup.team2.manager, points: matchup.team2.points, week: matchup.week }
      }
    }

    // Find closest game
    const closeGames = weekMatchups.filter((m) => m.isClose).sort((a, b) => a.margin - b.margin)
    const closestGame = closeGames.length > 0 ? closeGames[0] : null

    // Find biggest blowout
    const blowouts = weekMatchups.filter((m) => m.isBlowout).sort((a, b) => b.margin - a.margin)
    const biggestBlowout = blowouts.length > 0 ? blowouts[0] : null

    // Calculate active streaks (simplified - would need more data for accurate streaks)
    const activeStreaks: Array<{ manager: string; type: 'win' | 'loss'; count: number }> = []

    return {
      highestScore,
      closestGame,
      biggestBlowout,
      activeStreaks,
    }
  }

  /**
   * Get current standings with games back
   */
  async getStandings(): Promise<Array<{ rank: number; manager: string; wins: number; losses: number; pointsFor: number; gamesBack: number }>> {
    const { teams } = await this.getCachedData()
    const { season } = this.getCurrentSeasonAndWeek(teams, [])

    const currentSeasonTeams = teams
      .filter((t) => t.season === season)
      .sort((a, b) => {
        const rankDiff = (a.rank || 999) - (b.rank || 999)
        if (rankDiff !== 0) return rankDiff
        return (b.pointsFor || 0) - (a.pointsFor || 0)
      })

    const firstPlaceWins = currentSeasonTeams[0]?.wins || 0

    return currentSeasonTeams.slice(0, 12).map((team) => ({
      rank: team.rank || 0,
      manager: team.managerNickname || team.name,
      wins: team.wins || 0,
      losses: team.losses || 0,
      pointsFor: team.pointsFor || 0,
      gamesBack: firstPlaceWins - (team.wins || 0),
    }))
  }

  /**
   * Get playoff implications
   */
  async getPlayoffImplications(week: number, standings: Array<{ rank: number; manager: string; wins: number; losses: number }>, weekMatchups: WeeklyMatchup[]): Promise<WeeklySummaryData['playoffImplications']> {
    const { teams, matchups } = await this.getCachedData()
    const { season } = this.getCurrentSeasonAndWeek(teams, matchups)

    const playoffCutoff = Math.ceil(standings.length / 2)
    const teamsClinched: string[] = []
    const teamsEliminated: string[] = []
    const teamsOnBubble: string[] = []

    // Simple logic: if you're 4+ games ahead of 7th place with 3 weeks left, you're likely in
    // If you're 4+ games behind 6th place with 3 weeks left, you're likely out
    const weeksRemaining = 21 - week // Assuming 21-week season
    if (weeksRemaining <= 4 && weeksRemaining > 0) {
      const cutoffWins = standings[playoffCutoff - 1]?.wins || 0
      const seventhWins = standings[playoffCutoff]?.wins || 0

      for (const team of standings) {
        if (team.rank <= playoffCutoff) {
          const gamesAhead = team.wins - seventhWins
          if (gamesAhead >= weeksRemaining) {
            teamsClinched.push(team.manager)
          } else if (gamesAhead <= 1) {
            teamsOnBubble.push(team.manager)
          }
        } else {
          const gamesBehind = cutoffWins - team.wins
          if (gamesBehind >= weeksRemaining) {
            teamsEliminated.push(team.manager)
          } else if (gamesBehind <= 2) {
            teamsOnBubble.push(team.manager)
          }
        }
      }
    }

    // Find key matchups next week (bubble teams playing each other or top teams)
    const keyMatchupsNextWeek: Array<{ manager1: string; manager2: string; reason: string }> = []
    // This would require next week's matchups - simplified for now
    const bubbleManagers = new Set(teamsOnBubble)
    for (const matchup of weekMatchups.slice(0, 3)) {
      if (bubbleManagers.has(matchup.team1.manager) || bubbleManagers.has(matchup.team2.manager)) {
        keyMatchupsNextWeek.push({
          manager1: matchup.team1.manager,
          manager2: matchup.team2.manager,
          reason: 'Playoff implications',
        })
      }
    }

    return {
      teamsClinched,
      teamsEliminated,
      teamsOnBubble,
      keyMatchupsNextWeek,
    }
  }

  /**
   * Aggregate all weekly data for weekly summaries
   */
  async aggregateWeeklyData(week?: number): Promise<WeeklySummaryData> {
    logger.info('Aggregating weekly data', { week })

    const { teams, matchups } = await this.getCachedData()
    const { season, week: currentWeek } = this.getCurrentSeasonAndWeek(teams, matchups)
    const targetWeek = week || currentWeek

    const weekMatchups = await this.getWeeklyMatchups(targetWeek)
    const closeGames = weekMatchups.filter((m) => m.isClose)
    const blowouts = weekMatchups.filter((m) => m.isBlowout)
    const standings = await this.getStandings()
    const interestingStats = await this.getInterestingStats(weekMatchups)
    const headToHeadContext = await this.getHistoricalContext()
    const managerTrends = await this.getManagerTrends(targetWeek)

    // Determine total weeks (assume 21 for NHL, but could be dynamic)
    const allWeeks = [...new Set(matchups.filter(m => m.season === season).map(m => m.week))].sort()
    const totalWeeks = allWeeks.length > 0 ? Math.max(...allWeeks) : 21
    const seasonContext = this.getSeasonContext(targetWeek, totalWeeks, standings)
    const playoffImplications = await this.getPlayoffImplications(targetWeek, standings, weekMatchups)

    // Validate data before returning
    if (!weekMatchups || weekMatchups.length === 0) {
      logger.warn('No matchups found for weekly summary', { week: targetWeek, season })
    }

    return {
      currentWeek: targetWeek,
      season,
      seasonContext,
      matchups: weekMatchups,
      closeGames,
      blowouts,
      standings,
      interestingStats,
      headToHeadContext,
      managerTrends,
      playoffImplications,
    }
  }
}

