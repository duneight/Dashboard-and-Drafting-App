// import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame' // Commented out until analytics is set up
// import { HALL_OF_FAME_CATEGORIES } from '@/lib/constants' // Commented out until constants is set up
import Link from 'next/link'
import { Crown, ShieldCheck, Zap, Trophy } from 'lucide-react'

export default function HallOfFamePage() {
  // TODO: Replace with actual analytics when modules are set up
  const allCategories: any = {}

  return (
    <div className="container mx-auto animate-fade-in px-4 py-8">
      <div className="mb-8 text-center">
        <div className="inline-block rounded-full bg-warning/10 p-4">
          <Crown className="h-12 w-12 text-warning" />
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
          Hall of Fame
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-lg text-muted-foreground">
          Celebrating the legends of the league.
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="text-primary hover:underline mr-4"
        >
          ← Dashboard
        </Link>
        <Link 
          href="/wall-of-shame" 
          className="text-muted-foreground hover:underline"
        >
          Wall of Shame →
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* TODO: Replace with actual categories when constants are set up */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Dynasty Builder</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Most total wins across all seasons
            </p>
          </div>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Legend</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">Overall Excellence</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Dynasty Builder: Most total wins</li>
              <li>• The Champion: Most championships</li>
              <li>• Playoff Merchant: Most playoff appearances</li>
              <li>• The Consistent One: Highest win %</li>
              <li>• Point Machine: Most fantasy points</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Single Season & Weekly</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Perfect Season: Best record</li>
              <li>• Scoring Explosion: Highest points</li>
              <li>• Runaway Winner: Biggest margin</li>
              <li>• Week Winner: Highest weekly score</li>
              <li>• The Clutch Performer: Most playoff wins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
