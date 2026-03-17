"use client";

import React from "react";
import {
  Type,
  Layout,
  Search,
  Edit,
  Eye,
  Image,
  QrCode,
  Zap,
  PanelTop,
  Sun,
  CloudRain,
  CloudSun,
  Newspaper,
  CalendarRange,
  Tag,
  Box,
  Menu,
  UserPlus,
  AppWindow,
} from "lucide-react";

export interface BlockTypeConfig {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  category?: string;
}

// Full set of CMS page blocks
export const PAGE_BLOCK_TYPES: BlockTypeConfig[] = [
  {
    value: "text-block",
    label: "Text",
    icon: <Type className="h-5 w-5" />,
    description: "Rich text content with formatting options",
    category: "Content",
  },
  {
    value: "layout-block",
    label: "Layout",
    icon: <Layout className="h-5 w-5" />,
    description: "Grid layout container for organizing blocks",
    category: "Layout",
  },
  {
    value: "inline-edit-view-block",
    label: "Inline Edit View",
    icon: <Edit className="h-5 w-5" />,
    description: "Profile inline edit view component",
    category: "Profile",
  },
  {
    value: "live-view-block",
    label: "Live View",
    icon: <Eye className="h-5 w-5" />,
    description: "Profile live view card component",
    category: "Profile",
  },
  {
    value: "media-card-block",
    label: "Media Card",
    icon: <Image className="h-5 w-5" />,
    description: "Profile media card with QR code",
    category: "Profile",
  },
  {
    value: "qr-code-block",
    label: "QR Code",
    icon: <QrCode className="h-5 w-5" />,
    description: "QR code component for profile sharing",
    category: "Profile",
  },
  {
    value: "welcome-message-block",
    label: "Welcome Message",
    icon: <Type className="h-5 w-5" />,
    description: "AI-powered personalized greeting card",
    category: "AI Content",
  },
  {
    value: "day-in-history-block",
    label: "Day in History",
    icon: <Type className="h-5 w-5" />,
    description: "AI-generated historical insight for today",
    category: "AI Content",
  },
  {
    value: "quick-action-block",
    label: "Quick Action",
    icon: <Zap className="h-5 w-5" />,
    description: "Single quick action link (panel or button style)",
    category: "Actions",
  },
  {
    value: "ad-banner-block",
    label: "Ad Banner",
    icon: <Image className="h-5 w-5" />,
    description: "Image banner with profile slug and hotlinks",
    category: "Media",
  },
  {
    value: "image-block",
    label: "Image",
    icon: <Image className="h-5 w-5" />,
    description: "Simple image block with optional caption",
    category: "Media",
  },
  {
    value: "weather-hero-block",
    label: "Weather Hero",
    icon: <Sun className="h-5 w-5" />,
    description: "Strategic Weather hero with vibe check and today details",
    category: "Weather",
  },
  {
    value: "hourly-scroll-block",
    label: "Hourly Scroll",
    icon: <CloudRain className="h-5 w-5" />,
    description: "Hourly Tactical Scroll with rain walls and commute markers",
    category: "Weather",
  },
  {
    value: "lifestyle-indices-block",
    label: "Lifestyle Indices",
    icon: <CloudSun className="h-5 w-5" />,
    description: "Health, Outdoors, and Activity go / no-go gauges",
    category: "Weather",
  },
  {
    value: "seven-day-strategy-block",
    label: "7-Day Strategy",
    icon: <Layout className="h-5 w-5" />,
    description: "Work week vs weekend at a glance with weekend lookahead",
    category: "Weather",
  },
  {
    value: "radar-panel-block",
    label: "Radar Panel",
    icon: <Eye className="h-5 w-5" />,
    description: "Radar – Visual Truth precipitation map panel",
    category: "Weather",
  },
  {
    value: "top-news-briefing-block",
    label: "Top News Briefing",
    icon: <Newspaper className="h-5 w-5" />,
    description: "Daily Drop briefing: top local stories for your market",
    category: "Daily Drop",
  },
  {
    value: "market-events-block",
    label: "Market Events",
    icon: <CalendarRange className="h-5 w-5" />,
    description: "Daily Drop events carousel (The Stage)",
    category: "Daily Drop",
  },
  {
    value: "local-deals-block",
    label: "Local Deals",
    icon: <Tag className="h-5 w-5" />,
    description: "Daily Drop local deals grid (The Hook)",
    category: "Daily Drop",
  },
  {
    value: "placeholder-panel-block",
    label: "Placeholder Panel",
    icon: <Box className="h-5 w-5" />,
    description: "Dashed placeholder with custom text (default: Coming Soon)",
    category: "Utility",
  },
  {
    value: "super-search-bar-block",
    label: "Super Search Bar",
    icon: <Search className="h-5 w-5" />,
    description: "Floating search bar with voice search; drives global search",
    category: "Components",
  },
  {
    value: "search-results-panel-block",
    label: "Search Results Panel",
    icon: <PanelTop className="h-5 w-5" />,
    description: "Collapsible panel showing search results from Super Search",
    category: "Components",
  },
  {
    value: "navbar-block",
    label: "Navbar",
    icon: <Menu className="h-5 w-5" />,
    description: "Sticky navbar with profile switcher, search bar, and hamburger menu",
    category: "Navigation",
  },
  {
    value: "refer-a-friend-block",
    label: "Refer a Friend",
    icon: <UserPlus className="h-5 w-5" />,
    description: "Referral code, share link, and table of referred profiles",
    category: "Growth",
  },
  {
    value: "app-hub-block",
    label: "App Hub",
    icon: <AppWindow className="h-5 w-5" />,
    description: "Active apps dock and discovery library for the user's Personal OS",
    category: "Apps",
  },
];

// Subset tailored for blog posts – content-first, layout + simple utilities.
export const POST_BLOCK_TYPES: BlockTypeConfig[] = PAGE_BLOCK_TYPES.filter((block) =>
  [
    "text-block",
    "image-block",
  ].includes(block.value)
);

