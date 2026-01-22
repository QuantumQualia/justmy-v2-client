"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@workspace/ui/components/accordion";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Briefcase, User as UserIcon, MapPin, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { authService, ApiClientError, User } from "@/lib/services/auth";
import { getCurrentUser } from "@/lib/services/session";

// --- MOCK DATA (Replace with API calls) ---
const MY_PROFILES = [
  { id: 1, name: "JR Robinson", type: "Personal", role: "Owner", icon: null },
  { id: 2, name: "Joe's Fried Chicken", type: "Business", role: "Owner", icon: null },
];

const LOCAL_CONTENT = [
  { id: 1, title: "City OS Announces New Features", type: "News", date: "2026-01-20" },
  { id: 2, title: "City OS Partners with Local Businesses", type: "News", date: "2026-01-19" },
];

export default function DashboardLobby() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      try {
        // First check if we have a user in storage (optimistic)
        const cachedUser = getCurrentUser();
        if (cachedUser) {
          setUser(cachedUser);
          setLoading(false);
        }

        // Then fetch fresh data from API
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setError("");
      } catch (err) {
        if (err instanceof ApiClientError) {
          // If 401, redirect to login
          if (err.statusCode === 401) {
            router.push("/login");
            return;
          }
          setError(err.message || "Failed to load user data.");
        } else {
          setError("An error occurred. Please try again.");
          console.error("Error fetching user:", err);
        }
        // If we don't have cached user and fetch failed, redirect to login
        if (!getCurrentUser()) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Generate user initials for avatar
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0]?.toUpperCase() || "U";
    }
    return "U";
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER - Using actual user data */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">City OS Lobby</h1>
            <p className="text-slate-400 text-sm">
              Welcome back, {user.firstName || user.email?.split("@")[0] || "User"}.
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
            {getInitials()}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <Accordion type="single" collapsible defaultValue="item-1" className="space-y-4">

          {/* 1. THE LOBBY (Content Feed) */}
          <AccordionItem value="item-1" className="border border-slate-800 rounded-xl bg-slate-900/50 px-4">
            <AccordionTrigger className="hover:no-underline hover:text-emerald-400 py-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold text-lg">The Lobby: Memphis, TN</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid gap-3">
                {LOCAL_CONTENT.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-slate-800 hover:border-slate-600 cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-200">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.type} • {item.date}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                  </div>
                ))}
                <Button variant="ghost" className="cursor-pointer w-full text-slate-400 mt-2 text-xs">View All News</Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. myACCOUNT (Edit User Info) */}
          <AccordionItem value="item-2" className="border border-slate-800 rounded-xl bg-slate-900/50 px-4">
            <AccordionTrigger className="hover:no-underline hover:text-blue-400 py-6">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-lg">myACCOUNT</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">First Name</Label>
                  <Input defaultValue={user.firstName || ""} className="bg-black/50 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Last Name</Label>
                  <Input defaultValue={user.lastName || ""} className="bg-black/50 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Email</Label>
                <Input defaultValue={user.email || ""} disabled className="bg-black/20 border-slate-800 text-slate-500" />
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-slate-400">New Password</Label>
                <Input type="password" placeholder="••••••••" className="bg-black/50 border-slate-700" />
              </div>
              <Button className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 gap-2 font-bold">
                {loading ? "Saving..." : "Update My Account"}
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* 3. myPROFILES (Switcher) */}
          <AccordionItem value="item-3" className="border border-slate-800 rounded-xl bg-slate-900/50 px-4">
            <AccordionTrigger className="hover:no-underline hover:text-purple-400 py-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-purple-500" />
                <span className="font-semibold text-lg">myPROFILES</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Existing Profiles */}
                {MY_PROFILES.map((profile) => (
                  <Card key={profile.id} className="bg-black/40 border-slate-800 hover:border-purple-500 transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <span className="font-bold text-lg text-slate-400">{profile.name[0]}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{profile.name}</div>
                        <div className="text-xs text-slate-500">{profile.type}</div>
                      </div>
                      <Button size="sm" variant="ghost" className="cursor-pointer ml-auto text-purple-400">Open</Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Create New Profile Button */}
                <Link href="/dashboard/create-profile">
                  <Card className="bg-black/20 border-slate-800 border-dashed hover:bg-slate-900 hover:border-slate-600 transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex items-center justify-center gap-3 h-full min-h-[80px]">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Plus className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-slate-400">Create New Profile</span>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}

