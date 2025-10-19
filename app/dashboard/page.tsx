'use client'

import { useState } from 'react'
import { Calendar, Shield, Swords, Trophy, BarChart, Users, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { staticLeagueData } from '../../lib/staticData'
import { TabNavigation } from '../components/ui/TabNavigation'
import { SortableTable } from '../components/ui/SortableTable'
import { MetricCard } from '../components/ui/MetricCard'
import { ChartCard } from '../components/ui/ChartCard'
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
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardPage() {
  const { league, teams, recentMatchups, stats } = staticLeagueData
  const [activeTab, setActiveTab] = useState('overview')
  
  // Get current season year
  const currentYear = new Date().getFullYear()

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart className="h-4 w-4" /> },
    { id: 'teams', label: 'Team Analysis', icon: <Users className="h-4 w-4" /> },
    { id: 'matchups', label: 'Matchup History', icon: <Swords className="h-4 w-4" /> },
  ]

  // Chart data for season performance
  const performanceData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Wins',
        data: [1, 2, 3, 4, 5, 6, 7, 8],
        borderColor: '#00d4aa',
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
      },
      {
        label: 'Losses',
        data: [0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
      },
    ],
  }

  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ffffff' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      }
    }
  }

  // Chart data for team comparison
  const teamComparisonData = {
    labels: teams.slice(0, 5).map(team => team.name),
    datasets: [
      {
        label: 'Points For',
        data: teams.slice(0, 5).map(team => team.pointsFor),
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 1,
      },
    ],
  }

  const teamComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ffffff' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      },
      x: {
        ticks: { 
          color: '#9ca3af',
          maxRotation: 45
        },
        grid: { color: '#374151' }
      }
    }
  }

  // Table columns for team analysis
  const teamColumns = [
    { key: 'rank', label: 'Rank', sortable: true },
    { key: 'name', label: 'Team Name', sortable: true, filterable: true, filterType: 'text' as const },
    { key: 'managerNickname', label: 'Manager', sortable: true, filterable: true, filterType: 'text' as const },
    { 
      key: 'record', 
      label: 'Record', 
      sortable: false,
      render: (value: any, row: any) => `${row.wins}-${row.losses}-${row.ties}`
    },
    { key: 'pointsFor', label: 'Points For', sortable: true, filterable: true, filterType: 'number' as const },
    { 
      key: 'winPercentage', 
      label: 'Win %', 
      sortable: true,
      render: (value: number) => `${Math.round(value * 100)}%`
    },
    { 
      key: 'streak', 
      label: 'Streak', 
      sortable: false,
      render: () => 'W2' // Mock data
    },
  ]

  // Table columns for matchup history
  const matchupColumns = [
    { key: 'week', label: 'Week', sortable: true, filterable: true, filterType: 'number' as const },
    { key: 'season', label: 'Season', sortable: true, filterable: true, filterType: 'select' as const, filterOptions: [
      { value: '2022-23', label: '2022-23' },
      { value: '2021-22', label: '2021-22' },
      { value: '2020-21', label: '2020-21' }
    ]},
    { key: 'homeTeam', label: 'Home Team', sortable: true, filterable: true, filterType: 'text' as const },
    { key: 'awayTeam', label: 'Away Team', sortable: true, filterable: true, filterType: 'text' as const },
    { 
      key: 'score', 
      label: 'Score', 
      sortable: false,
      render: (value: any, row: any) => `${row.homeTeamPoints} - ${row.awayTeamPoints}`
    },
    { key: 'winner', label: 'Winner', sortable: true, filterable: true, filterType: 'text' as const },
    { 
      key: 'isPlayoffs', 
      label: 'Type', 
      sortable: true, filterable: true, filterType: 'select' as const, filterOptions: [
        { value: 'true', label: 'Playoffs' },
        { value: 'false', label: 'Regular Season' }
      ],
      render: (value: boolean) => value ? 'Playoffs' : 'Regular'
    },
  ]

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          icon={<Trophy className="text-warning" />} 
          label="Current Season" 
          value={stats.currentSeason}
          trend={{ value: 5, direction: 'up' }}
        />
        <MetricCard 
          icon={<Calendar className="text-primary" />} 
          label="Total Seasons" 
          value={stats.totalSeasons}
        />
        <MetricCard 
          icon={<Shield className="text-accent" />} 
          label="Active Teams" 
          value={stats.totalTeams}
        />
        <MetricCard 
          icon={<Swords className="text-destructive" />} 
          label="Total Matchups" 
          value={stats.totalMatchups}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Season Performance Chart */}
        <ChartCard title="Season Performance Trend">
          <Line data={performanceData} options={performanceOptions} />
        </ChartCard>

        {/* Team Comparison Chart */}
        <ChartCard title="Top 5 Teams - Points Comparison">
          <Bar data={teamComparisonData} options={teamComparisonOptions} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Current Season Standings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Season Standings</h2>
            <span className="text-sm text-muted-foreground">
              {league.name} ({league.season})
            </span>
          </div>
          
          <div className="space-y-2">
            {teams.slice(0, 8).map((team: any) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-primary">#{team.rank}</span>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.managerNickname}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{team.wins}-{team.losses}-{team.ties}</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(team.winPercentage * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matchups */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Matchups</h2>
          
          <div className="space-y-3">
            {recentMatchups.slice(0, 5).map((matchup: any) => (
              <div key={matchup.id} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Week {matchup.week} • {matchup.season}
                  </span>
                  <span className="text-sm font-medium">
                    {matchup.isPlayoffs ? 'Playoffs' : 'Regular Season'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{matchup.homeTeam}</p>
                    <p className="text-sm text-muted-foreground">
                      {matchup.homeTeamPoints} pts
                    </p>
                  </div>
                  <div className="mx-4 text-muted-foreground">vs</div>
                  <div className="flex-1 text-right">
                    <p className="font-medium">{matchup.awayTeam}</p>
                    <p className="text-sm text-muted-foreground">
                      {matchup.awayTeamPoints} pts
                    </p>
                  </div>
                </div>
                <p className="text-sm text-primary mt-2">
                  Winner: {matchup.winner}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTeamsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Analysis</h2>
        <div className="text-sm text-muted-foreground">
          Filter and sort team data to find insights
        </div>
      </div>
      
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <SortableTable 
          data={teams} 
          columns={teamColumns} 
          searchPlaceholder="Search teams or managers..."
        />
      </div>
    </div>
  )

  const renderMatchupsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Matchup History</h2>
        <div className="text-sm text-muted-foreground">
          Explore historical matchups and trends
        </div>
      </div>
      
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <SortableTable 
          data={recentMatchups} 
          columns={matchupColumns}
          searchPlaceholder="Search teams or winners..."
        />
      </div>
    </div>
  )

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{currentYear} Season</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your command center for the current season.
        </p>
      </div>

      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
        {activeTab === 'overview' && renderOverviewTab()}
      </div>
      <div className={`tab-content ${activeTab === 'teams' ? 'active' : ''}`}>
        {activeTab === 'teams' && renderTeamsTab()}
      </div>
      <div className={`tab-content ${activeTab === 'matchups' ? 'active' : ''}`}>
        {activeTab === 'matchups' && renderMatchupsTab()}
      </div>
    </div>
  )
}