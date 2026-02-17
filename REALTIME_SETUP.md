# RAKSHAK-AI Realtime Updates Setup

Guide to enable live, real-time event updates when Supabase is configured.

## What Are Realtime Updates?

When properly configured, RAKSHAK-AI listens for new events and alerts in real-time:

- ✅ New fire detections appear instantly on dashboard
- ✅ New alerts trigger automatically
- ✅ No need to refresh the page
- ✅ Multiple users see updates simultaneously

## Current Status

### Demo Mode (No Supabase)
- Status: **Demo** (shown in header)
- Behavior: Uses mock data, no realtime
- Updates: Manual refresh only

### Live Mode (With Supabase)
- Status: **Live** (shown in header)
- Behavior: Real Supabase data + realtime updates
- Updates: Automatic as events are created

## Setup Checklist

### 1. Supabase Configuration

**Required:**
- Supabase project created
- `.env` file with credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Verify:**
```bash
# Check if credentials are valid
curl https://your-project.supabase.co/rest/v1/
# Should return API info, not 404
```

### 2. Database Setup

**Required:**
1. Run SQL schema in Supabase:
   - Go to SQL Editor
   - Run `infra/supabase-schema.sql`
   - Creates `events`, `alerts`, `evidences` tables

**Verify:**
```bash
# Check tables exist in Supabase dashboard
# Table Editor → Should see: events, alerts, evidences
```

### 3. Realtime Configuration

**Supabase Realtime Replication:**

By default, Supabase Realtime replication might be disabled. Enable it:

1. Go to your Supabase project dashboard
2. Click **Replication** (in left sidebar)
3. Find `public.events` and `public.alerts` tables
4. Toggle **Enable realtime** for each table
5. Save changes

**Enable WAL (Write-Ahead Logging):**

Realtime requires WAL to be enabled on tables:

```sql
-- Run in Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidences;
```

### 4. Frontend Configuration

**Already included** - Just need Supabase credentials in `.env`

The Dashboard automatically:
- ✅ Detects Supabase configuration
- ✅ Subscribes to events table
- ✅ Listens for INSERT events
- ✅ Converts realtime data to UI format
- ✅ Shows status in header (Live vs Demo)

## Troubleshooting

### Status Shows "Demo" Instead of "Live"

**Cause:** Supabase not detected

**Fix:**
1. Check `.env` file has real credentials (not placeholders)
2. Verify `VITE_SUPABASE_URL` doesn't contain "placeholder"
3. Restart dev server: `pnpm dev`
4. Check browser console for Supabase errors

### Header Shows "Live" But No Updates

**Cause:** Realtime replication not enabled

**Fix:**
1. Go to Supabase dashboard → **Replication**
2. Enable replication for `public.events` table
3. Run SQL commands above to enable WAL
4. Restart dev server
5. Open browser dev tools → Console
6. Should see: `[Realtime] New events event (INSERT): {...}`

### "Channel error - Supabase may not be configured"

**Cause:** Credentials invalid or network issue

**Fix:**
1. Verify credentials are correct in `.env`
2. Check internet connection
3. Verify Supabase project is active
4. Check Supabase status: https://status.supabase.com

### Still Not Working?

**Debug steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[Realtime]` logs
4. Common messages:
   - `"Supabase not configured"` → Set `.env` credentials
   - `"Channel error"` → Check Realtime settings in Supabase
   - `"New event:"` → Working! Event received

## Testing Realtime

### Manual Test

1. **Open two browser windows:**
   - Window 1: Dashboard
   - Window 2: Supabase SQL editor

2. **Insert test event in Window 2:**
```sql
INSERT INTO events (
  id, source, event_type, confidence, 
  location, latitude, longitude, properties, created_at
) VALUES (
  'evt_test_' || now()::text,
  'test',
  'fire',
  0.95,
  'Test Location',
  28.5,
  77.1,
  '{"test": true}'::jsonb,
  now()
);
```

3. **Watch Window 1:**
   - New event should appear at top of list
   - No page refresh needed
   - Console should show: `[Realtime] New event:`

### Production Ingestion

When FIRMS data is ingested:

```sql
-- This is done automatically every 15 min
INSERT INTO events (...) VALUES (...)
```

All connected dashboards see new events instantly.

## Performance

Realtime updates are optimized for:
- ✅ High-frequency events (fires detected every 10 min)
- ✅ Multiple concurrent users
- ✅ Large event lists (100+ events)
- ✅ Mobile devices (responsive)

## Security

Realtime uses:
- ✅ Row-Level Security (RLS) - Only authorized users see data
- ✅ Service Role Key - Backend admin access
- ✅ Anon Key - Frontend read-only access
- ✅ HTTPS - Encrypted in transit

## Advanced Configuration

### Subscribe to Specific Event Type

Currently: All INSERT events on `events` table

To subscribe to specific types (future enhancement):

```typescript
// Not yet implemented, but planned
useRealtimeEvents({
  eventTable: "events",
  filter: "event_type=eq.fire", // Only fire events
})
```

### Custom Alert Subscriptions

Subscribe to alerts instead of raw events:

```typescript
const { isSubscribed: alertsLive } = useRealtimeAlerts({
  onNewAlert: (alert) => {
    console.log("New alert:", alert);
  },
});
```

## More Info

- **Supabase Realtime Docs:** https://supabase.com/docs/guides/realtime
- **Replication Setup:** https://supabase.com/docs/guides/realtime/overview#enable-realtime-on-tables
- **Frontend Integration:** See `client/hooks/useRealtimeEvents.ts`

## Summary

| Feature | Demo Mode | Live Mode |
|---------|-----------|-----------|
| Status in header | Demo | Live |
| Data source | Mock | Supabase |
| Updates | Manual only | Real-time |
| User count | N/A | Multi-user |
| Setup required | None | Supabase + Realtime enabled |
| Speed | N/A | <1 second |

To enable Live Mode:
1. Set `.env` with Supabase credentials
2. Enable Realtime replication in Supabase dashboard
3. Restart dev server
4. Done! 🎉

---

**Questions?** Check `.env` → Supabase → Realtime → Browser Console in that order.
