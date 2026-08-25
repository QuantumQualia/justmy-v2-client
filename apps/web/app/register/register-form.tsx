"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { MapPin, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { finishAuthRedirect } from "@/lib/auth/finish-auth-redirect";
import { useOauthSignIn } from "@/lib/auth/use-oauth-sign-in";
import { authService, ApiClientError } from "@/lib/services/auth";
import {
  DEFAULT_PROFILE_KIND,
  isBusinessProfileKind,
  profileKindDisplayShort,
  profileKindToOsName,
  resolveProfileKindOrDefault,
  type ProfileKind,
} from "@/lib/os-types";
import { verifyEmailHref } from "@/lib/auth/email-verification";
import { useNewsZipStore } from "@/lib/store/news-zip-store";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 1. Detect Intent: Which profile type did they select?
  const profileKind: ProfileKind = resolveProfileKindOrDefault(
    searchParams.get("type"),
    DEFAULT_PROFILE_KIND
  );
  const osName = profileKindToOsName(profileKind);
  const isBusiness = isBusinessProfileKind(profileKind);
  
  // 2. Get referral code from URL (supports both ?ref= and ?referral=)
  const referralCodeFromUrl = searchParams.get("ref") || searchParams.get("referral") || "";
  const newsZip = useNewsZipStore((s) => s.zipcode);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    zipCode: newsZip || "",
    businessName: "", // Only used if isBusiness is true
    referralCode: referralCodeFromUrl, // Auto-populate from URL
  });

  const afterRegisterPath = isBusiness ? "/biz-os/onboard" : "/dashboard?welcome=true";

  const oauth = useOauthSignIn({
    zipCode: formData.zipCode || newsZip || undefined,
    referralCode: formData.referralCode,
    osName,
    onSuccess: (response) =>
      finishAuthRedirect(router, response, {
        fallback: afterRegisterPath,
        afterRegister: true,
      }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    oauth.setLoading(true);
    oauth.setError("");

    try {
      await authService.register({
        ...formData,
        osName,
        ...(formData.referralCode && { referralCode: formData.referralCode.trim() }),
      });

      router.push(verifyEmailHref(afterRegisterPath));
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        oauth.setError(err.message || "Registration failed. Please try again.");
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
          {isBusiness ? <Briefcase className="h-6 w-6 text-white" /> : <User className="h-6 w-6 text-white" />}
        </div>
        <CardTitle className="text-2xl font-bold">
          Create {profileKindDisplayShort(profileKind)} Account
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {isBusiness 
            ? "Claim your node and start managing your presence." 
            : "Join your local City OS to connect and save."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
          {/* USER INFO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                required 
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                required 
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input 
              type="email" 
              required 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input 
              type="password" 
              required 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {/* CRITICAL DATA: LOCATION */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-emerald-500" /> Zip Code
            </Label>
            <Input 
              required 
              placeholder="e.g. 38103"
              value={formData.zipCode}
              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
            />
            <p className="text-[10px] text-muted-foreground">We use this to connect you to your local Market.</p>
          </div>

          {/* CONDITIONAL: BUSINESS NAME */}
          {isBusiness && (
            <div className="pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 space-y-2">
              <Label className="text-emerald-400 font-bold">Business Name</Label>
              <Input 
                required 
                placeholder="e.g. Joe's Pizza"
                className="border-emerald-500/50 focus:border-emerald-500"
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
              />
            </div>
          )}

          {/* REFERRAL CODE (Optional) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Referral Code (Optional)</Label>
            <Input 
              placeholder="Enter referral code"
              value={formData.referralCode}
              onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
            />
            {referralCodeFromUrl && (
              <p className="text-[10px] text-emerald-400">Referral code detected from link</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-4 h-12 text-lg" 
            disabled={oauth.loading}
          >
            {oauth.loading ? "Creating Account..." : "Get Started"}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
