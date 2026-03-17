import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link2, ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

interface LookBookBlockProps {
  items: LookBookItem[];
  title?: string;
  description?: string;
}

type LookBookItem = {
  id?: string;
  image: string | { url?: string };
  title?: string;
  description?: string;
  linkUrl?: string;
};

function resolveImageSrc(image: string | { url?: string } | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") {
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return null;
  }
  if ("url" in image) {
    return image.url ?? null;
  }
  return null;
}

export function LookBookBlock({ items, title, description }: LookBookBlockProps) {
  const filteredItems = useMemo(
    () =>
      items
        .map((item) => {
          const src = resolveImageSrc(item.image);
          if (!src) return null;
          return { ...item, src };
        })
        .filter(Boolean) as (LookBookItem & { src: string })[],
    [items],
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [colCount, setColCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setColCount(entry.contentRect.width >= 640 ? 3 : 2);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columns = useMemo(() => {
    const cols: (typeof filteredItems)[] = Array.from({ length: colCount }, () => []);
    filteredItems.forEach((item, i) => {
      cols[i % colCount]!.push(item);
    });
    return cols;
  }, [filteredItems, colCount]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? 0 : (prev - 1 + filteredItems.length) % filteredItems.length,
    );
  }, [filteredItems.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? 0 : (prev + 1) % filteredItems.length,
    );
  }, [filteredItems.length]);

  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, closeLightbox, goPrev, goNext]);

  if (!items.length) return null;

  const activeItem = activeIndex !== null ? filteredItems[activeIndex] : null;

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {(title || description) && (
          <header className="space-y-1 text-center">
            {title && (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </header>
        )}

        <div ref={containerRef} className="flex gap-3">
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-1 flex-col gap-3">
              {col.map((item) => {
                const originalIndex = filteredItems.indexOf(item);
                return (
                  <div
                    key={item.id || originalIndex}
                    className="group relative w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-muted"
                    onClick={() => setActiveIndex(originalIndex)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setActiveIndex(originalIndex);
                    }}
                  >
                    <img
                      src={item.src}
                      alt={item.title || item.description || ""}
                      className="h-auto w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2 top-2 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Badge
                          variant="secondary"
                          className="h-7 w-7 rounded-full bg-black/60 p-0 text-slate-100 backdrop-blur-sm hover:bg-black/80"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </Badge>
                      </a>
                    )}
                    {(item.title || item.description) && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-2 pb-2 pt-6 text-left">
                        {item.title && (
                          <div className="line-clamp-1 text-xs font-medium text-slate-50">
                            {item.title}
                          </div>
                        )}
                        {item.description && (
                          <div className="line-clamp-1 text-[11px] text-slate-200/80">
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {activeItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-5xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-end gap-2">
                {activeItem.linkUrl && (
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a
                      href={activeItem.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open link
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-200 hover:bg-white/20 hover:text-white"
                  onClick={closeLightbox}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={activeItem.src}
                  alt={activeItem.title || activeItem.description || ""}
                  className="max-h-[75vh] w-full object-contain"
                />
                {filteredItems.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-black/70 hover:text-white hover:scale-110 active:scale-95"
                      onClick={goPrev}
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-black/70 hover:text-white hover:scale-110 active:scale-95"
                      onClick={goNext}
                    >
                      <ChevronRight className="h-5 w-5" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </>
                )}
              </div>

              {(activeItem.title || activeItem.description) && (
                <div className="mt-3 space-y-1 text-center text-sm text-muted-foreground">
                  {activeItem.title && (
                    <div className="font-medium text-foreground">
                      {activeItem.title}
                    </div>
                  )}
                  {activeItem.description && (
                    <div>{activeItem.description}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
