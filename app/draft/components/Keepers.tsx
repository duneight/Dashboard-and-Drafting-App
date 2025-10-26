'use client'

import { useState, useEffect } from 'react'
import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS, initialPrefilledData } from '@/lib/draft/leagueSettings'

export function Keepers() {
  const { draftState } = useDraft()
  const [keeperLists, setKeeperLists] = useState<Record<number, string>>({})

  // Initialize keeper lists from current draft state
  useEffect(() => {
    const lists: Record<number, string> = {}
    
    LEAGUE_SETTINGS.owners.forEach((owner, teamIndex) => {
      const keeperPlayers: string[] = []
      
      // Get keepers from rounds 1-10 for this team
      for (let round = 1; round <= 10; round++) {
        const pick = draftState.picks.find(
          p => p.round === round && p.teamIndex === teamIndex && p.playerName
        )
        if (pick && pick.playerName) {
          keeperPlayers.push(pick.playerName)
        }
      }
      
      lists[teamIndex] = keeperPlayers.join(', ')
    })
    
    setKeeperLists(lists)
  }, [draftState])

  const handleKeeperChange = (teamIndex: number, value: string) => {
    setKeeperLists(prev => ({
      ...prev,
      [teamIndex]: value
    }))
  }

  const parseKeeperList = (text: string): string[] => {
    return text
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-2">Keepers Management</h2>
        <p className="text-muted-foreground mb-6">
          Edit keeper lists for each team. Paste comma-separated or newline-separated player names.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {LEAGUE_SETTINGS.owners.map((owner, teamIndex) => (
            <div key={teamIndex} className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {owner}
              </label>
              <textarea
                value={keeperLists[teamIndex] || ''}
                onChange={(e) => handleKeeperChange(teamIndex, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground resize-none"
                rows={6}
                placeholder="Paste keeper list here..."
              />
              <div className="text-xs text-muted-foreground">
                {keeperLists[teamIndex]?.split(/[,\n]/).filter(p => p.trim()).length || 0} keepers
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Current Keeper Distribution</h3>
        <div className="grid grid-cols-10 gap-2 text-center text-xs">
          {LEAGUE_SETTINGS.owners.map((owner, teamIndex) => {
            const keepers = parseKeeperList(keeperLists[teamIndex] || '')
            return (
              <div key={teamIndex} className="bg-muted p-2 rounded">
                <div className="font-medium">{owner.split(' ')[0]}</div>
                <div className="text-lg font-bold text-primary">{keepers.length}</div>
                <div className="text-muted-foreground">keepers</div>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-500 text-xl">⚠️</div>
          <div>
            <h4 className="font-semibold text-yellow-500 mb-1">Important</h4>
            <p className="text-sm text-yellow-500/80">
              Keepers are currently displayed in rounds 1-10 on the main draft board. 
              The draft officially starts at round 11. 
              Managers can keep between 6-10 players. 
              In rounds 7-10, players must have played at least 1 regular season NHL game.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
