# Fantasy NHL Stats - Vercel Deployment Guide

## 🎯 Overview

This guide will walk you through deploying your Fantasy NHL Stats application to Vercel. Your app is **almost ready** for deployment with just a few remaining steps to complete.

## ✅ Current Status

### Fixed Issues
- ✅ **Yahoo API Import Error** - Fixed incorrect import from `YahooFantasyAPI` to `YahooApiClient`
- ✅ **TypeScript Import Paths** - Fixed incorrect import paths from `@/fantasy-nhl-stats/types/yahoo` to `@/types/yahoo`
- ✅ **Type Safety Issues** - Fixed type mismatches in analytics files
- ✅ **XML2JSON Import** - Fixed incorrect import from `parseString` to `toJson`
- ✅ **TailwindCSS Configuration** - Fixed darkMode configuration and module resolution
- ✅ **TypeScript Compilation** - All TypeScript errors resolved

### Remaining Issue
- ⚠️ **Runtime Error**: The build fails at runtime due to a native module (`node_expat`) issue with the `xml2json` package

## 🚀 Step-by-Step Deployment Process

### Step 1: Fix the XML2JSON Issue

The `xml2json` package has native dependencies that don't work well with Vercel. Replace it with a pure JavaScript alternative:

```bash
# Remove the problematic package
npm uninstall xml2json

# Install a pure JavaScript alternative
npm install fast-xml-parser
```

Then update your Yahoo API client:

```typescript
// In lib/api/yahoo.ts, replace:
import { toJson } from 'xml2json'

// With:
import { XMLParser } from 'fast-xml-parser'

// And replace the usage:
// OLD: return JSON.parse(toJson(response.data))
// NEW: 
const parser = new XMLParser()
return parser.parse(response.data)
```

### Step 2: Environment Variables Setup

Create your local environment file:

```bash
# Copy the example file
cp env.example .env.local
```

Fill in your actual values in `.env.local`:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/fantasy_nhl_stats"

# Supabase (Required - Recommended for production)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Yahoo Fantasy Sports API (Required)
YAHOO_CLIENT_ID="your-yahoo-client-id"
YAHOO_CLIENT_SECRET="your-yahoo-client-secret"
YAHOO_REFRESH_TOKEN="your-yahoo-refresh-token"

# Next.js (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Vercel Cron (Required for production)
CRON_SECRET="your_random_cron_secret"

# Vercel (for deployment)
VERCEL_URL=""
```

### Step 3: Database Setup

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and API keys from project settings
4. Update your `.env.local` with Supabase credentials
5. Run database migrations:
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

### Step 4: Yahoo API Setup

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/)
2. Create a new application
3. Get your Client ID and Client Secret
4. Follow Yahoo's OAuth flow to get a refresh token
5. Update your `.env.local` with Yahoo credentials

### Step 5: Test Local Build

After fixing the xml2json issue, test your build:

```bash
npm run build
```

If successful, you should see:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing page optimization
```

### Step 6: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: Using Git Integration

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Configure project settings

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

### Step 7: Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `YAHOO_CLIENT_ID` | Yahoo API client ID | ✅ |
| `YAHOO_CLIENT_SECRET` | Yahoo API client secret | ✅ |
| `YAHOO_REFRESH_TOKEN` | Yahoo API refresh token | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `CRON_SECRET` | Secret for cron job security | ✅ |

**To add environment variables:**
1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables"
4. Add each variable with its value
5. Make sure to set them for "Production" environment

### Step 8: Domain Configuration

#### Free Option (No Cost)
- Vercel provides a free `.vercel.app` URL
- Example: `your-app-name.vercel.app`
- No additional setup required

#### Custom Domain (Optional)
If you want a custom domain:

1. **Purchase a Domain**
   - Through Vercel: $15/year
   - Through any registrar: varies

2. **Add Domain to Vercel**
   - Go to project settings
   - Click "Domains" tab
   - Add your domain name
   - Follow DNS configuration instructions

3. **DNS Configuration**
   - **Apex Domain** (e.g., `example.com`): Set A record to Vercel's IP
   - **Subdomain** (e.g., `www.example.com`): Set CNAME record to Vercel's CNAME

## 🔧 Post-Deployment Setup

### 1. Database Migration
After deployment, run database migrations on production:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:migrate
```

### 2. Test API Endpoints
Test your deployed API endpoints:

```bash
# Test Yahoo data fetch
curl https://your-app.vercel.app/api/fetch-yahoo-data

# Test Hall of Fame
curl https://your-app.vercel.app/api/stats/hall-of-fame

# Test Wall of Shame
curl https://your-app.vercel.app/api/stats/wall-of-shame
```

### 3. Configure Cron Jobs
Your app includes automatic cron job configuration for daily data sync. The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 3 * * *"
    }
  ]
}
```

This runs daily at 3:00 AM UTC.

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Fails with Native Module Error
**Problem**: `node_expat` or similar native module errors
**Solution**: Replace native modules with pure JavaScript alternatives

#### 2. Environment Variables Not Working
**Problem**: API calls fail in production
**Solution**: 
- Verify all environment variables are set in Vercel
- Check variable names match exactly
- Ensure no trailing spaces or quotes

#### 3. Database Connection Issues
**Problem**: Database connection fails in production
**Solution**:
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure database is accessible from the internet

#### 4. Yahoo API Rate Limiting
**Problem**: Yahoo API returns 429 errors
**Solution**:
- Implement proper rate limiting in your code
- Add delays between API calls
- Consider caching responses

### Debug Commands

```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run lint

# Test database connection
npm run db:studio

# View Vercel logs
vercel logs
```

## 📊 Monitoring & Maintenance

### 1. Monitor Performance
- Use Vercel Analytics (free tier available)
- Monitor API response times
- Check error rates in Vercel dashboard

### 2. Regular Updates
- Keep dependencies updated
- Monitor Yahoo API changes
- Update environment variables as needed

### 3. Backup Strategy
- Regular database backups (Supabase handles this automatically)
- Version control for code changes
- Document any manual configuration changes

## 🎉 Success Checklist

Before considering your deployment complete, verify:

- [ ] App builds successfully locally (`npm run build`)
- [ ] All environment variables are configured
- [ ] Database is accessible and migrated
- [ ] Yahoo API credentials are working
- [ ] App deploys to Vercel without errors
- [ ] All API endpoints respond correctly
- [ ] Cron jobs are scheduled properly
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active (automatic with Vercel)

## 📞 Support

If you encounter issues:

1. **Check Vercel Logs**: `vercel logs`
2. **Review Build Output**: Check the build logs in Vercel dashboard
3. **Test Locally**: Ensure everything works locally first
4. **Check Environment Variables**: Verify all are set correctly
5. **Review Documentation**: Check [Vercel Docs](https://vercel.com/docs) and [Next.js Docs](https://nextjs.org/docs)

## 🚀 Next Steps After Deployment

1. **Set up monitoring** for your app
2. **Configure backups** for your database
3. **Set up alerts** for critical errors
4. **Plan for scaling** as your user base grows
5. **Consider adding** more features like user authentication, real-time updates, etc.

---

**Happy Deploying! 🎉**

Your Fantasy NHL Stats app is ready to go live and help fantasy hockey managers track their league's Hall of Fame and Wall of Shame moments!
