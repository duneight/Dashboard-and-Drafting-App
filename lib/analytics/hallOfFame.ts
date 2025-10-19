import { prisma } from '@/lib/db/prisma'
import { HALL_OF_FAME_CATEGORIES } from '@/lib/constants'
import type { HallOfFameEntry, Team, League, Matchup, WeeklyStat } from '@/types/yahoo'

export class HallOfFameAnalytics {
  // 1. Dynasty Builder - Most total wins across all seasons
  async getDynastyBuilder(): Promise<HallOfFameEntry[]> {
    const teams = await prisma.team.groupBy({
      by: ['teamKey', 'name', 'managerNickname'],
      _sum: {
        wins: true,
      },
      orderBy: {
        _sum: {
          wins: 'desc',
        },
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: team._sum.wins || 0,
      description: `${team._sum.wins} total wins`,
    }))
  }

  // 2. The Champion - Most championships (first place finishes)
  async getTheChampion(): Promise<HallOfFameEntry[]> {
    const champions = await prisma.team.findMany({
      where: {
        rank: 1,
        isFinished: true,
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        league: {
          season: 'desc',
        },
      },
    })

    // Group by team and count championships
    const championshipCounts = champions.reduce((acc: any, team: any) => {
      const key = team.teamKey
      if (!acc[key]) {
        acc[key] = {
          teamKey: team.teamKey,
          teamName: team.name,
          managerNickname: team.managerNickname || undefined,
          value: 0,
          championships: [] as string[],
        }
      }
      acc[key].value++
      acc[key].championships.push(`${team.league.name} (${team.league.season})`)
      return acc
    }, {} as Record<string, HallOfFameEntry & { championships: string[] }>)

    return Object.values(championshipCounts)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
      .map((entry: any) => ({
        ...entry,
        description: `${entry.value} championship${entry.value > 1 ? 's' : ''}`,
      }))
  }

