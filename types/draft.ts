// TypeScript interfaces for the draft application

export interface Player {
  rank: number
  name: string
  team: string
  pos: string
  avg: number
}

export interface LeagueSettings {
  type: string
  teams: number
  owners: string[]
  numRounds: number
  rosterPositions: {
    centers: number
    leftWings: number
    rightWings: number
    defensemen: number
    goalies: number
    bench: number
    irPlus: number
    na: number
  }
  pointStructure: {
    offensive: {
      goals: number
      assists: number
      plusMinus: number
      powerplayGoals: number
      powerplayAssists: number
      gameWinningGoals: number
      shotsOnGoal: number
    }
    goaltending: {
      wins: number
      goalsAgainst: number
      saves: number
      shutouts: number
    }
  }
}

export interface DraftPick {
  pick: number
  round: number
  teamIndex: number
  teamName: string
  playerName?: string
  playerRank?: number
  playerTeam?: string
  playerPosition?: string
  averagePick?: number
  pickedAt?: Date
}

export interface DraftState {
  picks: DraftPick[]
  selectedPlayers: Set<string>
  currentPick: number
  draftProgress: number
  pickSwaps?: PickSwap[]
}

export interface PositionBalance {
  C: number
  LW: number
  RW: number
  D: number
  G: number
  total: number
}

export interface TeamBalance {
  [teamName: string]: PositionBalance
}

export interface DraftPrompt {
  icon: string
  title: string
  description: string
  count: number
  action: () => void
}

export interface PickSwap {
  round: number
  teamIndex: number
  swappedToTeamIndex: number
}

export interface DraftSnapshot {
  id: string
  picks: DraftPick[]
  selectedPlayers: string[]
  timestamp: Date
  description?: string
}

export interface DraftSession {
  id: string
  year: string
  status: 'active' | 'completed' | 'paused'
  settings: LeagueSettings
  createdAt: Date
  updatedAt: Date
}

export type TabType = 'draft-board' | 'best-available' | 'position-analysis' | 'team-rosters' | 'keepers' | 'pick-swaps'

export interface DraftContextType {
  // State
  draftState: DraftState
  currentTab: TabType
  history: DraftSnapshot[]
  historyIndex: number
  
  // Actions
  makePick: (round: number, teamIndex: number, player: Player) => void
  clearPick: (round: number, teamIndex: number) => void
  undo: () => void
  redo: () => void
  resetDraft: () => void
  exportDraft: () => void
  switchTab: (tab: TabType) => void
  
  // Computed values
  availablePlayers: Player[]
  positionBalances: TeamBalance
  draftPrompts: DraftPrompt[]
  canUndo: boolean
  canRedo: boolean
}
