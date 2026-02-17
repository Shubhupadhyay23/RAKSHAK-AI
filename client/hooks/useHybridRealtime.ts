import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { realtimeSimulator } from "@/lib/realtimeSimulator";

interface UseHybridRealtimeOptions {
  onNewEvent?: (event: any) => void;
  autoStart?: boolean;
  table?: "events" | "alerts";
}

export function useHybridRealtime(options: UseHybridRealtimeOptions = {}) {
  const { onNewEvent, autoStart = true, table = "events" } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoStart) return;

    // Check if Supabase is configured
    const isSupabaseConfigured =
      supabase.supabaseUrl &&
      !supabase.supabaseUrl.includes("placeholder") &&
      !supabase.supabaseUrl.includes("your-");

    if (isSupabaseConfigured) {
      console.log("[HybridRealtime] Supabase configured - using LIVE mode");
      setupLiveRealtime();
      setMode("live");
    } else {
      console.log("[HybridRealtime] Supabase not configured - using DEMO mode");
      setupDemoRealtime();
      setMode("demo");
    }

    return () => {
      realtimeSimulator.stop();
    };
  }, [autoStart]);

  const setupDemoRealtime = () => {
    console.log("[HybridRealtime] Starting demo realtime simulator...");

    // Subscribe to simulated events
    const unsubscribe = realtimeSimulator.subscribe((event) => {
      console.log("[HybridRealtime] Demo event:", event);
      onNewEvent?.(event);
    });

    // Start generating events every 8 seconds
    realtimeSimulator.start(8000);
    setIsConnected(true);
    setError(null);
  };

  const setupLiveRealtime = () => {
    console.log("[HybridRealtime] Connecting to live Supabase realtime...");

    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let reconnectAttempts = 0;

    const connect = () => {
      try {
        const channelName = `${table}-live-${Math.random()}`;
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
              event: "INSERT",
              schema: "public",
              table: table,
            },
            (payload) => {
              console.log("[HybridRealtime] Live event received:", payload.new);
              onNewEvent?.(payload.new);
            }
          )
          .subscribe((status) => {
            console.log(
              `[HybridRealtime] Connection status (${table}):`,
              status
            );

            if (status === "SUBSCRIBED") {
              console.log(
                `[HybridRealtime] ✅ Connected to live ${table} updates`
              );
              setIsConnected(true);
              setError(null);
              reconnectAttempts = 0;
            } else if (status === "CLOSED") {
              console.log(
                `[HybridRealtime] Disconnected from ${table} updates`
              );
              setIsConnected(false);
            } else if (status === "CHANNEL_ERROR") {
              console.warn(
                `[HybridRealtime] Channel error - falling back to demo mode`
              );
              setIsConnected(false);
              setError("Connection failed - using demo mode");
              // Fallback to demo
              subscription?.unsubscribe();
              setTimeout(() => setupDemoRealtime(), 2000);
            } else if (status === "TIMED_OUT") {
              console.warn("[HybridRealtime] Connection timed out");
              setIsConnected(false);
              reconnectAttempts++;
              if (reconnectAttempts < 3) {
                const delay = Math.pow(2, reconnectAttempts) * 1000;
                console.log(
                  `[HybridRealtime] Retrying in ${delay}ms (attempt ${reconnectAttempts}/3)`
                );
                setTimeout(() => connect(), delay);
              } else {
                console.warn(
                  "[HybridRealtime] Max retries exceeded - falling back to demo"
                );
                setupDemoRealtime();
              }
            }
          });
      } catch (err) {
        console.error("[HybridRealtime] Connection error:", err);
        setError(String(err));
        // Fallback to demo
        setTimeout(() => setupDemoRealtime(), 1000);
      }
    };

    connect();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  };

  return {
    isConnected,
    mode,
    error,
    isDemoMode: mode === "demo",
    isLiveMode: mode === "live",
  };
}
