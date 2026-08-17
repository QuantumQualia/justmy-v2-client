/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiRequest, ApiClientError } from "../api-client";
import { tokenStorage } from "../storage/token-storage";
import type { OsName } from "@/lib/os-types";

export { ApiClientError };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  zipCode: string;
  businessName?: string;
  profileType: OsName;
  referralCode?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  profile?: any; // Profile response from formatProfileResponse
  // Default app based on user's OS
  welcomeApp?: {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    navigation?: any[] | null;
    osApps?: Array<{
      osId: number;
      isWelcome: boolean;
      isStandard: boolean;
    }>;
  };
  // Support both naming conventions (NestJS typically uses accessToken)
  accessToken?: string;
  token?: string; // Fallback for compatibility
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  profileType?: OsName;
  businessName?: string;
  zipCode?: string;
  profile?: any; // Profile response from formatProfileResponse
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface OauthGoogleData {
  idToken: string;
  zipCode?: string;
  referralCode?: string;
  profileType?: OsName;
}

export interface OauthAppleData {
  identityToken: string;
  firstName?: string;
  lastName?: string;
  zipCode?: string;
  referralCode?: string;
  profileType?: OsName;
}

async function persistAuthSession(response: AuthResponse): Promise<void> {
  const accessToken = response.accessToken || response.token;
  if (accessToken) {
    tokenStorage.setAccessToken(accessToken);
  }
  if (response.refreshToken) {
    tokenStorage.setRefreshToken(response.refreshToken);
  }
  if (response.user) {
    tokenStorage.setUser(response.user);
  }

  if (response.profile) {
    const { mapApiProfileToProfileData } = await import("../store/profile-mapper");
    const { useProfileStore } = await import("../store/profile-store");
    const profileData = mapApiProfileToProfileData(response.profile);
    useProfileStore.getState().setData(profileData);
  }

  if (response.welcomeApp && typeof window !== "undefined") {
    const { useAppStore } = await import("../store/app-store");
    useAppStore.getState().setFromWelcomeApp(response.welcomeApp);
  }
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   * Automatically saves tokens and user data to storage
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>("auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        skipAuth: true, // Don't send token for login
      });

      await persistAuthSession(response);
      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Login failed. Please try again.");
    }
  },

  /**
   * Register a new user account
   * Automatically saves tokens and user data to storage
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>("auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true, // Don't send token for registration
      });

      await persistAuthSession(response);
      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Registration failed. Please try again.");
    }
  },

  /**
   * Sign in or register with a Google Identity Services ID token.
   */
  async oauthGoogle(data: OauthGoogleData): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>("auth/oauth/google", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });

      await persistAuthSession(response);
      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Google sign-in failed. Please try again.");
    }
  },

  /**
   * Sign in or register with an Apple identity token.
   */
  async oauthApple(data: OauthAppleData): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>("auth/oauth/apple", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });

      await persistAuthSession(response);
      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Apple sign-in failed. Please try again.");
    }
  },

  /**
   * Logout the current user
   * Clears tokens and user data from storage
   */
  async logout(): Promise<void> {
    try {
      await apiRequest("auth/logout", {
        method: "POST",
      });
    } catch (error) {
      // Even if logout fails on server, we should clear local state
      console.error("Logout error:", error);
    } finally {
      // Always clear tokens (cookies)
      tokenStorage.clear();
      // Clear profile store
      const { useProfileStore } = await import("../store/profile-store");
      useProfileStore.getState().reset();
      // Clear current app store
      const { useAppStore } = await import("../store/app-store");
      useAppStore.getState().clear();
    }
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiRequest<User>("auth/me");
      
      // Store default profile in global state if available
      if (user.profile) {
        const { mapApiProfileToProfileData } = await import("../store/profile-mapper");
        const { useProfileStore } = await import("../store/profile-store");
        const profileData = mapApiProfileToProfileData(user.profile);
        useProfileStore.getState().setData(profileData);
      }
      
      return user;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch user data.");
    }
  },

  /**
   * Refresh the authentication token
   * Should be called with skipAuth to avoid circular refresh
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>("auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipAuth: true, // Don't send access token, only refresh token in body
      });

      await persistAuthSession(response);
      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to refresh token.");
    }
  },

  /**
   * Request a password reset email
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>("auth/password/reset", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to request password reset.");
    }
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>("auth/password/confirm", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to reset password.");
    }
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>("auth/password/change", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to change password.");
    }
  },

  /**
   * Verify email address with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>("auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to verify email.");
    }
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>("auth/verify-email/resend", {
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to resend verification email.");
    }
  },
};

