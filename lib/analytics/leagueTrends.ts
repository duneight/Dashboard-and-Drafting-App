import { SharedTeamData } from './sharedData'

export interface LeagueCompetitivenessData {
  season: string
  parityScore: number // Lower = more competitive (std dev of win%)
  championWinPct: number
  avgWinPct: number
  pointsSpread: number // Difference between top and bottom
}

export interface ChampionshipSeedSuccess {
  seed: number
  appearances: number
  championships: number
  successRate: number
}

export interface ScoringEvolution {
  season: string
  avgPointsPerWeek: number
  highestWeekAvg: number
  lowestWeekAvg: number
  volatility: number
}

export interface ManagerConsistency {
  manager: string
  seasonsPlayed: number
  avgWinPct: number
  variance: number
  stdDev: number
  mostConsistent: boolean
}

export interface ExperienceCurve {
  yearsInLeague: number
  managerCount: number
  avgWinPct: number
  avgChampionships: number
}

export interface TransactionCorrelation {
  manager: string
  totalTransactions: number
  totalMoves: number
  totalTrades: number
  winPct: number
  championships: number
}

export interface RegularVsPlayoffScoring {
  manager: string
  regularSeasonPPG: number
  playoffPPG: number
  scoringBoost: number // Positive = scores more in playoffs
  playoffAppearances: number
  totalPlayoffGames: number
}

export interface RegularVsPlayoffPerformance {
  manager: string
  regularSeasonWinPct: number
  playoffWinPct: number
  clutchFactor: number
  playoffAppearances: number
  championships: number
}

export interface LuckIndex {
  manager: string
  actualWins: number
  expectedWins: number
  luckDifferential: number
  overperforming: boolean
}

export interface CloseGamePerformance {
  manager: string
  closeGames: number
  closeGameWins: number
  closeGameWinPct: number
}

export interface StartFinishAnalysis {
  manager: string
  earlySeasonWinPct: number // Weeks 1-5
  lateSeasonWinPct: number // Weeks 18-21
  momentum: 'Hot Finish' | 'Cold Finish' | 'Consistent'
}

export class LeagueTrendsAnalytics {
  
  /**
   * Calculate league competitiveness over time
   * Lower standard deviation = more competitive league
   */
  async getLeagueCompetitivenessOverTime(teams?: any[]): Promise<LeagueCompetitivenessData[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Group by season
    const seasonMap = new Map<string, any[]>()
    teamData.forEach(team => {
      if (!seasonMap.has(team.season)) {
        seasonMap.set(team.season, [])
      }
      seasonMap.get(team.season)!.push(team)
    })
    
    const results: LeagueCompetitivenessData[] = []
    
    for (const [season, seasonTeams] of seasonMap) {
      const winPcts = seasonTeams.map(t => t.percentage || 0)
      const champion = seasonTeams.find(t => t.rank === 1)
      
      // Calculate standard deviation (parity score)
      const mean = winPcts.reduce((sum, pct) => sum + pct, 0) / winPcts.length
      const variance = winPcts.reduce((sum, pct) => sum + Math.pow(pct - mean, 2), 0) / winPcts.length
      const stdDev = Math.sqrt(variance)
      
      // Calculate points spread
      const pointsForValues = seasonTeams.map(t => t.pointsFor || 0)
      const pointsSpread = Math.max(...pointsForValues) - Math.min(...pointsForValues)
      
      results.push({
        season,
        parityScore: stdDev,
        championWinPct: champion ? champion.percentage : 0,
        avgWinPct: mean,
        pointsSpread
      })
    }
    
    return results.sort((a, b) => a.season.localeCompare(b.season))
  }
  
  /**
   * Championship success rate by playoff seed
   */
  async getChampionshipSuccessByPlayoffSeed(teams?: any[]): Promise<ChampionshipSeedSuccess[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    // Filter to finished seasons only
    const finishedTeams = teamData.filter(t => t.season !== currentSeason || t.isFinished)
    
    const seedMap = new Map<number, { appearances: number; championships: number }>()
    
    for (let seed = 1; seed <= 10; seed++) {
      const teamsWithSeed = finishedTeams.filter(t => t.rank === seed)
      const championships = teamsWithSeed.filter(t => t.rank === 1).length
      
      seedMap.set(seed, {
        appearances: teamsWithSeed.length,
        championships
      })
    }
    
    return Array.from(seedMap.entries()).map(([seed, data]) => ({
      seed,
      appearances: data.appearances,
      championships: data.championships,
      successRate: data.appearances > 0 ? data.championships / data.appearances : 0
    }))
  }
  
