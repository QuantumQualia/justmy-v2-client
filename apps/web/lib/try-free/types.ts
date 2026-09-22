export const TRY_FREE_CATEGORIES = ["personal", "business", "nonprofit"] as const;

export type TryFreeCategory = (typeof TRY_FREE_CATEGORIES)[number];

export type TryFreeTier = "seeded" | "unseeded";

export type TryFreeLocation = {
  query: string;
  zip: string;
  city: string | null;
  state: string | null;
  displayName: string;
};

export type ResolvedTryFreePlace = TryFreeLocation & { tier: TryFreeTier };

export type LocalProofLine = {
  source: "weather" | "search" | "events" | "news";
  text: string;
};

export type LocalProofResponse = {
  reply: string;
  lines: LocalProofLine[];
  tier: TryFreeTier;
  city: string | null;
  zip: string;
};

export type OrgProofResponse = {
  reply: string;
  lines: string[];
  businessName: string;
  website?: string | null;
  placeId?: string | null;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  listings?: Array<{
    placeId: string;
    name?: string;
    address?: string;
    rating?: number;
    reviewCount?: number;
  }>;
};

export type TryFreeChatLocation = {
  zip: string;
  city: string | null;
  state: string | null;
  displayName: string;
};

export type TryFreeChatResponse = {
  reply: string;
  askedForLocation: boolean;
  local: boolean;
  placeOnly?: boolean;
  location?: TryFreeChatLocation | null;
};

export type TryFreeTurn = {
  id: string;
  role: "sky" | "user";
  text: string;
};
