import { RequestHandler } from "express";
import { supabase, Alert } from "../lib/supabase";
import { generateGovernmentAction } from "../lib/llm";

export const getAlerts: RequestHandler = async (req, res) => {
  try {
    const { severity, status } = req.query;

    let query = supabase.from("alerts").select("*, events(*)");

    if (severity) {
      query = query.eq("severity", severity);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

export const getAlert: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("alerts")
      .select("*, events(*), evidences(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
};

interface GenerateActionBody {
  event_id: string;
  event_details?: Record<string, unknown>;
  predicted_spread?: string;
  nearby_villages?: string[];
  resources_available?: Record<string, number>;
}

export const generateAction: RequestHandler<
  { id: string },
  unknown,
  GenerateActionBody
> = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_id, event_details, predicted_spread, nearby_villages, resources_available } =
      req.body;

    if (!event_id && !id) {
      return res.status(400).json({ error: "event_id or alert id is required" });
    }

    // Fetch event details if not provided
    let eventData = event_details;
    if (!eventData) {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", event_id || id)
        .single();

      if (error) throw error;
      eventData = data;
    }

    // Generate government action using LLM
    const actionPlan = await generateGovernmentAction({
      event: eventData,
      predicted_spread,
      nearby_villages,
      resources_available,
    });

    // Create or update alert with suggested actions
    const { data: existingAlert, error: fetchError } = await supabase
      .from("alerts")
      .select("id")
      .eq("event_id", event_id)
      .single();

    let alert;

    if (existingAlert) {
      // Update existing alert
      const { data, error } = await supabase
        .from("alerts")
        .update({
          suggested_actions: actionPlan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAlert.id)
        .select();

      if (error) throw error;
      alert = data?.[0];
    } else {
      // Create new alert
      const { data, error } = await supabase
        .from("alerts")
        .insert([
          {
            id: `alrt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            event_id: event_id,
            severity: determineSeverity(eventData),
            status: "open",
            suggested_actions: actionPlan,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      alert = data?.[0];
    }

    res.json({
      alert,
      actions: actionPlan,
    });
  } catch (error) {
    console.error("Error generating action:", error);
    res.status(500).json({ error: "Failed to generate action" });
  }
};

export const updateAlert: RequestHandler<
  { id: string },
  unknown,
  Partial<Alert>
> = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data?.[0]);
  } catch (error) {
    console.error("Error updating alert:", error);
    res.status(500).json({ error: "Failed to update alert" });
  }
};

export const acknowledgeAlert: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("alerts")
      .update({
        status: "acknowledged",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data?.[0]);
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
};

export const resolveAlert: RequestHandler<{ id: string }> = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("alerts")
      .update({
        status: "resolved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data?.[0]);
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
};

function determineSeverity(
  eventData: Record<string, unknown>
): "critical" | "high" | "medium" | "low" {
  const confidence = eventData.confidence as number || 0;
  const eventType = eventData.event_type as string || "";

  // Critical: high confidence fires
  if (eventType === "fire" && confidence > 0.9) return "critical";

  // High: high confidence deforestation or moderate confidence fires
  if ((eventType === "deforestation" || eventType === "flood") && confidence > 0.8) {
    return "high";
  }
  if (eventType === "fire" && confidence > 0.75) return "high";

  // Medium: moderate confidence any event
  if (confidence > 0.6) return "medium";

  return "low";
}
