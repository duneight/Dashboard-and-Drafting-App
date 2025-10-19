'use client'

import { forwardRef, useEffect, useState } from 'react'
import { useDraft } from './DraftProvider'
import { findPlayerByName } from '@/lib/draft/playerRankings'

interface PlayerDropdownProps {
  searchTerm: string
  onPlayerSelect: (player: any) => void
  highlightedIndex: number
  onHighlightChange: (index: number) => void
}

export const PlayerDropdown = forwardRef<HTMLDivElement, PlayerDropdownProps>(
  ({ searchTerm, onPlayerSelect, highlightedIndex, onHighlightChange }, ref) => {
    const { availablePlayers } = useDraft()
    const [filteredPlayers, setFilteredPlayers] = useState<any[]>([])

  // Filter players based on search term
  useEffect(() => {
    if (searchTerm.length === 0) {
      // Show top 20 players when no search term
      setFilteredPlayers(availablePlayers.slice(0, 20))
      return
    }

    if (searchTerm.length < 2) {
      setFilteredPlayers([])
      return
    }

    const filtered = availablePlayers
      .filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 10) // Limit to 10 suggestions

    setFilteredPlayers(filtered)
  }, [searchTerm, availablePlayers])

    // Reset highlight when filtered players change
    useEffect(() => {
      onHighlightChange(-1)
    }, [filteredPlayers, onHighlightChange])

    if (filteredPlayers.length === 0) {
      return null
    }

    return (
      <div
        ref={ref}
        className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
      >
        {filteredPlayers.map((player, index) => (
          <button
            key={player.rank}
            onClick={() => onPlayerSelect(player)}
            className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors ${
              index === highlightedIndex ? 'bg-muted' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  #{player.rank} {player.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {player.team} • {player.pos} • Avg: {player.avg}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

PlayerDropdown.displayName = 'PlayerDropdown'
