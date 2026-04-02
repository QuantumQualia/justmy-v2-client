"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useAppStore } from "@/lib/store/app-store";
import { SuperSearchBar } from "../search/super-search-bar";
import { MobileSidebar } from "./mobile-sidebar";
import { ProfileSwitcher } from "./profile-switcher";
import { cn } from "@workspace/ui/lib/utils";
import { isAuthenticated } from "@/lib/services/session";
import { FixedMarketingNavbar } from "./fixed-marketing-navbar";
import { MycardPublicNavbar } from "./mycard-public-navbar";
import { useMycardPublicNavStore } from "@/lib/store/mycard-public-nav-store";
import { DEFAULT_PROFILE_KIND } from "@/lib/os-types";

export interface NavbarProps {
  /**
   * Passed to SuperSearchBar: enable business search mode (category bento + ghost phrases).
   * Defaults to false when omitted.
   */
  businessSearchMode?: boolean;
  initialIsAuthed?: boolean;
  /**
   * Server-derived: URL is a public myCARD profile. Prevents navbar mode flash before client mounts.
   */
  initialMycardPublicNav?: boolean;
  /** Server-derived `register?type=` for Get myCARD on that profile */
  initialMycardRegisterType?: string;
  /** Server-derived profile slug for myCARD menu "Home" */
  initialMycardProfileSlug?: string;
}

/**
 * Navbar Component
 *
 * Responsive navbar with:
 * - Profile switcher on the left
 * - Super search bar in the center
 * - Hamburger menu on the right (mobile)
 */
function AppNavbar({ businessSearchMode }: NavbarProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const navigation = useAppStore((state) => state.navigation);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 items-center justify-between gap-2 px-2 md:px-6 lg:px-8">
          {/* Left: Profile Switcher */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ProfileSwitcher />
          </div>

          {/* Center: Super Search Bar (visible on all screens) */}
          <div className="flex flex-1 justify-center max-w-2xl mx-2 md:mx-4 min-w-0">
            <SuperSearchBar businessSearchMode={businessSearchMode} />
          </div>

          {/* Right: Hamburger Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Hamburger Button (always visible) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-10 w-10 text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="!size-6" />
              ) : (
                <Menu className="!size-6" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigation={navigation}
      />
    </>
  );
}

/**
 * Auth-aware Navbar:
 * - On public myCARD profile (`MyCardLive` with `usePublicNavbar`): floating menu control + full-screen overlay menu.
 * - When logged in: app navbar (profile switcher + super search).
 * - When logged out: fixed marketing navbar.
 */
export function Navbar({
  businessSearchMode,
  initialIsAuthed = false,
  initialMycardPublicNav = false,
  initialMycardRegisterType = DEFAULT_PROFILE_KIND,
  initialMycardProfileSlug = "",
}: NavbarProps = {}) {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = React.useState<boolean>(initialIsAuthed);
  const [navShellMounted, setNavShellMounted] = React.useState(false);
  const fromStore = useMycardPublicNavStore((s) => s.isMycardPublicProfile);

  React.useEffect(() => {
    setNavShellMounted(true);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const authed = await isAuthenticated();
        if (!mounted) return;
        setIsAuthed(authed);
      } catch {
        if (!mounted) return;
        setIsAuthed(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const showMycardPublicNav =
    fromStore || (!navShellMounted && initialMycardPublicNav);

  if (showMycardPublicNav) {
    return (
      <MycardPublicNavbar
        initialRegisterType={initialMycardRegisterType}
        initialProfileSlug={initialMycardProfileSlug}
      />
    );
  }

  if (isAuthed) {
    return <AppNavbar businessSearchMode={businessSearchMode} />;
  }

  return <FixedMarketingNavbar />;
}
