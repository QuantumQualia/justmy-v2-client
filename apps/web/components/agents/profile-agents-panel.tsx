"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bot,
  Download,
  FileText,
  Globe,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Progress } from "@workspace/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";
import { AgentLeadsDialog } from "@/components/agents/agent-leads-dialog";
import { AskSkyStaticEmbedDialog } from "@/components/agents/asksky-static-embed-dialog";
import { DataTable } from "@/components/ui/data-table";
import { TagInput } from "@/components/ui/tag-input";
import { agentQueryKeys } from "@/lib/query/agent-query-keys";
import {
  agentsService,
  buildShareTrayPayload,
  LIVE_SEARCH_DOMAINS_MAX,
  normalizeLiveSearchDomains,
  normalizeShareTray,
  resolveAgentPublicIdentifier,
  SHARE_TRAY_CHANNELS,
  SHARE_TRAY_CLOSING_MESSAGE_MAX,
  SHARE_TRAY_READY_LABEL_MAX,
  SHARE_TRAY_SHARE_TEXT_MAX,
  type AgentResponseDto,
  type AgentShareTrayChannel,
  type CreateAgentDto,
  type CreateWebsiteKnowledgeSourceDto,
  type KnowledgeIngestionStatus,
  type KnowledgeSourcesPageDto,
  type KnowledgeScope,
  type KnowledgeSourceResponseDto,
  type KnowledgeSourceType,
  type UpdateAgentDto,
  type UploadDocumentKnowledgeSourceDto,
} from "@/lib/services/agents";
import { formsService } from "@/lib/services/forms";
import { useProfileStore } from "@/lib/store";
import { cn } from "@workspace/ui/lib/utils";

const INGESTING_STATUSES = new Set<KnowledgeIngestionStatus>(["pending", "queued", "processing"]);
const KNOWLEDGE_PAGE_SIZE = 5;
const AGENTS_PAGE_SIZE = 10;
/** Poll individual ingesting knowledge sources (GET by id) so progress bars stay current. */
const KNOWLEDGE_INGESTION_POLL_MS = 5_000;
/** `--accent` is a saturated orange; do not use it as a hover fill on management chrome. */
const outlineControlClass =
  "border-input bg-background text-foreground hover:bg-secondary hover:text-foreground";
const insetSurfaceClass = "border-border bg-background dark:bg-muted/40";

type IngestingPollTarget = {
  id: string;
  scope: KnowledgeScope;
  agentId: string | null;
};

function patchKnowledgeSourceInCache(
  queryClient: QueryClient,
  updatedSource: KnowledgeSourceResponseDto,
): void {
  queryClient.setQueriesData<KnowledgeSourcesPageDto>(
    { queryKey: agentQueryKeys.knowledge() },
    (old) => {
      if (!old?.sources?.length) {
        return old;
      }
      const idx = old.sources.findIndex((s) => s.id === updatedSource.id);
      if (idx === -1) {
        return old;
      }
      const nextSources = [...old.sources];
      nextSources[idx] = { ...nextSources[idx], ...updatedSource };
      return { ...old, sources: nextSources };
    },
  );
}

function collectIngestingPollTargets(
  sources: KnowledgeSourceResponseDto[],
  scope: KnowledgeScope,
  fallbackAgentId: string | null,
): IngestingPollTarget[] {
  const targets: IngestingPollTarget[] = [];
  for (const source of sources) {
    if (!INGESTING_STATUSES.has(source.status)) {
      continue;
    }
    targets.push({
      id: source.id,
      scope,
      agentId: scope === "agent" ? source.agentId ?? fallbackAgentId : null,
    });
  }
  return targets;
}

async function fetchKnowledgeSourceStatus(
  target: IngestingPollTarget,
): Promise<KnowledgeSourceResponseDto> {
  if (target.scope === "agent") {
    const agentId = target.agentId?.trim();
    if (!agentId) {
      throw new Error("Agent id is required to poll agent knowledge source.");
    }
    return agentsService.getAgentKnowledgeSource(agentId, target.id);
  }
  return agentsService.getKnowledgeSource(target.id);
}

function canReindexKnowledgeSource(source: KnowledgeSourceResponseDto, busy: boolean): boolean {
  if (busy || INGESTING_STATUSES.has(source.status)) {
    return false;
  }
  return source.sourceType === "website";
}

function canDownloadDocumentKnowledgeSource(source: KnowledgeSourceResponseDto, busy: boolean): boolean {
  if (source.sourceType !== "document") {
    return false;
  }
  
  if (busy || INGESTING_STATUSES.has(source.status)) {
    return false;
  }
  return Boolean(source.s3Key?.trim());
}

function suggestedKnowledgeDocumentFileName(source: KnowledgeSourceResponseDto): string {
  const raw = (source.fileName || source.title || "document").trim();
  const base = raw.replace(/^.*[/\\]/, "").trim() || "document";
  if (/\.[a-z0-9]{2,8}$/i.test(base)) {
    return base;
  }
  const mime = source.mimeType?.toLowerCase() ?? "";
  if (mime.includes("pdf")) {
    return `${base}.pdf`;
  }
  if (mime.includes("wordprocessingml") || mime.includes("msword")) {
    return `${base}.docx`;
  }
  if (mime.includes("text/plain")) {
    return `${base}.txt`;
  }
  return `${base}.pdf`;
}

/**
 * Fetches a remote URL (e.g. S3 presigned) and saves it via a blob URL so the browser uses the File Save flow
 * instead of navigating / inline PDF view.
 */
async function downloadFileFromHttpUrl(url: string, downloadFileName: string): Promise<void> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = downloadFileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function resolvePagesScraped(source: KnowledgeSourceResponseDto): number | null {
  if (typeof source.pagesScraped === "number" && Number.isFinite(source.pagesScraped)) {
    return Math.max(0, Math.round(source.pagesScraped));
  }
  return null;
}

/** Website crawl progress while ingestion is in flight (uses API pagesScraped / maxPages). */
function websiteScrapeProgress(source: KnowledgeSourceResponseDto): {
  percent: number;
  scraped: number;
  max: number;
} | null {
  if (source.sourceType !== "website") {
    return null;
  }
  if (!INGESTING_STATUSES.has(source.status)) {
    return null;
  }
  const max = source.maxPages;
  if (typeof max !== "number" || !Number.isFinite(max) || max <= 0) {
    return null;
  }
  const scraped = resolvePagesScraped(source) ?? 0;
  const percent = Math.max(0, Math.min(100, Math.round((scraped / max) * 100)));
  return { percent, scraped, max };
}

function isCompletedKnowledgeStatus(status: KnowledgeIngestionStatus): boolean {
  return status === "completed";
}

function knowledgeIngestionProgressValue(percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent));
  return clamped > 0 ? Math.max(clamped, 2) : 0;
}

function KnowledgeIngestionProgress({
  value,
  variant,
  "aria-valuetext": ariaValueText,
}: {
  value: number;
  variant: "website" | "document";
  "aria-valuetext"?: string;
}) {
  return (
    <Progress
      value={knowledgeIngestionProgressValue(value)}
      aria-valuetext={ariaValueText}
      className={cn(
        "mt-3 h-2 w-full min-w-0 border border-border bg-muted shadow-inner",
        variant === "website"
          ? "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-blue-600 [&_[data-slot=progress-indicator]]:to-sky-500"
          : "[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-emerald-600 [&_[data-slot=progress-indicator]]:to-emerald-400",
      )}
    />
  );
}

/** Scraped page count for completed website or document knowledge sources. */
function scrapedPagesDescription(source: KnowledgeSourceResponseDto): string | null {
  if (!isCompletedKnowledgeStatus(source.status)) {
    return null;
  }

  const scraped = resolvePagesScraped(source);
  if (scraped === null) {
    return null;
  }

  return `${scraped} page${scraped === 1 ? "" : "s"} scraped`;
}

