import { buildApiUrl } from "@/lib/config";
import { ApiClientError } from "@/lib/api-client";
import { tokenStorage } from "@/lib/storage/token-storage";
import {
  buildSkyMessageRequestBody,
  formatSkyApiErrorPayload,
  parseSkySseDataLine,
} from "@workspace/asksky-embed";

export interface SkyResolveResponse {
  name: string;
  slug: string;
  tagline?: string;
  photo?: string;
  banner?: string;
  agentName: string;
  agentToken: string;
  greetingMessage?: string | null;
  hasKnowledgeBase: boolean;
}

export interface SkyMessageRequest {
  profileSlug: string;
  agentToken: string;
  message: string;
  conversationId?: number | null;
  visitorToken?: string | null;
}

export interface SkyConversationMessage {
  id: number;
  role: string;
  content: string;
  model?: string;
  retrievedDocs?: unknown[];
  createdAt?: string;
}

export interface SkyConversationResponse {
  conversationId: number;
  agentName: string;
  agentToken: string;
  messages: SkyConversationMessage[];
}

export type SkyStreamHandlers = {
  onTextDelta?: (delta: string) => void;
  onMeta?: (meta: { conversationId?: number; visitorToken?: string }) => void;
  onRefusal?: () => void;
  onError?: (message: string) => void;
};

async function skyHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await tokenStorage.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function skyResolveKey(params: { profileSlug: string; agentToken: string }): string {
  return `${params.profileSlug.trim()}\u0000${params.agentToken.trim()}`;
}

function skyGetConversationInflightKey(conversationId: number, visitorToken: string): string {
  return `${conversationId}\u0000${visitorToken.trim()}`;
}

const skyResolveInflight = new Map<string, Promise<SkyResolveResponse>>();
/** Successful resolve for this tab session — e.g. chatbot reopen without refetch. */
const skyResolveResult = new Map<string, SkyResolveResponse>();

export async function skyResolve(params: {
  profileSlug: string;
  agentToken: string;
}): Promise<SkyResolveResponse> {
  const key = skyResolveKey(params);
  const hit = skyResolveResult.get(key);
  if (hit) {
    return hit;
  }
  const inflight = skyResolveInflight.get(key);
  if (inflight) {
    return inflight;
  }

  const url = buildApiUrl("sky/resolve");
  const search = new URLSearchParams({
    profileSlug: params.profileSlug.trim(),
    agentToken: params.agentToken.trim(),
  });

  const pending = (async (): Promise<SkyResolveResponse> => {
    try {
      const headers = await skyHeaders();
      const response = await fetch(`${url}?${search.toString()}`, {
        method: "GET",
        headers: { ...headers, Accept: "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new ApiClientError(
          formatSkyApiErrorPayload(data, "Failed to resolve AskSKY! profile and agent."),
          response.status,
        );
      }
      const resolved = data as unknown as SkyResolveResponse;
      skyResolveResult.set(key, resolved);
      return resolved;
    } finally {
      skyResolveInflight.delete(key);
    }
  })();

  skyResolveInflight.set(key, pending);
  return pending;
}

const skyGetConversationInflight = new Map<string, Promise<SkyConversationResponse>>();

export async function skyGetConversation(
  conversationId: number,
  visitorToken: string,
): Promise<SkyConversationResponse> {
  const ck = skyGetConversationInflightKey(conversationId, visitorToken);
  const existing = skyGetConversationInflight.get(ck);
  if (existing) {
    return existing;
  }

  const url = buildApiUrl(`sky/conversations/${conversationId}`);
  const search = new URLSearchParams({ token: visitorToken });

  const pending = (async (): Promise<SkyConversationResponse> => {
    try {
      const headers = await skyHeaders();
      const response = await fetch(`${url}?${search.toString()}`, {
        method: "GET",
        headers: { ...headers, Accept: "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new ApiClientError(
          formatSkyApiErrorPayload(data, "Failed to load conversation."),
          response.status,
        );
      }
      return data as unknown as SkyConversationResponse;
    } finally {
      skyGetConversationInflight.delete(ck);
    }
  })();

  skyGetConversationInflight.set(ck, pending);
  return pending;
}

/**
 * POST /sky/messages — streamed SSE body (no JSON response).
 */
export async function streamSkyMessage(
  body: SkyMessageRequest,
  handlers: SkyStreamHandlers,
): Promise<void> {
  const url = buildApiUrl("sky/messages");
  const headers = await skyHeaders();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildSkyMessageRequestBody(body)),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const fallback = `AskSKY! request failed (${response.status})`;
    let message = fallback;
    try {
      message = formatSkyApiErrorPayload(JSON.parse(text) as unknown, fallback);
    } catch {
      if (text.trim()) {
        message = text.slice(0, 200);
      }
    }
    handlers.onError?.(message);
    throw new ApiClientError(message, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError?.("No response body from AskSKY!.");
    throw new ApiClientError("No response body from AskSKY!.", 502);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const streamAccum = { current: "" };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const lines = rawEvent.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          parseSkySseDataLine(line.slice(5), handlers, streamAccum);
        }
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    for (const line of tail.split("\n")) {
      if (line.startsWith("data:")) {
        parseSkySseDataLine(line.slice(5), handlers, streamAccum);
      }
    }
  }
}
