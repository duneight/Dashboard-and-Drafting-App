// NHL Fantasy Stat Categories Mapping
// Based on Yahoo Fantasy API stat_categories

export const NHL_STAT_CATEGORIES = {
  // Skater Stats
  GOALS: { id: 1, name: 'Goals', display: 'G', position: 'P' },
  ASSISTS: { id: 2, name: 'Assists', display: 'A', position: 'P' },
  POINTS: { id: 3, name: 'Points', display: 'P', position: 'P' },
  PLUS_MINUS: { id: 4, name: 'Plus/Minus', display: '+/-', position: 'P' },
  PENALTY_MINUTES: { id: 5, name: 'Penalty Minutes', display: 'PIM', position: 'P' },
  POWERPLAY_GOALS: { id: 6, name: 'Powerplay Goals', display: 'PPG', position: 'P' },
  POWERPLAY_ASSISTS: { id: 7, name: 'Powerplay Assists', display: 'PPA', position: 'P' },
  POWERPLAY_POINTS: { id: 8, name: 'Powerplay Points', display: 'PPP', position: 'P' },
  SHORTHANDED_GOALS: { id: 9, name: 'Shorthanded Goals', display: 'SHG', position: 'P' },
  SHORTHANDED_ASSISTS: { id: 10, name: 'Shorthanded Assists', display: 'SHA', position: 'P' },
  SHORTHANDED_POINTS: { id: 11, name: 'Shorthanded Points', display: 'SHP', position: 'P' },
  GAME_WINNING_GOALS: { id: 12, name: 'Game-Winning Goals', display: 'GWG', position: 'P' },
  GAME_TYING_GOALS: { id: 13, name: 'Game-Tying Goals', display: 'GTG', position: 'P' },
  SHOTS_ON_GOAL: { id: 14, name: 'Shots on Goal', display: 'SOG', position: 'P' },
  SHOOTING_PERCENTAGE: { id: 15, name: 'Shooting Percentage', display: 'SH%', position: 'P' },
  FACEOFFS_WON: { id: 16, name: 'Faceoffs Won', display: 'FW', position: 'P' },
  FACEOFFS_LOST: { id: 17, name: 'Faceoffs Lost', display: 'FL', position: 'P' },
  HITS: { id: 31, name: 'Hits', display: 'HIT', position: 'P' },
  BLOCKS: { id: 32, name: 'Blocks', display: 'BLK', position: 'P' },
  TIME_ON_ICE: { id: 33, name: 'Time on Ice', display: 'TOI', position: 'P' },
  AVERAGE_TIME_ON_ICE: { id: 34, name: 'Average Time on Ice', display: 'TOI/G', position: 'P' },

  // Goalie Stats
  GAMES_STARTED: { id: 18, name: 'Games Started', display: 'GS', position: 'G' },
  WINS: { id: 19, name: 'Wins', display: 'W', position: 'G' },
  LOSSES: { id: 20, name: 'Losses', display: 'L', position: 'G' },
  TIES: { id: 21, name: 'Ties', display: 'T', position: 'G' },
  GOALS_AGAINST: { id: 22, name: 'Goals Against', display: 'GA', position: 'G' },
  GOALS_AGAINST_AVERAGE: { id: 23, name: 'Goals Against Average', display: 'GAA', position: 'G' },
  SHOTS_AGAINST: { id: 24, name: 'Shots Against', display: 'SA', position: 'G' },
  SAVES: { id: 25, name: 'Saves', display: 'SV', position: 'G' },
  SAVE_PERCENTAGE: { id: 26, name: 'Save Percentage', display: 'SV%', position: 'G' },
  SHUTOUTS: { id: 27, name: 'Shutouts', display: 'SHO', position: 'G' },
  GOALIE_TIME_ON_ICE: { id: 28, name: 'Time on Ice', display: 'TOI', position: 'G' },

  // Games Played (both positions)
  GAMES_PLAYED: { id: 0, name: 'Games Played', display: 'GP', position: 'P,G' },
  F_D_GAMES: { id: 29, name: 'F/D Games', display: 'GP', position: 'P' },
  GOALIE_GAMES: { id: 30, name: 'Goalie Games', display: 'GP', position: 'G' },
} as const

// Hall of Fame Categories - Data-Driven Categories
export const HALL_OF_FAME_CATEGORIES = [
  // All-Time Achievements
  {
    id: 'dynasty-king',
    name: 'Dynasty King',
    description: 'Most championships',
    type: 'all-time',
    statType: 'championships',
  },
  {
    id: 'point-titan',
    name: 'Point Titan',
    description: 'Most total fantasy points all-time',
    type: 'all-time',
    statType: 'totalPoints',
  },
  {
    id: 'the-consistent',
    name: 'Mr. Consistent',
    description: 'Best win percentage',
    type: 'all-time',
    statType: 'winPercentage',
  },
  {
    id: 'playoff-warrior',
    name: 'Playoff Warrior',
    description: 'Most playoff wins all-time',
    type: 'all-time',
    statType: 'playoffWins',
  },
  {
    id: 'goal-machine',
    name: 'Goal Machine',
    description: 'Most goals scored all-time',
    type: 'all-time',
    statType: 'totalGoals',
    statId: NHL_STAT_CATEGORIES.GOALS.id,
  },
  {
    id: 'iron-wall',
    name: 'Iron Wall',
    description: 'Most goalie wins all-time',
    type: 'all-time',
    statType: 'totalGoalieWins',
    statId: NHL_STAT_CATEGORIES.WINS.id,
  },
  {
    id: 'shutout-king',
    name: 'Shutout King',
    description: 'Most shutouts all-time',
    type: 'all-time',
    statType: 'totalShutouts',
    statId: NHL_STAT_CATEGORIES.SHUTOUTS.id,
  },
  {
    id: 'the-playmaker',
    name: 'The Playmaker',
    description: 'Most assists all-time',
    type: 'all-time',
    statType: 'totalAssists',
    statId: NHL_STAT_CATEGORIES.ASSISTS.id,
  },
  // Single-Season Records
  {
    id: 'season-dominator',
    name: 'Season Dominator',
    description: 'Best single-season record + points',
    type: 'single-season',
    statType: 'seasonRecord',
  },
  {
    id: 'weekly-explosion',
    name: 'Weekly Explosion',
    description: 'Highest single-week score ever',
    type: 'single-season',
    statType: 'weeklyPoints',
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Longest win streak',
    type: 'single-season',
    statType: 'winStreak',
  },
  {
    id: 'close-game-specialist',
    name: 'Close Game Specialist',
    description: 'Best win percentage in close games (<10 point margin)',
    type: 'all-time',
    statType: 'closeGamePerformance',
  },
] as const

