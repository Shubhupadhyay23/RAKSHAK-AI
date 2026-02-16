import { useEffect, useState } from "react";
import { supabase, Event } from "@/lib/supabase";

interface UseRealtimeEventsOptions {
  onNewEvent?: (event: Event) => void;
  autoSubscribe?: boolean;
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const { onNewEvent, autoSubscribe = true } = options;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoSubscribe) return;

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = () => {
      try {
        // Subscribe to changes in the events table
        subscription = supabase
          .channel("events-changes")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "events",
            },
            (payload) => {
              const newEvent = payload.new as Event;
              console.log("[Realtime] New event:", newEvent);
              onNewEvent?.(newEvent);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("[Realtime] Subscribed to events");
              setIsSubscribed(true);
              setError(null);
            } else if (status === "CLOSED") {
              console.log("[Realtime] Disconnected from events");
              setIsSubscribed(false);
            } else if (status === "CHANNEL_ERROR") {
              console.error("[Realtime] Channel error");
              setError("Failed to subscribe to realtime updates");
            }
          });
      } catch (err) {
        console.error("[Realtime] Error subscribing:", err);
        setError(String(err));
      }
    };

    subscribe();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [autoSubscribe, onNewEvent]);

  return {
    isSubscribed,
    error,
  };
}

export function useRealtimeAlerts(options: UseRealtimeEventsOptions = {}) {
  const { onNewEvent, autoSubscribe = true } = options;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoSubscribe) return;

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = () => {
      try {
        subscription = supabase
          .channel("alerts-changes")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "alerts",
            },
            (payload) => {
              const newAlert = payload.new;
              console.log("[Realtime] New alert:", newAlert);
              onNewEvent?.(newAlert);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("[Realtime] Subscribed to alerts");
              setIsSubscribed(true);
              setError(null);
            } else if (status === "CLOSED") {
              console.log("[Realtime] Disconnected from alerts");
              setIsSubscribed(false);
            } else if (status === "CHANNEL_ERROR") {
              console.error("[Realtime] Channel error");
              setError("Failed to subscribe to realtime updates");
            }
          });
      } catch (err) {
        console.error("[Realtime] Error subscribing:", err);
        setError(String(err));
      }
    };

    subscribe();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [autoSubscribe, onNewEvent]);

  return {
    isSubscribed,
    error,
  };
}
