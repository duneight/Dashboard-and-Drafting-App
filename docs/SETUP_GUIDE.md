# Fantasy NHL Stats - Setup Guide & Current Status

## 🎯 Project Overview

This document outlines the complete setup process and current status of your Fantasy NHL Stats web application. The app is designed to track and analyze Fantasy NHL league statistics with Hall of Fame and Wall of Shame analytics.

## ✅ Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| **Development Server** | ✅ Ready | Running on `http://localhost:3000` |
| **Database Schema** | ✅ Ready | Prisma schema implemented, needs credentials |
| **API Endpoints** | ✅ Complete | All Yahoo API and analytics endpoints |
| **UI Pages** | ✅ Complete | Landing, Dashboard, Hall of Fame, Wall of Shame |
| **Deployment Config** | ✅ Ready | Vercel configuration with cron jobs |
| **Documentation** | ✅ Complete | Comprehensive README and setup guides |

## 🚀 Quick Start Checklist

### Phase 1: Environment Setup
- [ ] Create Supabase account and project
- [ ] Get Yahoo Fantasy Sports API credentials
- [ ] Create `.env.local` file with credentials
- [ ] Test local development server

### Phase 2: Database Setup
- [ ] Run Prisma migrations
- [ ] Verify database connection
- [ ] Import existing JSON data (optional)

### Phase 3: Deployment
- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Deploy and test production build

## 📋 Detailed Setup Instructions

### 1. Supabase Setup

#### Create Account & Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `fantasy-nhl-stats`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your location
6. Click "Create new project"

#### Get API Credentials
1. Once project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 2. Yahoo Fantasy Sports API Setup

