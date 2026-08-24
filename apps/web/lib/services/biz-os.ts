import { apiRequest } from "../api-client";

function withProfile(profileId: number | string) {
  return { profileId: String(profileId) };
}

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
    return apiRequest<any>("biz-os/skyscan/run", {
      method: "POST",
      params: withProfile(profileId),
    });
  },

  listSkyscans(profileId: number | string) {
    return apiRequest<any[]>("biz-os/skyscan", { params: withProfile(profileId) });
  },

  funCrew(profileId: number | string) {
    return apiRequest<any>("biz-os/skyscan/funcrew", {
      method: "POST",
      params: withProfile(profileId),
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
