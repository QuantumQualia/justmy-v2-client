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
  osName: string;
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

// Public-facing summary returned from profiles/market
export interface MarketProfileSummary {
  id: string;
  name: string;
  slug: string;
  type?: string;
  zipCode?: string;
  description?: string;
  [key: string]: any;
}

export interface PaginatedMarketProfilesResponse {
  data: MarketProfileSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Update Profile DTOs (matching backend UpdateProfileDto)
export interface SocialLinkDto {
  name: string; // e.g., "facebook", "instagram", "twitter", "linkedin"
  link: string;
}

export interface HotlinkDto {
  label: string;
  link: string;
}

export interface PhoneDto {
  type: string; // e.g., "mobile", "office", "fax", "main"
  number: string;
  extension?: string;
}

export interface LocationDto {
  title: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateProfileDto {
  name?: string;
  slug?: string;
  tagline?: string;
  photo?: string;
  banner?: string;
  about?: string;
  email?: string;
  website?: string;
  calendarLink?: string;
  socialLinks?: SocialLinkDto[];
  hotlinks?: HotlinkDto[];
  phones?: PhoneDto[];
  locations?: LocationDto[];
}

export interface UpdateProfileResponse {
  message: string;
  profile: any; // Profile response from formatProfileResponse
}

export interface SubProfileSummaryDto {
  id: string;
  name: string;
  slug: string;
  parentProfileId: string | null;
  createdAt: string;
}

export interface SubProfilesListResponseDto {
  subProfiles: SubProfileSummaryDto[];
}

export interface CreateSubProfileDto {
  name: string;
  slug: string;
  email?: string;
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

  /**
   * Get paginated list of profiles in the signed-in user's markets
   * (uses /profiles/market, requires auth)
   */
  async getMarketProfiles(
    params: GetProfilesParams = {},
  ): Promise<PaginatedMarketProfilesResponse> {
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

      return await apiRequest<PaginatedMarketProfilesResponse>("profiles/market", {
        method: "GET",
        params: queryParams,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch market profiles.");
    }
  },

  /**
   * Get profile by slug (public endpoint)
   */
  async getProfileBySlug(slug: string): Promise<{ profile: any } | null> {
    try {
      return await apiRequest<{ profile: any }>(`profiles/slug/${slug}`, {
        method: "GET",
        skipAuth: true, // Public endpoint, no auth required
      });
    } catch (error) {
      // if (error instanceof ApiClientError) {
      //   throw error;
      // }
      // throw new ApiClientError("Failed to fetch profile.");
      return null;
    }
  },

  /**
   * Bulk-fetch profiles by slugs (public endpoint)
   */
  async getProfilesBySlugs(slugs: string[]): Promise<{ profiles: any[] }> {
    if (slugs.length === 0) return { profiles: [] };
    try {
      return await apiRequest<{ profiles: any[] }>("profiles/slugs", {
        method: "GET",
        params: { slugs: slugs.join(",") },
        skipAuth: true,
      });
    } catch {
      return { profiles: [] };
    }
  },

  /**
   * Update a profile
   */
  async updateProfile(profileId: number | string, updateData: UpdateProfileDto): Promise<UpdateProfileResponse> {
    try {
      return await apiRequest<UpdateProfileResponse>(`profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update profile.");
    }
  },

  /**
   * List direct child profiles for a parent (requires access to parent).
   */
  async listSubProfiles(parentId: number): Promise<SubProfilesListResponseDto> {
    try {
      return await apiRequest<SubProfilesListResponseDto>(`profiles/${parentId}/sub-profiles`, {
        method: "GET",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to load sub-profiles.");
    }
  },

  /**
   * Create a sub-profile under a parent (parent must allow sub-profiles; ADMIN+ on parent).
   */
  async createSubProfile(parentId: number, dto: CreateSubProfileDto): Promise<UpdateProfileResponse> {
    try {
      return await apiRequest<UpdateProfileResponse>(`profiles/${parentId}/sub-profiles`, {
        method: "POST",
        body: JSON.stringify(dto),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create sub-profile.");
    }
  },

  /**
   * Delete a profile by id (e.g. a content card / sub-profile). Backend: DELETE profiles/:id.
   */
  async deleteSubProfile(subProfileId: string): Promise<void> {
    try {
      await apiRequest(`profiles/${subProfileId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete sub-profile.");
    }
  },
};

