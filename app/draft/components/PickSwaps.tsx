'use client'

import { useState } from 'react'
import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'
import { PickSwap } from '@/types/draft'
import { Plus, Trash2 } from 'lucide-react'

export function PickSwaps() {
  const { draftState } = useDraft()
  const [swaps, setSwaps] = useState<PickSwap[]>(draftState.pickSwaps || [])

  const addSwap = () => {
    setSwaps([...swaps, { round: 1, teamIndex: 0, swappedToTeamIndex: 0 }])
  }

  const removeSwap = (index: number) => {
    setSwaps(swaps.filter((_, i) => i !== index))
  }

  const updateSwap = (index: number, field: keyof PickSwap, value: number) => {
    const newSwaps = [...swaps]
    newSwaps[index] = { ...newSwaps[index], [field]: value }
    setSwaps(newSwaps)
  }

  const getPickNumber = (round: number, teamIndex: number): number => {
    return (round - 1) * LEAGUE_SETTINGS.teams + teamIndex + 1
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trade Tracker</h2>
            <p className="text-muted-foreground">
              Manage pick swaps where teams have traded draft positions.
            </p>
          </div>
          <button
            onClick={addSwap}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Swap
          </button>
        </div>

        {swaps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No pick swaps configured</p>
            <p className="text-sm mt-2">Click "Add Swap" to create a new swap</p>
          </div>
        ) : (
          <div className="space-y-3">
            {swaps.map((swap, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border"
              >
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">Round</label>
                  <select
                    value={swap.round}
                    onChange={(e) => updateSwap(index, 'round', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  >
                    {Array.from({ length: LEAGUE_SETTINGS.numRounds }, (_, i) => i + 1).map((round) => (
                      <option key={round} value={round}>
                        Round {round}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">Original Owner</label>
                  <select
                    value={swap.teamIndex}
                    onChange={(e) => updateSwap(index, 'teamIndex', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  >
                    {LEAGUE_SETTINGS.owners.map((owner, idx) => (
                      <option key={idx} value={idx}>
                        {owner} (Pick #{getPickNumber(swap.round, idx)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center text-2xl text-primary">
                  →
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium block mb-1">New Owner</label>
                  <select
                    value={swap.swappedToTeamIndex}
                    onChange={(e) => updateSwap(index, 'swappedToTeamIndex', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  >
                    {LEAGUE_SETTINGS.owners.map((owner, idx) => (
                      <option key={idx} value={idx}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => removeSwap(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Remove swap"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">ℹ️</div>
          <div>
            <h4 className="font-semibold text-blue-500 mb-1">How It Works</h4>
            <p className="text-sm text-blue-500/80">
              When a pick is swapped, it will appear in the original owner's column but will be recorded
              under the new owner's team roster. Both cells will be highlighted with matching colors to show the connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
