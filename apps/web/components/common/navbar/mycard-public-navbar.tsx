"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  HelpCircle,
  Home,
  LogIn,
  MessageCircle,
  Presentation,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { createPortal } from "react-dom";
import { useMycardPublicNavStore } from "@/lib/store/mycard-public-nav-store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

function profileHomeHref(profileSlug: string): string {
  const s = profileSlug.trim();
  if (!s) return "/";
  const seg = encodeURIComponent(s);
  return `/${seg}`;
}

function buildMenuItems(registerType: string, profileSlug: string): NavItem[] {
  const t = registerType.trim() || "personal";
  const registerHref = `/register?type=${encodeURIComponent(t)}`;
  const homeHref = profileHomeHref(profileSlug);
  return [
    {
      label: "Home",
      href: homeHref,
      icon: <Home className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Pitch",
      href: "/vision",
      icon: <Presentation className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Connect",
      href: "/lab/app-hub",
      icon: <MessageCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Help",
      href: "/help",
      icon: <HelpCircle className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Get myCARD",
      href: registerHref,
      icon: <CreditCard className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Login",
      href: "/login",
      icon: <LogIn className="h-5 w-5 shrink-0" />,
    },
  ];
}

export interface MycardPublicNavbarProps {
  /** From server (root layout); until the store is filled from `MyCardLive` */
  initialRegisterType?: string;
  /** From server; myCARD "Home" points to `/{slug}` */
  initialProfileSlug?: string;
}

/**
 * Shown only on the public dynamic myCARD profile (`/[handle]`).
 * No full-width bar — only a floating control that stays in view; opens full-screen menu.
 */
export function MycardPublicNavbar({
  initialRegisterType = "personal",
  initialProfileSlug = "",
}: MycardPublicNavbarProps = {}) {
  const pathname = usePathname();
  const registerTypeQuery = useMycardPublicNavStore((s) => s.registerTypeQuery);
  const profileSlugFromStore = useMycardPublicNavStore((s) => s.profileSlug);
  const registerType =
    registerTypeQuery.trim() !== ""
      ? registerTypeQuery
      : initialRegisterType || "personal";
  const profileSlug =
    profileSlugFromStore.trim() !== ""
      ? profileSlugFromStore
      : initialProfileSlug || "";
  const menuItems = React.useMemo(
    () => buildMenuItems(registerType, profileSlug),
    [registerType, profileSlug]
  );
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      {/* Glass pill trigger — matches personalOS_myCARD_2 nav-menu sample (single control opens menu) */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        className={cn(
          "fixed z-50 flex items-center gap-1 px-3 py-2",
          "top-[max(1rem,env(safe-area-inset-top))]",
          "right-[max(1rem,env(safe-area-inset-right))]",
          "rounded-2xl rounded-br-none border border-white/70 bg-white/92",
          "backdrop-blur-[20px]",
          "shadow-[0_6px_24px_rgba(0,0,0,0.12)]",
          "transition-colors hover:bg-white active:scale-[0.98]"
        )}
        style={{
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <TrendingUp size={16} className="shrink-0 text-neutral-800/80" strokeWidth={2} />
        <span className="ml-1 grid shrink-0 grid-cols-3 gap-[3px]" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-neutral-800/70"
            />
          ))}
        </span>
      </button>

      {menuOpen && portalTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex flex-col bg-[#2B2724]"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className="flex justify-end p-4 md:p-6">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-300 text-neutral-800 transition-colors hover:bg-neutral-200"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-12 md:max-w-lg">
                <ul className="flex flex-col gap-3 md:gap-4">
                  {menuItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl rounded-br-none px-4 py-4 md:py-5",
                          "bg-[#c4c4c4] text-[#333333] transition-colors hover:bg-[#d4d4d4]"
                        )}
                      >
                        <span className="text-[#333333]" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="text-base font-medium md:text-lg">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>,
            portalTarget
          )
        : null}
    </>
  );
}