#### Create Application
1. Go to [Yahoo Developer Network](https://developer.yahoo.com/)
2. Sign in with your Yahoo account
3. Click "Create an App"
4. Fill out the application form:
   - **Application Name**: `Fantasy NHL Stats`
   - **Application Type**: `Web Application`
   - **Callback Domain**: `http://localhost:3000` (for development)
   - **API Permissions**: Select "Fantasy Sports" and "Read" access
5. Submit the application

#### Get OAuth Credentials
1. After approval, go to your app dashboard
2. Copy the **Consumer Key** (Client ID)
3. Copy the **Consumer Secret** (Client Secret)

#### Get Refresh Token
1. Follow Yahoo's OAuth 2.0 flow:
   - Visit: `https://api.login.yahoo.com/oauth2/request_auth?client_id=YOUR_CLIENT_ID&redirect_uri=oob&response_type=code`
   - Sign in and authorize the application
   - Copy the authorization code
2. Exchange code for tokens:
   ```bash
   curl -X POST https://api.login.yahoo.com/oauth2/get_token \
     -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code&redirect_uri=oob&code=AUTHORIZATION_CODE"
   ```
3. Save the `refresh_token` from the response

### 3. Environment Configuration

#### Create Environment File
```bash
cp env.example .env.local
```

#### Edit `.env.local` with your credentials:
```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Yahoo Fantasy Sports API
YAHOO_CLIENT_ID="[YOUR-CLIENT-ID]"
YAHOO_CLIENT_SECRET="[YOUR-CLIENT-SECRET]"
YAHOO_REFRESH_TOKEN="[YOUR-REFRESH-TOKEN]"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE-RANDOM-STRING]"

# Vercel Cron
CRON_SECRET="[GENERATE-RANDOM-STRING]"
```

### 4. Database Setup

#### Run Prisma Migrations
```bash
npm run db:migrate
```

#### Generate Prisma Client
```bash
npm run db:generate
```

#### Verify Database Connection
```bash
npm run db:studio
```
This opens Prisma Studio where you can view your database tables.

### 5. Import Existing Data (Optional)

If you have existing JSON data from previous Yahoo API calls:

```bash
npm run migrate
```

This script will:
- Read JSON files from `../data/` directory
- Parse Yahoo API responses
- Transform data to match Prisma schema
- Insert/update records in the database

### 6. Test Local Development

#### Start Development Server
```bash
npm run dev
```

#### Verify Everything Works
1. Visit `http://localhost:3000`
2. Navigate through all pages:
   - Landing page
   - Dashboard
   - Hall of Fame
   - Wall of Shame
3. Test API endpoints:
   - `GET /api/fetch-yahoo-data`
   - `GET /api/stats/hall-of-fame`
   - `GET /api/stats/wall-of-shame`

## 🚀 Deployment to Vercel

### 1. Prepare for Deployment

#### Build Test
```bash
npm run build
```

#### Push to GitHub
```bash
git add .
git commit -m "Initial Fantasy NHL Stats app"
git push origin main
```

### 2. Deploy to Vercel

#### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `fantasy-nhl-stats`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Configure Environment Variables
In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase database URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `YAHOO_CLIENT_ID` | Your Yahoo client ID |
| `YAHOO_CLIENT_SECRET` | Your Yahoo client secret |
| `YAHOO_REFRESH_TOKEN` | Your Yahoo refresh token |
| `NEXTAUTH_SECRET` | Random string for NextAuth |
| `CRON_SECRET` | Random string for cron security |

#### Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Test your live application

### 3. Configure Cron Jobs

The app includes automatic cron job configuration in `vercel.json` for daily data sync. Vercel will automatically set up the cron job to run daily at 6 AM UTC.

## 📊 Application Features

### Dashboard
- Current season standings
- Recent matchups
- Overview statistics
- Quick navigation to analytics

### Hall of Fame Categories
- **Dynasty Builder**: Most total wins across all seasons
- **The Champion**: Most championships won
- **Playoff Merchant**: Most playoff appearances
- **The Consistent One**: Highest win percentage (min 2 seasons)
- **Point Machine**: Most total fantasy points scored
- **Perfect Season**: Best single-season record
- **Scoring Explosion**: Highest fantasy points in a single season
- **Runaway Winner**: Biggest points margin above 2nd place
- **Week Winner**: Highest single-week fantasy score
- **The Clutch Performer**: Most playoff week wins

### Wall of Shame Categories
- **Eternal Loser**: Most total losses across all seasons
- **Last Place Larry**: Most last place finishes
- **The Unlucky One**: Most points against
- **Worst Record**: Lowest win percentage
- **Point Desert**: Fewest fantasy points scored
- **Rock Bottom**: Worst single-season record
- **Playoff Choke**: Most playoff losses
- **Losing Streak**: Longest losing streak
- **Waiver Warrior**: Most waiver wire moves
- **The Overthinker**: Most lineup changes
- **Inactive Owner**: Least active manager
- **Goalie Graveyard**: Worst goalie statistics
- **Can't Buy a Goal**: Fewest goals scored
- **Penalty Box**: Most penalty minutes
- **The Minus**: Worst plus/minus rating
- **Blowout Victim**: Most blowout losses
- **Never Stood a Chance**: Worst draft performance
- **The Heartbreaker**: Most close losses
- **Commissioner Fails**: Commissioner's curse
- **Cursed Team Name**: Unlucky team names

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run migrate` | Import data from JSON files |

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fetch-yahoo-data` | GET | Get available league keys |
| `/api/fetch-yahoo-data` | POST | Fetch and store Yahoo data |
| `/api/stats/hall-of-fame` | GET | Get Hall of Fame statistics |
| `/api/stats/wall-of-shame` | GET | Get Wall of Shame statistics |
| `/api/cron` | POST | Trigger daily data sync |

## 🗄️ Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Games**: Fantasy sports games (NHL, etc.)
- **Leagues**: Individual fantasy leagues
- **Teams**: Fantasy teams within leagues
- **Managers**: Team managers/owners
- **Matchups**: Weekly matchups between teams
- **Players**: Individual players and their stats
- **Transactions**: Trades, waivers, etc.
- **Draft Results**: Draft picks and results
- **Weekly Stats**: Team performance by week

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure database password is correct

#### Yahoo API Errors
- Verify client ID and secret
- Check refresh token is valid
- Ensure API permissions include Fantasy Sports

#### Build Errors
- Run `npm run db:generate` after schema changes
- Clear `.next` folder and rebuild
- Check for TypeScript errors

#### Deployment Issues
- Verify all environment variables are set in Vercel
- Check build logs for specific errors
- Ensure database is accessible from Vercel

### Getting Help

1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure database is properly configured
4. Check Yahoo API credentials and permissions
5. Review Vercel build logs for deployment issues

## 📈 Next Steps After Setup

Once your app is deployed and running:

1. **Monitor Performance**: Check Vercel analytics and database usage
2. **Set Up Monitoring**: Add error tracking (Sentry, etc.)
3. **Customize Analytics**: Add more Hall of Fame/Wall of Shame categories
4. **User Feedback**: Collect feedback from league members
5. **Feature Enhancements**: Add more visualization and reporting features

## 🎉 Success!

Once you complete these steps, you'll have a fully functional Fantasy NHL Stats application that:

- ✅ Automatically syncs data from Yahoo Fantasy Sports API
- ✅ Provides comprehensive analytics and leaderboards
- ✅ Works on all devices with responsive design
- ✅ Updates daily with fresh data
- ✅ Celebrates the best and worst moments in your league's history

Your league members will love tracking their Hall of Fame achievements and (hopefully) avoiding the Wall of Shame!
