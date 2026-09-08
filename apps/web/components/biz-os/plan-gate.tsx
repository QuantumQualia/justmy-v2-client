"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@workspace/ui/components/button";
import { BizOsEmpty, BizOsHeader, BizOsPage, BizOsSkeleton } from "@/components/biz-os/biz-os-ui";
import { useBizOsProfile } from "@/components/biz-os/use-biz-os-profile";
import {
  accountTierLabel,
  hasAccess,
  osNameToAccountTier,
  parseAccountTier,
} from "@/lib/plan-features";
import { canonicalizeOsName } from "@/lib/os-types";

export function requiredPlanLabel(minTier: string): string {
  const parsed = parseAccountTier(minTier) ?? osNameToAccountTier(minTier);
  return accountTierLabel(parsed);
}

export function BizOsPlanGate({
  minTier,
  title,
  body,
  children,
}: {
  minTier: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  const { me, ready } = useBizOsProfile();
  if (!ready) return <BizOsSkeleton />;
  const osName = canonicalizeOsName(me?.osName || me?.profileType);
  if (!hasAccess(osName, minTier)) {
    const need = requiredPlanLabel(minTier);
    return (
      <BizOsPage>
        <BizOsHeader title={title} />
        <BizOsEmpty
          title={`${need} required`}
          body={body}
          action={
            <Button asChild>
              <Link href="/biz-os/pricing">View plans</Link>
            </Button>
          }
        />
      </BizOsPage>
    );
  }
  return <>{children}</>;
}
