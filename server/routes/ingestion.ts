import { RequestHandler } from "express";
import { ingestFIRMSData } from "../lib/ingest-firms";

/**
 * Trigger NASA FIRMS ingestion manually
 * In production, this would be called by a scheduled job (cron, cloud scheduler, etc)
 */
export const triggerFIRMSIngestion: RequestHandler = async (req, res) => {
  try {
    console.log("[API] Triggering FIRMS ingestion...");

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
      services: {
        firms: "configured" + (process.env.NASA_FIRMS_API_KEY ? "" : " (no API key)"),
        supabase: "configured" + (process.env.SUPABASE_URL ? "" : " (no URL)"),
        llm: "configured" + (process.env.OPENAI_API_KEY ? "" : " (no API key)"),
      },
      last_check: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: String(error),
    });
  }
};