  /**
   * Scoring evolution across seasons and weeks
   */
  async getScoringEvolutionBySeasonWeek(matchups?: any[]): Promise<ScoringEvolution[]> {
    const matchupData = matchups || await SharedTeamData.getAllMatchups()
    
    // Group by season
    const seasonMap = new Map<string, number[]>()
    matchupData.forEach(m => {
      if (!seasonMap.has(m.season)) {
        seasonMap.set(m.season, [])
      }
      if (m.team1Points) seasonMap.get(m.season)!.push(m.team1Points)
      if (m.team2Points) seasonMap.get(m.season)!.push(m.team2Points)
    })
    
    const results: ScoringEvolution[] = []
    
    for (const [season, scores] of seasonMap) {
      const seasonMatchups = matchupData.filter(m => m.season === season)
      
      // Calculate weekly averages
      const weeklyAvgs = new Map<number, number[]>()
      seasonMatchups.forEach(m => {
        if (!weeklyAvgs.has(m.week)) {
          weeklyAvgs.set(m.week, [])
        }
        if (m.team1Points) weeklyAvgs.get(m.week)!.push(m.team1Points)
        if (m.team2Points) weeklyAvgs.get(m.week)!.push(m.team2Points)
      })
      
      const weeklyAverages = Array.from(weeklyAvgs.values()).map(scores => 
        scores.reduce((sum, s) => sum + s, 0) / scores.length
      )
      
      const avgPointsPerWeek = scores.reduce((sum, s) => sum + s, 0) / scores.length
      const volatility = Math.sqrt(
        scores.reduce((sum, s) => sum + Math.pow(s - avgPointsPerWeek, 2), 0) / scores.length
      )
      
      results.push({
        season,
        avgPointsPerWeek,
        highestWeekAvg: weeklyAverages.length > 0 ? Math.max(...weeklyAverages) : 0,
        lowestWeekAvg: weeklyAverages.length > 0 ? Math.min(...weeklyAverages) : 0,
        volatility
      })
    }
    
    return results.sort((a, b) => a.season.localeCompare(b.season))
  }
  
  /**
   * Manager consistency rankings (season-to-season variance)
   */
  async getManagerConsistencyRankings(teams?: any[]): Promise<ManagerConsistency[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Group by manager and calculate win% per season
    const managerMap = new Map<string, number[]>()
    teamData.forEach(team => {
      const manager = team.managerNickname || 'Unknown'
      if (!managerMap.has(manager)) {
        managerMap.set(manager, [])
      }
      
      // Calculate win percentage from wins/losses/ties (same as All Time Leaderboard)
      const games = team.wins + team.losses + team.ties
      if (games > 0) {
        const winPct = (team.wins + team.ties * 0.5) / games // Decimal format (0.604)
        managerMap.get(manager)!.push(winPct)
      }
    })
    
    const results: ManagerConsistency[] = []
    
    for (const [manager, winPcts] of managerMap) {
      if (winPcts.length < 2) continue // Need at least 2 seasons
      
      const avgWinPct = winPcts.reduce((sum, pct) => sum + pct, 0) / winPcts.length
      const variance = winPcts.reduce((sum, pct) => sum + Math.pow(pct - avgWinPct, 2), 0) / winPcts.length
      const stdDev = Math.sqrt(variance)
      
      results.push({
        manager,
        seasonsPlayed: winPcts.length,
        avgWinPct,
        variance,
        stdDev,
        mostConsistent: false
      })
    }
    
    // Mark most consistent
    if (results.length > 0) {
      const mostConsistent = results.reduce((min, curr) => curr.stdDev < min.stdDev ? curr : min)
      mostConsistent.mostConsistent = true
    }
    
    return results.sort((a, b) => a.stdDev - b.stdDev)
  }
  
