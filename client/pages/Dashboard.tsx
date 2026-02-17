import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHybridRealtime } from "@/hooks/useHybridRealtime";
import { api } from "@/lib/api";
import {
  AlertCircle,
  Flame,
  Trees,
  Cloud,
  Droplets,
  MapPin,
  Clock,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

interface Event {
  id: string;
  type: "fire" | "deforestation" | "pollution" | "flood";
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  createdAt: string;
  description: string;
  lat: number;
  lng: number;
}

const mockEvents: Event[] = [
  {
    id: "evt_001",
    type: "fire",
    location: "Uttarakhand, Northern Ridge",
    severity: "critical",
    confidence: 0.94,
    createdAt: "2 minutes ago",
    description: "Active fire detection near Mussoorie region",
    lat: 30.45,
    lng: 78.15,
  },
  {
    id: "evt_002",
    type: "deforestation",
    location: "Madhya Pradesh",
    severity: "high",
    confidence: 0.87,
    createdAt: "15 minutes ago",
    description: "Significant tree cover loss detected - 250 hectares",
    lat: 22.9,
    lng: 78.65,
  },
  {
    id: "evt_003",
    type: "pollution",
    location: "Delhi NCR",
    severity: "high",
    confidence: 0.91,
    createdAt: "28 minutes ago",
    description: "AQI spike detected, pollution plume moving south",
    lat: 28.5,
    lng: 77.1,
  },
  {
    id: "evt_004",
    type: "flood",
    location: "Bihar, Kosi Basin",
    severity: "medium",
    confidence: 0.78,
    createdAt: "1 hour ago",
    description: "Flood risk predicted for downstream villages",
    lat: 26.15,
    lng: 87.5,
  },
];

const eventIcons = {
  fire: Flame,
  deforestation: Trees,
  pollution: Cloud,
  flood: Droplets,
};

const eventColors = {
  fire: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  deforestation: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-800",
  },
  pollution: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-800",
  },
  flood: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800",
  },
};

