import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BusinessClaimLanding } from "@/components/refer/business-claim-landing";
import { referralsService, type BusinessClaimPreview } from "@/lib/services/referrals";

type Props = { params: Promise<{ token: string }> };

const loadPreview = cache(async (token: string): Promise<BusinessClaimPreview | null> => {
  try {
    return await referralsService.claimPreview(token);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const preview = await loadPreview(token);
  return {
    title: preview ? `Claim ${preview.business.name} on JustMy` : "Claim your business",
    description: "A neighbor recommended your business. Your free JustMy business card is ready to claim.",
    robots: { index: false },
  };
}

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;
  const preview = await loadPreview(token);
  if (!preview) notFound();
  return <BusinessClaimLanding preview={preview} />;
}
