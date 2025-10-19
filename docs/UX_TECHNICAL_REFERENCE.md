# Fantasy NHL Stats - Technical Reference for UX Development

## 🎨 Design System & Styling

### TailwindCSS Configuration

**File: `tailwind.config.ts`**
```typescript
import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config
```

### Global CSS Variables & Styles

**File: `app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}

@layer components {
  .bg-card {
    background-color: hsl(var(--card));
  }
  .text-card-foreground {
    color: hsl(var(--card-foreground));
  }
  .bg-primary {
    background-color: hsl(var(--primary));
  }
  .text-primary {
    color: hsl(var(--primary));
  }
  .text-primary-foreground {
    color: hsl(var(--primary-foreground));
  }
  .bg-secondary {
    background-color: hsl(var(--secondary));
  }
  .text-secondary-foreground {
    color: hsl(var(--secondary-foreground));
  }
  .bg-muted {
    background-color: hsl(var(--muted));
  }
  .text-muted-foreground {
    color: hsl(var(--muted-foreground));
  }
  .bg-destructive {
    background-color: hsl(var(--destructive));
  }
  .text-destructive {
    color: hsl(var(--destructive));
  }
  .text-destructive-foreground {
    color: hsl(var(--destructive-foreground));
  }
  .border {
    border-color: hsl(var(--border));
  }
}
```

## 🏗️ HTML Structure & Components

### Root Layout

**File: `app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fantasy NHL Stats',
  description: 'Hall of Fame and Wall of Shame for your Fantasy NHL leagues',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}
```

### Landing Page

**File: `app/page.tsx`**
```typescript
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Fantasy NHL Stats
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Hall of Fame and Wall of Shame for your Fantasy NHL leagues
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              View current season standings and recent matchups
            </p>
            <a 
              href="/dashboard" 
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              View Dashboard
            </a>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-2">Hall of Fame</h2>
            <p className="text-muted-foreground mb-4">
              Celebrate the best performers across all categories
            </p>
            <a 
              href="/hall-of-fame" 
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              View Hall of Fame
            </a>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold mb-2">Wall of Shame</h2>
            <p className="text-muted-foreground mb-4">
              The not-so-great moments in fantasy history
            </p>
            <a 
              href="/wall-of-shame" 
              className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              View Wall of Shame
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Dashboard Page

**File: `app/dashboard/page.tsx`**
```typescript
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">NHL Fantasy Dashboard</h1>
        <p className="text-muted-foreground">
          Current season standings and recent matchups
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Seasons</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Teams</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Total Matchups</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Current Season</h3>
          <p className="text-3xl font-bold text-primary">N/A</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Season Standings */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Current Season Standings</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No current season data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Set up your database and import data to see standings
            </p>
          </div>
        </div>

        {/* Recent Matchups */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Recent Matchups</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent matchups available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Set up your database and import data to see matchups
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/hall-of-fame" 
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            View Hall of Fame
          </Link>
          <Link 
            href="/wall-of-shame" 
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90"
          >
            View Wall of Shame
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### Hall of Fame Page

**File: `app/hall-of-fame/page.tsx`**
```typescript
import Link from 'next/link'

export default function HallOfFamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">🏆 Hall of Fame</h1>
        <p className="text-muted-foreground">
          Celebrating the best performers across all categories
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="text-primary hover:underline mr-4"
        >
          ← Dashboard
        </Link>
        <Link 
          href="/wall-of-shame" 
          className="text-muted-foreground hover:underline"
        >
          Wall of Shame →
        </Link>
      </div>

      {/* Placeholder Content */}
      <div className="text-center py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
          <p className="text-muted-foreground mb-6">
            The Hall of Fame will showcase the best performers across all categories once you set up your database and import your fantasy data.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Dynasty Builder</h3>
            <p className="text-sm text-muted-foreground">Most total wins across all seasons</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">The Champion</h3>
            <p className="text-sm text-muted-foreground">Most championships won</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Point Machine</h3>
            <p className="text-sm text-muted-foreground">Most fantasy points scored</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Wall of Shame Page

**File: `app/wall-of-shame/page.tsx`**
```typescript
import Link from 'next/link'

export default function WallOfShamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">💩 Wall of Shame</h1>
        <p className="text-muted-foreground">
          The not-so-great moments in fantasy history
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-8">
        <Link 
          href="/hall-of-fame" 
          className="text-primary hover:underline mr-4"
        >
          ← Hall of Fame
        </Link>
        <Link 
          href="/dashboard" 
          className="text-muted-foreground hover:underline"
        >
          Dashboard →
        </Link>
      </div>

      {/* Placeholder Content */}
      <div className="text-center py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
          <p className="text-muted-foreground mb-6">
            The Wall of Shame will highlight the not-so-great moments once you set up your database and import your fantasy data.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Eternal Loser</h3>
            <p className="text-sm text-muted-foreground">Most total losses across all seasons</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Last Place Larry</h3>
            <p className="text-sm text-muted-foreground">Most last place finishes</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Point Desert</h3>
            <p className="text-sm text-muted-foreground">Fewest fantasy points scored</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          😄 All in good fun! These stats are meant to add some humor to fantasy competition.
        </p>
      </div>
    </div>
  )
}
```

## 🗄️ Database Schema

### Prisma Schema

**File: `prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Game {
  id          String   @id @default(cuid())
  gameKey     String   @unique
  gameId      Int      @unique
  name        String
  code        String
  type        String
  url         String?
  season      String
  isGameOver  Boolean  @default(false)
  isRegistrationOver Boolean @default(false)
  isPlayoffsOver Boolean @default(false)
  isOffseason Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  leagues League[]

  @@map("games")
}

