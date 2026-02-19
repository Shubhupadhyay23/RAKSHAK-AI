# 🔧 Vercel Deployment Fixes & Solutions

## Issues Fixed for Free Deployment

### Issue 1: Environment Variable Error
**Error:** `Environment Variable "VITE_API_URL" references Secret "vite_api_url", which does not exist.`

**Root Cause:**
- `vercel.json` was trying to reference an environment secret that wasn't configured
- Vercel doesn't automatically resolve undefined secrets

**Solution:**
- Removed the `env` section from `vercel.json`
- API routes work without environment variables (using mock data as fallback)
- Users can optionally add Supabase credentials in Vercel dashboard later

**Before:**
```json
{
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

**After:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/spa",
  "framework": "vite"
}
```

---

### Issue 2: Path-to-Regexp Routing Error
**Error:** `TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError`

**Root Cause:**
- `vercel.json` had custom routing patterns that Vercel couldn't parse
- Complex regex patterns in routes aren't supported in `vercel.json`
- The build process was confused by malformed routing

**Solution:**
- Removed all custom routes from `vercel.json`
- Vercel automatically handles file-based routing:
  - `api/events.ts` → `/api/events`
  - `api/alerts/[id].ts` → `/api/alerts/:id`
- No complex pattern matching needed

**Before:**
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1.ts" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**After:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/spa",
  "framework": "vite"
}
```

---

### Issue 3: Express Server Interfering with Vercel Build
**Error:** Vercel attempting to build `dist/server/node-build.mjs` which doesn't exist in production

**Root Cause:**
- `vite.config.ts` was importing Express server unconditionally
- During Vercel build (production mode), this import was causing issues
- The Express plugin was trying to load in both dev and build modes

**Solution:**
- Made Express plugin conditional on development mode only
- Used dynamic import for server module
- Added error handling for missing server in production

**Updated vite.config.ts:**
```typescript
export default defineConfig(({ mode }) => {
  const plugins: any[] = [react()];

  // Only add Express plugin in development
  if (mode === "development") {
    plugins.push(expressPlugin());
  }

  return {
    // ... rest of config
  };
});
```

---

## File Structure for Vercel

Your deployment is now structured as:

```
Project Root
├── vercel.json              (Minimal config)
├── package.json             (npm scripts)
├── vite.config.ts          (Only loads Express in dev)
├── client/                  (React frontend)
│   ├── pages/
│   ├── components/
│   └── ...
├── api/                     (Serverless functions)
│   ├── events.ts
│   ├── alerts.ts
│   └── alerts/
│       └── [id].ts         (Dynamic route)
├── server/                  (Dev-only, not deployed)
│   └── ...
└── dist/spa/               (Build output - deployed to Vercel)
    ├── index.html
    └── assets/
```

---

## How Vercel Routes Work

**Automatic file-based routing:**

| File Path | HTTP Endpoint |
|-----------|---------------|
| `api/events.ts` | `GET /api/events` |
| `api/alerts.ts` | `GET /api/alerts` |
| `api/alerts/[id].ts` | `GET /api/alerts/123` |

**No custom routes needed** - Vercel handles everything automatically!

---

## Deployment Steps (Updated)

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Fix Vercel config - remove custom routes and env secrets"
git push origin main
```

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Select your RAKSHAK-AI repo
   - Click "Deploy"
   - **Don't add any environment variables** (optional if you want Supabase later)

3. **Done!** Your app is live at `https://your-project.vercel.app`

---

## Common Vercel Issues & Fixes

### ❌ Problem: Still getting 404 errors
**Solution:** Clear Vercel cache
- In Vercel dashboard, go to **Settings → Advanced**
- Click **Clear Cache**
- Trigger a redeploy

### ❌ Problem: API returning 500 errors
**Solution:** Check function logs
- In Vercel dashboard, click **Functions**
- Look for errors in function logs
- Make sure `api/` files export a default handler

### ❌ Problem: Static files (CSS, JS) not loading
**Solution:** Clear browser cache
- Hard refresh: `Ctrl+Shift+Delete` (delete cache)
- Then reload page

### ❌ Problem: Map not showing
**Solution:** This is normal in production
- Leaflet CSS loads from CDN
- Check browser Network tab for errors
- Make sure JavaScript errors aren't blocking the map

---

## What Works Now

✅ **Frontend (React):**
- Dashboard with interactive map
- Alert detail pages
- Quick action filters
- Demo realtime events every 8 seconds
- Responsive design

✅ **Backend (Serverless):**
- `/api/events` - GET events
- `/api/alerts` - GET alerts
- `/api/alerts/:id` - GET alert details
- `/api/alerts/:id/generate` - AI action generation
- CORS enabled for all requests

✅ **Demo Mode (No setup required):**
- Simulated fire, deforestation, pollution, flood events
- Mock alert data
- Mock evidence (satellite imagery)
- Everything works immediately

✅ **Optional: Live Mode (With Supabase):**
- Add Supabase credentials in Vercel dashboard
- Get real data from database
- Realtime updates enabled
- AI action generation using OpenAI

---

## Next Steps

### Option A: Deploy Now (Recommended for Students)
- Just push to GitHub and Vercel auto-deploys
- App works completely in demo mode
- Free and instant

### Option B: Add Supabase Later (Optional)
1. Create free account: https://supabase.com
2. Get your credentials
3. In Vercel dashboard, add as environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. App auto-switches to live mode

### Option C: Add OpenAI (Optional)
1. Get API key: https://platform.openai.com
2. Add as Vercel environment variable: `OPENAI_API_KEY`
3. AI action generation will use real OpenAI instead of mock

---

## Mental Model: Vercel vs Express

**Express (Local Development):**
```
User Request
    ↓
Vite Dev Server (:8080)
    ↓
Express Middleware
    ↓
Route Handlers (app.get, app.post, etc.)
    ↓
Response
```

**Vercel (Production):**
```
User Request
    ↓
Vercel Global CDN
    ↓
Static Files OR Serverless Function
    ↓
File Handler (api/events.ts, api/alerts/[id].ts)
    ↓
Response
```

**Key Difference:** Vercel uses **file structure** instead of **route definitions**. This makes it:
- Simpler (no routing code needed)
- Faster (parallel function invocations)
- Cheaper (pay only for what you use)
- More scalable (auto-scales to zero)

---

## Troubleshooting Checklist

Before contacting support, verify:

- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] No uncommitted changes (`git status`)
- [ ] `vercel.json` looks correct (simple config, no custom routes)
- [ ] `vite.config.ts` doesn't import server in production
- [ ] `package.json` build script is just `vite build`
- [ ] API files are in `api/` directory
- [ ] `api/events.ts` exports default handler
- [ ] `api/alerts.ts` exports default handler
- [ ] No TypeScript errors locally (`npm run typecheck`)
- [ ] Build succeeds locally (`npm run build`)

---

## Questions?

**Vercel Documentation:** https://vercel.com/docs  
**Vite Documentation:** https://vitejs.dev  
**React Documentation:** https://react.dev  

Your RAKSHAK-AI is now **Vercel-ready and 100% FREE to deploy!** 🚀
