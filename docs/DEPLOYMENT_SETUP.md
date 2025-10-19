# Deployment Setup Guide

## 📋 Quick Setup Checklist

### Step 1: Create Local Environment File

```bash
# Copy the example file
copy env.example .env.local

# Or manually create .env.local with the contents from env.example
```

### Step 2: Add Your Supabase Password

Open `.env.local` and replace `[YOUR_PASSWORD]` in both connection strings with your actual Supabase database password.

**Your connection strings should look like:**
```
DATABASE_URL="postgresql://postgres:your-actual-password@db.zxusegcsddswdwudkgcc.supabase.co:5432/postgres"

DATABASE_URL_POOLER="postgresql://postgres.zxusegcsddswdwudkgcc:your-actual-password@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Step 3: Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration to create tables in Supabase
npx prisma migrate deploy

# Open Prisma Studio to verify tables were created
npx prisma studio
```

### Step 4: Add Yahoo API Credentials

In `.env.local`, add your Yahoo Fantasy Sports API credentials:
```
YAHOO_CLIENT_ID="your-actual-client-id"
YAHOO_CLIENT_SECRET="your-actual-client-secret"
YAHOO_REFRESH_TOKEN="your-actual-refresh-token"
```

### Step 5: Generate Cron Secret

```bash
# Generate a random secret (Git Bash or WSL)
openssl rand -base64 32

# Or use PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Add the generated secret to `.env.local`:
```
CRON_SECRET="your-generated-secret"
```

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `duneight/fantasy-sports-app`

### Step 3: Add Environment Variables in Vercel

**IMPORTANT:** Use the **pooler connection string** for production!

In Vercel project settings, add these environment variables:

```
DATABASE_URL=postgresql://postgres.zxusegcsddswdwudkgcc:[YOUR_PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

YAHOO_CLIENT_ID=your-yahoo-client-id
YAHOO_CLIENT_SECRET=your-yahoo-client-secret
YAHOO_REFRESH_TOKEN=your-yahoo-refresh-token
CRON_SECRET=your-generated-cron-secret
```

### Step 4: Deploy

Click "Deploy" and wait ~2 minutes.

---

## 🌐 Configure Custom Domain (Optional)

1. In Vercel project → Settings → Domains
2. Add: `lukevanwyck.com` or `fantasy.lukevanwyck.com`
3. Follow DNS instructions to point domain to Vercel

---

## ✅ Verify Deployment

### Test Your App

1. Visit your Vercel URL (e.g., `fantasy-sports-app.vercel.app`)
2. Test Yahoo sync: `https://your-app.vercel.app/api/sync-yahoo` (POST request)
3. Check database in Prisma Studio to see synced data

### Verify Cron Job

1. Go to Vercel project → Settings → Cron Jobs
2. Verify the cron is configured (from `vercel.json`)
3. It will run daily at 2 AM UTC

---

## 🔧 Troubleshooting

### "Too many connections" error
- Make sure you're using the **pooler connection string** (port 6543) in Vercel
- The direct connection (port 5432) is only for local migrations

### Migration fails
- Verify your password is correct
- Make sure you're using the **direct connection string** (port 5432) for migrations
- Check Supabase dashboard to ensure database is active

### Yahoo API sync fails
- Verify your Yahoo API credentials are correct
- Check that your refresh token is still valid
- Look at Vercel logs for detailed error messages

---

## 📊 Connection String Reference

| Use Case | Connection String | Port |
|----------|------------------|------|
| Local migrations | Direct connection | 5432 |
| Prisma Studio | Direct connection | 5432 |
| Local development | Direct connection | 5432 |
| **Vercel production** | **Session pooler** | **6543** |

---

## 🎉 You're Done!

Your app is now:
- ✅ Deployed to Vercel
- ✅ Connected to Supabase PostgreSQL
- ✅ Syncing Yahoo Fantasy data daily
- ✅ Ready for users!

