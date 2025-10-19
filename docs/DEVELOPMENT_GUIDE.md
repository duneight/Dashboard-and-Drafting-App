# Fantasy NHL Stats

A Next.js web application for tracking and analyzing Fantasy NHL league statistics, featuring Hall of Fame and Wall of Shame analytics.

## Features

- 🏆 **Hall of Fame**: Celebrate the best performers across all categories
- 💩 **Wall of Shame**: Highlight the not-so-great moments in fantasy history
- 📊 **Dashboard**: Current season standings and recent matchups
- 🔄 **Daily Sync**: Automatic data refresh from Yahoo Fantasy Sports API
- 📱 **Mobile-First**: Responsive design that works great on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Yahoo Fantasy Sports API
- **Deployment**: Vercel
- **Styling**: TailwindCSS with custom design system

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fantasy-nhl-stats
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fantasy_nhl_stats"

# Supabase (replace with your actual Supabase credentials)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Yahoo Fantasy Sports API
YAHOO_CLIENT_ID="your-yahoo-client-id"
YAHOO_CLIENT_SECRET="your-yahoo-client-secret"
YAHOO_REFRESH_TOKEN="your-yahoo-refresh-token"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Vercel Cron
CRON_SECRET="your_random_cron_secret"
```

### 3. Database Setup

#### Option A: Using Supabase (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys from the project settings
3. Update your `.env.local` with the Supabase credentials
4. Run database migrations:

```bash
npm run db:migrate
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database named `fantasy_nhl_stats`
3. Update `DATABASE_URL` in `.env.local`
4. Run migrations:

```bash
npm run db:migrate
```

### 4. Yahoo API Setup

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/)
2. Create a new application
3. Get your Client ID and Client Secret
4. Follow Yahoo's OAuth flow to get a refresh token
5. Update your `.env.local` with the Yahoo credentials

### 5. Import Existing Data (Optional)

If you have existing JSON data from previous Yahoo API calls:

```bash
npm run migrate
```

This will read JSON files from the `../data/` directory and populate your database.

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run migrate` - Import data from JSON files

## API Endpoints

- `GET /api/fetch-yahoo-data` - Get available league keys
- `POST /api/fetch-yahoo-data` - Fetch and store Yahoo data
- `GET /api/stats/hall-of-fame` - Get Hall of Fame statistics
- `GET /api/stats/wall-of-shame` - Get Wall of Shame statistics
- `POST /api/cron` - Trigger daily data sync (cron job)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app includes automatic cron job configuration for daily data sync.

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YAHOO_CLIENT_ID`
- `YAHOO_CLIENT_SECRET`
- `YAHOO_REFRESH_TOKEN`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`

## Data Structure

The app uses a comprehensive database schema with the following main entities:

- **Games**: Fantasy sports games (NHL, etc.)
- **Leagues**: Individual fantasy leagues
- **Teams**: Fantasy teams within leagues
- **Matchups**: Weekly matchups between teams
- **Players**: Individual players and their stats
- **Transactions**: Trades, waivers, etc.

## Analytics Categories

### Hall of Fame
- Dynasty Builder (Most total wins)
- The Champion (Most championships)
- Playoff Merchant (Most playoff appearances)
- The Consistent One (Highest win percentage)
- Point Machine (Most fantasy points)
- Perfect Season (Best single-season record)
- Scoring Explosion (Highest single-season points)
- Runaway Winner (Biggest margin over 2nd place)
- Week Winner (Highest single-week score)
- The Clutch Performer (Most playoff wins)

### Wall of Shame
- Eternal Loser (Most total losses)
- Last Place Larry (Most last place finishes)
- The Unlucky One (Most points against)
- Worst Record (Lowest win percentage)
- Point Desert (Fewest fantasy points)
- Rock Bottom (Worst single-season record)
- Playoff Choke (Most playoff losses)
- Losing Streak (Longest losing streak)
- Waiver Warrior (Most waiver moves)
- The Overthinker (Most lineup changes)
- Inactive Owner (Least active manager)
- Goalie Graveyard (Worst goalie stats)
- Can't Buy a Goal (Fewest goals)
- Penalty Box (Most penalty minutes)
- The Minus (Worst plus/minus)
- Blowout Victim (Most blowout losses)
- Never Stood a Chance (Worst draft)
- The Heartbreaker (Most close losses)
- Commissioner Fails (Commissioner's curse)
- Cursed Team Name (Unlucky team names)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure your database is properly configured
4. Check Yahoo API credentials and permissions

For additional help, please open an issue on GitHub.
