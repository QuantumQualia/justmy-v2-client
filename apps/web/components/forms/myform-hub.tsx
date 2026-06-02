"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MYFORM_QUERY, myFormPathOnly, parseMyFormView } from "@/components/forms/myform-routes";
import { MyFormManagementPanel } from "@/components/forms/myform-management-panel";
import { MyFormNewPanel } from "@/components/forms/myform-new-panel";
import { MyFormEditPanel } from "@/components/forms/myform-edit-panel";
import { MyFormSubmissionsDialog } from "@/components/forms/myform-submissions-dialog";
import { cn } from "@workspace/ui/lib/utils";

export interface MyFormHubProps {
  showHeader?: boolean;
  className?: string;
}

function MyFormHubInner({ showHeader = true, className }: MyFormHubProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = myFormPathOnly(pathname || "/");

  const view = parseMyFormView(searchParams.get(MYFORM_QUERY.view));
  const formId = String(searchParams.get(MYFORM_QUERY.formId) ?? "").trim();

  const submissionsFromQuery = view === "submissions" && Boolean(formId);

  if (view === "new") {
    return <MyFormNewPanel basePath={basePath} />;
  }

  if (view === "edit") {
    if (!formId) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-amber-200">
          Missing <code className="text-white">formId</code> for edit view.{" "}
          <Link className="underline" href={basePath}>
            Back to list
          </Link>
        </div>
      );
    }
    return <MyFormEditPanel basePath={basePath} formId={formId} />;
  }

  if (view === "submissions" && !formId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-amber-200">
        Missing <code className="text-white">formId</code> for submissions.{" "}
        <Link className="underline" href={basePath}>
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <>
      <MyFormManagementPanel showHeader={showHeader} basePath={basePath} className={className} />
      {submissionsFromQuery ? (
        <MyFormSubmissionsDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              router.replace(basePath, { scroll: false });
            }
          }}
          formId={formId}
        />
      ) : null}
    </>
  );
}

/**
 * Full myFORM manager: list, new, edit — driven by URL query params on the **current** page:
 * - `?myform=new`
 * - `?myform=edit&formId=<id>`
 * - `?myform=submissions&formId=<id>` opens the submissions dialog; closing it returns to the list URL.
 *
 * Place `myform-management-block` on a Payload CMS page; the hub uses that page’s pathname for all links.
 */
export function MyFormHub({ showHeader = true, className }: MyFormHubProps) {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "flex items-center justify-center gap-2 py-16 text-sm text-slate-400",
            className,
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      }
    >
      <MyFormHubInner showHeader={showHeader} className={className} />
    </Suspense>
  );
}
