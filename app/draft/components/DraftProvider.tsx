'use client'

import React, { useState, useEffect, useCallback, useContext } from 'react'
import { DraftContextType, TabType } from '@/types/draft'
import { DraftStateManager } from '@/lib/draft/draftState'
import { DraftAnalytics } from '@/lib/draft/draftAnalytics'
import { DraftHistory } from '@/lib/draft/draftHistory'
import { playerRankings } from '@/lib/draft/playerRankings'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

// Create context
const DraftContext = React.createContext<DraftContextType | null>(null)

export const useDraft = () => {
  const context = useContext(DraftContext)
  if (!context) {
    throw new Error('useDraft must be used within a DraftProvider')
  }
  return context
}

interface DraftProviderProps {
  children: React.ReactNode
}

export function DraftProvider({ children }: DraftProviderProps) {
  const [stateManager] = useState(() => new DraftStateManager())
  const [history] = useState(() => new DraftHistory())
  const [currentTab, setCurrentTab] = useState<TabType>('draft-board')
  const [isLoading, setIsLoading] = useState(true)
  const [, forceUpdate] = useState({})

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Try to load from database first
        const response = await fetch('/api/draft/load')
        const data = await response.json()
        
        if (data.success && data.data.picks.length > 0) {
          // Load from database
          const { picks, selectedPlayers } = data.data
          const tempManager = new DraftStateManager()
          stateManager.setState({
            picks,
            selectedPlayers: new Set(selectedPlayers),
            currentPick: tempManager.getCurrentPickNumber(picks),
            draftProgress: tempManager.calculateProgress(picks)
          })
        } else {
          // Load from localStorage
          const localState = stateManager.loadFromStorage()
          stateManager.setState(localState)
        }

        // Initialize history
        const currentState = stateManager.getState()
        history.createInitialSnapshot(currentState.picks, currentState.selectedPlayers)
        
      } catch (error) {
        console.error('Failed to load draft state:', error)
        // Fallback to localStorage
        const localState = stateManager.loadFromStorage()
        stateManager.setState(localState)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialState()
  }, [])

  // Get current state and analytics
  const currentState = stateManager.getState()
  const analytics = new DraftAnalytics(
    currentState.picks,
    currentState.selectedPlayers,
    playerRankings.filter(p => !currentState.selectedPlayers.has(p.name))
  )

  // Context value
  const contextValue: DraftContextType = {
    // State
    draftState: currentState,
    currentTab,
    history: history.getHistory(),
    historyIndex: history.getCurrentState() ? history.getHistory().findIndex(s => s.id === history.getCurrentState()!.id) : -1,
    
  // Actions
  makePick: useCallback((round: number, teamIndex: number, player: any) => {
    const newState = stateManager.makePick(round, teamIndex, player)
    history.saveSnapshot(newState.picks, newState.selectedPlayers, `Picked ${player.name}`)
    forceUpdate({}) // CRITICAL: Force React to re-render
  }, [stateManager, history, forceUpdate]),
  
  clearPick: useCallback((round: number, teamIndex: number) => {
    const newState = stateManager.clearPick(round, teamIndex)
    history.saveSnapshot(newState.picks, newState.selectedPlayers, `Cleared pick`)
    forceUpdate({}) // CRITICAL: Force React to re-render
  }, [stateManager, history, forceUpdate]),
  
    undo: useCallback(() => {
      const snapshot = history.undo()
      if (snapshot) {
        const { picks, selectedPlayers } = DraftHistory.snapshotToDraftState(snapshot)
        const tempManager = new DraftStateManager()
        stateManager.setState({
          picks,
          selectedPlayers,
          currentPick: tempManager.getCurrentPickNumber(picks),
          draftProgress: tempManager.calculateProgress(picks)
        })
        forceUpdate({}) // CRITICAL: Force React to re-render
      }
    }, [stateManager, history, forceUpdate]),
    
    redo: useCallback(() => {
      const snapshot = history.redo()
      if (snapshot) {
        const { picks, selectedPlayers } = DraftHistory.snapshotToDraftState(snapshot)
        const tempManager = new DraftStateManager()
        stateManager.setState({
          picks,
          selectedPlayers,
          currentPick: tempManager.getCurrentPickNumber(picks),
          draftProgress: tempManager.calculateProgress(picks)
        })
        forceUpdate({}) // CRITICAL: Force React to re-render
      }
    }, [stateManager, history, forceUpdate]),
    
    resetDraft: useCallback(() => {
      const newState = stateManager.resetDraft()
      history.clearHistory()
      history.createInitialSnapshot(newState.picks, newState.selectedPlayers)
      forceUpdate({}) // CRITICAL: Force React to re-render
    }, [stateManager, history, forceUpdate]),
    
    exportDraft: useCallback(() => {
      const csvData = stateManager.exportToCSV()
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'draft-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    }, [stateManager]),
    
    switchTab: setCurrentTab,
    
    // Computed values
    availablePlayers: playerRankings.filter(p => !currentState.selectedPlayers.has(p.name)),
    positionBalances: analytics.analyzePositionBalance(),
    draftPrompts: analytics.generateDraftPrompts(),
    canUndo: history.canUndo(),
    canRedo: history.canRedo()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading draft board...</p>
        </div>
      </div>
    )
  }

  return (
    <DraftContext.Provider value={contextValue}>
      {children}
    </DraftContext.Provider>
  )
}

