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

// Memoization cache: keyed by the matchup object identity so repeated parses
// of the same cached matchup (e.g. across Hall of Fame categories) only
// JSON.parse once. WeakMap so entries are GC'd with the matchup objects.
const parsedStatsCache = new WeakMap<object, { team1Stats: ParsedStats; team2Stats: ParsedStats }>()

export class MatchupStatsParser {
  /**
   * Parse individual stat values from matchup JSON
   */
  parseMatchupStats(matchup: any): { team1Stats: ParsedStats; team2Stats: ParsedStats } {
    const cacheable = typeof matchup === 'object' && matchup !== null
    if (cacheable) {
      const cached = parsedStatsCache.get(matchup)
      if (cached) return cached
    }

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

    const result = {
      team1Stats: parseTeamStats(matchup.team1Stats),
      team2Stats: parseTeamStats(matchup.team2Stats)
    }

    if (cacheable) {
      parsedStatsCache.set(matchup, result)
    }

    return result
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
}
