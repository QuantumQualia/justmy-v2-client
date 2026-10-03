"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@workspace/ui/components/button";

function pageList(page: number, pages: number): Array<number | "gap"> {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  const list: Array<number | "gap"> = [];
  for (let n = 1; n <= pages; n += 1) {
    if (keep.has(n)) list.push(n);
    else if (list[list.length - 1] !== "gap") list.push("gap");
  }
  return list;
}

export function Pagination({
  page,
  pages,
  disabled = false,
  onPage,
  label = "Pages",
}: {
  page: number;
  pages: number;
  disabled?: boolean;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={label}>
      <Button type="button" variant="outline" onClick={() => onPage(page - 1)} disabled={disabled || page <= 1}>
        <ChevronLeft aria-hidden />
        Previous
      </Button>
      {pageList(page, pages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPage(item)}
            disabled={disabled}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </Button>
        ),
      )}
      <Button type="button" variant="outline" onClick={() => onPage(page + 1)} disabled={disabled || page >= pages}>
        Next
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
