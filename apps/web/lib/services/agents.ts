import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export type KnowledgeScope = "shared" | "agent";
export type KnowledgeSourceType = "website" | "document";
export type KnowledgeIngestionStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "ready"
  | "indexed";

export interface AgentPublicConfigDto {
  identifier?: string | null;
  embedId?: string | null;
  widgetId?: string | null;
  slug?: string | null;
  [key: string]: unknown;
}

export const SHARE_TRAY_CHANNELS = ["sms", "whatsapp", "facebook", "x"] as const;
export type AgentShareTrayChannel = (typeof SHARE_TRAY_CHANNELS)[number];

export const SHARE_TRAY_READY_LABEL_MAX = 80;
export const SHARE_TRAY_CLOSING_MESSAGE_MAX = 500;
export const SHARE_TRAY_SHARE_TEXT_MAX = 1000;

/** Optional post-answer Ready CTA + share tray on a ProfileAgent. */
export interface AgentShareTrayDto {
  enabled: boolean;
  /** Required when `enabled` is true. */
  readyLabel?: string | null;
  closingMessage?: string | null;
  shareUrl?: string | null;
  shareText?: string | null;
  channels?: AgentShareTrayChannel[];
}

export interface AgentResponseDto {
  id: string;
  profileId?: number | string;
  name: string;
  agentToken?: string | null;
  /** Linked myFORM (published) for AskSKY lead capture; from profiles/agents API. */
  contactFormId?: number | null;
  customPromptText?: string | null;
  greetingMessage?: string | null;
  isActive: boolean;
  isPublic?: boolean;
  publicIdentifier?: string | null;
  publicConfig?: AgentPublicConfigDto | null;
  /** Opt-in curated live web search when KB has no match. Default false. */
  liveSearchEnabled?: boolean;
  /** Hostname allowlist for live search (e.g. `justmy.com`). */
  liveSearchDomains?: string[];
  /** Opt-in Ready CTA + share tray; null when disabled / unset. */
  shareTray?: AgentShareTrayDto | null;
  knowledgeSourceCount?: number;
  sharedKnowledgeSourceCount?: number;
  privateKnowledgeSourceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAgentDto {
  name: string;
  customPromptText?: string | null;
  greetingMessage?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
  contactFormId?: number | null;
  liveSearchEnabled?: boolean;
  liveSearchDomains?: string[];
  shareTray?: AgentShareTrayDto | null;
}

export interface UpdateAgentDto {
  name?: string;
  customPromptText?: string | null;
  greetingMessage?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
  contactFormId?: number | null;
  liveSearchEnabled?: boolean;
  liveSearchDomains?: string[];
  shareTray?: AgentShareTrayDto | null;
}

/** Max domains accepted by the live-search allowlist editor / API. */
export const LIVE_SEARCH_DOMAINS_MAX = 50;

function isShareTrayChannel(value: unknown): value is AgentShareTrayChannel {
  return typeof value === "string" && (SHARE_TRAY_CHANNELS as readonly string[]).includes(value);
}

/** Normalize API / form share tray; returns null when absent or disabled without payload. */
export function normalizeShareTray(raw: unknown): AgentShareTrayDto | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const enabled = obj.enabled === true;
  const readyLabel =
    typeof obj.readyLabel === "string" ? obj.readyLabel.trim().slice(0, SHARE_TRAY_READY_LABEL_MAX) : "";
  const closingMessage =
    typeof obj.closingMessage === "string"
      ? obj.closingMessage.trim().slice(0, SHARE_TRAY_CLOSING_MESSAGE_MAX)
      : "";
  const shareUrl = typeof obj.shareUrl === "string" ? obj.shareUrl.trim() : "";
  const shareText =
    typeof obj.shareText === "string" ? obj.shareText.trim().slice(0, SHARE_TRAY_SHARE_TEXT_MAX) : "";
  const channelsRaw = Array.isArray(obj.channels) ? obj.channels.filter(isShareTrayChannel) : [];
  const channels =
    channelsRaw.length > 0 ? Array.from(new Set(channelsRaw)) : [...SHARE_TRAY_CHANNELS];

  if (!enabled || !readyLabel || !shareUrl || !shareText) {
    return null;
  }

  return {
    enabled: true,
    readyLabel,
    closingMessage: closingMessage || null,
    shareUrl,
    shareText,
    channels,
  };
}

