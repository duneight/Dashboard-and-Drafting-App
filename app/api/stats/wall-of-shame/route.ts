import { WallOfShameAnalytics } from '@/lib/analytics/wallOfShame'
import { createStatsRouteHandler } from '@/lib/analytics/statsRouteBuilder'
import { WALL_OF_SHAME_CATEGORIES } from '@/lib/constants'

const analytics = new WallOfShameAnalytics()

export const GET = createStatsRouteHandler({
  routeName: 'Wall of Shame',
  categories: WALL_OF_SHAME_CATEGORIES,
  // Wall of Shame never parses the stats JSON columns
  matchupVariant: 'light',
  dispatch: {
    'eternal-last': ({ teams }) => analytics.getEternalLast(teams),
    'playoff-choker': ({ matchups, teams }) => analytics.getPlayoffChoker(matchups, teams),
    'close-but-no-cigar': ({ teams }) => analytics.getCloseButNoCigar(teams),
    'rock-bottom': ({ teams }) => analytics.getRockBottom(teams),
    'the-collapse': ({ matchups }) => analytics.getTheCollapse(matchups),
    'brick-hands': ({ teams }) => analytics.getBrickHands(teams),
    'the-heartbreak': ({ matchups }) => analytics.getTheHeartbreak(matchups),
    'glass-cannon': ({ teams }) => analytics.getGlassCannon(teams),
    'the-snooze': ({ matchups }) => analytics.getTheSnooze(matchups),
  },
})
