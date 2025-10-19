import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  className?: string
}

export function MetricCard({ icon, label, value, trend, className = '' }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === 'up') return <TrendingUp className="h-5 w-5 text-accent" />
    if (trend.direction === 'down') return <TrendingDown className="h-5 w-5 text-destructive" />
    return null
  }

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground'
    if (trend.direction === 'up') return 'text-accent'
    if (trend.direction === 'down') return 'text-destructive'
    return 'text-muted-foreground'
  }

  return (
    <div className={`metric-card rounded-xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-muted/50">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-5xl font-bold text-foreground">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
