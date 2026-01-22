"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { MapPin, Briefcase, User } from "lucide-react";
import { authService, ApiClientError } from "@/lib/services/auth";

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 1. Detect Intent: Did they click "Personal" or "Business"?
  const typeParam = searchParams.get("type") || "personal"; // default to personal
  const isBusiness = typeParam === "business";
  
  // 2. Get referral code from URL (supports both ?ref= and ?referral=)
  const referralCodeFromUrl = searchParams.get("ref") || searchParams.get("referral") || "";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    zipCode: "",
    businessName: "", // Only used if isBusiness is true
    referralCode: referralCodeFromUrl, // Auto-populate from URL
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 2. Send to API
      await authService.register({
        ...formData,
        tier: isBusiness ? "BUSINESS" : "PERSONAL",
        // Only include referralCode if it's not empty
        ...(formData.referralCode && { referralCode: formData.referralCode.trim() }),
      });

      // 3. Success -> Send to the Dashboard Lobby
      router.push("/dashboard?welcome=true");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
          {isBusiness ? <Briefcase className="h-6 w-6 text-white" /> : <User className="h-6 w-6 text-white" />}
        </div>
        <CardTitle className="text-2xl font-bold">
          Create {isBusiness ? "Business" : "Personal"} Account
        </CardTitle>
        <p className="text-slate-400 text-sm">
          {isBusiness 
            ? "Claim your node and start managing your presence." 
            : "Join your local City OS to connect and save."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {/* USER INFO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                required 
                className="bg-black/50 border-slate-700"
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                required 
                className="bg-black/50 border-slate-700"
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input 
              type="email" 
              required 
              className="bg-black/50 border-slate-700"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input 
              type="password" 
              required 
              className="bg-black/50 border-slate-700"
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
              className="bg-black/50 border-slate-700"
              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
            />
            <p className="text-[10px] text-slate-500">We use this to connect you to your local Market.</p>
          </div>

          {/* CONDITIONAL: BUSINESS NAME */}
          {isBusiness && (
            <div className="pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2 space-y-2">
              <Label className="text-emerald-400 font-bold">Business Name</Label>
              <Input 
                required 
                placeholder="e.g. Joe's Pizza"
                className="bg-black/50 border-emerald-500/50 focus:border-emerald-500"
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
              />
            </div>
          )}

          {/* REFERRAL CODE (Optional) */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Referral Code (Optional)</Label>
            <Input 
              placeholder="Enter referral code"
              value={formData.referralCode}
              className="bg-black/50 border-slate-700"
              onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
            />
            {referralCodeFromUrl && (
              <p className="text-[10px] text-emerald-400">Referral code detected from link</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 font-bold mt-4 h-12 text-lg" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Get Started"}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}