/**
 * Build a create/update payload for share tray.
 * Returns null when disabled (clears config on the server).
 * Throws Error with a user-facing message when enabled but invalid.
 */
export function buildShareTrayPayload(input: {
  enabled: boolean;
  readyLabel: string;
  closingMessage: string;
  shareUrl: string;
  shareText: string;
  channels: AgentShareTrayChannel[];
}): AgentShareTrayDto | null {
  if (!input.enabled) {
    return null;
  }

  const readyLabel = input.readyLabel.trim().slice(0, SHARE_TRAY_READY_LABEL_MAX);
  const closingMessage = input.closingMessage.trim().slice(0, SHARE_TRAY_CLOSING_MESSAGE_MAX);
  const shareUrl = input.shareUrl.trim();
  const shareText = input.shareText.trim().slice(0, SHARE_TRAY_SHARE_TEXT_MAX);
  const channels =
    input.channels.length > 0
      ? Array.from(new Set(input.channels.filter(isShareTrayChannel)))
      : [...SHARE_TRAY_CHANNELS];

  if (!readyLabel) {
    throw new Error("Ready button label is required when the share tray is enabled.");
  }
  if (!shareUrl) {
    throw new Error("Share URL is required when the share tray is enabled.");
  }
  let parsed: URL;
  try {
    parsed = new URL(shareUrl);
  } catch {
    throw new Error("Share URL must be a valid http(s) URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Share URL must be a valid http(s) URL.");
  }
  if (!shareText) {
    throw new Error("Share text is required when the share tray is enabled.");
  }

  return {
    enabled: true,
    readyLabel,
    closingMessage: closingMessage || null,
    shareUrl,
    shareText,
    channels,
  };
}

/**
 * Normalize pasted URLs or host strings to a hostname.
 * Returns null for empty values, wildcards, or unparseable input.
 */
export function normalizeLiveSearchDomain(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes("*")) {
    return null;
  }

  let host = trimmed;
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
      host = new URL(trimmed).hostname;
    } else if (trimmed.includes("/") || trimmed.includes("?") || trimmed.includes("#")) {
      host = new URL(`https://${trimmed}`).hostname;
    } else if (trimmed.includes("@")) {
      return null;
    } else {
      host = trimmed.replace(/:\d+$/, "");
    }
  } catch {
    return null;
  }

  host = host.replace(/\.$/, "").replace(/^www\./, "");
  if (!host || host.includes("*") || host.includes(" ")) {
    return null;
  }
  // Require at least one dot (e.g. justmy.com) or localhost for local testing.
  if (host !== "localhost" && !host.includes(".")) {
    return null;
  }
  return host;
}

/** Split paste / multi-value input and normalize to unique hostnames (capped). */
export function normalizeLiveSearchDomains(
  values: string[],
  max = LIVE_SEARCH_DOMAINS_MAX,
): { domains: string[]; rejected: string[] } {
  const domains: string[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    for (const part of value.split(/[\s,;]+/)) {
      const piece = part.trim();
      if (!piece) {
        continue;
      }
      const host = normalizeLiveSearchDomain(piece);
      if (!host) {
        rejected.push(piece);
        continue;
      }
      if (seen.has(host)) {
        continue;
      }
      if (domains.length >= max) {
        rejected.push(piece);
        continue;
      }
      seen.add(host);
      domains.push(host);
    }
  }

  return { domains, rejected };
}

