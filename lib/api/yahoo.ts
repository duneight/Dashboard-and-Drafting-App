import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { SEASONS_TO_SYNC, KEEPER_LEAGUE_PREFIX, KEEPER_LEAGUE_ID } from '@/lib/constants'

// Environment variables validation
const envSchema = z.object({
  YAHOO_CLIENT_ID: z.string().optional(),
  YAHOO_CLIENT_SECRET: z.string().optional(),
  YAHOO_REFRESH_TOKEN: z.string().optional(),
})

const envResult = envSchema.safeParse(process.env)
const env = envResult.success ? envResult.data : {
  YAHOO_CLIENT_ID: process.env.YAHOO_CLIENT_ID || '',
  YAHOO_CLIENT_SECRET: process.env.YAHOO_CLIENT_SECRET || '',
  YAHOO_REFRESH_TOKEN: process.env.YAHOO_REFRESH_TOKEN || '',
}

// Types for Yahoo API responses
interface YahooCredentials {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

interface LeagueKey {
  leagueKey: string
  season: string
  gameCode: string
  gameAbbreviation: string
  leagueName?: string
  renew?: string
  renewed?: string
}

interface YahooGame {
  game_key: string
  code: string
  name: string
  season: string
}

interface YahooLeague {
  league_key: string
  league_id: string
  name: string
  url: string
  draft_status: string
  num_teams: string
  current_week: string
  start_date: string
  end_date: string
  is_finished: string
  game_code: string
  season: string
  renew?: string
  renewed?: string
}

export class YahooApiClient {
  private credentials: YahooCredentials | null = null
  private axiosInstance: AxiosInstance
  private xmlParser: XMLParser
  private readonly authHeader: string
  private readonly authEndpoint = 'https://api.login.yahoo.com/oauth2/get_token'
  private readonly yahooBaseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2'

  constructor() {
    this.authHeader = Buffer.from(`${env.YAHOO_CLIENT_ID}:${env.YAHOO_CLIENT_SECRET}`, 'binary').toString('base64')
    
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '$text'
    })
    
