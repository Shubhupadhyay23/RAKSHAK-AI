import { RequestHandler } from "express";
import { supabase, Event, isSupabaseConfigured } from "../lib/supabase";

interface CreateEventBody {
  source: string;
  event_type: string;
  confidence: number;
  location: string;
  latitude: number;
  longitude: number;
  properties?: Record<string, unknown>;
}

// Mock data for development when Supabase is not configured
const mockEvents: any[] = [
  {
    id: "evt_demo_001",
    source: "firms",
    event_type: "fire",
    confidence: 0.94,
    location: "Uttarakhand, Northern Ridge",
    latitude: 30.45,
    longitude: 78.15,
    properties: { brightness: 320, satellite: "VIIRS" },
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "evt_demo_002",
    source: "deforestation_model",
    event_type: "deforestation",
    confidence: 0.87,
    location: "Madhya Pradesh",
    latitude: 22.9,
    longitude: 78.65,
    properties: { area_hectares: 250 },
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "evt_demo_003",
    source: "aqi_api",
    event_type: "pollution",
    confidence: 0.91,
    location: "Delhi NCR",
    latitude: 28.5,
    longitude: 77.1,
    properties: { aqi: 387 },
    created_at: new Date(Date.now() - 28 * 60000).toISOString(),
  },
  {
    id: "evt_demo_004",
    source: "flood_model",
    event_type: "flood",
    confidence: 0.78,
    location: "Bihar, Kosi Basin",
    latitude: 26.15,
    longitude: 87.5,
    properties: { rainfall_mm: 85 },
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

export const getEvents: RequestHandler = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json(mockEvents);
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching events:", error);
    // Return mock data as fallback
    res.json(mockEvents);
  }
};

export const getEvent: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured) {
      const mockEvent = mockEvents.find((e) => e.id === id);
      return res.json(mockEvent || { error: "Event not found" });
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching event:", error);
    const mockEvent = mockEvents.find((e) => e.id === req.params.id);
    res.json(mockEvent || { error: "Failed to fetch event" });
  }
};

export const createEvent: RequestHandler<unknown, unknown, CreateEventBody> =
  async (req, res) => {
    try {
      const { source, event_type, confidence, location, latitude, longitude, properties } = req.body;

      if (!source || !event_type || confidence === undefined || !location || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: "Missing required fields: source, event_type, confidence, location, latitude, longitude",
        });
      }

      const newEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source,
        event_type,
        confidence,
        location,
        latitude,
        longitude,
        properties: properties || {},
        created_at: new Date().toISOString(),
      };

      if (!isSupabaseConfigured) {
        return res.status(201).json(newEvent);
      }

      const { data, error } = await supabase
        .from("events")
        .insert([newEvent])
        .select();

      if (error) throw error;

      res.status(201).json(data?.[0] || newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  };

export const getEventsByType: RequestHandler<
  { type: string }
> = async (req, res) => {
  try {
    const { type } = req.params;

    if (!isSupabaseConfigured) {
      const filtered = mockEvents.filter((e) => e.event_type === type);
      return res.json(filtered);
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching events by type:", error);
    const filtered = mockEvents.filter((e) => e.event_type === req.params.type);
    res.json(filtered);
  }
};

export const getEventsBySeverity: RequestHandler<
  { severity: string }
> = async (req, res) => {
  try {
    const { severity } = req.params;

    if (!isSupabaseConfigured) {
      return res.json([]);
    }

    // This requires a join with alerts table
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        alerts(severity)
      `
      )
      .eq("alerts.severity", severity)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching events by severity:", error);
    res.json([]);
  }
};
