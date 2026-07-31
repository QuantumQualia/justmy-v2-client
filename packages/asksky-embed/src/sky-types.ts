/** Linked myFORM shown in AskSKY when published; from `GET /sky/resolve`. */
export interface SkyResolveContactForm {
  id: number;
  title: string;
  slug: string;
}

/** Share channel for the optional post-answer share tray (`GET /sky/resolve` `shareTray`). */
export type SkyShareTrayChannel = "sms" | "whatsapp" | "facebook" | "x";

/**
 * Optional per-agent post-answer share tray. Shown only when `enabled` and
 * `shareUrl` + `shareText` are non-empty. Ask Another Question is always on and
 * is not part of this config.
 */
export interface SkyShareTrayConfig {
  enabled: boolean;
  /** Ready CTA label (required when share tray is enabled). */
  readyLabel: string;
  /** Closing line shown above the share tray after Ready. */
  closingMessage?: string;
  shareUrl: string;
  shareText: string;
  /** Subset of channels; omit or empty ⇒ all four. */
  channels?: SkyShareTrayChannel[];
}

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
  /**
   * True only when the agent has live search enabled and a non-empty domain allowlist.
   * Domains themselves are admin-only and are not returned on resolve.
   */
  liveSearchEnabled?: boolean;
  /**
   * Up to ~3 example questions from the agent’s knowledge (empty when no KB).
   * Older APIs may omit this field — treat as [].
   */
  suggestedQuestions?: string[];
  /** Published contact form for this agent, or null if none. */
  contactForm?: SkyResolveContactForm | null;
  /** Opt-in Ready CTA + viral share tray; omit/null when disabled. */
  shareTray?: SkyShareTrayConfig | null;
}

/** Citation / retrieval metadata on SSE `done` and conversation history. */
export type SkyRetrievedDocSourceKind = "website" | "document" | "unknown" | "live";

export type SkyRetrievedDoc = {
  index: number;
  agentId: number | null;
  /** Null for live-search citations. */
  knowledgeSourceId: number | null;
  pageId: number | null;
  pageNumber: number | null;
  sourceKind: SkyRetrievedDocSourceKind;
  title: string | null;
  url: string | null;
  snippet: string;
  score: number;
  chunkIndex: number;
};

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
  /** May be `"openai-live-search"` | `"no-match"` | `"openai"` | … */
  model?: string | null;
  retrievedDocs?: SkyRetrievedDoc[] | unknown[] | null;
  createdAt?: string;
}

export interface SkyConversationResponse {
  conversationId: number;
  agentName?: string | null;
  agentToken?: string | null;
  /** Server-derived: email in a user message or a lead-capture row exists. */
  visitorContactCaptured?: boolean;
  messages: SkyConversationMessage[];
}

/** First SSE `meta` event per turn (subset aligned with backend). */
export type SkySseMetaPayload = {
  conversationId: number;
  agentId?: number;
  agentToken?: string;
  visitorToken?: string | null;
  userMessageId?: number;
  assistantMessageId?: number;
  refused?: boolean;
  visitorContactCaptured?: boolean;
  requestingContactDetails?: boolean;
  /** Present when non-empty; same semantics as `GET /sky/resolve` `suggestedQuestions`. */
  suggestedQuestions?: string[];
};

/** Final SSE `done` event per turn. */
export type SkySseDonePayload = {
  conversationId: number;
  agentId?: number;
  assistantMessageId?: number;
  answer: string;
  refused: boolean;
  retrievedDocs: SkyRetrievedDoc[] | unknown[];
  visitorContactCaptured: boolean;
  requestingContactDetails: boolean;
  /** Same list as `meta` for that turn when non-empty. */
  suggestedQuestions?: string[];
};

export interface SkyLeadCaptureRequest {
  profileSlug: string;
  agentToken: string;
  visitorToken: string;
  formTitle?: string;
  fields: Record<string, unknown>;
}

export interface SkyLeadCaptureResponse {
  messageId: number;
}

export type SkyStreamHandlers = {
  onTextDelta?: (delta: string) => void;
  /** Emitted from SSE `meta` (and legacy payloads that include ids). */
  onMeta?: (meta: SkySseMetaPayload) => void;
  /** Emitted from SSE `done` with final flags and full answer text. */
  onDone?: (done: SkySseDonePayload) => void;
  /** Knowledge retrieval miss / canned refusal (`refused` on meta or done). */
  onRefusal?: () => void;
  onError?: (message: string) => void;
};

export interface AskSkySkyTransport {
  skyResolve: (params: {
    profileSlug: string;
    agentToken: string;
    /** When both set, suggestions regenerate from the thread’s prior visitor questions. */
    conversationId?: number | null;
    visitorToken?: string | null;
  }) => Promise<SkyResolveResponse>;
  skyGetConversation: (conversationId: number, visitorToken: string) => Promise<SkyConversationResponse>;
  streamSkyMessage: (body: SkyMessageRequest, handlers: SkyStreamHandlers) => Promise<void>;
  skyPostLeadCapture: (
    conversationId: number,
    body: SkyLeadCaptureRequest,
  ) => Promise<SkyLeadCaptureResponse>;
}
