# 🚀 Quick Deployment Reference

## Before You Deploy - Local Testing

```bash
# 1. Install dependencies
npm install

# 2. Build the application
npm run build

# 3. Test the build
npm start

# 4. Type check (should pass with no errors)
npm run typecheck

# 5. Lint check
npm run lint
```

## Git Commands for Deployment

```bash
# Initialize repository (if not done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Ready for deployment"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Environment Variables Needed for Production

Copy these from `.env.local` to Vercel dashboard:

1. **MONGODB_URI** - Your MongoDB Atlas connection string
2. **JWT_SECRET** - Strong secret (32+ characters)
3. **GEMINI_API_KEY** - Google Gemini API key
4. **SENDGRID_API_KEY** - (Optional) SendGrid API key
5. **TWILIO_SID** - (Optional) Twilio Account SID
6. **TWILIO_TOKEN** - (Optional) Twilio Auth Token
7. **TWILIO_PHONE** - (Optional) Twilio Phone Number
8. **NEXT_PUBLIC_APP_URL** - Your Vercel deployment URL

## Generate Strong JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` in Vercel.

## MongoDB Atlas Quick Setup

1. **Create Account**: https://www.mongodb.com/cloud/atlas/register
2. **Create Free M0 Cluster**
3. **Add Database User** (Database Access → Add New User)
4. **Whitelist All IPs** (Network Access → Add IP → 0.0.0.0/0)
5. **Get Connection String** (Database → Connect → Drivers)
   - Format: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/visitwise?retryWrites=true&w=majority`

## Vercel Deployment Steps

1. **Sign up**: https://vercel.com/signup (use GitHub)
2. **Import Project**: Add New → Project → Import from GitHub
3. **Configure**:
   - Framework: Next.js (auto-detected)
   - Build command: `next build`
   - Output directory: `.next`
4. **Add Environment Variables** (before first deploy)
5. **Deploy** (click Deploy button)
6. **Update NEXT_PUBLIC_APP_URL** with deployed URL
7. **Redeploy** to apply the updated URL

## Seed Production Database

After deployment, seed your production database:

```bash
# Temporarily update .env.local with production MONGODB_URI
# Then run:
node src/lib/seedPMOUser.js

# Or seed all demo users:
node src/lib/seedUsersStandalone.js

# Remember to revert .env.local back to localhost
```

## Test Production Deployment

1. Visit: `https://your-app.vercel.app`
2. Check health endpoint: `https://your-app.vercel.app/api/health`
3. Try logging in with seeded credentials
4. Test creating a workflow
5. Test submitting a form
6. Test PDF generation

## Common Issues & Fixes

### Build Fails
```bash
# Test build locally first
npm run build

# Fix TypeScript errors
npm run typecheck

# Fix lint errors
npm run lint
```

### Database Connection Error
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Ensure database user has correct permissions

### Environment Variables Not Working
- Verify all variables are set in Vercel dashboard
- Redeploy after adding new variables
- Variables starting with `NEXT_PUBLIC_` require rebuild

## Continuous Deployment

Once set up, any push to GitHub automatically triggers deployment:

```bash
# Make changes
git add .
git commit -m "Your update message"
git push origin main

# Vercel automatically deploys
```

## Rollback to Previous Version

1. Go to Vercel Dashboard → Deployments
2. Find the working deployment
3. Click "..." → "Promote to Production"

## Monitor Your Application

- **Logs**: Vercel Dashboard → Deployments → Your Deployment → Function Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Health Check**: `https://your-app.vercel.app/api/health`

## Production URLs

- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/*`
- **Health Check**: `https://your-app.vercel.app/api/health`

## Security Checklist Before Going Live

- [ ] Strong JWT_SECRET set (32+ characters)
- [ ] MongoDB Atlas IP access configured
- [ ] All API keys secured in Vercel environment variables
- [ ] No sensitive data in code
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured properly
- [ ] Rate limiting enabled (optional)

## Cost Estimate (Using Free Tiers)

- **Vercel Hobby**: Free (up to 100 GB bandwidth/month)
- **MongoDB Atlas M0**: Free (512 MB storage)
- **SendGrid**: Free (100 emails/day)
- **Twilio**: Trial credits
- **Gemini API**: Free tier limits

**Total: $0/month** for moderate usage

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Your Deployment Workflow: See `.agent/workflows/deploy.md`

---

**Need help?** Run the full deployment guide:
```bash
# Open the detailed workflow
cat .agent/workflows/deploy.md
```
