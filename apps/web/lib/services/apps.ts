/**
 * Apps API Service
 * Handles all app-related API calls
 */

import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export interface AppNavigationResponseDto {
  label: string;
  path?: string | null;
  isHome?: boolean;
  isActive?: boolean;
  children?: AppNavigationResponseDto[];
}

export interface AppResponseDto {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  navigation?: AppNavigationResponseDto[];
  osApps?: Array<{
    osId: number;
    isWelcome: boolean;
    isStandard: boolean;
  }>;
}

export interface CreateAppDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAppDto {
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CreateAppNavigationDto {
  appId: number;
  menu: AppNavigationResponseDto[];
}

export interface ProfileAppResponseDto {
  id: number;
  profileId: number;
  appId: number;
  app?: {
    id: number;
    name: string;
    icon?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AppToOsDto {
  appId: number;
  isStandard?: boolean;
  isWelcome?: boolean;
}

export interface AddAppsToOsDto {
  apps: AppToOsDto[];
}

/**
 * Apps Service
 */
export const appsService = {
  /**
   * Get all apps
   */
  async getAllApps(): Promise<AppResponseDto[]> {
    try {
      const response = await apiRequest<{ apps: AppResponseDto[] }>(`os-apps/apps`, {
        method: "GET",
      });
      return response.apps;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch all apps.");
    }
  },

  /**
   * Get apps by OS ID
   */
  async getAppsByOS(osId: number): Promise<AppResponseDto[]> {
    try {
      const response = await apiRequest<{ apps: AppResponseDto[] }>(`os-apps/apps/os/${osId}`, {
        method: "GET",
      });
      return response.apps;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch apps for OS.");
    }
  },

  /**
   * Get app by ID
   */
  async getAppById(id: number): Promise<AppResponseDto> {
    try {
      const response = await apiRequest<{ app: AppResponseDto }>(`os-apps/apps/${id}`, {
        method: "GET",
      });
      return response.app;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch app.");
    }
  },

  /**
   * Create a new app
   */
  async createApp(data: CreateAppDto): Promise<AppResponseDto> {
    try {
      const response = await apiRequest<{ app: AppResponseDto }>("os-apps/apps", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.app;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create app.");
    }
  },

  /**
   * Update an app
   */
  async updateApp(id: number, data: UpdateAppDto): Promise<AppResponseDto> {
    try {
      const response = await apiRequest<{ app: AppResponseDto }>(`os-apps/apps/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.app;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to update app.");
    }
  },

  /**
   * Delete an app
   */
  async deleteApp(id: number): Promise<void> {
    try {
      await apiRequest(`os-apps/apps/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to delete app.");
    }
  },

  // ==================== APP NAVIGATION ENDPOINTS ====================

  /**
   * Create app navigation
   */
  async createAppNavigation(data: CreateAppNavigationDto): Promise<any> {
    try {
      const response = await apiRequest<{ navigation: any }>("os-apps/apps/navigation", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.navigation;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to create app navigation.");
    }
  },

  /**
   * Get app navigation (full menu JSON) by app ID
   */
  async getAppNavigationByAppId(
    appId: number
  ): Promise<AppNavigationResponseDto[] | null> {
    try {
      const response = await apiRequest<{
        navigation: AppNavigationResponseDto[] | null;
      }>(`os-apps/apps/${appId}/navigation`, {
        method: "GET",
      });
      return response.navigation;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch app navigation.");
    }
  },

  // ==================== PROFILE APP ENDPOINTS ====================

  /**
   * Get profile apps
   */
  async getProfileApps(profileId: number): Promise<ProfileAppResponseDto[]> {
    try {
      const response = await apiRequest<{ profileApps: ProfileAppResponseDto[] }>(
        `os-apps/profiles/${profileId}/apps`,
        {
          method: "GET",
        }
      );
      return response.profileApps;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch profile apps.");
    }
  },

  /**
   * Enable profile app
   */
  async enableProfileApp(profileId: number, appId: number): Promise<ProfileAppResponseDto> {
    try {
      const response = await apiRequest<{ profileApp: ProfileAppResponseDto }>(
        `os-apps/profiles/${profileId}/apps/${appId}/enable`,
        {
          method: "POST",
        }
      );
      return response.profileApp;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to enable profile app.");
    }
  },

  /**
   * Disable profile app
   */
  async disableProfileApp(profileId: number, appId: number): Promise<void> {
    try {
      await apiRequest(`os-apps/profiles/${profileId}/apps/${appId}/disable`, {
        method: "POST",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to disable profile app.");
    }
  },

  /**
   * Get default app for profile
   */
  async getDefaultAppForProfile(profileId: number): Promise<AppResponseDto | null> {
    try {
      const response = await apiRequest<{ app: AppResponseDto | null }>(
        `os-apps/profiles/${profileId}/default-app`,
        {
          method: "GET",
        }
      );
      return response.app;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to fetch default app for profile.");
    }
  },

  // ==================== OS-APP RELATIONSHIP ENDPOINTS ====================

  /**
   * Add or update app to OS
   */
  async addAppToOS(
    osId: number,
    appId: number,
    data: { isStandard: boolean; isWelcome: boolean }
  ): Promise<void> {
    try {
      await apiRequest(`os-apps/os/${osId}/apps/${appId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to add/update app to OS.");
    }
  },

  /**
   * Remove app from OS
   */
  async removeAppFromOS(osId: number, appId: number): Promise<void> {
    try {
      await apiRequest(`os-apps/os/${osId}/apps/${appId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to remove app from OS.");
    }
  },

  /**
   * Set all apps for an OS at once
   */
  async addAppsToOS(osId: number, data: AddAppsToOsDto): Promise<void> {
    try {
      await apiRequest<{ message: string }>(`os-apps/os/${osId}/apps`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError("Failed to save apps for OS.");
    }
  },
};
