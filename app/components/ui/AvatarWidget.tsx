import { ReactNode } from 'react'
import { Crown, ThumbsDown, User } from 'lucide-react'

interface AvatarWidgetProps {
  type: 'fame' | 'shame'
  manager: string
  team?: string
  category?: string
  season?: string
  value?: string | number
  description?: string
  avatarUrl?: string
  className?: string
  showMedal?: boolean
}

export default function AvatarWidget({ 
  type, 
  manager, 
  team, 
  category, 
  season, 
  value,
  description,
  avatarUrl,
  className = '',
  showMedal = false
}: AvatarWidgetProps) {
  const isFame = type === 'fame'
  
  // Color schemes for badge styling
  const badgeGradient = isFame 
    ? 'from-amber-400 via-yellow-500 to-amber-600' 
    : 'from-red-400 via-rose-500 to-red-600'
  
  const ringColor = isFame ? 'ring-amber-300' : 'ring-red-300'
  const shadowColor = isFame ? 'shadow-amber-500/50' : 'shadow-red-500/50'
  const textColor = isFame ? 'text-amber-900' : 'text-red-900'
  
  const IconComponent = isFame ? Crown : ThumbsDown

  return (
    <div className={`group flex flex-col items-center ${className}`}>
      {/* Achievement Title Above Badge (only if category provided) */}
      {category && (
        <div className="mb-4 text-center">
          <h1 className={`text-3xl font-black tracking-wide ${isFame ? 'text-amber-800 dark:text-amber-400' : 'text-red-800 dark:text-red-400'}`}>
            {category}
          </h1>
        </div>
      )}

      {/* Circular Badge Container */}
      <div className="relative">
        {/* Main Circle with Avatar */}
        <div className={`relative w-64 h-64 rounded-full bg-gradient-to-br ${badgeGradient} p-2 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl ${shadowColor} ring-4 ${ringColor}`}>
          {/* Inner Circle - Avatar Area */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={manager}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                <User className="h-32 w-32 text-slate-500 dark:text-slate-400" />
              </div>
            )}
            
            {/* Stylized Banner at Bottom */}
            <div className={`absolute inset-x-0 bottom-0 ${isFame ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600' : 'bg-gradient-to-r from-red-600 via-red-500 to-red-600'} shadow-2xl`}>
              {/* Banner Content */}
              <div className="p-4 text-center text-white">
                {/* Manager Name */}
                <h2 className="text-xl font-bold mb-2 leading-tight tracking-wide">{manager || 'Unknown'}</h2>
                
                {/* Value Display */}
                <div className="text-2xl font-black mb-1">
                  {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
                </div>

                {/* Description Badge */}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${isFame ? 'bg-yellow-300 text-amber-900' : 'bg-red-300 text-red-900'} shadow-lg border border-white/20`}>
                  {description || (season ? `${season}` : 'Record')}
                </div>
              </div>
              
              {/* Banner Decorative Elements */}
              <div className="absolute -left-2 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-current opacity-30 rounded-l-full"></div>
              <div className="absolute -right-2 top-0 bottom-0 w-4 bg-gradient-to-l from-transparent to-current opacity-30 rounded-r-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Named export for backward compatibility
export { AvatarWidget }
