'use client'

import { Trophy, Skull, Users, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

interface ChampionshipsData {
  success: boolean
  data: {
    totalChampionships: number
    uniqueChampions: number
    champions: string[]
  }
}

export default function HomePage() {
  const currentYear = new Date().getFullYear()
  const queryClient = useQueryClient()
  const [showStats, setShowStats] = useState(false)
  
  const { data: championshipsData, isLoading: championshipsLoading } = useQuery<ChampionshipsData>({
    queryKey: ['championships'],
    queryFn: async () => {
      const response = await fetch('/api/stats/championships')
      if (!response.ok) {
        throw new Error('Failed to fetch championships data')
      }
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // 1 hour (consistent with other queries)
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2
  })
  
  // Prefetch dashboard ONLY after championships loads (ensures championships appears first)
  useEffect(() => {
    if (championshipsData) {
      console.log('🚀 Championships loaded, starting dashboard prefetch...')
      
      queryClient.prefetchQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
          console.log('Prefetching dashboard...')
          const res = await fetch('/api/dashboard')
          if (!res.ok) throw new Error('Failed to prefetch dashboard')
          return res.json()
        },
        staleTime: 60 * 60 * 1000, // 1 hour (same as page component)
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
      })
      
      console.log('✅ Dashboard prefetch initiated')
    }
  }, [championshipsData, queryClient])

  // Trigger stats animation when championships data loads
  useEffect(() => {
    if (championshipsData && !championshipsLoading) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowStats(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [championshipsData, championshipsLoading])

  const championshipCount = championshipsData?.data?.uniqueChampions
  
  return (
    <div className="relative bg-background">
      {/* soft vignette + subtle gradient */}
      <div className="absolute inset-0 -z-10 hero-gradient" />
      
      <div className="container mx-auto px-4 py-4">
        {/* Hero Section */}
        <div className="hero-section relative mb-16">
          {/* Group Photo */}
          <div className="max-w-5xl mx-auto mb-0">
              <img 
                src="/images/backgrounds/hero/group_photo.png" 
                alt="Etobicoke Boys Keeper League - The Team" 
                className="w-full h-auto"
                style={{ maxHeight: '350px', objectFit: 'contain' }}
              />
          </div>

          {/* Title */}
          <div className="-mt-20 relative z-10">
            <div className="text-center">
              <h1 className="text-7xl font-extrabold tracking-tight sm:text-8xl md:text-8xl lg:text-8xl mb-2 pb-2">
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-extrabold drop-shadow-lg" style={{ 
                  lineHeight: '1.3'
                }}>Keeper Tight</span>
              </h1>
              <p className="text-xl text-white max-w-2xl mx-auto leading-relaxed mb-12 drop-shadow-md">
                Where Derek's couch is sacred ground since 2015.
              </p>
            </div>
          </div>
        </div>

        {/* League Stats */}
        <div className="max-w-4xl mx-auto -mt-12 hidden md:block">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <StatCard
              icon={<Users className="h-12 w-12 text-primary" />}
              label="Guys"
              value="10"
              description=""
              delay={200}
              show={showStats}
            />
            <StatCard
              icon={<Trophy className="h-12 w-12 text-warning" />}
              label="Champions"
              value={championshipCount ? championshipCount.toString() : ""}
              description=""
              delay={200}
              show={showStats}
              isLoading={championshipsLoading}
            />
            <StatCard
              icon={<Skull className="h-12 w-12 text-destructive" />}
              label="Sneezes"
              value="Infinite"
              description=""
              delay={200}
              show={showStats}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat card component with animation
function StatCard({ icon, label, value, description, delay = 0, show = false, isLoading = false }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  description: string;
  delay?: number;
  show?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div 
      className={`text-center group transition-all duration-1000 ease-out ${
        show 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
      style={{ 
        transitionDelay: show ? `${delay}ms` : '0ms'
      }}
    >
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-200">
        {icon}
      </div>
      <div className="text-4xl font-bold text-foreground mb-3 min-h-[3rem] flex items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse bg-muted rounded w-16 h-12"></div>
        ) : (
          value
        )}
      </div>
      <div className="text-lg font-semibold text-foreground mb-2">{label}</div>
      <div className="text-base text-muted-foreground">{description}</div>
    </div>
  )
}
