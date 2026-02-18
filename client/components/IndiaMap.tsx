import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { Flame, Trees, Cloud, Droplets } from "lucide-react";

export interface Event {
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

interface IndiaMapProps {
  events: Event[];
  filter?: "fire" | "deforestation" | "pollution" | "flood" | null;
}

// Event type to color mapping
const eventTypeColors: Record<Event["type"], string> = {
  fire: "#dc2626", // red
  deforestation: "#ea580c", // orange
  pollution: "#a855f7", // purple
  flood: "#2563eb", // blue
};

const eventTypeIcons: Record<Event["type"], React.ComponentType<any>> = {
  fire: Flame,
  deforestation: Trees,
  pollution: Cloud,
  flood: Droplets,
};

// Custom marker icons using Leaflet's icon factory
function createMarkerIcon(type: Event["type"], isFiltered: boolean = false) {
  const color = eventTypeColors[type];
  const opacity = isFiltered ? 1 : 0.6;

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" opacity="${opacity}" width="32" height="32">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        <circle cx="12" cy="12" r="6" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10],
  });
}

export function IndiaMap({ events, filter }: IndiaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const navigate = useNavigate();

  // Inject Leaflet CSS dynamically and fix icon paths
  useEffect(() => {
    if (typeof document !== "undefined" && !document.querySelector('style[data-leaflet]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);

      // Fix Leaflet default icons
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  // Filter events based on type
  const filteredEvents = filter ? events.filter((e) => e.type === filter) : events;

  useEffect(() => {
    // Initialize map only once
    if (mapRef.current) return;

    if (!mapContainer.current) return;

    // Create map centered on India
    mapRef.current = L.map(mapContainer.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add a subtle gradient overlay
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 256, 256);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.02)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }

    const overlayLayer = L.imageOverlay(
      canvas.toDataURL(),
      [
        [8.4, 68.7],
        [37.6, 97.25],
      ]
    ).addTo(mapRef.current);
  }, []);

  // Update markers when events or filter changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for filtered events
    filteredEvents.forEach((event) => {
      const marker = L.marker([event.lat, event.lng], {
        icon: createMarkerIcon(event.type, true),
        title: `${event.type}: ${event.location}`,
      })
        .bindPopup(
          `
          <div style="min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${event.type.toUpperCase()}</strong>
            <p style="margin: 8px 0 4px 0; font-size: 13px; color: #4b5563;">${event.location}</p>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${event.description}</p>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              <span><strong>Confidence:</strong> ${(event.confidence * 100).toFixed(0)}%</span>
              <span><strong>Severity:</strong> ${event.severity}</span>
            </div>
            <button style="width: 100%; padding: 6px; background: linear-gradient(to right, #16a34a, #15803d); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
              View Details
            </button>
          </div>
        `,
          {
            minWidth: 200,
            maxWidth: 250,
            className: "event-popup",
          }
        )
        .on("popupopen", () => {
          // Click handler for "View Details" button
          const popup = marker.getPopup();
          if (popup) {
            setTimeout(() => {
              const button = popup._contentNode?.querySelector("button");
              if (button) {
                button.addEventListener("click", () => {
                  navigate(`/alert/${event.id}`);
                });
              }
            }, 0);
          }
        })
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Auto-fit map to show all markers if any exist
    if (markersRef.current.length > 0 && mapRef.current) {
      const group = new L.FeatureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1), {
        maxZoom: 7,
        animate: true,
      });
    }
  }, [filteredEvents, navigate]);

  return (
    <div ref={mapContainer} className="w-full h-96 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-slate-100" />
  );
}
