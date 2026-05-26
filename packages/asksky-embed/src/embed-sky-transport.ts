import { ApiClientError } from "./api-client-error";
import type {
  AskSkySkyTransport,
  SkyConversationResponse,
  SkyMessageRequest,
  SkyResolveResponse,
  SkyStreamHandlers,
} from "./sky-types";

function embedApiBase(siteOrigin: string): string {
  return `${siteOrigin.replace(/\/$/, "")}/api/embed/sky`;
}

function parseSseDataLine(
  payload: string,
  handlers: SkyStreamHandlers,
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

export function createEmbedSkyTransport(siteOrigin: string): AskSkySkyTransport {
  const base = embedApiBase(siteOrigin);

  return {
    async skyResolve(params: { profileSlug: string; agentToken: string }): Promise<SkyResolveResponse> {
      const search = new URLSearchParams({
        profileSlug: params.profileSlug.trim(),
        agentToken: params.agentToken.trim(),
      });
      const response = await fetch(`${base}/resolve?${search.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new ApiClientError(
          (typeof data.message === "string" && data.message) ||
            (typeof data.error === "string" && data.error) ||
            "Failed to resolve AskSKY! profile and agent.",
          response.status,
        );
      }
      return data as unknown as SkyResolveResponse;
    },

    async skyGetConversation(
      conversationId: number,
      visitorToken: string,
    ): Promise<SkyConversationResponse> {
      const search = new URLSearchParams({ token: visitorToken });
      const response = await fetch(`${base}/conversations/${conversationId}?${search.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
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
    },

    async streamSkyMessage(body: SkyMessageRequest, handlers: SkyStreamHandlers): Promise<void> {
      const response = await fetch(`${base}/messages`, {
        method: "POST",
        headers: {
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
        let message = `AskSKY! request failed (${response.status})`;
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
    },
  };
}
