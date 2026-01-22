/**
 * Application Configuration
 * Centralized configuration from environment variables
 */

/**
 * Get the API base URL from environment variables
 * Falls back to relative path for same-domain API routes
 */
export function getApiBaseUrl(): string {
  // In browser/client-side, use NEXT_PUBLIC_ prefixed env var
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  
  // In server-side, use API_URL (without NEXT_PUBLIC_ prefix)
  return process.env.API_URL || "";
}

/**
 * Build full API URL from endpoint
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  
  // If baseUrl is provided, use it (for cross-domain)
  if (baseUrl) {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    // Ensure baseUrl doesn't end with slash
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }
  
  // Fallback to relative path (same domain)
  return endpoint.startsWith("/") ? endpoint : `/api/${endpoint}`;
}

