import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface LeagueData {
  game_metadata?: any
  leagues_metadata?: any
  leagues_settings?: any
  leagues_standings?: any
  leagues_scoreboard?: any
  teams_metadata?: any
  teams_stats?: any
  teams_standings?: any
  teams_roster?: any
  teams_matchups?: any
}

async function migrate() {
  console.log('Starting data migration from JSON files...')
  
  try {
    // Find all data directories
    const dataDir = path.join(process.cwd(), '..', 'data')
    const gameDirs = await fs.readdir(dataDir)
    
    console.log(`Found game directories: ${gameDirs.join(', ')}`)
    
    for (const gameDir of gameDirs) {
      const gamePath = path.join(dataDir, gameDir)
      const leagueDirs = await fs.readdir(gamePath)
      
      console.log(`Processing ${leagueDirs.length} leagues in ${gameDir}`)
      
      for (const leagueDir of leagueDirs) {
        await processLeagueDirectory(gameDir, leagueDir, path.join(gamePath, leagueDir))
      }
    }
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function processLeagueDirectory(gameCode: string, leagueKey: string, leaguePath: string) {
  try {
    console.log(`Processing league: ${leagueKey}`)
    
    // Read all JSON files in the league directory
    const files = await fs.readdir(leaguePath)
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    const leagueData: LeagueData = {}
    
    for (const file of jsonFiles) {
      const filePath = path.join(leaguePath, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(content)
      
      const key = file.replace('.json', '')
      leagueData[key as keyof LeagueData] = data
    }
    
    // Extract season from league key or metadata
    const season = extractSeason(leagueData)
    
    // Create/update game record
    const game = await upsertGame(gameCode, leagueData)
    
    // Create/update league record
    const league = await upsertLeague(leagueKey, game.id, season, leagueData)
    
    // Create/update teams
    await upsertTeams(league.id, leagueData)
    
    // Create/update matchups
    await upsertMatchups(league.id, leagueData)
    
    console.log(`Successfully processed league: ${leagueKey}`)
    
  } catch (error) {
    console.error(`Error processing league ${leagueKey}:`, error)
  }
}

function extractSeason(leagueData: LeagueData): string {
  // Try to extract season from various sources
  if (leagueData.leagues_metadata?.fantasy_content?.league?.season) {
    return leagueData.leagues_metadata.fantasy_content.league.season
  }
  
  // Default to current year if not found
  return new Date().getFullYear().toString()
}

async function upsertGame(gameCode: string, leagueData: LeagueData) {
  const gameData = leagueData.game_metadata?.fantasy_content?.game
  
  if (!gameData) {
    throw new Error('Game metadata not found')
  }
  
  return await prisma.game.upsert({
    where: { gameKey: gameCode },
    update: {
      name: gameData.name,
      code: gameData.code,
      type: gameData.type,
      url: gameData.url,
      season: gameData.season,
      isGameOver: gameData.is_game_over === '1',
      isRegistrationOver: gameData.is_registration_over === '1',
      isPlayoffsOver: gameData.is_playoffs_over === '1',
      isOffseason: gameData.is_offseason === '1',
    },
    create: {
      gameKey: gameCode,
      gameId: parseInt(gameData.game_id),
      name: gameData.name,
      code: gameData.code,
      type: gameData.type,
      url: gameData.url,
      season: gameData.season,
      isGameOver: gameData.is_game_over === '1',
      isRegistrationOver: gameData.is_registration_over === '1',
      isPlayoffsOver: gameData.is_playoffs_over === '1',
      isOffseason: gameData.is_offseason === '1',
    }
  })
}

async function upsertLeague(leagueKey: string, gameId: string, season: string, leagueData: LeagueData) {
  const leagueInfo = leagueData.leagues_metadata?.fantasy_content?.league
  
  if (!leagueInfo) {
    throw new Error('League metadata not found')
  }
  
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
            isFinished: leagueInfo.is_finished === '1',
      season,
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
            isFinished: leagueInfo.is_finished === '1',
      gameId,
      season,
    }
  })
}

