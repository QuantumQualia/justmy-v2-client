/**
 * Profiles API Service
 * Handles all profile-related API calls
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export interface ProfileMemberResponseDto {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isDefault: boolean;
}

export interface ProfileSubscriptionResponseDto {
  id: string;
  tier: string;
  status: string;
}

export interface ProfileWalletResponseDto {
  balance: number;
  lifetime: number;
}

export interface ProfileResponseDto {
  id: string;
  name: string;
  slug: string;
  type: string;
  zipCode: string;
  marketId?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  isVerified: boolean;
  members: ProfileMemberResponseDto[];
  subscription: ProfileSubscriptionResponseDto | null;
  wallet: ProfileWalletResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProfileResponseDto {
  data: ProfileResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetProfilesParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Profiles Service
 */
export const profilesService = {
  /**
   * Get paginated list of profiles (admin only)
   */
  async getProfiles(params: GetProfilesParams = {}): Promise<PaginatedProfileResponseDto> {
    try {
      const queryParams: Record<string, string | number> = {};
      
      if (params.page !== undefined) {
        queryParams.page = params.page;
      }
      if (params.limit !== undefined) {
        queryParams.limit = params.limit;
      }
      if (params.search) {
        queryParams.search = params.search;
      }

      return await apiRequest<PaginatedProfileResponseDto>("profiles/admin", {
        method: "GET",
        params: queryParams,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch profiles.");
    }
  },
};

