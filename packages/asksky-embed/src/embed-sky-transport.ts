import { ApiClientError } from "./api-client-error";
import { formatSkyApiErrorPayload } from "./sky-error-format";
import { buildSkyMessageRequestBody } from "./sky-message-body";
import { parseSkySseRawEvent } from "./sky-sse-parse";
import type {
  AskSkySkyTransport,
  SkyConversationResponse,
  SkyLeadCaptureRequest,
  SkyLeadCaptureResponse,
  SkyMessageRequest,
  SkyResolveResponse,
  SkyStreamHandlers,
} from "./sky-types";

function embedApiBase(siteOrigin: string): string {
  return `${siteOrigin.replace(/\/$/, "")}/api/embed/sky`;
}

function skyResolveCacheKey(params: { profileSlug: string; agentToken: string }): string {
  return `${params.profileSlug.trim()}\u0000${params.agentToken.trim()}`;
}

function skyGetConversationInflightKey(conversationId: number, visitorToken: string): string {
  return `${conversationId}\u0000${visitorToken.trim()}`;
}

export function createEmbedSkyTransport(siteOrigin: string): AskSkySkyTransport {
  const base = embedApiBase(siteOrigin);
  /** One in-flight resolve per agent (StrictMode double-effect shares one fetch). */
  const resolveInflight = new Map<string, Promise<SkyResolveResponse>>();
  /** Successful resolve for this page session — reopening the chatbot does not hit `/resolve` again. */
  const resolveResult = new Map<string, SkyResolveResponse>();
  /** One in-flight `getConversation` per thread (StrictMode remount shares one fetch). */
  const conversationInflight = new Map<string, Promise<SkyConversationResponse>>();

  return {
    async skyResolve(params: { profileSlug: string; agentToken: string }): Promise<SkyResolveResponse> {
      const key = skyResolveCacheKey(params);
      const hit = resolveResult.get(key);
      if (hit) {
        return hit;
      }
      const existing = resolveInflight.get(key);
      if (existing) {
        return existing;
      }

      const search = new URLSearchParams({
        profileSlug: params.profileSlug.trim(),
        agentToken: params.agentToken.trim(),
      });

      const pending = (async (): Promise<SkyResolveResponse> => {
        try {
          const response = await fetch(`${base}/resolve?${search.toString()}`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
          if (!response.ok) {
            throw new ApiClientError(
              formatSkyApiErrorPayload(data, "Failed to resolve AskSKY! profile and agent."),
              response.status,
            );
          }
          const resolved = data as unknown as SkyResolveResponse;
          resolveResult.set(key, resolved);
          return resolved;
        } finally {
          resolveInflight.delete(key);
        }
      })();

      resolveInflight.set(key, pending);
      return pending;
    },

    async skyGetConversation(
      conversationId: number,
      visitorToken: string,
    ): Promise<SkyConversationResponse> {
      const ck = skyGetConversationInflightKey(conversationId, visitorToken);
      const existing = conversationInflight.get(ck);
      if (existing) {
        return existing;
      }

      const search = new URLSearchParams({ token: visitorToken });
      const pending = (async (): Promise<SkyConversationResponse> => {
        try {
          const response = await fetch(`${base}/conversations/${conversationId}?${search.toString()}`, {
            method: "GET",
            headers: { Accept: "application/json" },
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
          conversationInflight.delete(ck);
        }
      })();

      conversationInflight.set(ck, pending);
      return pending;
    },

    async skyPostLeadCapture(
      conversationId: number,
      body: SkyLeadCaptureRequest,
    ): Promise<SkyLeadCaptureResponse> {
      const response = await fetch(`${base}/conversations/${conversationId}/lead-capture`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new ApiClientError(
          formatSkyApiErrorPayload(data, "Failed to record lead in conversation."),
          response.status,
        );
      }
      const messageId = data.messageId;
      return {
        messageId: typeof messageId === "number" ? messageId : Number(messageId),
      };
    },

    async streamSkyMessage(body: SkyMessageRequest, handlers: SkyStreamHandlers): Promise<void> {
      const response = await fetch(`${base}/messages`, {
        method: "POST",
        headers: {
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

          parseSkySseRawEvent(rawEvent, handlers, streamAccum);
        }
      }

      const tail = buffer.trim();
      if (tail) {
        parseSkySseRawEvent(tail, handlers, streamAccum);
      }
    },
  };
}
