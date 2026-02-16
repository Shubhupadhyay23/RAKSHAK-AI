import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
