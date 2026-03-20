import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export interface ContentPostSummary {
  id: number | string;
  title?: string;
  slug?: string;
  status?: "draft" | "publish" | "archive";
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
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  tabs: ContentTabResponseDto[];
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

