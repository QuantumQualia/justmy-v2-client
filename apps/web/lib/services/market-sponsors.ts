import { apiRequest, ApiClientError } from "../api-client";

export { ApiClientError };

export type SponsorTier = "standard" | "exclusive";
export type SponsorPlacement = "newsstand" | "prize";

export interface MarketSponsor {
  id: number;
  marketId: number | null;
  national: boolean;
  profileId: number;
  profileName: string;
  profileSlug: string;
  audioTagline: string;
  cta: string;
  targetUrl: string;
  tier: SponsorTier | string;
  weight: number;
  placement: SponsorPlacement | string;
  pitch: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  impressionsCount: number;
  clicksCount: number;
  lastFeaturedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketSponsorInput {
  profileId: number;
  audioTagline: string;
  cta: string;
  targetUrl: string;
  tier: SponsorTier;
  weight: number;
  placement: SponsorPlacement;
  pitch: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  national: boolean;
}

export const marketSponsorsService = {
  async list(marketId: number | string): Promise<MarketSponsor[]> {
    try {
      return await apiRequest<MarketSponsor[]>(`markets/${marketId}/sponsors`);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to load sponsors.");
    }
  },

  async create(marketId: number | string, data: MarketSponsorInput): Promise<MarketSponsor> {
    try {
      return await apiRequest<MarketSponsor>(`markets/${marketId}/sponsors`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to create sponsor.");
    }
  },

  async update(
    marketId: number | string,
    sponsorId: number,
    data: MarketSponsorInput,
  ): Promise<MarketSponsor> {
    try {
      return await apiRequest<MarketSponsor>(`markets/${marketId}/sponsors/${sponsorId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to update sponsor.");
    }
  },

  async remove(marketId: number | string, sponsorId: number): Promise<void> {
    try {
      await apiRequest<void>(`markets/${marketId}/sponsors/${sponsorId}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError("Failed to remove sponsor.");
    }
  },
};
