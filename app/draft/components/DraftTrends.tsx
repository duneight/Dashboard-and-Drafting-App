'use client'

import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function DraftTrends() {
  const { draftState } = useDraft()

  // Calculate position picks by round
  const getPositionTrends = () => {
    const trends: Record<number, Record<string, number>> = {}
    
    for (let round = 1; round <= LEAGUE_SETTINGS.numRounds; round++) {
      trends[round] = { C: 0, LW: 0, RW: 0, D: 0, G: 0 }
    }

    draftState.picks.forEach(pick => {
      if (pick.playerPosition && pick.round) {
        const position = pick.playerPosition.includes('G') ? 'G' :
                        pick.playerPosition.includes('D') ? 'D' :
                        pick.playerPosition.includes('C') ? 'C' :
                        pick.playerPosition.includes('LW') ? 'LW' : 'RW'
        
        trends[pick.round][position]++
      }
    })

    return trends
  }

  const trends = getPositionTrends()
  const rounds = Array.from({ length: LEAGUE_SETTINGS.numRounds }, (_, i) => i + 1)

  const positions = [
    { key: 'C', label: 'Centers', color: 'bg-red-500' },
    { key: 'LW', label: 'Left Wings', color: 'bg-orange-500' },
    { key: 'RW', label: 'Right Wings', color: 'bg-yellow-500' },
    { key: 'D', label: 'Defense', color: 'bg-blue-500' },
    { key: 'G', label: 'Goalies', color: 'bg-purple-500' }
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Draft Trends</h3>
      
      {/* Position Picks by Round */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="font-medium text-foreground mb-4">Position Picks by Round</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3">Round</th>
                {positions.map(pos => (
                  <th key={pos.key} className="text-center py-2 px-3">{pos.label}</th>
                ))}
                <th className="text-center py-2 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(round => {
                const roundData = trends[round]
                const total = Object.values(roundData).reduce((sum, count) => sum + count, 0)
                
                return (
                  <tr key={round} className="border-b border-border/50">
                    <td className="py-2 px-3 font-medium">{round}</td>
                    {positions.map(pos => (
                      <td key={pos.key} className="text-center py-2 px-3">
                        <span className={`inline-block w-6 h-6 rounded-full ${pos.color} text-white text-xs flex items-center justify-center`}>
                          {roundData[pos.key]}
                        </span>
                      </td>
                    ))}
                    <td className="text-center py-2 px-3 font-medium">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Distribution Chart */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="font-medium text-foreground mb-4">Overall Position Distribution</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {positions.map(position => {
            const totalPicked = Object.values(trends).reduce(
              (sum, roundData) => sum + roundData[position.key], 0
            )
            const totalPossible = LEAGUE_SETTINGS.numRounds * LEAGUE_SETTINGS.teams
            const percentage = (totalPicked / totalPossible) * 100

            return (
              <div key={position.key} className="text-center">
                <div className="text-2xl font-bold text-foreground mb-1">{totalPicked}</div>
                <div className="text-sm text-muted-foreground mb-2">{position.label}</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${position.color}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Draft Pace */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="font-medium text-foreground mb-4">Draft Pace</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {draftState.picks.filter(p => p.playerName).length}
            </div>
            <div className="text-sm text-muted-foreground">Total Picks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {LEAGUE_SETTINGS.numRounds * LEAGUE_SETTINGS.teams - draftState.picks.filter(p => p.playerName).length}
            </div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {draftState.draftProgress}%
            </div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
      </div>
    </div>
  )
}
