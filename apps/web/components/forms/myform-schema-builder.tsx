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
  createDefaultField,
  mergeSchemaWithFields,
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
      return "border-slate-400/35 bg-slate-600/25 text-slate-100";
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
        "focus-visible:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40",
        isDragging && "bg-slate-800/60 shadow-md",
        selected ? "bg-emerald-950/35 ring-1 ring-inset ring-emerald-500/25" : "hover:bg-slate-800/40",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border text-slate-500 transition-colors",
          "border-slate-700/60 bg-slate-900/60 hover:border-slate-600 hover:text-slate-300",
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
          selected ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800/80 text-slate-500",
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
        <p className="truncate text-sm font-medium text-slate-100">
          {field.label || field.id}
          {field.required && field.type !== "header" ? (
            <span className="ml-1 text-amber-400 sm:hidden" aria-hidden>
              *
            </span>
          ) : null}
        </p>
        <p className="truncate font-mono text-[10px] text-slate-500 sm:hidden" title={field.id}>
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
        className="h-8 w-8 shrink-0 text-slate-500 hover:bg-red-950/50 hover:text-red-400"
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
          ? "border-emerald-400/55 bg-slate-800/95 shadow-lg shadow-emerald-950/25 ring-1 ring-emerald-400/25"
          : "border-slate-500/45 bg-slate-800/90 hover:border-slate-400/50 hover:bg-slate-800",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1.5 transition-colors",
          selected ? "bg-emerald-400" : "bg-slate-600/70 group-hover:bg-slate-500",
        )}
        aria-hidden
      />
      <div className="flex gap-3 p-3.5 pl-5 sm:gap-4 sm:p-4 sm:pl-6">
        <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
          <button
            type="button"
            className={cn(
              "flex h-11 w-11 cursor-grab touch-none items-center justify-center rounded-xl border text-slate-400 transition-colors",
              "border-slate-500/50 bg-slate-900/80 hover:border-slate-400/60 hover:bg-slate-900 hover:text-slate-200",
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
                : "border-slate-500/40 bg-slate-900/70 text-slate-300",
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
              className="h-9 w-9 shrink-0 rounded-lg text-slate-400 hover:bg-red-950/60 hover:text-red-300"
              aria-label="Remove field"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="break-words pr-1 text-[15px] font-semibold leading-snug tracking-tight text-white sm:text-base">
            {field.label || field.id}
          </p>
          <p
            className="break-all font-mono text-[11px] leading-relaxed text-slate-400 sm:text-xs"
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
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (fields.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !fields.some((f) => f.id === selectedId)) {
      setSelectedId(fields[0]!.id);
    }
  }, [fields, selectedId]);

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
    "rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-black/20 backdrop-blur-sm";

  const fieldOrderList = (
    <>
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-600/45 bg-slate-950/30 px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/60 text-slate-500">
            <Layers className="h-6 w-6" />
          </div>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-medium text-slate-200">No fields yet</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Use <span className="text-slate-400">Add blocks</span>{" "}
              {preview ? "in the sidebar" : "on the right"} to add headings and inputs.
            </p>
          </div>
        </div>
      ) : preview ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/30">
              <ul className="divide-y divide-slate-800/90">
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
                "flex flex-col gap-3 rounded-xl border border-slate-500/35 bg-slate-950/50 p-3 sm:p-4",
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
      className="overflow-hidden rounded-2xl border border-slate-600/45 bg-slate-900/25 shadow-xl shadow-black/25 ring-1 ring-white/[0.06]"
      aria-label="Form preview and outline"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/55 bg-slate-950/70 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Eye className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-white">Visitor preview</p>
            <p className="text-[11px] leading-snug text-slate-500 sm:text-xs">
              What people see on your page. Use the outline underneath to reorder blocks or pick one to edit.
            </p>
          </div>
        </div>
        {fields.length > 0 ? (
          <span className="shrink-0 rounded-full border border-slate-500/50 bg-slate-800/90 px-2.5 py-1 text-[11px] font-medium text-slate-200">
            {fields.length} block{fields.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="border-b border-slate-700/50 bg-slate-950/40 p-4 sm:p-6">{preview}</div>

      <div className="border-t border-slate-800/80 bg-slate-950/70 px-4 py-3 sm:px-5 sm:py-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 shrink-0 text-slate-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Form outline</h3>
              <p className="text-[11px] leading-snug text-slate-500">
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
              <h3 id="myform-fields-heading" className="text-base font-semibold tracking-tight text-white">
                Form structure
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
                {fields.length === 0
                  ? "Build the flow your visitors will see."
                  : `${fields.length} field${fields.length === 1 ? "" : "s"}. Drag the grip to reorder; click a card to edit it on the right.`}
              </p>
            </div>
            {fields.length > 0 ? (
              <span className="rounded-full border border-slate-500/50 bg-slate-800/90 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm">
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
          <div className="flex items-center gap-2 border-b border-slate-700/40 pb-3">
            <List className="h-4 w-4 text-emerald-400/90" />
            <div>
              <p className="text-sm font-semibold text-white">Add blocks</p>
              <p className="text-[11px] text-slate-500">Click to append to the end of the form</p>
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
                    "flex flex-col items-start gap-1 rounded-xl border border-slate-700/40 bg-slate-950/30 p-3 text-left transition-all",
                    "hover:border-emerald-500/35 hover:bg-emerald-950/20 hover:shadow-md hover:shadow-emerald-950/10",
                    "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-100">{p.label}</span>
                  <span className="line-clamp-2 text-[10px] leading-tight text-slate-500">{p.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center gap-2 border-b border-slate-700/40 pb-3">
            <Type className="h-4 w-4 text-sky-400/90" />
            <div>
              <p className="text-sm font-semibold text-white">Block settings</p>
              <p className="text-[11px] text-slate-500">
                {selected ? `Editing ${selected.type}` : "Select a field from the list"}
              </p>
            </div>
          </div>

          {!selected ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              {preview ? (
                <>
                  Click a row in the <span className="text-slate-400">Form outline</span> (under the preview) to edit
                  labels, placeholders, and validation.
                </>
              ) : (
                <>
                  Click any row in <span className="text-slate-400">Form structure</span> to change labels, placeholders,
                  and validation.
                </>
              )}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400">Internal id</Label>
                <Input
                  readOnly
                  value={selected.id}
                  className="h-9 rounded-xl border-slate-700/60 bg-slate-950/50 font-mono text-xs text-slate-400"
                />
                <p className="text-[10px] text-slate-600">Used in submissions; stable after publish.</p>
              </div>

              <div className="h-px bg-slate-800/80" />

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400">
                  {selected.type === "header" ? "Heading text" : "Label shown to visitors"}
                </Label>
                <Input
                  value={selected.label}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                  className="h-9 rounded-xl border-slate-700/60 bg-slate-950/50 text-sm text-white placeholder:text-slate-600"
                />
              </div>

              {selected.type !== "header" ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-950/30 px-3 py-2.5 transition-colors hover:bg-slate-900/50">
                  <Checkbox
                    checked={Boolean(selected.required)}
                    onCheckedChange={(c) => updateSelected({ required: c === true })}
                    className="border-slate-600"
                  />
                  <span className="text-sm text-slate-200">Required before submit</span>
                </label>
              ) : null}

          {selected.type !== "header" &&
              selected.type !== "checkbox" &&
              selected.type !== "file" &&
              selected.type !== "radio" &&
              selected.type !== "date" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400">Placeholder</Label>
                  <Input
                    value={selected.placeholder ?? ""}
                    onChange={(e) => updateSelected({ placeholder: e.target.value })}
                    placeholder="Optional hint inside the field"
                    className="h-9 rounded-xl border-slate-700/60 bg-slate-950/50 text-sm"
                  />
                </div>
              ) : null}

              {selected.type === "select" || selected.type === "radio" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400">
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
                    className="min-h-[120px] rounded-xl border-slate-700/60 bg-slate-950/50 font-mono text-xs leading-relaxed"
                    spellCheck={false}
                  />
                  <p className="text-[10px] leading-snug text-slate-600">
                    Each line: <code className="text-slate-500">value</code> or{" "}
                    <code className="text-slate-500">value|visible label</code>
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