async function upsertTeams(leagueId: string, leagueData: LeagueData) {
  const teamsData = leagueData.teams_metadata?.fantasy_content?.league?.teams?.team
  const standingsData = leagueData.teams_standings?.fantasy_content?.league?.standings?.teams?.team
  
  if (!teamsData) {
    console.warn('No teams data found')
    return
  }
  
  const teams = Array.isArray(teamsData) ? teamsData : [teamsData]
  const standings = standingsData ? (Array.isArray(standingsData) ? standingsData : [standingsData]) : []
  
  // Create a map of standings by team key for quick lookup
  const standingsMap = new Map()
  standings.forEach((standing: any) => {
    standingsMap.set(standing.team_key, standing)
  })
  
  for (const team of teams) {
    const standing = standingsMap.get(team.team_key)

          await prisma.team.upsert({
      where: { teamKey: team.team_key },
            update: {
        name: team.name,
        url: team.url,
        numberOfMoves: team.number_of_moves ? parseInt(team.number_of_moves) : null,
        numberOfTrades: team.number_of_trades ? parseInt(team.number_of_trades) : null,
        clinchedPlayoffs: team.clinched_playoffs === '1',
        managerNickname: team.managers?.manager?.nickname || null,
        managerEmail: team.managers?.manager?.email || null,
        managerIsCommissioner: team.managers?.manager?.is_commissioner === '1',
        wins: standing?.outcome_totals?.wins ? parseInt(standing.outcome_totals.wins) : 0,
        losses: standing?.outcome_totals?.losses ? parseInt(standing.outcome_totals.losses) : 0,
        ties: standing?.outcome_totals?.ties ? parseInt(standing.outcome_totals.ties) : 0,
        percentage: standing?.outcome_totals?.percentage ? parseFloat(standing.outcome_totals.percentage) : 0,
        pointsFor: standing?.points_for ? parseFloat(standing.points_for) : 0,
        pointsAgainst: standing?.points_against ? parseFloat(standing.points_against) : 0,
        rank: standing?.rank ? parseInt(standing.rank) : null,
        isFinished: standing?.is_finished === '1',
        leagueId,
            },
            create: {
        teamKey: team.team_key,
        teamId: parseInt(team.team_id),
        name: team.name,
        url: team.url,
        numberOfMoves: team.number_of_moves ? parseInt(team.number_of_moves) : null,
        numberOfTrades: team.number_of_trades ? parseInt(team.number_of_trades) : null,
        clinchedPlayoffs: team.clinched_playoffs === '1',
        managerNickname: team.managers?.manager?.nickname || null,
        managerEmail: team.managers?.manager?.email || null,
        managerIsCommissioner: team.managers?.manager?.is_commissioner === '1',
        wins: standing?.outcome_totals?.wins ? parseInt(standing.outcome_totals.wins) : 0,
        losses: standing?.outcome_totals?.losses ? parseInt(standing.outcome_totals.losses) : 0,
        ties: standing?.outcome_totals?.ties ? parseInt(standing.outcome_totals.ties) : 0,
        percentage: standing?.outcome_totals?.percentage ? parseFloat(standing.outcome_totals.percentage) : 0,
        pointsFor: standing?.points_for ? parseFloat(standing.points_for) : 0,
        pointsAgainst: standing?.points_against ? parseFloat(standing.points_against) : 0,
        rank: standing?.rank ? parseInt(standing.rank) : null,
        isFinished: standing?.is_finished === '1',
        leagueId,
        season: new Date().getFullYear().toString(), // This should be extracted from league data
      }
    })
  }
}

async function upsertMatchups(leagueId: string, leagueData: LeagueData) {
  const matchupsData = leagueData.teams_matchups?.fantasy_content?.league?.teams?.team
  
  if (!matchupsData) {
    console.warn('No matchups data found')
    return
  }
  
  const teams = Array.isArray(matchupsData) ? matchupsData : [matchupsData]
  
  for (const team of teams) {
    if (team.matchups?.matchup) {
      const matchups = Array.isArray(team.matchups.matchup) ? team.matchups.matchup : [team.matchups.matchup]
      
      for (const matchup of matchups) {
            await prisma.matchup.upsert({
          where: { matchupId: parseInt(matchup.matchup_id) },
              update: {
            week: parseInt(matchup.week),
            status: matchup.status,
            isPlayoffs: matchup.is_playoffs === '1',
            isConsolation: matchup.is_consolation === '1',
            isTied: matchup.is_tied === '1',
            winnerTeamKey: matchup.winner_team_key,
            team1Key: matchup.teams?.team?.[0]?.team_key || '',
            team2Key: matchup.teams?.team?.[1]?.team_key || '',
            team1Points: matchup.teams?.team?.[0]?.team_points?.total ? parseFloat(matchup.teams.team[0].team_points.total) : null,
            team2Points: matchup.teams?.team?.[1]?.team_points?.total ? parseFloat(matchup.teams.team[1].team_points.total) : null,
            leagueId,
              },
              create: {
            matchupId: parseInt(matchup.matchup_id),
            week: parseInt(matchup.week),
            status: matchup.status,
            isPlayoffs: matchup.is_playoffs === '1',
            isConsolation: matchup.is_consolation === '1',
            isTied: matchup.is_tied === '1',
            winnerTeamKey: matchup.winner_team_key,
            team1Key: matchup.teams?.team?.[0]?.team_key || '',
            team2Key: matchup.teams?.team?.[1]?.team_key || '',
            team1Points: matchup.teams?.team?.[0]?.team_points?.total ? parseFloat(matchup.teams.team[0].team_points.total) : null,
            team2Points: matchup.teams?.team?.[1]?.team_points?.total ? parseFloat(matchup.teams.team[1].team_points.total) : null,
            leagueId,
            season: new Date().getFullYear().toString(), // This should be extracted from league data
          }
        })
      }
    }
  }
}

migrate()