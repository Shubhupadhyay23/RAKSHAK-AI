import { RequestHandler } from "express";
import { ingestFIRMSData } from "../lib/ingest-firms";
import { isSupabaseConfigured } from "../lib/supabase";

/**
 * Trigger NASA FIRMS ingestion manually
 * In production, this would be called by a scheduled job (cron, cloud scheduler, etc)
 */
export const triggerFIRMSIngestion: RequestHandler = async (req, res) => {
  try {
    console.log("[API] Triggering FIRMS ingestion...");

    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        message: "Ingestion skipped (Supabase not configured)",
        events_processed: 0,
        note: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable",
        timestamp: new Date().toISOString(),
      });
    }

    const count = await ingestFIRMSData();

    res.json({
      success: true,
      message: `Ingestion completed`,
      events_processed: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Ingestion error:", error);
    res.status(500).json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get ingestion status
 */
export const getIngestionStatus: RequestHandler = async (req, res) => {
  try {
    res.json({
      status: "operational",
      supabase_configured: isSupabaseConfigured,
      services: {
        firms: "configured" + (process.env.NASA_FIRMS_API_KEY ? "" : " (no API key)"),
        supabase: isSupabaseConfigured ? "configured" : "not configured",
        llm: "configured" + (process.env.OPENAI_API_KEY ? "" : " (no API key)"),
      },
      note: isSupabaseConfigured
        ? "All systems ready"
        : "Supabase not configured - using demo mode",
      last_check: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: String(error),
    });
  }
};
