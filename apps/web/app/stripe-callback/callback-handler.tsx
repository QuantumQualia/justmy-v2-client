"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { subscriptionService } from "@/lib/services/subscription";
import { tokenStorage } from "@/lib/storage/token-storage";
import { ApiClientError } from "@/lib/services/auth";

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
          // Save tokens to storage (cookies)
          tokenStorage.setAccessToken(response.accessToken);
          if (response.refreshToken) {
            tokenStorage.setRefreshToken(response.refreshToken);
          }
          if (response.user) {
            tokenStorage.setUser(response.user);
          }

          // Redirect to dashboard with full page reload to ensure cookies are available for middleware
          router.push("/dashboard?welcome=true");
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Processing your subscription...</p>
      </div>
    </div>
  );
}

