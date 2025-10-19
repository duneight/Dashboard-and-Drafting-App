import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import { logger } from '@/lib/logger'

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
                    const leagueKey = league.league_key
                    if (leagueKey) {
                      leagueKeys.push({
                        leagueKey,
                        season: String(userGame.season),
                        gameCode: String(gameCode),
                        gameAbbreviation,
                      })
                    }
                  })
                }
              }
            }
          }
        }
      }

      // Filter to NHL leagues only and recent seasons
      const seasonsToFetch = ['2024', '2023', '2022']
      leagueKeys = leagueKeys.filter(league => 
        league.gameAbbreviation === 'nhl' && seasonsToFetch.includes(league.season)
      )

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
      
      const endpoints = [
        'metadata',
        'settings', 
        'standings',
        'scoreboard',
        'teams',
        'players',
        'transactions',
        'draftresults'
      ]

      const leagueData: any = {}

      for (const endpoint of endpoints) {
        try {
          const url = `${this.yahooBaseUrl}/league/${leagueKey}/${endpoint}`
          const data = await this.makeApiRequest(url)
          leagueData[endpoint] = data
          
          // Add delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          logger.error('Error fetching endpoint', error as Error, { endpoint, leagueKey })
          leagueData[endpoint] = null
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
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000))
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
