"use client";

import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { BizOsEmpty, BizOsHeader, BizOsPage, ComingSoonBadge } from "@/components/biz-os/biz-os-ui";
import { BizOsPlanGate } from "@/components/biz-os/plan-gate";

export function BizOsComingSoonPage({
  eyebrow = "Roadmap",
  title,
  body,
  planHint,
  minTier,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  planHint?: string;
  minTier: string;
}) {
  return (
    <BizOsPlanGate
      minTier={minTier}
      title={title}
      body={`${title} is included starting at that plan. Upgrade to see the roadmap for this tool.`}
    >
      <BizOsPage>
        <BizOsHeader
          eyebrow={eyebrow}
          title={title}
          description={body}
          actions={<ComingSoonBadge />}
        />
        <BizOsEmpty
          title="Coming soon"
          body={planHint || "This tool is on the roadmap. Everything that is live today stays on this OS."}
          action={
            <Button asChild>
              <Link href="/biz-os/pricing">See plans</Link>
            </Button>
          }
        />
      </BizOsPage>
    </BizOsPlanGate>
  );
}
