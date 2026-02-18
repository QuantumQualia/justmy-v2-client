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
import { SuperSearchBar } from "@/components/search/super-search-bar";
import { SearchResultsPanel } from "@/components/search/search-results-panel";
import { WelcomeMessage } from "@/components/welcome/welcome-message";

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
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans relative">
      <SuperSearchBar />
      <div className="pt-20">
        <WelcomeMessage />
        <SearchResultsPanel />
      </div>
    </div>
  );
}

