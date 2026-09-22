import type { Metadata } from "next";
import { Suspense } from "react";

import { TryFreePageClient } from "@/components/try-free/try-free-page";

export const metadata: Metadata = {
  title: "AskSKY! — Try free",
  description:
    "Tell Sky your city. Get a real local answer, then start Personal OS or Biz OS free.",
};

export default function TryFreePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <TryFreePageClient />
    </Suspense>
  );
}
