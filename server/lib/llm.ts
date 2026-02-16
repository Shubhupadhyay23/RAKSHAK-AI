import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "OPENAI_API_KEY not set - LLM features will be disabled. Set it to enable government action generation."
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface GovernmentActionRequest {
  event: Record<string, unknown>;
  predicted_spread?: string;
  nearby_villages?: string[];
  resources_available?: Record<string, number>;
}

export interface GovernmentActionPlan {
  immediate: string[];
  medium: string[];
  resources: Array<{ name: string; quantity: number }>;
  sms: string;
  legal_notice?: string;
}

export async function generateGovernmentAction(
  request: GovernmentActionRequest
): Promise<GovernmentActionPlan> {
  // Fallback response if OpenAI is not configured
  if (!process.env.OPENAI_API_KEY) {
    return generateMockActionPlan(request);
  }

  try {
    const prompt = buildPrompt(request);

    const message = await openai.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response - look for JSON block in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Could not parse JSON from LLM response, using mock data");
      return generateMockActionPlan(request);
    }

    const parsed = JSON.parse(jsonMatch[0]) as GovernmentActionPlan;
    return parsed;
  } catch (error) {
    console.error("Error calling LLM:", error);
    // Fall back to mock data on error
    return generateMockActionPlan(request);
  }
}

function buildPrompt(request: GovernmentActionRequest): string {
  const event = request.event;
  const eventType = event.event_type || "unknown";
  const location = event.location || "Unknown location";
  const confidence = event.confidence || 0;
  const nearbyVillages = request.nearby_villages || [];
  const predictedSpread = request.predicted_spread || "Unknown";

  return `You are an emergency response AI assistant for the Indian government. Analyze this environmental incident and generate immediate action recommendations.

INCIDENT DATA:
- Type: ${eventType}
- Location: ${location}
- Confidence: ${(confidence * 100).toFixed(0)}%
- Predicted Spread: ${predictedSpread}
- Nearby Villages: ${nearbyVillages.join(", ") || "None identified"}
- Time: ${new Date().toISOString()}

Generate a JSON response with:
{
  "immediate": ["action1", "action2", ...] (3-4 critical actions for first hour),
  "medium": ["action1", "action2", ...] (2-3 medium-term actions),
  "resources": [{"name": "resource", "quantity": number}, ...],
  "sms": "SMS alert message (max 160 chars)",
  "legal_notice": "If applicable, draft of legal notice"
}

Focus on actionable, specific instructions that government officers can execute immediately.`;
}

function generateMockActionPlan(
  request: GovernmentActionRequest
): GovernmentActionPlan {
  const eventType = request.event.event_type as string || "event";
  const location = request.event.location as string || "the affected area";

  const plans: Record<string, GovernmentActionPlan> = {
    fire: {
      immediate: [
        "Evacuate villages within 5km radius",
        "Deploy fire truck units from nearest stations",
        "Alert medical centers for potential casualties",
        "Establish incident command center at district HQ",
      ],
      medium: [
        "Mobilize disaster response teams",
        "Arrange temporary shelters",
        "Alert neighboring states",
        "Deploy aerial firefighting resources",
      ],
      resources: [
        { name: "Fire Trucks", quantity: 8 },
        { name: "Helicopters", quantity: 2 },
        { name: "Personnel", quantity: 150 },
        { name: "Water Tankers", quantity: 4 },
      ],
      sms: `ALERT: Forest fire active near ${location}. Evacuate immediately. Call 112. -RAKSHAK`,
    },
    deforestation: {
      immediate: [
        "Dispatch forest protection team",
        "Document evidence for legal action",
        "Block access roads to area",
        "Notify district forest officer",
      ],
      medium: [
        "Initiate legal proceedings",
        "Engage local community",
        "Plan reforestation",
      ],
      resources: [
        { name: "Forest Officers", quantity: 5 },
        { name: "Police Units", quantity: 2 },
        { name: "Documentation Experts", quantity: 3 },
      ],
      sms: `ALERT: Unauthorized tree cutting detected near ${location}. Forest dept investigating. -RAKSHAK`,
    },
    pollution: {
      immediate: [
        "Issue air quality warning",
        "Advise vulnerable populations to stay indoors",
        "Prepare health facilities",
        "Monitor pollution spread",
      ],
      medium: [
        "Implement traffic restrictions",
        "Close schools if AQI severe",
        "Distribute masks to vulnerable groups",
      ],
      resources: [
        { name: "Health Centers", quantity: 10 },
        { name: "Ambulances", quantity: 15 },
        { name: "Air Quality Monitors", quantity: 20 },
      ],
      sms: `ALERT: High pollution levels near ${location}. Sensitive groups stay indoors. Masks recommended. -RAKSHAK`,
    },
    flood: {
      immediate: [
        "Pre-position rescue boats",
        "Alert district administration",
        "Prepare evacuation routes",
        "Alert medical teams",
      ],
      medium: [
        "Arrange temporary shelters",
        "Stock relief materials",
        "Coordinate with neighboring districts",
      ],
      resources: [
        { name: "Rescue Boats", quantity: 8 },
        { name: "Personnel", quantity: 200 },
        { name: "Relief Camps", quantity: 5 },
        { name: "Medical Units", quantity: 10 },
      ],
      sms: `FLOOD WARNING: Heavy flooding likely near ${location}. Move to high ground. Call 112. -RAKSHAK`,
    },
  };

  return (
    plans[eventType] || {
      immediate: [
        "Alert district authorities",
        "Document incident details",
        "Monitor situation",
      ],
      medium: ["Coordinate response teams", "Prepare public alerts"],
      resources: [{ name: "Response Teams", quantity: 5 }],
      sms: `ALERT: Environmental incident detected near ${location}. Authorities responding. -RAKSHAK`,
    }
  );
}
