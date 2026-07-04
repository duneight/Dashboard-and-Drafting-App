# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keeper Tight is a Fantasy NHL analytics and draft management platform. It syncs with Yahoo Fantasy Sports API to provide Hall of Fame/Wall of Shame stats, live dashboards, and an interactive draft hub.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript (strict mode), TailwindCSS 4, Prisma ORM with PostgreSQL (Supabase), Chart.js, TanStack React Query.

## Common Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build (TypeScript strict, fails on errors)
npm run lint             # ESLint
npm run db:generate      # Generate Prisma client after schema changes
npm run db:migrate       # Run migrations (uses DIRECT_URL, not DATABASE_URL)
npm run db:studio        # Open Prisma Studio GUI
```

## Architecture

### Directory Structure
- `app/` - Next.js App Router (pages, API routes, components)
- `lib/` - Business logic: `api/` (Yahoo client), `analytics/` (Hall/Wall calculations), `db/` (Prisma), `draft/` (draft state), `services/` (sync logic)
- `types/` - TypeScript type definitions for draft and Yahoo API
- `prisma/schema.prisma` - Database models (Game, League, Team, Matchup, Transaction, DraftResult, DraftSession, DraftPick, DraftSnapshot)

### Data Flow
1. **Yahoo Sync**: Cron job (`/api/cron`) runs Monday & Thursday at 22:00 UTC (~5pm ET, not DST-adjusted; Thursday is a backup run). Vercel cron schedules are always UTC. The route returns a non-2xx status on an unhealthy sync (no leagues processed or real errors) so failed runs surface in Vercel instead of silently reporting success. Manual trigger via `/api/sync-yahoo`.
2. **Analytics**: `lib/analytics/` modules compute Hall of Fame (19 categories) and Wall of Shame (19 categories) from DB data
3. **Draft Hub**: Client-side React Context (`DraftProvider`) with localStorage persistence + DB sync via `/api/draft/*` endpoints

### Key Patterns
- **Server Components by default** - add `'use client'` only when needed for interactivity
- **React Query** for async data fetching and caching on client
- **Prisma singleton** pattern in `lib/db/prisma.ts`
- **Zod schemas** for API request validation in `lib/validation.ts`
- **Parallel queries** with `Promise.all()` for Prisma operations

## Database Connection

Supabase PostgreSQL requires two URLs:
- `DATABASE_URL` - Transaction Pooler (port 6543) for application queries
- `DIRECT_URL` - Session Pooler (port 5432) for migrations (required because Transaction Pooler doesn't support prepared statements)

## API Routes

- `/api/cron` - Scheduled Yahoo data sync (protected by CRON_SECRET)
- `/api/sync-yahoo` - Manual sync trigger (also protected by CRON_SECRET: `Authorization: Bearer <secret>`)
- `/api/stats/hall-of-fame`, `/api/stats/wall-of-shame` - Analytics endpoints
- `/api/draft/save`, `/api/draft/load`, `/api/draft/export`, `/api/draft/reset` - Draft persistence
- `/api/cache/clear`, `/api/cache/health` - Cache management

## Git & GitHub Accounts

This is a personal repo; the machine's default GitHub tooling is set up for work.
- **Pushing:** remote is `git@github.com:duneight/Dashboard-and-Drafting-App.git` over SSH. The SSH key is set up for the personal `duneight` account — plain `git push` works and is the intended path.
- **`gh` CLI:** logged in as the **work** account (`AdvantageDrafting`), which has no access here. Do NOT use `gh` for PRs/API calls against this repo; commit and push directly to `main` via git over SSH instead.

## Environment Variables

Required in `.env`:
```
DATABASE_URL=          # Supabase Transaction Pooler (port 6543)
DIRECT_URL=            # Supabase Session Pooler (port 5432)
YAHOO_CLIENT_ID=       # Yahoo OAuth2 client ID
YAHOO_CLIENT_SECRET=   # Yahoo OAuth2 secret
YAHOO_REFRESH_TOKEN=   # Persistent refresh token
CRON_SECRET=           # Vercel cron authorization
```

Optional:
```
CRON_ALERT_WEBHOOK=    # POST target (Slack/Discord/healthchecks.io) for unhealthy cron syncs
```
