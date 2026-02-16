import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[Supabase] Not configured. Backend features will use mock data. " +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable database features."
  );
}

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Database types for RAKSHAK-AI
export interface Event {
  id: string;
  source: string; // 'firms', 'deforestation_model', 'aqi_api', 'flood_model'
  event_type: string; // 'fire', 'deforestation', 'pollution', 'flood'
  confidence: number;
  location: string;
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface Alert {
  id: string;
  event_id: string;
  severity: string; // 'critical', 'high', 'medium', 'low'
  status: string; // 'open', 'acknowledged', 'resolved'
  suggested_actions: Record<string, unknown>;
  generated_pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  event_id: string;
  storage_path: string;
  thumbnail_url?: string;
  type: string; // 'satellite', 'sensor', 'ai'
  title: string;
  added_at: string;
}
