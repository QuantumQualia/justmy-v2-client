"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { authService, ApiClientError } from "@/lib/services/auth";

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Failed to change password. Please check your current password.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
        <p className="text-slate-400 text-sm">Update your account password.</p>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 bg-emerald-600/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-slate-300 text-sm">Your password has been updated successfully.</p>
            <Link href="/dashboard">
              <Button className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-12">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                required
                className="bg-black/50 border-slate-700"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="bg-black/50 border-slate-700"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />
              <p className="text-[10px] text-slate-500">Must be at least {MIN_PASSWORD_LENGTH} characters.</p>
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="bg-black/50 border-slate-700"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 font-bold mt-4 h-12 text-lg"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
