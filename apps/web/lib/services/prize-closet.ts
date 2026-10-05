import { apiRequest } from "@/lib/api-client";

export type PrizeScope = "LOCAL" | "NATIONAL" | "PARTNER";
export type PrizeStatus = "PENDING" | "CHANGES" | "APPROVED" | "LIVE" | "COMPLETED" | "DECLINED";

export interface PrizeSubmission {
  id: number;
  profileId: number;
  businessName: string;
  marketName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  description: string;
  category: string | null;
  retailValue: number;
  winners: number;
  requestedStart: string | null;
  requestedEnd: string | null;
  scope: PrizeScope;
  partnerNotes: string | null;
  fulfillmentMethod: string;
  redemptionDays: number | null;
  fulfillmentInstructions: string | null;
  restrictions: string | null;
  imageUrl: string | null;
  title: string | null;
  blurb: string | null;
  redeemNote: string | null;
  status: PrizeStatus;
  entries: number;
  reviewNotes: string | null;
  createdAt: string;
}

export interface PrizeContext {
  businessName: string;
  marketName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
}

export interface PrizeSubmissionInput {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  description: string;
  category?: string;
  retailValue: number;
  winners: number;
  requestedStart?: string;
  requestedEnd?: string;
  scope: PrizeScope;
  partnerNotes?: string;
  fulfillmentMethod: string;
  redemptionDays?: number;
  fulfillmentInstructions?: string;
  restrictions?: string;
  imageKey?: string;
}

export const prizeClosetService = {
  current(marketId?: number) {
    return apiRequest<PrizeSubmission | null>("prize-closet/current", {
      skipAuth: true,
      params: marketId ? { marketId } : undefined,
    });
  },
  context(profileId: number) {
    return apiRequest<PrizeContext>(`prize-closet/profiles/${profileId}/context`);
  },
  mine(profileId: number) {
    return apiRequest<PrizeSubmission[]>(`prize-closet/profiles/${profileId}/submissions`);
  },
  submit(profileId: number, input: PrizeSubmissionInput) {
    return apiRequest<PrizeSubmission>(`prize-closet/profiles/${profileId}/submissions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export function formatPrizeDates(start: string | null, end: string | null): string {
  if (!start || !end) return "Dates to be confirmed";
  const fmt = (v: string) =>
    new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}
