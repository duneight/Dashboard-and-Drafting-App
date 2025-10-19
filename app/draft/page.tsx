'use client'

import { DraftProvider } from './components/DraftProvider'
import { DraftHeader } from './components/DraftHeader'
import { DraftBoard } from './components/DraftBoard'
import { BestAvailable } from './components/BestAvailable'
import { PositionAnalysis } from './components/PositionAnalysis'
import { TeamRosters } from './components/TeamRosters'
import { DraftTrends } from './components/DraftTrends'
import { DraftPrompts } from './components/DraftPrompts'
import { FloatingActionBar } from './components/FloatingActionBar'
import { useDraft } from './components/DraftProvider'

function DraftContent() {
  const { currentTab } = useDraft()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DraftHeader />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Draft Prompts */}
        <DraftPrompts />
        
        {/* Tab Content */}
        <div className="mt-6">
          {currentTab === 'draft-board' && <DraftBoard />}
          {currentTab === 'best-available' && <BestAvailable />}
          {currentTab === 'position-analysis' && <PositionAnalysis />}
          {currentTab === 'team-rosters' && <TeamRosters />}
          {currentTab === 'draft-trends' && <DraftTrends />}
        </div>
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
