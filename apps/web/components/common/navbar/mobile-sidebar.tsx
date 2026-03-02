"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { X, ChevronRight, Grid3x3, LogOut } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { AppNavigationResponseDto } from "@/lib/services/apps";
import { authService } from "@/lib/services/auth";
import { cn } from "@workspace/ui/lib/utils";

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

  // Close sidebar when clicking outside
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

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
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
      // Still redirect to login even if logout fails
      router.push("/login");
      onClose();
    }
  };

  const renderNavItem = (item: AppNavigationResponseDto, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isActive =
      pathname === item.path ||
      (item.path && pathname?.startsWith(item.path + "/"));

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
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
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.label}
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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
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
              navigation.map((item) => renderNavItem(item))
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
                pathname === "/lab/app-hub" || pathname?.startsWith("/lab/app-hub/")
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
