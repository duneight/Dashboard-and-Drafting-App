'use client'

import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function TeamRosters() {
  const { draftState } = useDraft()

  // Determine the actual team that should own a pick based on swap rules
  const getActualTeamForPick = (pick: any) => {
    if (!draftState.pickSwaps || !pick) return pick.teamIndex
    
    // Check if this pick was swapped
    const swap = draftState.pickSwaps.find(
      s => s.round === pick.round && s.teamIndex === pick.teamIndex
    )
    
    if (swap) {
      // This pick belongs to the swapped-to team
      return swap.swappedToTeamIndex
    }
    
    // Otherwise, it belongs to the original team
    return pick.teamIndex
  }

  const getTeamRoster = (teamName: string) => {
    const teamIndex = LEAGUE_SETTINGS.owners.indexOf(teamName)
    
    return draftState.picks
      .filter(pick => {
        // Filter by actual owning team (considering swaps)
        const actualTeam = getActualTeamForPick(pick)
        return actualTeam === teamIndex && pick.playerName
      })
      .sort((a, b) => a.pick - b.pick)
  }

  const getPositionGroup = (roster: any[], position: string) => {
    return roster.filter(player => {
      if (position === 'F') {
        return player.playerPosition?.includes('C') || 
               player.playerPosition?.includes('LW') || 
               player.playerPosition?.includes('RW')
      }
      return player.playerPosition?.includes(position)
    })
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Team Rosters</h3>
      
      <div className="grid grid-cols-5 gap-4">
        {LEAGUE_SETTINGS.owners.map((owner) => {
          const roster = getTeamRoster(owner)
          
          if (roster.length === 0) return null

          const centers = getPositionGroup(roster, 'C')
          const leftWings = getPositionGroup(roster, 'LW')
          const rightWings = getPositionGroup(roster, 'RW')
          const defensemen = getPositionGroup(roster, 'D')
          const goalies = getPositionGroup(roster, 'G')

          return (
            <div key={owner} className="bg-card rounded-lg border border-border p-3">
              <h4 className="font-semibold text-foreground mb-3 text-center text-sm">{owner}</h4>
              
              <div className="space-y-3">
                {/* Centers */}
                {centers.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-red-500 mb-1">Centers ({centers.length})</h5>
                    <div className="space-y-1">
                      {centers.map((player) => (
                        <div key={player.pick} className="flex justify-between items-center text-xs">
                          <span className="text-foreground truncate">#{player.playerRank} {player.playerName}</span>
                          <span className="text-muted-foreground text-xs">{player.playerTeam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Left Wings */}
                {leftWings.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-orange-500 mb-1">Left Wings ({leftWings.length})</h5>
                    <div className="space-y-1">
                      {leftWings.map((player) => (
                        <div key={player.pick} className="flex justify-between items-center text-xs">
                          <span className="text-foreground truncate">#{player.playerRank} {player.playerName}</span>
                          <span className="text-muted-foreground text-xs">{player.playerTeam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Right Wings */}
                {rightWings.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-yellow-500 mb-1">Right Wings ({rightWings.length})</h5>
                    <div className="space-y-1">
                      {rightWings.map((player) => (
                        <div key={player.pick} className="flex justify-between items-center text-xs">
                          <span className="text-foreground truncate">#{player.playerRank} {player.playerName}</span>
                          <span className="text-muted-foreground text-xs">{player.playerTeam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Defense */}
                {defensemen.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-blue-500 mb-1">Defense ({defensemen.length})</h5>
                    <div className="space-y-1">
                      {defensemen.map((player) => (
                        <div key={player.pick} className="flex justify-between items-center text-xs">
                          <span className="text-foreground truncate">#{player.playerRank} {player.playerName}</span>
                          <span className="text-muted-foreground text-xs">{player.playerTeam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goalies */}
                {goalies.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-purple-500 mb-1">Goalies ({goalies.length})</h5>
                    <div className="space-y-1">
                      {goalies.map((player) => (
                        <div key={player.pick} className="flex justify-between items-center text-xs">
                          <span className="text-foreground truncate">#{player.playerRank} {player.playerName}</span>
                          <span className="text-muted-foreground text-xs">{player.playerTeam}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
