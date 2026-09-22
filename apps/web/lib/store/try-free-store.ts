import { create } from "zustand";

import type {
  OrgProofResponse,
  TryFreeCategory,
  TryFreeLocation,
  TryFreeTier,
} from "@/lib/try-free/types";

interface TryFreeStore {
  category: TryFreeCategory | null;
  /** Personal path only. Null on business/nonprofit. */
  tier: TryFreeTier | null;
  location: TryFreeLocation | null;
  orgName: string;
  orgWebsite: string;
  orgProof: OrgProofResponse | null;
  setCategory: (category: TryFreeCategory) => void;
  setTier: (tier: TryFreeTier | null) => void;
  setLocation: (location: TryFreeLocation | null) => void;
  setOrg: (input: { name?: string; website?: string; proof?: OrgProofResponse | null }) => void;
  reset: () => void;
}

export const useTryFreeStore = create<TryFreeStore>((set) => ({
  category: null,
  tier: null,
  location: null,
  orgName: "",
  orgWebsite: "",
  orgProof: null,
  setCategory: (category) =>
    set((state) => ({
      category,
      // Business / nonprofit never carry a seeded/unseeded flag.
      tier: category === "personal" ? state.tier : null,
    })),
  setTier: (tier) => set({ tier }),
  setLocation: (location) => set({ location }),
  setOrg: (input) =>
    set((state) => ({
      orgName: input.name ?? state.orgName,
      orgWebsite: input.website ?? state.orgWebsite,
      orgProof: input.proof === undefined ? state.orgProof : input.proof,
    })),
  reset: () =>
    set({
      category: null,
      tier: null,
      location: null,
      orgName: "",
      orgWebsite: "",
      orgProof: null,
    }),
}));
