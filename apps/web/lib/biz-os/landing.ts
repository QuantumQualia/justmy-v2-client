import { isBusinessOs, type OsName } from "@/lib/os-types";
import { verifyEmailHref } from "@/lib/auth/email-verification";

/** Same-origin path so newsstand hosts keep /verify-email and /biz-os. */
export function bizOsHref(path: string): string {
  return path;
}

export function isBizProfile(profile?: { type?: string; osName?: string } | null): boolean {
  return isBusinessOs(profile?.osName || profile?.type);
}

/** Claim-only cards (name/zip/phone) still need onboard. */
export function isMycardReady(
  profile?: {
    photo?: string | null;
    about?: string | null;
    tagline?: string | null;
    website?: string | null;
    hotlinks?: unknown[] | null;
    ctas?: unknown[] | null;
    socialLinks?: unknown[] | null;
    socials?: unknown[] | null;
  } | null,
): boolean {
  if (!profile) return false;
  const filled = (value?: string | null) => Boolean(value && String(value).trim());
  return (
    filled(profile.photo) ||
    filled(profile.about) ||
    filled(profile.tagline) ||
    filled(profile.website) ||
    (profile.hotlinks?.length ?? 0) > 0 ||
    (profile.ctas?.length ?? 0) > 0 ||
    (profile.socialLinks?.length ?? 0) > 0 ||
    (profile.socials?.length ?? 0) > 0
  );
}

export function bizOsLandingPath(profile?: Parameters<typeof isMycardReady>[0]): string {
  return isMycardReady(profile) ? "/biz-os" : "/biz-os/onboard";
}

export function resolveBizAuthPath(options: {
  profile?: { type?: string; osName?: string } | null;
  emailVerified?: boolean;
  fallback?: string;
  explicitRedirect?: string | null;
  afterRegister?: boolean;
}): string {
  const explicit = options.explicitRedirect?.trim() || "";
  const isDefault = !explicit || explicit === "/dashboard";
  if (!isDefault && explicit !== "/dashboard?welcome=true") {
    return explicit;
  }
  if (!isBizProfile(options.profile)) {
    return options.fallback || "/dashboard";
  }
  if (options.emailVerified === false) {
    return verifyEmailHref(options.afterRegister ? "/biz-os/onboard" : "/biz-os");
  }
  return options.afterRegister ? "/biz-os/onboard" : "/biz-os";
}

export function profileIdFromMe(me: {
  profile?: { id?: string | number };
  profileId?: number;
  profileType?: OsName;
  osName?: OsName;
}): number | null {
  const raw = me.profile?.id ?? me.profileId;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
