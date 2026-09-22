"use client";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { DotClaimModal } from "@/components/news/asksky/dot-claim-modal";
import { finishAuthRedirect } from "@/lib/auth/finish-auth-redirect";
import type { AuthResponse } from "@/lib/services/auth";
import type { TryFreeCategory } from "@/lib/try-free/types";
import { useRouter, useSearchParams } from "next/navigation";

export function TryFreeSignupTrigger({
  open,
  onOpenChange,
  category,
  zip,
  businessName,
  website,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: TryFreeCategory;
  zip?: string;
  businessName?: string;
  website?: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const referralCode = search.get("ref") || search.get("referral") || "";

  function onSuccess(response: AuthResponse) {
    finishAuthRedirect(router, response, {
      afterRegister: true,
      fallback: category === "personal" ? "/personal-os?welcome=1" : "/biz-os/onboard",
    });
  }

  if (category === "personal") {
    return (
      <AuthDialog
        open={open}
        onOpenChange={onOpenChange}
        defaultMode="register"
        defaultZip={zip}
        defaultReferralCode={referralCode}
        profileKind="personal"
        onAuthSuccess={onSuccess}
      />
    );
  }

  return (
    <DotClaimModal
      open={open}
      onOpenChange={onOpenChange}
      defaultZip={zip}
      defaultBusinessName={businessName}
      defaultWebsite={website}
      entryCategory={category}
    />
  );
}
