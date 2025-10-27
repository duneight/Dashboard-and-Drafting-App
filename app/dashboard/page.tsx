'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TabNavigation } from '@/app/components/ui/TabNavigation'
import { SortableTable } from '@/app/components/ui/SortableTable'
import { ChartCard } from '@/app/components/ui/ChartCard'
import { RefreshButton } from '@/app/components/RefreshButton'
import { getManagerDisplayName } from '@/lib/avatars'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Trophy, Users, TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function DashboardPage() {
  const [mountCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const count = (window as any).__dashboardMountCount || 0
      ;(window as any).__dashboardMountCount = count + 1
      console.log(`🔄 Dashboard mounted ${count + 1} times`)
      return count + 1
    }
    return 1
  })
  
  const [activeTab, setActiveTab] = useState('rankings')
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [showAllLeaderboardColumns, setShowAllLeaderboardColumns] = useState(false)

  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2
  })

  // Set default season to most recent when data loads
  useEffect(() => {
    if (data?.seasons?.allSeasons && data.seasons.allSeasons.length > 0 && !selectedSeason) {
      const mostRecentSeason = data.seasons.allSeasons[0].season // Already sorted by desc
      setSelectedSeason(mostRecentSeason)
    }
  }, [data, selectedSeason])

  if (isLoading) {
    return (
      <div className="container mx-auto animate-fade-in px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto animate-fade-in px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Dashboard</h1>
          <p className="text-muted-foreground">Error loading data: {error?.message}</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'rankings', label: 'All Time' },
    { id: 'seasons', label: 'Season Deep Dive' },
    { id: 'h2h', label: 'Head-to-Head' },
    { id: 'trends', label: 'League Trends' },
  ]

  // ==================== TAB 1: MANAGER RANKINGS ====================
  const renderManagerRankings = () => {
    const { careerStats, winPercentageOverTime, leagueStats } = data.managerRankings

    // Calculate FLS (Fantasy League Stud) rating for each manager
    const calculateFLS = (manager: any) => {
      // Base score from win percentage (0-100 scale)
      const winPctScore = manager.winPercentage * 100
      
      // Championship bonus (major achievement)
      const championshipBonus = manager.championships * 15
      
      // Runner-up bonus (significant achievement)
      const runnerUpBonus = manager.runnerUps * 8
      
      // Third place bonus (good achievement)
      const thirdPlaceBonus = manager.thirdPlace * 5
      
      // Playoff consistency bonus (shows sustained success)
      const playoffBonus = manager.playoffAppearances * 2
      
      // Calculate total FLS
      const totalFLS = winPctScore + championshipBonus + runnerUpBonus + thirdPlaceBonus + 
                      playoffBonus
      
      return Math.round(totalFLS) // Round to whole number
    }

    // Calculate FLS for all managers and sort by it
    const managersWithFLS = careerStats.map((manager: any) => ({
      ...manager,
      fls: calculateFLS(manager)
    })).sort((a: any, b: any) => b.fls - a.fls)

    // Prepare win% over time chart data
    const seasons = Object.keys(winPercentageOverTime[Object.keys(winPercentageOverTime)[0]] || {}).sort()
    const managers = Object.keys(winPercentageOverTime)

    // Generate colors for each manager
    const colors = [
      'rgb(59, 130, 246)',   // blue
      'rgb(16, 185, 129)',   // green
      'rgb(245, 158, 11)',   // amber
      'rgb(239, 68, 68)',    // red
      'rgb(168, 85, 247)',   // purple
      'rgb(236, 72, 153)',   // pink
      'rgb(20, 184, 166)',   // teal
      'rgb(251, 146, 60)',   // orange
      'rgb(132, 204, 22)',   // lime
      'rgb(14, 165, 233)',   // sky
    ]

    const winPctChartData = {
      labels: seasons,
      datasets: managers.map((manager, idx) => ({
        label: getManagerDisplayName(manager),
        data: seasons.map(season => (winPercentageOverTime[manager][season] || 0) * 100),
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.3,
      }))
    }

    return (
      <div className="space-y-8">
        {/* Manager Leaderboard Table */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">All Time Leaderboard</h3>
            <button
              onClick={() => setShowAllLeaderboardColumns(!showAllLeaderboardColumns)}
              className="md:hidden px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {showAllLeaderboardColumns ? 'Show Less' : 'Show More'}
            </button>
          </div>
          <SortableTable
            showSearch={false}
            defaultSortColumn="rank"
            defaultSortDirection="asc"
            mobileColumns={['rank', 'manager', 'record', 'winPct', 'championships']}
            externalShowAllColumns={showAllLeaderboardColumns}
            data={managersWithFLS.map((manager: any, index: number) => ({
              rank: index + 1,
              fls: manager.fls,
              manager: getManagerDisplayName(manager.managerNickname),
              seasons: manager.seasonsPlayed,
              record: `${manager.totalWins}-${manager.totalLosses}${manager.totalTies > 0 ? `-${manager.totalTies}` : ''}`,
              winPct: `${(manager.winPercentage * 100).toFixed(1)}%`,
              pointsFor: Math.round(manager.totalPointsFor).toLocaleString(),
              avgPoints: Math.round(manager.avgPointsPerSeason).toLocaleString(),
              championships: manager.championships,
              runnerUps: manager.runnerUps,
              thirdPlace: manager.thirdPlace,
              playoffs: manager.playoffAppearances,
              bestFinish: manager.bestFinish || '-',
              moves: manager.totalMoves,
              trades: manager.totalTrades
            }))}
            columns={[
              { 
                key: 'rank', 
                label: 'Rank', 
                sortable: true,
                className: 'w-12',
                render: (value: number, row: any) => {
                  if (value === 1) {
                    return (
                      <span className="font-bold text-yellow-600">
                        #{value}
                      </span>
                    )
                  } else if (value === 2) {
                    return (
                      <span className="font-bold text-blue-400">
                        #{value}
                      </span>
                    )
                  } else if (value === 3) {
                    return (
                      <span className="font-bold text-orange-700">
                        #{value}
                      </span>
                    )
                  } else {
                    return (
                      <span className="font-bold">
                        #{value}
                      </span>
                    )
                  }
                }
              },
              { 
                key: 'manager', 
                label: 'Manager', 
                sortable: true, 
                tooltip: 'Manager name',
                className: 'w-20 lg:w-24',
                render: (value: string, row: any) => {
                  if (row.rank === 1) {
                    return (
                      <span className="font-bold text-yellow-600">
                        {value}
                      </span>
                    )
                  } else if (row.rank === 2) {
                    return (
                      <span className="font-bold text-blue-400">
                        {value}
                      </span>
                    )
                  } else if (row.rank === 3) {
                    return (
                      <span className="font-bold text-orange-700">
                        {value}
                      </span>
                    )
                  } else {
                    return (
                      <span className="font-bold">
                        {value}
                      </span>
                    )
                  }
                }
              },
              { 
                key: 'record', 
                label: 'Record', 
                sortable: true,
                className: 'w-16 lg:w-20',
                render: (value: string, row: any) => {
                  const winPctNum = parseFloat(row.winPct.replace('%', ''))
                  const maxWinPct = Math.max(...careerStats.map((m: any) => m.winPercentage * 100))
                  const isLeader = Math.abs(winPctNum - maxWinPct) < 0.1
                  return (
                    <span className={isLeader ? 'font-bold text-green-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'winPct', 
                label: 'Win %', 
                sortable: true,
                className: 'w-12 lg:w-16',
                render: (value: string, row: any) => {
                  const winPctNum = parseFloat(value.replace('%', ''))
                  const maxWinPct = Math.max(...careerStats.map((m: any) => m.winPercentage * 100))
                  const isLeader = Math.abs(winPctNum - maxWinPct) < 0.1
                  return (
                    <span className={isLeader ? 'font-bold text-green-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'pointsFor', 
                label: 'Points', 
                sortable: true,
                className: 'w-16 lg:w-20',
                render: (value: string, row: any) => {
                  const pointsNum = parseInt(value.replace(/,/g, ''))
                  const maxPoints = Math.max(...careerStats.map((m: any) => Math.round(m.totalPointsFor)))
                  const isLeader = pointsNum === maxPoints
                  return (
                    <span className={isLeader ? 'font-bold text-green-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'avgPoints', 
                label: 'Pts/Season', 
                sortable: true,
                className: 'w-16 lg:w-20',
                render: (value: string, row: any) => {
                  const avgPointsNum = parseInt(value.replace(/,/g, ''))
                  const maxAvgPoints = Math.max(...careerStats.map((m: any) => Math.round(m.avgPointsPerSeason)))
                  const isLeader = avgPointsNum === maxAvgPoints
                  return (
                    <span className={isLeader ? 'font-bold text-green-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { key: 'seasons', label: 'Seasons', sortable: true, className: 'w-12 lg:w-16' },
              { 
                key: 'championships', 
                label: '🏆', 
                sortable: true,
                className: 'w-8 lg:w-10',
                render: (value: number, row: any) => {
                  const maxChampionships = Math.max(...careerStats.map((m: any) => m.championships))
                  const isLeader = value === maxChampionships && value > 0
                  return (
                    <span className={isLeader ? 'font-bold text-yellow-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'runnerUps', 
                label: '🥈', 
                sortable: true,
                className: 'w-8 lg:w-10',
                render: (value: number, row: any) => {
                  const maxRunnerUps = Math.max(...careerStats.map((m: any) => m.runnerUps))
                  const isLeader = value === maxRunnerUps && value > 0
                  return (
                    <span className={isLeader ? 'font-bold text-blue-400' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'thirdPlace', 
                label: '🥉', 
                sortable: true,
                className: 'w-8 lg:w-10',
                render: (value: number, row: any) => {
                  const maxThirdPlace = Math.max(...careerStats.map((m: any) => m.thirdPlace))
                  const isLeader = value === maxThirdPlace && value > 0
                  return (
                    <span className={isLeader ? 'font-bold text-orange-700' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'playoffs', 
                label: 'Playoffs', 
                sortable: true,
                className: 'w-12 lg:w-16',
                render: (value: number, row: any) => {
                  const maxPlayoffs = Math.max(...careerStats.map((m: any) => m.playoffAppearances))
                  const isLeader = value === maxPlayoffs && value > 0
                  return (
                    <span className={isLeader ? 'font-bold text-purple-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'bestFinish', 
                label: 'Best Finish', 
                sortable: true,
                className: 'w-16 lg:w-20',
                render: (value: number | string, row: any) => {
                  if (value === '-' || value === 0) return value
                  const minBestFinish = Math.min(...careerStats.map((m: any) => m.bestFinish).filter((f: any) => f > 0))
                  const isLeader = value === minBestFinish
                  return (
                    <span className={isLeader ? 'font-bold text-yellow-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'moves', 
                label: 'Moves', 
                sortable: true,
                className: 'w-12 lg:w-16',
                render: (value: number, row: any) => {
                  const maxMoves = Math.max(...managersWithFLS.map((m: any) => m.totalMoves))
                  const isLeader = value === maxMoves && value > 0
                  return (
                    <span className={isLeader ? 'font-bold text-blue-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
              { 
                key: 'trades', 
                label: 'Trades', 
                sortable: true,
                className: 'w-12 lg:w-16',
                render: (value: number, row: any) => {
                  const maxTrades = Math.max(...managersWithFLS.map((m: any) => m.totalTrades))
                  const isLeader = value === maxTrades && value > 0
                  return (
                    <span className={isLeader ? 'font-bold text-purple-600' : ''}>
                      {value}
                    </span>
                  )
                }
              },
            ]}
          />
        </div>
      </div>
    )
  }

  // ==================== TAB 2: HEAD-TO-HEAD ====================
  const renderHeadToHead = () => {
    const { records, matrix, insights } = data.headToHead

    return (
      <div className="space-y-8">
        {/* H2H Records Table */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Head-to-Head Records</h3>
            <div className="relative w-48 md:hidden">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => {
                  const searchValue = e.target.value
                  const table = e.currentTarget.closest('.bg-card')
                  const rows = table?.querySelectorAll('tbody tr')
                  rows?.forEach(row => {
                    const text = row.textContent?.toLowerCase() || ''
                    if (text.includes(searchValue.toLowerCase())) {
                      (row as HTMLElement).style.display = ''
                    } else {
                      (row as HTMLElement).style.display = 'none'
                    }
                  })
                }}
              />
            </div>
          </div>
          <div className="hidden md:block mb-4">
            <div className="relative max-w-xs">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onChange={(e) => {
                  const searchValue = e.target.value
                  const table = e.currentTarget.closest('.bg-card')
                  const rows = table?.querySelectorAll('tbody tr')
                  rows?.forEach(row => {
                    const text = row.textContent?.toLowerCase() || ''
                    if (text.includes(searchValue.toLowerCase())) {
                      (row as HTMLElement).style.display = ''
                    } else {
                      (row as HTMLElement).style.display = 'none'
                    }
                  })
                }}
              />
            </div>
          </div>
          <SortableTable
            showSearch={false}
            data={records
              .map((record: any) => {
                const totalGames = record.totalGames
                const manager1WinPct = totalGames > 0 ? (record.manager1Wins + record.ties * 0.5) / totalGames : 0
                const manager2WinPct = totalGames > 0 ? (record.manager2Wins + record.ties * 0.5) / totalGames : 0
                
                // Determine winner
                let winner = ''
                if (manager1WinPct > manager2WinPct) {
                  winner = `${getManagerDisplayName(record.manager1)} (${(manager1WinPct * 100).toFixed(1)}%)`
                } else if (manager2WinPct > manager1WinPct) {
                  winner = `${getManagerDisplayName(record.manager2)} (${(manager2WinPct * 100).toFixed(1)}%)`
                } else {
                  winner = 'Tied'
                }

                return {
                  matchup: `${getManagerDisplayName(record.manager1)} vs ${getManagerDisplayName(record.manager2)}`,
                  totalGames: record.totalGames,
                  record: `${record.manager1Wins}-${record.manager2Wins}${record.ties > 0 ? `-${record.ties}` : ''}`,
                  winner: winner,
                  winnerSortValue: manager1WinPct > manager2WinPct ? manager1WinPct : manager2WinPct, // For sorting
                  biggestBlowout: record.biggestBlowout ? `${record.biggestBlowout.margin.toFixed(1)} pts` : '-',
                }
              })
              .sort((a: any, b: any) => {
                // Sort by competitiveness (most competitive first), then by total games
                const competitivenessA = Math.abs(a.winnerSortValue - 0.5)
                const competitivenessB = Math.abs(b.winnerSortValue - 0.5)
                if (Math.abs(competitivenessA - competitivenessB) < 0.01) {
                  return b.totalGames - a.totalGames
                }
                return competitivenessA - competitivenessB
              })
            }
            columns={[
              { key: 'matchup', label: 'Matchup', sortable: true, className: 'w-32 lg:w-40' },
              { key: 'totalGames', label: 'Games', sortable: true, className: 'w-12 lg:w-16' },
              { key: 'record', label: 'Record', sortable: false, className: 'w-16 lg:w-20' },
              { key: 'winnerSortValue', label: 'Winner', sortable: true, className: 'w-24 lg:w-32', render: (value: any, row: any) => row.winner },
              { key: 'biggestBlowout', label: 'Biggest Blowout', sortable: true, className: 'w-20 lg:w-24' },
            ]}
          />
        </div>
      </div>
    )
  }

  // ==================== TAB 3: SEASON DEEP DIVE ====================
  const renderSeasons = () => {
    const { allSeasons, weeklyScoresBySeason } = data.seasons
    const selectedSeasonData = allSeasons.find((s: any) => s.season === selectedSeason)

    return (
      <div className="space-y-8">
        {/* Season Overview */}
        {selectedSeasonData ? (
          <div className="space-y-6">
            {/* Standings */}
            <div className="bg-card rounded-xl border shadow-sm p-6">
              {/* Season Selector and Title */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedSeasonData.isFinished ? 'Final Standings' : 'Current Standings'}
                  </h3>
                  
                  {/* Mobile: Left/Right Navigation on Title Line */}
                  <div className="md:hidden flex items-center gap-2">
                    <span className="text-sm font-semibold mr-2">{selectedSeason}</span>
                    <button
                      onClick={() => {
                        const currentIndex = allSeasons.findIndex((s: any) => s.season === selectedSeason)
                        if (currentIndex > 0) {
                          setSelectedSeason(allSeasons[currentIndex - 1].season)
                        }
                      }}
                      disabled={allSeasons.findIndex((s: any) => s.season === selectedSeason) === 0}
                      className="px-2 py-1 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => {
                        const currentIndex = allSeasons.findIndex((s: any) => s.season === selectedSeason)
                        if (currentIndex < allSeasons.length - 1) {
                          setSelectedSeason(allSeasons[currentIndex + 1].season)
                        }
                      }}
                      disabled={allSeasons.findIndex((s: any) => s.season === selectedSeason) === allSeasons.length - 1}
                      className="px-2 py-1 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Desktop: All Year Buttons */}
                <div className="hidden md:flex flex-wrap gap-2">
                  {allSeasons.map((season: any) => (
                    <button
                      key={season.season}
                      onClick={() => setSelectedSeason(season.season)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedSeason === season.season
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {season.season}
                    </button>
                  ))}
                </div>
              </div>
              <SortableTable
                showSearch={false}
                defaultSortColumn="rank"
                defaultSortDirection="asc"
                data={selectedSeasonData.standings.map((team: any) => ({
                  rank: team.rank || '-',
                  manager: getManagerDisplayName(team.manager),
                  team: team.name,
                  record: `${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ''}`,
                  winPct: `${(team.winPercentage * 100).toFixed(1)}%`,
                  pointsFor: Math.round(team.pointsFor).toLocaleString(),
                  pointsAgainst: Math.round(team.pointsAgainst).toLocaleString(),
                  playoff: selectedSeasonData.isFinished && team.rank && team.rank <= 6 ? '✓' : '-'
                }))}
                columns={[
                  { key: 'rank', label: '#', sortable: true, className: 'w-8 lg:w-10' },
                  { 
                    key: 'manager', 
                    label: 'Manager', 
                    sortable: true,
                    className: 'w-20 lg:w-24',
                    render: (value: string, row: any) => {
                      // Only show highlighting for finished seasons
                      if (selectedSeasonData.isFinished) {
                        if (row.rank === 1) {
                          return (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-yellow-500" />
                              <span className="font-black text-yellow-600">{value}</span>
                            </div>
                          )
                        } else if (row.rank === 2) {
                          return (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-blue-400" />
                              <span className="font-extrabold text-blue-400">{value}</span>
                            </div>
                          )
                        } else if (row.rank === 3) {
                          return (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-5 w-5 text-orange-700" />
                              <span className="font-bold text-orange-700">{value}</span>
                            </div>
                          )
                        }
                      }
                      // For unfinished seasons or ranks 4+, just show regular bold text
                      return <span className="font-bold">{value}</span>
                    }
                  },
                  { key: 'record', label: 'Record', sortable: false, className: 'w-16 lg:w-20' },
                  { key: 'winPct', label: 'Win %', sortable: true, className: 'w-12 lg:w-16' },
                  { key: 'pointsFor', label: 'PF', sortable: true, className: 'w-12 lg:w-16' },
                  { key: 'pointsAgainst', label: 'PA', sortable: true, className: 'w-12 lg:w-16' },
                  { key: 'playoff', label: 'Playoffs', sortable: false, className: 'hidden md:table-cell w-12 lg:w-16' },
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading season data...</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==================== TAB 4: LEAGUE TRENDS ====================
  const renderLeagueTrends = () => {
    // Add defensive check for trends data
    if (!data.trends) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading league trends...</p>
          </div>
        </div>
      )
    }

    const {
      competitiveness,
      championshipPatterns,
      scoringTrends,
      managerPatterns,
      transactionAnalysis,
      advancedMetrics,
      currentSeason
    } = data.trends

    return (
      <div className="space-y-12">
        {/* Section 1: Manager Performance Patterns */}
        <div>
          {managerPatterns?.regularVsPlayoff && managerPatterns.regularVsPlayoff.length > 0 ? (
            <ChartCard title="Clutch Factor (Playoff vs Regular Season)">
              <Bar
                data={{
                  labels: managerPatterns.regularVsPlayoff.slice(0, 10).map((m: any) => getManagerDisplayName(m.manager)),
                  datasets: [{
                    label: 'Clutch Factor',
                    data: managerPatterns.regularVsPlayoff.slice(0, 10).map((m: any) => (m.clutchFactor * 100).toFixed(1)),
                    backgroundColor: managerPatterns.regularVsPlayoff.slice(0, 10).map((m: any) => 
                      m.clutchFactor > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                    ),
                    borderColor: managerPatterns.regularVsPlayoff.slice(0, 10).map((m: any) => 
                      m.clutchFactor > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                    ),
                    borderWidth: 1,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed.y || 0
                          return `${value > 0 ? '+' : ''}${value}% vs regular season`
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: { callback: (value) => `${value}%` },
                      title: { display: true, text: 'Playoff Win% - Regular Season Win%' }
                    }
                  }
                }}
              />
            </ChartCard>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <p className="text-muted-foreground">Clutch factor data not available</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          </div>

        </div>

        {/* Section 2: Transaction Analysis */}
        <div>
          {transactionAnalysis && transactionAnalysis.length > 0 ? (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Total Moves vs Win Percentage</h3>
              <SortableTable
                data={transactionAnalysis.map((m: any) => ({
                  manager: getManagerDisplayName(m.manager),
                  transactions: m.totalTransactions,
                  moves: m.totalMoves,
                  trades: m.totalTrades,
                  winPct: `${(m.winPct * 100).toFixed(1)}%`,
                  championships: m.championships
                }))}
                columns={[
                  { key: 'manager', label: 'Manager', className: 'w-20 lg:w-24' },
                  { key: 'transactions', label: 'Total Moves', className: 'w-16 lg:w-20' },
                  { key: 'moves', label: 'Waivers', className: 'w-12 lg:w-16' },
                  { key: 'trades', label: 'Trades', className: 'w-12 lg:w-16' },
                  { key: 'winPct', label: 'Win%', className: 'w-12 lg:w-16' },
                  { key: 'championships', label: 'Titles', className: 'w-12 lg:w-16' }
                ]}
                showSearch={false}
              />
            </div>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <p className="text-muted-foreground">Transaction analysis data not available</p>
            </div>
          )}
        </div>

        {/* Section 3: Advanced Analytics */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {advancedMetrics?.luckIndex && advancedMetrics.luckIndex.length > 0 ? (
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Luck Index</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Difference between actual wins and expected wins based on points scored
                </p>
                <SortableTable
                  data={advancedMetrics.luckIndex.map((m: any) => ({
                    manager: getManagerDisplayName(m.manager),
                    actual: m.actualWins,
                    expected: m.expectedWins,
                    differential: `${m.luckDifferential > 0 ? '+' : ''}${m.luckDifferential}`,
                    status: m.luckDifferential >= 6 ? '🌟 Blessed' :
                            m.luckDifferential >= 3 ? '🍀 Lucky' :
                            m.luckDifferential <= -10 ? '💀 Cursed' :
                            m.luckDifferential <= -3 ? '😢 Unlucky' : '🎯 Expected'
                  }))}
                  columns={[
                    { key: 'manager', label: 'Manager', className: 'w-20 lg:w-24' },
                    { key: 'actual', label: 'Actual', className: 'w-12 lg:w-16' },
                    { key: 'expected', label: 'Expected', className: 'w-12 lg:w-16' },
                    { key: 'differential', label: 'Diff', className: 'w-12 lg:w-16' },
                    { key: 'status', label: 'Status', className: 'w-16 lg:w-20' }
                  ]}
                  showSearch={false}
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <p className="text-muted-foreground">Luck index data not available</p>
              </div>
            )}

            {advancedMetrics?.closeGamePerformance && advancedMetrics.closeGamePerformance.length > 0 ? (
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Close Game Specialists</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Win percentage in games decided by less than 10 points
                </p>
                <SortableTable
                  data={advancedMetrics.closeGamePerformance.map((m: any) => ({
                    manager: getManagerDisplayName(m.manager),
                    closeGames: m.closeGames,
                    wins: m.closeGameWins,
                    winPct: `${(m.closeGameWinPct * 100).toFixed(1)}%`
                  }))}
                  columns={[
                    { key: 'manager', label: 'Manager', className: 'w-20 lg:w-24' },
                    { key: 'closeGames', label: 'Close Games', className: 'w-16 lg:w-20' },
                    { key: 'wins', label: 'Wins', className: 'w-12 lg:w-16' },
                    { key: 'winPct', label: 'Win%', className: 'w-12 lg:w-16' }
                  ]}
                  showSearch={false}
                />
              </div>
            ) : (
              <div className="bg-card rounded-xl border shadow-sm p-6">
                <p className="text-muted-foreground">Close game performance data not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      {/* Tab Navigation */}
      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} showLabelsOnMobile={true} />

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'rankings' && renderManagerRankings()}
        {activeTab === 'seasons' && renderSeasons()}
        {activeTab === 'h2h' && renderHeadToHead()}
        {activeTab === 'trends' && renderLeagueTrends()}
      </div>
    </div>
  )
}
