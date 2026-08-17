"use client";

import { create } from "zustand";

type NewsAuthUiState = {
  authOpen: boolean;
  sidebarOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  setAuthOpen: (open: boolean) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useNewsAuthUiStore = create<NewsAuthUiState>((set) => ({
  authOpen: false,
  sidebarOpen: false,
  openAuth: () => set({ authOpen: true }),
  closeAuth: () => set({ authOpen: false }),
  setAuthOpen: (open) => set({ authOpen: open }),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
