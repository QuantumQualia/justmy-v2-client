import { create } from "zustand";

export type ConciergeAction = {
  id: string;
  label: string;
  kind:
    | "diy"
    | "upgrade"
    | "command_plan"
    | "funcrew"
    | "attach_campaign"
    | "new_campaign"
    | "funcrew_ent"
    | "polish"
    | "broadcast"
    | "funcrew_manual";
};

export type ConciergeTurn = {
  role: "user" | "asksky";
  text: string;
  actions?: ConciergeAction[];
};

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
  helloKey: string | null;
  dockOpen: boolean;
  setTurns: (value: ConciergeTurn[] | ((prev: ConciergeTurn[]) => ConciergeTurn[])) => void;
  setCardDrafts: (value: CardDrafts | ((prev: CardDrafts) => CardDrafts)) => void;
  setInput: (value: string) => void;
  setAwaitingWebsite: (value: boolean) => void;
  beginPageHello: (key: string) => boolean;
  resetSession: () => void;
  setDockOpen: (value: boolean) => void;
};

function nextValue<T>(value: T | ((prev: T) => T), prev: T): T {
  return typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
}

export const useAskSkyConciergeStore = create<ConciergeState>((set, get) => ({
  turns: [],
  cardDrafts: {},
  input: "",
  awaitingWebsite: false,
  helloKey: null,
  dockOpen: false,
  setTurns: (value) => set((state) => ({ turns: nextValue(value, state.turns) })),
  setCardDrafts: (value) => set((state) => ({ cardDrafts: nextValue(value, state.cardDrafts) })),
  setInput: (value) => set({ input: value }),
  setAwaitingWebsite: (value) => set({ awaitingWebsite: value }),
  beginPageHello: (key) => {
    if (get().helloKey === key) return false;
    set({
      helloKey: key,
      turns: [],
      cardDrafts: {},
      input: "",
      awaitingWebsite: false,
    });
    return true;
  },
  resetSession: () =>
    set({
      turns: [],
      cardDrafts: {},
      input: "",
      awaitingWebsite: false,
      helloKey: null,
    }),
  setDockOpen: (value) => set({ dockOpen: value }),
}));

export function conciergeStageFromPath(pathname: string): string {
  if (pathname.includes("/biz-os/skyscan")) return "skyscan";
  if (pathname.includes("/biz-os/battle-plans")) return "battle_plan";
  if (pathname.includes("/biz-os/reputation")) return "reputation";
  if (pathname.includes("/biz-os/app-store")) return "apps";
  if (pathname.includes("/biz-os/pricing")) return "pricing";
  if (pathname.includes("/biz-os/settings")) return "settings";
  if (pathname.includes("/biz-os/onboard")) return "card";
  return "home";
}
