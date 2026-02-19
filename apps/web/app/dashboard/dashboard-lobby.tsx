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
import {
  Briefcase,
  User as UserIcon,
  MapPin,
  Plus,
  ArrowRight,
  Droplets,
  Calendar,
  UserPlus,
  FolderSearch,
  HelpCircle,
  AppWindow,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { authService, ApiClientError, User } from "@/lib/services/auth";
import { getCurrentUser } from "@/lib/services/session";
import { SuperSearchBar } from "@/components/common/search/super-search-bar";
import { SearchResultsPanel } from "@/components/common/search/search-results-panel";
import { GreetingCard } from "@/components/common/welcome/greeting-card";
import { QuickActionItem, type QuickActionItemConfig } from "@/components/common/quick-action-item";
import { WelcomeMessage } from "@/components/common/welcome/welcome-message";
import { DayInHistory } from "@/components/common/welcome/day-in-history";
import { AdBanner } from "@/components/common/ad-banner";

// --- MOCK DATA (Replace with API calls) ---
const MY_PROFILES = [
  { id: 1, name: "JR Robinson", type: "Personal", role: "Owner", icon: null },
  { id: 2, name: "Joe's Fried Chicken", type: "Business", role: "Owner", icon: null },
];

const LOCAL_CONTENT = [
  { id: 1, title: "City OS Announces New Features", type: "News", date: "2026-01-20" },
  { id: 2, title: "City OS Partners with Local Businesses", type: "News", date: "2026-01-19" },
];

const QUICK_ACTIONS: QuickActionItemConfig[] = [
  { label: "Daily Drop", icon: Droplets, variant: "panel", type: "link", href: "/daily-drop" },
  { label: "myPROFILE", icon: UserIcon, variant: "panel", type: "link", href: "/profile" },
  { label: "myCITY", icon: UserIcon, variant: "panel", type: "link", href: "/mycity" },
  { label: "App Hub", icon: AppWindow, variant: "panel", type: "link", href: "/lab/app-hub" },
  { label: "Weather", icon: Sun, variant: "panel", type: "link", href: "/weather" },
  { label: "Refer a Friend", icon: UserPlus, variant: "panel", type: "action", onClick: () => { } },
  { label: "Directory", icon: FolderSearch, variant: "panel", type: "link", href: "/directory" },
  { label: "Need Help? Ask!", icon: HelpCircle, variant: "button", type: "action", onClick: () => { } },
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
      <SearchResultsPanel />

      <div className="pt-20">
        <WelcomeMessage />
        <DayInHistory />
        <div className="w-full max-w-3xl mx-auto px-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {QUICK_ACTIONS.filter((a) => a.variant === "panel").map((item, i) => (
              <QuickActionItem key={`${item.label}-${i}`} item={item} />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {QUICK_ACTIONS.filter((a) => a.variant === "button").map((item, i) => (
              <QuickActionItem key={`${item.label}-${i}`} item={item} />
            ))}
          </div>
        </div>

        <div className="w-full max-w-3xl mx-auto px-4 mb-6">
          <AdBanner
            imageSrc="/images/placeholders/banner_placement.jpg"
            imageAlt="Ad Banner"
            profileSlug="justmymemphis"
            hotlinks={[{ label: "Learn More", href: "/learn-more" }, { label: "Contact Us", href: "/contact-us" }, { label: "Follow Us", href: "/follow-us" }]}
          />
        </div>
      </div>
    </div>
  );
}

