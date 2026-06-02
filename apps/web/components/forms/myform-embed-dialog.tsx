"use client";

import * as React from "react";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import type { FormDefinitionDto } from "@/lib/services/forms";

function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildPreviewUrl(origin: string, slug: string): string {
  const s = slug.trim();
  if (!origin || !s) {
    return "";
  }
  const q = new URLSearchParams({ slug: s, source: "embed" });
  return `${origin}/embed/myform?${q.toString()}`;
}

function buildScriptSnippet(origin: string, slug: string): string {
  const s = slug.trim();
  if (!origin || !s) {
    return "";
  }
  const cacheBust =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MYFORM_EMBED_SCRIPT_VERSION?.trim()) || "1";
  const src = `${origin}/embed/myform.js?v=${encodeURIComponent(cacheBust)}`;
  return `<script
  src="${escapeHtmlAttr(src)}"
  data-form-slug="${escapeHtmlAttr(s)}"
  async
></script>`;
}

export interface MyFormEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Pick<FormDefinitionDto, "name" | "slug" | "status"> | null;
}

export function MyFormEmbedDialog({ open, onOpenChange, form }: MyFormEmbedDialogProps) {
  const slugOk = Boolean(form?.slug?.trim());
  const published = form?.status === "published";

  const origin = React.useMemo(() => siteOrigin(), [open]);
  const previewUrl = React.useMemo(
    () => (form && slugOk ? buildPreviewUrl(origin, form.slug) : ""),
    [form, origin, slugOk],
  );
  const scriptSnippet = React.useMemo(() => {
    if (!form || !slugOk) {
      return "";
    }
    return buildScriptSnippet(origin, form.slug);
  }, [form, origin, slugOk]);

  const copy = async (text: string, label: string) => {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Link2 className="h-5 w-5 text-emerald-400" />
            Embed myFORM
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Copy the script snippet and paste it into any website HTML (often just before{" "}
            <code className="text-slate-400">&lt;/body&gt;</code>). The script mounts the form **inline** (React in a
            shadow root, like AskSKY — no iframe). Height follows content automatically. Use the preview URL to test the
            full-page embed in a new tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
            <span className="text-slate-500">Form:</span>{" "}
            <span className="font-medium text-white">{form?.name ?? "—"}</span>
            {form?.slug ? (
              <>
                {" "}
                <span className="text-slate-600">·</span>{" "}
                <span className="font-mono text-xs text-slate-400">{form.slug}</span>
              </>
            ) : null}
          </div>

          {!published ? (
            <p className="text-sm text-amber-200">
              Publish this form first — the public embed only serves the latest published version.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="myform-embed-preview" className="text-slate-200">
              Preview URL
            </Label>
            <Textarea
              id="myform-embed-preview"
              readOnly
              rows={3}
              value={previewUrl || "—"}
              className="resize-none border-slate-700 bg-black/40 font-mono text-xs text-slate-200"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-600 bg-slate-900 text-slate-100"
                disabled={!previewUrl}
                onClick={() => copy(previewUrl, "Preview URL")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy preview URL
              </Button>
              {previewUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-slate-900 text-slate-100"
                  asChild
                >
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open preview
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="myform-embed-script" className="text-slate-200">
              Script embed
            </Label>
            <Textarea
              id="myform-embed-script"
              readOnly
              rows={10}
              value={scriptSnippet || "—"}
              className="resize-none border-slate-700 bg-black/40 font-mono text-xs text-slate-200"
            />
            <p className="text-xs leading-relaxed text-slate-500">
              Partners should allow this origin in <code className="text-slate-400">script-src</code>. Submissions from
              this embed are stored with <code className="text-slate-400">source=embed</code>.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-600 bg-slate-900 text-slate-100"
              disabled={!scriptSnippet || !published}
              onClick={() => copy(scriptSnippet, "Script embed")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy script code
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
