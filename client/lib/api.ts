/**
 * Robust API client with fallback support
 * Gracefully handles connection errors and timeouts
 */

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  timeout?: number;
}

async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const {
    method = "GET",
    body = undefined,
    timeout = 5000, // 5 second timeout
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(endpoint, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.warn(`[API] Request failed (${endpoint}):`, errorMessage);

    // Return null on error - caller should handle gracefully
    return null;
  }
}

export const api = {
  getEvents: () => apiCall("/api/events"),
  getAlert: (id: string) => apiCall(`/api/alerts/${id}`),
  generateAction: (id: string, body: unknown) =>
    apiCall(`/api/alerts/${id}/generate`, { method: "POST", body }),
  getIngestionStatus: () => apiCall("/api/ingestion/status"),
  triggerFIRMS: () => apiCall("/api/ingestion/firms", { method: "POST" }),
};
