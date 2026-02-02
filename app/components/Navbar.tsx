'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useDraftNavbar } from './DraftNavbarProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

// Static array outside component to avoid recreation
const navLinks = [
  { href: '/dashboard', label: 'Stats' },
  { href: '/hall-of-fame', label: 'Hall of Fame' },
  { href: '/wall-of-shame', label: 'Wall of Shame' },
  { href: '/draft', label: 'Draft Hub' },
]

export function Navbar() {
  const pathname = usePathname()
  const { draftProgress, onReset } = useDraftNavbar()
  const queryClient = useQueryClient()

  // Debounce refs to prevent prefetch spam
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoized prefetch with debounce and cache check
  const prefetchRoute = useCallback((route: 'hall-of-fame' | 'wall-of-shame') => {
    // Clear any pending prefetch
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
    }

    // Debounce prefetch by 150ms
    prefetchTimeoutRef.current = setTimeout(() => {
      const queryKey = [route]

      // Only prefetch if data isn't already cached
      const cachedData = queryClient.getQueryData(queryKey)
      if (cachedData) return

      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const res = await fetch(`/api/stats/${route}`)
          if (!res.ok) throw new Error(`Failed to prefetch ${route}`)
          return res.json()
        },
        staleTime: 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
      })
    }, 150)
  }, [queryClient])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 ml-4 flex items-center">
          <Home className="h-6 w-6 text-accent hover:text-accent/80 transition-colors" />
        </Link>
        <nav className="flex items-center gap-4 text-sm lg:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative transition-colors hover:text-foreground/80 ${
                pathname === link.href 
                  ? 'text-foreground font-semibold' 
                  : 'text-foreground/60'
              }`}
              onMouseEnter={() => {
                // Prefetch on hover (debounced, only if not cached)
                if (link.href === '/hall-of-fame') {
                  prefetchRoute('hall-of-fame')
                } else if (link.href === '/wall-of-shame') {
                  prefetchRoute('wall-of-shame')
                }
              }}
            >
              {link.label}
              {pathname === link.href && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>
        
        {/* Draft Progress - Only show on draft page */}
        {pathname === '/draft' && draftProgress && (
          <div className="hidden md:flex items-center gap-4 ml-auto mr-4">
            {/* Draft Progress */}
            <div className="text-sm text-muted-foreground">
              Draft Progress: {draftProgress.picks} of {draftProgress.total} picks
            </div>
            
            {/* Progress Bar */}
            <div className="w-48">
              <div className="bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${draftProgress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-center">
                {draftProgress.percentage}% Complete
              </div>
            </div>
            
            {/* Reset Button */}
            {onReset && (
              <button
                onClick={onReset}
                className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm"
              >
                Reset Draft
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
