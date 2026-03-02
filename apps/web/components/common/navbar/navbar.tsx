"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useProfileStore } from "@/lib/store/profile-store";
import { useAppStore } from "@/lib/store/app-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { SuperSearchBar } from "../search/super-search-bar";
import { MobileSidebar } from "./mobile-sidebar";
import { ProfileSwitcher } from "./profile-switcher";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Navbar Component
 * 
 * Responsive navbar with:
 * - Profile switcher on the left
 * - Super search bar in the center
 * - Hamburger menu on the right (mobile)
 */
export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isMobile = useIsMobile(768); // md breakpoint
  const pathname = usePathname();
  const router = useRouter();
  
  const profile = useProfileStore((state) => state.data);
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
            <SuperSearchBar />
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
