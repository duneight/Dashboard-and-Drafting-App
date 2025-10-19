// TypeScript type definitions for Yahoo Fantasy Sports API responses

export interface YahooCredentials {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface YahooError {
  error: {
    lang: string
    description: string
    detail: string
  }
}

export interface YahooLeague {
  league_key: string
  league_id: string
  name: string
  url?: string
  logo_url?: string
  password?: string
  draft_status: string
  num_teams: number
  edit_key?: string
  weekly_deadline?: string
  league_update_timestamp?: string
  scoring_type?: string
  league_type?: string
  renew?: string
  renewed?: string
  iris_group_chat_id?: string
  allow_add_to_dl_extra_pos?: number
  is_pro_league?: boolean
  is_cash_league?: boolean
  current_matchup_period?: number
  is_finished?: boolean
  is_api_football?: boolean
  api_selections?: string
  season: string
}

export interface YahooTeam {
  team_key: string
  team_id: string
  name: string
  is_owned_by_current_login?: boolean
  url?: string
  team_logos?: Array<{
    size: string
    url: string
  }>
  waiver_priority?: number
  number_of_moves?: number
  number_of_trades?: number
  clinched_playoffs?: boolean
  league_scoring_type?: string
  managers?: Array<{
    manager_id: string
    nickname?: string
    guid?: string
    email?: string
    image_url?: string
    is_commissioner?: boolean
    is_current_login?: boolean
  }>
  team_stats?: {
    coverage_type: string
    season: string
    stats: Array<{
      stat_id: string
      value: string
    }>
  }
  team_standings?: {
    rank: number
    outcome_totals: {
      wins: number
      losses: number
      ties: number
      percentage: number
    }
    points_for: number
    points_against: number
  }
}

export interface YahooPlayer {
  player_key: string
  player_id: string
  name: {
    full: string
    first: string
    last: string
    ascii_first: string
    ascii_last: string
  }
  editorial_team_key?: string
  editorial_team_full_name?: string
  editorial_team_abbr?: string
  uniform_number?: string
  display_position?: string
  headshot?: {
    url: string
    size: string
  }
  image_url?: string
  is_undroppable?: boolean
  position_type?: string
  primary_position?: string
  eligible_positions?: Array<{
    position: string
  }>
  has_player_notes?: boolean
  has_recent_player_notes?: boolean
  status?: string
  status_full?: string
  injury_note?: string
  on_disabled_list?: boolean
}

export interface YahooMatchup {
  matchup_id: number
  week: number
  status?: string
  is_playoffs?: boolean
  is_consolation?: boolean
  is_tied?: boolean
  winner_team_key?: string
  teams: Array<{
    team_key: string
    team_id: string
    name: string
    url?: string
    team_logos?: Array<{
      size: string
      url: string
    }>
    waiver_priority?: number
    number_of_moves?: number
    number_of_trades?: number
    clinched_playoffs?: boolean
    league_scoring_type?: string
    managers?: Array<{
      manager_id: string
      nickname?: string
      guid?: string
      email?: string
      image_url?: string
      is_commissioner?: boolean
      is_current_login?: boolean
    }>
    team_stats?: {
      coverage_type: string
      season: string
      stats: Array<{
        stat_id: string
        value: string
      }>
    }
    team_standings?: {
      rank: number
      outcome_totals: {
        wins: number
        losses: number
        ties: number
        percentage: number
      }
      points_for: number
      points_against: number
    }
  }>
}

export interface YahooStatCategory {
  stat_id: number
  name: string
  display_name: string
  sort_order: number
  position_type?: string
  is_reversed?: boolean
  is_only_display_stat?: boolean
  is_excluded_from_display?: boolean
}

export interface YahooRosterPosition {
  position: string
  position_type: string
  abbreviation?: string
  display_name?: string
  is_bench?: boolean
}

export interface YahooTransaction {
  transaction_key: string
  transaction_id: string
  type: string
  status?: string
  timestamp?: string
}

export interface YahooDraftResult {
  pick: number
  round: number
  team_key: string
  player_key?: string
  player_name?: string
  position?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SyncResponse {
  leaguesProcessed: number
  teamsProcessed: number
  matchupsProcessed: number
  weeklyStatsProcessed: number
  errors: string[]
}

// Analytics types
export interface HallOfFameEntry {
  teamKey: string
  teamName: string
  managerNickname?: string
  value: number
  description: string
  season?: string
  leagueName?: string
}

export interface WallOfShameEntry {
  teamKey: string
  teamName: string
  managerNickname?: string
  value: number
  description: string
  season?: string
  leagueName?: string
}

// Database model types (matching Prisma schema)
export interface Game {
  id: string
  gameKey: string
  gameId: number
  name: string
  code: string
  type: string
  url?: string
  season: string
  isGameOver: boolean
  isRegistrationOver: boolean
  isPlayoffsOver: boolean
  isOffseason: boolean
  createdAt: Date
  updatedAt: Date
}

export interface League {
  id: string
  leagueKey: string
  leagueId: number
  name: string
  url?: string
  logoUrl?: string
  password?: string
  draftStatus: string
  numTeams: number
  editKey?: string
  weeklyDeadline?: string
  leagueUpdateTimestamp?: string
  scoringType?: string
  leagueType?: string
  renew?: string
  renewed?: string
  irisGroupChatId?: string
  allowAddToDlExtraPos?: number
  isProLeague: boolean
  isCashLeague: boolean
  currentMatchupPeriod?: number
  isFinished: boolean
  isApiFootball: boolean
  apiSelections?: string
  gameId: string
  season: string
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  teamKey: string
  teamId: number
  name: string
  isOwnedByCurrentLogin: boolean
  url?: string
  teamLogos?: string
  waiverPriority?: number
  numberOfMoves?: number
  numberOfTrades?: number
  clinchedPlayoffs: boolean
  leagueScoringType?: string
  managers?: string
  managerNickname?: string
  managerGuid?: string
  managerEmail?: string
  managerImageUrl?: string
  managerIsCommissioner: boolean
  managerIsCurrentLogin: boolean
  wins: number
  losses: number
  ties: number
  percentage: number
  pointsFor: number
  pointsAgainst: number
  rank?: number
  isFinished: boolean
  leagueId: string
  season: string
  createdAt: Date
  updatedAt: Date
}

export interface Matchup {
  id: string
  matchupId: number
  week: number
  status?: string
  isPlayoffs: boolean
  isConsolation: boolean
  isTied: boolean
  winnerTeamKey?: string
  leagueId: string
  season: string
  team1Key: string
  team2Key: string
  team1Points?: number
  team2Points?: number
  createdAt: Date
  updatedAt: Date
}

export interface WeeklyStat {
  id: string
  teamKey: string
  week: number
  season: string
  points: number
  projectedPoints?: number
  isPlayoffs: boolean
  isConsolation: boolean
  createdAt: Date
  updatedAt: Date
}