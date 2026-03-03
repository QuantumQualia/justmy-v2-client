"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { AppHub } from "@/components/os/app-hub";

interface AppHubBlockProps {
  block: PageBlock;
}

/**
 * CMS block that renders the App Hub component.
 * Shows active/installed apps and the discovery library for the current profile's OS.
 */
export function AppHubBlock({ block }: AppHubBlockProps) {
  return <AppHub />;
}
