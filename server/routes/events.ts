import { RequestHandler } from "express";
import { supabase, Event } from "../lib/supabase";

interface CreateEventBody {
  source: string;
  event_type: string;
  confidence: number;
  location: string;
  latitude: number;
  longitude: number;
  properties?: Record<string, unknown>;
}

export const getEvents: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

export const getEvent: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
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

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source,
            event_type,
            confidence,
            location,
            latitude,
            longitude,
            properties: properties || {},
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      res.status(201).json(data?.[0]);
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

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching events by type:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

export const getEventsBySeverity: RequestHandler<
  { severity: string }
> = async (req, res) => {
  try {
    const { severity } = req.params;

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
    res.status(500).json({ error: "Failed to fetch events" });
  }
};
