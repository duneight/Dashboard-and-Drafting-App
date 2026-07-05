import { prisma } from '@/lib/db/prisma'
import { getYahooClient } from '@/lib/api/yahoo'
import { logger } from '@/lib/logger'
import { TEST_LEAGUE_KEY, SEASONS_TO_SYNC, CACHE_DURATION_HOURS } from '@/lib/constants'
import type { SyncResponse } from '@/types/yahoo'

export interface SyncOptions {
  mode?: 'full' | 'test' | 'single'
  leagueKey?: string
  season?: string
  seasons?: string[] // Support multiple seasons
  forceRefresh?: boolean
}

export class YahooSyncService {
  private yahooClient: any

  async initialize() {
    this.yahooClient = await getYahooClient()
  }

  async syncAllLeagues(options: SyncOptions = {}): Promise<SyncResponse> {
    if (!this.yahooClient) {
      await this.initialize()
    }

    // Determine which leagues to sync based on options
    let leagueKeys: any[] = []
    
    if (options.mode === 'test' || options.leagueKey === TEST_LEAGUE_KEY) {
      // Test mode: sync only the test league
      leagueKeys = [{ leagueKey: TEST_LEAGUE_KEY, season: '2023', gameCode: '427', gameAbbreviation: 'nhl' }]
      logger.info('Running in test mode', { leagueKey: TEST_LEAGUE_KEY })
    } else if (options.leagueKey) {
      // Single league mode: sync specific league
      leagueKeys = [{ leagueKey: options.leagueKey, season: options.season || '2024', gameCode: '427', gameAbbreviation: 'nhl' }]
      logger.info('Running in single league mode', { leagueKey: options.leagueKey })
    } else {
      // Full mode: sync all leagues (default behavior)
      const allLeagueKeys = await this.yahooClient.getAllLeagueKeys()
      
      if (options.seasons && options.seasons.length > 0) {
        // Filter by specific seasons
        leagueKeys = allLeagueKeys.filter((league: any) => options.seasons!.includes(league.season))
        logger.info('Running in multi-season mode', { seasons: options.seasons, count: leagueKeys.length })
      } else if (options.season) {
        // Filter by specific season
        leagueKeys = allLeagueKeys.filter((league: any) => league.season === options.season)
        logger.info('Running in season mode', { season: options.season, count: leagueKeys.length })
      } else {
        // Use all leagues from configured seasons
        leagueKeys = allLeagueKeys.filter((league: any) => SEASONS_TO_SYNC.includes(league.season))
        logger.info('Running in full mode', { seasons: SEASONS_TO_SYNC, count: leagueKeys.length })
      }
    }
    
    if (leagueKeys.length === 0) {
      logger.warn('No leagues found to sync', { options })
      return {
        leaguesProcessed: 0,
        teamsProcessed: 0,
        matchupsProcessed: 0,
        errors: ['No leagues found to sync']
      }
    }
    
    let leaguesProcessed = 0
    let teamsProcessed = 0
    let matchupsProcessed = 0
    const errors: string[] = []

    // Process leagues in parallel batches for better performance
    const concurrentLeagues = 3
    const leagueBatches = []
    
    for (let i = 0; i < leagueKeys.length; i += concurrentLeagues) {
      leagueBatches.push(leagueKeys.slice(i, i + concurrentLeagues))
    }
    
    logger.info('Processing leagues in parallel batches', { 
      totalLeagues: leagueKeys.length, 
      batchCount: leagueBatches.length,
      concurrentLeagues 
    })

    for (let batchIndex = 0; batchIndex < leagueBatches.length; batchIndex++) {
      const batch = leagueBatches[batchIndex]
      
      logger.info('Processing league batch', { 
        batchIndex: batchIndex + 1, 
        batchSize: batch.length,
        leagues: batch.map(l => l.leagueKey)
      })
      
      // Process leagues in this batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(async ({ leagueKey, season, gameCode }) => {
      try {
        logger.info('Processing league', { leagueKey, season })
        
        const result = await this.syncLeagueData(leagueKey, season, gameCode, options.forceRefresh)
            return { success: true, result, leagueKey }
          } catch (error) {
            logger.error('Error processing league', error as Error, { leagueKey })
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error',
              leagueKey 
            }
          }
        })
      )
      
      // Aggregate results from this batch
      batchResults.forEach((result, index) => {
        const leagueKey = batch[index].leagueKey
        
        if (result.status === 'fulfilled' && result.value.success) {
          const { result: leagueResult } = result.value
          if (leagueResult) {
            leaguesProcessed += leagueResult.leaguesProcessed
            teamsProcessed += leagueResult.teamsProcessed
            matchupsProcessed += leagueResult.matchupsProcessed
            if (leagueResult.errors.length > 0) {
              errors.push(...leagueResult.errors)
            }
          }
        } else {
          const errorMsg = result.status === 'fulfilled' 
            ? result.value.error 
            : result.reason instanceof Error ? result.reason.message : 'Unknown error'
          errors.push(`League ${leagueKey}: ${errorMsg}`)
        }
      })
      
      // Small delay between batches to respect rate limits
      if (batchIndex < leagueBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return {
      leaguesProcessed,
      teamsProcessed,
      matchupsProcessed,
      errors,
    }
  }

  async syncLeagueData(leagueKey: string, season: string, gameCode: string, forceRefresh: boolean = false): Promise<SyncResponse> {
    if (!this.yahooClient) {
      await this.initialize()
    }

    let leaguesProcessed = 0
    let teamsProcessed = 0
    let matchupsProcessed = 0
    const errors: string[] = []

    try {
      // Check if we already have recent data for this league (unless force refresh)
      if (!forceRefresh) {
        const existingLeague = await prisma.league.findUnique({
          where: { leagueKey },
          select: { id: true, updatedAt: true, isFinished: true }
        })
        
        if (existingLeague) {
          const lastUpdate = new Date(existingLeague.updatedAt)
          const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)

          // A league only counts as syncable-skippable if its data is actually
          // complete. processLeague refreshes updatedAt before sub-entities are
          // written, so a run killed mid-league would otherwise look "fresh"
          // and lock the incomplete league out of re-sync.
          const hasCompleteData = await this.verifyCompleteData(existingLeague.id, leagueKey)

          // Skip finished leagues with complete data
          if (existingLeague.isFinished) {
            if (hasCompleteData) {
              logger.info('Skipping finished league - data complete', {
                leagueKey,
                season,
                hoursSinceUpdate: hoursSinceUpdate.toFixed(1)
              })
              return {
                leaguesProcessed: 0,
                teamsProcessed: 0,
                matchupsProcessed: 0,
                errors: [`League ${leagueKey} is finished with complete data, skipping`]
              }
            }
          }
          
          // Skip recently updated leagues (active or finished) — but only
          // when their data is complete (see note above)
          if (hoursSinceUpdate < CACHE_DURATION_HOURS && hasCompleteData) {
            logger.info('League recently updated, skipping', { leagueKey, hoursSinceUpdate: hoursSinceUpdate.toFixed(1) })
            return {
              leaguesProcessed: 0,
              teamsProcessed: 0,
              matchupsProcessed: 0,
              errors: [`League ${leagueKey} was updated ${hoursSinceUpdate.toFixed(1)} hours ago, skipping`]
            }
          }
        }
      }

      logger.info('Starting league data fetch', { leagueKey, season, gameCode })

      // Fetch most endpoints in parallel (fast)
      const leagueData = await this.yahooClient.fetchLeagueDataParallel(leagueKey)

      logger.info('League data fetch completed', {
        leagueKey,
        endpointsReceived: Object.keys(leagueData).filter(key => leagueData[key] !== null),
        totalEndpoints: Object.keys(leagueData).length
      })
      
      // Check if we have metadata (all responses wrap in fantasy_content)
      if (!leagueData.metadata?.fantasy_content?.league) {
        errors.push(`No metadata found for league ${leagueKey}`)
        console.error('No metadata found', { leagueKey, metadataKeys: Object.keys(leagueData.metadata || {}) })
        return { leaguesProcessed, teamsProcessed, matchupsProcessed, errors }
      }

      const leagueInfo = leagueData.metadata.fantasy_content.league
      logger.info('League metadata found', { 
        leagueKey, 
        leagueName: leagueInfo.name,
        numTeams: leagueInfo.num_teams,
        season: leagueInfo.season
      })

      // Process league
      const league = await this.processLeague(leagueKey, leagueInfo, season, gameCode, leagueData)
      leaguesProcessed++

      const leagueIsFinished = leagueInfo.is_finished === '1' || leagueInfo.is_finished === 1

      // Process teams from teams_standings endpoint
      if (leagueData.teams_standings?.fantasy_content?.league?.teams?.team) {
        const teams = Array.isArray(leagueData.teams_standings.fantasy_content.league.teams.team)
          ? leagueData.teams_standings.fantasy_content.league.teams.team
          : [leagueData.teams_standings.fantasy_content.league.teams.team]

        logger.info('Processing teams', { count: teams.length, leagueKey })

        for (const teamData of teams) {
          try {
            await this.processTeam(teamData, league.id, season, leagueIsFinished)
            teamsProcessed++
          } catch (error) {
            // One malformed team must not abort standings/matchups/draft/
            // transactions for the whole league
            errors.push(`Team ${teamData?.team_key} (${leagueKey}): ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      } else {
        logger.warn('No teams data found', { 
          leagueKey,
          hasTeamsStandings: !!leagueData.teams_standings,
          teamsStandingsKeys: leagueData.teams_standings ? Object.keys(leagueData.teams_standings) : []
        })
      }

      // Process standings
      if (leagueData.teams_standings?.fantasy_content?.league?.teams?.team) {
        logger.info('Found standings data, processing...', { 
          standingsPath: 'leagueData.teams_standings.fantasy_content.league.teams.team',
          teamCount: Array.isArray(leagueData.teams_standings.fantasy_content.league.teams.team) 
            ? leagueData.teams_standings.fantasy_content.league.teams.team.length 
            : 1
        })
        
        const teams = Array.isArray(leagueData.teams_standings.fantasy_content.league.teams.team)
          ? leagueData.teams_standings.fantasy_content.league.teams.team
          : [leagueData.teams_standings.fantasy_content.league.teams.team]
        
        // Extract team_standings from each team object
        const standings = teams.map((team: any) => ({
          team_key: team.team_key,
          rank: team.team_standings?.rank,
          outcome_totals: team.team_standings?.outcome_totals,
          points_for: team.team_standings?.points_for,
          points_against: team.team_standings?.points_against
        }))
        
        await this.processStandings(standings, season)
      } else {
        logger.warn('No standings data found', { 
          hasTeamsStandings: !!leagueData.teams_standings,
          hasFantasyContent: !!leagueData.teams_standings?.fantasy_content,
          hasLeague: !!leagueData.teams_standings?.fantasy_content?.league,
          hasTeams: !!leagueData.teams_standings?.fantasy_content?.league?.teams,
          hasTeam: !!leagueData.teams_standings?.fantasy_content?.league?.teams?.team
        })
      }

      // Matchups: fetched here — after league/teams/standings are written —
      // so a failure on this slow endpoint can't wipe the whole league's sync
      try {
        if (await this.shouldFetchMatchups(leagueInfo, forceRefresh)) {
          logger.info('Fetching matchups data', { leagueKey })
          leagueData.teams_matchups = await this.yahooClient.fetchTeamsMatchupsOptimized(leagueKey)
        } else {
          logger.info('Skipping matchups fetch - complete data already stored', { leagueKey })
          leagueData.teams_matchups = null
        }

        if (leagueData.teams_matchups?.fantasy_content?.league?.teams?.team) {
          logger.info('Processing matchups with batch operations', { leagueKey })
          const batchResult = await this.batchProcessMatchups(leagueData.teams_matchups, league.id, season)
          matchupsProcessed += batchResult.processed
          if (batchResult.error) {
            errors.push(`Matchups (${leagueKey}): ${batchResult.error}`)
          }
        } else {
          logger.info('No matchups data to process', { leagueKey })
        }
      } catch (error) {
        errors.push(`Matchups (${leagueKey}): ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Process additional data types — their failures surface in errors[]
      // instead of being swallowed (whole categories of data used to vanish
      // while the run reported healthy)
      errors.push(...await this.processDraftResults(leagueData, season, leagueKey))
      errors.push(...await this.processTransactions(leagueData, season, league.id, leagueKey))
      
      // REMOVED: Weekly team stats processing - data already captured in Matchup table
      // The teams_matchups endpoint provides team_stats within each matchup
      // This data is stored in Matchup.team1Stats and Matchup.team2Stats
      // WeeklyTeamStat table may be removed in future schema optimization

      // if (leagueData.teams_matchups?.fantasy_content?.league?.teams?.team) {
      //   const teams = Array.isArray(leagueData.teams_matchups.fantasy_content.league.teams.team)
      //     ? leagueData.teams_matchups.fantasy_content.league.teams.team
      //     : [leagueData.teams_matchups.fantasy_content.league.teams.team]

      //   for (const team of teams) {
      //     if (team.matchups?.matchup) {
      //       const matchups = Array.isArray(team.matchups.matchup) 
      //         ? team.matchups.matchup 
      //         : [team.matchups.matchup]
          
      //       for (const matchup of matchups) {
      //         await this.processWeeklyTeamStats(matchup, team.team_key, matchup.week, season)
      //         weeklyStatsProcessed++
      //       }
      //     }
      //   }
        
      //   logger.info('Weekly team stats processed', { count: weeklyStatsProcessed })
      // }
      
      // REMOVED: Game metadata processing - GameMetadata model not in current schema

    } catch (error) {
      console.error(`Error syncing league ${leagueKey}:`, error)
      errors.push(`League ${leagueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { 
      leaguesProcessed, 
      teamsProcessed, 
      matchupsProcessed, 
      errors 
    }
  }

  private async processLeague(leagueKey: string, leagueInfo: any, season: string, gameCode: string, fullLeagueData?: any) {
    // First, ensure the game exists
    const gameKey = `${gameCode}.g.1` // Format: 427.g.1
    const game = await prisma.game.upsert({
      where: { gameKey: gameKey },
      update: {},
      create: {
        gameKey: gameKey,
        gameId: parseInt(gameCode),
        name: 'NHL',
        code: 'nhl',
        type: 'full',
        url: '',
        season: season,
        isGameOver: false,
        isRegistrationOver: false,
        isPlayoffsOver: false,
        isOffseason: false,
      }
    })

    // Extract settings data from the full league data
    const settings = fullLeagueData?.settings?.fantasy_content?.league?.settings
    const statCategories = fullLeagueData?.settings?.fantasy_content?.league?.settings?.stat_categories
    const rosterPositions = fullLeagueData?.settings?.fantasy_content?.league?.settings?.roster_positions
    
    return await prisma.league.upsert({
      where: { leagueKey },
      update: {
        gameId: game.id,
        name: leagueInfo.name,
        url: leagueInfo.url,
        logoUrl: typeof leagueInfo.logo_url === 'string' ? leagueInfo.logo_url : null,
        draftStatus: leagueInfo.draft_status,
        numTeams: parseInt(leagueInfo.num_teams),
        scoringType: leagueInfo.scoring_type,
        leagueType: leagueInfo.league_type,
        currentWeek: leagueInfo.current_week ? parseInt(leagueInfo.current_week) : null,
        startWeek: leagueInfo.start_week ? parseInt(leagueInfo.start_week) : null,
        endWeek: leagueInfo.end_week ? parseInt(leagueInfo.end_week) : null,
        startDate: leagueInfo.start_date || null,
        endDate: leagueInfo.end_date || null,
        isFinished: leagueInfo.is_finished === '1' || leagueInfo.is_finished === 1,
        season: season,
        settings: settings ? JSON.stringify(settings) : null,
        statCategories: statCategories ? JSON.stringify(statCategories) : null,
        rosterPositions: rosterPositions ? JSON.stringify(rosterPositions) : null,
      },
      create: {
        leagueKey,
        leagueId: parseInt(leagueInfo.league_id),
        gameId: game.id,
        name: leagueInfo.name,
        url: leagueInfo.url,
        logoUrl: typeof leagueInfo.logo_url === 'string' ? leagueInfo.logo_url : null,
        draftStatus: leagueInfo.draft_status,
        numTeams: parseInt(leagueInfo.num_teams),
        scoringType: leagueInfo.scoring_type,
        leagueType: leagueInfo.league_type,
        currentWeek: leagueInfo.current_week ? parseInt(leagueInfo.current_week) : null,
        startWeek: leagueInfo.start_week ? parseInt(leagueInfo.start_week) : null,
        endWeek: leagueInfo.end_week ? parseInt(leagueInfo.end_week) : null,
        startDate: leagueInfo.start_date || null,
        endDate: leagueInfo.end_date || null,
        isFinished: leagueInfo.is_finished === '1' || leagueInfo.is_finished === 1,
        season: season,
        settings: settings ? JSON.stringify(settings) : null,
        statCategories: statCategories ? JSON.stringify(statCategories) : null,
        rosterPositions: rosterPositions ? JSON.stringify(rosterPositions) : null,
      },
    })
  }

  // Yahoo omits or malforms optional numeric fields often enough that a raw
  // parseInt would feed NaN into Prisma and abort the whole league
  private toIntOrNull(value: any): number | null {
    const n = parseInt(value)
    return Number.isNaN(n) ? null : n
  }

  private async processTeam(teamData: any, leagueId: string, season: string, leagueIsFinished: boolean) {
    const manager = teamData.managers?.manager
    const managerData = Array.isArray(manager) ? manager[0] : manager

    const teamId = this.toIntOrNull(teamData.team_id)
    if (teamId === null) {
      throw new Error(`Team ${teamData.team_key} has non-numeric team_id: ${teamData.team_id}`)
    }

    await prisma.team.upsert({
      where: {
        teamKey_season: {
          teamKey: teamData.team_key,
          season: season
        }
      },
      update: {
        name: teamData.name,
        url: teamData.url,
        numberOfMoves: this.toIntOrNull(teamData.number_of_moves),
        numberOfTrades: this.toIntOrNull(teamData.number_of_trades),
        clinchedPlayoffs: teamData.clinched_playoffs === '1',
        managerNickname: managerData?.nickname,
        managerEmail: managerData?.email,
        managerIsCommissioner: managerData?.is_commissioner === '1',
        isFinished: leagueIsFinished,
        season: season,
      },
      create: {
        teamKey: teamData.team_key,
        teamId: teamId,
        leagueId: leagueId,
        name: teamData.name,
        url: teamData.url,
        numberOfMoves: this.toIntOrNull(teamData.number_of_moves),
        numberOfTrades: this.toIntOrNull(teamData.number_of_trades),
        clinchedPlayoffs: teamData.clinched_playoffs === '1',
        managerNickname: managerData?.nickname,
        managerEmail: managerData?.email,
        managerIsCommissioner: managerData?.is_commissioner === '1',
        isFinished: leagueIsFinished,
        season: season,
      },
    })
  }

  private async processStandings(standings: any, season: string) {
    try {
      logger.info('Processing standings', { standingsType: typeof standings, isArray: Array.isArray(standings) })
      
      if (!standings) {
        logger.warn('No standings data provided')
        return
      }

      const standingsArray = Array.isArray(standings) ? standings : [standings]
      logger.info('Processing standings array', { count: standingsArray.length })

      for (const standing of standingsArray) {
        try {
          logger.info('Processing team standing', { 
            teamKey: standing?.team_key, 
            rank: standing?.rank,
            hasOutcomeTotals: !!standing?.outcome_totals,
            wins: standing?.outcome_totals?.wins,
            losses: standing?.outcome_totals?.losses
          })

          if (!standing?.team_key) {
            logger.warn('Skipping standing with no team_key', standing)
            continue
          }

          await prisma.team.update({
            where: {
              teamKey_season: {
                teamKey: standing.team_key,
                season: season,
              },
            },
            data: {
              rank: this.toIntOrNull(standing.rank),
              wins: parseInt(standing.outcome_totals?.wins || '0'),
              losses: parseInt(standing.outcome_totals?.losses || '0'),
              ties: parseInt(standing.outcome_totals?.ties || '0'),
              percentage: parseFloat(standing.outcome_totals?.percentage || '0'),
              pointsFor: parseFloat(standing.points_for || '0'),
              pointsAgainst: parseFloat(standing.points_against || '0'),
            },
          })
          
          logger.info('Successfully updated team standings', { teamKey: standing.team_key })
        } catch (error) {
          logger.error('Error processing individual standing', error as Error, { standing })
        }
      }
    } catch (error) {
      logger.error('Error in processStandings', error as Error, { standings })
    }
  }

  // Removed: processWeeklyStats method - focusing on league-level data only

  // Removed: processPlayerStats method - we don't need individual player stats for league analysis

  // Fetch comprehensive player metadata with parallel batch processing
  private async fetchPlayerMetadata(playerKeys: string[]): Promise<Map<string, any>> {
    const playerMap = new Map<string, any>()
    
    // Yahoo API allows fetching multiple players at once
    // Format: /players;player_keys=key1,key2,key3
    const batchSize = 25 // Yahoo typically allows 25 players per request
    const concurrentBatches = 3 // Process 3 batches concurrently
    
    // Create batches
    const batches = []
    for (let i = 0; i < playerKeys.length; i += batchSize) {
      batches.push(playerKeys.slice(i, i + batchSize))
    }
    
    logger.info('Starting parallel player metadata fetch', { 
      totalPlayers: playerKeys.length,
      batchCount: batches.length,
      concurrentBatches 
    })
    
    // Process batches in groups of concurrentBatches
    for (let i = 0; i < batches.length; i += concurrentBatches) {
      const batchGroup = batches.slice(i, i + concurrentBatches)
      
      // Process this group of batches in parallel
      await Promise.all(
        batchGroup.map(batch => this.fetchPlayerBatch(batch, playerMap))
      )
      
      // Rate limit protection between groups (reduced from 500ms to 200ms)
      if (i + concurrentBatches < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    logger.info('Player metadata fetch completed', { 
      totalPlayers: playerKeys.length, 
      playersFound: playerMap.size 
    })
    
    return playerMap
  }

  // Helper method to fetch a single batch
  private async fetchPlayerBatch(batch: string[], playerMap: Map<string, any>): Promise<void> {
      const playerKeysParam = batch.join(',')
      const url = `${this.yahooClient.yahooBaseUrl}/players;player_keys=${playerKeysParam}`
      
      try {
      logger.info('Fetching player metadata batch', { batchSize: batch.length, url })
        const response = await this.yahooClient.makeApiRequest(url)
        const players = response.fantasy_content?.players?.player
        
        if (players) {
          const playerArray = Array.isArray(players) ? players : [players]
          playerArray.forEach((player: any) => {
            playerMap.set(player.player_key, {
              // Basic info
            playerId: parseInt(player.player_id),
              name: player.name?.full || 'Unknown',
              firstName: player.name?.first,
              lastName: player.name?.last,
              
              // Position info
              position: player.display_position || player.primary_position,
              positionType: player.position_type, // P (player) or G (goalie)
            primaryPosition: player.primary_position || null,
              eligiblePositions: player.eligible_positions?.position,
              
            // Team info - using editorial team data from MVP structure
              nhlTeam: player.editorial_team_abbr, // e.g., "EDM", "BUF"
              nhlTeamFullName: player.editorial_team_full_name, // e.g., "Edmonton Oilers"
            uniformNumber: player.uniform_number ? String(player.uniform_number) : null,
              
              // Status
            status: player.status || null, // NA, O, IR, etc.
            statusFull: player.status_full || null, // "Not Active", "Out", etc.
              
              // URLs
              playerUrl: player.url,
              headshotUrl: player.headshot?.url || player.image_url,
              
              // Additional metadata
              isUndroppable: player.is_undroppable === 1 || player.is_undroppable === '1',
              editorialPlayerKey: player.editorial_player_key,
            })
          })
        
        logger.info('Player metadata batch processed', { 
          batchSize: batch.length, 
          playersFound: playerArray.length,
          samplePlayer: playerArray[0]?.name?.full 
        })
      } else {
        logger.warn('No players found in batch response', { batch })
        }
      } catch (error) {
        logger.error('Error fetching player metadata batch', error as Error, { batch })
      }
  }

  // Process draft results. Returns error strings (empty when healthy) so the
  // caller surfaces failures instead of this data silently vanishing.
  private async processDraftResults(leagueData: any, season: string, leagueKey: string): Promise<string[]> {
    try {
      // Access draft results from correct path
      if (leagueData.draftresults?.fantasy_content?.league?.draft_results?.draft_result) {
        const draftResults = Array.isArray(leagueData.draftresults.fantasy_content.league.draft_results.draft_result)
          ? leagueData.draftresults.fantasy_content.league.draft_results.draft_result
          : [leagueData.draftresults.fantasy_content.league.draft_results.draft_result]

        // Collect all unique player keys
        const playerKeys = [...new Set(draftResults.map((dr: any) => dr.player_key).filter(Boolean))] as string[]
        
        // Check which draft results already have complete player metadata for this season (caching optimization)
        const existingDraftResults = await prisma.draftResult.findMany({
            where: {
            playerKey: { in: playerKeys },
            season: season,
            nhlTeam: { not: null }  // Only consider complete records
          },
          select: { 
            playerKey: true,
            playerId: true,
            nhlTeam: true,
            nhlTeamFullName: true,
            fullName: true,
            position: true,
            positionType: true,
            uniformNumber: true,
            headshotUrl: true,
            playerUrl: true,
            isUndroppable: true,
            editorialPlayerKey: true
          },
          distinct: ['playerKey']  // Avoid duplicates
        })
        
        // Filter to only fetch players we don't have complete metadata for
        const existingKeys = new Set(existingDraftResults.map(p => p.playerKey))
        const newPlayerKeys = playerKeys.filter(k => !existingKeys.has(k))
        
        let playerMap = new Map<string, any>()
        
        // Only fetch new players for this season
        if (newPlayerKeys.length > 0) {
          logger.info('Fetching new player metadata', { 
            total: playerKeys.length,
            existing: existingKeys.size,
            new: newPlayerKeys.length,
            season: season
          })
          playerMap = await this.fetchPlayerMetadata(newPlayerKeys)
        } else {
          logger.info('All players already cached for season', { 
            total: playerKeys.length,
            season: season
          })
        }
        
        // Add existing players to the map
        existingDraftResults.forEach(player => {
          if (player.playerKey) {
            playerMap.set(player.playerKey, {
              playerId: player.playerId,
              name: player.fullName,
              firstName: player.fullName?.split(' ')[0],
              lastName: player.fullName?.split(' ').slice(1).join(' '),
              position: player.position,
              positionType: player.positionType,
              nhlTeam: player.nhlTeam,
              nhlTeamFullName: player.nhlTeamFullName,
              uniformNumber: player.uniformNumber,
              headshotUrl: player.headshotUrl,
              playerUrl: player.playerUrl,
              isUndroppable: player.isUndroppable,
              editorialPlayerKey: player.editorialPlayerKey,
            })
          }
        })
        
        // Process draft results with batch operations for massive speed improvement
        const draftRecords = draftResults.map((draftResult: any) => {
          const playerInfo = playerMap.get(draftResult.player_key)
          return {
              pick: parseInt(draftResult.pick),
              round: parseInt(draftResult.round),
              teamKey: draftResult.team_key,
            season: season,
              playerKey: draftResult.player_key,
            playerId: playerInfo?.playerId || null,
            firstName: playerInfo?.firstName || null,
            lastName: playerInfo?.lastName || null,
            fullName: playerInfo?.name || null,
              position: playerInfo?.position || null,
            positionType: playerInfo?.positionType || null,
            nhlTeam: playerInfo?.nhlTeam || null,
            nhlTeamFullName: playerInfo?.nhlTeamFullName || null,
            uniformNumber: playerInfo?.uniformNumber ? String(playerInfo.uniformNumber) : null,
            headshotUrl: playerInfo?.headshotUrl || null,
            playerUrl: playerInfo?.playerUrl || null,
            isUndroppable: playerInfo?.isUndroppable || false,
            editorialPlayerKey: playerInfo?.editorialPlayerKey || null,
          }
        })
        
        // Batch upsert using transaction for maximum speed
        await prisma.$transaction(async (tx) => {
          // Delete existing records for this season/team combo to avoid conflicts
          const teamKeys = [...new Set(draftRecords.map((r: any) => r.teamKey as string))] as string[]
          await tx.draftResult.deleteMany({
            where: {
              teamKey: { in: teamKeys },
              season: season
            }
          })
          
          // Batch insert all records
          await tx.draftResult.createMany({
            data: draftRecords,
            skipDuplicates: false
          })
        }, { timeout: 60000 })
        
        logger.info('Draft results processed with complete player metadata', {
          count: draftResults.length,
          playersProcessed: playerMap.size
        })
      }
      return []
    } catch (error) {
      logger.error('Error processing draft results', error as Error)
      return [`Draft results (${leagueKey}): ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }

  // Process transactions. Returns error strings (empty when healthy).
  // NOTE: the deleteMany below wipes ALL transactions for the season before
  // re-inserting — safe only because this keeper chain has exactly one league
  // per season (Transaction has no league column to scope by).
  private async processTransactions(leagueData: any, season: string, leagueId: string, leagueKey: string): Promise<string[]> {
    try {
      // Access transactions from correct path
      if (leagueData.transactions?.fantasy_content?.league?.transactions?.transaction) {
        const transactions = Array.isArray(leagueData.transactions.fantasy_content.league.transactions.transaction)
          ? leagueData.transactions.fantasy_content.league.transactions.transaction
          : [leagueData.transactions.fantasy_content.league.transactions.transaction]

        // Prepare all transaction records for batch processing
        const transactionRecords = transactions.map((transaction: any) => ({
              transactionKey: transaction.transaction_key,
              transactionId: parseInt(transaction.transaction_id),
              season: season,
              type: transaction.type,
          status: transaction.status || null,
          timestamp: transaction.timestamp ? String(transaction.timestamp) : null,
          faabBid: transaction.faab_bid ? parseInt(transaction.faab_bid) : null,
          traderTeamKey: transaction.trader_team_key || null,
          traderTeamName: transaction.trader_team_name || null,
          tradeeTeamKey: transaction.tradee_team_key || null,
          tradeeTeamName: transaction.tradee_team_name || null,
              picks: transaction.picks ? JSON.stringify(transaction.picks) : null,
          players: transaction.players ? JSON.stringify(transaction.players) : null,
        }))
        
        // Bulk operations for maximum performance
        logger.info('Processing transactions with bulk operations', { 
          totalTransactions: transactionRecords.length,
          leagueId: leagueId,
          season: season
        })
        
        await prisma.$transaction(async (tx) => {
          // Step 1: Delete all existing transactions for this season
          const deleteResult = await tx.transaction.deleteMany({
            where: { 
              season: season
            }
          })
          
          logger.info('Deleted existing transactions', { 
            deletedCount: deleteResult.count,
            season: season
          })
          
          // Step 2: Bulk insert all new transactions
          const insertResult = await tx.transaction.createMany({
            data: transactionRecords,
            skipDuplicates: true // Safety net for any edge cases
          })
          
          logger.info('Bulk inserted transactions', { 
            insertedCount: insertResult.count,
            totalRecords: transactionRecords.length,
            season: season
          })
        }, {
          timeout: Math.max(60000, transactionRecords.length * 10), // Scale timeout with record count
          maxWait: 15000 // 15s max wait for connection
        })
        
        logger.info('Transactions processed', { count: transactions.length })
      }
      return []
    } catch (error) {
      logger.error('Error processing transactions', error as Error)
      return [`Transactions (${leagueKey}): ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }

  // REMOVED: processWeeklyTeamStats method - data now captured in Matchup table
  // Weekly team stats are stored in Matchup.team1Stats and Matchup.team2Stats

  // REMOVED: processGameMetadata method - GameMetadata model not in current schema
  // Game metadata can be stored in Game model if needed

  // Collision-proof numeric matchup id. The old string-concatenation scheme
  // (parseInt(`${week}${idA}${idB}`)) produced the same integer for distinct
  // matchups once team ids reached 2 digits (e.g. w1 t1-vs-t12 === w1 t11-vs-t2),
  // silently overwriting rows via the (matchupId, season) unique constraint.
  // Safe for team ids < 1000 and any week; existing rows were backfilled to
  // this scheme (old ids max out ~261010, new ids start at 1_001_002 — no overlap).
  private buildMatchupId(week: number, teamKeyA: string, teamKeyB: string): number {
    const idA = parseInt(teamKeyA.split('.').pop()!)
    const idB = parseInt(teamKeyB.split('.').pop()!)
    return week * 1_000_000 + Math.min(idA, idB) * 1000 + Math.max(idA, idB)
  }

  // Batch process matchups for better performance
  private async batchProcessMatchups(
    matchupsData: any,
    leagueId: string,
    season: string
  ): Promise<{ processed: number; error?: string }> {
    try {
      const teams = Array.isArray(matchupsData.fantasy_content.league.teams.team)
        ? matchupsData.fantasy_content.league.teams.team
        : [matchupsData.fantasy_content.league.teams.team]

      // Collect all matchups by week and team to reconstruct full matchups
      const matchupMap = new Map<string, any>()
      const processedMatchups = new Set<string>()

      for (const team of teams) {
        if (team.matchups?.matchup) {
          const teamMatchups = Array.isArray(team.matchups.matchup)
            ? team.matchups.matchup
            : [team.matchups.matchup]

          for (const matchupData of teamMatchups) {
            const week = matchupData.week
            const teamKey = team.team_key
            
            const matchupKey = `week-${week}-team-${teamKey}`
            matchupMap.set(matchupKey, {
              week: week,
              teamKey: teamKey,
              teamData: team,
              matchupData: matchupData
            })
          }
        }
      }

      // Reconstruct full matchups and collect for batch processing
      const matchupsToProcess: any[] = []
      
      for (const matchup of matchupMap.values()) {
        const week = matchup.week
        const team1Key = matchup.teamKey
        
        const matchupId = `${week}-${team1Key}`
        if (processedMatchups.has(matchupId)) continue
        
        const opponentKey = matchup.matchupData.teams?.team?.find((t: any) => t.team_key !== team1Key)?.team_key
        
        if (opponentKey) {
          const opponentMatchupKey = `week-${week}-team-${opponentKey}`
          const opponentMatchup = matchupMap.get(opponentMatchupKey)
          
          if (opponentMatchup) {
            const team1MatchupData = matchup.matchupData.teams?.team?.find((t: any) => t.team_key === team1Key)
            const team2MatchupData = opponentMatchup.matchupData.teams?.team?.find((t: any) => t.team_key === opponentKey)
            
            const completeMatchup = {
              week: week,
              week_start: matchup.matchupData.week_start,
              week_end: matchup.matchupData.week_end,
              status: matchup.matchupData.status,
              is_playoffs: matchup.matchupData.is_playoffs,
              is_consolation: matchup.matchupData.is_consolation,
              is_tied: matchup.matchupData.is_tied,
              winner_team_key: matchup.matchupData.winner_team_key,
              stat_winners: matchup.matchupData.stat_winners,
              teams: {
                team: [
                  {
                    team_key: team1Key,
                    team_points: team1MatchupData?.team_points,
                    team_stats: team1MatchupData?.team_stats
                  },
                  {
                    team_key: opponentKey,
                    team_points: team2MatchupData?.team_points,
                    team_stats: team2MatchupData?.team_stats
                  }
                ]
              }
            }
            
            matchupsToProcess.push(completeMatchup)
            processedMatchups.add(matchupId)
            processedMatchups.add(`${week}-${opponentKey}`)
          }
        }
      }

      // Batch upsert all matchups in a transaction
      if (matchupsToProcess.length > 0) {
        // Dynamic batch sizing for matchups based on total count
        const getMatchupBatchSize = (total: number) => {
          if (total < 100) return 25
          if (total < 200) return 50
          if (total < 500) return 100
          return 200 // Max safe batch size for matchups
        }
        
        const batchSize = getMatchupBatchSize(matchupsToProcess.length)
        logger.info('Processing matchups with dynamic batch size', { 
          totalMatchups: matchupsToProcess.length, 
          batchSize: batchSize,
          estimatedBatches: Math.ceil(matchupsToProcess.length / batchSize)
        })
        
        for (let i = 0; i < matchupsToProcess.length; i += batchSize) {
          const batch = matchupsToProcess.slice(i, i + batchSize)
          
          await prisma.$transaction(async (tx) => {
            const promises = []
            for (const matchupData of batch) {
              const teams = Array.isArray(matchupData.teams?.team)
                ? matchupData.teams.team
                : [matchupData.teams?.team]

              if (teams.length === 2 && teams[0] && teams[1]) {
                const homeTeam = teams[0]
                const awayTeam = teams[1]
                const week = parseInt(matchupData.week)
                const team1Key = homeTeam.team_key
                const team2Key = awayTeam.team_key

                const matchupId = this.buildMatchupId(week, team1Key, team2Key)

                promises.push(
                  tx.matchup.upsert({
                    where: { 
                      matchupId_season: {
                        matchupId: matchupId,
                        season: season,
                      },
                    },
                    update: {
                      week: week,
                      status: matchupData.status,
                      isPlayoffs: matchupData.is_playoffs === '1' || matchupData.is_playoffs === 1,
                      isConsolation: matchupData.is_consolation === '1' || matchupData.is_consolation === 1,
                      isTied: matchupData.is_tied === '1' || matchupData.is_tied === 1,
                      winnerTeamKey: matchupData.winner_team_key,
                      team1Points: homeTeam.team_points?.total ? parseFloat(homeTeam.team_points.total) : null,
                      team2Points: awayTeam.team_points?.total ? parseFloat(awayTeam.team_points.total) : null,
                      season: season,
                      weekStart: matchupData.week_start,
                      weekEnd: matchupData.week_end,
                      statWinners: JSON.stringify(matchupData.stat_winners),
                      team1Stats: JSON.stringify(homeTeam.team_stats),
                      team2Stats: JSON.stringify(awayTeam.team_stats)
                    },
                    create: {
                      matchupId: matchupId,
                      leagueId: leagueId,
                      week: week,
                      status: matchupData.status,
                      isPlayoffs: matchupData.is_playoffs === '1' || matchupData.is_playoffs === 1,
                      isConsolation: matchupData.is_consolation === '1' || matchupData.is_consolation === 1,
                      isTied: matchupData.is_tied === '1' || matchupData.is_tied === 1,
                      team1Key: team1Key,
                      team2Key: team2Key,
                      winnerTeamKey: matchupData.winner_team_key,
                      team1Points: homeTeam.team_points?.total ? parseFloat(homeTeam.team_points.total) : null,
                      team2Points: awayTeam.team_points?.total ? parseFloat(awayTeam.team_points.total) : null,
                      season: season,
                      weekStart: matchupData.week_start,
                      weekEnd: matchupData.week_end,
                      statWinners: JSON.stringify(matchupData.stat_winners),
                      team1Stats: JSON.stringify(homeTeam.team_stats),
                      team2Stats: JSON.stringify(awayTeam.team_stats)
                    }
                  })
                )
              }
            }
            
            return Promise.all(promises)
          },
            { 
              timeout: Math.max(30000, batchSize * 200), // Scale timeout with batch size
              maxWait: 10000 // 10s max wait for connection
            }
          )
        }
        
        logger.info('Batch processed matchups', { 
          count: matchupsToProcess.length,
          leagueId,
          season
        })
      }

      return { processed: matchupsToProcess.length }
    } catch (error) {
      logger.error('Error in batch process matchups', error as Error)
      return { processed: 0 }
    }
  }

  // Smart caching helper methods
  private async shouldFetchMatchups(
    leagueInfo: any,
    forceRefresh: boolean
  ): Promise<boolean> {
    if (forceRefresh) return true

    // Skip for finished seasons whose stored matchups reach the final week.
    // A bare count>0 would let a partially-written season (killed mid-run)
    // skip re-fetching forever.
    if (leagueInfo.is_finished === '1' || leagueInfo.is_finished === 1) {
      const endWeek = parseInt(leagueInfo.end_week) || null
      const stored = await prisma.matchup.aggregate({
        where: {
          league: { leagueKey: leagueInfo.league_key },
          season: String(leagueInfo.season)
        },
        _count: true,
        _max: { week: true }
      })

      const complete = stored._count > 0 && (!endWeek || (stored._max.week ?? 0) >= endWeek)
      if (complete) {
        logger.info('Skipping matchups - season finished, data complete through final week', {
          leagueKey: leagueInfo.league_key,
          season: leagueInfo.season,
          matchupCount: stored._count,
          maxWeek: stored._max.week,
          endWeek
        })
        return false
      }
    }

    return true
  }

  private async verifyCompleteData(leagueId: string, leagueKey: string): Promise<boolean> {
    const [teams, matchups, draftResults] = await Promise.all([
      prisma.team.count({ where: { leagueId } }),
      prisma.matchup.count({ where: { leagueId } }),
      // DraftResult has no league relation; team keys embed the league key
      // (e.g. "453.l.32566.t.5"). The old check matched against the internal
      // cuid, which never hit, so finished leagues were re-synced every run.
      prisma.draftResult.count({ where: { teamKey: { startsWith: `${leagueKey}.t.` } } })
    ])

    return teams > 0 && matchups > 0 && draftResults > 0
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
