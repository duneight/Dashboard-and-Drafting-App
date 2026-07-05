import { HallOfFameAnalytics } from '@/lib/analytics/hallOfFame'
import { createStatsRouteHandler } from '@/lib/analytics/statsRouteBuilder'
import { HALL_OF_FAME_CATEGORIES } from '@/lib/constants'

const analytics = new HallOfFameAnalytics()

export const GET = createStatsRouteHandler({
  routeName: 'Hall of Fame',
  categories: HALL_OF_FAME_CATEGORIES,
  // Hall of Fame parses the stats JSON columns, so it needs the full variant
  matchupVariant: 'full',
  dispatch: {
    'dynasty-king': ({ teams }) => analytics.getDynastyKing(teams),
    'point-titan': ({ teams }) => analytics.getPointTitan(teams),
    'the-consistent': ({ teams }) => analytics.getTheConsistent(teams),
    'playoff-warrior': ({ matchups }) => analytics.getPlayoffWarrior(matchups),
    'goal-machine': ({ matchups }) => analytics.getGoalMachine(matchups),
    'iron-wall': ({ matchups }) => analytics.getIronWall(matchups),
    'shutout-king': ({ matchups }) => analytics.getShutoutKing(matchups),
    'the-playmaker': ({ matchups }) => analytics.getThePlaymaker(matchups),
    'season-dominator': ({ teams }) => analytics.getSeasonDominator(teams),
    'weekly-explosion': ({ matchups }) => analytics.getWeeklyExplosion(matchups),
    'unstoppable': ({ matchups }) => analytics.getUnstoppable(matchups),
    'close-game-specialist': ({ matchups }) => analytics.getCloseGameSpecialist(matchups),
  },
})
