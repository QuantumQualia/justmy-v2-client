import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

/**
 * Mirrors CMS `PostSeoDto` (`apps/api` cms `post.dto.ts`).
 */
export interface ContentPostSeoSummary {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
  ogImage?: string | null;
}

/**
 * Post fields embedded on tab-post rows — aligned with CMS post DTO surface
 * (`CreatePostDto` / post payload: title, slug, excerpt, tags, status, seo).
 * Omits `content` (not used for list/summary responses).
 */
export interface ContentPostSummary {
  id: number | string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  tags?: string[];
  status?: "draft" | "publish" | "archive";
  seo?: ContentPostSeoSummary | null;
}

/** Normalize og:image to a URL string (supports legacy `{ url: string }` from some CMS payloads). */
export function resolveContentOgImageUrl(
  og?: string | { url: string } | null
): string | null {
  if (og == null) return null;
  if (typeof og === "string") {
    const s = og.trim();
    return s || null;
  }
  const u = og.url?.trim();
  return u || null;
}

/** `seo.ogImage` from an embedded post summary (tab posts / hub listings). */
export function resolveContentPostOgImageUrl(
  post: ContentPostSummary | null | undefined
): string | null {
  if (!post) return null;
  return resolveContentOgImageUrl(post.seo?.ogImage ?? null);
}

export interface TabPostResponseDto {
  postId: number;
  position: number;
  post?: ContentPostSummary | null;
}

