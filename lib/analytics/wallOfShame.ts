import { prisma } from '@/lib/db/prisma'
import { MatchupStatsParser } from '@/lib/services/matchupStatsParser'
import { SharedTeamData } from './sharedData'
import { getManagerAvatarUrl, getManagerDisplayName } from '@/lib/avatars'

export interface WallOfShameEntry {
  rank: number
  manager: string
  value: number | string
  description: string
  season?: string
  avatarUrl?: string
}

export class WallOfShameAnalytics {
  private matchupStatsParser = new MatchupStatsParser()

  /**
   * Helper method to deduplicate entries by manager and return top 3
   */
  private deduplicateAndLimit(entries: WallOfShameEntry[]): WallOfShameEntry[] {
    return entries
      .filter((entry, index, array) => {
        // Remove duplicates - only keep the first occurrence of each manager
        return array.findIndex(e => e.manager === entry.manager) === index
      })
      .slice(0, 3) // Take only top 3 after deduplication
  }

  // ============================================================================
  // ALL-TIME DISAPPOINTMENTS
  // ============================================================================

  /**
   * Eternal Last - Average of all season lowest rankings
   */
  async getEternalLast(teams?: any[]): Promise<WallOfShameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Detect current season and filter it out
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    const filteredTeams = teamData.filter(t => t.season !== currentSeason)

    // Calculate average lowest ranking per manager
    const managerStats = new Map<string, { totalRank: number; seasons: number }>()
    
    for (const team of filteredTeams) {
      const manager = team.managerNickname || 'Unknown'
      if (!managerStats.has(manager)) {
        managerStats.set(manager, { totalRank: 0, seasons: 0 })
      }
      const stats = managerStats.get(manager)!
      stats.totalRank += team.rank || 0
      stats.seasons += 1
    }