type AgentDialogState = {
  open: boolean;
  mode: "create" | "edit";
  agent: AgentResponseDto | null;
};

type KnowledgeDialogState = {
  open: boolean;
  scope: KnowledgeScope;
  sourceType: KnowledgeSourceType;
  agentId: string | null;
};

type KnowledgeSubmissionPayload = {
  scope: KnowledgeScope;
  sourceType: KnowledgeSourceType;
  agentId: string | null;
  url: string;
  file: File | null;
  /** Website crawl limit; ignored for document uploads. */
  maxPages?: number;
};

function formatDateTime(value?: string): string {
  if (!value) {
    return "Not yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeProgress(progress?: number | null): number | null {
  if (typeof progress !== "number" || Number.isNaN(progress)) {
    return null;
  }

  if (progress <= 1) {
    return Math.max(0, Math.min(100, Math.round(progress * 100)));
  }

  return Math.max(0, Math.min(100, Math.round(progress)));
}

function statusBadgeClass(status: KnowledgeIngestionStatus): string {
  switch (status) {
    case "completed":
    case "ready":
    case "indexed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "failed":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300";
    case "pending":
    case "queued":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300";
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function ingestionStatusLabel(status: KnowledgeIngestionStatus): string {
  const key = String(status).trim();
  if (!key) {
    return "";
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function sourceTypeLabel(sourceType: KnowledgeSourceType): string {
  return sourceType === "website" ? "Website" : "Document";
}

function stripFileExtension(filename: string): string {
  return filename.replace(/\.[^./\\]+$/, "");
}

function resolveKnowledgeSourceLabels(source: KnowledgeSourceResponseDto): {
  primaryLabel: string;
  secondaryLabel: string | null;
} {
  const title = source.title?.trim() ?? "";

  if (source.sourceType === "document") {
    const fileName = source.fileName?.trim() ?? "";
    const displayFileName = fileName ? stripFileExtension(fileName).trim() || fileName : "";
    const safeTitle = title && title.toLowerCase() !== "(anonymous)" ? title : "";

    return {
      primaryLabel: displayFileName || safeTitle || `${sourceTypeLabel(source.sourceType)} source`,
      secondaryLabel: fileName || null,
    };
  }

  return {
    primaryLabel: title || source.url || `${sourceTypeLabel(source.sourceType)} source`,
    secondaryLabel: source.url?.trim() || null,
  };
}

function scopeLabel(scope: KnowledgeScope): string {
  return scope === "shared" ? "Shared profile knowledge" : "Agent-specific knowledge";
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="min-w-0 max-w-full rounded-br-none border-border bg-white py-0 shadow-sm dark:bg-card">
      <CardHeader className="gap-1 border-b border-border/80 py-4">
        <CardDescription className="text-muted-foreground">{title}</CardDescription>
        <CardTitle className="text-2xl text-foreground">{value}</CardTitle>
      </CardHeader>
      <CardContent className="py-4 text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

function AgentFormDialog({
  state,
  onOpenChange,
  onSubmit,
  submitting,
  publishedForms,
  formsLoading,
}: {
  state: AgentDialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateAgentDto | UpdateAgentDto) => Promise<void>;
  submitting: boolean;
  publishedForms: { id: number; name: string }[];
  formsLoading: boolean;
}) {
  const [name, setName] = React.useState("");
  const [greetingMessage, setGreetingMessage] = React.useState("");
  const [customPromptText, setCustomPromptText] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isPublic, setIsPublic] = React.useState(true);
  const [contactFormKey, setContactFormKey] = React.useState<string>("__none__");
  const [liveSearchEnabled, setLiveSearchEnabled] = React.useState(true);
  const [liveSearchDomains, setLiveSearchDomains] = React.useState<string[]>([]);
  const [shareTrayEnabled, setShareTrayEnabled] = React.useState(false);
  const [shareTrayReadyLabel, setShareTrayReadyLabel] = React.useState("");
  const [shareTrayClosingMessage, setShareTrayClosingMessage] = React.useState("");
  const [shareTrayShareUrl, setShareTrayShareUrl] = React.useState("");
  const [shareTrayShareText, setShareTrayShareText] = React.useState("");
  const [shareTrayChannels, setShareTrayChannels] = React.useState<AgentShareTrayChannel[]>([
    ...SHARE_TRAY_CHANNELS,
  ]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!state.open) {
      return;
    }

    setName(state.agent?.name ?? "");
    setGreetingMessage(state.agent?.greetingMessage ?? "");
    setCustomPromptText(state.agent?.customPromptText ?? "");
    setIsActive(state.agent?.isActive ?? true);
    setIsPublic(state.agent?.isPublic ?? true);
    const cf = state.agent?.contactFormId;
    setContactFormKey(typeof cf === "number" && Number.isFinite(cf) ? String(cf) : "__none__");
    setLiveSearchEnabled(state.agent?.liveSearchEnabled ?? true);
    setLiveSearchDomains(
      Array.isArray(state.agent?.liveSearchDomains) ? [...state.agent.liveSearchDomains] : [],
    );
    const tray = normalizeShareTray(state.agent?.shareTray);
    setShareTrayEnabled(tray?.enabled === true);
    setShareTrayReadyLabel(tray?.readyLabel ?? "");
    setShareTrayClosingMessage(tray?.closingMessage ?? "");
    setShareTrayShareUrl(tray?.shareUrl ?? "");
    setShareTrayShareText(tray?.shareText ?? "");
    setShareTrayChannels(
      tray?.channels && tray.channels.length > 0 ? [...tray.channels] : [...SHARE_TRAY_CHANNELS],
    );
    setError(null);
  }, [state]);

  const publicIdentifier = resolveAgentPublicIdentifier(state.agent);

  const toggleShareTrayChannel = (channel: AgentShareTrayChannel, checked: boolean) => {
    setShareTrayChannels((prev) => {
      if (checked) {
        return prev.includes(channel) ? prev : [...prev, channel];
      }
      return prev.filter((c) => c !== channel);
    });
  };

  const handleLiveSearchDomainsChange = (tags: string[]) => {
    const { domains, rejected } = normalizeLiveSearchDomains(tags, LIVE_SEARCH_DOMAINS_MAX);
    setLiveSearchDomains(domains);
    if (rejected.length > 0) {
      setError(
        `Skipped invalid domains (no wildcards; hostnames only, max ${LIVE_SEARCH_DOMAINS_MAX}): ${rejected
          .slice(0, 3)
          .join(", ")}${rejected.length > 3 ? "…" : ""}`,
      );
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Agent name is required.");
      return;
    }

    const { domains: normalizedDomains, rejected } = normalizeLiveSearchDomains(
      liveSearchDomains,
      LIVE_SEARCH_DOMAINS_MAX,
    );
    if (rejected.length > 0) {
      setError(
        `Remove invalid domains before saving: ${rejected.slice(0, 3).join(", ")}${
          rejected.length > 3 ? "…" : ""
        }`,
      );
      return;
    }

    let shareTrayPayload: ReturnType<typeof buildShareTrayPayload>;
    try {
      shareTrayPayload = buildShareTrayPayload({
        enabled: shareTrayEnabled,
        readyLabel: shareTrayReadyLabel,
        closingMessage: shareTrayClosingMessage,
        shareUrl: shareTrayShareUrl,
        shareText: shareTrayShareText,
        channels: shareTrayChannels,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid share tray settings.");
      return;
    }

    setError(null);

    const contactFormId = contactFormKey === "__none__" ? null : Number(contactFormKey);

    try {
      await onSubmit({
        name: trimmedName,
        greetingMessage: greetingMessage.trim() || null,
        customPromptText: customPromptText.trim() || null,
        isActive,
        isPublic,
        contactFormId,
        liveSearchEnabled,
        liveSearchDomains: normalizedDomains,
        shareTray: shareTrayPayload,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent.");
    }
  };

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!submitting) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-border bg-white text-foreground shadow-xl dark:bg-card sm:max-w-2xl"
        onPointerDownOutside={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{state.mode === "create" ? "Create agent" : "Edit agent"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set the agent name, activation state, and optional greeting or custom prompt for this profile.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-foreground">
                Agent name
              </Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Sales Concierge"
                className="border-input bg-background text-foreground"
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-active" className="text-foreground">
                Status
              </Label>
              <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-background px-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-muted-foreground"}`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <Switch
                  id="agent-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={submitting}
                  className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-greeting-message" className="text-foreground">
              Greeting message <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="agent-greeting-message"
              value={greetingMessage}
              onChange={(event) => setGreetingMessage(event.target.value)}
              placeholder="Shown when visitors open AskSKY! before they send a message."
              className="min-h-24 border-input bg-background text-foreground"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-custom-prompt" className="text-foreground">
              Custom prompt text <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="agent-custom-prompt"
              value={customPromptText}
              onChange={(event) => setCustomPromptText(event.target.value)}
              placeholder="Leave blank to use the shared/default prompt behavior from the backend."
              className="min-h-40 border-input bg-background text-foreground"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-contact-form" className="text-foreground">
              AskSKY contact form <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select
              value={contactFormKey}
              onValueChange={setContactFormKey}
              disabled={submitting || formsLoading}
            >
              <SelectTrigger
                id="agent-contact-form"
                className="border-input bg-background text-foreground"
              >
                <SelectValue
                  placeholder={formsLoading ? "Loading forms…" : "No form"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {publishedForms.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only published myFORM definitions can be linked. Visitors see it inside AskSKY as an optional lead
              capture card.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Label htmlFor="agent-live-search" className="text-foreground">
                  Enable live web search when knowledge base has no answer
                </Label>
                <p className="text-xs text-muted-foreground">
                  Sky searches the web when your uploaded knowledge has no match. On by default for new agents. Leave
                  domains empty for the open web, or add hosts to restrict the search.
                </p>
              </div>
              <Switch
                id="agent-live-search"
                checked={liveSearchEnabled}
                onCheckedChange={setLiveSearchEnabled}
                disabled={submitting}
                className="mt-0.5 shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input"
              />
            </div>

            <div className={cn("space-y-2", !liveSearchEnabled && "opacity-60")}>
              <TagInput
                id="agent-live-search-domains"
                label={`Allowed domains${liveSearchEnabled ? " (optional filter)" : ""}`}
                value={liveSearchDomains}
                onChange={handleLiveSearchDomainsChange}
                placeholder="justmy.com, electionshelbytn.gov"
                disabled={submitting}
                splitPaste
                inputClassName="border-border bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Optional. Paste URLs or hostnames (max {LIVE_SEARCH_DOMAINS_MAX}) to limit search to those sites.
                Leave empty to search the open web. Wildcards like{" "}
                <span className="font-mono">*.com</span> are rejected. Examples:{" "}
                <span className="font-mono">justmy.com</span>,{" "}
                <span className="font-mono">justmymemphis.com</span>,{" "}
                <span className="font-mono">electionshelbytn.gov</span>.
              </p>
              {liveSearchDomains.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {liveSearchDomains.length} / {LIVE_SEARCH_DOMAINS_MAX} domains
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Label htmlFor="agent-share-tray" className="text-foreground">
                  Post-answer share tray
                </Label>
                <p className="text-xs text-muted-foreground">
                  After each answer, AskSKY always shows &quot;Ask Another Question&quot;. When this is on, it
                  also shows a Ready CTA that opens a share tray (SMS, WhatsApp, Facebook, X).
                </p>
              </div>
              <Switch
                id="agent-share-tray"
                checked={shareTrayEnabled}
                onCheckedChange={setShareTrayEnabled}
                disabled={submitting}
                className="mt-0.5 shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input"
              />
            </div>

            <div className={cn("space-y-3", !shareTrayEnabled && "opacity-60")}>
              <div className="space-y-2">
                <Label htmlFor="agent-share-ready-label" className="text-foreground">
                  Ready button label{shareTrayEnabled ? " (required)" : ""}
                </Label>
                <Input
                  id="agent-share-ready-label"
                  value={shareTrayReadyLabel}
                  onChange={(event) => setShareTrayReadyLabel(event.target.value)}
                  placeholder="I'm Ready to Vote!"
                  maxLength={SHARE_TRAY_READY_LABEL_MAX}
                  className="border-input bg-background text-foreground"
                  disabled={submitting || !shareTrayEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-share-closing" className="text-foreground">
                  Closing message <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="agent-share-closing"
                  value={shareTrayClosingMessage}
                  onChange={(event) => setShareTrayClosingMessage(event.target.value)}
                  placeholder="Awesome! Knowledge is power—now let's use it to move Shelby County forward…"
                  maxLength={SHARE_TRAY_CLOSING_MESSAGE_MAX}
                  className="min-h-20 border-input bg-background text-foreground"
                  disabled={submitting || !shareTrayEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-share-url" className="text-foreground">
                  Share URL{shareTrayEnabled ? " (required)" : ""}
                </Label>
                <Input
                  id="agent-share-url"
                  value={shareTrayShareUrl}
                  onChange={(event) => setShareTrayShareUrl(event.target.value)}
                  placeholder="https://justmymemphis.com/election2026"
                  className="border-input bg-background text-foreground"
                  disabled={submitting || !shareTrayEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-share-text" className="text-foreground">
                  Share text{shareTrayEnabled ? " (required)" : ""}
                </Label>
                <Textarea
                  id="agent-share-text"
                  value={shareTrayShareText}
                  onChange={(event) => setShareTrayShareText(event.target.value)}
                  placeholder="I just used AskSKY! to map out my voter card…"
                  maxLength={SHARE_TRAY_SHARE_TEXT_MAX}
                  className="min-h-24 border-input bg-background text-foreground"
                  disabled={submitting || !shareTrayEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Prefills SMS / WhatsApp / X. The share URL is appended automatically if it is not already in
                  the text.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-foreground">Channels</p>
                <div className="flex flex-wrap gap-4">
                  {SHARE_TRAY_CHANNELS.map((channel) => {
                    const id = `agent-share-channel-${channel}`;
                    const checked = shareTrayChannels.includes(channel);
                    const label =
                      channel === "sms"
                        ? "SMS"
                        : channel === "whatsapp"
                          ? "WhatsApp"
                          : channel === "facebook"
                            ? "Facebook"
                            : "X";
                    return (
                      <label key={channel} htmlFor={id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          id={id}
                          checked={checked}
                          disabled={submitting || !shareTrayEnabled}
                          onCheckedChange={(value) => toggleShareTrayChannel(channel, value === true)}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {publicIdentifier ? (
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Public identifier
              </p>
              <p className="mt-1 font-mono text-sm text-emerald-700 dark:text-emerald-300">{publicIdentifier}</p>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className={outlineControlClass}
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : state.mode === "create" ? (
                "Create agent"
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KnowledgeSourceDialog({
  state,
  submitting,
  onOpenChange,
  onSubmit,
}: {
  state: KnowledgeDialogState;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: KnowledgeSubmissionPayload) => Promise<void>;
}) {
  const [url, setUrl] = React.useState("");
  const [maxPagesStr, setMaxPagesStr] = React.useState("50");
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const documentRequiredError = "Choose a document to upload.";

  React.useEffect(() => {
    if (!state.open) {
      return;
    }

    setUrl("");
    setMaxPagesStr("50");
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [state]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let validatedWebsiteMaxPages: number | null = null;

    if (state.scope === "agent" && !state.agentId) {
      setError("Choose an agent with the dropdown in the agent-specific knowledge panel first.");
      return;
    }

    if (state.sourceType === "website") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setError("Website URL is required.");
        return;
      }

      try {
        new URL(trimmedUrl);
      } catch {
        setError("Enter a valid website URL.");
        return;
      }

      const trimmedMax = maxPagesStr.trim();
      const parsedMax = Number(trimmedMax);
      if (!Number.isFinite(parsedMax) || !Number.isInteger(parsedMax) || parsedMax < 1) {
        setError("Max pages must be a whole number of at least 1.");
        return;
      }
      validatedWebsiteMaxPages = parsedMax;
    }

    if (state.sourceType === "document" && !file) {
      setError(documentRequiredError);
      return;
    }

    if (state.sourceType === "document" && file && file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }

    setError(null);

    const payloadAgentId = state.scope === "agent" ? state.agentId : null;

    await onSubmit({
      scope: state.scope,
      sourceType: state.sourceType,
      agentId: payloadAgentId,
      url,
      file,
      ...(state.sourceType === "website" && validatedWebsiteMaxPages !== null
        ? { maxPages: validatedWebsiteMaxPages }
        : {}),
    });
  };

  const dialogTitle =
    state.sourceType === "website" ? "Add website knowledge" : "Upload document knowledge";

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!submitting) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent
        className="border-border bg-white text-foreground shadow-xl dark:bg-card sm:max-w-xl"
        onPointerDownOutside={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (submitting) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {scopeLabel(state.scope)} will be available according to the scope you choose here.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && error !== documentRequiredError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {state.sourceType === "website" ? (
            <div className="space-y-2">
              <Label htmlFor="knowledge-url" className="text-foreground">
                Website URL
              </Label>
              <Input
                id="knowledge-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/docs"
                className="border-input bg-background text-foreground"
                disabled={submitting}
              />
              <div className="space-y-2">
                <Label htmlFor="knowledge-max-pages" className="text-foreground">
                  Max pages
                </Label>
                <Input
                  id="knowledge-max-pages"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={maxPagesStr}
                  onChange={(event) => setMaxPagesStr(event.target.value)}
                  placeholder="50"
                  className="border-input bg-background text-foreground"
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="knowledge-file" className="text-foreground">
                Document
              </Label>
              <input
                id="knowledge-file"
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={submitting}
                aria-invalid={error === documentRequiredError}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  if (selectedFile && error === documentRequiredError) {
                    setError(null);
                  }
                }}
              />
              <div
                className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 ${
                  error === documentRequiredError
                    ? "border-destructive bg-background"
                    : "border-border bg-background"
                }`}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-border bg-secondary text-foreground hover:bg-secondary/80 hover:text-foreground"
                  disabled={submitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose file
                </Button>
                <span className={`truncate text-sm ${file ? "text-foreground" : "text-muted-foreground"}`}>
                  {file?.name ?? "No file chosen"}
                </span>
              </div>
              {error === documentRequiredError ? (
                <p className="text-xs text-destructive">{documentRequiredError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">PDF only (application/pdf).</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className={outlineControlClass}
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : state.sourceType === "website" ? (
                "Submit website"
              ) : (
                "Upload document"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KnowledgeSourcesCard({
  title,
  description,
  scope,
  sources,
  page,
  limit,
  total,
  selectedAgent,
  loading,
  error,
  onAddWebsite,
  onUploadDocument,
  onReindex,
  onDownloadDocument,
  onDelete,
  onPageChange,
  selectedAgentId,
  onSelectedAgentChange,
  availableAgents,
  reindexingSourceId,
  downloadingSourceId,
  deletingSourceId,
}: {
  title: string;
  description: string;
  scope: KnowledgeScope;
  sources: KnowledgeSourceResponseDto[];
  page: number;
  limit: number;
  total: number;
  selectedAgent: AgentResponseDto | null;
  loading: boolean;
  error: string | null;
  onAddWebsite: () => void;
  onUploadDocument: () => void;
  onReindex: (source: KnowledgeSourceResponseDto) => void;
  onDownloadDocument: (source: KnowledgeSourceResponseDto) => void;
  onDelete: (source: KnowledgeSourceResponseDto) => void;
  onPageChange: (page: number) => void;
  selectedAgentId: string | null;
  onSelectedAgentChange: (agentId: string) => void;
  availableAgents: AgentResponseDto[];
  reindexingSourceId: string | null;
  downloadingSourceId: string | null;
  deletingSourceId: string | null;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : rangeStart + sources.length - 1;

  return (
    <Card
      id={scope === "agent" ? "agent-knowledge-panel" : undefined}
      className={
        scope === "agent"
          ? "scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden rounded-br-none border-border bg-white py-0 shadow-sm dark:bg-card"
          : "w-full min-w-0 max-w-full overflow-x-hidden rounded-br-none border-border bg-white py-0 shadow-sm dark:bg-card"
      }
    >
      <CardHeader className="min-w-0 gap-3 border-b border-border/80 px-4 py-5 sm:px-6">
        <div className="grid min-w-0 gap-3 lg:min-h-[152px] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CardTitle className="min-w-0 break-words text-foreground">{title}</CardTitle>
              <Badge
                variant="outline"
                className={
                  scope === "shared"
                    ? "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300"
                    : "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-300"
                }
              >
                {scope === "shared" ? "Shared" : "Agent-specific"}
              </Badge>
            </div>
            <CardDescription className="max-w-full min-w-0 text-balance text-muted-foreground sm:max-w-2xl">
              {description}
            </CardDescription>
            {scope === "agent" && selectedAgent ? (
              <div className={`rounded-lg ${insetSurfaceClass} px-3 py-2 text-xs text-muted-foreground`}>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium text-foreground">{selectedAgent.name}</span>
                  {resolveAgentPublicIdentifier(selectedAgent) ? (
                    <span className="break-all font-mono text-emerald-700 dark:text-emerald-300">
                      {resolveAgentPublicIdentifier(selectedAgent)}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3">
            {scope === "agent" ? (
              <div className="w-full space-y-2">
                <Select
                  value={selectedAgentId ?? ""}
                  onValueChange={onSelectedAgentChange}
                  disabled={!availableAgents.length}
                >
                  <SelectTrigger className="border-input bg-background text-foreground">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-white text-foreground dark:bg-popover">
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-center ${outlineControlClass}`}
                onClick={onAddWebsite}
                disabled={scope === "agent" && !selectedAgent}
              >
                <Globe className="h-4 w-4" />
                Add website
              </Button>
              <Button
                type="button"
                variant="success"
                className="w-full justify-center"
                onClick={onUploadDocument}
                disabled={scope === "agent" && !selectedAgent}
              >
                <Upload className="h-4 w-4" />
                Upload document
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-w-0 space-y-3 px-4 py-5 sm:px-6">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading knowledge sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            {scope === "shared"
              ? "No shared knowledge sources yet."
              : selectedAgent
                ? `No knowledge sources for ${selectedAgent.name} yet.`
                : "Create an agent first to manage agent-specific knowledge."}
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => {
              const progress = normalizeProgress(source.progress);
              const busy =
                reindexingSourceId === source.id ||
                downloadingSourceId === source.id ||
                deletingSourceId === source.id;
              const { primaryLabel, secondaryLabel } = resolveKnowledgeSourceLabels(source);
              const scrape = websiteScrapeProgress(source);
              const scrapedPagesLabel = scrapedPagesDescription(source);

              return (
                <div
                  key={source.id}
                  className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-white p-3 dark:bg-muted/30 sm:p-4"
                >
                  <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="break-words text-sm font-semibold text-foreground sm:truncate">{primaryLabel}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {sourceTypeLabel(source.sourceType)}
                        </Badge>
                        <Badge variant="outline" className={statusBadgeClass(source.status)}>
                          {ingestionStatusLabel(source.status)}
                        </Badge>
                      </div>

                      {secondaryLabel ? (
                        <p className="break-all text-xs text-muted-foreground">{secondaryLabel}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {source.agentName && scope === "shared" ? (
                          <span>{source.agentName}</span>
                        ) : null}
                        {scrapedPagesLabel ? (
                          <span className="tabular-nums text-muted-foreground">{scrapedPagesLabel}</span>
                        ) : null}
                        <span>Updated {formatDateTime(source.updatedAt ?? source.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex w-full min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end">
                      {source.sourceType === "document" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`w-full shrink-0 ${outlineControlClass} sm:w-auto`}
                          onClick={() => onDownloadDocument(source)}
                          disabled={!canDownloadDocumentKnowledgeSource(source, busy)}
                        >
                          {downloadingSourceId === source.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Download
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`w-full shrink-0 ${outlineControlClass} sm:w-auto`}
                          onClick={() => onReindex(source)}
                          disabled={!canReindexKnowledgeSource(source, busy)}
                        >
                          {reindexingSourceId === source.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Reindex
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full shrink-0 sm:w-auto"
                        onClick={() => onDelete(source)}
                        disabled={busy}
                      >
                        {deletingSourceId === source.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>

                  {scrape ? (
                    <KnowledgeIngestionProgress
                      variant="website"
                      value={scrape.percent}
                      aria-valuetext={scrapedPagesLabel ?? `${scrape.scraped} pages scraped`}
                    />
                  ) : typeof progress === "number" ? (
                    <KnowledgeIngestionProgress
                      variant="document"
                      value={progress}
                      aria-valuetext={`${progress}%`}
                    />
                  ) : null}
                </div>
              );
            })}

            {totalPages > 1 ? (
              <div className="flex min-w-0 flex-col gap-3 border-t border-border px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 text-xs text-muted-foreground">
                  Showing {rangeStart}-{rangeEnd} of {total}
                </p>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 self-stretch sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={outlineControlClass}
                    onClick={() => onPageChange(page - 1)}
                    disabled={loading || page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="min-w-20 text-center text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={outlineControlClass}
                    onClick={() => onPageChange(page + 1)}
                    disabled={loading || page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface ProfileAgentsPanelProps {
  profileName?: string;
}

export function ProfileAgentsPanel({
  profileName: profileNameProp,
}: ProfileAgentsPanelProps = {}) {
  const profileNameFromStore = useProfileStore((state) => state.data.name);
  const profileSlug = useProfileStore((state) => String(state.data.slug ?? "").trim());
  const profileName = profileNameProp ?? profileNameFromStore;
  const queryClient = useQueryClient();

  const [agentDialogState, setAgentDialogState] = React.useState<AgentDialogState>({
    open: false,
    mode: "create",
    agent: null,
  });
  const [knowledgeDialogState, setKnowledgeDialogState] = React.useState<KnowledgeDialogState>({
    open: false,
    scope: "shared",
    sourceType: "website",
    agentId: null,
  });
  const [selectedAgentId, setSelectedAgentId] = React.useState<string | null>(null);
  const [agentsPage, setAgentsPage] = React.useState(1);
  const [sharedKnowledgePage, setSharedKnowledgePage] = React.useState(1);
  const [agentKnowledgePage, setAgentKnowledgePage] = React.useState(1);
  const [deleteAgentTarget, setDeleteAgentTarget] = React.useState<AgentResponseDto | null>(null);
  const [deleteSourceTarget, setDeleteSourceTarget] = React.useState<KnowledgeSourceResponseDto | null>(null);
  const [reindexSourceTarget, setReindexSourceTarget] =
    React.useState<KnowledgeSourceResponseDto | null>(null);
  const [askSkyEmbedAgent, setAskSkyEmbedAgent] = React.useState<AgentResponseDto | null>(null);
  const [askSkyLeadsAgent, setAskSkyLeadsAgent] = React.useState<AgentResponseDto | null>(null);

  const agentsQuery = useQuery({
    queryKey: agentQueryKeys.agents(),
    queryFn: () => agentsService.listProfileAgents(),
  });

  const formsQuery = useQuery({
    queryKey: ["profile-forms", "agents-picker", 100, 0],
    queryFn: () => formsService.listProfileForms({ take: 100, skip: 0 }),
  });

  const publishedForms = React.useMemo(
    () =>
      (formsQuery.data?.forms ?? [])
        .filter((f) => f.status === "published")
        .map((f) => ({ id: f.id, name: f.name })),
    [formsQuery.data],
  );

  const leadsFormName = React.useMemo(() => {
    if (!askSkyLeadsAgent || typeof askSkyLeadsAgent.contactFormId !== "number") {
      return null;
    }
    return (formsQuery.data?.forms ?? []).find((f) => f.id === askSkyLeadsAgent.contactFormId)?.name ?? null;
  }, [askSkyLeadsAgent, formsQuery.data]);

  const leadsFormSchema = React.useMemo((): Record<string, unknown> | null => {
    if (!askSkyLeadsAgent || typeof askSkyLeadsAgent.contactFormId !== "number") {
      return null;
    }
    const f = (formsQuery.data?.forms ?? []).find((x) => x.id === askSkyLeadsAgent.contactFormId);
    const sch = f?.schema;
    return sch && typeof sch === "object" && !Array.isArray(sch) ? sch : null;
  }, [askSkyLeadsAgent, formsQuery.data]);

  const sharedKnowledgeQuery = useQuery({
    queryKey: agentQueryKeys.knowledgeShared(sharedKnowledgePage, KNOWLEDGE_PAGE_SIZE),
    queryFn: () =>
      agentsService.listProfileKnowledgeSources({
        page: sharedKnowledgePage,
        limit: KNOWLEDGE_PAGE_SIZE,
      }),
  });

  const agentKnowledgeQuery = useQuery({
    queryKey: agentQueryKeys.knowledgeAgent(
      selectedAgentId ?? "none",
      agentKnowledgePage,
      KNOWLEDGE_PAGE_SIZE,
    ),
    queryFn: () =>
      selectedAgentId
        ? agentsService.listAgentKnowledgeSources(selectedAgentId, {
            page: agentKnowledgePage,
            limit: KNOWLEDGE_PAGE_SIZE,
          })
        : Promise.resolve({
            sources: [],
            total: 0,
            page: agentKnowledgePage,
            limit: KNOWLEDGE_PAGE_SIZE,
          }),
    enabled: Boolean(selectedAgentId),
  });

  const allAgents = agentsQuery.data ?? [];
  const agentsTotal = allAgents.length;
  const agents = React.useMemo(() => {
    const start = (agentsPage - 1) * AGENTS_PAGE_SIZE;
    return allAgents.slice(start, start + AGENTS_PAGE_SIZE);
  }, [allAgents, agentsPage]);
  const sharedPageData = sharedKnowledgeQuery.data;
  const agentPageData = agentKnowledgeQuery.data;
  const sharedSources = sharedPageData?.sources ?? [];
  const agentSpecificSources = agentPageData?.sources ?? [];
  const sharedSourcesTotal = sharedPageData?.total ?? 0;
  const agentSourcesTotal = agentPageData?.total ?? 0;

  React.useEffect(() => {
    if (!allAgents.length) {
      setSelectedAgentId(null);
      return;
    }

    if (!selectedAgentId) {
      setSelectedAgentId(allAgents[0]?.id ?? null);
      return;
    }

    const stillExists = allAgents.some((agent) => agent.id === selectedAgentId);
    if (!stillExists) {
      setSelectedAgentId(allAgents[0]?.id ?? null);
    }
  }, [allAgents, selectedAgentId]);

  React.useEffect(() => {
    const maxAgentsPage = Math.max(1, Math.ceil(agentsTotal / AGENTS_PAGE_SIZE));
    if (agentsPage > maxAgentsPage) {
      setAgentsPage(maxAgentsPage);
    }
  }, [agentsPage, agentsTotal]);

  React.useEffect(() => {
    setAgentKnowledgePage(1);
  }, [selectedAgentId]);

  React.useEffect(() => {
    const maxSharedPage = Math.max(1, Math.ceil(sharedSourcesTotal / KNOWLEDGE_PAGE_SIZE));
    if (sharedKnowledgePage > maxSharedPage) {
      setSharedKnowledgePage(maxSharedPage);
    }
  }, [sharedKnowledgePage, sharedSourcesTotal]);

  React.useEffect(() => {
    const maxAgentPage = Math.max(1, Math.ceil(agentSourcesTotal / KNOWLEDGE_PAGE_SIZE));
    if (agentKnowledgePage > maxAgentPage) {
      setAgentKnowledgePage(maxAgentPage);
    }
  }, [agentKnowledgePage, agentSourcesTotal]);

  const ingestingPollSignature = React.useMemo(() => {
    const sharedTargets = collectIngestingPollTargets(sharedSources, "shared", null);
    const agentTargets = collectIngestingPollTargets(
      agentSpecificSources,
      "agent",
      selectedAgentId,
    );
    return [...sharedTargets, ...agentTargets]
      .map((t) => `${t.scope}:${t.agentId ?? ""}:${t.id}`)
      .sort()
      .join("|");
  }, [sharedSources, agentSpecificSources, selectedAgentId]);

  const knowledgeListsRef = React.useRef({
    sharedSources,
    agentSpecificSources,
    selectedAgentId,
  });
  knowledgeListsRef.current = { sharedSources, agentSpecificSources, selectedAgentId };

  React.useEffect(() => {
    if (!ingestingPollSignature) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const { sharedSources: shared, agentSpecificSources: agent, selectedAgentId: agentId } =
        knowledgeListsRef.current;
      const targets = [
        ...collectIngestingPollTargets(shared, "shared", null),
        ...collectIngestingPollTargets(agent, "agent", agentId),
      ];
      if (targets.length === 0) {
        return;
      }

      await Promise.all(
        targets.map(async (target) => {
          try {
            const updated = await fetchKnowledgeSourceStatus(target);
            if (!cancelled) {
              patchKnowledgeSourceInCache(queryClient, updated);
            }
          } catch {
            // ignore transient poll errors
          }
        }),
      );
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, KNOWLEDGE_INGESTION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [ingestingPollSignature, queryClient]);

  const scrapedCountEnrichSignature = React.useMemo(() => {
    return [...sharedSources, ...agentSpecificSources]
      .filter((s) => isCompletedKnowledgeStatus(s.status) && resolvePagesScraped(s) === null)
      .map((s) => `${s.scope}:${s.scope === "agent" ? (s.agentId ?? selectedAgentId ?? "") : ""}:${s.id}`)
      .sort()
      .join("|");
  }, [sharedSources, agentSpecificSources, selectedAgentId]);

  const enrichedScrapedCountIdsRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    enrichedScrapedCountIdsRef.current.clear();
  }, [sharedKnowledgePage, agentKnowledgePage, selectedAgentId]);

  React.useEffect(() => {
    if (!scrapedCountEnrichSignature) {
      return;
    }

    const candidates = [...sharedSources, ...agentSpecificSources].filter(
      (s) =>
        isCompletedKnowledgeStatus(s.status) &&
        resolvePagesScraped(s) === null &&
        !enrichedScrapedCountIdsRef.current.has(s.id),
    );

    if (!candidates.length) {
      return;
    }

    let cancelled = false;

    void (async () => {
      for (const source of candidates) {
        if (cancelled) {
          return;
        }

        enrichedScrapedCountIdsRef.current.add(source.id);

        const agentId = source.scope === "agent" ? source.agentId ?? selectedAgentId : null;
        if (source.scope === "agent" && !agentId) {
          enrichedScrapedCountIdsRef.current.delete(source.id);
          continue;
        }

        try {
          const updated =
            source.scope === "agent" && agentId
              ? await agentsService.getAgentKnowledgeSource(agentId, source.id)
              : await agentsService.getKnowledgeSource(source.id);

          if (!cancelled && resolvePagesScraped(updated) !== null) {
            patchKnowledgeSourceInCache(queryClient, updated);
          }
        } catch {
          enrichedScrapedCountIdsRef.current.delete(source.id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scrapedCountEnrichSignature, queryClient, sharedSources, agentSpecificSources, selectedAgentId]);

  const invalidateProfileAgentData = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.agents() }),
      queryClient.invalidateQueries({ queryKey: agentQueryKeys.knowledge() }),
    ]);
  }, [queryClient]);

  const saveAgentMutation = useMutation({
    mutationFn: async ({
      mode,
      agentId,
      values,
    }: {
      mode: "create" | "edit";
      agentId?: string;
      values: CreateAgentDto | UpdateAgentDto;
    }) => {
      if (mode === "create") {
        return agentsService.createProfileAgent(values as CreateAgentDto);
      }

      if (!agentId) {
        throw new Error("Agent id is required.");
      }

      return agentsService.updateProfileAgent(agentId, values as UpdateAgentDto);
    },
    onSuccess: async (_, variables) => {
      await invalidateProfileAgentData();
      setAgentDialogState({ open: false, mode: "create", agent: null });
      toast.success(variables.mode === "create" ? "Agent created" : "Agent updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save agent");
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await agentsService.deleteProfileAgent(agentId);
    },
    onSuccess: async () => {
      await invalidateProfileAgentData();
      toast.success("Agent deleted");
      setDeleteAgentTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete agent");
    },
  });

  const createWebsiteSourceMutation = useMutation({
    mutationFn: async (values: CreateWebsiteKnowledgeSourceDto) => {
      return agentsService.createWebsiteKnowledgeSource(values);
    },
    onSuccess: async () => {
      await invalidateProfileAgentData();
      setKnowledgeDialogState((current) => ({ ...current, open: false }));
      toast.success("Website source submitted", {
        description:
          "Feel free to navigate away—we’ll keep crawling and indexing in the background. You can return here anytime to check status.",
        duration: 10_000,
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit website source");
    },
  });

  const uploadDocumentSourceMutation = useMutation({
    mutationFn: async (values: UploadDocumentKnowledgeSourceDto) => {
      return agentsService.uploadDocumentKnowledgeSource(values);
    },
    onSuccess: async () => {
      await invalidateProfileAgentData();
      setKnowledgeDialogState((current) => ({ ...current, open: false }));
      toast.success("Document uploaded", {
        description:
          "Your file finished uploading. Feel free to navigate away. We'll keep processing and indexing in the background. You can return here anytime to check status.",
        duration: 10_000,
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to upload document source");
    },
  });

  const reindexSourceMutation = useMutation({
    mutationFn: async (source: KnowledgeSourceResponseDto) => {
      return agentsService.reindexKnowledgeSource(source);
    },
    onSuccess: async (updatedSource) => {
      await queryClient.cancelQueries({ queryKey: agentQueryKeys.knowledge() });
      patchKnowledgeSourceInCache(queryClient, updatedSource);
      toast.success("Reindex started");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to reindex source");
    },
  });

  const downloadKnowledgeSourceMutation = useMutation({
    mutationFn: async (source: KnowledgeSourceResponseDto) => {
      const downloadUrl = await agentsService.getDocumentKnowledgeSourcePresignedDownloadUrl(source);
      if (typeof window === "undefined") {
        return;
      }
      try {
        await downloadFileFromHttpUrl(downloadUrl, suggestedKnowledgeDocumentFileName(source));
        toast.success("Download started");
      } catch {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
        toast.message("Opened in a new tab", {
          description:
            "Direct download was blocked (often CORS on the file URL). Use your browser's Save option from the viewer if needed.",
        });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to get download link");
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (source: KnowledgeSourceResponseDto) => {
      await agentsService.deleteKnowledgeSource(source);
    },
    onSuccess: async () => {
      await invalidateProfileAgentData();
      toast.success("Knowledge source deleted");
      setDeleteSourceTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete knowledge source");
    },
  });

  const selectedAgent = React.useMemo(
    () => allAgents.find((agent) => agent.id === selectedAgentId) ?? null,
    [allAgents, selectedAgentId],
  );

  const agentsTotalPages = Math.max(1, Math.ceil(agentsTotal / AGENTS_PAGE_SIZE));
  const agentsRangeStart = agentsTotal === 0 ? 0 : (agentsPage - 1) * AGENTS_PAGE_SIZE + 1;
  const agentsRangeEnd = agentsTotal === 0 ? 0 : agentsRangeStart + agents.length - 1;

  const pendingIngestionCount = React.useMemo(() => {
    const combined = [...sharedSources, ...agentSpecificSources];
    return combined.filter((source) => INGESTING_STATUSES.has(source.status)).length;
  }, [sharedSources, agentSpecificSources]);

  const perAgentSourceCounts = React.useMemo(() => {
    const counts = new Map<string, number>();

    for (const source of agentSpecificSources) {
      if (source.scope !== "agent" || !source.agentId) {
        continue;
      }

      counts.set(source.agentId, (counts.get(source.agentId) ?? 0) + 1);
    }

    return counts;
  }, [agentSpecificSources]);

  const openKnowledgeDialog = React.useCallback(
    (scope: KnowledgeScope, sourceType: KnowledgeSourceType) => {
      setKnowledgeDialogState({
        open: true,
        scope,
        sourceType,
        agentId: scope === "agent" ? selectedAgentId : null,
      });
    },
    [selectedAgentId],
  );

  const handleKnowledgeSubmit = React.useCallback(
    async (payload: KnowledgeSubmissionPayload) => {
      if (payload.sourceType === "website") {
        await createWebsiteSourceMutation.mutateAsync({
          scope: payload.scope,
          agentId: payload.agentId,
          url: payload.url.trim(),
          maxPages: payload.maxPages ?? 50,
        });
        return;
      }

      if (!payload.file) {
        throw new Error("A document file is required.");
      }

      await uploadDocumentSourceMutation.mutateAsync({
        scope: payload.scope,
        agentId: payload.agentId,
        file: payload.file,
      });
    },
    [createWebsiteSourceMutation, uploadDocumentSourceMutation],
  );

  const agentColumns = React.useMemo<ColumnDef<AgentResponseDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Agent",
        cell: ({ row }) => {
          const agent = row.original;
          const liveSearchDomainCount = agent.liveSearchDomains?.length ?? 0;
          return (
            <div className="min-w-[220px] space-y-1">
              <p className="font-medium text-foreground">{agent.name}</p>
              <p className="text-xs text-muted-foreground">
                {agent.customPromptText?.trim()
                  ? "Custom prompt configured"
                  : "Using default prompt behavior"}
              </p>
              {agent.liveSearchEnabled ? (
                <Badge
                  variant="outline"
                  className="border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300"
                >
                  {liveSearchDomainCount > 0
                    ? `Live search · ${liveSearchDomainCount} domain${
                        liveSearchDomainCount === 1 ? "" : "s"
                      }`
                    : "Live search"}
                </Badge>
              ) : null}
              {agent.shareTray?.enabled ? (
                <Badge
                  variant="outline"
                  className="border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300"
                >
                  Share tray
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "border-border bg-muted text-muted-foreground"
            }
          >
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "knowledge",
        header: "Private knowledge",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {countLabel(
              row.original.privateKnowledgeSourceCount ?? perAgentSourceCounts.get(row.original.id) ?? 0,
              "source",
            )}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.original.updatedAt ?? row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const agent = row.original;

          return (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={outlineControlClass}
                onClick={() =>
                  setAgentDialogState({
                    open: true,
                    mode: "edit",
                    agent,
                  })
                }
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={outlineControlClass}
                disabled={typeof agent.contactFormId !== "number"}
                title={
                  typeof agent.contactFormId === "number"
                    ? "View submissions for this agent’s linked form"
                    : "Link a published myFORM in Edit to track AskSKY leads"
                }
                onClick={() => setAskSkyLeadsAgent(agent)}
              >
                <FileText className="h-4 w-4" />
                Leads
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={outlineControlClass}
                disabled={!agent.isActive}
                title={
                  agent.isActive
                    ? "Build a shareable AskSKY! embed link"
                    : "Activate this agent before generating an embed link"
                }
                onClick={() => setAskSkyEmbedAgent(agent)}
              >
                <Link2 className="h-4 w-4" />
                Embed
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeleteAgentTarget(agent)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [perAgentSourceCounts],
  );

  const agentsError =
    agentsQuery.error instanceof Error ? agentsQuery.error.message : null;
  const knowledgeError =
    sharedKnowledgeQuery.error instanceof Error
      ? sharedKnowledgeQuery.error.message
      : agentKnowledgeQuery.error instanceof Error
        ? agentKnowledgeQuery.error.message
        : null;

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <AgentFormDialog
        state={agentDialogState}
        onOpenChange={(open) => {
          setAgentDialogState((current) =>
            open ? current : { open: false, mode: "create", agent: null },
          );
        }}
        onSubmit={async (values) => {
          await saveAgentMutation.mutateAsync({
            mode: agentDialogState.mode,
            agentId: agentDialogState.agent?.id,
            values,
          });
        }}
        submitting={saveAgentMutation.isPending}
        publishedForms={publishedForms}
        formsLoading={formsQuery.isPending}
      />

      <AgentLeadsDialog
        open={askSkyLeadsAgent != null}
        agent={askSkyLeadsAgent}
        formName={leadsFormName}
        linkedFormSchema={leadsFormSchema}
        onOpenChange={(open) => {
          if (!open) {
            setAskSkyLeadsAgent(null);
          }
        }}
      />

      <AskSkyStaticEmbedDialog
        open={askSkyEmbedAgent != null}
        onOpenChange={(open) => {
          if (!open) {
            setAskSkyEmbedAgent(null);
          }
        }}
        profileSlug={profileSlug}
        agent={askSkyEmbedAgent}
      />

      <KnowledgeSourceDialog
        state={knowledgeDialogState}
        submitting={
          createWebsiteSourceMutation.isPending || uploadDocumentSourceMutation.isPending
        }
        onOpenChange={(open) =>
          setKnowledgeDialogState((current) => ({ ...current, open }))
        }
        onSubmit={handleKnowledgeSubmit}
      />

      <ConfirmDeletionModal
        open={deleteAgentTarget != null}
        onOpenChange={(open) => {
          if (!deleteAgentMutation.isPending && !open) {
            setDeleteAgentTarget(null);
          }
        }}
        onConfirm={() => {
          if (!deleteAgentTarget) {
            return Promise.resolve();
          }

          return deleteAgentMutation.mutateAsync(deleteAgentTarget.id);
        }}
        loading={deleteAgentMutation.isPending}
        title="Delete agent?"
        description={
          <span>
            Delete{" "}
            <span className="font-medium text-foreground">
              {deleteAgentTarget?.name ?? "this agent"}
            </span>
            . Agent-specific knowledge sources may also be removed depending on backend rules.
          </span>
        }
        confirmText="Delete agent"
        loadingConfirmText="Deleting..."
      />

      <ConfirmDeletionModal
        open={deleteSourceTarget != null}
        onOpenChange={(open) => {
          if (!deleteSourceMutation.isPending && !open) {
            setDeleteSourceTarget(null);
          }
        }}
        onConfirm={() => {
          if (!deleteSourceTarget) {
            return Promise.resolve();
          }

          return deleteSourceMutation.mutateAsync(deleteSourceTarget);
        }}
        loading={deleteSourceMutation.isPending}
        title="Delete knowledge source?"
        description={
          <span>
            Delete{" "}
            <span className="font-medium text-foreground">
              {deleteSourceTarget?.title ||
                deleteSourceTarget?.fileName ||
                deleteSourceTarget?.url ||
                "this source"}
            </span>
            . This cannot be undone.
          </span>
        }
        confirmText="Delete source"
        loadingConfirmText="Deleting..."
      />

      <ConfirmDeletionModal
        open={reindexSourceTarget != null}
        onOpenChange={(open) => {
          if (!reindexSourceMutation.isPending && !open) {
            setReindexSourceTarget(null);
          }
        }}
        onConfirm={async () => {
          if (!reindexSourceTarget) {
            return;
          }

          await reindexSourceMutation.mutateAsync(reindexSourceTarget);
        }}
        loading={reindexSourceMutation.isPending}
        title="Reindex knowledge source?"
        description={
          <span>
            This will start a new crawl for{" "}
            <span className="font-medium text-foreground">
              {reindexSourceTarget?.title ||
                reindexSourceTarget?.fileName ||
                reindexSourceTarget?.url ||
                "this source"}
            </span>
            . This may refresh existing indexed content depending on backend rules.
          </span>
        }
        confirmText="Reindex"
        loadingConfirmText="Starting..."
        danger={false}
      />

      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-foreground">Agents and knowledge base</h2>
            <p className="text-sm text-balance text-muted-foreground">
              Manage multiple agents for {profileName || "this profile"}, set optional
              prompts, and track shared versus agent-specific ingestion.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Agents"
          value={String(agentsTotal)}
          description={countLabel(
            allAgents.filter((agent) => agent.isActive).length,
            "active agent",
          )}
        />
        <StatCard
          title="Shared sources"
          value={String(sharedSourcesTotal)}
          description="Available to every agent in this profile."
        />
        <StatCard
          title="Ingestion in progress"
          value={String(pendingIngestionCount)}
          description="Queued or processing knowledge sources currently being indexed."
        />
      </div>

      <Card className="min-w-0 max-w-full overflow-x-hidden rounded-br-none border-border bg-white py-0 shadow-sm dark:bg-card">
        <CardHeader className="border-b border-border/80 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-foreground">Agent management</CardTitle>
              <CardDescription className="max-w-2xl text-muted-foreground">
                Create, edit, deactivate, or delete agents. Use <span className="text-muted-foreground">Embed</span> to build
                a shareable AskSKY! page URL (with <span className="text-muted-foreground">profileSlug</span>,{" "}
                <span className="text-muted-foreground">agentToken</span>, and <span className="text-muted-foreground">variant</span>
                ) for iframes or other sites. Public identifiers are what AskSKY! needs to resolve the agent.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="success"
              onClick={() =>
                setAgentDialogState({
                  open: true,
                  mode: "create",
                  agent: null,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Create agent
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 py-5">
          <DataTable
            columns={agentColumns}
            data={agents}
            loading={agentsQuery.isPending}
            error={agentsError}
            emptyMessage="No agents yet. Create the first one to start configuring multi-agent behavior."
          />
          {agentsTotalPages > 1 ? (
            <div className="flex min-w-0 flex-col gap-3 border-t border-border px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-xs text-muted-foreground">
                Showing {agentsRangeStart}-{agentsRangeEnd} of {agentsTotal}
              </p>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 self-stretch sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={outlineControlClass}
                  onClick={() => setAgentsPage((current) => Math.max(1, current - 1))}
                  disabled={agentsQuery.isPending || agentsPage <= 1}
                >
                  Previous
                </Button>
                <span className="min-w-20 text-center text-xs text-muted-foreground">
                  Page {agentsPage} of {agentsTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={outlineControlClass}
                  onClick={() => setAgentsPage((current) => current + 1)}
                  disabled={agentsQuery.isPending || agentsPage >= agentsTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <KnowledgeSourcesCard
          title="Shared knowledge"
          description="These sources are available to every agent in the profile. Use them for common FAQs, brand facts, policy docs, and universal reference material."
          scope="shared"
          sources={sharedSources}
          page={sharedPageData?.page ?? sharedKnowledgePage}
          limit={sharedPageData?.limit ?? KNOWLEDGE_PAGE_SIZE}
          total={sharedSourcesTotal}
          selectedAgent={null}
          loading={sharedKnowledgeQuery.isPending}
          error={knowledgeError}
          onAddWebsite={() => openKnowledgeDialog("shared", "website")}
          onUploadDocument={() => openKnowledgeDialog("shared", "document")}
          onReindex={(source) => setReindexSourceTarget(source)}
          onDownloadDocument={(source) => downloadKnowledgeSourceMutation.mutate(source)}
          onDelete={(source) => setDeleteSourceTarget(source)}
          onPageChange={setSharedKnowledgePage}
          selectedAgentId={null}
          onSelectedAgentChange={() => {}}
          availableAgents={agents}
          reindexingSourceId={
            reindexSourceMutation.isPending && reindexSourceMutation.variables
              ? reindexSourceMutation.variables.id
              : null
          }
          downloadingSourceId={
            downloadKnowledgeSourceMutation.isPending && downloadKnowledgeSourceMutation.variables
              ? downloadKnowledgeSourceMutation.variables.id
              : null
          }
          deletingSourceId={deleteSourceMutation.variables?.id ?? null}
        />

        <KnowledgeSourcesCard
          title="Agent-specific knowledge"
          description="These sources are isolated to one agent. Use them for specialized prompts, private workflows, or role-specific reference material."
          scope="agent"
          sources={agentSpecificSources}
          page={agentPageData?.page ?? agentKnowledgePage}
          limit={agentPageData?.limit ?? KNOWLEDGE_PAGE_SIZE}
          total={agentSourcesTotal}
          selectedAgent={selectedAgent}
          loading={Boolean(selectedAgentId) && agentKnowledgeQuery.isPending}
          error={knowledgeError}
          onAddWebsite={() => openKnowledgeDialog("agent", "website")}
          onUploadDocument={() => openKnowledgeDialog("agent", "document")}
          onReindex={(source) => setReindexSourceTarget(source)}
          onDownloadDocument={(source) => downloadKnowledgeSourceMutation.mutate(source)}
          onDelete={(source) => setDeleteSourceTarget(source)}
          onPageChange={setAgentKnowledgePage}
          selectedAgentId={selectedAgentId}
          onSelectedAgentChange={setSelectedAgentId}
          availableAgents={allAgents}
          reindexingSourceId={
            reindexSourceMutation.isPending && reindexSourceMutation.variables
              ? reindexSourceMutation.variables.id
              : null
          }
          downloadingSourceId={
            downloadKnowledgeSourceMutation.isPending && downloadKnowledgeSourceMutation.variables
              ? downloadKnowledgeSourceMutation.variables.id
              : null
          }
          deletingSourceId={deleteSourceMutation.variables?.id ?? null}
        />
      </div>
    </div>
  );
}
