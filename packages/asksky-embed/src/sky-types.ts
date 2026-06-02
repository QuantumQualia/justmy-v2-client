/** Linked myFORM shown in AskSKY when published; from `GET /sky/resolve`. */
export interface SkyResolveContactForm {
  id: number;
  title: string;
  slug: string;
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
  /** Published contact form for this agent, or null if none. */
  contactForm?: SkyResolveContactForm | null;
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
  model?: string | null;
  retrievedDocs?: unknown[] | null;
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
};

/** Final SSE `done` event per turn. */
export type SkySseDonePayload = {
  conversationId: number;
  agentId?: number;
  assistantMessageId?: number;
  answer: string;
  refused: boolean;
  retrievedDocs: unknown[];
  visitorContactCaptured: boolean;
  requestingContactDetails: boolean;
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
  skyResolve: (params: { profileSlug: string; agentToken: string }) => Promise<SkyResolveResponse>;
  skyGetConversation: (conversationId: number, visitorToken: string) => Promise<SkyConversationResponse>;
  streamSkyMessage: (body: SkyMessageRequest, handlers: SkyStreamHandlers) => Promise<void>;
  skyPostLeadCapture: (
    conversationId: number,
    body: SkyLeadCaptureRequest,
  ) => Promise<SkyLeadCaptureResponse>;
}
