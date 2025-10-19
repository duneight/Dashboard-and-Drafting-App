import { prisma } from '@/lib/db/prisma'
import { WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'
import type { WallOfShameEntry } from '@/types/yahoo'

export class WallOfShameAnalytics {
  // 1. Eternal Loser - Most total losses across all seasons
  async getEternalLoser(): Promise<WallOfShameEntry[]> {
    const teams = await prisma.team.groupBy({
      by: ['teamKey', 'name', 'managerNickname'],
      _sum: {
        losses: true,
      },
      orderBy: {
        _sum: {
          losses: 'desc',
        },
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: team._sum.losses || 0,
      description: `${team._sum.losses} total losses`,
    }))
  }

  // 2. Last Place Larry - Most last-place finishes
  async getLastPlaceLarry(): Promise<WallOfShameEntry[]> {
    const lastPlaceTeams = await prisma.team.findMany({
      where: {
        rank: {
          not: null,
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        rank: true,
        league: {
          select: {
            name: true,
            season: true,
            numTeams: true,
          },
        },
      },
    })

    // Filter for actual last place (rank equals numTeams)
    const actualLastPlace = lastPlaceTeams.filter((team: any) =>
      team.rank === team.league.numTeams
    )

    // Group by team and count last place finishes
    const lastPlaceCounts = actualLastPlace.reduce((acc: any, team: any) => {
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
    }, {} as Record<string, WallOfShameEntry>)

    return Object.values(lastPlaceCounts)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
      .map((entry: any) => ({
        ...entry,
        description: `${entry.value} last place finish${entry.value > 1 ? 'es' : ''}`,
      }))
  }

  // 3. The Unlucky One - Most playoff misses (barely missed cutoff)
  async getTheUnluckyOne(): Promise<WallOfShameEntry[]> {
    // Find teams that finished just outside playoff cutoff
    const teams = await prisma.team.findMany({
      where: {
        clinchedPlayoffs: false,
        rank: {
          not: null,
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        rank: true,
        league: {
          select: {
            name: true,
            season: true,
            numTeams: true,
          },
        },
      },
    })

    // Assume top 4 teams make playoffs (adjust based on your league settings)
    const playoffCutoff = 4
    const barelyMissed = teams.filter((team: any) => 
      team.rank && team.rank > playoffCutoff && team.rank <= playoffCutoff + 2
    )

    // Group by team and count near misses
    const nearMissCounts = barelyMissed.reduce((acc: any, team: any) => {
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
    }, {} as Record<string, WallOfShameEntry>)

    return Object.values(nearMissCounts)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
      .map((entry: any) => ({
        ...entry,
        description: `${entry.value} playoff near miss${entry.value > 1 ? 'es' : ''}`,
      }))
  }

  // 4. Worst Record - Lowest single-season win percentage
  async getWorstRecord(): Promise<WallOfShameEntry[]> {
    const teams = await prisma.team.findMany({
      where: {
        percentage: {
          not: undefined,
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
      orderBy: {
        percentage: 'asc',
      },
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

  // 5. Point Desert - Fewest fantasy points in a season
  async getPointDesert(): Promise<WallOfShameEntry[]> {
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
        pointsFor: 'asc',
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

  // 6. Rock Bottom - Lowest single-week fantasy score
  async getRockBottom(): Promise<WallOfShameEntry[]> {
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
        points: 'asc',
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

  // 7. Playoff Choke - Best regular season, worst playoff result
  async getPlayoffChoke(): Promise<WallOfShameEntry[]> {
    // Find teams with best regular season rank but poor playoff performance
    const teams = await prisma.team.findMany({
      where: {
        rank: {
          lte: 3, // Top 3 regular season
        },
        league: {
          isFinished: true,
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        rank: true,
        pointsFor: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
        matchupsAsTeam1: {
          where: {
            isPlayoffs: true,
          },
          select: {
            winnerTeamKey: true,
            team1Points: true,
            team2Points: true,
          },
        },
        matchupsAsTeam2: {
          where: {
            isPlayoffs: true,
          },
          select: {
            winnerTeamKey: true,
            team1Points: true,
            team2Points: true,
          },
        },
      },
    })

    const chokeScores: WallOfShameEntry[] = []

    teams.forEach((team: any) => {
      const playoffMatchups = [...team.matchupsAsTeam1, ...team.matchupsAsTeam2]
      const playoffWins = playoffMatchups.filter((m: any) => m.winnerTeamKey === team.teamKey).length
      const playoffLosses = playoffMatchups.length - playoffWins
      
      if (playoffLosses > playoffWins) {
        chokeScores.push({
          teamKey: team.teamKey,
          teamName: team.name,
          managerNickname: team.managerNickname || undefined,
          value: playoffLosses - playoffWins,
          season: team.league.season,
          leagueName: team.league.name,
          description: `${team.rank}rd regular season, ${playoffWins}-${playoffLosses} playoffs`,
        })
      }
    })

    return chokeScores
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
  }

  // 8. Losing Streak - Most consecutive losing weeks
  async getLosingStreak(): Promise<WallOfShameEntry[]> {
    // This would require more complex logic to track consecutive losses
    // For now, return teams with most total losses in a season
    const teams = await prisma.team.findMany({
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        losses: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        losses: 'desc',
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: team.losses,
      season: team.league.season,
      leagueName: team.league.name,
      description: `${team.losses} losses in season`,
    }))
  }

  // 9. Waiver Warrior - Most roster moves but still finished last
  async getWaiverWarrior(): Promise<WallOfShameEntry[]> {
    const teams = await prisma.team.findMany({
      where: {
        numberOfMoves: {
          gt: 10, // High number of moves
        },
        rank: {
          not: null,
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        numberOfMoves: true,
        rank: true,
        league: {
          select: {
            name: true,
            season: true,
            numTeams: true,
          },
        },
      },
    })

    // Filter for teams that finished in bottom half despite many moves
    const inefficientTeams = teams.filter((team: any) =>
      team.rank && team.rank > (team.league.numTeams / 2)
    )

    return inefficientTeams
      .sort((a: any, b: any) => b.numberOfMoves - a.numberOfMoves)
      .slice(0, 10)
      .map((team: any) => ({
        teamKey: team.teamKey,
        teamName: team.name,
        managerNickname: team.managerNickname || undefined,
        value: team.numberOfMoves,
        season: team.league.season,
        leagueName: team.league.name,
        description: `${team.numberOfMoves} moves, finished ${team.rank}rd`,
      }))
  }

  // 10. The Overthinker - Most trades but worst record
  async getTheOverthinker(): Promise<WallOfShameEntry[]> {
    const teams = await prisma.team.findMany({
      where: {
        numberOfTrades: {
          gt: 5, // High number of trades
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        numberOfTrades: true,
        wins: true,
        losses: true,
        percentage: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        numberOfTrades: 'desc',
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: team.numberOfTrades,
      season: team.league.season,
      leagueName: team.league.name,
      description: `${team.numberOfTrades} trades, ${team.wins}-${team.losses} record`,
    }))
  }

  // 11. Inactive Owner - Fewest moves, worst record
  async getInactiveOwner(): Promise<WallOfShameEntry[]> {
    const teams = await prisma.team.findMany({
      where: {
        numberOfMoves: {
          lt: 5, // Low number of moves
        },
        percentage: {
          lt: 0.3, // Poor win percentage
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        numberOfMoves: true,
        wins: true,
        losses: true,
        percentage: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: [
        { numberOfMoves: 'asc' },
        { percentage: 'asc' },
      ],
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: team.numberOfMoves,
      season: team.league.season,
      leagueName: team.league.name,
      description: `${team.numberOfMoves} moves, ${Math.round((team.percentage || 0) * 100)}% win rate`,
    }))
  }

  // 12. Goalie Graveyard - Worst goalie stats
  async getGoalieGraveyard(): Promise<WallOfShameEntry[]> {
    // This would require goalie-specific stats from WeeklyStat
    // For now, return teams with most losses (assuming goalie impact)
    const teams = await prisma.team.findMany({
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        losses: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        losses: 'desc',
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: team.losses,
      season: team.league.season,
      leagueName: team.league.name,
      description: `${team.losses} losses (goalie struggles)`,
    }))
  }

  // 13. Can't Buy a Goal - Lowest goals scored in season
  async getCantBuyAGoal(): Promise<WallOfShameEntry[]> {
    // This would require parsing WeeklyStat.stats for goals
    // For now, return teams with lowest points (proxy for goals)
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
        pointsFor: 'asc',
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
      description: `${Math.round(team.pointsFor)} fantasy points (low scoring)`,
    }))
  }

  // 14. Penalty Box - Most PIMs with losing record
  async getPenaltyBox(): Promise<WallOfShameEntry[]> {
    // This would require parsing WeeklyStat.stats for penalty minutes
    // For now, return teams with poor records
    const teams = await prisma.team.findMany({
      where: {
        percentage: {
          lt: 0.4,
        },
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        wins: true,
        losses: true,
        percentage: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        percentage: 'asc',
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: Math.round((team.percentage || 0) * 100),
      season: team.league.season,
      leagueName: team.league.name,
      description: `${team.wins}-${team.losses} record (penalty trouble)`,
    }))
  }

  // 15. The Minus - Worst plus/minus rating
  async getTheMinus(): Promise<WallOfShameEntry[]> {
    // This would require parsing WeeklyStat.stats for plus/minus
    // For now, return teams with worst records as proxy
    const teams = await prisma.team.findMany({
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        pointsAgainst: true,
        pointsFor: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        pointsAgainst: 'desc',
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.teamKey,
      teamName: team.name,
      managerNickname: team.managerNickname || undefined,
      value: Math.round(team.pointsAgainst - team.pointsFor),
      season: team.league.season,
      leagueName: team.league.name,
      description: `${Math.round(team.pointsAgainst - team.pointsFor)} point differential`,
    }))
  }

  // 16. Blowout Victim - Biggest single-week loss margin
  async getBlowoutVictim(): Promise<WallOfShameEntry[]> {
    const matchups = await prisma.matchup.findMany({
      where: {
        winnerTeamKey: {
          not: null,
        },
        team1Points: {
          not: null,
        },
        team2Points: {
          not: null,
        },
      },
      select: {
        team1Key: true,
        team2Key: true,
        winnerTeamKey: true,
        team1Points: true,
        team2Points: true,
        week: true,
        team1: {
          select: {
            name: true,
            managerNickname: true,
          },
        },
        team2: {
          select: {
            name: true,
            managerNickname: true,
          },
        },
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        team1Points: 'desc',
      },
      take: 10,
    })

    return matchups.map((matchup: any) => {
      const loser = matchup.winnerTeamKey === matchup.team1Key 
        ? matchup.team2 
        : matchup.team1
      
      const pointDiff = Math.abs((matchup.team1Points || 0) - (matchup.team2Points || 0))
      
      return {
        teamKey: matchup.winnerTeamKey === matchup.team1Key ? matchup.team2Key : matchup.team1Key,
        teamName: loser.name,
        managerNickname: loser.managerNickname || undefined,
        value: Math.round(pointDiff * 100) / 100,
        season: matchup.league.season,
        leagueName: matchup.league.name,
        description: `Lost by ${Math.round(pointDiff * 100) / 100} points in Week ${matchup.week}`,
      }
    })
  }

  // 17. Never Stood a Chance - Lost most categories in one matchup
  async getNeverStoodAChance(): Promise<WallOfShameEntry[]> {
    // This would require parsing statWinners JSON
    // For now, return teams with biggest losses
    return this.getBlowoutVictim()
  }

  // 18. The Heartbreaker - Most close losses (within 5 points)
  async getTheHeartbreaker(): Promise<WallOfShameEntry[]> {
    const matchups = await prisma.matchup.findMany({
      where: {
        winnerTeamKey: {
          not: null,
        },
        team1Points: {
          not: null,
        },
        team2Points: {
          not: null,
        },
      },
      select: {
        team1Key: true,
        team2Key: true,
        winnerTeamKey: true,
        team1Points: true,
        team2Points: true,
        team1: {
          select: {
            name: true,
            managerNickname: true,
          },
        },
        team2: {
          select: {
            name: true,
            managerNickname: true,
          },
        },
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
    })

    // Filter for close losses (within 5 points) and group by losing team
    const closeLossCounts = matchups
      .filter((matchup: any) => {
        const pointDiff = Math.abs((matchup.team1Points || 0) - (matchup.team2Points || 0))
        return pointDiff >= 1 && pointDiff <= 5
      })
      .reduce((acc: any, matchup: any) => {
        const loser = matchup.winnerTeamKey === matchup.team1Key 
          ? matchup.team2 
          : matchup.team1
        const loserKey = matchup.winnerTeamKey === matchup.team1Key 
          ? matchup.team2Key 
          : matchup.team1Key
        const pointDiff = Math.abs((matchup.team1Points || 0) - (matchup.team2Points || 0))

        if (!acc[loserKey]) {
          acc[loserKey] = {
            teamKey: loserKey,
            teamName: loser.name,
            managerNickname: loser.managerNickname || undefined,
            value: 0,
          }
        }
        acc[loserKey].value++
        return acc
      }, {} as Record<string, WallOfShameEntry>)

    return Object.values(closeLossCounts)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
      .map((entry: any) => ({
        ...entry,
        description: `${entry.value} close loss${entry.value > 1 ? 'es' : ''}`,
      }))
  }

  // 19. Commissioner Fails - Commissioner's record vs league average
  async getCommissionerFails(): Promise<WallOfShameEntry[]> {
    const commissioners = await prisma.team.findMany({
      where: {
        managerIsCommissioner: true,
      },
      select: {
        teamKey: true,
        name: true,
        managerNickname: true,
        wins: true,
        losses: true,
        percentage: true,
        league: {
          select: {
            name: true,
            season: true,
            teams: {
              select: {
                percentage: true,
              },
            },
          },
        },
      },
    })

    return commissioners.map((commissioner: any) => {
      const leagueAvg = commissioner.league.teams.reduce((sum: any, team: any) => 
        sum + (team.percentage || 0), 0
      ) / commissioner.league.teams.length

      const performance = (commissioner.percentage || 0) - leagueAvg

      return {
        teamKey: commissioner.teamKey,
        teamName: commissioner.name,
        managerNickname: commissioner.managerNickname || undefined,
        value: Math.round(performance * 100) / 100,
        season: commissioner.league.season,
        leagueName: commissioner.league.name,
        description: `${Math.round((commissioner.percentage || 0) * 100)}% vs ${Math.round(leagueAvg * 100)}% league avg`,
      }
    }).sort((a: any, b: any) => a.value - b.value).slice(0, 10)
  }

  // 20. Cursed Team Name - Worst performing team names over time
  async getCursedTeamName(): Promise<WallOfShameEntry[]> {
    // Group teams by name and calculate average performance
    const teams = await prisma.team.groupBy({
      by: ['name'],
      _avg: {
        percentage: true,
      },
      _count: {
        leagueId: true,
      },
      having: {
        leagueId: {
          _count: {
            gte: 2, // Teams that appear in multiple seasons
          },
        },
      },
      orderBy: {
        _avg: {
          percentage: 'asc',
        },
      },
      take: 10,
    })

    return teams.map((team: any) => ({
      teamKey: team.name, // Using name as key since it's grouped
      teamName: team.name,
      managerNickname: undefined,
      value: Math.round((team._avg.percentage || 0) * 100) / 100,
      description: `${Math.round((team._avg.percentage || 0) * 100)}% avg over ${team._count.leagueId} seasons`,
    }))
  }

  // Get all wall of shame categories
  async getAllCategories(): Promise<Record<string, WallOfShameEntry[]>> {
    return {
      'eternal-loser': await this.getEternalLoser(),
      'last-place-larry': await this.getLastPlaceLarry(),
      'the-unlucky-one': await this.getTheUnluckyOne(),
      'worst-record': await this.getWorstRecord(),
      'point-desert': await this.getPointDesert(),
      'rock-bottom': await this.getRockBottom(),
      'playoff-choke': await this.getPlayoffChoke(),
      'losing-streak': await this.getLosingStreak(),
      'waiver-warrior': await this.getWaiverWarrior(),
      'the-overthinker': await this.getTheOverthinker(),
      'inactive-owner': await this.getInactiveOwner(),
      'goalie-graveyard': await this.getGoalieGraveyard(),
      'cant-buy-a-goal': await this.getCantBuyAGoal(),
      'penalty-box': await this.getPenaltyBox(),
      'the-minus': await this.getTheMinus(),
      'blowout-victim': await this.getBlowoutVictim(),
      'never-stood-a-chance': await this.getNeverStoodAChance(),
      'the-heartbreaker': await this.getTheHeartbreaker(),
      'commissioner-fails': await this.getCommissionerFails(),
      'cursed-team-name': await this.getCursedTeamName(),
    }
  }
}