  /**
   * Experience curve analysis (win% by years in league)
   */
  async getExperienceCurveAnalysis(teams?: any[]): Promise<ExperienceCurve[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find most current season to determine years in league
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    // Count seasons per manager
    const managerSeasons = new Map<string, Set<string>>()
    const managerStats = new Map<string, { wins: number; games: number; championships: number }>()
    
    teamData.forEach(team => {
      const manager = team.managerNickname || 'Unknown'
      
      if (!managerSeasons.has(manager)) {
        managerSeasons.set(manager, new Set())
        managerStats.set(manager, { wins: 0, games: 0, championships: 0 })
      }
      
      managerSeasons.get(manager)!.add(team.season)
      
      const stats = managerStats.get(manager)!
      stats.wins += team.wins
      stats.games += team.wins + team.losses + team.ties
      
      // Championship logic with proper finished check
      const isSeasonFinished = team.season !== currentSeason || team.isFinished
      if (team.rank === 1 && isSeasonFinished) {
        stats.championships++
      }
    })
    
    // Group by years in league
    const experienceMap = new Map<number, { managers: string[]; totalWinPct: number; totalChampionships: number }>()
    
    for (const [manager, seasonSet] of managerSeasons) {
      const years = seasonSet.size
      const stats = managerStats.get(manager)!
      const winPct = stats.games > 0 ? stats.wins / stats.games : 0
      
      if (!experienceMap.has(years)) {
        experienceMap.set(years, { managers: [], totalWinPct: 0, totalChampionships: 0 })
      }
      
      const expData = experienceMap.get(years)!
      expData.managers.push(manager)
      expData.totalWinPct += winPct
      expData.totalChampionships += stats.championships
    }
    
    return Array.from(experienceMap.entries())
      .map(([years, data]) => ({
        yearsInLeague: years,
        managerCount: data.managers.length,
        avgWinPct: data.totalWinPct / data.managers.length,
        avgChampionships: data.totalChampionships / data.managers.length
      }))
      .sort((a, b) => a.yearsInLeague - b.yearsInLeague)
  }
  
  /**
   * Transaction volume vs success correlation
   */
  async getTransactionVolumeVsSuccess(teams?: any[]): Promise<TransactionCorrelation[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    // Aggregate by manager
    const managerMap = new Map<string, {
      moves: number
      trades: number
      wins: number
      games: number
      championships: number
    }>()
    
    teamData.forEach(team => {
      const manager = team.managerNickname || 'Unknown'
      
      if (!managerMap.has(manager)) {
        managerMap.set(manager, { moves: 0, trades: 0, wins: 0, games: 0, championships: 0 })
      }
      
      const stats = managerMap.get(manager)!
      stats.moves += team.numberOfMoves || 0
      stats.trades += team.numberOfTrades || 0
      stats.wins += team.wins
      stats.games += team.wins + team.losses + team.ties
      
      const isSeasonFinished = team.season !== currentSeason || team.isFinished
      if (team.rank === 1 && isSeasonFinished) {
        stats.championships++
      }
    })
    
    return Array.from(managerMap.entries()).map(([manager, stats]) => ({
      manager,
      totalTransactions: stats.moves + stats.trades,
      totalMoves: stats.moves,
      totalTrades: stats.trades,
      winPct: stats.games > 0 ? stats.wins / stats.games : 0,
      championships: stats.championships
    }))
  }
  
