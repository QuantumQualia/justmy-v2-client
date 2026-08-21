import { create } from "zustand";

import type { SkyMeConversationDetail } from "@/lib/news/fetch-sky-conversations";
import type { AuthResponse } from "@/lib/services/auth";

export type NewsNavPageBindings = {
  onNewChat?: () => void;
  onOpenConversation?: (detail: SkyMeConversationDetail) => void;
  onConversationDeleted?: (id: number) => void;
  onAuthSuccess?: (response: AuthResponse) => void;
  activeConversationId?: number | null;
};

type NewsNavPageState = NewsNavPageBindings & {
  setBindings: (bindings: NewsNavPageBindings) => void;
  clearBindings: () => void;
};

const EMPTY: NewsNavPageBindings = {
  onNewChat: undefined,
  onOpenConversation: undefined,
  onConversationDeleted: undefined,
  onAuthSuccess: undefined,
  activeConversationId: null,
};

export const useNewsNavPageStore = create<NewsNavPageState>((set) => ({
  ...EMPTY,
  setBindings: (bindings) => set({ ...EMPTY, ...bindings }),
  clearBindings: () => set(EMPTY),
}));
