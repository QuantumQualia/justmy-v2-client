/**
 * Application Configuration
 * Centralized configuration from environment variables
 */

/**
 * Get the API base URL from environment variables
 * Falls back to relative path for same-domain API routes (client-side only)
 */
export function getApiBaseUrl(): string {
  // In browser/client-side, use NEXT_PUBLIC_ prefixed env var
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  
  // In server-side, we MUST have an absolute URL
  // Try API_URL first (server-side only, without NEXT_PUBLIC_ prefix)
  const serverApiUrl = process.env.API_URL;
  if (serverApiUrl) {
    return serverApiUrl;
  }
  
  // Fallback: use NEXT_PUBLIC_API_URL (available on server too)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Last resort: construct from NEXT_PUBLIC_APP_URL or use localhost
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return appUrl;
  }
  
  // Development fallback: use localhost
  return "http://localhost:3000";
}

/**
 * Build full API URL from endpoint
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const isServer = typeof window === "undefined";
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  
  // On server-side, we MUST have an absolute URL
  if (isServer) {
    // Ensure baseUrl doesn't end with slash
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    // Check if baseUrl already includes /api, if not add it
    if (cleanBaseUrl.includes("/")) {
      return `${cleanBaseUrl}/${cleanEndpoint}`;
    }
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }
  
  // Client-side: use baseUrl if provided, otherwise relative path
  if (baseUrl) {
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    if (cleanBaseUrl.includes("/")) {
      return `${cleanBaseUrl}/${cleanEndpoint}`;
    }
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }
  
  // Fallback to relative path (same domain) - only for client-side
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

