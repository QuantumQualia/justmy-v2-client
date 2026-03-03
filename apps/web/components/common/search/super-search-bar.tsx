"use client";

import * as React from "react";
import { Search, Mic, Loader2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { useSearchStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

/**
 * Super Search Bar
 *
 * Floating glass search bar with neon cursor + mic icon.
 * Sits at the top of the feed and drives the global search store.
 */
export function SuperSearchBar() {
  const [localQuery, setLocalQuery] = React.useState("");

  const isLoading = useSearchStore((state) => state.isLoading);
  const runSearch = useSearchStore((state) => state.runSearch);
  const setQuery = useSearchStore((state) => state.setQuery);

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
     }
   }, [transcript]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = localQuery.trim();
    // Immediately reflect in global store
    setQuery(value);
    await runSearch(value);
  };

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
    <div className="w-full max-w-2xl mx-auto">
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
          <Input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search profiles, markets, content…"
            className="h-7 md:h-9 border-0 bg-transparent px-0 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Right-side controls: loader + mic + submit */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {isLoading && (
            <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-emerald-400" aria-hidden="true" />
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            disabled={!micSupported}
            className={`h-6 w-6 md:h-8 md:w-8 rounded-full border ${
              isRecording
                ? "border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
            } ${micSupported ? "" : "opacity-40 cursor-not-allowed"}`}
            aria-label="Voice search (coming soon)"
          >
            <Mic className="h-3 w-3 md:h-4 md:w-4" />
          </Button>

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
    </div>
  );
}

