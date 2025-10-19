'use client'

import { useDraft } from './DraftProvider'
import { Undo, Redo, Download } from 'lucide-react'

export function FloatingActionBar() {
  const { canUndo, canRedo, undo, redo, exportDraft } = useDraft()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg shadow-lg p-2">
        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded-md transition-colors ${
            canUndo
              ? 'hover:bg-muted text-foreground'
              : 'text-muted-foreground cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-5 w-5" />
        </button>

        {/* Redo Button */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded-md transition-colors ${
            canRedo
              ? 'hover:bg-muted text-foreground'
              : 'text-muted-foreground cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Export Button */}
        <button
          onClick={exportDraft}
          className="p-2 rounded-md hover:bg-muted text-foreground transition-colors"
          title="Export Draft"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
