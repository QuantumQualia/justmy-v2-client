"use client";

import * as React from "react";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { useSearchStore } from "@/lib/store";

/**
 * Search Results Panel
 *
 * Collapsible panel that listens to the global search store.
 * Only appears when there is an active search state (loading, error, or results).
 */
export function SearchResultsPanel() {
  // Use separate selectors so Zustand/React can cache snapshots correctly
  const results = useSearchStore((state) => state.results);
  const isLoading = useSearchStore((state) => state.isLoading);
  const error = useSearchStore((state) => state.error);
  const lastQuery = useSearchStore((state) => state.lastQuery);
  const summary = useSearchStore((state) => state.summary);

  const hasResults = results.length > 0;
  const shouldShow = isLoading || !!error || hasResults;

  const [isOpen, setIsOpen] = React.useState(true);

  // Auto-open whenever new results/error/loading state appears
  React.useEffect(() => {
    if (shouldShow) {
      setIsOpen(true);
    }
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-4">
      <Card className="border-slate-800 bg-black/70 backdrop-blur-2xl py-3">
        <CardContent className="p-4 space-y-3">
          {/* Header / toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                Super Search
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
                <span>
                  {lastQuery
                    ? `Results for “${lastQuery}”`
                    : "Search across your city, profiles and content."}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Collapse search results" : "Expand search results"}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Collapsible content */}
          {isOpen && (
            <div className="border-t border-slate-800 pt-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  Searching the network…
                </div>
              )}

              {!isLoading && error && (
                <div className="flex items-start gap-2 rounded-md border border-red-800 bg-red-900/30 p-3 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isLoading && !error && hasResults && (
                <div className="space-y-3">
                  {summary && (
                    <p className="text-xs leading-relaxed text-slate-200">
                      {summary}
                    </p>
                  )}
                  <div className="flex flex-col gap-2">
                    {results.map((item, index) => {
                      const title = item.title ?? String(item.id ?? `Result ${index + 1}`);
                      const subtitle =
                        item.subtitle ??
                        item.type ??
                        (item.snippet ? undefined : undefined);
                      const snippet =
                        item.snippet ??
                        (typeof item.description === "string" ? item.description : undefined);

                      const href =
                        typeof item.url === "string" && item.url.length > 0
                          ? item.url
                          : undefined;

                      const content = (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-100">
                                {title}
                              </div>
                              {subtitle && (
                                <div className="text-xs text-emerald-300/80">{subtitle}</div>
                              )}
                            </div>
                            {item.type && (
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                                {item.type}
                              </span>
                            )}
                          </div>
                          {snippet && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                              {snippet}
                            </p>
                          )}
                        </>
                      );

                      return href ? (
                        <a
                          key={item.id ?? index}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-colors block"
                        >
                          {content}
                        </a>
                      ) : (
                        <div
                          key={item.id ?? index}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isLoading && !error && !hasResults && (
                <div className="text-xs text-slate-500">
                  No results yet. Try a different search query.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

