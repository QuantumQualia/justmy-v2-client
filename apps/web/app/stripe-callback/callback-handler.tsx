"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { subscriptionService } from "@/lib/services/subscription";
import { ApiClientError, persistAuthSession } from "@/lib/services/auth";

export default function StripeCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        router.push("/login?error=no_session");
        return;
      }

      try {
        // Call backend to verify Stripe session and get user/auth data
        const response = await subscriptionService.verifyCheckoutSession(sessionId);

        // If user data is returned, create session
        if (response.user && response.accessToken) {
          await persistAuthSession(response);
          router.push("/biz-os");
        } else {
          // If no user data, redirect to login
          router.push("/login?error=verification_failed");
        }
      } catch (error) {
        if (error instanceof ApiClientError) {
          router.push(`/login?error=${encodeURIComponent(error.message)}`);
        } else {
          router.push("/login?error=callback_failed");
        }
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Processing your subscription...</p>
      </div>
    </div>
  );
}

