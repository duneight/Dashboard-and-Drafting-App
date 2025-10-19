'use client'

import { useState } from 'react'
import { useDraft } from './DraftProvider'
import { DraftAnalytics } from '@/lib/draft/draftAnalytics'

export function BestAvailable() {
  const { availablePlayers, makePick, draftState } = useDraft()
  const [selectedPosition, setSelectedPosition] = useState('all')
  
  // Get current pick info
  const analytics = new DraftAnalytics(
    draftState.picks,
    draftState.selectedPlayers,
    availablePlayers
  )
  const { pick: currentPick, round: currentRound, owner: currentOwner } = analytics.getCurrentPickInfo()

  const positions = [
    { id: 'all', label: 'Overall', icon: '🏆' },
    { id: 'C', label: 'Centers', icon: '🎯' },
    { id: 'LW', label: 'Left Wings', icon: '⚡' },
    { id: 'RW', label: 'Right Wings', icon: '🔥' },
    { id: 'D', label: 'Defense', icon: '🛡️' },
    { id: 'G', label: 'Goalies', icon: '🥅' }
  ]

  const getFilteredPlayers = () => {
    if (selectedPosition === 'all') {
      return availablePlayers.slice(0, 50)
    }
    
    if (selectedPosition === 'F') {
      return availablePlayers.filter(p => 
        p.pos.includes('C') || p.pos.includes('LW') || p.pos.includes('RW')
      ).slice(0, 50)
    }
    
    return availablePlayers.filter(p => p.pos.includes(selectedPosition)).slice(0, 50)
  }

  const filteredPlayers = getFilteredPlayers()

  const handlePlayerClick = (player: any) => {
    // Find the first empty pick
    const emptyPick = draftState.picks.find(p => !p.playerName)
    if (emptyPick) {
      makePick(emptyPick.round, emptyPick.teamIndex, player)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Pick Context */}
      <div className="text-center py-3 bg-muted/50 rounded-lg border border-border">
        <div className="text-sm text-muted-foreground">
          Round {currentRound} • {currentOwner} • Pick #{currentPick}
        </div>
      </div>

      {/* Position Tabs */}
      <div className="flex flex-wrap gap-2">
        {positions.map((position) => (
          <button
            key={position.id}
            onClick={() => setSelectedPosition(position.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              selectedPosition === position.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <span>{position.icon}</span>
            <span className="font-medium">{position.label}</span>
          </button>
        ))}
      </div>

      {/* Players List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => (
          <button
            key={player.rank}
            onClick={() => handlePlayerClick(player)}
            className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-foreground">
                #{player.rank}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg: {player.avg}
              </div>
            </div>
            
            <div className="font-medium text-foreground mb-1">
              {player.name}
            </div>
            
            <div className="text-sm text-muted-foreground">
              {player.team} • {player.pos}
            </div>
          </button>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No players available for this position
        </div>
      )}
    </div>
  )
}
