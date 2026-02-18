"use client";

import * as React from "react";
import { WelcomeMessage } from "@/components/welcome/welcome-message";
import { DayInHistory } from "@/components/welcome/day-in-history";

interface GreetingCardProps {
  weatherPageLink?: string;
}

/**
 * Greeting Card
 *
 * Groups the daily briefing: welcome message + "This Day in History".
 * Single card with purple glow; Day in History is a minimalist text block nested inside.
 */
export function GreetingCard({ weatherPageLink = "/weather" }: GreetingCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-6">
      <div className="rounded-2xl rounded-br-none border border-purple-500/30 bg-black/60 backdrop-blur-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(168,85,247,0.4)] relative overflow-hidden">
        {/* Liquid purple glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <WelcomeMessage weatherPageLink={weatherPageLink} embedded />
          <DayInHistory embedded />
        </div>
      </div>
    </div>
  );
}
