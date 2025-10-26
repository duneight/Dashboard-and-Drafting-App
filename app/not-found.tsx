import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-8">
          Looks like you've wandered into uncharted territory. This page doesn't exist on our Fantasy NHL Stats site.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium"
          >
            <Search className="h-5 w-5" />
            View Dashboard
          </Link>
        </div>
        
        <p className="text-sm text-muted-foreground mt-8">
          Maybe you were looking for the{' '}
          <Link href="/hall-of-fame" className="text-primary hover:underline">
            Hall of Fame
          </Link>
          {' '}or{' '}
          <Link href="/wall-of-shame" className="text-primary hover:underline">
            Wall of Shame
          </Link>
          ?
        </p>
      </div>
    </div>
  )
}

