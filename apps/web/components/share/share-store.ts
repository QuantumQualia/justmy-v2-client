"use client";

import { create } from "zustand";
import type { SharePayload } from "./share-dialog";

interface ShareState {
  isOpen: boolean;
  payload: SharePayload | null;
  open: (payload: SharePayload) => void;
  close: () => void;
}

export const useShareStore = create<ShareState>((set) => ({
  isOpen: false,
  payload: null,
  open: (payload) => set({ isOpen: true, payload }),
  close: () => set({ isOpen: false, payload: null }),
}));

/**
 * Imperative helper to trigger global sharing from anywhere (buttons, icons, etc.)
 * - On capable devices, tries native navigator.share first.
 * - If not available or user cancels, falls back to the desktop/modal experience.
 */
export async function openShare(payload: SharePayload) {
  // if (typeof navigator !== "undefined" && (navigator as any).share) {
  //   try {
  //     await (navigator as any).share({
  //       title: payload.title,
  //       text: payload.description,
  //       url: payload.url,
  //     });
  //     return;
  //   } catch (err) {
  //     // If user cancels or native share fails, fall back to modal below
  //     console.warn("Native share failed or was cancelled", err);
  //   }
  // }

  useShareStore.getState().open(payload);
}