  /**
   * Regular season vs playoff performance
   */
  async getRegularSeasonVsPlayoffPerformance(matchups?: any[], teams?: any[]): Promise<RegularVsPlayoffPerformance[]> {
    const matchupData = matchups || await SharedTeamData.getAllMatchups()
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    const managerStats = new Map<string, {
      regularWins: number
      regularGames: number
      playoffWins: number
      playoffGames: number
      playoffAppearances: number
      championships: number
    }>()
    
    // Process matchups for win/loss records
    matchupData.forEach(m => {
      const manager1 = m.team1.managerNickname || 'Unknown'
      const manager2 = m.team2.managerNickname || 'Unknown'
      
      if (!managerStats.has(manager1)) {
        managerStats.set(manager1, { regularWins: 0, regularGames: 0, playoffWins: 0, playoffGames: 0, playoffAppearances: 0, championships: 0 })
      }
      if (!managerStats.has(manager2)) {
        managerStats.set(manager2, { regularWins: 0, regularGames: 0, playoffWins: 0, playoffGames: 0, playoffAppearances: 0, championships: 0 })
      }
      
      const stats1 = managerStats.get(manager1)!
      const stats2 = managerStats.get(manager2)!
      
      const team1Won = (m.team1Points || 0) > (m.team2Points || 0)
      
      if (m.isPlayoffs) {
        stats1.playoffGames++
        stats2.playoffGames++
        if (team1Won) {
          stats1.playoffWins++
        } else {
          stats2.playoffWins++
        }
      } else {
        stats1.regularGames++
        stats2.regularGames++
        if (team1Won) {
          stats1.regularWins++
        } else {
          stats2.regularWins++
        }
      }
    })
    
    // Add playoff appearances and championships from team data
    teamData.forEach(team => {
      const manager = team.managerNickname || 'Unknown'
      if (!managerStats.has(manager)) return
      
      const stats = managerStats.get(manager)!
      
      const isSeasonFinished = team.season !== currentSeason || team.isFinished
      if (team.rank && team.rank <= 6 && isSeasonFinished) {
        stats.playoffAppearances++
      }
      if (team.rank === 1 && isSeasonFinished) {
        stats.championships++
      }
    })
    
    return Array.from(managerStats.entries())
      .map(([manager, stats]) => {
        const regularPct = stats.regularGames > 0 ? stats.regularWins / stats.regularGames : 0
        const playoffPct = stats.playoffGames > 0 ? stats.playoffWins / stats.playoffGames : 0
        
        return {
          manager,
          regularSeasonWinPct: regularPct,
          playoffWinPct: playoffPct,
          clutchFactor: playoffPct - regularPct,
          playoffAppearances: stats.playoffAppearances,
          championships: stats.championships
        }
      })
      .filter(m => m.playoffAppearances > 0) // Only managers who made playoffs
      .sort((a, b) => b.clutchFactor - a.clutchFactor)
  }
  
  /**
   * Regular season vs playoff scoring (points per game)
   */
  async getRegularSeasonVsPlayoffScoring(matchups?: any[], teams?: any[]): Promise<RegularVsPlayoffScoring[]> {
    const matchupData = matchups || await SharedTeamData.getAllMatchups()
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    const managerStats = new Map<string, {
      regularSeasonPoints: number
      regularSeasonGames: number
      playoffPoints: number
      playoffGames: number
      playoffAppearances: number
    }>()
    
    // Process matchups for scoring data
    matchupData.forEach(m => {
      const manager1 = m.team1.managerNickname || 'Unknown'
      const manager2 = m.team2.managerNickname || 'Unknown'
      
      if (!managerStats.has(manager1)) {
        managerStats.set(manager1, { regularSeasonPoints: 0, regularSeasonGames: 0, playoffPoints: 0, playoffGames: 0, playoffAppearances: 0 })
      }
      if (!managerStats.has(manager2)) {
        managerStats.set(manager2, { regularSeasonPoints: 0, regularSeasonGames: 0, playoffPoints: 0, playoffGames: 0, playoffAppearances: 0 })
      }
      
      const stats1 = managerStats.get(manager1)!
      const stats2 = managerStats.get(manager2)!
      
      const team1Points = m.team1Points || 0
      const team2Points = m.team2Points || 0
      
      if (m.isPlayoffs) {
        stats1.playoffGames++
        stats2.playoffGames++
        stats1.playoffPoints += team1Points
        stats2.playoffPoints += team2Points
      } else {
        stats1.regularSeasonGames++
        stats2.regularSeasonGames++
        stats1.regularSeasonPoints += team1Points
        stats2.regularSeasonPoints += team2Points
      }
    })
    
    // Add playoff appearances from team data
    teamData.forEach(team => {
      const manager = team.managerNickname || 'Unknown'
      if (!managerStats.has(manager)) return
      
      const stats = managerStats.get(manager)!
      
      const isSeasonFinished = team.season !== currentSeason || team.isFinished
      if (team.rank && team.rank <= 6 && isSeasonFinished) {
        stats.playoffAppearances++
      }
    })
    
    return Array.from(managerStats.entries())
      .map(([manager, stats]) => {
        const regularPPG = stats.regularSeasonGames > 0 ? stats.regularSeasonPoints / stats.regularSeasonGames : 0
        const playoffPPG = stats.playoffGames > 0 ? stats.playoffPoints / stats.playoffGames : 0
        
        return {
          manager,
          regularSeasonPPG: regularPPG,
          playoffPPG: playoffPPG,
          scoringBoost: playoffPPG - regularPPG,
          playoffAppearances: stats.playoffAppearances,
          totalPlayoffGames: stats.playoffGames
        }
      })
      .filter(m => m.playoffAppearances > 0 && m.totalPlayoffGames > 0) // Only managers who made playoffs and have playoff games
      .sort((a, b) => b.scoringBoost - a.scoringBoost)
  }
  
