"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Inbox,
  Layers,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";
import { MyFormEmbedDialog } from "@/components/forms/myform-embed-dialog";
import { MyFormSubmissionsDialog } from "@/components/forms/myform-submissions-dialog";
import { formsService, type FormDefinitionDto } from "@/lib/services/forms";
import { myFormEditHref, myFormNewHref } from "@/components/forms/myform-routes";
import { cn } from "@workspace/ui/lib/utils";

function schemaFieldCount(schema: Record<string, unknown> | undefined): number {
  const raw = schema?.fields;
  return Array.isArray(raw) ? raw.length : 0;
}

function statusBadge(status: FormDefinitionDto["status"]) {
  if (status === "published") {
    return (
      <Badge className="shrink-0 border-emerald-500/35 bg-emerald-600/20 font-medium text-emerald-200">
        Published
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/10 font-medium text-amber-200">
      Draft
    </Badge>
  );
}

function formatShortDate(iso: string | undefined): string | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export interface MyFormManagementPanelProps {
  /** When true, show page title + subtitle above the list; omit on dense CMS layouts. */
  showHeader?: boolean;
  /**
   * Pathname only (no query) for this myFORM surface — the CMS page URL where the hub block is placed.
   * Links use `?myform=` query params on this path.
   */
  basePath: string;
  className?: string;
}

const FORMS_PAGE_SIZE = 20;

/**
 * Profile-scoped myFORM list. Navigation stays on `basePath` with query params (CMS-friendly).
 */
export function MyFormManagementPanel({
  showHeader = true,
  basePath,
  className,
}: MyFormManagementPanelProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = React.useState<FormDefinitionDto | null>(null);
  const [embedTarget, setEmbedTarget] = React.useState<FormDefinitionDto | null>(null);
  const [submissionsTarget, setSubmissionsTarget] = React.useState<FormDefinitionDto | null>(null);
  const [listQDraft, setListQDraft] = React.useState("");
  const [listQApplied, setListQApplied] = React.useState("");
  const [listSkip, setListSkip] = React.useState(0);

  React.useEffect(() => {
    setListSkip(0);
  }, [listQApplied]);

  const formsListQuery = useQuery({
    queryKey: ["profile-forms", listQApplied, listSkip, FORMS_PAGE_SIZE],
    queryFn: () =>
      formsService.listProfileForms({
        take: FORMS_PAGE_SIZE,
        skip: listSkip,
        ...(listQApplied.trim() ? { q: listQApplied.trim() } : {}),
      }),
  });

  const formsList = formsListQuery.data?.forms ?? [];
  const formsTotal = formsListQuery.data?.total ?? 0;
  const listPageEnd = formsList.length === 0 ? 0 : Math.min(listSkip + formsList.length, formsTotal);
  const listPageStart = formsTotal === 0 ? 0 : listSkip + 1;
  const listCanPrev = listSkip > 0;
  const listCanNext = listSkip + formsList.length < formsTotal;

  const publishMutation = useMutation({
    mutationFn: (id: number) => formsService.publishProfileForm(id),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["profile-forms"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-form", id] });
      toast.success("Published");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Publish failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => formsService.deleteProfileForm(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-forms"] });
      toast.success("Form deleted");
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const count = formsTotal;
  const loaded = !formsListQuery.isLoading && !formsListQuery.isError;

  const newFormButton = (
    <Button
      asChild
      variant="success"
      className="h-9 w-9 shrink-0 p-0 shadow-lg shadow-emerald-950/25 sm:h-10 sm:w-auto sm:min-w-[140px] sm:px-4"
      size={showHeader ? "default" : "sm"}
    >
      <Link
        href={myFormNewHref(basePath)}
        aria-label="Create new form"
        className="inline-flex h-9 w-9 items-center justify-center gap-0 sm:h-10 sm:w-auto sm:min-w-[140px] sm:gap-2 sm:px-4"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">New form</span>
      </Link>
    </Button>
  );

  return (
    <div
      className={cn(
        showHeader
          ? "mx-auto min-h-[50vh] max-w-5xl space-y-8 px-4 py-8 text-foreground md:px-6 md:py-12"
          : "min-w-0 max-w-full space-y-5 text-foreground",
        className,
      )}
    >
      {showHeader ? (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                <Layers className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">myFORM</h1>
              {loaded ? (
                <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {count} {count === 1 ? "form" : "forms"}
                </span>
              ) : null}
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Build forms for your profile, embeds, and AskSKY. Slug is set when you create a form — use it in public
              URLs and integrations.
            </p>
          </div>
          <div className="shrink-0 sm:pt-1">{newFormButton}</div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-r from-muted to-muted/40 px-4 py-3 ring-1 ring-white/[0.04]">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-400/90" />
            <span className="text-sm font-semibold text-foreground">Forms</span>
            {loaded ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
            ) : null}
          </div>
          {newFormButton}
        </div>
      )}

      <Card className="overflow-hidden border-border bg-gradient-to-b from-muted to-muted/95 shadow-xl shadow-black/25 ring-1 ring-white/[0.04]">
        <CardHeader className="border-b border-border/60 bg-muted space-y-1 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">Your forms</CardTitle>
            {loaded && count > 0 ? (
              <span className="text-xs font-medium text-muted-foreground">{count} total</span>
            ) : null}
          </div>
          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
            Edit, publish, or delete forms here, or open submissions from the inbox. Use{" "}
            <span className="text-muted-foreground">Embed</span> on a form to copy the third-party script snippet. Search
            matches form name and slug.
          </CardDescription>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={listQDraft}
                onChange={(e) => setListQDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setListQApplied(listQDraft.trim());
                  }
                }}
                placeholder="Search by name or slug…"
                className="border-border bg-card pl-9 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-muted text-foreground hover:bg-accent"
                onClick={() => setListQApplied(listQDraft.trim())}
              >
                Search
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-accent-foreground"
                disabled={!listQApplied && !listQDraft}
                onClick={() => {
                  setListQDraft("");
                  setListQApplied("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {formsListQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500/80" />
              <p className="text-sm">Loading your forms…</p>
            </div>
          ) : formsListQuery.isError ? (
            <div className="mx-4 my-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200 md:mx-6">
              {formsListQuery.error instanceof Error ? formsListQuery.error.message : "Failed to load forms."}
            </div>
          ) : formsList.length === 0 && formsTotal === 0 && !listQApplied.trim() ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center md:py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-input bg-card text-muted-foreground">
                <ClipboardList className="h-8 w-8" />
              </div>
              <div className="max-w-sm space-y-2">
                <p className="text-base font-semibold text-foreground">No forms yet</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Create your first form to collect leads, feedback, or sign-ups. You can refine fields and publish when
                  it looks right.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-2 border-border bg-card">
                <Link href={myFormNewHref(basePath)} className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create a form
                </Link>
              </Button>
            </div>
          ) : formsList.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No forms match your search.
              <Button
                type="button"
                variant="link"
                className="ml-2 h-auto p-0 text-emerald-400"
                onClick={() => {
                  setListQDraft("");
                  setListQApplied("");
                }}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground sm:px-6">
                <span>
                  {formsTotal === 0
                    ? ""
                    : `Showing ${listPageStart}–${listPageEnd} of ${formsTotal}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-card px-2 text-xs"
                    disabled={!listCanPrev || formsListQuery.isFetching}
                    onClick={() => setListSkip((s) => Math.max(0, s - FORMS_PAGE_SIZE))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-card px-2 text-xs"
                    disabled={!listCanNext || formsListQuery.isFetching}
                    onClick={() => setListSkip((s) => s + FORMS_PAGE_SIZE)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            <ul className="divide-y divide-border">
              {formsList.map((f) => {
                const nFields = schemaFieldCount(f.schema);
                const updated = formatShortDate(f.updatedAt ?? f.createdAt);
                return (
                  <li key={f.id}>
                    <div className="group flex flex-col gap-4 px-4 py-5 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold tracking-tight text-foreground">{f.name}</p>
                          {statusBadge(f.status)}
                        </div>
                        <p className="truncate font-mono text-xs text-muted-foreground sm:text-sm" title={f.slug}>
                          {f.slug}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
                          <span>
                            Version <span className="font-medium text-muted-foreground">v{f.publishedVersion}</span>
                          </span>
                          {nFields > 0 ? (
                            <span>
                              <span className="font-medium text-muted-foreground">{nFields}</span>{" "}
                              {nFields === 1 ? "field" : "fields"}
                            </span>
                          ) : (
                            <span className="text-amber-500/80">No fields in schema</span>
                          )}
                          {updated ? <span>Updated {updated}</span> : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 shrink-0 rounded-full border-border bg-card p-0 hover:bg-accent sm:h-9 sm:w-auto sm:px-3"
                          aria-label={`Embed ${f.name}`}
                          onClick={() => setEmbedTarget(f)}
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Embed</span>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 shrink-0 rounded-full border-border bg-card p-0 hover:bg-accent sm:h-9 sm:w-auto sm:px-3"
                        >
                          <Link
                            href={myFormEditHref(basePath, f.id)}
                            aria-label={`Edit ${f.name}`}
                            className="inline-flex size-full min-h-0 min-w-0 items-center justify-center gap-0 sm:gap-1.5 sm:px-1"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 shrink-0 rounded-full border-border bg-card p-0 hover:bg-accent sm:h-9 sm:w-auto sm:px-3"
                          aria-label={`Submissions for ${f.name}`}
                          onClick={() => setSubmissionsTarget(f)}
                        >
                          <Inbox className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Submissions</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="inline-flex h-8 w-8 shrink-0 rounded-full items-center justify-center gap-0 p-0 text-muted-foreground hover:bg-red-950/40 hover:text-red-400 sm:h-9 sm:w-auto sm:gap-1 sm:px-3"
                          disabled={deleteMutation.isPending && deleteMutation.variables === f.id}
                          aria-label={`Delete ${f.name}`}
                          onClick={() => setDeleteTarget(f)}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === f.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1 sm:h-3.5 sm:w-3.5" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 sm:mr-1 sm:h-3.5 sm:w-3.5" />
                          )}
                          <span className="hidden sm:inline sm:ml-0.5">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            </>
          )}
        </CardContent>
      </Card>

      <MyFormEmbedDialog
        open={embedTarget != null}
        onOpenChange={(o) => {
          if (!o) {
            setEmbedTarget(null);
          }
        }}
        form={embedTarget}
      />

      <MyFormSubmissionsDialog
        open={submissionsTarget != null}
        onOpenChange={(o) => {
          if (!o) {
            setSubmissionsTarget(null);
          }
        }}
        formId={submissionsTarget ? String(submissionsTarget.id) : ""}
        formName={submissionsTarget?.name ?? null}
        schema={submissionsTarget?.schema ?? null}
      />

      <ConfirmDeletionModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete this form?"
        description={
          deleteTarget ? (
            <>
              <span className="font-medium text-foreground">{deleteTarget.name}</span>{" "}
              <span className="font-mono text-muted-foreground">({deleteTarget.slug})</span> will be removed. This
              cannot be undone. Submissions may be removed depending on backend rules.
            </>
          ) : null
        }
        confirmText="Delete form"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
