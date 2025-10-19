// Draft analytics: position balance, needs analysis, and contextual prompts

import { Player, PositionBalance, TeamBalance, DraftPrompt } from '@/types/draft'
import { LEAGUE_SETTINGS } from './leagueSettings'
import { getPlayerPrimaryPosition } from './playerRankings'

export class DraftAnalytics {
  private picks: any[]
  private selectedPlayers: Set<string>
  private availablePlayers: Player[]

  constructor(picks: any[], selectedPlayers: Set<string>, availablePlayers: Player[]) {
    this.picks = picks
    this.selectedPlayers = selectedPlayers
    this.availablePlayers = availablePlayers
  }

  // Analyze position balance for all teams
  analyzePositionBalance(): TeamBalance {
    const balances: TeamBalance = {}
    
    // Initialize balances for all teams
    LEAGUE_SETTINGS.owners.forEach(owner => {
      balances[owner] = {
        C: 0,
        LW: 0,
        RW: 0,
        D: 0,
        G: 0,
        total: 0
      }
    })

    // Count picks by team and position
    this.picks.forEach(pick => {
      if (pick.playerName && pick.playerPosition) {
        const teamName = pick.teamName
        const position = getPlayerPrimaryPosition({
          name: pick.playerName,
          pos: pick.playerPosition,
          team: pick.playerTeam || '',
          rank: pick.playerRank || 0,
          avg: pick.averagePick || 0
        })

        if (balances[teamName]) {
          balances[teamName][position as keyof PositionBalance]++
          balances[teamName].total++
        }
      }
    })

    return balances
  }

  // Get current pick information
  getCurrentPickInfo(): { pick: number; round: number; owner: string } {
    const currentPick = this.picks.find(p => !p.playerName)?.pick || this.picks.length + 1
    const round = Math.ceil(currentPick / LEAGUE_SETTINGS.teams)
    const ownerIndex = (currentPick - 1) % LEAGUE_SETTINGS.teams
    const owner = LEAGUE_SETTINGS.owners[ownerIndex]

    return { pick: currentPick, round, owner }
  }

  // Generate contextual draft prompts
  generateDraftPrompts(): DraftPrompt[] {
    const prompts: DraftPrompt[] = []
    const balances = this.analyzePositionBalance()
    const { pick: currentPick, round: currentRound, owner: currentOwner } = this.getCurrentPickInfo()

    // 1. Best Available Overall
    const topAvailable = this.availablePlayers.slice(0, 3)
    if (topAvailable.length > 0) {
      prompts.push({
        icon: '🏆',
        title: 'Top Available',
        description: `${topAvailable.map(p => p.name).join(', ')}`,
        count: this.availablePlayers.length,
        action: () => {
          // This would switch to best available tab
          console.log('Switch to best available tab')
        }
      })
    }

    // 2. Position Needs Analysis
    const currentOwnerBalance = balances[currentOwner]
    if (currentOwnerBalance && currentOwnerBalance.total > 0) {
      const needs: string[] = []
      
      if (currentOwnerBalance.C < LEAGUE_SETTINGS.rosterPositions.centers) {
        needs.push(`${LEAGUE_SETTINGS.rosterPositions.centers - currentOwnerBalance.C} Centers`)
      }
      if (currentOwnerBalance.LW < LEAGUE_SETTINGS.rosterPositions.leftWings) {
        needs.push(`${LEAGUE_SETTINGS.rosterPositions.leftWings - currentOwnerBalance.LW} LW`)
      }
      if (currentOwnerBalance.RW < LEAGUE_SETTINGS.rosterPositions.rightWings) {
        needs.push(`${LEAGUE_SETTINGS.rosterPositions.rightWings - currentOwnerBalance.RW} RW`)
      }
      if (currentOwnerBalance.D < LEAGUE_SETTINGS.rosterPositions.defensemen) {
        needs.push(`${LEAGUE_SETTINGS.rosterPositions.defensemen - currentOwnerBalance.D} Defense`)
      }
      if (currentOwnerBalance.G < LEAGUE_SETTINGS.rosterPositions.goalies) {
        needs.push(`${LEAGUE_SETTINGS.rosterPositions.goalies - currentOwnerBalance.G} Goalies`)
      }
      
      if (needs.length > 0) {
        prompts.push({
          icon: '📊',
          title: 'Position Needs',
          description: needs.slice(0, 2).join(', ') + (needs.length > 2 ? '...' : ''),
          count: needs.length,
          action: () => {
            console.log('Switch to position analysis tab')
          }
        })
      }
    }

    // 3. Elite Players Still Available
    const eliteAvailable = this.availablePlayers.filter(p => p.rank <= 20)
    if (eliteAvailable.length > 0) {
      prompts.push({
        icon: '⭐',
        title: 'Elite Available',
        description: `${eliteAvailable.length} top-20 players left`,
        count: eliteAvailable.length,
        action: () => {
          console.log('Switch to best available tab')
        }
      })
    }

    // 4. Goalie Situation
    const availableGoalies = this.availablePlayers.filter(p => p.pos.includes('G'))
    const goalieNeeds = LEAGUE_SETTINGS.owners.filter(owner => {
      const balance = balances[owner]
      return balance && balance.G < LEAGUE_SETTINGS.rosterPositions.goalies
    }).length
    
    if (availableGoalies.length > 0 && goalieNeeds > 0) {
      prompts.push({
        icon: '🥅',
        title: 'Goalie Run Alert',
        description: `${availableGoalies.length} goalies left, ${goalieNeeds} teams need them`,
        count: availableGoalies.length,
        action: () => {
          console.log('Switch to best available tab')
        }
      })
    }

    // 5. Round-specific insights
    if (currentRound <= 3) {
      prompts.push({
        icon: '🚀',
        title: 'Early Round',
        description: 'Focus on elite talent and positional scarcity',
        count: 1,
        action: () => {
          console.log('Show early round strategy')
        }
      })
    } else if (currentRound >= 20) {
      prompts.push({
        icon: '🎯',
        title: 'Late Round',
        description: 'Fill roster needs and find sleepers',
        count: 1,
        action: () => {
          console.log('Show late round strategy')
        }
      })
    }

    return prompts.slice(0, 4) // Limit to 4 prompts
  }

