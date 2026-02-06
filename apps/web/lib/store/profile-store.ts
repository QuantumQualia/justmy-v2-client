/**
 * Profile Store
 * Global state management for profile data using Zustand
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Types (matching inline-edit)
// Social links only include actual social media platforms (not upload, email, contact, phone, address)
export type SocialType =
  | "facebook" | "instagram" | "x" | "linkedin" | "youtube" | "vimeo" | "yelp"
  | "behance" | "deviantart" | "digg" | "dribbble" | "discord" | "etsy" | "fiverr"
  | "flickr" | "github" | "imdb" | "lastfm" | "mix" | "myspace" | "paypal"
  | "pinterest" | "quora" | "reddit" | "snapchat" | "soundcloud" | "tiktok"
  | "threads" | "tumblr" | "twitch" | "vk" | "whatsapp" | "xing";

export interface SocialLink {
  id: string;
  type: SocialType;
  url: string;
  label?: string;
}

export interface Hotlink {
  id: string;
  title: string;
  url: string;
}

export interface Phone {
  id: string;
  number: string;
  type?: string; // e.g., "mobile", "work", "home"
}

export interface Address {
  id: string;
  title?: string;
  address: string;
  latitude?: string;
  longitude?: string;
}

export interface ProfileData {
  id?: number; // Profile ID for API calls
  type?: "personal" | "biz" | "growth" | "founder" | "city" | "network"; // Profile type
  photo: string;
  banner: string;
  name: string;
  tagline: string;
  email?: string;
  website?: string;
  calendarLink?: string;
  phones?: Phone[];
  addresses?: Address[];
  socialLinks: SocialLink[]; // Only actual social media platforms
  hotlinks: Hotlink[];
  about: string;
}

interface ProfileStore {
  // State
  data: ProfileData;
  isLoading: boolean;
  error: string | null;

  // Actions
  setData: (data: Partial<ProfileData>) => void;
  updateSocialLink: (id: string, updates: Partial<SocialLink>) => void;
  addSocialLink: (link: SocialLink) => void;
  removeSocialLink: (id: string) => void;
  updateHotlink: (id: string, updates: Partial<Hotlink>) => void;
  addHotlink: (hotlink: Hotlink) => void;
  removeHotlink: (id: string) => void;
  reset: () => void;
  fetchProfileData: (handle: string) => Promise<void>;
}

// Initial data
const initialData: ProfileData = {
  id: undefined,
  type: undefined,
  photo: "",
  banner: "",
  name: "",
  tagline: "",
  email: "",
  calendarLink: "",
  phones: [],
  addresses: [],
  socialLinks: [],
  hotlinks: [
  ],
  about: "",
};

export const useProfileStore = create<ProfileStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        data: initialData,
        isLoading: false,
        error: null,

        // Set data (partial update)
        setData: (updates) =>
          set(
            (state) => ({
              data: { ...state.data, ...updates },
            }),
            false,
            "setData"
          ),

        // Social Links actions
        updateSocialLink: (id, updates) =>
          set(
            (state) => ({
              data: {
                ...state.data,
                socialLinks: state.data.socialLinks.map((link) =>
                  link.id === id ? { ...link, ...updates } : link
                ),
              },
            }),
            false,
            "updateSocialLink"
          ),

        addSocialLink: (link) =>
          set(
            (state) => ({
              data: {
                ...state.data,
                socialLinks: [...state.data.socialLinks, link],
              },
            }),
            false,
            "addSocialLink"
          ),

        removeSocialLink: (id) =>
          set(
            (state) => ({
              data: {
                ...state.data,
                socialLinks: state.data.socialLinks.filter((link) => link.id !== id),
              },
            }),
            false,
            "removeSocialLink"
          ),

        // Hotlinks actions
        updateHotlink: (id, updates) =>
          set(
            (state) => ({
              data: {
                ...state.data,
                hotlinks: state.data.hotlinks.map((hotlink) =>
                  hotlink.id === id ? { ...hotlink, ...updates } : hotlink
                ),
              },
            }),
            false,
            "updateHotlink"
          ),

        addHotlink: (hotlink) =>
          set(
            (state) => ({
              data: {
                ...state.data,
                hotlinks: [...state.data.hotlinks, hotlink],
              },
            }),
            false,
            "addHotlink"
          ),

        removeHotlink: (id) =>
          set(
            (state) => ({
              data: {
                ...state.data,
                hotlinks: state.data.hotlinks.filter((hotlink) => hotlink.id !== id),
              },
            }),
            false,
            "removeHotlink"
          ),

        // Reset to initial state
        reset: () =>
          set(
            {
              data: initialData,
              isLoading: false,
              error: null,
            },
            false,
            "reset"
          ),

        // Fetch profile data from API
        fetchProfileData: async (handle: string) => {
          set({ isLoading: true, error: null }, false, "fetchProfileData/start");
          try {
            // TODO: Replace with actual API call
            // const response = await fetch(`/api/profiles/${handle}`);
            // const profileData = await response.json();
            // set({ data: profileData, isLoading: false }, false, "fetchProfileData/success");
            
            // For now, use mock data
            set({ isLoading: false }, false, "fetchProfileData/success");
          } catch (error) {
            set(
              {
                error: error instanceof Error ? error.message : "Failed to fetch profile data",
                isLoading: false,
              },
              false,
              "fetchProfileData/error"
            );
          }
        },
      }),
      {
        name: "profile-storage", // localStorage key
        partialize: (state) => ({ data: state.data }), // Only persist data, not loading/error states
      }
    ),
    {
      name: "ProfileStore", // DevTools name
    }
  )
);
