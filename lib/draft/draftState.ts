// Draft state management with database sync and localStorage backup

import { DraftState, DraftPick, Player } from '@/types/draft'
import { LEAGUE_SETTINGS, initialPrefilledData } from './leagueSettings'
import { findPlayerByName } from './playerRankings'

const STORAGE_KEY = 'fantasyDraft_2025'

export class DraftStateManager {
  private state: DraftState
  private autoSaveTimeout: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_MS = 500

  constructor() {
    this.state = {
      picks: [],
      selectedPlayers: new Set(),
      currentPick: 1,
      draftProgress: 0
    }
  }

  // Load draft state from localStorage (fallback)
  loadFromStorage(): DraftState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          selectedPlayers: new Set(parsed.selectedPlayers || [])
        }
      }
    } catch (error) {
      console.error('Failed to load draft state from localStorage:', error)
    }
    return this.getInitialState()
  }

  // Save draft state to localStorage (backup)
  saveToStorage(state: DraftState): void {
    try {
      const toStore = {
        ...state,
        selectedPlayers: Array.from(state.selectedPlayers)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch (error) {
      console.error('Failed to save draft state to localStorage:', error)
    }
  }

  // Get initial state with prefilled data
  private getInitialState(): DraftState {
    const picks: DraftPick[] = []
    const selectedPlayers = new Set<string>()

    // Convert prefilled data to picks
    for (let round = 1; round <= LEAGUE_SETTINGS.numRounds; round++) {
      for (let teamIndex = 0; teamIndex < LEAGUE_SETTINGS.teams; teamIndex++) {
        const pickNumber = (round - 1) * LEAGUE_SETTINGS.teams + teamIndex + 1
        const teamName = LEAGUE_SETTINGS.owners[teamIndex]
        
        // Check if this pick is prefilled
        const prefilledPlayer = this.getPrefilledPlayer(round, teamIndex)
        
        if (prefilledPlayer) {
          picks.push({
            pick: pickNumber,
            round,
            teamIndex,
            teamName,
            playerName: prefilledPlayer.name,
            playerRank: prefilledPlayer.rank,
            playerTeam: prefilledPlayer.team,
            playerPosition: prefilledPlayer.pos,
            averagePick: prefilledPlayer.avg,
            pickedAt: new Date()
          })
          selectedPlayers.add(prefilledPlayer.name)
        } else {
          picks.push({
            pick: pickNumber,
            round,
            teamIndex,
            teamName
          })
        }
      }
    }

    return {
      picks,
      selectedPlayers,
      currentPick: this.getCurrentPickNumber(picks),
      draftProgress: this.calculateProgress(picks)
    }
  }

  // Get prefilled player for a specific round and team
  private getPrefilledPlayer(round: number, teamIndex: number): Player | null {
    const prefilledName = initialPrefilledData[round]?.[teamIndex]
    if (prefilledName && prefilledName.trim()) {
      return findPlayerByName(prefilledName) || null
    }
    return null
  }

  // Make a draft pick
  makePick(round: number, teamIndex: number, player: Player): DraftState {
    const pickNumber = (round - 1) * LEAGUE_SETTINGS.teams + teamIndex + 1
    
    // Find the pick to update
    const pickIndex = this.state.picks.findIndex(p => p.pick === pickNumber)
    
    if (pickIndex === -1) {
      throw new Error(`Pick ${pickNumber} not found`)
    }

    // Update the pick
    const updatedPick: DraftPick = {
      ...this.state.picks[pickIndex],
      playerName: player.name,
      playerRank: player.rank,
      playerTeam: player.team,
      playerPosition: player.pos,
      averagePick: player.avg,
      pickedAt: new Date()
    }

    // Create new state
    const newPicks = [...this.state.picks]
    newPicks[pickIndex] = updatedPick
    
    const newSelectedPlayers = new Set(this.state.selectedPlayers)
    newSelectedPlayers.add(player.name)

    const newState: DraftState = {
      picks: newPicks,
      selectedPlayers: newSelectedPlayers,
      currentPick: this.getCurrentPickNumber(newPicks),
      draftProgress: this.calculateProgress(newPicks)
    }

    this.state = newState
    this.debouncedSave()
    
    return newState
  }

  // Clear a pick
  clearPick(round: number, teamIndex: number): DraftState {
    const pickNumber = (round - 1) * LEAGUE_SETTINGS.teams + teamIndex + 1
    const pickIndex = this.state.picks.findIndex(p => p.pick === pickNumber)
    
    if (pickIndex === -1) {
      throw new Error(`Pick ${pickNumber} not found`)
    }

    const pickToClear = this.state.picks[pickIndex]
    
    // Create new state
    const newPicks = [...this.state.picks]
    newPicks[pickIndex] = {
      pick: pickNumber,
      round,
      teamIndex,
      teamName: pickToClear.teamName
    }
    
    const newSelectedPlayers = new Set(this.state.selectedPlayers)
    if (pickToClear.playerName) {
      newSelectedPlayers.delete(pickToClear.playerName)
    }

    const newState: DraftState = {
      picks: newPicks,
      selectedPlayers: newSelectedPlayers,
      currentPick: this.getCurrentPickNumber(newPicks),
      draftProgress: this.calculateProgress(newPicks)
    }

    this.state = newState
    this.debouncedSave()
    
    return newState
  }

  // Get current pick number
  getCurrentPickNumber(picks: DraftPick[]): number {
    const emptyPick = picks.find(p => !p.playerName)
    return emptyPick ? emptyPick.pick : picks.length + 1
  }

  // Calculate draft progress percentage
  calculateProgress(picks: DraftPick[]): number {
    const totalPicks = LEAGUE_SETTINGS.numRounds * LEAGUE_SETTINGS.teams
    const completedPicks = picks.filter(p => p.playerName).length
    return Math.round((completedPicks / totalPicks) * 100)
  }

  // Debounced save to prevent excessive API calls
  private debouncedSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout)
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveToStorage(this.state)
      // TODO: Also save to database via API
    }, this.DEBOUNCE_MS)
  }

  // Get current state
  getState(): DraftState {
    return this.state
  }

  // Set state (for undo/redo)
  setState(state: DraftState): void {
    this.state = state
    this.debouncedSave()
  }

  // Reset draft
  resetDraft(): DraftState {
    this.state = this.getInitialState()
    this.saveToStorage(this.state)
    return this.state
  }

  // Export draft data
  exportDraft(): string {
    const exportData = {
      settings: LEAGUE_SETTINGS,
      picks: this.state.picks.filter(p => p.playerName),
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(exportData, null, 2)
  }

  // Export to CSV
  exportToCSV(): string {
    const headers = ['Pick', 'Round', 'Team', 'Player', 'Rank', 'Team', 'Position', 'Avg Pick']
    const rows = this.state.picks
      .filter(p => p.playerName)
      .map(p => [
        p.pick,
        p.round,
        p.teamName,
        p.playerName,
        p.playerRank,
        p.playerTeam,
        p.playerPosition,
        p.averagePick
      ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    return csvContent
  }
}