model League {
  id                String   @id @default(cuid())
  leagueKey         String   @unique
  leagueId          Int      @unique
  name              String
  url               String?
  logoUrl           String?
  password          String?
  draftStatus       String
  numTeams          Int
  editKey           String?
  weeklyDeadline    String?
  leagueUpdateTimestamp String?
  scoringType       String?
  leagueType        String?
  renew             String?
  renewed           String?
  irisGroupChatId   String?
  allowAddToDlExtraPos Int?
  isProLeague       Boolean  @default(false)
  isCashLeague      Boolean  @default(false)
  currentMatchupPeriod Int?
  isFinished        Boolean  @default(false)
  isApiFootball     Boolean  @default(false)
  apiSelections     String?
  gameId            String
  season            String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  game   Game   @relation(fields: [gameId], references: [id])
  teams  Team[]
  matchups Matchup[]

  @@map("leagues")
}

model Team {
  id                String   @id @default(cuid())
  teamKey           String   @unique
  teamId            Int      @unique
  name              String
  isOwnedByCurrentLogin Boolean @default(false)
  url               String?
  teamLogos         String?
  waiverPriority    Int?
  numberOfMoves     Int?
  numberOfTrades    Int?
  clinchedPlayoffs  Boolean  @default(false)
  leagueScoringType String?
  managers          String?  // JSON string of managers
  managerNickname   String?
  managerGuid       String?
  managerEmail      String?
  managerImageUrl   String?
  managerIsCommissioner Boolean @default(false)
  managerIsCurrentLogin Boolean @default(false)
  wins              Int      @default(0)
  losses            Int      @default(0)
  ties              Int      @default(0)
  percentage        Float    @default(0)
  pointsFor         Float    @default(0)
  pointsAgainst     Float    @default(0)
  rank              Int?
  isFinished        Boolean  @default(false)
  leagueId          String
  season            String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  league League @relation(fields: [leagueId], references: [id])
  weeklyStats WeeklyStat[]
  matchupsAsTeam1 Matchup[] @relation("Team1Matchups")
  matchupsAsTeam2 Matchup[] @relation("Team2Matchups")

  @@map("teams")
}

model Manager {
  id                String   @id @default(cuid())
  managerId         String   @unique
  nickname          String?
  guid              String?
  email             String?
  imageUrl          String?
  isCommissioner    Boolean  @default(false)
  isCurrentLogin    Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("managers")
}

model WeeklyScoreboard {
  id          String   @id @default(cuid())
  leagueId    String
  week        Int
  season      String
  isPlayoffs  Boolean  @default(false)
  isConsolation Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([leagueId, week, season])
  @@map("weekly_scoreboards")
}

model WeeklyTeamStats {
  id                String   @id @default(cuid())
  teamKey           String
  week              Int
  season            String
  points            Float    @default(0)
  projectedPoints   Float?
  isPlayoffs        Boolean  @default(false)
  isConsolation     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([teamKey, week, season])
  @@map("weekly_team_stats")
}

model WeeklyPlayerStats {
  id                String   @id @default(cuid())
  playerKey         String
  teamKey           String
  week              Int
  season            String
  points            Float    @default(0)
  projectedPoints   Float?
  isPlayoffs        Boolean  @default(false)
  isConsolation     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([playerKey, teamKey, week, season])
  @@map("weekly_player_stats")
}

model Player {
  id                String   @id @default(cuid())
  playerKey         String   @unique
  playerId          Int      @unique
  name              String
  editorialTeamKey  String?
  editorialTeamFullName String?
  editorialTeamAbbr String?
  uniformNumber     String?
  displayPosition   String?
  headshot          String?
  imageUrl          String?
  isUndroppable     Boolean  @default(false)
  positionType      String?
  primaryPosition   String?
  eligiblePositions String?  // JSON string of positions
  hasPlayerNotes    Boolean  @default(false)
  hasRecentPlayerNotes Boolean @default(false)
  status            String?
  statusFull        String?
  injuryNote        String?
  onDisabledList     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  stats PlayerStats[]

  @@map("players")
}

model PlayerStats {
  id                String   @id @default(cuid())
  playerKey         String
  season            String
  week              Int?
  stats             String   // JSON string of stats
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  player Player @relation(fields: [playerKey], references: [playerKey])

  @@unique([playerKey, season, week])
  @@map("player_stats")
}

