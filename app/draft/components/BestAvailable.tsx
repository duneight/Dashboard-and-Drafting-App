'use client'

import { useState } from 'react'
import { useDraft } from './DraftProvider'
import { DraftAnalytics } from '@/lib/draft/draftAnalytics'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function BestAvailable() {
  const { availablePlayers, makePick, draftState } = useDraft()
  const [selectedPosition, setSelectedPosition] = useState<string>('Overall')
  
  // Get current pick info
  const analytics = new DraftAnalytics(
    draftState.picks,
    draftState.selectedPlayers,
    availablePlayers
  )
  const { pick: currentPick, round: currentRound, owner: currentOwner } = analytics.getCurrentPickInfo()

  const handlePlayerClick = (player: any) => {
    // Find the first empty pick
    const emptyPick = draftState.picks.find(p => !p.playerName)
    if (emptyPick) {
      makePick(emptyPick.round, emptyPick.teamIndex, player)
    }
  }

  const positions = [
    { key: 'Overall', label: 'Overall', filter: () => true },
    { key: 'C', label: 'Centers', filter: (p: any) => p.pos.includes('C') },
    { key: 'LW', label: 'Left Wings', filter: (p: any) => p.pos.includes('LW') },
    { key: 'RW', label: 'Right Wings', filter: (p: any) => p.pos.includes('RW') },
    { key: 'D', label: 'Defense', filter: (p: any) => p.pos.includes('D') },
    { key: 'G', label: 'Goalies', filter: (p: any) => p.pos.includes('G') }
  ]

  const getFilteredPlayers = (position: string) => {
    const positionData = positions.find(p => p.key === position)
    if (!positionData) return availablePlayers.slice(0, 25)
    return availablePlayers.filter(positionData.filter).slice(0, 25)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current Round Tracker */}
      <div className="bg-muted/50 rounded-lg p-3 md:p-4">
        <div className="text-center mb-3 md:mb-4">
          <span className="text-sm md:text-lg font-semibold">
            Round {currentRound} • Pick #{currentPick}
          </span>
          <div className="text-xs md:text-base mt-1 md:mt-0 md:inline md:ml-2">
            {currentOwner} is on the clock
          </div>
        </div>
        <div className="hidden md:grid grid-cols-10 gap-2">
          {Array.from({length: LEAGUE_SETTINGS.teams}, (_, i) => {
            const pickNum = (currentRound - 1) * LEAGUE_SETTINGS.teams + i + 1
            const isCurrentPick = pickNum === currentPick
            const pick = draftState.picks.find(p => p.pick === pickNum)
            const owner = LEAGUE_SETTINGS.owners[i]
            
            return (
              <div 
                key={pickNum}
                className={`p-2 rounded text-center ${
                  isCurrentPick 
                    ? 'bg-yellow-500 text-yellow-900' 
                    : pick?.playerName 
                      ? 'bg-card border border-border' 
                      : 'bg-muted'
                }`}
              >
                <div className="text-xs font-medium">{owner}</div>
                <div className="font-bold text-sm">#{pickNum}</div>
                {pick?.playerName && (
                  <div className="text-xs mt-1 truncate">{pick.playerName}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Position Selector */}
      <div className="md:hidden">
        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {positions.map(pos => (
            <option key={pos.key} value={pos.key}>{pos.label}</option>
          ))}
        </select>
      </div>

      {/* Mobile Single Column View */}
      <div className="md:hidden">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-center mb-3">{selectedPosition}</h3>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {getFilteredPlayers(selectedPosition).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop 6-Column Position Table */}
      <div className="hidden md:grid grid-cols-6 gap-4">
        {/* Overall Column */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-center mb-3">Overall</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availablePlayers.slice(0, 25).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Centers Column */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-center mb-3">Centers</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availablePlayers.filter(p => p.pos.includes('C')).slice(0, 25).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Wings Column */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-center mb-3">Left Wings</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availablePlayers.filter(p => p.pos.includes('LW')).slice(0, 25).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Wings Column */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-center mb-3">Right Wings</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availablePlayers.filter(p => p.pos.includes('RW')).slice(0, 25).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Defense Column */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-center mb-3">Defense</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availablePlayers.filter(p => p.pos.includes('D')).slice(0, 25).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goalies Column */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-center mb-3">Goalies</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availablePlayers.filter(p => p.pos.includes('G')).slice(0, 25).map(player => (
              <div 
                key={player.rank}
                className="p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="font-medium text-sm">#{player.rank} {player.name}</div>
                <div className="text-xs text-muted-foreground">{player.team} • {player.pos}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
