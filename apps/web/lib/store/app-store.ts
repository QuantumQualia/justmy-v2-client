/**
 * App Store
 * Global state management for the current app and its navigation/menu
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AppNavigationResponseDto } from "../services/apps";

export interface CurrentApp {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  navigation?: AppNavigationResponseDto[] | null;
  osApps?: Array<{
    osId: number;
    isWelcome: boolean;
    isStandard: boolean;
  }>;
  homePath?: string; // Optional convenience field from auth
}

interface AppStore {
  currentApp: CurrentApp | null;
  navigation: AppNavigationResponseDto[];

  // Set from backend welcomeApp payload
  setFromWelcomeApp: (app: CurrentApp) => void;

  // Manually change the current app (e.g., when user switches apps)
  setCurrentApp: (app: CurrentApp | null) => void;

  // Update only the navigation/menu for the current app
  setNavigation: (navigation: AppNavigationResponseDto[]) => void;

  // Reset everything (e.g., on logout)
  clear: () => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentApp: null,
        navigation: [],

        setFromWelcomeApp: (app) => {
          set({
            currentApp: app,
            navigation: app.navigation ?? [],
          });
        },

        setCurrentApp: (app) => {
          set({
            currentApp: app,
            navigation: app?.navigation ?? [],
          });
        },

        setNavigation: (navigation) => {
          const { currentApp } = get();
          set({
            currentApp: currentApp
              ? { ...currentApp, navigation }
              : currentApp,
            navigation,
          });
        },

        clear: () =>
          set({
            currentApp: null,
            navigation: [],
          }),
      }),
      {
        name: "current-app-store",
        partialize: (state) => ({
          currentApp: state.currentApp,
          navigation: state.navigation,
        }),
      }
    ),
    {
      name: "AppStore",
    }
  )
);

/**
 * Resolve the current app's home path.
 * Priority:
 * 1. welcomeApp.homePath (if provided in options)
 * 2. first navigation item with isHome === true
 * 3. fallback (default: \"/dashboard\")
 */
export function resolveAppHomePath(options?: {
  welcomeApp?: Partial<CurrentApp> & { navigation?: AppNavigationResponseDto[] | null };
  fallback?: string;
}): string {
  const fallback = options?.fallback ?? "/dashboard";
  const store = useAppStore.getState();

  const welcome = options?.welcomeApp;

  // Prefer explicit homePath if backend provides it
  if (welcome?.homePath && typeof welcome.homePath === "string") {
    return welcome.homePath;
  }

  const navFromWelcome = (welcome?.navigation ?? null) as
    | AppNavigationResponseDto[]
    | null;
  const navSource =
    (navFromWelcome && navFromWelcome.length > 0
      ? navFromWelcome
      : store.navigation) || [];

  const homeItem = navSource.find((item) => item.isHome);
  if (homeItem && typeof homeItem.path === "string" && homeItem.path.trim() !== "") {
    return homeItem.path;
  }

  return fallback;
}

