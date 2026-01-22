/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { apiRequest, ApiClientError } from "../api-client";
import { tokenStorage } from "../storage/token-storage";

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
  tier: "PERSONAL" | "BUSINESS";
  referralCode?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tier?: "PERSONAL" | "BUSINESS";
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
  tier?: "PERSONAL" | "BUSINESS";
  businessName?: string;
  zipCode?: string;
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

      // Save tokens and user data
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

      // Save tokens and user data (stored in cookies - accessible to both client and server)
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

      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Registration failed. Please try again.");
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
    }
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await apiRequest<User>("auth/me");
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

      // Update tokens in storage (cookies)
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

