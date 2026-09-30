import { create } from "zustand";
import { DEFAULT_PROFILE_KIND } from "@/lib/os-types";

/** Mobile myCARD menu. Each item shows one section of the card. */
export type MycardSection = "home" | "asksky" | "pitch" | "about" | "connect";

export interface MycardNavAvailability {
  asksky: boolean;
  pitch: boolean;
  about: boolean;
}

/**
 * When true, the root layout shows {@link MycardPublicNavbar} instead of the
 * marketing or app navbar. Set only while the public myCARD profile view is mounted.
 */
interface MycardPublicNavStore {
  isMycardPublicProfile: boolean;
  /** Lowercase register `type` query (personal, biz, city, …) for Get myCARD link */
  registerTypeQuery: string;
  /** Public profile slug for myCARD "Home" (`/{slug}`) */
  profileSlug: string;
  section: MycardSection;
  nav: MycardNavAvailability;
  setMycardPublicProfile: (
    value: boolean,
    registerTypeQuery?: string,
    profileSlug?: string
  ) => void;
  setSection: (section: MycardSection) => void;
  setNav: (nav: MycardNavAvailability) => void;
}

const emptyNav: MycardNavAvailability = { asksky: false, pitch: false, about: false };

export const useMycardPublicNavStore = create<MycardPublicNavStore>((set) => ({
  isMycardPublicProfile: false,
  /** Empty until a public myCARD view sets it; link falls back to server `initialRegisterType`. */
  registerTypeQuery: "",
  profileSlug: "",
  section: "home",
  nav: emptyNav,
  setMycardPublicProfile: (value, registerTypeQuery = DEFAULT_PROFILE_KIND, profileSlug = "") =>
    set((state) => {
      const nextSlug = value ? profileSlug : "";
      return {
        isMycardPublicProfile: value,
        registerTypeQuery: value ? registerTypeQuery : "",
        profileSlug: nextSlug,
        section: state.profileSlug !== nextSlug ? "home" : state.section,
        nav: value ? state.nav : emptyNav,
      };
    }),
  setSection: (section) => set({ section }),
  setNav: (nav) => set({ nav }),
}));
