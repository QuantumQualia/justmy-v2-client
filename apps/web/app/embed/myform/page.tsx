"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DynamicForm } from "@/components/forms/dynamic-form";
import type { FormSource } from "@/lib/services/forms";

function apiBase(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return `${window.location.origin}/api/embed/forms`;
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

  if (!slug) {
    return <p className="text-sm text-slate-400">Add <code className="text-slate-200">?slug=…</code> to this URL.</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-300">{loadError}</p>;
  }

  if (!schema) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading form…
      </div>
    );
  }

  if (done) {
    return <p className="text-sm text-emerald-300">{done}</p>;
  }

  return (
    <div className="space-y-2">
      {submitError ? (
        <p className="text-xs text-red-300" role="alert">
          {submitError}
        </p>
      ) : null}
      <DynamicForm
        name={schema.name}
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
  );
}

export default function EmbedMyFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      }
    >
      <MyFormEmbedBody />
    </Suspense>
  );
}
