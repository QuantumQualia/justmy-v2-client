import type { DynamicFormField, DynamicFormFieldType } from "@/components/forms/dynamic-form";

export type MyFormBuilderFieldType = DynamicFormFieldType | "header";

export interface MyFormBuilderField {
  id: string;
  type: MyFormBuilderFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const SUPPORTED_TYPES = new Set<string>([
  "header",
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "radio",
  "checkbox",
  "number",
  "date",
  "file",
  "url",
]);

function normalizeType(raw: unknown): MyFormBuilderFieldType {
  const t = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (SUPPORTED_TYPES.has(t)) {
    return t as MyFormBuilderFieldType;
  }
  return "text";
}

export function parseBuilderFields(schema: Record<string, unknown> | null | undefined): MyFormBuilderField[] {
  const raw = schema?.fields;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: MyFormBuilderField[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id) {
      continue;
    }
    const type = normalizeType(row.type);
    const label = typeof row.label === "string" ? row.label : id;
    const required = Boolean(row.required);
    const placeholder = typeof row.placeholder === "string" ? row.placeholder : undefined;
    let options: MyFormBuilderField["options"];
    if (Array.isArray(row.options)) {
      options = row.options
        .map((o) => {
          if (!o || typeof o !== "object") {
            return null;
          }
          const opt = o as Record<string, unknown>;
          const value = typeof opt.value === "string" ? opt.value : String(opt.value ?? "");
          const optLabel = typeof opt.label === "string" ? opt.label : value;
          return { value, label: optLabel };
        })
        .filter(Boolean) as { value: string; label: string }[];
    }
    out.push({ id, type, label, required, placeholder, options });
  }
  return out;
}

export function serializeBuilderFields(fields: MyFormBuilderField[]): unknown[] {
  return fields.map((f) => {
    const row: Record<string, unknown> = {
      id: f.id,
      type: f.type,
      label: f.label,
      required: Boolean(f.required),
    };
    if (f.placeholder?.trim()) {
      row.placeholder = f.placeholder.trim();
    }
    if ((f.type === "select" || f.type === "radio") && f.options?.length) {
      row.options = f.options.map((o) => ({ value: o.value, label: o.label || o.value }));
    }
    return row;
  });
}

export function mergeSchemaWithFields(
  previous: Record<string, unknown>,
  fields: MyFormBuilderField[],
): Record<string, unknown> {
  return {
    ...previous,
    fields: serializeBuilderFields(fields),
  };
}

export function newFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultField(type: MyFormBuilderFieldType): MyFormBuilderField {
  const id = newFieldId();
  switch (type) {
    case "header":
      return { id, type: "header", label: "Section heading", required: false };
    case "email":
      return { id, type: "email", label: "Email", required: true, placeholder: "" };
    case "textarea":
      return { id, type: "textarea", label: "Message", required: false, placeholder: "" };
    case "select":
      return {
        id,
        type: "select",
        label: "Select",
        required: false,
        placeholder: "",
        options: [
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
        ],
      };
    case "radio":
      return {
        id,
        type: "radio",
        label: "Choose one",
        required: false,
        placeholder: "",
        options: [
          { value: "opt1", label: "Option 1" },
          { value: "opt2", label: "Option 2" },
        ],
      };
    case "checkbox":
      return { id, type: "checkbox", label: "I agree to the terms", required: true };
    case "phone":
      return { id, type: "phone", label: "Phone", required: false, placeholder: "" };
    case "number":
      return { id, type: "number", label: "Number", required: false, placeholder: "0" };
    case "date":
      return { id, type: "date", label: "Date", required: false };
    case "file":
      return { id, type: "file", label: "File upload", required: false };
    case "url":
      return { id, type: "url", label: "Website", required: false, placeholder: "https://" };
    case "text":
    default:
      return { id, type: "text", label: "Label", required: false, placeholder: "" };
  }
}

/** For preview / runtime — same shape DynamicForm already accepts */
export function builderFieldsToDynamicFields(fields: MyFormBuilderField[]): DynamicFormField[] {
  return fields
    .filter((f) => f.type !== "header")
    .map((f) => ({
      id: f.id,
      type: f.type as DynamicFormFieldType,
      label: f.label,
      required: f.required,
      placeholder: f.placeholder,
      options: f.options,
    }));
}
