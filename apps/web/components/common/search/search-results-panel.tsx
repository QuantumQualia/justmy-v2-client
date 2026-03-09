"use client";

import * as React from "react";
import { ChevronDown, Loader2, AlertCircle, CheckCircle2, Crown } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { useSearchStore, type SearchResultItem } from "@/lib/store";

/** Get 1–2 letter initials from a title (e.g. "Joe's Pizza" → "JP") */
function getInitials(title: string): string {
  const t = title.trim();
  if (!t) return "?";
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const a = words[0]?.replace(/[^a-zA-Z]/g, "").slice(0, 1);
    const b = words[1]?.replace(/[^a-zA-Z]/g, "").slice(0, 1);
    return ((a ?? "") + (b ?? "")).toUpperCase() || (t.slice(0, 2) ?? "").toUpperCase();
  }
  return (t.slice(0, 2) ?? "").toUpperCase();
}

/**
 * Single business result card with avatar (photo or initials).
 * Used by business-specific result panels.
 */
function BusinessResultCard({
  item,
  index,
}: {
  item: SearchResultItem;
  index: number;
}) {
  const title = item.title ?? String(item.id ?? `Result ${index + 1}`);
  const href =
    typeof item.url === "string" && item.url.length > 0 ? item.url : undefined;
  const photoUrl =
    typeof item.photo === "string" && item.photo.length > 0 ? item.photo : null;

  const avatar = (
    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-slate-200 text-sm font-medium">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(title)
      )}
    </div>
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
            <span>{title}</span>
            <span className="flex items-center gap-1">
              {item.isVerified && (
                <CheckCircle2
                  className="h-3.5 w-3.5 text-emerald-400"
                  aria-label="Verified business"
                />
              )}
              {item.osName && item.osName.toLowerCase() === "founder" && (
                <Crown
                  className="h-3.5 w-3.5 text-amber-300"
                  aria-label="VIP Founder"
                />
              )}
            </span>
          </div>
        </div>
        {item.rating != null && (
          <span className="text-xs text-amber-400">
            ★ {Number(item.rating).toFixed(1)}
          </span>
        )}
      </div>
      {item.subtitle && (
        <div className="text-xs text-emerald-300/80 mt-0.5">{item.subtitle}</div>
      )}
      {item.snippet && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.snippet}</p>
      )}
    </>
  );

  const className =
    "rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 p-3 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-colors flex gap-3 items-start";

  if (href) {
    return (
      <a
        key={item.id ?? index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {avatar}
        <div className="min-w-0 flex-1">{content}</div>
      </a>
    );
  }
  return (
    <div key={item.id ?? index} className={className}>
      {avatar}
      <div className="min-w-0 flex-1">{content}</div>
    </div>
  );
}

/**
 * Standard Search Results Panel
 *
 * Collapsible panel that listens to the global search store.
 * Always renders the unified standard search results list (hybrid search).
 * Used internally by the top-level SearchResultsPanel orchestrator.
 */
