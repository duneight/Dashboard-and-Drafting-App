// Draft history management for undo/redo functionality

import { DraftSnapshot, DraftPick } from '@/types/draft'

export class DraftHistory {
  private history: DraftSnapshot[] = []
  private currentIndex: number = -1
  private readonly maxHistorySize = 50

  // Save current state to history
  saveSnapshot(picks: DraftPick[], selectedPlayers: Set<string>, description?: string): void {
    const snapshot: DraftSnapshot = {
      id: this.generateId(),
      picks: [...picks],
      selectedPlayers: Array.from(selectedPlayers),
      timestamp: new Date(),
      description
    }

    // Remove any history after current index (when branching)
    this.history = this.history.slice(0, this.currentIndex + 1)
    
    // Add new snapshot
    this.history.push(snapshot)
    this.currentIndex = this.history.length - 1

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
      this.currentIndex--
    }
  }

  // Undo to previous state
  undo(): DraftSnapshot | null {
    if (this.canUndo()) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }

  // Redo to next state
  redo(): DraftSnapshot | null {
    if (this.canRedo()) {
      this.currentIndex++
      return this.history[this.currentIndex]
    }
    return null
  }

  // Check if undo is possible
  canUndo(): boolean {
    return this.currentIndex > 0
  }

  // Check if redo is possible
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  // Get current state
  getCurrentState(): DraftSnapshot | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex]
    }
    return null
  }

  // Get history for debugging
  getHistory(): DraftSnapshot[] {
    return [...this.history]
  }

  // Clear history
  clearHistory(): void {
    this.history = []
    this.currentIndex = -1
  }

  // Get history size
  getHistorySize(): number {
    return this.history.length
  }

  // Generate unique ID for snapshots
  private generateId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Convert snapshot to draft state format
  static snapshotToDraftState(snapshot: DraftSnapshot): { picks: DraftPick[]; selectedPlayers: Set<string> } {
    return {
      picks: snapshot.picks,
      selectedPlayers: new Set(snapshot.selectedPlayers)
    }
  }

  // Create initial snapshot
  createInitialSnapshot(picks: DraftPick[], selectedPlayers: Set<string>): void {
    this.saveSnapshot(picks, selectedPlayers, 'Initial draft state')
  }

  // Get snapshot by ID
  getSnapshotById(id: string): DraftSnapshot | null {
    return this.history.find(snapshot => snapshot.id === id) || null
  }

  // Get snapshots in a time range
  getSnapshotsInRange(startTime: Date, endTime: Date): DraftSnapshot[] {
    return this.history.filter(snapshot => 
      snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    )
  }

  // Get recent snapshots (last N)
  getRecentSnapshots(count: number): DraftSnapshot[] {
    return this.history.slice(-count)
  }

  // Check if two snapshots are equal
  static areSnapshotsEqual(snapshot1: DraftSnapshot, snapshot2: DraftSnapshot): boolean {
    if (snapshot1.picks.length !== snapshot2.picks.length) {
      return false
    }

    // Compare picks
    for (let i = 0; i < snapshot1.picks.length; i++) {
      const pick1 = snapshot1.picks[i]
      const pick2 = snapshot2.picks[i]
      
      if (
        pick1.pick !== pick2.pick ||
        pick1.playerName !== pick2.playerName ||
        pick1.playerPosition !== pick2.playerPosition
      ) {
        return false
      }
    }

    // Compare selected players
    const players1 = new Set(snapshot1.selectedPlayers)
    const players2 = new Set(snapshot2.selectedPlayers)
    
    if (players1.size !== players2.size) {
      return false
    }

    for (const player of players1) {
      if (!players2.has(player)) {
        return false
      }
    }

    return true
  }

  // Compress history by removing duplicate snapshots
  compressHistory(): void {
    const compressed: DraftSnapshot[] = []
    let lastSnapshot: DraftSnapshot | null = null

    for (const snapshot of this.history) {
      if (!lastSnapshot || !DraftHistory.areSnapshotsEqual(lastSnapshot, snapshot)) {
        compressed.push(snapshot)
        lastSnapshot = snapshot
      }
    }

    this.history = compressed
    this.currentIndex = Math.min(this.currentIndex, this.history.length - 1)
  }
}
