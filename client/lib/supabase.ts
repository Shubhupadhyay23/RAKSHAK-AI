import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not configured. Realtime updates will not work."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

export interface Event {
  id: string;
  source: string;
  event_type: string;
  confidence: number;
  location: string;
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface Alert {
  id: string;
  event_id: string;
  severity: string;
  status: string;
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
  type: string;
  title: string;
  added_at: string;
}
