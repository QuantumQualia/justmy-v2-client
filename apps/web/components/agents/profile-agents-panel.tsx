"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bot,
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
import { ConfirmDeletionModal } from "@/components/common/confirm-deletion-modal";
import { AskSkyStaticEmbedDialog } from "@/components/agents/asksky-static-embed-dialog";
import { DataTable } from "@/components/ui/data-table";
import { agentQueryKeys } from "@/lib/query/agent-query-keys";
import {
  agentsService,
  resolveAgentPublicIdentifier,
  type AgentResponseDto,
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
import { useProfileStore } from "@/lib/store";
import { cn } from "@workspace/ui/lib/utils";

const INGESTING_STATUSES = new Set<KnowledgeIngestionStatus>(["pending", "queued", "processing"]);
const KNOWLEDGE_PAGE_SIZE = 5;
const AGENTS_PAGE_SIZE = 10;
/** Poll individual ingesting knowledge sources (GET by id) so progress bars stay current. */
const KNOWLEDGE_INGESTION_POLL_MS = 5_000;

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
  if (source.sourceType === "website") {
    return true;
  }
  return source.sourceType === "document" && source.status === "failed";
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
        "mt-3 h-2 w-full min-w-0 border border-slate-700/90 bg-slate-950 shadow-inner",
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
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "pending":
    case "queued":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "processing":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    default:
      return "border-slate-600 bg-slate-800 text-slate-300";
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
    <Card className="min-w-0 max-w-full rounded-br-none border-slate-800 bg-slate-900/60 py-0">
      <CardHeader className="gap-1 border-b border-slate-800/80 py-4">
        <CardDescription className="text-slate-400">{title}</CardDescription>
        <CardTitle className="text-2xl text-white">{value}</CardTitle>
      </CardHeader>
      <CardContent className="py-4 text-sm text-slate-400">{description}</CardContent>
    </Card>
  );
}

