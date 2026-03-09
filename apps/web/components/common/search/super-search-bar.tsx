"use client";

import * as React from "react";
import { Search, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { useSearchStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { CategoryBento, CATEGORY_CONFIGS } from "./category-bento";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Ghost phrases for kinetic typography effect
 */
const GHOST_PHRASES = [
  "Find a local plumber...",
  "Best tacos in Memphis...",
  "Support local non-profits...",
  "Grab a deal at the bakery...",
  "Looking for Taco Tuesday deals?",
  "Need a last-minute oil change?",
  "Find a 5-star plumber in Bartlett...",
  "Discover local events this weekend...",
];

export interface SuperSearchBarProps {
  /**
   * Enable business search mode with category bento grid and ghost phrases.
   * Defaults to false (standard search mode).
   */
  businessSearchMode?: boolean;
}

/**
 * Super Search Bar
 *
 * Floating glass search bar with neon cursor + mic icon.
 * Features kinetic typography (ghost phrases) and Category Bento grid for business search.
 * Sits at the top of the feed and drives the global search store.
 */
export function SuperSearchBar({ businessSearchMode = false }: SuperSearchBarProps) {
  const [localQuery, setLocalQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [ghostPhraseIndex, setGhostPhraseIndex] = React.useState(0);
  const [showGhostPhrase, setShowGhostPhrase] = React.useState(true);
  const categoryBentoRef = React.useRef<HTMLDivElement>(null);

  const isLoading = useSearchStore((state) => state.isLoading);
  const runSearch = useSearchStore((state) => state.runSearch);
  const setQuery = useSearchStore((state) => state.setQuery);
  const setBusinessSearchMode = useSearchStore((state) => state.setBusinessSearchMode);
  const selectedCategories = useSearchStore((state) => state.selectedCategories);

  // Helper to get category label from ID
  const getCategoryLabel = (categoryId: typeof selectedCategories[0]): string => {
    const config = CATEGORY_CONFIGS.find((c) => c.id === categoryId);
    return config?.label || categoryId;
  };

  // Helper to count categories in the input text
  const countCategoriesInInput = (text: string): number => {
    if (!text.trim()) return 0;
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    // Check if parts match category labels
    return parts.filter((part) =>
      CATEGORY_CONFIGS.some((c) => c.label === part)
    ).length;
  };

  // Handle applying selected categories to search input and run search
  const handleApplyCategories = async () => {
    const state = useSearchStore.getState();
    if (state.selectedCategories.length === 0) {
      return;
    }

    // Close the CategoryBento popup
    setIsFocused(false);

    // Convert selected category IDs to labels and join with commas
    const categoryLabels = state.selectedCategories
      .map((categoryId) => getCategoryLabel(categoryId))
      .join(", ");

    // Update input and global store, then run search
    setLocalQuery(categoryLabels);
    setShowGhostPhrase(false);
    setQuery(categoryLabels);
    await runSearch(categoryLabels);
  };

  // Sync prop with store
  React.useEffect(() => {
    setBusinessSearchMode(businessSearchMode);
  }, [businessSearchMode, setBusinessSearchMode]);

  // Shared speech recognition hook (browser mic → text)
  const {
    isSupported: micSupported,
    isRecording,
    transcript,
    error: micError,
    start: startMic,
    stop: stopMic,
    reset: resetMic,
  } = useSpeechRecognition({ lang: "en-US", append: false });

  // Keep search input in sync with live transcript
  React.useEffect(() => {
    if (transcript) {
      setLocalQuery(transcript);
      setShowGhostPhrase(false);
    }
  }, [transcript]);

  // Ghost phrase rotation animation
  React.useEffect(() => {
    if (!isFocused && localQuery === "" && businessSearchMode) {
      setShowGhostPhrase(true);
      const interval = setInterval(() => {
        setGhostPhraseIndex((prev) => (prev + 1) % GHOST_PHRASES.length);
      }, 3000); // Rotate every 3 seconds
      return () => clearInterval(interval);
    } else {
      setShowGhostPhrase(false);
    }
  }, [isFocused, localQuery, businessSearchMode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = localQuery.trim();
    // Immediately reflect in global store
    setQuery(value);
    await runSearch(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowGhostPhrase(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if the blur is happening because we're clicking inside the CategoryBento
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (
      relatedTarget &&
      categoryBentoRef.current &&
      categoryBentoRef.current.contains(relatedTarget)
    ) {
      // Don't hide the CategoryBento if clicking inside it
      return;
    }

    // Use setTimeout to allow click events to fire before hiding
    setTimeout(() => {
      // Double-check that we're not clicking inside the CategoryBento
      if (
        document.activeElement &&
        categoryBentoRef.current &&
        categoryBentoRef.current.contains(document.activeElement)
      ) {
        return;
      }
      setIsFocused(false);
      if (localQuery === "" && businessSearchMode) {
        setShowGhostPhrase(true);
      }
    }, 150);
  };

  const currentGhostPhrase = GHOST_PHRASES[ghostPhraseIndex];

  const handleMicClick = () => {
    if (!micSupported) {
      // Fallback: no-op or toast – for now we just reset any prior transcript
      resetMic();
      return;
    }

    if (isRecording) {
      stopMic();
    } else {
      resetMic();
      startMic();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 md:gap-3 rounded-full border border-emerald-500/30 bg-slate-900/60 px-2 md:px-4 py-1.5 md:py-2 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-2xl"
      >
        {/* Leading icon */}
        <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 flex-shrink-0">
          <Search className="h-3 w-3 md:h-4 md:w-4" />
        </div>

        {/* Input + neon cursor */}
        <div className="relative flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1 min-w-[120px]">
            <Input
              type="text"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setShowGhostPhrase(false);
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={
                businessSearchMode && showGhostPhrase
                  ? currentGhostPhrase
                  : businessSearchMode
                    ? "Search businesses, services, deals..."
                    : "Search profiles, markets, content…"
              }
              className={cn(
                "h-7 md:h-9 border-0 bg-transparent px-0 text-xs md:text-sm text-slate-100",
                "placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0",
                businessSearchMode && showGhostPhrase && "placeholder:text-slate-400/60"
              )}
            />
            {/* Ghost phrase overlay animation */}
            {businessSearchMode && showGhostPhrase && localQuery === "" && (
              <div
                className="absolute inset-0 flex items-center pointer-events-none overflow-hidden"
                key={ghostPhraseIndex}
              >
                <span className="text-xs md:text-sm text-slate-400/60 animate-in fade-in duration-500 whitespace-nowrap truncate">
                  {currentGhostPhrase}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right-side controls: loader + mic + submit */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {isLoading && (
            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-emerald-400" aria-hidden="true" />
          )}

          {!businessSearchMode && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleMicClick}
              disabled={!micSupported}
              className={`h-6 w-6 md:h-8 md:w-8 rounded-full border ${isRecording
                  ? "border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                } ${micSupported ? "" : "opacity-40 cursor-not-allowed"}`}
              aria-label="Voice search (coming soon)"
            >
              <Mic className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="h-6 md:h-8 rounded-full bg-emerald-500 px-2 md:px-4 text-[10px] md:text-xs font-semibold text-black hover:bg-emerald-400"
            disabled={isLoading}
          >
            {isLoading ? "Searching…" : "Search"}
          </Button>
        </div>

        {/* Optional mic error helper text */}
        {micError && (
          <span className="absolute -bottom-5 left-4 text-[10px] text-red-400">
            {micError}
          </span>
        )}
      </form>

      {/* Category Bento Grid - shows when focused in business search mode */}
      {businessSearchMode && isFocused && (
        <div
          ref={categoryBentoRef}
          className="absolute top-0 left-0 right-0 z-10 animate-in slide-in-from-top-2 fade-in duration-200"
          onMouseDown={(e) => {
            // Prevent input from losing focus when clicking on CategoryBento
            e.preventDefault();
          }}
        >
          <CategoryBento onApply={handleApplyCategories} />
        </div>
      )}
    </div>
  );
}

