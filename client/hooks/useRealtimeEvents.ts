import { useEffect, useState } from "react";
import { supabase, Event } from "@/lib/supabase";

interface UseRealtimeEventsOptions {
  onNewEvent?: (event: any) => void;
  autoSubscribe?: boolean;
  eventTable?: "events" | "alerts";
  eventType?: "INSERT" | "UPDATE" | "DELETE" | "*";
}

export function useRealtimeEvents(
  options: UseRealtimeEventsOptions = {}
) {
  const {
    onNewEvent,
    autoSubscribe = true,
    eventTable = "events",
    eventType = "INSERT",
  } = options;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!autoSubscribe) return;

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = () => {
      try {
        // Check if Supabase is configured
        const isConfigured =
          supabase.supabaseUrl &&
          !supabase.supabaseUrl.includes("placeholder");

        if (!isConfigured) {
          console.log(
            "[Realtime] Supabase not configured - realtime updates disabled"
          );
          setIsSubscribed(false);
          return;
        }

        // Subscribe to changes in the specified table
        const channelName = `${eventTable}-changes-${Math.random()}`;
        subscription = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: false },
              presence: { key: "" },
            },
          })
          .on(
            "postgres_changes",
            {
              event: eventType as any,
              schema: "public",
              table: eventTable,
            },
            (payload) => {
              const newEvent = payload.new;
              console.log(
                `[Realtime] New ${eventTable} event (${eventType}):`,
                newEvent
              );
              onNewEvent?.(newEvent);
            }
          )
          .subscribe((status) => {
            console.log(`[Realtime] ${eventTable} subscription status:`, status);
            if (status === "SUBSCRIBED") {
              console.log(`[Realtime] Successfully subscribed to ${eventTable}`);
              setIsSubscribed(true);
              setError(null);
              setRetryCount(0);
            } else if (status === "CLOSED") {
              console.log(`[Realtime] Disconnected from ${eventTable}`);
              setIsSubscribed(false);
            } else if (status === "CHANNEL_ERROR") {
              console.warn(
                `[Realtime] Channel error for ${eventTable} - Supabase may not be configured`
              );
              setIsSubscribed(false);
              // Retry with backoff
              if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // exponential backoff
                console.log(`[Realtime] Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
                setTimeout(() => {
                  setRetryCount((prev) => prev + 1);
                  subscribe();
                }, delay);
              }
            } else if (status === "TIMED_OUT") {
              console.warn(`[Realtime] Connection timed out for ${eventTable}`);
              setIsSubscribed(false);
            }
          });
      } catch (err) {
        console.warn(
          `[Realtime] Error subscribing to ${eventTable}:`,
          err instanceof Error ? err.message : String(err)
        );
        setIsSubscribed(false);
      }
    };

    subscribe();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log(`[Realtime] Unsubscribing from ${eventTable}`);
        subscription.unsubscribe();
      }
    };
  }, [autoSubscribe, onNewEvent, eventTable, eventType, retryCount]);

  return {
    isSubscribed,
    error,
  };
}

export function useRealtimeAlerts(
  options: UseRealtimeEventsOptions = {}
) {
  return useRealtimeEvents({
    ...options,
    eventTable: "alerts",
  });
}
