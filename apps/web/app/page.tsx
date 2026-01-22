import { Metadata } from "next";
import { Suspense } from "react";
import LandingPage from "./page-client";

export const metadata: Metadata = {
  title: "Personal Operating System for Your Life, Business, and Community",
  description: "Don't just live in the city. Run it. The first Personal Operating System for your life, business, and community. Choose from Personal OS, Business OS, Growth OS, or Founders OS.",
  openGraph: {
    title: "JustMy.com - Personal Operating System",
    description: "Don't just live in the city. Run it. The first Personal Operating System for your life, business, and community.",
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LandingPage />
    </Suspense>
  );
}
