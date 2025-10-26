'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered stale after 1 hour
        staleTime: 60 * 60 * 1000,
        // Keep data in cache for 24 hours
        gcTime: 24 * 60 * 60 * 1000,
        // Retry failed requests 2 times
        retry: 2,
        // Don't refetch on window focus for better UX
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect to reduce server load
        refetchOnReconnect: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
