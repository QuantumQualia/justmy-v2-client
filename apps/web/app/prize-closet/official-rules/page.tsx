import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { OFFICIAL_RULES_JUMP, OfficialRulesSections } from "@/components/marketing/content/official-rules";

export const metadata: Metadata = {
  title: "Prize Closet Official Rules",
  description: "Official rules for Win with Sky! Prize Closet promotions on JustMy.",
};

export default function OfficialRulesPage() {
  return (
    <LegalPage
      eyebrow="WIN WITH SKY! · THE PRIZE CLOSET"
      title="Official Rules"
      updated={<>Effective Date: [Month] [Day], 2026 &middot; Applies to every Win with Sky! Prize Closet promotion</>}
      draft={<>DRAFT &mdash; pending attorney review, not final legal copy</>}
      intro={
        <p>
          These rules expand on the summary on <Link href="/prize-closet">The Prize Closet</Link> page. Please read
          them before entering.
        </p>
      }
      jump={OFFICIAL_RULES_JUMP}
    >
      <OfficialRulesSections />
    </LegalPage>
  );
}
