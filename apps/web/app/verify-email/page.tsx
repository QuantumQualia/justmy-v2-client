"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authService } from "@/lib/services/auth";
import { tokenStorage } from "@/lib/storage/token-storage";
import { ApiClientError } from "@/lib/api-client";
import { ForceLightMode } from "@/components/theme/force-light-mode";
import { bizOsQueryKeys } from "@/components/biz-os/use-biz-os-profile";
import { continueAfterVerification } from "@/lib/auth/email-verification";
import { hydrateNewsStoresAfterAuth } from "@/lib/news/hydrate-after-auth";

type StoredUser = { emailVerified?: boolean; profileType?: string };

function VerifyEmailInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("t");
  const redirectParam = searchParams.get("redirect");
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">(
    token ? "working" : "idle",
  );
  const [message, setMessage] = useState(
    token
      ? "Confirming your email…"
      : "We sent a confirmation link to your inbox. Open it to continue.",
  );
  const [signedIn, setSignedIn] = useState(false);
  const [continueHref, setContinueHref] = useState(
    continueAfterVerification({ redirect: redirectParam }),
  );

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    setStatus("working");
    setMessage("Confirming your email…");

    void (async () => {
      try {
        const { stored, me, alreadyVerified } = await authService.verifyEmailAndRefreshSession(token);
        if (ignore) return;

        if (me) {
          queryClient.setQueryData(bizOsQueryKeys.me, me);
          await hydrateNewsStoresAfterAuth();
          if (ignore) return;
        }

        const profileType =
          me?.profileType || me?.profile?.osName || me?.profile?.type || stored?.profileType;
        const next = continueAfterVerification({
          redirect: redirectParam,
          profileType,
          alreadyVerified,
        });
        setContinueHref(next);
        setSignedIn(Boolean(stored));
        setStatus("ok");
        setMessage(
          stored
            ? alreadyVerified
              ? "You're already verified. Taking you in…"
              : "Email verified. Taking you in…"
            : alreadyVerified
              ? "You're already verified. Sign in to continue."
              : "Email verified. Sign in to continue.",
        );
        if (stored) router.replace(next);
      } catch (err: unknown) {
        if (ignore) return;
        setStatus("error");
        setMessage(
          err instanceof ApiClientError ? err.message : "This link is invalid or expired.",
        );
      }
    })();

    return () => {
      ignore = true;
    };
  }, [token, redirectParam, router, queryClient]);

  useEffect(() => {
    if (token) return;
    let cancelled = false;

    void (async () => {
      const stored = await tokenStorage.getUser<StoredUser>();
      if (stored?.emailVerified === true) {
        let profileType = stored.profileType;
        try {
          const me = await authService.getCurrentUser();
          profileType = me.profileType || me.profile?.osName || me.profile?.type || profileType;
        } catch {
          /* fall through */
        }
        const next = continueAfterVerification({
          redirect: redirectParam,
          profileType,
          alreadyVerified: true,
        });
        if (!cancelled) router.replace(next);
        return;
      }

      try {
        const me = await authService.getCurrentUser();
        if (cancelled) return;
        if (me.emailVerified === true) {
          const next = continueAfterVerification({
            redirect: redirectParam,
            profileType: me.profileType || me.profile?.osName || me.profile?.type,
            alreadyVerified: true,
          });
          router.replace(next);
          return;
        }
        setSignedIn(true);
      } catch {
        if (!cancelled) setSignedIn(Boolean(stored));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, redirectParam, router]);

  async function resend() {
    try {
      await authService.resendVerificationEmail();
      setMessage("We sent another confirmation link.");
    } catch {
      setMessage("Sign in first, then resend from this page.");
    }
  }

  const showResend = status !== "ok" && status !== "working" && !token;
  const loginHref = `/login?redirect=${encodeURIComponent(continueHref)}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        {status === "working" ? (
          <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-violet-600" aria-hidden />
        ) : null}
        {showResend ? (
          <button
            type="button"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110"
            onClick={() => void resend()}
          >
            Resend confirmation
          </button>
        ) : null}
        {status === "ok" && !signedIn ? (
          <Link
            href={loginHref}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110"
          >
            Sign in to continue
          </Link>
        ) : null}
        {status === "ok" && signedIn ? (
          <Link
            href={continueHref}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-linear-to-r from-violet-600 to-cyan-400 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-110"
          >
            Continue
          </Link>
        ) : null}
        {status === "error" ? (
          <Link href={loginHref} className="mt-6 inline-block text-sm font-medium text-violet-700 hover:underline">
            Back to sign in
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <ForceLightMode>
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
            <p className="text-center text-sm text-slate-600">Loading…</p>
          </div>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </ForceLightMode>
  );
}
