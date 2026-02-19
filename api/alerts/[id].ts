import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock alerts data
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
      medium_term: [
        "Set up 20 relief camps",
        "Arrange food and water supply for 10,000 people",
        "Deploy forest personnel for containment",
      ],
      resources: [
        { name: "Fire Trucks", quantity: 8 },
        { name: "Helicopters", quantity: 2 },
      ],
      sms: "ALERT: Forest fire near Mussoorie. Evacuate immediately. Call 112. -RAKSHAK",
      legal: "Government Order issued for immediate evacuation under Disaster Management Act 2005",
    },
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
];

const mockEvidences = [
  {
    id: "evt_demo_001_evidence",
    alert_id: "alrt_demo_001",
    type: "satellite_image",
    source: "VIIRS",
    data: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect fill='%23ff6b6b' width='400' height='300'/><circle cx='200' cy='150' r='80' fill='%23ff3333'/></svg>",
    description: "Thermal infrared showing active fire hotspot",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
  },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;
    const alertId = Array.isArray(id) ? id[0] : id;

    if (!alertId) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    const url = req.url || '';

    // GET /api/alerts/:id - get specific alert with evidence
    if (req.method === 'GET' && !url.includes('/generate') && !url.includes('/acknowledge') && !url.includes('/resolve')) {
      const alert = mockAlerts.find((a) => a.id === alertId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      return res.status(200).json({
        ...alert,
        evidences: mockEvidences.filter((e) => e.alert_id === alertId),
      });
    }

    // POST /api/alerts/:id/generate
    if (req.method === 'POST' && url.includes('/generate')) {
      const alert = mockAlerts.find((a) => a.id === alertId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const actionPlan = {
        immediate: [
          "Emergency evacuation order issued for Zone A",
          "Deploy 12 fire-fighting units from nearest depots",
          "Alert district hospitals to prepare for casualties",
          "Activate emergency control room at district HQ",
          "Establish 24/7 disaster management coordination",
        ],
        medium_term: [
          "Set up 30 relief camps with 2000 capacity each",
          "Arrange food, water, and medical supplies",
          "Deploy additional 100+ forest personnel",
          "Activate disaster management protocols",
        ],
        legal: "Government Emergency Order issued under Disaster Management Act 2005.",
        resources: [
          { name: "Fire Trucks", quantity: 12 },
          { name: "Helicopters", quantity: 3 },
          { name: "Medical Teams", quantity: 5 },
          { name: "Forest Personnel", quantity: 100 },
          { name: "Relief Camps", quantity: 30 },
        ],
        sms: "🚨 RAKSHAK ALERT: Critical fire event detected near your area. Evacuation in progress. Call 112.",
      };

      return res.status(200).json({
        alert: { ...alert, suggested_actions: actionPlan },
        actions: actionPlan,
      });
    }

    // PATCH /api/alerts/:id - update alert
    if (req.method === 'PATCH') {
      const alert = mockAlerts.find((a) => a.id === alertId);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const updated = {
        ...alert,
        ...req.body,
        updated_at: new Date().toISOString(),
      };

      return res.status(200).json(updated);
    }

    // POST /api/alerts/:id/acknowledge
    if (req.method === 'POST' && url.includes('/acknowledge')) {
      return res.status(200).json({
        id: alertId,
        status: 'acknowledged',
        updated_at: new Date().toISOString(),
      });
    }

    // POST /api/alerts/:id/resolve
    if (req.method === 'POST' && url.includes('/resolve')) {
      return res.status(200).json({
        id: alertId,
        status: 'resolved',
        updated_at: new Date().toISOString(),
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Alert handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
