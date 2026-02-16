# RAKSHAK-AI Setup Guide

India's Digital Environmental Protection Command Center - Complete setup instructions for deploying RAKSHAK-AI.

## Prerequisites

- Node.js 18+ with npm/pnpm
- Supabase account (free tier available)
- NASA FIRMS API key (free)
- OpenAI API key (optional, for government action AI)
- GitHub account (for deployment)

## Step 1: Environment Setup

### 1.1 Get Required API Keys

**NASA FIRMS API Key** (for satellite fire detection):
1. Visit https://firms.modaps.eosdis.nasa.gov/api/
2. Create a free account
3. Request an API key (instant approval)
4. Save your key

**OpenAI API Key** (for government action generation):
1. Visit https://platform.openai.com/api-keys
2. Create account / login
3. Generate new API key
4. Save your key

**Supabase**:
1. Go to https://app.supabase.com
2. Create a new project
3. Go to Project Settings → API
4. Copy `Project URL` and `Service Role Key`
5. Save both

### 1.2 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
NASA_FIRMS_API_KEY=your_key_here
OPENAI_API_KEY=sk-your_key_here
```

## Step 2: Database Setup

### 2.1 Create Supabase Tables

1. Go to your Supabase project
2. Click SQL Editor
3. Create a new query
4. Copy the entire contents of `infra/supabase-schema.sql`
5. Paste into the SQL Editor
6. Click "Run"

This creates:
- `events` table (for fire, deforestation, pollution, flood events)
- `alerts` table (actionable alerts with suggested actions)
- `evidences` table (satellite imagery, sensor data)
- `audit_logs` table (governance and traceability)
- `users` table (for officers and admins)
- Sample test data

### 2.2 Verify Database

In Supabase Dashboard:
1. Go to Table Editor
2. You should see `events` table with 4 sample events
3. Check `alerts` table has sample alerts
4. Note: Tables use PostGIS for geographic queries

## Step 3: Local Development

### 3.1 Install Dependencies

```bash
pnpm install
# or npm install / yarn install
```

### 3.2 Run Development Server

```bash
pnpm dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

### 3.3 Test the System

**Check Backend Health:**
```bash
curl http://localhost:8080/api/ping
# Response: { "message": "pong" }
```

**Check Ingestion Status:**
```bash
curl http://localhost:8080/api/ingestion/status
```

**Get Events:**
```bash
curl http://localhost:8080/api/events
```

**Trigger FIRMS Ingestion (manual):**
```bash
curl -X POST http://localhost:8080/api/ingestion/firms
```

## Step 4: Frontend Features

### Dashboard Features

The dashboard displays:
- **Live Fire/Disaster Map** - Visual representation of India with event locations
- **Critical Alerts Counter** - Real-time critical alert count
- **Active Events List** - All recent events sorted by severity
- **Quick Actions** - Buttons to generate reports, view specific event types
- **System Status** - Shows which data sources are active

### Alert Detail Page

Click any event to see:
- **Event Details** - Location, confidence, predicted spread
- **Evidence** - Satellite imagery, sensor data, AI model outputs
- **Government Action AI** - Click "Generate Action Plan" to:
  - Get immediate actions for officers
  - See resource requirements
  - Download incident report (PDF)
  - Get public SMS alert message
- **Response Checklist** - Track response status

## Step 5: Data Ingestion

### NASA FIRMS Integration

RAKSHAK-AI ingests real-time fire detections from NASA FIRMS satellite data.

**Manual Ingestion:**
```bash
curl -X POST http://localhost:8080/api/ingestion/firms
```

**Automated (Recommended):**

For production, set up scheduled ingestion using:

**GitHub Actions** (free):
1. Create `.github/workflows/ingest-firms.yml`:

```yaml
name: Ingest FIRMS Data
on:
  schedule:
    - cron: "*/15 * * * *"  # Every 15 minutes
jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: |
          curl -X POST https://your-api-url/api/ingestion/firms \
            -H "Content-Type: application/json"
```

**Cloud Scheduler** (Google Cloud):
1. Create a Cloud Scheduler job
2. Set frequency: `*/15 * * * *` (every 15 minutes)
3. HTTP POST to your API's `/api/ingestion/firms`

**Cron Job** (VPS/Server):
```bash
# Add to crontab
*/15 * * * * curl -X POST http://localhost:8080/api/ingestion/firms
```

