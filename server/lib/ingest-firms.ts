/**
 * NASA FIRMS Fire Ingestion
 * Fetches real-time fire detections from NASA FIRMS API
 * and ingests them into Supabase
 */

import fetch from "node-fetch";
import { supabase } from "./supabase";

const FIRMS_API_KEY = process.env.NASA_FIRMS_API_KEY;
const FIRMS_API_URL =
  "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

interface FIRMSDetection {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string | number;
  version: string;
  bright_ti4: number;
  bright_ti5: number;
  frp: number;
  daynight: string;
  type: number;
}

/**
 * Fetch FIRMS detections for India
 * Returns CSV data as string
 */
async function fetchFIRMSData(): Promise<string> {
  if (!FIRMS_API_KEY) {
    throw new Error(
      "NASA_FIRMS_API_KEY not set. Get it from https://firms.modaps.eosdis.nasa.gov/api/"
    );
  }

  // VIIRS SNPP - Near Real Time data for past 1 day, India region
  const url = `${FIRMS_API_URL}/csv/${FIRMS_API_KEY}/VIIRS_SNPP_NRT/IND/1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `FIRMS API error: ${response.status} ${response.statusText}`
    );
  }

  return await response.text();
}

/**
 * Parse CSV data from FIRMS
 */
function parseCSV(csvData: string): FIRMSDetection[] {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");

  const detections: FIRMSDetection[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",");
    const detection: Partial<FIRMSDetection> = {};

    headers.forEach((header, index) => {
      const key = header.trim();
      const value = values[index]?.trim();

      if (key === "latitude") detection.latitude = parseFloat(value || "0");
      else if (key === "longitude")
        detection.longitude = parseFloat(value || "0");
      else if (key === "brightness")
        detection.brightness = parseFloat(value || "0");
      else if (key === "bright_ti4")
        detection.bright_ti4 = parseFloat(value || "0");
      else if (key === "bright_ti5")
        detection.bright_ti5 = parseFloat(value || "0");
      else if (key === "scan") detection.scan = parseFloat(value || "0");
      else if (key === "track") detection.track = parseFloat(value || "0");
      else if (key === "acq_date") detection.acq_date = value || "";
      else if (key === "acq_time") detection.acq_time = value || "";
      else if (key === "satellite") detection.satellite = value || "";
      else if (key === "confidence")
        detection.confidence = value || "0";
      else if (key === "version") detection.version = value || "";
      else if (key === "frp") detection.frp = parseFloat(value || "0");
      else if (key === "daynight") detection.daynight = value || "";
      else if (key === "type") detection.type = parseInt(value || "0");
    });

    if (detection.latitude && detection.longitude) {
      detections.push(detection as FIRMSDetection);
    }
  }

  return detections;
}

/**
 * Convert FIRMS detection to confidence score (0-1)
 */
function getConfidence(detection: FIRMSDetection): number {
  const confidenceStr = String(detection.confidence).toLowerCase();

  if (confidenceStr === "high") return 0.9;
  if (confidenceStr === "nominal") return 0.75;
  if (confidenceStr === "low") return 0.5;

  // Fallback: estimate from brightness
  const brightness = detection.brightness || 0;
  return Math.min(brightness / 400, 1.0);
}

/**
 * Get location name from coordinates (mock for now)
 * In production, use reverse geocoding API
 */
function getLocationName(lat: number, lon: number): string {
  // Mock location names for India regions
  const regions: Record<string, string[]> = {
    "Uttarakhand": [[29.0, 30.5], [78.0, 81.0]],
    "Himachal Pradesh": [[31.0, 33.0], [75.0, 79.0]],
    "Madhya Pradesh": [[21.0, 24.0], [74.0, 82.0]],
    "Rajasthan": [[23.0, 29.0], [68.0, 76.0]],
    "Gujarat": [[20.0, 24.0], [68.0, 73.0]],
    "Maharashtra": [[16.0, 23.0], [72.0, 81.0]],
    "Andhra Pradesh": [[13.0, 19.0], [77.0, 85.0]],
    "Karnataka": [[11.0, 18.0], [74.0, 79.0]],
    "Tamil Nadu": [[8.0, 13.0], [76.0, 81.0]],
    "Kerala": [[8.0, 12.0], [74.0, 77.0]],
  };

  for (const [region, [[minLat, maxLat], [minLon, maxLon]]] of Object.entries(
    regions
  )) {
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return region;
    }
  }

  return "India";
}

/**
 * Ingest FIRMS detections into Supabase
 */
export async function ingestFIRMSData(): Promise<number> {
  try {
    console.log("[FIRMS] Fetching NASA FIRMS data...");
    const csvData = await fetchFIRMSData();

    console.log("[FIRMS] Parsing CSV data...");
    const detections = parseCSV(csvData);
    console.log(`[FIRMS] Found ${detections.length} fire detections`);

    if (detections.length === 0) {
      console.log("[FIRMS] No new detections to ingest");
      return 0;
    }

    // Insert detections into Supabase
    const events = detections.map((detection) => ({
      id: `evt_firms_${detection.acq_date}_${detection.acq_time}_${(Math.random() * 10000) | 0}`,
      source: "firms",
      event_type: "fire",
      confidence: getConfidence(detection),
      location: getLocationName(detection.latitude, detection.longitude),
      latitude: detection.latitude,
      longitude: detection.longitude,
      geometry: `SRID=4326;POINT(${detection.longitude} ${detection.latitude})`,
      properties: {
        brightness: detection.brightness,
        bright_ti4: detection.bright_ti4,
        bright_ti5: detection.bright_ti5,
        satellite: detection.satellite,
        confidence_str: detection.confidence,
        daynight: detection.daynight,
        frp: detection.frp,
        acq_date: detection.acq_date,
        acq_time: detection.acq_time,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log("[FIRMS] Inserting events into Supabase...");
    const { data, error } = await supabase
      .from("events")
      .insert(events)
      .select();

    if (error) {
      console.error("[FIRMS] Error inserting events:", error);
      throw error;
    }

    console.log(`[FIRMS] Successfully ingested ${data?.length || 0} events`);

    // Create alerts for critical/high confidence detections
    const criticalEvents = data?.filter((e) => e.confidence > 0.85) || [];
    if (criticalEvents.length > 0) {
      const alerts = criticalEvents.map((event) => ({
        id: `alrt_${event.id}`,
        event_id: event.id,
        severity: event.confidence > 0.9 ? "critical" : "high",
        status: "open",
        suggested_actions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: alertError } = await supabase
        .from("alerts")
        .insert(alerts);

      if (alertError) {
        console.error("[FIRMS] Error creating alerts:", alertError);
      } else {
        console.log(`[FIRMS] Created ${alerts.length} critical alerts`);
      }
    }

    return data?.length || 0;
  } catch (error) {
    console.error("[FIRMS] Ingestion failed:", error);

    // Log error to system_logs table
    await supabase
      .from("system_logs")
      .insert([
        {
          level: "error",
          service: "ingestion",
          message: "FIRMS ingestion failed",
          error_details: {
            error: String(error),
          },
        },
      ]);

    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ingestFIRMSData()
    .then((count) => {
      console.log(`[FIRMS] Ingestion complete: ${count} events processed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("[FIRMS] Fatal error:", error);
      process.exit(1);
    });
}
