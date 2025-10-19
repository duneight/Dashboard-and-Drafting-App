'use client'

import { ThumbsDown } from 'lucide-react'
import { AvatarWidget } from '../components/ui/AvatarWidget'

export default function WallOfShamePage() {
  // Mock data for Wall of Shame moments
  const wallOfShameData = [
    {
      manager: 'Larry',
      team: 'Last Place Larrys',
      category: 'Championship Choke',
      season: '2022-23', 
      description: 'Scored only 45.2 points in championship week with full lineup'
    },
    {
      manager: 'Bob',
      team: 'Frost Giants',
      category: 'Blowout Victim',
      season: '2021-22', 
      description: 'Lost by 67.8 points - the biggest blowout in league history'
    },
    {
      manager: 'Steve',
      team: 'Ice Breakers',
      category: 'Losing Streak King',
      season: '2020-21', 
      description: '8-game losing streak that lasted almost two months'
    },
    {
      manager: 'Dave',
      team: 'Frozen Thunder',
      category: 'Draft Disaster',
      season: '2022-23',
      description: 'Worst draft performance with F- grade from experts'
    },
    {
      manager: 'Tom',
      team: 'Arctic Assassins',
      category: 'Bench Blunder',
      season: '2021-22',
      description: 'Left 89.3 points on the bench in a single week'
    },
    {
      manager: 'Rick',
      team: 'Snow Leopards',
      category: 'Waiver Warrior',
      season: '2020-21',
      description: 'Made 47 waiver moves in one season with zero success'
    },
    {
      manager: 'Gary',
      team: 'Frozen Fury',
      category: 'Trade Travesty',
      season: '2022-23',
      description: 'Traded away the eventual league MVP for a backup goalie'
    },
    {
      manager: 'Kevin',
      team: 'Blizzard Warriors',
      category: 'Playoff Pretender',
      season: '2021-22',
      description: 'Made playoffs but scored lowest points in playoff history'
    },
    {
      manager: 'Mark',
      team: 'Ice Cold Stunners',
      category: 'Consistency Curse',
      season: '2020-21',
      description: 'Lost 12 games in a row despite having good players'
    },
    {
      manager: 'Frank',
      team: 'Polar Vortex',
      category: 'Injury Magnet',
      season: '2022-23',
      description: 'Had 8 players on IR simultaneously'
    },
    {
      manager: 'Tony',
      team: 'Glacier Meltdown',
      category: 'Lineup Lazy',
      season: '2021-22',
      description: 'Forgot to set lineup for 3 consecutive weeks'
    },
    {
      manager: 'Carl',
      team: 'Frozen Assets',
      category: 'Stat Sheet Stuffer',
      season: '2020-21',
      description: 'Led league in negative categories (penalties, turnovers)'
    }
  ]

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <ThumbsDown className="h-8 w-8 text-red-600" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Wall of Shame
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The not-so-great moments that will live in infamy forever
        </p>
      </div>

      {/* Shame Widgets */}
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
        {wallOfShameData.map((shame, index) => (
          <AvatarWidget
            key={index}
            type="shame"
            manager={shame.manager}
            team={shame.team}
            category={shame.category}
            season={shame.season}
          />
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-16 text-center">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="text-3xl font-bold text-red-600 mb-2">{wallOfShameData.length}</div>
            <div className="text-sm text-muted-foreground">Shameful Moments</div>
        </div>
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="text-3xl font-bold text-red-600 mb-2">12</div>
            <div className="text-sm text-muted-foreground">Unique Offenders</div>
          </div>
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="text-3xl font-bold text-red-600 mb-2">67.8</div>
            <div className="text-sm text-muted-foreground">Biggest Blowout (pts)</div>
      </div>
    </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-16 text-center">
        <div className="bg-muted/50 p-6 rounded-xl border max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            😄 All in good fun! These stats are meant to add some humor to fantasy competition and help us all learn from our mistakes.
          </p>
    </div>
      </div>
    </div>
  )
}