'use client'

import { useDraft } from './DraftProvider'

export function DraftPrompts() {
  const { draftPrompts } = useDraft()

  if (draftPrompts.length === 0) {
    return null
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold text-foreground mb-3">Draft Context</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {draftPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={prompt.action}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-left"
          >
            <div className="text-2xl">{prompt.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {prompt.title}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {prompt.description}
              </div>
              {prompt.count > 0 && (
                <div className="text-xs text-accent font-medium mt-1">
                  {prompt.count} available
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
