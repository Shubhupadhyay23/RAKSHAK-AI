import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  MapPin,
  Clock,
  Zap,
  FileText,
  Download,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Trees,
  Cloud,
  Droplets,
  Users,
  Truck,
  Home,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  type: "fire" | "deforestation" | "pollution" | "flood";
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  createdAt: string;
  description: string;
  lat: number;
  lng: number;
  details: {
    predictedSpread?: string;
    nearbyVillages?: string[];
    estimatedAffected?: number;
    windSpeed?: number;
    windDirection?: string;
    temperature?: number;
  };
  evidence: {
    id: string;
    type: "satellite" | "sensor" | "ai";
    title: string;
    timestamp: string;
    image?: string;
  }[];
  suggestedActions?: {
    immediate: string[];
    medium: string[];
    resources?: {
      name: string;
      quantity: number;
    }[];
    sms?: string;
  };
}

const mockAlerts: Record<string, Alert> = {
  evt_001: {
    id: "evt_001",
    type: "fire",
    location: "Uttarakhand, Northern Ridge",
    severity: "critical",
    confidence: 0.94,
    createdAt: "2024-01-15 14:32 UTC",
    description: "Active fire detection near Mussoorie region, expanding rapidly",
    lat: 30.45,
    lng: 78.15,
    details: {
      predictedSpread: "250 hectares in 24 hours",
      nearbyVillages: ["Mussoorie", "Dhanaulti", "Chamba"],
      estimatedAffected: 1200,
      windSpeed: 25,
      windDirection: "NW",
      temperature: 28,
    },
    evidence: [
      {
        id: "ev_001",
        type: "satellite",
        title: "Thermal Anomaly - VIIRS FIRMS",
        timestamp: "2024-01-15 14:30 UTC",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23202020' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23ff4500' opacity='0.8'/%3E%3C/svg%3E",
      },
      {
        id: "ev_002",
        type: "satellite",
        title: "Before-After Comparison",
        timestamp: "2024-01-14 00:00 UTC",
      },
      {
        id: "ev_003",
        type: "ai",
        title: "Fire Spread Prediction Model",
        timestamp: "2024-01-15 14:35 UTC",
      },
    ],
    suggestedActions: {
      immediate: [
        "Evacuate villages within 5km radius",
        "Deploy 8 fire truck units from nearest stations",
        "Alert medical centers for potential casualties",
        "Establish command center at district HQ",
      ],
      medium: [
        "Mobilize disaster response teams",
        "Arrange temporary shelters for 1500+ people",
        "Alert neighboring states",
        "Deploy aerial firefighting resources",
      ],
      resources: [
        { name: "Fire Trucks", quantity: 8 },
        { name: "Helicopters", quantity: 2 },
        { name: "Personnel", quantity: 150 },
        { name: "Water Tankers", quantity: 4 },
      ],
      sms: "ALERT: Forest fire active near Mussoorie. If in area, evacuate immediately to safe zone. Call 112 for help. -RAKSHAK",
    },
  },
  evt_002: {
    id: "evt_002",
    type: "deforestation",
    location: "Madhya Pradesh",
    severity: "high",
    confidence: 0.87,
    createdAt: "2024-01-15 13:45 UTC",
    description:
      "Significant tree cover loss detected - 250 hectares, possible illegal logging",
    lat: 22.9,
    lng: 78.65,
    details: {
      predictedSpread: "Active clearing ongoing",
      nearbyVillages: ["Sohagpur", "Shahdol"],
      estimatedAffected: 300,
    },
    evidence: [
      {
        id: "ev_004",
        type: "satellite",
        title: "NDVI Change Detection",
        timestamp: "2024-01-15 13:40 UTC",
      },
      {
        id: "ev_005",
        type: "satellite",
        title: "Land Use Classification",
        timestamp: "2024-01-14 00:00 UTC",
      },
    ],
    suggestedActions: {
      immediate: [
        "Dispatch forest protection team",
        "Document evidence for legal action",
        "Block access roads to area",
        "Notify forest officer",
      ],
      medium: [
        "Initiate legal proceedings",
        "Engage local community",
        "Plan reforestation",
      ],
      resources: [
        { name: "Forest Officers", quantity: 5 },
        { name: "Police Units", quantity: 2 },
      ],
      sms: "ALERT: Unauthorized tree cutting detected in Shahdol area. Forest dept investigating. Report info to 1930.",
    },
  },
  evt_003: {
    id: "evt_003",
    type: "pollution",
    location: "Delhi NCR",
    severity: "high",
    confidence: 0.91,
    createdAt: "2024-01-15 13:15 UTC",
    description: "AQI spike detected, pollution plume moving south",
    lat: 28.5,
    lng: 77.1,
    details: {
      windSpeed: 12,
      windDirection: "N",
      temperature: 18,
    },
    evidence: [
      {
        id: "ev_006",
        type: "sensor",
        title: "Real-time AQI Reading",
        timestamp: "2024-01-15 13:15 UTC",
      },
    ],
    suggestedActions: {
      immediate: [
        "Issue AQI warning alert",
        "Advise vulnerable populations to stay indoors",
        "Prepare health facilities",
      ],
      medium: [
        "Monitor wind direction changes",
        "Prepare traffic restrictions if needed",
      ],
      resources: [{ name: "Health Centers", quantity: 10 }],
      sms: "ALERT: High pollution levels detected. Sensitive groups avoid outdoor activity. Mask recommended. -RAKSHAK",
    },
  },
  evt_004: {
    id: "evt_004",
    type: "flood",
    location: "Bihar, Kosi Basin",
    severity: "medium",
    confidence: 0.78,
    createdAt: "2024-01-15 12:00 UTC",
    description: "Flood risk predicted for downstream villages",
    lat: 26.15,
    lng: 87.5,
    details: {
      predictedSpread: "Flood expected in 12-18 hours",
      nearbyVillages: ["Khirbar", "Gogri", "Madhubani"],
      estimatedAffected: 5000,
    },
    evidence: [
      {
        id: "ev_007",
        type: "sensor",
        title: "River Level Gauge",
        timestamp: "2024-01-15 12:00 UTC",
      },
    ],
    suggestedActions: {
      immediate: [
        "Pre-position rescue boats and equipment",
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
      ],
      sms: "FLOOD WARNING: Heavy flooding likely in Kosi basin within 12 hours. Move to high ground. Call 112. -RAKSHAK",
    },
  },
};

