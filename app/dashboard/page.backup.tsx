// import { prisma } from '@/lib/db/prisma' // Commented out until prisma is set up
import Link from 'next/link'
import { Calendar, Shield, Swords, Trophy } from 'lucide-react'

export default function DashboardPage() {
  // TODO: Replace with actual database queries when prisma is set up
  const currentSeason: any = null
  const recentMatchups: any[] = []
  const leagueStats: any[] = []
  const totalTeams = 0
  const totalMatchups = 0

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your command center for the current season.
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Trophy className="text-warning" />} label="Current Season" value={currentSeason?.season || 'N/A'} />
        <StatCard icon={<Calendar className="text-primary" />} label="Total Seasons" value={leagueStats.length} />
        <StatCard icon={<Shield className="text-accent" />} label="Active Teams" value={totalTeams} />
        <StatCard icon={<Swords className="text-destructive" />} label="Total Matchups" value={totalMatchups} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Current Season Standings */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Season Standings</h2>
            {currentSeason && (
              <span className="text-sm text-muted-foreground">
                {currentSeason.name} ({currentSeason.season})
              </span>
            )}
          </div>
          
          {currentSeason && currentSeason.teams.length > 0 ? (
            <div className="space-y-2">
              {currentSeason?.teams?.map((team: any, index: number) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-primary">#{team.rank}</span>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      {team.managerNickname && (
                        <p className="text-sm text-muted-foreground">
                          {team.managerNickname}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{team.wins}-{team.losses}-{team.ties}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((team.winPercentage || 0) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No current season data available</p>
            </div>
          )}
        </div>

        {/* Recent Matchups */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Matchups</h2>
          
          {recentMatchups.length > 0 ? (
            <div className="space-y-3">
              {recentMatchups.map((matchup: any) => (
                <div key={matchup.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Week {matchup.week} • {matchup.league.season}
                    </span>
                    <span className="text-sm font-medium">
                      {matchup.isPlayoffs ? 'Playoffs' : 'Regular Season'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{matchup.homeTeam.name}</p>
                      {matchup.homeTeamPoints && (
                        <p className="text-sm text-muted-foreground">
                          {Math.round(matchup.homeTeamPoints)} pts
                        </p>
                      )}
                    </div>
                    <div className="mx-4 text-muted-foreground">vs</div>
                    <div className="flex-1 text-right">
                      <p className="font-medium">{matchup.awayTeam.name}</p>
                      {matchup.awayTeamPoints && (
                        <p className="text-sm text-muted-foreground">
                          {Math.round(matchup.awayTeamPoints)} pts
                        </p>
                      )}
                    </div>
                  </div>
                  {matchup.winnerTeamKey && (
                    <p className="text-sm text-primary mt-2">
                      Winner: {matchup.winnerTeamKey === matchup.homeTeamKey 
                        ? matchup.homeTeam.name 
                        : matchup.awayTeam.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No recent matchups available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/hall-of-fame" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105"
          >
            View Hall of Fame
          </Link>
          <Link 
            href="/wall-of-shame" 
            className="inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 text-base font-semibold text-secondary-foreground shadow-lg transition-transform duration-200 hover:scale-105"
          >
            View Wall of Shame
          </Link>
        </div>
      </div>
    </div>
  )
}

// A reusable stat card component
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="h-8 w-8">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}
