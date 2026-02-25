"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { authService, ApiClientError } from "@/lib/services/auth";
import { tokenStorage } from "@/lib/storage/token-storage";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    async function checkAuth() {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      const user = await tokenStorage.getUser();
      
      if (accessToken || refreshToken || user) {
        router.push(redirect);
      }
    }
    checkAuth();
  }, [redirect, router]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(formData);
      // Success -> Redirect to default app homepage if available, otherwise use redirect URL
      if (response.welcomeApp?.homePath) {
        router.push(response.welcomeApp.homePath);
      } else {
        router.push(redirect);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Login failed. Please try again.");
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
          <LogIn className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-slate-400 text-sm">
          Sign in to access your City OS Dashboard
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              required
              className="bg-black/50 border-slate-700"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              required
              className="bg-black/50 border-slate-700"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <Button
            type="submit"
            className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 font-bold mt-4 h-12 text-lg"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-slate-400 pt-4 border-t border-slate-800">
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

