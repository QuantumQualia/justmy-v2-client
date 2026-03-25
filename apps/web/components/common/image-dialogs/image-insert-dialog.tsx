"use client";

import * as React from "react";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { proxiedImageUrl } from "@/lib/external-image-proxy";
import {
  DEFAULT_IMAGE_INSERT_SOURCES,
  type ImageInsertSourceOption,
  type ImagePickResult,
} from "./types";

/** Matches legacy `per_page` (Unsplash allows up to 30 per request). */
const UNSPLASH_PER_PAGE = 30;

type UnsplashResultRow = {
  id: string;
  urls: { thumb: string; small: string; regular: string; full: string };
  userName: string;
  userHtml: string;
  photoHtml: string;
};

/** Unsplash can repeat an id across responses; React keys must be unique. */
function dedupeUnsplashByIdPreservingOrder(
  items: UnsplashResultRow[],
): UnsplashResultRow[] {
  const seen = new Set<string>();
  const out: UnsplashResultRow[] = [];
  for (const p of items) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

function mergeUnsplashResults(
  prev: UnsplashResultRow[],
  next: UnsplashResultRow[],
  append: boolean,
): UnsplashResultRow[] {
  if (!append) {
    return dedupeUnsplashByIdPreservingOrder(next);
  }
  const seen = new Set(prev.map((p) => p.id));
  const merged = [...prev];
  for (const p of next) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    merged.push(p);
  }
  return merged;
}

export type ImageInsertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the user chooses a local file set or an Unsplash image (before crop). */
  onPick: (result: ImagePickResult) => void;
  title?: string;
  /** Override or extend sources (e.g. add Pexels later). */
  sources?: ImageInsertSourceOption[];
  /** When true, the device file input accepts multiple files (e.g. lookbook). */
  allowMultipleLocal?: boolean;
};