function AgentFormDialog({
  state,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  state: AgentDialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateAgentDto | UpdateAgentDto) => Promise<void>;
  submitting: boolean;
}) {
  const [name, setName] = React.useState("");
  const [greetingMessage, setGreetingMessage] = React.useState("");
  const [customPromptText, setCustomPromptText] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isPublic, setIsPublic] = React.useState(true);
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
    setError(null);
  }, [state]);

  const publicIdentifier = resolveAgentPublicIdentifier(state.agent);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Agent name is required.");
      return;
    }

    setError(null);

    await onSubmit({
      name: trimmedName,
      greetingMessage: greetingMessage.trim() || null,
      customPromptText: customPromptText.trim() || null,
      isActive,
      isPublic,
    });
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
        className="border-slate-800 bg-slate-950 text-white sm:max-w-2xl"
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
          <DialogDescription className="text-slate-400">
            Set the agent name, activation state, and optional greeting or custom prompt for this profile.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-slate-200">
                Agent name
              </Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Sales Concierge"
                className="border-slate-700 bg-slate-900 text-white"
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-active" className="text-slate-200">
                Status
              </Label>
              <div className="flex h-10 items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-500"}`}
                  />
                  <span className="text-sm font-medium text-slate-200">
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <Switch
                  id="agent-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={submitting}
                  className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-greeting-message" className="text-slate-200">
              Greeting message <span className="text-slate-500">(optional)</span>
            </Label>
            <Textarea
              id="agent-greeting-message"
              value={greetingMessage}
              onChange={(event) => setGreetingMessage(event.target.value)}
              placeholder="Shown when visitors open AskSKY! before they send a message."
              className="min-h-24 border-slate-700 bg-slate-900 text-white"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-custom-prompt" className="text-slate-200">
              Custom prompt text <span className="text-slate-500">(optional)</span>
            </Label>
            <Textarea
              id="agent-custom-prompt"
              value={customPromptText}
              onChange={(event) => setCustomPromptText(event.target.value)}
              placeholder="Leave blank to use the shared/default prompt behavior from the backend."
              className="min-h-40 border-slate-700 bg-slate-900 text-white"
              disabled={submitting}
            />
          </div>

          {publicIdentifier ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Public identifier
              </p>
              <p className="mt-1 font-mono text-sm text-emerald-300">{publicIdentifier}</p>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
        className="border-slate-800 bg-slate-950 text-white sm:max-w-xl"
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
          <DialogDescription className="text-slate-400">
            {scopeLabel(state.scope)} will be available according to the scope you choose here.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && error !== documentRequiredError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {state.sourceType === "website" ? (
            <div className="space-y-2">
              <Label htmlFor="knowledge-url" className="text-slate-200">
                Website URL
              </Label>
              <Input
                id="knowledge-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/docs"
                className="border-slate-700 bg-slate-900 text-white"
                disabled={submitting}
              />
              <div className="space-y-2">
                <Label htmlFor="knowledge-max-pages" className="text-slate-200">
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
                  className="border-slate-700 bg-slate-900 text-white"
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="knowledge-file" className="text-slate-200">
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
                    ? "border-red-500/60 bg-slate-900"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800"
                  disabled={submitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose file
                </Button>
                <span className={`truncate text-sm ${file ? "text-slate-200" : "text-slate-500"}`}>
                  {file?.name ?? "No file chosen"}
                </span>
              </div>
              {error === documentRequiredError ? (
                <p className="text-xs text-red-400">{documentRequiredError}</p>
              ) : (
                <p className="text-xs text-slate-500">PDF only (application/pdf).</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
  onDelete,
  onPageChange,
  selectedAgentId,
  onSelectedAgentChange,
  availableAgents,
  reindexingSourceId,
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
  onDelete: (source: KnowledgeSourceResponseDto) => void;
  onPageChange: (page: number) => void;
  selectedAgentId: string | null;
  onSelectedAgentChange: (agentId: string) => void;
  availableAgents: AgentResponseDto[];
  reindexingSourceId: string | null;
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
          ? "scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden rounded-br-none border-slate-800 bg-slate-900/70 py-0"
          : "w-full min-w-0 max-w-full overflow-x-hidden rounded-br-none border-slate-800 bg-slate-900/70 py-0"
      }
    >
      <CardHeader className="min-w-0 gap-3 border-b border-slate-800/80 px-4 py-5 sm:px-6">
        <div className="grid min-w-0 gap-3 lg:min-h-[152px] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CardTitle className="min-w-0 break-words text-white">{title}</CardTitle>
              <Badge
                variant="outline"
                className={
                  scope === "shared"
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                }
              >
                {scope === "shared" ? "Shared" : "Agent-specific"}
              </Badge>
            </div>
            <CardDescription className="max-w-full min-w-0 text-balance text-slate-400 sm:max-w-2xl">
              {description}
            </CardDescription>
            {scope === "agent" && selectedAgent ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium text-slate-100">{selectedAgent.name}</span>
                  {resolveAgentPublicIdentifier(selectedAgent) ? (
                    <span className="break-all font-mono text-emerald-300">
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
                  <SelectTrigger className="border-slate-700 bg-slate-900 text-white">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
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
                className="w-full justify-center border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading knowledge sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-sm text-slate-400">
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
              const busy = reindexingSourceId === source.id || deletingSourceId === source.id;
              const { primaryLabel, secondaryLabel } = resolveKnowledgeSourceLabels(source);
              const scrape = websiteScrapeProgress(source);
              const scrapedPagesLabel = scrapedPagesDescription(source);

              return (
                <div
                  key={source.id}
                  className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:p-4"
                >
                  <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="break-words text-sm font-semibold text-slate-100 sm:truncate">{primaryLabel}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                          {sourceTypeLabel(source.sourceType)}
                        </Badge>
                        <Badge variant="outline" className={statusBadgeClass(source.status)}>
                          {ingestionStatusLabel(source.status)}
                        </Badge>
                      </div>

                      {secondaryLabel ? (
                        <p className="break-all text-xs text-slate-400">{secondaryLabel}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {source.agentName && scope === "shared" ? (
                          <span>{source.agentName}</span>
                        ) : null}
                        {scrapedPagesLabel ? (
                          <span className="tabular-nums text-slate-400">{scrapedPagesLabel}</span>
                        ) : null}
                        <span>Updated {formatDateTime(source.updatedAt ?? source.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex w-full min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full shrink-0 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 sm:w-auto"
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
              <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="min-w-0 text-xs text-slate-400">
                  Showing {rangeStart}-{rangeEnd} of {total}
                </p>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 self-stretch sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                    onClick={() => onPageChange(page - 1)}
                    disabled={loading || page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="min-w-20 text-center text-xs text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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

  const agentsQuery = useQuery({
    queryKey: agentQueryKeys.agents(),
    queryFn: () => agentsService.listProfileAgents(),
  });

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
          return (
            <div className="min-w-[220px] space-y-1">
              <p className="font-medium text-white">{agent.name}</p>
              <p className="text-xs text-slate-400">
                {agent.customPromptText?.trim()
                  ? "Custom prompt configured"
                  : "Using default prompt behavior"}
              </p>
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
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600 bg-slate-800 text-slate-300"
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
          <span className="text-sm text-slate-300">
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
          <span className="text-sm text-slate-400">
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
                className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
                className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
            <span className="font-medium text-white">
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
            <span className="font-medium text-white">
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
            <span className="font-medium text-white">
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-white">Agents and knowledge base</h2>
            <p className="text-sm text-balance text-slate-400">
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

      <Card className="min-w-0 max-w-full overflow-x-hidden rounded-br-none border-slate-800 bg-slate-900/70 py-0">
        <CardHeader className="border-b border-slate-800/80 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-white">Agent management</CardTitle>
              <CardDescription className="max-w-2xl text-slate-400">
                Create, edit, deactivate, or delete agents. Use <span className="text-slate-300">Embed</span> to build
                a shareable AskSKY! page URL (with <span className="text-slate-300">profileSlug</span>,{" "}
                <span className="text-slate-300">agentToken</span>, and <span className="text-slate-300">variant</span>
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
            <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="min-w-0 text-xs text-slate-400">
                Showing {agentsRangeStart}-{agentsRangeEnd} of {agentsTotal}
              </p>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 self-stretch sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                  onClick={() => setAgentsPage((current) => Math.max(1, current - 1))}
                  disabled={agentsQuery.isPending || agentsPage <= 1}
                >
                  Previous
                </Button>
                <span className="min-w-20 text-center text-xs text-slate-400">
                  Page {agentsPage} of {agentsTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
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
          deletingSourceId={deleteSourceMutation.variables?.id ?? null}
        />
      </div>
    </div>
  );
}
