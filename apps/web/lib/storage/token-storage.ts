/**
 * Token Storage Utility
 * Handles secure storage and retrieval of JWT tokens
 * Uses cookies as the single source of truth (accessible to both client and server)
 * This allows middleware to check auth on server-side while client code can also read tokens
 */

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get a cookie value (works on both client and server)
 * Note: On server-side, this dynamically imports Next.js cookies() which only works in Server Components, Server Actions, and Route Handlers
 */
async function getCookie(name: string): Promise<string | null> {
  // Server-side: use Next.js cookies() with dynamic import to avoid client bundle issues
  if (!isBrowser()) {
    try {
      // Dynamic import to avoid bundling next/headers in client components
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const value = cookieStore.get(name)?.value;
      if (value) {
        console.log(`[TokenStorage] Retrieved ${name} from server cookies`);
      } else {
        console.log(`[TokenStorage] ${name} not found in server cookies`);
      }
      return value || null;
    } catch (error) {
      // cookies() might throw if called outside of Server Components/Actions/Route Handlers
      // This is expected in client components - the API client will work without the token
      console.log(`[TokenStorage] Could not read ${name} from server cookies:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  
  // Client-side: use document.cookie
  const nameEQ = name + "=";
  const cookiesStr = document.cookie.split(";");
  for (let i = 0; i < cookiesStr.length; i++) {
    let cookie = cookiesStr[i];
    if (!cookie) continue;
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }
  return null;
}

/**
 * Set a cookie (client-side only)
 */
function setCookie(name: string, value: string, days = 7): void {
  if (!isBrowser()) return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax${secure}`;
}

/**
 * Delete a cookie (client-side only)
 */
function deleteCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Token Storage Service
 */
export const tokenStorage = {
  /**
   * Save access token (stores in cookies - accessible to both client and server)
   */
  setAccessToken(token: string): void {
    setCookie(ACCESS_TOKEN_KEY, token);
  },

  /**
   * Get access token (reads from cookies)
   */
  async getAccessToken(): Promise<string | null> {
    return await getCookie(ACCESS_TOKEN_KEY);
  },

  /**
   * Save refresh token (stores in cookies)
   */
  setRefreshToken(token: string): void {
    setCookie(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Get refresh token (reads from cookies)
   */
  async getRefreshToken(): Promise<string | null> {
    return await getCookie(REFRESH_TOKEN_KEY);
  },

  /**
   * Save user data (stores in cookies)
   */
  setUser(user: unknown): void {
    try {
      setCookie(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  },

  /**
   * Get user data (reads from cookies)
   */
  async getUser<T = unknown>(): Promise<T | null> {
    try {
      const user = await getCookie(USER_KEY);
      return user ? (JSON.parse(user) as T) : null;
    } catch (error) {
      console.error("Failed to get user data:", error);
      return null;
    }
  },

  /**
   * Clear all tokens and user data (deletes cookies)
   */
  clear(): void {
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_KEY);
  },

  /**
   * Check if user has a valid access token
   */
  async hasAccessToken(): Promise<boolean> {
    return !!(await this.getAccessToken());
  },

  /**
   * Check if user has a valid refresh token
   */
  async hasRefreshToken(): Promise<boolean> {
    return !!(await this.getRefreshToken());
  },
};

