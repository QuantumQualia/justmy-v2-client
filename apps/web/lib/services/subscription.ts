/**
 * Subscription service — Stripe catalog and checkout for Biz OS plans.
 */

import { apiRequest, ApiClientError } from "../api-client";
import type { AuthResponse } from "./auth";

export interface CheckoutResponse {
  url: string;
  sessionId?: string;
}

export interface SubscriptionPlanPrice {
  priceId: string;
  interval: "month" | "year" | string;
  amount: number;
  currency: string;
}

export interface SubscriptionPlan {
  osName: string;
  productName: string;
  prices: SubscriptionPlanPrice[];
}

export const subscriptionService = {
  async listPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiRequest<{ plans: SubscriptionPlan[] }>("subscriptions/plans", {
      method: "GET",
      skipAuth: true,
    });
    return response.plans || [];
  },

  async createCheckoutSession(priceId: string): Promise<string> {
    try {
      const response = await apiRequest<CheckoutResponse>("subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });

      if (!response.url) {
        throw new ApiClientError("No checkout URL received from server");
      }

      return response.url;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to start checkout. Please try again.");
    }
  },

  async verifyCheckoutSession(sessionId: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest<AuthResponse>("subscriptions/verify-checkout", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
        skipAuth: true,
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
