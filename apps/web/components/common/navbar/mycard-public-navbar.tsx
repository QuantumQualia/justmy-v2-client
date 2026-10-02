"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Info,
  LogIn,
  Presentation,
  QrCode,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { createPortal } from "react-dom";
import {
  useMycardPublicNavStore,
  type MycardSection,
} from "@/lib/store/mycard-public-nav-store";
import { DEFAULT_PROFILE_KIND } from "@/lib/os-types";

const MENU_HINT_KEY = "justmy:mycard-menu-hint";

const SECTION_ITEMS: { id: MycardSection; label: string; icon: React.ReactNode; when?: "asksky" | "pitch" | "about" }[] = [
  { id: "home", label: "Home", icon: <Home className="h-5 w-5 shrink-0" /> },
  { id: "asksky", label: "AskSKY!", icon: <Sparkles className="h-5 w-5 shrink-0" />, when: "asksky" },
  { id: "pitch", label: "Pitch", icon: <Presentation className="h-5 w-5 shrink-0" />, when: "pitch" },
  { id: "about", label: "About", icon: <Info className="h-5 w-5 shrink-0" />, when: "about" },
  { id: "connect", label: "Connect", icon: <QrCode className="h-5 w-5 shrink-0" /> },
];

function menuItemClass(active: boolean): string {
  return cn(
    "flex w-full items-center gap-4 rounded-2xl rounded-br-none px-4 py-4 text-left md:py-5",
    "bg-[#c4c4c4] text-[#333333] transition-colors hover:bg-[#d4d4d4]",
    active && "bg-[#d4d4d4]"
  );
}

export interface MycardPublicNavbarProps {
  /** From server (root layout); until the store is filled from `MyCardLive` */
  initialRegisterType?: string;
  /** From server; myCARD "Home" points to `/{slug}` */
  initialProfileSlug?: string;
  /** Sit below the news header when that bar is on screen. */
  belowNewsHeader?: boolean;
}

/**
 * Shown only on the public dynamic myCARD profile (`/[handle]`).
 * No full-width bar — only a floating control that stays in view; opens full-screen menu.
 */
export function MycardPublicNavbar({
  initialRegisterType = DEFAULT_PROFILE_KIND,
  initialProfileSlug = "",
  belowNewsHeader = false,
}: MycardPublicNavbarProps = {}) {
  const pathname = usePathname();
  const section = useMycardPublicNavStore((s) => s.section);
  const nav = useMycardPublicNavStore((s) => s.nav);
  const setSection = useMycardPublicNavStore((s) => s.setSection);
  const sectionItems = React.useMemo(
    () => SECTION_ITEMS.filter((item) => !item.when || nav[item.when]),
    [nav]
  );
  const [isNarrow, setIsNarrow] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  void initialRegisterType;
  void initialProfileSlug;

  React.useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    setPortalTarget(document.body);
    try {
      setShowHint(localStorage.getItem(MENU_HINT_KEY) !== "1");
    } catch {
      setShowHint(true);
    }
  }, []);

  function openMenu() {
    setMenuOpen(true);
    setShowHint(false);
    try {
      localStorage.setItem(MENU_HINT_KEY, "1");
    } catch {
      /* private mode */
    }
  }

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

  if (!isNarrow) return null;

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-label="Open navigation menu"
        className={cn(
          "fixed z-50 flex items-center gap-1 px-3 py-2",
          belowNewsHeader
            ? "top-[max(1rem,env(safe-area-inset-top))] lg:top-[calc(var(--news-header-h,3.5rem)+0.75rem)]"
            : "top-[max(1rem,env(safe-area-inset-top))]",
          "right-[max(1rem,env(safe-area-inset-right))]",
          "justmy-corners-sm border border-white/70 bg-card/92 shadow-lg cursor-pointer",
          "backdrop-blur-[20px]",
          "transition-colors hover:bg-card active:scale-[0.98]"
        )}
        style={{
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {showHint ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 justmy-corners-sm motion-safe:[animation:mycard-menu-hint_2s_ease-out_infinite]"
          />
        ) : null}
        <span className="relative grid shrink-0 grid-cols-3 gap-[3px]" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-neutral-800/70"
            />
          ))}
        </span>
      </button>

      {menuOpen && portalTarget && isNarrow
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

              <nav className="mx-auto flex w-full max-w-md flex-col px-6 pb-12 pt-2 md:max-w-lg">
                <ul className="flex flex-col gap-3">
                  {sectionItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-current={section === item.id ? "page" : undefined}
                        onClick={() => {
                          setSection(item.id);
                          setMenuOpen(false);
                        }}
                        className={menuItemClass(section === item.id)}
                      >
                        <span className="text-[#333333]" aria-hidden>
                          {item.icon}
                        </span>
                        <span className="text-base font-medium">{item.label}</span>
                      </button>
                    </li>
                  ))}
                  <li>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className={menuItemClass(false)}>
                      <span className="text-[#333333]" aria-hidden>
                        <LogIn className="h-5 w-5 shrink-0" />
                      </span>
                      <span className="text-base font-medium">Login</span>
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>,
            portalTarget
          )
        : null}
    </>
  );
}
