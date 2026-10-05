import type { Metadata } from "next";
import { cache } from "react";

import { ReferredLanding } from "@/components/refer/referred-landing";
import { referralsService, type ReferrerPreview } from "@/lib/services/referrals";

type Props = { params: Promise<{ code: string }> };

const loadReferrer = cache(async (code: string): Promise<ReferrerPreview | null> => {
  try {
    return await referralsService.referrer(code);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const referrer = await loadReferrer(code);
  const who = referrer?.firstName || "A friend";
  return {
    title: `${who} invited you to JustMy`,
    description: "Your city's news, deals, and AI assistant Sky — all free. Join and you both earn credits.",
    robots: { index: false },
  };
}

export default async function ReferredPage({ params }: Props) {
  const { code } = await params;
  const referrer = await loadReferrer(code);
  return (
    <ReferredLanding
      code={referrer?.code ?? code}
      referrerName={referrer?.displayName ?? null}
      referrerFirstName={referrer?.firstName ?? null}
    />
  );
}
