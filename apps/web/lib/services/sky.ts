import { buildApiUrl } from "@/lib/config";
import { ApiClientError } from "@/lib/api-client";
import { tokenStorage } from "@/lib/storage/token-storage";

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

export async function skyResolve(params: {
  profileSlug: string;
  agentToken: string;
}): Promise<SkyResolveResponse> {
  const url = buildApiUrl("sky/resolve");
  const search = new URLSearchParams({
    profileSlug: params.profileSlug.trim(),
    agentToken: params.agentToken.trim(),
  });
  const headers = await skyHeaders();
  const response = await fetch(`${url}?${search.toString()}`, {
    method: "GET",
    headers: { ...headers, Accept: "application/json" },
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiClientError(
      (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        "Failed to resolve AskSKY profile and agent.",
      response.status,
    );
  }
  return data as unknown as SkyResolveResponse;
}

export async function skyGetConversation(
  conversationId: number,
  visitorToken: string,
): Promise<SkyConversationResponse> {
  const url = buildApiUrl(`sky/conversations/${conversationId}`);
  const search = new URLSearchParams({ token: visitorToken });
  const headers = await skyHeaders();
  const response = await fetch(`${url}?${search.toString()}`, {
    method: "GET",
    headers: { ...headers, Accept: "application/json" },
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiClientError(
      (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        "Failed to load conversation.",
      response.status,
    );
  }
  return data as unknown as SkyConversationResponse;
}

function parseSseDataLine(
  payload: string,
  handlers: SkyStreamHandlers,
  /** Text already delivered via `onTextDelta` for this request (used to avoid duplicating `answer` on refusal `done`). */
  streamAccum: { current: string },
): void {
  const trimmed = payload.trim();
  if (!trimmed || trimmed === "[DONE]") {
    return;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    handlers.onTextDelta?.(trimmed);
    streamAccum.current += trimmed;
    return;
  }

  const refusal =
    parsed.refusal === true || parsed.refused === true || parsed.answerRefused === true;

  if (typeof parsed.error === "string") {
    handlers.onError?.(parsed.error);
    return;
  }

  let delta =
    (typeof parsed.delta === "string" && parsed.delta) ||
    (typeof parsed.text === "string" && parsed.text) ||
    (typeof parsed.content === "string" && parsed.content) ||
    (typeof parsed.token === "string" && parsed.token) ||
    "";

  if (refusal && !delta) {
    const fallback =
      (typeof parsed.answer === "string" && parsed.answer) ||
      (typeof parsed.message === "string" && parsed.message) ||
      (typeof parsed.refusalMessage === "string" && parsed.refusalMessage) ||
      "";
    if (fallback) {
      const accTrim = streamAccum.current.trimEnd();
      const fbTrim = fallback.trimEnd();
      if (accTrim !== fbTrim) {
        delta = fallback;
      }
    }
  }

  if (delta) {
    handlers.onTextDelta?.(delta);
    streamAccum.current += delta;
  }

  if (refusal) {
    handlers.onRefusal?.();
  }

  const conversationId =
    typeof parsed.conversationId === "number"
      ? parsed.conversationId
      : typeof parsed.conversation_id === "number"
        ? parsed.conversation_id
        : undefined;
  const visitorToken =
    (typeof parsed.visitorToken === "string" && parsed.visitorToken) ||
    (typeof parsed.visitor_token === "string" && parsed.visitor_token) ||
    undefined;

  if (conversationId != null || visitorToken) {
    handlers.onMeta?.({ conversationId, visitorToken });
  }
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
    body: JSON.stringify({
      profileSlug: body.profileSlug,
      agentToken: body.agentToken,
      message: body.message,
      conversationId: body.conversationId ?? 0,
      visitorToken: body.visitorToken ?? "",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = `AskSKY request failed (${response.status})`;
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      message = j.message || j.error || message;
    } catch {
      if (text) {
        message = text.slice(0, 200);
      }
    }
    handlers.onError?.(message);
    throw new ApiClientError(message, response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError?.("No response body from AskSKY.");
    throw new ApiClientError("No response body from AskSKY.");
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
          parseSseDataLine(line.slice(5), handlers, streamAccum);
        }
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    for (const line of tail.split("\n")) {
      if (line.startsWith("data:")) {
        parseSseDataLine(line.slice(5), handlers, streamAccum);
      }
    }
  }
}