  // Get available players by position
  getAvailablePlayersByPosition(position: string): Player[] {
    return this.availablePlayers.filter(player => {
      if (position === 'F') {
        return player.pos.includes('C') || player.pos.includes('LW') || player.pos.includes('RW')
      }
      return player.pos.includes(position)
    })
  }

  // Get team roster for a specific team
  getTeamRoster(teamName: string): Player[] {
    const teamPicks = this.picks.filter(pick => 
      pick.teamName === teamName && pick.playerName
    )
    
    return teamPicks.map(pick => ({
      rank: pick.playerRank || 0,
      name: pick.playerName || '',
      team: pick.playerTeam || '',
      pos: pick.playerPosition || '',
      avg: pick.averagePick || 0
    }))
  }

  // Get draft trends (position picks over rounds)
  getDraftTrends(): { round: number; positions: Record<string, number> }[] {
    const trends: { round: number; positions: Record<string, number> }[] = []
    
    for (let round = 1; round <= LEAGUE_SETTINGS.numRounds; round++) {
      const roundPicks = this.picks.filter(pick => 
        pick.round === round && pick.playerPosition
      )
      
      const positions: Record<string, number> = {
        C: 0,
        LW: 0,
        RW: 0,
        D: 0,
        G: 0
      }
      
      roundPicks.forEach(pick => {
        const position = getPlayerPrimaryPosition({
          name: pick.playerName || '',
          pos: pick.playerPosition || '',
          team: pick.playerTeam || '',
          rank: pick.playerRank || 0,
          avg: pick.averagePick || 0
        })
        positions[position]++
      })
      
      trends.push({ round, positions })
    }
    
    return trends
  }

  // Check if a team has position balance warnings
  hasPositionWarnings(teamName: string): boolean {
    const balance = this.analyzePositionBalance()[teamName]
    if (!balance) return false

    const { rosterPositions } = LEAGUE_SETTINGS
    
    return (
      balance.C > rosterPositions.centers ||
      balance.LW > rosterPositions.leftWings ||
      balance.RW > rosterPositions.rightWings ||
      balance.D > rosterPositions.defensemen ||
      balance.G > rosterPositions.goalies
    )
  }

  // Get snake draft order for a round
  getSnakeDraftOrder(round: number): string[] {
    if (round % 2 === 1) {
      // Odd rounds: normal order
      return [...LEAGUE_SETTINGS.owners]
    } else {
      // Even rounds: reverse order
      return [...LEAGUE_SETTINGS.owners].reverse()
    }
  }
}
