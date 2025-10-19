import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  children: ReactNode
  className?: string
  loading?: boolean
  error?: string
}

export function ChartCard({ title, children, className = '', loading = false, error }: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`}>
      <h3 className="text-lg font-semibold text-card-foreground mb-4">{title}</h3>
      <div className="chart-container">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
