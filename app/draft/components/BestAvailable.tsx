'use client'

import { useState } from 'react'
import { useDraft } from './DraftProvider'
import { DraftAnalytics } from '@/lib/draft/draftAnalytics'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function BestAvailable() {
  const { availablePlayers, makePick, draftState } = useDraft()
  
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

  return (
    <div className="space-y-6">
      {/* Current Round Tracker */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="text-center mb-4">
          <span className="text-lg font-semibold">
            Round {currentRound} • Pick #{currentPick} • {currentOwner} is on the clock
          </span>
        </div>
        <div className="grid grid-cols-10 gap-2">
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

      {/* 6-Column Position Table */}
      <div className="grid grid-cols-6 gap-4">
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
