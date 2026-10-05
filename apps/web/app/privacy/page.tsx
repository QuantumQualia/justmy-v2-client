import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { PRIVACY_JUMP, PrivacySections } from "@/components/marketing/content/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How JustMy collects, uses, shares, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={<>Effective Date: [Month] [Day], 2026 &middot; Replaces all prior Privacy Policies posted on justmy.com</>}
      draft={<>DRAFT &mdash; new policy covering apps &amp; AI features, pending attorney review before publishing</>}
      intro={
        <p>
          This Privacy Policy explains how JustMyCities, Inc. (&ldquo;JustMy,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;) collects, uses, shares, and protects information when you use justmy.com, our local
          market sites (including JustMyMemphis and other markets as they launch), the JustMy mobile and web
          applications, Biz OS and our other business dashboards, AskSKY! and our other AI-powered features, and
          everything else we refer to as the &ldquo;Service&rdquo; in our <Link href="/terms">Terms of Service</Link>.
          This policy should be read together with that Agreement.
        </p>
      }
      jump={PRIVACY_JUMP}
    >
      <PrivacySections />
    </LegalPage>
  );
}
