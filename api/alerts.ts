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
    // GET /api/alerts - list all alerts with optional filters
    if (req.method === 'GET') {
      const { severity, status } = req.query;
      let filtered = mockAlerts;

      if (severity) {
        filtered = filtered.filter((a) => a.severity === (severity as string));
      }
      if (status) {
        filtered = filtered.filter((a) => a.status === (status as string));
      }

      return res.status(200).json(filtered);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Alerts list handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
