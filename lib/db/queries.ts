import { prisma } from '@/lib/db/prisma'

// Database query functions using Prisma
export const dbQueries = {
  // Get all leagues
  async getLeagues() {
    return await prisma.league.findMany({
      orderBy: { season: 'desc' },
      include: {
        teams: {
          orderBy: { rank: 'asc' }
        }
      }
    })
  },

  // Get teams for a specific league
  async getTeamsByLeague(leagueId: string) {
    return await prisma.team.findMany({
      where: { leagueId },
      orderBy: { rank: 'asc' },
      include: {
        league: {
          select: {
            name: true,
            season: true
          }
        }
      }
    })
  },

  // Get current season standings
  async getCurrentSeasonStandings() {
    const currentYear = new Date().getFullYear().toString()
    
    return await prisma.team.findMany({
      where: {
        league: {
          season: currentYear
        }
      },
      orderBy: { rank: 'asc' },
      include: {
        league: {
          select: {
            name: true,
            season: true
          }
        }
      }
    })
  },

  // Get recent matchups
  async getRecentMatchups(limit = 10) {
    return await prisma.matchup.findMany({
      orderBy: { week: 'desc' },
      take: limit,
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
        },
        league: {
          select: {
            name: true,
            season: true
          }
        }
      }
    })
  },

  // Get weekly stats for a team
  async getTeamWeeklyStats(teamKey: string, season?: string) {
    const where: any = { teamKey }
    
    if (season) {
      where.season = season
    }
    
    return await prisma.weeklyTeamStat.findMany({
      where,
      orderBy: { week: 'asc' },
      include: {
        team: {
          select: {
            name: true,
            managerNickname: true
          }
        }
      }
    })
  },

  // Get hall of fame data
  async getHallOfFameData() {
    // This would call the analytics functions
    // For now, return empty data
    return {}
  },

  // Get wall of shame data
  async getWallOfShameData() {
    // This would call the analytics functions
    // For now, return empty data
    return {}
  },

  // Get overview statistics
  async getOverviewStats() {
    const [leaguesCount, teamsCount, matchupsCount] = await Promise.all([
      prisma.league.count(),
      prisma.team.count(),
      prisma.matchup.count()
    ])

    return {
      totalSeasons: leaguesCount,
      totalTeams: teamsCount,
      totalMatchups: matchupsCount,
      currentSeason: new Date().getFullYear().toString()
    }
  }
}
