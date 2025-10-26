'use client'

import { useState } from 'react'
import { RefreshCw, Clock } from 'lucide-react'

interface RefreshButtonProps {
  onRefresh: () => void
  isLoading?: boolean
  lastUpdated?: Date | string
  className?: string
}

export function RefreshButton({ 
  onRefresh, 
  isLoading = false, 
  lastUpdated,
  className = '' 
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatLastUpdated = (date: Date | string | undefined) => {
    if (!date) return 'Never'
    
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return dateObj.toLocaleDateString()
  }

  const isDisabled = isLoading || isRefreshing

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Updated {formatLastUpdated(lastUpdated)}</span>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all
          ${isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }
        `}
        title={isDisabled ? 'Refreshing...' : 'Refresh data'}
      >
        <RefreshCw 
          className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        <span className="hidden sm:inline">
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </span>
      </button>
    </div>
  )
}
