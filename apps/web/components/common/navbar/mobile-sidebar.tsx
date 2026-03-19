"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, ChevronRight, ChevronDown, Grid3x3, LogOut, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { appsService, type AppNavigationResponseDto } from "@/lib/services/apps";
import { authService } from "@/lib/services/auth";
import { cn } from "@workspace/ui/lib/utils";

const appNavRequestCache = new Map<number, Promise<AppNavigationResponseDto[]>>();

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: AppNavigationResponseDto[];
}

/**
 * Mobile Sidebar Component
 *
 * Slide-in sidebar for mobile navigation with menu items
 * generated dynamically from app navigation.
 *
 * Supports two item types:
 *  - "page" (default): a direct link with label + path
 *  - "app": references another app; renders that app's menus as a
 *    collapsible group labelled with the parent item's label
 */
export function MobileSidebar({
  isOpen,
  onClose,
  navigation,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  // Resolved navigation for "app" type items keyed by appId
  const [appNavCache, setAppNavCache] = React.useState<
    Record<number, AppNavigationResponseDto[]>
  >({});
  const [loadingApps, setLoadingApps] = React.useState<Set<number>>(new Set());

  // Fetch navigation for all "app"-type items when navigation changes
  React.useEffect(() => {
    let cancelled = false;
    const appItems = navigation.filter(
      (item) => item.type === "app" && item.appId
    );
    if (appItems.length === 0) return;

    const idsToFetch = appItems
      .map((item) => item.appId!)
      .filter((id) => !(id in appNavCache));

    if (idsToFetch.length === 0) return;

    setLoadingApps((prev) => {
      const next = new Set(prev);
      idsToFetch.forEach((id) => next.add(id));
      return next;
    });

    Promise.allSettled(
      idsToFetch.map(async (id) => {
        const existingRequest = appNavRequestCache.get(id);
        if (existingRequest) {
          const nav = await existingRequest;
          return { id, nav };
        }

        const request = appsService
          .getAppNavigationByAppId(id)
          .then((nav) => nav ?? [])
          .finally(() => {
            appNavRequestCache.delete(id);
          });

        appNavRequestCache.set(id, request);
        const nav = await request;
        return { id, nav: nav ?? [] };
      })
    ).then((results) => {
      if (cancelled) return;

      const resolved: Record<number, AppNavigationResponseDto[]> = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          resolved[r.value.id] = r.value.nav;
        }
      });

      setAppNavCache((prev) => ({ ...prev, ...resolved }));
      setLoadingApps((prev) => {
        const next = new Set(prev);
        idsToFetch.forEach((id) => next.delete(id));
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  // Close sidebar on Escape
  React.useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNavClick = (path: string | null | undefined) => {
    if (path) {
      router.push(path);
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/login");
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
      onClose();
    }
  };

  const renderPageItem = (
    item: AppNavigationResponseDto,
    level: number,
    keyPrefix: string
  ) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(keyPrefix);
    const isActive =
      pathname === item.path ||
      (item.path && pathname?.startsWith(item.path + "/"));

    if (hasChildren) {
      return (
        <div key={keyPrefix}>
          <button
            onClick={() => toggleExpanded(keyPrefix)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer",
              level === 0
                ? isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                : isActive
                  ? "bg-slate-800/50 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
            )}
            style={{ paddingLeft: `${1 + level * 1}rem` }}
          >
            <span className="font-medium">{item.label}</span>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children!.map((child, ci) =>
                renderPageItem(child, level + 1, `${keyPrefix}-${ci}`)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={keyPrefix}
        onClick={() => handleNavClick(item.path)}
        className={cn(
          "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors cursor-pointer",
          level === 0
            ? isActive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            : isActive
              ? "bg-slate-800/50 text-emerald-400"
              : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
        )}
        style={{ paddingLeft: `${1 + level * 1}rem` }}
      >
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  const renderAppGroup = (item: AppNavigationResponseDto, index: number) => {
    const appId = item.appId!;
    const groupKey = `app-${appId}`;
    const isExpanded = expandedItems.has(groupKey);
    const isLoading = loadingApps.has(appId);
    const appNav = appNavCache[appId] ?? [];

    return (
      <div key={groupKey}>
        {/* Group header - always visible, acts as a collapsible toggle */}
        <button
          onClick={() => toggleExpanded(groupKey)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors cursor-pointer",
            isExpanded
              ? "bg-slate-800/60 text-white"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <span className="font-semibold text-sm tracking-wider">
            {item.label}
          </span>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          ) : (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                !isExpanded && "-rotate-90"
              )}
            />
          )}
        </button>

        {/* App's menu items */}
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {isLoading ? (
              <div className="px-6 py-2 text-xs text-slate-500">Loading...</div>
            ) : appNav.length > 0 ? (
              appNav.map((child, ci) =>
                renderPageItem(child, 1, `${groupKey}-${ci}`)
              )
            ) : (
              <div className="px-6 py-2 text-xs text-slate-500">
                No menu items
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNavItem = (item: AppNavigationResponseDto, index: number) => {
    if (item.type === "app" && item.appId) {
      return renderAppGroup(item, index);
    }
    return renderPageItem(item, 0, `page-${index}`);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 z-70 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items - Scrollable */}
        <nav className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.length > 0 ? (
              navigation.map((item, i) => renderNavItem(item, i))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                <p>No menu items available</p>
              </div>
            )}
          </div>

          {/* Default Menu Items at Bottom - Fixed */}
          <div className="border-t border-slate-800 p-4 space-y-2 flex-shrink-0 bg-slate-900">
            <button
              onClick={() => handleNavClick("/app-hub")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors cursor-pointer",
                pathname === "/lab/app-hub" ||
                  pathname?.startsWith("/lab/app-hub/")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <Grid3x3 className="h-5 w-5" />
              <span className="font-medium">AppHub</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
