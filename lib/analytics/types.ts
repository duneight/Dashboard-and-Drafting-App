/**
 * Shared types + helpers for the Hall of Fame / Wall of Shame analytics.
 */

export interface AnalyticsEntry {
  rank: number
  manager: string
  value: number | string
  description: string
  season?: string
  avatarUrl?: string
}

/**
 * Deduplicate entries by manager (keep first occurrence) and return top 3.
 */
export function deduplicateAndLimit(entries: AnalyticsEntry[]): AnalyticsEntry[] {
  return entries
    .filter((entry, index, array) => {
      // Remove duplicates - only keep the first occurrence of each manager
      return array.findIndex(e => e.manager === entry.manager) === index
    })
    .slice(0, 3) // Take only top 3 after deduplication
}

/**
 * The latest (lexicographically greatest) season present in the data.
 * Seasons are year strings, so lexicographic sort == chronological sort.
 */
export function latestSeason(data: Array<{ season: string }>): string {
  const seasons = [...new Set(data.map(t => t.season))].sort()
  return seasons[seasons.length - 1]
}

export interface StreakRecord {
  manager: string
  streak: number
  startWeek: number
  endWeek: number
  season: string
}

/**
 * Compute per-manager, per-season result streaks from matchups.
 *
 * mode 'win': streaks of consecutive wins (a loss ends the streak).
 * mode 'loss': streaks of consecutive losses (a win ends the streak).
 *
 * Preserves the original per-file logic exactly: streaks are keyed by
 * `${manager}-${season}`, a streak is recorded when the opposite result
 * occurs (endWeek = that matchup's week - 1), and any still-open streaks are
 * flushed at the end with endWeek = startWeek + count - 1. Matchups without
 * a winner are skipped.
 */
export function computeStreaks(matchups: any[], mode: 'win' | 'loss'): StreakRecord[] {
  const eligibleMatchups = matchups.filter(m => m.winnerTeamKey !== null)

  const streaks: StreakRecord[] = []

  const currentStreaks = new Map<string, {
    count: number
    startWeek: number
    season: string
    manager: string
  }>()

  for (const matchup of eligibleMatchups) {
    // The "subject" extends their streak this week (the winner in 'win'
    // mode, the loser in 'loss' mode); the opponent's streak — if any — is
    // broken by this result.
    const team1IsSubject = mode === 'win'
      ? matchup.team1.teamKey === matchup.winnerTeamKey
      : matchup.team1.teamKey !== matchup.winnerTeamKey
    const team2IsSubject = mode === 'win'
      ? matchup.team2.teamKey === matchup.winnerTeamKey
      : matchup.team2.teamKey !== matchup.winnerTeamKey

    const subjectManager =
      team1IsSubject ? matchup.team1.managerNickname :
      team2IsSubject ? matchup.team2.managerNickname :
      null

    if (!subjectManager) continue

    const key = `${subjectManager}-${matchup.season}`

    if (!currentStreaks.has(key)) {
      currentStreaks.set(key, {
        count: 1,
        startWeek: matchup.week,
        season: matchup.season,
        manager: subjectManager,
      })
    } else {
      const streak = currentStreaks.get(key)!
      streak.count++
    }

    // Check for the opponent's streak end
    const opponentManager = team1IsSubject
      ? matchup.team2.managerNickname
      : matchup.team1.managerNickname

    if (opponentManager) {
      const opponentKey = `${opponentManager}-${matchup.season}`
      const opponentStreak = currentStreaks.get(opponentKey)
      if (opponentStreak && opponentStreak.count > 0) {
        streaks.push({
          manager: opponentStreak.manager,
          streak: opponentStreak.count,
          startWeek: opponentStreak.startWeek,
          endWeek: matchup.week - 1,
          season: opponentStreak.season,
        })
        currentStreaks.delete(opponentKey)
      }
    }
  }

  // Add remaining streaks
  for (const streak of currentStreaks.values()) {
    streaks.push({
      manager: streak.manager,
      streak: streak.count,
      startWeek: streak.startWeek,
      endWeek: streak.startWeek + streak.count - 1,
      season: streak.season,
    })
  }

  return streaks
}

export interface WeeklyScore {
  manager: string
  points: number
  week: number
  season: string
}

/**
 * Flatten matchups into individual weekly team scores.
 *
 * mode 'high' preserves the original Weekly Explosion truthy check (skips
 * 0-point entries, which can never lead a highest-score ranking); mode 'low'
 * preserves the original Snooze `!== null` check (0-point entries included).
 */
export function collectWeeklyScores(matchups: any[], mode: 'high' | 'low'): WeeklyScore[] {
  const matchupsWithPoints = matchups.filter(m => m.team1Points !== null || m.team2Points !== null)

  const hasPoints = (points: number | null) =>
    mode === 'high' ? Boolean(points) : points !== null

  const scores: WeeklyScore[] = []

  for (const matchup of matchupsWithPoints) {
    if (hasPoints(matchup.team1Points)) {
      scores.push({
        manager: matchup.team1.managerNickname || 'Unknown',
        points: matchup.team1Points,
        week: matchup.week,
        season: matchup.season,
      })
    }
    if (hasPoints(matchup.team2Points)) {
      scores.push({
        manager: matchup.team2.managerNickname || 'Unknown',
        points: matchup.team2Points,
        week: matchup.week,
        season: matchup.season,
      })
    }
  }

  return scores
}
