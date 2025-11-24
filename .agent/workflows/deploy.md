---
description: Deploy application online with database
---

# Deploy VisitWise to Vercel with MongoDB Atlas

This workflow guides you through deploying your Next.js application online with a cloud MongoDB database.

## Prerequisites

- A Vercel account (free tier works)
- A MongoDB Atlas account (free M0 cluster available)
- GitHub account (for code repository)

---

## Phase 1: Set Up MongoDB Atlas (Online Database)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Choose the **M0 Free Tier** cluster

### Step 2: Create a Database Cluster
1. Click **"Create a Deployment"** or **"Build a Database"**
2. Select **"M0 - Free"** cluster
3. Choose your preferred cloud provider and region (choose nearest to your target users)
4. Name your cluster (e.g., `visitwise-cluster`)
5. Click **"Create Deployment"**

### Step 3: Set Up Database Access
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Create username and **strong password** (save these credentials securely!)
4. Grant **"Read and write to any database"** privileges
5. Click **"Add User"**

### Step 4: Configure Network Access
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Note: For production, restrict to Vercel's IP ranges
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** and click **"Connect"** on your cluster
2. Select **"Drivers"**
3. Choose **"Node.js"** as driver and select version
4. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
5. Replace `<password>` with your database user password
6. Add your database name at the end: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/visitwise?retryWrites=true&w=majority`
7. Save this connection string securely - you'll need it for Vercel

---

## Phase 2: Prepare Your Application for Deployment

### Step 6: Create .env.production template
Create a `.env.example` file documenting all required environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/visitwise?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Email Notifications (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key

# SMS Notifications (Optional)
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_PHONE=+1234567890

# Application URL (will be provided by Vercel)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 7: Verify Build Configuration
Ensure your `next.config.mjs` is production-ready:

```bash
npm run build
```

This command should complete successfully without errors.

### Step 8: Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

### Step 9: Push to GitHub
1. Create a new repository on GitHub (https://github.com/new)
2. Name it (e.g., `visitwise-production`)
3. Make it **Private** if needed
4. Run these commands:

```bash
git remote add origin https://github.com/yourusername/visitwise-production.git
git branch -M main
git push -u origin main
```

---

## Phase 3: Deploy to Vercel

### Step 10: Sign Up/Login to Vercel
1. Go to https://vercel.com/signup
2. Sign up using your GitHub account
3. Authorize Vercel to access your GitHub repositories

### Step 11: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository (`visitwise-production`)
3. Vercel will auto-detect it as a Next.js project

### Step 12: Configure Build Settings
Vercel should auto-detect:
- **Framework Preset:** Next.js
- **Build Command:** `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

No changes needed unless you have custom configurations.

### Step 13: Add Environment Variables
1. Before deploying, click **"Environment Variables"**
2. Add each variable from your `.env.local`:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Strong secret (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SENDGRID_API_KEY`: (Optional) Your SendGrid API key
   - `TWILIO_SID`: (Optional) Your Twilio SID
   - `TWILIO_TOKEN`: (Optional) Your Twilio token
   - `TWILIO_PHONE`: (Optional) Your Twilio phone number
   - `NEXT_PUBLIC_APP_URL`: Leave blank for now (will update after deployment)

3. Ensure all variables are set for **Production** environment

### Step 14: Deploy
1. Click **"Deploy"**
2. Wait for the build process to complete (usually 2-5 minutes)
3. Vercel will provide a deployment URL (e.g., `https://your-project.vercel.app`)

### Step 15: Update App URL
1. Copy your deployment URL
2. Go to Vercel project → **"Settings"** → **"Environment Variables"**
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Redeploy from the **"Deployments"** tab

---

## Phase 4: Seed Your Production Database

### Step 16: Connect to Production Database Locally
Update your local `.env.local` temporarily:
```
MONGODB_URI=your-production-mongodb-atlas-connection-string
```

### Step 17: Run Seed Scripts
```bash
node src/lib/seedPMOUser.js
```

Or seed all demo users if needed:
```bash
node src/lib/seedUsersStandalone.js
```

### Step 18: Verify Database
1. Go to MongoDB Atlas → **"Database"** → **"Browse Collections"**
2. Verify users, templates, and other collections are created
3. Revert your local `.env.local` back to localhost if needed

---

## Phase 5: Test Your Production Application

### Step 19: Access Your Deployed App
1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Try logging in with seeded credentials
3. Test creating a workflow, submitting forms, etc.

### Step 20: Monitor Deployment
1. Go to Vercel Dashboard → **"Deployments"**
2. Click on your deployment to see logs
3. Check for any runtime errors

### Step 21: Check Database Connection
Access: `https://your-project.vercel.app/api/health`

Should return:
```json
{
  "status": "ok",
  "mongodb": {
    "configured": true,
    "connected": true
  }
}
```

---

## Phase 6: Set Up Continuous Deployment (Optional)

### Step 22: Auto-Deploy on Git Push
Vercel automatically deploys on every push to `main` branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically build and deploy your changes.

### Step 23: Preview Deployments
- Create feature branches for testing
- Vercel creates preview URLs for every branch/PR
- Merge to `main` when ready for production

---

## Troubleshooting Common Issues

### Issue: "Module not found" errors
**Solution:** 
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue: Database connection timeout
**Solution:**
1. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
2. Check connection string format is correct
3. Ensure database user has correct permissions

### Issue: Environment variables not working
**Solution:**
1. Verify all variables are set in Vercel dashboard
2. Redeploy after adding new variables
3. For `NEXT_PUBLIC_*` variables, rebuild is required

### Issue: Build fails during deployment
**Solution:**
```bash
# Test build locally first
npm run build

# Fix any TypeScript errors
npm run typecheck

# Fix any linting issues
npm run lint
```

---

## Post-Deployment Checklist

- [ ] Application loads successfully at production URL
- [ ] Login/authentication works with production database
- [ ] All API endpoints respond correctly
- [ ] Forms can be submitted and saved to database
- [ ] PDF generation works
- [ ] Email notifications work (if configured)
- [ ] Dashboard analytics display correctly
- [ ] Mobile responsiveness verified
- [ ] Performance is acceptable (check Vercel Analytics)

---

## Maintenance Commands

### Update Production Environment Variable
```bash
# Via Vercel CLI (optional)
vercel env add VARIABLE_NAME production
```

### View Production Logs
```bash
vercel logs your-project.vercel.app
```

### Rollback Deployment
1. Go to Vercel Dashboard → **"Deployments"**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

---

## Security Reminders

1. **Never commit `.env.local` or `.env.production` to Git**
2. **Use strong, unique JWT_SECRET** (minimum 32 characters)
3. **Restrict MongoDB Atlas IP access** to Vercel IPs in production
4. **Enable MongoDB Atlas backup** for data safety
5. **Rotate secrets regularly** (JWT_SECRET, API keys)
6. **Monitor Vercel Analytics** for unusual traffic patterns
7. **Set up domain** with HTTPS (Vercel provides free SSL)

---

## Next Steps

1. **Custom Domain:** Add your custom domain in Vercel settings
2. **Analytics:** Enable Vercel Analytics for performance monitoring
3. **Error Tracking:** Integrate Sentry for error monitoring
4. **Backup Strategy:** Set up automated MongoDB Atlas backups
5. **Monitoring:** Set up uptime monitoring (e.g., UptimeRobot)

---

**Deployment Complete!** 🎉

Your application is now live at: `https://your-project.vercel.app`
