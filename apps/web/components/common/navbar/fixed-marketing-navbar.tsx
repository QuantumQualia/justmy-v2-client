"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, LogIn, Menu, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { subscriptionService, type SubscriptionPlan } from "@/lib/services/subscription";
import { ApiClientError } from "@/lib/services/auth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { createPortal } from "react-dom";

type MarketingNavbarProps = {
  /**
   * When true, disables the primary CTA so we don't start multiple checkouts.
   */
  becomeFounderLoading?: boolean;
};

type DropdownItem = { label: string; href: string };

const OS_DROPDOWN: DropdownItem[] = [
  { label: "Founders", href: "/#pricing_founder" },
  { label: "Personal", href: "/register?type=personal" },
  { label: "Biz", href: "/register?type=biz" },
  { label: "City", href: "/register?type=city" },
  { label: "Network", href: "/register?type=network" },
];

const RESOURCES_DROPDOWN: DropdownItem[] = [
  { label: "Blog", href: "/blog" },
  { label: "Help", href: "/help" },
  { label: "Guides", href: "/guides" },
];

async function redirectToCheckout(plan: SubscriptionPlan) {
  const checkoutUrl = await subscriptionService.createCheckoutSession(plan);
  window.location.href = checkoutUrl;
}

export function FixedMarketingNavbar({
  becomeFounderLoading,
}: MarketingNavbarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile(768);

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [osOpen, setOsOpen] = React.useState(false);
  const [resourcesOpen, setResourcesOpen] = React.useState(false);
  const [localCheckoutLoading, setLocalCheckoutLoading] =
    React.useState<boolean>(false);

  const isCheckoutLoading = !!becomeFounderLoading || localCheckoutLoading;

  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const closeAll = React.useCallback(() => {
    setMobileMenuOpen(false);
    setOsOpen(false);
    setResourcesOpen(false);
  }, []);

  // Close mobile sidebar with Escape
  React.useEffect(() => {
    if (!isMobile || !mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobile, mobileMenuOpen, closeAll]);

  // Prevent background scrolling while mobile sidebar is open
  React.useEffect(() => {
    if (!isMobile || !mobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, mobileMenuOpen]);

  const handleBecomeFounder = async () => {
    try {
      setLocalCheckoutLoading(true);
      await redirectToCheckout("FOUNDER");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        toast.error(err.message || "Failed to start checkout. Please try again.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLocalCheckoutLoading(false);
    }
  };

  // Close dropdowns when clicking outside (desktop)
  const dropdownRootRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!dropdownRootRef.current) return;
      if (!dropdownRootRef.current.contains(e.target as Node)) {
        setOsOpen(false);
        setResourcesOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const getIsActiveForSidebarHref = (href: string) => {
    if (href === "/vision") return pathname?.startsWith("/vision");
    if (href === "/lab/app-hub") return pathname?.startsWith("/lab/app-hub");
    if (href === "/blog") return pathname?.startsWith("/blog");
    if (href === "/help") return pathname?.startsWith("/help");
    if (href === "/guides") return pathname?.startsWith("/guides");
    if (href === "/#pricing") return pathname === "/";
    if (href.startsWith("/register")) return pathname?.startsWith("/register");
    return false;
  };

  const mobileItemBase =
    "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors cursor-pointer";
  const mobileItemGroupBase =
    "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer";

  const getMobileItemClass = (level: number, isActive: boolean) => {
    if (level === 0) {
      return isActive
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        : "text-slate-300 hover:bg-slate-800/50 hover:text-white";
    }

    return isActive
      ? "bg-slate-800/50 text-emerald-400"
      : "text-slate-400 hover:bg-slate-800/30 hover:text-white";
  };

  const getIndentStyle = (level: number): React.CSSProperties => ({
    paddingLeft: `${1 + level * 1}rem`,
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto h-16 max-w-7xl px-4 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter whitespace-nowrap"
            aria-label="JustMy.com"
          >
            JustMy<span className="text-emerald-500">.com</span>
          </Link>
        </div>

        {/* Desktop links */}
        {!isMobile ? (
          <div
            ref={dropdownRootRef}
            className="flex items-center gap-8 ml-6 flex-1 justify-center"
          >
            {/* Meet the OS */}
            <Link href="/vision" className="text-slate-300 hover:text-white">
              Meet the OS
            </Link>

            {/* Operating Systems */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOsOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 text-slate-300 hover:text-white",
                  osOpen ? "text-white" : ""
                )}
                aria-haspopup="menu"
                aria-expanded={osOpen}
              >
                Operating Systems <ChevronDown className="h-4 w-4" />
              </button>

              {osOpen ? (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-md shadow-lg p-2">
                  {OS_DROPDOWN.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOsOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {/* The Apps */}
            <Link href="/lab/app-hub" className="text-slate-300 hover:text-white">
              The Apps
            </Link>

            {/* Resources */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setResourcesOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 text-slate-300 hover:text-white",
                  resourcesOpen ? "text-white" : ""
                )}
                aria-haspopup="menu"
                aria-expanded={resourcesOpen}
              >
                Resources <ChevronDown className="h-4 w-4" />
              </button>

              {resourcesOpen ? (
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-md shadow-lg p-2">
                  {RESOURCES_DROPDOWN.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setResourcesOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10"
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Pricing */}
            <Link href="/#pricing" className="text-slate-300 hover:text-white">
              Pricing
            </Link>
          </div>
        ) : null}

        {/* Right - Global actions */}
        <div className="flex items-center gap-6">
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-300 hover:text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-slate-300 hover:text-white text-sm font-medium"
              >
                Log In
              </Link>
              <Button
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-6"
                onClick={() => void handleBecomeFounder()}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? "Processing..." : "Become a Founder"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && portalTarget
        ? createPortal(
          <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 transition-opacity"
            onClick={closeAll}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <aside className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 z-70 transform transition-transform duration-300 ease-in-out flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeAll}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Meet the OS */}
                <Link
                  href="/vision"
                  onClick={closeAll}
                  className={cn(
                    mobileItemBase,
                    getMobileItemClass(0, getIsActiveForSidebarHref("/vision"))
                  )}
                  style={getIndentStyle(0)}
                >
                  <span className="font-medium">Meet the OS</span>
                </Link>

                {/* Operating Systems group */}
                <button
                  type="button"
                  onClick={() => {
                    setOsOpen((v) => !v);
                    setResourcesOpen(false);
                  }}
                  className={cn(
                    mobileItemGroupBase,
                    getMobileItemClass(
                      0,
                      OS_DROPDOWN.some((i) => getIsActiveForSidebarHref(i.href))
                    )
                  )}
                  style={getIndentStyle(0)}
                >
                  <span className="font-medium">Operating Systems</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      osOpen ? "rotate-90" : ""
                    )}
                  />
                </button>
                {osOpen ? (
                  <div className="mt-1 space-y-1">
                    {OS_DROPDOWN.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeAll}
                        className={cn(
                          mobileItemBase,
                          getMobileItemClass(1, getIsActiveForSidebarHref(item.href))
                        )}
                        style={getIndentStyle(1)}
                      >
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {/* The Apps */}
                <Link
                  href="/lab/app-hub"
                  onClick={closeAll}
                  className={cn(
                    mobileItemBase,
                    getMobileItemClass(0, getIsActiveForSidebarHref("/lab/app-hub"))
                  )}
                  style={getIndentStyle(0)}
                >
                  <span className="font-medium">The Apps</span>
                </Link>

                {/* Resources group */}
                <button
                  type="button"
                  onClick={() => {
                    setResourcesOpen((v) => !v);
                    setOsOpen(false);
                  }}
                  className={cn(
                    mobileItemGroupBase,
                    getMobileItemClass(
                      0,
                      RESOURCES_DROPDOWN.some((i) => getIsActiveForSidebarHref(i.href))
                    )
                  )}
                  style={getIndentStyle(0)}
                >
                  <span className="font-medium">Resources</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      resourcesOpen ? "rotate-90" : ""
                    )}
                  />
                </button>
                {resourcesOpen ? (
                  <div className="mt-1 space-y-1">
                    {RESOURCES_DROPDOWN.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeAll}
                        className={cn(
                          mobileItemBase,
                          getMobileItemClass(1, getIsActiveForSidebarHref(item.href))
                        )}
                        style={getIndentStyle(1)}
                      >
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {/* Pricing */}
                <Link
                  href="/#pricing"
                  onClick={closeAll}
                  className={cn(
                    mobileItemBase,
                    getMobileItemClass(0, getIsActiveForSidebarHref("/#pricing"))
                  )}
                  style={getIndentStyle(0)}
                >
                  <span className="font-medium">Pricing</span>
                </Link>
              </div>

              {/* Bottom actions */}
              <div className="border-t border-slate-800 p-4 space-y-2 flex-shrink-0 bg-slate-900">
                <Link
                  href="/login"
                  onClick={closeAll}
                  className={cn(
                    mobileItemBase,
                    getMobileItemClass(0, pathname?.startsWith("/login"))
                  )}
                  style={getIndentStyle(0)}
                >
                  <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="font-medium">Log In</span>
                </Link>
                <Button
                  className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-6"
                  onClick={() => void handleBecomeFounder()}
                  disabled={isCheckoutLoading}
                >
                  {isCheckoutLoading ? "Processing..." : "Become a Founder"}
                </Button>
              </div>
            </nav>
          </aside>
          </>,
          portalTarget
        )
        : null}
    </nav>
  );
}

