'use client'

import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react'
import { DraftContextType, TabType, DraftState } from '@/types/draft'
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
  const stateManagerRef = useRef(new DraftStateManager())
  const historyRef = useRef(new DraftHistory())
  const stateManager = stateManagerRef.current
  const history = historyRef.current

  const [currentTab, setCurrentTab] = useState<TabType>('draft-board')
  const [isLoading, setIsLoading] = useState(true)
  // Track draft state in React state for proper reactivity
  const [draftState, setDraftState] = useState<DraftState>(() => stateManager.getState())

  // Helper to sync React state with manager state
  const syncState = useCallback(() => {
    setDraftState(stateManager.getState())
  }, [stateManager])

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

        // Sync to React state
        syncState()
      } catch (error) {
        console.error('Failed to load draft state:', error)
        // Fallback to localStorage
        const localState = stateManager.loadFromStorage()
        stateManager.setState(localState)
        syncState()
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialState()
  }, [stateManager, history, syncState])

  // Memoized computed values - only recalculate when draftState changes
  const availablePlayers = useMemo(
    () => playerRankings.filter(p => !draftState.selectedPlayers.has(p.name)),
    [draftState.selectedPlayers]
  )

  const analytics = useMemo(
    () => new DraftAnalytics(draftState.picks, draftState.selectedPlayers, availablePlayers),
    [draftState.picks, draftState.selectedPlayers, availablePlayers]
  )

  const positionBalances = useMemo(
    () => analytics.analyzePositionBalance(),
    [analytics]
  )

  const draftPrompts = useMemo(
    () => analytics.generateDraftPrompts(),
    [analytics]
  )

  // Memoized actions - stable references
  const makePick = useCallback((round: number, teamIndex: number, player: any) => {
    const newState = stateManager.makePick(round, teamIndex, player)
    history.saveSnapshot(newState.picks, newState.selectedPlayers, `Picked ${player.name}`)
    setDraftState(newState)
  }, [stateManager, history])

  const clearPick = useCallback((round: number, teamIndex: number) => {
    const newState = stateManager.clearPick(round, teamIndex)
    history.saveSnapshot(newState.picks, newState.selectedPlayers, `Cleared pick`)
    setDraftState(newState)
  }, [stateManager, history])

  const undo = useCallback(() => {
    const snapshot = history.undo()
    if (snapshot) {
      const { picks, selectedPlayers } = DraftHistory.snapshotToDraftState(snapshot)
      const tempManager = new DraftStateManager()
      const newState = {
        picks,
        selectedPlayers,
        currentPick: tempManager.getCurrentPickNumber(picks),
        draftProgress: tempManager.calculateProgress(picks)
      }
      stateManager.setState(newState)
      setDraftState(newState)
    }
  }, [stateManager, history])

  const redo = useCallback(() => {
    const snapshot = history.redo()
    if (snapshot) {
      const { picks, selectedPlayers } = DraftHistory.snapshotToDraftState(snapshot)
      const tempManager = new DraftStateManager()
      const newState = {
        picks,
        selectedPlayers,
        currentPick: tempManager.getCurrentPickNumber(picks),
        draftProgress: tempManager.calculateProgress(picks)
      }
      stateManager.setState(newState)
      setDraftState(newState)
    }
  }, [stateManager, history])

  const resetDraft = useCallback(() => {
    const newState = stateManager.resetDraft()
    history.clearHistory()
    history.createInitialSnapshot(newState.picks, newState.selectedPlayers)
    setDraftState(newState)
  }, [stateManager, history])

  const exportDraft = useCallback(() => {
    const csvData = stateManager.exportToCSV()
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'draft-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [stateManager])

  // Memoized history state
  const historyState = useMemo(() => history.getHistory(), [history, draftState])
  const historyIndex = useMemo(() => {
    const current = history.getCurrentState()
    return current ? historyState.findIndex(s => s.id === current.id) : -1
  }, [history, historyState, draftState])
  const canUndo = useMemo(() => history.canUndo(), [history, draftState])
  const canRedo = useMemo(() => history.canRedo(), [history, draftState])

  // Memoized context value - only changes when dependencies change
  const contextValue = useMemo<DraftContextType>(() => ({
    // State
    draftState,
    currentTab,
    history: historyState,
    historyIndex,
    // Actions
    makePick,
    clearPick,
    undo,
    redo,
    resetDraft,
    exportDraft,
    switchTab: setCurrentTab,
    // Computed values
    availablePlayers,
    positionBalances,
    draftPrompts,
    canUndo,
    canRedo
  }), [
    draftState,
    currentTab,
    historyState,
    historyIndex,
    makePick,
    clearPick,
    undo,
    redo,
    resetDraft,
    exportDraft,
    availablePlayers,
    positionBalances,
    draftPrompts,
    canUndo,
    canRedo
  ])

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

