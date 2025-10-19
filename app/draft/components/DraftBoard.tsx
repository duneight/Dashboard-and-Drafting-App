'use client'

import { useDraft } from './DraftProvider'
import { PlayerInput } from './PlayerInput'
import { TeamHeader } from './TeamHeader'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function DraftBoard() {
  const { draftState } = useDraft()

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground border-r border-border">
                Round
              </th>
              {LEAGUE_SETTINGS.owners.map((owner, index) => (
                <th 
                  key={index}
                  className="px-4 py-3 text-center text-sm font-medium text-foreground border-r border-border last:border-r-0"
                  style={{ width: '9.4%' }}
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
                  <td className="px-4 py-3 text-center text-sm font-medium text-foreground border-r border-border bg-muted">
                    {round}
                  </td>
                  {LEAGUE_SETTINGS.owners.map((owner, teamIndex) => {
                    const pickNumber = (round - 1) * LEAGUE_SETTINGS.teams + teamIndex + 1
                    const pick = draftState.picks.find(p => p.pick === pickNumber)
                    
                    return (
                      <td 
                        key={teamIndex}
                        className="px-2 py-2 border-r border-border last:border-r-0"
                      >
                        <PlayerInput
                          round={round}
                          teamIndex={teamIndex}
                          pick={pick}
                        />
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
