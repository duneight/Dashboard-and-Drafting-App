'use client'

import AvatarWidget from './AvatarWidget'
import MedalCard from './MedalCard'

interface PodiumEntry {
  rank: number
  manager: string
  value: number | string
  description: string
  season?: string
}

interface CategoryPodiumProps {
  id: string
  name: string
  description: string
  type: 'fame' | 'shame'
  entries: PodiumEntry[]
}

export default function CategoryPodium({ id, name, description, type, entries }: CategoryPodiumProps) {
  const first = entries[0]
  const second = entries[1]
  const third = entries[2]

  // Calculate competitive gap (optional)
  const gap = first && second && typeof first.value === 'number' && typeof second.value === 'number'
    ? first.value - second.value
    : null

  const gapPercent = gap && typeof first.value === 'number' && typeof second.value === 'number'
    ? ((gap / second.value) * 100).toFixed(0)
    : null

  return (
    <div className="space-y-6">
      {/* Category Title */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-foreground">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Podium Layout */}
      <div className="grid grid-cols-3 gap-4 items-end min-h-[400px]">
        {/* #2 - Left Side */}
        <div className="mt-16">
          {second ? (
            <MedalCard
              rank={2}
              manager={second.manager}
              value={second.value}
              description={second.description}
              type={type}
              season={second.season}
            />
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              No data
            </div>
          )}
        </div>

        {/* #1 - Center, Highest */}
        <div className="mt-0">
          {first ? (
            <AvatarWidget
              manager={first.manager}
              value={first.value}
              description={first.description}
              type={type}
              season={first.season}
              showMedal={true}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* #3 - Right Side */}
        <div className="mt-16">
          {third ? (
            <MedalCard
              rank={3}
              manager={third.manager}
              value={third.value}
              description={third.description}
              type={type}
              season={third.season}
            />
          ) : (
            <div className="text-center text-muted-foreground text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Competitive Gap (subtle) */}
      {gap !== null && gap > 0 && gapPercent && Number(gapPercent) > 10 && (
        <div className="text-center text-xs text-muted-foreground">
          Leading by {typeof gap === 'number' ? gap.toFixed(1) : gap} ({gapPercent}% ahead)
        </div>
      )}
    </div>
  )
}

