"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { finishAuthRedirect } from "@/lib/auth/finish-auth-redirect";
import { useOauthSignIn } from "@/lib/auth/use-oauth-sign-in";
import { authService, ApiClientError } from "@/lib/services/auth";
import { tokenStorage } from "@/lib/storage/token-storage";
import { resolveAppHomePath } from "@/lib/store/app-store";
import { needsEmailVerification, verifyEmailHref } from "@/lib/auth/email-verification";
import { useNewsZipStore } from "@/lib/store/news-zip-store";
import { DEFAULT_PROFILE_KIND, isBusinessOs, profileKindToOsName } from "@/lib/os-types";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const resetSuccess = searchParams.get("reset") === "success";
  const newsZip = useNewsZipStore((s) => s.zipcode);

  const oauth = useOauthSignIn({
    zipCode: newsZip || undefined,
    osName: profileKindToOsName(DEFAULT_PROFILE_KIND),
    onSuccess: (response) => finishAuthRedirect(router, response, { fallback: redirect }),
  });

  useEffect(() => {
    async function checkAuth() {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      const user = await tokenStorage.getUser();
      
      if (accessToken || refreshToken || user) {
        const stored = user as { osName?: string; profileType?: string; emailVerified?: boolean } | null;
        let homePath = resolveAppHomePath({ fallback: redirect });
        if (isBusinessOs(stored?.osName || stored?.profileType) && (homePath === "/dashboard" || homePath.startsWith("/dashboard"))) {
          homePath = "/biz-os";
        }
        if (needsEmailVerification(stored)) {
          homePath = verifyEmailHref(homePath);
        }
        router.push(homePath);
      }
    }
    checkAuth();
  }, [redirect, router]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    oauth.setLoading(true);
    oauth.setError("");

    try {
      const response = await authService.login(formData);
      finishAuthRedirect(router, response, { fallback: redirect });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        oauth.setError(err.message || "Login failed. Please try again.");
      } else {
        oauth.setError("An error occurred. Please try again.");
      }
    } finally {
      oauth.setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
          <LogIn className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-muted-foreground text-sm">
          Sign in to access your City OS Dashboard
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {resetSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm">
            Your password has been reset. Please sign in with your new password.
          </div>
        )}
        {oauth.error ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {oauth.error}
          </div>
        ) : null}

        <AuthSocialButtons
          loading={oauth.loading}
          onGoogle={oauth.handleGoogle}
          onApple={oauth.handleApple}
          showApple={oauth.showApple}
        />

        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Or continue with email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <Button
            type="submit"
            className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-4 h-12 text-lg"
            disabled={oauth.loading}
          >
            {oauth.loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-emerald-500 hover:text-emerald-400 font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
