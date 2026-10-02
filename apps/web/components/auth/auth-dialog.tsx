"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import {
  APPLE_SIGN_IN_ENABLED,
  preloadOauthProviders,
  requestAppleIdentityToken,
  requestGoogleIdToken,
} from "@/lib/auth/oauth-providers";
import {
  ApiClientError,
  authService,
  type AuthResponse,
} from "@/lib/services/auth";
import {
  DEFAULT_PROFILE_KIND,
  profileKindDisplayShort,
  profileKindToOsName,
  type ProfileKind,
} from "@/lib/os-types";

export type AuthDialogMode = "register" | "login";

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: AuthDialogMode;
  defaultZip?: string;
  defaultReferralCode?: string;
  profileKind?: ProfileKind;
  onAuthSuccess?: (response: AuthResponse) => void;
  /** When set, the panel sits under this element (right-aligned) instead of the screen center. */
  anchorRef?: RefObject<HTMLElement | null>;
};

const inputClass =
  "h-10 border-border bg-card text-foreground shadow-none placeholder:text-muted-foreground dark:bg-card";

type PanelCoords = {
  top: number;
  right: number;
  maxHeight: number;
};

function getPanelCoords(anchor: HTMLElement | null): PanelCoords {
  const margin = 12;
  const gap = 8;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const vw = window.visualViewport?.width ?? window.innerWidth;

  if (!anchor) {
    return {
      top: margin,
      right: margin,
      maxHeight: Math.max(240, vh - margin * 2),
    };
  }

  const rect = anchor.getBoundingClientRect();
  let top = rect.bottom + gap;
  let maxHeight = vh - top - margin;

  // Keep a usable panel on short mobile viewports (header + keyboard).
  if (maxHeight < 280) {
    top = margin;
    maxHeight = vh - margin * 2;
  }

  return {
    top,
    right: Math.max(margin, vw - rect.right),
    maxHeight: Math.max(240, maxHeight),
  };
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "register",
  defaultZip = "",
  profileKind = DEFAULT_PROFILE_KIND,
  defaultReferralCode = "",
  onAuthSuccess,
  anchorRef,
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthDialogMode>(defaultMode);
  const [emailOpen, setEmailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    zipCode: defaultZip,
    referralCode: defaultReferralCode,
  });

  const isRegister = mode === "register";
  const osName = profileKindToOsName(profileKind);
  const [coords, setCoords] = useState<PanelCoords | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    function update() {
      setCoords(getPanelCoords(anchorRef?.current ?? null));
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    setMode(defaultMode);
    setEmailOpen(false);
    setError("");
    setLoading(false);
    setFormData((prev) => ({
      ...prev,
      zipCode: defaultZip || prev.zipCode,
      referralCode: defaultReferralCode || prev.referralCode,
    }));
    void preloadOauthProviders();
  }, [open, defaultMode, defaultZip, defaultReferralCode]);

  function closeAndSucceed(response: AuthResponse) {
    onOpenChange(false);
    onAuthSuccess?.(response);
  }

  async function handleGoogle() {
    setError("");
    try {
      const idToken = await requestGoogleIdToken({ click: false });
      setLoading(true);
      const response = await authService.oauthGoogle({
        idToken,
        zipCode: formData.zipCode || defaultZip,
        referralCode: formData.referralCode.trim() || undefined,
        osName,
      });
      closeAndSucceed(response);
    } catch (err) {
      setError(toAuthError(err, "Google sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    setError("");
    setLoading(true);
    try {
      const apple = await requestAppleIdentityToken();
      const response = await authService.oauthApple({
        identityToken: apple.identityToken,
        firstName: apple.firstName,
        lastName: apple.lastName,
        zipCode: formData.zipCode || defaultZip,
        referralCode: formData.referralCode.trim() || undefined,
        osName,
      });
      closeAndSucceed(response);
    } catch (err) {
      setError(toAuthError(err, "Apple sign-in failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const response = await authService.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          zipCode: formData.zipCode,
          osName,
          ...(formData.referralCode.trim() && {
            referralCode: formData.referralCode.trim(),
          }),
        });
        closeAndSucceed(response);
      } else {
        const response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
        closeAndSucceed(response);
      }
    } catch (err) {
      setError(
        toAuthError(
          err,
          isRegister
            ? "Registration failed. Please try again."
            : "Login failed. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-0 right-0 left-auto flex max-h-[min(90dvh,44rem)] w-[min(100%-1.5rem,28rem)] translate-x-0 translate-y-0 flex-col overflow-hidden border-border bg-card p-6 text-foreground shadow-xl origin-top-right sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        style={
          coords
            ? {
                top: coords.top,
                right: coords.right,
                maxHeight: coords.maxHeight,
                transform: "none",
              }
            : {
                top: 64,
                right: 12,
                maxHeight: "min(90dvh, 44rem)",
                transform: "none",
              }
        }
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-3 right-3 z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </Button>
        </DialogClose>
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-1 [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-col gap-5 pb-4">
          <AuthIntroVideo />

          <DialogHeader className="gap-1.5 text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {isRegister
                ? `Create ${profileKindDisplayShort(profileKind)} Account`
                : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isRegister
                ? "Join your local City OS to connect and save."
                : "Sign in to continue."}
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <AuthSocialButtons
            loading={loading}
            onGoogle={handleGoogle}
            onApple={APPLE_SIGN_IN_ENABLED ? handleApple : undefined}
            showApple={APPLE_SIGN_IN_ENABLED}
          />

          <Button
            type="button"
            variant="ghost"
            onClick={() => setEmailOpen((openEmail) => !openEmail)}
            className="w-full"
            aria-expanded={emailOpen}
          >
            Or continue with email
            <ChevronDown
              className={`h-4 w-4 transition ${emailOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </Button>

          {emailOpen ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-first-name" className="text-foreground">
                      First Name
                    </Label>
                    <Input
                      id="auth-first-name"
                      required
                      autoComplete="given-name"
                      className={inputClass}
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-last-name" className="text-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="auth-last-name"
                      required
                      autoComplete="family-name"
                      className={inputClass}
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password" className="text-foreground">
                    Password
                  </Label>
                  {!isRegister ? (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:text-primary"
                    >
                      Forgot password?
                    </Link>
                  ) : null}
                </div>
                <Input
                  id="auth-password"
                  type="password"
                  required
                  minLength={isRegister ? 8 : undefined}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  className={inputClass}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              {isRegister ? (
                <>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="auth-zip"
                      className="flex items-center gap-1.5 text-foreground"
                    >
                      <MapPin className="h-3 w-3 text-primary" aria-hidden />
                      Zip Code
                    </Label>
                    <Input
                      id="auth-zip"
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="e.g. 38103"
                      className={inputClass}
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      We use this to connect you to your local Market.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-referral" className="text-xs text-muted-foreground">
                      Referral Code (Optional)
                    </Label>
                    <Input
                      id="auth-referral"
                      placeholder="Enter referral code"
                      className={inputClass}
                      value={formData.referralCode}
                      onChange={(e) =>
                        setFormData({ ...formData, referralCode: e.target.value })
                      }
                    />
                  </div>
                </>
              ) : null}

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : isRegister ? (
                  "Get Started"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          ) : null}

          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 font-semibold"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setEmailOpen(true);
                  }}
                >
                  Sign in
                </Button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto px-0 font-semibold"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Create account
                </Button>
              </>
            )}
          </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AUTH_INTRO_YOUTUBE_ID = "jFQ4KhofniQ";

function AuthIntroVideo() {
  const src = `https://www.youtube.com/embed/${AUTH_INTRO_YOUTUBE_ID}?rel=0&modestbranding=1`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none bg-card">
      <iframe
        src={src}
        title="JustMy intro video"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function toAuthError(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