## Step 6: Government Action AI

When you click "Generate Action Plan", the system:

1. **Fetches Event Details** from database
2. **Calls OpenAI** with incident data
3. **Generates Action Plan**:
   - Immediate actions (evacuation, deploy resources, etc)
   - Medium-term actions
   - Resource requirements
   - Public SMS message
   - Legal notice (if applicable)

**Example Response:**
```json
{
  "immediate": [
    "Evacuate villages within 5km radius",
    "Deploy 8 fire truck units from nearest stations",
    "Alert medical centers for potential casualties"
  ],
  "resources": [
    {"name": "Fire Trucks", "quantity": 8},
    {"name": "Helicopters", "quantity": 2}
  ],
  "sms": "ALERT: Forest fire near Mussoorie. Evacuate immediately. Call 112. -RAKSHAK"
}
```

## Step 7: Deployment

### Vercel (Recommended for Full-Stack)

1. **Push to GitHub**:
```bash
git add .
git commit -m "RAKSHAK-AI setup complete"
git push origin main
```

2. **Connect to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repo
   - Configure environment variables:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NASA_FIRMS_API_KEY`
     - `OPENAI_API_KEY`
   - Deploy

3. **Set Scheduled Ingestion**:
   - Add GitHub Actions workflow (see Step 5)
   - Calls your Vercel URL: `https://your-app.vercel.app/api/ingestion/firms`

### Netlify (Frontend) + Railway/Render (Backend)

**Frontend (Netlify)**:
1. Connect GitHub repo
2. Build command: `npm run build:client`
3. Publish directory: `dist/spa`

**Backend (Railway.app)**:
1. Create new project from GitHub
2. Select Node.js
3. Set environment variables
4. Deploy

## Step 8: Testing

### Manual Event Creation

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "source": "test",
    "event_type": "fire",
    "confidence": 0.95,
    "location": "Test Location",
    "latitude": 28.5,
    "longitude": 77.1,
    "properties": {"test": true}
  }'
```

### Generate Action for Event

```bash
curl -X POST http://localhost:8080/api/alerts/YOUR_EVENT_ID/generate \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "YOUR_EVENT_ID"
  }'
```

## Troubleshooting

### Database Connection Failed
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify Supabase project is active
- Ensure RLS policies allow access

### FIRMS API Key Invalid
- Verify key at https://firms.modaps.eosdis.nasa.gov/api/
- Check key hasn't expired

### OpenAI API Errors
- Verify key at https://platform.openai.com/api-keys
- Ensure account has credits
- Check rate limits

### Map Not Loading
- Verify browser can access Mapbox (if using)
- Check CORS configuration
- Ensure latitude/longitude data exists

## Architecture

```
RAKSHAK-AI
├── Frontend (React + Vite + Tailwind)
│   ├── Dashboard (Events + Stats)
│   ├── Alert Detail (Evidence + Actions)
│   └── Maps (Live visualization)
│
├── Backend (Node.js + Express)
│   ├── /api/events (Event CRUD)
│   ├── /api/alerts (Alert management)
│   ├── /api/ingestion (FIRMS ingestion)
│   └── /api/*/generate (LLM action generation)
│
├── Database (Supabase + PostGIS)
│   ├── events (raw detections)
│   ├── alerts (actionable items)
│   ├── evidences (imagery/sensor data)
│   └── audit_logs (governance)
│
└── AI/ML
    ├── NASA FIRMS (satellite fire detection)
    ├── Deforestation Detection (NDVI analysis)
    ├── Flood Prediction (hydrologic models)
    └── OpenAI (action generation)
```

## Next Steps

1. **Add More Data Sources**:
   - Sentinel-2 for deforestation detection
   - OpenWeather for pollution/flood
   - Local river gauges for flood forecasting

2. **Improve ML Models**:
   - Train deforestation detection model
   - Build flood prediction model
   - Add false positive filtering

3. **Enhance UI**:
   - Add real Mapbox/Leaflet integration
   - Add historical data visualization
   - Add export to PDF/Excel

4. **Integration with Government**:
   - Connect to district dashboards
   - Setup SMS/email notifications
   - Add mobile app

## Support

- **NASA FIRMS**: https://firms.modaps.eosdis.nasa.gov/
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **This Repository**: Check AGENTS.md for architecture notes

## License

RAKSHAK-AI - Environmental Protection Command Center
Built with open-source technologies for public good.