export interface KnowledgeSourceResponseDto {
  id: string;
  profileId?: number | string;
  agentId?: string | null;
  agentName?: string | null;
  scope: KnowledgeScope;
  sourceType: KnowledgeSourceType;
  title?: string | null;
  url?: string | null;
  fileName?: string | null;
  /** S3 (or equivalent) object key for the uploaded file; used with `files/presigned-url`. */
  s3Key?: string | null;
  mimeType?: string | null;
  status: KnowledgeIngestionStatus;
  progress?: number | null;
  /** Pages indexed (website crawl or document extraction) when API provides it. */
  pagesScraped?: number | null;
  /** Website crawl cap from API (matches submission maxPages). */
  maxPages?: number | null;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListKnowledgeSourcesPageParams {
  page?: number;
  limit?: number;
}

export interface KnowledgeSourcesPageDto {
  sources: KnowledgeSourceResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateWebsiteKnowledgeSourceDto {
  scope: KnowledgeScope;
  url: string;
  /** Defaults to 50 when omitted (matches API samples). */
  maxPages?: number;
  agentId?: string | null;
}

export interface UploadDocumentKnowledgeSourceDto {
  scope: KnowledgeScope;
  file: File;
  agentId?: string | null;
}

type AgentEnvelope =
  | AgentResponseDto
  | {
      agent?: AgentResponseDto;
      data?: AgentResponseDto;
    };

type AgentsEnvelope =
  | AgentResponseDto[]
  | {
      agents?: AgentResponseDto[];
      data?: AgentResponseDto[];
    };

type KnowledgeSourceEnvelope =
  | KnowledgeSourceResponseDto
  | {
      message?: string;
      source?: KnowledgeSourceResponseDto | Record<string, unknown>;
      data?: KnowledgeSourceResponseDto | Record<string, unknown>;
    };

type KnowledgeSourcesPageEnvelope = {
  sources?: unknown[];
  data?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
};

function extractAgent(payload: AgentEnvelope): AgentResponseDto {
  if ("id" in payload) {
    return normalizeAgent(payload);
  }

  if (payload.agent) {
    return normalizeAgent(payload.agent);
  }

  if (payload.data) {
    return normalizeAgent(payload.data);
  }

  throw new ApiClientError("Agent response is missing agent data.");
}

function extractAgents(payload: AgentsEnvelope): AgentResponseDto[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeAgent);
  }

  if (Array.isArray(payload.agents)) {
    return payload.agents.map(normalizeAgent);
  }

  if (Array.isArray(payload.data)) {
    return payload.data.map(normalizeAgent);
  }

  return [];
}

function extractKnowledgeSource(
  payload: KnowledgeSourceEnvelope,
  context: { scope: KnowledgeScope; agentId?: string | null },
): KnowledgeSourceResponseDto {
  const envelope = payload as KnowledgeSourceEnvelope & Record<string, unknown>;
  let raw: Record<string, unknown>;

  if ("id" in envelope && envelope.id !== undefined && !("source" in envelope) && !("message" in envelope)) {
    raw = envelope as unknown as Record<string, unknown>;
  } else if (envelope.source) {
    raw = envelope.source as unknown as Record<string, unknown>;
  } else if (envelope.data) {
    raw = envelope.data as unknown as Record<string, unknown>;
  } else {
    throw new ApiClientError("Knowledge source response is missing source data.");
  }

  if (context.scope === "agent" && context.agentId) {
    raw = { ...raw, agentId: raw.agentId ?? context.agentId };
  }

  return normalizeKnowledgeSourceFromApi(raw, context.scope);
}

const profileAgentPaths = {
  currentAgents: () => "profiles/agents",
  agents: () => "profiles/agents",
  agent: (agentId: string) => `profiles/agents/${agentId}`,
};

const knowledgePaths = {
  profileList: () => "profiles/knowledge-sources",
  profileSource: (sourceId: string) => `profiles/knowledge-sources/${sourceId}`,
  profileWebsite: () => "profiles/knowledge-sources/website",
  profileDocument: () => "profiles/knowledge-sources/document",
  profileReindex: (sourceId: string) => `profiles/knowledge-sources/${sourceId}/reindex`,
  agentList: (agentId: string) => `profiles/agents/${agentId}/knowledge-sources`,
  agentSource: (agentId: string, sourceId: string) => `profiles/agents/${agentId}/knowledge-sources/${sourceId}`,
  agentWebsite: (agentId: string) => `profiles/agents/${agentId}/knowledge-sources/website`,
  agentDocument: (agentId: string) => `profiles/agents/${agentId}/knowledge-sources/document`,
  agentReindex: (agentId: string, sourceId: string) => `profiles/agents/${agentId}/knowledge-sources/${sourceId}/reindex`,
};

function mapApiTypeToSourceType(type: string | undefined): KnowledgeSourceType {
  const normalized = String(type ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "DOCUMENT" || normalized === "PDF") {
    return "document";
  }
  return "website";
}

function parseOptionalCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }
  return null;
}

function pickPagesScraped(raw: Record<string, unknown>): number | null {
  return parseOptionalCount(
    raw.pagesScraped ??
      raw.pages_scraped ??
      raw.scrapedPages ??
      raw.scraped_pages ??
      raw.pageCount ??
      raw.page_count,
  );
}

