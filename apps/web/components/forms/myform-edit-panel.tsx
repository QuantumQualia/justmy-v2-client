"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { MyFormSchemaBuilder } from "@/components/forms/myform-schema-builder";
import { formsService } from "@/lib/services/forms";
import { myFormListHref } from "@/components/forms/myform-routes";
import { MyFormSubmissionsDialog } from "@/components/forms/myform-submissions-dialog";

export interface MyFormEditPanelProps {
  basePath: string;
  formId: string;
}

export function MyFormEditPanel({ basePath, formId }: MyFormEditPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["profile-form", formId],
    queryFn: () => formsService.getProfileForm(formId),
    enabled: Boolean(formId),
  });

  const [name, setName] = React.useState("");
  const [schema, setSchema] = React.useState<Record<string, unknown>>({});
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [submissionsOpen, setSubmissionsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!q.data) {
      return;
    }
    setName(q.data.name);
    setSchema(
      q.data.schema && typeof q.data.schema === "object" && !Array.isArray(q.data.schema)
        ? { ...(q.data.schema as Record<string, unknown>) }
        : {},
    );
  }, [q.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return formsService.updateProfileForm(formId, { name: name.trim(), schema });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-forms"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-form", formId] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const publishMutation = useMutation({
    mutationFn: () => formsService.publishProfileForm(formId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-forms"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-form", formId] });
      toast.success("Published");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Publish failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => formsService.deleteProfileForm(formId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-forms"] });
      toast.success("Form deleted");
      router.push(myFormListHref(basePath));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 text-white md:px-6 md:py-12">
      <div className="mb-8 md:mb-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 h-9 gap-1.5 px-2 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <Link href={myFormListHref(basePath)}>
            <ArrowLeft className="h-4 w-4" />
            All forms
          </Link>
        </Button>

        {q.isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading form…
          </div>
        ) : q.isError || !q.data ? (
          <p className="text-red-300">{q.isError && q.error instanceof Error ? q.error.message : "Not found."}</p>
        ) : (
          <>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Edit form</h1>
                  <Badge
                    variant="secondary"
                    className="border-slate-700/80 bg-slate-800/80 font-normal text-slate-300"
                  >
                    v{q.data.publishedVersion}
                  </Badge>
                  <Badge
                    variant={q.data.status === "published" ? "default" : "outline"}
                    className={
                      q.data.status === "published"
                        ? "border-emerald-500/30 bg-emerald-600/20 text-emerald-200"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-200"
                    }
                  >
                    {q.data.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-slate-500 md:text-sm">{q.data.slug}</p>
              </div>

              <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                <Button
                  type="button"
                  disabled={saveMutation.isPending}
                  className="order-first w-full shadow-lg shadow-emerald-950/30 sm:order-none sm:w-auto"
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? "Saving…" : "Save draft"}
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-700/80 bg-slate-900/50"
                    onClick={() => setSubmissionsOpen(true)}
                  >
                    Submissions
                  </Button>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={publishMutation.isPending || q.data.status === "published"}
                    onClick={() => publishMutation.mutate()}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {publishMutation.isPending ? "Publishing…" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:bg-red-950/30 hover:text-red-400"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {q.isLoading || q.isError || !q.data ? null : (
        <>
          <Card className="overflow-hidden border-slate-800/80 bg-gradient-to-b from-slate-950 to-slate-900/95 shadow-xl shadow-black/30">
            <CardHeader className="border-b border-slate-800/60 bg-slate-950/50 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">Form builder</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-slate-400">
                Preview and field order share one canvas; add blocks and edit details in the sidebar. Save when you are
                ready — changes stay local until then.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-xs font-medium text-slate-400">
                  Form name
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Contact — Memphis"
                  className="h-10 max-w-md rounded-xl border-slate-700/70 bg-slate-900/80 text-base text-white placeholder:text-slate-600"
                />
              </div>
              <MyFormSchemaBuilder
                schema={schema}
                onSchemaChange={setSchema}
                preview={
                  <DynamicForm
                    schema={schema}
                    disabled
                    submitLabel="Submit (preview)"
                    onSubmit={async () => {}}
                  />
                }
              />
            </CardContent>
          </Card>

          <ConfirmDeletionModal
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete this form?"
            description="This cannot be undone. Submissions may be removed depending on backend rules."
            confirmText="Delete form"
            onConfirm={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
          />

          <MyFormSubmissionsDialog
            open={submissionsOpen && Boolean(formId)}
            onOpenChange={setSubmissionsOpen}
            formId={formId}
            formName={q.data?.name}
            schema={
              q.data?.schema && typeof q.data.schema === "object" && !Array.isArray(q.data.schema)
                ? (q.data.schema as Record<string, unknown>)
                : undefined
            }
          />
        </>
      )}
    </div>
  );
}
