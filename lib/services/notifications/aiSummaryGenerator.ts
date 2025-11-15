import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import { WeeklySummaryData } from './weeklyDataAggregator'

export interface AISummaryResult {
  success: boolean
  summary?: string
  tokensUsed?: { input: number; output: number }
  error?: string
}

export class AISummaryGenerator {
  private apiKey: string
  private model: string
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions'

  constructor() {
    this.apiKey = env.OPENAI_API_KEY || ''
    this.model = env.OPENAI_MODEL || 'gpt-5-nano'
  }

  /**
   * Check if AI summaries are enabled and configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && env.AI_SUMMARIES_ENABLED === 'true'
  }

  /**
   * Format prompt for AI in style of Peter King/Pierre LeBrun
   */
  private formatPrompt(data: WeeklySummaryData): string {
    const { currentWeek, season, seasonContext, matchups, closeGames, blowouts, standings, interestingStats, headToHeadContext, managerTrends, playoffImplications } = data

    // Build season phase context
    const phaseContext = seasonContext.phase === 'early' 
      ? `Early season (Week ${currentWeek} of ${seasonContext.totalWeeks}) - teams finding their identity`
      : seasonContext.phase === 'playoff-race'
      ? `Playoff race heating up (${seasonContext.weeksRemaining} weeks remaining) - every game matters`
      : seasonContext.phase === 'playoffs'
      ? `Playoffs (Week ${currentWeek}) - championship on the line`
      : `Mid-season (Week ${currentWeek} of ${seasonContext.totalWeeks}) - building toward playoffs`

    let prompt = `You are a top-tier sports writer (think Peter King, Pierre LeBrun, Jon Wertheim) writing a weekly fantasy hockey league recap. Your writing must be TIGHT, PUNCHY, and DEEP - every sentence matters. No fluff. Historical accuracy is critical.

WRITING STYLE REQUIREMENTS:
- Short, impactful sentences. Mix of 5-word punches and 15-word context.
- Lead with the story, not the score. What does this week MEAN?
- Use historical context naturally. Reference past matchups, trends, patterns.
- Analytical depth: Why did this happen? What's the pattern? What's the trend?
- Season-aware: Different tone for early season vs playoff race vs playoffs.
- Numbers matter, but weave them in naturally. Don't list stats - tell stories with stats.
- Voice: Confident, knowledgeable, slightly conversational but professional.
- Emojis: Use sparingly (🏒 🏆 only when truly impactful)

LEAGUE CONTEXT:
Season: ${season} | Week: ${currentWeek} | Phase: ${phaseContext}
Total Matchups: ${matchups.length} | Close Games (<10 pts): ${closeGames.length} | Blowouts (>50 pts): ${blowouts.length}

THIS WEEK'S MATCHUPS:
${matchups.map((m) => 
  `${m.team1.manager} (${m.team1.points.toFixed(1)}) vs ${m.team2.manager} (${m.team2.points.toFixed(1)}) → ${m.winner} by ${m.margin.toFixed(1)}${m.isClose ? ' [NAIL-BITER]' : ''}${m.isBlowout ? ' [BLOWOUT]' : ''}`
).join('\n')}

CURRENT STANDINGS (Top 8):
${standings.slice(0, 8).map((s) => 
  `${s.rank}. ${s.manager} (${s.wins}-${s.losses}, ${s.pointsFor.toFixed(1)} pts)${s.gamesBack > 0 ? ` [${s.gamesBack} GB]` : ''}`
).join('\n')}

MANAGER TRENDS (Last 3 Weeks):
${managerTrends.slice(0, 8).map((t) => 
  `${t.manager}: ${t.recentWins}-${t.recentLosses} (${t.trend.toUpperCase()})${t.streak ? ` | ${t.streak.type.toUpperCase()} streak: ${t.streak.count}` : ''}`
).join('\n')}

KEY STATS THIS WEEK:
${interestingStats.highestScore.points > 0 ? `Highest Score: ${interestingStats.highestScore.manager} (${interestingStats.highestScore.points.toFixed(1)} pts)` : 'N/A'}
${interestingStats.closestGame ? `Closest Game: ${interestingStats.closestGame.team1.manager} vs ${interestingStats.closestGame.team2.manager} (${interestingStats.closestGame.margin.toFixed(1)} pts)` : 'N/A'}
${interestingStats.biggestBlowout ? `Biggest Blowout: ${interestingStats.biggestBlowout.winner} by ${interestingStats.biggestBlowout.margin.toFixed(1)} pts` : 'N/A'}

HISTORICAL HEAD-TO-HEAD CONTEXT (Use this for deep analysis):
${headToHeadContext.slice(0, 8).map((h2h) => 
  `${h2h.manager1} vs ${h2h.manager2}: All-time ${h2h.allTimeRecord} (${h2h.totalGames} games) | This season: ${h2h.seasonRecord} | Last: ${h2h.lastMeeting}${h2h.closestGame ? ` | Closest: ${h2h.closestGame.margin.toFixed(1)} pts (Week ${h2h.closestGame.week})` : ''}${h2h.biggestBlowout ? ` | Biggest margin: ${h2h.biggestBlowout.margin.toFixed(1)} pts` : ''} | Avg margin: ${h2h.avgMargin.toFixed(1)} pts`
).join('\n')}

PLAYOFF IMPLICATIONS:
${playoffImplications.teamsClinched.length > 0 ? `Clinched: ${playoffImplications.teamsClinched.join(', ')}` : 'None clinched yet'}
${playoffImplications.teamsEliminated.length > 0 ? `Eliminated: ${playoffImplications.teamsEliminated.join(', ')}` : 'None eliminated yet'}
${playoffImplications.teamsOnBubble.length > 0 ? `On the bubble: ${playoffImplications.teamsOnBubble.join(', ')}` : 'No bubble teams'}

STRUCTURE YOUR RECAP:

1. LEAD (2-3 sentences): The story of the week. What happened that matters? Not just scores - the narrative.

2. THE MATCHUPS (3-4 paragraphs): Deep dive on key games. Use historical context. Why did this result happen? What's the pattern? Reference head-to-head records naturally. Connect to season trends.

3. THE STANDINGS (1-2 paragraphs): What changed? Who's rising? Who's falling? Playoff implications. Use games-back context. Reference manager trends.

4. THE NUMBERS (1 paragraph): The stats that tell the story. Highest score, closest game, blowout - but explain WHY they matter in context.

5. WHAT'S NEXT (1-2 sentences): The hook for next week. What should we watch?

CRITICAL RULES:
- Every sentence must earn its place. Cut anything that doesn't add value.
- Use historical data naturally - "These two have met 8 times, with Manager1 holding a 5-3 edge..."
- Season context matters: Early season = "finding identity", Playoff race = "every game critical", Playoffs = "championship stakes"
- Reference trends: "Manager X is hot (3-0 in last 3 weeks)" or "Manager Y is struggling (1-2 recently)"
- Be analytical: "This win extends Manager A's dominance over Manager B, who hasn't beaten them since Week 5"
- Tight prose: "Manager X won. Again. For the third straight week against Manager Y, who can't solve the puzzle."
- No lists unless absolutely necessary. Write in flowing paragraphs.

LENGTH: 800-1200 words. Tight. Punchy. Deep.

Write the recap now:`

    return prompt
  }

