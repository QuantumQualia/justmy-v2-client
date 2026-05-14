"use client";

import * as React from "react";
import { Link2, Copy, ExternalLink } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { resolveAgentPublicIdentifier, type AgentResponseDto } from "@/lib/services/agents";
import type { AskSkyVariant } from "@/components/asksky/asksky-widget";

function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

function buildEmbedUrl(profileSlug: string, agentToken: string, variant: AskSkyVariant): string {
  const origin = siteOrigin();
  if (!origin || !profileSlug.trim() || !agentToken.trim()) {
    return "";
  }
  const params = new URLSearchParams({
    profileSlug: profileSlug.trim(),
    agentToken: agentToken.trim(),
    variant,
  });
  return `${origin}/embed/asksky?${params.toString()}`;
}

function buildIframeSnippet(url: string): string {
  if (!url) return "";
  return `<iframe\n  src="${url}"\n  title="AskSKY"\n  width="100%"\n  height="640"\n  style="border:0;border-radius:12px;max-width:100%;"\n  loading="lazy"\n  allow="clipboard-write"\n></iframe>`;
}

export interface AskSkyStaticEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileSlug: string;
  agent: AgentResponseDto | null;
}

export function AskSkyStaticEmbedDialog({
  open,
  onOpenChange,
  profileSlug,
  agent,
}: AskSkyStaticEmbedDialogProps) {
  const [variant, setVariant] = React.useState<AskSkyVariant>("inline");

  React.useEffect(() => {
    if (open) {
      setVariant("inline");
    }
  }, [open, agent?.id]);

  const publicToken = React.useMemo(() => resolveAgentPublicIdentifier(agent), [agent]);
  const slugOk = Boolean(profileSlug.trim());
  const tokenOk = Boolean(publicToken);
  const embedUrl = React.useMemo(
    () => (slugOk && tokenOk && publicToken ? buildEmbedUrl(profileSlug, publicToken, variant) : ""),
    [profileSlug, publicToken, slugOk, tokenOk, variant],
  );
  const iframeSnippet = React.useMemo(() => buildIframeSnippet(embedUrl), [embedUrl]);

  const copy = async (text: string, label: string) => {
    if (!text) return;
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
            AskSKY static embed
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose how AskSKY should appear, then copy the link or iframe snippet to use on other pages. The URL
            includes <span className="text-slate-300">profileSlug</span>, <span className="text-slate-300">agentToken</span>
            , and <span className="text-slate-300">variant</span> as query parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
            <span className="text-slate-500">Agent:</span>{" "}
            <span className="font-medium text-white">{agent?.name ?? "—"}</span>
          </div>

          {!slugOk ? (
            <p className="text-sm text-amber-200">
              Your active profile has no slug. Open a profile with a slug, then try again.
            </p>
          ) : null}
          {!tokenOk ? (
            <p className="text-sm text-amber-200">
              This agent has no public token or identifier yet. Make the agent public or set a public identifier, then
              try again.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label className="text-slate-200">Interface style</Label>
            <Select
              value={variant}
              onValueChange={(v) => setVariant(v as AskSkyVariant)}
              disabled={!slugOk || !tokenOk}
            >
              <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                <SelectItem value="inline">Embedded inline</SelectItem>
                <SelectItem value="chatbot">Chatbot (floating button)</SelectItem>
                <SelectItem value="voice">Voice line (coming soon)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              The embed page reads these options from the URL. Voice shows a placeholder until audio is available.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asksky-embed-url" className="text-slate-200">
              Page URL
            </Label>
            <Textarea
              id="asksky-embed-url"
              readOnly
              rows={3}
              value={embedUrl || "—"}
              className="resize-none border-slate-700 bg-black/40 font-mono text-xs text-slate-200"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-600 bg-slate-900 text-slate-100"
                disabled={!embedUrl}
                onClick={() => copy(embedUrl, "URL")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
              {embedUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-slate-900 text-slate-100"
                  asChild
                >
                  <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open preview
                  </a>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-slate-900 text-slate-100"
                  disabled
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open preview
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asksky-embed-iframe" className="text-slate-200">
              Iframe embed code
            </Label>
            <Textarea
              id="asksky-embed-iframe"
              readOnly
              rows={6}
              value={iframeSnippet || "—"}
              className="resize-none border-slate-700 bg-black/40 font-mono text-xs text-slate-200"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-600 bg-slate-900 text-slate-100"
              disabled={!iframeSnippet}
              onClick={() => copy(iframeSnippet, "Embed code")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy iframe code
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
