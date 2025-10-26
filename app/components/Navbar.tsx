'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useDraftNavbar } from './DraftNavbarProvider'
import { useQueryClient } from '@tanstack/react-query'

export function Navbar() {
  const pathname = usePathname()
  const { draftProgress, onReset } = useDraftNavbar()
  const queryClient = useQueryClient()
  
  // Get current season year
  const currentYear = new Date().getFullYear()

  const navLinks = [
    { href: '/dashboard', label: 'Stats' },
    { href: '/hall-of-fame', label: 'Hall of Fame' },
    { href: '/wall-of-shame', label: 'Wall of Shame' },
    { href: '/draft', label: 'Draft Hub' },
  ]

  // Prefetch functions for hover-based loading
  const prefetchHallOfFame = () => {
    queryClient.prefetchQuery({
      queryKey: ['hall-of-fame'],
      queryFn: async () => {
        const res = await fetch('/api/stats/hall-of-fame')
        if (!res.ok) throw new Error('Failed to prefetch hall of fame')
        return res.json()
      },
      staleTime: 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    })
  }

  const prefetchWallOfShame = () => {
    queryClient.prefetchQuery({
      queryKey: ['wall-of-shame'],
      queryFn: async () => {
        const res = await fetch('/api/stats/wall-of-shame')
        if (!res.ok) throw new Error('Failed to prefetch wall of shame')
        return res.json()
      },
      staleTime: 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    })
  }

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
                // Prefetch on hover for hall-of-fame and wall-of-shame
                if (link.href === '/hall-of-fame') {
                  prefetchHallOfFame()
                } else if (link.href === '/wall-of-shame') {
                  prefetchWallOfShame()
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
          <div className="flex items-center gap-4 ml-auto mr-4">
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
