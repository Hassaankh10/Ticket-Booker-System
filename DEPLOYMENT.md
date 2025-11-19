# Vercel Deployment Guide

This guide will help you deploy the TicketBooker application to Vercel through GitHub.

## Prerequisites

1. **GitHub Account**: Your code should be pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **GitHub Repository**: Your project should be in a GitHub repository

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

Make sure all your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Sign in to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"** to connect your GitHub account
4. Authorize Vercel to access your GitHub repositories

### Step 3: Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"Ticket-Booker-System"** and click **"Import"**

### Step 4: Configure Project Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Step 5: Configure Environment Variables

**IMPORTANT**: You must set these environment variables in Vercel:

1. In the project configuration page, scroll to **"Environment Variables"**
2. Click **"Add"** and add each variable:

#### Required Variables:

```
JWT_SECRET=your-super-secure-secret-key-here-minimum-32-characters
```

**Generate a secure JWT secret:**
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Optional Variables (with defaults):

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app-name.vercel.app
CORS_ORIGINS=https://your-app-name.vercel.app
DB_PATH=/tmp/ticket_booking_system.db
```

**Note**: 
- `DB_PATH` should be `/tmp/` for Vercel's serverless functions (temporary storage)
- `FRONTEND_URL` should be your Vercel deployment URL
- `CORS_ORIGINS` should match your Vercel domain

### Step 6: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Install dependencies
   - Build your Next.js application
   - Deploy to a production URL
3. Wait for the build to complete (usually 2-5 minutes)

### Step 7: Verify Deployment

1. Once deployed, you'll get a URL like: `https://ticket-booker-system.vercel.app`
2. Visit the URL to test your application
3. Check the **"Logs"** tab if there are any errors

## Important Notes for SQLite on Vercel

⚠️ **SQLite Limitations on Vercel:**

- **Serverless Functions**: Vercel uses serverless functions that are stateless
- **Temporary Storage**: The `/tmp` directory is writable but **resets between deployments**
- **Database Persistence**: SQLite database will be **recreated on each deployment**
- **Data Loss**: All data will be lost when:
  - A new deployment occurs
  - Serverless functions restart
  - After inactivity periods

### Recommended Solutions:

1. **For Production**: Consider migrating to a persistent database:
   - **Vercel Postgres** (recommended for Vercel)
   - **PlanetScale** (MySQL)
   - **Supabase** (PostgreSQL)
   - **MongoDB Atlas**

2. **For Development/Demo**: Current SQLite setup works but data won't persist

## Post-Deployment Steps

### 1. Initialize Database

After first deployment, visit:
```
https://your-app.vercel.app/api/init-db
```

This will create the database and seed initial data.

### 2. Test the Application

1. Visit your Vercel URL
2. Register a new account
3. Test login functionality
4. Test forgot password (check console for reset token in dev mode)

### 3. Set Up Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Error**: `better-sqlite3` native module issues

**Solution**: 
- Vercel should handle this automatically
- If issues persist, check build logs
- Ensure Node.js version is compatible (Vercel uses Node 18.x by default)

### Database Not Working

**Error**: Database file not found or permission denied

**Solution**:
- Ensure `DB_PATH` is set to `/tmp/ticket_booking_system.db`
- Check that database initialization runs on first request
- Review function logs in Vercel dashboard

### Environment Variables Not Working

**Error**: `JWT_SECRET is required`

**Solution**:
- Double-check environment variables are set in Vercel
- Ensure they're set for **Production**, **Preview**, and **Development** environments
- Redeploy after adding environment variables

### API Routes Not Working

**Error**: 404 or 500 errors on API routes

**Solution**:
- Check that API routes are in `pages/api/` directory
- Verify routes export default handler functions
- Check Vercel function logs for detailed errors

## Monitoring & Logs

1. **Function Logs**: 
   - Go to **Deployments** → Click on a deployment → **Functions** tab
   - View real-time logs for debugging

2. **Analytics**:
   - Enable Vercel Analytics in project settings
   - Monitor performance and errors

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Production**: Pushes to `main` branch → Production deployment
2. **Preview**: Pull requests → Preview deployments
3. **Automatic**: Every push triggers a new deployment

## Updating Your Deployment

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. Vercel will automatically detect and deploy the changes

## Security Checklist

- [ ] Set strong `JWT_SECRET` (minimum 32 characters)
- [ ] Update `CORS_ORIGINS` to your production domain
- [ ] Remove development-only features (like showing reset tokens)
- [ ] Set `NODE_ENV=production`
- [ ] Review and update rate limiting settings
- [ ] Enable Vercel's DDoS protection

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js on Vercel**: [vercel.com/docs/frameworks/nextjs](https://vercel.com/docs/frameworks/nextjs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

## Next Steps

After successful deployment:

1. ✅ Test all functionality
2. ✅ Set up monitoring
3. ✅ Configure custom domain (optional)
4. ✅ Consider migrating to persistent database for production
5. ✅ Set up automated backups if using SQLite

---

**Deployment URL Format**: `https://your-project-name.vercel.app`

Good luck with your deployment! 🚀

