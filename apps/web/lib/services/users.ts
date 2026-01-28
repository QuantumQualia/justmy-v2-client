/**
 * Users API Service
 * Handles all user-related API calls for admin
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  isBlocked: boolean;
  deletedAt: Date | null;
  emailVerified: boolean;
  profileCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUserResponseDto {
  data: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
}

export type UserRole = "USER" | "ADMIN";

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: UserRole;
}

/**
 * Users Service
 */
export const usersService = {
  /**
   * Get paginated list of users with optional search and filters
   */
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedUserResponseDto> {
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
      if (params.includeDeleted !== undefined) {
        queryParams.includeDeleted = params.includeDeleted;
      }

      return await apiRequest<PaginatedUserResponseDto>("admin/users", {
        method: "GET",
        params: queryParams,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch users.");
    }
  },

  /**
   * Block a user
   */
  async blockUser(id: number | string): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>(`admin/users/${id}/block`, {
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to block user.");
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(id: number | string): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>(`admin/users/${id}/unblock`, {
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to unblock user.");
    }
  },

  /**
   * Soft delete a user
   */
  async deleteUser(id: number | string): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>(`admin/users/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete user.");
    }
  },

  /**
   * Restore a soft-deleted user
   */
  async restoreUser(id: number | string): Promise<{ message: string }> {
    try {
      return await apiRequest<{ message: string }>(`admin/users/${id}/restore`, {
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to restore user.");
    }
  },

  /**
   * Get a single user by ID
   */
  async getUserById(id: number | string): Promise<UserResponseDto> {
    try {
      return await apiRequest<UserResponseDto>(`admin/users/${id}`, {
        method: "GET",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch user.");
    }
  },

  /**
   * Update a user
   */
  async updateUser(id: number | string, data: UpdateUserDto): Promise<UserResponseDto> {
    try {
      return await apiRequest<UserResponseDto>(`admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update user.");
    }
  },
};

