"use client";

import {
  useLayoutEffect,
  useRef,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@workspace/ui/lib/utils";

const MAX_ROWS = 3;

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

export function syncAskSkyComposerHeight(el: HTMLTextAreaElement, maxRows = MAX_ROWS) {
  const cs = getComputedStyle(el);
  const line = Number.parseFloat(cs.lineHeight) || 20;
  const min = Number.parseFloat(cs.minHeight) || 44;
  const max = min + line * (maxRows - 1);
  el.style.overflowY = "hidden";
  el.style.height = "auto";
  const next = Math.min(el.scrollHeight, max);
  el.style.height = `${next}px`;
  if (el.scrollHeight > max + 1) el.style.overflowY = "auto";
}

export function AskSkyGrowTextarea({
  chrome = true,
  className,
  value,
  ref,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  chrome?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}) {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const sync = () => syncAskSkyComposerHeight(el);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  return (
    <textarea
      {...props}
      ref={mergeRefs(innerRef, ref)}
      rows={1}
      value={value}
      className={cn(
        "scrollbar-hide min-h-11 min-w-0 flex-1 resize-none overflow-x-hidden overflow-y-hidden px-4 py-2 text-base leading-5 outline-none md:text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        chrome && "asksky-sky-input",
        className,
      )}
    />
  );
}
