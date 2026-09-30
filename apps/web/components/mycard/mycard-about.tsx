"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { LegacyHtml } from "@/components/common/legacy-html";
import { legacyPlainText } from "@/lib/legacy-html";

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
  const plain = legacyPlainText(about);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || open) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [about, open]);

  if (!plain) return null;

  return (
    <section className={className ?? "space-y-3"}>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {open ? (
        <LegacyHtml value={about} className={bodyClassName} />
      ) : (
        <p ref={bodyRef} className={`${bodyClassName} line-clamp-4`}>
          {plain}
        </p>
      )}
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
