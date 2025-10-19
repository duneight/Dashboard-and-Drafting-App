import { prisma } from '@/lib/db/prisma'
import { getYahooClient } from '@/lib/api/yahoo'
import { logger } from '@/lib/logger'
import type { ApiResponse, SyncResponse } from '@/types/yahoo'

export class YahooSyncService {
  private yahooClient: any

  async initialize() {
    this.yahooClient = await getYahooClient()
  }

  async syncAllLeagues(): Promise<SyncResponse> {
    if (!this.yahooClient) {
      await this.initialize()
    }

    const leagueKeys = await this.yahooClient.getAllLeagueKeys()
    
    let leaguesProcessed = 0
    let teamsProcessed = 0
    let matchupsProcessed = 0
    let weeklyStatsProcessed = 0
    const errors: string[] = []

    for (const { leagueKey, season, gameCode } of leagueKeys) {
      try {
        logger.info('Processing league', { leagueKey, season })
        
        const result = await this.syncLeagueData(leagueKey, season, gameCode)
        
        leaguesProcessed += result.leaguesProcessed
        teamsProcessed += result.teamsProcessed
        matchupsProcessed += result.matchupsProcessed
        weeklyStatsProcessed += result.weeklyStatsProcessed
        
        if (result.errors.length > 0) {
          errors.push(...result.errors)
        }

        // Add delay between leagues to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        logger.error('Error processing league', error as Error, { leagueKey })
        errors.push(`League ${leagueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      leaguesProcessed,
      teamsProcessed,
      matchupsProcessed,
      weeklyStatsProcessed,
      errors,
    }
  }

  async syncLeagueData(leagueKey: string, season: string, gameCode: string): Promise<SyncResponse> {
    if (!this.yahooClient) {
      await this.initialize()
    }

    let leaguesProcessed = 0
    let teamsProcessed = 0
    let matchupsProcessed = 0
    let weeklyStatsProcessed = 0
    const errors: string[] = []

    try {
      // Fetch league data
      const leagueData = await this.yahooClient.fetchLeagueData(leagueKey)
      
      if (!leagueData.metadata?.fantasy_content?.league) {
        errors.push(`No metadata found for league ${leagueKey}`)
        return { leaguesProcessed, teamsProcessed, matchupsProcessed, weeklyStatsProcessed, errors }
      }

      const leagueInfo = leagueData.metadata.fantasy_content.league
      
      // Process league
      const league = await this.processLeague(leagueKey, leagueInfo, season, gameCode)
      leaguesProcessed++

      // Process teams
      if (leagueData.teams?.fantasy_content?.league?.teams?.team) {
        const teams = Array.isArray(leagueData.teams.fantasy_content.league.teams.team)
          ? leagueData.teams.fantasy_content.league.teams.team
          : [leagueData.teams.fantasy_content.league.teams.team]

        for (const teamData of teams) {
          await this.processTeam(teamData, league.id, season)
          teamsProcessed++
        }
      }

      // Process standings
      if (leagueData.standings?.fantasy_content?.league?.standings?.teams?.team) {
        await this.processStandings(leagueData.standings.fantasy_content.league.standings.teams.team)
      }

      // Process scoreboard/matchups
      if (leagueData.scoreboard?.fantasy_content?.league?.scoreboard?.matchups?.matchup) {
        const matchups = Array.isArray(leagueData.scoreboard.fantasy_content.league.scoreboard.matchups.matchup)
          ? leagueData.scoreboard.fantasy_content.league.scoreboard.matchups.matchup
          : [leagueData.scoreboard.fantasy_content.league.scoreboard.matchups.matchup]

        for (const matchupData of matchups) {
          await this.processMatchup(matchupData, league.id, season)
          matchupsProcessed++
        }
      }

    } catch (error) {
      console.error(`Error syncing league ${leagueKey}:`, error)
      errors.push(`League ${leagueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { leaguesProcessed, teamsProcessed, matchupsProcessed, weeklyStatsProcessed, errors }
  }

  private async processLeague(leagueKey: string, leagueInfo: any, season: string, gameCode: string) {
    return await prisma.league.upsert({
      where: { leagueKey },
      update: {
        name: leagueInfo.name,
        url: leagueInfo.url,
        logoUrl: leagueInfo.logo_url,
        draftStatus: leagueInfo.draft_status,
        numTeams: parseInt(leagueInfo.num_teams),
        scoringType: leagueInfo.scoring_type,
        leagueType: leagueInfo.league_type,
        season: season,
      },
      create: {
        leagueKey,
        leagueId: parseInt(leagueInfo.league_id),
        name: leagueInfo.name,
        url: leagueInfo.url,
        logoUrl: leagueInfo.logo_url,
        draftStatus: leagueInfo.draft_status,
        numTeams: parseInt(leagueInfo.num_teams),
        scoringType: leagueInfo.scoring_type,
        leagueType: leagueInfo.league_type,
        season: season,
        gameId: leagueInfo.game_key ? parseInt(leagueInfo.game_key).toString() : undefined,
      },
    })
  }

  private async processTeam(teamData: any, leagueId: string, season: string) {
    const manager = teamData.managers?.manager
    const managerData = Array.isArray(manager) ? manager[0] : manager

    await prisma.team.upsert({
      where: { teamKey: teamData.team_key },
      update: {
        name: teamData.name,
        url: teamData.url,
        numberOfMoves: parseInt(teamData.number_of_moves),
        numberOfTrades: parseInt(teamData.number_of_trades),
        clinchedPlayoffs: teamData.clinched_playoffs === '1',
        managerNickname: managerData?.nickname,
        managerEmail: managerData?.email,
        managerImageUrl: managerData?.image_url,
        managerIsCommissioner: managerData?.is_commissioner === '1',
        season: season,
      },
      create: {
        teamKey: teamData.team_key,
        teamId: parseInt(teamData.team_id),
        leagueId: leagueId,
        name: teamData.name,
        url: teamData.url,
        numberOfMoves: parseInt(teamData.number_of_moves),
        numberOfTrades: parseInt(teamData.number_of_trades),
        clinchedPlayoffs: teamData.clinched_playoffs === '1',
        managerNickname: managerData?.nickname,
        managerEmail: managerData?.email,
        managerImageUrl: managerData?.image_url,
        managerIsCommissioner: managerData?.is_commissioner === '1',
        season: season,
      },
    })
  }

  private async processStandings(standings: any) {
    const standingsArray = Array.isArray(standings) ? standings : [standings]

    for (const standing of standingsArray) {
      await prisma.team.update({
        where: { teamKey: standing.team_key },
        data: {
          rank: parseInt(standing.rank),
          wins: parseInt(standing.outcome_totals.wins),
          losses: parseInt(standing.outcome_totals.losses),
          ties: parseInt(standing.outcome_totals.ties),
          percentage: parseFloat(standing.outcome_totals.percentage),
          pointsFor: parseFloat(standing.points_for),
          pointsAgainst: parseFloat(standing.points_against),
        },
      })
    }
  }

  private async processMatchup(matchupData: any, leagueId: string, season: string) {
    const teams = Array.isArray(matchupData.teams.team)
      ? matchupData.teams.team
      : [matchupData.teams.team]

    if (teams.length === 2) {
      const homeTeam = teams.find((t: any) => t.team_key === matchupData.teams.team[0]?.team_key) || teams[0]
      const awayTeam = teams.find((t: any) => t.team_key === matchupData.teams.team[1]?.team_key) || teams[1]

      await prisma.matchup.upsert({
        where: {
          matchupId: parseInt(matchupData.matchup_id),
        },
        update: {
          week: parseInt(matchupData.week),
          status: matchupData.status,
          isPlayoffs: matchupData.is_playoffs === '1',
          isTied: matchupData.is_tied === '1',
          winnerTeamKey: matchupData.winner_team_key,
          team1Points: homeTeam.team_points?.total ? parseFloat(homeTeam.team_points.total) : null,
          team2Points: awayTeam.team_points?.total ? parseFloat(awayTeam.team_points.total) : null,
          season: season,
        },
        create: {
          matchupId: parseInt(matchupData.matchup_id),
          leagueId: leagueId,
          week: parseInt(matchupData.week),
          status: matchupData.status,
          isPlayoffs: matchupData.is_playoffs === '1',
          isTied: matchupData.is_tied === '1',
          team1Key: homeTeam.team_key,
          team2Key: awayTeam.team_key,
          winnerTeamKey: matchupData.winner_team_key,
          team1Points: homeTeam.team_points?.total ? parseFloat(homeTeam.team_points.total) : null,
          team2Points: awayTeam.team_points?.total ? parseFloat(awayTeam.team_points.total) : null,
          season: season,
        },
      })
    }
  }
}

// Singleton instance
let yahooSyncService: YahooSyncService | null = null

export async function getYahooSyncService(): Promise<YahooSyncService> {
  if (!yahooSyncService) {
    yahooSyncService = new YahooSyncService()
    await yahooSyncService.initialize()
  }
  return yahooSyncService
}
