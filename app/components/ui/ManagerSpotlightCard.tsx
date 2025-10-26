import { ReactNode } from 'react'

interface ManagerSpotlightCardProps {
  icon: ReactNode
  label: string
  managerName: string
  metric: string
  className?: string
}

export function ManagerSpotlightCard({ icon, label, managerName, metric, className = '' }: ManagerSpotlightCardProps) {
  return (
    <div className={`manager-spotlight-card rounded-xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-muted/50">
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-foreground">{managerName}</p>
        <p className="text-lg font-semibold text-muted-foreground">{metric}</p>
      </div>
    </div>
  )
}
