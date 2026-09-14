"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, MoreHorizontal } from "lucide-react";
import {
  FUNCTION_APP,
  functionsForApp,
  type FunctionId,
} from "@/lib/functions/registry";
import { cn } from "@workspace/ui/lib/utils";

const MENU_WIDTH = 260;

export function PlanFunctionsMenu({
  disabled,
  paid,
  onRun,
  onLocked,
}: {
  disabled?: boolean;
  paid?: boolean;
  onRun: (id: FunctionId) => void | Promise<void>;
  onLocked?: () => void;
}) {
  const items = functionsForApp(FUNCTION_APP.BATTLE_PLANS);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function place() {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuHeight = (menuRef.current?.offsetHeight || items.length * 40 + 8) + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
      const top = openUp ? rect.top - menuHeight : rect.bottom + 4;
      const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
      setCoords({ top, left });
    }

    place();
    const id = requestAnimationFrame(place);

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onDismiss() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onDismiss);
    document.addEventListener("scroll", onDismiss, true);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onDismiss);
      document.removeEventListener("scroll", onDismiss, true);
    };
  }, [open, items.length]);

  if (!items.length) return null;

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-40"
        aria-label="Functions"
        aria-expanded={open}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((cur) => !cur);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="fixed z-[200] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10"
            >
              {items.map((item) => {
                const locked = Boolean(item.paid && !paid);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-violet-50",
                      locked ? "text-slate-400" : "text-slate-700 hover:text-violet-900",
                      disabled && "pointer-events-none opacity-50",
                    )}
                    onClick={() => {
                      setOpen(false);
                      if (locked) {
                        onLocked?.();
                        return;
                      }
                      void onRun(item.id);
                    }}
                  >
                    <span>{item.label}</span>
                    {locked ? <Lock className="h-3.5 w-3.5 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
