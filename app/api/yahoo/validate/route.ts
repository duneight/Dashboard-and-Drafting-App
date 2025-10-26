import { NextRequest, NextResponse } from 'next/server'
import { getYahooClient } from '@/lib/api/yahoo'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    logger.info('Validating Yahoo API credentials')
    
    const yahooClient = await getYahooClient()
    
    // Try to make a simple API call to validate credentials
    await yahooClient.getAllLeagueKeys()
    
    logger.info('Yahoo API credentials validation successful')
    
    return NextResponse.json({ 
      valid: true, 
      message: 'Yahoo API credentials are valid',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Yahoo API credentials validation failed', error as Error)
    
    return NextResponse.json({ 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 401 })
  }
}