const severityColors = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Setup hybrid realtime (demo or live depending on Supabase config)
  const { isConnected, mode, isDemoMode, isLiveMode } = useHybridRealtime({
    table: "events",
    onNewEvent: (newEvent: any) => {
      console.log(
        `[Dashboard] New ${mode} event received:`,
        newEvent.event_type,
        "at",
        newEvent.location
      );
      // Convert database/simulator event to frontend format
      const convertedEvent: Event = {
        id: newEvent.id,
        type: newEvent.event_type as any,
        location: newEvent.location,
        severity: determineSeverityFromConfidence(newEvent.confidence),
        confidence: newEvent.confidence,
        createdAt: formatDate(newEvent.created_at),
        description:
          newEvent.properties?.description ||
          `${newEvent.event_type} detected`,
        lat: newEvent.latitude,
        lng: newEvent.longitude,
      };
      // Add new event to the top of the list
      setEvents((prev) => [convertedEvent, ...prev]);
    },
  });

  // Fetch events from backend on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getEvents();

        if (data && Array.isArray(data) && data.length > 0) {
          // Convert backend events to frontend format
          const convertedEvents = data.map((e: any) => ({
            id: e.id,
            type: e.event_type as any,
            location: e.location,
            severity: determineSeverityFromConfidence(e.confidence),
            confidence: e.confidence,
            createdAt: formatDate(e.created_at),
            description: e.properties?.description || `${e.event_type} detected`,
            lat: e.latitude,
            lng: e.longitude,
          }));
          setEvents(convertedEvents);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getEvents();

      if (data && Array.isArray(data) && data.length > 0) {
        const convertedEvents = data.map((e: any) => ({
          id: e.id,
          type: e.event_type as any,
          location: e.location,
          severity: determineSeverityFromConfidence(e.confidence),
          confidence: e.confidence,
          createdAt: formatDate(e.created_at),
          description: e.properties?.description || `${e.event_type} detected`,
          lat: e.latitude,
          lng: e.longitude,
        }));
        setEvents(convertedEvents);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const criticalCount = events.filter((e) => e.severity === "critical").length;
  const highCount = events.filter((e) => e.severity === "high").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">RAKSHAK-AI</h1>
              <p className="text-sm text-slate-500">Environmental Monitoring & Early Warning</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Status */}
            <div className="flex items-center gap-2 text-sm">
              {isLiveMode && isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600 animate-pulse" />
                  <span
                    className="text-green-600 font-medium"
                    title="Connected to live Supabase"
                  >
                    Live
                  </span>
                </>
              ) : isDemoMode ? (
                <>
                  <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span
                    className="text-amber-600 font-medium"
                    title="Demo mode - simulated events every 8s"
                  >
                    Demo Live
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-slate-400" />
                  <span
                    className="text-slate-500"
                    title="Connecting..."
                  >
                    Connecting...
                  </span>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className={isRefreshing ? "animate-spin" : ""}
              disabled={isRefreshing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={AlertCircle}
            title="Critical Alerts"
            value={criticalCount}
            color="red"
            subtext={`${highCount} High priority`}
          />
          <StatCard
            icon={Flame}
            title="Active Fires"
            value={events.filter((e) => e.type === "fire").length}
            color="red"
            subtext="Real-time detection"
          />
          <StatCard
            icon={Trees}
            title="Deforestation Events"
            value={events.filter((e) => e.type === "deforestation").length}
            color="orange"
            subtext="Tree cover loss"
          />
          <StatCard
            icon={TrendingUp}
            title="Confidence Avg"
            value={`${Math.round(events.reduce((a, b) => a + b.confidence, 0) / events.length * 100)}%`}
            color="green"
            subtext="Detection accuracy"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map Placeholder & Events List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm">
              <div className="w-full h-96 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="relative z-10 text-center">
                  <MapPin className="w-12 h-12 text-white mx-auto mb-2 opacity-80" />
                  <p className="text-white font-semibold">India Live Map</p>
                  <p className="text-white/80 text-sm mt-1">
                    Satellite + sensor data visualization
                  </p>
                </div>
              </div>

              {/* Map Legend */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <p className="text-sm font-semibold text-slate-700 mb-3">Event Types</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["fire", "deforestation", "pollution", "flood"] as const).map((type) => {
                    const Icon = eventIcons[type];
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${eventColors[type].text}`} />
                        <span className="text-xs text-slate-600 capitalize">{type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Events List */}
            <Card className="border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Active Events</h2>
              </div>

              <div className="divide-y divide-slate-200">
                {events.map((event) => {
                  const Icon = eventIcons[event.type];
                  const colors = eventColors[event.type];

                  return (
                    <Link
                      key={event.id}
                      to={`/alert/${event.id}`}
                      className={`block p-4 hover:${colors.bg} transition-colors cursor-pointer border-l-4 ${colors.border}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 capitalize">
                              {event.type} Detected
                            </p>
                            <Badge className={severityColors[event.severity]}>
                              {event.severity}
                            </Badge>
                          </div>

                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.createdAt}
                            </div>
                            <div className="ml-auto text-slate-700 font-medium">
                              Confidence: {(event.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Quick Actions</h3>
              </div>

              <div className="p-4 space-y-3">
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Generate Alert Report
                </Button>
                <Button variant="outline" className="w-full">
                  <Flame className="w-4 h-4 mr-2" />
                  View Fire Zones
                </Button>
                <Button variant="outline" className="w-full">
                  <Cloud className="w-4 h-4 mr-2" />
                  Check Air Quality
                </Button>
                <Button variant="outline" className="w-full">
                  <Droplets className="w-4 h-4 mr-2" />
                  Flood Forecast
                </Button>
              </div>
            </Card>

            {/* System Status */}
            <Card className="border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  System Status
                  {isConnected && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                      {isLiveMode ? "Realtime" : "Simulated"}
                    </span>
                  )}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <StatusItem
                  label="Realtime Mode"
                  status={isConnected ? "active" : "inactive"}
                  subtext={
                    isLiveMode
                      ? "Connected to Supabase"
                      : isDemoMode
                        ? "Using simulated events (every 8s)"
                        : "Initializing..."
                  }
                />
                <StatusItem
                  label="Satellite Data"
                  status={isLiveMode ? "active" : "inactive"}
                  subtext={
                    isLiveMode ? "FIRMS, Sentinel-2" : "Demo mode"
                  }
                />
                <StatusItem
                  label="Weather Data"
                  status={isLiveMode ? "active" : "inactive"}
                  subtext={
                    isLiveMode ? "OpenWeather API" : "Demo mode"
                  }
                />
                <StatusItem
                  label="AI Models"
                  status="active"
                  subtext="Fire, Deforestation"
                />
              </div>
            </Card>

            {/* Information Panel */}
            <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-green-50 to-blue-50">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">About RAKSHAK-AI</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  India's Digital Environmental Protection Command Center. Real-time monitoring
                  combined with AI-driven predictions to enable faster government response.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  color: "red" | "orange" | "green" | "blue";
  subtext?: string;
}

function StatCard({ icon: Icon, title, value, color, subtext }: StatCardProps) {
  const colorMap = {
    red: "from-red-600 to-red-700",
    orange: "from-orange-600 to-orange-700",
    green: "from-green-600 to-green-700",
    blue: "from-blue-600 to-blue-700",
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[color]}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </div>
    </Card>
  );
}

interface StatusItemProps {
  label: string;
  status: "active" | "inactive" | "success" | "error";
  subtext: string;
}

function StatusItem({ label, status, subtext }: StatusItemProps) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  const statusDots = {
    active: "bg-green-500",
    inactive: "bg-gray-400",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${statusDots[status]} mt-1.5`}></div>
    </div>
  );
}

// Helper functions
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

function determineSeverityFromConfidence(
  confidence: number
): "critical" | "high" | "medium" | "low" {
  if (confidence > 0.9) return "critical";
  if (confidence > 0.8) return "high";
  if (confidence > 0.6) return "medium";
  return "low";
}
