-- RAKSHAK-AI Database Schema
-- Run this SQL in your Supabase project's SQL Editor

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (for government officers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'officer', -- admin, officer, viewer
  department TEXT, -- Forest, Disaster Management, Police, District Admin, etc.
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Events table (raw detections from various sources)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL, -- 'firms', 'deforestation_model', 'aqi_api', 'flood_model', 'sensor'
  event_type TEXT NOT NULL, -- 'fire', 'deforestation', 'pollution', 'flood'
  confidence NUMERIC NOT NULL, -- 0-1
  location TEXT NOT NULL, -- Human readable location
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  properties JSONB DEFAULT '{}',
  geometry GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for spatial queries
CREATE INDEX IF NOT EXISTS idx_events_geometry ON events USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_source ON events (source);

-- Alerts table (actionable alerts derived from events)
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'in_progress', 'resolved'
  suggested_actions JSONB DEFAULT '{}', -- LLM generated action plan
  generated_pdf_url TEXT,
  dispatch_sms_sent BOOLEAN DEFAULT false,
  dispatch_sms_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_event_id ON alerts (event_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at DESC);

-- Evidence table (satellite imagery, sensor data, AI predictions)
CREATE TABLE IF NOT EXISTS evidences (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'satellite', 'sensor', 'ai_model'
  title TEXT NOT NULL,
  storage_path TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidences_event_id ON evidences (event_id);
CREATE INDEX IF NOT EXISTS idx_evidences_type ON evidences (type);

-- Audit logs for governance and traceability
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'generated_action', 'acknowledged', 'dispatched', 'resolved'
  alert_id TEXT REFERENCES alerts(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_alert_id ON audit_logs (alert_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- System logs for monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL, -- 'info', 'warning', 'error'
  service TEXT, -- 'ingestion', 'model', 'api', 'llm'
  message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs (level);
CREATE INDEX IF NOT EXISTS idx_system_logs_service ON system_logs (service);

-- Statistics/Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'detection_latency', 'false_positive_rate', 'lives_saved_estimate'
  event_type TEXT,
  value NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_type ON metrics (metric_type);

-- Realtime subscriptions setup (for client-side live updates)
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE evidences REPLICA IDENTITY FULL;

-- RLS Policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read events and alerts (unauthenticated access for demo)
CREATE POLICY "Events are public" ON events FOR SELECT USING (true);
CREATE POLICY "Alerts are public" ON alerts FOR SELECT USING (true);
CREATE POLICY "Evidences are public" ON evidences FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Service role can insert/update (for backend operations)
-- Note: When using service role key, RLS is bypassed

-- Sample data for initial testing
INSERT INTO events (
  id, source, event_type, confidence, location, latitude, longitude, 
  geometry, properties, created_at
) VALUES
(
  'evt_demo_001', 'firms', 'fire', 0.94, 
  'Uttarakhand, Northern Ridge', 30.45, 78.15,
  ST_GeomFromText('POINT(78.15 30.45)', 4326),
  '{"brightness": 320, "satellite": "VIIRS", "radsth": 5.0}',
  now() - interval '2 minutes'
),
(
  'evt_demo_002', 'deforestation_model', 'deforestation', 0.87,
  'Madhya Pradesh', 22.9, 78.65,
  ST_GeomFromText('POINT(78.65 22.9)', 4326),
  '{"area_hectares": 250, "change_percent": 45.2, "ndvi_delta": -0.35}',
  now() - interval '15 minutes'
),
(
  'evt_demo_003', 'aqi_api', 'pollution', 0.91,
  'Delhi NCR', 28.5, 77.1,
  ST_GeomFromText('POINT(77.1 28.5)', 4326),
  '{"aqi": 387, "wind_speed": 12, "wind_direction": "N"}',
  now() - interval '28 minutes'
),
(
  'evt_demo_004', 'flood_model', 'flood', 0.78,
  'Bihar, Kosi Basin', 26.15, 87.5,
  ST_GeomFromText('POINT(87.5 26.15)', 4326),
  '{"rainfall_mm": 85, "river_level_m": 3.2, "forecast_hours": 12}',
  now() - interval '60 minutes'
)
ON CONFLICT DO NOTHING;

-- Create sample alerts
INSERT INTO alerts (
  id, event_id, severity, status, suggested_actions
) VALUES
(
  'alrt_demo_001', 'evt_demo_001', 'critical', 'open',
  jsonb_build_object(
    'immediate', jsonb_build_array(
      'Evacuate villages within 5km radius',
      'Deploy 8 fire truck units from nearest stations',
      'Alert medical centers for potential casualties',
      'Establish command center at district HQ'
    ),
    'medium', jsonb_build_array(
      'Mobilize disaster response teams',
      'Arrange temporary shelters for 1500+ people',
      'Alert neighboring states',
      'Deploy aerial firefighting resources'
    ),
    'resources', jsonb_build_array(
      jsonb_build_object('name', 'Fire Trucks', 'quantity', 8),
      jsonb_build_object('name', 'Helicopters', 'quantity', 2),
      jsonb_build_object('name', 'Personnel', 'quantity', 150),
      jsonb_build_object('name', 'Water Tankers', 'quantity', 4)
    ),
    'sms', 'ALERT: Forest fire active near Mussoorie. If in area, evacuate immediately. Call 112. -RAKSHAK'
  )
)
ON CONFLICT DO NOTHING;

PRINT 'RAKSHAK-AI database schema created successfully!';
