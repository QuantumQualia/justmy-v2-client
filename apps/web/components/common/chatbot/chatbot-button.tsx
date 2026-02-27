"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useChatbotStore } from "@/lib/store/chatbot-store";

interface ChatbotButtonProps {
  className?: string;
  variant?: "default" | "floating";
}

export function ChatbotButton({ className, variant = "floating" }: ChatbotButtonProps) {
  const { open, isOpen, showButton } = useChatbotStore();

  // Don't render floating button if showButton is false
  if (variant === "floating" && !showButton) {
    return null;
  }

  if (variant === "floating") {
    return (
      <Button
        onClick={open}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all z-40 ${className || ""}`}
        aria-label="Open AI Support Chatbot"
      >
        <MessageCircle className="h-6 w-6" />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={open}
      variant="outline"
      className={`border-slate-700 bg-slate-800/50 text-slate-200 hover:text-white hover:bg-slate-700/50 ${className || ""}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Need Help & Ask
    </Button>
  );
}
