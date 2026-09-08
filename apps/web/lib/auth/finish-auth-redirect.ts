import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { needsEmailVerification, verifyEmailHref } from "@/lib/auth/email-verification";
import { isBizProfile } from "@/lib/biz-os/landing";
import type { AuthResponse } from "@/lib/services/auth";
import { resolveAppHomePath } from "@/lib/store/app-store";

export function resolveAuthHomePath(
  response: AuthResponse,
  options?: {
    fallback?: string;
    afterRegister?: boolean;
    skipEmailVerification?: boolean;
  },
): string {
  const fallback = options?.fallback || "/dashboard";
  let homePath = resolveAppHomePath({
    welcomeApp: response.welcomeApp,
    fallback,
  });
  if (isBizProfile(response.profile)) {
    const dest = homePath;
    const bizFlow =
      dest === "/dashboard" ||
      dest.startsWith("/dashboard") ||
      dest === "/biz-os" ||
      dest.startsWith("/biz-os");
    if (bizFlow) {
      const firstVisit = Boolean(options?.afterRegister || response.isFirstLogin);
      // An explicit /biz-os dest (already-verified email link) should not re-open onboard.
      homePath = firstVisit && homePath !== "/biz-os" ? "/biz-os/onboard" : "/biz-os";
    }
  }
  if (!options?.skipEmailVerification && needsEmailVerification(response.user)) {
    homePath = verifyEmailHref(homePath);
  }
  return homePath;
}

/** Shared post-login/register navigation (email + OAuth). */
export function finishAuthRedirect(
  router: AppRouterInstance,
  response: AuthResponse,
  options?: {
    fallback?: string;
    afterRegister?: boolean;
    skipEmailVerification?: boolean;
  },
) {
  router.push(resolveAuthHomePath(response, options));
}
