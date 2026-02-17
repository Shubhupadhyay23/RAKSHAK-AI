/**
 * Mock Realtime Event Simulator
 * Generates simulated events for demo mode
 * Automatically switches to real realtime when Supabase is configured
 */

export interface SimulatedEvent {
  id: string;
  source: string;
  event_type: "fire" | "deforestation" | "pollution" | "flood";
  confidence: number;
  location: string;
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  created_at: string;
}

const locations = [
  { name: "Uttarakhand Forest", lat: 30.45, lng: 78.15 },
  { name: "Madhya Pradesh", lat: 22.9, lng: 78.65 },
  { name: "Delhi NCR", lat: 28.5, lng: 77.1 },
  { name: "Bihar Region", lat: 26.15, lng: 87.5 },
  { name: "Rajasthan Desert", lat: 25.2, lng: 71.7 },
  { name: "Gujarat Coast", lat: 22.3, lng: 71.9 },
  { name: "Maharashtra Border", lat: 19.8, lng: 75.5 },
  { name: "Karnataka Hills", lat: 14.8, lng: 76.1 },
  { name: "Tamil Nadu Valley", lat: 11.5, lng: 79.5 },
  { name: "Kerala Backwaters", lat: 10.8, lng: 76.5 },
];

const eventTypes: Array<"fire" | "deforestation" | "pollution" | "flood"> = [
  "fire",
  "deforestation",
  "pollution",
  "flood",
];

const descriptions = {
  fire: [
    "Active fire detected near forest area",
    "Thermal anomaly detected",
    "Wildfire spreading rapidly",
    "Fire detected in remote area",
  ],
  deforestation: [
    "Tree cover loss detected",
    "Illegal logging suspected",
    "Land clearing detected",
    "Deforestation in progress",
  ],
  pollution: [
    "Air quality spike detected",
    "Pollution plume detected",
    "AQI level exceeded",
    "Industrial pollution detected",
  ],
  flood: [
    "Flood risk predicted",
    "River level rising",
    "Heavy rainfall detected",
    "Flash flood warning",
  ],
};

export class RealtimeSimulator {
  private interval: NodeJS.Timeout | null = null;
  private listeners: Array<(event: SimulatedEvent) => void> = [];
  private eventCount = 0;

  subscribe(callback: (event: SimulatedEvent) => void): () => void {
    this.listeners.push(callback);
    console.log(
      `[RealtimeSimulator] Subscriber added. Total: ${this.listeners.length}`
    );

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
      console.log(
        `[RealtimeSimulator] Subscriber removed. Total: ${this.listeners.length}`
      );
    };
  }

  start(intervalMs = 8000): void {
    if (this.interval) {
      console.log("[RealtimeSimulator] Already running");
      return;
    }

    console.log(
      `[RealtimeSimulator] Starting event simulator (interval: ${intervalMs}ms)`
    );

    this.interval = setInterval(() => {
      this.generateEvent();
    }, intervalMs);

    // Generate first event immediately
    this.generateEvent();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("[RealtimeSimulator] Stopped");
    }
  }

  private generateEvent(): void {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const type =
      eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const confidence = 0.6 + Math.random() * 0.35; // 0.6-0.95

    const event: SimulatedEvent = {
      id: `evt_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "simulator",
      event_type: type,
      confidence: parseFloat(confidence.toFixed(2)),
      location: location.name,
      latitude: location.lat + (Math.random() - 0.5) * 0.5,
      longitude: location.lng + (Math.random() - 0.5) * 0.5,
      properties: {
        description:
          descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
        simulator: true,
        demo_mode: true,
      },
      created_at: new Date().toISOString(),
    };

    this.eventCount++;
    console.log(
      `[RealtimeSimulator] Generated event #${this.eventCount}:`,
      event.event_type,
      "at",
      event.location,
      "confidence:",
      event.confidence
    );

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("[RealtimeSimulator] Error in listener:", error);
      }
    });
  }

  isRunning(): boolean {
    return this.interval !== null;
  }

  getEventCount(): number {
    return this.eventCount;
  }
}

// Singleton instance
export const realtimeSimulator = new RealtimeSimulator();
