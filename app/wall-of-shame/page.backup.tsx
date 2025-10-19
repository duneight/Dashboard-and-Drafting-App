import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'
import Link from 'next/link'

export default async function WallOfShamePage() {
  const analytics = new WallOfShameAnalytics()
  const allCategories = await analytics.getAllCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">💩 Wall of Shame</h1>
        <p className="text-muted-foreground">
          The not-so-great moments in fantasy history
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <Link 
          href="/hall-of-fame" 
          className="text-primary hover:underline mr-4"
        >
          ← Hall of Fame
        </Link>
        <Link 
          href="/dashboard" 
          className="text-muted-foreground hover:underline"
        >
          Dashboard →
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WALL_OF_SHAME_CATEGORIES.map((category) => {
          const entries = allCategories[category.id] || []
          const topEntry = entries[0]

          return (
            <div key={category.id} className="bg-card p-6 rounded-lg border">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
              </div>

              {topEntry ? (
                <div className="space-y-3">
                  {/* Top "Performer" */}
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-destructive">#1</span>
                      <span className="text-lg font-bold">{topEntry.value}</span>
                    </div>
                    <p className="font-medium">{topEntry.teamName}</p>
                    {topEntry.managerNickname && (
                      <p className="text-sm text-muted-foreground">
                        {topEntry.managerNickname}
                      </p>
                    )}
                    {topEntry.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {topEntry.description}
                      </p>
                    )}
                  </div>

                  {/* Other "Performers" */}
                  {entries.slice(1, 4).map((entry, index) => (
                    <div key={entry.teamKey} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 2}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{entry.teamName}</p>
                          {entry.managerNickname && (
                            <p className="text-xs text-muted-foreground">
                              {entry.managerNickname}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium">{entry.value}</span>
                    </div>
                  ))}

                  {/* Show more if available */}
                  {entries.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{entries.length - 4} more
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Legend</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Overall Struggles</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Eternal Loser: Most total losses</li>
              <li>• Last Place Larry: Most last place finishes</li>
              <li>• The Unlucky One: Most playoff misses</li>
              <li>• Worst Record: Lowest win %</li>
              <li>• Point Desert: Fewest fantasy points</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Weekly Disasters</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Rock Bottom: Lowest weekly score</li>
              <li>• Playoff Choke: Best regular, worst playoff</li>
              <li>• Losing Streak: Most consecutive losses</li>
              <li>• Blowout Victim: Biggest loss margin</li>
              <li>• The Heartbreaker: Most close losses</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          😄 All in good fun! These stats are meant to add some humor to fantasy competition.
        </p>
      </div>
    </div>
  )
}
