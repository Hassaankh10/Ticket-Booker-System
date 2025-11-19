# Quick Vercel Deployment Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### Step 2: Deploy on Vercel

1. **Go to**: [vercel.com](https://vercel.com)
2. **Sign in** with GitHub
3. **Click**: "Add New..." → "Project"
4. **Select**: Your `Ticket-Booker-System` repository
5. **Click**: "Import"

### Step 3: Set Environment Variables

In the project settings, add:

**Required:**
```
JWT_SECRET=your-secret-key-here
```

**Optional (for production):**
```
NODE_ENV=production
DB_PATH=/tmp/ticket_booking_system.db
FRONTEND_URL=https://your-app.vercel.app
```

### Step 4: Deploy

Click **"Deploy"** and wait 2-5 minutes.

### Step 5: Initialize Database

After deployment, visit:
```
https://your-app.vercel.app/api/init-db
```

## ⚠️ Important Notes

- **SQLite on Vercel**: Database resets on each deployment (use `/tmp/` path)
- **For Production**: Consider migrating to Vercel Postgres or another database
- **Environment Variables**: Must be set in Vercel dashboard

## 📖 Full Guide

See `DEPLOYMENT.md` for detailed instructions.

