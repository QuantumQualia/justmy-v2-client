/**
 * Subscription Service
 * Handles Stripe subscription checkout and management
 * All Stripe price IDs are managed on the backend
 */

import { apiRequest, ApiClientError } from "../api-client";

export interface CheckoutResponse {
  url: string; // Stripe Checkout Session URL
}

export interface VerifyCheckoutResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileType?: "PERSONAL" | "BIZ" | "GROWTH" | "FOUNDER" | "CITY" | "NETWORK";
  };
  accessToken: string;
  refreshToken?: string;
}

export type SubscriptionPlan = "GROWTH" | "FOUNDER";

/**
 * Subscription Service
 */
export const subscriptionService = {
  /**
   * Create a Stripe checkout session for a subscription plan
   * @param plan - The subscription plan identifier (GROWTH or FOUNDER)
   * @returns Checkout session URL to redirect user to Stripe
   */
  async createCheckoutSession(plan: SubscriptionPlan): Promise<string> {
    try {
      const response = await apiRequest<CheckoutResponse>("subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });

      if (!response.url) {
        throw new ApiClientError("No checkout URL received from server");
      }

      return response.url;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create checkout session. Please try again.");
    }
  },

  /**
   * Verify a Stripe checkout session and get user/auth data
   * Called after user completes payment on Stripe
   * @param sessionId - The Stripe Checkout Session ID from the callback
   * @returns User data and authentication tokens
   */
  async verifyCheckoutSession(sessionId: string): Promise<VerifyCheckoutResponse> {
    try {
      const response = await apiRequest<VerifyCheckoutResponse>("subscriptions/verify-checkout", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
        skipAuth: true, // Don't require auth for this endpoint
      });

      if (!response.user || !response.accessToken) {
        throw new ApiClientError("Invalid response from server");
      }

      return response;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to verify checkout session. Please try again.");
    }
  },
};

