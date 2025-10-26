'use client'

import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

export function DevRefreshButton() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Invalidate all queries to force refresh
      await queryClient.invalidateQueries()
      console.log('🔄 All data refreshed')
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="group opacity-20 hover:opacity-100 transition-opacity duration-200 bg-card border border-border rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-accent/10 transition-all duration-200"
        title="Dev Mode: Refresh All Data"
      >
        <RefreshCw 
          className={`h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors ${
            isRefreshing ? 'animate-spin' : ''
          }`} 
        />
      </button>
    </div>
  )
}