  // 3. Playoff Merchant - Most playoff appearances
  async getPlayoffMerchant(): Promise<HallOfFameEntry[]> {
    const playoffTeams = await prisma.team.findMany({
      where: {
        clinchedPlayoffs: true,
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
    })

    // Group by team and count playoff appearances
    const playoffCounts = playoffTeams.reduce((acc: any, team: any) => {
      const key = team.teamKey
      if (!acc[key]) {
        acc[key] = {
          teamKey: team.teamKey,
          teamName: team.name,
          managerNickname: team.managerNickname || undefined,
          value: 0,
        }
      }
      acc[key].value++
      return acc
    }, {} as Record<string, HallOfFameEntry>)

    return Object.values(playoffCounts)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
      .map((entry: any) => ({
        ...entry,
        description: `${entry.value} playoff appearance${entry.value > 1 ? 's' : ''}`,
      }))
  }

  // 4. The Consistent One - Highest win percentage (min 2 seasons)
  async getTheConsistentOne(): Promise<HallOfFameEntry[]> {
    const teams = await prisma.team.groupBy({
      by: ['teamKey', 'name', 'managerNickname'],
      _avg: {
        percentage: true,
      },
      _count: {
        leagueId: true,
      },
      having: {
        leagueId: {
          _count: {
            gte: 2, // Minimum 2 seasons
          },
        },
      },
      orderBy: {
        _avg: {
          percentage: 'desc',
        },
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: Math.round((team._avg.percentage || 0) * 100) / 100,
      description: `${Math.round((team._avg.percentage || 0) * 100)}% win rate over ${team._count.leagueId} seasons`,
    }))
  }

  // 5. Point Machine - Most total fantasy points scored
  async getPointMachine(): Promise<HallOfFameEntry[]> {
    const teams = await prisma.team.groupBy({
      by: ['teamKey', 'name', 'managerNickname'],
      _sum: {
        pointsFor: true,
      },
      orderBy: {
        _sum: {
          pointsFor: 'desc',
        },
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: Math.round(team._sum.pointsFor || 0),
      description: `${Math.round(team._sum.pointsFor || 0)} total fantasy points`,
    }))
  }

  // 6. Perfect Season - Best single-season record
  async getPerfectSeason(): Promise<HallOfFameEntry[]> {
    const teams = await prisma.team.findMany({
      where: {
        wins: {
          gt: 0,
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        wins: true,
        losses: true,
        ties: true,
        percentage: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: [
        { percentage: 'desc' },
        { wins: 'desc' },
      ],
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: Math.round((team.percentage || 0) * 100) / 100,
      season: team.league.season,
      leagueName: team.league.name,
      description: `${team.wins}-${team.losses}-${team.ties} (${Math.round((team.percentage || 0) * 100)}%)`,
    }))
  }

  // 7. Scoring Explosion - Highest fantasy points in a single season
  async getScoringExplosion(): Promise<HallOfFameEntry[]> {
    const teams = await prisma.team.findMany({
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        pointsFor: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        pointsFor: 'desc',
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: Math.round(team.pointsFor),
      season: team.league.season,
      leagueName: team.league.name,
      description: `${Math.round(team.pointsFor)} fantasy points`,
    }))
  }

  // 8. Runaway Winner - Biggest points margin above 2nd place
  async getRunawayWinner(): Promise<HallOfFameEntry[]> {
    // This requires more complex logic to find 2nd place teams
    // For now, return teams with highest points in their league
    const leagues = await prisma.league.findMany({
      select: {
        id: true,
        name: true,
        season: true,
        teams: {
          select: {
            teamKey: true,
            name: true,
            managerNickname: true,
            pointsFor: true,
            rank: true,
          },
          orderBy: {
            pointsFor: 'desc',
          },
          take: 2,
        },
      },
    })

    const margins: HallOfFameEntry[] = []

    leagues.forEach((league: any) => {
      if (league.teams.length >= 2) {
        const first = league.teams[0]
        const second = league.teams[1]
        const margin = first.pointsFor - second.pointsFor

        margins.push({
          teamKey: first.teamKey,
          teamName: first.name,
          managerNickname: first.managerNickname || undefined,
          value: Math.round(margin),
          season: league.season,
          leagueName: league.name,
          description: `${Math.round(margin)} point margin over 2nd place`,
        })
      }
    })

    return margins
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }

  // 9. Week Winner - Highest single-week fantasy score
  async getWeekWinner(): Promise<HallOfFameEntry[]> {
    const weeklyStats = await prisma.weeklyStat.findMany({
      select: {
        teamKey: true,
        week: true,
        season: true,
        points: true,
        team: {
          select: {
            name: true,
            managerNickname: true,
            league: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: 10,
    })

    return weeklyStats.map((stat: any) => ({
      teamKey: stat.teamKey,
      teamName: stat.team.name,
      managerNickname: stat.team.managerNickname || undefined,
      value: Math.round(stat.points),
      season: stat.season,
      leagueName: stat.team.league.name,
      description: `${Math.round(stat.points)} points in Week ${stat.week}`,
    }))
  }

  // 10. The Clutch Performer - Most playoff week wins
  async getTheClutchPerformer(): Promise<HallOfFameEntry[]> {
    const playoffWins = await prisma.matchup.groupBy({
      by: ['winnerTeamKey'],
      where: {
        isPlayoffs: true,
        winnerTeamKey: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    })

    const teams = await prisma.team.findMany({
      where: {
        teamKey: {
          in: playoffWins.map((w: any) => w.winnerTeamKey!).filter(Boolean),
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
      },
    })

    const teamMap = new Map(teams.map((t: any) => [t.teamKey, t]))

    return playoffWins
      .map((win: any) => {
        const team = teamMap.get(win.winnerTeamKey!) as any
        return team ? {
          teamKey: team.teamKey,
          teamName: team.name,
          managerNickname: team.managerNickname || undefined,
          value: win._count.id,
          description: `${win._count.id} playoff wins`,
        } : null
      })
      .filter(Boolean) as HallOfFameEntry[]
  }

  // Get all hall of fame categories
  async getAllCategories(): Promise<Record<string, HallOfFameEntry[]>> {
    return {
      'dynasty-builder': await this.getDynastyBuilder(),
      'the-champion': await this.getTheChampion(),
      'playoff-merchant': await this.getPlayoffMerchant(),
      'the-consistent-one': await this.getTheConsistentOne(),
      'point-machine': await this.getPointMachine(),
      'perfect-season': await this.getPerfectSeason(),
      'scoring-explosion': await this.getScoringExplosion(),
      'runaway-winner': await this.getRunawayWinner(),
      'week-winner': await this.getWeekWinner(),
      'the-clutch-performer': await this.getTheClutchPerformer(),
    }
  }
}
