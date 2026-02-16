import { RequestHandler } from "express";
import { supabase, Alert, isSupabaseConfigured } from "../lib/supabase";
import { generateGovernmentAction } from "../lib/llm";

// Mock alerts for development
const mockAlerts = [
  {
    id: "alrt_demo_001",
    event_id: "evt_demo_001",
    severity: "critical",
    status: "open",
    suggested_actions: {
      immediate: [
        "Evacuate villages within 5km radius",
        "Deploy 8 fire truck units from nearest stations",
        "Alert medical centers for potential casualties",
        "Establish command center at district HQ",
      ],
      resources: [
        { name: "Fire Trucks", quantity: 8 },
        { name: "Helicopters", quantity: 2 },
      ],
      sms: "ALERT: Forest fire near Mussoorie. Evacuate immediately. Call 112. -RAKSHAK",
    },
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
];

export const getAlerts: RequestHandler = async (req, res) => {
  try {
    const { severity, status } = req.query;

    if (!isSupabaseConfigured) {
      let filtered = mockAlerts;
      if (severity) {
        filtered = filtered.filter((a) => a.severity === severity);
      }
      if (status) {
        filtered = filtered.filter((a) => a.status === status);
      }
      return res.json(filtered);
    }

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
    res.json(mockAlerts);
  }
};

export const getAlert: RequestHandler<{ id: string }> = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured) {
      const mockAlert = mockAlerts.find((a) => a.id === id);
      return res.json(mockAlert || { error: "Alert not found" });
    }

    const { data, error } = await supabase
      .from("alerts")
      .select("*, events(*), evidences(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching alert:", error);
    const mockAlert = mockAlerts.find((a) => a.id === req.params.id);
    res.json(mockAlert || { error: "Failed to fetch alert" });
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

    // Generate government action using LLM
    const actionPlan = await generateGovernmentAction({
      event: event_details || { event_type: "fire", location: "Demo Location" },
      predicted_spread,
      nearby_villages,
      resources_available,
    });

    if (!isSupabaseConfigured) {
      return res.json({
        alert: {
          id: id,
          event_id: event_id || id,
          severity: "high",
          status: "open",
          suggested_actions: actionPlan,
        },
        actions: actionPlan,
      });
    }

    // Create or update alert with suggested actions
    const { data: existingAlert } = await supabase
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
            severity: "high",
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

    if (!isSupabaseConfigured) {
      return res.json({ id, ...updates });
    }

    const { data, error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json(data?.[0] || { id, ...updates });
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

    if (!isSupabaseConfigured) {
      return res.json({ id, status: "acknowledged" });
    }

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

    if (!isSupabaseConfigured) {
      return res.json({ id, status: "resolved" });
    }

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
