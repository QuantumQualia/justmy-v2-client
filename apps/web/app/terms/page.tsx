import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { TERMS_JUMP, TermsSections } from "@/components/marketing/content/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of JustMy, its apps, and AskSKY! AI features.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={
        <>Effective Date: [Month] [Day], 2026 &middot; Replaces all prior Terms of Service posted on justmy.com</>
      }
      draft={<>DRAFT &mdash; updated for apps &amp; AI features, pending attorney review before publishing</>}
      jump={TERMS_JUMP}
    >
      <TermsSections />
    </LegalPage>
  );
}