    return this.deduplicateAndLimit(Array.from(managerStats.entries())
      .map(([manager, stats]) => ({
        manager,
        averageRank: stats.totalRank / stats.seasons,
        seasons: stats.seasons
      }))
      .sort((a, b) => b.averageRank - a.averageRank) // Higher average rank = worse
      .slice(0, 10)
      .map(({ manager, averageRank, seasons }, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: Math.round(averageRank),
        description: `Average rank: ${Math.round(averageRank)}\nover ${seasons} season${seasons > 1 ? 's' : ''}`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * Close but No Cigar - Most 2nd/3rd place finishes with no championships
   */
  async getCloseButNoCigar(teams?: any[]): Promise<WallOfShameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Detect current season and filter it out
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    const filteredTeams = teamData.filter(t => t.season !== currentSeason)

    // Track near-misses per manager
    const nearMisses = new Map<string, { secondPlaces: number; thirdPlaces: number; seasons: number }>()
    
    for (const team of filteredTeams) {
      const manager = team.managerNickname || 'Unknown'
      if (!nearMisses.has(manager)) {
        nearMisses.set(manager, { secondPlaces: 0, thirdPlaces: 0, seasons: 0 })
      }
      const stats = nearMisses.get(manager)!
      
      if (team.rank === 2) {
        stats.secondPlaces++
      } else if (team.rank === 3) {
        stats.thirdPlaces++
      }
      stats.seasons++
    }

    // Filter out managers who have won championships
    const champions = new Set<string>()
    for (const team of filteredTeams) {
      if (team.rank === 1) {
        champions.add(team.managerNickname || 'Unknown')
      }
    }

    return this.deduplicateAndLimit(Array.from(nearMisses.entries())
      .filter(([manager, _]) => !champions.has(manager)) // Only non-champions
      .filter(([_, stats]) => stats.secondPlaces > 0 || stats.thirdPlaces > 0) // Must have at least one near-miss
      .map(([manager, stats]) => ({
        manager,
        totalNearMisses: stats.secondPlaces + stats.thirdPlaces,
        secondPlaces: stats.secondPlaces,
        thirdPlaces: stats.thirdPlaces,
        seasons: stats.seasons
      }))
      .sort((a, b) => b.totalNearMisses - a.totalNearMisses) // Sort by total near-misses
      .slice(0, 10)
      .map(({ manager, totalNearMisses, secondPlaces, thirdPlaces, seasons }, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: totalNearMisses,
        description: (() => {
          const parts = []
          if (secondPlaces > 0) {
            parts.push(`${secondPlaces} second-place${secondPlaces !== 1 ? 's' : ''}`)
          }
          if (thirdPlaces > 0) {
            parts.push(`${thirdPlaces} third-place${thirdPlaces !== 1 ? 's' : ''}`)
          }
          return parts.join('\n')
        })(),
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * Playoff Choker - Most playoff losses without a championship
   */
  async getPlayoffChoker(matchups?: any[], teams?: any[]): Promise<WallOfShameEntry[]> {
    // Get all playoff matchups
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    const playoffMatchups = allMatchups.filter(m => m.isPlayoffs === true)

    // Get all champions with proper finished logic
    const allTeams = teams || await SharedTeamData.getAllTeams()
    
    // Find the most current season
    const seasons = [...new Set(allTeams.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    // Filter champions with proper finished logic
    const champions = allTeams.filter(t => {
      const isSeasonFinished = t.season !== currentSeason || t.isFinished
      return t.rank === 1 && isSeasonFinished
    })

    const championManagers = new Set(champions.map(c => c.managerNickname))

    // Count playoff losses for non-champions
    const playoffLosses = new Map<string, number>()
    for (const matchup of playoffMatchups) {
      if (!matchup.winnerTeamKey) continue

      const loserManager = 
        matchup.team1.teamKey !== matchup.winnerTeamKey ? matchup.team1.managerNickname :
        matchup.team2.teamKey !== matchup.winnerTeamKey ? matchup.team2.managerNickname :
        null

      if (loserManager && !championManagers.has(loserManager)) {
        playoffLosses.set(loserManager, (playoffLosses.get(loserManager) || 0) + 1)
      }
    }

    return Array.from(playoffLosses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} playoff loss${count > 1 ? 'es' : ''}\nnever won`,
        avatarUrl: getManagerAvatarUrl(manager),
      }))
  }

  // ============================================================================
  // SINGLE-SEASON DISASTERS
  // ============================================================================

  /**
   * Rock Bottom - Worst single-season record
   */
  async getRockBottom(teams?: any[]): Promise<WallOfShameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Detect current season and filter it out
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    const filteredTeams = teamData.filter(t => t.season !== currentSeason)
    
    const sortedTeams = [...filteredTeams]
      .sort((a, b) => {
        if (a.wins !== b.wins) return a.wins - b.wins
        return b.losses - a.losses
      })
      .slice(0, 10)

    return this.deduplicateAndLimit(sortedTeams.map((team, index) => ({
      rank: index + 1,
      manager: getManagerDisplayName(team.managerNickname),
      value: `${team.wins}-${team.losses}-${team.ties}`,
      description: `${team.wins}-${team.losses}-${team.ties} record\n${team.season}`,
      avatarUrl: getManagerAvatarUrl(team.managerNickname),
    })))
  }

  /**
   * The Collapse - Longest losing streak
   */
  async getTheCollapse(matchups?: any[]): Promise<WallOfShameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const filteredMatchups = allMatchups.filter(m => m.winnerTeamKey !== null)

    // Calculate loss streaks
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

    for (const matchup of filteredMatchups) {
      const loserManager = 
        matchup.team1.teamKey !== matchup.winnerTeamKey ? matchup.team1.managerNickname :
        matchup.team2.teamKey !== matchup.winnerTeamKey ? matchup.team2.managerNickname :
        null

      if (!loserManager) continue

      const key = `${loserManager}-${matchup.season}`

      if (!currentStreaks.has(key)) {
        currentStreaks.set(key, {
          count: 1,
          startWeek: matchup.week,
          season: matchup.season,
          manager: loserManager,
        })
      } else {
        const streak = currentStreaks.get(key)!
        streak.count++
      }

      // Check for streak end
      const winnerManager = 
        matchup.team1.teamKey === matchup.winnerTeamKey ? matchup.team1.managerNickname :
        matchup.team2.managerNickname

      if (winnerManager) {
        const winnerKey = `${winnerManager}-${matchup.season}`
        const winnerStreak = currentStreaks.get(winnerKey)
        if (winnerStreak && winnerStreak.count > 0) {
          streaks.push({
            manager: winnerStreak.manager,
            streak: winnerStreak.count,
            startWeek: winnerStreak.startWeek,
            endWeek: matchup.week - 1,
            season: winnerStreak.season,
          })
          currentStreaks.delete(winnerKey)
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
        description: `${s.streak} game losing streak\n${s.season} (Weeks ${s.startWeek}-${s.endWeek})`,
        avatarUrl: getManagerAvatarUrl(s.manager),
      })))
  }

  /**
   * Brick Hands - Highest points against in one season
   */
  async getBrickHands(teams?: any[]): Promise<WallOfShameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    const sortedTeams = [...teamData]
      .sort((a, b) => b.pointsAgainst - a.pointsAgainst)
      .slice(0, 10)

    return this.deduplicateAndLimit(sortedTeams.map((team, index) => ({
      rank: index + 1,
      manager: getManagerDisplayName(team.managerNickname),
      value: Math.round(team.pointsAgainst),
      description: `${Math.round(team.pointsAgainst).toLocaleString()} points against\n${team.season}`,
      avatarUrl: getManagerAvatarUrl(team.managerNickname),
    })))
  }

  /**
   * The Heartbreak - Most losses by <5 points
   */
  async getTheHeartbreak(matchups?: any[]): Promise<WallOfShameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    const matchupsWithPoints = allMatchups.filter(m => 
      m.team1Points !== null && m.team2Points !== null && m.winnerTeamKey !== null
    )

    // Count close losses (<5 points) per manager
    const closeLosses = new Map<string, number>()
    
    for (const matchup of matchupsWithPoints) {
      const margin = Math.abs((matchup.team1Points || 0) - (matchup.team2Points || 0))
      
      if (margin < 5) {
        // Determine loser
        const loserManager = 
          matchup.team1.teamKey !== matchup.winnerTeamKey ? matchup.team1.managerNickname :
          matchup.team2.teamKey !== matchup.winnerTeamKey ? matchup.team2.managerNickname :
          null
        
        if (loserManager) {
          closeLosses.set(loserManager, (closeLosses.get(loserManager) || 0) + 1)
        }
      }
    }

    return this.deduplicateAndLimit(Array.from(closeLosses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([manager, count], index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(manager),
        value: count,
        description: `${count} loss${count > 1 ? 'es' : ''} by <5 points`,
        avatarUrl: getManagerAvatarUrl(manager),
      })))
  }

  /**
   * Glass Cannon - High points + bad rank (single season)
   */
  async getGlassCannon(teams?: any[]): Promise<WallOfShameEntry[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find teams with high points but bad rank (bottom half)
    const glassCannonSeasons = teamData
      .filter(team => {
        const bottomHalf = team.rank && team.rank > team.league.numTeams / 2
        return bottomHalf && team.pointsFor > 0
      })
      .sort((a, b) => b.pointsFor - a.pointsFor) // Sort by highest points
      .slice(0, 10)

    return this.deduplicateAndLimit(glassCannonSeasons.map((team, index) => ({
      rank: index + 1,
      manager: getManagerDisplayName(team.managerNickname),
      value: Math.round(team.pointsFor),
      description: `${Math.round(team.pointsFor).toLocaleString()} points\nfinished #${team.rank}\n${team.season}`,
      avatarUrl: getManagerAvatarUrl(team.managerNickname),
    })))
  }

  /**
   * The Snooze - Lowest weekly score ever
   */
  async getTheSnooze(matchups?: any[]): Promise<WallOfShameEntry[]> {
    const allMatchups = matchups || await SharedTeamData.getAllMatchups()
    
    // Detect current season and filter it out
    const seasons = [...new Set(allMatchups.map(m => m.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    const filteredMatchups = allMatchups.filter(m => m.season !== currentSeason)
    
    const matchupsWithPoints = filteredMatchups.filter(m => m.team1Points !== null || m.team2Points !== null)

    // Collect all weekly scores
    const scores: Array<{
      manager: string
      points: number
      week: number
      season: string
    }> = []

    for (const matchup of matchupsWithPoints) {
      if (matchup.team1Points !== null) {
        scores.push({
          manager: matchup.team1.managerNickname || 'Unknown',
          points: matchup.team1Points,
          week: matchup.week,
          season: matchup.season,
        })
      }
      if (matchup.team2Points !== null) {
        scores.push({
          manager: matchup.team2.managerNickname || 'Unknown',
          points: matchup.team2Points,
          week: matchup.week,
          season: matchup.season,
        })
      }
    }

    return this.deduplicateAndLimit(scores
      .sort((a, b) => a.points - b.points) // Lowest first
      .slice(0, 10)
      .map((score, index) => ({
        rank: index + 1,
        manager: getManagerDisplayName(score.manager),
        value: score.points.toFixed(1),
        description: `${score.points.toFixed(1)} points in Week ${score.week}\n${score.season}`,
        avatarUrl: getManagerAvatarUrl(score.manager),
      })))
  }
}
