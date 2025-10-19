'use client'

import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

export function PositionAnalysis() {
  const { positionBalances } = useDraft()

  const positions = [
    { key: 'C', label: 'Centers', color: 'bg-red-500', required: LEAGUE_SETTINGS.rosterPositions.centers },
    { key: 'LW', label: 'Left Wings', color: 'bg-orange-500', required: LEAGUE_SETTINGS.rosterPositions.leftWings },
    { key: 'RW', label: 'Right Wings', color: 'bg-yellow-500', required: LEAGUE_SETTINGS.rosterPositions.rightWings },
    { key: 'D', label: 'Defense', color: 'bg-blue-500', required: LEAGUE_SETTINGS.rosterPositions.defensemen },
    { key: 'G', label: 'Goalies', color: 'bg-purple-500', required: LEAGUE_SETTINGS.rosterPositions.goalies }
  ]

  return (
    <div className="space-y-6">
      {/* Team Position Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Team Position Distribution</h3>
        
        <div className="grid grid-cols-5 gap-4">
          {LEAGUE_SETTINGS.owners.map((owner, teamIndex) => {
            const balance = positionBalances[owner]
            if (!balance || balance.total === 0) return null

            return (
              <div key={teamIndex} className="bg-card rounded-lg border border-border p-4">
                <h4 className="font-medium text-foreground mb-3 text-center">{owner}</h4>
                
                <div className="space-y-2">
                  {positions.map((position) => {
                    const count = balance[position.key as keyof typeof balance] as number
                    const progress = Math.min(count, position.required)
                    const percentage = (progress / position.required) * 100
                    const isOverLimit = count > position.required

                    return (
                      <div key={position.key} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{position.label}</span>
                          <span className={`font-medium ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}>
                            {count}/{position.required}
                          </span>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${position.color} ${
                              isOverLimit ? 'bg-destructive' : ''
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* League-wide Position Summary */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">League-wide Position Summary</h3>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {positions.map((position) => {
              const totalPicked = Object.values(positionBalances).reduce(
                (sum, balance) => sum + (balance[position.key as keyof typeof balance] as number), 0
              )
              const totalNeeded = LEAGUE_SETTINGS.teams * position.required
              const percentage = (totalPicked / totalNeeded) * 100

              return (
                <div key={position.key} className="text-center">
                  <div className="text-2xl mb-2">{totalPicked}</div>
                  <div className="text-sm text-muted-foreground mb-2">{position.label}</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${position.color}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% complete
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
