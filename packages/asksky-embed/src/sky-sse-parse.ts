import type { SkySseDonePayload, SkySseMetaPayload, SkyStreamHandlers } from "./sky-types";

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
    typeof parsed.requestingContactDetails === "boolean" ||
    typeof parsed.visitorContactCaptured === "boolean" ||
    parsed.refused === true ||
    parsed.refusal === true ||
    parsed.answerRefused === true;
  if (hasDoneShape) {
    return false;
  }
  return true;
}

function pickSuggestedQuestions(parsed: Record<string, unknown>): string[] | undefined {
  const raw = parsed.suggestedQuestions;
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const list = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.length > 0 ? list : undefined;
}

function normalizeMeta(parsed: Record<string, unknown>): SkySseMetaPayload | null {
  const conversationId =
    typeof parsed.conversationId === "number"
      ? parsed.conversationId
      : typeof parsed.conversation_id === "number"
        ? parsed.conversation_id
        : undefined;
  if (conversationId == null) {
    return null;
  }
  const visitorToken =
    (typeof parsed.visitorToken === "string" ? parsed.visitorToken : null) ??
    (typeof parsed.visitor_token === "string" ? parsed.visitor_token : null);

  const suggestedQuestions = pickSuggestedQuestions(parsed);
  return {
    conversationId,
    agentId: typeof parsed.agentId === "number" ? parsed.agentId : undefined,
    agentToken: typeof parsed.agentToken === "string" ? parsed.agentToken : undefined,
    visitorToken,
    userMessageId: typeof parsed.userMessageId === "number" ? parsed.userMessageId : undefined,
    assistantMessageId:
      typeof parsed.assistantMessageId === "number" ? parsed.assistantMessageId : undefined,
    refused: parsed.refused === true || parsed.refusal === true,
    visitorContactCaptured:
      typeof parsed.visitorContactCaptured === "boolean" ? parsed.visitorContactCaptured : undefined,
    requestingContactDetails:
      typeof parsed.requestingContactDetails === "boolean" ? parsed.requestingContactDetails : undefined,
    ...(suggestedQuestions != null ? { suggestedQuestions } : {}),
  };
}

function normalizeDone(parsed: Record<string, unknown>): SkySseDonePayload | null {
  const conversationId =
    typeof parsed.conversationId === "number"
      ? parsed.conversationId
      : typeof parsed.conversation_id === "number"
        ? parsed.conversation_id
        : undefined;
  if (conversationId == null) {
    return null;
  }
  const answer = typeof parsed.answer === "string" ? parsed.answer : "";
  const refused = parsed.refused === true || parsed.refusal === true || parsed.answerRefused === true;
  const retrievedDocs = Array.isArray(parsed.retrievedDocs) ? parsed.retrievedDocs : [];
  const suggestedQuestions = pickSuggestedQuestions(parsed);
  return {
    conversationId,
    agentId: typeof parsed.agentId === "number" ? parsed.agentId : undefined,
    assistantMessageId:
      typeof parsed.assistantMessageId === "number" ? parsed.assistantMessageId : undefined,
    answer,
    refused,
    retrievedDocs,
    visitorContactCaptured: parsed.visitorContactCaptured === true,
    requestingContactDetails: parsed.requestingContactDetails === true,
    ...(suggestedQuestions != null ? { suggestedQuestions } : {}),
  };
}

/** Legacy SSE without `event:` lines — `done` JSON includes answer + flags. */
function looksLikeDonePayload(parsed: Record<string, unknown>): boolean {
  if (typeof parsed.answer !== "string") {
    return false;
  }
  if (typeof parsed.requestingContactDetails === "boolean" && typeof parsed.visitorContactCaptured === "boolean") {
    return true;
  }
  if (Array.isArray(parsed.retrievedDocs)) {
    return true;
  }
  if (Array.isArray(parsed.suggestedQuestions)) {
    return true;
  }
  return false;
}

/**
 * Parse one SSE `data:` line for AskSKY streams.
 * @param sseEvent — from preceding `event:` line (`meta`, `done`, `delta`, `error`, …). When omitted, heuristics apply.
 */
export function parseSkySseDataLine(
  payload: string,
  handlers: SkyStreamHandlers,
  streamAccum: { current: string },
  sseEvent?: string,
): void {
  const trimmed = payload.trim();
  if (!trimmed || trimmed === "[DONE]") {
    return;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    if (sseEvent !== "done" && sseEvent !== "meta") {
      handlers.onTextDelta?.(trimmed);
      streamAccum.current += trimmed;
    }
    return;
  }

  const ev = (sseEvent ?? "").trim().toLowerCase();

  if (ev === "error" || typeof parsed.error === "string") {
    const msg =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : typeof parsed.error === "string"
          ? parsed.error
          : "Request failed.";
    handlers.onError?.(msg);
    return;
  }

  const refusal =
    parsed.refusal === true || parsed.refused === true || parsed.answerRefused === true;

  if (isLikelySseErrorEventPayload(parsed, refusal)) {
    handlers.onError?.((parsed.message as string).trim());
    return;
  }

  if (ev === "meta") {
    const meta = normalizeMeta(parsed);
    if (meta) {
      handlers.onMeta?.(meta);
    }
    if (refusal) {
      handlers.onRefusal?.();
    }
    return;
  }

  if (ev === "done") {
    const done = normalizeDone(parsed);
    if (done) {
      handlers.onDone?.(done);
      if (done.refused) {
        handlers.onRefusal?.();
      }
    }
    return;
  }

  if (looksLikeDonePayload(parsed)) {
    const done = normalizeDone(parsed);
    if (done) {
      handlers.onDone?.(done);
      if (done.refused) {
        handlers.onRefusal?.();
      }
    }
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

  const meta = normalizeMeta(parsed);
  if (meta && (meta.visitorToken != null || meta.userMessageId != null || meta.assistantMessageId != null)) {
    handlers.onMeta?.(meta);
  }
}

/** Parse a full SSE event block (`event:` + `data:` lines). */
export function parseSkySseRawEvent(
  rawEvent: string,
  handlers: SkyStreamHandlers,
  streamAccum: { current: string },
): void {
  let eventName: string | undefined;
  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      parseSkySseDataLine(line.slice(5), handlers, streamAccum, eventName);
    }
  }
}
