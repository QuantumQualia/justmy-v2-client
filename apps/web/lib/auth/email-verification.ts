/**
 * Platform-wide email verification. Any logged-in user with
 * `emailVerified !== true` is kept on `/verify-email` until they confirm.
 * Google/Apple OAuth is treated as verified by the API.
 */

export const VERIFY_EMAIL_PATH = "/verify-email";
export const DEFAULT_POST_VERIFY_PATH = "/dashboard";

const EXEMPT_PREFIXES = [
  VERIFY_EMAIL_PATH,
  "/forgot-password",
  "/reset-password",
] as const;

export function needsEmailVerification(user: {
  emailVerified?: boolean | null;
} | null | undefined): boolean {
  return user?.emailVerified !== true;
}

export function isEmailVerificationExemptPath(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Build `/verify-email?redirect=` for post-auth navigation. */
export function verifyEmailHref(redirect?: string | null): string {
  const dest = (redirect || "").trim();
  if (
    !dest ||
    dest === VERIFY_EMAIL_PATH ||
    dest.startsWith(`${VERIFY_EMAIL_PATH}?`)
  ) {
    return VERIFY_EMAIL_PATH;
  }
  return `${VERIFY_EMAIL_PATH}?redirect=${encodeURIComponent(dest)}`;
}

export function safeInternalPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_VERIFY_PATH,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value === VERIFY_EMAIL_PATH || value.startsWith(`${VERIFY_EMAIL_PATH}?`)) {
    return fallback;
  }
  return value;
}

export function continueAfterVerification(options: {
  redirect?: string | null;
  profileType?: string | null;
  /** True when this request reused an already-verified account (same email link again). */
  alreadyVerified?: boolean;
}): string {
  const isBiz = String(options.profileType || "").toUpperCase() === "BIZ";
  const redirect = safeInternalPath(options.redirect, isBiz ? "/biz-os/onboard" : DEFAULT_POST_VERIFY_PATH);
  const looksBiz = isBiz || redirect === "/biz-os" || redirect.startsWith("/biz-os/");
  if (looksBiz) {
    return options.alreadyVerified ? "/biz-os" : "/biz-os/onboard";
  }
  return redirect;
}
