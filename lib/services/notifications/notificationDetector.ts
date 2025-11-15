import { prisma } from '@/lib/db/prisma'
import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame'
import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { SharedTeamData } from '@/lib/analytics/sharedData'
import { HALL_OF_FAME_CATEGORIES, WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'
import { logger } from '@/lib/logger'

export interface DetectedChange {
  categoryId: string
  categoryName: string
  categoryType: 'hall-of-fame' | 'wall-of-shame'
  changeType: 'new-leader' | 'value-change' | 'new-entry' | 'rank-change'
  manager: string
  currentValue: string | number
  currentRank: number
  previousValue?: string | number
  previousRank?: number
  previousManager?: string
  season?: string
}

export class NotificationDetector {
  private hallOfFameAnalytics: HallOfFameAnalytics
  private wallOfShameAnalytics: WallOfShameAnalytics
  private cachedTeamData: any[] | null = null
  private cachedMatchupData: any[] | null = null

  constructor() {
    this.hallOfFameAnalytics = new HallOfFameAnalytics()
    this.wallOfShameAnalytics = new WallOfShameAnalytics()
  }

  /**
   * Get cached team and matchup data to avoid duplicate fetches
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
   * Get current season from team data
   */
  private getCurrentSeason(teams: any[]): string {
    const seasons = [...new Set(teams.map((t) => t.season))].sort()
    return seasons[seasons.length - 1] || new Date().getFullYear().toString()
  }

  /**
   * Fetch all Hall of Fame categories
   */
  private async fetchHallOfFameCategories(teams: any[], matchups: any[]) {
    const analytics = this.hallOfFameAnalytics
    const results: Map<string, any[]> = new Map()

    for (const category of HALL_OF_FAME_CATEGORIES) {
      try {
        let data: any[] = []
        switch (category.id) {
          case 'dynasty-king':
            data = await analytics.getDynastyKing(teams)
            break
          case 'point-titan':
            data = await analytics.getPointTitan(teams)
            break
          case 'the-consistent':
            data = await analytics.getTheConsistent(teams)
            break
          case 'playoff-warrior':
            data = await analytics.getPlayoffWarrior(matchups)
            break
          case 'goal-machine':
            data = await analytics.getGoalMachine(matchups)
            break
          case 'iron-wall':
            data = await analytics.getIronWall(matchups)
            break
          case 'shutout-king':
            data = await analytics.getShutoutKing(matchups)
            break
          case 'the-playmaker':
            data = await analytics.getThePlaymaker(matchups)
            break
          case 'season-dominator':
            data = await analytics.getSeasonDominator(teams)
            break
          case 'weekly-explosion':
            data = await analytics.getWeeklyExplosion(matchups)
            break
          case 'unstoppable':
            data = await analytics.getUnstoppable(matchups)
            break
          case 'close-game-specialist':
            data = await analytics.getCloseGameSpecialist(matchups)
            break
        }
        results.set(category.id, data)
      } catch (error) {
        logger.warn(`Error fetching Hall of Fame category ${category.id}`, { error })
        results.set(category.id, [])
      }
    }

    return results
  }

  /**
   * Fetch all Wall of Shame categories
   */
  private async fetchWallOfShameCategories(teams: any[], matchups: any[]) {
    const analytics = this.wallOfShameAnalytics
    const results: Map<string, any[]> = new Map()

    for (const category of WALL_OF_SHAME_CATEGORIES) {
      try {
        let data: any[] = []
        switch (category.id) {
          case 'eternal-last':
            data = await analytics.getEternalLast(teams)
            break
          case 'playoff-choker':
            data = await analytics.getPlayoffChoker(matchups, teams)
            break
          case 'close-but-no-cigar':
            data = await analytics.getCloseButNoCigar(teams)
            break
          case 'rock-bottom':
            data = await analytics.getRockBottom(teams)
            break
          case 'the-collapse':
            data = await analytics.getTheCollapse(matchups)
            break
          case 'brick-hands':
            data = await analytics.getBrickHands(teams)
            break
          case 'the-heartbreak':
            data = await analytics.getTheHeartbreak(matchups)
            break
          case 'glass-cannon':
            data = await analytics.getGlassCannon(teams)
            break
          case 'the-snooze':
            data = await analytics.getTheSnooze(matchups)
            break
        }
        results.set(category.id, data)
      } catch (error) {
        logger.warn(`Error fetching Wall of Shame category ${category.id}`, { error })
        results.set(category.id, [])
      }
    }

    return results
  }

  /**
   * Get previous snapshots for a category and season
   */
  private async getPreviousSnapshots(
    categoryId: string,
    season: string
  ): Promise<Map<number, { manager: string; value: string; rank: number }>> {
    // Get the most recent snapshot (excluding current sync)
    const snapshots = await prisma.recordSnapshot.findMany({
      where: {
        categoryId,
        season,
      },
      orderBy: {
        syncTimestamp: 'desc',
      },
      take: 1, // Get most recent
    })

    if (snapshots.length === 0) {
      return new Map()
    }

    // Get all records from that snapshot
    const snapshotTimestamp = snapshots[0].syncTimestamp
    const allSnapshots = await prisma.recordSnapshot.findMany({
      where: {
        categoryId,
        season,
        syncTimestamp: snapshotTimestamp,
      },
    })

    const result = new Map<number, { manager: string; value: string; rank: number }>()
    for (const snapshot of allSnapshots) {
      result.set(snapshot.rank, {
        manager: snapshot.manager,
        value: snapshot.value,
        rank: snapshot.rank,
      })
    }

    return result
  }

  /**
   * Detect changes in a category
   */
  private detectCategoryChanges(
    categoryId: string,
    categoryName: string,
    categoryType: 'hall-of-fame' | 'wall-of-shame',
    currentEntries: any[],
    previousSnapshots: Map<number, { manager: string; value: string; rank: number }>,
    season: string
  ): DetectedChange[] {
    const changes: DetectedChange[] = []

    for (const entry of currentEntries) {
      const rank = entry.rank
      const manager = entry.manager
      const value = entry.value?.toString() || ''

      const previous = previousSnapshots.get(rank)

      if (!previous) {
        // New entry in top 3
        changes.push({
          categoryId,
          categoryName,
          categoryType,
          changeType: 'new-entry',
          manager,
          currentValue: value,
          currentRank: rank,
          season,
        })
      } else if (previous.manager !== manager) {
        // New leader or rank change
        if (rank === 1) {
          changes.push({
            categoryId,
            categoryName,
            categoryType,
            changeType: 'new-leader',
            manager,
            currentValue: value,
            currentRank: rank,
            previousManager: previous.manager,
            previousValue: previous.value,
            previousRank: previous.rank,
            season,
          })
        } else {
          changes.push({
            categoryId,
            categoryName,
            categoryType,
            changeType: 'rank-change',
            manager,
            currentValue: value,
            currentRank: rank,
            previousManager: previous.manager,
            previousValue: previous.value,
            previousRank: previous.rank,
            season,
          })
        }
      } else if (previous.value !== value) {
        // Value changed (record broken)
        changes.push({
          categoryId,
          categoryName,
          categoryType,
          changeType: 'value-change',
          manager,
          currentValue: value,
          currentRank: rank,
          previousValue: previous.value,
          previousRank: previous.rank,
          season,
        })
      }
    }

    return changes
  }

  /**
   * Detect all changes across all categories
   */
  async detectChanges(syncTimestamp: string): Promise<DetectedChange[]> {
    logger.info('Starting notification detection', { syncTimestamp })

    // Get cached data
    const { teams, matchups } = await this.getCachedData()
    const season = this.getCurrentSeason(teams)

    // Fetch all categories in parallel
    const [hallOfFameResults, wallOfShameResults] = await Promise.all([
      this.fetchHallOfFameCategories(teams, matchups),
      this.fetchWallOfShameCategories(teams, matchups),
    ])

    const allChanges: DetectedChange[] = []

    // Process Hall of Fame categories
    for (const category of HALL_OF_FAME_CATEGORIES) {
      const currentEntries = hallOfFameResults.get(category.id) || []
      const previousSnapshots = await this.getPreviousSnapshots(category.id, season)

      const changes = this.detectCategoryChanges(
        category.id,
        category.name,
        'hall-of-fame',
        currentEntries,
        previousSnapshots,
        season
      )

      allChanges.push(...changes)
    }

    // Process Wall of Shame categories
    for (const category of WALL_OF_SHAME_CATEGORIES) {
      const currentEntries = wallOfShameResults.get(category.id) || []
      const previousSnapshots = await this.getPreviousSnapshots(category.id, season)

      const changes = this.detectCategoryChanges(
        category.id,
        category.name,
        'wall-of-shame',
        currentEntries,
        previousSnapshots,
        season
      )

      allChanges.push(...changes)
    }

    logger.info('Notification detection completed', {
      syncTimestamp,
      totalChanges: allChanges.length,
      hallOfFameChanges: allChanges.filter((c) => c.categoryType === 'hall-of-fame').length,
      wallOfShameChanges: allChanges.filter((c) => c.categoryType === 'wall-of-shame').length,
    })

    return allChanges
  }
}

