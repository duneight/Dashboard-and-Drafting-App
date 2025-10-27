'use client'

import { useDraft } from './DraftProvider'
import { Undo, Redo, Download } from 'lucide-react'

export function FloatingActionBar() {
  const { canUndo, canRedo, undo, redo, exportDraft } = useDraft()

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      <div className="flex items-center gap-1.5 md:gap-2 bg-card border border-border rounded-lg shadow-lg p-1.5 md:p-2">
        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2.5 md:p-2 rounded-md transition-colors touch-manipulation ${
            canUndo
              ? 'hover:bg-muted text-foreground active:bg-muted/80'
              : 'text-muted-foreground cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-5 w-5 md:h-5 md:w-5" />
        </button>

        {/* Redo Button */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2.5 md:p-2 rounded-md transition-colors touch-manipulation ${
            canRedo
              ? 'hover:bg-muted text-foreground active:bg-muted/80'
              : 'text-muted-foreground cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-5 w-5 md:h-5 md:w-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Export Button */}
        <button
          onClick={exportDraft}
          className="p-2.5 md:p-2 rounded-md hover:bg-muted text-foreground transition-colors touch-manipulation active:bg-muted/80"
          title="Export Draft"
        >
          <Download className="h-5 w-5 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  )
}
