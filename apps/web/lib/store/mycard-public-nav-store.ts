import { create } from "zustand";

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
  setMycardPublicProfile: (
    value: boolean,
    registerTypeQuery?: string,
    profileSlug?: string
  ) => void;
}

export const useMycardPublicNavStore = create<MycardPublicNavStore>((set) => ({
  isMycardPublicProfile: false,
  /** Empty until a public myCARD view sets it; link falls back to server `initialRegisterType`. */
  registerTypeQuery: "",
  profileSlug: "",
  setMycardPublicProfile: (value, registerTypeQuery = "personal", profileSlug = "") =>
    set({
      isMycardPublicProfile: value,
      registerTypeQuery: value ? registerTypeQuery : "",
      profileSlug: value ? profileSlug : "",
    }),
}));
