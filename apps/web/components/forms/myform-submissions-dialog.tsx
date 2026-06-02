"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { FormSubmissionDetailContent } from "@/components/forms/form-submission-detail-dialog";
import { FormSubmissionsListLoading } from "@/components/forms/form-submissions-list-loading";
import {
  listFallbackPreviewColumns,
  listPrimaryAnswerColumns,
  submissionAnswerCell,
} from "@/components/forms/form-submission-display-utils";
import {
  formsService,
  type FormSubmissionListItemDto,
  type FormSubmissionsPageDto,
} from "@/lib/services/forms";

const PAGE_SIZE = 25;

export interface MyFormSubmissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  /** Shown in header; loaded from API when omitted. */
  formName?: string | null;
  /** For preview columns; loaded from API when omitted. */
  schema?: Record<string, unknown> | null;
}

export function MyFormSubmissionsDialog({
  open,
  onOpenChange,
  formId,
  formName: formNameProp,
  schema: schemaProp,
}: MyFormSubmissionsDialogProps) {
  const formQ = useQuery({
    queryKey: ["profile-form", formId],
    queryFn: () => formsService.getProfileForm(formId),
    enabled: open && Boolean(formId) && (formNameProp === undefined || schemaProp === undefined),
  });

  const formName = formNameProp ?? formQ.data?.name ?? null;
  const schema = schemaProp ?? formQ.data?.schema ?? null;

  const [skip, setSkip] = React.useState(0);
  const [appliedQ, setAppliedQ] = React.useState("");
  const [qDraft, setQDraft] = React.useState("");
  const [selected, setSelected] = React.useState<FormSubmissionListItemDto | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSkip(0);
      setAppliedQ("");
      setQDraft("");
      setSelected(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setSkip(0);
      setSelected(null);
    }
  }, [open, appliedQ, formId]);

  const submissionsQuery = useQuery<FormSubmissionsPageDto>({
    queryKey: ["form-submissions", formId, appliedQ, skip, PAGE_SIZE],
    queryFn: () =>
      formsService.listSubmissions(formId, {
        take: PAGE_SIZE,
        skip,
        ...(appliedQ.trim() ? { q: appliedQ.trim() } : {}),
      }),
    enabled: open && Boolean(formId),
    placeholderData: (previousData) => previousData,
  });

  const handleDialogOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && selected != null) {
        setSelected(null);
        return;
      }
      onOpenChange(next);
    },
    [onOpenChange, selected],
  );

  const rows = submissionsQuery.data?.submissions ?? [];
  const total = submissionsQuery.data?.total ?? 0;
  const pageStart = total === 0 ? 0 : skip + 1;
  const pageEnd = Math.min(skip + rows.length, total);
  const canPrev = skip > 0;
  const canNext = skip + rows.length < total;

  const previewColumns = React.useMemo(() => {
    const fromSchema = listPrimaryAnswerColumns(schema, 2);
    if (fromSchema.length > 0) {
      return fromSchema;
    }
    const firstAnswers = rows[0]?.answers;
    return listFallbackPreviewColumns(firstAnswers, 2);
  }, [schema, rows]);

  const col0 = previewColumns[0];
  const col1 = previewColumns[1];

  const titleBase = formName ? `Submissions — ${formName}` : "Submissions";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{selected ? `Submission #${selected.id}` : titleBase}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {selected
              ? "Full field values and metadata."
              : "Search across answers, source, origin, referer, and user id. Paginated list from your profile API."}
          </DialogDescription>
        </DialogHeader>

        {!formId ? null : selected ? (
          <FormSubmissionDetailContent
            submission={selected}
            schema={schema}
            formName={formName}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setAppliedQ(qDraft.trim());
                    }
                  }}
                  placeholder="Search submissions…"
                  className="border-slate-700 bg-slate-900 pl-9 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-slate-800 text-white hover:bg-slate-700"
                  onClick={() => setAppliedQ(qDraft.trim())}
                >
                  Search
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                  disabled={!appliedQ && !qDraft}
                  onClick={() => {
                    setQDraft("");
                    setAppliedQ("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            {submissionsQuery.isError ? (
              <div className="mx-1 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                {submissionsQuery.error instanceof Error ? submissionsQuery.error.message : "Failed to load."}
              </div>
            ) : (
              <>
                {submissionsQuery.isFetching ? (
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    <FormSubmissionsListLoading />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Submitted</th>
                          <th className="max-w-[200px] px-3 py-2">{col0?.label ?? "Field 1"}</th>
                          <th className="max-w-[200px] px-3 py-2">{col1?.label ?? "Field 2"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                              {appliedQ.trim()
                                ? "No submissions match your search."
                                : "No submissions yet."}
                            </td>
                          </tr>
                        ) : (
                          rows.map((r) => {
                            const v0 = col0 ? submissionAnswerCell(r, col0.id) : "";
                            const v1 = col1 ? submissionAnswerCell(r, col1.id) : "";
                            return (
                              <tr
                                key={r.id}
                                className="cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/60"
                                onClick={() => setSelected(r)}
                              >
                                <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                                  {new Date(r.createdAt).toLocaleString()}
                                </td>
                                <td className="max-w-[220px] truncate px-3 py-2 text-slate-200" title={v0}>
                                  {v0 || "—"}
                                </td>
                                <td className="max-w-[220px] truncate px-3 py-2 text-slate-200" title={v1}>
                                  {v1 || "—"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
                  <span>
                    {total === 0
                      ? "No matches"
                      : `Showing ${pageStart}–${pageEnd} of ${total}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-700 bg-slate-900 px-2"
                      disabled={!canPrev || submissionsQuery.isFetching}
                      onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-slate-700 bg-slate-900 px-2"
                      disabled={!canNext || submissionsQuery.isFetching}
                      onClick={() => setSkip((s) => s + PAGE_SIZE)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
