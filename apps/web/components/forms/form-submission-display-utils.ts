import type { FormSubmissionListItemDto } from "@/lib/services/forms";

export type AnswerColumnDef = { id: string; label: string };

function fieldEntriesFromSchema(schema: Record<string, unknown> | undefined | null): AnswerColumnDef[] {
  const raw = schema?.fields;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: AnswerColumnDef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const type = typeof row.type === "string" && row.type.trim() ? row.type.trim() : "";
    if (!id || type === "header") {
      continue;
    }
    const label = typeof row.label === "string" && row.label.trim() ? row.label.trim() : id;
    out.push({ id, label });
  }
  return out;
}

/** First `max` non-header fields from the published schema (stable column headers). */
export function listPrimaryAnswerColumns(
  schema: Record<string, unknown> | undefined | null,
  max = 2,
): AnswerColumnDef[] {
  return fieldEntriesFromSchema(schema).slice(0, max);
}

/** All non-header fields for a full detail list (schema order). */
export function listAllAnswerFieldDefs(schema: Record<string, unknown> | undefined | null): AnswerColumnDef[] {
  return fieldEntriesFromSchema(schema);
}

export function formatSubmissionAnswerValue(v: unknown): string {
  if (v === true) {
    return "Yes";
  }
  if (v === false) {
    return "No";
  }
  if (v == null) {
    return "";
  }
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function submissionAnswerCell(
  submission: FormSubmissionListItemDto,
  fieldId: string,
): string {
  const raw = submission.answers;
  if (!raw || typeof raw !== "object") {
    return "";
  }
  const v = raw[fieldId];
  return formatSubmissionAnswerValue(v);
}

/** When there is no schema, show up to `max` raw answer keys for table preview. */
export function listFallbackPreviewColumns(
  answers: Record<string, unknown> | undefined | null,
  max = 2,
): AnswerColumnDef[] {
  if (!answers || typeof answers !== "object") {
    return [];
  }
  const out: AnswerColumnDef[] = [];
  for (const [id, v] of Object.entries(answers)) {
    if (out.length >= max) {
      break;
    }
    if (v === undefined || v === null || v === "") {
      continue;
    }
    if (v === false) {
      continue;
    }
    out.push({ id, label: id });
  }
  return out;
}
