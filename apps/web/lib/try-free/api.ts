import { ApiClientError } from "@/lib/api-client";
import type {
  LocalProofResponse,
  OrgProofResponse,
  TryFreeChatResponse,
  TryFreeCategory,
  TryFreeTier,
} from "@/lib/try-free/types";

export async function fetchLocalProof(input: {
  zip: string;
  city?: string | null;
  state?: string | null;
  tier: TryFreeTier;
}): Promise<LocalProofResponse> {
  const res = await fetch("/api/try-free/local-proof", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as LocalProofResponse & { message?: string };
  if (!res.ok) {
    throw new ApiClientError(data.message || "Sky couldn't look that up just now.", res.status);
  }
  return data;
}

export async function fetchOrgProof(input: {
  name: string;
  website?: string;
  zip?: string;
  city?: string | null;
  category: "business" | "nonprofit";
}): Promise<OrgProofResponse> {
  const res = await fetch("/api/try-free/org-proof", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as OrgProofResponse & { message?: string };
  if (!res.ok) {
    throw new ApiClientError(data.message || "Sky couldn't find that organization.", res.status);
  }
  return data;
}

export async function fetchTryFreeChat(input: {
  message: string;
  zip?: string;
  city?: string | null;
  state?: string | null;
  category?: TryFreeCategory | null;
  thread?: string;
}): Promise<TryFreeChatResponse> {
  const res = await fetch("/api/try-free/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as TryFreeChatResponse & { message?: string };
  if (!res.ok) {
    throw new ApiClientError(data.message || "Sky couldn't answer just now.", res.status);
  }
  return data;
}