function StandardSearchResultsPanel() {
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
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-slate-800 bg-black/70 backdrop-blur-2xl py-3 rounded-br-none">
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
                className="h-8 w-8 rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900 hover:text-emerald-300 transition-colors"
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
                          className="rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 p-3 hover:border-emerald-500/60 hover:bg-slate-900/90 transition-colors block"
                        >
                          {content}
                        </a>
                      ) : (
                        <div
                          key={item.id ?? index}
                          className="rounded-lg rounded-br-none border border-slate-800 bg-slate-900/60 p-3"
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

/**
 * Business Internal Results Panel
 *
 * For business search: shows the first N results as JustMy Partners.
 * Only renders when businessSearchTotalLocal is set and there are internal results.
 */
export function BusinessInternalResultsPanel() {
  const results = useSearchStore((state) => state.results);
  const isLoading = useSearchStore((state) => state.isLoading);
  const error = useSearchStore((state) => state.error);
  const lastQuery = useSearchStore((state) => state.lastQuery);
  const totalLocal = useSearchStore((state) => state.businessSearchTotalLocal);

  const internalCount = typeof totalLocal === "number" ? Math.max(totalLocal, 0) : 0;
  const internalResults =
    internalCount > 0 ? results.filter(item => item.source === "local") : [];

  const hasResults = internalResults.length > 0;
  const shouldShow = (isLoading || !!error || hasResults) && totalLocal !== null;

  const [isOpen, setIsOpen] = React.useState(true);

  React.useEffect(() => {
    if (shouldShow) {
      setIsOpen(true);
    }
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-slate-800 bg-black/70 backdrop-blur-2xl py-3 rounded-br-none">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                JustMy Partners
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
                <span>
                  {lastQuery
                    ? `Partner results for “${lastQuery}”`
                    : "Discover JustMy Partner businesses."}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900 hover:text-emerald-300 transition-colors"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Collapse partner results" : "Expand partner results"}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </Button>
            </div>
          </div>

          {isOpen && (
            <div className="border-t border-slate-800 pt-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  Searching partners…
                </div>
              )}

              {!isLoading && error && (
                <div className="flex items-start gap-2 rounded-md border border-red-800 bg-red-900/30 p-3 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isLoading && !error && hasResults && (
                <div className="flex flex-col gap-2">
                  {internalResults.map((item, index) => (
                    <BusinessResultCard
                      key={item.id ?? index}
                      item={item}
                      index={index}
                    />
                  ))}
                </div>
              )}

              {!isLoading && !error && !hasResults && (
                <div className="text-xs text-slate-500">
                  No partner results yet. Try a different search query.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Business External Results Panel
 *
 * For business search: shows the remaining results as Local Results.
 * Only renders when businessSearchTotalLocal is set and there are external results.
 */
export function BusinessExternalResultsPanel() {
  const results = useSearchStore((state) => state.results);
  const isLoading = useSearchStore((state) => state.isLoading);
  const error = useSearchStore((state) => state.error);
  const lastQuery = useSearchStore((state) => state.lastQuery);
  const totalLocal = useSearchStore((state) => state.businessSearchTotalLocal);

  const internalCount = typeof totalLocal === "number" ? Math.max(totalLocal, 0) : 0;
  const externalResults =
    internalCount > 0 ? results.slice(internalCount) : results;

  const hasResults = externalResults.length > 0;
  const shouldShow = (isLoading || !!error || hasResults) && totalLocal !== null;

  const [isOpen, setIsOpen] = React.useState(true);

  React.useEffect(() => {
    if (shouldShow) {
      setIsOpen(true);
    }
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-slate-800 bg-black/70 backdrop-blur-2xl py-3 rounded-br-none">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Local Results
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
                <span>
                  {lastQuery
                    ? `Local results for “${lastQuery}”`
                    : "Explore additional local business results."}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-200 hover:border-emerald-500/70 hover:bg-slate-900 hover:text-emerald-300 transition-colors"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "Collapse local results" : "Expand local results"}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </Button>
            </div>
          </div>

          {isOpen && (
            <div className="border-t border-slate-800 pt-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  Searching local results…
                </div>
              )}

              {!isLoading && error && (
                <div className="flex items-start gap-2 rounded-md border border-red-800 bg-red-900/30 p-3 text-xs text-red-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isLoading && !error && hasResults && (
                <div className="flex flex-col gap-2">
                  {externalResults.map((item, index) => (
                    <BusinessResultCard
                      key={item.id ?? index}
                      item={item}
                      index={internalCount + index}
                    />
                  ))}
                </div>
              )}

              {!isLoading && !error && !hasResults && (
                <div className="text-xs text-slate-500">
                  No local results yet. Try a different search query.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Top-level Search Results Panel
 *
 * Decides which panel(s) to render based on search mode.
 * - Standard search: single StandardSearchResultsPanel
 * - Business search: BusinessInternalResultsPanel + BusinessExternalResultsPanel
 */
export function SearchResultsPanel() {
  const isBusinessSearchMode = useSearchStore(
    (state) => state.isBusinessSearchMode
  );
  const hasBusinessSplit = useSearchStore(
    (state) => state.businessSearchTotalLocal !== null
  );

  if (isBusinessSearchMode && hasBusinessSplit) {
    return (
      <>
        <BusinessInternalResultsPanel />
        <BusinessExternalResultsPanel />
      </>
    );
  }

  return <StandardSearchResultsPanel />;
}