function pickMaxPages(raw: Record<string, unknown>): number | null {
  const max = parseOptionalCount(raw.maxPages ?? raw.max_pages);
  return max != null && max > 0 ? max : null;
}

function pickKnowledgeSourceFileKey(raw: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    raw.fileKey,
    raw.file_key,
    raw.storageKey,
    raw.storage_key,
    raw.s3Key,
    raw.s3_key,
    raw.objectKey,
    raw.object_key,
    raw.sourceFileKey,
    raw.source_file_key,
    raw.key,
  ];
  for (const value of candidates) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

function normalizeApiStatus(status: string | undefined): KnowledgeIngestionStatus {
  const key = String(status ?? "pending")
    .trim()
    .toLowerCase();
  switch (key) {
    case "queued":
      return "queued";
    case "processing":
      return "processing";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "ready":
      return "ready";
    case "indexed":
      return "indexed";
    case "pending":
    default:
      return "pending";
  }
}

function normalizeKnowledgeSourceFromApi(raw: Record<string, unknown>, scope: KnowledgeScope): KnowledgeSourceResponseDto {
  const filename = (raw.filename ?? raw.fileName) as string | undefined;
  const errorMessage = (raw.errorMessage ?? raw.lastError) as string | undefined;
  const sourceType = mapApiTypeToSourceType(raw.type as string | undefined);

  const pagesScraped = pickPagesScraped(raw);
  const maxPages = pickMaxPages(raw);
  const s3Key = pickKnowledgeSourceFileKey(raw);

  return {
    id: String(raw.id ?? ""),
    profileId: normalizeOptionalId(raw.profileId as number | string | undefined),
    agentId: normalizeNullableId(raw.agentId as number | string | null | undefined),
    agentName: (raw.agentName as string) ?? null,
    scope,
    sourceType,
    title: typeof raw.title === "string" ? raw.title.trim() || null : null,
    url: (raw.url as string) ?? null,
    fileName: filename ?? null,
    s3Key: s3Key ?? null,
    mimeType: (raw.mimeType as string) ?? null,
    status: normalizeApiStatus(raw.status as string | undefined),
    progress: typeof raw.progress === "number" ? raw.progress : null,
    pagesScraped,
    maxPages,
    lastError: errorMessage ?? null,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

function flattenKnowledgeSourceRow(row: Record<string, unknown>): Record<string, unknown> {
  if (row.id !== undefined && row.id !== null) {
    return row;
  }
  if (row.source && typeof row.source === "object" && !Array.isArray(row.source)) {
    return row.source as Record<string, unknown>;
  }
  if (row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    return row.data as Record<string, unknown>;
  }
  return row;
}

function mapKnowledgeSourcesPage(payload: KnowledgeSourcesPageEnvelope, scope: KnowledgeScope): KnowledgeSourceResponseDto[] {
  const rows = Array.isArray(payload.sources)
    ? payload.sources
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  return rows.map((row) =>
    normalizeKnowledgeSourceFromApi(flattenKnowledgeSourceRow(row as Record<string, unknown>), scope),
  );
}

async function fetchKnowledgeSourcesPageForPath(
  path: string,
  scope: KnowledgeScope,
  params: ListKnowledgeSourcesPageParams = {},
) : Promise<KnowledgeSourcesPageDto> {
  const limit = params.limit ?? 50;
  const page = params.page ?? 1;
  const payload = await apiRequest<KnowledgeSourcesPageEnvelope>(path, {
    method: "GET",
    params: { page, limit },
  });

  return {
    sources: mapKnowledgeSourcesPage(payload, scope),
    total: typeof payload.total === "number" ? payload.total : 0,
    page: typeof payload.page === "number" ? payload.page : page,
    limit: typeof payload.limit === "number" ? payload.limit : limit,
  };
}

function normalizeOptionalId(value: number | string | null | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  return String(value);
}

function normalizeNullableId(value: number | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  return String(value);
}

function normalizeAgent(agent: AgentResponseDto): AgentResponseDto {
  const sharedKnowledgeSourceCount =
    typeof agent.sharedKnowledgeSourceCount === "number" ? agent.sharedKnowledgeSourceCount : undefined;
  const privateKnowledgeSourceCount =
    typeof agent.privateKnowledgeSourceCount === "number" ? agent.privateKnowledgeSourceCount : undefined;
  const fallbackKnowledgeSourceCount =
    sharedKnowledgeSourceCount != null || privateKnowledgeSourceCount != null
      ? (sharedKnowledgeSourceCount ?? 0) + (privateKnowledgeSourceCount ?? 0)
      : undefined;
  const publicIdentifier =
    typeof agent.publicIdentifier === "string" && agent.publicIdentifier.trim()
      ? agent.publicIdentifier.trim()
      : typeof agent.agentToken === "string" && agent.agentToken.trim()
        ? agent.agentToken.trim()
        : null;

  const liveSearchDomainsRaw = Array.isArray(agent.liveSearchDomains) ? agent.liveSearchDomains : [];
  const { domains: liveSearchDomains } = normalizeLiveSearchDomains(
    liveSearchDomainsRaw.filter((d): d is string => typeof d === "string"),
  );

  return {
    ...agent,
    id: String(agent.id),
    profileId: normalizeOptionalId(agent.profileId),
    agentToken: typeof agent.agentToken === "string" ? agent.agentToken : null,
    contactFormId:
      typeof (agent as { contactFormId?: unknown }).contactFormId === "number"
        ? ((agent as { contactFormId: number }).contactFormId as number)
        : (agent as { contactFormId?: unknown }).contactFormId === null
          ? null
          : undefined,
    liveSearchEnabled: agent.liveSearchEnabled === true,
    liveSearchDomains,
    shareTray: normalizeShareTray((agent as { shareTray?: unknown }).shareTray),
    publicIdentifier,
    sharedKnowledgeSourceCount,
    privateKnowledgeSourceCount,
    knowledgeSourceCount:
      typeof agent.knowledgeSourceCount === "number"
        ? agent.knowledgeSourceCount
        : fallbackKnowledgeSourceCount,
  };
}

export function resolveAgentPublicIdentifier(agent: AgentResponseDto | null | undefined): string | null {
  if (!agent) {
    return null;
  }

  const candidates = [
    agent.publicIdentifier,
    agent.agentToken,
    agent.publicConfig?.identifier,
    agent.publicConfig?.embedId,
    agent.publicConfig?.widgetId,
    agent.publicConfig?.slug,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export const agentsService = {
  /**
   * Lists agents for a profile. When `forProfileSlug` is omitted, uses the session’s active profile.
   * When set (e.g. CMS editor), sends `profileSlug` as a query param for backends that support scoping.
   */
  async listProfileAgents(forProfileSlug?: string): Promise<AgentResponseDto[]> {
    try {
      const slug = typeof forProfileSlug === "string" ? forProfileSlug.trim() : "";
      const response = await apiRequest<AgentsEnvelope>(profileAgentPaths.currentAgents(), {
        method: "GET",
        ...(slug ? { params: { profileSlug: slug } } : {}),
      });

      return extractAgents(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load agents.");
    }
  },

  async getProfileAgent(agentId: string): Promise<AgentResponseDto> {
    try {
      const response = await apiRequest<AgentEnvelope>(profileAgentPaths.agent(agentId), {
        method: "GET",
      });
      return extractAgent(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load agent.");
    }
  },

  async createProfileAgent(dto: CreateAgentDto): Promise<AgentResponseDto> {
    try {
      const response = await apiRequest<AgentEnvelope>(profileAgentPaths.agents(), {
        method: "POST",
        body: JSON.stringify(dto),
      });
      return extractAgent(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create agent.");
    }
  },

  async updateProfileAgent(
    agentId: string,
    dto: UpdateAgentDto,
  ): Promise<AgentResponseDto> {
    try {
      const response = await apiRequest<AgentEnvelope>(profileAgentPaths.agent(agentId), {
        method: "PATCH",
        body: JSON.stringify(dto),
      });
      return extractAgent(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update agent.");
    }
  },

  async deleteProfileAgent(agentId: string): Promise<void> {
    try {
      await apiRequest<void>(profileAgentPaths.agent(agentId), {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete agent.");
    }
  },

  async listProfileKnowledgeSources(
    params: ListKnowledgeSourcesPageParams = {},
  ): Promise<KnowledgeSourcesPageDto> {
    try {
      return await fetchKnowledgeSourcesPageForPath(knowledgePaths.profileList(), "shared", params);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load knowledge sources.");
    }
  },

  async listAgentKnowledgeSources(
    agentId: string,
    params: ListKnowledgeSourcesPageParams = {},
  ): Promise<KnowledgeSourcesPageDto> {
    try {
      return await fetchKnowledgeSourcesPageForPath(knowledgePaths.agentList(agentId), "agent", params);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load agent knowledge sources.");
    }
  },

  async getKnowledgeSource(sourceId: string): Promise<KnowledgeSourceResponseDto> {
    try {
      const response = await apiRequest<KnowledgeSourceEnvelope>(knowledgePaths.profileSource(sourceId), {
        method: "GET",
      });
      return extractKnowledgeSource(response, { scope: "shared" });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load knowledge source.");
    }
  },

  async getAgentKnowledgeSource(agentId: string, sourceId: string): Promise<KnowledgeSourceResponseDto> {
    try {
      const response = await apiRequest<KnowledgeSourceEnvelope>(knowledgePaths.agentSource(agentId, sourceId), {
        method: "GET",
      });
      return extractKnowledgeSource(response, { scope: "agent", agentId });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load agent knowledge source.");
    }
  },

  async createWebsiteKnowledgeSource(dto: CreateWebsiteKnowledgeSourceDto): Promise<KnowledgeSourceResponseDto> {
    const body = {
      url: dto.url,
      maxPages: dto.maxPages ?? 50,
    };

    try {
      const path =
        dto.scope === "agent" && dto.agentId?.trim()
          ? knowledgePaths.agentWebsite(dto.agentId.trim())
          : knowledgePaths.profileWebsite();

      const response = await apiRequest<KnowledgeSourceEnvelope>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      return extractKnowledgeSource(response, {
        scope: dto.scope,
        agentId: dto.scope === "agent" ? dto.agentId?.trim() ?? null : null,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to submit website source.");
    }
  },

  async uploadDocumentKnowledgeSource(dto: UploadDocumentKnowledgeSourceDto): Promise<KnowledgeSourceResponseDto> {
    const formData = new FormData();
    formData.append("file", dto.file);

    try {
      const path =
        dto.scope === "agent" && dto.agentId?.trim()
          ? knowledgePaths.agentDocument(dto.agentId.trim())
          : knowledgePaths.profileDocument();

      const response = await apiRequest<KnowledgeSourceEnvelope>(path, {
        method: "POST",
        body: formData,
      });

      return extractKnowledgeSource(response, {
        scope: dto.scope,
        agentId: dto.scope === "agent" ? dto.agentId?.trim() ?? null : null,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to upload document source.");
    }
  },

  async reindexKnowledgeSource(source: KnowledgeSourceResponseDto): Promise<KnowledgeSourceResponseDto> {
    try {
      const path =
        source.scope === "agent" && source.agentId
          ? knowledgePaths.agentReindex(source.agentId, source.id)
          : knowledgePaths.profileReindex(source.id);

      const response = await apiRequest<KnowledgeSourceEnvelope>(path, {
        method: "POST",
      });

      return extractKnowledgeSource(response, {
        scope: source.scope,
        agentId: source.scope === "agent" ? source.agentId : null,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to reindex knowledge source.");
    }
  },

  /**
   * Resolves a temporary HTTPS URL for the uploaded document via `GET files/presigned-url?key=...`.
   */
  async getDocumentKnowledgeSourcePresignedDownloadUrl(source: KnowledgeSourceResponseDto): Promise<string> {
    if (source.sourceType !== "document") {
      throw new ApiClientError("Only document knowledge sources can be downloaded.");
    }
    const key = source.s3Key?.trim();
    if (!key) {
      throw new ApiClientError("This document has no storage key yet; try again after upload completes.");
    }
    try {
      const payload = await apiRequest<{ url?: string }>("files/presigned-url", {
        method: "GET",
        params: { key },
      });
      const url = payload.url?.trim();
      if (!url) {
        throw new ApiClientError("Download link was empty.");
      }
      return url;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to get download link.");
    }
  },

  async deleteKnowledgeSource(source: KnowledgeSourceResponseDto): Promise<void> {
    try {
      const path =
        source.scope === "agent" && source.agentId
          ? knowledgePaths.agentSource(source.agentId, source.id)
          : knowledgePaths.profileSource(source.id);

      await apiRequest<void>(path, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete knowledge source.");
    }
  },
};
