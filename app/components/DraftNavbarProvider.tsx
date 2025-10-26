'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface DraftNavbarContextType {
  draftProgress: {
    picks: number
    total: number
    percentage: number
  } | null
  onReset: (() => void) | null
  setDraftProgress: (progress: { picks: number; total: number; percentage: number } | null) => void
  setOnReset: (onReset: (() => void) | null) => void
}

const DraftNavbarContext = createContext<DraftNavbarContextType | null>(null)

export function DraftNavbarProvider({ children }: { children: ReactNode }) {
  const [draftProgress, setDraftProgress] = useState<{ picks: number; total: number; percentage: number } | null>(null)
  const [onReset, setOnReset] = useState<(() => void) | null>(null)

  return (
    <DraftNavbarContext.Provider value={{
      draftProgress,
      onReset,
      setDraftProgress,
      setOnReset
    }}>
      {children}
    </DraftNavbarContext.Provider>
  )
}

export function useDraftNavbar() {
  const context = useContext(DraftNavbarContext)
  if (!context) {
    throw new Error('useDraftNavbar must be used within a DraftNavbarProvider')
  }
  return context
}
