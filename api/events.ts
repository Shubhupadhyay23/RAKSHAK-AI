import { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { id, type } = req.query;

  // GET /api/events
  if (req.method === 'GET' && !id && !type) {
    return res.status(200).json(mockEvents);
  }

  // GET /api/events/:id
  if (req.method === 'GET' && id && !type) {
    const event = mockEvents.find((e) => e.id === id);
    return res.status(event ? 200 : 404).json(event || { error: 'Event not found' });
  }

  // GET /api/events/type/:type
  if (req.method === 'GET' && type) {
    const filtered = mockEvents.filter((e) => e.event_type === type);
    return res.status(200).json(filtered);
  }

  // POST /api/events
  if (req.method === 'POST') {
    const { source, event_type, confidence, location, latitude, longitude, properties } = req.body;

    if (!source || !event_type || confidence === undefined || !location || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: source, event_type, confidence, location, latitude, longitude',
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

    return res.status(201).json(newEvent);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
