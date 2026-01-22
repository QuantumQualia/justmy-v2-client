import { Metadata } from "next";
import { Suspense } from "react";
import StripeCallbackHandler from "./callback-handler";

export const metadata: Metadata = {
  title: "Processing Subscription",
  description: "Processing your subscription payment...",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StripeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <StripeCallbackHandler />
    </Suspense>
  );
}
