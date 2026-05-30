import type { SkyStreamHandlers } from "./sky-types";

function isLikelySseErrorEventPayload(parsed: Record<string, unknown>, refusal: boolean): boolean {
  if (refusal) {
    return false;
  }
  const m = parsed.message;
  if (typeof m !== "string" || !m.trim()) {
    return false;
  }
  if (typeof parsed.error === "string") {
    return false;
  }
  const hasStreamContent =
    typeof parsed.delta === "string" ||
    typeof parsed.text === "string" ||
    typeof parsed.content === "string" ||
    typeof parsed.token === "string";
  if (hasStreamContent) {
    return false;
  }
  const hasMeta =
    typeof parsed.conversationId === "number" ||
    typeof parsed.conversation_id === "number" ||
    typeof parsed.visitorToken === "string" ||
    typeof parsed.visitor_token === "string" ||
    typeof parsed.userMessageId === "number" ||
    typeof parsed.assistantMessageId === "number";
  if (hasMeta) {
    return false;
  }
  const hasDoneShape =
    typeof parsed.answer === "string" ||
    Array.isArray(parsed.retrievedDocs) ||
    parsed.refused === true ||
    parsed.refusal === true ||
    parsed.answerRefused === true;
  if (hasDoneShape) {
    return false;
  }
  return true;
}

/** Parse one SSE `data:` line (JSON or raw text) for AskSKY streams. */
export function parseSkySseDataLine(
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

  if (isLikelySseErrorEventPayload(parsed, refusal)) {
    handlers.onError?.((parsed.message as string).trim());
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
