"use client";

import { useEffect, useRef, useState } from "react";

import {
  APPLE_SIGN_IN_ENABLED,
  preloadOauthProviders,
  requestAppleIdentityToken,
  requestGoogleIdToken,
} from "@/lib/auth/oauth-providers";
import { ApiClientError, authService, type AuthResponse } from "@/lib/services/auth";
import type { OsName } from "@/lib/os-types";

function toAuthError(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function useOauthSignIn(options: {
  zipCode?: string;
  referralCode?: string;
  osName: OsName;
  onSuccess: (response: AuthResponse) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    void preloadOauthProviders();
  }, []);

  async function handleGoogle() {
    const current = optionsRef.current;
    setError("");
    setLoading(true);
    try {
      const idToken = await requestGoogleIdToken();
      const response = await authService.oauthGoogle({
        idToken,
        zipCode: current.zipCode || undefined,
        referralCode: current.referralCode?.trim() || undefined,
        osName: current.osName,
      });
      current.onSuccess(response);
    } catch (err) {
      setError(toAuthError(err, "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    const current = optionsRef.current;
    setError("");
    setLoading(true);
    try {
      const apple = await requestAppleIdentityToken();
      const response = await authService.oauthApple({
        identityToken: apple.identityToken,
        firstName: apple.firstName,
        lastName: apple.lastName,
        zipCode: current.zipCode || undefined,
        referralCode: current.referralCode?.trim() || undefined,
        osName: current.osName,
      });
      current.onSuccess(response);
    } catch (err) {
      setError(toAuthError(err, "Apple sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    setError,
    setLoading,
    handleGoogle,
    handleApple: APPLE_SIGN_IN_ENABLED ? handleApple : undefined,
    showApple: APPLE_SIGN_IN_ENABLED,
  };
}
