"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { LockKeyhole, ArrowLeft } from "lucide-react";
import { authService, ApiClientError } from "@/lib/services/auth";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authService.confirmPasswordReset({ token, password });
      router.push("/login?reset=success");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to reset password. The link may have expired.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
          <p className="text-muted-foreground text-sm">
            This password reset link is invalid or has expired.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Link href="/forgot-password">
            <Button className="cursor-pointer w-full h-12">
              Request New Link
            </Button>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
          <LockKeyhole className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <p className="text-muted-foreground text-sm">Enter your new password below.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/40 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Must be at least {MIN_PASSWORD_LENGTH} characters.</p>
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="cursor-pointer w-full mt-4 h-12 text-lg"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
