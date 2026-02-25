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
   * Get profile by slug (public endpoint)
   */
  async getProfileBySlug(slug: string): Promise<{ profile: any }> {
    try {
      return await apiRequest<{ profile: any }>(`profiles/slug/${slug}`, {
        method: "GET",
        skipAuth: true, // Public endpoint, no auth required
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch profile.");
    }
  },

  /**
   * Update a profile
   */
  async updateProfile(profileId: number, updateData: UpdateProfileDto): Promise<UpdateProfileResponse> {
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
};