  async getLuckIndexAnalysis(teams?: any[]): Promise<LuckIndex[]> {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Group by season to calculate expected wins relative to that season
    const seasonMap = new Map<string, any[]>()
    teamData.forEach(team => {
      if (!seasonMap.has(team.season)) {
        seasonMap.set(team.season, [])
      }
      seasonMap.get(team.season)!.push(team)
    })
    
    const managerLuck = new Map<string, { actual: number; expected: number }>()
    
    for (const [season, seasonTeams] of seasonMap) {
      // Calculate expected wins based on points for ranking
      const sortedByPoints = [...seasonTeams].sort((a, b) => (b.pointsFor || 0) - (a.pointsFor || 0))
      
      seasonTeams.forEach(team => {
        const manager = team.managerNickname || 'Unknown'
        const actualWins = team.wins
        
        // Expected wins based on points ranking
        const pointsRank = sortedByPoints.findIndex(t => t === team) + 1
        const totalTeams = seasonTeams.length
        const gamesPerSeason = team.wins + team.losses + team.ties
        
        // Simple expected wins: if you're 3rd in points, you should win ~70% of games
        const expectedWinPct = 1 - ((pointsRank - 1) / totalTeams)
        const expectedWins = expectedWinPct * gamesPerSeason
        
        if (!managerLuck.has(manager)) {
          managerLuck.set(manager, { actual: 0, expected: 0 })
        }
        
        const luck = managerLuck.get(manager)!
        luck.actual += actualWins
        luck.expected += expectedWins
      })
    }
    
    return Array.from(managerLuck.entries())
      .map(([manager, luck]) => ({
        manager,
        actualWins: Math.round(luck.actual),
        expectedWins: Math.round(luck.expected),
        luckDifferential: Math.round(luck.actual - luck.expected),
        overperforming: luck.actual > luck.expected
      }))
      .sort((a, b) => b.luckDifferential - a.luckDifferential)
  }
  
  /**
   * Close game performance (<10 point margin)
   */
  async getCloseGamePerformance(matchups?: any[]): Promise<CloseGamePerformance[]> {
    const matchupData = matchups || await SharedTeamData.getAllMatchups()
    
    const managerStats = new Map<string, { closeGames: number; closeWins: number }>()
    
    matchupData.forEach(m => {
      const margin = Math.abs((m.team1Points || 0) - (m.team2Points || 0))
      
      if (margin < 10) {
        const manager1 = m.team1.managerNickname || 'Unknown'
        const manager2 = m.team2.managerNickname || 'Unknown'
        
        if (!managerStats.has(manager1)) {
          managerStats.set(manager1, { closeGames: 0, closeWins: 0 })
        }
        if (!managerStats.has(manager2)) {
          managerStats.set(manager2, { closeGames: 0, closeWins: 0 })
        }
        
        const stats1 = managerStats.get(manager1)!
        const stats2 = managerStats.get(manager2)!
        
        stats1.closeGames++
        stats2.closeGames++
        
        if ((m.team1Points || 0) > (m.team2Points || 0)) {
          stats1.closeWins++
        } else {
          stats2.closeWins++
        }
      }
    })
    
    return Array.from(managerStats.entries())
      .map(([manager, stats]) => ({
        manager,
        closeGames: stats.closeGames,
        closeGameWins: stats.closeWins,
        closeGameWinPct: stats.closeGames > 0 ? stats.closeWins / stats.closeGames : 0
      }))
      .filter(m => m.closeGames >= 5) // At least 5 close games
      .sort((a, b) => b.closeGameWinPct - a.closeGameWinPct)
  }
  
