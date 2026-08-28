import { apiRequest } from "../api-client";

function withProfile(profileId: number | string) {
  return { profileId: String(profileId) };
}

export type SkyScanCheck = {
  key: string;
  label: string;
  status: "pass" | "fail" | "gap" | "unavailable";
  points: number;
  max: number;
  detail: string;
};

export type SkyScanAuditData = {
  engineVersion?: string;
  heuristic?: boolean;
  durationMs?: number;
  searchProvider?: string;
  reviewProvider?: string;
  geoProvider?: string;
  header?: {
    name?: string;
    address?: string | null;
    website?: string | null;
    category?: string | null;
    city?: string | null;
    zipCode?: string | null;
  };
  checks?: SkyScanCheck[];
  places?: { rating?: number; reviewCount?: number; lastReviewAt?: string | null };
  geoAnswers?: Array<{ query: string; summary: string; cited: boolean }>;
  flags?: { geoLocked?: boolean; kbSynced?: boolean; smartHandoff?: boolean };
  shareOfVoice?: {
    clientName: string;
    clientShare: number;
    competitors: Array<{ name: string; share: number; cited: boolean }>;
    rank: number;
  };
  extractedTargets?: Array<{ kind: string; label: string; detail: string }>;
};

export type SkyScanReport = {
  id: number;
  overallScore: number;
  scores: { search_indexing?: number; review_authority?: number; ai_presence?: number };
  auditData?: SkyScanAuditData | null;
  scannedAt: string;
};

export type BizOsCampaign = {
  id: number;
  name: string;
  status: string;
  targetKeywords?: string[] | null;
  competitor1Name?: string | null;
  competitor1Url?: string | null;
  competitor2Name?: string | null;
  competitor2Url?: string | null;
};

export type OAuthConnection = {
  provider: string;
  status: "connected" | "not_connected" | string;
  accountName?: string | null;
};

export type BizOsQueueRow = {
  id: number;
  title: string;
  description?: string | null;
  primaryGoal?: string | null;
  supportStatus: string;
  needsSupport: boolean;
  businessName: string;
  profileId: number;
  zipCode?: string | null;
  email?: string | null;
  slug?: string | null;
  openTaskCount: number;
  taskCount: number;
  latestLog?: { senderName?: string | null; messageText: string; createdAt: string } | null;
  updatedAt: string;
};

export type BizOsQueueTicket = BizOsQueueRow & {
  profile?: {
    id: number;
    name: string;
    slug?: string | null;
    zipCode?: string | null;
    email?: string | null;
    website?: string | null;
  };
  plan?: {
    id: number;
    title: string;
    description?: string | null;
    primaryGoal?: string | null;
    progress: number;
    tasks?: Array<{ id: number; taskText: string; status: string }>;
    logs?: Array<{
      id: number;
      senderType: string;
      senderName?: string | null;
      messageText: string;
      createdAt: string;
    }>;
  };
};