// Legacy exports for backward compatibility
export const HALL_OF_FAME_AGGREGATE_CATEGORIES = HALL_OF_FAME_CATEGORIES.filter(c => c.type === 'all-time')
export const HALL_OF_FAME_SINGLE_SEASON_CATEGORIES = HALL_OF_FAME_CATEGORIES.filter(c => c.type === 'single-season')

// Wall of Shame Categories - Data-Driven Categories
export const WALL_OF_SHAME_CATEGORIES = [
  // All-Time Disappointments
  {
    id: 'close-but-no-cigar',
    name: 'Close but No Cigar',
    description: 'Most 2nd/3rd place finishes with no championships',
    type: 'all-time',
    statType: 'nearMisses',
  },
  {
    id: 'eternal-last',
    name: 'Eternal Last',
    description: 'Worst average season finish',
    type: 'all-time',
    statType: 'averageRanking',
  },
  {
    id: 'playoff-choker',
    name: 'Playoff Choker',
    description: 'Most playoff losses without a championship',
    type: 'all-time',
    statType: 'playoffLosses',
  },
  // Single-Season Disasters
  {
    id: 'rock-bottom',
    name: 'Rock Bottom',
    description: 'Worst single-season record',
    type: 'single-season',
    statType: 'seasonRecord',
  },
  {
    id: 'the-collapse',
    name: 'Mr. Collapse',
    description: 'Longest losing streak',
    type: 'single-season',
    statType: 'lossStreak',
  },
  {
    id: 'brick-hands',
    name: 'Brick Hands',
    description: 'Most points against in one season',
    type: 'single-season',
    statType: 'pointsAgainst',
  },
  {
    id: 'the-heartbreak',
    name: 'The Heartbreak',
    description: 'Most losses by less than 5 points',
    type: 'all-time',
    statType: 'closeLosses',
  },
  {
    id: 'glass-cannon',
    name: 'Glass Cannon',
    description: 'High points + bad rank (single season)',
    type: 'single-season',
    statType: 'glassCannonSeason',
  },
  {
    id: 'the-snooze',
    name: 'The Snooze',
    description: 'Lowest weekly score ever',
    type: 'single-season',
    statType: 'lowestWeeklyScore',
  },
] as const

// Legacy exports for backward compatibility
export const WALL_OF_SHAME_AGGREGATE_CATEGORIES = WALL_OF_SHAME_CATEGORIES.filter(c => c.type === 'all-time')
export const WALL_OF_SHAME_SINGLE_SEASON_CATEGORIES = WALL_OF_SHAME_CATEGORIES.filter(c => c.type === 'single-season')

// Game codes for different sports
export const GAME_CODES = {
  NHL: 419,
  NFL: 414,
  NBA: 418,
  MLB: 404,
} as const

// Position types
export const POSITION_TYPES = {
  PLAYER: 'P',
  GOALIE: 'G',
} as const

// Keeper League Configuration
export const KEEPER_LEAGUE_ID = '16794' // League ID portion
export const KEEPER_LEAGUE_PREFIX = 'l.16794' // Match across seasons
export const KEEPER_LEAGUE_START_YEAR = 2015 // Update to your league's first season

// Dynamically generate seasons from start year to current year + 1 (for ongoing season)
export function getSeasonsTotSync(): string[] {
  const currentYear = new Date().getFullYear()
  const seasons: string[] = []
  
  // Start from next year (ongoing season) down to league start year
  for (let year = currentYear + 1; year >= KEEPER_LEAGUE_START_YEAR; year--) {
    seasons.push(String(year))
  }
  
  return seasons
}

// Test function for specific seasons only
export function getTestSeasons(): string[] {
  return ['2024', '2022'] // Only these two seasons for testing
}

// Yahoo API Configuration
export const TEST_LEAGUE_KEY = process.env.YAHOO_TEST_LEAGUE_KEY || '427.l.16794'
export const SEASONS_TO_SYNC = getSeasonsTotSync() // Dynamic seasons: ['2026', '2025', '2024', ..., '2015']
export const CACHE_DURATION_HOURS = 168 // How long to cache league data before re-fetching (1 week for weekly cron)

// Yahoo API endpoints
export const YAHOO_API = {
  BASE_URL: 'https://fantasysports.yahooapis.com/fantasy/v2',
  AUTH_ENDPOINT: 'https://api.login.yahoo.com/oauth2/get_token'
}