export function ImageInsertDialog({
  open,
  onOpenChange,
  onPick,
  title = "Insert image",
  sources = DEFAULT_IMAGE_INSERT_SOURCES,
  allowMultipleLocal = false,
}: ImageInsertDialogProps) {
  const [panel, setPanel] = React.useState<"sources" | "unsplash">("sources");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [results, setResults] = React.useState<UnsplashResultRow[]>([]);
  const [lastLoadedPage, setLastLoadedPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [pickingId, setPickingId] = React.useState<string | null>(null);
  /** Ignore Unsplash responses superseded by a newer search (typing / query change). */
  const searchRequestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (open) {
      setPanel("sources");
      setSearchInput("");
      setDebouncedQuery("");
      setResults([]);
      setLastLoadedPage(0);
      setTotalPages(0);
      setSearchError(null);
    }
  }, [open]);

  /** Browse editorial feed (GET /photos) or search (GET /search/photos). */
  const loadUnsplash = React.useCallback(
    async (opts: {
      mode: "browse" | "search";
      query: string;
      page: number;
      append: boolean;
    }) => {
      if (opts.mode === "search" && !opts.query.trim()) return;

      const requestId = ++searchRequestIdRef.current;
      setSearchLoading(true);
      setSearchError(null);
      try {
        const url =
          opts.mode === "browse"
            ? `/api/unsplash/photos?page=${String(opts.page)}&per_page=${String(UNSPLASH_PER_PAGE)}`
            : `/api/unsplash/search?q=${encodeURIComponent(opts.query.trim())}&page=${String(opts.page)}&per_page=${String(UNSPLASH_PER_PAGE)}`;

        const res = await fetch(url);
        const data = (await res.json()) as {
          results?: UnsplashResultRow[];
          totalPages?: number;
          error?: string;
        };
        if (requestId !== searchRequestIdRef.current) return;

        if (!res.ok) {
          setSearchError(data.error ?? "Unsplash request failed");
          if (!opts.append) setResults([]);
          return;
        }
        const next = data.results ?? [];
        setTotalPages(data.totalPages ?? 0);
        setLastLoadedPage(opts.page);
        setResults((prev) => mergeUnsplashResults(prev, next, opts.append));
      } catch {
        if (requestId !== searchRequestIdRef.current) return;
        setSearchError("Could not reach Unsplash");
        if (!opts.append) setResults([]);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearchLoading(false);
        }
      }
    },
    [],
  );

  const debouncedSetQuery = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value);
  }, 750);

  React.useEffect(() => {
    debouncedSetQuery(searchInput);
  }, [searchInput, debouncedSetQuery]);

  React.useEffect(() => {
    if (panel !== "unsplash") return;
    const q = debouncedQuery.trim();
    if (!q) {
      void loadUnsplash({ mode: "browse", query: "", page: 1, append: false });
      return;
    }
    void loadUnsplash({ mode: "search", query: q, page: 1, append: false });
  }, [panel, debouncedQuery, loadUnsplash]);

  const handleLocalClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";
    onPick({ kind: "files", files });
    onOpenChange(false);
  };

  const handleUnsplashSelect = async (photo: UnsplashResultRow) => {
    setPickingId(photo.id);
    try {
      try {
        await fetch("/api/unsplash/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo.id }),
        });
      } catch {
        /* non-blocking per Unsplash guidelines */
      }
      const imageSrc = proxiedImageUrl(photo.urls.full);
      onPick({ kind: "url", imageSrc });
      onOpenChange(false);
    } finally {
      setPickingId(null);
    }
  };

  const activeUnsplashSources = sources.filter((s) => s.id === "unsplash");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden border-slate-700 bg-slate-900 p-0 text-slate-100 sm:max-w-lg",
          panel === "unsplash" && "w-[calc(100vw-1rem)] sm:max-w-4xl",
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {panel === "sources" ? (
          <>
            <DialogHeader className="border-b border-slate-700 px-5 py-4 pr-12 text-left">
              <DialogTitle className="text-lg font-semibold text-white">{title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {sources.map((src) => {
                const sourceCardClass =
                  "flex w-full flex-col gap-1 cursor-pointer rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-6 text-center transition-colors hover:border-blue-500/50 hover:bg-slate-800";

                if (src.id === "local") {
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={handleLocalClick}
                      className={sourceCardClass}
                    >
                      <span className="font-semibold text-slate-100">{src.label}</span>
                      {src.description ? (
                        <span className="text-xs font-normal text-slate-500">{src.description}</span>
                      ) : null}
                    </button>
                  );
                }
                if (src.id === "unsplash") {
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => {
                        setResults([]);
                        setLastLoadedPage(0);
                        setTotalPages(0);
                        setSearchError(null);
                        setPanel("unsplash");
                      }}
                      className={sourceCardClass}
                    >
                      <span className="font-semibold text-slate-100">{src.label}</span>
                      {src.description ? (
                        <span className="text-xs font-normal text-slate-500">{src.description}</span>
                      ) : null}
                    </button>
                  );
                }
                return (
                  <div
                    key={src.id}
                    className="flex flex-col gap-1 rounded-xl border border-dashed border-slate-600 bg-slate-900/30 px-4 py-6 text-center"
                    title="Implement this source in ImageInsertDialog (local / unsplash are built in)."
                  >
                    <span className="font-medium text-slate-500">{src.label}</span>
                    <span className="text-xs text-slate-600">Not connected</span>
                  </div>
                );
              })}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple={allowMultipleLocal}
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        ) : (
          <div className="flex max-h-[min(88vh,640px)] min-h-[420px] flex-col sm:flex-row">
            <aside className="flex shrink-0 flex-row gap-2 border-b border-slate-700 p-3 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-slate-400 hover:bg-slate-800 hover:text-white sm:w-full"
                onClick={() => setPanel("sources")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              {activeUnsplashSources.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  size="sm"
                  className="hidden border border-blue-500/40 bg-blue-600/90 text-white hover:bg-blue-600 sm:flex sm:w-full"
                >
                  {s.label}
                </Button>
              ))}
            </aside>
            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h2 className="mb-3 text-base font-semibold text-white">Image library</h2>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search Unsplash…"
                  className="border-slate-600 bg-black/40 pl-9 pr-9 text-white placeholder:text-slate-500"
                />
                {searchInput ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {!debouncedQuery.trim() ? (
                  <p className="mb-3 text-center text-xs text-slate-500">
                    Browsing Unsplash editorial feed. Search to filter.
                  </p>
                ) : null}
                {searchError ? (
                  <p className="py-12 text-center text-sm text-rose-400">{searchError}</p>
                ) : searchLoading && results.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : results.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-500">
                    {debouncedQuery.trim()
                      ? "No images match your search."
                      : "No photos returned."}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {results.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          disabled={pickingId !== null}
                          onClick={() => void handleUnsplashSelect(photo)}
                          className="group relative aspect-square overflow-hidden cursor-pointer rounded-lg border border-slate-700 bg-slate-800 outline-none ring-blue-500 focus-visible:ring-2 disabled:opacity-50"
                          title={photo.userName ? `Photo: ${photo.userName}` : undefined}
                        >
                          <img
                            src={photo.urls.small}
                            alt={photo.userName ? `Photo by ${photo.userName}` : "Unsplash photo"}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          {pickingId === photo.id ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                    {lastLoadedPage < totalPages ? (
                      <div className="mt-4 flex justify-center pb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={searchLoading}
                          className="border-slate-600 bg-slate-800 text-slate-200"
                          onClick={() => {
                            const q = debouncedQuery.trim();
                            if (!q) {
                              void loadUnsplash({
                                mode: "browse",
                                query: "",
                                page: lastLoadedPage + 1,
                                append: true,
                              });
                            } else {
                              void loadUnsplash({
                                mode: "search",
                                query: q,
                                page: lastLoadedPage + 1,
                                append: true,
                              });
                            }
                          }}
                        >
                          {searchLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Load more"
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <p className="mt-2 border-t border-slate-800 pt-2 text-[10px] leading-relaxed text-slate-500">
                Photos provided by{" "}
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 underline"
                >
                  Unsplash
                </a>
                . Use per{" "}
                <a
                  href="https://unsplash.com/license"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 underline"
                >
                  Unsplash License
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
