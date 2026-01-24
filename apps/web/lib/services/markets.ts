/**
 * Markets API Service
 * Handles all market-related API calls
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export type MarketStatus = "ACTIVE" | "HIDDEN" | "PENDING";

export interface MarketZipcodeResponseDto {
  id: number;
  zipcode: string;
  marketId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketSocialDto {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
}

export interface MarketSocialResponseDto {
  id: number;
  marketId: number;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketResponseDto {
  id: number;
  parentId?: number;
  name: string;
  slug: string;
  city?: string;
  state?: string;
  description?: string;
  site?: string;
  siteTitle?: string;
  status: MarketStatus;
  zipCount?: number; // Computed field - count of associated zipcodes
  legacyId?: number;
  createdAt: Date;
  updatedAt: Date;
  zipcodes?: MarketZipcodeResponseDto[];
  socials?: MarketSocialResponseDto;
  children?: MarketResponseDto[];
  parent?: MarketResponseDto;
}

export interface PaginatedMarketResponseDto {
  data: MarketResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetMarketsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MarketStatus;
  state?: string;
  includeParent?: boolean;
  onlyParents?: boolean;
  orderBy?: string;
}

export interface CreateMarketDto {
  name: string;
  slug: string;
  state?: string;
  city?: string;
  description?: string;
  site?: string;
  siteTitle?: string;
  status: MarketStatus;
  parentId?: number;
  socials?: MarketSocialDto;
  zipcodes?: Array<{ zipcode: string }>;
}

export interface UpdateMarketDto {
  name?: string;
  slug?: string;
  state?: string;
  city?: string;
  description?: string;
  site?: string;
  siteTitle?: string;
  status?: MarketStatus;
  parentId?: number;
  socials?: MarketSocialDto;
  zipcodes?: Array<{ zipcode: string }>;
}

/**
 * Markets Service
 */
export const marketsService = {
  /**
   * Get paginated list of markets with optional search and filters
   */
  async getMarkets(params: GetMarketsParams = {}): Promise<PaginatedMarketResponseDto> {
    try {
      const queryParams: Record<string, string | number | boolean> = {};
      
      if (params.page !== undefined) {
        queryParams.page = params.page;
      }
      if (params.limit !== undefined) {
        queryParams.limit = params.limit;
      }
      if (params.search) {
        queryParams.search = params.search;
      }
      if (params.status) {
        queryParams.status = params.status;
      }
      if (params.state) {
        queryParams.state = params.state;
      }
      if (params.includeParent !== undefined) {
        queryParams.includeParent = params.includeParent;
      }
      if (params.onlyParents !== undefined) {
        queryParams.onlyParents = params.onlyParents;
      }
      if (params.orderBy) {
        queryParams.orderBy = params.orderBy;
      }

      return await apiRequest<PaginatedMarketResponseDto>("markets", {
        method: "GET",
        params: queryParams,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch markets.");
    }
  },

  /**
   * Get a single market by ID
   */
  async getMarketById(
    id: number | string,
    options?: {
      includeSocials?: boolean;
      includeZipcodes?: boolean;
    }
  ): Promise<MarketResponseDto> {
    try {
      const queryParams: Record<string, string | number | boolean> = {};
      
      if (options?.includeSocials !== undefined) {
        queryParams.includeSocials = options.includeSocials;
      }
      if (options?.includeZipcodes !== undefined) {
        queryParams.includeZipcodes = options.includeZipcodes;
      }

      return await apiRequest<MarketResponseDto>(`markets/${id}`, {
        method: "GET",
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch market.");
    }
  },

  /**
   * Create a new market
   */
  async createMarket(data: CreateMarketDto): Promise<MarketResponseDto> {
    try {
      return await apiRequest<MarketResponseDto>("markets", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create market.");
    }
  },

  /**
   * Update an existing market
   */
  async updateMarket(
    id: number | string,
    data: UpdateMarketDto
  ): Promise<MarketResponseDto> {
    try {
      return await apiRequest<MarketResponseDto>(`markets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update market.");
    }
  },

  /**
   * Delete a market
   */
  async deleteMarket(id: number | string): Promise<void> {
    try {
      await apiRequest<void>(`markets/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete market.");
    }
  },

  /**
   * Add a single zipcode to a market
   */
  async addZipcode(
    marketId: number | string,
    zipcode: string
  ): Promise<MarketResponseDto> {
    try {
      return await apiRequest<MarketResponseDto>(`markets/${marketId}/zipcodes`, {
        method: "POST",
        body: JSON.stringify({ zipcode }),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to add zipcode.");
    }
  },

  /**
   * Add multiple zipcodes to a market (bulk)
   */
  async addZipcodes(
    marketId: number | string,
    zipcodes: string[]
  ): Promise<MarketResponseDto> {
    try {
      return await apiRequest<MarketResponseDto>(`markets/${marketId}/zipcodes/bulk`, {
        method: "POST",
        body: JSON.stringify({ zipcodes }),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to add zipcodes.");
    }
  },

  /**
   * Remove a zipcode from a market
   */
  async removeZipcode(
    marketId: number | string,
    zipcode: string
  ): Promise<MarketResponseDto> {
    try {
      return await apiRequest<MarketResponseDto>(`markets/${marketId}/zipcodes/${zipcode}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to remove zipcode.");
    }
  },

  /**
   * Update socials for a market
   */
  async updateSocials(
    marketId: number | string,
    socials: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
      linkedin?: string;
    }
  ): Promise<MarketResponseDto> {
    try {
      return await apiRequest<MarketResponseDto>(`markets/${marketId}/socials`, {
        method: "PUT",
        body: JSON.stringify(socials),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update socials.");
    }
  },
};

