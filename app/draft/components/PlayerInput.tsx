'use client'

import { useState, useRef, useEffect } from 'react'
import { useDraft } from './DraftProvider'
import { PlayerDropdown } from './PlayerDropdown'
import { DraftPick } from '@/types/draft'
import { getPlayerPrimaryPosition } from '@/lib/draft/playerRankings'
import { positionColors } from '@/lib/draft/leagueSettings'

interface PlayerInputProps {
  round: number
  teamIndex: number
  pick: DraftPick | undefined
}

export function PlayerInput({ round, teamIndex, pick }: PlayerInputProps) {
  const { makePick, clearPick } = useDraft()
  const [inputValue, setInputValue] = useState(pick?.playerName || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update input value when pick changes
  useEffect(() => {
    setInputValue(pick?.playerName || '')
  }, [pick?.playerName])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowDropdown(value.length > 0)
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowDropdown(false)
    }, 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, 4)) // Max 5 suggestions
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          // Select highlighted suggestion
          // This would need to be implemented with the dropdown
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  const handlePlayerSelect = (player: any) => {
    setInputValue(player.name)
    setShowDropdown(false)
    makePick(round, teamIndex, player)
  }

  const handleClear = () => {
    setInputValue('')
    setShowDropdown(false)
    if (pick?.playerName) {
      clearPick(round, teamIndex)
    }
  }

  const getPositionClass = () => {
    if (!pick?.playerPosition) return ''
    const position = getPlayerPrimaryPosition({
      name: pick.playerName || '',
      pos: pick.playerPosition,
      team: pick.playerTeam || '',
      rank: pick.playerRank || 0,
      avg: pick.averagePick || 0
    })
    return positionColors[position as keyof typeof positionColors] || ''
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className={`w-full px-2 py-1 text-sm rounded border border-border bg-background text-foreground focus:border-primary focus:outline-none ${getPositionClass()}`}
          placeholder="Enter player..."
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground p-1"
            title="Clear"
          >
            ×
          </button>
        )}
      </div>
      
      {showDropdown && (
        <PlayerDropdown
          ref={dropdownRef}
          searchTerm={inputValue}
          onPlayerSelect={handlePlayerSelect}
          highlightedIndex={highlightedIndex}
          onHighlightChange={setHighlightedIndex}
        />
      )}
    </div>
  )
}
