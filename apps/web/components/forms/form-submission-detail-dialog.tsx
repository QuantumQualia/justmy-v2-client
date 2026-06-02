"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { FormSubmissionListItemDto } from "@/lib/services/forms";
import {
  formatSubmissionAnswerValue,
  listAllAnswerFieldDefs,
} from "@/components/forms/form-submission-display-utils";

export interface FormSubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: FormSubmissionListItemDto | null;
  /** Published form schema (`schema.fields`) for labels and field order. */
  schema?: Record<string, unknown> | null;
  formName?: string | null;
}

function DetailBody({
  submission,
  schema,
  formName,
}: {
  submission: FormSubmissionListItemDto;
  schema?: Record<string, unknown> | null;
  formName?: string | null;
}) {
  const answers = submission.answers && typeof submission.answers === "object" ? submission.answers : {};
  const defs = listAllAnswerFieldDefs(schema);

  const rows: { label: string; value: string }[] = [];
  if (defs.length > 0) {
    for (const { id, label } of defs) {
      if (!(id in answers)) {
        continue;
      }
      const v = answers[id];
      if (v === undefined || v === null || v === "") {
        continue;
      }
      if (v === false) {
        continue;
      }
      rows.push({ label, value: formatSubmissionAnswerValue(v) });
    }
    for (const [k, v] of Object.entries(answers)) {
      if (defs.some((d) => d.id === k)) {
        continue;
      }
      if (v === undefined || v === null || v === "" || v === false) {
        continue;
      }
      rows.push({ label: k, value: formatSubmissionAnswerValue(v) });
    }
  } else {
    for (const [k, v] of Object.entries(answers)) {
      if (v === undefined || v === null || v === "" || v === false) {
        continue;
      }
      rows.push({ label: k, value: formatSubmissionAnswerValue(v) });
    }
  }

  return (
    <div className="space-y-5 text-sm">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Submitted</dt>
          <dd className="text-slate-100">{new Date(submission.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Submission id</dt>
          <dd className="font-mono text-xs text-slate-300">{submission.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Source</dt>
          <dd className="text-slate-200">{submission.source}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Schema version</dt>
          <dd className="text-slate-200">{submission.schemaVersion}</dd>
        </div>
        {formName ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Form</dt>
            <dd className="text-slate-200">{formName}</dd>
          </div>
        ) : null}
        {submission.submittedOrigin ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Origin</dt>
            <dd className="break-all text-slate-300">{submission.submittedOrigin}</dd>
          </div>
        ) : null}
        {submission.submittedReferer ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Referer</dt>
            <dd className="break-all text-slate-300">{submission.submittedReferer}</dd>
          </div>
        ) : null}
        {submission.userId != null ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">User id</dt>
            <dd className="text-slate-200">{submission.userId}</dd>
          </div>
        ) : null}
      </dl>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Answers</h3>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">No answer fields on this submission.</p>
        ) : (
          <dl className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            {rows.map(({ label, value }, i) => (
              <div
                key={`${label}:${i}`}
                className="grid gap-1 border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
              >
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="break-words text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

/** Full submission detail — use inside a parent dialog (e.g. agent leads) or via {@link FormSubmissionDetailDialog}. */
export function FormSubmissionDetailContent(props: {
  submission: FormSubmissionListItemDto;
  schema?: Record<string, unknown> | null;
  formName?: string | null;
  onBack?: () => void;
  backLabel?: string;
}) {
  const { submission, schema, formName, onBack, backLabel = "← Back to list" } = props;
  return (
    <div className="space-y-4">
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 text-xs text-slate-400 hover:text-white"
          onClick={onBack}
        >
          {backLabel}
        </Button>
      ) : null}
      <DetailBody submission={submission} schema={schema} formName={formName} />
    </div>
  );
}

export function FormSubmissionDetailDialog({
  open,
  onOpenChange,
  submission,
  schema,
  formName,
}: FormSubmissionDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-800 bg-slate-950 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{submission ? `Submission #${submission.id}` : "Submission"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {formName ? `Form: ${formName}` : "Captured field values and metadata."}
          </DialogDescription>
        </DialogHeader>
        {submission ? <DetailBody submission={submission} schema={schema} formName={formName} /> : null}
      </DialogContent>
    </Dialog>
  );
}
