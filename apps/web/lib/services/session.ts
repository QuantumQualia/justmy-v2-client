/**
 * Session Management Utilities
 * Provides helpers for checking authentication state and managing sessions
 */

import { tokenStorage } from "../storage/token-storage";
import { User } from "./auth";

/**
 * Check if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return await tokenStorage.hasAccessToken();
}

/**
 * Get the current user from storage
 */
export async function getCurrentUser(): Promise<User | null> {
  return await tokenStorage.getUser<User>();
}

/**
 * Get the current access token
 */
export async function getAccessToken(): Promise<string | null> {
  return await tokenStorage.getAccessToken();
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
export async function isSessionValid(): Promise<boolean> {
  return await tokenStorage.hasAccessToken();
}

