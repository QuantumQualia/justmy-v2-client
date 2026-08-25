"use client";

import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/lib/services/subscription";

export const subscriptionQueryKeys = {
  plans: ["subscriptions", "plans"] as const,
};

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionQueryKeys.plans,
    queryFn: () => subscriptionService.listPlans(),
    staleTime: 5 * 60_000,
  });
}