  /**
   * Slow starter vs fast starter analysis
   */
  async getSlowStarterVsFastStarterAnalysis(matchups?: any[]): Promise<StartFinishAnalysis[]> {
    const matchupData = matchups || await SharedTeamData.getAllMatchups()
    
    const managerStats = new Map<string, {
      earlyWins: number
      earlyGames: number
      lateWins: number
      lateGames: number
    }>()
    
    matchupData.forEach(m => {
      const isEarlySeason = m.week >= 1 && m.week <= 5
      const isLateSeason = m.week >= 18 && m.week <= 21
      
      if (!isEarlySeason && !isLateSeason) return
      
      const manager1 = m.team1.managerNickname || 'Unknown'
      const manager2 = m.team2.managerNickname || 'Unknown'
      
      if (!managerStats.has(manager1)) {
        managerStats.set(manager1, { earlyWins: 0, earlyGames: 0, lateWins: 0, lateGames: 0 })
      }
      if (!managerStats.has(manager2)) {
        managerStats.set(manager2, { earlyWins: 0, earlyGames: 0, lateWins: 0, lateGames: 0 })
      }
      
      const stats1 = managerStats.get(manager1)!
      const stats2 = managerStats.get(manager2)!
      
      const team1Won = (m.team1Points || 0) > (m.team2Points || 0)
      
      if (isEarlySeason) {
        stats1.earlyGames++
        stats2.earlyGames++
        if (team1Won) {
          stats1.earlyWins++
        } else {
          stats2.earlyWins++
        }
      } else if (isLateSeason) {
        stats1.lateGames++
        stats2.lateGames++
        if (team1Won) {
          stats1.lateWins++
        } else {
          stats2.lateWins++
        }
      }
    })
    
    return Array.from(managerStats.entries())
      .map(([manager, stats]) => {
        const earlyPct = stats.earlyGames > 0 ? stats.earlyWins / stats.earlyGames : 0
        const latePct = stats.lateGames > 0 ? stats.lateWins / stats.lateGames : 0
        const diff = latePct - earlyPct
        
        let momentum: 'Hot Finish' | 'Cold Finish' | 'Consistent' = 'Consistent'
        if (diff > 0.1) momentum = 'Hot Finish'
        else if (diff < -0.1) momentum = 'Cold Finish'
        
        return {
          manager,
          earlySeasonWinPct: earlyPct,
          lateSeasonWinPct: latePct,
          momentum
        }
      })
      .filter(m => m.earlySeasonWinPct > 0 || m.lateSeasonWinPct > 0)
      .sort((a, b) => (b.lateSeasonWinPct - b.earlySeasonWinPct) - (a.lateSeasonWinPct - a.earlySeasonWinPct))
  }
  
  /**
   * Playoff bye advantage analysis
   */
  async getPlayoffByeAdvantageAnalysis(teams?: any[]) {
    const teamData = teams || await SharedTeamData.getAllTeams()
    
    // Find most current season
    const seasons = [...new Set(teamData.map(t => t.season))].sort()
    const currentSeason = seasons[seasons.length - 1]
    
    // Filter to finished seasons
    const finishedTeams = teamData.filter(t => t.season !== currentSeason || t.isFinished)
    
    // Top 2 seeds get byes
    const byeTeams = finishedTeams.filter(t => t.rank && t.rank <= 2)
    const byeChampionships = byeTeams.filter(t => t.rank === 1).length
    
    // Seeds 3-6 don't get byes
    const noByeTeams = finishedTeams.filter(t => t.rank && t.rank >= 3 && t.rank <= 6)
    const noByeChampionships = noByeTeams.filter(t => t.rank === 1).length
    
    return {
      byeTeams: {
        total: byeTeams.length,
        championships: byeChampionships,
        successRate: byeTeams.length > 0 ? byeChampionships / byeTeams.length : 0
      },
      noByeTeams: {
        total: noByeTeams.length,
        championships: noByeChampionships,
        successRate: noByeTeams.length > 0 ? noByeChampionships / noByeTeams.length : 0
      },
      byeAdvantage: byeTeams.length > 0 && noByeTeams.length > 0
        ? (byeChampionships / byeTeams.length) - (noByeChampionships / noByeTeams.length)
        : 0
    }
  }
}

