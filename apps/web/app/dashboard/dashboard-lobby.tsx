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
import { authService, ApiClientError, User } from "@/lib/services/auth";
import { QuickActionItem, type QuickActionItemConfig } from "@/components/common/quick-action-item";
import { BlocksRenderer } from "@/components/cms/blocks-renderer";
import { useChatbotStore } from "@/lib/store/chatbot-store";
import type { PageBlock } from "@/lib/services/cms";

const DASHBOARD_AGENT_PREVIEW_BLOCKS: PageBlock[] = [
  {
    id: "dashboard-agents-management-preview",
    blockType: "agents-management-block",
    layout: {
      type: "container",
      maxWidth: {
        mobile: "100%",
        tablet: "1100px",
        desktop: "1280px",
      },
      padding: {
        mobile: "0 16px",
        tablet: "0 24px",
        desktop: "0 24px",
      },
    },
    styles: {
      marginTop: {
        mobile: "24px",
        tablet: "32px",
        desktop: "40px",
      },
      marginBottom: {
        mobile: "32px",
        tablet: "40px",
        desktop: "48px",
      },
    },
  },
];

export default function DashboardLobby() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const { open: openChatbot } = useChatbotStore();

  const QUICK_ACTIONS: QuickActionItemConfig[] = [
    { label: "Daily Drop", icon: Droplets, variant: "panel", type: "link", href: "/lab/daily-drop" },
    { label: "myPROFILE", icon: UserIcon, variant: "panel", type: "link", href: "/mycard/edit" },
    { label: "myCITY", icon: UserIcon, variant: "panel", type: "link", href: "/mycity" },
    { label: "App Hub", icon: AppWindow, variant: "panel", type: "link", href: "/lab/app-hub" },
    { label: "Weather", icon: Sun, variant: "panel", type: "link", href: "/lab/weather" },
    { label: "Refer a Friend", icon: UserPlus, variant: "panel", type: "link", href: "/lab/refer" },
    { label: "Directory", icon: FolderSearch, variant: "panel", type: "link", href: "/directory" },
    { label: "Need Help? Ask!", icon: HelpCircle, variant: "button", type: "action", onClick: openChatbot },
  ];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4.1rem)] bg-black text-white flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-black text-white font-sans relative">
      <div className="pt-20">
        {/* <WelcomeMessage />
        <DayInHistory /> */}
        {/* <div className="w-full max-w-3xl mx-auto px-4 mb-6">
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
        </div> */}

        <BlocksRenderer
          blocks={DASHBOARD_AGENT_PREVIEW_BLOCKS}
          className="w-full bg-transparent text-white"
          emptyMessage="No dashboard blocks configured."
        />
      </div>
    </div>
  );
}

