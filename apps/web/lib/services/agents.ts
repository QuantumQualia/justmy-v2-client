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

export interface AgentResponseDto {
  id: string;
  profileId?: number | string;
  name: string;
  agentToken?: string | null;
  customPromptText?: string | null;
  isActive: boolean;
  isPublic?: boolean;
  publicIdentifier?: string | null;
  publicConfig?: AgentPublicConfigDto | null;
  knowledgeSourceCount?: number;
  sharedKnowledgeSourceCount?: number;
  privateKnowledgeSourceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAgentDto {
  name: string;
  customPromptText?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface UpdateAgentDto {
  name?: string;
  customPromptText?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
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
  mimeType?: string | null;
  status: KnowledgeIngestionStatus;
  progress?: number | null;
  /** Website crawl: pages fetched so far (when API provides it). */
  pagesScraped?: number | null;
  /** Website crawl: configured cap from API (matches submission maxPages). */
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

  const pagesScrapedRaw = raw.pagesScraped ?? raw.pages_scraped;
  const maxPagesRaw = raw.maxPages ?? raw.max_pages;

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
    mimeType: (raw.mimeType as string) ?? null,
    status: normalizeApiStatus(raw.status as string | undefined),
    progress: typeof raw.progress === "number" ? raw.progress : null,
    pagesScraped: typeof pagesScrapedRaw === "number" && Number.isFinite(pagesScrapedRaw) ? pagesScrapedRaw : null,
    maxPages: typeof maxPagesRaw === "number" && Number.isFinite(maxPagesRaw) && maxPagesRaw > 0 ? maxPagesRaw : null,
    lastError: errorMessage ?? null,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

function mapKnowledgeSourcesPage(payload: KnowledgeSourcesPageEnvelope, scope: KnowledgeScope): KnowledgeSourceResponseDto[] {
  const rows = Array.isArray(payload.sources)
    ? payload.sources
    : Array.isArray(payload.data)
      ? payload.data
      : [];
  return rows.map((row) => normalizeKnowledgeSourceFromApi(row as Record<string, unknown>, scope));
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

  return {
    ...agent,
    id: String(agent.id),
    profileId: normalizeOptionalId(agent.profileId),
    agentToken: typeof agent.agentToken === "string" ? agent.agentToken : null,
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
      const response = await apiRequest<Record<string, unknown>>(knowledgePaths.profileSource(sourceId), {
        method: "GET",
      });
      return normalizeKnowledgeSourceFromApi(response, "shared");
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load knowledge source.");
    }
  },

  async getAgentKnowledgeSource(agentId: string, sourceId: string): Promise<KnowledgeSourceResponseDto> {
    try {
      const response = await apiRequest<Record<string, unknown>>(knowledgePaths.agentSource(agentId, sourceId), {
        method: "GET",
      });
      return normalizeKnowledgeSourceFromApi(response, "agent");
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
