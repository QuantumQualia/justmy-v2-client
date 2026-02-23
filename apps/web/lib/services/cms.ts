/**
 * CMS API Service
 * Handles all CMS-related API calls through NestJS backend
 * 
 * All Payload CMS operations are proxied through NestJS backend
 * Frontend only handles UI - all database operations go through NestJS
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

/**
 * Responsive Style Values
 */
export interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}

/**
 * Block Style Configuration
 */
export interface BlockStyles {
  padding?: ResponsiveValue<string>;
  margin?: ResponsiveValue<string>;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  border?: string;
  width?: ResponsiveValue<string>;
  maxWidth?: ResponsiveValue<string>;
  minHeight?: ResponsiveValue<string>;
  display?: ResponsiveValue<string>;
  flexDirection?: ResponsiveValue<string>;
  alignItems?: ResponsiveValue<string>;
  justifyContent?: ResponsiveValue<string>;
  gap?: ResponsiveValue<string>;
}

/**
 * Grid Layout Configuration
 */
export interface GridLayout {
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<string>;
  autoRows?: ResponsiveValue<string>;
  templateAreas?: ResponsiveValue<string>;
}

/**
 * Grid Column/Area Configuration
 */
export interface GridColumn {
  id: string;
  name: string;
  blocks: PageBlock[];
}

/**
 * Container Layout Configuration
 */
export interface ContainerLayout {
  type?: "container" | "full-width" | "boxed";
  maxWidth?: ResponsiveValue<string>;
  padding?: ResponsiveValue<string>;
  grid?: GridLayout;
  columns?: GridColumn[]; // For grid layouts, define columns/areas
}

/**
 * Payload Page Block
 */
export interface PageBlock {
  blockType: string;
  id?: string;
  styles?: BlockStyles;
  layout?: ContainerLayout;
  children?: PageBlock[]; // For container/layout blocks, nested blocks
  [key: string]: any;
}

/**
 * Payload Page
 */
export interface PayloadPage {
  id: string;
  title: string;
  handle: string;
  parentHandle?: string | null;
  description?: string | null;
  content: PageBlock[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string | { url: string };
  } | null;
  isPublished: boolean;
  requiresAuth?: boolean;
  author: string | { id: string; email: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated Pages Response
 */
export interface PaginatedPagesResponse {
  docs: PayloadPage[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

/**
 * Create Page DTO
 */
export interface CreatePageDto {
  title: string;
  handle: string;
  parentHandle?: string;
  description?: string;
  content?: PageBlock[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
  isPublished?: boolean;
  requiresAuth?: boolean;
}

/**
 * Update Page DTO
 */
export interface UpdatePageDto extends Partial<CreatePageDto> {
  id: string;
}

/**
 * CMS Service
 */
export const cmsService = {
  /**
   * Get page by handle
   * Note: We don't use skipAuth here because:
   * - If page requires auth and user is logged in, token will be sent automatically
   * - If page requires auth and user is not logged in, backend will return 401
   * - If page doesn't require auth, it works with or without token
   */
  async getPageByHandle(handle: string): Promise<PayloadPage | null> {
    try {
      // Call NestJS backend endpoint
      // Backend should return single page or null (200 with null body)
      // Backend should return 401 if requiresAuth and not authenticated
      console.log("page1", handle)
      const page = await apiRequest<PayloadPage | null>(
        `cms/pages/by-handle/${handle}`,
        {
          method: "GET",
          // Don't skip auth - let API client send token if available
          // Backend will check if page requires auth and validate accordingly
        }
      );

      console.log("page", page)
      return page;
    } catch (error) {
      console.log("error", error)

      // If 401, let it propagate (needs authentication)
      if (error instanceof ApiClientError && error.statusCode === 401) {
        throw error;
      }
      // If 404 or null response, return null (page doesn't exist)
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get page by nested handle (parentHandle/subHandle)
   * Note: We don't use skipAuth here because:
   * - If page requires auth and user is logged in, token will be sent automatically
   * - If page requires auth and user is not logged in, backend will return 401
   * - If page doesn't require auth, it works with or without token
   */
  async getPageByNestedHandle(
    parentHandle: string,
    subHandle: string
  ): Promise<PayloadPage | null> {
    try {
      // Call NestJS backend endpoint
      // Backend should return single page or null (200 with null body)
      // Backend should return 401 if requiresAuth and not authenticated
      const page = await apiRequest<PayloadPage | null>(
        `cms/pages/by-handle/${parentHandle}/${subHandle}`,
        {
          method: "GET",
          // Don't skip auth - let API client send token if available
          // Backend will check if page requires auth and validate accordingly
        }
      );

      return page;
    } catch (error) {
      // If 401, let it propagate (needs authentication)
      if (error instanceof ApiClientError && error.statusCode === 401) {
        throw error;
      }
      // If 404 or null response, return null (page doesn't exist)
      if (error instanceof ApiClientError && error.statusCode === 404) {
        return null;
      }
      // If other error, return null (page doesn't exist)
      return null;
    }
  },

  /**
   * Get all pages (for admin)
   */
  async getAllPages(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedPagesResponse> {
    try {
      const queryParams: Record<string, string> = {};
      
      if (params?.page) {
        queryParams.page = params.page.toString();
      }
      if (params?.limit) {
        queryParams.limit = params.limit.toString();
      }
      if (params?.search) {
        queryParams.search = params.search;
      }

      // Call NestJS backend endpoint
      return await apiRequest<PaginatedPagesResponse>("cms/pages", {
        method: "GET",
        params: queryParams,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch pages.");
    }
  },

  /**
   * Get page by ID
   */
  async getPageById(id: string): Promise<PayloadPage> {
    try {
      // Call NestJS backend endpoint
      return await apiRequest<PayloadPage>(`cms/pages/${id}`, {
        method: "GET",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch page.");
    }
  },

  /**
   * Create a new page
   */
  async createPage(data: CreatePageDto): Promise<PayloadPage> {
    try {
      // Call NestJS backend endpoint
      return await apiRequest<PayloadPage>("cms/pages", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create page.");
    }
  },

  /**
   * Update a page
   */
  async updatePage(id: string, data: Partial<CreatePageDto>): Promise<PayloadPage> {
    try {
      // Call NestJS backend endpoint
      return await apiRequest<PayloadPage>(`cms/pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update page.");
    }
  },

  /**
   * Delete a page
   */
  async deletePage(id: string): Promise<void> {
    try {
      // Call NestJS backend endpoint
      return await apiRequest<void>(`cms/pages/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete page.");
    }
  },
};
