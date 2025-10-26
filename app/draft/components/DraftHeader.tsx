'use client'

import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function DraftHeader() {
  const { draftState, switchTab, currentTab, resetDraft } = useDraft()
  
  const tabs = [
    { id: 'draft-board', label: 'Draft Hub', icon: '📋' },
    { id: 'best-available', label: 'Best Available', icon: '🏆' },
    { id: 'position-analysis', label: 'Position Analysis', icon: '📊' },
    { id: 'team-rosters', label: 'Team Rosters', icon: '👥' }
  ]

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the entire draft board? This action cannot be undone.')) {
      resetDraft()
    }
  }

  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Title and Progress */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground mt-1">
              Draft Progress: {draftState.picks.filter(p => p.playerName).length} of {LEAGUE_SETTINGS.numRounds * LEAGUE_SETTINGS.teams} picks
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Progress Bar */}
            <div className="w-64">
              <div className="bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${draftState.draftProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-center">
                {draftState.draftProgress}% Complete
              </div>
            </div>
            
            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              Reset Draft
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                currentTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
