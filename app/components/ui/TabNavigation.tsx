'use client'

import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: string | ReactNode
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
  showLabelsOnMobile?: boolean
}

export function TabNavigation({ tabs, activeTab, onTabChange, className = '', showLabelsOnMobile = false }: TabNavigationProps) {
  return (
    <div className={`mb-6 md:mb-8 ${className}`}>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 md:gap-2 bg-muted p-1 rounded-lg border border-border min-w-max md:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`tab-btn px-3 py-2.5 md:px-4 md:py-3 rounded-md transition-all text-xs md:text-sm font-medium flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap touch-manipulation ${
                activeTab === tab.id
                  ? 'active'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {typeof tab.icon === 'string' ? <span className="text-base md:text-lg">{tab.icon}</span> : tab.icon}
              <span className={showLabelsOnMobile ? 'inline' : 'hidden sm:inline'}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
