'use client'

interface MedalCardProps {
  rank: 2 | 3
  manager: string
  value: number | string
  description: string
  type: 'fame' | 'shame'
  season?: string
}

export default function MedalCard({ rank, manager, value, description, type, season }: MedalCardProps) {
  const medalColor = rank === 2 
    ? 'from-slate-300 to-slate-500' 
    : 'from-amber-600 to-orange-700'
  
  const bgColor = type === 'fame'
    ? 'from-amber-50 via-yellow-100 to-amber-200 dark:from-amber-950 dark:via-amber-900 dark:to-amber-800'
    : 'from-slate-50 via-gray-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800'

  // Medal sizes: Silver (15% smaller than gold), Bronze (30% smaller than gold)
  const medalSize = rank === 2 ? 'w-30 h-30' : 'w-25 h-25'

  return (
    <div className="flex flex-col items-center">
      {/* Medal Circle */}
      <div className={`
        relative
        ${medalSize}
        rounded-full
        bg-gradient-to-br ${medalColor}
        flex items-center justify-center
        shadow-lg
        border-4 border-background
      `}>
      </div>

      {/* Info Card */}
      <div className={`
        mt-4
        w-full
        p-4
        rounded-lg
        bg-gradient-to-br ${bgColor}
        border border-border/50
        shadow-sm
        text-center
      `}>
        {/* Rank Badge */}
        <div className="text-sm font-bold text-muted-foreground mb-1">
          #{rank}
        </div>

        {/* Manager Name */}
        <div className="text-lg font-bold text-foreground mb-1 truncate">
          {manager || 'Unknown'}
        </div>

        {/* Value */}
        <div className="text-2xl font-black text-foreground mb-1">
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        </div>

        {/* Description */}
        <div className="text-xs text-muted-foreground leading-tight">
          {description}
        </div>

        {/* Season (if applicable) */}
        {season && (
          <div className="text-xs font-semibold text-foreground/70 mt-2">
            {season}
          </div>
        )}
      </div>
    </div>
  )
}

