'use client'

import { Crown } from 'lucide-react'
import { AvatarWidget } from '../components/ui/AvatarWidget'

export default function HallOfFamePage() {
  // Mock data for Hall of Fame achievements
  const hallOfFameData = [
    {
      manager: 'Derek',
      team: 'International Whiddens Day',
      category: 'Championship King',
      season: '2022-23',
      description: 'Led team to championship victory with dominant playoff performance'
    },
    {
      manager: 'Mike',
      team: 'Ice Cold Stunners',
      category: 'Point Machine',
      season: '2021-22',
      description: 'Scored the most fantasy points in a single season'
    },
    {
      manager: 'Sarah',
      team: 'Frozen Thunder',
      category: 'Consistency Master',
      season: '2020-21',
      description: 'Maintained highest win percentage across multiple seasons'
    },
    {
      manager: 'Alex',
      team: 'Blizzard Warriors',
      category: 'Draft Genius',
      season: '2022-23',
      description: 'Best draft performance with highest value picks'
    },
    {
      manager: 'Jordan',
      team: 'Arctic Assassins',
      category: 'Comeback King',
      season: '2021-22',
      description: 'Biggest comeback from last place to playoffs'
    },
    {
      manager: 'Taylor',
      team: 'Frost Giants',
      category: 'Waiver Wire Wizard',
      season: '2020-21',
      description: 'Most successful waiver wire pickups'
    },
    {
      manager: 'Casey',
      team: 'Snow Leopards',
      category: 'Playoff Legend',
      season: '2022-23',
      description: 'Most playoff wins in league history'
    },
    {
      manager: 'Riley',
      team: 'Ice Breakers',
      category: 'Trade Master',
      season: '2021-22',
      description: 'Most successful trades leading to championship run'
    },
    {
      manager: 'Morgan',
      team: 'Frozen Fury',
      category: 'Rookie Sensation',
      season: '2022-23',
      description: 'Best performance by a first-year manager'
    },
    {
      manager: 'Sam',
      team: 'Avalanche Attack',
      category: 'Streak Master',
      season: '2021-22',
      description: 'Longest winning streak in league history'
    },
    {
      manager: 'Jamie',
      team: 'Glacier Guardians',
      category: 'Defensive Specialist',
      season: '2020-21',
      description: 'Best defensive performance and lowest points against'
    },
    {
      manager: 'Pat',
      team: 'Polar Bears',
      category: 'Clutch Performer',
      season: '2022-23',
      description: 'Most clutch performances in high-pressure situations'
    }
  ]

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Crown className="h-8 w-8 text-amber-600" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Hall of Fame
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Celebrating the legends who have achieved greatness in our fantasy league
        </p>
      </div>

      {/* Achievement Widgets */}
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
        {hallOfFameData.map((achievement, index) => (
          <AvatarWidget
            key={index}
            type="fame"
            manager={achievement.manager}
            team={achievement.team}
            category={achievement.category}
            season={achievement.season}
          />
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-16 text-center">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="text-3xl font-bold text-amber-600 mb-2">{hallOfFameData.length}</div>
            <div className="text-sm text-muted-foreground">Total Achievements</div>
          </div>
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="text-3xl font-bold text-amber-600 mb-2">12</div>
            <div className="text-sm text-muted-foreground">Unique Champions</div>
          </div>
          <div className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="text-3xl font-bold text-amber-600 mb-2">3</div>
            <div className="text-sm text-muted-foreground">Seasons Tracked</div>
          </div>
        </div>
      </div>
    </div>
  )
}