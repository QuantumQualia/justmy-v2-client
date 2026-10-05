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
 * Desktop Chrome/Edge expose `navigator.share`, but the Windows/macOS sheet has no
 * social networks. Only phones and tablets get the native sheet.
 */
export function prefersNativeShare(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Imperative helper to trigger global sharing from anywhere (buttons, icons, etc.)
 * - Touch devices use the native share sheet.
 * - Desktop, or a failed native share, opens the share dialog with social links.
 */
export async function openShare(payload: SharePayload) {
  if (prefersNativeShare()) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.description,
        url: payload.url,
      });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }

  useShareStore.getState().open(payload);
}

