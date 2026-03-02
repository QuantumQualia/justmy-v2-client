"use client";

import React from "react";
import type { PageBlock } from "@/lib/services/cms";
import { WelcomeMessage } from "@/components/common/welcome/welcome-message";

interface WelcomeMessageBlockProps {
  block: PageBlock;
}

export function WelcomeMessageBlock({ block }: WelcomeMessageBlockProps) {
  const weatherPageLink = block.weatherPageLink || "/weather";

  return <WelcomeMessage weatherPageLink={weatherPageLink} />;
}

