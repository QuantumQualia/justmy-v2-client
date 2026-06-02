"use client";

import { Loader2 } from "lucide-react";

/** Same centered loading pattern as the myFORM forms list (`MyFormManagementPanel`). */
export function FormSubmissionsListLoading({ message = "Loading submissions…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500/80" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
