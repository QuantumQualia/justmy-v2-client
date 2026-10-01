"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { RawHtmlCssBlock } from "@/components/cms/components/raw-html-css-block";
import { legacyPlainText, prepareRawHtml } from "@/lib/legacy-html";

export function MycardAbout({
  about,
  title = "About",
  className,
  bodyClassName = "text-sm text-foreground leading-relaxed",
}: {
  about?: string | null;
  title?: string;
  className?: string;
  bodyClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const source = about?.trim() ?? "";
  const prepared = useMemo(() => prepareRawHtml(source), [source]);
  const hasRich = Boolean(prepared.html || prepared.css || prepared.scripts.length);
  const plain = hasRich ? "" : legacyPlainText(source);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || open) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [source, open, hasRich]);

  if (!hasRich && !plain) return null;

  return (
    <section className={className ?? "space-y-3"}>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div ref={bodyRef} className={open ? undefined : "max-h-24 overflow-hidden"}>
        {hasRich ? <RawHtmlCssBlock html={source} /> : <p className={bodyClassName}>{plain}</p>}
      </div>
      {overflows ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="link"
            className="h-auto px-0"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Show less" : "Show more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
