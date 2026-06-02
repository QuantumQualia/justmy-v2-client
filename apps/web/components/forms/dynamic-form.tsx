"use client";

import * as React from "react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

export type DynamicFormFieldType =
  | "header"
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "number"
  | "date"
  | "file"
  | "url"
  | string;

export interface DynamicFormField {
  id: string;
  type: DynamicFormFieldType;
  label?: string;
  required?: boolean;
  /** Input / textarea / select trigger placeholder */
  placeholder?: string;
  options?: { value: string; label: string }[];
}

function parseFields(schema: Record<string, unknown>): DynamicFormField[] {
  const raw = schema.fields;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: DynamicFormField[] = [];
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
    const label = typeof row.label === "string" ? row.label : undefined;
    const required = Boolean(row.required);
    const placeholder = typeof row.placeholder === "string" ? row.placeholder : undefined;
    let options: DynamicFormField["options"];
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

export interface DynamicFormProps {
  name?: string;
  schema: Record<string, unknown>;
  disabled?: boolean;
  submitting?: boolean;
  submitLabel?: string;
  className?: string;
  /** Compact styling for AskSKY glass / embed chrome */
  variant?: "default" | "embed";
  /** When set, overrides default submit button styles (e.g. AskSKY send chrome). */
  submitButtonClassName?: string;
  onSubmit: (answers: Record<string, unknown>) => void | Promise<void>;
}

export function DynamicForm({
  name,
  schema,
  disabled,
  submitting,
  submitLabel = "Submit",
  className,
  variant = "default",
  submitButtonClassName,
  onSubmit,
}: DynamicFormProps) {
  const fields = React.useMemo(() => parseFields(schema), [schema]);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const next: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "header") {
        continue;
      }
      if (f.type === "checkbox") {
        next[f.id] = false;
      } else if (f.type === "select" || f.type === "radio") {
        next[f.id] = "";
      } else {
        next[f.id] = "";
      }
    }
    setValues(next);
    setError(null);
  }, [fields]);

  const setField = (id: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    for (const f of fields) {
      if (f.type === "header") {
        continue;
      }
      if (!f.required) {
        continue;
      }
      const v = values[f.id];
      if (f.type === "checkbox") {
        if (v !== true) {
          setError(`Please confirm: ${f.label || f.id}`);
          return;
        }
      } else if (v == null || String(v).trim() === "") {
        setError(`${f.label || f.id} is required.`);
        return;
      }
    }
    await onSubmit(values);
  };

  const embed = variant === "embed";

  if (fields.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border px-3 py-2 text-sm",
          embed ? "border-zinc-600/50 bg-zinc-900/40 text-zinc-400" : "border-amber-500/30 bg-amber-500/10 text-amber-200",
        )}
      >
        This form has no fields yet. Use the form builder to add fields.
      </div>
    );
  }

  return (
    <form className={cn("space-y-3", className)} onSubmit={(ev) => void handleSubmit(ev)}>
      {name ? (
        <h3 className={cn("text-sm font-semibold", embed ? "text-zinc-100" : "text-white")}>{name}</h3>
      ) : null}
      {error ? (
        <div
          className={cn(
            "rounded-md border px-2 py-1.5 text-xs",
            embed ? "border-red-500/40 bg-red-950/50 text-red-200" : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
        >
          {error}
        </div>
      ) : null}
      {fields.map((f) => {
        const label = f.label || f.id;
        const commonLabel = (
          <Label
            htmlFor={`df-${f.id}`}
            className={cn("text-xs", embed ? "text-zinc-300" : "text-slate-200")}
          >
            {label}
            {f.required ? <span className="text-red-400"> *</span> : null}
          </Label>
        );

        const ph = f.placeholder?.trim();

        if (f.type === "header") {
          return (
            <div key={f.id} className="pt-1">
              <h3
                className={cn(
                  "text-base font-semibold tracking-tight",
                  embed ? "text-zinc-100" : "text-white",
                )}
              >
                {label}
              </h3>
            </div>
          );
        }

        if (f.type === "textarea") {
          return (
            <div key={f.id} className="space-y-1">
              {commonLabel}
              <Textarea
                id={`df-${f.id}`}
                value={String(values[f.id] ?? "")}
                onChange={(e) => setField(f.id, e.target.value)}
                disabled={disabled || submitting}
                placeholder={ph || undefined}
                className={cn(
                  "min-h-[88px] text-sm",
                  embed
                    ? "border-zinc-600 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500"
                    : "border-slate-700 bg-slate-900 text-white",
                )}
              />
            </div>
          );
        }

        if (f.type === "select") {
          const opts = f.options?.length ? f.options : [{ value: "__empty__", label: ph || "Add options in builder" }];
          const optionValues = new Set(opts.map((o) => o.value));
          const raw = values[f.id];
          const current = raw != null && String(raw) !== "" && optionValues.has(String(raw)) ? String(raw) : undefined;
          return (
            <div key={f.id} className="space-y-1">
              {commonLabel}
              <Select
                value={current}
                onValueChange={(v) => setField(f.id, v === "__empty__" ? "" : v)}
                disabled={disabled || submitting || !f.options?.length}
              >
                <SelectTrigger
                  id={`df-${f.id}`}
                  className={cn(
                    "h-9 text-sm",
                    embed ? "border-zinc-600 bg-zinc-950/80 text-zinc-100" : "border-slate-700 bg-slate-900 text-white",
                  )}
                >
                  <SelectValue placeholder={ph || "Choose…"} />
                </SelectTrigger>
                <SelectContent>
                  {opts.map((o) => (
                    <SelectItem key={o.value} value={o.value} disabled={o.value === "__empty__"}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (f.type === "radio") {
          const opts = f.options?.length
            ? f.options
            : [{ value: "__empty__", label: ph || "Add options in the form builder" }];
          const current = String(values[f.id] ?? "");
          const fieldSetClass = embed ? "border-zinc-700/50 bg-zinc-950/40" : "border-slate-700/50 bg-slate-900/40";
          const labelClass = cn("text-sm", embed ? "text-zinc-200" : "text-slate-200");
          return (
            <fieldset key={f.id} disabled={disabled || submitting || !f.options?.length} className="space-y-2">
              <legend className={cn("mb-1 text-xs", embed ? "text-zinc-300" : "text-slate-200")}>
                {label}
                {f.required ? <span className="text-red-400"> *</span> : null}
              </legend>
              <div className={cn("space-y-2 rounded-lg border p-3", fieldSetClass)}>
                {opts.map((o) => {
                  const disabledOpt = o.value === "__empty__";
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-0.5",
                        disabledOpt ? "cursor-not-allowed opacity-60" : "hover:bg-white/5",
                      )}
                    >
                      <input
                        type="radio"
                        name={`df-radio-${f.id}`}
                        value={o.value}
                        checked={!disabledOpt && current === o.value}
                        disabled={disabledOpt}
                        onChange={() => setField(f.id, disabledOpt ? "" : o.value)}
                        className={cn(
                          "h-4 w-4 shrink-0 border-slate-500 bg-slate-900",
                          embed
                            ? "border-zinc-500 text-emerald-500 accent-emerald-500"
                            : "accent-emerald-500",
                        )}
                      />
                      <span className={labelClass}>{o.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        }

        if (f.type === "checkbox") {
          return (
            <div key={f.id} className="flex items-center gap-2 pt-1">
              <Checkbox
                id={`df-${f.id}`}
                checked={values[f.id] === true}
                onCheckedChange={(c) => setField(f.id, c === true)}
                disabled={disabled || submitting}
              />
              <Label htmlFor={`df-${f.id}`} className={cn("text-xs", embed ? "text-zinc-300" : "text-slate-200")}>
                {label}
                {f.required ? <span className="text-red-400"> *</span> : null}
              </Label>
            </div>
          );
        }

        if (f.type === "number") {
          return (
            <div key={f.id} className="space-y-1">
              {commonLabel}
              <Input
                id={`df-${f.id}`}
                type="number"
                inputMode="decimal"
                value={String(values[f.id] ?? "")}
                onChange={(e) => setField(f.id, e.target.value)}
                disabled={disabled || submitting}
                placeholder={ph || undefined}
                className={cn(
                  "h-9 text-sm",
                  embed ? "border-zinc-600 bg-zinc-950/80 text-zinc-100" : "border-slate-700 bg-slate-900 text-white",
                )}
              />
            </div>
          );
        }

        if (f.type === "date") {
          return (
            <div key={f.id} className="space-y-1">
              {commonLabel}
              <Input
                id={`df-${f.id}`}
                type="date"
                value={String(values[f.id] ?? "")}
                onChange={(e) => setField(f.id, e.target.value)}
                disabled={disabled || submitting}
                className={cn(
                  "h-9 text-sm",
                  embed ? "border-zinc-600 bg-zinc-950/80 text-zinc-100" : "border-slate-700 bg-slate-900 text-white",
                )}
              />
            </div>
          );
        }

        if (f.type === "file") {
          const picked = String(values[f.id] ?? "");
          return (
            <div key={f.id} className="space-y-1">
              {commonLabel}
              <Input
                type="file"
                disabled={disabled || submitting}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setField(f.id, file ? file.name : "");
                }}
                className={cn(
                  "h-auto min-h-9 cursor-pointer py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-emerald-500",
                  embed ? "border-zinc-600 bg-zinc-950/80 text-zinc-100" : "border-slate-700 bg-slate-900 text-white",
                )}
              />
              {picked ? (
                <p className={cn("text-xs", embed ? "text-zinc-400" : "text-slate-400")}>Selected: {picked}</p>
              ) : null}
            </div>
          );
        }

        if (f.type === "url") {
          return (
            <div key={f.id} className="space-y-1">
              {commonLabel}
              <Input
                id={`df-${f.id}`}
                type="url"
                autoComplete="url"
                value={String(values[f.id] ?? "")}
                onChange={(e) => setField(f.id, e.target.value)}
                disabled={disabled || submitting}
                placeholder={ph || "https://"}
                className={cn(
                  "h-9 text-sm",
                  embed ? "border-zinc-600 bg-zinc-950/80 text-zinc-100" : "border-slate-700 bg-slate-900 text-white",
                )}
              />
            </div>
          );
        }

        const inputType =
          f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text";
        return (
          <div key={f.id} className="space-y-1">
            {commonLabel}
            <Input
              id={`df-${f.id}`}
              type={inputType}
              value={String(values[f.id] ?? "")}
              onChange={(e) => setField(f.id, e.target.value)}
              disabled={disabled || submitting}
              placeholder={ph || undefined}
              className={cn(
                "h-9 text-sm",
                embed ? "border-zinc-600 bg-zinc-950/80 text-zinc-100" : "border-slate-700 bg-slate-900 text-white",
              )}
            />
          </div>
        );
      })}
      <Button
        type="submit"
        size="sm"
        disabled={disabled || submitting}
        className={
          submitButtonClassName != null && submitButtonClassName !== ""
            ? cn("w-full", submitButtonClassName)
            : cn("w-full", embed ? "bg-emerald-600 hover:bg-emerald-500" : "")
        }
      >
        {submitting ? "Submitting…" : submitLabel}
      </Button>
    </form>
  );
}
