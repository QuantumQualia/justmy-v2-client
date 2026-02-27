/**
 * Chatbot Store
 * Global state management for the AI support chatbot
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiRequest, ApiClientError } from "../api-client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// API DTOs
interface ChatMessageResponseDto {
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  retrievedDocs?: Array<{
    sourceType: string;
    sourceId: string;
    title?: string;
    snippet?: string;
    score?: number;
  }>;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  error?: string;
  createdAt: Date;
}

interface SendMessageResponseDto {
  conversationId: number;
  message: ChatMessageResponseDto;
  response: string;
}

interface GetMessagesResponseDto {
  messages: ChatMessageResponseDto[];
}

interface ChatbotStore {
  // State
  isOpen: boolean;
  showButton: boolean; // Control visibility of floating button
  conversationId: number | null; // Current conversation ID
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setShowButton: (show: boolean) => void;
  loadConversation: (conversationId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  startNewConversation: () => void;
}

// Helper to map API message to store message
function mapApiMessageToChatMessage(dto: ChatMessageResponseDto): ChatMessage {
  return {
    id: `msg-${dto.id}`,
    role: dto.role === "system" ? "assistant" : dto.role,
    content: dto.content,
    timestamp: new Date(dto.createdAt),
  };
}

export const useChatbotStore = create<ChatbotStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOpen: false,
      showButton: false, // Default hidden
      conversationId: null,
      messages: [],
      isLoading: false,
      error: null,

      open: async () => {
        set({ isOpen: true });
        // Optionally load conversation history if conversationId exists
        const { conversationId } = get();
        if (conversationId) {
          await get().loadConversation(conversationId);
        }
      },
      close: () => set({ isOpen: false }),
      toggle: () => {
        const { isOpen } = get();
        if (isOpen) {
          get().close();
        } else {
          get().open();
        }
      },
      setShowButton: (show: boolean) => set({ showButton: show }),

      loadConversation: async (conversationId: number) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiRequest<GetMessagesResponseDto>(
            `chat/conversations/${conversationId}/messages`,
            {
              method: "GET",
            }
          );

          const mappedMessages = response.messages
            .filter((msg) => msg.role !== "system") // Filter out system messages
            .map(mapApiMessageToChatMessage);

          set({
            messages: mappedMessages,
            conversationId,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof ApiClientError
              ? error.message
              : "Failed to load conversation. Please try again.";

          set({
            error: message,
            isLoading: false,
          });
        }
      },

      sendMessage: async (content: string) => {
        const trimmed = content.trim();
        if (!trimmed) return;

        const { conversationId } = get();

        // Add user message optimistically
        const userMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          role: "user",
          content: trimmed,
          timestamp: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        set({ isLoading: true, error: null });

        try {
          let response: SendMessageResponseDto;

          if (conversationId) {
            // Send to existing conversation
            response = await apiRequest<SendMessageResponseDto>(
              `chat/conversations/${conversationId}/messages`,
              {
                method: "POST",
                body: JSON.stringify({ message: trimmed }),
              }
            );
          } else {
            // Create new conversation
            response = await apiRequest<SendMessageResponseDto>(
              "chat/messages",
              {
                method: "POST",
                body: JSON.stringify({ message: trimmed }),
              }
            );
          }

          // Update conversation ID if it's a new conversation
          if (!conversationId && response.conversationId) {
            set({ conversationId: response.conversationId });
          }

          // Add assistant response
          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: response.response,
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [
              ...state.messages,
              assistantMessage,
            ],
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          const message =
            error instanceof ApiClientError
              ? error.message
              : "Failed to send message. Please try again.";

          // Remove optimistic user message on error
          set((state) => ({
            messages: state.messages.filter((msg) => msg.id !== userMessage.id),
            error: message,
            isLoading: false,
          }));

          // Add error message
          const errorMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          };
          set((state) => ({
            messages: [...state.messages, errorMessage],
          }));
        }
      },

      clearMessages: () => set({ messages: [], conversationId: null }),
      startNewConversation: () => set({ messages: [], conversationId: null }),
    }),
    {
      name: "ChatbotStore",
    }
  )
);
