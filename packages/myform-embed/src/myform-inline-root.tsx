import * as React from "react";
import { Loader2 } from "lucide-react";
import { DynamicForm } from "./dynamic-form";
import { cn } from "@workspace/ui/lib/utils";

function apiBase(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/embed/forms`;
}

export function MyFormInlineRoot({
  apiOrigin,
  slug,
}: {
  apiOrigin: string;
  slug: string;
}) {
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
    if (!slug.trim()) {
      setSchema(null);
      setLoadError("Missing form slug.");
      return;
    }
    setLoadError(null);
    setSubmitError(null);
    setSchema(null);
    setDone(null);
    void (async () => {
      try {
        const res = await fetch(`${apiBase(apiOrigin)}/${encodeURIComponent(slug.trim())}`, {
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
  }, [apiOrigin, slug]);

  const shell = "asksky-embed-inline asksky-glass-panel flex w-full min-w-0 flex-col";

  if (!slug.trim()) {
    return (
      <div className={cn(shell, "p-4")}>
        <p className="asksky-glass-muted text-sm">Missing data-form-slug on the script tag.</p>
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
        <p className="rounded-lg border border-emerald-500/35 bg-emerald-950/45 px-3 py-2 text-sm text-emerald-100 backdrop-blur-md">
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
              const res = await fetch(`${apiBase(apiOrigin)}/${encodeURIComponent(schema.slug)}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ answers, source: "embed" }),
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