    this.axiosInstance = axios.create({
      timeout: 20000,
    })
  }

  async initialize(): Promise<void> {
    await this.refreshCredentials()
  }

  private async refreshCredentials(): Promise<void> {
    try {
      logger.info('Refreshing Yahoo API credentials')
      
      const response = await this.axiosInstance.post(
        this.authEndpoint,
        qs.stringify({
          redirect_uri: 'oob',
          grant_type: 'refresh_token',
          refresh_token: env.YAHOO_REFRESH_TOKEN,
        }),
        {
          headers: {
            Authorization: `Basic ${this.authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36',
          },
        }
      )

      if (response.data?.access_token) {
        this.credentials = response.data
        logger.info('Yahoo API credentials refreshed successfully')
      } else {
        throw new Error('Failed to obtain access token')
      }
    } catch (error) {
      logger.error('Error refreshing Yahoo API credentials', error as Error)
      throw error
    }
  }

  async makeApiRequest(url: string, retryCount = 1, delay = 4000): Promise<any> {
    try {
      logger.debug('Making API request', { url })
      
      const response = await this.axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${this.credentials!.access_token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      logger.debug('API request successful, parsing XML response')
      return this.xmlParser.parse(response.data)
    } catch (error: any) {
      logger.error('Error during API request', error as Error, { url })
      
      if (error.response?.status === 401 && retryCount > 0) {
        logger.info('Access token expired, refreshing credentials')
        await this.refreshCredentials()
        return this.makeApiRequest(url, retryCount - 1, delay * 2)
      }
      
      if (error.response?.status === 429 && retryCount > 0) {
        logger.warn('Rate limited, waiting before retry', { delay })
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeApiRequest(url, retryCount - 1, delay * 2)
      }

      if (retryCount > 0) {
        logger.info('Retrying API request', { retryCount })
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.makeApiRequest(url, retryCount - 1, delay * 2)
      }

      throw error
    }
  }

  async fetchLeagueDataParallel(leagueKey: string): Promise<any> {
    const endpoints = [
      { key: 'metadata', url: `${this.yahooBaseUrl}/league/${leagueKey}` },
      { key: 'settings', url: `${this.yahooBaseUrl}/league/${leagueKey};out=settings` },
      { key: 'teams_standings', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=standings` },
      { key: 'scoreboard', url: `${this.yahooBaseUrl}/league/${leagueKey};out=scoreboard` },
      { key: 'draftresults', url: `${this.yahooBaseUrl}/league/${leagueKey};out=draftresults` },
      { key: 'transactions', url: `${this.yahooBaseUrl}/league/${leagueKey}/transactions` },
    ]
    
    // Fetch all endpoints in parallel
    logger.info('Fetching league data in parallel', { leagueKey, endpointCount: endpoints.length })
    
    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        try {
          const data = await this.makeApiRequest(endpoint.url)
          return { key: endpoint.key, data }
        } catch (error) {
          logger.error(`Error fetching ${endpoint.key}`, error as Error)
          return { key: endpoint.key, data: null }
        }
      })
    )
    
    // Combine results into single object
    const leagueData: any = {}
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        leagueData[result.value.key] = result.value.data
      }
    })
    
    return leagueData
  }

  async fetchTeamsMatchupsOptimized(leagueKey: string): Promise<any> {
    // This endpoint is slow because it fetches ALL matchup history
    // Fetch separately with longer timeout
    logger.info('Fetching teams matchups (slow endpoint)', { leagueKey })
    
    const url = `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=matchups`
    
    // Use longer timeout for this endpoint
    const response = await this.axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${this.credentials!.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 60000, // 60 seconds for matchups endpoint
    })
    
    return this.xmlParser.parse(response.data)
  }

  async getAllLeagueKeys(): Promise<LeagueKey[]> {
    try {
      logger.info('Fetching all league keys for user')
      
      const userGamesUrl = `${this.yahooBaseUrl}/users;use_login=1/games`
      const userGamesResponse = await this.makeApiRequest(userGamesUrl)
      let leagueKeys: LeagueKey[] = []

      if (userGamesResponse?.fantasy_content?.users?.user?.games?.game) {
        const userGames: YahooGame[] = Array.isArray(userGamesResponse.fantasy_content.users.user.games.game)
          ? userGamesResponse.fantasy_content.users.user.games.game
          : [userGamesResponse.fantasy_content.users.user.games.game]

        for (const game of userGames) {
          const gameCode = game.game_key
          const gameAbbreviation = game.code
          
          if (gameCode) {
            const leagueKeyUrl = `${this.yahooBaseUrl}/users;use_login=1/games;game_keys=${gameCode}/leagues`
            const leagueResponse = await this.makeApiRequest(leagueKeyUrl)

            if (leagueResponse?.fantasy_content?.users?.user?.games?.game) {
              const userGameLeagues = Array.isArray(leagueResponse.fantasy_content.users.user.games.game)
                ? leagueResponse.fantasy_content.users.user.games.game
                : [leagueResponse.fantasy_content.users.user.games.game]

              for (const userGame of userGameLeagues) {
                if (userGame.leagues?.league) {
                  const leagues: YahooLeague[] = Array.isArray(userGame.leagues.league) 
                    ? userGame.leagues.league 
                    : [userGame.leagues.league]
                  
                  leagues.forEach((league) => {
                    logger.debug('Processing league', { 
                      league: JSON.stringify(league, null, 2),
                      gameCode: String(gameCode),
                      season: String(userGame.season),
                      gameAbbreviation 
                    })
                    const leagueKey = league.league_key
                    if (leagueKey) {
                      leagueKeys.push({
                        leagueKey,
                        season: String(userGame.season),
                        gameCode: String(gameCode),
                        gameAbbreviation,
                        leagueName: league.name, // Store league name for filtering
                        renew: league.renew, // Store renewal info
                        renewed: league.renewed, // Store renewed info
                      })
                      logger.debug('Added league key', { leagueKey, season: String(userGame.season), gameCode: String(gameCode), leagueName: league.name })
                    } else {
                      logger.warn('League missing league_key', { league })
                    }
                  })
                }
              }
            }
          }
        }
      }

        // Filter to only keeper league by renewal chain (since league ID changes each season)
      // First, find all NHL leagues
      const nhlLeagues = leagueKeys.filter(league => 
        league.gameAbbreviation === 'nhl' && 
        SEASONS_TO_SYNC.includes(league.season)
      )
      
      // Find the keeper league chain by tracing renewals from the known 2023 league
      const keeperLeagueIds = new Set([KEEPER_LEAGUE_ID]) // Start with known 2023 league ID
      
      // Trace forward and backward through renewals
      let foundNew = true
      while (foundNew) {
        foundNew = false
        nhlLeagues.forEach(league => {
          const leagueId = league.leagueKey.split('.l.')[1]
          if (keeperLeagueIds.has(leagueId)) {
            // This league is in our keeper chain, add its renewals
            const renew = league.renew
            const renewed = league.renewed
            if (renew && !keeperLeagueIds.has(renew.split('_')[1])) {
              keeperLeagueIds.add(renew.split('_')[1])
              foundNew = true
            }
            if (renewed && !keeperLeagueIds.has(renewed.split('_')[1])) {
              keeperLeagueIds.add(renewed.split('_')[1])
              foundNew = true
            }
          }
        })
      }
      
      // Filter to only keeper league chain
      leagueKeys = nhlLeagues.filter(league => {
        const leagueId = league.leagueKey.split('.l.')[1]
        return keeperLeagueIds.has(leagueId)
      })
      
      // Auto-detect: If Yahoo API returns future season, it will be included
      logger.info('Detected keeper league seasons', { 
        seasons: leagueKeys.map(l => l.season),
        configuredSeasons: SEASONS_TO_SYNC,
        keeperLeaguePrefix: KEEPER_LEAGUE_PREFIX
      })

      logger.info('Found NHL league keys', { count: leagueKeys.length })
      return leagueKeys
    } catch (error) {
      logger.error('Error fetching league keys', error as Error)
      throw error
    }
  }

  async fetchLeagueData(leagueKey: string): Promise<any> {
    try {
      logger.info('Fetching data for league', { leagueKey })
      
      const leagueData: any = {}
      
      // Match MVP structure with proper ;out= format
      const collections = [
        // League-level endpoints
        { name: 'metadata', url: `${this.yahooBaseUrl}/league/${leagueKey};out=metadata` },
        { name: 'settings', url: `${this.yahooBaseUrl}/league/${leagueKey};out=settings` },
        { name: 'standings', url: `${this.yahooBaseUrl}/league/${leagueKey};out=standings` },
        { name: 'scoreboard', url: `${this.yahooBaseUrl}/league/${leagueKey};out=scoreboard` },
        { name: 'draftresults', url: `${this.yahooBaseUrl}/league/${leagueKey};out=draftresults` },
        { name: 'transactions', url: `${this.yahooBaseUrl}/league/${leagueKey};out=transactions` },
        
        // Team-level endpoints (match MVP naming: teams_*)
        { name: 'teams_metadata', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=metadata` },
        { name: 'teams_stats', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=stats` },
        { name: 'teams_standings', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=standings` },
        { name: 'teams_roster', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=roster` },
        { name: 'teams_draftresults', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=draftresults` },
        { name: 'teams_transactions', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=transactions` },
        { name: 'teams_matchups', url: `${this.yahooBaseUrl}/league/${leagueKey}/teams;out=matchups` },
        
        // Player-level endpoints (streamlined - only what we need for league analysis)
        // Removed: players_metadata, players_stats, players_ownership, players_percent_owned, players_draft_analysis
        // We only need basic player data for draft results, not individual stats
      ]

      for (const collection of collections) {
        try {
          logger.info('Fetching endpoint', { endpoint: collection.name, url: collection.url })
          const data = await this.makeApiRequest(collection.url)
          
          // Log what we got back
          if (data?.fantasy_content?.league) {
            logger.info('Endpoint data received', { 
              endpoint: collection.name, 
              hasLeague: !!data.fantasy_content.league,
              leagueKeys: Object.keys(data.fantasy_content.league || {})
            })
          } else {
            logger.warn('Endpoint returned unexpected structure', { 
              endpoint: collection.name,
              dataKeys: data ? Object.keys(data) : [],
              hasFantasyContent: !!data?.fantasy_content
            })
          }
          
          leagueData[collection.name] = data
          
          // Add delay between requests to respect rate limits (reduced from 1000ms to 500ms)
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          logger.error('Error fetching endpoint', error as Error, { endpoint: collection.name, leagueKey, url: collection.url })
          leagueData[collection.name] = null
        }
      }

      return leagueData
    } catch (error) {
      logger.error('Error fetching league data', error as Error, { leagueKey })
      throw error
    }
  }

  async fetchGameData(gameCode: string): Promise<any> {
    try {
      logger.info('Fetching game data', { gameCode })
      
      const endpoints = [
        'metadata',
        'stat_categories',
        'position_types',
        'roster_positions',
        'game_weeks'
      ]

      const gameData: any = {}

      for (const endpoint of endpoints) {
        try {
          const url = `${this.yahooBaseUrl}/game/${gameCode}/${endpoint}`
          const data = await this.makeApiRequest(url)
          gameData[endpoint] = data
          
          // Add delay between requests (reduced from 1000ms to 500ms)
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          logger.error('Error fetching game endpoint', error as Error, { endpoint, gameCode })
          gameData[endpoint] = null
        }
      }

      return gameData
    } catch (error) {
      logger.error('Error fetching game data', error as Error, { gameCode })
      throw error
    }
  }

  async fetchGameMetadata(gameCode: string): Promise<any> {
    try {
      logger.info('Fetching game metadata', { gameCode })
      
      const endpoints = [
        'metadata',
        'stat_categories', 
        'position_types',
        'roster_positions',
        'game_weeks'
      ]
      
      // Fetch in parallel for speed
      const results = await Promise.all(
        endpoints.map(endpoint => 
          this.makeApiRequest(`${this.yahooBaseUrl}/game/${gameCode}/${endpoint}`)
        )
      )
      
      return {
        metadata: results[0],
        stat_categories: results[1],
        position_types: results[2],
        roster_positions: results[3],
        game_weeks: results[4]
      }
    } catch (error) {
      logger.error('Error fetching game metadata', error as Error, { gameCode })
      throw error
    }
  }
}

// Singleton instance
let yahooClient: YahooApiClient | null = null

export async function getYahooClient(): Promise<YahooApiClient> {
  if (!yahooClient) {
    yahooClient = new YahooApiClient()
    await yahooClient.initialize()
  }
  return yahooClient
}
