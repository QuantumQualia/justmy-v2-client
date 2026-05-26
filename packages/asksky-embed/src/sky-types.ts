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

export interface AskSkySkyTransport {
  skyResolve: (params: { profileSlug: string; agentToken: string }) => Promise<SkyResolveResponse>;
  skyGetConversation: (conversationId: number, visitorToken: string) => Promise<SkyConversationResponse>;
  streamSkyMessage: (body: SkyMessageRequest, handlers: SkyStreamHandlers) => Promise<void>;
}
