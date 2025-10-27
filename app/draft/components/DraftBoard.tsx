'use client'

import { useDraft } from './DraftProvider'
import { PlayerInput } from './PlayerInput'
import { TeamHeader } from './TeamHeader'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function DraftBoard() {
  const { draftState } = useDraft()

  // Check if a pick has been swapped
  const getSwapInfo = (round: number, teamIndex: number) => {
    if (!draftState.pickSwaps) return null
    
    const swap = draftState.pickSwaps.find(
      s => s.round === round && s.teamIndex === teamIndex
    )
    
    if (swap) {
      return {
        swappedTo: LEAGUE_SETTINGS.owners[swap.swappedToTeamIndex],
        swappedToIndex: swap.swappedToTeamIndex
      }
    }
    
    // Check if this cell is the target of a swap
    const targetSwap = draftState.pickSwaps.find(
      s => s.round === round && s.swappedToTeamIndex === teamIndex && s.teamIndex !== teamIndex
    )
    
    if (targetSwap) {
      return {
        swappedFrom: LEAGUE_SETTINGS.owners[targetSwap.teamIndex],
        swappedFromIndex: targetSwap.teamIndex
      }
    }
    
    return null
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto md:overflow-x-visible touch-pan-x">
        <table className="w-full md:table-fixed min-w-max md:min-w-0">
          <thead className="bg-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-muted px-2 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-medium text-foreground border-r border-border w-16 md:w-20">
                Round
              </th>
              {LEAGUE_SETTINGS.owners.map((owner, index) => (
                <th 
                  key={index}
                  className="px-2 py-2 md:px-3 md:py-3 text-center text-xs md:text-sm font-medium text-foreground border-r border-border last:border-r-0 min-w-[120px] md:min-w-0 md:w-[calc((100%-5rem)/10)]"
                >
                  <TeamHeader teamIndex={index} teamName={owner} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: LEAGUE_SETTINGS.numRounds }, (_, roundIndex) => {
              const round = roundIndex + 1
              return (
                <tr key={round} className="border-b border-border last:border-b-0">
                  <td className="sticky left-0 z-10 bg-muted px-2 py-2 md:px-4 md:py-3 text-center text-xs md:text-sm font-medium text-foreground border-r border-border w-16 md:w-20">
                    {round}
                  </td>
                  {LEAGUE_SETTINGS.owners.map((owner, teamIndex) => {
                    const pickNumber = (round - 1) * LEAGUE_SETTINGS.teams + teamIndex + 1
                    const pick = draftState.picks.find(p => p.pick === pickNumber)
                    const swapInfo = getSwapInfo(round, teamIndex)
                    
                    return (
                      <td 
                        key={teamIndex}
                        className={`px-1 py-2 md:px-2 md:py-2 border-r border-border last:border-r-0 min-w-[120px] md:min-w-0 md:w-[calc((100%-5rem)/10)] ${
                          swapInfo ? 'bg-purple-500/20 border-l-4 border-l-purple-500' : ''
                        }`}
                      >
                        <PlayerInput
                          round={round}
                          teamIndex={teamIndex}
                          pick={pick}
                        />
                        {swapInfo?.swappedTo && (
                          <div className="text-[10px] md:text-xs text-purple-500 mt-1">
                            → {swapInfo.swappedTo}
                          </div>
                        )}
                        {swapInfo?.swappedFrom && (
                          <div className="text-[10px] md:text-xs text-purple-500 mt-1">
                            ← {swapInfo.swappedFrom}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
