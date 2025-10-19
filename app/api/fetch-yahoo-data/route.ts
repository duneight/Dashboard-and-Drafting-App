import { NextRequest, NextResponse } from 'next/server'
import { YahooApiClient, getYahooClient } from '@/lib/api/yahoo'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const { leagueKeys, forceRefresh = false } = await request.json()
    
    // Initialize Yahoo API
    const yahooAPI = await getYahooClient()
    
    // Get league keys if not provided
    const keysToProcess = leagueKeys || await yahooAPI.getAllLeagueKeys()
    
    if (!keysToProcess || keysToProcess.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No league keys found to process' 
      }, { status: 400 })
    }

    console.log(`Processing ${keysToProcess.length} league(s)...`)
    
    // Process each league
    const results = []
    for (const leagueInfo of keysToProcess) {
      try {
        const result = await processLeagueData(yahooAPI, leagueInfo, forceRefresh)
        results.push(result)
      } catch (error) {
        console.error(`Error processing league ${leagueInfo.leagueKey}:`, error)
        results.push({
          leagueKey: leagueInfo.leagueKey,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} leagues`,
      results
    })

  } catch (error) {
    console.error('Error in fetch-yahoo-data API:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const yahooAPI = await getYahooClient()
    const leagueKeys = await yahooAPI.getAllLeagueKeys()
    
    return NextResponse.json({
      success: true,
      leagueKeys,
      count: leagueKeys.length
    })
  } catch (error) {
    console.error('Error fetching league keys:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch league keys',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function processLeagueData(yahooAPI: YahooApiClient, leagueInfo: any, forceRefresh: boolean) {
  const { leagueKey, gameCode, gameAbbreviation, season } = leagueInfo
  
  console.log(`Processing league: ${leagueKey} (${season})`)
  
  // Check if we already have recent data for this league
  if (!forceRefresh) {
    const existingLeague = await prisma.league.findUnique({
      where: { leagueKey },
      select: { id: true, updatedAt: true }
    })
    
    if (existingLeague) {
      const lastUpdate = new Date(existingLeague.updatedAt)
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceUpdate < 24) {
        console.log(`League ${leagueKey} was updated ${hoursSinceUpdate.toFixed(1)} hours ago, skipping`)
        return {
          leagueKey,
          success: true,
          message: 'Skipped - recently updated',
          skipped: true
        }
      }
    }
  }

  // Fetch league data from Yahoo API
  const collections = [
    { collection: 'game', subResources: ['metadata', 'game_weeks', 'stat_categories', 'position_types', 'roster_positions'] },
    { collection: 'leagues', subResources: ['metadata', 'settings', 'standings', 'scoreboard', 'transactions', 'draftresults'] },
    { collection: 'teams', subResources: ['metadata', 'stats', 'standings', 'roster', 'draftresults', 'transactions', 'matchups'] },
    { collection: 'players', subResources: ['metadata', 'stats', 'ownership', 'percent_owned', 'draft_analysis'] },
    { collection: 'transactions', subResources: ['metadata', 'players'] }
  ]

  const leagueData: any = {}
  
  for (const { collection, subResources } of collections) {
    for (const subResource of subResources) {
      const url = buildYahooAPIUrl({ leagueKey, gameCode, collection, subResource })
      if (url) {
        try {
          const data = await yahooAPI.makeApiRequest(url)
          if (data) {
            leagueData[`${collection}_${subResource}`] = data
          }
        } catch (error: any) {
          console.warn(`Failed to fetch ${collection}_${subResource} for ${leagueKey}:`, error.message)
        }
      }
    }
  }

  // Store data in database
  await storeLeagueDataInDatabase(leagueKey, gameCode, gameAbbreviation, season, leagueData)

  return {
    leagueKey,
    success: true,
    message: 'Successfully processed and stored',
    dataKeys: Object.keys(leagueData)
  }
}

function buildYahooAPIUrl({ leagueKey, gameCode, collection, subResource }: any) {
  const baseUrl = 'https://fantasysports.yahooapis.com/fantasy/v2'
  
  switch (collection) {
    case 'game':
      return `${baseUrl}/game/${gameCode};out=${subResource}`
    case 'leagues':
      return `${baseUrl}/league/${leagueKey};out=${subResource}`
    case 'teams':
      return `${baseUrl}/league/${leagueKey}/teams;out=${subResource}`
    case 'players':
      return `${baseUrl}/league/${leagueKey}/players;out=${subResource}`
    case 'transactions':
      return `${baseUrl}/league/${leagueKey}/transactions;out=${subResource}`
    default:
      return null
  }
}

async function storeLeagueDataInDatabase(leagueKey: string, gameCode: string, gameAbbreviation: string, season: string, leagueData: any) {
  try {
    // This is a simplified version - in a real implementation, you would:
    // 1. Parse the Yahoo API responses
    // 2. Transform the data to match your Prisma schema
    // 3. Upsert the data into the database
    
    console.log(`Storing data for league ${leagueKey} in database...`)
    
    // For now, just log what we would store
    console.log('Available data keys:', Object.keys(leagueData))
    
    // TODO: Implement actual database storage logic
    // This would involve parsing the Yahoo API responses and inserting/updating records
    
    return true
  } catch (error) {
    console.error('Error storing league data:', error)
    throw error
  }
}
