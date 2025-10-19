'use client'

import { useDraft } from './DraftProvider'
import { LEAGUE_SETTINGS } from '@/lib/draft/leagueSettings'

interface TeamHeaderProps {
  teamIndex: number
  teamName: string
}

export function TeamHeader({ teamIndex, teamName }: TeamHeaderProps) {
  const { positionBalances } = useDraft()
  const balance = positionBalances[teamName] || { C: 0, LW: 0, RW: 0, D: 0, G: 0, total: 0 }
  
  const progress = Math.round((balance.total / LEAGUE_SETTINGS.numRounds) * 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-medium text-foreground">{teamName}</div>
      
      {/* Progress Ring */}
      <div className="relative w-5 h-5">
        <div 
          className="absolute inset-0 rounded-full border-2 border-muted"
        />
        <div 
          className="absolute inset-0 rounded-full border-2 border-primary transition-all duration-300"
          style={{
            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((progress * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((progress * 3.6 - 90) * Math.PI / 180)}%)`
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{progress}</span>
        </div>
      </div>
      
      {/* Position Count */}
      <div className="flex items-center gap-1 text-xs">
        <span className="text-red-500">{balance.C}</span>
        <span className="text-orange-500">{balance.LW}</span>
        <span className="text-yellow-500">{balance.RW}</span>
        <span className="text-blue-500">{balance.D}</span>
        <span className="text-purple-500">{balance.G}</span>
      </div>
    </div>
  )
}
