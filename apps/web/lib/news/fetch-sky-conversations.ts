import { ApiClientError } from "@/lib/api-client";
import type { SkySearchData } from "@/lib/news/fetch-sky-search";

export type SkyMeConversationListItem = {
  id: number;
  title: string | null;
  updatedAt: string;
  createdAt: string;
};

export type SkyMeMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  model?: string | null;
  retrievedDocs?: unknown[] | null;
  createdAt: string;
};

export type SkyMeConversationDetail = {
  conversationId: number;
  visitorToken: string | null;
  title: string | null;
  messages: SkyMeMessage[];
};

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T | { message?: string };
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && data.message
        ? String(data.message)
        : fallback;
    throw new ApiClientError(message, res.status);
  }
  return data as T;
}

export async function fetchSkyConversations(
  marketId?: number,
): Promise<SkyMeConversationListItem[]> {
  const qs =
    typeof marketId === "number" && marketId > 0 ? `?marketId=${marketId}` : "";
  const res = await fetch(`/api/news/sky/conversations${qs}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await readJson<{ conversations?: SkyMeConversationListItem[] }>(
    res,
    "Unable to load recent searches.",
  );
  return Array.isArray(data.conversations) ? data.conversations : [];
}

export async function fetchSkyConversation(
  id: number,
): Promise<SkyMeConversationDetail> {
  const res = await fetch(`/api/news/sky/conversations/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return readJson<SkyMeConversationDetail>(res, "Unable to load that search.");
}

export async function renameSkyConversation(
  id: number,
  title: string,
): Promise<SkyMeConversationListItem> {
  const res = await fetch(`/api/news/sky/conversations/${id}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
    cache: "no-store",
  });
  return readJson<SkyMeConversationListItem>(res, "Unable to rename that search.");
}

export async function deleteSkyConversation(id: number): Promise<void> {
  const res = await fetch(`/api/news/sky/conversations/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  await readJson<{ message?: string }>(res, "Unable to delete that search.");
}

export async function claimSkyConversation(params: {
  conversationId: number;
  visitorToken: string;
}): Promise<void> {
  const res = await fetch("/api/news/sky/conversations", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  await readJson<{ conversation?: SkyMeConversationListItem }>(
    res,
    "Unable to save this search to your account.",
  );
}

export function snapshotFromRetrievedDocs(
  retrievedDocs: unknown[] | null | undefined,
): { data: SkySearchData; followUpQuestions: string[] } | null {
  if (!Array.isArray(retrievedDocs) || retrievedDocs.length === 0) return null;
  const first = retrievedDocs[0];
  if (!first || typeof first !== "object") return null;
  const rec = first as {
    snapshot?: Partial<SkySearchData>;
    followUpQuestions?: unknown;
  };
  const snapshot = rec.snapshot;
  if (!snapshot || typeof snapshot !== "object") return null;
  return {
    data: {
      mycards: Array.isArray(snapshot.mycards) ? snapshot.mycards : [],
      posts: Array.isArray(snapshot.posts) ? snapshot.posts : [],
      webResults: Array.isArray(snapshot.webResults) ? snapshot.webResults : [],
    },
    followUpQuestions: Array.isArray(rec.followUpQuestions)
      ? rec.followUpQuestions.filter((q): q is string => typeof q === "string")
      : [],
  };
}
