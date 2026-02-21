"use client";

import * as React from "react";
import Link from "next/link";
import { aiService } from "@/lib/services/ai";

interface WelcomeMessageProps {
  weatherPageLink?: string;
  /** When true, only render content (no card wrapper). Used inside GreetingCard. */
  embedded?: boolean;
}

/**
 * Welcome Message Component
 *
 * Personalized greeting card with liquid purple glow effect.
 * Fetches welcome message from API on mount.
 */
export function WelcomeMessage({
  weatherPageLink = "/weather",
  embedded = false,
}: WelcomeMessageProps) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [linkLabel, setLinkLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchWelcome() {
      try {
        const data = await aiService.generateWelcome();
        setMessage(data.message);
        setLinkLabel(data.linkLabel);
      } catch (err) {
        console.error("Failed to fetch welcome message:", err);
      }
    }

    fetchWelcome();
  }, []);


  if (!message) {
    // Silently fail - don't show error state, just don't render
    return null;
  }

  // First sentence = greeting (e.g. "Good evening, Rosty."), rest = body
  const firstPeriod = message.indexOf(". ");
  const greeting = firstPeriod !== -1 ? message.slice(0, firstPeriod + 1) : message;
  const body = firstPeriod !== -1 ? message.slice(firstPeriod + 2).trim() : null;

  const content = (
    <div className="relative z-10">
      <p className="text-2xl md:text-4xl font-semibold text-white leading-tight mb-2">
        {greeting}
      </p>
      {body && (
        <p className="text-lg md:text-xl font-semibold text-white leading-relaxed mb-3">
          {body}
        </p>
      )}
      {linkLabel && (
        <Link
          href={weatherPageLink}
          className="inline-block text-sm text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-6">
      <div className="rounded-2xl rounded-br-none border border-purple-500/30 bg-black/60 backdrop-blur-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(168,85,247,0.4)] relative overflow-hidden">
        {/* Liquid purple glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        {content}
      </div>
    </div>
  );
}
