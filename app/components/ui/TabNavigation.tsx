'use client'

import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabNavigation({ tabs, activeTab, onTabChange, className = '' }: TabNavigationProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-wrap gap-2 bg-muted p-1 rounded-lg border border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-btn flex-1 md:flex-none px-4 py-3 rounded-md transition-all text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'active'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
