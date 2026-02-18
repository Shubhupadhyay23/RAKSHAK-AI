# 🚀 Deploy RAKSHAK-AI to Vercel (100% FREE)

This guide shows how to deploy RAKSHAK-AI completely free on Vercel using serverless functions.

## What Changed?

✅ **Converted from Express server to Vercel Serverless Functions**
- Backend routes now in `api/` directory
- Frontend builds to static HTML/CSS/JS
- No cost - Vercel free tier covers everything

## Prerequisites

1. **GitHub Account** (free) - [github.com](https://github.com)
2. **Vercel Account** (free) - [vercel.com](https://vercel.com)
3. **Code pushed to GitHub** - Your RAKSHAK-AI repository

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

First, push your latest code to GitHub:

```bash
# Verify changes are staged
git status

# Commit changes
git add .
git commit -m "Convert to Vercel serverless for free deployment"

# Push to GitHub
git push origin main
```

### Step 2: Connect Vercel to GitHub

1. Go to https://vercel.com
2. Click **"Sign Up"** (or log in if you have account)
3. Select **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Click **"Import Project"**

### Step 3: Import RAKSHAK-AI Repository

1. Search for **"RAKSHAK-AI"** repository
2. Click on it to select it
3. Vercel will auto-detect it's a Vite project
4. Click **"Deploy"**

### Step 4: Configure Environment Variables (Optional)

If you have Supabase credentials and want to use live data:

1. In Vercel dashboard, go to **Settings → Environment Variables**
2. Add these variables:

```
VITE_SUPABASE_URL = your-supabase-url
VITE_SUPABASE_ANON_KEY = your-supabase-anon-key
VITE_OPENAI_API_KEY = your-openai-key (optional)
```

**Note**: Without these, the app works perfectly in DEMO MODE with simulated events.

### Step 5: Done! ✅

Your app is now live at:
```
https://your-project-name.vercel.app
```

**Features available immediately:**
- ✅ Interactive India Live Map
- ✅ 4 Event Types (Fire, Deforestation, Pollution, Flood)
- ✅ Quick Action Filters
- ✅ Alert Details Page
- ✅ Simulated Events (Demo Mode)
- ✅ Real-time updates (if Supabase configured)

---

## 🔧 How It Works

### Before (Local Development)
```
User Browser
    ↓
Vite Dev Server (:8080)
    ↓
Express Server (:5000)
    ↓
Supabase / APIs
```

### After (Vercel Production)
```
User Browser
    ↓
Vercel CDN (Static Files)
    ↓
Vercel Serverless Functions
    ↓
Supabase / APIs (if configured)
```

### Key Files

- **`api/events.ts`** - GET/POST events endpoint
- **`api/alerts.ts`** - GET/POST alerts, generate AI actions
- **`vercel.json`** - Deployment configuration
- **`.vercelignore`** - Files to exclude from deployment

---

## 📊 Understanding the Free Tier

**Vercel Free Tier Includes:**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited serverless function invocations
- ✅ Unlimited deployments
- ✅ Global CDN for static files
- ✅ HTTPS included
- ✅ Custom domain support
- ❌ No logs retention (Pro feature)

**Will RAKSHAK-AI work?** YES! Completely.

**Example Usage:**
- Events requests: ~1KB each
- Alert detail requests: ~3KB each
- 1000 daily users = ~10 MB/day = ~300 MB/month
- **Well under 100 GB limit** ✅

---

## 🔄 Deploying Updates

Every time you push to GitHub, Vercel automatically deploys:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Vercel auto-builds and deploys
# Check deployment status at: vercel.com/dashboard
```

---

## 🆘 Troubleshooting

### Issue: 404 Error
**Solution**: Refresh the page. Vercel sometimes needs a moment to route frontend requests properly.

### Issue: API returning 404
**Solution**: Make sure you have the latest `api/` directory files deployed. Check Vercel logs.

### Issue: Map not showing
**Solution**: This is fine in demo mode. Map loads from CDN. Check browser console for errors.

### Issue: Images/CSS not loading
**Solution**: Clear browser cache (Ctrl+Shift+Delete) and refresh.

---

## 📈 Next Steps

### Add Supabase (Optional - for live data)

1. Create free Supabase account: https://supabase.com
2. Create a new project
3. Copy your credentials
4. Add to Vercel environment variables
5. Create database schema from `infra/supabase-schema.sql`

### Add Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings → Domains**
2. Add your domain
3. Update DNS records (instructions on Vercel)

### Monitor Usage

1. In Vercel dashboard, go to **Analytics**
2. Check bandwidth, requests, and function invocations
3. Stay within free limits

---

## 🎯 You're Done!

Your RAKSHAK-AI is now live on the internet for **completely FREE**. Share the link with anyone:

```
https://your-project-name.vercel.app
```

No credit card required. No limits on features. Just pure functionality.

---

## 📝 Alternative Free Hosting Options

If you want alternatives to Vercel:

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Vercel** | ✅ Full-featured | Vite/Next.js apps |
| **Netlify** | ✅ Full-featured | Static + Serverless |
| **Railway** | ⚠️ Limited ($5/mo) | Node.js backends |
| **Render** | ✅ Full-featured | Node.js/Express apps |
| **Fly.io** | ✅ Full-featured | Docker containers |

For this project, **Vercel is the best choice** - it's specifically optimized for Vite and has the most generous free tier.

---

## 💡 Questions?

Check Vercel docs: https://vercel.com/docs
