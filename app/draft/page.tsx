'use client'

import { DraftProvider } from './components/DraftProvider'
import { DraftBoard } from './components/DraftBoard'
import { BestAvailable } from './components/BestAvailable'
import { PositionAnalysis } from './components/PositionAnalysis'
import { TeamRosters } from './components/TeamRosters'
import { Keepers } from './components/Keepers'
import { PickSwaps } from './components/PickSwaps'
import { FloatingActionBar } from './components/FloatingActionBar'
import { TabNavigation } from '@/app/components/ui/TabNavigation'
import { useDraft } from './components/DraftProvider'
import { useEffect } from 'react'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'
import { useDraftNavbar } from '@/app/components/DraftNavbarProvider'

function DraftContent() {
  const { currentTab, undo, redo, switchTab, draftState, resetDraft } = useDraft()
  const { setDraftProgress, setOnReset } = useDraftNavbar()

  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z (undo) or Ctrl+Y (redo)
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        undo()
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // Update navbar with draft progress
  useEffect(() => {
    const picks = draftState.picks.filter(p => p.playerName).length
    const total = LEAGUE_SETTINGS.numRounds * LEAGUE_SETTINGS.teams
    const percentage = draftState.draftProgress

    setDraftProgress({ picks, total, percentage })
    
    const handleReset = () => {
      if (confirm('Are you sure you want to reset the entire draft board? This action cannot be undone.')) {
        resetDraft()
      }
    }
    
    setOnReset(() => handleReset)

    // Cleanup on unmount
    return () => {
      setDraftProgress(null)
      setOnReset(null)
    }
  }, [draftState, setDraftProgress, setOnReset, resetDraft])

  const tabs = [
    { id: 'draft-board', label: 'Draft Board', icon: '📋' },
    { id: 'best-available', label: 'Best Available', icon: '🏆' },
    { id: 'position-analysis', label: 'Position Analysis', icon: '📊' },
    { id: 'team-rosters', label: 'Team Rosters', icon: '👥' },
    { id: 'keepers', label: 'Keepers', icon: '🔒' },
    { id: 'pick-swaps', label: 'Trade Tracker', icon: '🔄' }
  ]

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      {/* Tab Navigation */}
      <TabNavigation tabs={tabs} activeTab={currentTab} onTabChange={(tabId) => switchTab(tabId as any)} />

      {/* Tab Content */}
      <div className="mt-8">
        {currentTab === 'draft-board' && <DraftBoard />}
        {currentTab === 'best-available' && <BestAvailable />}
        {currentTab === 'position-analysis' && <PositionAnalysis />}
        {currentTab === 'team-rosters' && <TeamRosters />}
        {currentTab === 'keepers' && <Keepers />}
        {currentTab === 'pick-swaps' && <PickSwaps />}
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar />
    </div>
  )
}

export default function DraftPage() {
  return (
    <DraftProvider>
      <DraftContent />
    </DraftProvider>
  )
}
