"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Bell,
  Eye,
  GripVertical,
  Hash,
  Heading,
  Layers,
  Link2,
  List,
  ListOrdered,
  Mail,
  Phone,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import {
  adminEmailsToLines,
  createDefaultField,
  linesToAdminEmails,
  mergeSchemaWithAdminEmails,
  mergeSchemaWithFields,
  parseAdminEmails,
  parseBuilderFields,
  type MyFormBuilderField,
  type MyFormBuilderFieldType,
} from "@/components/forms/myform-builder-schema";

const PALETTE: {
  type: MyFormBuilderFieldType;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "header", label: "Heading", hint: "Section title", icon: Heading },
  { type: "text", label: "Short text", hint: "Single line", icon: Type },
  { type: "textarea", label: "Long text", hint: "Paragraph", icon: AlignLeft },
  { type: "select", label: "Dropdown", hint: "Pick one option", icon: ChevronDown },
  { type: "email", label: "Email", hint: "Validated email", icon: Mail },
  { type: "phone", label: "Phone", hint: "Tel input", icon: Phone },
  { type: "url", label: "URL", hint: "Web address", icon: Link2 },
  { type: "number", label: "Number", hint: "Numeric value", icon: Hash },
  { type: "date", label: "Date", hint: "Calendar picker", icon: Calendar },
  { type: "radio", label: "Radio", hint: "One of several", icon: CircleDot },
  { type: "checkbox", label: "Checkbox", hint: "Yes / agree", icon: CheckSquare },
  { type: "file", label: "File upload", hint: "Attach a file", icon: Upload },
];

function fieldTypeStyles(type: MyFormBuilderFieldType): string {
  switch (type) {
    case "header":
      return "border-violet-400/35 bg-violet-500/20 text-violet-100";
    case "email":
      return "border-sky-400/35 bg-sky-500/20 text-sky-100";
    case "phone":
      return "border-cyan-400/35 bg-cyan-500/20 text-cyan-100";
    case "url":
      return "border-indigo-400/35 bg-indigo-500/20 text-indigo-100";
    case "number":
      return "border-lime-400/35 bg-lime-500/15 text-lime-100";
    case "date":
      return "border-teal-400/35 bg-teal-500/20 text-teal-100";
    case "file":
      return "border-orange-400/35 bg-orange-500/20 text-orange-100";
    case "textarea":
      return "border-amber-400/35 bg-amber-500/20 text-amber-100";
    case "select":
      return "border-emerald-400/35 bg-emerald-500/20 text-emerald-100";
    case "radio":
      return "border-fuchsia-400/35 bg-fuchsia-500/20 text-fuchsia-100";
    case "checkbox":
      return "border-rose-400/35 bg-rose-500/20 text-rose-100";
    default:
      return "border-border bg-muted text-foreground";
  }
}

function optionsToLines(opts: MyFormBuilderField["options"]): string {
  if (!opts?.length) {
    return "";
  }
  return opts.map((o) => (o.label === o.value ? o.value : `${o.value}|${o.label}`)).join("\n");
}

function linesToOptions(text: string): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) {
      continue;
    }
    const pipe = t.indexOf("|");
    if (pipe >= 0) {
      const value = t.slice(0, pipe).trim();
      const label = t.slice(pipe + 1).trim() || value;
      if (value) {
        out.push({ value, label });
      }
    } else {
      out.push({ value: t, label: t });
    }
  }
  return out;
}

