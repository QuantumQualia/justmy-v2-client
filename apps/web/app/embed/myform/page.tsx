"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DynamicForm } from "@/components/forms/dynamic-form";
import type { FormSource } from "@/lib/services/forms";
import {
  MYFORM_EMBED_RESIZE_MESSAGE_TYPE,
  type MyFormEmbedResizeMessage,
} from "@/lib/myform-embed-resize-protocol";
import { cn } from "@workspace/ui/lib/utils";

function apiBase(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}/api/embed/forms`;
}

/** Reports measured height to parent so `myform.js` can size the iframe (no fixed `data-height`). */
function MyFormEmbedResizeBridge({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);

  const report = React.useCallback(() => {
    if (typeof window === "undefined" || window.parent === window) {
      return;
    }
    const el = ref.current;
    if (!el) {
      return;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const h = Math.ceil(el.getBoundingClientRect().height);
      const clamped = Math.min(12000, Math.max(80, h));
      const payload: MyFormEmbedResizeMessage = {
        type: MYFORM_EMBED_RESIZE_MESSAGE_TYPE,
        height: clamped,
      };
      window.parent.postMessage(payload, "*");
    });
  }, []);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    report();
    const ro = new ResizeObserver(() => report());
    ro.observe(el);
    window.addEventListener("resize", report);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", report);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [report]);

  return (
    <div ref={ref} className="flex w-full min-w-0 flex-col">
      {children}
    </div>
  );
}

function MyFormEmbedBody() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim() ?? "";
  const source = (searchParams.get("source")?.trim() || "embed") as FormSource;
  const [schema, setSchema] = React.useState<{
    name: string;
    slug: string;
    publishedVersion: number;
    schema: Record<string, unknown>;
  } | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setSchema(null);
      setLoadError("Missing slug query parameter.");
      return;
    }
    setLoadError(null);
    setSubmitError(null);
    setSchema(null);
    setDone(null);
    void (async () => {
      try {
        const res = await fetch(`${apiBase()}/${encodeURIComponent(slug)}`, {
          headers: { Accept: "application/json" },
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) {
          const msg = typeof data.message === "string" ? data.message : "Failed to load form.";
          throw new Error(msg);
        }
        if (cancelled) {
          return;
        }
        setSchema({
          name: String(data.name ?? "Form"),
          slug: String(data.slug ?? slug),
          publishedVersion: Number(data.publishedVersion ?? 0),
          schema: (data.schema as Record<string, unknown>) ?? {},
        });
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load form.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const shell = "asksky-embed-inline asksky-glass-panel flex w-full min-w-0 flex-col";

  if (!slug) {
    return (
      <div className={cn(shell, "p-4")}>
        <p className="asksky-glass-muted text-sm">
          Add <code className="text-foreground">?slug=…</code> to this URL.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn(shell, "p-4")}>
        <p className="asksky-glass-error border px-3 py-2 text-sm">{loadError}</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className={cn(shell, "flex items-center justify-center p-6")}>
        <div className="flex items-center gap-2 text-sm asksky-glass-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading form…
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={cn(shell, "p-4")}>
        <p className="rounded-lg border border-success/35 bg-emerald-950/45 px-3 py-2 text-sm text-success backdrop-blur-md">
          {done}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(shell)}>
      <div className="asksky-glass-header shrink-0 px-4 py-3">
        <h1 className="text-base font-semibold leading-tight text-white">{schema.name}</h1>
        <p className="asksky-glass-muted mt-0.5 text-xs">Secure form — hosted by JustMy</p>
      </div>
      <div className="asksky-glass-body asksky-glass-scroll asksky-glass-scroll-gutter px-4 py-4">
        {submitError ? (
          <p className="asksky-glass-error mb-3 border px-3 py-2 text-xs" role="alert">
            {submitError}
          </p>
        ) : null}
        <DynamicForm
          name={undefined}
          schema={schema.schema}
          variant="embed"
          submitting={submitting}
          submitLabel="Send"
          onSubmit={async (answers) => {
            setSubmitting(true);
            setSubmitError(null);
            try {
              const res = await fetch(`${apiBase()}/${encodeURIComponent(schema.slug)}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ answers, source }),
              });
              const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
              if (!res.ok) {
                const msg = typeof data.message === "string" ? data.message : "Submit failed.";
                throw new Error(Array.isArray(data.message) ? JSON.stringify(data.message) : msg);
              }
              setDone("Thanks — your response was received.");
            } catch (e) {
              setSubmitError(e instanceof Error ? e.message : "Submit failed.");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function EmbedMyFormPage() {
  return (
    <div className="flex w-full min-w-0 flex-col bg-transparent">
      <Suspense
        fallback={
          <MyFormEmbedResizeBridge>
            <div className="asksky-embed-inline asksky-glass-panel flex w-full min-w-0 flex-col items-center justify-center p-6">
              <div className="flex items-center gap-2 text-sm asksky-glass-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading…
              </div>
            </div>
          </MyFormEmbedResizeBridge>
        }
      >
        <MyFormEmbedResizeBridge>
          <MyFormEmbedBody />
        </MyFormEmbedResizeBridge>
      </Suspense>
    </div>
  );
}