export interface ContentTabResponseDto {
  id: number;
  legacyId?: number | null;
  title: string;
  position: number;
  /** Populated from hub list; use getTabPosts(tabId) for the posts list. */
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentHubResponseDto {
  id: number;
  profileId: number;
  /** When true, hub is owned elsewhere and shared into the viewer profile (structure read-only). */
  isShared?: boolean;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  tabs: ContentTabResponseDto[];
}

export interface ContentHubShareEntryDto {
  id: number;
  hubId: number;
  targetProfileId: number;
  createdAt: string;
}

export interface ContentHubSharesListResponseDto {
  shares: ContentHubShareEntryDto[];
}

export interface ShareContentHubDto {
  targetProfileId: number;
}

export interface ContentHubsListResponseDto {
  hubs: ContentHubResponseDto[];
}

export interface CreateContentHubDto {
  title: string;
  description?: string | null;
}

export interface UpdateContentHubDto {
  title?: string;
  description?: string | null;
}

export interface CreateContentTabDto {
  title: string;
  legacyId?: number | null;
}

export interface UpdateContentTabDto {
  title?: string;
  legacyId?: number | null;
}

export interface AddTabPostDto {
  postId: number;
  position?: number;
}

export interface UpdateTabPostPositionDto {
  position: number;
}

export interface ReorderContentTabsDto {
  tabIds: number[];
}

export interface PaginatedTabPostsResponseDto {
  docs: TabPostResponseDto[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

/** JSON APIs often return numeric ids as strings; use for query enable + keys. */
export function resolveContentNumericId(id: unknown): number | null {
  if (id == null || id === "") return null;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const n = Number(id);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export const contentService = {
  async getCurrentProfileHubs(): Promise<ContentHubResponseDto[]> {
    try {
      const response = await apiRequest<ContentHubsListResponseDto>("content/hubs", {
        method: "GET",
      });
      return response.hubs ?? [];
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to fetch content hubs.");
    }
  },

  async getHubById(hubId: number): Promise<ContentHubResponseDto> {
    try {
      const response = await apiRequest<{ hub: ContentHubResponseDto }>(`content/hubs/${hubId}`, {
        method: "GET",
      });
      return response.hub;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to fetch content hub.");
    }
  },

  async createHub(dto: CreateContentHubDto): Promise<ContentHubResponseDto> {
    try {
      const response = await apiRequest<{ hub: ContentHubResponseDto }>("content/hubs", {
        method: "POST",
        body: JSON.stringify(dto),
      });
      return response.hub;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to create content hub.");
    }
  },

  async updateHub(hubId: number, dto: UpdateContentHubDto): Promise<ContentHubResponseDto> {
    try {
      const response = await apiRequest<{ hub: ContentHubResponseDto }>(`content/hubs/${hubId}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      });
      return response.hub;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to update content hub.");
    }
  },

  async deleteHub(hubId: number): Promise<void> {
    try {
      await apiRequest<void>(`content/hubs/${hubId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to delete content hub.");
    }
  },

  async listHubShares(hubId: number): Promise<ContentHubShareEntryDto[]> {
    try {
      const res = await apiRequest<ContentHubSharesListResponseDto>(`content/hubs/${hubId}/shares`, {
        method: "GET",
      });
      return res.shares ?? [];
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to load hub shares.");
    }
  },

  async shareHub(hubId: number, dto: ShareContentHubDto): Promise<ContentHubShareEntryDto> {
    try {
      return await apiRequest<ContentHubShareEntryDto>(`content/hubs/${hubId}/shares`, {
        method: "POST",
        body: JSON.stringify(dto),
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to share hub with profile.");
    }
  },

  async unshareHub(hubId: number, targetProfileId: number): Promise<void> {
    try {
      await apiRequest<void>(`content/hubs/${hubId}/shares/${targetProfileId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to remove hub share.");
    }
  },

  async createTab(hubId: number, dto: CreateContentTabDto): Promise<ContentTabResponseDto> {
    try {
      const response = await apiRequest<{ tab: ContentTabResponseDto }>(
        `content/hubs/${hubId}/tabs`,
        {
          method: "POST",
          body: JSON.stringify(dto),
        }
      );
      return response.tab;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to create content tab.");
    }
  },

  async updateTab(tabId: number, dto: UpdateContentTabDto): Promise<ContentTabResponseDto> {
    try {
      const response = await apiRequest<{ tab: ContentTabResponseDto }>(`content/tabs/${tabId}`, {
        method: "PATCH",
        body: JSON.stringify(dto),
      });
      return response.tab;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to update content tab.");
    }
  },

  async deleteTab(tabId: number): Promise<void> {
    try {
      await apiRequest<void>(`content/tabs/${tabId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to delete content tab.");
    }
  },

  async reorderContentTabs(
    hubId: number,
    dto: ReorderContentTabsDto
  ): Promise<ContentHubResponseDto> {
    try {
      const response = await apiRequest<{ hub: ContentHubResponseDto }>(
        `content/hubs/${hubId}/tabs/reorder`,
        {
          method: "POST",
          body: JSON.stringify(dto),
        }
      );
      return response.hub;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to reorder content tabs.");
    }
  },

  /**
   * Paginated tab posts (GET content/tabs/:tabId/posts)
   */
  async getTabPosts(
    tabId: number,
    params?: { page?: number; limit?: number; search?: string; status?: string }
  ): Promise<PaginatedTabPostsResponseDto> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.page != null) queryParams.page = String(params.page);
      if (params?.limit != null) queryParams.limit = String(params.limit);
      if (params?.search?.trim()) queryParams.search = params.search.trim();
      if (params?.status?.trim()) queryParams.status = params.status.trim();

      return await apiRequest<PaginatedTabPostsResponseDto>(`content/tabs/${tabId}/posts`, {
        method: "GET",
        params: queryParams,
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to fetch tab posts.");
    }
  },

  async addPostToTab(tabId: number, dto: AddTabPostDto): Promise<TabPostResponseDto> {
    try {
      const response = await apiRequest<{ tabPost: TabPostResponseDto }>(
        `content/tabs/${tabId}/posts`,
        {
          method: "POST",
          body: JSON.stringify(dto),
        }
      );
      return response.tabPost;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to add post to tab.");
    }
  },

  async updateTabPostPosition(
    tabId: number,
    postId: number,
    dto: UpdateTabPostPositionDto
  ): Promise<TabPostResponseDto> {
    try {
      const response = await apiRequest<{ tabPost: TabPostResponseDto }>(
        `content/tabs/${tabId}/posts/${postId}/position`,
        {
          method: "PATCH",
          body: JSON.stringify(dto),
        }
      );
      return response.tabPost;
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to update tab post position.");
    }
  },

  async deleteTabPost(tabId: number, postId: number): Promise<void> {
    try {
      await apiRequest<void>(`content/tabs/${tabId}/posts/${postId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to remove post from tab.");
    }
  },

};

