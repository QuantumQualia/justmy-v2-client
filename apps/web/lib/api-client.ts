/**
 * Base API client utility for making HTTP requests
 * Enhanced with JWT token management and automatic refresh
 */

import { tokenStorage } from "./storage/token-storage";
import { buildApiUrl } from "./config";

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}

export class ApiClientError extends Error {
  statusCode?: number;
  error?: string;

  constructor(message: string, statusCode?: number, error?: string) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean; // Skip adding Authorization header
}

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token
 * This is a standalone function to avoid circular dependencies
 */
async function attemptTokenRefresh(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Direct fetch call to avoid circular dependency
      const refreshUrl = buildApiUrl("auth/refresh");
      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Token refresh failed");
      }

      // Handle response (support both accessToken and token naming)
      const accessToken = data.accessToken || data.token;
      if (accessToken) {
        tokenStorage.setAccessToken(accessToken);
        if (data.refreshToken) {
          tokenStorage.setRefreshToken(data.refreshToken);
        }
        if (data.user) {
          tokenStorage.setUser(data.user);
        }
        return accessToken;
      }
      return null;
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clear();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Get the current access token, refreshing if necessary
 */
async function getValidAccessToken(): Promise<string | null> {
  const token = tokenStorage.getAccessToken();
  if (token) {
    return token;
  }

  // Try to refresh if we have a refresh token
  if (tokenStorage.hasRefreshToken()) {
    return await attemptTokenRefresh();
  }

  return null;
}

/**
 * Base fetch wrapper with error handling and JWT token management
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, ...fetchOptions } = options;

  // Build URL with base URL from environment and query parameters
  let url = buildApiUrl(endpoint);
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // Set default headers as a plain object
  // Convert HeadersInit to Record<string, string> for easier manipulation
  const headers: Record<string, string> = {};

  // Only set Content-Type if there's a body
  if (fetchOptions.body) {
    headers["Content-Type"] = "application/json";
  }

  // Handle different HeadersInit types
  if (fetchOptions.headers) {
    if (fetchOptions.headers instanceof Headers) {
      fetchOptions.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(fetchOptions.headers)) {
      fetchOptions.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, fetchOptions.headers);
    }
  }

  // Add Authorization header if not skipped
  if (!skipAuth) {
    const token = await getValidAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle 204 No Content - no body to parse
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json().catch(() => ({}));

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipAuth) {
      const refreshedToken = await attemptTokenRefresh();
      
      if (refreshedToken) {
        // Retry the original request with new token
        headers.Authorization = `Bearer ${refreshedToken}`;
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers,
        });

        // Handle 204 No Content - no body to parse
        if (retryResponse.status === 204) {
          return undefined as T;
        }

        const retryData = await retryResponse.json().catch(() => ({}));

        if (!retryResponse.ok) {
          // If retry still fails, clear tokens and throw error
          if (retryResponse.status === 401) {
            tokenStorage.clear();
          }
          throw new ApiClientError(
            retryData.message || retryData.error || "Authentication failed",
            retryResponse.status,
            retryData.error
          );
        }

        return retryData as T;
      } else {
        // Refresh failed, clear tokens
        tokenStorage.clear();
        throw new ApiClientError(
          data.message || data.error || "Authentication failed. Please login again.",
          401,
          data.error
        );
      }
    }

    if (!response.ok) {
      throw new ApiClientError(
        data.message || data.error || "An error occurred",
        response.status,
        data.error
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}