/** Compact one-line row for combined preview + outline (avoids duplicating the big preview cards). */
function SortableFieldOutlineRow({
  field,
  index,
  selected,
  onSelect,
  onRemove,
}: {
  field: MyFormBuilderField;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex items-center gap-2 py-2.5 pl-2 pr-1 outline-none transition-colors sm:gap-3 sm:py-3 sm:pl-3",
        "focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40",
        isDragging && "bg-muted/60 shadow-md",
        selected ? "bg-emerald-950/35 ring-1 ring-inset ring-emerald-500/25" : "hover:bg-accent/40",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border text-muted-foreground transition-colors",
          "border-input bg-card hover:border-border hover:text-muted-foreground",
          "active:cursor-grabbing",
        )}
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold tabular-nums",
          selected ? "bg-emerald-500/20 text-emerald-200" : "bg-muted text-muted-foreground",
        )}
      >
        {index + 1}
      </span>
      <span
        className={cn(
          "hidden shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:inline-flex",
          fieldTypeStyles(field.type),
        )}
      >
        {field.type}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {field.label || field.id}
          {field.required && field.type !== "header" ? (
            <span className="ml-1 text-amber-400 sm:hidden" aria-hidden>
              *
            </span>
          ) : null}
        </p>
        <p className="truncate font-mono text-[10px] text-muted-foreground sm:hidden" title={field.id}>
          {field.type} · {field.id}
        </p>
      </div>
      {field.required && field.type !== "header" ? (
        <span className="hidden shrink-0 text-amber-400/90 sm:inline text-[10px] font-semibold uppercase">Req.</span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-red-950/50 hover:text-red-400"
        aria-label="Remove field"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function SortableFieldRow({
  field,
  index,
  selected,
  onSelect,
  onRemove,
}: {
  field: MyFormBuilderField;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border text-left outline-none transition-[box-shadow,transform,border-color,background-color] duration-200",
        "focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        isDragging && "scale-[1.01] shadow-2xl shadow-black/50",
        selected
          ? "border-emerald-400/55 bg-muted/95 shadow-lg shadow-emerald-950/25 ring-1 ring-emerald-400/25"
          : "border-border bg-muted hover:border-border hover:bg-accent",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 transition-colors",
          selected ? "bg-emerald-400" : "bg-muted-foreground/70 group-hover:bg-muted-foreground",
        )}
        aria-hidden
      />
      <div className="flex gap-3 p-3.5 pl-5 sm:gap-4 sm:p-4 sm:pl-6">
        <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
          <button
            type="button"
            className={cn(
              "flex h-11 w-11 cursor-grab touch-none items-center justify-center rounded-xl border text-muted-foreground transition-colors",
              "border-border bg-card hover:border-border hover:bg-card hover:text-foreground",
              "active:cursor-grabbing",
            )}
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div
            className={cn(
              "flex h-8 min-w-[2rem] items-center justify-center rounded-full border px-2 font-mono text-xs font-bold tabular-nums",
              selected
                ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
                : "border-border bg-card text-muted-foreground",
            )}
            aria-label={`Position ${index + 1}`}
          >
            {index + 1}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={cn(
                  "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  fieldTypeStyles(field.type),
                )}
              >
                {field.type}
              </span>
              {field.required && field.type !== "header" ? (
                <span className="shrink-0 rounded-md border border-amber-400/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                  Required
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-red-950/60 hover:text-red-300"
              aria-label="Remove field"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="break-words pr-1 text-[15px] font-semibold leading-snug tracking-tight text-foreground sm:text-base">
            {field.label || field.id}
          </p>
          <p
            className="break-all font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs"
            title={field.id}
          >
            {field.id}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface MyFormSchemaBuilderProps {
  schema: Record<string, unknown>;
  onSchemaChange: (next: Record<string, unknown>) => void;
  /** When set, preview and field order share one combined panel (e.g. pass `<DynamicForm … />`). */
  preview?: React.ReactNode;
  className?: string;
}

export function MyFormSchemaBuilder({ schema, onSchemaChange, preview, className }: MyFormSchemaBuilderProps) {
  const fields = React.useMemo(() => parseBuilderFields(schema), [schema]);
  const adminEmails = React.useMemo(() => parseAdminEmails(schema), [schema]);
  const adminEmailsKey = adminEmails.join("\n");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adminEmailsDraft, setAdminEmailsDraft] = React.useState("");
  const adminEmailsDraftRef = React.useRef("");

  React.useEffect(() => {
    if (fields.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !fields.some((f) => f.id === selectedId)) {
      setSelectedId(fields[0]!.id);
    }
  }, [fields, selectedId]);

  React.useLayoutEffect(() => {
    adminEmailsDraftRef.current = adminEmailsDraft;
  }, [adminEmailsDraft]);

  React.useEffect(() => {
    setAdminEmailsDraft(adminEmailsKey);
  }, [adminEmailsKey]);

  const commitAdminEmails = React.useCallback(
    (text: string) => {
      const parsed = linesToAdminEmails(text);
      onSchemaChange(mergeSchemaWithAdminEmails(schema, parsed));
      setAdminEmailsDraft(adminEmailsToLines(parsed));
    },
    [onSchemaChange, schema],
  );

  const commit = React.useCallback(
    (next: MyFormBuilderField[]) => {
      onSchemaChange(mergeSchemaWithFields(schema, next));
    },
    [onSchemaChange, schema],
  );

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const fieldsRef = React.useRef(fields);
  fieldsRef.current = fields;

  /** Raw textarea text for select/radio options — avoids stripping trailing newlines on every keystroke. */
  const [choicesDraft, setChoicesDraft] = React.useState("");
  const choicesDraftRef = React.useRef("");
  const activeChoicesFieldIdRef = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    choicesDraftRef.current = choicesDraft;
  }, [choicesDraft]);

  const commitRef = React.useRef(commit);
  commitRef.current = commit;

  React.useEffect(() => {
    const prev = activeChoicesFieldIdRef.current;
    const fieldsNow = fieldsRef.current;
    const cur = fieldsNow.find((f) => f.id === selectedId) ?? null;
    const curIsChoice = Boolean(cur && (cur.type === "select" || cur.type === "radio"));

    if (prev && prev !== selectedId) {
      const prevField = fieldsNow.find((f) => f.id === prev);
      if (prevField && (prevField.type === "select" || prevField.type === "radio")) {
        const text = choicesDraftRef.current;
        commitRef.current(
          fieldsNow.map((f) => (f.id === prev ? { ...f, options: linesToOptions(text) } : f)),
        );
      }
    }

    activeChoicesFieldIdRef.current = curIsChoice && cur ? cur.id : null;

    if (curIsChoice && cur) {
      setChoicesDraft(optionsToLines(cur.options));
    } else {
      setChoicesDraft("");
    }
  }, [selectedId]);

  const updateSelected = (patch: Partial<MyFormBuilderField>) => {
    if (!selected) {
      return;
    }
    const next = fields.map((f) => (f.id === selected.id ? { ...f, ...patch } : f));
    commit(next);
  };

  const addField = (type: MyFormBuilderFieldType) => {
    const row = createDefaultField(type);
    commit([...fields, row]);
    setSelectedId(row.id);
  };

  const removeField = (id: string) => {
    const next = fields.filter((f) => f.id !== id);
    commit(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    commit(arrayMove(fields, oldIndex, newIndex));
  };

  const panelClass =
    "rounded-2xl border border-border bg-gradient-to-b from-card to-muted p-4 shadow-lg shadow-black/20 backdrop-blur-sm";

  const fieldOrderList = (
    <>
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-medium text-foreground">No fields yet</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use <span className="text-muted-foreground">Add blocks</span>{" "}
              {preview ? "in the sidebar" : "on the right"} to add headings and inputs.
            </p>
          </div>
        </div>
      ) : preview ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              <ul className="divide-y divide-border/90">
                {fields.map((f, i) => (
                  <li key={f.id}>
                    <SortableFieldOutlineRow
                      field={f}
                      index={i}
                      selected={f.id === selectedId}
                      onSelect={() => setSelectedId(f.id)}
                      onRemove={() => removeField(f.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ul
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-muted p-3 sm:p-4",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ring-1 ring-white/[0.05]",
              )}
            >
              {fields.map((f, i) => (
                <li key={f.id}>
                  <SortableFieldRow
                    field={f}
                    index={i}
                    selected={f.id === selectedId}
                    onSelect={() => setSelectedId(f.id)}
                    onRemove={() => removeField(f.id)}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </>
  );

  const combinedCanvas = preview ? (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/25 ring-1 ring-white/[0.06]"
      aria-label="Form preview and outline"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Eye className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground">Visitor preview</p>
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
              What people see on your page. Use the outline underneath to reorder blocks or pick one to edit.
            </p>
          </div>
        </div>
        {fields.length > 0 ? (
          <span className="shrink-0 rounded-full border border-border bg-muted/90 px-2.5 py-1 text-[11px] font-medium text-foreground">
            {fields.length} block{fields.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="border-b border-border bg-muted p-4 sm:p-6">{preview}</div>

      <div className="border-t border-border/80 bg-muted px-4 py-3 sm:px-5 sm:py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Form outline</h3>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Quick reorder · select a row to edit in the sidebar
              </p>
            </div>
          </div>
        </div>
        {fieldOrderList}
      </div>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] xl:items-start xl:gap-8",
        className,
      )}
    >
      {preview ? (
        <div className="order-1 min-w-0">{combinedCanvas}</div>
      ) : (
        <section className="order-1 min-w-0 space-y-4" aria-labelledby="myform-fields-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="myform-fields-heading" className="text-base font-semibold tracking-tight text-foreground">
                Form structure
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {fields.length === 0
                  ? "Build the flow your visitors will see."
                  : `${fields.length} field${fields.length === 1 ? "" : "s"}. Drag the grip to reorder; click a card to edit it on the right.`}
              </p>
            </div>
            {fields.length > 0 ? (
              <span className="rounded-full border border-border bg-muted/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                {fields.length} in form
              </span>
            ) : null}
          </div>
          {fieldOrderList}
        </section>
      )}

      {/* Toolbox — add + properties */}
      <aside className="order-2 flex flex-col gap-4 xl:sticky xl:top-4">
        <div className={panelClass}>
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Bell className="h-4 w-4 text-amber-400/90" />
            <div>
              <p className="text-sm font-semibold text-foreground">Submission notifications</p>
              <p className="text-[11px] text-muted-foreground">Email admins when someone submits this form</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="myform-admin-emails" className="text-xs font-medium text-muted-foreground">
              Admin emails
            </Label>
            <Textarea
              id="myform-admin-emails"
              value={adminEmailsDraft}
              onChange={(e) => setAdminEmailsDraft(e.target.value)}
              onBlur={() => commitAdminEmails(adminEmailsDraftRef.current)}
              placeholder={"one per line, e.g.\nadmin@example.com\nleads@example.com"}
              className="min-h-[88px] rounded-xl border-input bg-muted font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground"
              spellCheck={false}
            />
            <p className="text-[10px] leading-snug text-muted-foreground">
              {adminEmails.length === 0
                ? "Leave empty to skip email notifications."
                : `${adminEmails.length} recipient${adminEmails.length === 1 ? "" : "s"} will be notified.`}
            </p>
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <List className="h-4 w-4 text-emerald-400/90" />
            <div>
              <p className="text-sm font-semibold text-foreground">Add blocks</p>
              <p className="text-[11px] text-muted-foreground">Click to append to the end of the form</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PALETTE.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => addField(p.type)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border border-border/40 bg-muted p-3 text-left transition-all",
                    "hover:border-emerald-500/35 hover:bg-emerald-950/20 hover:shadow-md hover:shadow-emerald-950/10",
                    "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{p.label}</span>
                  <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{p.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Type className="h-4 w-4 text-sky-400/90" />
            <div>
              <p className="text-sm font-semibold text-foreground">Block settings</p>
              <p className="text-[11px] text-muted-foreground">
                {selected ? `Editing ${selected.type}` : "Select a field from the list"}
              </p>
            </div>
          </div>

          {!selected ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {preview ? (
                <>
                  Click a row in the <span className="text-muted-foreground">Form outline</span> (under the preview) to edit
                  labels, placeholders, and validation.
                </>
              ) : (
                <>
                  Click any row in <span className="text-muted-foreground">Form structure</span> to change labels, placeholders,
                  and validation.
                </>
              )}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Internal id</Label>
                <Input
                  readOnly
                  value={selected.id}
                  className="h-9 rounded-xl border-input bg-muted font-mono text-xs text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground">Used in submissions; stable after publish.</p>
              </div>

              <div className="h-px bg-muted" />

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {selected.type === "header" ? "Heading text" : "Label shown to visitors"}
                </Label>
                <Input
                  value={selected.label}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                  className="h-9 rounded-xl border-input bg-muted text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {selected.type !== "header" ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-muted px-3 py-2.5 transition-colors hover:bg-accent">
                  <Checkbox
                    checked={Boolean(selected.required)}
                    onCheckedChange={(c) => updateSelected({ required: c === true })}
                    className="border-border"
                  />
                  <span className="text-sm text-foreground">Required before submit</span>
                </label>
              ) : null}

          {selected.type !== "header" &&
              selected.type !== "checkbox" &&
              selected.type !== "file" &&
              selected.type !== "radio" &&
              selected.type !== "date" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Placeholder</Label>
                  <Input
                    value={selected.placeholder ?? ""}
                    onChange={(e) => updateSelected({ placeholder: e.target.value })}
                    placeholder="Optional hint inside the field"
                    className="h-9 rounded-xl border-input bg-muted text-sm"
                  />
                </div>
              ) : null}

              {selected.type === "select" || selected.type === "radio" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {selected.type === "radio" ? "Radio options" : "Dropdown choices"}
                  </Label>
                  <Textarea
                    value={choicesDraft}
                    onChange={(e) => setChoicesDraft(e.target.value)}
                    onBlur={() => {
                      if (!selected || (selected.type !== "select" && selected.type !== "radio")) {
                        return;
                      }
                      const text = choicesDraftRef.current;
                      const parsed = linesToOptions(text);
                      updateSelected({ options: parsed });
                      setChoicesDraft(optionsToLines(parsed));
                    }}
                    placeholder={"one per line, e.g.\nfree|Free tier\npro|Pro tier"}
                    className="min-h-[120px] rounded-xl border-input bg-muted font-mono text-xs leading-relaxed"
                    spellCheck={false}
                  />
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Each line: <code className="text-muted-foreground">value</code> or{" "}
                    <code className="text-muted-foreground">value|visible label</code>
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