const eventIcons = {
  fire: Flame,
  deforestation: Trees,
  pollution: Cloud,
  flood: Droplets,
};

const eventColors = {
  fire: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  },
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

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);
  const [actionGenerated, setActionGenerated] = useState(false);

  const alert = mockAlerts[id || "evt_001"] || mockAlerts.evt_001;
  const Icon = eventIcons[alert.type];
  const colors = eventColors[alert.type];

  const handleGenerateAction = async () => {
    setIsGeneratingAction(true);
    // Simulate API call to generate government actions
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setActionGenerated(true);
    setIsGeneratingAction(false);
  };

  const handleDispatch = () => {
    // Simulate dispatch action
    alert("SMS alert sent to district officials and public in affected areas");
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    alert("Downloading incident report PDF...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Alert Details</h1>
            <p className="text-sm text-slate-500">RAKSHAK-AI Environmental Monitoring</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Header Card */}
            <Card className={`border-l-4 ${colors.border} shadow-sm`}>
              <div className={`p-6 ${colors.bg}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-slate-900 capitalize">
                          {alert.type} Incident
                        </h2>
                        <Badge className={severityColors[alert.severity]}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-600">{alert.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Confidence</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(alert.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Detected</p>
                    <p className="text-lg font-bold text-slate-900">{alert.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Location</p>
                    <p className="text-sm font-bold text-slate-900">{alert.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Coordinates</p>
                    <p className="text-sm font-bold text-slate-900">
                      {alert.lat.toFixed(2)}°, {alert.lng.toFixed(2)}°
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Details Section */}
            {Object.keys(alert.details).length > 0 && (
              <Card className="shadow-sm">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">Event Details</h3>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {alert.details.predictedSpread && (
                      <div>
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          PREDICTED SPREAD
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {alert.details.predictedSpread}
                        </p>
                      </div>
                    )}
                    {alert.details.estimatedAffected && (
                      <div>
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          ESTIMATED AFFECTED
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {alert.details.estimatedAffected.toLocaleString()} people
                        </p>
                      </div>
                    )}
                    {alert.details.windSpeed && (
                      <div>
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          WIND SPEED
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {alert.details.windSpeed} km/h {alert.details.windDirection}
                        </p>
                      </div>
                    )}
                    {alert.details.temperature && (
                      <div>
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          TEMPERATURE
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {alert.details.temperature}°C
                        </p>
                      </div>
                    )}
                    {alert.details.nearbyVillages && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-600 font-medium mb-2">
                          NEARBY VILLAGES
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {alert.details.nearbyVillages.map((village) => (
                            <Badge key={village} variant="outline">
                              {village}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Evidence Section */}
            <Card className="shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Evidence & Data</h3>
              </div>

              <div className="p-6 space-y-4">
                {alert.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          {ev.type === "satellite" ? (
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                          ) : ev.type === "sensor" ? (
                            <Zap className="w-4 h-4 text-slate-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{ev.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{ev.timestamp}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {ev.type}
                      </Badge>
                    </div>
                    {ev.image && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
                        <img src={ev.image} alt={ev.title} className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Action Generation */}
            <Card
              className={`border-2 shadow-sm transition-all ${
                actionGenerated
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200"
              }`}
            >
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Government Action AI
                </h3>

                {!actionGenerated ? (
                  <Button
                    onClick={handleGenerateAction}
                    disabled={isGeneratingAction}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                  >
                    {isGeneratingAction ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Action Plan
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">Action plan generated</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        Immediate Actions
                      </h4>
                      <ul className="space-y-2">
                        {alert.suggestedActions?.immediate.map((action, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-600 flex gap-2 items-start"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {alert.suggestedActions?.resources && (
                      <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Resources Required
                        </h4>
                        <ul className="space-y-2">
                          {alert.suggestedActions.resources.map((resource, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 flex items-center justify-between"
                            >
                              <span>{resource.name}</span>
                              <Badge variant="secondary">{resource.quantity}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        onClick={handleDispatch}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Dispatch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadPDF}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Info */}
            <Card className="shadow-sm">
              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Public Alert Message</h4>
                {actionGenerated && alert.suggestedActions?.sms && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-slate-700">{alert.suggestedActions.sms}</p>
                  </div>
                )}

                <Button size="sm" variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Preview SMS
                </Button>
              </div>
            </Card>

            {/* Related Information */}
            <Card className="shadow-sm">
              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Response Checklist</h4>
                <div className="space-y-3">
                  <ChecklistItem
                    completed={actionGenerated}
                    label="Action plan generated"
                  />
                  <ChecklistItem
                    completed={false}
                    label="District officer notified"
                  />
                  <ChecklistItem completed={false} label="Evacuation initiated" />
                  <ChecklistItem
                    completed={false}
                    label="Resources dispatched"
                  />
                  <ChecklistItem completed={false} label="Incident resolved" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ChecklistItemProps {
  completed: boolean;
  label: string;
}

function ChecklistItem({ completed, label }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          completed
            ? "bg-green-600 border-green-600"
            : "border-slate-300"
        }`}
      >
        {completed && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <span className={completed ? "text-slate-500 line-through" : "text-slate-700"}>
        {label}
      </span>
    </div>
  );
}