model StatCategory {
  id                String   @id @default(cuid())
  statId            Int      @unique
  name              String
  displayName        String
  sortOrder         Int
  positionType      String?
  isReversed        Boolean  @default(false)
  isOnlyDisplayStat Boolean @default(false)
  isExcludedFromDisplay Boolean @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("stat_categories")
}

model RosterPosition {
  id                String   @id @default(cuid())
  position          String   @unique
  positionType      String
  abbreviation      String?
  displayName       String?
  isBench           Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("roster_positions")
}

model Transaction {
  id                String   @id @default(cuid())
  transactionKey    String   @unique
  transactionId     Int      @unique
  type              String
  status            String?
  timestamp         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("transactions")
}

model DraftResult {
  id                String   @id @default(cuid())
  pick              Int
  round             Int
  teamKey           String
  playerKey         String?
  playerName        String?
  position          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([pick, teamKey])
  @@map("draft_results")
}

model Matchup {
  id                String   @id @default(cuid())
  matchupId         Int      @unique
  week              Int
  status             String?
  isPlayoffs         Boolean  @default(false)
  isConsolation      Boolean  @default(false)
  isTied             Boolean  @default(false)
  winnerTeamKey      String?
  leagueId           String
  season             String
  team1Key           String
  team2Key           String
  team1Points        Float?
  team2Points        Float?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  league League @relation(fields: [leagueId], references: [id])
  team1  Team   @relation("Team1Matchups", fields: [team1Key], references: [teamKey])
  team2  Team   @relation("Team2Matchups", fields: [team2Key], references: [teamKey])

  @@map("matchups")
}

model WeeklyStat {
  id                String   @id @default(cuid())
  teamKey           String
  week              Int
  season            String
  points            Float    @default(0)
  projectedPoints   Float?
  isPlayoffs        Boolean  @default(false)
  isConsolation     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  team Team @relation(fields: [teamKey], references: [teamKey])

  @@unique([teamKey, week, season])
  @@map("weekly_stats")
}
```

## 🎨 Design System Guidelines

### Color Palette
- **Primary**: Blue (`hsl(221.2 83.2% 53.3%)`) - Main brand color
- **Secondary**: Light Gray (`hsl(210 40% 96%)`) - Secondary actions
- **Muted**: Light Gray (`hsl(210 40% 96%)`) - Subtle backgrounds
- **Destructive**: Red (`hsl(0 84.2% 60.2%)`) - Error states
- **Card**: White (`hsl(0 0% 100%)`) - Card backgrounds
- **Border**: Light Gray (`hsl(214.3 31.8% 91.4%)`) - Borders

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold weights (600-700)
- **Body**: Regular weight (400)
- **Sizes**: Responsive scaling with Tailwind's text utilities

### Spacing System
- **Container**: Max width with responsive padding
- **Grid**: CSS Grid with responsive breakpoints
- **Gaps**: Consistent spacing using Tailwind's gap utilities
- **Padding**: 4px base unit scaling (p-4, p-6, p-8)

### Component Patterns

#### Cards
```html
<div className="bg-card p-6 rounded-lg border">
  <h3 className="text-lg font-semibold mb-2">Title</h3>
  <p className="text-muted-foreground">Content</p>
</div>
```

#### Buttons
```html
<a className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
  Button Text
</a>
```

#### Navigation Links
```html
<Link className="text-primary hover:underline">
  Navigation Text
</Link>
```

#### Stats Display
```html
<div className="bg-card p-6 rounded-lg border">
  <h3 className="text-lg font-semibold mb-2">Stat Label</h3>
  <p className="text-3xl font-bold text-primary">Stat Value</p>
</div>
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Default (< 768px)
- **Tablet**: `md:` (≥ 768px)
- **Desktop**: `lg:` (≥ 1024px)
- **Large Desktop**: `xl:` (≥ 1280px)
- **Extra Large**: `2xl:` (≥ 1400px)

### Grid Patterns
- **Single Column**: `grid-cols-1` (mobile)
- **Two Columns**: `md:grid-cols-2` (tablet+)
- **Three Columns**: `md:grid-cols-3` (tablet+)
- **Four Columns**: `md:grid-cols-4` (desktop+)

### Layout Structure
- **Container**: `container mx-auto px-4`
- **Sections**: `py-8` for vertical spacing
- **Cards**: `p-6` for internal padding
- **Borders**: `rounded-lg border` for card styling

## 🎯 UX Enhancement Opportunities

### Visual Hierarchy
- Use emoji icons for personality (🏆, 💩)
- Implement gradient backgrounds for hero sections
- Add subtle shadows and hover effects
- Use color coding for different stat categories

### Interactive Elements
- Add loading states for data fetching
- Implement smooth transitions and animations
- Create interactive charts and graphs
- Add tooltips for complex statistics

### Data Visualization
- Implement charts for trends over time
- Create leaderboard tables with sorting
- Add progress bars for win percentages
- Use badges for achievements and milestones

### Mobile Optimization
- Ensure touch-friendly button sizes
- Implement swipe gestures for navigation
- Optimize images and icons for mobile
- Use collapsible sections for complex data

This technical reference provides all the CSS, HTML structure, and database schema needed to build a sleek, modern UX for your Fantasy NHL Stats application.