export const bizOsService = {
  lookup(businessName: string, zipCode: string) {
    return apiRequest<{
      businessName: string;
      zipCode: string;
      categories: string[];
      listings?: Array<{
        placeId: string;
        name?: string;
        address?: string;
        rating?: number;
        reviewCount?: number;
      }>;
      placeId: string | null;
      address: string | null;
      rating: number | null;
      reviewCount: number | null;
    }>("biz-os/claim/lookup", {
      method: "POST",
      body: JSON.stringify({ businessName, zipCode }),
      skipAuth: true,
    });
  },

  claimCategories(body: {
    businessName: string;
    zipCode: string;
    address?: string;
    exclude?: string[];
    count?: number;
  }) {
    return apiRequest<{ categories: string[] }>("biz-os/claim/categories", {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });
  },

  claimEmail(body: Record<string, unknown>) {
    return apiRequest<any>("biz-os/claim", {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });
  },

  claimGoogle(body: Record<string, unknown>) {
    return apiRequest<any>("biz-os/claim/google", {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });
  },

  onboardingMessage(profileId: number | string, stage: string, message: string) {
    return apiRequest<{ reply: string; stage: string; actions: Array<Record<string, unknown>> }>(
      "biz-os/onboarding/message",
      { method: "POST", params: withProfile(profileId), body: JSON.stringify({ stage, message }) },
    );
  },

  home(profileId: number | string) {
    return apiRequest<any>("biz-os/home", { params: withProfile(profileId) });
  },

  runSkyscan(profileId: number | string) {
    return apiRequest<SkyScanReport>("biz-os/skyscan/run", {
      method: "POST",
      params: withProfile(profileId),
    });
  },

  listSkyscans(profileId: number | string) {
    return apiRequest<SkyScanReport[]>("biz-os/skyscan", { params: withProfile(profileId) });
  },

  funCrew(profileId: number | string) {
    return apiRequest<{ ok: boolean; planId: number; supportDraft?: { summary?: string } }>(
      "biz-os/skyscan/funcrew",
      {
        method: "POST",
        params: withProfile(profileId),
      },
    );
  },

  listCampaigns(profileId: number | string) {
    return apiRequest<BizOsCampaign[]>("biz-os/campaigns", { params: withProfile(profileId) });
  },

  upsertCampaign(
    profileId: number | string,
    body: Partial<BizOsCampaign> & { name: string; makeActive?: boolean; targetKeywords?: string[] },
  ) {
    return apiRequest<BizOsCampaign>("biz-os/campaigns", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify(body),
    });
  },

  attachScanToCampaign(
    profileId: number | string,
    body: { campaignId?: number; newCampaignName?: string; keywords?: string[]; extractedTargets?: unknown },
  ) {
    return apiRequest<{ campaignId: number; plan: { id: number; title: string } }>("biz-os/campaigns/attach-scan", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify(body),
    });
  },

  listOAuthConnections(profileId: number | string) {
    return apiRequest<OAuthConnection[]>("biz-os/oauth-connections", { params: withProfile(profileId) });
  },

  setOAuthConnection(
    profileId: number | string,
    body: { provider: string; connect: boolean; accountName?: string },
  ) {
    return apiRequest<OAuthConnection>("biz-os/oauth-connections", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify(body),
    });
  },

  runSyndication(profileId: number | string, funCrewFallback = false) {
    return apiRequest<{
      jobId: number;
      receipt: Array<{ provider: string; status: string; label: string }>;
      bundleNote: string | null;
      message: string;
    }>("biz-os/syndication/run", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify({ funCrewFallback }),
    });
  },

  requestUpgrade(profileId: number | string, appName: string) {
    return apiRequest<{ ok: boolean; planId: number }>("biz-os/upgrade", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify({ appName }),
    });
  },

  listPlans(profileId: number | string) {
    return apiRequest<any[]>("biz-os/battle-plans", { params: withProfile(profileId) });
  },

  createPlan(profileId: number | string, primaryGoal: string, customGoal?: string) {
    return apiRequest<any>("biz-os/battle-plans", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify({ primaryGoal, customGoal }),
    });
  },

  getPlan(profileId: number | string, id: number) {
    return apiRequest<any>(`biz-os/battle-plans/${id}`, { params: withProfile(profileId) });
  },

  patchTask(profileId: number | string, planId: number, taskId: number, status: string) {
    return apiRequest<any>(`biz-os/battle-plans/${planId}/tasks/${taskId}`, {
      method: "PATCH",
      params: withProfile(profileId),
      body: JSON.stringify({ status }),
    });
  },

  addMessage(profileId: number | string, planId: number, messageText: string) {
    return apiRequest<any>(`biz-os/battle-plans/${planId}/messages`, {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify({ messageText }),
    });
  },

  requestSupport(profileId: number | string, planId: number, summary?: string) {
    return apiRequest<any>(`biz-os/battle-plans/${planId}/support`, {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify({ summary }),
    });
  },

  reputation(profileId: number | string) {
    return apiRequest<any>("biz-os/reputation", { params: withProfile(profileId) });
  },

  reputationSearch(profileId: number | string, query: string) {
    return apiRequest<any>("biz-os/reputation/search", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify({ query }),
    });
  },

  reputationVerify(profileId: number | string, body: Record<string, unknown>) {
    return apiRequest<any>("biz-os/reputation/verify", {
      method: "POST",
      params: withProfile(profileId),
      body: JSON.stringify(body),
    });
  },

  reputationSync(profileId: number | string) {
    return apiRequest<any>("biz-os/reputation/sync", {
      method: "POST",
      params: withProfile(profileId),
    });
  },

  weeklyDigest(profileId: number | string) {
    return apiRequest<any>("biz-os/digest/weekly", {
      method: "POST",
      params: withProfile(profileId),
    });
  },

  monthlyDigest(profileId: number | string) {
    return apiRequest<any>("biz-os/digest/monthly", {
      method: "POST",
      params: withProfile(profileId),
    });
  },

  adminQueue(status?: string) {
    return apiRequest<BizOsQueueRow[]>("biz-os/admin/queue", {
      params: status ? { status } : undefined,
    });
  },

  adminQueueTicket(id: number) {
    return apiRequest<BizOsQueueTicket>(`biz-os/admin/queue/${id}`);
  },

  adminUpdateQueue(id: number, body: { supportStatus?: string; message?: string }) {
    return apiRequest<BizOsQueueTicket>(`biz-os/admin/queue/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};
