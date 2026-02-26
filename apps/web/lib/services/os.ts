/**
 * OS (Operating System) API Service
 * Handles all OS-related API calls
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export interface OSResponseDto {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  appsCount?: number;
}

export interface CreateOSDto {
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface UpdateOSDto {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

/**
 * OS Service
 */
export const osService = {
  /**
   * Get all OS
   */
  async getOSList(): Promise<OSResponseDto[]> {
    try {
      const response = await apiRequest<{ osList: OSResponseDto[] }>("os-apps/os", {
        method: "GET",
      });
      return response.osList;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch OS list.");
    }
  },

  /**
   * Get OS by ID
   */
  async getOSById(id: number): Promise<OSResponseDto> {
    try {
      const response = await apiRequest<{ os: OSResponseDto }>(`os-apps/os/${id}`, {
        method: "GET",
      });
      return response.os;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch OS.");
    }
  },

  /**
   * Create a new OS
   */
  async createOS(data: CreateOSDto): Promise<OSResponseDto> {
    try {
      const response = await apiRequest<{ os: OSResponseDto }>("os-apps/os", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.os;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create OS.");
    }
  },

  /**
   * Update an OS
   */
  async updateOS(id: number, data: UpdateOSDto): Promise<OSResponseDto> {
    try {
      const response = await apiRequest<{ os: OSResponseDto }>(`os-apps/os/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.os;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update OS.");
    }
  },

  /**
   * Delete an OS
   */
  async deleteOS(id: number): Promise<void> {
    try {
      await apiRequest(`os-apps/os/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete OS.");
    }
  },
};
