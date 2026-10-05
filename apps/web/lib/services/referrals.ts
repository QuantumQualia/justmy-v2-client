import { apiRequest } from "@/lib/api-client";

export interface ReferrerPreview {
  code: string;
  /** First name plus last initial, e.g. "JR R." */
  displayName: string;
  firstName: string;
}

export interface BusinessClaimPreview {
  token: string;
  status: "PENDING" | "CLAIMED";
  business: {
    profileId: number;
    name: string;
    slug: string;
    city: string | null;
    zipCode: string | null;
    phone: string | null;
    website: string | null;
    email: string | null;
    photo: string | null;
    categories: string[];
    googleStarRating: number | null;
    googleRatingCount: number | null;
    hasHours: boolean;
    hasAddress: boolean;
    hasStory: boolean;
  };
  firstReferrer: string | null;
  otherReferrers: number;
}

export const referralsService = {
  referrer(code: string) {
    return apiRequest<ReferrerPreview>(`profiles/referral/${encodeURIComponent(code)}`, { skipAuth: true });
  },
  inviteFriend(profileId: number, email: string) {
    return apiRequest<{ sent: boolean; remainingToday: number }>(`profiles/${profileId}/referrals/invite`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  claimPreview(token: string) {
    return apiRequest<BusinessClaimPreview>(`business-referrals/claim/${encodeURIComponent(token)}`, {
      skipAuth: true,
    });
  },
};
