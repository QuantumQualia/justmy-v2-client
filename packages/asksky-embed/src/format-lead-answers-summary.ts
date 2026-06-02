/** Args for `POST .../lead-capture` after a successful myFORM submit in-thread. */
export type AskSkyPersistLeadCaptureArgs = {
  answers: Record<string, unknown>;
  formTitle?: string;
  /** myFORM schema (`schema.fields`); when set, lead-capture `fields` use each field’s label as the key instead of id. */
  schema?: Record<string, unknown>;
};

/** @deprecated Prefer `persistLeadInConversation` + server transcript. */
export type AskSkyLeadFormSubmittedPayload = {
  summaryText: string;
  answers: Record<string, unknown>;
};

/** Builds field id → display label from myFORM `schema.fields` (skips headers). */
function fieldIdToLeadCaptureLabelMap(schema: Record<string, unknown> | undefined): Map<string, string> {
  const map = new Map<string, string>();
  const raw = schema?.fields;
  if (!Array.isArray(raw)) {
    return map;
  }
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id) {
      continue;
    }
    const type = typeof row.type === "string" && row.type.trim() ? row.type.trim() : "text";
    if (type === "header") {
      continue;
    }
    const label =
      typeof row.label === "string" && row.label.trim() ? row.label.trim() : id;
    map.set(id, label);
  }
  return map;
}

/**
 * Maps myFORM answers to `POST .../lead-capture` `fields` (non-empty strings).
 * With `schema`, object keys are field **labels**; without it, keys stay as answer ids (legacy).
 */
export function toSkyLeadCaptureFields(
  answers: Record<string, unknown>,
  schema?: Record<string, unknown>,
): Record<string, unknown> {
  const idToLabel = fieldIdToLeadCaptureLabelMap(schema);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(answers)) {
    const s = v === true ? "yes" : v === false ? "no" : String(v ?? "").trim();
    if (s.length > 0) {
      const key = idToLabel.get(k) ?? k;
      out[key] = s;
    }
  }
  return out;
}

function formatAnswerValue(v: unknown): string {
  if (v === true) {
    return "Yes";
  }
  if (v === false) {
    return "No";
  }
  if (v == null) {
    return "";
  }
  return String(v);
}

/**
 * Builds a readable user-message body from myFORM `schema.fields` + submitted `answers`
 * (same shape as `DynamicForm` / public embed form schema).
 */
export function formatLeadAnswersAsUserMessage(
  schema: Record<string, unknown>,
  answers: Record<string, unknown>,
): string {
  const raw = schema.fields;
  const lines: string[] = ["Contact form"];
  if (!Array.isArray(raw)) {
    const body = Object.entries(answers)
      .filter(([, v]) => v !== "" && v != null && v !== false)
      .map(([k, v]) => `• ${k}: ${formatAnswerValue(v)}`)
      .join("\n");
    return body ? `${lines[0]}:\n${body}` : `${lines[0]} submitted.`;
  }

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id) {
      continue;
    }
    const type = typeof row.type === "string" && row.type.trim() ? row.type.trim() : "text";
    if (type === "header") {
      continue;
    }
    const label = typeof row.label === "string" ? row.label : id;
    const v = answers[id];
    if (v === undefined || v === null || v === "") {
      continue;
    }
    if (type === "checkbox" && v === false) {
      continue;
    }
    lines.push(`• ${label}: ${formatAnswerValue(v)}`);
  }

  if (lines.length === 1) {
    return `${lines[0]} submitted.`;
  }
  return lines.join("\n");
}
