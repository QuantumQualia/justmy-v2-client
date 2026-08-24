import { create } from "zustand";

export type ConciergeTurn = { role: "user" | "asksky"; text: string };

export type HotlinkDraft = { label: string; url: string };
export type PhoneDraft = { number: string; type?: string };
export type AddressDraft = {
  title?: string;
  address: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
};
export type SocialDraft = { name: string; url: string };
export type CardDrafts = {
  about?: string | null;
  tagline?: string | null;
  website?: string | null;
  email?: string | null;
  calendarLink?: string | null;
  hotlinks?: HotlinkDraft[];
  phones?: PhoneDraft[];
  addresses?: AddressDraft[];
  socials?: SocialDraft[];
};

type ConciergeState = {
  turns: ConciergeTurn[];
  cardDrafts: CardDrafts;
  input: string;
  awaitingWebsite: boolean;
  helloSentFor: number | null;
  dockOpen: boolean;
  setTurns: (value: ConciergeTurn[] | ((prev: ConciergeTurn[]) => ConciergeTurn[])) => void;
  setCardDrafts: (value: CardDrafts | ((prev: CardDrafts) => CardDrafts)) => void;
  setInput: (value: string) => void;
  setAwaitingWebsite: (value: boolean) => void;
  markHello: (profileId: number) => void;
  setDockOpen: (value: boolean) => void;
};

function nextValue<T>(value: T | ((prev: T) => T), prev: T): T {
  return typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
}

export const useAskSkyConciergeStore = create<ConciergeState>((set) => ({
  turns: [],
  cardDrafts: {},
  input: "",
  awaitingWebsite: false,
  helloSentFor: null,
  dockOpen: false,
  setTurns: (value) => set((state) => ({ turns: nextValue(value, state.turns) })),
  setCardDrafts: (value) => set((state) => ({ cardDrafts: nextValue(value, state.cardDrafts) })),
  setInput: (value) => set({ input: value }),
  setAwaitingWebsite: (value) => set({ awaitingWebsite: value }),
  markHello: (profileId) => set({ helloSentFor: profileId }),
  setDockOpen: (value) => set({ dockOpen: value }),
}));

export function conciergeStageFromPath(pathname: string): string {
  if (pathname.includes("/biz-os/skyscan")) return "skyscan";
  if (pathname.includes("/biz-os/battle-plans")) return "battle_plan";
  if (pathname.includes("/biz-os/reputation")) return "reputation";
  if (pathname.includes("/biz-os/app-store")) return "apps";
  if (pathname.includes("/biz-os/onboard")) return "card";
  return "home";
}
