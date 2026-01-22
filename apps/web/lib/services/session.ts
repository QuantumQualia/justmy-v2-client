/**
 * Session Management Utilities
 * Provides helpers for checking authentication state and managing sessions
 */

import { tokenStorage } from "../storage/token-storage";
import { User } from "./auth";

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return tokenStorage.hasAccessToken();
}

/**
 * Get the current user from storage
 */
export function getCurrentUser(): User | null {
  return tokenStorage.getUser<User>();
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return tokenStorage.getAccessToken();
}

/**
 * Clear the current session (logout)
 */
export function clearSession(): void {
  tokenStorage.clear();
}

/**
 * Check if session has expired (basic check - token exists)
 * For more advanced expiration checking, decode JWT and check exp claim
 */
export function isSessionValid(): boolean {
  return tokenStorage.hasAccessToken();
}

