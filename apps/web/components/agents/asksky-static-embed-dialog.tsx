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

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildScriptSnippet(
  origin: string,
  profileSlug: string,
  agentToken: string,
  variant: AskSkyVariant,
): string {
  if (!origin || !profileSlug.trim() || !agentToken.trim()) {
    return "";
  }
  const cacheBust =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ASKSKY_EMBED_SCRIPT_VERSION?.trim()) || "1";
  const src = `${origin}/embed/asksky.js?v=${encodeURIComponent(cacheBust)}`;
  
  return `<script src="${escapeHtmlAttr(src)}" data-profile-slug="${escapeHtmlAttr(profileSlug.trim())}" data-agent-token="${escapeHtmlAttr(agentToken.trim())}" data-variant="${variant}" async ></script>`;
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
  const scriptSnippet = React.useMemo(() => {
    const origin = siteOrigin();
    return slugOk && tokenOk && publicToken
      ? buildScriptSnippet(origin, profileSlug, publicToken, variant)
      : "";
  }, [profileSlug, publicToken, slugOk, tokenOk, variant]);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-white text-foreground shadow-xl dark:bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            AskSKY! static embed
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how AskSKY! should appear, then copy the preview URL or the script snippet. The preview URL uses{" "}
            <span className="text-muted-foreground">profileSlug</span>, <span className="text-muted-foreground">agentToken</span>, and{" "}
            <span className="text-muted-foreground">variant</span> as query parameters; the script embed uses the same values as{" "}
            <span className="text-muted-foreground">data-*</span> attributes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <span className="text-muted-foreground">Agent:</span>{" "}
            <span className="font-medium text-foreground">{agent?.name ?? "—"}</span>
          </div>

          {!slugOk ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Your active profile has no slug. Open a profile with a slug, then try again.
            </p>
          ) : null}
          {!tokenOk ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This agent has no public token or identifier yet. Make the agent public or set a public identifier, then
              try again.
            </p>
          ) : null}

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="asksky-embed-variant" className="text-foreground">
                Interface style
              </Label>
              <Select
                value={variant}
                onValueChange={(v) => setVariant(v as AskSkyVariant)}
                disabled={!slugOk || !tokenOk}
              >
                <SelectTrigger
                  id="asksky-embed-variant"
                  className="h-11 w-full border-input bg-background text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inline">Embedded inline</SelectItem>
                  <SelectItem value="chatbot">Chatbot (floating button)</SelectItem>
                  <SelectItem value="voice">Voice line (coming soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              Voice shows a placeholder until audio is available. For the chatbot style, avoid{" "}
              <code className="text-muted-foreground">overflow: hidden</code> on <code className="text-muted-foreground">body</code>{" "}
              without checking stacking; the launcher uses a high z-index.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asksky-embed-url" className="text-foreground">
              Preview URL
            </Label>
            <Textarea
              id="asksky-embed-url"
              readOnly
              rows={3}
              value={embedUrl || "—"}
              className="resize-none border-input bg-background font-mono text-xs text-foreground"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-input bg-background text-foreground hover:bg-secondary hover:text-foreground"
                disabled={!embedUrl}
                onClick={() => copy(embedUrl, "Preview URL")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy preview URL
              </Button>
              {embedUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-input bg-background text-foreground hover:bg-secondary hover:text-foreground"
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
                  className="border-input bg-background text-foreground hover:bg-secondary hover:text-foreground"
                  disabled
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open preview
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asksky-embed-script" className="text-foreground">
              Script embed
            </Label>
            <Textarea
              id="asksky-embed-script"
              readOnly
              rows={8}
              value={scriptSnippet || "—"}
              className="resize-none border-input bg-background font-mono text-xs text-foreground"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Partners must allow this origin in <span className="text-muted-foreground">script-src</span> (and typically{" "}
              <span className="text-muted-foreground">connect-src</span> to the same host for the AskSKY API proxy). The inline
              variant uses at least <span className="text-muted-foreground">min-height: min(calc(100dvh - 150px), 640px)</span>{" "}
              on the embed host so the chat has room to grow.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-input bg-background text-foreground hover:bg-secondary hover:text-foreground"
              disabled={!scriptSnippet}
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


