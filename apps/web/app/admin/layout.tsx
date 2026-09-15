"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Users,
  UserCircle,
  MapPin,
  FileText,
  Layout,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Newspaper,
  Monitor,
  Grid3x3,
  Headphones,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const navItems = [
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Profiles",
    href: "/admin/profiles",
    icon: UserCircle,
  },
  {
    title: "Markets",
    href: "/admin/markets",
    icon: MapPin,
  },
  {
    title: "OS",
    href: "/admin/os",
    icon: Monitor,
  },
  {
    title: "Apps",
    href: "/admin/apps",
    icon: Grid3x3,
  },
  {
    title: "SmartHandoff",
    href: "/admin/biz-os/queue",
    icon: Headphones,
    badge: "#FunCREW",
  },
];

const cmsSubItems = [
  {
    title: "Dashboard",
    href: "/admin/cms",
    icon: Layout,
  },
  {
    title: "Pages",
    href: "/admin/cms/pages",
    icon: FileText,
  },
  {
    title: "Posts",
    href: "/admin/cms/posts",
    icon: Newspaper,
  },
];

function navClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isCmsActive = pathname?.startsWith("/admin/cms");
  const [isCmsExpanded, setIsCmsExpanded] = useState(isCmsActive);

  useEffect(() => {
    if (isCmsActive && !isCmsExpanded) {
      setIsCmsExpanded(true);
    }
  }, [isCmsActive, isCmsExpanded]);

  return (
    <div className="min-h-[calc(100dvh-var(--impersonation-banner-h,0px)-var(--news-header-h,4rem))] bg-background">
      <aside className="fixed left-0 top-[var(--impersonation-banner-h,0px)] z-50 flex h-[calc(100dvh-var(--impersonation-banner-h,0px))] w-[var(--admin-sidebar-w,16rem)] flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Management
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-sidebar-foreground">
            Admin
          </h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link key={item.href} href={item.href} className={navClass(isActive)}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate">{item.title}</span>
                  {"badge" in item && item.badge ? (
                    <span
                      className={cn(
                        "block text-[10px] font-semibold tracking-wide",
                        isActive ? "text-emerald-300" : "text-emerald-700/80",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCmsExpanded(!isCmsExpanded)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isCmsActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span>CMS</span>
              </span>
              {isCmsExpanded ? (
                <ChevronDown className="h-4 w-4 opacity-70" />
              ) : (
                <ChevronRight className="h-4 w-4 opacity-70" />
              )}
            </button>

            {isCmsExpanded ? (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
                {cmsSubItems.map((item) => {
                  const Icon = item.icon;
                  const isDashboard = item.href === "/admin/cms";
                  const isActive = isDashboard
                    ? pathname === "/admin/cms" || pathname === "/admin/cms/"
                    : pathname === item.href || pathname?.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className={navClass(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </aside>

      <main className="ml-[var(--admin-sidebar-w,16rem)] min-w-0">{children}</main>
    </div>
  );
}