  /**
   * Generate weekly summary using OpenAI API
   */
  async generateWeeklySummary(data: WeeklySummaryData): Promise<AISummaryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI summaries not configured. Set OPENAI_API_KEY and AI_SUMMARIES_ENABLED=true',
      }
    }

    if (!data.matchups || data.matchups.length === 0) {
      return {
        success: false,
        error: 'No matchups data available for summary',
      }
    }

    try {
      const prompt = this.formatPrompt(data)

      logger.info('Generating AI summary', {
        model: this.model,
        matchupsCount: data.matchups.length,
        promptLength: prompt.length,
      })

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional fantasy hockey sports commentator. Write engaging, personality-driven weekly recaps.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8, // Slightly creative but consistent
          max_tokens: 2000, // Limit output length
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        logger.error('OpenAI API error', new Error(errorMessage), { status: response.status })
        return {
          success: false,
          error: errorMessage,
        }
      }

      const result = await response.json()
      const summary = result.choices?.[0]?.message?.content || ''
      const usage = result.usage || {}

      if (!summary) {
        return {
          success: false,
          error: 'No summary generated from OpenAI',
        }
      }

      logger.info('AI summary generated successfully', {
        model: this.model,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      })

      return {
        success: true,
        summary,
        tokensUsed: {
          input: usage.prompt_tokens || 0,
          output: usage.completion_tokens || 0,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Error generating AI summary', error as Error)
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Generate a fallback summary if AI fails (tight, punchy style)
   */
  generateFallbackSummary(data: WeeklySummaryData): string {
    const { currentWeek, season, seasonContext, matchups, interestingStats, standings, managerTrends } = data

    const phase = seasonContext.phase === 'early' ? 'Early season' 
      : seasonContext.phase === 'playoff-race' ? 'Playoff race' 
      : seasonContext.phase === 'playoffs' ? 'Playoffs'
      : 'Mid-season'

    let summary = `WEEK ${currentWeek} - ${season} | ${phase}\n\n`

    if (matchups.length > 0) {
      summary += `The story: ${matchups.length} matchups decided. `
      
      if (interestingStats.closestGame) {
        summary += `${interestingStats.closestGame.team1.manager} and ${interestingStats.closestGame.team2.manager} went down to the wire (${interestingStats.closestGame.margin.toFixed(1)} pts). `
      }
      
      if (interestingStats.highestScore.points > 0) {
        summary += `${interestingStats.highestScore.manager} dropped ${interestingStats.highestScore.points.toFixed(1)} points - the week's high. `
      }

      summary += `\n\nKey results:\n`
      for (const matchup of matchups.slice(0, 4)) {
        summary += `${matchup.winner} def. ${matchup.winner === matchup.team1.manager ? matchup.team2.manager : matchup.team1.manager} ${Math.max(matchup.team1.points, matchup.team2.points).toFixed(1)}-${Math.min(matchup.team1.points, matchup.team2.points).toFixed(1)}${matchup.isClose ? ' (close)' : ''}\n`
      }

      if (standings.length > 0) {
        summary += `\nStandings: ${standings[0].manager} leads (${standings[0].wins}-${standings[0].losses})`
        if (standings.length > 1 && standings[1].gamesBack > 0) {
          summary += `, ${standings[1].manager} ${standings[1].gamesBack} GB`
        }
        summary += `\n`
      }

      if (managerTrends.length > 0) {
        const hot = managerTrends.filter(t => t.trend === 'hot').slice(0, 2)
        if (hot.length > 0) {
          summary += `Hot: ${hot.map(t => t.manager).join(', ')}\n`
        }
      }
    } else {
      summary += 'No matchups data available.\n'
    }

    summary += `\n(AI summary generation failed - this is a fallback.)`

    return summary
  }
}

